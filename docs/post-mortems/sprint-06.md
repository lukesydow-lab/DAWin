# Sprint 6 Post-Mortem — File Storage + Audio Upload

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 6
**Dates:** 2026-05-19 – 2026-05-19
**Status:** Closed
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

- Connect server to a real PostgreSQL database (not in-memory)
- Run the first Prisma migration to create all database tables
- Integrate Cloudflare R2 for audio file storage
- Build audio upload endpoint and presigned streaming URL endpoint
- Document local dev setup so any engineer can get running

---

## What shipped

- **6-A:** First Prisma migration (`20260519192307_init`) — all tables created from `server/prisma/schema.prisma`; server boots with `PrismaStorageAdapter (PostgreSQL)` confirmed in logs
- **6-B:** `PrismaStorageAdapter` fully implemented — all `StorageAdapter` interface methods complete (the stub from Sprint 4 was confirmed and verified)
- **6-C:** `POST /api/v1/sessions/:sessionId/audio` — multipart upload via `@fastify/multipart`, audio metadata extracted by `music-metadata` (duration, sample rate, channels), file stored in Cloudflare R2 at `audio/{sessionId}/{uuid}.{ext}`, `AudioFile` DB row created; viewer role gets 403
- **6-D:** `GET /api/v1/audio/:audioFileId/stream-url` — presigned `GetObjectCommand` URL (1-hour TTL); session membership enforced via new `getSessionMember` method added to `StorageAdapter` interface
- **6-E:** `docs/guides/local-setup.md` — full first-time setup runbook; `server/.env.example` updated with R2 env vars
- Docker PostgreSQL running locally; Cloudflare R2 bucket `dawin-audio-dev` connected and verified live
- Dependency fixes: `tsx` replaces `ts-node`; `@fastify/websocket` updated to v11; `pino-pretty` added; `.env` added to `.gitignore`

---

## What had issues

Sprint 6 had no UAT defects. The sprint doc does not record a formal UAT run — all exit criteria were verified directly by the Backend Engineer and confirmed via the sprint close checklist. This was a pure backend sprint with no user-visible UI changes; no frontend agent was involved.

The one notable challenge was the infrastructure setup itself — establishing a live R2 bucket connection and running the first real migration requires secrets that aren't in the repo. The local-setup guide (`docs/guides/local-setup.md`) was written precisely to capture this process for any engineer joining later.

One deferred item from Sprint 4 that Sprint 6 also deferred: `s3FullKey` (full-quality desktop relay). The schema column exists, intentionally `null` on all web uploads. Desktop relay remains future scope.

---

## How issues were addressed

N/A — no defects found.

---

## Decisions made

**Cloudflare R2 as the object storage provider:** R2 was chosen over S3/MinIO. An older planning document (`docs/specs/sprint6-plan.md`) recommended MinIO/S3 — that recommendation was superseded. R2 offers zero egress fees for an audio streaming use case, S3-compatible API (so the upload and streaming code is portable), and global CDN. The project docs note this supersession: `docs/specs/sprint6-plan.md` is marked as containing a stale provider recommendation.

**1-hour TTL on presigned stream URLs:** Re-fetch URL on expiry; buffer never re-decoded if cache hit. This TTL decision was carried forward unchanged into Sprint 8's audio playback architecture (ADR-007).

**Viewer 403 on upload:** Role enforcement at the upload endpoint. An editor or above can upload; a viewer cannot. This mirrors the track arm enforcement in Sprint 2.

**`getSessionMember` added to `StorageAdapter` interface:** The streaming URL endpoint needed to verify session membership before issuing the presigned URL. Adding this method to the interface (rather than calling Prisma directly) maintained the adapter abstraction. This is the correct call — adapters need to evolve with new query requirements.

**`tsx` replaces `ts-node`:** A dependency fix rather than an architecture decision, but worth noting: `ts-node` was producing issues with ESM handling. `tsx` is faster and handles TypeScript execution without the configuration overhead.

---

## What was deferred

- `s3FullKey` (full-quality desktop relay) — schema column exists, `null` on all web uploads; desktop relay flow deferred
- VU stereo `ChannelSplitterNode` (R3 from Sprint 5) — P2, does not block Sprint 7; carried forward again; eventually resolved Sprint 8

---

## What was learned

**Infrastructure sprints are short when the foundation is right.** Sprint 6 closed on the same day it opened. The `StorageAdapter` interface from Sprint 4 meant the upload endpoint could be built without any refactoring of existing routes. The Prisma schema from Sprint 4 had `AudioFile` already defined with the correct fields. The first migration was clean.

**The local-setup guide is an investment that pays off across every sprint.** Every new agent or developer joining the project after Sprint 6 can get running from `docs/guides/local-setup.md` without relying on tribal knowledge. This document should be updated whenever the setup process changes (new env vars, new services, new migration steps).

**Presigned URLs need TTL awareness at every consumption site.** The 1-hour TTL on stream URLs was established here. Sprint 7's BPM bug (hardcoded `const bpm = 128`) and Sprint 8's audio playback cache (`Map<audioFileId, { buffer: AudioBuffer; fetchedAt: number }>` with TTL check) both build on this. Any future sprint that fetches audio URLs needs to understand TTL behavior.

---

## Metrics

- Defects: 0
- All exit criteria met
- `tsc --noEmit`: clean
- Prisma migration status: no pending migrations at close
- R2 bucket connected and verified live

---

## Open questions going into the next sprint

- How does the presigned URL TTL interact with long session audio playback? (Addressed in Sprint 8 ADR-007)
- Does `s3FullKey` ever get used, or is it dead schema?
