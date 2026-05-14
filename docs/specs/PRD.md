# DAWin — Product Requirements Document

**Version:** 1.1  
**Date:** 2026-05-14  
**Author:** PM (Luke)  
**Sprint context:** 2 — Real-Time Collaboration (active)  
**Status:** Living document — update at each sprint review

---

## 1. Product Overview

DAWin is a desktop-first, browser-based collaborative digital audio workstation (DAW) prototype. It is designed for musicians and producers who need to co-create inside a shared session in real time — the way designers already work in Figma. The core differentiator is the collaborator color model: every user is assigned a unique hex color that tints their tracks, clips, mixer strip, and avatar ring across the entire UI, making ownership and activity instantly legible without reading a single label. A Fastify backend scaffold now exists at `server/` (TypeScript, tsc-clean) with WebSocket transport sync and session presence fan-out shipped in Sprint 2; track locking and JWT role enforcement remain in progress. DAWin targets musicians with professional DAW muscle memory — it is intentionally dense, not simplified, and must honor standard conventions (spacebar play/pause, stop-preserves-position, logarithmic faders, post-fader metering) at every surface.

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
- Bezier fade in/out handles with draggable midpoint control points. Done.
- Right-click context menu: Delete and Duplicate wired; Loop region and Rename are disabled stubs. Partial — see Open Decisions §8.5.
- Bounce-to-clip modal with virtual instrument + preset + humanizer picker. Done.
- Playhead seek (click ruler), spacebar play/pause, stop preserves position, RTZ resets. Done.
- Tool keyboard shortcuts: V (Select), C (Cut). Done. X (Crossfade) — RESOLVED: crossfade tool removed from toolbar; clip overlap now produces an implicit bezier crossfade with symmetry lock (`crossfadeLocked` on ClipData). Done.
- BPM input validated at 40–300. Done.
- Collaborator presence cursors (color-tinted lines and avatar chips on track rows). Seed data only — WebSocket presence is Sprint 2 backend work.

---

### 5.3 Track Ownership Model
**Status: Partial**

What is done:
- Collaborator color tinting on track headers, left-edge bar, avatar ring, clip fill/border/waveform, mixer strip wood cap, pan knob arc. Done.
- Record arm button: role-gated (Viewers cannot arm), locks when `track.lockedBy` is another user. Done.
- Mute and Solo buttons: wired to shared track state via App root. Done.
- Lock indicator: emoji shows locking collaborator's color when another user is recording. Done.
- Audio input badge: shows input label, green when armed. Done.
- PanKnob drag interaction: horizontal drag wired, double-click to center. Done (Sprint 2).
- PanKnob center detent: 2px wide notch at `C.textPri` color extends above/below bar; ±4 unit dead zone snaps to 0 during drag. Done (Sprint 2).
- FX badge click on mixer strip: opens PluginChainPanel for the selected track. Done (Sprint 2).
- StudioFader ARIA: `role="slider"`, track-scoped `aria-label`, ArrowUp/Down ±1, Shift+Arrow ±10. Done (Sprint 2).

What is partial:
- Track lock enforcement is client-side only — `track.lockedBy` is seed data; no server enforces it across clients. Requires #20 (Sprint 2 backend).
- Role enforcement (`IS_VIEWER`) is a client-side constant — server-side JWT-based role check not built. Requires #20.
- Disabled Mute/Solo/Arm buttons have no tooltip explaining why they are disabled.
- Track Rename is a disabled context menu stub.

---

### 5.4 Invite Flow
**Status: Shipped**

- Role picker (Owner / Editor / Viewer) with radio button semantics. Done.
- Email input field. Done.
- "Send invite" CTA closes modal and shows confirmation. Done (UI only — no email delivery).
- Escape key closes modal. Done.
- Overlay click closes modal. Done.

---

### 5.5 Mix View (Mixer Panel + FX Chain)
**Status: Partial**

