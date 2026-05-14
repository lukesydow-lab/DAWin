# DAWin — Project State Snapshot

**Last updated:** 2026-05-14  
**Sprint:** 2 — Real-Time Collaboration (active, one item remaining)  
**Repo:** https://github.com/lukesydow-lab/DAWin  
**Raw handoff:** https://raw.githubusercontent.com/lukesydow-lab/DAWin/main/handoff-documentation/DAWin_PROJECT_STATE.md

---

## Current stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4
- **Backend:** Fastify scaffold at `server/` (TypeScript, tsc-clean). Routes: `GET /api/v1/sessions/:id`, `GET /api/v1/auth/me`. WebSocket: full message routing (session.join/leave, transport.play/pause/stop/seek/bpm_change, presence.update fan-out, session.snapshot on connect).
- **Real-time:** WebSocket active (Fastify + `@fastify/websocket`). In-memory session store (`Map<sessionId, SessionState>`).
- **Audio:** Web Audio API — single `_audioCtx` singleton, 7 procedural synthesis tracks, plugin chain audio nodes wired per track.
- **All frontend code:** `src/App.tsx` (single file, ~3500 lines). No split until Tech Lead approves.

---

## Component map (src/App.tsx)

| Component | Purpose | Status |
|-----------|---------|--------|
| `App` | Root — owns all track/session state | ✅ |
| `TransportBar` | Logo, play/pause/stop/record, BPM, avatars, Invite | ✅ |
| `ArrangeView` | 7-track timeline, ruler, playhead, clips | ✅ |
| `Clip` | Draggable/resizable clip with bezier fade handles + symmetry lock | ✅ |
| `MixerPanel` | Neve-themed mixer, single rAF VU loop, heartbeat startup | ✅ |
| `MixerStrip` | Per-track fader, pan, mute/solo, VU meters, FX badge | ✅ |
| `PluginChainPanel` | Fixed overlay (right: 0), rack-style FX units, plugin browser | ✅ |
| `PluginBrowser` | Inline popover — search + add plugin to chain | ✅ |
| `InviteModal` | Role picker + email input (UI only, no backend) | ✅ |
| `StatusBar` | Collaborator count, CPU/RAM/Latency (seed data) | ✅ |

---

## Audio graph (per track)

```
OscillatorNode/BufferSource
  → plugin chain (DynamicsCompressorNode → ConvolverNode → DelayNode+GainNode → BiquadFilterNode → Limiter)
  → GainNode (fader, logarithmic)
  → AnalyserNode (VU tap — post-fader, IEC 60268-17)
  → StereoPannerNode
  → _masterGain
  → _masterPanner (StereoPannerNode)
  → _masterAnalyser
  → AudioContext.destination
```

`rewirePluginChain` reconciler manages node lifecycle. Bypass (enable/disable) removes/reinserts a node without rebuilding the full graph. `_pluginNodeMap: Map<trackId, Map<pluginId, AudioNode>>` tracks all allocated nodes.

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

## Sprint 2 — active (one item remaining)

**Goal:** Real-time collaboration. Two clients share live session state.

**Completed issues:**
- ✅ #3 Backend Fastify scaffold — tsc-clean, WebSocket routing active
- ✅ #7 Plugin chain in audio graph — DynamicsCompressor, Reverb, Delay, EQ, Limiter wired
- ✅ #8 Track ownership polish — PanKnob detent, FX badge → panel, StudioFader ARIA, master pan fix
- ✅ #19 WebSocket presence + transport sync — session.join/leave, transport fan-out, session.snapshot

**Open issue:**
- 🟡 #20 Track locking + JWT role enforcement — server-side enforcement not yet built; client-side `IS_VIEWER` constant remains; no tooltip on disabled controls

---

## Design tokens (C object in src/App.tsx)

```
bg: #0A0A0F        surface: #111118    elevated: #1A1A24
accent: #6B5CE7    danger: #E94560     success: #1D9E75
textPri: #F0F0F5   textSec: #888899    control: #2A2A38
border: #1E1E28    well: #0D0D14       warn: #F5A623
accentMuted: rgba(107,92,231,0.13)
wood: #2E1A0E      woodLight: #4A2C17
metalDark: #14141E metalMid: #2A2A3C   metalLight: #3A3A52
vuGreen: #1EC94A   vuAmber: #F5A623    vuRed: #E94560
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
