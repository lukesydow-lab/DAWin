# DAWin — Project Handoff Document

> **Purpose:** Standalone context document for AI-assisted feature workshopping and work order generation.  
> **Last updated:** 2026-05-12  
> **Project owner:** Luke (PM)  
> **Sprint:** 1 — Core Session Room (active)

---

## 1. Project Overview

DAWin is a browser-based collaborative digital audio workstation (DAW) UI prototype. It is being designed and built by an AI agent team orchestrated by a human PM. The prototype currently runs locally (no deployed backend) and is built as a single React/TypeScript application.

The project is at an early-but-substantial prototype stage: the session room is fully interactive, audio plays through the Web Audio API, all core mixer controls are wired, and a Neve-inspired studio visual theme is applied. No backend exists yet — all data lives in seed state in `src/App.tsx`.

**Repository root:** `/Users/lukesydow/daw-design`  
**Primary source file:** `src/App.tsx` (2,759 lines — all components in one file by design during early sprint)  
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
├── public/
│   └── motion-prototypes/
│       └── 03-vu-meter-animation.html   # Standalone VU meter motion prototype
├── docs/
│   ├── adr/
│   │   └── 001-dsp-locality.md         # Accepted: DSP runs in browser via Web Audio API
│   ├── specs/                          # Feature specs (PM/Designer write; agents implement)
│   │   ├── session-room.md
│   │   ├── arranger-view.md
│   │   ├── track-ownership.md
│   │   ├── mix-view.md
│   │   ├── fx-chain-pan-rms-redesign.md
│   │   ├── invite-flow.md
│   │   ├── status-bar.md
│   │   ├── transport-bar.md
│   │   ├── multitrack-backend-api.md   # Full backend contract (draft rev 1)
│   │   ├── sprint1-defect-work-order.md
│   │   └── vu-meter-motion.md          # VU physics + audio wiring spec (complete)
│   ├── handoffs/                       # Agent → Tech Lead review requests
│   │   └── [one file per feature]
│   └── defects.md                      # Sprint 1 UAT defect register
├── .claude/
│   └── agents/                         # Agent persona definitions
│       ├── product-manager.md
│       ├── tech-lead.md
│       ├── frontend-engineer.md
│       ├── designer.md
│       ├── backend-engineer.md
│       └── uat.md
├── STATUS.md                           # Live project status board (Tech Lead writes)
├── DAWin_PROJECT_STATE.md              # Technical state snapshot (generated 2026-05-12)
└── DAWin_HANDOFF.md                    # This file
```

### Frontend architecture

- **Framework:** React 18 + Vite + TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` plugin. No `tailwind.config.js`. No `@apply`. No CSS modules. All layout/spacing/typography via utility classes. Dynamic values (collaborator colors, calculated widths) via inline `style` prop only.
- **State:** `useState` / `useReducer` / `useContext`. No external state library. The PM agent must approve any introduction of Redux, Zustand, or equivalent.
- **Audio:** Web Audio API. One shared `AudioContext` (`_audioCtx`) at module scope, lazy-initialized on first user gesture via `getAudioCtx()`. All per-track nodes live in this context.
- **Component structure:** All components currently in `src/App.tsx`. Migration to `src/components/<ComponentName>.tsx` begins when a second screen (Track Ownership, Mix View) is scaffolded. No barrel exports until 5+ components in a directory.

### Audio graph (current, post-VU-wiring)

```
Track AudioBuffer (procedurally synthesized)
        │
        ▼
  GainNode  ←── track.volume (0–100) mapped via faderToDb() log curve
        │
        ▼
  AnalyserNode  ←── VU meter taps RMS here (POST-FADER, IEC 60268-17)
        │
        ▼
  StereoPannerNode  ←── track.pan (-1..1)
        │
        ▼
  _masterGain  ←── masterVol (0–100), wired to real GainNode
        │
        ▼
  _masterAnalyser  ←── master strip VU tap
        │
        ▼
  AudioDestination
```

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

Each collaborator's hex color appears on: track header accent bar + background tint, clip waveform fill and border, MixerStrip wood cap border, avatar ring, FX badge when their track is selected. This is the most important visual system in the product — it must be honored in every new screen.

---

