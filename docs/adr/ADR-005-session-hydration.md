# ADR-005 — Session Hydration Strategy on WS Join (Sprint 5)

**Status:** Accepted  
**Date:** 2026-05-18  
**Deciders:** Tech Lead  
**Affects:** Backend Engineer (task 5-A), Frontend Engineer (task 5-D)  
**Supersedes:** —  
**Related:** ADR-004 (Database Schema), `server/ws/handler.ts`, `server/store.ts`

---

## Context

After the Sprint 5 persistence layer landed, `server/ws/handler.ts` still builds `session.snapshot` from `store.ts` in-memory state. Specifically:

- `getOrCreateSession(sessionId)` creates an empty `SessionState` if one does not exist — it never reads from the database.
- `session.snapshot` returns `transport` (in-memory default, not persisted) and `collaborators` (derived from live WS connections, not DB members).
- Tracks and clips are not included in the snapshot at all; the frontend seeds its own local state from `src/App.tsx`.

This means:
1. A second browser tab joining a session gets default BPM/timeSignature rather than the saved values.
2. Tracks and clips created by one client are not visible to a newly joining client after a server restart.
3. There is no connection between the `Session`, `Track`, and `Clip` rows Prisma can now persist and the in-memory view the WS handler serves.

Sprint 5's goal is "session data survives restarts." That goal is not met until hydration is wired.

---

## Decision

**On WS `session.join`, the handler calls `fastify.storage.getSession()`, `getTracks()`, and `getClips()` to hydrate the initial snapshot before broadcasting `session.snapshot` to the joining client.**

Specifically:

1. `handleJoin` in `server/ws/handler.ts` becomes `async`. It calls `fastify.storage` for persistent session metadata (bpm, timeSignature, name, totalBars), current tracks, and current clips.
2. The `session.snapshot` payload is extended to include `{ transport, collaborators, session, tracks, clips }`. The `session` field carries the `SessionRow` shape. Tracks and clips are `TrackRow[]` and `ClipRow[]` from the adapter.
3. `store.ts` continues to own ephemeral state — live WS connections (`clients`), track arm locks (`trackLocks`), and transport playhead position. These are intentionally not persisted; they are runtime-only.
4. BPM from the DB is the authoritative initial value. Once a session is live and BPM changes, the in-memory transport state is the live authority; the DB is not updated on every BPM change (too chatty). BPM is flushed to DB on `session.leave` of the last client or on an explicit save endpoint (future sprint).
5. If `fastify.storage.getSession()` returns `null`, the WS handler responds with WS close code `4404` and a human-readable reason, rather than silently creating a blank in-memory session. This enforces the invariant that sessions are created via REST (POST /api/v1/sessions) before a WS connection is attempted.

---

## Consequences

### Positive
- A client joining an existing session gets real track and clip data immediately — no round-trip REST call needed just for initial state.
- Server restarts no longer drop session content visible to newly joining clients.
- The transport/presence ephemeral split (store.ts) vs. persistent split (storage adapter) is made explicit and documented in code.

### Negative / risks
- `handleJoin` is now async; the Fastify WS callback must be converted to async and errors must be handled (close socket on storage failure).
- The `session.snapshot` payload is larger — frontend must be updated to consume `tracks` and `clips` from the snapshot rather than only from local seed data. This is a frontend contract change: coordinate with Frontend Engineer.
- BPM flush on last-client-leave adds complexity to `handleLeave`. Defer to a follow-on task (5-B) with a TODO comment for now.

---

## Deferred / out of scope for Sprint 5

- Per-track plugin chain in the snapshot (Sprint 6+)
- Optimistic clip position updates flushed to DB on drag-end (Sprint 6+)
- BPM flush on last-client-leave (add TODO in handleLeave; flush story owned by PM)
- Session member (SessionMember) table integration — presence still derived from live WS connections for now
