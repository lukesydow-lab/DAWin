# ADR-003 — Unified Comment Anchor Model (Sprint 3)

**Status:** Accepted  
**Date:** 2026-05-15  
**Deciders:** Tech Lead  
**Affects:** Backend Engineer, Frontend Engineer (WS client), Frontend Engineer (comment UI)  
**Supersedes:** —  
**Related features:** FR-2026-05-14-06 (Session Communication + Inline Comments), FR-2026-05-14-07 (Timeline Deep Links)

---

## Context

Sprint 3 implements two features that both need a way to reference a position on the DAWin timeline:

- **FR-06** proposed `CommentAnchor` with `startTimeSec`, `endTimeSec`, `startBar`, `endBar`, and an `anchorType` union.
- **FR-07** proposed `TimelineLinkPayload` with overlapping fields (`anchorType`, `trackId`, `clipId`, `startTimeSec`, `startBar`, etc.) plus link-specific metadata (`projectId`, `sessionVersionId`, `commentThreadId`).

If each FR is implemented against its own anchor schema, a data migration is required the moment comments and deep links need to interoperate — which they do on day one (a comment contains a shareable deep link; a deep link can open a comment thread). Building two parallel reference systems is the wrong call.

The canonical data model must be decided before any agent writes code. This ADR defines it.

---

## Decision 1 — Unified `CommentAnchor` type (bar-based)

**Decision:** One canonical `CommentAnchor` type, bar-based only. `TimelineLinkPayload` is not a separate type — deep links are serialized from `CommentAnchor` plus session context via query params (see Decision 3).

**Rationale:** The entire arranger is bar-oriented. All existing clip and ruler math uses `startBar`/`durationBars` (see `Clip` in `server/types.ts`). `TransportState.playheadBar` is bar-based. Time-in-seconds is derivable from bar index and BPM — there is no scenario in the prototype where we need seconds as the primary key. Storing both is redundant and creates a consistency hazard (which wins if they disagree?). `startTimeSec` and `endTimeSec` are dropped from the canonical type.

**`anchorType` enum values and their invariants:**

| Value | Description | Required fields | Optional fields |
|---|---|---|---|
| `timeline` | A single bar position on the ruler | `startBar` | — |
| `timeRange` | A bar range on the ruler | `startBar`, `endBar` | — |
| `track` | An entire track (no time position) | `trackId` | — |
| `clip` | A specific clip | `trackId`, `clipId` | `startBar` (for seek) |
| `trackMoment` | A track at a specific bar (e.g., "bar 8 of the bass track") | `trackId`, `startBar` | — |

`endBar` must be strictly greater than `startBar` when present. `clipId` requires `trackId` — a clip without a track reference is invalid.

**Canonical TypeScript type (copy-ready for `server/types.ts` and `src/App.tsx`):**

```ts
export type CommentAnchorType =
  | 'timeline'
  | 'timeRange'
  | 'track'
  | 'clip'
  | 'trackMoment';

export interface CommentAnchor {
  anchorType: CommentAnchorType;
  /** Required for: timeline, timeRange, trackMoment, clip (optional seek hint). */
  startBar?: number;
  /** Required for: timeRange. Must be > startBar. */
  endBar?: number;
  /** Required for: track, clip, trackMoment. */
  trackId?: TrackId;
  /** Required for: clip. Always paired with trackId. */
  clipId?: ClipId;
  /**
   * Optional: ID of the comment thread associated with this anchor.
   * Used by deep links to auto-open the thread popover on navigation.
   */
  threadId?: CommentId;
}
```

