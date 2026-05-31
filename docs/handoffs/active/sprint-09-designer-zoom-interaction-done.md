# Handoff: §Interaction Model — Arranger Zoom Spec Complete

**From:** Designer
**To:** PM / Frontend Engineer
**Sprint:** 9
**Date:** 2026-05-29
**Spec file:** `docs/specs/arranger-zoom.md`

---

## Status

The `§Interaction Model` placeholder in `docs/specs/arranger-zoom.md` is fully replaced. FR-02 pass 2 (Ticket 3-D keyboard shortcut implementation) is unblocked.

---

## What was specified

All six sections required by the work order are complete:

1. **Horizontal zoom keyboard shortcuts** — `=` zoom in, `-` zoom out, `0` reset to 1.0×. Unmodified keys, consistent with existing single-key shortcut pattern in the codebase (`v`, `c`, `?`). Browser-safe: no reserved combos. `R` is not used and was not mapped.

2. **Scroll wheel behavior** — Default scroll = native horizontal scroll, no interception. `Ctrl/Cmd + scroll` = zoom at step `0.25` per tick. Modifier pattern uses existing `isMod = e.metaKey || e.ctrlKey` already in the codebase. Listener must be registered with `{ passive: false }` — flagged explicitly for the FE.

3. **Zoom anchor behavior** — Keyboard zoom anchors to playhead position (centers playhead in viewport). If playhead is off-screen, anchors to viewport center. Scroll wheel zoom anchors to cursor x position. Both cases use the `onZoom` function already scaffolded in the spec.

4. **Zoom level indicator** — Format `"{Math.round(zoomX * 100)}%"` confirmed. Placement: ruler bar, `right: 8px`, absolutely positioned, `C.textSec`, 11px monospace, `pointer-events: none`, `aria-hidden="true"`.

5. **Pinch gesture scope** — Explicitly out of scope for Sprint 9. Deferred with note for future scoping.

6. **Ruler tick thresholds** — Confirmed with one clarification: the `< 1.0` suppression boundary is `barW < 36px` (strictly less than), which equals `zoomX < 0.5`. Quarter-note subdivisions at `>= 2.0×` are short tick marks at `C.textSec` 40% opacity, no labels. Full threshold table provided in the spec.

Also specified: vertical zoom controls (expand/collapse chevron buttons in track header, double-click to reset), and scroll container width behavior at extreme zoom.

---

## Existing implementation check

Read `src/App.tsx`. No conflicts with existing implementation:
- `R` is not mapped in any global keydown handler.
- `=`, `-`, `0` are not mapped anywhere in the global shortcut handler.
- `isMod` pattern (`e.metaKey || e.ctrlKey`) already established at line 4716 — new zoom modifier code should follow the same pattern.
- The global keydown handler at line ~6200 has correct guards (`INPUT`/`TEXTAREA` early return) that cover all new zoom keys.

---

## Open questions

None blocking FR-02 pass 2. The spec is complete and implementable without follow-up.

One advisory for the Tech Lead: the `{ passive: false }` wheel event listener is an imperative DOM concern. It cannot be handled via React's synthetic `onWheel` prop in React 17+ (passive by default). The FE must use a `useEffect` + `addEventListener` pattern on the arranger scroll container ref. This is a common pattern and should not require an ADR, but the Tech Lead should confirm it fits the existing event handler architecture.
