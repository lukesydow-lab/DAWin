# ADR-007 — Real Audio Buffer Playback

**Status:** Accepted
**Date:** 2026-05-20
**Author:** Tech Lead
**Sprint:** 8

## Context

Prior to Sprint 8, all audio playback in DAWin is procedural: `assetUrl` keys map to synthesized `AudioBuffer` objects generated in `synthKick`, `synthSnare`, etc. Clips imported from disk receive an `audioFileId` (the server `AudioFile.id`) after upload, but playback still falls through to the procedural synthesizer using the local `assetUrl` key.

Sprint 8 adds a presigned R2 streaming URL endpoint (`GET /api/v1/audio/:audioFileId/stream-url`, implemented in Sprint 6) that returns a 1-hour presigned URL for the uploaded file. The goal is to wire that endpoint into the transport play path so clips with `audioFileId` play back the real recorded audio.

Key facts that constrain the design:

- `AudioBufferSourceNode` is single-use: `.start()` may only be called once per node instance. A new node must be created every time transport play begins.
- `decodeAudioData` is expensive (CPU, memory) and must not be repeated for the same file within a session.
- Presigned URLs expire after 3600 seconds (confirmed from `STREAM_URL_TTL_SECONDS` in `server/routes/audio.ts`). A client that leaves the session open for over an hour will hold a stale URL.
- The existing Effect A in `App.tsx` (lines ~5012–5063) iterates `tracks`, resolves a buffer synchronously via `resolveBuffer()`, and starts all sources in one pass. Async buffer loading (fetch + decode) cannot be dropped into that synchronous loop without refactoring Effect A.
- Multiple React renders or track iterations could request the same `audioFileId` simultaneously before the first decode completes; this must be guarded.
- Procedural synthesis tracks (`assetUrl !== null`, `audioFileId` absent or null) must continue to work without any change.

## Decision

### 1. `AudioBufferSourceNode` lifecycle: create-per-play

Create a new `AudioBufferSourceNode` every time transport starts (or `setPlaying(true)` is called), wire it into the plugin chain, call `.start(when, offset)`, and discard it on stop. This matches the existing pattern in Effect A for procedural sources and requires no structural change to the node lifecycle model.

On stop, `stopAllSources()` calls `.stop()` on every active source and disconnects all nodes. Real-buffer sources are stored in `_activeSources` (keyed by `trackId`) alongside their `gain`, `analyser`, and `panner` nodes — the same map used for procedural sources. No separate tracking structure is needed.

### 2. In-memory `AudioBuffer` cache: `_realBufferCache`

Introduce a module-scope cache at the same level as `_bufferCache` (which caches procedural buffers keyed by `assetUrl`):

```ts
// Real decoded buffers: audioFileId → AudioBuffer
// Eviction policy: none — retained for the page lifetime (prototype acceptable).
const _realBufferCache = new Map<string, AudioBuffer>()
```

Key: `audioFileId` (the server `AudioFile.id` UUID string).
Eviction policy: none for the prototype. Buffers are retained until page reload. A session with 50 × 3-minute stereo 44.1 kHz WAV files would consume roughly 1 GB of RAM — in practice sessions at this stage will have far fewer clips, and this bound can be revisited in Sprint 9+ when we know real usage patterns.

### 3. Presigned URL TTL handling: fetch-time cache with 55-minute expiry check

Introduce a second module-scope map alongside `_realBufferCache`:

```ts
interface CachedPresignedUrl {
  url: string
  fetchedAt: number  // Date.now() at time of fetch
}
// Presigned URL cache: audioFileId → CachedPresignedUrl
const _presignedUrlCache = new Map<string, CachedPresignedUrl>()

const PRESIGNED_URL_TTL_MS = 55 * 60 * 1000  // 55 minutes (conservative; server TTL is 60)
```

Check the cache before each play attempt, not on a timer. If the cached entry is absent or `Date.now() - fetchedAt > PRESIGNED_URL_TTL_MS`, re-fetch from `GET /api/v1/audio/:audioFileId/stream-url`. If the `AudioBuffer` is already in `_realBufferCache`, only the URL re-fetch is needed (no re-decode). The TTL check happens in `resolveRealBuffer()` (see Implementation Notes).

