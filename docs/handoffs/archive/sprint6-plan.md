# Sprint 6 — File Storage + Audio Upload

**Sprint:** 6  
**Status:** Superseded by docs/sprints/sprint-06.md  
**Last updated:** 2026-05-19

> This draft is superseded. The authoritative Sprint 6 plan is [docs/sprints/sprint-06.md](../sprints/sprint-06.md) and the work order is [docs/handoffs/active/sprint-06-backend-workorder.md](../handoffs/active/sprint-06-backend-workorder.md). The provider recommendation in this file (Minio/S3) is overridden — the chosen provider is Cloudflare R2.

**Original Status:** Planning  
**Goal:** Backend file storage wired; first real audio file uploads to S3, creates an AudioFile+Clip row, and plays back from the session.  
**Unblocks:** Sprint 7 (waveform rendering from real buffers, full drag & drop UI)  
**Depends on:** Sprint 5 (AudioFile schema ready ✅, Clip.assetId FK ready ✅, StorageAdapter ready ✅)

---

## Open Decisions (PM must answer before sprint work begins)

### OD-1 — File storage provider
**Who decides:** PM  
**Recommendation: Minio for local dev + AWS S3 us-east-1 for production.**  
Rationale: The team has a `docker-compose.yml` from Sprint 5. Adding a Minio service adds one service block and zero new accounts. The AWS SDK v3 `S3Client` works against Minio unchanged — same code, different env vars. Production switches by changing env vars with no code changes.

### OD-2 — Upload flow: direct browser presigned PUT vs. server proxy
**Who decides:** Tech Lead (in 6-A), PM approves  
**Recommendation: Option B — server proxy for Sprint 6.**  
Rationale: Presigned URL upload is the right production architecture but adds CORS config, two round trips, and a more complex frontend. For Sprint 6, server proxy is faster to implement, easier to test, and eliminates CORS surface area. Adopt presigned PUT in a later sprint when scale matters.

### OD-3 — Download/stream flow
**Who decides:** Tech Lead (in 6-A)  
**Recommendation: Presigned S3 URL (15-minute TTL).**  
Rationale: Never proxy audio bytes through the app server. Server validates auth, returns a time-limited URL, client fetches from S3 directly at CDN speed.

### OD-4 — Clip position on drop
**Who decides:** PM  
**Recommendation:** Drop X → `Math.round(dropPixelX / barW)` → nearest whole bar. Drop Y → target track. Drop on empty background → create new track owned by dropping user in their collaborator color.

### OD-5 — Stub clip duration before upload completes
**Who decides:** Designer (in 6-B spec)  
**Recommendation:** 4-bar stub while uploading. On success, replace with real `durationBars` computed from `durationSec + bpm`.

---

## Sprint 6 Tickets

---

## 6-A — ADR-006: File Storage Architecture
**Agent:** Tech Lead  
**Priority:** P0  
**Depends on:** OD-1 and OD-2 answers from PM  
**Scope:** Write `docs/adr/ADR-006-file-storage.md`. Decide storage provider, upload flow, download flow. Define: response shape (`{ audioFile: AudioFileRow, clip: ClipRow }`), S3 key naming (`sessions/{sessionId}/audio/{cuid()}.{ext}`), accepted MIME types (audio/wav, audio/aiff, audio/x-aiff, audio/mpeg, audio/flac, audio/ogg), file size limit (500MB). Note: `s3FullKey` is NOT populated in Sprint 6 — that is the desktop recording relay (Sprint 8–9 scope). Reference ADR-004 Q3 for the dual-key model rationale.  
**Spec required:** N/A — this ticket produces the ADR  
**Definition of done:**
- `docs/adr/ADR-006-file-storage.md` written
- Covers: provider, upload flow, download flow, endpoint shape, key naming, MIME types, file size limit
- Explicitly states `s3FullKey` is out of scope for Sprint 6

---

