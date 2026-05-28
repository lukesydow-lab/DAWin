# DAWin — Current Project Context

**Status: Current**
**Last updated:** 2026-05-28
**Maintained by:** Tech Lead
**Read this file first.** It is the single entry point for outside collaborators and new agents.

---

## Current Sprint

**Sprint 9 — TBD**
**Status:** Planning
**Sprint plan:** Not yet created — PM to define scope.

Sprint 8 is CLOSED. Sprint 9 scope is not yet defined. No work orders have been issued. PM must define the sprint goal before any agent begins work.

---

## Recently Completed Sprint

**Sprint 8 — Playable Beta**
**Closed:** 2026-05-28
**UAT:** PASS — zero P0/P1 defects; all 5 defects confirmed fixed before close

What shipped in Sprint 8:
- **Session lobby** — full-screen create/join/recent-sessions screen when no `?session=` URL param is present; `localStorage` recent sessions (max 3); inline error on invalid session ID
- **Real audio playback** — `AudioBufferSourceNode` from R2 presigned URLs; decoded `AudioBuffer` cached in memory (1hr TTL awareness); clip loading indicator during fetch/decode; procedural synthesis preserved for non-imported tracks
- **Application menu bar** — 24px bar at top of app; File/Edit/Session/View/Transport/Help menus; stub items dimmed (`opacity: 0.4`, non-interactive); all non-stub items wired to existing handlers
- **`KeyboardShortcutsModal`** — opened by `?` key and Help menu; all Sprint 8 shortcuts grouped by category
- **`AboutModal`** — Sprint 8, v0.8.0-beta
- **`API_BASE` constant** — configurable via `VITE_API_URL` env var; removes hardcoded `localhost:3000`
- **True stereo VU metering** — `ChannelSplitterNode` after `StereoPannerNode`; independent L/R `AnalyserNode`s; fixes 5-I carried from Sprint 5
- WS handler correctly registered on lobby entry via reactive `useEffect([sessionId, handleWsMessage])` (SPRINT-8-001 fix)
- Space key guard prevents double-fire when focused on a menu item (SPRINT-8-002 fix)

---

## Previously Completed Sprint

**Sprint 7 — Audio to Timeline**
**Closed:** 2026-05-19
**UAT:** CONDITIONAL PASS — zero P0/P1 defects; 4 P2/P3 defects found and fixed before close

What shipped in Sprint 7:
- Audio file drag-and-drop + file picker (`I` key) onto arranger timeline
- `POST /api/v1/sessions/:sessionId/clips` — creates Clip row linked to AudioFile
- Server-side peak generation (200 RMS values) in upload handler; `AudioFile.peaks` JSONB persisted
- Upload response includes `peaks`; WS `audio.uploaded` event fans out peaks to all collaborators
- Session snapshot includes `audioFileId` and `peaks` per clip — waveforms restore on session reopen
- All clip import states: uploading, decoding, complete, failed-upload (danger tint), failed-decode (warn tint)
- `WaveformPlaceholder` for null/empty peaks; `PeakGenerator` abstraction (client-side preview-only)
- `ClipData.importStatus` field; live BPM for clip duration calculation
- ADR-006: `docs/adr/ADR-006-server-side-peak-generation.md`

---

## What a User Can Do Today

The following is fully interactive in the running prototype (`npm run dev`):

**Session entry:**
- Session lobby — create a new named session or join an existing session by ID
- Recent sessions (last 3) shown from `localStorage`; click to rejoin
- Inline error if session ID does not exist

**Session room:**
- 7-track arranger: clip drag/resize/cut, bezier fade curves with draggable midpoints, crossfade symmetry lock
- Playhead seek (click ruler), spacebar play/pause, stop (hold position), return-to-zero
- Right-click clip context menu: Delete, Duplicate, Bounce-to-clip, Loop region, Rename
- BPM input with 40–300 validation
- Real audio playback for imported clips (from R2 presigned URL via `AudioBufferSourceNode`)
- Procedural synthesis playback for non-imported tracks (no regression)

