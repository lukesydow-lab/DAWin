---
Status: Current
Handoff from: Backend Engineer
For: Frontend Engineer + Tech Lead
Sprint: 7 (defect fixes)
Commit: 24792cecfa3e31462792fe9f007a7f38d27c8ade
Date: 2026-05-19
---

# Sprint 7 Defect Fix — Backend (SPRINT-7-001, SPRINT-7-002)

## What was fixed

### SPRINT-7-001 — Null crash on pre-Sprint-7 AudioFile rows

`mapAudioFileRow` in `server/storage/prisma-adapter.ts` now uses `peaks ?? []`
to guard against NULL coming from Postgres on rows created before the
`20260520011302_add_audio_file_peaks` migration ran. This prevents
`broadcastAudioUploaded` from throwing on `payload.peaks.length`.

A new migration `20260520_fix_audio_file_peaks_default` was added with two SQL
statements:
1. `UPDATE "AudioFile" SET "peaks" = '{}' WHERE "peaks" IS NULL;` — backfills existing rows
2. `ALTER TABLE "AudioFile" ALTER COLUMN "peaks" SET DEFAULT '{}';` — prevents future NULL inserts

### SPRINT-7-002 — Session reopen does not restore waveforms

`ClipRow` in `server/storage/adapter.ts` now carries two new fields:

```ts
export interface ClipRow {
  // ... existing fields unchanged ...
  /** ID of the AudioFile row this clip references. null if no audio is attached. */
  audioFileId: string | null;
  /** 200-value RMS waveform peaks from the attached AudioFile. Empty array if no audio or peaks unavailable. */
  peaks: number[];
}
```

`getClips`, `createClip`, and `updateClip` in `server/storage/prisma-adapter.ts`
now include the AudioFile relation (`select: { id, peaks }`) and
`mapClipRow` populates `audioFileId` and `peaks` from the joined row.

`InMemoryStorageAdapter` (`server/storage/memory-adapter.ts`) returns
`audioFileId: null, peaks: []` for all clips — the in-memory store has no
AudioFile records, so this is the correct safe default.

No changes were made to `server/ws/handler.ts`. The `session.snapshot` handler
reads clips from `fastify.storage.getClips(sessionId)` and passes the result
directly into the payload — the extended `ClipRow` fields flow through
automatically.

## What the Frontend Engineer reads from the snapshot

The `session.snapshot` WS message now includes `clips` where each entry has:

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Clip ID |
| `trackId` | `string` | |
| `sessionId` | `string` | |
| `startBar` | `number` | |
| `durationBars` | `number` | |
| `assetId` | `string \| null` | FK to AudioFile (unchanged) |
| `color` | `string` | hex |
| `audioFileId` | `string \| null` | New. Same value as `assetId` when audio is attached. Use this to correlate with `audio.uploaded` events. |
| `peaks` | `number[]` | New. 200-value RMS array. Empty `[]` = no waveform data; render WaveformPlaceholder. |

### Recommended client-side wiring

On `session.snapshot`, for each clip where `peaks.length > 0`, replace any
locally-generated PeakGenerator preview with the canonical peaks array from the
server. Clips with `peaks.length === 0` continue to render `WaveformPlaceholder`.

`audioFileId` is the same value as `assetId`. It exists as a named field so the
frontend can correlate snapshot clip data with `audio.uploaded` WS events without
re-parsing `assetId`.

## Files changed

- `server/storage/adapter.ts` — `ClipRow` extended with `audioFileId` and `peaks`
- `server/storage/prisma-adapter.ts` — null guard on `peaks` in `mapAudioFileRow`; AudioFile join in `mapClipRow`, `getClips`, `createClip`, `updateClip`
- `server/storage/memory-adapter.ts` — `createClip` passes through `audioFileId`/`peaks` with safe defaults
- `server/prisma/migrations/20260520_fix_audio_file_peaks_default/migration.sql` — backfill + DEFAULT for AudioFile.peaks

`tsc --noEmit` passed with zero errors before commit.