The invariants above are enforced server-side in the REST handler (not in TypeScript's type system, which cannot express cross-field constraints). The backend validates before writing to the comment store.

---

## Decision 2 — Comment storage: in-memory per session

**Decision:** Option A — `comments: SessionComment[]` appended to `SessionState`. No persistence.

**Rationale:** The prototype has no database. Flat-file persistence adds implementation complexity without adding product learning. Comments are lost on server restart — this is acceptable for a prototype where sessions are short-lived and seeded. The ADR is the marker that this is temporary.

**Migration path:** When Sprint 5+ introduces a storage layer, replace the `comments` array in `SessionState` with a storage adapter interface. All REST handlers and WS event emitters call through the adapter — their call sites do not change. The adapter is the only file that changes.

**This is a temporary implementation. It must not be cited as a design precedent for durable storage.**

---

## Decision 3 — Deep link URL format

**Decision:** Query param schema appended to the current app URL.

```
?session=<sessionId>&t=<startBar>&track=<trackId>&clip=<clipId>&range=<startBar>-<endBar>&thread=<commentId>
```

**Parameter rules:**

| Param | Type | Meaning |
|---|---|---|
| `session` | string | Session ID. Ignored in prototype (single-session), included for future compatibility. |
| `t` | integer | Playhead seek target (bar number). Applied first, before any highlight. |
| `track` | string | TrackId to highlight after navigation. |
| `clip` | string | ClipId to highlight. Requires `track` to be present. |
| `range` | `<int>-<int>` | Bar range selection, e.g. `8-16`. Hyphen-separated integers. |
| `thread` | string | CommentId whose thread popover is opened on load. |

**Additive behavior:** Params compose. `?t=8&track=t3` seeks to bar 8 AND highlights track t3. There is no precedence conflict because seek and highlight are independent operations.

**Serialization:** The frontend produces deep links by reading the current anchor from a `CommentAnchor` object and mapping fields to params. No separate `TimelineLinkPayload` type is needed — the URL is the serialized form of `CommentAnchor` plus `sessionId`.

**Graceful failure:** If `clip` or `track` no longer exists in the current session state, the frontend logs a warning and skips the highlight step. It does not block playhead seek. An ephemeral status bar message is shown: `"Linked clip no longer exists in this session."` This uses the existing `STATUS_BAR_H = 28px` status bar.

---

## Decision 4 — WebSocket client architecture

**Decision:** Module-level singleton initialized lazily on first App mount, following the `_audioCtx` / `getAudioCtx()` pattern already established in `src/App.tsx`.

```ts
// Prototype — do not add a second instance anywhere
let _wsClient: WebSocket | null = null;

function getWsClient(sessionId: string, ticket: string): WebSocket {
  if (_wsClient && _wsClient.readyState === WebSocket.OPEN) return _wsClient;
  _wsClient = new WebSocket(`ws://localhost:3001/ws?sessionId=${sessionId}&ticket=${ticket}`);
  return _wsClient;
}
```

**Reconnect strategy:**
- Exponential backoff: 1 s, 2 s, 4 s, 8 s, 16 s (five attempts, then stop).
- After max attempts: set a status bar error state — `"Connection lost. Refresh to reconnect."` The status bar already exists at `STATUS_BAR_H = 28px`.
- On successful reconnect: re-subscribe to the session (send `presence.joined` frame) and request a `transport.state_sync` from the server.
- The backoff timer is cleared if the component tree unmounts (App `useEffect` cleanup).

**Sprint 3 WS events handled by the frontend:**

| Event type | Direction | Handler responsibility |
|---|---|---|
| `comment.add` | Server → Client | Append `SessionComment` to local comment state |
| `comment.reply` | Server → Client | Append `CommentReply` to the matching thread |
| `comment.resolve` | Server → Client | Update `status` to `'resolved'` on matching comment |
| `comment.reopen` | Server → Client | Update `status` to `'open'` on matching comment |
| `track.locked` | Server → Client | Already scoped (Sprint 2) |
| `track.unlocked` | Server → Client | Already scoped (Sprint 2) |
| `presence.joined` | Server → Client | Already scoped (Sprint 2) |
| `presence.left` | Server → Client | Already scoped (Sprint 2) |
| `transport.state_sync` | Server → Client | Already scoped (Sprint 2) |

The Frontend Engineer must not add event handlers outside this list without a Tech Lead review — each new event type is a contract between client and server.

---

## Decision 5 — Comment WS event payload schemas

These are the outbound broadcast shapes the server emits. The `WsBroadcast<T>` wrapper (defined in `server/types.ts`) wraps each payload — `from` and `ts` are stamped server-side.

**`comment.add`**  
Payload: the full `SessionComment` object.
```ts
// WsBroadcast<SessionComment>
```

**`comment.reply`**
```ts
export interface CommentReplyPayload {
  commentId: CommentId;
  reply: CommentReply;
}
// WsBroadcast<CommentReplyPayload>
```

**`comment.resolve`**
```ts
export interface CommentResolvePayload {
  commentId: CommentId;
  resolvedBy: UserId;
  resolvedAt: string; // ISO 8601
}
// WsBroadcast<CommentResolvePayload>
```

**`comment.reopen`**
```ts
export interface CommentReopenPayload {
  commentId: CommentId;
}
// WsBroadcast<CommentReopenPayload>
```

The server MUST NOT broadcast `comment.add` back to the originating client — the REST POST response already delivers the created `SessionComment`. Broadcasting to the originator causes a duplicate render.

---

## Decision 6 — Role enforcement for comments

**Decision:** Server-side enforcement on REST endpoints. WS handler enforces on inbound client frames that mutate comment state.

| Role | Create comment | Reply | Resolve | Reopen | Read |
|---|---|---|---|---|---|
| `owner` | yes | yes | yes | yes | yes |
| `collaborator` | yes | yes | yes | yes | yes |
| `viewer` | no | no | no | no | yes |

**Enforcement points:**
- `POST /api/v1/sessions/:id/comments` — reject with `403` if `role === 'viewer'`
- `POST /api/v1/sessions/:id/comments/:commentId/replies` — same
- `PATCH /api/v1/sessions/:id/comments/:commentId` (resolve/reopen) — same
- WS handler: if a `comment.*` inbound frame arrives from a `viewer` client, the handler discards it and emits nothing (same pattern as `track.arm` rejection).

**The frontend must not hide comment controls based on role alone.** The server is the authority. The frontend may show/hide controls as a UX optimization, but it must always handle a `403` response gracefully (show an ephemeral error in the status bar). Client-side role gating is not trust-bearing.

---

## Canonical types (copy-ready)

These types are appended to `server/types.ts` by the Tech Lead. Frontend agent copies the relevant subset to `src/App.tsx` (or `src/shared/types.ts` when that file exists).

```ts
export type CommentId = string;

