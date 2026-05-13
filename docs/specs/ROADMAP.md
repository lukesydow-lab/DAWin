# DAWin — Product Roadmap

**Version:** 1.0  
**Date:** 2026-05-13  
**Author:** PM (Luke)  
**Horizon:** 4 phases, desktop-first, no mobile until Phase 4+

---

## Sprint 1 — Core Session Room (Closing)

**Goal:** A single-user interactive DAW session room with live audio playback, full mixer control, and collaborator color model visible at every surface.

### What is done
- Session room shell (transport, arranger, mixer, FX chain, status bar, invite modal)
- 7-track arranger: clip drag/resize/fade, cut tool, playhead seek, spacebar play/pause, RTZ
- Mixer: logarithmic fader, pan knob, mute/solo wired to shared state, VU meters live from Web Audio API
- Neve studio visual theme: wood rails, metal faders, collaborator color tinting on all surfaces
- FX chain panel: plugin enable/disable, empty state with signal-flow SVG, "Add Plugin +" CTA stub
- Invite modal: role picker, email input, send CTA (UI only)
- ARIA pass: icon-only controls labeled, keyboard nav on fader/pan/MiniBtn
- Figma DSM completeness pass: all shipped components represented

### Still in flight
- **WP-3 close:** VU meter Tech Lead sign-off on commit `3507382` + heartbeat startup → VU signalTarget integration (reference: `public/motion-prototypes/03-vu-meter-animation.html`)
- **Backend spec revisions (4):** stamp `WsMessage.from` server-side, `PUT /chain` delete semantics, `GET /auth/me`, upload timeout — Backend self-resolves, then Fastify scaffold begins
- **Master fader height bug:** `<div style={{ height: 14 }} />` spacer in master strip must be ~48px to align master fader cap with track fader caps at bottom-align boundary (specced in `docs/specs/mix-view.md`)

### Exit criteria for Sprint 1 to be called complete
- [ ] Tech Lead signs off on VU meter commit `3507382` and STATUS.md WP-3 is marked Done
- [ ] Master fader height bug fixed and UAT-validated
- [ ] Backend spec revisions resolved and Fastify scaffold committed
- [ ] Zero P0 or P1 defects open in `docs/defects.md`
- [ ] Heartbeat startup → VU integration shipped or formally deferred with written rationale

---

## Sprint 2 — Real-Time Collaboration

**Goal:** Make the "collaborative" claim true: multiple clients share live transport state, track presence, and plugin chain mutations via WebSocket, with backend enforcement of track locks and roles.

### Dependencies (must be done before Sprint 2 features begin)
- Fastify scaffold running locally (Backend — unblocked when 4 spec revisions resolve)
- PM writes plugin browser interaction spec (`docs/specs/plugin-browser.md`) — currently the longest-running blocker for Frontend
- PM answers Open Decisions §8.5 (context menu stubs) and §8.6 (crossfade tool) to scope Sprint 2 correctly

### Features

**1. WebSocket presence and transport sync (Backend + Frontend)**
- Fastify WebSocket server handles `session.join`, `session.leave`, `transport.play`, `transport.pause`, `transport.seek`, `transport.bpm_change` messages
- Transport state (isPlaying, playheadBar, bpm) is server-authoritative — last write wins; server broadcasts to all session clients
- Collaborator presence dots in StatusBar and transport bar update from real WebSocket events, not seed data
- Done when: two browser tabs can open the same session, one presses play, and the other's playhead moves within 100ms

**2. Track locking and role enforcement (Backend + Frontend)**
- Server enforces `track.lockedBy` — when a client arms a track, server stamps the lock and rejects concurrent arm attempts from other clients
- JWT-based role (Owner / Editor / Viewer) validated server-side; `IS_VIEWER` client constant replaced by decoded JWT claim
- Disabled Mute/Solo/Arm buttons gain `title="View only — upgrade to Editor to make changes"` tooltip
- Done when: two clients in the same session cannot simultaneously arm the same track; Viewer client cannot arm/mute/solo any track even if client code is modified

**3. Plugin browser ("Add Plugin +") (PM spec required first)**
- PM writes `docs/specs/plugin-browser.md` specifying: what opens on click, search/browse UX, how a plugin is added to the chain
- Designer specs all states (empty search, results, selected, added confirmation)
- Frontend implements; FX chain populated state shows real plugin cards
- Done when: a user can click "Add Plugin +", find a plugin by name or category, and have a new plugin card appear in the chain with default parameters

**4. Track ownership screen polish (Designer + Frontend)**
- PanKnob in track header becomes draggable (horizontal drag, double-click to center) — specced in `docs/specs/fx-chain-pan-rms-redesign.md`
- FX badge click on mixer strip opens PluginChainPanel for that track — specced in `docs/specs/fx-chain-pan-rms-redesign.md`
- StudioFader gains `role="slider"` ARIA and ArrowUp/Down keyboard control
- Master pan knob connected to `masterPan` state with real `StereoPannerNode` wiring
- Done when: all interactivity gaps in `docs/specs/mix-view.md` interactivity table are closed

