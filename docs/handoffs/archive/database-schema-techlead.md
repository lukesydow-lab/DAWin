# Handoff — Database Schema (Tech Lead → Backend Engineer)

**Date:** 2026-05-17  
**Author:** Tech Lead  
**Sprint:** 5  
**Files created:**
- `docs/adr/ADR-004-database-schema.md`
- `server/prisma/schema.prisma`

---

## What was decided and why

**PostgreSQL + Prisma.** The in-memory store (`server/store.ts`) is replaced by a PostgreSQL database via Prisma ORM. Prisma's codegen gives type-safe queries that integrate with the existing strict TypeScript setup. The `server/types.ts` interfaces remain the API surface — Prisma types stay internal to `server/`.

**Key schema calls:**

| Question | Decision |
|---|---|
| IDs | `cuid()` — URL-safe, shorter than UUID, matches existing `string` ID type |
| JSONB fields | `Plugin.params`, `Comment.anchor`, `Session.timeSignature`, `Clip.fadeCurve` |
| Plugin chains | Two relational tables (`PluginChain` + `Plugin` with `order` int) — not JSONB array |
| CommentReply | Separate table with FK to `Comment` — individually addressable, no JSONB array |
| CommentAnchor | JSONB on `Comment` row — invariant validation stays in REST handler |
| Session memberships | `SessionMember` junction table; `color` is per (userId, sessionId) |
| Transport state | Only `bpm`, `timeSignature`, `totalBars` persist; `playing`/`playheadBar`/`syncedAt` remain in-memory only |
| Soft deletes | On: `User`, `Session`, `Comment`, `CommentReply`. Hard deletes on: `Track`, `Clip`, `Plugin`, `PluginChain`, `SessionMember` |

The full rationale for each decision is in `docs/adr/ADR-004-database-schema.md`.

---

## What the Backend Engineer needs to do in Sprint 5

### 1. Environment setup
- Add `DATABASE_URL` to `.env` (not committed).
- Provide a `docker-compose.yml` at the repo root with a Postgres 15 service for local dev.
- Update `README.md` / dev setup docs with the DB prerequisite.

### 2. Prisma initialization
```
cd server
npx prisma init --skip-generate   # datasource already in schema.prisma
npx prisma migrate dev --name init
npx prisma generate
```
The `schema.prisma` is already at `server/prisma/schema.prisma`.

### 3. Storage adapter interface
Create `server/storage/adapter.ts` defining the `StorageAdapter` interface. Signatures must match the current `store.ts` exported functions for persistent entities — `async` versions returning `Promise<T>`. See ADR-004 "Migration Path" section for the full interface shape.

### 4. PrismaStorageAdapter implementation
Create `server/storage/prisma-adapter.ts` implementing `StorageAdapter` using the generated Prisma client. Key implementation notes:
- `getComments` must filter `WHERE deletedAt IS NULL`.
- `deleteComment` sets `deletedAt = now()` — it does not physically delete the row.
- `createClip` + `createAudioFile` together must use `prisma.$transaction([...])` — the recording pipeline requires atomicity even though recording isn't implemented until Sprint 8.
- `getOrCreateSession` equivalent: check if session exists, create with defaults if not, return either way.

### 5. InMemoryStorageAdapter (for tests)
Create `server/storage/memory-adapter.ts` that wraps the existing `store.ts` comment/session logic. This is the adapter used in unit tests and local dev without a DB connection. It does not need to be a full implementation — comment operations are the critical path.

### 6. Migrate REST handlers
Update Fastify route registration in `server/routes/` to receive the adapter via `fastify.decorate('storage', adapter)` (or constructor injection — your call on the DI pattern). No handler should import `store.ts` functions directly for persistent operations after Sprint 5.

The volatile in-memory state (`clients`, `trackLocks`, `transport.playing`, `transport.playheadBar`) stays in `store.ts` and continues to be imported directly — only the persistent entity helpers move to the adapter.

### 7. Type compatibility check
After `prisma generate`, run `tsc --noEmit` from `server/`. The Prisma-generated types should not conflict with `server/types.ts` because they are internal to `server/storage/`. If there are conflicts, the adapter's return types must be mapped to the `server/types.ts` shapes (not the other way around — `types.ts` is the contract).

---

## Open questions for PM or Backend Engineer to resolve before Sprint 5 starts

1. **`totalBars` on Session:** Added to the schema with a default of 128. Confirm: is this a user-settable arrangement length, or should it be inferred from the max clip end position? If inferred, remove the column.

2. **Guest user lifecycle:** `User` has `deletedAt` for soft delete. Do guest users get cleaned up automatically after their session expires? If yes, a scheduled job is needed — flag this as a chore issue.

3. **AudioFile session scope vs. user library:** The current schema scopes `AudioFile` to a session (`sessionId` is required). If users should be able to reuse audio files across sessions (a user library), `sessionId` should be nullable and a join table added. Confirm before implementing the upload endpoint in Sprint 8.

4. **Plugin order gap management:** When a plugin is removed from the middle of a chain, `Plugin.order` values become non-contiguous. Does the application normalize gaps on delete (extra UPDATE sweep) or accept gaps? Recommendation: accept gaps — use `ORDER BY order ASC` for display and only normalize on explicit "reorder" operations.
