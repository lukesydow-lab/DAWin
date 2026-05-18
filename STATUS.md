# Project DAWin — Status Board

**Status: Current**
**Last updated:** 2026-05-18

> **Last updated:** 2026-05-18 — Sprint 1 CLOSED ✅ · Sprint 2 CLOSED ✅ · Sprint 3 CLOSED ✅ · Sprint 4 CLOSED ✅ · Sprint 5 CLOSED ✅ · **Sprint 6 PLANNING**
> **Sprint:** 6 — Planning  
> **Owner:** Luke (PM)

> **⚠️ Agent instruction — keep this file current:**  
> Update the Active Work table when you pick up a task and when you submit a handoff.  
> Update the Done table the moment Tech Lead approves your work — do not batch updates.  
> Update the Blocked table whenever a blocker is added or resolved.  
> Never leave a completed task in Active Work. Never leave a resolved blocker in Blocked.  
> See `CLAUDE.md` § STATUS.md update rules for the full protocol.

---

## Sprint 6 Active Work

| ID | Agent | Title | Priority | Status |
|----|-------|-------|----------|--------|
| 6-A | Backend Engineer | First Prisma migration + switch to PrismaStorageAdapter | P0 | Not started |
| 6-B | Backend Engineer | Complete PrismaStorageAdapter (all StorageAdapter methods) | P0 | Not started |
| 6-C | Backend Engineer | Cloudflare R2 integration — audio upload endpoint | P0 | Not started |
| 6-D | Backend Engineer | Presigned streaming URL endpoint | P0 | Not started |
| 6-E | Backend Engineer | docker-compose + .env.example + local setup guide | P1 | Not started |

## Sprint 6 Blocked

| ID | Agent | Blocker | Who can unblock |
|----|-------|---------|-----------------|
| — | — | — | — |

## Review Queue (waiting on Tech Lead)

| Agent | Task | Files changed | Submitted |
|-------|------|---------------|-----------|
| — | — | — | — |

## Done ✓ — Sprint 5 (closed 2026-05-18)

| Task | Completed by | Date |
|------|--------------|------|
| 5-A: Session hydration on WS join — session.snapshot extended with DB-backed session metadata, tracks, clips | Backend Engineer | 2026-05-18 |
| 5-B: sessions.ts GET/POST wired to storage — POST /sessions creates DB row, GET /sessions/:id reads from DB | Backend Engineer | 2026-05-18 |
| 5-C: JWT role on WS connect — WS ticket decoded; userId, displayName, color, role from token; replaces hardcoded dev-user-001 | Backend Engineer | 2026-05-18 |
| 5-D: Frontend consumes session.snapshot tracks/clips — seed state eliminated for track/clip entities; hydrated from DB on join | Frontend Engineer | 2026-05-18 |
| 5-E: Presence verification with real user IDs — presence cursors driven by live WS events; userId verified from JWT | Backend Engineer | 2026-05-18 |
| 5-F: addReply race fix + InMemoryStorageAdapter.reset() — test isolation verified; no race condition on concurrent replies | Backend Engineer | 2026-05-18 |
| 5-G: Graceful shutdown (SIGTERM/SIGINT) — prisma.$disconnect() hook in server/index.ts | Backend Engineer | 2026-05-18 |
| 5-H: DB startup health check — clear error message and non-zero exit if DATABASE_URL set but DB unreachable | Backend Engineer | 2026-05-18 |
| 5-I: VU stereo meters + 0 VU tick mark — true stereo SplitterNode calibration, visual tick at unity gain | Frontend Engineer | 2026-05-18 |
| 5-J: Loop region + inline clip Rename — context menu completions wired and working | Frontend Engineer | 2026-05-18 |
| 5-K: Sprint 5 UAT — PASS, zero P0/P1 defects (6 P2/P3 found and fixed during UAT) | UAT | 2026-05-18 |
| Pre-work: ADR-004 (PostgreSQL schema), Prisma schema, StorageAdapter interface, PrismaStorageAdapter, InMemoryStorageAdapter, docker-compose.yml | Backend Engineer | 2026-05-18 |

## Done ✓ — Sprint 2 (closed 2026-05-15)

