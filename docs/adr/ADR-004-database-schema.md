# ADR-004 — PostgreSQL + Prisma Database Schema (Sprint 5)

**Status:** Accepted  
**Date:** 2026-05-17  
**Deciders:** Tech Lead  
**Affects:** Backend Engineer (Sprint 5 implementation), PM (open questions flagged below)  
**Supersedes:** —  
**Related:** ADR-003 (Comment Anchor Model), `server/types.ts` (canonical API contracts)

---

## Context

The current backend (`server/store.ts`) uses an in-memory `Map<SessionId, SessionState>`. All session, track, clip, plugin, and comment data is lost on server restart. This is acceptable for Sprint 1–4 prototyping but is not acceptable for Sprint 5 and beyond, where:

- The three-product suite (Desktop, Web, Mobile) shares one backend and needs data to persist across sessions and across client reconnections.
- User accounts must survive server restarts (auth).
- The recording pipeline (Sprint 8–9) requires atomic creation of `AudioFile` and `Clip` rows — that demands database transactions, not in-memory mutations.
- Comments are audit-relevant and cannot be lost on restart (noted as a known deficiency in ADR-003, Decision 2).

The PM has decided: **PostgreSQL + Prisma ORM** for the Sprint 5 persistence layer.

---

## Decision

**Use PostgreSQL as the persistence layer. Use Prisma ORM for schema management, migrations, and type-safe query generation. HS256 JWT auth continues unchanged — Prisma is internal to the backend layer only.**

Prisma's generated TypeScript types are used inside `server/` for database queries. They are not exported as the API surface. `server/types.ts` remains the canonical API contract shared with frontend stubs.

---

## Schema Decisions

### 1. JSONB vs. relational columns

**Rule:** Any field that has a foreign-key relationship to another entity, is queried directly in a WHERE clause, or is the target of an index gets a proper column. Opaque blobs with no query predicate get JSONB.

| Field | Storage | Reason |
|---|---|---|
| `Plugin.params` | JSONB (`Json`) | Opaque, plugin-type-specific, never queried by field |
| `CommentAnchor` | JSONB on `Comment` row | Validated as a unit in the REST handler (ADR-003); never queried by individual anchor field in the prototype |
| `Session.timeSignature` | JSONB | Two-field struct, never queried individually; always read with the session row |
| Fade curve bezier handles | JSONB on `Clip` | Future field; opaque float array, not relational |
| `SessionMember.color` | Column (String) | Per-(userId,sessionId) collaborator color — single scalar, frequently read with presence |
| `Track.sessionId`, `Clip.trackId`, etc. | Foreign key columns | Queried in every session load; indexed |

**What is NOT JSONB:** `trackId`, `clipId`, `authorId`, `sessionId`, `role`, `status`, `resolvedBy` — these are all proper columns because they are queried in WHERE clauses or JOIN conditions.

### 2. CommentAnchor storage

`CommentAnchor` is stored as a JSONB column (`anchor Json`) on the `Comment` row. Invariant validation (e.g. `timeRange` requires `endBar > startBar`, `clip` requires both `trackId` and `clipId`) is enforced in the REST handler, exactly as today. This matches ADR-003's Decision 2 and avoids a normalization that would buy nothing — no query in the system filters comments by individual anchor fields.

If a future feature requires "find all comments anchored to track X" efficiently, add a generated column + index at that point. Do not over-engineer now.

### 3. CommentReply storage

`CommentReply` is a **separate table** with a foreign key to `Comment`. It is not an embedded JSONB array on the `Comment` row.

Rationale: Replies need individual addressability — the REST API for adding a reply (`POST /comments/:id/replies`) and for WS broadcast (`CommentReplyPayload`) both operate on individual `CommentReply` objects with their own `id`. Embedding them in JSONB would require reading the full array, splicing, and writing back on every append — that's a read-modify-write pattern with no locking, which is not acceptable once multiple concurrent collaborators are posting replies. A proper row per reply gives us `INSERT` + foreign key cascade with no race condition.