**Mixer:**
- Neve-inspired mixer with logarithmic faders, pan knobs with center detent, mute/solo
- VU meters: true stereo (L/R via `ChannelSplitterNode`), post-fader, 60fps rAF, peak-hold, heartbeat startup
- Plugin chain per track: DynamicsCompressor, Reverb, Delay, EQ, Limiter — bypass without graph rebuild
- Master panner (StereoPannerNode)

**Application menu bar:**
- File/Edit/Session/View/Transport/Help menus; all non-stub items wired to existing handlers
- Stub items dimmed and non-interactive
- Keyboard Shortcuts modal (`?` key or Help menu)
- About DAWin modal

**Collaboration:**
- JWT auth: `POST /auth/login`, `POST /auth/guest`, `GET /auth/me`
- Track locking: `track.arm/disarm` via WebSocket; server enforces one lock per track
- Role enforcement: Viewer cannot arm, mute, or solo; tooltips explain restriction
- WebSocket: transport sync, presence fan-out, session snapshot on join

**Comments + deep links:**
- Inline comment anchor pins on ruler (SVG chevrons, author-colored, count badges)
- Track header comment pins; ThreadPopover: body, replies, resolve/reopen, reply input
- Session chat panel (flat list, compose input, unread badge)
- Deep links: `?t=&track=&clip=&range=` URL format; playhead seek + highlight on navigate (1500ms auto-clear)

**What is NOT yet implemented:**
- In-browser audio recording (`getUserMedia`) — Sprint 9+ candidate
- Resizable panels (FR-01) — deferred from Sprint 4; spec at `docs/specs/resizable-workspace-panels.md`
- Timeline zoom (FR-02) — deferred from Sprint 4; spec at `docs/specs/arranger-zoom.md`
- Plugin parameter editing — no spec finalized; PM decision required on UX pattern
- Mobile capture screen — not started; desktop-first mandate

---

## Current Technical State

**Frontend:** React 18 + Vite + TypeScript strict mode + Tailwind CSS v4. Single file: `src/App.tsx`. All components in one file by design until a second screen is scaffolded.