| Task | Completed by | Date |
|------|--------------|------|
| 4 spec items resolved in `docs/specs/multitrack-backend-api.md` | Backend | 2026-05-14 |
| Fastify scaffold: server/index.ts, routes/sessions.ts, routes/auth.ts, ws/handler.ts, store.ts, types.ts — tsc-clean | Backend | 2026-05-14 |
| WebSocket message routing: session.join/leave, transport.play/pause/stop/seek/bpm_change, presence.update fan-out, session.snapshot on connect | Backend | 2026-05-14 |
| Plugin chain audio graph: DynamicsCompressorNode, ConvolverNode (procedural IR), DelayNode + feedback GainNode, BiquadFilterNode, Limiter; rewirePluginChain reconciler; _pluginNodeMap; bypass without graph rebuild; Kick seeded with compressor | Frontend | 2026-05-14 |
| _masterPanner StereoPannerNode inserted (masterGain → masterPanner → masterAnalyser → destination); masterPan default fixed 0→50; mapping (masterPan-50)/50 | Frontend | 2026-05-14 |
| StudioFader: role=slider, track-scoped aria-label, ArrowUp/Down ±1, Shift+Arrow ±10 | Frontend | 2026-05-14 |
| FX badge click opens PluginChainPanel for selected track | Frontend | 2026-05-14 |
| PanKnob center detent: ±4 unit dead zone snaps to 0 during drag; 2px notch indicator at center | Frontend | 2026-05-14 |
| CI tightened: --noUnusedLocals --noUnusedParameters enforced at typecheck step | Tech Lead | 2026-05-14 |
| 3 unused variable TS errors fixed (rawY, _instrId, showInvite) — CI green | Frontend | 2026-05-14 |
| **#20** Track locking + JWT role enforcement: JWT sign/verify (`server/jwt.ts`), GET /auth/me token verification, POST /auth/login + /auth/guest, track lock state in session store, `track.arm`/`track.disarm`/`track.locked`/`track.unlocked`/`track.arm_rejected` WS handlers, lock release on disconnect; Frontend: `userRole` from /auth/me, `isViewer` prop-threaded to TrackHeader, viewer tooltip text on R/M/S | Backend + Frontend | 2026-05-15 |
| Sprint 2 Final UAT — PASS, zero P0/P1 defects (1 deferred P1: WS ticket→role not yet wired; 2 P3 observations) | UAT | 2026-05-15 |

## Done ✓ — Sprint 5 Pre-work / Completed

| Task | Completed by | Date |
|------|--------------|------|
| ADR-004: PostgreSQL + Prisma schema design — cuid IDs, JSONB for plugin params/comment anchors, relational tables for plugin chain + replies, SessionMember junction, soft deletes, AudioFile model ready for recording pipeline | Tech Lead | 2026-05-17 |
| StorageAdapter interface (server/storage/adapter.ts) — SessionRow, TrackRow, ClipRow, AudioFileRow, comment ops contract | Backend Engineer | 2026-05-18 |
| InMemoryStorageAdapter (server/storage/memory-adapter.ts) — in-memory Maps; delegates comment ops to store.ts; dev/test fallback when DATABASE_URL unset | Backend Engineer | 2026-05-18 |
| PrismaStorageAdapter (server/storage/prisma-adapter.ts) — full Prisma implementation; soft deletes on comments; $transaction on AudioFile; JsonValue → CommentAnchor narrowing | Backend Engineer | 2026-05-18 |
| docker-compose.yml — postgres:15-alpine, port 5432, named volume postgres_data | Backend Engineer | 2026-05-18 |
| .env.example — DATABASE_URL + JWT_SECRET placeholders | Backend Engineer | 2026-05-18 |
| server/index.ts — StorageAdapter DI; Prisma adapter when DATABASE_URL set, InMemory otherwise; fastify.storage decoration + module augmentation | Backend Engineer | 2026-05-18 |
| server/routes/comments.ts — all 6 comment endpoints ported to fastify.storage; addComment signature updated to Omit<SessionComment, 'id'\|'createdAt'\|'replies'>; ID/timestamp assigned inside adapter | Backend Engineer | 2026-05-18 |
| ADR-005: Session hydration strategy on WS join — defines persistent vs. ephemeral split, snapshot payload extension, WS close 4404 on unknown session | Tech Lead | 2026-05-18 |

