# Sprint 2 — Real-Time Collaboration

**Status:** Historical Archive
**Last updated:** 2026-05-19
**Closed:** 2026-05-15
**Theme:** Make the "collaborative" claim true: multiple clients share live transport state, track presence, and plugin chain mutations via WebSocket, with backend enforcement of track locks and roles.
**Depends on:** Sprint 1 (session room shell, shared types, ADR-001).
**Unblocks:** Sprint 3 (comments and deep links require the WS transport and JWT auth foundation).

---

## Goals

- Scaffold the Fastify backend with WebSocket transport sync and presence fan-out
- Wire the plugin chain into the Web Audio graph (real audio processing per track)
- Implement JWT-based role enforcement (Owner / Editor / Viewer) server-side
- Ship track locking: server enforces one lock per track; Viewer cannot arm/mute/solo
- Close all interactivity gaps in the mixer (PanKnob drag, StudioFader ARIA, master pan)

---

## What Shipped

- Fastify scaffold: `server/index.ts`, `server/routes/sessions.ts`, `server/routes/auth.ts`, `server/ws/handler.ts`, `server/store.ts`, `server/types.ts` — tsc-clean
- WebSocket message routing: `session.join/leave`, `transport.play/pause/stop/seek/bpm_change`, `presence.update` fan-out, `session.snapshot` on connect
- Plugin chain audio graph wired: `DynamicsCompressorNode`, `ConvolverNode` (procedural IR), `DelayNode` + feedback `GainNode`, `BiquadFilterNode`, Limiter; `rewirePluginChain` reconciler; `_pluginNodeMap`; bypass without graph rebuild; Kick seeded with compressor
- `_masterPanner` `StereoPannerNode` inserted; `masterPan` default fixed `0 → 50`; mapping `(masterPan-50)/50`
- JWT auth (`server/jwt.ts`): `POST /auth/login`, `POST /auth/guest`, `GET /auth/me`; HS256, 8h user / 72h guest tokens
- Track locking (`#20`): `track.arm/disarm/locked/unlocked/arm_rejected` WS handlers; `track.lockedBy` in session store; lock released on client disconnect
- `isViewer` prop-threaded from `/auth/me` fetch to `TrackHeader`; viewer tooltip text on R/M/S controls
- `StudioFader`: `role="slider"`, track-scoped `aria-label`, ArrowUp/Down ±1, Shift+Arrow ±10
- `PanKnob`: horizontal drag, center detent ±4 dead zone, 2px notch at center, double-click to center
- FX badge click opens `PluginChainPanel` for the selected track
- CI tightened: `--noUnusedLocals --noUnusedParameters` enforced at typecheck step

---

## Deferred

- **P1 (WS ticket→role not decoded in ws/handler.ts):** The WS connect handler hardcodes `role = 'owner'` — the JWT ticket is present in the URL but not yet decoded. Deferred to Sprint 5 (ticket 5-C). Logged in `docs/defects.md`.

---

## Exit Criteria

- [x] Fastify scaffold committed, tsc-clean, WebSocket transport routing active
- [x] Plugin chain nodes wired into audio graph; enable/disable audibly changes track sound
- [x] All interactivity gaps in mix-view.md table closed
- [x] Track locking enforced server-side; Viewer role enforced via JWT (`#20`)
- [x] Zero P0 or P1 defects at UAT sign-off (2026-05-15)

---

## Key Links

- `server/index.ts` — Fastify entry point
- `server/ws/handler.ts` — WebSocket message router
- `server/jwt.ts` — JWT sign/verify
- `docs/specs/ROADMAP.md` — Sprint 2 section
- `docs/specs/multitrack-backend-api.md` — Backend API spec (4 questions resolved this sprint)