### 4. Plugin chain storage

**Decision: `PluginChain` table + `Plugin` table (two relational tables).**

Alternative considered: single JSONB array on `Track`. Rejected because:
- Plugin order within a chain must be deterministic and mutable (drag to reorder is a planned feature). Storing an ordered array in JSONB and updating the order requires replacing the entire array. With a relational table, reorder is an UPDATE on an `order` column with no array replacement.
- Individual plugin enable/disable toggling requires a targeted UPDATE. With JSONB, it requires read-modify-write on the entire chain.
- Plugin params (`params: Record<string, number|string|boolean>`) remain JSONB on the `Plugin` row — that part is genuinely opaque.

`PluginChain` supports `trackId = null` for the master bus chain. This is preserved from `server/types.ts`.

`Plugin.order` is an integer column for deterministic ordering. **Gaps after deletion are accepted** — see Q4 below. The application layer always queries with `ORDER BY order ASC`; it does not re-pack order values.

### 5. Session memberships

`SessionMember` is a junction table: `(userId, sessionId)` composite unique constraint, plus `role` and `color` columns.

`color` is per-(userId, sessionId) — not per-user globally. This matches the existing `Collaborator.color` field and the JWT `JwtClaims.color` field. The User table does not have a `color` column.

`role` is stored as a String enum matching `"owner" | "collaborator" | "viewer"` — not a PostgreSQL ENUM type. Rationale: PostgreSQL ENUMs require a migration to add values; a String + application-layer validation is cheaper to evolve in a prototype.

### 6. Transport state — what persists

**Persisted** (on the `Session` row): `bpm`, `timeSignature`, `totalBars`.

**Not persisted** (in-memory `SessionState` only): `playing`, `recording`, `playheadBar`, `syncedAt`.

Rationale: `playing`, `playheadBar`, and `syncedAt` are volatile — they change with every transport tick. Writing them to the DB on every tick would saturate connection pool bandwidth with no benefit. On server restart, transport begins paused at bar 0, which is the correct UX behavior (a collaborator rejoining a session should not auto-play). `bpm` and `timeSignature` are arrangement metadata and must persist; they are also the only transport fields that REST clients need.

### 7. Soft deletes

**Soft deletes on all audit-relevant entities**: `Session`, `Comment`, `CommentReply`, `User`.

**Hard deletes acceptable for**: `Track`, `Clip`, `Plugin`, `PluginChain`, `SessionMember` — these have no audit requirement in the current spec, and hard deletes simplify query logic significantly (no `WHERE deletedAt IS NULL` on every arrangement query).

If a track deletion audit trail is requested in a future sprint, add `deletedAt` at that point via migration.

### 8. ID strategy

**`cuid()` for all entity IDs.** Rationale:
- The current `server/types.ts` uses `string` IDs throughout — `cuid()` is compatible.
- `cuid()` is URL-safe and shorter than UUID (25 chars vs 36), which matters for deep link query params (FR-07).
- `cuid()` is collision-resistant at prototype scale without coordination.
- `autoincrement` is rejected: integer IDs in URLs are enumerable, which is a minor security concern even in a prototype.
- UUIDv4 is acceptable but offers no advantage over `cuid()` at this scale and is less ergonomic in URLs.

---

## Migration Path from In-Memory Store

### Storage adapter pattern

`server/store.ts` currently exports named functions (`addComment`, `getComments`, `resolveComment`, etc.) that operate directly on the `Map<SessionId, SessionState>`. REST handlers and WS broadcast call sites import these functions directly.

**The migration does not change any call site.** Instead:

1. Define a `StorageAdapter` interface in `server/storage/adapter.ts` with the same function signatures as the current store exports for persistent entities:
   ```
   interface StorageAdapter {
     // Session
     getSession(id): Promise<Session | null>
     createSession(data): Promise<Session>
     // Track
     getTracks(sessionId): Promise<Track[]>
     createTrack(data): Promise<Track>
     updateTrack(id, patch): Promise<Track>
     // Clip
     getClips(sessionId): Promise<Clip[]>
     createClip(data): Promise<Clip>
     updateClip(id, patch): Promise<Clip>
     // Comments
     getComments(sessionId): Promise<SessionComment[]>
     addComment(sessionId, comment): Promise<SessionComment>
     resolveComment(sessionId, commentId, resolvedBy): Promise<SessionComment | null>
     reopenComment(sessionId, commentId): Promise<SessionComment | null>
     addReply(sessionId, commentId, reply): Promise<SessionComment | null>
     deleteComment(sessionId, commentId): Promise<SessionComment | null>
     // AudioFile
     createAudioFile(data): Promise<AudioFile>
     getAudioFile(id): Promise<AudioFile | null>
   }
   ```

2. Implement `PrismaStorageAdapter` in `server/storage/prisma-adapter.ts` backed by the Prisma client.

3. Implement `InMemoryStorageAdapter` in `server/storage/memory-adapter.ts` that wraps the existing `server/store.ts` logic — this is the Sprint 5 fallback for unit tests and local dev without a DB.

4. The volatile in-memory state (`clients`, `trackLocks`, `transport.playing`, `transport.playheadBar`, `transport.syncedAt`) stays in `SessionState` in `server/store.ts` and is not part of the adapter interface — it is always in-memory.

5. REST handlers receive the adapter via dependency injection (pass as a parameter to the route registration function, or attach to the Fastify instance via `fastify.decorate`). No handler imports `store.ts` functions directly after Sprint 5.

**What does not change:** `SessionState` shape, WS broadcast logic, JWT auth, `server/types.ts`.

---

## Consequences

### What this makes easier
- Session data survives server restarts — collaborators can rejoin without losing their arrangement.
- The recording pipeline (Sprint 8–9) can use Prisma transactions to atomically create `AudioFile` + `Clip` rows.
- User accounts are persistent — the guest vs. authenticated user distinction can be enforced at the DB layer.
- Prisma migrations give the team a reproducible schema history.

### What this defers
- Full-text search on comments (can be added as a GIN index later).
- Per-clip waveform thumbnail storage (not in this schema — defer to Sprint 8).
- Session versioning / history (not in scope for this sprint).

### What becomes harder
- Local dev now requires a PostgreSQL instance. The Backend Engineer must update the dev setup docs and provide a `docker-compose.yml` for local Postgres.
- Integration tests that previously ran against the in-memory store need either a test database or a mock of `StorageAdapter`. The `InMemoryStorageAdapter` covers this.
- Schema changes require Prisma migrations — no more ad-hoc `types.ts` edits that instantly take effect.

---

## PM Decisions on Previously Open Questions

### Q1 — `totalBars` on Session (closed 2026-05-17)

**Decision:** `totalBars Int @default(128)` stays as-is. Default of 128 bars is correct. A `PATCH /api/v1/sessions/:id` endpoint will expose it for user adjustment — that endpoint is not in Sprint 5 scope. No schema change needed.

### Q2 — Guest user lifecycle (closed 2026-05-17)

**Decision:** Two-tier lifecycle, intentional growth hook.

- **Guests who never create an account:** data purged 14 days after guest creation. A nudge email goes to the registered email (if any) at day 12 ("your session expires in 2 days — create a free account to save it").
- **Guests who convert to a free account:** account and session data preserved for 12 months from last activity, matching the standard free-tier retention policy.

**Schema change required (done):** `guestExpiresAt DateTime?` added to `User`. Set to `now() + 14 days` at guest user creation. Cleared (set to `null`) when the user converts to a free account. An index on `guestExpiresAt` is added so the purge job can efficiently range-scan expired rows.

