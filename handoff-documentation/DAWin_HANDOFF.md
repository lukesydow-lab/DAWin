# DAWin — Project Handoff Document

**Status: Current**
**Last updated:** 2026-05-31

> **Purpose:** Standalone context document for AI-assisted feature workshopping and work order generation.  
> **Project owner:** Luke (PM)  
> **Sprint:** 10 — In Progress

> **⚠️ Agent orientation:** Sprint 1 CLOSED ✅ · Sprint 2 CLOSED ✅ · Sprint 3 CLOSED ✅ · Sprint 4 CLOSED ✅ · Sprint 5 CLOSED ✅ · Sprint 6 CLOSED ✅ · Sprint 7 CLOSED ✅ · Sprint 8 CLOSED ✅ · Sprint 9 CLOSED ✅ · Sprint 10 is IN PROGRESS — planning and QA complete, P1 build fixes done, Help Guide shipped, ADR-009 and PM table-stakes decisions outstanding.
> **Do not treat any prior sprint items as open.** Sprint 9 shipped: FR-01 resizable panels (arranger/mixer + FX panel splitters, full ARIA), FR-02 timeline zoom (`barW` prop drilling, keyboard/scroll shortcuts, zoom indicator, tick density, per-track vertical zoom), ADR-008. Sprint 10 partial: P1 build fixes, Help Guide, QA runbook, table-stakes audit, backlog model, continuity bounce spec, in-browser recording spec.

---

## 1. Project Overview

DAWin is a browser-based collaborative digital audio workstation (DAW) UI prototype. It is being designed and built by an AI agent team orchestrated by a human PM. The prototype runs locally with a Fastify backend at `server/` (TypeScript, tsc-clean) and a single-file React/TypeScript frontend.

The prototype is now at a substantial interactive state: session room with full audio playback, a Neve-inspired studio mixer, live plugin chain in signal path, JWT-based auth with role enforcement, real-time WebSocket transport sync and presence, server-side track locking, full inline comment system with timeline anchor pins and thread popovers, session chat panel, and deep-link URL routing to playhead/track/clip/range positions.

**Repository root:** `/Users/lukesydow/daw-design`  
**Primary source file:** `src/App.tsx` (~4,476 lines — all components in one file by design during early sprint)  
**Backend:** `server/` (Fastify + `@fastify/websocket`, TypeScript, tsc-clean)  
**Dev server:** `npm run dev` → `http://localhost:5173`

---

## 2. Current Product Vision

**"Figma for music production."**

A desktop-first collaborative DAW where musicians share a live session in real time — with track ownership, collaborator presence indicators, role-based access, inline commenting, deep-link sharing, and a professional studio aesthetic. The core differentiator is the collaborator color model: every user has a unique hex color that tints their tracks, clips, avatar ring, and mixer strip throughout the UI. This color signal makes ownership and activity instantly legible across the session.

**Primary user:** A musician or producer with strong DAW muscle memory (Ableton/Logic/Pro Tools) who is collaborating remotely with 1–4 others on a shared session. They expect standard keyboard shortcuts, correct timeline conventions, clear ownership signals, and collaboration tools that feel like they belong in a professional environment — not a toy.

**Desktop-first:** Minimum viewport 1280px enforced (`min-width: 1280px` on root). Mobile capture is a planned future screen but explicitly not the current focus.

---

## 3. Current Architecture / Repo Structure

### Directory layout

```
/Users/lukesydow/daw-design/
├── src/
│   └── App.tsx                   # All components (~4,476 lines — single file by design)
│   └── App.css                   # Minimal CSS (wood panel class, CSS animations)
├── server/                       # Fastify backend (tsc-clean)
│   ├── index.ts                  # Fastify app, registers all routes + WebSocket
│   ├── store.ts                  # In-memory Map<sessionId, SessionState> + all store fns
│   ├── types.ts                  # All shared types: ClientMeta, SessionState, WsClientMessage,
│   │                             #   WsBroadcast<T>, CommentAnchor, SessionComment, etc.
│   ├── jwt.ts                    # signToken / verifyToken — jose HS256, 8h user / 72h guest
│   ├── routes/
│   │   ├── sessions.ts           # GET /api/v1/sessions/:id
│   │   ├── auth.ts               # GET /auth/me (JWT verify), POST /auth/login, POST /auth/guest
│   │   └── comments.ts           # Full comment CRUD + resolve/reopen/reply endpoints
│   ├── ws/
│   │   └── handler.ts            # Full WS routing: transport, presence, track lock, comment fan-out
│   ├── package.json
│   └── tsconfig.json
├── public/
│   └── motion-prototypes/
│       └── 03-vu-meter-animation.html   # Standalone VU meter motion prototype
├── docs/
│   ├── adr/
│   │   ├── ADR-001-dsp-locality.md      # Accepted: DSP runs in browser via Web Audio API
│   │   ├── ADR-003-comment-anchor-model.md  # Accepted: unified CommentAnchor model (Sprint 3)
│   │   ├── ADR-004-database-schema.md   # Accepted: PostgreSQL + Prisma schema (Sprint 5)
│   │   ├── ADR-005-session-hydration.md # Accepted: session snapshot hydration strategy (Sprint 5)
│   │   ├── ADR-006-server-side-peak-generation.md  # Accepted: server-side waveform peaks (Sprint 7)
│   │   ├── ADR-007-audio-buffer-playback.md  # Accepted: real AudioBuffer playback (Sprint 8)
│   │   └── ADR-008-zoom-state-architecture.md  # Accepted: barW prop drilling for zoom (Sprint 9)
│   ├── specs/
│   │   ├── PRD.md                       # Product Requirements Document v1.1
│   │   ├── ROADMAP.md                   # Sprint-by-sprint roadmap v1.1
│   │   ├── session-communication.md     # FR-06 spec (Sprint 3 — implemented)
│   │   ├── resizable-workspace-panels.md # FR-01 spec (Sprint 9 — implemented)
│   │   ├── arranger-zoom.md             # FR-02 spec (Sprint 9 — implemented)
│   │   └── [other specs...]
│   ├── handoffs/                        # Agent → Tech Lead review requests
│   └── defects.md                       # UAT defect register
├── screenshots/
│   └── sprint-1-2026-05-14/
├── .claude/agents/                      # Agent persona definitions
├── .github/workflows/ci.yml             # tsc --noEmit --noUnusedLocals + Vite build
├── STATUS.md                            # Live project status board (Tech Lead writes)
└── handoff-documentation/
    ├── DAWin_PROJECT_STATE.md           # Technical state snapshot (component map, sprint history)
    └── DAWin_HANDOFF.md                 # This file
```