Timer-based expiry was considered but rejected: it would require cleanup logic tied to component unmount and adds complexity with no user-visible benefit over a per-play check.

### 4. Concurrent-fetch guard: in-flight `Promise` map

If two components or two Effect A executions request the same `audioFileId` before the first decode completes, both would independently fetch and decode the same file. Guard with a module-scope in-flight map:

```ts
const _bufferDecodeInFlight = new Map<string, Promise<AudioBuffer | null>>()
```

`resolveRealBuffer()` checks this map before starting a fetch. If an in-flight promise exists, it awaits it rather than starting a second fetch. On resolution the promise is removed from the map; the decoded buffer is written to `_realBufferCache`.

### 5. Async playback via Effect A extension: `startRealBufferSources()`

Effect A cannot await async calls inline because it fires synchronously on `playing` becoming `true`. The solution is:

- Effect A starts procedural sources synchronously (existing code, unchanged).
- For each track with a clip that has `audioFileId`, Effect A calls `startRealBufferSources(tracks, ctx, playheadBar, bpm)` — an async function that resolves all real buffers, creates sources, and starts them. It is fire-and-forget from Effect A's perspective (`void startRealBufferSources(...)`).
- `startRealBufferSources` sets `audioLoading: true` on a clip before fetching and `audioLoading: false` on completion or error (via `setTracks` / `updateClip`).
- If transport has already stopped by the time a buffer resolves (detected by checking `_activeSources` has been cleared), `startRealBufferSources` discards the buffer and does not call `.start()`.

This design avoids any structural change to Effect A and avoids converting it to async.

### 6. Coexistence with procedural synthesis

The routing decision at play time: check `clip.audioFileId` first.

```
if (clip.audioFileId) → real buffer path (async via startRealBufferSources)
else if (clip.assetUrl) → procedural path (existing synchronous resolveBuffer)
```

No changes to any procedural synthesis functions. Tracks without `audioFileId` are unaffected.

A track can have exactly one active source at a time (keyed by `trackId` in `_activeSources`). If a track has both `audioFileId` on its first clip and `assetUrl` on another, the `audioFileId` clip takes priority. In practice this edge case does not occur in the current data model (one clip per track drives playback), but the routing precedence is declared here to avoid ambiguity.

### 7. Loading state: `audioLoading` field on `ClipData`

Add `audioLoading?: boolean` to the `ClipData` interface. Set to `true` when async fetch begins for a clip's buffer, `false` when the buffer is ready or an error occurs. The existing `ClipProgressOverlay` component (Sprint 7) accepts `status: 'uploading' | 'decoding'` — reuse it with a `'decoding'` status while `audioLoading` is true.

### 8. Seek / playhead offset: `source.start(when, offset)`

`AudioBufferSourceNode.start(when, offset, duration)` accepts a sample-accurate start offset in seconds. When transport play begins at a non-zero playhead position, pass the playhead offset into the buffer so playback starts at the correct musical position.

```ts
const secondsPerBar = (60 / bpm) * 4  // 4 beats per bar
const offsetSec = playheadBar * secondsPerBar
// Clamp offset to buffer duration to avoid errors on short clips
const safeOffset = offsetSec % audioBuffer.duration
source.start(ctx.currentTime, safeOffset)
```

If the clip starts at `clip.bar` rather than bar 0 (i.e., the clip is not at the session start), the offset must account for the clip's position:

```ts
const clipStartSec = clip.bar * secondsPerBar
const offsetIntoClip = Math.max(0, playheadSec - clipStartSec)
const safeOffset = offsetIntoClip % audioBuffer.duration
```

If the playhead is before the clip's start bar, the clip is not yet active — do not start a source for it at all. This is consistent with the existing procedural behavior (all procedural clips loop from position 0 regardless of bar; real clips must be bar-accurate because they are finite, non-looping files).

