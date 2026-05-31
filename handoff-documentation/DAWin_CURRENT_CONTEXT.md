# DAWin — Current Project Context

**Status: Current**
**Last updated:** 2026-05-31
**Maintained by:** Tech Lead
**Read this file first.** It is the single entry point for outside collaborators and new agents.

---

## Current Sprint

**Sprint 10 — Demo Hardening + Table-Stakes DAW Baseline**
**Status:** In Progress
**Sprint plan:** `docs/sprints/sprint-10.md`

Sprint 9 is CLOSED. Sprint 10 is in progress. Planning and QA work complete; P1 build errors fixed; Help Guide delivered. PM table-stakes decisions and ADR-009 (continuity bounce) are outstanding.

### Sprint 10 progress (as of 2026-05-31)

**Complete:**
- Socializable Demo QA runbook (`docs/specs/socializable-demo-qa.md`) — UAT run complete
- DAW table-stakes audit (`docs/research/daw-table-stakes-audit.md`)
- Formal backlog model (`docs/backlog/DAWin_BACKLOG.md`, `docs/backlog/feature-intake-template.md`)
- Owner Continuity Bounce spec (`docs/specs/owner-continuity-bounce.md`) — awaiting Tech Lead ADR-009
- In-browser recording spec (`docs/specs/in-browser-recording.md`) — awaiting PM approval
- **DAWin User Help Guide** (`docs/guides/dawin-user-guide.md`) — 548 lines, 18 sections, Sprint 9 baseline; ready for friend-testers
- **P1 build fixes** — all 8 TypeScript errors resolved; `npm run build` passes; `?demo=1` bypass working; `DEMO_PRESENCE` / `SEED_COMMENTS` wired to demo mode; `AboutModal` updated to Sprint 9

**In progress / outstanding:**
- ADR-009 (continuity bounce architecture) — not yet written
- Known Limitations panel — needs Designer spec (SPRINT-10-005 / SPRINT-10-007)
- PM decisions on table-stakes audit items — determines Sprint 11 scope
- Export Mix tier decision — outstanding

---

## Recently Completed Sprint

**Sprint 9 — Workspace Control**
**Closed:** 2026-05-29
**UAT:** PASS — zero P0/P1 defects; 2 defects found (SPRINT-9-001 P2, SPRINT-9-002 P3) and fixed before close

What shipped in Sprint 9:
- **FR-01 Resizable workspace panels** — arranger/mixer vertical splitter + FX panel horizontal splitter; pointer-event drag with `setPointerCapture`; double-click reset (200ms ease); keyboard navigation (Arrow ±8px, Home/End, Enter/Space); full ARIA (`role="separator"`, `aria-valuenow/min/max`); constants `MIN_ARRANGER_H=200`, `MIN_MIXER_H=120`, `MIN_FX_W=220`, `MAX_FX_W=480`
- **FR-02 Arranger timeline zoom** — `barW = BAR_W * zoomX` prop drilling throughout arranger; keyboard shortcuts `=`/`-`/`0`; Ctrl/Cmd+scroll wheel zoom; playhead-anchor (keyboard) and cursor-anchor (scroll wheel); zoom level `%` indicator in ruler; ruler tick density at zoom thresholds; per-track vertical zoom (`trackZoomY`) via chevron buttons `[0.5×, 3.0×]`; View menu Zoom In/Out/Reset now active
- **ADR-008** — Zoom state architecture (prop drilling decision for `barW`) formalized at `docs/adr/ADR-008-zoom-state-architecture.md`
- SPRINT-9-001 fix: Panel height calculations now subtract `MENU_BAR_H` (24px) — mixer no longer clipped
- SPRINT-9-002 fix: Zoom Out menu shortcut label corrected to hyphen-minus

---

## Previously Completed Sprint

**Sprint 8 — Playable Beta**
**Closed:** 2026-05-28
**UAT:** PASS — zero P0/P1 defects; all 5 defects confirmed fixed before close