## Done ✓ — Sprint 3 (closed 2026-05-15)

| Task | Completed by | Date |
|------|--------------|------|
| ADR-003: Unified CommentAnchor model — anchor types, bar-based storage, WS event schema, deep link URL format | Tech Lead | 2026-05-15 |
| Designer comment UI spec — ruler pins, thread popover, chat panel, unread indicators | Designer | 2026-05-15 |
| Backend comments API: POST/GET/DELETE /sessions/:id/comments, PATCH .../resolve, PATCH .../reopen, POST .../replies; WS fan-out comment.add/reply/resolve/reopen | Backend | 2026-05-15 |
| WS client singleton (`getWsClient()`): exponential backoff reconnect, session.join on open, sendWsMessage helper, wsStatus → StatusBar dot | Frontend | 2026-05-15 |
| Deep links: copyDeepLink(), ?t=&track=&clip= URL parsing on mount, playhead seek + highlight states (1500ms auto-clear), chain-link icon in TransportBar, right-click on track header | Frontend | 2026-05-15 |
| Comment UI: ruler anchor pins (SVG chevrons, author-colored, count badges, timeRange bars), track header pins, ThreadPopover (body/replies/resolve/reply/click-outside), chat panel + unread badge on icon rail, WS-driven state updates | Frontend | 2026-05-15 |
| Sprint 3 UAT — PASS, zero P0/P1 defects (2 P1s found and fixed during UAT; 0 remaining) | UAT | 2026-05-15 |

## Done ✓ — Sprint 1 (closed 2026-05-14)

