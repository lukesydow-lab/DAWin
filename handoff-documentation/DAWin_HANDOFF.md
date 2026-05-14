# DAWin — Project Handoff Document

> **Purpose:** Standalone context document for AI-assisted feature workshopping and work order generation.  
> **Last updated:** 2026-05-14  
> **Project owner:** Luke (PM)  
> **Sprint:** 2 — Real-Time Collaboration (active, one item remaining: #20)

---

## 1. Project Overview

DAWin is a browser-based collaborative digital audio workstation (DAW) UI prototype. It is being designed and built by an AI agent team orchestrated by a human PM. The prototype currently runs locally with a Fastify backend scaffold at `server/` (TypeScript, tsc-clean) and is built as a single React/TypeScript frontend application.

The project is at a substantial prototype stage: the session room is fully interactive, audio plays through the Web Audio API with a live plugin chain in the signal path, all core mixer controls are wired, a Neve-inspired studio visual theme is applied, and real-time WebSocket transport sync and collaborator presence are implemented server-side. The one remaining Sprint 2 item is server-side track locking and JWT role enforcement (#20).

**Repository root:** `/Users/lukesydow/daw-design`  
**Primary source file:** `src/App.tsx` (~3,500 lines — all components in one file by design during early sprint)  
**Backend:** `server/` (Fastify + `@fastify/websocket`, TypeScript, tsc-clean)  
**Dev server:** `npm run dev` → `http://localhost:5173`

---

## 2. Current Product Vision

**"Figma for music production."**

A desktop-first collaborative DAW where musicians share a live session in real time — with track ownership, collaborator presence indicators, role-based access, and a professional studio aesthetic. The core differentiator is the collaborator color model: every user has a unique hex color that tints their tracks, clips, avatar ring, and mixer strip throughout the UI. This color signal makes ownership and activity instantly legible across the session.

**Primary user:** A musician or producer with strong DAW muscle memory (Ableton/Logic/Pro Tools) who is collaborating remotely with 1–4 others on a shared session. They expect standard keyboard shortcuts, correct timeline conventions, and clear ownership signals — not a toy.

**Desktop-first:** Minimum viewport 1280px enforced (`min-width: 1280px` on root). Mobile capture is a planned future screen but is explicitly not the current focus.

**What this is not:** A sample player, a social music app, or a simplified tool for beginners. It is a professional-grade collaborative workspace. Information density is intentional — do not over-space or over-simplify.

---

## 3. Current Architecture / Repo Structure

### Directory layout

```
/Users/lukesydow/daw-design/
├── src/
│   └── App.tsx                   # All components (single file — intentional)
│   └── App.css                   # Minimal CSS (wood panel class, CSS animations)
├── server/                       # Fastify backend scaffold (Sprint 2)
│   ├── index.ts                  # Fastify app with @fastify/websocket
│   ├── store.ts                  # In-memory Map<sessionId, SessionState>
│   ├── types.ts                  # ClientMeta, SessionState, WsClientMessage, WsBroadcast<T>
│   ├── routes/
│   │   ├── sessions.ts           # GET /api/v1/sessions/:id
│   │   └── auth.ts               # GET /api/v1/auth/me
│   ├── ws/
│   │   └── handler.ts            # Full WebSocket message routing
│   ├── package.json
│   └── tsconfig.json
├── public/
│   └── motion-prototypes/
│       └── 03-vu-meter-animation.html   # Standalone VU meter motion prototype
├── docs/
│   ├── adr/
│   │   └── 001-dsp-locality.md         # Accepted: DSP runs in browser via Web Audio API
│   ├── specs/                          # Feature specs (PM/Designer write; agents implement)
│   │   ├── PRD.md                      # Product Requirements Document v1.1
│   │   ├── ROADMAP.md                  # Sprint-by-sprint roadmap v1.1
│   │   ├── session-room.md
│   │   ├── arranger-view.md
│   │   ├── track-ownership.md
│   │   ├── mix-view.md
│   │   ├── fx-chain-pan-rms-redesign.md
│   │   ├── crossfade-direct-manipulation.md
│   │   ├── invite-flow.md
│   │   ├── status-bar.md
│   │   ├── transport-bar.md
│   │   └── multitrack-backend-api.md
│   ├── handoffs/                       # Agent → Tech Lead review requests
│   │   └── [one file per feature]
│   └── defects.md                      # UAT defect register
├── screenshots/
│   └── sprint-1-2026-05-14/            # Visual archive: 3 JPGs + NOTES.md
├── .claude/
│   └── agents/                         # Agent persona definitions
├── .github/
│   └── workflows/
│       └── ci.yml                      # tsc --noEmit --noUnusedLocals --noUnusedParameters + Vite build
├── STATUS.md                           # Live project status board (Tech Lead writes)
└── handoff-documentation/
    ├── DAWin_PROJECT_STATE.md          # Technical state snapshot
    └── DAWin_HANDOFF.md                # This file
```

### Frontend architecture

- **Framework:** React 18 + Vite + TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` plugin. No `tailwind.config.js`. No `@apply`. No CSS modules. All layout/spacing/typography via utility classes. Dynamic values (collaborator colors, calculated widths) via inline `style` prop only.
- **State:** `useState` / `useReducer` / `useContext`. No external state library. The PM agent must approve any introduction of Redux, Zustand, or equivalent.
- **Audio:** Web Audio API. One shared `AudioContext` (`_audioCtx`) at module scope, lazy-initialized on first user gesture via `getAudioCtx()`. All per-track nodes live in this context. Plugin chain nodes are tracked via `_pluginNodeMap`.
- **Component structure:** All components currently in `src/App.tsx`. Migration to `src/components/<ComponentName>.tsx` begins when a second screen is scaffolded. No barrel exports until 5+ components in a directory.

### Audio graph (current — post Sprint 2)

```
Track AudioBuffer (procedurally synthesized)
        │
        ▼
  [Plugin Chain]  ←── per-track plugin nodes (rewirePluginChain reconciler)
  DynamicsCompressorNode
  ConvolverNode (procedural IR reverb)
  DelayNode + feedback GainNode
  BiquadFilterNode (EQ)
  GainNode (Limiter)
        │
        ▼
  GainNode  ←── track.volume (0–100) mapped via faderToDb() log curve
        │
        ▼
  AnalyserNode  ←── VU meter taps RMS here (POST-FADER, IEC 60268-17)
        │
        ▼
  StereoPannerNode  ←── track.pan mapped (-1..1)
        │
        ▼
  _masterGain  ←── masterVol (0–100), wired to real GainNode
        │
        ▼
  _masterPanner  ←── masterPan (0–100) → (masterPan-50)/50
        │
        ▼
  _masterAnalyser  ←── master strip VU tap
        │
        ▼
  AudioDestination
```

`rewirePluginChain(trackId, plugins, ctx)` reconciler: creates/removes nodes as the chain changes without rebuilding the full graph. Enable/disable (bypass) removes the node from the chain silently. `_pluginNodeMap: Map<string, Map<string, AudioNode>>` at module scope.

### Key layout constants (do not change without updating DSM)

```ts
BAR_W        = 72    // px per bar in arranger timeline
BARS         = 32    // total bars in a session
TRACK_H      = 64    // px per track row (arranger + mixer strip height)
RULER_H      = 24    // timeline ruler height
HANDLE_W     = 8     // clip resize handle width
FADE_HDL_W   = 12    // fade handle width
TRANSPORT_H  = 52    // transport bar height
STATUS_BAR_H = 28    // status bar height
```

### Design tokens (the `C` object — never hardcode hex values)

```ts
const C = {
  bg:          '#0A0A0F',            // outermost canvas background
  surface:     '#111118',            // panels, sidebars, track rows
  elevated:    '#1A1A24',            // cards, modals, mixer strips, dropdowns
  accent:      '#6B5CE7',            // purple — primary CTA, focused elements, master strip
  danger:      '#E94560',            // record arm, destructive actions, VU red zone
  success:     '#1D9E75',            // online/active/armed-ready states
  textPri:     '#F0F0F5',            // primary labels and values
  textSec:     '#888899',            // secondary labels, placeholders, metadata
  control:     '#2A2A38',            // button backgrounds, inactive toggle surfaces
  border:      '#1E1E28',            // subtle dividers and outlines
  well:        '#0D0D14',            // inset areas, fader groove, track groove
  warn:        '#F5A623',            // VU amber zone, warnings
  accentMuted: 'rgba(107,92,231,0.13)',
  wood:        '#2E1A0E',            // studio theme — Neve-style wood panels
  woodLight:   '#4A2C17',
  vuGreen:     '#1EC94A',            // VU meter — green zone (0–65%)
  vuAmber:     '#F5A623',            // VU meter — amber zone (65–85%)
  vuRed:       '#E94560',            // VU meter — red/clip zone (85–100%)
  metalDark:   '#14141E',            // fader handle / knob gradient dark
  metalMid:    '#2A2A3C',            // fader handle / knob gradient mid
  metalLight:  '#3A3A52',            // fader handle / knob gradient light
}
```

### Collaborator model

```ts
const COLLAB_COLORS = ['#6B5CE7', '#1D9E75', '#E94560', '#F5A623', '#00B4D8']
// Luke=Owner(purple), Anna=Editor(teal), Miguel=Editor(red), Priya=Viewer(amber)
```

Each collaborator's hex color appears on: track header accent bar + background tint, clip waveform fill and border, MixerStrip wood cap border, avatar ring, FX badge when their track is selected, power LED in plugin rack. This is the most important visual system in the product — it must be honored in every new screen.

---

## 4. Current Feature Status

### Screens

| Screen | Status | Notes |
|---|---|---|
| Session room (arranger + mixer) | ✅ Complete | Full interaction, audio playback, all controls wired |
| Track ownership (color avatars, record arm, input routing) | ⚠️ Partial | Visuals done; server-side locking + JWT enforcement not built (#20) |
| Invite flow modal | ✅ Complete | Role picker, email input, "Send invite" wired, Escape closes |
| Mix view (shared fader, mute/solo, plugin chain) | ⚠️ Partial | Plugin chain audibly wired; plugin parameter editing not implemented |
| Mobile capture | ❌ Not started | Intentionally deferred — desktop-first |

### Session room capabilities (what works today)

**Arranger:**
- 7 tracks, 32 bars, drag-to-scroll
- Clip drag (bar-snapped, preserves grab offset), resize (left/right handles), cut tool
- Bezier fade in/out handles with draggable midpoint control points
- Crossfade: implicit bezier crossfade on clip overlap; `crossfadeLocked: boolean` on ClipData mirrors paired handles; padlock icon in overlap zone
- Right-click context menu: Delete ✅, Duplicate ✅, Bounce-to-clip ✅, Loop region (stub), Rename (stub)
- Bounce-to-clip modal with virtual instrument + preset + humanizer style picker
- Playhead seek (click ruler), keyboard spacebar play/pause, stop holds position, Return-to-Zero resets
- Tool keyboard shortcuts: V (select), C (cut)
- BPM input with 40–300 range validation

**Mixer:**
- 7 track strips + master strip with Neve-inspired studio theme (wood rails, metal faders)
- Fader: logarithmic curve with unity at ~75% travel, grip ridges, `faderToDb()` / `formatDb()` (floor: −90 dB)
- `StudioFader`: `role="slider"`, track-scoped `aria-label`, ArrowUp/Down ±1, Shift+ArrowUp/Down ±10
- Pan knob: horizontal drag wired, double-click to center, ±4 unit dead zone snaps to 0 during drag (center detent), 2px notch indicator at center position
- Mute, Solo buttons: fully wired on track headers and mixer strips
- Record arm: wired; role-based (Viewers cannot arm)
- FX badge: shows real plugin chain count per track; click opens PluginChainPanel for that track
- VU meters: post-fader RMS from `AnalyserNode`, attack 32/sec, decay 4/sec, peak-hold dot (700ms hold, 0.5/sec drop), transient glow flash (120ms), partial segment shading
- VU heartbeat startup: bloom + staggered motorized recall animation on mount; `heartbeatSignalRef` overrides live RMS in shared rAF loop during startup sequence
- Single `requestAnimationFrame` loop drives all strips (no state, direct DOM writes)
- `prefers-reduced-motion`: disables transient glow and peak-hold drop
- Master pan: `_masterPanner` StereoPannerNode inserted between `_masterGain` and `_masterAnalyser`; mapping `(masterPan-50)/50`; default 50 (center)

**FX chain:**
- 720px overlay panel slides in from right (220ms cubic-bezier), backdrop dim
- Rack aesthetic: wood cabinet rails, brushed-metal faceplates, amber LCD param readout, power LED in owner color, Screw SVGs at corners
- Plugin cards with enable/disable toggle (bypasses node without graph rebuild), drag-to-reorder
- PluginBrowser inline popover: text search + category list; plugin added to chain immediately on selection
- Plugin chain is wired into the audio graph — enabling/disabling plugins audibly affects the track
- Kick track seeded with a compressor plugin by default

**Audio playback:**
- 7 procedurally synthesized instruments (kick, snare, hihat, bass, synthLead, pad, vox)
- No sample files required — all generated via Web Audio API synthesis
- Waveform rendered to `<canvas>` per clip (RMS peak downsampling)
- Cold-load ghost waveform: seeded deterministic bars when buffer unavailable (no flash/flicker)
- Per-track plugin chain nodes audibly affect output

**Backend (server/):**
- Fastify server with `@fastify/websocket`, tsc-clean
- In-memory session store: `Map<sessionId, SessionState>` with `addClient`, `removeClient`, `updateTransport`, `getClients`
- WebSocket routing: `session.join` → `presence.joined` fan-out; `session.leave` → `presence.left` fan-out; `transport.play/pause/stop/seek/bpm_change` → `transport.state_sync` broadcast; `presence.update` → fan-out to other clients; `session.snapshot` sent on connect
- REST stubs: `GET /api/v1/sessions/:id`, `GET /api/v1/auth/me`
- `WsMessage.from` stamped server-side (not client-sent)

**Presence (partial):**
- Collaborator avatars shown in transport bar and track headers (seed data)
- StatusBar shows online count and CPU/RAM/Latency labels (seed data)
- Backend fan-out implemented; frontend WebSocket client not yet connected to backend

---

## 5. Active Agent Team Structure

This project uses a multi-agent system running inside Claude Code (Anthropic). Agents are defined as persona files in `.claude/agents/`. The human PM (Luke) orchestrates which agents are called and when. Each agent has no memory between sessions — every prompt must be self-contained.

| Agent | File | Role |
|---|---|---|
| Product Manager | `product-manager.md` | Orchestration, feature planning, work breakdown, prioritization |
| Tech Lead | `tech-lead.md` | Architecture decisions, code review, cross-cutting concerns |
| Frontend Engineer | `frontend-engineer.md` | All React/TypeScript code in `src/` |
| Designer | `designer.md` | Design specs, Figma DSM, interaction patterns, accessibility |
| Backend Engineer | `backend-engineer.md` | API contracts, data models, real-time architecture |
| UAT | `uat.md` | Test scenarios, defect identification, acceptance criteria validation |

**Coordination flow:**
1. PM breaks features into typed sub-tasks
2. Designer writes spec to `docs/specs/<feature>.md` and handoff to `docs/handoffs/<feature>-design.md`
3. Frontend Engineer implements from the spec
4. FE drops handoff to `docs/handoffs/` for Tech Lead review
5. Tech Lead updates `STATUS.md` Done table on approval
6. UAT runs after each work package; defects logged to `docs/defects.md`

---

## 6. Agent Roles and Responsibilities

### Product Manager
- Breaks ambiguous feature requests into crisp briefs: problem → user story → acceptance criteria → open questions
- Routes sub-tasks to the correct specialist agent with self-contained prompts
- Prioritizes using: (1) anything blocking the collaborative loop, (2) partial screens before new ones, (3) polish after golden path, (4) mobile last
- Does NOT write code or design specs directly

### Tech Lead
- Owns technical integrity across all layers
- Makes the call when frontend/backend specs conflict: backend contract wins for data shape; frontend spec wins for interaction timing
- Reviews all code: correctness → type safety → token compliance → performance → simplicity
- Writes Architecture Decision Records to `docs/adr/`
- Does NOT own roadmap or feature scope

### Frontend Engineer
- Owns everything in `src/` — components, state, hooks, styling
- Typed functional components only (`const` arrow functions, no `function` keyword, no `any`)
- Tailwind utility classes for layout; inline `style` for dynamic values; never hardcode hex
- Uses `useState`/`useReducer`/`useContext` only — no external state library without PM approval
- Runs `tsc --noEmit` before every commit
- Commits after every approved task; commit message format: `feat/fix: <what and why>`
- Does NOT write to `docs/specs/` or `docs/adr/`

### Designer
- Owns how every screen looks and behaves from the user's perspective
- Writes specs to `docs/specs/<feature>.md` and handoffs to `docs/handoffs/<feature>-design.md`
- Specifies every interactive state: hover, focus, active, disabled, empty, loading, error
- **Hard boundary: may not write to or edit any file in `src/`.** All code is implemented by the Frontend Engineer from the spec.
- Uses Figma MCP tools to read/write the Design System file
- Does NOT make product scope decisions

### Backend Engineer
- Owns API contracts, WebSocket message schemas, and data models
- REST endpoints versioned at `/api/v1/...` from day one; no GraphQL without PM approval
- Backend scaffold exists at `server/` (tsc-clean). Remaining work: JWT enforcement + server-side track locking (#20)
- Does NOT make frontend implementation decisions

### UAT Agent
- Tests from the perspective of a musician with DAW muscle memory (Ableton/Logic/Pro Tools)
- Writes defects to `docs/defects.md` with priority (P0 blocker → P3 low) and file:line references
- Validates acceptance criteria, not code style
- Can use browser preview tools to interact with the running app
- Does NOT implement fixes

---

## 7. Tool Stack Currently in Use

### Development

| Tool | Version/Detail | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | Strict mode | Type safety across frontend |
| Vite | Latest | Dev server + build tool |
| Tailwind CSS | v4 (via `@tailwindcss/vite`) | Utility-class styling — no config file |
| Fastify | Latest | Backend HTTP + WebSocket server |
| `@fastify/websocket` | Latest | WebSocket plugin for Fastify |
| Web Audio API | Browser native | Audio synthesis, playback, metering |
| `requestAnimationFrame` | Browser native | VU meter animation loop (direct DOM writes, no state) |
| puppeteer | devDependency | Sprint screenshot capture |

### CI

GitHub Actions (`.github/workflows/ci.yml`):
1. `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` — strict typecheck
2. `npm run build` — Vite build (blocked on typecheck passing)

### AI Agent Tooling

| Tool | Purpose |
|---|---|
| Claude Code (Anthropic) | Primary agent runtime — all agents run here |
| Claude Preview MCP | Frontend Engineer + UAT — renders live app, screenshots, interactions |
| Figma MCP (`417ff0e4-f840-44f1-8786-6c55843f7ab4`) | Designer agent — reads/writes Figma Design System file |
| Figma Desktop MCP (`figma-desktop`) | Secondary Figma read access |
| Computer Use MCP | UAT agent — OS-level interaction for end-to-end testing |
| TodoWrite | Task tracking within agent sessions |

### No external dependencies currently used for:
- State management (no Redux/Zustand/Jotai)
- Animation (no Framer Motion — all animation via CSS transitions and `requestAnimationFrame`)
- Audio routing (no Tone.js — raw Web Audio API only)

---

## 8. Figma Files / Design Source-of-Truth

**Primary Figma file:** `GDAW — Design System`  
**File key:** `o4IccZFYzEvsHe3dVcco7X`  
**URL:** `https://www.figma.com/design/o4IccZFYzEvsHe3dVcco7X/GDAW---Design-System-`

### Page structure

| Page | Contents |
|---|---|
| 🎨 Cover | Title/cover |
| 🪙 Tokens | Design tokens (colors, spacing, type) |
| ⚛ Atoms | Base components — Button, Toggle, InputField, Avatar, TrackAccentBar, TrackControlButton, Fader, LevelMeter, Badge, RoleOption, **Knob**, **PanKnob**, **TransBtn** |
| 🧩 Molecules | Composed components — TrackHeader, ChannelStrip, **Clip** (5 variants), **Toolbar** (3 variants), **StatusBar** (2 variants), TransportBar |
| 🦠 Organisms | Full panels — SessionTopbar, TrackSidebar, **MixerPanel** (full wood surround + 7 tracks + master), **FXChainPanel** (empty + populated), ConflictModal, InviteModal |
| 📐 Templates | Not yet populated |
| 📄 Docs | Not yet populated |

**Items in bold** were added or rebuilt in the 2026-05-11 DSM completeness pass.

### Canonical layout grid (locked — do not deviate)

- Molecules and Organisms pages: content starts at x=380, y=180
- Label column: x=80, width=260px
- Section gap: 120px vertical
- Component gap: 40px vertical
- All components wrap as `COMPONENT_SET` (via `figma.combineAsVariants`) — plain frames do not persist between plugin executions

### Key component specs (matched to shipped code)

**MixerStrip (ChannelStrip molecule):**
- Width: 64px
- Wood cap: 8px height, gradient `#3D2210 → #2E1A0E`
- Owner color bar: 2px, sits below wood cap
- FX badge: 8px font-mono, `C.control` background, shows `"FX:{n}"`; click opens PluginChainPanel
- M/S buttons: 22×14px each, `C.control` background, 2px corner radius
- Pan knob: 28×28px SVG — metallic radial gradient, accent arc, indicator dot; center detent ±4 unit dead zone; 2px notch at C position
- VU meter: 2 channels × 20 segments × 3px height × 1px gap = 79px total
- StudioFader: 22px wide handle with 3 grip ridges; 80px travel; `role="slider"`; arrow key nav
- dB readout: 9px monospace
- Avatar ring: 16px diameter, 2px owner-color stroke

**Clip (molecule):**
- Height: `TRACK_H - 12 = 52px`
- Width: `clip.len * BAR_W - 4px`
- Background: owner color at 8% opacity (`${color}14`)
- Waveform bars: owner color at 18% opacity (`${color}2E`)
- 5 variants: audio-default, synth-default, audio-hovered, audio-muted, audio-faded

**MixerPanel (organism):**
- 540×316px (7 tracks × 64px + master × 64px + 2 cheeks × 14px = 540px; 6px rail + 310px body = 316px)
- Wood top rail: 6px, gradient `#3D2210 → #2E1A0E → #1E0F06`
- Left/right cheeks: 14px wide, matching wood gradient
- Master strip is intentionally slightly taller than track strips (hardware convention — by-design)

---

## 9. GitHub Repository

**Remote:** https://github.com/lukesydow-lab/DAWin

**CI:** GitHub Actions — typecheck + Vite build on push/PR to `main`. `--noUnusedLocals --noUnusedParameters` enforced.

**Milestones:** Sprint 1 (closed), Sprint 2 (active), Sprint 3 (open)

**Labels:** `type:feature-request`, `status:triage`, `sprint:1`, `sprint:2`, `sprint:3`, `type:open-decision`, `priority:p0`–`priority:p3`, `component:frontend`, `component:backend`, `component:design`, `type:bug`, `type:chore`

**Issue templates:** Feature Request (`.github/ISSUE_TEMPLATE/feature-request.md`)

**Open Sprint 2 issue:**
- #20 Track locking + JWT role enforcement

---

## 10. Slack / Notification Setup

No Slack workspace configured. All coordination via `STATUS.md`, `docs/handoffs/`, and PM sessions.

---

## 11. Current Implementation Status

### What is fully wired and working

- **Session room layout:** transport bar (top), arranger (center), mixer (bottom), status bar (bottom edge), FX chain overlay (right slide-in — viewport positioning bug fixed)
- **Transport:** play/pause (spacebar), stop (holds position), return-to-zero, record arm toggle, BPM control (40–300 validated)
- **Arranger clip editing:** drag (grab-offset correct), resize (left/right), bezier fade handles with draggable midpoints, cut tool, right-click menu (Delete/Duplicate/Bounce wired)
- **Crossfade:** implicit bezier crossfade on clip overlap; symmetry lock toggle (padlock icon); `crossfadeLocked` on ClipData
- **Mixer:** fader (log curve, unity at ~75%), pan (center detent ±4 dead zone, 2px notch), mute, solo — all wired and updating shared track state
- **StudioFader ARIA:** `role="slider"`, track-scoped `aria-label`, ArrowUp/Down ±1, Shift+Arrow ±10
- **VU meters:** live post-fader RMS, attack/decay physics, peak-hold dot, transient glow, `prefers-reduced-motion` respected
- **VU heartbeat startup:** bloom + staggered motorized recall on mount; `heartbeatSignalRef` overrides live RMS
- **Master bus:** real `GainNode` + `StereoPannerNode` + `AnalyserNode` — `masterVol` and `masterPan` drive real audio
- **Plugin chain (audio graph):** DynamicsCompressorNode, ConvolverNode (procedural IR), DelayNode + feedback GainNode, BiquadFilterNode, Limiter GainNode — all wired into per-track signal path; enable/disable bypasses without graph rebuild
- **Plugin rack UI:** wood cabinet, brushed-metal faceplates, amber LCD, power LED in owner color, Screw SVGs, drag-to-reorder; PluginBrowser inline popover with search
- **FX badge → panel:** clicking FX badge on any mixer strip opens PluginChainPanel for that track
- **Backend scaffold:** Fastify + WebSocket routing for all transport and presence events; in-memory session store; tsc-clean
- **Invite modal:** role picker, email input, "Send invite" CTA wired, Escape closes
- **Keyboard shortcuts:** spacebar (play/pause), V/C (tools), Escape (modals)
- **Collaborator color system:** tints track headers, clip fills/waveforms, mixer strip wood caps, avatar rings, plugin power LED throughout
- **Accessibility:** ARIA labels on all icon-only controls, focus-visible rings, keyboard nav on fader/pan/MiniBtn, VU containers `aria-hidden`, dB readout `aria-live`
- **CI:** tsc strict + Vite build passing; `--noUnusedLocals --noUnusedParameters` enforced

### What is partially implemented

- **Frontend ↔ backend WebSocket connection:** Backend routing is implemented and tsc-clean; frontend does not yet open a WebSocket connection to the server. Presence and transport state are still seed data in React state client-side.
- **Track ownership locking:** `track.lockedBy` field exists but enforcement between clients requires #20 (server-side lock check + JWT role)
- **Role-based access:** `IS_VIEWER` constant disables arm/mute/solo buttons (client-side only); server-side JWT validation not built (#20)
- **Context menu:** Delete + Duplicate wired; Loop region + Rename are disabled stubs (Sprint 3)
- **Plugin parameter editing:** plugin cards display key params as read-only text in the amber LCD; no inline editing — PM decision required (§8.8)

### What is a stub or not started

- **Disabled controls tooltip:** "View only — upgrade to Editor" tooltip not implemented (part of #20)
- **Real-time presence cursors:** collaborator presence cursors in arranger are seed data; no live WebSocket update from backend
- **Clip conflict resolution:** no conflict modal implementation
- **Backend persistence:** session store is in-memory only (Map); no database
- **Backend auth:** JWT issuance not implemented — `/auth/me` is a stub
- **Mobile capture screen:** not started

---

## 12. Known Blockers

| Blocker | Who is blocked | What resolves it |
|---|---|---|
| Server-side track locking not built | Backend + Frontend | #20: Backend enforces `track.lockedBy`; JWT role decoded server-side |
| Frontend WebSocket client not connected to backend | Frontend | After #20: FE opens WS connection, subscribes to transport.state_sync + presence events |
| Plugin parameter editing spec not written | Frontend | PM writes the parameter editing UX spec (expanding card? popover?). Gates Sprint 3. |
| Context menu stubs (Loop region + Rename) | Frontend | PM decides: scope Sprint 3 or remove stubs |

---

## 13. Open Questions

### For PM (product decisions required)

1. **Plugin parameter editing UX** (§8.8) — Expanding card, side panel, or popover? No spec exists. This is the most important open question for Sprint 3.

2. **Context menu stubs** (§8.5) — Loop region + Rename are disabled with "(soon)" labels. Scope for Sprint 3, or remove from UI?

3. **VU meter calibration marker** (§8.2) — Visible tick mark at 0 VU reference (−18 dBFS boundary)?

4. **VU meter color bands** (§8.3) — Current: 0–65% green, 65–85% amber, 85–100% red. Recalibrate to −18 dBFS convention?

5. **Stereo metering** (§8.4) — Both L/R channels currently read same AnalyserNode (mono-summed). True stereo via SplitterNode: acceptable for v1?

6. **Ownership transfer** (§8.7) — Post-MVP or Sprint 3?

### For Tech Lead (architectural sign-off needed)

1. **Frontend WS client integration** — When #20 backend is ready, Tech Lead should specify the connection pattern: singleton WS client at App root? Custom hook? How does transport.state_sync merge with local React state?

---

## 14. Recent Decisions

### ADR 001 — DSP Locality (accepted 2026-05-10)
**Decision:** All DSP runs in the browser via the Web Audio API for the prototype.  
**Rationale:** Server-side DSP requires ~32 Mbps sustained for a 7-track session — impractical on general internet. Web Audio API nodes cover all needed plugin types natively. Plugin parameter state is server-persisted and synced via WebSocket `plugin.param_change` events.  
**Future path:** CLAP/VST3 requires Electron/Tauri sidecar using shared memory + local loopback WebSocket.

### Crossfade interaction model (2026-05-14 — PM decision)
**Decision:** Crossfade toolbar tool removed. Crossfades are implicit on clip overlap: bezier crossfade region created automatically. `crossfadeLocked: boolean` on ClipData. When locked: mirrored handles (fadeInCurve = n ↔ fadeOutCurve = 1-n). When unlocked: independent. Padlock icon in overlap zone. Locked = `C.textSec`, unlocked = `C.accent`.

### Master fader height (2026-05-14 — PM decision)
**Decision:** Master strip being slightly taller than track strips is by-design (hardware convention). Issue #12 closed as won't fix.

### Plugin browser UX (2026-05-14 — §8.1 resolved)
**Decision:** Inline popover anchored to "+ ADD UNIT" button. Text search + category list. Plugin added to chain immediately on selection. Implemented as `PluginBrowser` inside `PluginChainPanel`.

### masterPan default + _masterPanner (2026-05-14)
**Decision:** `masterPan` initialized at 50 (center), not 0. `_masterPanner: StereoPannerNode` inserted between `_masterGain` and `_masterAnalyser`. Mapping: `(masterPan-50)/50`. Previous mapping `masterPan/100` produced hard-left output.

### PanKnob center detent (2026-05-14)
**Decision:** ±4 unit dead zone in drag `onMove` handler (`const snapped = Math.abs(raw) <= 4 ? 0 : raw`). Visual 2px center notch indicator extends above/below bar; width 2px when `pan === 0`, 1px otherwise.

### FX chain panel viewport positioning (2026-05-14 — Sprint 2 fix)
**Decision:** `overflow: clip` scoped to `html, body` only (not `#root`). `#root` had `overflow: clip` which created a BFC containing block for `position: fixed` children, causing the PluginChainPanel to anchor 1px off the right edge of the 1920px viewport. Removed from `#root`.

### CI tightened (2026-05-14)
**Decision:** `--noUnusedLocals --noUnusedParameters` added to `tsc --noEmit` step. Prevents accumulation of dead code. Three unused variables fixed at same time (rawY, _instrId, showInvite).

### Single rAF loop for all VU strips (2026-05-12)
**Decision:** One shared `requestAnimationFrame` loop in `MixerPanel` drives all strip meters. Refs (not state) are used for level values; `renderVUChannel()` writes directly to DOM style properties.  
**Rationale:** `useState` for 60fps values would trigger re-renders of 240+ DOM elements per frame.

### Post-fader metering (2026-05-12)
**Decision:** VU meters tap the `AnalyserNode` after the `GainNode` (post-fader). IEC 60268-17 standard; matches Pro Tools, Logic, Ableton.

---

## 15. Features in Progress

### #20 — Track locking + JWT role enforcement
**What remains:**
- Backend: enforce `track.lockedBy` — reject concurrent arm attempts from other clients
- Backend: JWT issuance + role decoding server-side; `GET /auth/me` returns real role
- Frontend: replace `IS_VIEWER` constant with decoded JWT claim
- Frontend: tooltip on disabled controls: "View only — upgrade to Editor to make changes"
- Done when: two clients cannot simultaneously arm the same track; Viewer cannot arm/mute/solo even with modified client code

---

## 16. Feature Backlog / Ideas

Items below are not formally scoped. None should be started without a PM-written spec.

### Sprint 3 candidates (ordered by impact)

1. **Plugin parameter editing UI** — Expanding plugin card shows inline knobs/sliders per param. Compressor: threshold, ratio, attack, release. Gates Sprint 3.

2. **Context menu completions (Loop region + Rename)** — Loop region sets `loopStart`/`loopEnd`; playhead loops within range. Rename: inline text edit on track header name field.

3. **VU calibration polish** — 0 VU tick mark, color band recalibration, true stereo via SplitterNode (pending PM decisions §8.2–8.4).

4. **Frontend WebSocket client** — Connect frontend to Fastify backend; subscribe to transport.state_sync + presence events. Replaces seed data with live server state.

### Future / post-MVP

| Feature | Why deferred | Prerequisite |
|---|---|---|
| Mobile capture screen | Desktop-first mandate | PM formal scope decision + Designer full mobile spec |
| CLAP/VST3 native plugin support | Requires Electron/Tauri sidecar (per ADR-001) | Electron integration decision |
| Undo stack | Requires operational transforms | Tech Lead design + PM approval |
| Session history / restore points | Depends on stable server persistence | Backend persistence layer |
| Ownership transfer UI | Backend auth must enforce it | #20 complete; PM decision on §8.7 |
| Pre-fader / post-fader meter toggle | Low value; architecturally simple | PM decision |
| Clip color picker | Override owner color on individual clips | Sprint 3 complete |
| Real audio recording (getUserMedia) | Requires backend blob storage | Backend recording pipeline |
| MIDI track type | All tracks are audio synthesis only | New spec + PM scope decision |
| Session loading state / skeleton | Relevant when real session hydration introduced | Backend hydration |
| Error states | No error state designed for any screen | PM + Designer scope decision |

---

## 17. What Should Not Be Changed

### Architecture constraints

- **One `AudioContext` per session.** Do not create a second one. All Web Audio nodes must use `_audioCtx` from `getAudioCtx()`.
- **No external state library** without PM approval. `useState` / `useReducer` / `useContext` only.
- **No CSS modules, no styled-components, no `@apply`.** Tailwind v4 utility classes + inline `style` only.
- **No GraphQL.** REST + WebSocket per the backend spec.
- **`src/App.tsx` is the only file in `src/` right now.** Do not create new files without Tech Lead approval.
- **TypeScript strict mode.** No `any`. Use `unknown` + TODO if type is genuinely unknown.
- **Audio graph signal order is load-bearing:** `source → [plugin chain] → GainNode(fader) → AnalyserNode(VU tap) → StereoPannerNode → _masterGain → _masterPanner → _masterAnalyser → destination`. VU correctness depends on tap placement after fader.
- **CI must pass before merge:** `tsc --noEmit --noUnusedLocals --noUnusedParameters` + `vite build`.

### Design constraints

- **Collaborator color model is sacred.** Every new surface must show the owner's hex color on their tracks/clips/strips. No new screen should omit this.
- **Never hardcode hex values in `src/`.** Always use `C.*` tokens. Collaborator colors use inline `style` props.
- **Desktop-first, 1280px minimum.** Do not design for smaller viewports until mobile capture is formally scoped.
- **Dense information density is correct.** Do not add padding or simplification — this is a pro audio tool.
- **Standard DAW conventions must be honored.** Spacebar = play/pause. Stop preserves position. Return-to-Zero resets. Fader unity at ~75%. VU meters are post-fader. These are muscle-memory behaviors.
- **The Designer agent may not write to `src/`.** All code comes from the Frontend Engineer.

### Token constraints

- **Layout constants (`BAR_W`, `TRACK_H`, etc.) may not change** without updating both code and Figma DSM.
- **VU meter bands:** 0–12 segments = green (`C.vuGreen`), 13–16 = amber (`C.vuAmber`), 17–19 = red (`C.vuRed`). 20-segment layout. Do not change without PM decision + DSM update.

---

## 18. Current Assumptions

1. **Single `AudioContext` is sufficient.** Works for the prototype; multi-window or worker-based playback would require architectural changes.
2. **All 7 tracks are always present.** Track creation and deletion not yet implemented.
3. **The backend will be server-authoritative for transport state.** Current React state is local; server will be source of truth when WS client is connected.
4. **Collaborator color is assigned at session join and immutable within a session.** Stored in seed data; backend will assign server-side per `(userId, sessionId)`.
5. **JWT-based auth with guest/anonymous join support.** Auth doesn't exist yet; `IS_VIEWER` is a UI hint only — will be validated against server token in #20.
6. **No CLAP/VST3 for the prototype.** All plugin processing uses Web Audio API nodes.
7. **Mono-summed metering is acceptable for v1.** True stereo requires SplitterNode — deferred pending PM decision §8.4.
8. **32 bars is sufficient for the prototype.** Eager render at `BAR_W=72` = 2,304px canvas. Virtualization needed before 128+ bars.
9. **Procedural audio synthesis is sufficient.** Real sample import is not implemented.
10. **No undo stack.** All clip/track mutations are immediate and irreversible.
11. **In-memory session store is sufficient for prototype.** No database; sessions lost on server restart.

---

## 19. How New Feature Work Orders Should Be Structured

When submitting a new feature request to this project, structure it using the following template.

### Work order template

```markdown
## Work Order: [Feature Name]

**Requested by:** [PM / Designer / Tech Lead]
**Priority:** [P0 blocker / P1 high / P2 medium / P3 low]
**Estimated effort:** [S (<2h) / M (2–6h) / L (6–16h) / XL (>16h)]
**Agent(s):** [Designer / Frontend Engineer / Backend Engineer / Tech Lead / UAT]
**Depends on:** [list any specs, ADRs, or other work orders that must be complete first]

### Problem statement
[What user-facing problem does this solve? One paragraph. Do not describe the solution.]

### User story
As a [musician / collaborator / viewer / producer],
I want to [do specific thing],
So that [specific outcome].

### Acceptance criteria
- [ ] [Specific, testable, user-visible criterion]
- [ ] [Another criterion]
- [ ] [Each criterion should be verifiable by the UAT agent]

### Scope — what is IN
[Bullet list of what this work order explicitly covers]

### Scope — what is OUT (defer to future)
[Bullet list of what this work order does NOT cover — prevents scope creep]

### Design constraints
- Use design tokens from `C.*` — no hardcoded hex values
- Collaborator colors must appear on [specific elements]
- Minimum size: [if applicable]
- States required: [hover / focus / active / disabled / empty / error]
- ARIA: [specific labels for icon-only controls]
- DAW conventions to honor: [specific keyboard shortcuts, interaction patterns]

### Technical notes
[Any architecture constraints, file locations, or line numbers the implementing agent needs]
[Reference any relevant spec files in docs/specs/]
[Call out any risk to the arranger timeline (perf-sensitive path)]

### Open questions (must be answered before implementation)
1. [Question] → [Who answers it]
2. [Question] → [Who answers it]

### Definition of done
- [ ] tsc --noEmit passes (no type errors, no unused locals/parameters)
- [ ] Feature matches spec — UAT agent has validated acceptance criteria
- [ ] Committed to git with Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
- [ ] Handoff dropped to docs/handoffs/ for Tech Lead review
- [ ] STATUS.md updated
```

---

## 20. Recommended Next Steps

Ordered by impact on the collaborative core value proposition.

### Immediate (complete Sprint 2)

1. **Backend + Frontend: #20 Track locking + JWT role enforcement**  
   - Backend: enforce `track.lockedBy` server-side; implement JWT issuance and role claim; make `GET /auth/me` real
   - Frontend: replace `IS_VIEWER` constant with decoded JWT claim; add tooltip on disabled controls
   - Done when: two clients cannot simultaneously arm the same track; Viewer role enforced server-side

### Sprint 2 → Sprint 3 bridge

2. **PM: Answer open decisions §8.2, §8.3, §8.4, §8.5, §8.8** — These gate all Sprint 3 audio depth work. Plugin parameter editing UX is the most impactful.

3. **Tech Lead: Design frontend WebSocket client integration pattern** — Singleton at App root? Custom hook? How does `transport.state_sync` merge with local React state? Document in ADR before FE implements.

### Sprint 3

4. **Plugin parameter editing UI** — Expanding plugin card with inline knobs. Requires PM spec first.

5. **Context menu completions** — Loop region + Rename (or remove stubs if descoped).

6. **VU calibration polish** — Pending PM decisions on tick mark, color bands, stereo metering.

7. **Frontend WebSocket client** — Connect to Fastify backend; replace seed data presence with live events.
