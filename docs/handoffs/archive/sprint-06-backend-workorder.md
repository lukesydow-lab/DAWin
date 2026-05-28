# Sprint 6 — Backend Engineer Work Order
# File Storage: Cloudflare R2 + First Real Database Migration

**Written by:** PM (Luke)  
**Date:** 2026-05-18  
**For:** Backend Engineer agent  
**Sprint:** 6  
**Status:** Ready to execute

---

## Context and goal

Sprint 5 built the full persistence layer (Prisma schema, StorageAdapter interface, two adapter implementations) but never connected it to real infrastructure. The server still boots with `InMemoryStorageAdapter` — no PostgreSQL, no file storage.

Sprint 6 makes it real:

1. Run the first Prisma migration against a real PostgreSQL database
2. Switch the server from `InMemoryStorageAdapter` to `PrismaStorageAdapter`
3. Integrate Cloudflare R2 for audio file storage
4. Build the audio upload endpoint and presigned streaming URL endpoint

After Sprint 6, a developer can run `docker compose up`, join a session, upload a real audio file, and play it back from R2.

---

## Architecture decisions (already made — do not revisit)

| Decision | Choice | Source |
|---|---|---|
| Database | PostgreSQL + Prisma | ADR-004 |
| File storage provider | Cloudflare R2 | PM decision 2026-05-18 |
| Audio tiers | s3StreamKey (permanent, all platforms) + s3FullKey (nullable, desktop relay only) | ADR-004 Q3, schema.prisma |
| Adapter pattern | route handlers call StorageAdapter interface — never prisma directly | Sprint 5 / adapter.ts |
| ID format | cuid() | ADR-004 |

**Why Cloudflare R2:**  
Zero egress fees. For an audio streaming app, egress is the dominant cost — R2 eliminates it. S3-compatible API means the AWS SDK works unchanged; only credentials and endpoint differ.

---

## Source of truth files to read before starting

Read these before writing a single line of code:

- `server/storage/adapter.ts` — StorageAdapter interface (the only contract route handlers depend on)
- `server/storage/memory-adapter.ts` — reference implementation; prisma-adapter must satisfy the same interface
- `server/storage/prisma-adapter.ts` — stub implementation from Sprint 5; you are completing this
- `server/prisma/schema.prisma` — canonical schema; all migrations must derive from this
- `server/index.ts` — where the adapter is instantiated; this is where you switch from memory→prisma
- `server/routes/sessions.ts` — example of a route that calls adapter methods
- `server/types.ts` — SessionComment, CommentAnchor, and other domain types

---

## Work items

### 6-A: Run the first Prisma migration (connect real PostgreSQL)

**Goal:** `prisma migrate dev` produces a clean baseline migration. Server boots against a real DB.

**Steps:**
1. Confirm `server/prisma/schema.prisma` matches the canonical schema (it should — read it first to verify).
2. From `server/`, run:
   ```bash
   npx prisma migrate dev --name init
   ```
   This generates `server/prisma/migrations/0001_init/migration.sql` and applies it.
3. Confirm `server/prisma/client/` is generated (or `node_modules/.prisma/client/`).
4. In `server/index.ts`, change adapter instantiation:
   ```ts
   // Before:
   import { InMemoryStorageAdapter } from './storage/memory-adapter.js';
   const adapter = new InMemoryStorageAdapter();

   // After:
   import { PrismaStorageAdapter } from './storage/prisma-adapter.js';
   const adapter = new PrismaStorageAdapter();
   ```
5. Ensure the dev environment has `DATABASE_URL` in `.env` pointing to the local PostgreSQL instance (docker-compose already ships this — confirm it is wired).
6. Boot the server. It must start without errors when `DATABASE_URL` is reachable.

**Acceptance criteria:**
- `npx prisma migrate status` shows no pending migrations
- `tsc --noEmit` passes
- Server boots and logs "Using PrismaStorageAdapter" (add a startup log line)
- `POST /api/v1/sessions` creates a row visible in `psql`
- `GET /api/v1/sessions/:id` reads it back correctly

**Files touched:** `server/index.ts`, `server/prisma/migrations/` (generated), `server/storage/prisma-adapter.ts` (complete the stub)

---

### 6-B: Complete PrismaStorageAdapter

**Goal:** Every method in `StorageAdapter` is implemented in `PrismaStorageAdapter`. The adapter is tested against the same contract as `InMemoryStorageAdapter`.

**Key implementation notes:**