**Purge job pattern (Backend Engineer — Sprint 5):** A scheduled cron job runs nightly:

```sql
WHERE isGuest = true
  AND guestExpiresAt < now()
  AND deletedAt IS NULL
```

Matching rows are soft-deleted (set `deletedAt = now()`). A separate S3 cleanup job handles actual asset deletion via lifecycle policy — the DB row soft-delete is the authoritative signal. **Do not implement the purge job in Sprint 5 without a separate PM-scoped work item.** Document the intended query pattern here so the Backend Engineer does not write re-numbering or GC logic ad-hoc.

**Nullable unique note:** `guestExpiresAt` is not unique — many guest rows share the same expiry date. The index is a standard B-tree range index, not a unique constraint.

### Q3 — AudioFile storage model (closed 2026-05-17)

**Decision:** Option B — S3 as temporary relay for full-quality desktop-to-desktop transfer.

When a desktop client records a full-quality audio file, it is uploaded to S3 as a **temporary relay**. Other desktop clients in the session download their copy from S3 at S3 speeds. Once the relay purpose is served, the full-quality S3 object is purged (TTL-based or after all desktop clients confirm receipt). The server is a temporary intermediary — not permanent storage — for full-quality files.

- **`s3StreamKey`** (always populated, `@unique`): Compressed/streaming copy (128 kbps AAC, Opus, etc.) used by all clients on all platforms (desktop, web, tablet, mobile). Permanent; never purged.
- **`s3FullKey`** (nullable): Full-quality relay (24-bit WAV, FLAC, etc.) for desktop-only distribution. Populated when a desktop client uploads a master. Null after the relay copy is purged, or for recordings made on web/mobile (which have no full-quality file to relay).
- **`fullQualityPurgedAt`** (nullable): Timestamp when `s3FullKey` was deleted. Null if the relay copy is still available. Tracked for operational visibility and to enable purge-job resumption logic (e.g. if a client disconnect interrupts the download, the next client can resume without waiting for a new upload).

**Design rationale:**
- **vs. WebRTC P2P:** S3 serves all desktop clients simultaneously at CDN speed after a single upload. P2P would require the recorder's home connection to serve each client individually, multiplying upload pressure by session size. S3 is operationally simpler and performs better at scale.
- **Desktop-only:** Web, tablet, and mobile clients never receive `s3FullKey`. They always play `s3StreamKey`. This is by design, not a limitation — streaming quality is sufficient for collaborative listening and mixing decisions in real time.
- **Purge strategy (deferred):** The purge job (triggered by TTL or client acknowledgement) is a Backend Engineer task in the recording pipeline sprint (Sprint 8–9), not Sprint 5. No purge logic is required in this sprint; the fields are ready for the purge job to populate and clear them later.

**Field names unambiguous:** `s3StreamKey` (permanent, all platforms) vs. `s3FullKey` (temporary, desktop only) makes the hybrid model explicit. No risk of confusion.

**Existing relations unaffected:** `Clip.assetId` is a FK to `AudioFile.id`, not to `s3Key`/`s3StreamKey`/`s3FullKey`. The schema supports both single-platform and relay-shared recordings with no change to the clip model.

### Q4 — Plugin order gap management (closed 2026-05-17)

**Decision:** Accept gaps. No re-packing after deletion.

When a `Plugin` row is deleted from the middle of a chain, the remaining rows retain their original `order` values. The application layer always fetches plugins with `ORDER BY order ASC` — display order is derived from sort position, not from the raw `order` integer value. Backend Engineer must not write re-numbering logic on delete. This is a deliberate simplification: re-packing requires an UPDATE on every row above the deleted position, which is an unnecessary write amplification for a prototype with chains of at most ~10 plugins.

If a drag-to-reorder feature is implemented, the reorder handler assigns new `order` values (e.g. values spaced by 100 to leave room for insertion) — that is the only time `order` values change in bulk.
