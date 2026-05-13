# DAWin — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-05-13  
**Author:** PM (Luke)  
**Sprint context:** 1 — Core Session Room (closing)  
**Status:** Living document — update at each sprint review

---

## 1. Product Overview

DAWin is a desktop-first, browser-based collaborative digital audio workstation (DAW) prototype. It is designed for musicians and producers who need to co-create inside a shared session in real time — the way designers already work in Figma. The core differentiator is the collaborator color model: every user is assigned a unique hex color that tints their tracks, clips, mixer strip, and avatar ring across the entire UI, making ownership and activity instantly legible without reading a single label. The current prototype runs locally on React + TypeScript + Web Audio API with no backend; real-time sync is the next major milestone. DAWin targets musicians with professional DAW muscle memory — it is intentionally dense, not simplified, and must honor standard conventions (spacebar play/pause, stop-preserves-position, logarithmic faders, post-fader metering) at every surface.

---

## 2. Target Users

### Primary user
A musician or producer fluent in Ableton Live, Logic Pro, or Pro Tools who is collaborating remotely with 1–4 others on a shared session. They expect: standard keyboard shortcuts, correct timeline behavior, a readable ownership model, and a professional aesthetic. They will notice instantly if the fader curve is wrong or the stop button resets the playhead.

### Secondary users
- **Session musicians** joining a session to record a part on a track owned by the primary producer. They need record-arm clarity, clean input routing display, and to know immediately whether their track is locked by someone else.
- **Beatmakers and mixing engineers** who join as Editors or Viewers. They use the mixer and FX chain frequently but may not own tracks. Role-based access must degrade gracefully — a Viewer should understand why controls are disabled without reading a manual.

---

## 3. Problem Statement

Today, remote music collaboration falls into one of two failure modes: (1) file-based async workflows (send stems back and forth via Dropbox/email) that destroy creative momentum and produce version-control nightmares, or (2) screen-share sessions that give only one person real control while others watch. Neither model supports genuine parallel work — two producers cannot simultaneously edit different tracks in the same session without overwriting each other. DAWin solves this by treating track ownership as a first-class concept: each track belongs to one collaborator, visualized through a pervasive color system, with role-based controls that prevent destructive conflicts. The result is a shared creative space where ownership is unambiguous, contributions are attributable, and the session stays coherent even with four people active at once.

---

## 4. Product Goals (Prototype Phase)

1. **Collaborative legibility:** A new user joining a session can identify who owns which track within 3 seconds, using color alone, without reading any label.
2. **Session capacity:** A single session supports up to 4 simultaneous collaborators (Owner + up to 3 Editors/Viewers) without visible UI degradation.
3. **Core DAW fidelity:** All standard DAW conventions are honored — the prototype passes a blind usability test with a professional Ableton or Pro Tools user with no onboarding.
4. **Audio coherence:** All 7 tracks play back with correct per-track volume, pan, mute, and solo state wired to the Web Audio graph. The master bus drives real gain.
5. **Zero P0 defects at handoff:** Every sprint exits with no open P0 blockers in `docs/defects.md`.

---

## 5. Feature Requirements

### 5.1 Session Room Layout
**Status: Shipped**

The outermost shell — a full-viewport flex column with `min-width: 1280px`.

- TransportBar (52px, top) — logo, transport controls, BPM, collaborator avatars, Invite button. Done.
- ArrangeView (flex-1) — 7 tracks, 32 bars, ruler, playhead. Done.
- MixerPanel (bottom, pinned) — Neve-inspired studio theme, 7 track strips + master. Done.
- PluginChainPanel (right, conditional 280px) — slides in when a track is selected. Done.
- StatusBar (28px, bottom edge) — collaborator count, CPU/RAM/Latency labels (seed data). Done.
- InviteModal (z-50 overlay) — triggered by "+ Invite" button. Done.

Done means: shipped, reviewed by Tech Lead, and UAT-validated.

---

### 5.2 Arranger View
**Status: Shipped**

- 7 tracks, 32 bars, drag-to-scroll horizontal canvas (2304px). Done.
- Clip drag (bar-snapped, grab-offset correct), resize (left/right handles), cut tool. Done.
- Fade in/out handles with linear/ease/sharp curve modes. Done.
- Right-click context menu: Delete and Duplicate wired; Loop region and Rename are disabled stubs. Partial — see Open Decisions §8.5.
- Bounce-to-clip modal with virtual instrument + preset + humanizer picker. Done.
- Playhead seek (click ruler), spacebar play/pause, stop preserves position, RTZ resets. Done.
- Tool keyboard shortcuts: V (Select), C (Cut), X (Crossfade — toolbar UI only; no clip logic). Partial — see Open Decisions §8.6.
- BPM input validated at 40–300. Done.
- Collaborator presence cursors (color-tinted lines and avatar chips on track rows). Seed data only — no real-time sync.

---

### 5.3 Track Ownership Model
**Status: Partial**

