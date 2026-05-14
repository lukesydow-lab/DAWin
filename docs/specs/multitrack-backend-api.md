# API Spec: Multitrack Backend

> **Issued by:** Backend Engineer  
> **Date:** 2026-05-10  
> **Status:** Draft — revision 1 (Tech Lead feedback applied)  
> **Shared types:** `src/shared/types.ts` (source of truth for all interfaces below)

---

## Overview

This spec covers the full backend contract for the collaborative DAW multitrack engine:
- 24-bit audio recording pipeline (capture → chunked upload → blob storage → playback)
- Per-track and master bus plugin chains (compressor, reverb, delay, maximizer, EQ)
- Real-time collaboration (transport sync, track locking, presence, clip mutations)
- Session persistence (projects, tracks, clips, plugin state, audio assets)

The frontend stubs against these contracts. The server does not exist yet — frontend uses the seed data in `src/App.tsx` until integration begins.

---

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Node.js 22 LTS + TypeScript | Worker thread support needed for DSP sidecar path; Bun not ready |
| HTTP framework | Fastify 5 | Built-in schema validation, `@fastify/websocket` co-location |
| WebSocket | `ws` via `@fastify/websocket` | No Socket.IO — binary audio frames need raw WS |
| Database (prototype) | In-memory Maps behind a `StorageAdapter` interface | Swap to Postgres without touching consumers |
| Blob storage (prototype) | Local disk `/tmp/assets/` behind same interface | Swap to S3/R2 for multi-user testing |
| Auth | `jose` for JWT | Short-lived access tokens (15 min) + HTTP-only refresh cookies |
| DSP | Browser Web Audio API | See ADR `docs/adr/001-dsp-locality.md` |

---

## Audio Pipeline

```
CAPTURE
  getUserMedia({ audio: { deviceId, channelCount: 2, sampleRate: 48000 } })
    ↓
  AudioWorkletProcessor (audio thread — no GC pauses)
    Float32 PCM → Int24 (3 bytes/sample)
    Accumulates → 512 KB chunks → MessagePort → main thread
    ↓
  WebSocket client — binary frame:
    [4B: chunkIndex][4B: trackId hash][N bytes: raw Int24 PCM]
    ↓
STORAGE
  Node.js server — appends chunks to in-flight buffer (Map<trackId, Buffer[]>)
  On record_stop → concatenate → write WAV header → StorageAdapter.write()
  Creates AudioAsset row + Clip row with assetId
  Broadcasts clip.created to session
    ↓
  Object storage (disk → S3-compatible)

PLAYBACK
  GET /api/v1/assets/:id/download → 302 signed URL (or direct stream in prototype)
    ↓
  fetch(url) → ArrayBuffer → decodeAudioData()
    ↓
  AudioBufferSourceNode → GainNode (volume) → StereoPannerNode (pan)
    → plugin chain (Web Audio nodes) → master GainNode → AudioContext.destination
```

**24-bit specifics:** The AudioWorklet converts Float32 samples to Int24 in-place before chunking. The server stores raw Int24 PCM and prepends a standard WAV header (`fmt ` chunk: PCM, 24-bit, 48000 Hz, stereo) on finalize. Playback uses `decodeAudioData` which handles 24-bit WAV natively in all modern browsers.

---

## Plugin Chain — DSP Mapping

Plugin state is persisted server-side and synced via WebSocket. DSP runs in the browser via Web Audio API nodes. Parameter changes fire `plugin.param_change` events (throttled to 60 fps at sender).

| Plugin type | Web Audio node(s) | Key params |
|-------------|-------------------|------------|
| `compressor` | `DynamicsCompressorNode` | threshold, ratio, attack, release, knee |
| `reverb` | `ConvolverNode` + `GainNode` (wet/dry) | wet, size, predelay |
| `delay` | `DelayNode` + `GainNode` (feedback loop) | time (ms), feedback, wet |
| `maximizer` | `WaveShaperNode` + `GainNode` | ceiling (dBFS), gain |
| `eq` | `BiquadFilterNode` ×N | frequency, gain, Q per band |

The master bus (`trackId: null` in `PluginChain`) maps to the MSTR mixer strip.

---