## 6-B — File Upload UX Spec
**Agent:** Designer  
**Priority:** P0  
**Depends on:** OD-4 answer (clip position on drop) from PM  
**Scope:** Write `docs/specs/sprint6-file-upload-ux.md`. This spec is the gate for 6-E — it must exist and be PM-approved before the Frontend Engineer begins. Cover: (1) drag-over state of the arranger drop zone; (2) stub clip appearance while uploading — uploader's collaborator color, "Uploading… filename" label; (3) upload progress indicator; (4) success state — stub replaced by real clip with correct duration; (5) error states: wrong file type ("Unsupported file type. Accepted: WAV, AIFF, MP3, FLAC, OGG"), file too large ("File too large. Maximum 500MB"), server error ("Upload failed. Try again."); (6) accepted file type list; (7) clip position rule. All colors must use `C.*` tokens — no hardcoded hex.  
**Spec required:** N/A — this ticket produces `docs/specs/sprint6-file-upload-ux.md`  
**Definition of done:**
- Spec covers all seven items above with all interactive states
- All colors reference `C.*` tokens or uploader's collaborator color
- PM has reviewed and approved before 6-E is assigned

---

## 6-C — S3 Client Integration
**Agent:** Backend Engineer  
**Priority:** P0  
**Depends on:** 6-A (ADR-006 must define provider and config before wiring)  
**Scope:** Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`. Create `server/storage/s3-client.ts` exporting `getS3Client(): S3Client` (reads `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_ENDPOINT` for Minio override) and `generatePresignedGetUrl(key, ttlSeconds): Promise<string>`. Add vars to `.env.example`. Add `minio` service to `docker-compose.yml` (port 9000, console port 9001, named volume). Register S3 client on Fastify instance via `fastify.decorate('s3', client)`.  
**Spec required:** N/A (backend infrastructure)  
**Definition of done:**
- `server/storage/s3-client.ts` exported, factory pattern (not module singleton)
- `S3_ENDPOINT` supports Minio override; documented in `.env.example`
- `docker-compose.yml` includes `minio` service
- `tsc --noEmit` passes

---

## 6-D — Upload Endpoint
**Agent:** Backend Engineer  
**Priority:** P0  
**Depends on:** 6-A (MIME types, file size limit, response shape), 6-C (S3 client on Fastify)  
**Scope:** `POST /api/v1/sessions/:id/audio-files`. Accepts `multipart/form-data` with `file` field + form fields `trackId` and `startBar`. Validates: role (403 for viewer), MIME type (422 with accepted list), file size (413). On pass: stream to S3 at `s3StreamKey` (no `s3FullKey` in Sprint 6). Create `AudioFile` row + stub `Clip` row in a single Prisma transaction via `fastify.storage`. Compute `durationBars = (durationSec / 60) * bpm / timeSignature.numerator`. Set clip `color` from uploader's `SessionMember.color`. Return `{ audioFile: AudioFileRow, clip: ClipRow }`. Broadcast `clip.created` WS event. Use `@fastify/multipart` for streaming — no full-file buffer in memory. Register in `server/routes/audio-files.ts`.  
**Spec required:** N/A (backend)  
**Definition of done:**
- Route registered, rejects viewers with 403, unsupported types with 422, oversized with 413
- AudioFile + Clip created atomically
- `s3FullKey` is null
- `clip.created` WS broadcast fires after commit
- Streaming upload — no full-file buffer
- `tsc --noEmit` passes

---

## 6-E — Frontend: File Drag-and-Drop + Upload Flow
**Agent:** Frontend Engineer  
**Priority:** P1  
**Depends on:** 6-B spec (`docs/specs/sprint6-file-upload-ux.md` must exist and be PM-approved), 6-D endpoint live  
**Spec required:** `docs/specs/sprint6-file-upload-ux.md` — **must exist and be PM-approved before this ticket is assigned**  
**Scope:** Implement drag-and-drop per the 6-B spec: (1) drag-over handlers on the arranger; (2) client-side MIME type validation on drop — show error state and abort if invalid; (3) compute drop bar position and target track; (4) create stub `ClipData` in React state with `uploading: true` flag and uploader's collaborator color; (5) call `POST /api/v1/sessions/:id/audio-files` via `XMLHttpRequest` (not `fetch`) for upload progress events; (6) on success, replace stub clip with real `ClipRow`; (7) on error, remove stub clip and show error state. After upload success: call `GET /api/v1/audio-files/:id/stream` → presigned URL → `fetch(url)` → `decodeAudioData` → store `AudioBuffer` keyed by `audioFile.id`. Wire playback: when playhead crosses a clip with a decoded `AudioBuffer`, schedule an `AudioBufferSourceNode`. Use existing `getAudioCtx()` singleton — no second `AudioContext`.  
**Definition of done:**
- Dragging a valid file shows drag-over visual
- Dropping creates stub clip at correct bar/track position in uploader's color
- Upload progress visible during upload
- On success, stub replaced by real clip with correct duration
- On wrong file type, error shown — no stub clip created
- Uploaded clip plays audio when transport plays
- `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes
- No hardcoded hex colors