## 4. Current Feature Status

### Screens

| Screen | Status | Notes |
|---|---|---|
| Session room (arranger + mixer) | ✅ Complete | Full interaction, audio playback, all controls wired |
| Track ownership (color avatars, record arm, input routing) | ⚠️ Partial | Visuals done; locking logic + role enforcement incomplete |
| Invite flow modal | ✅ Complete | Role picker, email input, "Send invite" wired, Escape closes |
| Mix view (shared fader, mute/solo, plugin chain) | ⚠️ Partial | MixerPanel + FX chain done; plugin parameter editing not implemented |
| Mobile capture | ❌ Not started | Intentionally deferred — desktop-first |

### Session room capabilities (what works today)

**Arranger:**
- 7 tracks, 32 bars, drag-to-scroll
- Clip drag (bar-snapped, preserves grab offset), resize (left/right handles), cut tool
- Fade in/out handles on clips with linear/ease/sharp curve modes
- Right-click context menu: Delete ✅, Duplicate ✅, Bounce-to-clip ✅, Loop region (stub), Rename (stub)
- Bounce-to-clip modal with virtual instrument + preset + humanizer style picker
- Playhead seek (click ruler), keyboard spacebar play/pause, stop holds position, Return-to-Zero resets
- Tool keyboard shortcuts: V (select), C (cut), X (crossfade — UI only, no implementation)
- BPM input with 40–300 range validation

**Mixer:**
- 7 track strips + master strip with Neve-inspired studio theme (wood rails, metal faders)
- Fader: logarithmic curve with unity at ~75% travel, grip ridges, `faderToDb()` / `formatDb()` (floor: −90 dB)
- Pan knob: horizontal drag control
- Mute, Solo buttons: fully wired on track headers and mixer strips
- Record arm: wired; role-based (Viewers cannot arm)
- FX badge: shows real plugin chain count per track; click opens FX chain overlay
- VU meters: post-fader RMS from `AnalyserNode`, attack 32/sec, decay 4/sec, peak-hold dot (700ms hold, 0.5/sec drop), transient glow flash (120ms), partial segment shading
- Single `requestAnimationFrame` loop drives all strips (no state, direct DOM writes)
- `prefers-reduced-motion`: disables transient glow and peak-hold drop

**FX chain:**
- 720px overlay panel slides in from right (220ms cubic-bezier), backdrop dim
- Shows populated state (plugin cards with enable toggle and key params) or empty state (signal flow SVG + "Add Plugin +" CTA)
- Plugin enable/disable toggle wired
- "Add Plugin +" button has no handler — PM interaction spec required

**Audio playback:**
- 7 procedurally synthesized instruments (kick, snare, hihat, bass, synthLead, pad, vox)
- No sample files required — all generated via Web Audio API synthesis
- Waveform rendered to `<canvas>` per clip (RMS peak downsampling)
- Cold-load ghost waveform: seeded deterministic bars when buffer unavailable (no flash/flicker)
- Master `GainNode` + `AnalyserNode` wired; `masterVol` drives real audio gain

**Presence (stub):**
- Collaborator avatars shown in transport bar and track headers
- StatusBar shows online count and CPU/RAM/Latency labels
- No real-time WebSocket sync yet — presence is seed data

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
- Shared TypeScript interfaces in `src/shared/types.ts` are the contract between layers
- Currently designing contracts only — no server exists yet
- REST endpoints versioned at `/api/v1/...` from day one; no GraphQL without PM approval
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
| Web Audio API | Browser native | Audio synthesis, playback, metering |
| `requestAnimationFrame` | Browser native | VU meter animation loop (direct DOM writes, no state) |

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
- Backend (no server, no database, no auth)

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
- FX badge: 8px font-mono, `C.control` background, shows `"FX:{n}"`
- M/S buttons: 22×14px each, `C.control` background, 2px corner radius
- Pan knob: 28×28px SVG — metallic radial gradient, accent arc, indicator dot
- VU meter: 2 channels × 20 segments × 3px height × 1px gap = 79px total
- StudioFader: 22px wide handle with 3 grip ridges; 80px travel
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

---

## 9. GitHub Repository References

**No remote repository is currently configured.** The project exists as a local git repository only.