**Backend:** Fastify + `@fastify/websocket` at `server/`. TypeScript, tsc-clean. `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes.

**Persistence:** `PrismaStorageAdapter` active when `DATABASE_URL` is set (Sprint 6+). `InMemoryStorageAdapter` fallback for dev/test. Prisma migration `20260520011302_add_audio_file_peaks` adds `peaks` column to `AudioFile`.

**Auth:** JWT via `jose` (HS256). `server/jwt.ts`. 8h user / 72h guest tokens.

**Database schema:** `server/prisma/schema.prisma` — canonical. Tables: `Session`, `Track`, `Clip`, `PluginInstance`, `Comment`, `CommentReply`, `AudioFile` (with `peaks DOUBLE PRECISION[]`), `SessionMember`.

**CI:** GitHub Actions — `tsc --noEmit --noUnusedLocals --noUnusedParameters` + Vite build.

---

## Major Features Shipped by Sprint

| Sprint | Closed | Major features |
|---|---|---|
| Sprint 1 | 2026-05-14 | 7-track arranger, Neve mixer, VU meters, plugin rack, collaborator color model, GitHub infrastructure |
| Sprint 2 | 2026-05-15 | Fastify scaffold, WebSocket transport sync, plugin chain audio graph, JWT auth, track locking, StudioFader ARIA |
| Sprint 3 | 2026-05-15 | Comments API + WS fan-out, WS client singleton, deep links, ruler pins, ThreadPopover, chat panel |
| Sprint 4 | 2026-05-18 | Closed — FR-01/FR-02 deferred; sprint used for Sprint 5 pre-work (ADR-004, Prisma schema, StorageAdapter) |
| Sprint 5 | 2026-05-18 | Full persistence layer, session hydration, JWT WS role, VU stereo, loop region, clip rename, Sprint 5 UAT pass |
| Sprint 6 | 2026-05-19 | Docker PostgreSQL live, Cloudflare R2 connected, audio upload + presigned streaming endpoints, local setup guide |
| Sprint 7 | 2026-05-19 | Audio file drag-and-drop + file picker, server-side peak generation, WS peak fan-out, all clip import states, snapshot peak hydration, ADR-006 |
| Sprint 8 | 2026-05-28 | Session lobby, real audio playback from R2 via `AudioBufferSourceNode`, application menu bar, `KeyboardShortcutsModal`, `AboutModal`, `API_BASE` env var, true stereo VU via `ChannelSplitterNode` |

---

## Active Blockers

No blockers. No P0/P1 defects are currently open. Sprint 9 scope not yet defined.

---

## Open Product Decisions

| Decision | Blocks |
|---|---|
| Sprint 9 scope — what is the next sprint goal? | All Sprint 9 work |
| Plugin parameter editing UX (expanding card vs. side panel vs. popover) | Feature spec + sprint scheduling |
| Resizable panels + timeline zoom sprint scheduling (FR-01, FR-02 deferred from Sprint 4) | Frontend can't start until PM schedules |
| Desktop framework choice (Electron vs. Tauri vs. native) | Desktop app Sprint 1 |
| Mobile framework choice | Mobile Sprint 1 |
| In-browser audio recording (`getUserMedia`) scope and UI | Sprint 9 candidate — PM to confirm |

---

## Source-of-Truth Documents

Read in this order:

| # | Document | What it answers |
|---|---|---|
| 1 | **This file** (`handoff-documentation/DAWin_CURRENT_CONTEXT.md`) | Where are we right now? |
| 2 | `STATUS.md` | What is actively in progress? What is blocked? |
| 3 | `handoff-documentation/DAWin_HANDOFF.md` | Full product + technical context for the whole system |
| 4 | `handoff-documentation/DAWin_PROJECT_STATE.md` | Component map, audio graph, App state, sprint history |
| 5 | `docs/sprints/README.md` | Index of all sprint plans — then read the specific sprint file you need |
| 6 | `docs/specs/ROADMAP.md` | Phase-level roadmap across all three products (web, desktop, mobile) |
| 7 | `docs/specs/PRD.md` | Full product requirements |
| 8 | `docs/adr/README.md` | Index of all architecture decisions |
| 9 | `docs/specs/README.md` | Index of all feature specs |
| 10 | `docs/handoffs/active/` | Active work orders for the current sprint |
| 11 | `docs/defects.md` | UAT defect history |

**Sprint plans:** `docs/sprints/sprint-NN.md` — one file per sprint, named `sprint-01.md` through `sprint-08.md`
**Active work orders:** `docs/handoffs/active/` — work orders for sprints currently in progress
**Sprint close protocol:** `docs/process/sprint-close-protocol.md`

---

## Documents That Are Historical / May Be Stale

These documents contain accurate historical information but should NOT be treated as current state:

- `docs/handoffs/archive/` — completed handoff records from Sprints 1–5; historical work records only, not current instructions
- `docs/handoffs/active/sprint-06-backend-workorder.md` — Sprint 6 work order; sprint is closed, this is a historical reference
- `docs/handoffs/` Sprint 7 and Sprint 8 handoff files — those sprints are now closed; these are historical work records
- `docs/specs/sprint6-plan.md` — superseded by `docs/sprints/sprint-06.md`; also contains a stale provider recommendation (Minio/S3 — the chosen provider is Cloudflare R2)
- `docs/features/SPRINT-PLAN.md` — superseded by `docs/sprints/`; covered Sprint 3 only and was never updated
- Sprint goal sections in `STATUS.md` marked HISTORICAL ARCHIVE — do not treat as active scope
- `handoff-documentation/DAWin_HANDOFF.md` Section 10 "Sprint 4 targets" — some items listed were deferred, not abandoned; consult Sprint 7 active work for what is next

---

## Process Reference

- **Sprint close protocol:** `docs/process/sprint-close-protocol.md`
- **Agent personas:** `.claude/agents/`
- **CI:** `.github/workflows/ci.yml`
- **Figma DSM:** `https://www.figma.com/design/o4IccZFYzEvsHe3dVcco7X/GDAW---Design-System-`

---

## Prompt For ChatGPT / Outside Collaborators

---

