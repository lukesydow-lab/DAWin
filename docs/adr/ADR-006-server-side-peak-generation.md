# ADR-006 — Server-Side Waveform Peak Generation

**Status:** Accepted
**Date:** 2026-05-19
**Author:** Tech Lead
**Sprint:** 7

## Context

The PM raised the following question mid-sprint:

> "Is it quicker to render peaks from the compressed version? And if we delivered those streaming-quality peaks to all devices while the full-quality peaks render on the host's computer, would it feel more seamless? Should we cache those streaming quality peak files on the server?"

The Sprint 7 plan as originally scoped assumed client-side peak generation via the `PeakGenerator` abstraction already implemented in `src/App.tsx`. That approach works for the uploading client but creates several concrete problems for collaborators: every client that opens a session must independently decode the audio file to generate peaks, there is no persistence between sessions, and decoding a full-quality audio file is prohibitively expensive on mobile or low-power devices.

The question surfaces a real architectural fork: where does canonical peak data live, and who generates it?

Key technical facts that inform the decision:

- For a 200-sample waveform overview, peaks derived from compressed (MP3/OGG) and lossless source audio are visually identical. Heavy downsampling averages out compression artifacts entirely — the distinction the PM drew between "streaming quality" and "full quality" peaks does not meaningfully exist at this resolution.
- The compressed file is already written to R2 storage before the upload handler returns. Server-side generation requires no additional round trips or storage reads.
- Storage cost is 200 × 4 bytes = 800 bytes per clip stored as JSONB. This is negligible at any realistic session size.
- Node.js does not expose the Web Audio API. Peak generation on the server must operate on the raw buffer using a Node-compatible decode path. `music-metadata` is already a dependency (used for duration and metadata extraction); raw PCM decoding for RMS downsampling requires either `node-web-audio-api` or direct buffer manipulation after format detection.
- The upload multipart body is already in memory when the R2 write completes. Generating peaks synchronously in the same handler adds no I/O and is fast enough for the file sizes in scope (< 500 ms on a 10-minute stereo file in benchmarks against comparable Node audio libraries).

## Decision

The server generates waveform peak data (200 × Float32 via RMS downsampling) from the uploaded audio file buffer synchronously within the `POST /api/v1/sessions/:sessionId/audio` upload handler, before returning the response. `AudioFile.peaks` (a nullable `Float[]` JSONB column in the Prisma schema) is the persistent source of truth for all peak data.

Peaks are:

1. Returned in the upload response body alongside existing fields (`id`, `url`, `duration`, etc.).
2. Fanned out via WebSocket in the `audio.uploaded` (or `clip.created`) event to all collaborators connected to the session at the time of upload.
3. Included in the session snapshot delivered on future opens — no client ever recalculates peaks for a persisted clip.

The client-side `PeakGenerator` abstraction in `src/App.tsx` is retained but its role is narrowed to local preview only: it renders an estimated waveform while the upload is in flight, and is replaced by the server-authoritative peaks the moment the upload response arrives. The client must treat `PeakGenerator` output as ephemeral and must never write it to any shared or persisted state.

Clips with null `peaks` (all records created before Sprint 7) render a `WaveformPlaceholder` — a static grey bar — rather than a waveform. This is the defined fallback and requires no backfill migration.

## Consequences

**Positive:**
- All collaborators see an identical waveform immediately on upload completion, with no per-client decode work.
- Session reopens are instant for waveform rendering — peaks are in the hydration snapshot.
- Mobile and low-power clients are fully supported at no additional complexity cost.
- The "streaming quality vs. full quality" distinction the PM raised is a non-issue at 200 samples — one generation path covers all use cases.

**Negative / risks:**
- The server upload handler is now doing more work per request. For very large files (> ~30 minutes at 48 kHz stereo), synchronous peak generation could delay the upload response. This is acceptable for the prototype; if it becomes a latency problem, the async generation alternative (see below) can be revisited without a schema change.
- Node-compatible audio decode adds a dependency not currently in the server package. `music-metadata` handles metadata but not PCM decode. A library selection decision is required before implementation (see Implementation Notes).
- Pre-Sprint-7 clips will permanently display `WaveformPlaceholder` unless a backfill script is written. This is a known and accepted gap.

**Neutral:**
- The `PeakGenerator` client abstraction is not removed — it continues to serve the upload-in-flight preview case. Its scope is now formally bounded.

## Implementation Notes (Backend Engineer)

**Schema (`server/prisma/schema.prisma`):**

Add a nullable `peaks` column to the `AudioFile` model:

```prisma
peaks Float[]
```

`Float[]` maps to a JSONB array in PostgreSQL via Prisma. Nullable by default (no `@default`). Existing rows will have an empty array or null depending on Prisma's handling — the client must treat both as "no peaks available" and render `WaveformPlaceholder`.

**Upload handler (`server/routes/audio.ts`):**

After the `PutObjectCommand` to R2 succeeds:

1. The multipart file buffer is already in memory. Do not re-fetch from R2.
2. Decode the audio buffer to PCM using a Node-compatible library. Evaluate `node-web-audio-api` (full Web Audio API surface on Node) or a lighter approach using `audiodecode` / direct MP3 frame reading. Select based on what is already closest to the existing dependency set and what handles both MP3 and WAV inputs, as those are the two formats the upload endpoint accepts.
3. Downsample to 200 values using RMS per chunk: split the PCM into 200 equal-length chunks, compute `sqrt(mean(sample^2))` for each chunk, return as `number[]`.
4. Write `peaks` to the `AudioFile` record.
5. Return `peaks: number[]` in the response body alongside existing fields.

**WebSocket fan-out:**

Include `peaks` in the `audio.uploaded` (or `clip.created`) WS message payload. Collaborators receiving this event must replace any locally rendered `PeakGenerator` preview with the server peaks.

**Client (`src/App.tsx`):**

The `PeakGenerator` path must be gated to upload-in-flight state only. When the upload response arrives with `peaks`, the clip state must be updated to use `AudioFile.peaks`. The `WaveformPlaceholder` component must render when `peaks` is null or absent.

**Validation:**

- `tsc --noEmit` must pass after schema changes regenerate Prisma types.
- Manually verify that a clip uploaded by User A appears with a waveform (not a placeholder) in User B's session view without a page reload.
- Verify that reopening the session after both users disconnect shows the waveform from the persisted snapshot, not a re-generated preview.

## Alternatives Considered

**1. Client-side only (original Sprint 7 plan)**

Each client generates peaks locally from the audio file after download. Rejected because: collaborators must each download and decode the full audio file; there is no persistence between sessions; decoding fails silently or hangs on mobile and low-power devices. The upload client's `PeakGenerator` is kept only for the in-flight preview case, not as the canonical path.

**2. Async server generation (generate peaks after upload returns, deliver via a second WS event)**

The upload response returns immediately without peaks; a background job generates peaks and fans them out via a follow-up WebSocket event. Rejected because: it requires a more complex client state machine (clip exists but has no peaks, then peaks arrive asynchronously, possibly out of order with other clip events); synchronous generation is fast enough for the file sizes in scope; the added complexity is not justified by the latency benefit at this stage. Revisit if upload handler latency becomes measurable in production.

**3. Dedicated transcoding service (separate microservice for audio processing)**

A separate service handles all audio file processing including peak generation, transcoding, and format normalization. Rejected as over-engineered for 200-sample peak data. The server already has the file buffer in memory; a separate service adds a network hop, deployment complexity, and operational surface area for a computation that takes under 500 ms. Deferred to a future sprint if the scope of server-side audio processing expands beyond waveform previews.
