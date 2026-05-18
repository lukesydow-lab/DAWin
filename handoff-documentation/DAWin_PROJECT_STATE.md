# DAWin — Project State Snapshot

**Status: Current**
**Last updated:** 2026-05-18
**Sprint:** 6 — File Storage (planning)
**Repo:** https://github.com/lukesydow-lab/DAWin
**Raw handoff:** https://raw.githubusercontent.com/lukesydow-lab/DAWin/main/handoff-documentation/DAWin_PROJECT_STATE.md

> **⚠️ Sprint status:** Sprint 1 CLOSED ✅ · Sprint 2 CLOSED ✅ · Sprint 3 CLOSED ✅ · Sprint 4 CLOSED ✅ · Sprint 5 CLOSED ✅ · Sprint 6 is the active sprint (planning).
> Do not treat any prior sprint items as open. Persistence layer (ADR-004/005, Prisma, StorageAdapter), VU stereo, loop region, clip rename, and session hydration all shipped in Sprint 5.

---

## Current stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4
- **Backend:** Fastify at `server/` (TypeScript, tsc-clean). Routes: `GET /api/v1/sessions/:id`, `GET /api/v1/auth/me` (JWT-verified), `POST /api/v1/auth/login`, `POST /api/v1/auth/guest`, `POST/GET/DELETE /api/v1/sessions/:id/comments`, `PATCH .../resolve`, `PATCH .../reopen`, `POST .../replies`. WebSocket: transport sync, presence fan-out, track locking, comment fan-out.
- **Real-time:** WebSocket active server-side + frontend singleton client (`getWsClient()` in App.tsx). In-memory session store.
- **Auth:** JWT sign/verify via `jose` (HS256). `server/jwt.ts`. `GET /auth/me` verifies Bearer token. `POST /auth/login` + `/auth/guest` issue real JWTs.
- **Audio:** Web Audio API — single `_audioCtx` singleton, 7 procedural synthesis tracks, full plugin chain per track.
- **All frontend code:** `src/App.tsx` (single file, ~4,476 lines). No split until Tech Lead approves.

---

## Component map (src/App.tsx)

| Component | Purpose | Status |
|-----------|---------|--------|
| `App` | Root — owns all track/session/comment/WS state | ✅ |
| `TransportBar` | Logo, play/pause/stop/record, BPM, avatars, Invite, deep-link chain icon | ✅ |
| `ArrangeView` | 7-track timeline, ruler + comment pins, playhead, clips, deep-link highlights | ✅ |
| `Clip` | Draggable/resizable clip with bezier fade handles + symmetry lock, highlight state | ✅ |
| `TrackHeader` | Track controls, R/M/S buttons (viewer-gated), comment pin, deep-link right-click | ✅ |
| `ThreadPopover` | Fixed comment thread overlay — body, replies, resolve/reopen, reply input | ✅ |
| `MixerPanel` | Neve-themed mixer, single rAF VU loop, heartbeat startup | ✅ |
| `MixerStrip` | Per-track fader, pan, mute/solo, VU meters, FX badge | ✅ |
| `PluginChainPanel` | Fixed overlay (right: 0), rack-style FX units, plugin browser | ✅ |
| `PluginBrowser` | Inline popover — search + add plugin to chain | ✅ |
| `InviteModal` | Role picker + email input (UI only) | ✅ |
| `StatusBar` | Collaborator count, latency, WS status dot (connected/reconnecting/failed/idle) | ✅ |
| Chat panel | Fixed right-side 280px panel — flat comment list, compose input, unread badge | ✅ |
| Icon rail | Fixed 28px right edge — FX toggle + chat toggle with unread count | ✅ |

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

`rewirePluginChain` reconciler manages node lifecycle. Bypass removes/reinserts a node without rebuilding the full graph.

---

## Sprint 1 — CLOSED ✅ (2026-05-14)

- 7-track arranger with clip drag/resize/fade/cut, bezier fade curves, crossfade symmetry lock
- Neve mixer: logarithmic faders, pan knobs, mute/solo, VU meters (60fps, peak-hold, heartbeat startup)
- Plugin rack browser: wood cabinet, drag-to-reorder, FX chain panel (BFC fix)
- Collaborator color model on all surfaces
- GitHub infrastructure: milestones, labels, issue templates, PRD, Roadmap

## Sprint 2 — CLOSED ✅ (2026-05-15)

- Fastify scaffold: WebSocket routing (transport sync, presence fan-out, session snapshot)
- Plugin chain audio graph: DynamicsCompressor, Reverb, Delay, EQ, Limiter — bypass without rebuild
- Master panner (StereoPannerNode), PanKnob center detent, StudioFader ARIA
- CI: `tsc --noEmit --noUnusedLocals --noUnusedParameters` enforced
- **#20:** JWT sign/verify (`server/jwt.ts`), real `GET /auth/me`, `POST /auth/login` + `/auth/guest`, track lock state in session store, `track.arm`/`track.disarm`/`track.locked`/`track.unlocked`/`track.arm_rejected` WS handlers, lock release on disconnect; frontend `userRole` from `/auth/me`, `isViewer` prop-threaded, viewer tooltips on R/M/S

