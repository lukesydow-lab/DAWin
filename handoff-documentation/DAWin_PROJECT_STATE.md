# DAWin — Project State Snapshot

**Status: Current**
**Last updated:** 2026-05-28
**Sprint:** 9 — Planning
**Repo:** https://github.com/lukesydow-lab/DAWin
**Raw handoff:** https://raw.githubusercontent.com/lukesydow-lab/DAWin/main/handoff-documentation/DAWin_PROJECT_STATE.md

> **⚠️ Sprint status:** Sprint 1 CLOSED ✅ · Sprint 2 CLOSED ✅ · Sprint 3 CLOSED ✅ · Sprint 4 CLOSED ✅ · Sprint 5 CLOSED ✅ · Sprint 6 CLOSED ✅ · Sprint 7 CLOSED ✅ · Sprint 8 CLOSED ✅ · Sprint 9 is PLANNING (scope not yet defined).
> Do not treat any prior sprint items as open. Sprint 8 shipped: session lobby, real audio playback from R2 via `AudioBufferSourceNode`, application menu bar, `KeyboardShortcutsModal`, `AboutModal`, `API_BASE` env var, true stereo VU via `ChannelSplitterNode`.

---

## Current stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4
- **Backend:** Fastify at `server/` (TypeScript, tsc-clean). Routes: `GET /api/v1/sessions/:id`, `GET /api/v1/auth/me` (JWT-verified), `POST /api/v1/auth/login`, `POST /api/v1/auth/guest`, `POST/GET/DELETE /api/v1/sessions/:id/comments`, `PATCH .../resolve`, `PATCH .../reopen`, `POST .../replies`. WebSocket: transport sync, presence fan-out, track locking, comment fan-out.
- **Real-time:** WebSocket active server-side + frontend singleton client (`getWsClient()` in App.tsx). In-memory session store + DB-backed via PrismaStorageAdapter.
- **Auth:** JWT sign/verify via `jose` (HS256). `server/jwt.ts`. `GET /auth/me` verifies Bearer token. `POST /auth/login` + `/auth/guest` issue real JWTs.
- **Audio:** Web Audio API — single `_audioCtx` singleton, 7 procedural synthesis tracks (Sprint 8 target: real `AudioBuffer` playback from R2 per clip), full plugin chain per track.
- **File storage:** Cloudflare R2 bucket `dawin-audio-dev`. Audio files uploaded via `POST /api/v1/sessions/:sessionId/audio`. Server-generated peaks (200 RMS Float32) persisted in `AudioFile.peaks` JSONB.
- **All frontend code:** `src/App.tsx` (single file). No split until Tech Lead approves.

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
| `WaveformPlaceholder` | Renders shimmer/empty state when clip has no peaks yet | ✅ Sprint 7 |
| `PeakGenerator` | Client-side `OfflineAudioContext` peak extraction — preview-only while upload is in flight | ✅ Sprint 7 |
| `SessionLobby` | Full-screen create/join/recent-sessions screen; renders when `sessionId` is null | ✅ Sprint 8 |
| `MenuBar` | 24px app menu bar — File/Edit/Session/View/Transport/Help dropdowns; stub items dimmed | ✅ Sprint 8 |
| `KeyboardShortcutsModal` | `?` key + Help menu; all shortcuts grouped by category | ✅ Sprint 8 |
| `AboutModal` | Sprint 8, v0.8.0-beta | ✅ Sprint 8 |

---

## Audio graph (per track)

```
OscillatorNode / AudioBufferSourceNode (from R2 for clips with audioFileId)
  → plugin chain (DynamicsCompressorNode → ConvolverNode → DelayNode+GainNode → BiquadFilterNode → Limiter)
  → GainNode (fader, logarithmic)
  → AnalyserNode (VU tap — post-fader, IEC 60268-17)
  → StereoPannerNode
      ├─► ChannelSplitterNode → analyserL (ch 0), analyserR (ch 1)  ← true stereo VU (Sprint 8)
  → _masterGain
  → _masterPanner (StereoPannerNode)
  → _masterAnalyser
  → AudioContext.destination
```

