# DAWin — Product Roadmap

**Version:** 1.1  
**Date:** 2026-05-14  
**Author:** PM (Luke)  
**Horizon:** 4 phases, desktop-first, no mobile until Phase 4+

---

## Sprint 1 — Core Session Room (Closed 2026-05-14)

**Goal:** A single-user interactive DAW session room with live audio playback, full mixer control, and collaborator color model visible at every surface.

### What shipped
- Session room shell (transport, arranger, mixer, FX chain, status bar, invite modal)
- 7-track arranger: clip drag/resize/bezier-fade, cut tool, playhead seek, spacebar play/pause, RTZ
- Mixer: logarithmic fader, pan knob, mute/solo wired to shared state, VU meters live from Web Audio API
- Neve studio visual theme: wood rails, metal faders, collaborator color tinting on all surfaces
- Plugin rack browser: wood cabinet rails, brushed-metal faceplates, power LED in owner color, amber LCD, drag-to-reorder, inline PluginBrowser popover
- Bezier fade curves with draggable midpoint handles; crossfade symmetry lock (`crossfadeLocked` on ClipData)
- VU meter heartbeat startup: bloom + staggered motorized recall animation on mount
- FX chain panel viewport positioning bug fixed (overflow:clip BFC on #root)
- Invite modal: role picker, email input, send CTA (UI only)
- ARIA pass: icon-only controls labeled, keyboard nav on fader/pan/MiniBtn
- PRD v1.0 + Roadmap v1.0
- Figma DSM completeness pass
- GitHub sprint infrastructure (milestones, labels, issue templates, Projects board)
- Screenshot archive at `screenshots/sprint-1-2026-05-14/`

### Exit criteria — all met ✅
- [x] Tech Lead signs off on VU meter; STATUS.md WP-3 marked Done
- [x] FX chain panel positioning bug fixed and UAT-validated
- [x] Backend spec revisions resolved and Fastify scaffold committed
- [x] Zero P0 or P1 defects open in `docs/defects.md`
- [x] Heartbeat startup ported to React app and shipped

---

## Sprint 2 — Real-Time Collaboration (Active)

**Goal:** Make the "collaborative" claim true: multiple clients share live transport state, track presence, and plugin chain mutations via WebSocket, with backend enforcement of track locks and roles.

### Features

**1. WebSocket presence and transport sync (#19) — ✅ DONE**
- Fastify scaffold at `server/` (index.ts, routes/sessions.ts, routes/auth.ts, ws/handler.ts, store.ts, types.ts) — tsc-clean
- Session store: `Map<sessionId, SessionState>` with `addClient`, `removeClient`, `updateTransport`, `getClients`
- Message routing: session.join/leave, transport.play/pause/stop/seek/bpm_change, presence.update fan-out
- `session.snapshot` sent to joining client on connect (transport state + collaborator list)

**2. Track locking and role enforcement (#20) — 🟡 IN PROGRESS**
- Server enforces `track.lockedBy` — rejects concurrent arm attempts from other clients
- JWT-based role (Owner / Editor / Viewer) validated server-side; `IS_VIEWER` client constant replaced by decoded JWT claim
- Disabled controls gain tooltip: "View only — upgrade to Editor to make changes"
- Done when: two clients cannot simultaneously arm the same track; Viewer cannot arm/mute/solo even with modified client code

**3. Plugin chain in audio graph (#7) — ✅ DONE**
- DynamicsCompressorNode, ConvolverNode (procedural IR), DelayNode + feedback GainNode, BiquadFilterNode, Limiter
- `rewirePluginChain` reconciler; `_pluginNodeMap` module-level ref; enable/disable bypasses without graph rebuild
- Signal order confirmed: `source → [plugin chain] → GainNode(fader) → AnalyserNode → StereoPannerNode → master`
- Kick track seeded with compressor plugin

**4. Track ownership polish (#8) — ✅ DONE**
- PanKnob drag (horizontal), center detent (±4 unit dead zone), 2px notch indicator, double-click to center
- FX badge click opens PluginChainPanel for that track
- StudioFader: `role="slider"`, track-scoped `aria-label`, ArrowUp/Down ±1, Shift+Arrow ±10
- Master pan: `_masterPanner` StereoPannerNode inserted; `masterPan` default fixed 0→50; mapping `(masterPan-50)/50`

### Sprint 2 exit criteria
- [x] Fastify scaffold committed, tsc-clean, WebSocket transport routing implemented (#19)
- [x] Plugin chain nodes wired into audio graph (#7)
- [x] All interactivity gaps in mix-view.md table closed (#8)
- [ ] Track locking enforced server-side; Viewer role enforced via JWT (#20)
- [ ] Zero P0 or P1 defects at UAT sign-off

---

## Sprint 3 — Audio Depth

**Goal:** Plugin parameters are editable, VU calibration matches professional standards, and all context menu stubs are resolved.

### Dependencies
- Sprint 2 complete (plugin chain wired is prerequisite for parameter editing)
- PM answers Open Decisions §8.8 (plugin parameter editing UX)
- PM answers Open Decisions §8.2 and §8.3 (VU calibration)
- PM answers Open Decision §8.5 (context menu stubs)

### Features

**1. Plugin parameter editing UI**
- Expanding plugin card shows inline knobs/sliders per parameter (compressor: threshold, ratio, attack, release)
- Parameter changes update React state and live Web Audio node in real time
- Server persists and broadcasts `plugin.param_change` events
- Done when: dragging compressor threshold audibly and immediately changes compression

**2. Context menu completions (Loop region + Rename)**
- Loop region: sets `loopStart`/`loopEnd`; playhead loops within range
- Rename: inline text edit on track header name field
- Done when: all four context menu items fully wired, zero disabled stubs

**3. VU calibration polish**
- 0 VU tick mark at green/amber boundary (if PM approves §8.2)
- Color band recalibration to match −18 dBFS reference (if PM approves §8.3)
- True stereo metering via SplitterNode (if PM approves §8.4)

### Sprint 3 exit criteria
- [ ] Plugin parameters editable and update live audio graph
- [ ] Context menu has zero disabled stubs
- [ ] VU calibration decisions resolved and implemented
- [ ] Zero P0 or P1 defects at UAT sign-off

---

## Future / Exploration

| Feature | Why deferred | Prerequisite |
|---|---|---|
| Mobile capture screen | Desktop-first mandate; 1280px min-width enforced | PM formal scope decision + Designer full mobile spec |
| CLAP / VST3 native plugin support | Requires Electron/Tauri sidecar (per ADR-001) | Electron integration decision + PM approval |
| Undo stack | Requires operational transforms or full state snapshots | Tech Lead design + PM approval |
| Session history / restore points | Depends on stable server persistence model | Backend persistence layer complete |
| Ownership transfer UI | Backend auth model must enforce it | Sprint 2 backend complete; PM decision on §8.7 |
| Pre-fader / post-fader meter toggle | Low value; architecturally simple | PM decision; Sprint 3+ |
| Clip color picker | Override owner color on individual clips | Sprint 3 complete |
| Real audio recording (getUserMedia) | Requires backend blob storage | Backend sprint for recording pipeline |
| MIDI track type | All tracks are audio synthesis only | New spec + PM scope decision |
| Session loading state / skeleton | Relevant when real session hydration introduced | Backend + Frontend sprint |
| Error states | No error state designed for any screen | PM + Designer scope decision |
