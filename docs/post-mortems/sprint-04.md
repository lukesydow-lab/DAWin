# Sprint 4 Post-Mortem — Persistence Pre-Work

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 4
**Dates:** 2026-05-16 – 2026-05-18
**Status:** Closed
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

Sprint 4 was originally intended to cover Core Editing Ergonomics: resizable workspace panels (FR-01) and timeline zoom (FR-02). The sprint was repurposed before kickoff to lay the database foundation needed to unblock Sprint 5 persistence work. The FR-01 and FR-02 features were explicitly deferred.

The actual Sprint 4 goals:
- Design and commit the PostgreSQL schema via Prisma (ADR-004)
- Define the `StorageAdapter` interface so route handlers never depend on Prisma directly
- Ship `InMemoryStorageAdapter` as the dev/test fallback
- Ship `PrismaStorageAdapter` as a stub (to be completed in Sprint 6)
- Wire docker-compose and `.env.example` for local PostgreSQL

---

## What shipped

- **ADR-004:** PostgreSQL schema design — cuid IDs, JSONB for plugin params and comment anchors, `PluginChain`+`Plugin` tables, `SessionMember` junction table, soft deletes on comments/replies, `AudioFile` model with dual-tier storage (`s3StreamKey` + `s3FullKey`) anticipating a future recording pipeline
- `server/prisma/schema.prisma` — canonical DB schema (tables: `Session`, `Track`, `Clip`, `PluginInstance`, `Comment`, `CommentReply`, `AudioFile`, `SessionMember`)
- `StorageAdapter` interface (`server/storage/adapter.ts`) — `SessionRow`, `TrackRow`, `ClipRow`, `AudioFileRow`, and comment ops contract; the only abstraction route handlers call
- `InMemoryStorageAdapter` (`server/storage/memory-adapter.ts`) — in-memory Maps; delegates comment ops to `store.ts`; dev/test fallback when `DATABASE_URL` is unset
- `PrismaStorageAdapter` stub (`server/storage/prisma-adapter.ts`) — interface-complete stub; full implementation deferred to Sprint 6
- `docker-compose.yml` — `postgres:15-alpine`, port 5432, named volume `postgres_data`
- `.env.example` — `DATABASE_URL` + `JWT_SECRET` placeholders
- `server/index.ts` updated — `StorageAdapter` DI; selects Prisma adapter when `DATABASE_URL` is set, InMemory otherwise
- `server/routes/comments.ts` — all 6 comment endpoints ported to `fastify.storage`; comment ID and timestamp assignment moved inside adapter

Four open DB design questions were resolved during the sprint: `totalBars` default, guest lifecycle (14-day purge / 12-month preserved on conversion), `AudioFile` dual-tier relay model, and plugin order gaps.

---

## What had issues

Sprint 4 had no UAT defects. There were no formal exit criteria gated at the sprint level — this was explicitly an internal reprioritization sprint to unblock Sprint 5. All pre-work items completed and confirmed via the Sprint 5 Done table in `STATUS.md`.

The primary challenge was design, not execution: the DB schema had to anticipate features not yet built (audio file upload, recording pipeline, session membership) without over-specifying things that hadn't been decided. The four open questions above required PM and Tech Lead alignment before the schema could be committed.

---

## How issues were addressed

N/A — no defects were found.

---

## Decisions made

**ADR-004 — PostgreSQL + Prisma schema:** The full schema is defined here. Key decisions within ADR-004:
- cuid() for all IDs (not UUID) — Prisma's default; shorter, URL-safe
- JSONB for plugin params and comment anchors — flexible enough to evolve without schema migrations for every new plugin type
- `AudioFile` dual-tier storage (`s3StreamKey` for compressed streaming, `s3FullKey` for full-quality desktop relay) — the streaming tier was activated in Sprint 6; the full-quality tier remains null on all web uploads through Sprint 9
- `SessionMember` junction table — supports role enforcement and session membership queries at the database level
- Soft deletes on comments/replies — delete sets `deletedAt` rather than removing the row; history is preserved

**`StorageAdapter` interface abstraction:** Route handlers never call Prisma directly; they only call methods on `fastify.storage`. This is one of the most consequential architectural decisions of the project. It meant that when `InMemoryStorageAdapter` was the only implementation, routes still had correct types. It also meant that the full Prisma implementation (Sprint 6) required no route changes at all — only swapping adapters.

**`InMemoryStorageAdapter` as a permanent dev/test fallback:** This was not designed as a temporary shim to be removed later. The decision to keep it permanently means: developers can run the server without any infrastructure (`DATABASE_URL` unset → automatic fallback); tests use it for isolation; CI doesn't need a database. This decision has been stable through Sprint 9.

**PR deferred: PrismaStorageAdapter stub committed, full implementation deferred to Sprint 6:** Shipping the stub meant Sprint 5 could proceed against the interface without waiting for PostgreSQL. The full implementation followed two sprints later. The stub was interface-complete with all method signatures returning empty/null values — this enabled type-safe development against the contract.

---

## What was deferred

- **FR-01 (resizable workspace panels):** Was scheduled for Sprint 4 in earlier roadmap drafts; deferred to unblock persistence. Eventually shipped in Sprint 9.
- **FR-02 (horizontal timeline zoom + per-track vertical zoom):** Same deferral. Eventually shipped in Sprint 9.
- **PrismaStorageAdapter full implementation:** Stub shipped; full implementation became Sprint 6-B.
- **First Prisma migration (`prisma migrate dev`):** Infrastructure ready but migration not run; became Sprint 6-A.

---

## What was learned

**Sprint repurposing has downstream costs that must be explicitly tracked.** When Sprint 4 was repurposed from FR-01/FR-02 to persistence pre-work, FR-01 and FR-02 entered a deferred state with no scheduled sprint. They remained unscheduled through Sprint 8 and were finally delivered in Sprint 9 — five sprints later. The explicit tracking prevented them from being forgotten, but the delay was real.

**Designing a schema for features that don't exist yet is a high-stakes bet.** The `AudioFile` dual-tier model (streaming + full-quality) anticipated a desktop recording relay that still doesn't exist in Sprint 10. The JSONB columns for plugin params anticipated parameter editing that also remains unimplemented. Both choices have proven correct in the sense that they haven't blocked anything — but they're carrying schema complexity for features that haven't been built.

**The `StorageAdapter` abstraction is worth its weight.** Sprint 5's backend work, Sprint 6's R2 integration, and Sprint 7's audio upload all built cleanly on this interface without needing to understand Prisma internals. Future engineers adding new storage backends should extend the interface, not bypass it.

---

## Metrics

- Defects: 0
- No formal UAT run (infrastructure sprint, no user-visible features)
- All items completed at sprint close
- tsc-clean on both frontend and backend

---

## Open questions going into the next sprint

- When does PrismaStorageAdapter get its full implementation? (Became Sprint 6-B)
- Is the `AudioFile.s3FullKey` column being overspecified for features that may never ship in the prototype?
