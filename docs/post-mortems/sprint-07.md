# Sprint 7 Post-Mortem — Audio File Import + Clip Creation

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 7
**Dates:** 2026-05-19 – 2026-05-19
**Status:** Closed
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

- User can import an audio file via file picker or OS drag-and-drop onto the arranger timeline
- File uploads to Cloudflare R2 via the Sprint 6 endpoint
- A `Clip` DB row is created linked to the `AudioFile` row (`assetId` populated)
- Waveform peaks generated on the server during upload; `AudioFile.peaks` (JSONB) is the persistent source of truth; client-side `PeakGenerator` provides local preview while upload is in flight
- Clip name derived from filename (without extension); clip color from track owner/collaborator color
- Platform-safe architecture covering browser, desktop, tablet, and mobile fallback states

A significant mid-sprint architecture decision changed the waveform peaks approach (see Decisions Made below).

---

## What shipped

- Audio file drag-and-drop + file picker (`I` key) onto arranger timeline
- `POST /api/v1/sessions/:sessionId/clips` — creates Clip row linked to AudioFile
- Server-side peak generation (200 RMS values) during upload; `AudioFile.peaks` JSONB persisted
- Upload response includes `peaks`; WS `audio.uploaded` event fans out peaks to all collaborators
- Session snapshot includes `audioFileId` and `peaks` per clip — waveforms restore on session reopen without re-decode
- All clip import states: uploading, decoding, complete, failed-upload (danger tint), failed-decode (warn tint)
- `WaveformPlaceholder` for null/empty peaks; `PeakGenerator` client-side preview path
- `ClipData.importStatus` field; live BPM used for clip duration calculation
- **ADR-006:** Server-side peak generation — `docs/adr/ADR-006-server-side-peak-generation.md`
- Multi-file drop shows friendly "Import one audio file at a time for now" message
- Designer spec: `docs/specs/audio-file-import.md`

---

## What had issues

Sprint 7 UAT found 4 defects — all P2/P3. No P0 or P1 defects.

**SPRINT-7-001 (P2, fixed):** Migration adds `peaks` column with no `DEFAULT` — pre-Sprint-7 `AudioFile` rows returned `NULL` peaks. The `ALTER TABLE` statement added the column as `DOUBLE PRECISION[]` without a default. Existing rows yielded `null` from `mapAudioFileRow`. Any runtime call to `.length` on a null peaks value (e.g. in the WS broadcast handler at `server/ws/handler.ts:416`) would throw for pre-Sprint-7 rows. Fix: migration updated with `DEFAULT '{}'`; `prisma-adapter.ts` null-coalescing guard added (`peaks: row.peaks ?? []`).

**SPRINT-7-002 (P2, fixed):** Session snapshot hydration did not populate `audioFileId` or `importPeaks` on clips — waveforms were absent on session reopen. The snapshot hydration mapping did not set these fields; hydrated clips showed `WaveformPlaceholder` regardless of whether the session had real waveform data. Additionally, the `audio.uploaded` WS event could not be applied to snapshot-loaded clips because `clip.audioFileId` was undefined, making the `c.audioFileId !== p.audioFileId` check always fail.

**SPRINT-7-003 (P2, fixed):** BPM hardcoded to 128 in the import pipeline. `const bpm = 128` at line 2710 meant clip duration calculation was always based on 128 BPM regardless of the session tempo. A 10-second file at 90 BPM would import as 9 bars instead of 6. Fix: import handler reads live `bpm` state from App component closure.

**SPRINT-7-004 (P3, fixed):** Failed-decode clips had no visual differentiation from `WaveformPlaceholder` on non-imported clips. The `isFailed` logic only covered `failed-upload`; `failed-decode` clips rendered identically to a clip with no peaks. A collaborator who missed the toast had no way to know the waveform was unavailable. Fix: `isFailed` extended to cover `failed-decode` with a `C.warn` tint (distinct from `C.danger` for failed-upload).

---

## How issues were addressed

All four defects were fixed before sprint close:
- SPRINT-7-001: Backend fix in commit `24792ce`
- SPRINT-7-002, 7-003, 7-004: Frontend fixes in commit `30bbae4`

