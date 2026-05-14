# Handoff: Sprint 2 — WebSocket Transport Sync and Presence

**Author:** Backend Engineer
**Date:** 2026-05-14
**Status:** Ready for Tech Lead review
**GitHub issue:** #19

---

## What was built

Three files in `server/`:

| File | Change |
|------|--------|
| `server/types.ts` | Added `ClientMeta`, `SessionState`, `WsClientMessage`, `WsBroadcast`. Deprecated `WsMessage` / `WsMessageInbound` with forward-compat aliases. |
| `server/store.ts` | New — in-memory `Map<sessionId, SessionState>` with helpers: `getOrCreateSession`, `addClient`, `removeClient`, `updateTransport`, `getClients`. |
| `server/ws/handler.ts` | Replaced echo stub with full message routing: join/leave lifecycle, all transport events, presence fan-out. |

`tsc --noEmit` passes with zero errors.

---

## WebSocket connection

```
ws://localhost:3001/ws?sessionId=<id>&ticket=<one-time-ticket>
```

The ticket is obtained from `POST /api/v1/sessions/:id/join` → `wsTicket` field.
For local dev: `ticket=dev` is accepted (no validation yet — TODO for auth sprint).

On connect, the server immediately sends a `session.snapshot` frame to the joining client.

---

## Message shapes — what the Frontend Engineer needs to stub

### Client sends (no `from` field — server stamps it)

```ts
interface WsClientMessage {
  type: string;
  sessionId: string;
  payload: unknown;
}
```

### Server broadcasts

```ts
interface WsBroadcast<T = unknown> {
  type: string;
  sessionId: string;
  from: string;    // userId — server-stamped, never trust client value
  payload: T;
  ts: number;      // epoch ms
}
```

---

## Event catalogue

### Client → Server

| `type` | `payload` shape | Notes |
|--------|----------------|-------|
| `session.join` | `{}` | Re-announce after reconnect. Snapshot is sent at WS connect time, not on this event. |
| `session.leave` | `{}` | Explicit leave. Departure is also broadcast on WS close. |
| `transport.play` | `{ playheadBar?: number, bpm?: number }` | Both fields optional — server uses stored values as fallback. |
| `transport.pause` | `{}` | Preserves playhead position. |
| `transport.stop` | `{}` | Alias for pause (DAW convention — stop does not RTZ). |
| `transport.seek` | `{ playheadBar: number }` | |
| `transport.bpm_change` | `{ bpm: number }` | |
| `presence.update` | `CollaboratorPresence` | Fanned out to all other clients. Not persisted. Throttle to 1/100 ms at sender. |

### Server → Client

| `type` | `payload` shape | Who receives |
|--------|----------------|-------------|
| `session.snapshot` | `{ transport: TransportState, collaborators: Collaborator[] }` | Joining client only — sent immediately on WS connect |
| `transport.state_sync` | `TransportState` | All clients in session |
| `presence.joined` | `{ collaborator: Collaborator }` | All clients except the joiner |
| `presence.left` | `{ userId: string }` | All remaining clients |
| `presence.update` | `CollaboratorPresence` | All clients except the sender |

---

## Key type shapes (copy these into `src/shared/types.ts`)

```ts
interface TransportState {
  playing: boolean;
  recording: boolean;
  playheadBar: number;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  syncedAt: number; // epoch ms — use for client drift correction
}

// Client drift correction when playing === true:
// currentBar = playheadBar + ((Date.now() - syncedAt) / 1000) * (bpm / 60 / 4)

interface Collaborator {
  userId: string;
  displayName: string;
  color: string;
  role: "owner" | "collaborator" | "viewer";
  isGuest: boolean;
}

interface CollaboratorPresence {
  userId: string;
  playheadBar: number;
  cursorTrackId: string | null;
  isRecording: boolean;
  updatedAt: number; // epoch ms
}
```

---

## Frontend stubs needed (per spec)

1. **`WsContext`** — React context that manages WS connection lifecycle and dispatches inbound `WsBroadcast` frames to the appropriate state slices. Stub version wraps no-ops and local state mutations.

2. **`useTransport(sessionId)`** — wraps existing `useState` for `playing`, `bpm`, `playheadBar`. On connect, seed from `session.snapshot.transport`. Listen for `transport.state_sync` to update.

3. **`usePresence(sessionId)`** — collects `CollaboratorPresence` per userId. Seed from `session.snapshot.collaborators`. Update on `presence.joined`, `presence.left`, `presence.update`.

4. **Drift correction** — implement `currentBar` formula above when `TransportState.playing === true`. Use `syncedAt` from the last `transport.state_sync` frame.

---

## Design decisions and trade-offs

**Session pruning:** Sessions with zero clients are removed from the in-memory map immediately. This prevents memory leaks on long-running servers at the cost of losing transport state when the last client disconnects. For the prototype this is acceptable; production would persist state to the database before pruning.

**Double-leave guard:** `handleLeave` is called both on `session.leave` message and on WS `close`. `removeClient` is idempotent — if the client was already removed (e.g., via explicit leave before disconnect), the second call is a no-op. The `presence.left` broadcast fires twice only if the client sends `session.leave` and then closes the socket — this is a known benign duplicate for the prototype. Production would add a "leaving" flag to `ClientMeta`.

**`from: "server"` on `session.snapshot`:** The snapshot is emitted before any userId-bearing message is processed. Using the string literal `"server"` as the `from` field for this one system event is intentional — the frontend should treat `from === "server"` as a system event, not a peer action.

**No ticket validation yet:** The WS ticket query param is present and logged but not validated. Auth sprint will validate against a one-time-token store with 30-second TTL. Until then, any connection with a `?ticket=` param is accepted.

**Track lock release on disconnect:** The `close` handler calls `handleLeave` which removes the client from the store. Track lock release (needed when track locking lands) should be added to `handleLeave` — the hook is already there with a TODO comment.

---

## Files touched

- `/Users/lukesydow/daw-design/server/types.ts`
- `/Users/lukesydow/daw-design/server/store.ts` (new)
- `/Users/lukesydow/daw-design/server/ws/handler.ts`