- **Comments:** `getComments` must return `SessionComment[]` shape (see `server/types.ts`). Map Prisma rows to that shape — do not leak Prisma types to callers.
- **Soft deletes:** All queries on `Comment` and `CommentReply` must filter `WHERE deletedAt IS NULL`. Use `{ deletedAt: null }` in Prisma `where` clauses.
- **resolveComment / reopenComment:** These are atomic updates — use `prisma.comment.update` with a single call, not read-then-write.
- **addReply:** Must be a Prisma transaction that both creates the reply and returns the updated parent comment in a single DB round-trip.
- **AudioFile.fileSizeBytes is BigInt:** Prisma returns BigInt for this field. When serializing to JSON (including in API responses), convert with `.toString()` — JSON does not support BigInt.
- **Plugin order:** Always `orderBy: { order: 'asc' }`. Do not re-pack gaps. See ADR-004 Q4.
- **timeSignature:** Stored as JSON in DB. When reading, assert the shape `{ numerator: number; denominator: number }` — Prisma returns `JsonValue`.

**Acceptance criteria:**
- All StorageAdapter interface methods have a non-stub implementation
- `tsc --noEmit` passes with strict mode
- Boot test: `POST /sessions → GET /sessions/:id` round-trips correctly through Prisma

---

### 6-C: Cloudflare R2 integration (upload endpoint)

**Goal:** Build `POST /api/v1/sessions/:sessionId/audio` — accepts a multipart audio file upload, stores it in R2 as the streaming copy (s3StreamKey), creates an AudioFile DB row, and returns the new AudioFileRow.

**R2 setup:**

R2 is accessed via the AWS SDK v3 with a custom endpoint. Add to `server/package.json` (or the root package.json):
```
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```

Required environment variables (add to `.env.example`):
```
R2_ACCOUNT_ID=       # Cloudflare account ID
R2_ACCESS_KEY_ID=    # R2 API token access key
R2_SECRET_ACCESS_KEY=# R2 API token secret
R2_BUCKET_NAME=      # e.g. "dawin-audio-dev"
R2_PUBLIC_URL=       # e.g. "https://<bucket>.<accountid>.r2.cloudflarestorage.com"
                     # or custom domain if configured
```