What is done:
- Collaborator color tinting on track headers, left-edge bar, avatar ring, clip fill/border/waveform, mixer strip wood cap, pan knob arc. Done.
- Record arm button: role-gated (Viewers cannot arm), locks when `track.lockedBy` is another user. Done.
- Mute and Solo buttons: wired to shared track state via App root. Done.
- Lock indicator: emoji shows locking collaborator's color when another user is recording. Done.
- Audio input badge: shows input label, green when armed. Done.

What is partial:
- PanKnob in track header is display-only — drag interaction not implemented. `onChange` prop and horizontal-drag logic are specced in `docs/specs/fx-chain-pan-rms-redesign.md` but not yet built.
- Track lock enforcement is client-side only — `track.lockedBy` is seed data; no server enforces it across clients.
- Role enforcement (`IS_VIEWER`) is a client-side constant — server-side JWT-based role check not built.
- Disabled Mute/Solo/Arm buttons have no tooltip explaining why they are disabled.
- Track Rename is a disabled context menu stub.

Done means: visual tinting + button wiring complete. Collaborative enforcement requires Sprint 2 backend.

---

### 5.4 Invite Flow
**Status: Shipped**

- Role picker (Owner / Editor / Viewer) with radio button semantics. Done.
- Email input field. Done.
- "Send invite" CTA closes modal and shows confirmation. Done (UI only — no email delivery, no backend).
- Escape key closes modal. Done.
- Overlay click closes modal. Done.

No backend integration — invite is a UI prototype only.

---

### 5.5 Mix View (Mixer Panel + FX Chain)
**Status: Partial**

What is done:
- MixerPanel: 7 track strips + master strip, Neve-inspired wood/metal theme. Done.
- MixerStrip: fader (logarithmic, unity at ~75%), pan knob (drag wired), Mute/Solo buttons, VU meters (live post-fader RMS), dB readout, owner avatar, FX badge. Done.
- VU meters: post-fader RMS from AnalyserNode, attack 32/sec, decay 4/sec, peak-hold dot (700ms hold), transient glow (120ms), partial segment shading, prefers-reduced-motion respected. Done — pending Tech Lead sign-off on commit 3507382.
- PluginChainPanel: plugin cards with enable/disable toggle and key param display, empty state with signal-flow SVG and "Add Plugin +" CTA. Done.
- FX badge on mixer strip reflects real plugin chain count. Done.

What is partial:
- Master fader height bug: the master strip renders shorter than track strips due to a 14px spacer where ~48px of vertical bulk is needed. Fix specced in `docs/specs/mix-view.md` line 98.
- FX badge click does not open PluginChainPanel for that track — click handler missing. Specced in `docs/specs/fx-chain-pan-rms-redesign.md`.
- StudioFader ARIA: missing `role="slider"`, `aria-valuemin/max/now`, `aria-label`. Missing keyboard control (ArrowUp/Down). Specced in `docs/specs/mix-view.md`.
- Master pan knob is static at center (value 50) — not connected to state, no onChange. Specced.
- Plugin parameter editing: plugin cards display key params as read-only text; no inline editing interaction. Spec not started — PM decision required on interaction model.
- "Add Plugin +" button: has an onClick stub (`console.log`); no action implemented. PM interaction spec required.
- Heartbeat startup sequence: fader/meter choreography prototype exists in `public/motion-prototypes/03-vu-meter-animation.html` but is not ported to the React app. Deferred to WP-3 close.

---

### 5.6 Mobile Capture
**Status: Not Started**

Intentionally deferred. Desktop-first, minimum viewport 1280px enforced. Mobile capture (minimal record + playback) is a future screen. Do not design or build until PM formally scopes it.

---

## 6. Non-Goals (Prototype Phase)

The following are explicitly out of scope. Any work order touching these areas requires PM override.

- **Real audio recording:** No `getUserMedia` capture, no audio upload pipeline, no WAV file writing. The backend API spec covers this for future sprints but it is not in the prototype.
- **CLAP / VST3 native plugins:** All DSP is Web Audio API only (per ADR-001). No Electron/Tauri sidecar until post-MVP.
- **Undo stack:** No undo/redo. All clip and track mutations are immediate and irreversible. Requires operational transforms or full state snapshots to retrofit.
- **Session history / version control:** No audit log, no restore points.
- **Sample import:** No file upload. All 7 tracks use procedurally synthesized audio.
- **Mobile viewports:** No responsive design below 1280px. The 1280px min-width is enforced at the root div.
- **GraphQL:** REST + WebSocket only per the backend spec. No GraphQL without PM approval.
- **External state library:** No Redux, Zustand, Jotai, or equivalent. useState / useReducer / useContext only, without PM approval.
- **Server-side auth enforcement:** JWT-based role checking is designed in the backend spec but not implemented. Client-side IS_VIEWER constant is a UI hint only.
- **Multi-window or multi-tab support:** Single AudioContext per page is the constraint. Multi-window requires architectural changes not in scope.
- **Ownership transfer:** Track ownership is set at track creation and is immutable in the prototype. Transfer UI is a future exploration item.

