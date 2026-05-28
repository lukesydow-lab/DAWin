# Sprint 7 Backend — Server-Side Peak Generation: Handoff

**Agent:** Backend Engineer
**Date:** 2026-05-19
**Commit:** `50479b8`
**Branch:** main
**tsc --noEmit status:** PASS — zero errors

---

## Completion status

All 5 parts complete.

| Part | Description | Status |
|------|-------------|--------|
| 1 | `peaks Float[]` added to `AudioFile` Prisma schema; migration applied | Complete |
| 2 | `generatePeaks()` — 200-value RMS downsampling via `node-web-audio-api` | Complete |
| 3 | Upload response includes `peaks: number[]` | Complete |
| 4 | `peaks` persisted in DB row; all adapter interfaces updated | Complete |
| 5 | `broadcastAudioUploaded()` fans out `audio.uploaded` WS event with peaks | Complete |

---

## Upload response shape

`POST /api/v1/sessions/:sessionId/audio` — 200 OK

```json
{
  "id": "clxxxxxxxxxxxxxxxx",
  "sessionId": "clxxxxxxxxxxxxxxxx",
  "uploaderId": "clxxxxxxxxxxxxxxxx",
  "s3StreamKey": "audio/<sessionId>/<uuid>.mp3",
  "s3FullKey": null,
  "mimeType": "audio/mpeg",
  "durationSec": 42.5,
  "sampleRate": 44100,
  "channels": 2,
  "fileSizeBytes": "4823040",
  "peaks": [0.12, 0.34, 0.08, 0.51, ...]
}
```

Key points:
- `fileSizeBytes` is serialized as a **string** (BigInt — always has been).
- `peaks` is always present: either 200 `number` values in range `[0, 1]`, or an empty array `[]` if generation failed.
- An empty `peaks` array means the client must render `WaveformPlaceholder` — treat `[]` and `null` the same way.
- `peaks` are RMS values, not peak-hold. Range is `[0, 1]`.

---

## WS `audio.uploaded` event shape

Broadcast to all connected clients in the session (including the uploader if they have a WS connection open) immediately after the upload response is sent.

Envelope follows the standard `WsBroadcast<T>` shape:

```json
{
  "type": "audio.uploaded",
  "sessionId": "clxxxxxxxxxxxxxxxx",
  "from": "server",
  "ts": 1716163200000,
  "payload": {
    "audioFileId": "clxxxxxxxxxxxxxxxx",
    "sessionId": "clxxxxxxxxxxxxxxxx",
    "filename": "my-loop.mp3",
    "durationSec": 42.5,
    "peaks": [0.12, 0.34, 0.08, 0.51, ...]
  }
}
```

TypeScript type for the payload: `AudioUploadedPayload` (exported from `server/types.ts`).

`filename` is sourced from the `X-Filename` request header if provided, otherwise falls back to the S3 key basename. The Frontend Engineer should set `X-Filename` on the upload request to get a clean filename in the WS event.

---

## Files changed

- `server/prisma/schema.prisma` — `peaks Float[]` on `AudioFile` model
- `server/prisma/migrations/20260520011302_add_audio_file_peaks/migration.sql` — generated migration
- `server/storage/adapter.ts` — `AudioFileRow.peaks: number[]` added
- `server/storage/memory-adapter.ts` — `createAudioFile` stores `peaks`
- `server/storage/prisma-adapter.ts` — `mapAudioFileRow` and `createAudioFile` include `peaks`
- `server/types.ts` — `AudioUploadedPayload` interface added
- `server/routes/audio.ts` — `generatePeaks()` added; peaks generated, persisted, and returned; `broadcastAudioUploaded()` called after DB write
- `server/ws/handler.ts` — `broadcastAudioUploaded()` exported
- `server/package.json` + `server/package-lock.json` — `node-web-audio-api` dependency added

---

## Deviations from work order

**`filename` source:** The work order does not specify how `filename` is populated in the WS payload (the upload endpoint receives a multipart file field, not a named URL param). The implementation reads the `X-Filename` request header as the canonical source for the original filename, with a fallback to the S3 key basename. The Frontend Engineer must send `X-Filename: <original filename>` on the upload request to get the intended filename in the WS fan-out.

**No deviation on peak algorithm, count, or error-tolerance behaviour.** All match the ADR-006 spec exactly.

---

## Frontend Engineer action items

1. **Consume `peaks` from the upload response.** When the `POST /api/v1/sessions/:sessionId/audio` response arrives, read `response.peaks`. If the array has 200 entries, replace the local `PeakGenerator` preview with the server peaks. If empty, render `WaveformPlaceholder`.

2. **Handle `audio.uploaded` WS event.** On receipt, update the clip's peak state with `event.payload.peaks`. This delivers peaks to collaborators who did not initiate the upload.

3. **Send `X-Filename` header on upload.** Add `X-Filename: <file.name>` to the upload request so the WS fan-out carries the correct display filename.

4. **Guard on empty peaks array.** Both `[]` (generation failed) and absence of the field (pre-Sprint-7 rows from the session snapshot) must render `WaveformPlaceholder` — no crash.