R2 S3Client configuration:
```ts
import { S3Client } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

Put this in `server/r2.ts`. Do not inline it in the route.

**Upload endpoint: `POST /api/v1/sessions/:sessionId/audio`**

- Auth: JWT required (same middleware as other authenticated routes). Role must be `owner` or `collaborator` — viewers may not upload.
- Accepts: `multipart/form-data` with field `file` (audio file binary)
- Validation:
  - `sessionId` must exist in DB (404 if not)
  - `file` must be present
  - `mimeType` must be one of: `audio/wav`, `audio/ogg`, `audio/mpeg`, `audio/flac`, `audio/aac` — return 415 if not
  - Max file size: 500MB (enforce at the multipart parser level, not post-hoc)
- Processing:
  1. Generate a unique S3 key: `audio/${sessionId}/${cuid()}.${ext}` where `ext` is derived from mimeType
  2. Upload the file buffer to R2 using `PutObjectCommand`
  3. In a Prisma transaction, create the `AudioFile` row with the `s3StreamKey`
  4. Return the `AudioFileRow` as JSON (200)
- `s3FullKey`: Leave `null` on upload — this is set by the desktop client flow (Sprint 9), not by the web upload endpoint
- `durationSec` and `sampleRate`: These must be extracted from the file. Use `music-metadata` (npm) to parse audio file headers — do not trust client-provided values. Add `music-metadata` to dependencies.
- `fileSizeBytes`: Use the actual byte length of the received buffer (BigInt).

**Error responses:**
```
400 Bad Request     — missing file field
403 Forbidden       — viewer role
404 Not Found       — sessionId doesn't exist
413 Payload Too Large — file > 500MB
415 Unsupported Media Type — bad mimeType
500 Internal Server Error  — R2 upload or DB write failed (log the error; do not expose internal details)
```

**Success response (200):**
```json
{
  "id": "cuid...",
  "sessionId": "cuid...",
  "uploaderId": "cuid...",
  "s3StreamKey": "audio/sessionId/cuid.wav",
  "s3FullKey": null,
  "mimeType": "audio/wav",
  "durationSec": 4.23,
  "sampleRate": 44100,
  "channels": 2,
  "fileSizeBytes": "2345678"    ← serialized as string (BigInt)
}
```

**Files touched:**
- `server/r2.ts` — new file, R2 S3Client singleton
- `server/routes/audio.ts` — new file, upload endpoint
- `server/index.ts` — register `audioRoutes` with Fastify

---

### 6-D: Presigned streaming URL endpoint

**Goal:** `GET /api/v1/audio/:audioFileId/stream-url` returns a short-lived presigned R2 URL that the client can use to fetch or stream the audio file.

**Why presigned URLs:**  
Audio files must not be publicly accessible by default. The URL must be authenticated at request time, not embedded in HTML. Presigned URLs expire after a configurable TTL — clients re-request when the URL is near expiry.

**Endpoint:**

```
GET /api/v1/audio/:audioFileId/stream-url
```

- Auth: JWT required. Any role may stream audio (viewer, collaborator, owner) provided they are a member of the session.
- Logic:
  1. Load `AudioFile` by `audioFileId` — 404 if not found
  2. Verify requesting user is a member of `audioFile.sessionId` — 403 if not
  3. Generate a presigned `GetObjectCommand` URL for `s3StreamKey` with TTL = 3600 seconds (1 hour)
  4. Return `{ url: string; expiresAt: string }` (ISO 8601 timestamp)
- Do NOT return `s3FullKey` presigned URLs from this endpoint — full-quality relay is desktop-only and handled separately

**Success response (200):**
```json
{
  "url": "https://<r2-endpoint>/audio/sessionId/cuid.wav?X-Amz-Signature=...",
  "expiresAt": "2026-05-18T15:00:00.000Z"
}
```

**Files touched:** `server/routes/audio.ts` (add to same file as upload), `server/index.ts` (already registered)

---

### 6-E: Environment and local dev wiring

**Goal:** A developer can `docker compose up` + set four R2 env vars and have a fully functional local backend.

**Steps:**
1. Confirm `docker-compose.yml` has a `postgres` service with `DATABASE_URL` set for the app service. If not, add it:
   ```yaml
   postgres:
     image: postgres:16-alpine
     environment:
       POSTGRES_DB: dawin
       POSTGRES_USER: dawin
       POSTGRES_PASSWORD: dawin_dev
     ports:
       - "5432:5432"
   ```
2. Add R2 variables to `.env.example` (committed) — never commit `.env` with real credentials.
3. Update `README.md` (or `docs/guides/local-setup.md` if it exists) with:
   - How to start the local DB: `docker compose up -d postgres`
   - How to run the first migration: `cd server && npx prisma migrate dev`
   - What R2 env vars are needed and where to get them
4. Confirm `server/index.ts` has the startup health check from Sprint 5 (5-H): logs a clear error and exits non-zero if `DATABASE_URL` is set but DB is unreachable.

---

## Acceptance criteria — Sprint 6 exit

- [ ] `prisma migrate status` shows no pending migrations against a live PostgreSQL instance
- [ ] Server boots with `PrismaStorageAdapter` (not in-memory)
- [ ] `POST /api/v1/sessions` and `GET /api/v1/sessions/:id` round-trip through Prisma correctly
- [ ] `POST /api/v1/sessions/:sessionId/audio` uploads a WAV file and returns `AudioFileRow` with correct metadata
- [ ] `GET /api/v1/audio/:id/stream-url` returns a presigned R2 URL that resolves the file
- [ ] Viewer JWT receives 403 on upload; member JWT receives 403 on stream-url for a session they don't belong to
- [ ] `tsc --noEmit` passes
- [ ] `.env.example` documents all required environment variables
- [ ] `docs/guides/local-setup.md` exists with runbook for first-time setup

---

## What this sprint does NOT include

- Desktop full-quality relay (`s3FullKey`) — that is Sprint 9 desktop integration
- Audio playback in the browser — that is Sprint 7 (audio file drag-and-drop to timeline)
- Clip creation from the uploaded file — that is Sprint 7
- Transcoding or format normalization — out of scope; clients upload the format they have, server stores it as-is
- CDN distribution — R2 public bucket URL serves as CDN for now; custom CDN domain is a post-beta optimization

---

## Commit protocol

Every commit must:
1. Pass `tsc --noEmit`
2. Commit message: `feat: <what and why>` or `chore: <what>`
3. Include: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

After completing all work items, drop a handoff file at `docs/handoffs/sprint6-backend-complete.md` and update `STATUS.md` Active Work → Done table.