### 9. Fetch and decode error handling: non-fatal, sets `failed-decode`

If `fetch()` for the presigned URL fails, or `decodeAudioData` throws, or the presigned URL re-fetch fails:

- Call `updateClip(trackId, clipId, { importStatus: 'failed-decode', audioLoading: false })`.
- Log the error to `console.error` with `[resolveRealBuffer]` prefix.
- Do not rethrow. `startRealBufferSources` continues iterating other tracks.
- Transport continues playing. Other tracks are unaffected.

This matches the existing behaviour for `failed-decode` from the upload flow.

## Consequences

**Positive:**
- Real audio plays back from R2 without touching the procedural synthesis path.
- `AudioBuffer` cache eliminates redundant decode on replay — the expensive operation happens once per file per page load.
- Presigned URL TTL is handled transparently; long-running sessions automatically re-fetch expired URLs.
- Error handling is additive: failures produce the already-rendered `failed-decode` tint without crashing transport.

**Negative / risks:**
- Fire-and-forget async start means there is a short window (typically 200–500 ms on fast connections) where transport is playing but real-buffer clips are silent. The loading indicator covers this visually.
- If a user hits play, immediately hits stop, then plays again, two `startRealBufferSources` invocations may be in-flight simultaneously. The stopped-transport guard (`_activeSources` cleared check) prevents stale resolves from starting sources, but both will race to write to `_realBufferCache`. This is safe because both produce the same `AudioBuffer` — last write wins and the result is identical.
- No looping for real audio clips in this sprint. `source.loop = false` is correct for finite imported clips; loop-region playback (transport loop) will be addressed in Sprint 9.
- Memory: `_realBufferCache` holds all decoded buffers for the page lifetime. This is acceptable for the prototype but must be revisited before production.

## Implementation Notes (Frontend Engineer)

Read this section in full before writing any code.

### New fields and variables to add

**`ClipData` interface** (`src/App.tsx`, alongside existing fields at line ~76):
```ts
audioLoading?: boolean  // true while real buffer is being fetched/decoded
```

**Module-scope variables** (add near `_bufferCache` at line ~334):
```ts
// Real decoded AudioBuffer cache: audioFileId → AudioBuffer
const _realBufferCache = new Map<string, AudioBuffer>()

// In-flight decode promises: audioFileId → Promise (guards concurrent fetches)
const _bufferDecodeInFlight = new Map<string, Promise<AudioBuffer | null>>()

// Presigned URL cache: audioFileId → { url, fetchedAt }
interface CachedPresignedUrl { url: string; fetchedAt: number }
const _presignedUrlCache = new Map<string, CachedPresignedUrl>()

const PRESIGNED_URL_TTL_MS = 55 * 60 * 1000
```

### New function: `resolveRealBuffer`

Add this function near `resolveBuffer` (around line ~558). It is the async counterpart to the synchronous `resolveBuffer`.

```ts
async function resolveRealBuffer(audioFileId: string): Promise<AudioBuffer | null> {
  // 1. Return cached buffer immediately if available
  const cached = _realBufferCache.get(audioFileId)
  if (cached) return cached

  // 2. Join existing in-flight decode if one is running for this fileId
  const inFlight = _bufferDecodeInFlight.get(audioFileId)
  if (inFlight) return inFlight

  // 3. Build the promise and register it before any await
  const promise = (async (): Promise<AudioBuffer | null> => {
    try {
      // 3a. Fetch or reuse presigned URL
      let presigned = _presignedUrlCache.get(audioFileId)
      if (!presigned || Date.now() - presigned.fetchedAt > PRESIGNED_URL_TTL_MS) {
        const resp = await fetch(`/api/v1/audio/${audioFileId}/stream-url`, {
          headers: { Authorization: `Bearer ${getJwt()}` },
        })
        if (!resp.ok) throw new Error(`stream-url fetch failed: ${resp.status}`)
        const { url } = (await resp.json()) as { url: string }
        presigned = { url, fetchedAt: Date.now() }
        _presignedUrlCache.set(audioFileId, presigned)
      }

      // 3b. Fetch audio bytes
      const audioResp = await fetch(presigned.url)
      if (!audioResp.ok) throw new Error(`audio fetch failed: ${audioResp.status}`)
      const arrayBuffer = await audioResp.arrayBuffer()

      // 3c. Decode
      const ctx = getAudioCtx()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      _realBufferCache.set(audioFileId, audioBuffer)
      return audioBuffer
    } catch (err) {
      console.error('[resolveRealBuffer]', audioFileId, err)
      return null
    } finally {
      _bufferDecodeInFlight.delete(audioFileId)
    }
  })()

  _bufferDecodeInFlight.set(audioFileId, promise)
  return promise
}
```