`rewirePluginChain` reconciler manages node lifecycle. Bypass removes/reinserts a node without rebuilding the full graph.

`AudioBuffer` cache: `Map<audioFileId, { buffer: AudioBuffer; fetchedAt: number }>` — 1hr TTL; URL re-fetched on expiry; buffer never re-decoded if cache hit.

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

## Sprint 6 — CLOSED ✅ (2026-05-19)

**Goal:** File Storage — Cloudflare R2 + first real Prisma migration.

What shipped: PostgreSQL live, PrismaStorageAdapter active, `POST /api/v1/sessions/:id/audio` R2 upload endpoint, `GET /api/v1/audio/:id/stream-url` presigned streaming URL (1-hour TTL), role enforcement (viewer 403 on upload), docker-compose.yml, `.env.example` with R2 vars, `docs/guides/local-setup.md` runbook.

## Sprint 7 — CLOSED ✅ (2026-05-19)

**Goal:** Audio File Import — drag-and-drop to timeline, `POST /api/v1/sessions/:sessionId/clips` endpoint, server-side peak generation, waveform rendering from server peaks.

**UAT:** CONDITIONAL PASS — zero P0/P1 defects; 4 P2/P3 defects found and fixed before close.

What shipped:
- Audio file drag-and-drop + file picker (`I` key) onto arranger timeline
- `POST /api/v1/sessions/:sessionId/clips` — creates Clip row linked to AudioFile
- Server-side peak generation (200 RMS values) during upload; `AudioFile.peaks` JSONB persisted
- Upload response includes `peaks`; WS `audio.uploaded` event fans out peaks to all collaborators
- Session snapshot includes `audioFileId` and `peaks` per clip — waveforms restore on session reopen
- All clip import states: uploading, decoding, complete, failed-upload (danger tint), failed-decode (warn tint)
- `WaveformPlaceholder` for null/empty peaks; `PeakGenerator` client-side preview path
- `ClipData.importStatus` field; live BPM for clip duration calculation
- ADR-006: server-side peak generation

**Mid-sprint architecture decision:** Server generates peaks during upload (not client-only). See ADR-006.

## Sprint 8 — CLOSED ✅ (2026-05-28)

**Goal:** Playable Beta — session lobby, real audio playback from R2, application menu bar.

**UAT:** PASS — zero P0/P1 defects.

What shipped:
- `SessionLobby` component — full-screen create/join/recent-sessions; `localStorage` recent sessions (max 3); inline error on invalid session ID
- Real audio playback — `AudioBufferSourceNode` from R2 presigned URLs; decoded `AudioBuffer` in-memory cache with 1hr TTL; clip loading indicator; procedural synthesis preserved for non-imported tracks
- `MenuBar` component — 24px `C.elevated` bar; File/Edit/Session/View/Transport/Help; all non-stub items wired; stub items dimmed
- `KeyboardShortcutsModal` — `?` key + Help menu; grouped by category
- `AboutModal` — Sprint 8, v0.8.0-beta
- `API_BASE` constant at module scope — reads `VITE_API_URL` env var; hardcoded `localhost:3000` removed from all call sites
- True stereo VU — `ChannelSplitterNode` added after `StereoPannerNode`; independent L/R `AnalyserNode`s
- WS handler registered reactively on session entry via `useEffect([sessionId, handleWsMessage])`
- Space key guard in global `onKeyDown` prevents double-fire when menu item has focus

## Sprint 9 — PLANNING

**Goal:** TBD — PM to define scope.

Sprint 9 scope has not been set. Candidates:
- In-browser audio recording (`getUserMedia` → R2)
- Plugin parameter editing UI
- Resizable panels (FR-01) — spec at `docs/specs/resizable-workspace-panels.md`
- Timeline zoom (FR-02) — spec at `docs/specs/arranger-zoom.md`

---

## Key state in App component (as of Sprint 8 close)

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
