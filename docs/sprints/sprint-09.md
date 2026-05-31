# Sprint 9 — Workspace Control

**Status:** Historical Archive
**Last updated:** 2026-05-29
**Closed:** 2026-05-29
**UAT result:** PASS — zero P0/P1 defects; 2 defects found (SPRINT-9-001 P2, SPRINT-9-002 P3) and fixed before close
**Theme:** Give engineers control over their screen real estate and timeline density.
**Depends on:** Sprint 8 ✅ — session lobby, real audio playback, application menu bar all shipped; View menu already has stubbed Zoom In / Zoom Out / Reset Zoom items
**Unblocks:** Sprint 10 (in-browser recording, plugin parameter editing UI)

---

## Goals

- Engineers can drag a splitter between the arranger and mixer to reallocate vertical screen space without leaving the session room (FR-01)
- Engineers can drag a splitter to widen or narrow the FX panel when it is open (FR-01)
- Engineers can zoom the arranger timeline in and out horizontally so fade placement and cut operations can be done with precision (FR-02)
- Engineers can expand individual tracks vertically to inspect waveform detail (FR-02)
- Zoom level is visible as a live readout in the arranger toolbar (FR-02)
- All new controls respect the `C.*` design token system and the collaborator color model

---

## PM Decisions

### 1. FR-01 spec is fully complete — no gates before FE

`docs/specs/resizable-workspace-panels.md` is marked "Ready for implementation." The spec includes the full drag implementation (pointer events, pointer capture), constants, state model, ARIA markup, and all 17 acceptance criteria. No additional ADR or Designer work is required before the FE work order is issued. Frontend Engineer may start immediately on sprint kick-off.

### 2. FR-02 has two hard gates before FE begins keyboard shortcut implementation

The spec at `docs/specs/arranger-zoom.md` is complete except for `§Interaction Model`, which is an explicit placeholder. Two blocking tasks must complete before the FE implements shortcuts or zoom triggers:

**Gate A — Tech Lead ADR-008:** The spec recommends prop drilling (`barW` computed at App root, passed as a prop to arranger components) over React context. The Tech Lead must formalize this as `docs/adr/ADR-008-zoom-state-architecture.md`. This is a quick ADR — the decision is essentially pre-made; the ADR provides the rationale and closes the open question in the spec.

**Gate B — Designer: fill `§Interaction Model`:** The Designer must complete the placeholder section in `docs/specs/arranger-zoom.md`. Required content: horizontal zoom keyboard shortcuts (Cmd+/- or scroll wheel + modifier), scroll-to-playhead anchor behavior, zoom level indicator placement and format, and a formal scope decision on pinch gesture (expected answer: out of scope, desktop-first).

The FE may begin the `BAR_W → barW` substitution pass immediately after ADR-008 is committed — this mechanical audit does not require the interaction model. Shortcut wiring is blocked until Gate B closes.

### 3. Scope boundary — no localStorage persistence for panel sizes

The FR-01 spec explicitly defers localStorage persistence for panel sizes to a future sprint pending a Tech Lead ADR. Do not implement it in Sprint 9.

### 4. Zoom is local-only

Each collaborator controls their own zoom. Zoom state is not synced over WebSocket in Sprint 9. The state shape (`number`, `Record<string, number>`) must remain serializable for future sync without transformation — do not add non-serializable values.

### 5. `BAR_W` constant remains unchanged

`BAR_W = 72` stays fixed. `barW` is always `BAR_W * zoomX` — a derived value, never stored. After FR-02 lands, `grep -n "BAR_W" src/App.tsx` must return only the constant declaration line.

---

## In Scope

- FR-01: Arranger/mixer vertical splitter (drag + double-click reset + keyboard navigation + ARIA)
- FR-01: FX panel horizontal splitter (drag + double-click reset + keyboard navigation + ARIA)
- FR-01 constants: `MIN_ARRANGER_H`, `MIN_MIXER_H`, `MIN_FX_W`, `MAX_FX_W`, `SPLITTER_H`, `SPLITTER_W`
- ADR-008: Zoom state architecture decision (prop drilling vs. context)
- Designer: `§Interaction Model` section in `docs/specs/arranger-zoom.md`
- FR-02: `BAR_W → barW` substitution pass throughout arranger render and interaction math
- FR-02: Horizontal zoom state (`zoomX`), zoom level indicator in arranger toolbar
- FR-02: Scroll position preservation on zoom (playhead-anchored)
- FR-02: Ruler tick density logic at different zoom levels
- FR-02: Keyboard/scroll-wheel zoom shortcuts (per Designer `§Interaction Model`)
- FR-02: Per-track vertical zoom state (`trackZoomY`), track height expand/contract
- UAT sprint sign-off
- Tech Lead: documentation sync + sprint close

## Out of Scope

