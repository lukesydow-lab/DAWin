# Handoff: Comments Backend — FR-06 Session Communication + Inline Comments

**Date:** 2026-05-15
**Agent:** Backend Engineer
**Sprint:** 3
**ADR:** ADR-003 — Unified Comment Anchor Model
**Status:** Complete — tsc --noEmit passes with zero errors

---

## Files changed

- `server/types.ts` — added `comments: SessionComment[]` to `SessionState` interface
- `server/store.ts` — initialized `comments: []` in `getOrCreateSession`; added `addComment`, `getComments`, `resolveComment`, `reopenComment`, `addReply`, `deleteComment` store functions
- `server/ws/handler.ts` — added exported `broadcastCommentEvent(type, sessionId, fromUserId, payload)` helper
- `server/routes/comments.ts` — new file; all six comment endpoints
- `server/index.ts` — registered `commentRoutes`

---

## REST endpoints

All paths are under `/api/v1/sessions/:sessionId/`.

### POST `/api/v1/sessions/:sessionId/comments`

Create a new comment.

**Auth:** `Authorization: Bearer <token>` required. Role `viewer` → 403.

**Request body:**
```json
{
  "body": "string (non-empty)",
  "anchor": {
    "anchorType": "timeline | timeRange | track | clip | trackMoment",
    "startBar": 8,
    "endBar": 16,
    "trackId": "t1",
    "clipId": "c3",
    "threadId": "optional-comment-id"
  }
}
```

`anchor` invariants enforced server-side (per ADR-003):
- `timeline | trackMoment | timeRange` → `startBar` required
- `timeRange` → `endBar` required, `endBar > startBar`
- `track | clip | trackMoment` → `trackId` required
- `clip` → `clipId` required (always paired with `trackId`)

**Response 201:**
```json
{ "data": { /* SessionComment */ } }
```

**WS broadcast:** `comment.add` — full `SessionComment` payload to all WS clients in session.

---

### GET `/api/v1/sessions/:sessionId/comments`

Fetch all comments for a session. No auth required.

**Query param:** `?status=open|resolved|all` (default: `all`)

**Response 200:**
```json
{ "data": [ /* SessionComment[] */ ] }
```

No WS event.

---

### DELETE `/api/v1/sessions/:sessionId/comments/:commentId`

Delete a comment.

**Auth:** Bearer token required.
- `viewer` → 403
- `collaborator` → may only delete their own comments (token `sub === comment.authorId`); otherwise 403
- `owner` → may delete any comment

**Response 204** (no body) on success.
**404** if comment not found.

No WS event on delete (frontend removes from local state on 204).

---

### PATCH `/api/v1/sessions/:sessionId/comments/:commentId/resolve`

Mark a comment as resolved.

**Auth:** Bearer token required. `viewer` → 403.

**Response 200:**
```json
{ "data": { /* SessionComment with status: "resolved" */ } }
```

**WS broadcast:** `comment.resolve`
```json
{
  "commentId": "string",
  "resolvedBy": "userId",
  "resolvedAt": "ISO 8601 string"
}
```

---

### PATCH `/api/v1/sessions/:sessionId/comments/:commentId/reopen`

Reopen a resolved comment.

**Auth:** Bearer token required. `viewer` → 403.

**Response 200:**
```json
{ "data": { /* SessionComment with status: "open" */ } }
```

**WS broadcast:** `comment.reopen`
```json
{ "commentId": "string" }
```

---

### POST `/api/v1/sessions/:sessionId/comments/:commentId/replies`

Add a reply to an existing comment thread.

**Auth:** Bearer token required. `viewer` → 403.

**Request body:**
```json
{ "body": "string (non-empty)" }
```

**Response 201:** the updated parent `SessionComment` (with `replies[]` appended):
```json
{ "data": { /* SessionComment */ } }
```

**WS broadcast:** `comment.reply`
```json
{
  "commentId": "string",
  "reply": {
    "id": "uuid",
    "commentId": "string",
    "authorId": "userId",
    "body": "string",
    "createdAt": "ISO 8601"
  }
}
```

---

## WebSocket broadcast events

All outbound frames use `WsBroadcast<T>`:
```ts
{
  type: string;
  sessionId: string;
  from: UserId;   // server-stamped from token sub
  payload: T;
  ts: number;    // epoch ms
}
```

| Event type | Payload type | Who receives it |
|---|---|---|
| `comment.add` | `SessionComment` | All WS clients in session |
| `comment.reply` | `CommentReplyPayload` | All WS clients in session |
| `comment.resolve` | `CommentResolvePayload` | All WS clients in session |
| `comment.reopen` | `CommentReopenPayload` | All WS clients in session |

**Important:** `comment.add` is NOT echoed back to the originating HTTP client. The REST 201 response is the ack for the creator. Other open tabs receive the WS event and append to their local comment state. This prevents duplicate renders.

---

## `SessionState.comments` initialization

`comments: SessionComment[]` is appended to `SessionState` (declared in `server/types.ts`).

- Initialized as `[]` in `getOrCreateSession` in `server/store.ts`.
- State is in-memory only — lost on server restart.
- This is intentional for the prototype. See ADR-003, Decision 2.
- Migration path: in Sprint 5+, replace `comments: SessionComment[]` in `SessionState` with a storage adapter interface. REST handler and WS broadcast call sites do not change.

---

## Frontend stub checklist

The Frontend Engineer (comment UI) needs to:

1. Copy `CommentAnchor`, `SessionComment`, `CommentReply`, `CommentReplyPayload`, `CommentResolvePayload`, `CommentReopenPayload`, `CommentId` from `server/types.ts` into `src/App.tsx` (or `src/shared/types.ts` when that file exists).
2. On `GET /api/v1/sessions/:sessionId/comments?status=open` on mount — seed local comment state.
3. Wire WS handlers per ADR-003, Decision 4:
   - `comment.add` → append `SessionComment` to local state
   - `comment.reply` → find matching thread by `commentId`, append `reply` to `replies[]`
   - `comment.resolve` → find by `commentId`, set `status: 'resolved'`, `resolvedBy`, `resolvedAt`
   - `comment.reopen` → find by `commentId`, set `status: 'open'`, clear `resolvedBy`/`resolvedAt`
4. Handle `403` on any mutation with a status bar ephemeral message (existing `STATUS_BAR_H = 28px` bar).
5. Do not hide comment controls based on role alone — the server is authoritative (ADR-003, Decision 6).

---

## Error response shape

```json
{ "error": "error_code", "message": "Human-readable description" }
```

HTTP status codes used: 200, 201, 204, 400, 401, 403, 404.