## REST Endpoints — `/api/v1/...`

All endpoints require `Authorization: Bearer <jwt>` except auth and guest-join.  
All responses use `ApiResponse<T>` or `ApiError` envelope from `src/shared/types.ts`.

### Auth
```
POST   /api/v1/auth/register          { name, email, password } → AuthTokenResponse
POST   /api/v1/auth/login             { email, password } → AuthTokenResponse
POST   /api/v1/auth/guest             { displayName } → AuthTokenResponse
POST   /api/v1/auth/refresh           (HTTP-only cookie) → AuthTokenResponse
POST   /api/v1/auth/logout
GET    /api/v1/auth/me                → User
```

`GET /api/v1/auth/me` requires `Authorization: Bearer <jwt>` and returns the `User` record for the identity encoded in the token. This is the canonical initialization call — the frontend must call it on app load to replace the hardcoded `CURRENT_USER` constant. For guest accounts, `User.email` is `null` and `User.isGuest` is `true`. Returns `401` if the token is missing, malformed, or expired.

> **Resolution (Sprint 2):** `GET /api/v1/auth/me` is a confirmed endpoint. Response shape: `{ userId, sessionId, role, color }` decoded from the JWT claims, plus the full `User` record. The frontend calls this on mount to hydrate session identity, replacing the hardcoded `CURRENT_USER` seed constant. For the scaffold stub, the dev route returns a hardcoded dev user with `role: "owner"` and a fixed collaborator color. Guest accounts return `email: null, isGuest: true`.

### Sessions
```
POST   /api/v1/sessions               CreateSessionBody → Session
GET    /api/v1/sessions/:id           → Session (includes collaborators[])
POST   /api/v1/sessions/:id/join      JoinSessionBody → { collaborator, wsTicket }
DELETE /api/v1/sessions/:id           owner only
```

`wsTicket` is a one-time token (30 s TTL) passed as a query param to the WebSocket URL, avoiding JWT exposure in server logs.

### Tracks
```
GET    /api/v1/sessions/:id/tracks                  → Track[]
POST   /api/v1/sessions/:id/tracks                  CreateTrackBody → Track
PATCH  /api/v1/sessions/:id/tracks/:trackId         UpdateTrackBody → Track
DELETE /api/v1/sessions/:id/tracks/:trackId

POST   /api/v1/sessions/:id/tracks/:trackId/arm     → 200 | 409 (already locked)
DELETE /api/v1/sessions/:id/tracks/:trackId/arm     → 200
```

409 on arm means another user holds the lock. Response body is `ApiError` with `code: "TRACK_LOCKED"`.

### Clips
```
GET    /api/v1/sessions/:id/clips                   → Clip[]
POST   /api/v1/sessions/:id/clips                   CreateClipBody → Clip
PATCH  /api/v1/sessions/:id/clips/:clipId           UpdateClipBody → Clip
DELETE /api/v1/sessions/:id/clips/:clipId
POST   /api/v1/sessions/:id/clips/:clipId/split     SplitClipBody → { left: Clip, right: Clip }
POST   /api/v1/sessions/:id/clips/:clipId/bounce    BounceClipBody → { clip: Clip, track: Track }
```

### Plugin Chains
```
GET    /api/v1/sessions/:id/tracks/:trackId/chain            → PluginChain
PUT    /api/v1/sessions/:id/tracks/:trackId/chain            UpdatePluginChainBody → PluginChain
PATCH  /api/v1/sessions/:id/tracks/:trackId/chain/plugins/:pluginId/params
                                                              UpdatePluginParamsBody → Plugin

GET    /api/v1/sessions/:id/master-chain                     → PluginChain
PUT    /api/v1/sessions/:id/master-chain                     UpdatePluginChainBody → PluginChain
```

**PUT chain semantics — full replacement:** `PUT` replaces the entire plugin chain in a single atomic write. Any plugin whose `id` is present in the current persisted chain but absent from `UpdatePluginChainBody.plugins` is permanently deleted. New plugins are identified by the absence of an `id` field — the server assigns and returns a fresh `PluginId` for each. The client must treat the returned `PluginChain` as the new source of truth and discard any locally-held plugin IDs that do not appear in the response. Frontend and backend must implement this identical semantics; partial-update behavior via PUT is explicitly not supported.

