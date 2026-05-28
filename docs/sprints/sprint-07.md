# Sprint 7 — Audio File Import + Clip Creation

**Status:** Current — In Progress
**Last updated:** 2026-05-19
**Theme:** Allow users to import an audio file into DAWin, create a clip on the timeline, render a waveform, and prepare the system for browser, desktop, tablet, and mobile-compatible audio import workflows without over-scoping the MVP.
**Depends on:** Sprint 6 ✅ — audio upload endpoint (`POST /api/v1/sessions/:sessionId/audio`) and presigned streaming URL (`GET /api/v1/audio/:audioFileId/stream-url`) must be live
**Unblocks:** Sprint 8–9 (getUserMedia browser recording into session)

---

## Goals

- User can import an audio file via file picker or OS drag-and-drop onto the arranger timeline
- File uploads to Cloudflare R2 via the Sprint 6 endpoint
- A `Clip` DB row is created linked to the `AudioFile` row (`assetId` populated)
- Waveform peaks generated on the server during upload; `AudioFile.peaks` (JSONB) is the persistent source of truth; client-side `PeakGenerator` provides local preview while upload is in flight
- Clip name derived from filename (without extension); clip color from track owner/collaborator color
- Platform-safe architecture covering browser, desktop, tablet, and mobile fallback states

---

## PM Decisions (all resolved 2026-05-19)

### 1. Waveform Rendering Approach
**Original decision (2026-05-19):** Local capable-runtime waveform generation.

- Desktop app: generate peaks locally in the desktop runtime
- Desktop browser: generate peaks locally in the browser/client runtime
- Tablet: support same data model and fallback states; local generation may be supported with file size/duration limits
- Mobile: support compatibility/fallback states only; do not require full waveform generation or editing in Sprint 7
- Backend/cloud/server-side peak extraction: deferred

**Architecture requirement:** Do NOT hardcode this as "browser-only." Use language like "local capable-runtime waveform generation." Implementation must sit behind a `PeakGenerator` abstraction so DAWin can later swap in native desktop, server-side, worker-based, or mobile-safe implementations.

**Persistence requirement:** Generated peak data must be persisted with the audio file or clip record so collaborators and lower-powered devices can render without re-decoding the full audio file.

> **Superseded mid-sprint (2026-05-19) — see Mid-Sprint Decisions below.** The local `PeakGenerator` path is retained as preview-only (renders waveform while upload is in flight). Authoritative peaks now come from the server upload response. `AudioFile.peaks` JSONB column is the persistent source of truth. See ADR-006.

### 2. Drag Source Scope
**Decision:** File picker import + OS-level drag-and-drop into the arranger/timeline. FR-03 in-app file browser panel remains deferred.

### 3. Clip Color On Drop
**Decision:** Imported clips inherit the track owner/collaborator color. Do not derive from file metadata.

### 4. Multi-File Drop
**Decision:** Single-file import only. If a user drops multiple files, show: *"Import one audio file at a time for now."* No batch handling, partial-success logic, or multi-track creation.

### 5. Device Capability Fallback
**Decision:** Import must not fail silently on low-powered devices. Fallback behavior:
- Keep the uploaded/imported audio file record
- Show a placeholder waveform or loading/error state
- Use persisted peak data if it already exists
- Avoid heavy decode on low-powered devices when file size/duration is too large

Desktop and desktop browser are primary Sprint 7 targets. Tablet and mobile must be accounted for in data model and fallback states but full editing workflows are not required.

---

## In Scope

- Audio file picker import
- OS drag-and-drop onto arranger/timeline
- Single-file import only
- Clip creation from imported audio (`assetId` FK populated)
- Clip name from filename (without extension)
- Clip color from track owner/collaborator color
- Client-side `PeakGenerator` abstraction (preview-only path — renders waveform while upload is in flight)
- Server-side peak generation in upload handler; `AudioFile.peaks` JSONB column; peaks returned in upload response
- WS fan-out of peaks to all connected collaborators on upload complete
- Persisted waveform peak data (`AudioFile.peaks` is authoritative; `WaveformPlaceholder` for null-peaks clips)
- Loading / decoding / uploading / error states
- Platform-safe architecture for browser, desktop, tablet, and mobile fallback

## Out of Scope

- FR-03 in-app file browser panel
- Multi-file import/drop or batch import
- Automatic new-track creation from multiple files
- Native desktop-only waveform worker
- Full tablet/mobile editing workflows
- Mobile capture screen
- Plugin parameter editing
- Resizable panels / timeline zoom (unless separately scheduled)
- "Regenerate peaks" action for failed-decode clips (future sprint)

