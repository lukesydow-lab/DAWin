# Sprint 5 — PostgreSQL + Prisma Persistence Layer

**Agent:** Backend Engineer
**Date:** 2026-05-18
**Status:** Complete — `tsc --noEmit` passes with zero errors

---

## Files created

| File | Purpose |
|---|---|
| `server/storage/adapter.ts` | `StorageAdapter` interface + row types (`SessionRow`, `TrackRow`, `ClipRow`, `AudioFileRow`) |
| `server/storage/memory-adapter.ts` | `InMemoryStorageAdapter` — in-memory Maps for sessions/tracks/clips/audioFiles; delegates comment ops to `store.ts` |
| `server/storage/prisma-adapter.ts` | `PrismaStorageAdapter` — full Prisma implementation with soft deletes, transaction for AudioFile, and `JsonValue` → `CommentAnchor` narrowing |
| `docker-compose.yml` (repo root) | postgres:15-alpine service, port 5432, named volume `postgres_data` |
| `.env.example` (repo root) | `DATABASE_URL` and `JWT_SECRET` placeholders — not committed as `.env` |

## Files modified

| File | Change |
|---|---|
| `server/package.json` | Added `@prisma/client ^5.0.0` (dep), `prisma ^5.0.0` (devDep), `db:generate` and `db:migrate` scripts |
| `server/index.ts` | Import `StorageAdapter`, `InMemoryStorageAdapter`, `PrismaStorageAdapter`; decorate Fastify with `fastify.storage`; added `declare module "fastify"` augmentation |
| `server/routes/comments.ts` | Replaced all direct `store.ts` comment function imports with `fastify.storage.*` calls; `addComment` now passes `Omit<SessionComment, 'id'|'createdAt'|'replies'>` — ID and timestamp are assigned inside the adapter |

## Files NOT modified (read-only per work order)

- `server/types.ts`
- `server/prisma/schema.prisma`
- `server/store.ts` (no removals; existing exports intact)
- `server/ws/handler.ts`

---

## How to run locally

### 1. Start Postgres
```bash
docker-compose up -d
```

### 2. Set environment
```bash
cp .env.example .env
# Edit .env if needed — defaults work with docker-compose
```

### 3. Generate Prisma client
```bash
cd server && npm run db:generate
```

### 4. Run migrations (requires live DB)
```bash
cd server && npm run db:migrate
```

### 5. Start the server (Prisma adapter active when DATABASE_URL is set)
```bash
cd server && npm start
```

Without `DATABASE_URL` in the environment (i.e. local dev / CI without Docker), the server falls back to `InMemoryStorageAdapter` automatically — no configuration needed.

---

## Design decisions and deviations

### adapter.ts import style
`server/tsconfig.json` uses `"module": "commonjs"` with `"moduleResolution": "node"` — NOT NodeNext. Imports within `server/storage/` omit `.js` extensions (standard CommonJS). The work order said to use `.js` extensions but that is only correct for ESM/NodeNext resolution. Using `.js` with CommonJS would break at runtime.

### `addComment` signature change in comments route
The original `store.ts` `addComment(sessionId, fullComment)` accepted a pre-built `SessionComment`. The adapter's `addComment` takes `Omit<SessionComment, 'id' | 'createdAt' | 'replies'>` and assigns ID/timestamps internally — consistent with how Prisma creates rows. The route handler was updated to pass the partial shape; `randomUUID` construction was removed from the route (it now lives in the adapters).

### Prisma `Json` input casting
`CommentAnchor` is a typed interface with optional fields. Prisma's `InputJsonValue` requires an index signature. The cast `comment.anchor as unknown as Prisma.InputJsonValue` is safe because anchor validation is enforced by `validateAnchor()` in the route handler before the adapter is called.

### `createAudioFile` transaction
ADR-004 requires `createAudioFile` to use `prisma.$transaction`. The Sprint 5 implementation wraps the single `audioFile.create` in a transaction even though the correlated `clip.create` happens at a different call site. In Sprint 8-9, the recording pipeline will extend this by accepting an injected transaction client.