## Sprint 3 — CLOSED ✅ (2026-05-15)

- **ADR-003:** Unified `CommentAnchor` model, in-memory comment storage, WS event schema, deep link URL format
- **Backend comments API:** `POST/GET/DELETE /sessions/:id/comments`, `PATCH .../resolve`, `PATCH .../reopen`, `POST .../replies`; WS fan-out for `comment.add/reply/resolve/reopen`
- **WS client:** `getWsClient()` singleton in App.tsx — exponential backoff reconnect, `session.join` on open, `sendWsMessage()` helper, `wsStatus` state → dot indicator in StatusBar
- **Deep links:** `copyDeepLink()`, `?t=&track=&clip=` URL parsing on mount, playhead seek + highlight states (`highlightBar`, `highlightTrackId`, `highlightClipId`), 1500ms auto-clear, chain-link icon in TransportBar, right-click on track header
- **Comment UI:** Ruler anchor pins (SVG chevrons, author-colored, count badges, timeRange bars), track header pins, `ThreadPopover` (body/replies/resolve/reply input/click-outside), chat panel (flat list + compose), unread count badge on icon rail, WS-driven state updates

## Sprint 4 — CLOSED ✅ (2026-05-18)

**Goal:** Core Editing Ergonomics — resizable panels (FR-01) and timeline zoom (FR-02).

Note: FR-01 and FR-02 were planned for Sprint 4 but deferred due to the persistence layer work being prioritized in Sprint 5. They remain unimplemented. Specs exist at `docs/specs/resizable-workspace-panels.md` and `docs/specs/arranger-zoom.md` for when these features are scheduled.

## Sprint 5 — CLOSED ✅ (2026-05-18)

**Goal:** Persistence Layer Live — PostgreSQL + Prisma replaces in-memory store.

What shipped: ADR-004 (DB schema), ADR-005 (hydration strategy), Prisma schema, StorageAdapter interface, InMemoryStorageAdapter, PrismaStorageAdapter, docker-compose.yml, session hydration on WS join, JWT role from ticket on WS connect, REST sessions wired to storage, live presence cursors from JWT, VU stereo SplitterNode, loop region + clip rename context menu, Sprint 5 UAT (PASS).

## Sprint 6 — ACTIVE (planning phase)

**Goal:** File Storage — Cloudflare R2 + first real Prisma migration.

Work order: `docs/handoffs/sprint6-backend-workorder.md`

Ticket sequence:
- **6-A (Backend):** First Prisma migration + switch to `PrismaStorageAdapter`
- **6-B (Backend):** Complete `PrismaStorageAdapter` (all StorageAdapter methods)
- **6-C (Backend):** Cloudflare R2 — `POST /api/v1/sessions/:id/audio` upload endpoint
- **6-D (Backend):** `GET /api/v1/audio/:id/stream-url` presigned streaming URL
- **6-E (Backend):** docker-compose + `.env.example` + `docs/guides/local-setup.md`

---

## Key state in App component (as of Sprint 5 close)

```typescript
// Tracks
const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS)
const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)

// Auth / role
const [userRole, setUserRole] = useState<'owner' | 'collaborator' | 'viewer'>('owner')
const isViewer = userRole === 'viewer'

// Transport
const [playing, setPlaying] = useState(false)
const [isRecording, setIsRecording] = useState(false)
const [playheadBar, setPlayheadBar] = useState(0)
const [bpm, setBpm] = useState(128)

// Deep link highlights (auto-clear after 1500ms)
const [highlightBar, setHighlightBar] = useState<number | null>(null)
const [highlightTrackId, setHighlightTrackId] = useState<string | null>(null)
const [highlightClipId, setHighlightClipId] = useState<string | null>(null)

// WS
const [wsStatus, setWsStatus] = useState<'connected'|'reconnecting'|'failed'|'idle'>('idle')

// Comments
const [comments, setComments] = useState<SessionComment[]>(SEED_COMMENTS)
const [openThreadId, setOpenThreadId] = useState<string | null>(null)
const [chatOpen, setChatOpen] = useState(false)

// Toast
const [toastMessage, setToastMessage] = useState<string | null>(null)
```

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

FR-01/FR-02 (deferred from Sprint 4) will add: `MIN_ARRANGER_H=200`, `MIN_MIXER_H=120`, `MIN_FX_W=220`, `MAX_FX_W=480`, `SPLITTER_H=4`, `SPLITTER_W=4` and derive `barW = BAR_W * zoomX`. Not yet implemented.

---

## Screenshots

Visual archive per sprint: `screenshots/sprint-N-YYYY-MM-DD/`
Sprint 1 screenshots: https://github.com/lukesydow-lab/DAWin/tree/main/screenshots/sprint-1-2026-05-14