**5. Plugin chain in audio graph (Frontend + Tech Lead)**
- Plugin parameters (compressor, reverb, delay, etc.) stored in React state are wired to real Web Audio nodes: `DynamicsCompressorNode`, `ConvolverNode`, `DelayNode`
- Signal order must be: `source → plugin chain → GainNode(fader) → AnalyserNode → StereoPannerNode → master`
- Enable/disable toggle connects or disconnects the node without rebuilding the graph
- Done when: toggling a compressor plugin audibly changes the track's dynamic response; toggling reverb adds/removes reverb tail

### Sprint 2 definition of done
- [ ] Two clients in the same session share transport state via WebSocket
- [ ] Track locking enforced server-side; Viewer role enforced via JWT
- [ ] Plugin browser interaction specced, designed, and implemented (basic search + add flow)
- [ ] All interactivity gaps in mix-view.md table closed
- [ ] Plugin chain nodes wired into audio graph
- [ ] Zero P0 or P1 defects at UAT sign-off

---

## Sprint 3 — Audio Depth

**Goal:** Make the audio chain audibly and visually complete: plugin parameters are editable, the crossfade tool works, and VU calibration matches professional standards.

### Dependencies
- Sprint 2 complete (plugin chain in audio graph is a prerequisite for parameter editing)
- PM answers Open Decisions §8.6 (crossfade scope) and §8.8 (plugin parameter editing UX)
- PM answers Open Decisions §8.2 and §8.3 (VU calibration)

### Features

**1. Plugin parameter editing UI**
- Expanding plugin card shows inline knobs or sliders per parameter (e.g., compressor threshold, ratio, attack, release)
- Parameter changes update both React state and the live Web Audio node in real time
- Server persists parameter changes and broadcasts `plugin.param_change` events to other session clients
- Done when: dragging a compressor threshold knob audibly and immediately changes compression on the track

**2. Crossfade tool (if PM scopes it)**
- Drag between two adjacent clips creates a crossfade region with a configurable curve (linear / equal-power)
- Crossfade region is visualized with an X overlay on the clip boundary at the overlap
- Done when: two clips can be crossfaded and the overlap plays back with audible fade-through

**3. Context menu completions (Loop region + Rename)**
- Loop region: sets `loopStart` and `loopEnd` on the session, playhead loops within the range
- Rename: inline text edit on the track header name field
- Done when: right-clicking a clip shows fully-wired Delete / Duplicate / Loop region / Rename items with no disabled stubs

**4. VU calibration polish**
- 0 VU tick mark at the green/amber boundary (if PM approves §8.2)
- Color band recalibration to match −18 dBFS reference (if PM approves §8.3)
- True stereo metering via SplitterNode (if PM approves §8.4)
- Done when: Designer specifies and Frontend implements all PM-approved calibration changes; DSM updated

**5. Heartbeat startup choreography (if deferred from Sprint 1)**
- Port the fader/VU startup animation from `public/motion-prototypes/03-vu-meter-animation.html` to the React app
- Meters animate alongside faders during the startup sequence
- Done when: cold-loading the app shows the fader sweep and VU meter response in sync

### Sprint 3 definition of done
- [ ] Plugin parameters are editable and update the live audio graph
- [ ] Crossfade tool implemented or formally removed from UI (no disabled stubs)
- [ ] Context menu has zero disabled stubs
- [ ] VU calibration decisions resolved and implemented
- [ ] Zero P0 or P1 defects at UAT sign-off

---

## Future / Exploration

Items below require a PM spec and Tech Lead architecture review before any agent touches them. None are in scope for Sprints 1–3.

| Feature | Why deferred | Prerequisite |
|---|---|---|
| Mobile capture screen (record + playback) | Desktop-first is the current mandate; 1280px min-width enforced at root | PM formal scope decision + Designer full mobile spec |
| CLAP / VST3 native plugin support | Requires Electron/Tauri sidecar process (per ADR-001); out of scope for browser prototype | Electron integration decision + PM approval |
| Undo stack | Requires operational transforms or full state snapshots; complex to retrofit without architectural planning | Tech Lead design + PM approval |
| Session history / restore points | Depends on server persistence model being stable | Backend persistence layer complete |
| Ownership transfer UI | Drag avatar onto track or context menu option; backend auth model must enforce it | Sprint 2 backend complete; PM decision on §8.7 |
| Pre-fader / post-fader meter toggle | Move AnalyserNode tap before GainNode; architecturally simple but low value | PM decision; Sprint 3+ |
| Clip color picker | Override owner color on individual clips for marking regions | Sprint 3 complete |
| Real audio recording (getUserMedia) | Capture pipeline is fully specced in `docs/specs/multitrack-backend-api.md` but requires backend blob storage | Backend sprint dedicated to recording pipeline |
| MIDI track type | All tracks are audio synthesis only; MIDI requires separate event model | New spec + PM scope decision |
| Session loading state / skeleton | No loading state designed; relevant when real session hydration is introduced | Backend + Frontend sprint |
| Error states | No error state designed for any screen | PM + Designer scope decision |
