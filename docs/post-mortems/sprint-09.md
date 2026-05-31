# Sprint 9 Post-Mortem — Workspace Control

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 9
**Dates:** 2026-05-29 – 2026-05-29
**Status:** Closed
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

- FR-01: Arranger/mixer vertical splitter (drag + double-click reset + keyboard navigation + ARIA)
- FR-01: FX panel horizontal splitter (drag + double-click reset + keyboard navigation + ARIA)
- ADR-008: Zoom state architecture decision (prop drilling vs. context)
- Designer: `§Interaction Model` section in `docs/specs/arranger-zoom.md`
- FR-02: `BAR_W → barW` substitution pass throughout arranger render and interaction math
- FR-02: Horizontal zoom state (`zoomX`), zoom level indicator in arranger toolbar
- FR-02: Scroll position preservation on zoom (playhead-anchored)
- FR-02: Ruler tick density logic at different zoom levels
- FR-02: Keyboard/scroll-wheel zoom shortcuts (per Designer `§Interaction Model`)
- FR-02: Per-track vertical zoom state (`trackZoomY`), track height expand/contract
- UAT sprint sign-off

Both FR-01 and FR-02 had been deferred since Sprint 4.

---

## What shipped

- **FR-01 Resizable workspace panels** — arranger/mixer vertical splitter + FX panel horizontal splitter; pointer-event drag with `setPointerCapture`; double-click reset (200ms ease); keyboard navigation (Arrow ±8px, Home/End, Enter/Space); full ARIA (`role="separator"`, `aria-valuenow/min/max`, `aria-orientation`, `aria-label`); constants `MIN_ARRANGER_H=200`, `MIN_MIXER_H=120`, `MIN_FX_W=220`, `MAX_FX_W=480`, `SPLITTER_H=4`, `SPLITTER_W=4`
- **FR-02 Arranger timeline zoom** — `barW = BAR_W * zoomX` prop drilling throughout arranger; keyboard shortcuts `=`/`-`/`0`; Ctrl/Cmd+scroll wheel zoom; playhead-anchor (keyboard) and cursor-anchor (scroll wheel); zoom level `%` indicator in ruler; ruler tick density at zoom thresholds; per-track vertical zoom (`trackZoomY`) via chevron buttons `[0.5×, 3.0×]`; View menu Zoom In/Out/Reset now active
- **ADR-008** — Zoom state architecture (prop drilling decision for `barW`): `docs/adr/ADR-008-zoom-state-architecture.md`
- SPRINT-9-001 fix: Panel height calculations now subtract `MENU_BAR_H` (24px)
- SPRINT-9-002 fix: Zoom Out menu shortcut label corrected to hyphen-minus

---

## What had issues

Sprint 9 UAT found 2 defects — both fixed before close.

**SPRINT-9-001 (P2, fixed) — Panel height calculations omit `MENU_BAR_H` — mixer bottom clipped by 24px:**

The `defaultArrangerH` formula used `window.innerHeight - TRANSPORT_H - STATUS_BAR_H`, omitting `MENU_BAR_H = 24`. The `mixerH` formula made the same omission. As a result, `defaultArrangerH + SPLITTER_H + mixerH` equaled `window.innerHeight - 80px`, but the flex container could only accommodate `window.innerHeight - 104px` (subtracting all four chrome regions: MenuBar 24 + TransportBar 52 + StatusBar 28 + SPLITTER_H 4). The panels overflowed by 24px. With `overflow-hidden` on the parent, the bottom 24px of the mixer panel was clipped — strip labels and dB readouts at the bottom were cut off.

This defect was introduced when `MENU_BAR_H` was added in Sprint 8 but the splitter spec pseudocode (written before Sprint 8) was not updated. The fix updated all four relevant formulas to include `MENU_BAR_H`.

**SPRINT-9-002 (P3, fixed) — View menu "Zoom Out" shortcut label shows en dash (–) not hyphen-minus (-):**

The `shortcut="–"` attribute at `src/App.tsx:5414` used U+2013 (en dash). The keyboard handler at line 6409 listens for `e.key === '-'` (U+002D, hyphen-minus). A musician reading the menu would see `–` and look for an en dash key, which does not exist as a standalone key on standard keyboards. The shortcut worked correctly at runtime, but the label was misleading. Fix: `shortcut="-"` at line 5414.

---

## How issues were addressed

Both defects were fixed before sprint close. UAT result: PASS, zero P0/P1 defects.

**The TDZ runtime crash (pre-UAT, fixed before UAT run):**

Before UAT ran, the app had a Temporal Dead Zone (TDZ) runtime crash that was diagnosed and fixed. This is one of the most technically instructive incidents in the project's sprint history.

`const onZoom` (the zoom handler function) was declared with `const` later in the function scope of the App component, but was referenced in a `useEffect` dependency array that appeared earlier in the same function scope. In JavaScript, `const` declarations have a temporal dead zone: the variable cannot be accessed before its declaration line, even within the same function scope. Attempting to do so throws a `ReferenceError` at runtime.