You are assisting with DAWin — a collaborative browser-based digital audio workstation (DAW) built by an AI agent team. Before asking any questions or making any suggestions, read the following documents in the order listed. The repo is at https://github.com/lukesydow-lab/DAWin. All repo files are authoritative — uploaded project files may be older snapshots.

**Reading order (start here, read all before responding):**

1. `handoff-documentation/DAWin_CURRENT_CONTEXT.md` — Read this first. It tells you the current sprint, what has shipped, what is in progress, and what is blocked.

2. `STATUS.md` — Read this second. It tells you what is actively being worked on right now, the Active Work table, and any current blockers.

3. `handoff-documentation/DAWin_HANDOFF.md` — Full product and technical context: architecture, feature status, open questions, ADR history, non-negotiable constraints, agent structure.

4. `handoff-documentation/DAWin_PROJECT_STATE.md` — Technical snapshot: component map, audio graph, App state schema, sprint history.

5. `docs/specs/ROADMAP.md` — Sprint roadmap (note the staleness warning at the top of this file).

6. `docs/specs/PRD.md` — Full product requirements.

**Source of truth rules:**

- Repo docs are authoritative. If you have uploaded project files that are older, the repo is correct.
- Every document has a `Status:` marker in its header. Only documents marked `Status: Current` should be treated as ground truth. A document with a newer modified date but `Status: Superseded` or `Status: Historical Archive` is NOT authoritative — recency alone does not grant authority.
- **When two documents conflict, resolve in this order:**
  1. The document higher in the source-of-truth hierarchy wins:
     `DAWin_CURRENT_CONTEXT.md` → `STATUS.md` → `DAWin_HANDOFF.md` → `DAWin_PROJECT_STATE.md` → `ROADMAP.md` → `PRD.md` → ADRs → feature specs.
  2. If both documents are at the same hierarchy tier, the document marked `Status: Current` with the newest in-document `Last updated` date wins.
  3. If the conflict is still unclear after applying steps 1 and 2, stop and report the conflict to Luke. Do not guess, merge, or synthesize a resolution.
- **Important:** Recency alone does not grant authority. A file with a newer Git modified date but `Status: Superseded`, `Status: Deprecated`, or `Status: Historical Archive` loses to a higher-tier current document.

**Documents to treat as historical background only (not current instructions):**

- Any `docs/handoffs/` file from Sprints 1–5 — these are historical work records.
- Sprint goal sections in `STATUS.md` marked "HISTORICAL ARCHIVE" — Sprints 3, 4, 5 goal sections are historical.
- `docs/specs/ROADMAP.md` sprint-by-sprint section for Sprints 1–3 — use `STATUS.md` Done tables for authoritative sprint history.

**How to verify a document is current:**

Look for `Status: Current` in the first three lines of the file. If it says `Status: Partial`, `Status: Superseded`, `Status: Deprecated`, or `Status: Historical Archive`, do not act on it as ground truth — read the current replacement document instead.

**How to report stale or conflicting documentation:**

If you find a document that claims an older sprint is active, claims a feature is "not yet implemented" when it has shipped, or contradicts another document, report it to the PM (Luke) with: (1) the file path, (2) the stale/conflicting line, and (3) what you believe the correct state is based on the most recent evidence. Do not silently act on stale information.

**Architecture constraints you must not violate:**

- All frontend components are in `src/App.tsx` (single file by design — do not suggest splitting without Tech Lead approval)
- No `any` in TypeScript; no external state library (no Redux, Zustand, Jotai) without PM approval
- Design tokens are in the `C` const in `src/App.tsx` — never hardcode hex values
- DAW conventions: spacebar = play/pause; stop preserves playhead; VU meters post-fader; log fader curve
- Do not suggest CSS modules, styled-components, or `@apply` — Tailwind v4 utility classes only
- Collaborator colors are applied via inline `style` props, not Tailwind classes

**Repo paths to inspect for technical ground truth:**

- `src/App.tsx` — all frontend components and state
- `server/storage/adapter.ts` — StorageAdapter interface (canonical backend contract)
- `server/prisma/schema.prisma` — canonical database schema
- `server/types.ts` — all shared domain types
- `server/index.ts` — how the server is wired together
- `docs/adr/` — ADR-001 through ADR-006