```
git remote -v  →  (no output)
```

**Local git history (6 commits):**

```
3507382  feat: VU meter live audio wiring + motion physics
bc786ba  fix: formatDb threshold, mute opacity, waveform cold-load
18273f8  fix: left-side layout shift — track headers and arranger flush
b6a770f  chore: update .gitignore, tag sprint-1-complete
cb05b3f  chore: enforce source ownership and commit discipline
6fff143  chore: initialize git — Sprint 1 complete (WP-1 through WP-7)
```

**If a GitHub remote is added in the future:**
- Branch strategy: feature branches per work package (e.g., `wp9-plugin-browser`)
- PRs require Tech Lead review before merge to `main`
- Commit message format: `feat/fix/chore: <short description of what and why>`
- Every commit body must include: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

---

## 10. Slack Channel / Notification Setup

**No Slack workspace or notification infrastructure is currently configured.** All coordination happens through:
- `STATUS.md` — live project board (Tech Lead maintains)
- `docs/handoffs/` — agent-to-agent handoff files
- Direct conversation with the PM (Luke) in the Claude Code session

If Slack is added in the future, the recommended channel structure would be:
- `#dawing-sprint` — daily status, blockers, approvals
- `#dawing-defects` — UAT findings piped from `docs/defects.md`
- `#dawing-design` — Designer → FE handoffs

---

## 11. Current Implementation Status

### What is fully wired and working

- **Session room layout:** transport bar (top), arranger (center), mixer (bottom), status bar (bottom edge), FX chain overlay (right slide-in)
- **Transport:** play/pause (spacebar), stop (holds position), return-to-zero, record arm toggle, BPM control (40–300 validated)
- **Arranger clip editing:** drag (grab-offset correct), resize (left/right), fade handles (3 curve modes), cut tool, right-click menu (Delete/Duplicate/Bounce wired)
- **Mixer:** fader (log curve, unity at ~75%), pan, mute, solo — all wired and updating shared track state
- **VU meters:** live post-fader RMS, attack/decay physics, peak-hold dot, transient glow, `prefers-reduced-motion` respected
- **Master bus:** real `GainNode` + `AnalyserNode` — `masterVol` drives actual audio gain
- **FX chain:** plugin enable/disable toggle wired; plugin cards show key params; empty state with signal flow diagram
- **Invite modal:** role picker, email input, "Send invite" CTA wired, Escape closes
- **Keyboard shortcuts:** spacebar (play/pause), V/C/X (tools), Escape (modals)
- **Collaborator color system:** tints track headers, clip fills/waveforms, mixer strip wood caps, avatar rings throughout
- **Accessibility:** ARIA labels on all icon-only controls, focus-visible rings, keyboard nav on fader/pan/MiniBtn, VU containers `aria-hidden`, dB readout `aria-live`

### What is partially implemented

- **Track ownership locking:** `track.lockedBy` field exists but lock enforcement between users is not complete (no real-time sync yet)
- **Role-based access:** `IS_VIEWER` disables arm/mute/solo buttons, but this is a client-side constant — server-side role enforcement not built
- **Context menu:** Delete + Duplicate wired; Loop region + Rename are disabled stubs
- **Crossfade tool:** toolbar UI exists, keyboard shortcut (X) switches tool — but no clip crossfade logic is implemented
- **Heartbeat startup → VU integration:** the startup animation drives faders but does not yet drive the VU meter `signalTarget` from the heartbeat curve (the spec is written; implementation deferred)

### What is a stub or not started

- **"Add Plugin +" handler:** button exists in FX chain empty state and populated state; `onClick` logs a TODO. PM interaction spec required.
- **Real-time presence:** collaborator dots in the StatusBar are seed data; no WebSocket
- **Transport sync:** playhead position is local React state; no multi-client sync
- **Clip conflict resolution:** no conflict modal implementation (component set exists in Figma DSM only)
- **Backend:** no server, no database, no auth, no API
- **Mobile capture screen:** not started

---

## 12. Known Blockers