---

## 7. Success Metrics

### Quantitative (prototype acceptance)
- Zero P0 or P1 defects open at sprint exit, as validated by UAT agent in `docs/defects.md`.
- All 7 tracks play back simultaneously with no audio glitches on a standard M-series MacBook.
- VU meters sustain 60fps animation (single rAF loop) without measurable CPU spike above baseline.
- The session room renders correctly at exactly 1280px, 1440px, and 1920px viewports.

### Qualitative (usability bar)
- A professional Ableton or Pro Tools user, given no instructions, can: press spacebar to play, identify which tracks belong to which collaborator by color, arm a track to record, open the FX chain for any track, and close the invite modal — all within 60 seconds of first look.
- No DAW convention is violated: stop does not reset playhead; fader unity is at ~75% travel; VU meters respond to fader movement; mute is visually distinct from solo.

### Collaboration legibility bar
- The collaborator color model: in a 4-person session, the 4 collaborator colors are visually distinct (no two are perceptually identical) and appear consistently on track headers, clip waveforms, mixer strip caps, and avatars.

---

## 8. Open Decisions

These are unresolved product questions that are blocking work or will block work in the next sprint. Each must be answered by PM before the dependent feature can be specced or built.

### 8.1 Plugin Browser UX (BLOCKING — Frontend blocked)
What happens when a user clicks "Add Plugin +" in the FX chain? The options are: (a) a modal with search + category browse, (b) an inline dropdown anchored to the button, (c) a full-screen browser panel. The Frontend Engineer has a console.log stub; no implementation can proceed without this spec. This is the highest-priority open PM decision.

### 8.2 VU Calibration Tick Mark
Should the VU meter display a visible tick mark at the 0 VU reference point (the boundary between the green and amber zones, at −18 dBFS)? Pro Tools, Logic, and Ableton all show this marker. The mastering.com spec in `docs/specs/vu-meter-motion.md` recommends it. PM must decide before Designer specifies placement and Frontend implements.

### 8.3 VU Color Band Recalibration
Current color band assignment: 0–65% green, 65–85% amber, 85–100% red. Audio convention places the amber transition at the −18 dBFS calibration point. Should the bands be recalibrated to match the reference, or kept as-is? Affects DSM and the segment coloring constant in `src/App.tsx`.

### 8.4 Stereo Metering vs. Mono-Summed
The VU meter renders two channels (L/R). Currently both read the same AnalyserNode data (mono-summed, cosmetically offset). True per-channel stereo requires a SplitterNode before the analyser. Is mono-summed acceptable for v1, or must it be real stereo? Decision affects audio graph architecture.

### 8.5 Context Menu Stubs (Loop Region + Rename)
Two context menu items are disabled stubs with "(soon)" labels. Should they be: (a) scoped for Sprint 2 with a PM spec, (b) removed from the UI entirely to avoid misleading users, or (c) kept as stubs until Sprint 3? Leaving them in the UI creates a discovery expectation that is currently unmet.

### 8.6 Crossfade Tool
The toolbar shows a Crossfade tool (X shortcut), but no clip crossfade logic exists. Options: (a) scope it for Sprint 2 with a full interaction spec (drag between adjacent clips to create crossfade region with configurable curve), (b) hide/disable the tool button until Sprint 3, or (c) keep the UI as a hint of future capability. The UAT agent has marked this P2-deferred. PM must decide.

### 8.7 Ownership Transfer
Track ownership is set at creation and immutable in the prototype. Is ownership transfer — drag an avatar onto a track, or a context menu option — a Sprint 2 requirement, or post-MVP? Affects the Track Ownership screen spec.

### 8.8 Plugin Parameter Editing UX
When a user views a plugin card in the FX chain (e.g., a compressor), they see key parameters as read-only text (threshold, ratio, attack). Should inline editing be: (a) expanding the card to show knobs per parameter, (b) a side panel that replaces the plugin list, (c) a popover? No spec exists. This gates Sprint 3 audio depth work.

---

## 9. Architecture Constraints (Non-Negotiable)

These constraints must be honored by all agents. Changing them requires PM + Tech Lead approval.

- One `AudioContext` (`_audioCtx`) singleton per session. No second context.
- Audio graph signal order: `source → plugin chain → GainNode(fader) → AnalyserNode(VU tap) → StereoPannerNode → masterGain → masterAnalyser → destination`. This order is load-bearing for correct VU metering.
- All color values via `C.*` tokens. Collaborator colors via inline `style` prop only. No hardcoded hex in `src/`.
- All layout via Tailwind v4 utility classes. No CSS modules, no `@apply`, no styled-components.
- `src/App.tsx` is the only source file in `src/` until a second screen is scaffolded (Tech Lead decides when to split).
- TypeScript strict mode. No `any`. No external state library without PM approval.
