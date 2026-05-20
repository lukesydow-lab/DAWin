# DAWin — Product Roadmap

**Status: Partial**
**Last updated:** 2026-05-19
**Version:** 2.0  
**Date:** 2026-05-17  
**Author:** PM (Luke)  
**Horizon:** Three-product suite — Desktop (full DAW), Web (collaboration companion), Mobile/Tablet (capture companion)

> **⚠️ Staleness note:** The sprint-by-sprint section below covers Sprints 1–3 in detail. Sprints 4–7 sprint sections have not been fully added to this file — see `STATUS.md` Done tables for authoritative sprint history. The Product Suite Roadmap section (web/desktop/mobile) is current. Sprint 2 is incorrectly shown with partial exit criteria in this file — it is CLOSED. Sprints 1–7 are all CLOSED. Sprint 8 is PLANNING.

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

## Sprint 2 — Real-Time Collaboration (CLOSED 2026-05-15)

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

## Sprint 3 — Session Communication + Deep Links (CLOSED 2026-05-15)

> **Note:** Sprint 3 was reprioritized from "Audio Depth" to session communication (FR-06) and deep links (FR-07). The "Audio Depth" content below was the original plan and was superseded. See `STATUS.md` Done table for what actually shipped.

## Sprint 3 Original Plan — Audio Depth (Superseded)

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

---

## Product Suite Roadmap

> The sprints above cover the **Web App** (browser companion). Below is the full picture across all three products.

---

### Web App — Path to Beta

The web app is the product this team is currently building. Beta means: real users can join a shared session, edit the timeline, mix, comment, and record audio from their browser — without installing anything.

| Sprint(s) | Focus | What it unlocks |
|---|---|---|
| 4 (current) | Resizable panels + horizontal/vertical zoom | Ergonomics — usable at different screen sizes and session lengths |
| 5 | Backend persistence — PostgreSQL, real user accounts, session state survives restart | Everything else. This is the foundational sprint. |
| 6 | Backend file storage (S3 or equivalent) + audio upload/download API | Real audio clips in the session |
| 7 | Audio file drag & drop to timeline + clip rendering from real buffers | First time the DAW handles actual audio files |
| 8–9 | `getUserMedia` recording → `AudioWorklet` capture → upload → session distribution | Browser recording into shared session |
| 10 | Clock sync + latency compensation for recorded audio | Recordings land in the right timeline position across clients |
| 11 | Motion system implementation (Phase 1: token extraction; Phase 2: spring physics + heartbeat) | Professional feel; motion spec already approved |
| 12 | Web app beta UAT — multi-client stress test, performance, real audio fidelity | **Web App Beta** |

**Honest estimate: ~8 more sprints to web beta** (Sprints 5–12). At current AI-assisted team velocity this is achievable in 3–4 weeks of focused work, assuming the backend foundation sprint doesn't surface major architectural surprises.

---

### Desktop App — Separate Roadmap (not yet started)

The desktop app is a distinct product. It is not an Electron wrapper of the web app — it is a native application that shares the same session backend.

Key decisions needed before a sprint can begin:
- **Framework:** Electron (JS ecosystem, fastest to ship) vs. Tauri (Rust, smaller binary, better security) vs. fully native (Swift/macOS, maximum performance)
- **Audio engine:** JUCE (C++ framework, industry standard — used by Ableton, Logic, etc.) vs. RtAudio vs. platform-native Core Audio / WASAPI
- **Plugin hosting:** VST3 SDK integration — requires a separate C++ sidecar process to sandbox plugin crashes from the main app
- **Architecture:** Does the desktop app reuse the React UI (via Electron/Tauri webview) or is the UI native?

This roadmap does not include desktop app sprints until the PM makes these decisions and a Tech Lead scopes the architecture.

---

### Mobile / Tablet Companion Apps — Separate Roadmap (not yet started)

Tablet and mobile apps are lightweight companions: monitoring, recording a scratch part into the session, and basic comment interaction. They do not do timeline editing or mixing.

Key decisions needed:
- **Framework:** React Native (shares logic with web), Flutter (better native audio access), or fully native iOS/Android
- **Audio capture:** Native microphone access + upload to session backend (same pipeline as web recording)
- **Session sync:** Uses same WebSocket backend as web app

This roadmap does not include mobile sprints until the web app beta is complete and the PM formally scopes it.

---

### Features by Product

| Feature | Web App | Desktop App | Mobile/Tablet |
|---|---|---|---|
| Arrangement + timeline editing | ✅ In scope | ✅ Full | ❌ View only |
| Mixer (reference quality) | ✅ In scope | ✅ Full | ⚠️ Basic level only |
| Plugin chain (Web Audio nodes) | ✅ In scope | ✅ + VST hosting | ❌ |
| VST3 / VSTi / CLAP hosting | ❌ Browser limitation | ✅ Desktop only | ❌ |
| Presence + comments + deep links | ✅ In scope | ✅ In scope | ⚠️ Comment view + reply |
| Track locking + role enforcement | ✅ In scope | ✅ In scope | ⚠️ Enforced server-side |
| Recording into session | ✅ Planned (getUserMedia) | ✅ Full (hardware I/O) | ✅ Planned (device mic) |
| Audio file drag & drop | ✅ Planned | ✅ Full | ❌ |
| MIDI sequencing | ❌ Out of scope | ✅ Desktop only | ❌ |
| Sub-5ms monitoring latency | ❌ Browser limitation | ✅ Native engine | ❌ |
| Undo stack | ⚠️ Deferred | ✅ Required | ❌ |
| Session persistence | ⚠️ Sprint 5 | ✅ Required | ✅ Required |

---

### Open Decisions (PM must answer before work can start)

| Decision | Blocks |
|---|---|
| Desktop framework (Electron vs. Tauri vs. native) | Desktop app Sprint 1 |
| Desktop audio engine (JUCE vs. Core Audio / WASAPI) | Desktop app Sprint 1 |
| Mobile framework (React Native vs. Flutter vs. native) | Mobile Sprint 1 |
| ~~Database choice for session persistence~~ | ✅ **PostgreSQL + Prisma** — decided 2026-05-17 |
| ~~File storage provider~~ | ✅ **Cloudflare R2** — decided 2026-05-18 (zero egress fees; S3-compatible API) |
| Recording quality floor for web/mobile (sample rate, bit depth, codec) | Web App Sprint 8 |
