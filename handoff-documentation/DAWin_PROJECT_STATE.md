# DAWin — Project State Snapshot

> **Generated:** 2026-05-12  
> **Sprint:** 1 (Core Session Room)  
> **Owner:** Luke (PM)

---

## What This Is

A single-file snapshot of everything built, every decision made, every open item, and every blocked dependency. Read this to get full context on the project without opening any other file.

---

## Vision

**"Figma for music production."** A desktop-first collaborative DAW where musicians share a live session — with track ownership, presence indicators, real-time sync, and role-based access. The UI must feel like a pro audio tool (dense, dark, precise) while layering real-time collaboration cues (avatars, color tinting, live cursors).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) — utility classes only, no `tailwind.config.js`, no `@apply` |
| Audio | Web Audio API — `AudioContext`, `AudioBuffer`, `GainNode`, `AnalyserNode`, `StereoPannerNode` |
| Backend (planned) | Node.js 22 LTS + Fastify 5 + `@fastify/websocket` + in-memory `StorageAdapter` |
| Database (planned) | In-memory Maps behind `StorageAdapter` interface (swap to Postgres without touching consumers) |
| Blob storage (planned) | Local disk `/tmp/assets/` (swap to S3/R2 for multi-user) |
| Design system | Figma file `o4IccZFYzEvsHe3dVcco7X` — GDAW Design System |

---

## Design Tokens (`C` object in `src/App.tsx`)

```ts
const C = {
  bg:          '#0A0A0F',   // outermost canvas
  surface:     '#111118',   // panels, sidebars
  elevated:    '#1A1A24',   // cards, modals, dropdowns
  accent:      '#6B5CE7',   // purple — primary actions, focused elements
  danger:      '#E94560',   // record arm, destructive actions
  success:     '#1D9E75',   // active, online, armed-and-ready states
  textPri:     '#F0F0F5',   // primary labels
  textSec:     '#888899',   // secondary labels, placeholders, metadata
  control:     '#2A2A38',   // button backgrounds, inactive controls
  border:      '#1E1E28',   // subtle dividers
  well:        '#0D0D14',   // inset areas, track groove
  warn:        '#F5A623',   // VU amber zone, warnings
  accentMuted: 'rgba(107,92,231,0.13)',
  // Studio theme
  wood:        '#2E1A0E',
  woodLight:   '#4A2C17',
  vuGreen:     '#1EC94A',
  vuAmber:     '#F5A623',
  vuRed:       '#E94560',
  metalDark:   '#14141E',
  metalMid:    '#2A2A3C',
  metalLight:  '#3A3A52',
}
```

**Rule:** Never hardcode hex values inline. Always use `C.*` tokens. Collaborator colors are stored on the track/user seed data objects and applied via inline `style` props.

---

## Collaborator Model

```ts
const COLLAB_COLORS = ['#6B5CE7', '#1D9E75', '#E94560', '#F5A623', '#00B4D8']
const COLLABORATORS = [
  { id: 'luke',   name: 'Luke',   initial: 'L', color: COLLAB_COLORS[0], role: 'Owner'  },
  { id: 'anna',   name: 'Anna',   initial: 'A', color: COLLAB_COLORS[1], role: 'Editor' },
  { id: 'miguel', name: 'Miguel', initial: 'M', color: COLLAB_COLORS[2], role: 'Editor' },
  { id: 'priya',  name: 'Priya',  initial: 'P', color: COLLAB_COLORS[3], role: 'Viewer' },
]
```

Each collaborator's `color` tints: track header accent bar, clips on the arranger timeline, FX badge, MixerStrip wood cap border, avatar ring. This is the core collaboration differentiator — every new surface must honor it.

---

## Layout Constants (`src/App.tsx`)

```ts
BAR_W        = 72    // px per bar in arranger
BARS         = 32    // total bars in session
TRACK_H      = 64    // px per track row
RULER_H      = 24    // timeline ruler height
HANDLE_W     = 8     // clip resize handle width
FADE_HDL_W   = 12    // fade handle width
TRANSPORT_H  = 52    // transport bar height
STATUS_BAR_H = 28    // status bar height
```