What shipped in Sprint 8:
- **Session lobby** — full-screen create/join/recent-sessions screen when no `?session=` URL param is present; `localStorage` recent sessions (max 3); inline error on invalid session ID
- **Real audio playback** — `AudioBufferSourceNode` from R2 presigned URLs; decoded `AudioBuffer` cached in memory (1hr TTL awareness); clip loading indicator during fetch/decode; procedural synthesis preserved for non-imported tracks
- **Application menu bar** — 24px bar at top of app; File/Edit/Session/View/Transport/Help menus; stub items dimmed (`opacity: 0.4`, non-interactive); all non-stub items wired to existing handlers
- **`KeyboardShortcutsModal`** — opened by `?` key and Help menu; all Sprint 8 shortcuts grouped by category
- **`AboutModal`** — Sprint 8, v0.8.0-beta (updated to Sprint 9 in Sprint 10 P1 fix pass)
- **`API_BASE` constant** — configurable via `VITE_API_URL` env var; removes hardcoded `localhost:3000`
- **True stereo VU metering** — `ChannelSplitterNode` after `StereoPannerNode`; independent L/R `AnalyserNode`s; fixes 5-I carried from Sprint 5

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

**Workspace control (Sprint 9):**
- Resizable panels — drag arranger/mixer vertical splitter, drag FX panel horizontal splitter; double-click to reset; full keyboard navigation and ARIA
- Timeline zoom — `=`/`-`/`0` keyboard shortcuts; Ctrl/Cmd+scroll wheel; zoom `%` indicator in ruler; playhead/cursor-anchored zoom; ruler tick density scales with zoom
- Per-track vertical zoom — chevron buttons expand/contract individual track rows `[0.5×, 3.0×]`

**What is NOT yet implemented:**
- In-browser audio recording (`getUserMedia`) — Designer spec written (`docs/specs/in-browser-recording.md`); awaiting PM approval before FE work order issued
- Plugin parameter editing — no spec finalized; PM decision required on UX pattern
- localStorage persistence for panel sizes — explicitly deferred (requires ADR)
- Known Limitations panel — needs Designer spec; SPRINT-10-005 open
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
| Sprint 9 | 2026-05-29 | FR-01 resizable panels (arranger/mixer + FX panel splitters, full ARIA), FR-02 timeline zoom (`barW` prop drilling, keyboard/scroll shortcuts, zoom indicator, tick density, per-track vertical zoom), ADR-008 |
| Sprint 10 | In progress | Socializable Demo QA, table-stakes audit, backlog tier model, continuity bounce spec, in-browser recording spec, Help Guide, P1 build fixes (8 TS errors), demo mode wiring |

---

## Active Blockers

No P0 blockers. Two open defects:
- SPRINT-10-005 (P2): Known Limitations panel absent — needs Designer spec before implementation
- SPRINT-10-007 (P3): Process — no Designer spec on file for Known Limitations surface

---

## Open Product Decisions

| Decision | Blocks |
|---|---|
| PM decisions on table-stakes audit items | Sprint 11 scope |
| Known Limitations panel Designer spec | SPRINT-10-005 implementation |
| ADR-009 (continuity bounce architecture) | Owner Continuity Bounce implementation |
| In-browser recording PM approval | FE work order for recording feature |
| Export Mix tier decision | Sprint 11 prioritization |
| Plugin parameter editing UX (expanding card vs. side panel vs. popover) | Feature spec + sprint scheduling |
| Desktop framework choice (Electron vs. Tauri vs. native) | Desktop app Sprint 1 |
| Mobile framework choice | Mobile Sprint 1 |
| localStorage persistence for panel sizes — ADR needed before implementation | FR-01 follow-on work |

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

**Sprint plans:** `docs/sprints/sprint-NN.md` — one file per sprint, named `sprint-01.md` through `sprint-10.md`
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