| Blocker | Who is blocked | What resolves it |
|---|---|---|
| "Add Plugin +" interaction spec not written | Frontend Engineer | PM writes the plugin browser UX spec (what happens when user clicks the button — search, category browse, preview?) |
| Crossfade tool has no spec | Frontend Engineer | PM scopes the interaction model or explicitly deprioritizes it |
| Backend spec has 4 required revisions before scaffold | Backend Engineer | Backend self-resolves: (1) stamp `WsMessage.from` server-side, (2) `PUT /chain` delete semantics, (3) add `GET /auth/me` endpoint, (4) define upload timeout and retry |
| No GitHub remote | All agents | Luke sets up remote repo; agents cannot push to GitHub without it |
| Heartbeat startup → VU integration | Frontend Engineer | Non-blocking; the HTML prototype has the reference implementation at `public/motion-prototypes/03-vu-meter-animation.html` |

---

## 13. Open Questions

### For PM (product decisions required)

1. **Plugin browser UX** — What happens when "Add Plugin +" is clicked? Options: a modal with search + categories, an inline dropdown, a full-screen browser. This is the most important open question for the next sprint.

2. **VU meter calibration marker** — Should there be a visible tick mark at the 0 VU reference point (−18 dBFS, the boundary between the green and amber zones)? Pro Tools, Logic, and Ableton all show this marker. The mastering.com spec in `docs/specs/vu-meter-motion.md` recommends it.

3. **VU meter color bands** — Current assignment: 0–65% green, 65–85% amber, 85–100% red. Audio convention puts the amber transition at the −18 dBFS calibration point. Recalibrate, or keep as-is?

4. **Stereo metering** — The VU meter renders two channels (L/R). For v1: should both channels read real stereo data from the `AnalyserNode`, or is mono-summed metering (same signal, cosmetically offset) acceptable?

5. **Context menu stubs** — Loop region and Rename are disabled stubs. Are these in scope for Sprint 2, or should they be removed from the UI to avoid misleading users?

6. **Crossfade tool** — Currently has keyboard shortcut (X) and toolbar button but zero implementation. Scope it for Sprint 2, or disable/hide the tool entirely?

7. **Ownership transfer** — Track ownership is currently set at track creation and is immutable in the prototype. Is ownership transfer a Sprint 2 requirement or post-MVP?

### For Tech Lead (architectural sign-off needed)

1. **VU meter implementation review** — Commit `3507382` implements the full VU motion spec. Needs Tech Lead sign-off before WP-3 is marked done in `STATUS.md`.

2. **Plugin chain in the audio graph** — Currently, the plugin chain (compressor, reverb, delay, etc.) exists only as UI state — plugin parameters are stored in `pluginChains` React state but no audio processing nodes are inserted into the Web Audio graph. When should this be wired? It affects metering (the spec defines `source → plugins → fader → meter`) and must be sequenced correctly.

3. **Pre-fader meter mode** — Confirmed out of scope for now (ADR-adjacent). If added later, the analyser tap moves before the `GainNode`. No structural changes needed — just document the decision.

### For Designer

1. **Track Ownership screen** — Currently partial. Full spec not yet written for: lock state visuals when another user is recording, input routing badge interaction, ownership transfer UI if PM approves it.

2. **0 VU calibration tick** — Pending PM answer above; if approved, Designer specifies exact placement, size, and color.

3. **Conflict modal** — Component set exists in Figma DSM but no interaction spec written. What triggers it? What are the resolution options?

---

## 14. Recent Decisions

### ADR 001 — DSP Locality (accepted 2026-05-10)
**Decision:** All DSP runs in the browser via the Web Audio API for the prototype.  
**Rationale:** Server-side DSP requires ~32 Mbps sustained for a 7-track session — impractical on general internet. Web Audio API nodes cover all needed plugin types (compressor, reverb, delay, maximizer, EQ) natively. Plugin parameter state is still server-persisted and synced via WebSocket `plugin.param_change` events.  
**Future path:** If CLAP/VST3 support is needed, add an Electron/Tauri sidecar process using shared memory + local loopback WebSocket — server architecture does not change.

### Post-fader metering (2026-05-12)
**Decision:** VU meters tap the `AnalyserNode` after the `GainNode` (post-fader), not before.  
**Rationale:** IEC 60268-17 standard; matches Pro Tools, Logic, Ableton. Pre-fader metering would mean dragging the fader doesn't change the meter, which breaks the purpose of the instrument.