| Task | Completed by | Date |
|------|--------------|------|
| Session room UI (arranger + mixer) | Frontend | 2026-05-10 |
| Clip editing (resize, bezier-fade, cut, drag, bounce) | Frontend | 2026-05-10 |
| Playhead animation + seek | Frontend | 2026-05-10 |
| Neve studio theme (knobs, faders, VU, wood) | Frontend | 2026-05-10 |
| Sprint 1 UAT defect triage — 19 defects prioritized | Tech Lead | 2026-05-10 |
| WP-1 defect pass — 16/19 defects fixed | Frontend | 2026-05-10 |
| Backend shared types + API spec + ADR-001 | Backend | 2026-05-10 |
| Audio waveform rendering + procedural synth (7 tracks) | Frontend | 2026-05-10 |
| WP-4 Tech Lead review pass — 6 fixes | Frontend | 2026-05-10 |
| WP-5 ARIA pass | Frontend + Designer | 2026-05-10 |
| WP-6 FX chain view, interactive PanKnob, R/M/S, empty state | Frontend + Designer | 2026-05-10 |
| WP-7 PluginChainPanel 720px overlay with slide animation | Frontend | 2026-05-10 |
| UAT WP-8 bug fixes (formatDb, mute opacity, cold-load waveform) | Frontend | 2026-05-11 |
| Figma DSM completeness pass (Clip, Toolbar, StatusBar, MixerPanel, FXChainPanel, atoms) | Designer | 2026-05-11 |
| VU meters — live post-fader RMS, 60fps rAF, peak-hold, transient glow | Frontend | 2026-05-14 |
| VU heartbeat startup — bloom + staggered motorized recall on mount | Frontend | 2026-05-14 |
| Bezier fade curves — draggable midpoint handle, crossfade symmetry lock | Frontend | 2026-05-14 |
| Plugin rack browser — wood cabinet, metal faceplates, power LED, drag-to-reorder, PluginBrowser popover | Frontend | 2026-05-14 |
| FX chain panel viewport positioning fix (overflow:clip #root BFC bug) | Frontend | 2026-05-14 |
| PRD v1.0 + Roadmap | PM | 2026-05-14 |
| GitHub sprint infrastructure (milestones, labels, issue templates, Projects board) | PM | 2026-05-14 |
| Sprint 1 screenshot archive | UAT | 2026-05-14 |

## Blocked

| Agent | Blocker | Who can unblock |
|-------|---------|-----------------|
| — | No current blockers | — |

---

## Sprint 3 Goals — Session Communication + Deep Links (FR-06 + FR-07) — HISTORICAL ARCHIVE

> Sprint 3 CLOSED 2026-05-15. This section is historical record only. Do not treat any item here as active scope.

**Reprioritized 2026-05-15.** Panels + zoom (FR-01, FR-02) deferred to Sprint 4.

1. **Anchor model ADR** (3-A) — unified `CommentAnchor` type shared by FR-06 and FR-07; storage, WS schema, deep link URL format
2. **Comment UI spec** (3-B) — pin visual design, thread popover, chat/sidebar panel, unread indicators
3. **WebSocket client + deep links** (3-C) — wire frontend WS client to Fastify server; `?t=&track=&clip=` URL routing; "Copy Link" actions; highlight-on-navigate
4. **Comments REST API + WS fan-out** (3-D) — `POST/GET/DELETE /sessions/:id/comments`; `comment.add`/`comment.resolve`/`comment.reply` WS events
5. **Comment UI implementation** (3-E) — timeline pins, thread popover, session chat, mentions, unread state
6. **Sprint 3 UAT** (3-F)

## Sprint 3 Exit Criteria — ALL CLOSED ✅

- [x] WebSocket client connected: transport sync and presence flow live between browser tabs
- [x] User can copy a deep link to a playhead moment, track, clip, or time range
- [x] Opening a deep link seeks the playhead and highlights the referenced object
- [x] User can post a session-level message in the chat panel
- [x] User can create an inline comment anchored to a timeline position, track, or clip
- [x] User can reply to a comment thread, resolve it, and reopen it
- [x] Unread comment indicators visible; clicking navigates to anchor
- [x] Comments fan out to all connected clients via WebSocket in real time
- [x] Viewer role cannot create or resolve comments (role enforcement)
- [x] `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes after all tickets
- [x] Tech Lead anchor model ADR committed to `docs/adr/`
- [x] Sprint 3 UAT signed off with zero P0/P1 defects (2026-05-15)

## Sprint 4 Goals — Core Editing Ergonomics (FR-01 + FR-02) — HISTORICAL ARCHIVE

> Sprint 4 CLOSED 2026-05-18. FR-01 and FR-02 were deferred to a future sprint. Do not treat any item here as active scope.

Deferred from Sprint 3.

1. **Resizable workspace panels** (FR-01, Ticket 4-A) — arranger/mixer + FX panel splitters; spec at `docs/specs/resizable-workspace-panels.md`
2. **Horizontal timeline zoom** (FR-02, Ticket 4-B) — `zoomX` state, all arranger math zoom-aware; spec at `docs/specs/arranger-zoom.md`
3. **Per-track vertical zoom** (FR-02, Ticket 4-C) — `trackZoomY` per-track record
4. **Architecture ADR** (Tech Lead) — panel persistence, zoom state scope, BAR_W abstraction
5. **Zoom interaction spec** (Designer) — fill §Interaction Model in `docs/specs/arranger-zoom.md`
6. **Documentation pass** (PM) — update `DAWin_HANDOFF.md`, `DAWin_PROJECT_STATE.md`, and `STATUS.md` to reflect Sprint 4 closed and Sprint 5 active

## Sprint 4 Exit Criteria

> **Standing rule (all sprints):** The documentation pass in step 6 is the final gate. No sprint is CLOSED until both handoff documents reflect the new sprint state.

- [ ] Arranger/mixer height splitter draggable; minimum heights enforced
- [ ] FX panel width splitter draggable; min/max width enforced
- [ ] Panel sizes persist to `localStorage`
- [ ] `zoomX` state drives all arranger bar calculations; zoom controls visible and wired
- [ ] Per-track vertical zoom adjusts individual track heights
- [ ] All 13 `BAR_W` call sites updated to `barW = BAR_W * zoomX`
- [ ] Comment pin positions correct at all zoom levels
- [ ] `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes
- [ ] Sprint 4 UAT signed off with zero P0/P1 defects
- [ ] **Documentation pass complete** — `DAWin_HANDOFF.md` + `DAWin_PROJECT_STATE.md` updated to Sprint 5

## Sprint 2 Exit Criteria — ALL CLOSED ✅

- [x] Fastify scaffold committed, tsc-clean, WebSocket transport routing active
- [x] Plugin enable/disable toggle audibly changes track sound
- [x] All interactivity gaps in mix-view.md table closed
- [x] Track locking enforced server-side; Viewer role enforced via JWT (#20)
- [x] Zero P0 or P1 defects at UAT sign-off (2026-05-15)

---

## Handoff Protocol

1. **FE / BE → Tech Lead:** Drop a file in `docs/handoffs/` describing what was built, files changed, and what to review.
2. **Tech Lead → PM:** Updates STATUS.md "Done" table on approval.
3. **UAT:** Runs after each work package. Defects logged to `docs/defects.md`.
4. **PM:** Closes GitHub issues and updates this file.

## Sprint 5 Goals — Persistence Layer Live — HISTORICAL ARCHIVE

> Sprint 5 CLOSED 2026-05-18. All exit criteria met. Do not treat any item here as active scope.

**Sprint 5 target (from ADR-004 + Sprint 5 pre-work):** PostgreSQL + Prisma replaces the in-memory store. The three-product suite shares one backend. Session data survives server restarts. WS role enforcement uses JWT. Foundation is in place for Sprint 8-9 recording pipeline.

1. **Session hydration on WS join** (5-A) — `session.snapshot` includes DB-backed session metadata, tracks, and clips
2. **sessions.ts REST wired to storage** (5-B) — POST /sessions creates a DB row; GET /sessions/:id reads from DB
3. **WS ticket → JWT role** (5-C) — decode JWT ticket on WS connect; replace hardcoded `role = 'owner'` and `userId = 'dev-user-001'`
4. **Frontend consumes hydrated snapshot** (5-D) — frontend reads tracks + clips from `session.snapshot` WS frame; eliminates hard-coded seed state for those entities
5. **Live presence cursors** (5-E) — replace seed-data presence cursors with real WS-driven events; depends on 5-C for verified userId
6. **InMemoryStorageAdapter reset()** (5-F) — test isolation before test suite is built
7. **Graceful shutdown** (5-G) — `prisma.$disconnect()` on SIGTERM/SIGINT
8. **DB startup health check** (5-H) — fail fast if DATABASE_URL is set but DB is unreachable
9. **VU calibration polish** (5-I) — 0 VU tick mark, true stereo SplitterNode
10. **Context menu completions** (5-J) — Loop region + Rename; or remove the stubs
11. **Sprint 5 UAT** (5-K)

## Sprint 5 Exit Criteria — ALL CLOSED ✅

- [x] POST /api/v1/sessions creates a row in the `sessions` DB table; the session survives a server restart
- [x] GET /api/v1/sessions/:id reads from DB and returns the correct session for any previously created session ID
- [x] A client connecting via WebSocket to an existing session receives `session.snapshot` with `session`, `tracks`, and `clips` fields populated from the database
- [x] A WebSocket connection to an unknown session ID is rejected with close code 4404
- [x] WS `session.snapshot` transport.bpm matches the value stored in the DB, not always the default 120
- [x] JWT ticket is decoded on WS connect; `userId`, `displayName`, `color`, and `role` come from the token — the hardcoded `dev-user-001` / `role: 'owner'` is removed
- [x] A viewer-role JWT cannot arm a track (track.arm_rejected returned with reason: 'forbidden'); role comes from the JWT, not a hardcode
- [x] Comment data persists across a server restart — comments posted before restart are returned by GET /sessions/:id/comments after restart
- [x] Server starts cleanly with DATABASE_URL unset (falls back to InMemoryStorageAdapter with no errors)
- [x] Server with DATABASE_URL set logs a clear error and exits non-zero at startup if the database is unreachable
- [x] `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes with zero errors after all tickets
- [x] Sprint 5 UAT signed off with zero P0/P1 defects

---

## Shared Directories

| Path | Purpose |
|------|---------|
| `docs/specs/` | Feature specs and API contracts |
| `docs/specs/PRD.md` | Full product requirements (v1.1) |
| `docs/specs/ROADMAP.md` | Sprint-by-sprint roadmap (v1.1) |
| `docs/adr/` | Architecture Decision Records (Tech Lead writes) |
| `docs/handoffs/` | Agent → Tech Lead review requests |
| `STATUS.md` | This file — single source of truth |
| `screenshots/` | Visual archive per sprint |
| `server/` | Fastify backend scaffold (TypeScript, tsc-clean) |
