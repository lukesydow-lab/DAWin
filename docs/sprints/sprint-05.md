# Sprint 5 — Persistence Layer Live

**Status:** Historical Archive — remediation pending (see docs/handoffs/active/sprint-05-remediation-frontend.md)
**Last updated:** 2026-05-19
**Closed:** 2026-05-18
**Theme:** Activate the persistence layer built in Sprint 4 — session data survives server restarts, JWT roles are enforced on WS connect, and the frontend hydrates from the database rather than hard-coded seed state.
**Depends on:** Sprint 4 (Prisma schema, StorageAdapter interface, docker-compose, InMemoryStorageAdapter must all exist before Sprint 5 can run).
**Unblocks:** Sprint 6 (PrismaStorageAdapter is live; first Prisma migration and R2 integration can proceed).

---

## Goals

- Extend `session.snapshot` WS frame to include DB-backed session metadata, tracks, and clips
- Wire REST sessions endpoints to `StorageAdapter` (POST creates a DB row; GET reads from DB)
- Decode the JWT ticket on WS connect — remove hardcoded `dev-user-001` / `role: 'owner'`
- Have the frontend consume hydrated snapshot data and eliminate hard-coded seed state for tracks/clips
- Drive presence cursors from JWT-verified WS events rather than seed data
- Ship operational improvements: graceful shutdown, DB health check, `InMemoryStorageAdapter.reset()` for test isolation

---

## What Shipped

- Session hydration on WS join: `session.snapshot` extended with `session`, `tracks`, and `clips` from DB (`server/ws/handler.ts`)
- `POST /api/v1/sessions` creates a `Session` DB row; `GET /api/v1/sessions/:id` reads from DB via `StorageAdapter` (`server/routes/sessions.ts`)
- JWT ticket decoded on WS connect: `userId`, `displayName`, `color`, and `role` read from token — hardcoded `dev-user-001` / `role: 'owner'` removed (`server/ws/handler.ts`)
- Frontend snapshot handler (5-D): **NOT IMPLEMENTED** — backend sends correct `session.snapshot` payload; frontend `handleWsMessage` has no `case 'session.snapshot'`; `INITIAL_TRACKS` and `SEED_COMMENTS` still initialize state; `getWsClient` still hardcoded to `'dev-session-001'`
- Real presence cursors (5-E): **NOT IMPLEMENTED** — `presence.joined` / `presence.left` WS events trigger `console.log` only; `DEMO_PRESENCE` seed data still rendered at lines 2562, 2702, 3610
- `addReply` race condition fix; `InMemoryStorageAdapter.reset()` added for test isolation (`server/storage/memory-adapter.ts`)
- Graceful shutdown: `prisma.$disconnect()` hook on `SIGTERM`/`SIGINT` (`server/index.ts`)
- DB startup health check: clear error message and non-zero exit if `DATABASE_URL` is set but DB is unreachable (`server/index.ts`)
- VU stereo (5-I): **COSMETICALLY STEREO, METROLOGICALLY MONO** — two columns render and `levelL`/`levelR` state exists, but both are driven by the same mono `effectiveRMS` value (lines 3138–3139); no `ChannelSplitterNode` in the audio graph; 0 VU tick mark at unity gain shipped correctly
- Loop region context menu item: sets `loopStart`/`loopEnd` on clip (`src/App.tsx`)
- Inline clip Rename: context menu triggers inline text edit on clip header (`src/App.tsx`)
- **ADR-005:** Session hydration strategy on WS join — defines persistent vs. ephemeral split, snapshot payload extension contract, WS close `4404` on unknown session
- Sprint 5 UAT: PASS, zero P0/P1 defects; 6 P2/P3 defects found and fixed during UAT

---

## Deferred / Incomplete

- **5-D** — Frontend snapshot hydration: backend sends correct payload; frontend handler not implemented. Remediation work order: `docs/handoffs/active/sprint-05-remediation-frontend.md`
- **5-E** — Real presence cursors: DEMO_PRESENCE seed data still rendered; WS presence events not wired to state. Remediation work order: same file above.
- **5-I** — VU stereo: cosmetically stereo (two columns) but both channels driven by same mono signal. No ChannelSplitterNode in audio graph. P2 — does not block Sprint 6.
- `PrismaStorageAdapter` full implementation (6-B) and first Prisma migration (6-A) remain as Sprint 6 work — these were always planned for Sprint 6, not Sprint 5.

---

## Exit Criteria

- [x] `POST /api/v1/sessions` creates a row in the `sessions` DB table; session survives a server restart
- [x] `GET /api/v1/sessions/:id` reads from DB and returns the correct session for any previously created session ID
- [x] Client connecting via WebSocket receives `session.snapshot` with `session`, `tracks`, and `clips` fields populated from the database
- [x] WebSocket connection to an unknown session ID is rejected with close code `4404`
- [x] WS `session.snapshot` `transport.bpm` matches the value stored in the DB, not always the default 120
- [x] JWT ticket decoded on WS connect; `userId`, `displayName`, `color`, and `role` come from the token
- [x] Viewer-role JWT cannot arm a track (`track.arm_rejected` returned with `reason: 'forbidden'`); role comes from JWT, not a hardcode
- [x] Comment data persists across a server restart
- [x] Server starts cleanly with `DATABASE_URL` unset (falls back to `InMemoryStorageAdapter` with no errors)
- [x] Server with `DATABASE_URL` set logs a clear error and exits non-zero at startup if DB is unreachable
- [x] `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes with zero errors
- [x] Sprint 5 UAT signed off with zero P0/P1 defects (2026-05-18)
- [ ] **5-D (NOT MET)** Frontend consumes `session.snapshot` payload; `INITIAL_TRACKS` / `SEED_COMMENTS` no longer initialize state; WS connection uses real `sessionId` from URL — remediation required
- [ ] **5-E (NOT MET)** `presence.joined` / `presence.left` WS events update presence state; `DEMO_PRESENCE` seed data not rendered by default — remediation required
- [ ] **5-I (NOT MET — P2)** VU meters driven by independent `ChannelSplitterNode` outputs; `levelL` and `levelR` are independently sourced — does not block Sprint 6

---

## Key Links

- `docs/adr/ADR-005` — Session hydration strategy
- `server/storage/adapter.ts` — StorageAdapter interface (unchanged; Sprint 5 implemented against it)
- `server/ws/handler.ts` — WS connect handler with JWT decode and session hydration
- `server/routes/sessions.ts` — REST sessions wired to StorageAdapter
- `docs/handoffs/archive/track-locking-backend.md` — Related handoff from Sprint 2/3 track locking work