> **Resolution (Sprint 2):** `PUT /api/v1/sessions/:id/tracks/:trackId/chain` accepts the full ordered plugin array as the request body (`UpdatePluginChainBody.plugins`). Sending `{ plugins: [] }` clears the chain entirely. There is no separate DELETE endpoint for individual plugins — remove a plugin by omitting it from the array. The server returns the canonical `PluginChain` (with server-assigned IDs for any new plugins) as the response; the client replaces its local chain state with this response.

### Audio Assets
```
POST   /api/v1/assets/upload/init                   AudioUploadInitBody → AudioUploadInitResponse
PUT    /api/v1/assets/upload/:uploadId/chunks/:n    binary Int24 PCM body
POST   /api/v1/assets/upload/:uploadId/complete     → AudioAsset
GET    /api/v1/assets/:assetId                      → AudioAsset (metadata only)
GET    /api/v1/assets/:assetId/download             → 302 signed URL | direct stream
POST   /api/v1/assets/import                        multipart/form-data → AudioAsset
```

**Upload timeout — orphaned session cleanup:** If no new chunk `PUT` is received for an in-flight upload within **5 minutes** of the last activity (or of `upload/init` if no chunks have arrived), the server treats the upload as abandoned. It frees the in-memory chunk buffer, deletes any partial `AudioAsset` record written during init, and rejects any subsequent `PUT` or `POST .../complete` for that `uploadId` with `410 Gone`. This prevents orphaned buffers from accumulating when clients crash or lose connectivity mid-recording. The pre-assigned `assetId` from `AudioUploadInitResponse` is also invalidated — any `Clip` row referencing it must be cleaned up or re-associated after a successful retry. The 5-minute window resets on each successful chunk receipt.

> **Resolution (Sprint 2):** The blob upload endpoint (`POST /api/v1/sessions/:id/tracks/:trackId/audio`, or the equivalent multipart import endpoint) enforces a **30-second** per-request timeout enforced at the HTTP server layer (Fastify `connectionTimeout` / request-level `setTimeout`). If the request body is not fully received within 30 seconds, the server closes the connection and responds with `408 Request Timeout` and body `{ "error": "upload_timeout" }`. This is distinct from the 5-minute orphaned-session cleanup above — the 30-second limit applies per individual HTTP request; the 5-minute window applies to the total inactivity window across all chunk PUTs for a given `uploadId`.

---

## WebSocket

**URL:** `ws://host/ws?sessionId=<id>&ticket=<one-time-ticket>`

Binary audio frames: raw bytes prefixed with magic `0xDAW1` (4 bytes). All other frames: JSON `WsMessage<T>`.

**Security — server stamps `WsMessage.from`:** The server always overwrites the `from` field in every outbound `WsMessage<T>` with the authenticated `userId` derived from the WS ticket. Any `from` value supplied by the client in the incoming JSON frame is silently discarded before the message is processed or fanned out. This prevents a client from impersonating another user's `userId` on the WebSocket channel. The frontend stub must not rely on a client-provided `from` value being echoed back unchanged.

> **Resolution (Sprint 2):** `WsMessage.from` is stamped server-side on receipt. The client-facing outbound message shape is `{ type, sessionId, payload }` — no `from` field. The server reads `userId` from the authenticated WS ticket and appends `from: userId` before broadcasting to all session peers. Any `from` value in an inbound client frame is silently discarded. Frontend stubs must send `{ type, sessionId, payload }` only.

### Event types

#### Transport (server-authoritative)
| Event | Direction | Payload |
|-------|-----------|---------|
| `transport.play` | client → server | `{ playheadBar, bpm }` |
| `transport.pause` | client → server | — |
| `transport.stop` | client → server | — |
| `transport.seek` | client → server | `{ playheadBar }` |
| `transport.bpm_change` | client → server | `{ bpm }` |
| `transport.record_start` | client → server | `{ trackId }` |
| `transport.record_stop` | client → server | `{ trackId }` |
| `transport.state_sync` | server → all | `TransportState` |

