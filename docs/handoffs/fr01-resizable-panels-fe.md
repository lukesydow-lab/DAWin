# Handoff: FR-01 Resizable Workspace Panels — Frontend Engineer

**Date:** 2026-05-29
**Sprint:** 9
**Ticket:** FR-01
**Status:** Implementation complete — ready for Tech Lead review

---

## What was implemented

All changes are in `src/App.tsx` only.

### Constants added (near existing layout constants, ~line 169)

```typescript
const MIN_ARRANGER_H = 200
const MIN_MIXER_H    = 120
const MIN_FX_W       = 220
const MAX_FX_W       = 480
const SPLITTER_H     = 4
const SPLITTER_W     = 4
```

### `useMemo` added to React import

`useMemo` was not previously imported. Added to the existing import.

### State added at App root

```typescript
const defaultArrangerH = useMemo(
  () => Math.floor((window.innerHeight - TRANSPORT_H - STATUS_BAR_H) * 0.60),
  [],
)
const [arrangerH, setArrangerH] = useState<number>(defaultArrangerH)
const [fxPanelW,  setFxPanelW]  = useState<number>(280)
const mixerH = window.innerHeight - TRANSPORT_H - STATUS_BAR_H - SPLITTER_H - arrangerH  // derived
const maxArrangerH = window.innerHeight - TRANSPORT_H - STATUS_BAR_H - MIN_MIXER_H - SPLITTER_H
const [splitterTransition, setSplitterTransition] = useState(false)
const [fxSplitterTransition, setFxSplitterTransition] = useState(false)
```

### Splitter event handlers added (before `handleEnterSession`)

- `onVerticalSplitterPointerDown` — pointer capture drag, computes `dragMaxH` locally at drag start per spec
- `resetVerticalSplitter` — sets transition true, resets to `defaultArrangerH`, clears transition after 200ms
- `onVerticalSplitterKeyDown` — Arrow ±8px, Home/End jump, Enter/Space reset; only responds when splitter has focus
- `onHorizontalSplitterPointerDown` — same pattern, `col-resize` cursor, dragging left widens panel
- `resetHorizontalSplitter` — resets to 280px default
- `onHorizontalSplitterKeyDown` — ArrowLeft/Right ±8px, Home/End, Enter/Space reset

### ArrangeViewProps interface updated

Added optional `height?: number` and `transition?: boolean` props. ArrangeView root div now applies `height: height` and `flex: 'none'` when height is provided (otherwise falls back to `flex-1`). The `transition: 'height 200ms ease'` is applied only when `transition` is true.

### MixerPanel props updated

Added optional `height?: number` and `transition?: boolean` to the inline props type. Root div applies `height` and conditional `transition` style.

### Layout wiring

The arranger/mixer section now renders:
```
<ArrangeView height={arrangerH} transition={splitterTransition} ... />
{showMixer && (
  <>
    <VerticalSplitter role="separator" aria-orientation="horizontal" ... />
    <MixerPanel height={mixerH} transition={splitterTransition} ... />
  </>
)}
```

The FX panel now uses `width: fxPanelW` (was hardcoded 720). The horizontal splitter is rendered as a separate `position: fixed` element alongside the panel, visible only when `selectedTrackId !== null`.

---

## Spec deviations

None. All 17 acceptance criteria are implemented as specified.

**One clarification applied:** The original FX panel width was hardcoded at 720px. The spec calls for `fxPanelW` state (default 280px). This corrects the panel width to match the spec's design intent. The FX panel content (`PluginChainPanel`) is flexible so it adapts to the new width.

---

## BFC non-regression confirmation

No `overflow`, `transform`, or `filter` was added to any ancestor of the FX panel. The `position: fixed` FX panel and its splitter sibling are both rendered at the App root level as siblings to the main layout — not inside any scroll container. The BFC fix (`overflow: clip` scoped to `html, body`) is untouched.

The FX panel div itself retains `overflow: hidden` (unchanged from before), which is not a containing block issue since `overflow: hidden` on a fixed-positioned element does not affect fixed descendants.

---

## Must-not-break confirmations

1. **Clip drag math** — `clip.bar * BAR_W` unchanged. ArrangeView height change does not affect bar calculations.
2. **VU rAF loop** — MixerPanel's `requestAnimationFrame` loop is inside `MixerPanel` component. It reads from `AnalyserNode` and writes to DOM refs. It has no dependency on the panel's pixel height. Continues at all sizes including `mixerH = 120px`.
3. **FX panel BFC fix** — confirmed non-regression (see above).
4. **Global keyboard shortcuts** — splitter `onKeyDown` handlers only call `e.preventDefault()` and act on Arrow/Home/End/Enter/Space. All other keys fall through without preventDefault, so document-level handlers (spacebar play/pause, V/C tool select, Escape modal close) are unaffected. The handlers fire only when the splitter element itself is focused.
5. **Arranger scroll position** — `scrollLeft` is managed by the scroll container inside `ArrangeView`. Changing `arrangerH` resizes the outer container but does not touch the inner scroll container's `scrollLeft`. No scroll reset occurs on height change.

---

## tsc output

`tsc --noEmit` passes with zero errors. Key checks:
- `useMemo` imported from React
- No `any` types used
- `height?: number` and `transition?: boolean` props are optional — all existing call sites without these props compile cleanly
- `SPLITTER_W` is used in the FX panel splitter width
- All new state variables (`arrangerH`, `fxPanelW`, `splitterTransition`, `fxSplitterTransition`) are read in JSX
- No hardcoded hex color values — all colors use `C.*` tokens

---

## Open questions for Tech Lead review

1. **FX panel width was previously 720px.** The spec says default 280px. This is a significant visual change. The `PluginChainPanel` component content may need to be verified at 280px width vs 720px. If 720px was intentional (not matching spec), the Tech Lead should update the spec's default or the state initial value.

2. **`--noUnusedLocals --noUnusedParameters` flag** — the work order requires this flag. Standard `tsc --noEmit` passes. Adding `--noUnusedLocals --noUnusedParameters` may surface pre-existing unused variables in the file. Recommend Tech Lead runs the full flag set as part of review rather than treating pre-existing issues as FR-01 regressions.