**Layout rule:** desktop-first, `min-width: 1280px` enforced on root. DAW chrome: transport top → arranger center → mixer bottom/side.

---

## Audio Graph (current, post-VU-wiring)

```
Track AudioBuffer (synthesized per-instrument)
        │
        ▼
  GainNode  ←── track.volume / 100 (linear, log curve via faderToDb)
        │
        ▼
  AnalyserNode  ←── VU meter taps RMS here (POST-FADER) ✓
        │
        ▼
  StereoPannerNode  ←── track.pan (-1..1)
        │
        ▼
  _masterGain  ←── masterVol / 100
        │
        ▼
  _masterAnalyser  ←── master strip VU tap
        │
        ▼
  AudioDestination
```

**AudioContext:** one shared `_audioCtx`, lazily initialized via `getAudioCtx()` on first user gesture. All per-track nodes live in this context. **Do not create a second context.**

---

## Component Map (`src/App.tsx` — 2,759 lines, all in one file)

| Component | Line | Purpose |
|---|---|---|
| `Avatar` | 509 | Collaborator avatar circle with optional ring |
| `TransBtn` | 524 | Transport button (play/pause/stop/rewind/record) |
| `MiniBtn` | 533 | Small toggle button (mute/solo/arm/tool) |
| `Knob` | 562 | SVG radial pan/send knob with arc indicator |
| `StudioFader` | 669 | Vertical studio fader with grip ridges, log curve |
| `PanKnob` | 766 | Horizontal pan drag control |
| `Toolbar` | 852 | Arranger tool selector (select/cut/crossfade) |
| `TrackHeader` | 888 | Left-rail track row (avatar, name, M/S/R, pan) |
| `Clip` | 961 | Arranger clip — waveform canvas, drag, resize, fades, cut |
| `ContextMenu` | 1203 | Right-click clip menu (Delete, Duplicate, Bounce, Loop, Rename) |
| `BounceModal` | 1245 | Bounce-to-clip modal with instrument + preset picker |
| `ArrangeView` | 1384 | Full arranger — ruler, tracks, playhead, drag engine |
| `MixerStrip` | 1889 | Single channel strip — VU, fader, pan, M/S, FX badge, avatar |
| `MixerPanel` | 2015 | Full mixer — 7 strips + master, rAF VU loop, wood frame |
| `TransportBar` | 2233 | Top bar — play/stop/record/BPM/position/invite |
| `InviteModal` | 2294 | Invite collaborator modal |
| `StatusBar` | 2348 | Bottom bar — collaborator presence, CPU/latency |
| `PluginChainPanel` | 2402 | FX chain overlay panel (720px, slides in from right) |
| `App` | ~2460 | Root — session state, playback engine, rAF loop |

---

## Features Shipped (Sprint 1)

### Session room
- Arranger with 7 tracks, 32 bars, clips, playhead seek
- Track headers: mute, solo, arm (all wired), pan knob, collaborator avatar
- Clip drag (bar-snapped, preserves grab offset), resize (left/right handles), cut tool
- Fade in/out handles with linear/ease/sharp curves
- Right-click context menu: Delete, Duplicate, Bounce (wired); Loop region, Rename (disabled stubs)
- Bounce-to-clip modal with virtual instrument + preset selector + humanizer style

### Playback engine
- Web Audio API playback: 7 synthesized tracks (kick, snare, hihat, bass, synthLead, pad, vox)
- Procedural synthesis for all 7 instruments — no sample files required
- Transport: Play/Pause (spacebar), Stop (holds position), Return-to-Zero, Record arm
- BPM input with 40–300 range validation
- Tool shortcuts: V (select), C (cut), X (crossfade) — keyboard wired

### Mixer
- 7 track strips + master: fader (log curve, unity at ~75% travel), pan, mute, solo
- FX badge shows real plugin chain count per track
- StudioFader with grip ridges, `faderToDb` log curve, `formatDb` display (floor: −90 dB)
- **VU meters (live, post-fader):** RMS from `AnalyserNode`, attack 32/sec, decay 4/sec, peak-hold dot (700ms, 0.5/sec drop), transient glow (120ms), partial segment shading — no state, direct DOM writes from single rAF loop
- Master strip: own `GainNode` + `AnalyserNode`, `masterVol` wired to real audio gain

