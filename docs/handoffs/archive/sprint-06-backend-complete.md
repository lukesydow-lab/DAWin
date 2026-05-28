# Sprint 6 Backend — Handoff

**Agent:** Backend Engineer  
**Date:** 2026-05-19  
**Status:** Complete — all items implemented, tsc clean, committed

---

## Items completed

| Item | Status |
|---|---|
| 6-C Audio upload endpoint | Done |
| 6-D Presigned streaming URL endpoint | Done |
| 6-E Local setup guide | Done |

---

## API endpoints

### POST /api/v1/sessions/:sessionId/audio

Accepts `multipart/form-data` with a single `file` field. Stores the file in R2, extracts audio metadata via `music-metadata`, creates an `AudioFile` DB row, and returns the row.

- Auth: JWT Bearer token required. Role must be `owner` or `collaborator`; `viewer` → 403.
- Allowed MIME types: `audio/wav`, `audio/ogg`, `audio/mpeg`, `audio/flac`, `audio/aac`
- Max file size: 500MB (enforced at multipart parser level; returns 413)
- S3 key format: `audio/<sessionId>/<uuid>.<ext>`
- `fileSizeBytes` is serialized as a string in the JSON response (BigInt → string)
- `s3FullKey` is always `null` on upload (desktop relay path, Sprint 9)

Error codes: 400, 401, 403, 404, 413, 415, 500

### GET /api/v1/audio/:audioFileId/stream-url

Returns a presigned R2 `GetObject` URL for `s3StreamKey` with TTL = 3600 seconds.

- Auth: JWT Bearer token required. Any session member role may stream.
- Non-members of the audio file's session → 403.
- Response: `{ url: string, expiresAt: string }` (ISO 8601)

Error codes: 401, 403, 404, 500

---

## New files

| File | Purpose |
|---|---|
| `server/r2.ts` | R2 S3Client singleton |
| `server/routes/audio.ts` | Upload + stream-url route handlers |
| `server/.env.example` | All required env vars documented |
| `docs/guides/local-setup.md` | First-time local dev runbook |

---

## Modified files

| File | Change |
|---|---|
| `server/storage/adapter.ts` | Added `getSessionMember()` to `StorageAdapter` interface |
| `server/storage/prisma-adapter.ts` | Implemented `getSessionMember()` via `SessionMember` table |
| `server/storage/memory-adapter.ts` | Implemented `getSessionMember()` (permissive stub for local dev) |
| `server/index.ts` | Registered `audioRoutes` |
| `server/ws/handler.ts` | Fixed pre-existing TS error: `SocketStream` was removed in `@fastify/websocket` v11; added local shim |

---

## Deviations from work order

- **`getSessionMember` added to `StorageAdapter` interface** (work order suggested accessing Prisma directly via a cast). Adding it to the interface is cleaner and keeps route handlers adapter-agnostic, which is the established contract pattern.

- **`ws/handler.ts` SocketStream fix** — this was a pre-existing type error that blocked `tsc --noEmit`. Fixed as a side effect since the commit requirement is a clean typecheck pass.

- **`@paralleldrive/cuid2` not installed** — used `crypto.randomUUID()` per the work order's fallback instruction. UUIDs are URL-safe and sufficient for S3 key uniqueness.

---

## tsc --noEmit status

Clean. Zero errors after fixing the pre-existing `SocketStream` import in `ws/handler.ts`.

---

## New npm packages installed

- `@fastify/multipart` — multipart form parsing, scoped to the audio routes plugin
- `music-metadata` — audio header parsing for duration, sample rate, and channel count

Both added to `server/package.json` dependencies.