### Master bus `GainNode` introduction (2026-05-12)
**Decision:** Created `_masterGain: GainNode` and `_masterAnalyser: AnalyserNode` at module scope. All per-track `StereoPannerNode`s now route through `_masterGain` before reaching `AudioDestination`. `masterVol` React state is wired to `_masterGain.gain.value`.  
**Impact:** `masterVol` previously controlled only the UI fader label and played no role in the audio graph. This is now corrected.

### Single rAF loop for all VU strips (2026-05-12)
**Decision:** One shared `requestAnimationFrame` loop in `MixerPanel` drives all strip meters. Refs (not state) are used for level values; `renderVUChannel()` writes directly to DOM style properties.  
**Rationale:** Using `useState` for 60fps values would trigger re-renders of 240+ DOM elements per frame. Direct DOM writes keep CPU flat regardless of track count.

### DSM canonical layout grid (2026-05-11)
**Decision:** Locked layout for all Figma pages: component content starts at x=380, section gap=120px, component gap=40px, label column at x=80.  
**Rationale:** Previous sessions produced overlapping components as loose frames. All components must be `COMPONENT_SET` nodes (wrapped via `figma.combineAsVariants`) — plain frames are not persisted between Figma plugin executions.

---

## 15. Features in Progress

### VU meter motion + audio wiring (WP-3) — 95% complete
**What's done:** Full post-fader RMS wiring, attack/decay physics, peak-hold dot, transient glow, partial segment shading, `prefers-reduced-motion`, ARIA labels, master bus wired, single rAF loop.  
**What remains:** (1) Tech Lead sign-off on commit `3507382`; (2) Heartbeat startup → VU `signalTarget` integration — the heartbeat sequence in the HTML prototype needs to be ported to the React `App` component so the meters animate alongside faders during the startup choreography.

### Figma DSM completeness pass — complete
All components that exist in the shipped code now have representation in the Figma Design System. Completed 2026-05-11.

### Backend spec revision — in progress
Backend Engineer has a rev 1 spec. 4 revisions required before Fastify scaffold begins (see Blockers section). No timeline set.

---

## 16. Feature Backlog / Ideas

Items below are not formally scoped. They represent known future work and exploratory ideas discussed in the project. None of these should be started without a PM-written spec.

### Sprint 2 candidates (ordered by impact on collaborative loop)

1. **Real-time presence and transport sync (WebSocket)** — The most important missing feature. Without this, the "collaborative" claim is not verifiable. Requires backend scaffold first.

2. **Plugin browser ("Add Plugin +")** — High user-facing impact. Blocked on PM interaction spec. The FX chain empty state has the CTA wired up to a `console.log` placeholder.

3. **Track ownership screen polish** — Complete the partial screens: lock state when another user is recording, input routing badge fully wired, role-enforcement from server.

4. **Plugin chain in audio graph** — Wire the UI plugin chain (compressor, reverb, delay, etc.) to actual Web Audio nodes. Currently all plugin params are UI state only; no audio processing occurs.

5. **Heartbeat startup → VU integration** — Port the fader/meter startup choreography from the HTML prototype to the React app. Reference: `public/motion-prototypes/03-vu-meter-animation.html`.

### Sprint 3 / post-MVP ideas

6. **Crossfade tool** — Toolbar and keyboard shortcut (X) exist. Full implementation requires drag between adjacent clips to create a crossfade region with a configurable curve.

7. **Context menu: Loop region + Rename** — Currently disabled stubs.

8. **0 VU calibration tick on meter** — Small visual addition pending PM decision.

9. **Plugin parameter editing** — Click on a plugin card in the FX chain to expand inline parameter controls (knobs for each param). Design spec not started.

10. **Mobile capture screen** — Minimal record + playback on mobile. Explicitly lowest priority — desktop-first.

11. **Pre-fader / post-fader meter toggle** — Per-track toggle between pre-fader and post-fader metering. Spec says "move the analyser tap" — architecturally simple. Low priority.

12. **Ownership transfer UI** — Drag an avatar from one track to another, or a context menu option. Depends on backend auth model for enforcement.

13. **Clip color picker** — Allow overriding the owner color on individual clips (for marking regions, loops, etc.).