`getJwt()` should return the current JWT string. Use the same mechanism already in place for other authenticated fetches in `App.tsx` (check how auth fetch calls are made elsewhere in the file and match that pattern exactly — do not introduce a new auth abstraction).

### New function: `startRealBufferSources`

Add this function near `stopAllSources` (around line ~776). It is called fire-and-forget from Effect A.

```ts
async function startRealBufferSources(
  tracks: Track[],
  ctx: AudioContext,
  playheadBar: number,
  bpm: number,
  updateClip: (trackId: string, clipId: string, patch: Partial<ClipData>) => void,
  pluginChains: Record<string, PluginSlot[]>,
) {
  const secondsPerBar = (60 / bpm) * 4

  for (const track of tracks) {
    const clip = track.clips.find(c => c.audioFileId)
    if (!clip || !clip.audioFileId) continue

    // Mark loading
    updateClip(track.id, clip.id, { audioLoading: true })

    const audioBuffer = await resolveRealBuffer(clip.audioFileId)

    // Transport may have stopped while we were awaiting — check before starting
    if (!_activeSources.has(track.id) && audioBuffer) {
      // Transport stopped — discard; do not start
      updateClip(track.id, clip.id, { audioLoading: false })
      continue
    }

    if (!audioBuffer) {
      updateClip(track.id, clip.id, { audioLoading: false, importStatus: 'failed-decode' })
      continue
    }

    // Compute bar-accurate offset into the buffer
    const clipStartSec = clip.bar * secondsPerBar
    const playheadSec  = playheadBar * secondsPerBar
    const offsetIntoClip = Math.max(0, playheadSec - clipStartSec)

    // If playhead is past the end of the clip, skip it
    if (offsetIntoClip >= audioBuffer.duration) {
      updateClip(track.id, clip.id, { audioLoading: false })
      continue
    }

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.loop = false  // real clips are finite; loop-region playback is Sprint 9

    const gain = ctx.createGain()
    gain.gain.value = track.volume / 100

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0

    const panner = ctx.createStereoPanner()
    panner.pan.value = track.pan / 100

    // Insert into plugin chain: source → [plugins] → gain
    const trackPlugins = pluginChains[track.id] ?? []
    rewirePluginChain(ctx, track.id, trackPlugins, source, gain)

    gain.connect(analyser)
    analyser.connect(panner)
    if (_masterGain) {
      panner.connect(_masterGain)
    } else {
      panner.connect(ctx.destination)
    }

    source.start(ctx.currentTime, offsetIntoClip)

    // Overwrite any placeholder set by Effect A (procedural path skips tracks with audioFileId)
    _activeSources.set(track.id, { source, gain, analyser, panner })

    updateClip(track.id, clip.id, { audioLoading: false })
  }
}
```

### Changes to Effect A (lines ~5012–5063)

Effect A iterates tracks and starts procedural sources. Modify the `track.clips.find` filter so it only picks up clips without `audioFileId` for the procedural path, then call `startRealBufferSources` for the rest.

The key change to the existing filter at line ~5024:

```ts
// BEFORE:
const clip = track.clips.find(c => c.assetUrl !== null)

// AFTER:
// Real-buffer clips are handled async by startRealBufferSources below.
// Only start procedural sources here.
const clip = track.clips.find(c => c.assetUrl !== null && !c.audioFileId)
```

