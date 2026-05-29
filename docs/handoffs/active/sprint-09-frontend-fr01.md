# Work Order: Frontend Engineer — FR-01 Resizable Workspace Panels

**To:** Frontend Engineer
**From:** PM
**Sprint:** 9
**Date issued:** 2026-05-29
**Status:** Unblocked — start immediately.
**Spec:** `docs/specs/resizable-workspace-panels.md` ✅ Ready for implementation

---

## Objective

Implement resizable workspace panels in `src/App.tsx` per the spec at `docs/specs/resizable-workspace-panels.md`. This is FR-01, the first of two Sprint 9 features. It is fully unblocked — no ADR or Designer gate applies.

---

## What you are building

Two drag splitters that let engineers control screen real estate:

1. **Arranger/Mixer vertical splitter** — dragging up/down reallocates height between the arranger and mixer. Drag axis is vertical; the dividing line is horizontal.
2. **FX Panel horizontal splitter** — dragging left/right changes the FX panel width when the panel is open.

Both splitters support:
- Pointer-event drag (use `setPointerCapture`)
- Double-click reset to default sizes with `200ms ease` transition (live drag has no transition)
- Keyboard navigation (Arrow keys ±8px, Home = min, End = max, Enter/Space = reset)
- Full ARIA markup (`role="separator"`, `aria-orientation`, `aria-valuenow/min/max`, `aria-label`)
- Hover state: 1px visible line brightens from `C.border` to `C.metalLight`
- Cursor lock: `document.body.style.cursor` set to `row-resize` / `col-resize` during drag; restored on `pointerup`

---

## File to edit

`src/App.tsx` — the single source of truth for all frontend code. Do not create new files in `src/` without explicit Tech Lead approval.

---

## Constants to add

Add these alongside the existing layout constants near the top of `src/App.tsx`:

```typescript
const MIN_ARRANGER_H = 200
const MIN_MIXER_H    = 120
const MIN_FX_W       = 220
const MAX_FX_W       = 480
const SPLITTER_H     = 4   // vertical splitter hit target height
const SPLITTER_W     = 4   // horizontal splitter hit target width
```

---

## State to add at App root

```typescript
const defaultArrangerH = useMemo(
  () => Math.floor((window.innerHeight - TRANSPORT_H - STATUS_BAR_H) * 0.60),
  []
)

const [arrangerH, setArrangerH] = useState<number>(defaultArrangerH)
const [fxPanelW,  setFxPanelW]  = useState<number>(280)
```

`mixerH` is always derived — never stored:
```typescript
const mixerH = window.innerHeight - TRANSPORT_H - STATUS_BAR_H - SPLITTER_H - arrangerH
```

---

## Drag implementation

Use pointer events (not mouse events). The spec at `docs/specs/resizable-workspace-panels.md` includes the full implementation for `onVerticalSplitterPointerDown` — follow it exactly. Apply the same pattern to the horizontal splitter replacing axis and state refs.

Key implementation details:
- Call `e.currentTarget.setPointerCapture(e.pointerId)` at drag start
- Add `pointermove` / `pointerup` listeners to `window` (not the element)
- Set `document.body.style.cursor` at drag start; restore to `''` on `pointerup`
- Clamp values immediately: `Math.max(MIN, Math.min(MAX, next))`
- No transition during live drag — apply `transition: 'height 200ms ease'` only during double-click reset, then remove after 200ms

---

## Layout wiring

```tsx
<ArrangeView style={{ height: arrangerH }} ... />
<VerticalSplitter
  onPointerDown={onVerticalSplitterPointerDown}
  onDoubleClick={resetVerticalSplitter}
  aria-valuenow={arrangerH}
  aria-valuemin={MIN_ARRANGER_H}
  aria-valuemax={maxArrangerH}
/>
<MixerPanel style={{ height: mixerH }} ... />
```

FX panel: pass `fxPanelW` as a prop to the FX panel. Apply it to the panel's root element `width` only. Do not add `transform`, `filter`, or `overflow` to any ancestor — this would re-create a containing block for `position: fixed` and re-introduce the BFC bug fixed in a prior sprint.

---

## Must-not-break list

Read the full list in `docs/specs/resizable-workspace-panels.md` §Must-Not-Break List. Critical items:

1. **BFC fix** — `overflow: clip` is scoped to `html, body` only. Do not add `overflow`, `transform`, or `filter` to any ancestor of the FX panel.
2. **Clip drag math** — `clip.bar * BAR_W` — no panel height involved. Confirm no regression.
3. **VU rAF loop** — the mixer `requestAnimationFrame` loop must continue at all panel sizes including `mixerH = 120px`.
4. **Arranger `scrollLeft`** — changing `arrangerH` must not reset the arranger scroll position. Verify by scrolling to bar 20, resizing, confirming bar 20 remains in view.
5. **Global keyboard shortcuts** — spacebar, V/C, Escape must not be consumed by splitter `onKeyDown`. Splitter keyboard handler only responds to Arrow, Home, End, Enter, Space when the splitter element is focused.

---

## Design constraints (non-negotiable)

- All colors via `C.*` tokens — never hardcode hex values
- Tailwind v4 utility classes + inline `style` for dynamic values only — no CSS modules, no `@apply`
- TypeScript strict mode — no `any`; use `unknown` + TODO if type is genuinely unknown
- No external state libraries

---

## Acceptance criteria

All 17 acceptance criteria in `docs/specs/resizable-workspace-panels.md` §Acceptance Criteria must pass. Key ones:

1. Arranger/mixer splitter drag works; arranger height clamped to `[200px, max]`; mixer height clamped to `[120px, max]`
2. FX panel splitter drag works (when panel is open); width clamped to `[220px, 480px]`
3. Double-click resets with `200ms ease` animation; live drag has no animation
4. Hover brightens the 1px line; cursor changes on hover and during drag
5. VU meter rAF animation continues at all panel configurations
6. FX panel appears at the correct position (BFC fix not broken)
7. `scrollLeft` preserved on panel height change
8. Both splitters: `role="separator"`, `aria-orientation`, `aria-valuenow/min/max`, `aria-label`, `tabIndex={0}`, keyboard navigation
9. `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes with zero errors
10. No hardcoded hex color values

---

## Commit requirements

- `tsc --noEmit` must pass before every commit
- Commit message format: `feat: implement resizable workspace panels (FR-01)`
- Include in commit body: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

---

## Handoff

When implementation is complete, drop `docs/handoffs/fr01-resizable-panels-fe.md` including:
- What was implemented
- Any deviations from the spec (with justification)
- BFC non-regression confirmation
- `tsc --noEmit` output (confirm zero errors)
- Any open questions for Tech Lead review

---

## Files to touch

- `src/App.tsx` — only file

## Files to not touch

- `docs/specs/` — read-only for FE
- `docs/adr/` — Tech Lead only
- `STATUS.md` — Tech Lead only