14. **MIDI track type** — Currently all tracks show "Audio" or "MIDI" as a label but only audio synthesis is implemented.

15. **Session history / undo** — No undo stack exists. Complex to implement without operational transforms for collaborative edits.

16. **VST/CLAP native plugin support** — Requires Electron/Tauri sidecar (per ADR 001). Post-MVP.

---

## 17. What Should Not Be Changed

The following are deliberate decisions that should be treated as constraints unless explicitly overridden by the PM + Tech Lead together.

### Architecture constraints

- **One `AudioContext` per session.** Do not create a second one. All Web Audio nodes must use the `_audioCtx` singleton from `getAudioCtx()`.
- **No external state library** without PM approval. `useState` / `useReducer` / `useContext` only.
- **No CSS modules, no styled-components, no `@apply`.** Tailwind v4 utility classes + inline `style` only.
- **No GraphQL.** REST + WebSocket per the backend spec. PM must approve any deviation.
- **`src/App.tsx` is the only file in `src/` right now.** Do not create new files in `src/` until a second screen is scaffolded (Tech Lead decides when).
- **TypeScript strict mode.** No `any`. If a type is unknown, use `unknown` with a TODO comment.
- **Plugin chain in the audio graph** must follow: `source → plugins → GainNode(fader) → AnalyserNode → StereoPannerNode → masterGain → masterAnalyser → destination`. The tap order is load-bearing — VU correctness depends on it.

### Design constraints

- **Collaborator color model is sacred.** Every new surface must show the owner's hex color on their tracks/clips. No new screen should omit this.
- **Never hardcode hex values in `src/`.** Always use `C.*` tokens. Collaborator colors use inline `style` props.
- **Desktop-first, 1280px minimum.** Do not design for smaller viewports until the mobile capture screen is formally scoped.
- **Dense information density is correct.** Do not add padding, whitespace, or simplification "to make it cleaner" — this is a pro audio tool.
- **Standard DAW conventions must be honored.** Spacebar = play/pause. Stop preserves position. Return-to-Zero resets. These are muscle-memory behaviors. Breaking them will be noticed immediately.
- **The Designer agent may not write to `src/`.** All code comes from the Frontend Engineer implementing the Designer's spec. This separation is absolute.

### Token constraints

- **Layout constants (`BAR_W`, `TRACK_H`, etc.) may not change** without updating both the code and the Figma DSM. These values are used in clip width calculations, drag math, ruler rendering, and VU meter geometry.
- **VU meter bands:** 0–12 segments = green (`C.vuGreen`), 13–16 = amber (`C.vuAmber`), 17–19 = red (`C.vuRed`). These match the 20-segment layout in the DSM. Do not change without a PM decision and DSM update.

---

## 18. Current Assumptions

These are explicitly held assumptions that should be revisited as the project evolves.

1. **Single `AudioContext` is sufficient.** Web Audio API spec allows one context per page. This works for the prototype; if multi-window support or worker-based playback is needed, the architecture changes.

2. **All 7 tracks are always present.** Track creation and deletion are not yet implemented. The seed data defines 7 fixed tracks.

3. **The backend will be server-authoritative for transport state.** Play/pause/position are currently local React state. The assumption is that the server will be the source of truth when WebSocket sync is added — last write wins for clip edits, server wins for transport.

4. **Collaborator color is assigned at session join and immutable within a session.** Colors are stored in seed data. The backend will assign colors server-side per `(userId, sessionId)`.

5. **JWT-based auth with guest/anonymous join support.** Auth doesn't exist yet. The assumption is that role enforcement will happen server-side — client-side role checks (`IS_VIEWER`) are UI hints only and will be validated against the server token.

6. **No CLAP/VST3 for the prototype.** All plugin processing uses Web Audio API nodes. If users need native plugins, the Electron/Tauri sidecar path (per ADR 001) is available but not in scope.

7. **Mono-summed metering is acceptable for v1.** The VU meter currently reads the same `AnalyserNode` data for both L and R channels. True per-channel stereo analysis requires panning the signal through a `SplitterNode` before the analyser — deferred pending PM decision.