### `deleteComment` — returns pre-delete snapshot
The adapter captures the comment (with replies) before applying the soft-delete, then returns that snapshot. This preserves the same semantic as the old `store.ts` implementation which returned the removed object from `Array.splice`.

---

---

## Task 5-B — sessions.ts route

**Agent:** Backend Engineer
**Date:** 2026-05-18
**Status:** Complete — `tsc --noEmit` passes with zero errors

### What changed

`server/routes/sessions.ts` was rewritten to replace seed-data lookups with live `fastify.storage` calls.

- The `SEED_SESSION` constant and the hardcoded `id === 'dev-session-001'` guard were removed.
- `Session` type import was removed (no longer needed in this file); `Collaborator` is imported instead, used only for the typed empty array placeholder.
- `verifyToken` is now imported from `../jwt.js` following the same pattern used in `server/routes/auth.ts`.

### New route behavior

**GET /api/v1/sessions/:id**
- Calls `fastify.storage.getSession(request.params.id)`.
- Returns `404 { error: 'Session not found' }` when the adapter returns `null`.
- Maps `SessionRow` fields (`id`, `name`, `bpm`, `timeSignature`, `totalBars`) into the response envelope `{ data: { ... } }`.
- `collaborators` is returned as `[]` with a `// TODO: load from SessionMember table in Sprint 6` comment — no member join logic is attempted yet.

**POST /api/v1/sessions**
- Replaced the 501 stub with a full implementation.
- Extracts and verifies Bearer JWT via `verifyToken`; returns 401 on missing/invalid token.
- Returns 403 if `claims.role !== 'owner'`.
- Validates body: `name` must be a non-empty string (400 if not). `bpm` and `totalBars` are optional numbers; invalid or absent values fall back to `120` and `128` respectively.
- Calls `fastify.storage.createSession({ name, bpm, timeSignature: { numerator: 4, denominator: 4 }, totalBars })`.
- Returns 201 with `{ data: SessionRow }`.

### Edge cases noted

- **Body parsing:** Fastify does not have a JSON schema registered on this route, so the body arrives as `unknown`. The handler narrows `name` with `typeof` before use — no `any` cast.
- **`bpm` / `totalBars` coercion:** Only finite numbers pass; strings, `null`, or `NaN` fall back to defaults. This is intentional — the prototype does not reject gracefully-wrong optional fields.
- **Role check is on JWT claims only:** The `sessionId` in the claims is not validated against the created session. This is consistent with the Sprint 2–5 prototype posture. A real implementation should verify the claiming user actually owns the session they reference.
- **Collaborators in GET:** Returning `[]` is a deliberate placeholder. The `Collaborator[]` type is used so the shape is correct when Sprint 6 populates it. The frontend should not render collaborator count as authoritative until Sprint 6.

---

## Open questions for Tech Lead review

1. **`addReply` broadcast** — the updated comments route uses `updated.replies[updated.replies.length - 1]` to extract the newly added reply for the WS broadcast. With the in-memory adapter this is deterministic. With Prisma, replies are ordered by `createdAt asc` — concurrent rapid replies could theoretically produce the wrong element. Should the adapter return the new reply separately, or is this acceptable for the prototype?

2. **`InMemoryStorageAdapter` session/track/clip Maps are module-level singletons** — they persist across tests if tests import the adapter. Tech Lead may want to add a `reset()` method for test isolation before the test suite is built.

3. **No `prisma.$disconnect()` on shutdown** — `server/index.ts` has no graceful shutdown hook. For the prototype this is acceptable. Should be added before production.

4. **`DATABASE_URL` detection at startup** — the adapter is chosen once at startup; there is no runtime switching. If `DATABASE_URL` is set but the DB is unreachable, the Prisma client will fail on first query (not at startup). A startup health check against the DB is recommended before the first migration deploy.