After the `tracks.forEach` loop (before the cleanup return), add:

```ts
// Start real-buffer sources asynchronously — fire and forget.
// startRealBufferSources guards against transport-stopped race internally.
void startRealBufferSources(tracks, ctx, playheadBar, bpm, updateClipForPlayback, pluginChainsRef.current)
```

`updateClipForPlayback` is a stable callback that calls `setTracks` to patch a clip. Pass `playheadBar` from `playheadBarRef.current` (create this ref if it does not already exist) rather than the state value, because `playheadBar` state is stale inside the effect closure.

**Do not add `tracks` or `playheadBar` to Effect A's dependency array.** Effect A intentionally runs only on `playing` changes (see the comment at line ~5009). Violating this would restart sources on every track mutation, causing audible clicks.

### `ClipProgressOverlay` usage for loading state

In the `Clip` component's render, where `ClipProgressOverlay` is already conditionally rendered for `importStatus === 'uploading' | 'decoding'`, add a second condition for `audioLoading`:

```tsx
{clip.audioLoading && (
  <ClipProgressOverlay status="decoding" progress={undefined} />
)}
```

Place this check before the `importStatus` check so it takes precedence during real-buffer load. The `ClipProgressOverlay` component already renders a spinner/shimmer for `'decoding'` status; no new UI component is needed.

### Graph topology (for reference)

The audio graph per track for a real-buffer clip is identical to procedural:

```
AudioBufferSourceNode (real buffer, loop=false)
  → [plugin chain nodes, if any, via rewirePluginChain]
  → GainNode (fader, track.volume/100)
  → AnalyserNode (post-fader VU tap)
  → StereoPannerNode (track.pan/100)
  → _masterGain
  → _masterPanner
  → _masterAnalyser
  → AudioContext.destination
```

`rewirePluginChain` accepts `source: AudioBufferSourceNode` — the type is the same whether the source holds a procedural or real buffer.

### TypeScript checklist before commit

- `ClipData` has `audioLoading?: boolean` — no `any` introduced
- `_realBufferCache`, `_presignedUrlCache`, `_bufferDecodeInFlight` are typed at declaration
- `resolveRealBuffer` return type is `Promise<AudioBuffer | null>` — explicit annotation required
- `startRealBufferSources` parameters are all typed against existing interfaces
- `tsc --noEmit` passes before committing

## Alternatives Considered

**Streaming via `<audio>` element / `MediaElementAudioSourceNode`:** Rejected. `MediaElementAudioSourceNode` does not support sample-accurate offset scheduling (`start(when, offset)`) and cannot be inserted cleanly into the existing plugin chain topology, which requires an `AudioBufferSourceNode` as the chain head (see `rewirePluginChain` signature). Streaming latency is also incompatible with transport-synchronized playback.

**Replacing `_bufferCache` with a unified cache for both procedural and real buffers:** Rejected. Procedural buffers are keyed by synthetic `assetUrl` strings (e.g. `"synth:kick"`); real buffers are keyed by `audioFileId` UUIDs. Merging them into a single map would require either a key-space collision policy or prefixing — added complexity with no benefit. Two maps with clear names are simpler.

**Preloading buffers on session hydration:** Considered but deferred to Sprint 9. Pre-loading on session open would reduce the play-button-to-sound latency (currently one round-trip + decode time). The loading indicator covers the gap adequately for a prototype. Preloading requires knowing which clips have `audioFileId` at hydration time and initiating fetches before the user presses play, which adds complexity to the WS hydration path (ADR-005).

**Loop playback for real clips:** Deferred to Sprint 9. `AudioBufferSourceNode.loop = true` with `loopStart` / `loopEnd` set to the transport loop region boundaries is the correct implementation, but it requires `loopStart` and `loopEnd` state to be passed into `startRealBufferSources` and updated atomically with a running source via `source.loopStart` / `source.loopEnd` property setters. The interaction with per-clip fade envelopes and the transport loop region adds scope that exceeds Sprint 8.