8. **32 bars is sufficient for the prototype.** `BARS = 32`. The UI renders all bars eagerly (no virtualization). At `BAR_W = 72`, this is a 2,304px canvas. Virtualization is needed before increasing to 128+ bars.

9. **Procedural audio synthesis is sufficient.** Real sample import is not implemented. The 7 synthesized instruments are enough to demonstrate the collaborative features.

10. **No undo stack.** All clip/track mutations are immediate and irreversible in the current prototype. An undo stack requires either full state snapshots or an operation log — both are non-trivial to retrofit.

---

## 19. How New Feature Work Orders Should Be Structured

When submitting a new feature request to this project (whether to Claude or another AI), structure it using the following template. Vague requests produce vague implementations — specificity here directly determines output quality.

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
- [ ] tsc --noEmit passes (no type errors)
- [ ] Feature matches spec — UAT agent has validated acceptance criteria
- [ ] Committed to git with Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
- [ ] Handoff dropped to docs/handoffs/ for Tech Lead review
- [ ] STATUS.md updated
```

### Rules for work orders

- **Never skip the acceptance criteria.** If you can't write a testable criterion, the feature is not defined enough to implement.
- **"Add Plugin +" is a good example of a blocked work order** — the PM has not written the interaction spec, so the FE has a `console.log` placeholder and cannot proceed. The work order would have caught this.
- **Arranger timeline changes need a perf callout.** Anything touching clip rendering, track row rendering, or the ruler is the hot path. Call it out explicitly so the Tech Lead reviews the rAF budget.
- **Designer output is a spec, not code.** The Designer agent produces a `docs/specs/<feature>.md` file. The Frontend Engineer reads it and implements. Do not ask the Designer agent to produce React components.
- **Backend work requires shared types.** Any new entity or API endpoint must update `src/shared/types.ts` (or create it if it doesn't exist for that feature). The frontend stubs against these types.

---

## 20. Recommended Next Steps

Ordered by impact on the collaborative core value proposition.

### Immediate (this sprint)

1. **PM: Write the "Add Plugin +" interaction spec.**  
   This is the longest-running blocker. Define: what happens on click (modal? panel? dropdown?), what the search/browse experience looks like, what happens on install, how the plugin card is added to the chain. File to: `docs/specs/plugin-browser.md`.

2. **Tech Lead: Sign off on VU meter implementation (commit `3507382`).**  
   Unblocks WP-3 close and STATUS.md update. Check: post-fader tap order, rAF loop correctness, type safety, `prefers-reduced-motion` behavior.

3. **PM: Answer the 3 VU meter calibration questions** (0 VU marker, color band recalibration, stereo vs mono-summed). These are small decisions that unblock a polishing pass.

4. **Backend: Self-resolve 4 spec revisions and begin Fastify scaffold.**  
   The 4 revisions are clearly documented in the backend spec: stamp `WsMessage.from`, PUT chain delete semantics, `GET /auth/me`, upload timeout. None require PM input.

### Next sprint

5. **Frontend: Port heartbeat startup → VU `signalTarget` integration.**  
   The reference implementation is in `public/motion-prototypes/03-vu-meter-animation.html`. This is the final piece of WP-3.

6. **Designer + Frontend: Track Ownership screen (screen 2).**  
   Currently partial. Designer writes the full spec for: record lock state visuals, input routing badge interaction, and (if PM approves) ownership transfer UI. Frontend implements.

7. **Backend + Frontend: WebSocket presence and transport sync (Sprint 2 foundation).**  
   Real-time presence is the product's core differentiator — it must work before the prototype is meaningful to test with real users. Requires backend scaffold first.

8. **Frontend: Wire plugin chain into audio graph.**  
   Currently, plugin params (compressor ratio, reverb size, etc.) are stored in React state but no audio processing nodes are inserted. The signal flow should be `source → DynamicsCompressorNode → ConvolverNode → DelayNode → GainNode(fader) → AnalyserNode → ...`. This makes the FX chain audibly functional.

### Future

9. **Crossfade tool implementation** — after PM scopes the interaction model.
10. **Context menu Loop region + Rename** — after PM decides scope.
11. **Plugin parameter editing UI** — expand plugin cards to show inline knobs.
12. **Mobile capture screen** — lowest priority; explicitly deferred.
```