---

## 6-F — Stream/Download Endpoint
**Agent:** Backend Engineer  
**Priority:** P0  
**Depends on:** 6-A (presigned URL TTL), 6-C (S3 client + `generatePresignedGetUrl` available)  
**Scope:** `GET /api/v1/audio-files/:id/stream`. Requires Bearer auth. Returns 404 if `AudioFile` not found. Returns 403 if requesting user is not a session member. Any role (owner, collaborator, viewer) may download for playback. Calls `generatePresignedGetUrl(audioFile.s3StreamKey, 900)` and returns `{ url: string, expiresAt: string }`. Does NOT proxy audio bytes. Register in `server/routes/audio-files.ts` alongside 6-D.  
**Spec required:** N/A (backend)  
**Definition of done:**
- Returns 404 if not found, 403 if non-member
- Returns `{ url, expiresAt }` with 15-minute presigned URL
- Does not stream audio bytes through server
- `tsc --noEmit` passes

---

## 6-G — Sprint 6 UAT Sign-off
**Agent:** UAT  
**Priority:** P0  
**Depends on:** 6-D, 6-E, 6-F all complete  
**Scope:** Execute exit criteria checklist. Golden path: drag WAV → upload → clip appears → clip plays. Auth: viewer cannot upload (403). Persistence: upload, restart server, reload session, clip still present and plays. Log all defects to `docs/defects.md`. P0/P1 defects block sign-off.  
**Definition of done:**
- All exit criteria tested
- All P0/P1 defects fixed before sign-off
- `docs/handoffs/sprint6-uat.md` written

---

## Sequencing Diagram

```
OD-1 (PM) ──┐
OD-2 (PM) ──┴──► 6-A (ADR-006, TL) ──► 6-C (S3 client, BE) ──► 6-D (upload, BE) ──┐
                                                              └──► 6-F (stream, BE) ──┤
                                                                                       │
OD-4 (PM) ──► 6-B (Designer spec) ───────────────────────────────────────────────► 6-E (FE) ──► 6-G (UAT)
```

**Critical path:** OD-1/OD-2 → 6-A → 6-C → 6-D → 6-E → 6-G  
**Parallel:** 6-B runs independently; must land before 6-E is assigned. 6-F runs alongside 6-D.

---

## Sprint 6 Exit Criteria

- [ ] A WAV file dragged onto the arranger uploads to S3 and creates a real `AudioFile` row + `Clip` row in the database
- [ ] The clip plays the uploaded audio when transport plays (not procedural synthesis)
- [ ] Upload progress is visible during upload
- [ ] Wrong file types are rejected client-side before any network request
- [ ] Viewer role receives 403 on `POST /api/v1/sessions/:id/audio-files`
- [ ] Server restart does not lose the uploaded clip — clip present in `session.snapshot` after reconnect
- [ ] `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes in both `server/` and root with zero errors
- [ ] ADR-006 written and committed to `docs/adr/`
- [ ] Designer spec at `docs/specs/sprint6-file-upload-ux.md` exists and is PM-approved before 6-E is assigned
- [ ] Sprint 6 UAT signed off with zero P0/P1 defects open

---

## PM Recommendations Summary

| Decision | Recommendation |
|---|---|
| File storage provider | Minio (local dev via docker-compose) + AWS S3 us-east-1 (production) |
| Upload flow | Server proxy (multipart → server → S3 stream) — presigned PUT deferred to Sprint 8–9 |
| Download flow | Presigned S3 URL, 15-minute TTL — never proxy audio bytes through app server |
| Clip position on drop | Nearest whole bar; target track from drop Y; new track if dropped on empty background |
| `s3FullKey` | NOT populated in Sprint 6 — desktop relay is Sprint 8–9 scope |
| Waveform display | Placeholder solid fill in Sprint 6; real waveform rendering is Sprint 7 scope |

---

## Key files (no changes needed from Sprint 5)

| File | Why it matters |
|---|---|
| `server/storage/adapter.ts` | `createAudioFile`, `getAudioFile`, `createClip` already defined — no interface changes needed |
| `server/prisma/schema.prisma` | `AudioFile` model + `Clip.assetId` FK ready — no schema changes needed |
| `docs/adr/ADR-004-database-schema.md` | Q3 defines the s3StreamKey/s3FullKey dual-key model — 6-A must reference this |