Diagnosis: a temporary error boundary was added to `src/main.tsx` to surface the crash with a stack trace. The TDZ was confirmed by the error message.

Fix: the zoom handlers block was moved above the keydown `useEffect` that referenced it, eliminating the ordering dependency. A second step removed duplicate `onZoom` / `arrangerScrollRef` declarations that had been introduced during the initial implementation — these were redundant const declarations of the same name, which TypeScript should have caught but didn't because they appeared in different parts of the same scope.

The lesson: `const` hoisting rules apply inside function bodies the same way they apply at module scope. A `useEffect` that runs after mount still reads from the declaration-order-visible scope at the time the component function executed, not at the time the effect ran.

---

## Decisions made

**ADR-008 — Zoom state architecture: prop drilling over React context.** The spec explicitly left the propagation mechanism open and required a Tech Lead decision. The decision: `barW = BAR_W * zoomX` computed at App root and passed as an explicit prop to every arranger component. React context rejected because:
- Single-file constraint makes context threading more complex than prop drilling — it adds JSX provider boilerplate and `useContext` call sites without the benefit that motivates context (avoiding prop threading across file/component boundaries that don't exist in a single file)
- Zoom is local-only in Sprint 9; no lateral consumption, no deep subscription
- Future WS sync integration point is already defined: App root receives `zoomX` from WS and calls `setZoomX`; nothing downstream changes
- `zoomX` is a plain `number` — serializable without transformation, trivially obvious that prop drilling maintains this

The decision was explicitly scoped to the single-file constraint. If arranger components are extracted to separate files, the ADR notes that React context should be reconsidered.

**After FR-02, `BAR_W` constant declaration is the only remaining reference in `src/App.tsx`.** This was a firm exit criterion: `grep -n "BAR_W" src/App.tsx` must return only the constant declaration line. This constraint ensures that all arranger math uses the dynamic `barW` prop, not the fixed constant — enabling zoom to actually affect rendering.

**`zoomX` clamped to `[0.25, 4.0]`, `trackZoomY` clamped to `[0.5, 3.0]`.** The range bounds were specified in the Designer spec and implemented as-is. 25% to 400% horizontal zoom covers all practical editing scenarios from overview (full session visible) to detailed (individual waveform samples visible at the clip level).

**Zoom is local-only for Sprint 9.** Each collaborator controls their own zoom independently. Zoom state is not synced over WebSocket. The state shape (`number`, `Record<string, number>`) is intentionally JSON-serializable for future WS sync without transformation.

---

## What was deferred

- localStorage persistence for panel sizes — explicitly deferred per FR-01 spec; requires a Tech Lead ADR covering localStorage key shape and sync strategy
- WebSocket sync for zoom state — local-only in Sprint 9; deferred to a future sprint
- Pinch-to-zoom gesture — desktop-first; Designer ruled it out of scope in `§Interaction Model`
- Plugin parameter editing UI — PM decision on UX pattern still deferred
- In-browser audio recording — Sprint 10+ candidate

---

## What was learned

**JavaScript Temporal Dead Zone is not just a module-scope concern.** The TDZ crash in Sprint 9 occurred inside a React component function body. `const` declarations in a function scope have a TDZ from the start of the function's execution to the point where the declaration is evaluated. If a `useEffect` captures a variable via closure and that variable is declared later in the same function body, the effect's closure captures a reference to the TDZ placeholder, not the value — and the `ReferenceError` fires when the closure is called. The fix is always the same: declare before reference. The lesson is that linters and TypeScript don't always catch this.

**Spec pseudocode that predates a feature can create cascading bugs.** The panel height calculation bug (SPRINT-9-001) existed because the splitter spec was written before `MENU_BAR_H` was added in Sprint 8. The formula in the spec was correct at the time it was written but became incorrect when a new constant was added. Future sprints: when adding a new layout constant, run the spec pseudocode formulas forward to confirm they're still valid.

**FR-01 and FR-02 had been deferred since Sprint 4.** When they finally shipped in Sprint 9, they were the clearest articulation of what a "sprint done right" looks like: Designer spec complete before FE begins, ADR written before keyboard shortcuts wired, substitution pass separated from interaction wiring, full ARIA from day one. The 5-sprint wait was unfortunate; the execution was clean.

**The TDZ crash was caught before UAT by running the app.** This is an argument for always running `npm run dev` and exercising the app before submitting for UAT, not just passing `tsc --noEmit`. TypeScript didn't catch the TDZ; the runtime did.

---

## Metrics

- Defects found by UAT: 2 (0 P0, 0 P1, 1 P2, 1 P3)
- Both fixed before sprint close
- Pre-UAT TDZ crash: found and fixed before UAT run
- UAT result: PASS
- `tsc --noEmit`: clean at close
- `grep -n "BAR_W" src/App.tsx`: returns only constant declaration line at close

---

## Open questions going into the next sprint

- When does the panel size localStorage ADR get written? This was deferred explicitly and needs a scheduled sprint.
- SPRINT-9-001 was caused by a spec that predated `MENU_BAR_H`. Are there other spec documents that contain stale layout formulas?
- ADR-009 for continuity bounce architecture: when does this get written?