What is done:
- MixerPanel: 7 track strips + master strip, Neve-inspired wood/metal theme. Done.
- MixerStrip: fader (logarithmic, unity at ~75%), pan knob (drag wired), Mute/Solo buttons, VU meters (live post-fader RMS), dB readout, owner avatar, FX badge. Done.
- VU meters: post-fader RMS from AnalyserNode, attack 32/sec, decay 4/sec, peak-hold dot (700ms hold), transient glow (120ms), prefers-reduced-motion respected. Done.
- VU heartbeat startup: bloom + staggered motorized recall animation on mount. Done (Sprint 2).
- PluginChainPanel: rack-style FX units — wood cabinet rails, brushed-metal faceplates, power LED in owner color, amber LCD param readout, Screw SVGs, drag-to-reorder. Inline PluginBrowser popover with search. Done (Sprint 2).
- FX badge click opens PluginChainPanel for the selected track. Done (Sprint 2).
- StudioFader ARIA: role=slider, track-scoped aria-label, keyboard control. Done (Sprint 2).
- Master pan knob: connected to `masterPan` state; wired to `_masterPanner` StereoPannerNode; mapping `(masterPan-50)/50`; default corrected to 50 (center). Done (Sprint 2).
- FX chain panel viewport positioning bug fixed (overflow:clip BFC on #root). Done (Sprint 1 close).
- Plugin chain audio graph: DynamicsCompressorNode, ConvolverNode (procedural IR), DelayNode + feedback GainNode, BiquadFilterNode, Limiter wired into per-track signal path. `rewirePluginChain` reconciler; `_pluginNodeMap` module-level ref; enable/disable bypasses without graph rebuild. Done (Sprint 2).

What is partial:
- Plugin parameter editing: plugin cards display key params as read-only text; no inline editing interaction. Spec not started — PM decision required on interaction model (see §8.8).

---

### 5.6 Mobile Capture
**Status: Not Started**

Intentionally deferred. Desktop-first, minimum viewport 1280px enforced.

---

## 6. Non-Goals (Prototype Phase)

- **Real audio recording:** No `getUserMedia` capture, no audio upload pipeline, no WAV file writing.
- **CLAP / VST3 native plugins:** All DSP is Web Audio API only (per ADR-001).
- **Undo stack:** No undo/redo. All mutations are immediate and irreversible.
- **Session history / version control:** No audit log, no restore points.
- **Sample import:** No file upload. All 7 tracks use procedurally synthesized audio.
- **Mobile viewports:** No responsive design below 1280px.
- **GraphQL:** REST + WebSocket only. No GraphQL without PM approval.
- **External state library:** No Redux, Zustand, Jotai, or equivalent without PM approval.
- **Server-side auth enforcement:** JWT role checking designed but not yet implemented. `IS_VIEWER` client constant is a UI hint only — #20 resolves this.
- **Multi-window or multi-tab support:** Single AudioContext per page constraint.
- **Ownership transfer:** Track ownership immutable in prototype.

---

## 7. Success Metrics

### Quantitative
- Zero P0 or P1 defects open at sprint exit.
- All 7 tracks play back simultaneously with no audio glitches on a standard M-series MacBook.
- VU meters sustain 60fps animation (single rAF loop) without measurable CPU spike above baseline.
- Session room renders correctly at 1280px, 1440px, and 1920px viewports.

### Qualitative
- A professional Ableton or Pro Tools user can: press spacebar to play, identify collaborator track ownership by color, arm a track, open the FX chain, and close the invite modal — all within 60 seconds of first look.
- No DAW convention violated: stop does not reset playhead; fader unity at ~75%; VU meters respond to fader movement; mute visually distinct from solo; pan knob snaps to center on double-click.

---

## 8. Open Decisions

### 8.1 Plugin Browser UX — RESOLVED
**Decision (Sprint 2):** Inline popover anchored to "+ ADD UNIT" button with text search and category list. Plugin added to chain immediately on selection. Implemented as `PluginBrowser` component inside `PluginChainPanel`.

### 8.2 VU Calibration Tick Mark
Should the VU meter display a visible tick mark at the 0 VU reference point (−18 dBFS boundary)? PM must decide before Designer specifies and Frontend implements.

### 8.3 VU Color Band Recalibration
Current: 0–65% green, 65–85% amber, 85–100% red. Should bands be recalibrated to match −18 dBFS convention? Affects DSM and segment coloring constant in `src/App.tsx`.

### 8.4 Stereo Metering vs. Mono-Summed
Both L/R channels currently read the same AnalyserNode (mono-summed, cosmetically offset). True stereo requires a SplitterNode. Acceptable for v1?

### 8.5 Context Menu Stubs (Loop Region + Rename)
Two disabled stubs with "(soon)" labels. Scope for Sprint 3, remove, or keep as stubs?

### 8.6 Crossfade Tool — RESOLVED
**Decision (Sprint 1 close):** Crossfade toolbar tool removed. Crossfades are implicit on clip overlap: bezier crossfade region created automatically. `crossfadeLocked: boolean` on ClipData mirrors paired handles when locked; unlocked = independent. Padlock icon in overlap zone.

### 8.7 Ownership Transfer
Post-MVP or Sprint 2 requirement? Affects Track Ownership screen spec.

### 8.8 Plugin Parameter Editing UX
Expanding card, side panel, or popover? No spec exists. Gates Sprint 3 audio depth work.

### 8.9 Fastify Backend — Now Exists (Sprint 2)
Scaffold committed at `server/` (TypeScript, tsc-clean). Routes: `GET /api/v1/sessions/:id`, `GET /api/v1/auth/me`. WebSocket: session.join/leave, transport.play/pause/stop/seek/bpm_change, presence.update fan-out, session.snapshot on connect. Remaining work: #20 (JWT enforcement + server-side track locking).

---

## 9. Architecture Constraints (Non-Negotiable)

- One `AudioContext` (`_audioCtx`) singleton per session. No second context.
- Audio graph signal order: `source → [plugin chain] → GainNode(fader) → AnalyserNode(VU tap) → StereoPannerNode → _masterGain → _masterPanner → _masterAnalyser → destination`. Load-bearing for correct VU metering.
- All color values via `C.*` tokens. Collaborator colors via inline `style` prop only. No hardcoded hex in `src/`.
- All layout via Tailwind v4 utility classes. No CSS modules, no `@apply`, no styled-components.
- `src/App.tsx` is the only source file in `src/` until a second screen is scaffolded.
- TypeScript strict mode. No `any`. No external state library without PM approval.
- CI enforces `--noUnusedLocals --noUnusedParameters` at typecheck step (tightened Sprint 2).