Client drift correction: `currentBar = playheadBar + ((now - syncedAt) / 1000) * (bpm / 60 / 4)` when `playing === true`.

#### Track mutations
| Event | Direction | Payload |
|-------|-----------|---------|
| `track.created` | server → all | `{ track: Track }` |
| `track.updated` | server → all | `{ trackId, changes: Partial<Track> }` |
| `track.deleted` | server → all | `{ trackId }` |
| `track.locked` | server → all | `{ trackId, lockedBy: UserId }` |
| `track.unlocked` | server → all | `{ trackId }` |

Lock cleanup: server releases all locks held by a userId on WS disconnect. Test this from day one.

#### Clip mutations
| Event | Direction | Payload |
|-------|-----------|---------|
| `clip.created` | server → all | `{ clip: Clip }` |
| `clip.updated` | server → all | `{ clipId, changes: Partial<Clip> }` |
| `clip.deleted` | server → all | `{ clipId, trackId }` |
| `clip.split` | server → all | `{ originalClipId, leftClip, rightClip }` |

Conflict model: last-write-wins per `(clipId, userId)` seq ordering. Sufficient for prototype.

#### Plugins
| Event | Direction | Payload |
|-------|-----------|---------|
| `plugin.param_change` | client → server → all others | `{ pluginId, chainId, paramKey, value }` |
| `plugin.chain_updated` | server → all | `{ chain: PluginChain }` |

Throttle `plugin.param_change` at sender: max 1 per 16 ms per `(pluginId, paramKey)`. Server deduplicates within 16 ms window before fan-out.

#### Presence
| Event | Direction | Payload |
|-------|-----------|---------|
| `presence.update` | client → server → all others | `CollaboratorPresence` |
| `presence.joined` | server → all | `{ collaborator, presence }` |
| `presence.left` | server → all | `{ userId }` |

Presence throttle: client sends at most every 100 ms. Server does not persist — ephemeral only.

#### System
| Event | Direction | Payload |
|-------|-----------|---------|
| `session.snapshot` | server → joining client | `SessionSnapshotPayload` |
| `session.error` | server → client | `{ code, message }` |
| `audio.chunk_ack` | server → recording client | `{ trackId, chunkIndex }` |
| `audio.chunk_error` | server → recording client | `{ trackId, chunkIndex, reason }` |

`session.snapshot` is sent immediately after WS auth, replacing seed data initialization.

---

## Frontend Stubs Needed

Three hooks to implement against these contracts (stubs use current seed data until server exists):

### `useTransport(sessionId)`
```ts
interface UseTransportReturn {
  transportState: TransportState
  sendPlay(): void
  sendPause(): void
  sendStop(): void
  sendSeek(bar: BarPosition): void
  sendBpmChange(bpm: number): void
}
```
Stub: wraps existing `useState` for `playing`, `bpm`, `playheadBar`.

### `WsContext` (React context + provider)
- Manages WS connection lifecycle
- Dispatches incoming `WsMessage` to appropriate state slices
- Exposes `sendMessage(type: WsEventType, payload: unknown): void`
- Stub version: wraps no-ops + local state mutations

### `useAuth()`
```ts
interface UseAuthReturn {
  user: User
  collaborator: Collaborator
  role: Role
}
```
Stub: returns decoded values from current `CURRENT_USER` constant.

Also needed: add `assetId: AssetId | null` to the local `ClipData` shape in `App.tsx` (non-breaking, set to `null` in all seed clips).

---

## Prototype Audio Stub

This section describes how the frontend stubs against the audio asset contract before the backend exists. The stub requires no server and leaves zero rework when real integration begins.

### Procedural synthesis (no files on disk)

The frontend uses Web Audio API synthesizers instead of static WAV files. No files exist under `public/audio/`. Each seed track is keyed by a `synth://` URL constant defined in `App.tsx`. The `AUDIO_KEY` constants and their instrument roles are:

| `AUDIO_KEY` constant | `assetUrl` value | Instrument role |
|----------------------|-----------------|----------------|
| `AUDIO_KEY.KICK` | `synth://kick` | Kick drum |
| `AUDIO_KEY.SNARE` | `synth://snare` | Snare drum |
| `AUDIO_KEY.HIHAT` | `synth://hihat` | Hi-hat |
| `AUDIO_KEY.BASS` | `synth://bass` | Bass line |
| `AUDIO_KEY.LEAD` | `synth://lead` | Synth lead |
| `AUDIO_KEY.PAD` | `synth://pad` | Pad |
| `AUDIO_KEY.VOX` | `synth://vox` | Vocal |

These `synth://` URL values are opaque keys — they are not fetchable. The audio engine in `App.tsx` branches on the `synth://` scheme to invoke the corresponding Web Audio API synthesizer rather than calling `fetch`. Do not scatter synthesizer-to-key mappings across components — the lookup table lives once at the seed-data layer in `App.tsx`.

### `assetUrl` on `ClipData` (frontend-only field)

`ClipData` in `App.tsx` carries a frontend-only `assetUrl` field that does not exist on the canonical `Clip` interface. This field holds the resolved playback URL for the clip's audio. In the stub it is a local path. In production it is the result of calling `GET /api/v1/assets/:id/download`.

```ts
// In App.tsx seed data — stub only, not part of shared types
interface ClipData extends Clip {
  assetUrl: string | null  // stub: 'synth://kick'; production: signed S3 URL
}
```

Seed clips that have no audio (MIDI clips, empty placeholders) set `assetUrl: null` and `assetId: null`.

### Stub behavior for `GET /api/v1/assets/:id/download`

In the stub, the frontend does not call this endpoint. Instead, when building the audio graph for a clip, it resolves the URL as:

```ts
function resolveAssetUrl(clip: ClipData): string | null {
  // Stub: assetUrl is pre-populated from seed data
  // Production: call GET /api/v1/assets/:id/download → follow 302 → use Location URL
  return clip.assetUrl
}
```

When the real backend lands, replace this function body with a `fetch` to the download endpoint and read the `Location` header from the `302` response. The rest of the audio pipeline is unchanged.

### Web Audio playback pipeline — stub vs. production identity

The playback pipeline is identical for static file URLs and signed S3 URLs:

```
fetch(assetUrl)
  → response.arrayBuffer()
  → AudioContext.decodeAudioData(buffer)
  → AudioBufferSourceNode
  → GainNode (volume) → StereoPannerNode (pan)
  → plugin chain (Web Audio nodes)
  → master GainNode
  → AudioContext.destination
```

`fetch` does not distinguish between `http://localhost:5173/audio/kick.wav` and `https://s3.amazonaws.com/bucket/key?X-Amz-Signature=...`. Both return an `ArrayBuffer`; `decodeAudioData` handles both identically. **The frontend audio stub requires zero rework when the real backend lands**, provided the production download endpoint returns a `302` whose `Location` is a directly-fetchable URL (no additional auth headers required on the S3 GET — this is the standard signed-URL model).

CORS note: S3 signed URLs require the bucket to have a CORS rule allowing `GET` from the app origin. Flag this in the infrastructure checklist before production integration.

### What is stub path vs. production path

| Concern | Stub path | Production path |
|---------|-----------|-----------------|
| `assetUrl` source | Hard-coded in `App.tsx` seed data | Returned by `GET /api/v1/assets/:id/download` (follow 302) |
| File storage | Procedural synthesis (Web Audio API, no files) | S3-compatible object storage behind signed URL |
| `assetId` on `Clip` | `null` for all seed clips | UUID assigned by server at upload init or import |
| Upload pipeline | Not exercised | Full chunked upload or `POST /api/v1/assets/import` |
| Auth on download | None (public dev server) | Signed URL with expiry (default: 1 hour); refresh before expiry |

---

## Key Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Mid-take WS drop loses buffered chunks | High | Client buffers to IndexedDB; replays on reconnect using chunk index |
| Plugin knob sweep fan-out (60 fps × 4 users) | Medium | 16 ms throttle at sender + server dedup window |
| `lockedBy` mutex stuck on ungraceful disconnect | High | Server releases all user locks on WS close — make it a day-one test |
| Transport drift over long sessions | Low | Acceptable for prototype; production needs NTP-style clock offset estimation |
| DSP portability (Web Audio only) | Medium | Wrap all audio graph construction in a `DspEngine` interface from day one |