export type CommentAnchorType =
  | 'timeline'
  | 'timeRange'
  | 'track'
  | 'clip'
  | 'trackMoment';

export interface CommentAnchor {
  anchorType: CommentAnchorType;
  startBar?: number;
  endBar?: number;
  trackId?: TrackId;
  clipId?: ClipId;
  threadId?: CommentId;
}

export interface CommentReply {
  id: CommentId;
  commentId: CommentId;
  authorId: UserId;
  body: string;
  createdAt: string; // ISO 8601
}

export interface SessionComment {
  id: CommentId;
  sessionId: SessionId;
  authorId: UserId;
  body: string;
  anchor: CommentAnchor;
  replies: CommentReply[];
  status: 'open' | 'resolved';
  resolvedBy: UserId | null;
  resolvedAt: string | null; // ISO 8601 or null
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// WS payload types — used with WsBroadcast<T>

export interface CommentReplyPayload {
  commentId: CommentId;
  reply: CommentReply;
}

export interface CommentResolvePayload {
  commentId: CommentId;
  resolvedBy: UserId;
  resolvedAt: string; // ISO 8601
}

export interface CommentReopenPayload {
  commentId: CommentId;
}
```

---

## Consequences

### What this makes easier
- Comments and deep links share one anchor model — a comment's anchor serializes directly to URL params with no translation layer.
- `SessionState.comments` is a simple array — no indexing complexity for the prototype.
- Role enforcement follows the existing `track.arm` pattern — the Backend agent has a working template.

### What is deferred
- **Time-based anchors:** `startTimeSec` and `endTimeSec` are explicitly dropped. If a future requirement needs time-coded anchors (e.g., for video sync), add them to `CommentAnchor` as optional fields at that point. Existing data is unaffected because bar-based fields remain the primary key.
- **Persistent storage:** Comments are lost on server restart. Sprint 5+ replaces `comments: SessionComment[]` in `SessionState` with a storage adapter. The API surface does not change.
- **Mention model:** `@mention` in comment body is stored as plain text in `body` for now. Structured mention data (array of `UserId`) can be added to `SessionComment` later without breaking existing comments.
- **Comment visibility across sessions:** Currently all comments are session-scoped. Project-level comments (spanning multiple sessions/versions) require the durable project ID that does not exist yet.

### What becomes harder
- **Bar-based anchors break on BPM change:** If BPM changes mid-session, a bar-8 anchor means a different wall-clock position. This is acceptable for the prototype (BPM is session-level and rarely changes), but must be revisited before shipping to real users.
- **Single in-memory store is not sharded:** All comments for all sessions live in the server process. This is fine for a prototype with one server node; it is a hard blocker for horizontal scaling.

---

## Next steps per agent

**Backend Engineer:**
- Add `CommentId` primitive and all new types from this ADR to `server/types.ts` (types are appended by Tech Lead — do not duplicate).
- Add `comments: SessionComment[]` to `SessionState` in `server/store.ts`.
- Implement REST endpoints: `POST /comments`, `POST /comments/:id/replies`, `PATCH /comments/:id` (resolve/reopen), `GET /comments`.
- Implement WS broadcast for `comment.add`, `comment.reply`, `comment.resolve`, `comment.reopen` using `WsBroadcast<T>`.
- Enforce role on all comment mutation endpoints — reject `viewer` with `403`.
- Do not modify `src/App.tsx`.

**Frontend Engineer (WS client):**
- Add `getWsClient()` singleton to `src/App.tsx`, following `getAudioCtx()` pattern.
- Implement reconnect with exponential backoff per Decision 4.
- Wire handlers for all Sprint 3 events listed in Decision 4.
- Read deep link params on App mount; apply seek and highlight after session state loads.
- Do not introduce a new state management library — use existing `useState`/`useEffect` pattern.

**Frontend Engineer (comment UI):**
- Use `CommentAnchor` and `SessionComment` types from `src/App.tsx` (copied from this ADR).
- Comment panel reads from local React state; WS events update that state via the WS client handlers.
- Viewer role: hide create/reply/resolve controls as a UX optimization, but handle `403` from the server gracefully.
- Do not persist anything to `localStorage` or `sessionStorage` — comments live in React state only, sourced from the server.
