# DAWin — Current Project Context

**Status: Current**
**Last updated:** 2026-05-19
**Maintained by:** Tech Lead
**Read this file first.** It is the single entry point for outside collaborators and new agents.

---

## Current Sprint

**Sprint 8 — TBD**
**Status:** Planning
**Sprint plan:** Not yet written — PM to define scope

Sprint 7 is CLOSED. Sprint 8 scope has not been defined. The PM will assign the next sprint goal.

---

## Recently Completed Sprint

**Sprint 7 — Audio to Timeline**
**Closed:** 2026-05-19
**UAT:** CONDITIONAL PASS — zero P0/P1 defects; 4 P2/P3 defects found and fixed before close

What shipped in Sprint 7:
- Audio file drag-and-drop + file picker (`I` key) onto arranger timeline
- `POST /api/v1/sessions/:sessionId/clips` — creates Clip row linked to AudioFile
- Server-side peak generation (200 RMS values) in upload handler; `AudioFile.peaks` JSONB persisted
- Upload response includes `peaks`; WS `audio.uploaded` event fans out peaks to all collaborators
- Session snapshot includes `audioFileId` and `peaks` per clip — waveforms restore on session reopen
- All clip import states render correctly: uploading, decoding, complete, failed-upload (danger tint), failed-decode (warn tint)
- `WaveformPlaceholder` for null/empty peaks
- `PeakGenerator` abstraction (client-side preview-only path — runs while upload is in flight)
- `ClipData.importStatus` field added and typed
- Live BPM used for clip duration calculation (was hardcoded 128)
- ADR-006: `docs/adr/ADR-006-server-side-peak-generation.md` — server-authoritative peak generation

### Mid-Sprint Architectural Decision — Peak Generation (2026-05-19)

A mid-sprint decision shifted peak generation from client-only to server-authoritative. The PM raised: *"Is it quicker to render peaks from the compressed version? And if we delivered those streaming-quality peaks to all devices while the full-quality peaks render on the host's computer, would it feel more seamless? Should we cache those streaming quality peak files on the server?"*

Tech analysis confirmed: for a 200-sample overview, compressed and lossless peaks are visually identical; the server already has the file in R2; storing 800 bytes of JSONB per clip is negligible. Decision: server generates peaks during upload, returns them in the response, fans them out via WS to all collaborators, and persists them in `AudioFile.peaks`. The client-side `PeakGenerator` is retained as a local preview path only (renders while upload is in flight; replaced by server peaks on upload complete).

ADR-006: `docs/adr/ADR-006-server-side-peak-generation.md` (Tech Lead)

---

## Previously Completed Sprint

**Sprint 6 — File Storage + Audio Upload**
**Closed:** 2026-05-19
**UAT:** Not formally run — all exit criteria verified manually

What shipped in Sprint 6:
- First Prisma migration run — all database tables created from `server/prisma/schema.prisma`
- Server now boots with `PrismaStorageAdapter (PostgreSQL)` — data persists across restarts
- `POST /api/v1/sessions/:sessionId/audio` — multipart audio upload to Cloudflare R2; metadata extracted via `music-metadata`; `AudioFile` DB row created
- `GET /api/v1/audio/:audioFileId/stream-url` — presigned R2 URL (1hr TTL); session membership enforced
- `docs/guides/local-setup.md` — first-time dev setup runbook
- Infrastructure live: Docker PostgreSQL + Cloudflare R2 bucket `dawin-audio-dev` connected
- `tsx` replaces `ts-node`; `.env` added to `.gitignore`

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
- Resizable panels (FR-01) — deferred from Sprint 4; spec at `docs/specs/resizable-workspace-panels.md`
- Timeline zoom (FR-02) — deferred from Sprint 4; spec at `docs/specs/arranger-zoom.md`
- Plugin parameter editing — no spec finalized; PM decision required on UX pattern
- Audio playback from uploaded files — clips play via procedural synthesis; real `AudioBuffer` playback from R2 not yet wired
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

---

## Active Blockers

No blockers. No P0/P1 defects are currently open. Sprint 8 scope not yet defined.

---

## Open Product Decisions

| Decision | Blocks |
|---|---|
| Sprint 8 scope — what is the next sprint goal? | All Sprint 8 work |
| Plugin parameter editing UX (expanding card vs. side panel vs. popover) | Feature spec + sprint scheduling |
| Resizable panels + timeline zoom sprint scheduling (FR-01, FR-02 deferred from Sprint 4) | Frontend can't start until PM schedules |
| Desktop framework choice (Electron vs. Tauri vs. native) | Desktop app Sprint 1 |
| Mobile framework choice | Mobile Sprint 1 |
| Audio playback from real `AudioBuffer` (R2 presigned URL → Web Audio API) | First time clips are heard, not just seen |

---

## Next Sprint Priorities (Sprint 8 — Planning)

Sprint 8 scope is not yet defined. PM will define the next sprint goal. Candidates (not committed):

1. **Audio playback from uploaded files** — wire `AudioBuffer` from R2 presigned URL into the Web Audio graph per clip (replaces procedural synthesis for imported clips)
2. **Resizable panels (FR-01)** — deferred from Sprint 4; spec exists at `docs/specs/resizable-workspace-panels.md`
3. **Timeline zoom (FR-02)** — deferred from Sprint 4; spec exists at `docs/specs/arranger-zoom.md`
4. **Plugin parameter editing** — PM decision on UX pattern required before spec can be written

PM must define scope before any Sprint 8 work order is issued.

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

**Sprint plans:** `docs/sprints/sprint-NN.md` — one file per sprint, named `sprint-01.md` through `sprint-07.md`
**Active work orders:** `docs/handoffs/active/` — work orders for sprints currently in progress
**Sprint close protocol:** `docs/process/sprint-close-protocol.md`

---

## Documents That Are Historical / May Be Stale

These documents contain accurate historical information but should NOT be treated as current state:

- `docs/handoffs/archive/` — completed handoff records from Sprints 1–5; historical work records only, not current instructions
- `docs/handoffs/active/sprint-06-backend-workorder.md` — Sprint 6 work order; sprint is closed, this is a historical reference
- `docs/handoffs/` Sprint 7 handoff files — Sprint 7 is now closed; these are historical work records
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