### Frontend architecture

- **Framework:** React 18 + Vite + TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` plugin. No `tailwind.config.js`. No `@apply`. No CSS modules. Utility classes for layout/spacing/typography; inline `style` for dynamic values (collaborator colors, calculated widths).
- **State:** `useState` / `useReducer` / `useContext`. No external state library. PM must approve any introduction of Redux, Zustand, or equivalent.
- **Audio:** Web Audio API. One shared `AudioContext` (`_audioCtx`) at module scope, lazy-initialized on first user gesture via `getAudioCtx()`. Plugin chain nodes tracked via `_pluginNodeMap`.
- **Component structure:** All components currently in `src/App.tsx`. Migration to `src/components/<ComponentName>.tsx` begins when a second screen is scaffolded.
- **WebSocket client:** `getWsClient()` singleton pattern (mirrors `getAudioCtx()`). Exponential backoff reconnect (500ms × 2^attempt, max 5 attempts). `sendWsMessage()` helper. `wsStatus` state drives StatusBar dot indicator.

### Audio graph (per track)

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
  AnalyserNode  ←── VU meter tap (POST-FADER, IEC 60268-17)
        │
        ▼
  StereoPannerNode  ←── track.pan mapped (-1..1)
        │
        ▼
  _masterGain  ←── masterVol (0–100)
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

`rewirePluginChain(trackId, plugins, ctx)`: creates/removes nodes as chain changes without rebuilding the full graph. Bypass removes node silently.

### Key layout constants (do not change without updating Figma DSM)

```ts
BAR_W        = 72    // px per bar in arranger timeline
BARS         = 32    // total bars in a session
TRACK_H      = 64    // px per track row
RULER_H      = 24    // timeline ruler height
HANDLE_W     = 8     // clip resize handle width
FADE_HDL_W   = 12    // fade handle width
TRANSPORT_H  = 52    // transport bar height
STATUS_BAR_H = 28    // status bar height
```

Sprint 9 added: `MIN_ARRANGER_H=200`, `MIN_MIXER_H=120`, `MIN_FX_W=220`, `MAX_FX_W=480`, `SPLITTER_H=4`, `SPLITTER_W=4`. Zoom derives `barW = BAR_W * zoomX` — `BAR_W` constant declaration is the only remaining reference to `BAR_W` in `src/App.tsx`.

### Design tokens (the `C` object — never hardcode hex values)

```ts
const C = {
  bg:          '#0A0A0F',
  surface:     '#111118',
  elevated:    '#1A1A24',
  accent:      '#6B5CE7',
  danger:      '#E94560',
  success:     '#1D9E75',
  textPri:     '#F0F0F5',
  textSec:     '#888899',
  control:     '#2A2A38',
  border:      '#1E1E28',
  well:        '#0D0D14',
  warn:        '#F5A623',
  accentMuted: 'rgba(107,92,231,0.13)',
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
| Track ownership (color avatars, record arm, locking) | ✅ Complete | Server-side lock enforcement + JWT role done (#20 Sprint 2) |
| Inline commenting + thread popovers | ✅ Complete | Timeline anchor pins, track pins, ThreadPopover, resolve/reply (Sprint 3) |
| Session chat panel | ✅ Complete | Flat comment list, compose input, unread badge (Sprint 3) |
| Deep links | ✅ Complete | `?t=&track=&clip=&range=` URL format, highlight-on-navigate (Sprint 3) |
| Invite flow modal | ✅ Complete | Role picker, email input |
| Mix view (shared fader, mute/solo, plugin chain) | ⚠️ Partial | Plugin chain audibly wired; plugin parameter editing not implemented |
| Resizable panels | ✅ Complete | Sprint 9 FR-01 — arranger/mixer + FX panel splitters, full ARIA, keyboard nav |
| Timeline zoom | ✅ Complete | Sprint 9 FR-02 — `barW` prop drilling, keyboard/scroll shortcuts, zoom indicator, tick density, per-track vertical zoom |
| Mobile capture | ❌ Not started | Intentionally deferred — desktop-first |

### Session room capabilities (what works today)

**Arranger:**
- 7 tracks, 32 bars, drag-to-scroll
- Clip drag (bar-snapped, preserves grab offset), resize (left/right handles), cut tool
- Bezier fade in/out handles with draggable midpoint control points
- Crossfade: implicit bezier crossfade on clip overlap; `crossfadeLocked: boolean` on ClipData; padlock icon in overlap zone
- Right-click context menu: Delete ✅, Duplicate ✅, Bounce-to-clip ✅, Loop region (stub), Rename (stub)
- Bounce-to-clip modal with virtual instrument + preset + humanizer style picker
- Playhead seek (click ruler), spacebar play/pause, stop holds position, Return-to-Zero resets
- Tool keyboard shortcuts: V (select), C (cut)
- BPM input with 40–300 range validation
- **Ruler anchor comment pins:** SVG chevrons at `startBar * BAR_W`, author-colored, count badges, `timeRange` bars, click opens ThreadPopover (Sprint 3)
- **Track header comment pins:** colored dot badge showing comment count per track (Sprint 3)
- **Deep link highlights:** `highlightBar`, `highlightTrackId`, `highlightClipId` states with 1500ms auto-clear; chain-link icon in TransportBar; right-click on track header → "Copy Link" (Sprint 3)

**Mixer:**
- 7 track strips + master strip, Neve-inspired studio theme
- Fader: logarithmic curve, unity at ~75% travel, grip ridges, `faderToDb()` / `formatDb()` (floor: −90 dB)
- `StudioFader`: `role="slider"`, ArrowUp/Down ±1, Shift+Arrow ±10
- Pan knob: center detent ±4 unit dead zone, 2px notch at center
- Mute, Solo buttons wired; Record arm: viewer-gated (JWT role enforced)
- VU meters: post-fader RMS, 60fps rAF, peak-hold dot, transient glow, `prefers-reduced-motion` respected
- VU heartbeat startup: bloom + staggered motorized recall on mount

**Auth / Role (Sprint 2 #20):**
- `server/jwt.ts`: `signToken` / `verifyToken` via `jose` HS256
- `POST /auth/login` and `POST /auth/guest` issue real JWTs
- `GET /auth/me` verifies Bearer token, returns `{ userId, role }`
- Frontend: `userRole` state fetched on mount from `/auth/me`; `isViewer = userRole === 'viewer'`
- Viewer cannot arm tracks, mute, or solo — tooltips on disabled controls
- `IS_VIEWER` constant fully removed; role is dynamic

**Track locking (Sprint 2 #20):**
- `track.arm` → server checks viewer role + existing lock → `track.locked` broadcast or `track.arm_rejected`
- `track.disarm` → releases lock → `track.unlocked` broadcast
- Disconnect → `releaseAllLocksForUser` cleans all locks for that client

**Comments + real-time (Sprint 3):**
- REST: `POST/GET/DELETE /sessions/:id/comments`, `PATCH .../resolve`, `PATCH .../reopen`, `POST .../replies`
- WS fan-out: `comment.add`, `comment.reply`, `comment.resolve`, `comment.reopen`
- Viewer role → 403 on all mutations (server-enforced)
- `ThreadPopover`: `position: fixed` overlay, click-outside via transparent backdrop, resolve/reply/reopen wired
- Chat panel: flat comment list, compose input, unread count badge on icon rail, `lastChatOpenedAt` ref for unread tracking
- Icon rail: 28px fixed right edge — FX panel toggle + chat toggle with unread count

**WebSocket client (Sprint 3):**
- `getWsClient()` singleton in App.tsx; mirrors `getAudioCtx()` pattern
- Exponential backoff reconnect: 500ms × 2^attempt, max 5 attempts; `_wsConnFailed` flag prevents further retries
- `session.join` sent on open with token
- `sendWsMessage(type, payload)` helper
- `wsStatus` state: `'connected' | 'reconnecting' | 'failed' | 'idle'` → StatusBar dot indicator

**Backend (as of Sprint 5):**
- Fastify server with `@fastify/websocket`, tsc-clean
- `StorageAdapter` interface (`server/storage/adapter.ts`) — `PrismaStorageAdapter` (PostgreSQL via Prisma) when `DATABASE_URL` is set; `InMemoryStorageAdapter` fallback for dev/test
- `server/prisma/schema.prisma` — canonical DB schema: `Session`, `Track`, `Clip`, `PluginInstance`, `Comment`, `CommentReply`, `AudioFile`, `SessionMember` tables
- `server/jwt.ts`: `signToken` / `verifyToken` via `jose` HS256 (8h user / 72h guest)
- All REST + WS handlers tsc-clean, `--noUnusedLocals --noUnusedParameters` passes
- Sprint 6 target: switch to `PrismaStorageAdapter` in production + Cloudflare R2 audio file storage

---

## 5. Active Agent Team Structure

This project uses a multi-agent system running inside Claude Code (Anthropic). Agents are persona files in `.claude/agents/`. The human PM (Luke) orchestrates which agents are called and when. **Each agent has no memory between sessions — every prompt must be fully self-contained.**

| Agent | Role |
|---|---|
| Product Manager | Orchestration, feature planning, work breakdown, prioritization |
| Tech Lead | Architecture decisions, code review, `docs/adr/`, `STATUS.md` |
| Frontend Engineer | All React/TypeScript code in `src/` |
| Designer | Design specs in `docs/specs/`, Figma DSM, interaction patterns |
| Backend Engineer | API contracts, data models, real-time architecture in `server/` |
| UAT | Test scenarios, defect identification, acceptance criteria validation |

**Ownership boundaries (hard rules):**
- Designer may NOT write to or edit any file in `src/` — ever
- Frontend Engineer may NOT write to `docs/adr/` or `STATUS.md`
- `STATUS.md` is written by Tech Lead only
- `docs/adr/` is written by Tech Lead only
- `docs/specs/` is written by Designer or PM
- `docs/handoffs/` is written by any agent dropping work for Tech Lead review

---

## 6. Agent Roles and Responsibilities

### Product Manager
- Breaks ambiguous feature requests into crisp briefs: problem → user story → acceptance criteria → open questions
- Routes sub-tasks to the correct specialist agent with self-contained prompts
- Prioritizes: (1) anything blocking the collaborative loop, (2) partial screens before new ones, (3) polish after golden path, (4) mobile last
- Does NOT write code or design specs directly

### Tech Lead
- Owns technical integrity across all layers
- Makes the call when frontend/backend specs conflict: backend contract wins for data shape; frontend wins for interaction timing
- Reviews all code: correctness → type safety → token compliance → performance → simplicity
- Writes Architecture Decision Records to `docs/adr/`
- Does NOT own roadmap or feature scope

### Frontend Engineer
- Owns everything in `src/` — components, state, hooks, styling
- Typed functional components only (`const` arrow functions, no `function` keyword, no `any`)
- Tailwind utility classes for layout; inline `style` for dynamic values; never hardcode hex
- Runs `tsc --noEmit` before every commit
- Does NOT write to `docs/specs/` or `docs/adr/`

### Designer
- Owns how every screen looks and behaves from the user's perspective
- Writes specs to `docs/specs/<feature>.md` and handoffs to `docs/handoffs/<feature>-design.md`
- Specifies every interactive state: hover, focus, active, disabled, empty, loading, error
- **Hard boundary: may not write to or edit any file in `src/`.** Code implemented by Frontend Engineer from spec only.
- Uses Figma MCP tools to read/write the Design System file
- Does NOT make product scope decisions

### Backend Engineer
- Owns API contracts, WebSocket message schemas, and data models in `server/`
- REST endpoints versioned at `/api/v1/...` from day one; no GraphQL without PM approval
- Does NOT make frontend implementation decisions

### UAT Agent
- Tests from the perspective of a musician with DAW muscle memory (Ableton/Logic/Pro Tools)
- Writes defects to `docs/defects.md` with priority (P0 blocker → P3 low) and file:line references
- Can use browser preview tools to interact with the running app
- Does NOT implement fixes

---

## 7. Tool Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript (strict mode) | Type safety across frontend |
| Vite | Dev server + build tool |
| Tailwind CSS v4 (`@tailwindcss/vite`) | Utility-class styling — no config file |
| Fastify + `@fastify/websocket` | Backend HTTP + WebSocket server |
| `jose` | JWT sign/verify (HS256, `JWT_SECRET` env var) |
| Web Audio API | Audio synthesis, playback, metering |
| `requestAnimationFrame` | VU meter animation (direct DOM writes, no state) |

**CI (`.github/workflows/ci.yml`):**
1. `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` — strict typecheck
2. `npm run build` — Vite build

**No external dependencies for:** state management (no Redux/Zustand), animation (no Framer Motion), audio routing (no Tone.js).

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
| ⚛ Atoms | Button, Toggle, InputField, Avatar, TrackAccentBar, TrackControlButton, Fader, LevelMeter, Badge, RoleOption, Knob, PanKnob, TransBtn |
| 🧩 Molecules | TrackHeader, ChannelStrip, Clip (5 variants), Toolbar (3 variants), StatusBar (2 variants), TransportBar |
| 🦠 Organisms | SessionTopbar, TrackSidebar, MixerPanel, FXChainPanel, ConflictModal, InviteModal |
| 📐 Templates | Not yet populated |
| 📄 Docs | Not yet populated |

**Canonical layout grid:** content at x=380, y=180; label column x=80 width=260px; section gap=120px; component gap=40px; all components as `COMPONENT_SET` nodes.

---

## 9. GitHub Repository

**Remote:** https://github.com/lukesydow-lab/DAWin  
**CI:** GitHub Actions — typecheck + Vite build on push/PR to `main`  
**Milestones:** Sprint 1 (closed), Sprint 2 (closed), Sprint 3 (closed), Sprint 4 (closed), Sprint 5 (closed), Sprint 6 (closed), Sprint 7 (closed), Sprint 8 (closed), Sprint 9 (closed), Sprint 10 (open — planning)  
**Labels:** `type:feature-request`, `status:triage`, `sprint:1–4`, `type:open-decision`, `priority:p0–p3`, `component:frontend/backend/design`, `type:bug/chore`

---

## 10. Current Implementation Status (Sprint 10 — In Progress)

### What is fully wired and working

**Sprint 1 (closed 2026-05-14):**
- 7-track arranger: clip drag/resize/fade/cut, bezier fade curves, crossfade symmetry lock
- Neve mixer: log faders, pan knobs, mute/solo, VU meters (60fps, peak-hold, heartbeat startup)
- Plugin rack browser: wood cabinet, drag-to-reorder, PluginChainPanel overlay
- Collaborator color model on all surfaces
- GitHub infrastructure: milestones, labels, issue templates, PRD, Roadmap

**Sprint 2 (closed 2026-05-15):**
- Fastify scaffold: WebSocket transport sync, presence fan-out, session snapshot
- Plugin chain audio graph: DynamicsCompressor, Reverb, Delay, EQ, Limiter — bypass without rebuild
- Master panner (StereoPannerNode), PanKnob center detent, StudioFader ARIA
- CI: `--noUnusedLocals --noUnusedParameters` enforced
- **#20:** JWT sign/verify (`server/jwt.ts`), real `GET /auth/me`, `POST /auth/login` + `/auth/guest`, track lock state in session store, `track.arm/disarm/locked/unlocked/arm_rejected` WS handlers, lock release on disconnect; Frontend: `userRole` from `/auth/me`, `isViewer` prop-threaded to TrackHeader, viewer tooltips on R/M/S

**Sprint 3 (closed 2026-05-15):**
- ADR-003: Unified `CommentAnchor` model, in-memory comment storage, WS event schema, deep link URL format
- Backend comments API: `POST/GET/DELETE /sessions/:id/comments`, `PATCH .../resolve`, `PATCH .../reopen`, `POST .../replies`; WS fan-out for `comment.add/reply/resolve/reopen`
- WS client: `getWsClient()` singleton — exponential backoff reconnect, `session.join` on open, `sendWsMessage()` helper, `wsStatus` → StatusBar dot
- Deep links: `copyDeepLink()`, `?t=&track=&clip=` URL parsing on mount, playhead seek + highlight states, 1500ms auto-clear, chain-link icon in TransportBar, right-click on track header
- Comment UI: Ruler anchor pins (SVG chevrons, author-colored, count badges, timeRange bars), track header pins, `ThreadPopover`, chat panel, unread count badge on icon rail, WS-driven state updates

### What is not yet implemented (Sprint 10+ targets)

- **In-browser audio recording (`getUserMedia`):** Designer spec written (`docs/specs/in-browser-recording.md`); awaiting PM approval before FE work order issued.
- **Known Limitations panel:** SPRINT-10-005 open; needs Designer spec before implementation.
- **localStorage persistence for panel sizes:** Explicitly deferred from Sprint 9 per FR-01 spec; requires a Tech Lead ADR before implementation.
- **Owner Continuity Bounce:** Spec written (`docs/specs/owner-continuity-bounce.md`); awaiting ADR-009 from Tech Lead before implementation.
- **Plugin parameter editing:** Plugin cards display params as read-only amber LCD text; no inline editing. PM decision on UX pattern required.
- **Undo/redo:** Stub items in Edit menu are non-interactive. Requires operational transforms. Sprint 11+ at earliest.

### What is a stub or not started

- **Mobile capture screen:** Not started. Desktop-first mandate.
- **Undo stack:** Not started. Requires operational transforms.
- **Audio recording (getUserMedia):** Not started. Sprint 8–9 target.
- **MIDI tracks:** Out of scope for web app.

---

## 11. Sprint 6 — CLOSED ✅ (2026-05-19)

**Goal:** File Storage — Cloudflare R2 integration + first real Prisma migration.

**What shipped:**
- PostgreSQL live; `prisma migrate status` shows no pending migrations
- Server boots with `PrismaStorageAdapter`; logs "Using PrismaStorageAdapter"
- `POST /api/v1/sessions/:sessionId/audio` — multipart WAV upload → R2 → `AudioFile` DB row
- `GET /api/v1/audio/:id/stream-url` — presigned R2 URL (1-hour TTL)
- Role enforcement: viewer 403 on upload; non-member 403 on stream-url
- `docker-compose.yml`, `.env.example` with R2 vars, `docs/guides/local-setup.md` runbook
- `tsc --noEmit` passes

## 11b. Sprint 7 — CLOSED ✅ (2026-05-19)

**Goal:** Audio File Import — drag-and-drop import to timeline, `POST /api/v1/sessions/:sessionId/clips` endpoint, server-side peak generation, waveform rendering from real buffers.

**UAT:** CONDITIONAL PASS — zero P0/P1 defects; 4 P2/P3 defects found and fixed before close.

**What shipped:**
- Audio file drag-and-drop + file picker (`I` key) onto arranger timeline
- `POST /api/v1/sessions/:sessionId/clips` — creates Clip row linked to AudioFile (Backend commit `50479b8`)
- Server-side peak generation (200 RMS values) in upload handler; `AudioFile.peaks` JSONB persisted
- Upload response includes `peaks`; WS `audio.uploaded` event fans out peaks to all collaborators
- Session snapshot includes `audioFileId` and `peaks` per clip — waveforms restore on session reopen
- All clip import states: uploading, decoding, complete, failed-upload (danger tint), failed-decode (warn tint)
- `WaveformPlaceholder` for null/empty peaks
- `PeakGenerator` abstraction (client-side preview-only path)
- `ClipData.importStatus` field added and typed
- Live BPM used for clip duration calculation (was hardcoded 128)
- ADR-006: server-side peak generation — `docs/adr/ADR-006-server-side-peak-generation.md`

**Ticket sequence (all complete):**
- **7-A (Backend):** ✅ `POST /api/v1/sessions/:sessionId/clips` + `AudioFile.peaks` schema + 200-peak upload handler + WS fan-out (commit `50479b8`)
- **7-B (Designer):** ✅ `docs/specs/audio-file-import.md` — all 17 sections
- **7-C (Frontend):** ✅ Drag-and-drop import, `PeakGenerator` abstraction, all clip import states (commit `29aa36c`)
- **7-D (Frontend):** ✅ Server peaks wired; `audio.uploaded` WS handler; snapshot peak hydration; live BPM; failed-decode warn tint (commit `e25f506`)
- **7-K (UAT):** ✅ Sprint 7 UAT — CONDITIONAL PASS, zero P0/P1, 4 P2/P3 fixed (commit `30bbae4` backend, `30bbae4` frontend)

## 11c. Sprint 8 — CLOSED ✅ (2026-05-28)

**Goal:** Playable Beta — session lobby, real audio playback from R2, application menu bar.

**UAT:** PASS — zero P0/P1 defects; all 5 defects confirmed fixed before close.

**What shipped:**
- **Session lobby** — full-screen create/join/recent-sessions screen when no `?session=` URL param is present; `localStorage` recent sessions (max 3); inline error on invalid session ID
- **Real audio playback** — `AudioBufferSourceNode` from R2 presigned URLs; decoded `AudioBuffer` in-memory cache with 1hr TTL awareness; clip loading indicator during fetch/decode; procedural synthesis preserved for non-imported tracks
- **Application menu bar** — 24px `C.elevated` bar at top of app; File/Edit/Session/View/Transport/Help menus; stub items dimmed (`opacity: 0.4`, non-interactive); all non-stub items wired to existing handlers
- **`KeyboardShortcutsModal`** — opened by `?` key and Help → Keyboard Shortcuts; all Sprint 8 shortcuts grouped by category (Transport, Editing, Import, Navigation, Panels)
- **`AboutModal`** — Sprint 8, v0.8.0-beta
- **`API_BASE` constant** — configurable via `VITE_API_URL` env var; removes hardcoded `localhost:3000` from all fetch/XHR call sites
- **True stereo VU metering** — `ChannelSplitterNode` after `StereoPannerNode`; independent L/R `AnalyserNode`s; closes 5-I carried from Sprint 5
- WS handler correctly registered on lobby entry via reactive `useEffect([sessionId, handleWsMessage])` — SPRINT-8-001 fix
- Space key guard prevents double-fire transport toggle when menu item has focus — SPRINT-8-002 fix
- "New Session" File menu item relabeled "Return to Lobby" — SPRINT-8-003 fix

**Ticket sequence (all complete):**
- **8-A (Frontend):** Session lobby
- **8-B (Frontend):** Real audio playback
- **8-C (Frontend):** Application menu bar + modals
- **8-D (Frontend):** Defect fixes (SPRINT-8-001 through 003, 5-I/R3, hardcoded API URL)
- **8-K (UAT):** Sprint 8 UAT re-verification — PASS (commit `ebbbb4d`)

## 11d. Sprint 9 — CLOSED ✅ (2026-05-29)

**Goal:** Workspace Control — give engineers control over screen real estate and timeline density.

**UAT:** PASS — zero P0/P1 defects; 2 defects found (SPRINT-9-001 P2, SPRINT-9-002 P3) and fixed before close.

**What shipped:**
- **FR-01 Resizable workspace panels** — arranger/mixer vertical splitter + FX panel horizontal splitter; pointer-event drag with `setPointerCapture`; double-click reset (200ms ease); keyboard navigation (Arrow ±8px, Home/End, Enter/Space); full ARIA; constants `MIN_ARRANGER_H=200`, `MIN_MIXER_H=120`, `MIN_FX_W=220`, `MAX_FX_W=480`
- **FR-02 Arranger timeline zoom** — `barW = BAR_W * zoomX` prop drilling throughout arranger; keyboard shortcuts `=`/`-`/`0`; Ctrl/Cmd+scroll wheel zoom; playhead-anchor (keyboard) and cursor-anchor (scroll wheel); zoom level `%` indicator in ruler; ruler tick density at zoom thresholds; per-track vertical zoom (`trackZoomY`) via chevron buttons `[0.5×, 3.0×]`; View menu Zoom In/Out/Reset now active
- **ADR-008** — Zoom state architecture (prop drilling decision for `barW`)
- SPRINT-9-001 fix: Panel height calculations now subtract `MENU_BAR_H` (24px)
- SPRINT-9-002 fix: Zoom Out menu shortcut label corrected to hyphen-minus

## 11e. Sprint 10 — IN PROGRESS (started 2026-05-31)

**Goal:** Demo Hardening + Table-Stakes DAW Baseline — stabilize the playable beta for musician friend testing.

**UAT:** PASS on P1 fix pass (all 8 build errors resolved); SPRINT-10-005 (Known Limitations panel) and SPRINT-10-007 (process gate) still open.

**What shipped:**
- Socializable Demo QA runbook (`docs/specs/socializable-demo-qa.md`)
- DAW table-stakes audit (`docs/research/daw-table-stakes-audit.md`)
- Formal backlog model with Need-to-Have / Post-MVP / Nice-to-Make / Blue Sky tiers
- Owner Continuity Bounce spec (`docs/specs/owner-continuity-bounce.md`) — ADR-009 pending
- In-browser recording Designer spec (`docs/specs/in-browser-recording.md`) — PM approval pending
- DAWin User Help Guide (`docs/guides/dawin-user-guide.md`) — 548 lines, 18 sections
- P1 build fix pass: 8 TypeScript build errors resolved; `npm run build` passes; `?demo=1` bypass; demo seed data wired; AboutModal updated to Sprint 9

**Still open:**
- ADR-009 (continuity bounce architecture)
- Known Limitations panel (Designer spec required → SPRINT-10-005)
- PM decisions on table-stakes audit → Sprint 11 scope

---

## 12. Known Blockers

| Blocker | Who is blocked | What resolves it |
|---|---|---|
| ADR-009 not written | Owner Continuity Bounce implementation | Tech Lead writes ADR-009 |
| No Designer spec for Known Limitations panel | SPRINT-10-005 implementation | Designer writes spec |
| PM table-stakes decisions outstanding | Sprint 11 scope | PM reviews audit and makes decisions |
| localStorage persistence for panel sizes — no ADR yet | FR-01 follow-on (panel size persistence) | Tech Lead writes ADR before implementation |

---

## 13. Open Questions

### For PM

1. **Table-stakes audit decisions** — Which items from `docs/research/daw-table-stakes-audit.md` move to Sprint 11? PM review determines Sprint 11 scope.
2. **In-browser recording approval** — Designer spec is on file (`docs/specs/in-browser-recording.md`). PM must approve before FE work order is issued.
3. **Owner Continuity Bounce tier** — Is this Need-to-Have for Sprint 11 or Post-MVP?
4. **Export Mix tier decision** — Outstanding from Sprint 10 planning.
5. **Plugin parameter editing UX** — Expanding card, side panel, or popover? No spec written yet. Must be decided before a sprint is scheduled for this feature.

### For Tech Lead

1. **ADR-009 (continuity bounce architecture)** — Owner Continuity Bounce spec is written. Write ADR-009 before implementation begins.
2. **ADR for panel size localStorage persistence** — Deferred from Sprint 9 per FR-01 spec. Write ADR covering localStorage key shape and sync strategy before Frontend picks up that follow-on ticket.
3. **ADR-002 status** — ADR-002 (in-memory store) is superseded by the Sprint 5/6 persistence work. `PrismaStorageAdapter` is live. Mark ADR-002 Superseded in `docs/adr/README.md`.

---

## 14. Architecture Decisions (ADR History)

### ADR-001 — DSP Locality (accepted 2026-05-10)
**Decision:** All DSP runs in the browser via the Web Audio API for the prototype.  
**Rationale:** Server-side DSP requires ~32 Mbps sustained for a 7-track session. Web Audio API nodes cover all plugin types natively.  
**Future path:** CLAP/VST3 requires Electron/Tauri sidecar with shared memory + local loopback WebSocket.

### ADR-002 — Backend Scaffold (accepted 2026-05-14)
**Decision:** Fastify + `@fastify/websocket` + in-memory session store for the prototype.  
**Rationale:** Minimal surface area; no persistence needed until Sprint 5+ real-session hydration.

### ADR-003 — Comment Anchor Model (accepted 2026-05-15)
**Decision:** Unified `CommentAnchor` type shared by inline comments (FR-06) and deep links (FR-07). Bar-based anchors (not seconds). Five anchor types: `timeline | timeRange | track | clip | trackMoment`. WS event schema: `comment.add/reply/resolve/reopen`. Deep link URL format: `?t=<bar>&track=<id>&clip=<id>&range=<start>-<end>`.

### ADR-004 — PostgreSQL + Prisma Schema (accepted 2026-05-17)
**Decision:** PostgreSQL + Prisma replaces the in-memory store. `server/prisma/schema.prisma` is the canonical schema. `StorageAdapter` interface at `server/storage/adapter.ts` is the only contract route handlers depend on — they never call Prisma directly. `PrismaStorageAdapter` for production; `InMemoryStorageAdapter` for dev/test (no `DATABASE_URL`). cuid() for all IDs. JSONB for plugin params and comment anchors.

### ADR-005 — Session Hydration Strategy (accepted 2026-05-18)
**Decision:** On WS join, the server sends `session.snapshot` with `session`, `tracks`, and `clips` fields from the DB. Ephemeral runtime state (transport position, track locks, active presence) is not persisted — it is rebuilt from live WS events. Unknown session IDs receive WS close code 4404. Frontend eliminates hard-coded seed state for track/clip entities; hydrates from snapshot instead.

### ADR-007 — Real Audio Buffer Playback (accepted 2026-05-20)
**Decision:** `AudioBufferSourceNode` from R2 presigned URLs replaces procedural synthesis for imported clips. `AudioBuffer` cached in memory (1hr TTL). Presigned URL re-fetched on expiry; buffer never re-decoded if cache hit.  
**Full ADR:** `docs/adr/ADR-007-audio-buffer-playback.md`  
**Sprint shipped:** Sprint 8

### ADR-008 — Zoom State Architecture (accepted 2026-05-29)
**Decision:** `zoomX` state lives at App root; `barW = BAR_W * zoomX` is computed at root and passed as a prop to all arranger components. React context was rejected due to the single-file constraint (context threading more complex than prop drilling) and because collaborator zoom is local-only with no need for deep consumption.  
**Full ADR:** `docs/adr/ADR-008-zoom-state-architecture.md`  
**Sprint shipped:** Sprint 9

### ADR-006 — Server-Side Waveform Peak Generation (accepted 2026-05-19)
**Decision:** The server generates waveform peak data (200 × Float32) during audio file upload. `AudioFile.peaks` (JSONB) is the persistent source of truth. Peaks are returned in the upload response and fanned out via WS `audio.uploaded`. The client-side `PeakGenerator` is retained as a local-preview-only path (renders while upload is in flight; replaced by server peaks on upload complete). Session snapshot includes peaks per clip so waveforms hydrate on session reopen without recalculation.
**Rationale:** For a 200-sample overview, compressed vs. lossless peaks are visually identical. File is already in R2; server generation adds no round trips. Storage cost: ~800 bytes per clip (negligible). All collaborators receive peaks via WS fan-out without decoding audio locally.
**Full ADR:** `docs/adr/ADR-006-server-side-peak-generation.md`
**Sprint shipped:** Sprint 7

### Other key decisions (no ADR)

- **Crossfade interaction model (2026-05-14):** Crossfades implicit on clip overlap; `crossfadeLocked: boolean` on ClipData; padlock icon in overlap zone.
- **VU meters post-fader (2026-05-12):** Tap is after GainNode per IEC 60268-17. Matches Pro Tools, Logic, Ableton.
- **Single rAF loop for VU (2026-05-12):** One shared rAF in MixerPanel; refs + direct DOM writes — no state — avoids 240+ re-renders at 60fps.
- **masterPan default (2026-05-14):** `masterPan` initialized at 50 (center). Mapping `(masterPan-50)/50`. Previous `masterPan/100` mapping produced hard-left output.
- **CI tightened (2026-05-14):** `--noUnusedLocals --noUnusedParameters` added. Prevents dead code accumulation.
- **comment.add not echoed to sender (2026-05-15):** REST 201 is the ack for the creator. Only other tabs receive the WS event. Prevents duplicate renders.

---

## 15. Non-Negotiable Constraints

### Code
- All components in `src/App.tsx` until a second screen is scaffolded — do not create new files in `src/` without Tech Lead approval
- TypeScript strict mode — no `any`; use `unknown` + TODO if type is genuinely unknown
- No external state library without PM approval
- No CSS modules, no styled-components, no `@apply` — Tailwind v4 utility classes + inline `style` for dynamic values only
- One shared `AudioContext` (`_audioCtx` via `getAudioCtx()`) — do not create a second one
- Run `tsc --noEmit` before every commit

### Design
- Never hardcode hex color values — always use `C.*` tokens from `src/App.tsx`
- Collaborator colors applied via inline `style` props — never via Tailwind classes
- Every new surface must honor the collaborator color model
- Desktop-first — minimum 1280px
- Dense information density is correct for a pro audio tool — do not add whitespace

### DAW conventions (muscle memory — do not break)
- Spacebar = play/pause
- Stop preserves playhead position; Return-to-Zero resets it
- VU meters are post-fader (IEC 60268-17) — meter tap goes after the GainNode
- Fader curve is logarithmic with unity gain at ~75% travel

---

## 16. Feature Backlog

Items below are not formally scoped. None should be started without a PM-written spec.

### Sprint 5 candidates (after Sprint 4 lands)

1. **Plugin parameter editing UI** — Expanding plugin card with inline knobs/sliders per param. PM spec required first. Compressor: threshold, ratio, attack, release.
2. **Context menu completions** — Loop region sets `loopStart`/`loopEnd`; Rename: inline text edit on track header. Or remove stubs.
3. **Frontend WebSocket client → full presence** — Replace seed data presence cursors with live server events. WS client singleton is ready; UI presence update wire-up needed.
4. **VU calibration polish** — 0 VU tick mark, color band recalibration, true stereo via SplitterNode (pending PM decisions).
5. **Wire WS ticket→role on connect** — Deferred P1 from Sprint 2 UAT: decode JWT on WS connection so `role` is accurate from WS messages (not hardcoded `'owner'`).

### Future / post-MVP

| Feature | Why deferred | Prerequisite |
|---|---|---|
| Mobile capture screen | Desktop-first mandate | PM formal scope decision + Designer full mobile spec |
| CLAP/VST3 native plugin support | Requires Electron/Tauri sidecar (ADR-001) | Electron integration decision |
| Undo stack | Requires operational transforms | Tech Lead design + PM approval |
| Session history / restore points | Depends on stable server persistence | Backend persistence layer |
| Real audio recording (getUserMedia) | Requires backend blob storage | Backend recording pipeline |
| MIDI track type | All tracks are audio synthesis only | New spec + PM scope decision |
| Ownership transfer UI | Backend must enforce; PM decision | #20 complete + PM §8.7 decision |
| Clip color picker | Override owner color on individual clips | PM decision |

---

## 17. How New Feature Work Orders Should Be Structured

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

### Scope — what is IN
### Scope — what is OUT (defer to future)

### Design constraints
- Use `C.*` tokens — no hardcoded hex values
- Collaborator colors must appear on [specific elements]
- ARIA: [specific labels for icon-only controls]
- DAW conventions to honor: [specific keyboard shortcuts, interaction patterns]

### Technical notes
[Architecture constraints, file locations, line numbers]
[Reference any relevant spec files in docs/specs/]

### Open questions (must be answered before implementation)

### Definition of done
- [ ] tsc --noEmit passes
- [ ] Feature matches spec — UAT validated
- [ ] Committed with Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
- [ ] Handoff dropped to docs/handoffs/ for Tech Lead review
- [ ] STATUS.md updated

**Sprint close gate (final ticket only):** After UAT sign-off on the last ticket of a sprint, the PM must complete a documentation pass before the sprint is marked CLOSED. See `CLAUDE.md` § Sprint close protocol for the full checklist. No sprint is CLOSED until `DAWin_HANDOFF.md` and `DAWin_PROJECT_STATE.md` reflect the new sprint state.
```

---

## 18. Recommended Next Steps (Sprint 10 / Sprint 11)

Sprint 10 is in progress. P1 build fixes are done. The following actions are outstanding.

**Sprint 10 remaining work:**

1. **Tech Lead: Write ADR-009** — Owner Continuity Bounce spec is on file at `docs/specs/owner-continuity-bounce.md`. ADR-009 is the gate before implementation can begin. This is the highest-priority Tech Lead task.

2. **Designer: Known Limitations panel spec** — SPRINT-10-005 is open. Help menu needs a Known Limitations surface for friend-testers. Designer writes the spec; FE implements after PM approval. No FE work order until spec exists.

3. **PM: Table-stakes audit decisions** — Review `docs/research/daw-table-stakes-audit.md` and decide which items move to Sprint 11. This determines Sprint 11 scope.

4. **PM: In-browser recording approval** — Designer spec is at `docs/specs/in-browser-recording.md`. PM reviews and approves or requests changes. No FE work order until approved.

**Sprint 11 pre-work (before sprint kickoff):**

5. **Tech Lead: ADR for panel size localStorage persistence** — Deferred from Sprint 9. Write ADR before Frontend implements panel size persistence.

6. **Tech Lead: ADR-002 housekeeping** — Mark ADR-002 (in-memory store) as Superseded in `docs/adr/README.md` now that `PrismaStorageAdapter` is live.

7. **Designer: Plugin parameter editing spec** — PM must decide the UX pattern (expanding card vs. side panel vs. popover) before Designer can write the spec. No sprint can be scheduled for this feature until the spec exists.

8. **Backend Engineer: Recording pipeline pre-work** — If Sprint 11 includes in-browser recording: `getUserMedia` → WAV/WebM → multipart upload to existing R2 endpoint; track `isRecording` state; WS broadcast of recording state to collaborators. Requires Tech Lead ADR before Backend begins.