### Studio theme (Neve-inspired)
- Wood top rail (gradient), wood end cheeks on mixer panel
- MixerStrip wood cap (8px) + owner color border (2px)
- Metallic fader handle with grip ridges
- VU color bands: 0–65% green, 65–85% amber, 85–100% red

### Panels & modals
- PluginChainPanel: 720px fixed overlay, slides in from right (220ms cubic-bezier), backdrop dim
- FX chain: populated state (plugin cards with enable toggle, params, overflow menu) + empty state (signal flow SVG + "Add Plugin +" CTA)
- InviteModal: role selector, email input, "Send invite" CTA (wired), Escape closes
- StatusBar: collaborator presence dots, online count, CPU/RAM/Latency

### Accessibility (WP-5 pass)
- All icon-only controls have `aria-label`
- `MiniBtn`: `role="button"`, focus-visible ring
- `MixerStrip`: keyboard nav on fader and pan
- VU meter segment containers: `role="presentation"` `aria-hidden="true"`
- dB readout: `aria-live="polite"` `aria-label="{track.name} output level"`
- `prefers-reduced-motion`: disables transient glow and peak-hold drop animation when set

### Waveform rendering
- Audio waveform rendered to `<canvas>` per clip using `buildWaveformPeaks()` (RMS downsampling)
- Cold-load ghost waveform: seeded deterministic bars when `resolveBuffer()` returns null (no flicker)
- Waveform fill color = owner color at 18% opacity, background = owner color at 8% opacity

---

## Figma Design System — Current State

**File:** `o4IccZFYzEvsHe3dVcco7X` — GDAW Design System

### Pages

| Page | Status |
|---|---|
| 🪙 Tokens | Exists |
| ⚛ Atoms | Complete (see below) |
| 🧩 Molecules | Complete (see below) |
| 🦠 Organisms | Complete (see below) |
| 📐 Templates | Exists (not yet populated) |
| 📄 Docs | Exists |

### Atoms (`⚛ Atoms` page)

| Component | Variants | Notes |
|---|---|---|
| Button | Multiple | Interaction section |
| Toggle | On/Off | |
| InputField | Default/focus/error | |
| Avatar | Sizes | Collaborator ring |
| TrackAccentBar | — | Owner color tint bar |
| TrackControlButton | States | M/S/R |
| Fader | — | StudioFader representation |
| LevelMeter | — | VU column |
| Badge | States | Role/status badge |
| RoleOption | — | Invite modal role picker |
| **Knob** | center/left/right | 28×28 metallic radial, accent arc, indicator dot — *added 2026-05-11* |
| **PanKnob** | center/left/right | 80×16 horizontal slider, center detent, L/R labels — *added 2026-05-11* |
| **TransBtn** | 5 types × 2 states | 32×32, Unicode icons, accent/danger active tint — *added 2026-05-11* |

### Molecules (`🧩 Molecules` page) — canonical grid: x=380, section gap=120px, component gap=40px

| Component | Position | Variants | Notes |
|---|---|---|---|
| TrackHeader | y=180 | 700×180 | Owner color accent bar |
| ChannelStrip | y=480 | 384×254 | Rebuilt to match shipped 64px-wide MixerStrip — *2026-05-11* |
| Clip | y=854 | 5 (audio/synth × state) | audio-default, synth-default, hovered, muted, faded — *added 2026-05-11* |
| Toolbar | y=1026 | 3 (select/cut/crossfade) | 22×18px buttons, active=accent — *added 2026-05-11* |
| StatusBar | y=1164 | 2 (4-online/0-online) | 28px height, presence dots — *added 2026-05-11* |
| TransportBar | y=1312 | — | |

### Organisms (`🦠 Organisms` page) — same canonical grid

