# Sprint 6 — File Storage + Audio Upload

**Status:** Historical Archive
**Last updated:** 2026-05-19
**Closed:** 2026-05-19
**Theme:** Connect the persistence layer to real infrastructure — run the first Prisma migration, activate PrismaStorageAdapter against a live PostgreSQL database, and integrate Cloudflare R2 for audio file upload and presigned streaming.
**Depends on:** Sprint 5 (PrismaStorageAdapter, Prisma schema, StorageAdapter interface, docker-compose)
**Unblocks:** Sprint 7 (waveform rendering + audio drag-and-drop require a working upload endpoint and presigned stream URL)

---

## Goals

- Connect server to a real PostgreSQL database (not in-memory)
- Run the first Prisma migration to create all database tables
- Integrate Cloudflare R2 for audio file storage
- Build audio upload endpoint and presigned streaming URL endpoint
- Document local dev setup so any engineer can get running

---

## What Shipped

- **6-A:** First Prisma migration (`20260519192307_init`) — all tables created from `server/prisma/schema.prisma`; server boots with `PrismaStorageAdapter (PostgreSQL)` confirmed in logs
- **6-B:** `PrismaStorageAdapter` fully implemented — all `StorageAdapter` interface methods complete (was already done in Sprint 5 pre-work; confirmed and verified)
- **6-C:** `POST /api/v1/sessions/:sessionId/audio` — multipart upload via `@fastify/multipart`, audio metadata extracted by `music-metadata` (duration, sample rate, channels), file stored in Cloudflare R2 at `audio/{sessionId}/{uuid}.{ext}`, `AudioFile` DB row created; viewer role gets 403
- **6-D:** `GET /api/v1/audio/:audioFileId/stream-url` — presigned `GetObjectCommand` URL (1hr TTL); session membership enforced via new `getSessionMember` method added to `StorageAdapter` interface
- **6-E:** `docs/guides/local-setup.md` — full first-time setup runbook; `server/.env.example` updated with R2 env vars
- **Infrastructure:** Docker PostgreSQL running locally; Cloudflare R2 bucket `dawin-audio-dev` connected and verified live
- **Dependencies fixed:** `tsx` replaces `ts-node`; `@fastify/websocket` updated to v11; `pino-pretty` added; `.env` added to `.gitignore`

---

## Deferred

- `s3FullKey` (full-quality desktop relay) — schema column exists, intentionally `null` on all web uploads. Desktop relay flow is Sprint 9.
- R3: VU stereo `ChannelSplitterNode` — P2, does not block Sprint 7. Carried forward.

---

## Exit Criteria

- [x] `prisma migrate status` shows no pending migrations
- [x] Server boots with `PrismaStorageAdapter` log line confirmed
- [x] `POST /api/v1/sessions/:id/audio` uploads a file and returns `AudioFileRow`
- [x] `GET /api/v1/audio/:id/stream-url` returns a presigned R2 URL
- [x] Viewer JWT receives 403 on upload
- [x] `tsc --noEmit` passes
- [x] `.env.example` documents all required environment variables
- [x] `docs/guides/local-setup.md` exists

---

## Key Links

- Work order: `docs/handoffs/active/sprint-06-backend-workorder.md`
- Completion handoff: `docs/handoffs/active/sprint-06-backend-complete.md`
- New files: `server/r2.ts`, `server/routes/audio.ts`, `docs/guides/local-setup.md`
- Modified: `server/storage/adapter.ts` (added `getSessionMember`), `server/storage/prisma-adapter.ts`, `server/storage/memory-adapter.ts`, `server/index.ts`, `server/package.json`