UAT re-verification confirmed all four fixes. Sprint 7 closed as CONDITIONAL PASS (zero P0/P1) with all identified defects resolved.

---

## Decisions made

**ADR-006 — Server-side peak generation (mid-sprint architecture pivot):** The original plan was local capable-runtime waveform generation (client-side `PeakGenerator`). During the sprint, the PM asked whether server-side peak generation would be more seamless for collaborators. Tech analysis concluded:
- For a 200-sample waveform overview, peaks from compressed (MP3/OGG) vs. lossless audio are visually identical — downsampling eliminates compression artifacts at this resolution
- The compressed file is already in R2 after upload; the server can generate peaks before returning the upload response, adding zero additional round trips
- Server-stored peaks (800 bytes per clip) are negligible in cost but available to all collaborators immediately via WS fan-out without any client having to decode audio locally
- The client-side `PeakGenerator` is retained as local-preview-only — renders while upload is in flight; replaced by server peaks on upload complete

Decision: server generates peaks during upload. `AudioFile.peaks` is the persistent source of truth. The mid-sprint pivot required a backend scope addition (peaks column, generation logic, WS fan-out) but produced a fundamentally better architecture for the collaboration use case.

**Single-file import only:** Multi-file drop shows an error. This was an explicit PM scope decision to avoid batch handling and partial-success complexity in the import MVP.

**Clip name from filename:** Imported clip name stripped of file extension. No derivation from audio metadata. Simple and predictable.

**Clip color from track owner:** Imported clips inherit the owning track's collaborator color. Consistent with the collaborator color model established in Sprint 1.

**Failed-decode vs. failed-upload visual distinction:** `failed-decode` uses `C.warn` tint; `failed-upload` uses `C.danger` tint. This distinction matters because the failure types have different user implications: failed-upload means the file never reached the server; failed-decode means the audio arrived but waveform rendering failed. The warn/danger distinction communicates severity.

---

## What was deferred

- FR-03 in-app file browser panel — no sprint scheduled; awaiting PM scope decision
- Multi-file import/batch import — explicit out-of-scope
- Native desktop waveform worker — out of scope for web prototype
- Full tablet/mobile editing workflows — desktop-first mandate
- "Regenerate peaks" action for failed-decode clips — deferred; no sprint scheduled

---

## What was learned

**The BPM hardcode bug (SPRINT-7-003) is the most instructive defect in Sprint 7.** The TODO comment at line 2710 acknowledged the gap — `const bpm = 128` with a comment saying this should use the live state — but was committed and not caught before UAT. This is a pattern to watch: TODO comments that document known bugs are not substitutes for fixing the bug. The fix was one line; the oversight cost UAT time.

**Migration `DEFAULT` values must be explicit for non-null columns.** SPRINT-7-001 is a class of bug that appears whenever a new column is added to a table with existing rows without a default. The pattern going forward: every `ALTER TABLE ADD COLUMN` that is `NOT NULL` must include a `DEFAULT` and a backfill `UPDATE` for existing rows. This became standard practice after Sprint 7.

**Server-side peak generation is better than client-side for a collaboration tool.** The original plan (client-side only) would have meant: collaborator B joins a session, sees all clips as `WaveformPlaceholder`, has to download and decode audio locally to see waveforms. The mid-sprint pivot to server peaks means waveforms are available to every collaborator from the moment upload completes, without any local decoding. This is the right architecture for the product.

**Snapshot hydration gaps are a recurring problem.** SPRINT-7-002 is the second time the frontend snapshot handler was incomplete (after the Sprint 5 5-D gap). The pattern: backend sends correct data in the snapshot, frontend handler doesn't map all fields into state. Future sprints adding new clip or session fields must audit the snapshot handler.

---

## Metrics

- Defects found: 4 (0 P0, 0 P1, 3 P2, 1 P3)
- All 4 fixed before sprint close
- UAT result: CONDITIONAL PASS
- `tsc --noEmit`: clean on both frontend and backend at close

---

## Open questions going into the next sprint

- When does "Regenerate peaks" action get scheduled?
- Should `failed-decode` clips get a "Retry" button or is the toast sufficient?
