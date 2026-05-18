# DAWin — Current Project Context

**Status: Current**
**Last updated:** 2026-05-18
**Maintained by:** Tech Lead
**Read this file first.** It is the single entry point for outside collaborators and new agents.

---

## Current Sprint

**Sprint 6 — File Storage**
**Status:** Planning (not yet started)
**Work order:** `docs/handoffs/sprint6-backend-workorder.md`
**Owner:** Backend Engineer

Sprint 6 goal: connect the persistence layer built in Sprint 5 to real infrastructure. Run the first Prisma migration against PostgreSQL, activate `PrismaStorageAdapter`, and integrate Cloudflare R2 for audio file upload and streaming.

---

## Recently Completed Sprint

**Sprint 5 — Persistence Layer Live**
**Closed:** 2026-05-18
**UAT:** PASS — zero P0/P1 defects

What shipped in Sprint 5:
- ADR-004: PostgreSQL + Prisma schema (`server/prisma/schema.prisma`)
- ADR-005: Session hydration strategy on WS join
- `StorageAdapter` interface (`server/storage/adapter.ts`) — the only contract route handlers depend on
- `InMemoryStorageAdapter` (dev/test fallback when `DATABASE_URL` is not set)
- `PrismaStorageAdapter` (full Prisma implementation — activated in Sprint 6)
- `docker-compose.yml` with postgres:15-alpine
- Session hydration on WS join (`session.snapshot` includes `session`, `tracks`, `clips` from DB)
- JWT role decoded on WS connect — hardcoded `dev-user-001` / `role: 'owner'` removed
- REST sessions wired to `StorageAdapter` (POST/GET round-trip through Prisma)
- Live presence cursors driven by JWT-verified WS events
- VU stereo SplitterNode calibration + 0 VU tick mark
- Loop region overlay + inline clip Rename context menu items

---

## What a User Can Do Today

The following is fully interactive in the running prototype (`npm run dev`):

**Session room:**
- 7-track arranger: clip drag/resize/cut, bezier fade curves with draggable midpoints, crossfade symmetry lock
- Playhead seek (click ruler), spacebar play/pause, stop (hold position), return-to-zero
- Right-click clip context menu: Delete, Duplicate, Bounce-to-clip, Loop region, Rename
- BPM input with 40–300 validation

**Mixer:**
- Neve-inspired mixer with logarithmic faders, pan knobs with center detent, mute/solo
- VU meters: true stereo (L/R via SplitterNode), post-fader, 60fps rAF, peak-hold, heartbeat startup
- Plugin chain per track: DynamicsCompressor, Reverb, Delay, EQ, Limiter — bypass without graph rebuild
- Master panner (StereoPannerNode)

**Collaboration:**
- JWT auth: `POST /auth/login`, `POST /auth/guest`, `GET /auth/me`
- Track locking: `track.arm/disarm` via WebSocket; server enforces one lock per track
- Role enforcement: Viewer cannot arm, mute, or solo; tooltips explain restriction
- WebSocket: transport sync, presence fan-out, session snapshot on join

**Comments + deep links:**
- Inline comment anchor pins on ruler (SVG chevrons, author-colored, count badges)
- Track header comment pins
- ThreadPopover: body, replies, resolve/reopen, reply input
- Session chat panel (flat list, compose input, unread badge)
- Deep links: `?t=&track=&clip=&range=` URL format; playhead seek + highlight on navigate (1500ms auto-clear)

**What is NOT yet implemented:**
- Resizable panels (FR-01) — deferred from Sprint 4
- Timeline zoom (FR-02) — deferred from Sprint 4
- Plugin parameter editing — no spec finalized
- Audio file upload/playback — Sprint 6–7 targets
- Mobile capture screen — not started

---

## Current Technical State

**Frontend:** React 18 + Vite + TypeScript strict mode + Tailwind CSS v4. Single file: `src/App.tsx` (~4,476 lines). All components in one file by design until a second screen is scaffolded.

