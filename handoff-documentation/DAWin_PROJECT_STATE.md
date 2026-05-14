# DAWin — Project State Snapshot

**Last updated:** 2026-05-14  
**Sprint:** 2 — Real-Time Collaboration (active)  
**Repo:** https://github.com/lukesydow-lab/DAWin  
**Raw handoff:** https://raw.githubusercontent.com/lukesydow-lab/DAWin/main/handoff-documentation/DAWin_PROJECT_STATE.md

---

## Current stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4
- **Backend:** Not yet built. Contracts designed in `docs/specs/multitrack-backend-api.md`. Fastify scaffold is Sprint 2 first task.
- **Real-time:** WebSocket planned (Fastify + ws). Sprint 2.
- **Audio:** Web Audio API — single `_audioCtx` singleton, 7 procedural synthesis tracks
- **All code:** `src/App.tsx` (single file, ~3500 lines). No split until Tech Lead approves.

---

## Component map (src/App.tsx)

| Component | Purpose | Status |
|-----------|---------|--------|
| `App` | Root — owns all track/session state | ✅ |
| `TransportBar` | Logo, play/pause/stop/record, BPM, avatars, Invite | ✅ |
| `ArrangeView` | 7-track timeline, ruler, playhead, clips | ✅ |
| `Clip` | Draggable/resizable clip with bezier fade handles + symmetry lock | ✅ |
| `MixerPanel` | Neve-themed mixer, single rAF VU loop | ✅ |
| `MixerStrip` | Per-track fader, pan, mute/solo, VU meters, FX badge | ✅ |
| `PluginChainPanel` | Fixed overlay (right: 0), rack-style FX units, plugin browser | ✅ |
| `PluginBrowser` | Inline popover — search + add plugin to chain | ✅ |
| `InviteModal` | Role picker + email input (UI only, no backend) | ✅ |
| `StatusBar` | Collaborator count, CPU/RAM/Latency (seed data) | ✅ |

---

## Audio graph (per track)

```
OscillatorNode/BufferSource
  → plugin chain (DynamicsCompressorNode etc. — Sprint 2)
  → GainNode (fader, logarithmic)
  → AnalyserNode (VU tap — post-fader, IEC 60268-17)
  → StereoPannerNode
  → _masterGain
  → _masterAnalyser
  → AudioContext.destination
```

---

## Sprint 1 — shipped (closed 2026-05-14)

Everything in the session room is interactive and visually complete:
- 7-track arranger with clip drag/resize/fade/cut
- Bezier fade curves with draggable midpoint handles
- Crossfade symmetry lock (padlock icon mirrors paired handles)
- Neve mixer: logarithmic faders, pan knobs, mute/solo
- VU meters: live post-fader RMS, 60fps, peak-hold, transient glow, heartbeat startup
- Plugin rack browser: wood cabinet, metal faceplates, power LED in owner color, drag-to-reorder
- FX chain panel: fixed viewport overlay (overflow:clip BFC bug fixed)
- Collaborator color model on all surfaces
- GitHub: milestones, labels, issue templates, PRD, Roadmap

## Sprint 2 — active

**Goal:** Real-time collaboration. Two clients share live session state.

**Open issues:**
- #3 Backend: Fastify scaffold (blocks all WS work)
- #7 Plugin chain in audio graph
- #8 Track ownership polish (PanKnob drag, FX badge → panel, StudioFader ARIA)
- #19 WebSocket presence + transport sync
- #20 Track locking + JWT role enforcement

---

## Design tokens (C object in src/App.tsx)

```
bg: #0A0A0F        surface: #111118    elevated: #1A1A24
accent: #6B5CE7    danger: #E94560     success: #1D9E75
textPri: #F0F0F5   textSec: #888899
wood: #3D2B1F      woodLight: #5C4033
metalDark: #1C1C1E metalMid: #2A2A2E   metalLight: #3A3A3F
vuGreen: #1DB954   vuAmber: #F59E0B    vuRed: #E94560
well: #0D0D12
```

---

## Key layout constants

```
BAR_W=72  TRACK_H=64  RULER_H=24  HANDLE_W=8
FADE_HDL_W=12  TRANSPORT_H=52  STATUS_BAR_H=28
```

---

## Screenshots

Visual archive per sprint: `screenshots/sprint-N-YYYY-MM-DD/`  
Sprint 1 screenshots: https://github.com/lukesydow-lab/DAWin/tree/main/screenshots/sprint-1-2026-05-14