- localStorage persistence for panel sizes (explicitly deferred in FR-01 spec; requires separate ADR)
- WebSocket sync for zoom state (local-only for Sprint 9)
- Pinch-to-zoom gesture (desktop-first; Designer to formally rule out in `§Interaction Model`)
- Plugin parameter editing UI (PM decision on UX pattern deferred)
- In-browser audio recording (Sprint 10+)
- Undo/redo implementation (stub items remain dimmed)
- Mobile capture screen
- Any new backend work

---

## Work Sequence

**Gate rules:**
- FR-01 FE work order is unblocked immediately — no gates.
- FR-02 FE may begin `BAR_W → barW` substitution pass after ADR-008 is committed.
- FR-02 FE may not implement keyboard shortcuts or zoom triggers until both ADR-008 and Designer `§Interaction Model` are complete.
- No FE work order for FR-02 keyboard shortcuts is issued until both gates are closed.

1. **Tech Lead** — Write `docs/adr/ADR-008-zoom-state-architecture.md`. Decision: prop drilling for `barW` (computed at App root, passed as prop). Rationale: single-file constraint makes context threading more complex than prop drilling; collaborator zoom is local-only and does not need deep consumption.

2. **Designer** — Fill `§Interaction Model` in `docs/specs/arranger-zoom.md`. Sections required: horizontal zoom shortcuts, scroll wheel behavior, zoom anchor behavior, zoom level indicator placement and format, pinch gesture scope decision.

3. **Frontend Engineer** — FR-01: Implement resizable workspace panels per `docs/specs/resizable-workspace-panels.md`. Unblocked immediately.

4. **Frontend Engineer** — FR-02 pass 1 (unblocked after ADR-008): `BAR_W → barW` substitution throughout `src/App.tsx`. After this pass, `grep -n "BAR_W" src/App.tsx` returns only the constant declaration.

5. **Frontend Engineer** — FR-02 pass 2 (unblocked after Designer `§Interaction Model`): Zoom state, indicator, shortcuts, scroll-to-playhead, ruler tick density, per-track vertical zoom.

6. **UAT** — Sprint sign-off: FR-01 splitter scenarios + FR-02 zoom scenarios. Zero P0/P1 required.

7. **Tech Lead** — Documentation sync commit + sprint close.

---

## Exit Criteria

- [x] Dragging the arranger/mixer splitter resizes both panels in real time with no animation lag
- [x] Arranger height cannot go below `MIN_ARRANGER_H = 200px`; mixer height cannot go below `MIN_MIXER_H = 120px`
- [x] Dragging the FX panel splitter (when FX panel is open) changes the panel width in real time
- [x] FX panel width is clamped to `[MIN_FX_W = 220px, MAX_FX_W = 480px]`
- [x] Double-clicking either splitter resets panels to default sizes with a `200ms ease` transition
- [x] Splitter visible line brightens on hover (`C.metalLight`); cursor changes to `row-resize` / `col-resize`
- [x] Each splitter has `role="separator"`, correct `aria-orientation`, `aria-valuenow/min/max`, `aria-label`, and keyboard navigation (Arrow, Home, End, Enter/Space)
- [x] VU meter rAF animation continues uninterrupted at all panel size configurations
- [x] FX panel appears at the correct position at any panel size (BFC fix not broken)
- [x] Arranger `scrollLeft` is preserved when panel height changes (bar 20 stays in view after resize)
- [x] `zoomX` state exists at App root; `barW = BAR_W * zoomX` is passed as a prop to arranger components
- [x] `grep -n "BAR_W" src/App.tsx` returns only the constant declaration line
- [x] All arranger calculation sites use `barW`, not `BAR_W`
- [x] Zoom level indicator shows current zoom as a percentage, updates live
- [x] Zooming in/out anchors to the playhead (or viewport center if playhead is off-screen)
- [x] Zoom shortcuts from `§Interaction Model` are implemented and functional
- [x] `zoomX` clamped to `[0.25, 4.0]`; ruler tick density changes at `zoomX` thresholds
- [x] Per-track vertical zoom expands/contracts the track row; all other tracks unaffected
- [x] Mixer strip heights unchanged by vertical zoom
- [x] `trackZoomY` clamped to `[0.5, 3.0]` per track
- [x] `tsc --noEmit` passes with zero errors
- [x] Sprint 9 UAT signed off with zero P0/P1 defects

---

## Key Links

- FR-01 spec: `docs/specs/resizable-workspace-panels.md` ✅ Ready for implementation
- FR-02 spec: `docs/specs/arranger-zoom.md` ⚠️ `§Interaction Model` is a placeholder — Designer must fill before FE implements shortcuts
- ADR-008 (to be written): `docs/adr/ADR-008-zoom-state-architecture.md`
- Sprint 8 (closed): `docs/sprints/sprint-08.md`
- ROADMAP: `docs/specs/ROADMAP.md`
- PRD: `docs/specs/PRD.md`