**Backend:** Fastify + `@fastify/websocket` at `server/`. TypeScript, tsc-clean. `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes.

**Persistence:** `StorageAdapter` interface wired. Server boots with `InMemoryStorageAdapter` when `DATABASE_URL` is unset (dev default). `PrismaStorageAdapter` built but not yet activated — that is Sprint 6-A.

**Auth:** JWT via `jose` (HS256). `server/jwt.ts`. 8h user / 72h guest tokens.

**Database schema:** `server/prisma/schema.prisma` — canonical. Tables: `Session`, `Track`, `Clip`, `PluginInstance`, `Comment`, `CommentReply`, `AudioFile`, `SessionMember`.

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

---

## Active Blockers

| Blocker | Who is blocked | What resolves it |
|---|---|---|
| Server still boots with `InMemoryStorageAdapter` | Sprint 6 all features | 6-A: first Prisma migration + adapter switch |
| R2 env vars not documented | Sprint 6 6-C/6-D | 6-E: `.env.example` + local setup guide |

No P0/P1 defects are currently open.

---

## Open Product Decisions

| Decision | Blocks |
|---|---|
| Plugin parameter editing UX (expanding card vs. side panel vs. popover) | Feature spec + sprint scheduling |
| Resizable panels + timeline zoom sprint scheduling (FR-01, FR-02 deferred from Sprint 4) | Frontend can't start until PM schedules |
| Desktop framework choice (Electron vs. Tauri vs. native) | Desktop app Sprint 1 |
| Mobile framework choice | Mobile Sprint 1 |

---

## Next Sprint Priorities (Sprint 6)

All Sprint 6 work is Backend Engineer work:

1. **6-A** — First Prisma migration (`prisma migrate dev --name init`) + switch `server/index.ts` to `PrismaStorageAdapter`
2. **6-B** — Complete all `StorageAdapter` method implementations in `PrismaStorageAdapter`
3. **6-C** — Cloudflare R2: `POST /api/v1/sessions/:id/audio` multipart upload endpoint
4. **6-D** — `GET /api/v1/audio/:id/stream-url` presigned streaming URL
5. **6-E** — docker-compose wiring, `.env.example` R2 vars, `docs/guides/local-setup.md`

---

## Source-of-Truth Documents

Read in this order:

| # | Document | What it answers |
|---|---|---|
| 1 | **This file** (`handoff-documentation/DAWin_CURRENT_CONTEXT.md`) | Where are we right now? |
| 2 | `STATUS.md` | What is actively in progress? What is blocked? |
| 3 | `handoff-documentation/DAWin_HANDOFF.md` | Full product + technical context for the whole system |
| 4 | `handoff-documentation/DAWin_PROJECT_STATE.md` | Component map, audio graph, App state, sprint history |
| 5 | `docs/specs/ROADMAP.md` | Sprint-by-sprint roadmap (note: Sprints 4–5 not yet reflected — see STATUS.md Done tables) |
| 6 | `docs/specs/PRD.md` | Full product requirements |
| 7 | `docs/adr/` | Architecture decisions (ADR-001 through ADR-005) |
| 8 | `docs/specs/<feature>.md` | Feature implementation specs |
| 9 | `docs/handoffs/<feature>.md` | Agent work handoffs and work orders |
| 10 | `docs/defects.md` | UAT defect history |

**Sprint close protocol:** `docs/process/sprint-close-protocol.md`

---

## Documents That Are Historical / May Be Stale

These documents contain accurate historical information but should NOT be treated as current state:

- `docs/specs/ROADMAP.md` — Sprint 2 is incorrectly labeled "Active"; Sprint 3 original plan was superseded by the actual Sprint 3 scope. Use STATUS.md Done tables for authoritative sprint history.
- Sprint goal sections at the bottom of `STATUS.md` for Sprints 3, 4, and 5 — marked HISTORICAL ARCHIVE; do not treat as active scope.
- `docs/handoffs/` files from Sprints 1–5 — historical work records; not current instructions.
- `handoff-documentation/DAWin_HANDOFF.md` Section 10 "Sprint 4 targets" — some items listed were deferred, not abandoned; consult Sprint 6 active work for what is next.

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
- Every document has a `Status:` marker in its header. Only documents marked `Status: Current` should be treated as ground truth.
- When two documents conflict, the most recently dated document wins.
- If still unclear after checking dates, ask the PM (Luke) — do not guess or act on stale information.

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
- `docs/adr/` — ADR-001 through ADR-005
