# DAWin — Sprint Plan

**Version:** 1.0
**Date:** 2026-05-15
**Author:** PM (Luke)
**Status:** Approved — Sprint 3 planning complete

---

## Sprint 3 — Core Editing Ergonomics

**Theme:** Make the arranger usable at professional density. Before collaborators can work together fluidly, each user needs full control over their workspace geometry. Panels must resize. The timeline must zoom. These are table-stakes DAW interactions.

**Duration:** 2 weeks (target)
**Depends on:** Sprint 2 #20 (track locking + JWT) — may run in parallel; Sprint 3 work does not touch the auth layer.

---

### Sprint 3 Goals

1. Engineers and musicians can resize the arranger and mixer panels to suit their workflow.
2. The timeline can be zoomed horizontally to sub-bar precision for fade and crossfade editing.
3. Individual tracks can be vertically expanded for detailed waveform inspection.
4. All arranger math (clip positions, fade handles, ruler, playhead, crossfade zones) remains correct at all zoom levels.
5. No regressions in the VU meter rAF loop, clip drag/resize, or the FX panel BFC fix.

---

### Sprint 3 Exit Criteria

- [ ] Arranger panel and mixer panel are resizable via a draggable splitter; double-click resets to defaults.
- [ ] Horizontal zoom from 0.25× to 4.0×; all clip math, ruler, playhead, and fade handles scale correctly.
- [ ] Per-track vertical zoom from 0.5× to 3.0×; mixer strip heights do not change.
- [ ] Zoom level indicator visible in arranger toolbar.
- [ ] Splitter meets ARIA `role="separator"` spec with `aria-valuenow/min/max`.
- [ ] `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes with zero errors after all tickets.
- [ ] Sprint 3 UAT (Ticket 3-F) signed off with zero P0 or P1 defects.
- [ ] Tech Lead ADR committed documenting zoom state architecture and panel persistence decision.
- [ ] Designer shortcut spec committed to `docs/specs/arranger-zoom.md` §Interaction Model.

---

### Sprint 3 Ticket Breakdown

| ID | Title | Owner | Complexity | Blocked by | Output |
|----|-------|-------|------------|------------|--------|
| 3-A | Zoom + Panel Architecture Decision | Tech Lead | Low | Nothing | ADR in `docs/adr/` |
| 3-B | Arranger Zoom Interaction Spec | Designer | Low | Nothing (parallel) | `docs/specs/arranger-zoom.md` §Interaction Model |
| 3-C | Resizable Workspace Panels (FR-01) | Frontend Engineer | Medium | 3-A (persistence decision only) | `src/App.tsx` — splitter components, panel size state |
| 3-D | Horizontal Timeline Zoom (FR-02) | Frontend Engineer | Medium-High | 3-A (architecture), 3-B (shortcuts) | `src/App.tsx` — zoomX state, barW derived value, all arranger math |
| 3-E | Per-Track Vertical Zoom (FR-02) | Frontend Engineer | Medium | 3-D stable | `src/App.tsx` — trackZoomY state, per-track height |
| 3-F | Sprint 3 UAT | UAT | Low | 3-C, 3-D, 3-E | `docs/defects.md` entries; sign-off |

**Sequencing:** 3-A and 3-B run in parallel at sprint start. 3-C and 3-D can begin once 3-A is done and may run in parallel with each other. 3-E starts only after 3-D is merged and stable. 3-F closes the sprint.

---

#### Ticket 3-A: Zoom + Panel Architecture Decision

**Owner:** Tech Lead | **Effort:** ~2h | **Output:** ADR in `docs/adr/`

Three decisions required before FE starts FR-01 or FR-02:

1. **Panel persistence:** Should panel sizes persist to `localStorage`, or remain in-memory only? Recommended: in-memory for Sprint 3; localStorage opt-in in a follow-up after UX is validated.
2. **Zoom state scope:** Is `zoomX` local-only or eventually synced via WebSocket? Recommended: local-only (zoom is a view preference, not session state). Document as non-collaborative view property.
3. **BAR_W/TRACK_H abstraction:** How should `barW = BAR_W * zoomX` be made available to all arranger components without rewriting every calculation site? Options: (a) derived value at App root, passed as prop; (b) React context. Recommended: (a) props for now given single-file constraint.

---

#### Ticket 3-B: Arranger Zoom Interaction Spec

**Owner:** Designer | **Effort:** ~3h | **Output:** §Interaction Model in `docs/specs/arranger-zoom.md`

Research keyboard shortcut conventions across Ableton Live 12, Logic Pro 11, Pro Tools 2024, and Reaper 7. Define horizontal zoom shortcuts, vertical zoom controls, zoom reset, scroll anchor behavior, and zoom indicator placement. Fill the `§Interaction Model` placeholder before Ticket 3-D keyboard implementation begins.

---

#### Ticket 3-C: Resizable Workspace Panels (FR-01)

**Owner:** Frontend Engineer | **Effort:** M (~1 day)
**Spec:** `docs/specs/resizable-workspace-panels.md`
**FR:** `docs/features/FR-2026-05-14-01-resizable-workspace-panels.md`
**Blocked by:** 3-A (persistence decision); FE may implement without persistence first.

---

#### Ticket 3-D: Horizontal Timeline Zoom (FR-02)

**Owner:** Frontend Engineer | **Effort:** M-L (~1.5 days)
**Spec:** `docs/specs/arranger-zoom.md`
**FR:** `docs/features/FR-2026-05-14-02-multitrack-horizontal-vertical-zoom.md`
**Blocked by:** 3-A (zoom architecture), 3-B (keyboard shortcut spec)

Note: FE may begin the `barW` substitution pass (replacing all `BAR_W` usages in arranger math with `barW`) before 3-B is complete. Keyboard shortcut implementation requires 3-B.

---

#### Ticket 3-E: Per-Track Vertical Zoom (FR-02)

**Owner:** Frontend Engineer | **Effort:** M (~1 day)
**Spec:** `docs/specs/arranger-zoom.md` §Vertical Zoom Model
**Blocked by:** 3-D merged and CI green

---

#### Ticket 3-F: Sprint 3 UAT

**Owner:** UAT | **Effort:** ~2h | **Blocked by:** 3-C, 3-D, 3-E all merged

Test checklist:
- Drag arranger/mixer splitter; confirm min/max clamping and double-click reset.
- Drag FX panel splitter (horizontal); confirm min/max and double-click reset.
- Confirm FX panel BFC positioning not broken at all panel sizes.
- Zoom to 0.25×, 1.0×, 4.0×; confirm clips, ruler, playhead, fade handles scale correctly.
- Drag a clip at 0.25× and 4.0× zoom; confirm bar-snap is correct.
- Click ruler at 0.25× and 4.0× zoom; confirm playhead lands at correct bar.
- Cut a clip at 4.0× zoom; confirm cut position is correct.
- Expand a track to 3.0× vertical zoom; confirm mixer strip height is unchanged.
- Confirm VU meters continue animating at all zoom/panel configurations.
- Confirm `tsc --noEmit` passes.
- Confirm splitters are keyboard-accessible (Tab → focus → Arrow keys work).

---

## Sprint 4 — Async Collaboration Layer

**Theme:** Make the session addressable and commentable.

**Target start:** After Sprint 3 UAT sign-off.
**Hard dependency:** Sprint 2 #20 (JWT/presence) complete. WebSocket client connected.

### Epic 4-A: Session Communication (FR-06 + FR-07)

FR-06 (inline comments) and FR-07 (timeline deep links) share a timeline anchor model and must be designed together. Building FR-07 after FR-06 without a shared anchor model requires a costly retrofit.

**Tickets (high-level):**
- Tech Lead: Anchor model ADR — shared data structure for bar position, track ID, clip ID references used by both comments and deep links.
- Designer: Comment UI spec — timeline anchor pins, thread popover, unread indicators, collaborator color tinting.
- Backend: Comment API + WebSocket events — POST/GET/DELETE `/sessions/:id/comments`; `comment.add` / `comment.resolve` fan-out.
- Frontend: Deep links + URL routing — `?t=bar&track=id` query params, playhead seek on load, copy-link action.
- Frontend: Comment UI — anchor pins, thread popover, composer, resolve action.

### Epic 4-B: Standalone macOS Beta Build (FR-08)

Independent track — no collaboration dependencies. Can run in parallel with Epic 4-A.

**Tickets (high-level):**
- Tech Lead: Packaging decision ADR — Tauri vs Electron vs PWA. Key criteria: Rust toolchain cost (Tauri), bundle size (Electron), install UX (PWA). If future native plugin hosting is expected, this decision matters more.
- Tech Lead + Frontend: Scaffold chosen packager; verify Web Audio context works in packaged environment.
- QA: Distribution and install documentation for beta testers.

---

## Sprint 5 — Audio Asset Workflow

**Theme:** Let collaborators bring real audio into the session.

**Hard dependency:** Tech Lead storage strategy decision (memory vs. IndexedDB vs. backend blob). Backend persistence endpoints must exist.

### Epic 5-A: File Browser + Local Sample Import (FR-03)

Blocked on storage strategy. Design may begin in Sprint 4 but implementation waits.

**Critical open question before any implementation:** If audio assets are stored per-user in IndexedDB, how does a collaborator's sample appear on another user's machine? This must be answered before any code is written.

### Epic 5-B: Bounce Link + Detach Workflow (FR-05)

Can be designed in Sprint 4 alongside FR-03. Implementation waits for bounce/render infrastructure from FR-04.

### Epic 5-C: Plugin Freeze + Bounce Fallback (FR-04)

Most complex item in the backlog. Blocked on FR-03 (storage), backend persistence, and Sprint 2 presence (#20). Do not start implementation until all three foundations are solid.

---

## Feature Scorecard — All 8 FRs

| FR | Feature | Value | Complexity | Risk | Confidence | Key Dependencies | Sprint |
|----|---------|-------|------------|------|------------|------------------|--------|
| FR-01 | Resizable Workspace Panels | High | Medium | Low-Med | High | Layout constants in App.tsx | **3** |
| FR-02 | Multitrack Horizontal + Vertical Zoom | High | Med-High | Med-High | Medium | Tech Lead zoom ADR; Designer shortcut spec | **3** |
| FR-07 | Timeline Deep Links | Med-High | Medium | Low-Med | High | Shared anchor model with FR-06 | **4** |
| FR-06 | Session Communication + Inline Comments | High | Large | Med-High | Medium | #20 complete; WebSocket client connected | **4** |
| FR-08 | Standalone macOS Beta Build | High (QA) | Med-Large | Medium | Medium | Tech Lead packaging decision | **4** |
| FR-03 | File Browser + Local Sample Import | High | Large | High | Low | Storage decision; backend blob | **5** |
| FR-05 | Bounce Link + Detach Workflow | Med-High | Med-Large | Medium | Medium | FR-04 render capability | **5** |
| FR-04 | Plugin Freeze + Bounce Fallback | High | Large | Very High | Low | #20 presence; FR-03; backend persistence | **Future** |

---

## Implementation Order Rationale

**FR-01 and FR-02 before FR-06/FR-07:** The collaboration features anchor to timeline positions. If zoom is wrong or layout is broken, the collaboration UX is broken on top of it. Fix the foundation first.

**FR-02 before FR-03:** Zoom is purely client-side and self-contained. FR-03 requires a storage architecture decision with collaboration-model implications that should not block a sprint.

**FR-06 and FR-07 together in Sprint 4:** The shared anchor model is the critical insight. If FR-07 is deferred and FR-06 ships with its own anchor schema, retrofitting FR-07 later requires a data migration and UI refactor. Build as one designed unit.

**FR-08 in Sprint 4 (parallel):** The macOS build is an independent track with no shared state with the collaboration work. Running it in parallel uses engineering capacity that would otherwise block on WebSocket backend work.

**FR-04 in Future:** Touches session presence, audio rendering, ownership, and file storage simultaneously. All four of those foundations must be solid before this starts. Attempting FR-04 before they are ready produces throwaway work.
