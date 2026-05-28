# Track Locking + JWT Role Enforcement — Backend Handoff

**Sprint:** 2 (final item)
**Date:** 2026-05-15
**Author:** Backend Engineer agent

---

## What was implemented

### `server/jwt.ts` (new file)

JWT sign/verify using `jose` v5 (HS256).

- `signToken(claims)` — issues a token with `8h` expiry for regular users, `72h` for guests.
- `verifyToken(token)` — throws on invalid/expired tokens; callers handle the error and return 401.
- Secret resolved from `JWT_SECRET` env var at module load. Falls back to `'dawin-dev-secret-change-in-prod'` with a `console.warn` if unset.

### `server/types.ts`

- `SessionState` now includes `trackLocks: Map<TrackId, UserId>` — the live in-memory lock table for a session.
- Added `TrackArmPayload` and `TrackArmRejectedPayload` for the new WS message types.

### `server/store.ts`

`trackLocks: new Map()` initialised in `getOrCreateSession`. Three new exports:

| Function | Description |
|---|---|
| `acquireTrackLock(sessionId, trackId, userId)` | Returns `true` if lock acquired or already held by same user; `false` if held by another user. |
| `releaseTrackLock(sessionId, trackId, userId)` | Returns `true` if released; `false` if not locked by this user (idempotent). |
| `releaseAllLocksForUser(sessionId, userId)` | Releases all locks for the user; returns the list of released `trackId`s. Called on WS disconnect. |

### `server/routes/auth.ts`

Three endpoints now functional (three remain 501 stubs):

**`GET /api/v1/auth/me`** — extracts `Authorization: Bearer <token>`, calls `verifyToken`, returns `MeResponse`. Returns 401 if header missing or token invalid/expired.

**`POST /api/v1/auth/login`** — body: `{ email: string, password: string }`. Prototype accepts any non-empty credentials. Role determined by a hardcoded map:
- `dev@dawin.local` → `owner`
- `collab@dawin.local` → `collaborator`
- anything else → `viewer`

Returns `{ data: { token, userId, role, color, displayName, isGuest } }`.

**`POST /api/v1/auth/guest`** — no body required. Generates a `guest-<uuid>` userId, issues a JWT with `role: viewer, isGuest: true`. Guest tokens expire after 72 hours.

### `server/ws/handler.ts`

Two new inbound message types routed in the switch:

**`track.arm`** — payload: `{ trackId: string }`
1. If sender's role is `viewer`: send `track.arm_rejected { trackId, reason: 'forbidden' }` to the requesting client only. No broadcast.
2. If another user holds the lock: send `track.arm_rejected { trackId, reason: 'locked' }` to requesting client only. No broadcast.
3. Otherwise: acquire lock, broadcast `track.locked { trackId }` to ALL clients in session (including sender).

**`track.disarm`** — payload: `{ trackId: string }`
1. Call `releaseTrackLock`. Idempotent — no error if not locked by sender.
2. Broadcast `track.unlocked { trackId }` to ALL clients.

**On disconnect (`socket.on('close', ...)`)**:
1. Call `releaseAllLocksForUser` to get the list of freed tracks.
2. Broadcast `track.unlocked { trackId }` to remaining clients for each freed track (before `handleLeave` removes the disconnecting client, using `skipClientId` so the dead socket is skipped).
3. Then call `handleLeave` as before.

---

## Environment variable requirement

| Var | Required | Default (dev only) |
|---|---|---|
| `JWT_SECRET` | Yes in production | `dawin-dev-secret-change-in-prod` |

Set `JWT_SECRET` to a cryptographically random string (32+ bytes) before any non-local deployment. The server logs a warning at startup if the fallback is used.

---

## WebSocket message contract

### Inbound (client → server)

| type | payload fields | notes |
|---|---|---|
| `track.arm` | `{ trackId: string }` | Arm request; triggers role + lock check |
| `track.disarm` | `{ trackId: string }` | Release arm lock |

### Outbound (server → client)

| type | payload fields | recipients | notes |
|---|---|---|---|
| `track.locked` | `{ trackId: string }` | All clients in session | Lock successfully acquired |
| `track.unlocked` | `{ trackId: string }` | All clients in session | Lock released (disarm or disconnect) |
| `track.arm_rejected` | `{ trackId: string, reason: 'locked' \| 'forbidden' }` | Requesting client only | Arm denied |

All outbound frames follow the existing `WsBroadcast<T>` envelope: `{ type, sessionId, from, payload, ts }`. For server-initiated frames (arm_rejected, unlocked on disconnect), `from` is `"server"`.

---

## Deferred / not in scope

- **Ticket-based WS auth:** The `ticket` query param is parsed but not validated. The WS handler still uses a hardcoded `dev-user-001` identity. The JWT utilities are ready; connecting them to the upgrade flow is a follow-on task requiring a one-time ticket store.
- **`sessionId` in login/guest requests:** Both endpoints currently hardcode `'dev-session-001'`. Production needs the client to send the target `sessionId` and the server to validate membership.
- **User store / password hashing:** `POST /auth/login` accepts any non-empty password. Production needs bcrypt + a persistent user table.
- **`/auth/register`, `/auth/refresh`, `/auth/logout`:** Still return 501.
- **Lock persistence:** Locks live in the in-memory `SessionState`. A server restart clears all locks. Acceptable for prototype; a database-backed store would use a Redis lock or DB row.
- **Operational transforms / CRDT:** The lock model provides exclusive per-track locking. Last-write-wins for clip edits is unchanged; this design does not block adding OT later.