| Component | Position | Variants | Notes |
|---|---|---|---|
| SessionTopbar | y=180 | — | 1440×52 |
| TrackSidebar | y=352 | — | 260×264 |
| **MixerPanel** | y=352 | default | 540×316px — wood top rail + left/right cheeks + 7 track strips + master MSTR — *rebuilt 2026-05-11* |
| FXChainPanel | y=736 | empty / populated | 720×520px — accuracy fix: owner border on header (44px) only — *rebuilt 2026-05-11* |
| ConflictModal | y=1376 | — | |
| InviteModal | y=1536 | — | |
| [archived] MixerPanel v1 | x=3000 | — | Old version, kept for reference |

---

## Git History

```
3507382  feat: VU meter live audio wiring + motion physics (post-fader RMS, attack/decay, peak-hold, transient glow, heartbeat integration)
bc786ba  fix: formatDb threshold -90dB, single-layer mute opacity, waveform cold-load placeholder
18273f8  fix: correct left-side layout shift — track headers and arranger left edge now flush
b6a770f  chore: update .gitignore, tag sprint-1-complete
cb05b3f  chore: enforce source ownership and commit discipline
6fff143  chore: initialize git — Sprint 1 complete (WP-1 through WP-7)
```

---

## Defect Register — Final State

| Priority | Status | Issue |
|---|---|---|
| P0 | ✅ fixed | M/S/R buttons in track headers had no `onClick` |
| P0 | ✅ fixed | M/S buttons in mixer strip stuck; Pad couldn't unmute |
| P0 | ✅ fixed | Mixer fader/pan isolated local state — changes didn't persist |
| P1 | ✅ fixed | Spacebar didn't play/pause |
| P1 | ✅ fixed | Tool keyboard shortcuts V/C/X not wired |
| P1 | ✅ fixed | Escape didn't close modals |
| P1 | ✅ fixed | "Send invite" CTA had no `onClick` |
| P2 | ✅ fixed | Clip drag ignored grab offset — clips snapped to leading edge |
| P2 | ⏸ deferred | Crossfade tool — UI only, no implementation (L effort, needs spec) |
| P2 | ✅ fixed (partial) | Context menu: Delete + Duplicate wired; Loop region + Rename remain disabled stubs |
| P2 | ✅ fixed | FX badge hardcoded "FX:2" — now reads real plugin chain count |
| P2 | ⏸ deferred | "Add Plugin +" has no `onClick` — awaiting PM interaction spec |
| P2 | ✅ fixed | Stop kept position; Return to Zero resets (correct DAW convention now) |
| P2 | ✅ fixed | No `min-width: 1280px` — layout broke below 1280px |
| P3 | ✅ fixed | VU meters static — **resolved by VU motion work (WP-3)** |
| P3 | ✅ fixed | Master strip dB readout hardcoded "+6.0 dB" |
| P3 | ✅ fixed | Fader dB curve was linear — now logarithmic with unity at ~75% |
| P3 | ✅ fixed | Hardcoded `'#2E2E42'` ruler color — now uses `C.*` token |
| P3 | ✅ fixed | BPM input accepted out-of-range values silently |

**Remaining open:** 2 deferred items (crossfade tool, Add Plugin +) + 2 context menu stubs (Loop region, Rename).

---

## Open Blockers

| Who is blocked | Blocker | Who unblocks |
|---|---|---|
| Frontend | "Add Plugin +" interaction spec — plugin browser UX not defined | PM |
| Frontend | Crossfade tool — no spec, L effort | PM to scope or deprioritize |
| Backend | 4 spec revisions before Fastify scaffold: (1) stamp `WsMessage.from` server-side, (2) PUT chain delete semantics, (3) add `GET /auth/me`, (4) upload timeout | Backend self-resolves, then scaffold begins |
| Frontend | Heartbeat startup → VU integration — `signalTarget` drive exists in HTML prototype only, not yet ported to React | Frontend (no blocker, just not done) |

---

## Open PM Questions (VU meter — need answers before next design iteration)

1. **0 VU calibration marker.** Show a visible tick at −18 dBFS (the 65% green/amber boundary)? Pro Tools, Logic, Ableton all show this.
2. **Color band recalibration.** Current: 0–65% green, 65–85% amber, 85–100% red. Audio convention puts the amber transition at 0 VU (= −18 dBFS). Recalibrate?
3. **Stereo metering.** V1: mono-summed meter or true L/R per channel? The audio graph already has stereo data — this is a rendering decision.

