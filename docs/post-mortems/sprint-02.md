# Sprint 2 Post-Mortem — Real-Time Collaboration

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 2
**Dates:** 2026-05-14 – 2026-05-15
**Status:** Closed
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

- Scaffold the Fastify backend with WebSocket transport sync and presence fan-out
- Wire the plugin chain into the Web Audio graph (real audio processing per track)
- Implement JWT-based role enforcement (Owner / Editor / Viewer) server-side
- Ship track locking: server enforces one lock per track; Viewer cannot arm/mute/solo
- Close all remaining interactivity gaps in the mixer: PanKnob drag, StudioFader ARIA, master pan

---

## What shipped

- Fastify scaffold: all route files (`server/index.ts`, `server/routes/sessions.ts`, `server/routes/auth.ts`, `server/ws/handler.ts`, `server/store.ts`, `server/types.ts`) — tsc-clean
- WebSocket message routing: `session.join/leave`, `transport.play/pause/stop/seek/bpm_change`, `presence.update` fan-out, `session.snapshot` on connect
- Plugin chain audio graph wired: `DynamicsCompressorNode`, `ConvolverNode` (procedural IR), `DelayNode` + feedback `GainNode`, `BiquadFilterNode`, `BiquadFilterNode` (EQ), Limiter; `rewirePluginChain` reconciler; `_pluginNodeMap`; bypass without graph rebuild
- `_masterPanner` `StereoPannerNode` inserted; `masterPan` default fixed `0 → 50`
- JWT auth (`server/jwt.ts`): `POST /auth/login`, `POST /auth/guest`, `GET /auth/me`; HS256, 8h user / 72h guest tokens
- Track locking: `track.arm/disarm/locked/unlocked/arm_rejected` WS handlers; `track.lockedBy` in session store; lock released on client disconnect
- `isViewer` prop-threaded from `/auth/me` fetch to `TrackHeader`; viewer tooltip text on R/M/S controls
- `StudioFader`: `role="slider"`, track-scoped `aria-label`, ArrowUp/Down ±1, Shift+Arrow ±10
- `PanKnob`: horizontal drag, center detent ±4 dead zone, 2px notch at center, double-click to center
- FX badge click opens `PluginChainPanel` for the selected track
- CI tightened: `--noUnusedLocals --noUnusedParameters` enforced at typecheck step

---

## What had issues

**P1 — WS handler hardcodes role as 'owner' (found at UAT sign-off):** The WS connect handler at `server/ws/handler.ts:362` hardcoded `role = 'owner'` for all WS connections. The JWT ticket is present in the URL but was not decoded. This meant the viewer-forbidden path in `handleTrackArm` was structurally present in the code but unreachable at runtime via WebSocket. The HTTP `GET /auth/me` path correctly enforced role, but WS role enforcement was a stub.

This gap existed between the exit criterion ("Track locking enforced server-side; Viewer role enforced via JWT") and what was actually enforced. UAT noted this explicitly.

Two additional P3 observations:
- `GET /auth/me` fetch in App hardcoded to `http://localhost:3000` — would fail silently on any non-default port or deployment URL
- `handleTrackDisarm` broadcast `track.unlocked` even when `releaseTrackLock` returned `false` — spurious events possible in multi-client scenarios

---

## How issues were addressed

The P1 WS role gap was explicitly acknowledged in the backend handoff and deferred to Sprint 5 (ticket 5-C). The decision to defer was made with the rationale that the JWT infrastructure was complete, the HTTP enforcement path worked correctly, and the WS guard logic was structurally correct — the gap was a known follow-on, not an oversight.

UAT signed off as CONDITIONAL PASS given the explicit acknowledgment and deferral.

The hardcoded API URL P3 was deferred and eventually resolved in Sprint 8 via the `API_BASE` constant (`import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`).

The spurious `track.unlocked` broadcast was accepted as low-risk for a prototype.

---

## Decisions made

**Fastify + @fastify/websocket architecture:** Chosen for minimal surface area and no persistence requirement until Sprint 5. Documented in ADR-002 (in-memory store; later superseded by Sprint 5/6 persistence work). The scaffold decision was sound — the pattern held through Sprint 9.

**`rewirePluginChain` reconciler pattern:** Instead of rebuilding the full audio graph on every chain change, a reconciler creates and removes individual nodes as the chain mutates. Bypass removes/reinserts a node without touching other nodes. This pattern has been stable since Sprint 2 with no replacements.

**JWT signing via `jose` (HS256):** `server/jwt.ts` with `signToken`/`verifyToken`. 8h user / 72h guest tokens. `JWT_SECRET` from env var with `console.warn` fallback. This is the auth implementation that remained through Sprint 9.

**`isViewer` as a prop-threaded boolean:** Rather than a context or global, `userRole` is fetched once at App root from `/auth/me` and `isViewer = userRole === 'viewer'` is derived and prop-threaded to every component that needs it. This is consistent with the single-file constraint.

**CI `--noUnusedLocals --noUnusedParameters`:** Added in Sprint 2 to prevent dead code accumulation as the codebase grows. Sprint 10 would find this constraint important when 8 TypeScript build errors surfaced from unused variables.

---

## What was deferred

- **WS role enforcement via JWT ticket (P1 deferred):** `role` hardcoded to `'owner'` in WS handler. Deferred to Sprint 5 (ticket 5-C). This was a real gap between spec and implementation that the team chose to accept given the prototype stage.
- Hardcoded `http://localhost:3000` in App: deferred; resolved Sprint 8.
- Spurious `track.unlocked` broadcast: accepted as low-risk prototype behavior.

---

## What was learned

**Specifying exit criteria precisely matters when enforcement paths are split:** The exit criterion said "Viewer role enforced via JWT" but the WS path was a stub. In a real production project this would be a sprint-blocking defect. In a prototype context, naming it explicitly and deferring with a ticket number was the right call — it is documented, not forgotten.

**The `rewirePluginChain` pattern is load-bearing.** Any sprint that needs to add new audio node types or change signal chain topology must understand this reconciler. Agents joining mid-project who don't read the Sprint 2 context may attempt to rebuild graphs from scratch. This post-mortem should prevent that.

**Fastify scaffold was the right choice at the right time.** The API surface is clean enough that it has not needed structural changes through Sprint 9. The `StorageAdapter` abstraction introduced in Sprint 4 built cleanly on top of the Fastify foundation without touching route structure.

---

## Metrics

- Defects found by UAT: 3 (1 P1, 2 P3)
- Defects resolved: 0 (P1 explicitly deferred; P3s accepted or deferred)
- Sprint closed: CONDITIONAL PASS
- `tsc --noEmit --noUnusedLocals --noUnusedParameters`: clean on both frontend and backend at close

---

## Open questions going into the next sprint

- WS JWT decode: when does ticket 5-C get scheduled to close the viewer-enforcement gap?
- Is the spurious `track.unlocked` broadcast acceptable if multi-client testing begins before Sprint 5?