---

## Mid-Sprint Decisions (2026-05-19)

### Server-Side Peak Generation

**PM question that opened the discussion:**

> "Is it quicker to render peaks from the compressed version? And if we delivered those streaming-quality peaks to all devices while the full-quality peaks render on the host's computer, would it feel more seamless? Should we cache those streaming quality peak files on the server?"

**Tech analysis conclusions:**

- For a 200-sample waveform overview, peaks from compressed (MP3/OGG) vs. lossless audio are visually identical — the downsampling eliminates compression artifacts at this resolution.
- The compressed file is already in R2 after upload. The server can generate peaks before returning the upload response, with zero additional round trips to the client.
- Server-stored peaks (`AudioFile.peaks` JSONB — 200 × Float32 = 800 bytes per clip) become the persistent truth for all clients. Storage cost is negligible.
- WS fan-out delivers peaks to all connected collaborators the moment upload completes. No collaborator ever has to decode audio locally just to see a waveform.
- Future session opens get peaks from the session snapshot — zero recalculation on any client.
- The client-side `PeakGenerator` path is retained as local-preview-only: it renders a waveform inside the clip while the upload is in flight, giving instant visual feedback. Once the server responds, the client replaces local preview peaks with the authoritative server peaks.

**Decision:** Server generates peaks during upload. `AudioFile.peaks` is the persistent source of truth. Client-side `PeakGenerator` is preview-only.

**Architecture decision record:** ADR-006 (`docs/adr/ADR-006-server-side-peak-generation.md`) — written by Tech Lead.

**Backend Engineer additional deliverable (added mid-sprint):**
- Add `peaks Float[]` column to `AudioFile` Prisma schema
- Generate 200 peak values from the uploaded file in the upload handler (before returning the response)
- Return `peaks` in the `POST /api/v1/sessions/:sessionId/audio` response body
- Include `peaks` in the WS fan-out payload when a new `AudioFile` is created

---

## Work Sequence

**Gate: Designer spec must exist before Frontend Engineer starts.**

1. **Designer** — produce `docs/specs/audio-file-import.md` (work order: `docs/handoffs/active/sprint7-designer-audio-import-workorder.md`) ✅ complete
2. **Backend Engineer** — (a) `POST /api/v1/sessions/:sessionId/clips` endpoint (create Clip linked to AudioFile); (b) add `peaks Float[]` to `AudioFile` Prisma schema; (c) generate 200 peaks in upload handler before returning response; (d) return `peaks` in upload response body; (e) include `peaks` in WS fan-out on clip/audio file creation. See Mid-Sprint Decisions above and ADR-006.
3. **Frontend Engineer** — drag-and-drop file target, upload progress, `PeakGenerator` abstraction (preview-only path), waveform rendering from server peaks on upload complete, R2 playback ✅ initial implementation complete (commit 29aa36c); awaiting backend peaks delivery
4. **UAT** — sprint sign-off with zero P0/P1 defects

---

## Exit Criteria

- [ ] Drag a WAV/MP3/OGG file onto the arranger → uploads → waveform appears in clip
- [ ] Clip linked to AudioFile row (`assetId` populated in DB)
- [ ] Upload response includes `peaks` array (200 values); frontend replaces local preview peaks with server peaks on upload complete
- [ ] WS fan-out delivers peaks to all connected collaborators when upload completes
- [ ] `AudioFile.peaks` persisted in DB; future session opens render waveform from snapshot without re-decode
- [ ] Clips with null `peaks` (pre-Sprint 7 records) render `WaveformPlaceholder` — no crash
- [ ] Multi-file drop shows friendly unsupported message
- [ ] Upload failure shows user-visible error (not silent)
- [ ] Decode/peak failure shows placeholder state (not crash)
- [ ] `PeakGenerator` abstraction in place (swappable implementation)
- [ ] `tsc --noEmit` passes
- [ ] Sprint 7 UAT signed off with zero P0/P1 defects

---

## Key Links

- Designer work order: `docs/handoffs/active/sprint7-designer-audio-import-workorder.md`
- Designer spec: `docs/specs/audio-file-import.md` ✅
- Architecture decision: `docs/adr/ADR-006-server-side-peak-generation.md` (Tech Lead — server-side peak generation)
- Depends on: `server/routes/audio.ts` (Sprint 6), `server/prisma/schema.prisma` Clip + AudioFile models
- FR-03 (file browser, deferred): `docs/features/FR-2026-05-14-03-file-browser-local-sample-import.md`
- ROADMAP: `docs/specs/ROADMAP.md`
