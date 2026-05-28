# Sprint 4 — Persistence Pre-Work

**Status:** Historical Archive
**Last updated:** 2026-05-19
**Closed:** 2026-05-18
**Theme:** Lay the database foundation — schema design, StorageAdapter abstraction, and local dev infrastructure — so Sprint 5 can activate real persistence without architectural surprises.
**Depends on:** Sprint 3 (comment data shapes, WS event schema, and domain types must be stable before the DB schema can be finalized).
**Unblocks:** Sprint 5 (all persistence work depends on the Prisma schema, StorageAdapter interface, and docker-compose infrastructure delivered here).

---

## Goals

- Design and commit the PostgreSQL schema via Prisma (ADR-004)
- Define the `StorageAdapter` interface so route handlers never depend on Prisma directly
- Ship `InMemoryStorageAdapter` as the dev/test fallback
- Ship `PrismaStorageAdapter` as a stub (to be completed in Sprint 5/6)
- Wire docker-compose and `.env.example` for local PostgreSQL

---

## What Shipped

- **ADR-004:** PostgreSQL schema design — cuid IDs, JSONB for plugin params and comment anchors, `PluginChain`+`Plugin` tables, `SessionMember` junction table, soft deletes on comments/replies, `AudioFile` model with dual-tier storage (`s3StreamKey` + `s3FullKey`) ready for recording pipeline
- `server/prisma/schema.prisma` — canonical DB schema (tables: `Session`, `Track`, `Clip`, `PluginInstance`, `Comment`, `CommentReply`, `AudioFile`, `SessionMember`)
- `StorageAdapter` interface (`server/storage/adapter.ts`) — `SessionRow`, `TrackRow`, `ClipRow`, `AudioFileRow`, and comment ops contract; the only abstraction route handlers call
- `InMemoryStorageAdapter` (`server/storage/memory-adapter.ts`) — in-memory Maps; delegates comment ops to `store.ts`; dev/test fallback when `DATABASE_URL` is unset
- `PrismaStorageAdapter` stub (`server/storage/prisma-adapter.ts`) — interface-complete stub; full implementation deferred to Sprint 6 (6-B)
- `docker-compose.yml` — `postgres:15-alpine`, port 5432, named volume `postgres_data`
- `.env.example` — `DATABASE_URL` + `JWT_SECRET` placeholders
- `server/index.ts` updated — `StorageAdapter` DI; selects Prisma adapter when `DATABASE_URL` is set, InMemory otherwise; `fastify.storage` decoration + module augmentation
- `server/routes/comments.ts` — all 6 comment endpoints ported to `fastify.storage`; `addComment` signature updated to `Omit<SessionComment, 'id'|'createdAt'|'replies'>`; ID/timestamp assigned inside adapter
- Four open DB design questions answered: `totalBars` default, guest lifecycle (14-day purge / 12-month preserved on conversion), `AudioFile` dual-tier relay, plugin order gaps accepted (see ADR-004)

---

## Deferred

- **FR-01 (resizable workspace panels)** — was scheduled for Sprint 4 in earlier roadmap drafts; deferred when Sprint 4 was repurposed for persistence pre-work. No sprint assigned as of Sprint 6.
- **FR-02 (horizontal timeline zoom + per-track vertical zoom)** — same deferral. No sprint assigned as of Sprint 6.
- **PrismaStorageAdapter full implementation** — stub shipped; full implementation scheduled as Sprint 6-B.
- **First Prisma migration (`prisma migrate dev`)** — infrastructure ready but migration not run; scheduled as Sprint 6-A.

---

## Exit Criteria

There were no formal exit criteria gated at the sprint level for Sprint 4 — this sprint was an internal reprioritization to unblock Sprint 5. All pre-work items were completed and confirmed via the Sprint 5 Done table in `STATUS.md`.

- [x] Prisma schema committed and tsc-clean
- [x] `StorageAdapter` interface defined; `InMemoryStorageAdapter` satisfies it
- [x] `docker-compose.yml` and `.env.example` present
- [x] ADR-004 committed to `docs/adr/`
- [x] Sprint 5 can start without open blocking questions

---

## Key Links

- `docs/adr/ADR-004` — PostgreSQL schema design decision
- `server/prisma/schema.prisma` — canonical DB schema
- `server/storage/adapter.ts` — StorageAdapter interface
- `server/storage/memory-adapter.ts` — InMemoryStorageAdapter
- `server/storage/prisma-adapter.ts` — PrismaStorageAdapter stub
- `docker-compose.yml` — local PostgreSQL service