---

## Screen Checklist

| Screen | Status |
|---|---|
| Session room — arranger + mixer | ✅ complete |
| Track ownership (color avatars, record arm, input routing) | ⚠️ partial |
| Invite flow modal | ✅ complete |
| Mix view (shared fader, mute/solo, plugin chain) | ⚠️ partial |
| Mobile capture | ❌ not started |

---

## Backend Spec Summary (`docs/specs/multitrack-backend-api.md`)

**Status:** Draft rev 1. 4 revisions required before Fastify scaffold starts.

| Layer | Decision |
|---|---|
| Runtime | Node.js 22 LTS + TypeScript (Worker threads for DSP; Bun not ready) |
| HTTP | Fastify 5 + `@fastify/websocket` |
| WebSocket | Raw `ws` — no Socket.IO (binary audio frames) |
| DB (proto) | In-memory Maps behind `StorageAdapter` interface |
| Blob (proto) | Local disk `/tmp/assets/` — same interface |

**Planned API surface:** 24-bit audio recording pipeline, per-track + master plugin chains, real-time transport sync + track locking, session persistence (projects, tracks, clips, plugin state, assets).

**Shared types:** `src/shared/types.ts` — source of truth for all interfaces shared between frontend and backend.

---

## Key Architectural Decisions

| Decision | Record |
|---|---|
| DSP locality | `docs/adr/001-dsp-locality.md` — audio processing runs client-side via Web Audio API; server is coordination-only |
| No external state library | Local `useState`/`useReducer` + `useContext`; no Redux/Zustand until PM approves |
| Single `AudioContext` | One shared `_audioCtx` at module scope; all tracks share it |
| Post-fader metering | `AnalyserNode` taps after `GainNode` — IEC 60268-17, matches Pro Tools/Logic/Ableton convention |
| No CSS modules / styled-components | Tailwind v4 utility classes + inline `style` for dynamic values only |
| All components in `src/App.tsx` | Migrate to `src/components/<Name>.tsx` as screens are added; no barrel exports under 5 components |

---

## Docs Directory

```
docs/
  adr/
    001-dsp-locality.md             — DSP locality decision record
  specs/
    session-room.md
    arranger-view.md
    track-ownership.md
    mix-view.md
    fx-chain-pan-rms-redesign.md
    invite-flow.md
    status-bar.md
    transport-bar.md
    multitrack-backend-api.md       — full backend API contract
    sprint1-defect-work-order.md    — WP-1 through WP-3 work orders
    vu-meter-motion.md              — VU motion spec (attack/decay, peak-hold, audio wiring)
  handoffs/
    session-room-design.md
    arranger-view-design.md
    track-ownership-design.md
    mix-view-design.md
    fx-chain-pan-rms-design.md
    invite-flow-design.md
    status-bar-design.md
    transport-bar-design.md
    backend-architecture-design.md
    wp1-defect-fixes.md
    wp4-tech-lead-review.md
    wp5-designer-handoff.md
    wp6-fx-pan-rms.md
    wp7-panel-overlay.md
    wp8-layout-shift-fix.md
    uat-bug-fixes-wp8.md
    vu-meter-motion-design.md       — VU handoff (routed through Tech Lead → FE)
  defects.md                        — full UAT defect register
```

---

## What's Next (suggested)

1. **PM:** Answer the 3 VU meter calibration questions above
2. **PM:** Write the "Add Plugin +" interaction spec (plugin browser UX) to unblock FE
3. **Tech Lead:** Sign off on VU meter implementation (`3507382`) before marking WP-3 closed
4. **Backend:** Self-resolve 4 spec revisions → begin Fastify scaffold
5. **Frontend:** Port heartbeat startup → VU `signalTarget` integration from HTML prototype to React
6. **Designer:** Design the Track Ownership screen (screen 2 — currently partial)
7. **PM:** Scope or deprioritize crossfade tool and context menu Loop/Rename stubs
