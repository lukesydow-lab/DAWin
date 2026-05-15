# Spec: Resizable Workspace Panels (FR-01)

**Version:** 1.0
**Date:** 2026-05-15
**Sprint:** 3 — Ticket 3-C
**Status:** Ready for implementation
**FR:** `docs/features/FR-2026-05-14-01-resizable-workspace-panels.md`
**Implement from:** This document. Do not start until Tech Lead ADR (Ticket 3-A) is committed.

---

## Problem

The arranger and mixer panels have fixed heights. The FX panel has a fixed width. In a dense session (7+ tracks, active plugin chains), engineers cannot expand the arranger to see waveform detail without losing mixer real estate, and cannot widen the FX panel to read plugin names without truncation. Every professional DAW solves this with resizable panels.

---

## User Story

As a session collaborator editing clips or tuning a mix, I want to drag a splitter between the arranger and mixer (or between the main workspace and FX panel) so I can allocate screen space to the area I am currently focused on, without leaving the session room.

---

## Panels in Scope

### 1. Arranger / Mixer Splitter (vertical divider — moves up/down)

- **Axis:** Vertical (drag up = taller arranger, shorter mixer; drag down = shorter arranger, taller mixer)
- **What stays fixed:** Transport bar (`TRANSPORT_H = 52px`) top; status bar (`STATUS_BAR_H = 28px`) bottom. The splitter travels within the remaining viewport height.
- **Min arranger height:** `200px` (shows at least 3 tracks at `TRACK_H = 64px` plus ruler at `RULER_H = 24px`)
- **Min mixer height:** `120px` (preserves fader, VU, and strip labels at minimum readable size)
- **Max arranger height:** `viewportH - TRANSPORT_H - STATUS_BAR_H - 120 - splitterH`

### 2. FX Panel / Workspace Splitter (horizontal divider — moves left/right)

- **Axis:** Horizontal (drag left = wider FX panel, narrower workspace; drag right = narrower FX panel)
- **Min FX panel width:** `220px`
- **Max FX panel width:** `480px`
- **Conditional:** The splitter is only visible when the FX panel is open. When the panel closes, `fxPanelW` is preserved in state and restored when the panel reopens.

---

## Splitter Visual Design

| Property | Value |
|---|---|
| Hit target size | 4px (height for vertical splitter, width for horizontal) |
| Visible line | 1px solid `C.border` (`#1E1E28`) centered in hit target |
| Hover line color | `C.metalLight` (`#3A3A52`) |
| Hover transition | `background-color 120ms ease` |
| Active (dragging) line | stays `C.metalLight` |
| Cursor — vertical splitter | `row-resize` |
| Cursor — horizontal splitter | `col-resize` |
| Drag cursor lock | Set `cursor: row-resize` (or `col-resize`) on `document.body` during drag; restore on `pointerup` |

No drag handle grip icon. The line itself is the affordance — consistent with the tool's density convention.

---

## Double-Click Reset

Double-clicking either splitter resets panel sizes to defaults with a `200ms ease` transition. The transition applies **only** during reset — live drag is immediate with no animation.

**Default values:**

```typescript
const defaultArrangerH = Math.floor((window.innerHeight - TRANSPORT_H - STATUS_BAR_H) * 0.60)
const defaultFxPanelW  = 280
```

Trigger reset on `onDoubleClick` of the splitter element. Apply the transition via a temporary CSS class or inline style toggle, then remove it after `200ms`.

---

## State Model

All panel size state at App root. No external state library.

```typescript
// App root
const [arrangerH, setArrangerH] = useState<number>(defaultArrangerH)
const [fxPanelW,  setFxPanelW]  = useState<number>(280)
```

`defaultArrangerH` is computed once on mount:

```typescript
const defaultArrangerH = useMemo(
  () => Math.floor((window.innerHeight - TRANSPORT_H - STATUS_BAR_H) * 0.60),
  [] // stable — viewport height does not change after mount in this app
)
```

`mixerH` is always derived — never stored:

```typescript
const mixerH = window.innerHeight - TRANSPORT_H - STATUS_BAR_H - SPLITTER_H - arrangerH
// SPLITTER_H = 4 (hit target height of the vertical splitter)
```

**localStorage persistence:** Do NOT implement until Tech Lead ADR (Ticket 3-A) explicitly approves and specifies the key schema. For Sprint 3, sizes reset on reload.

---

## Drag Implementation

Use pointer events (not mouse events) to handle touch, stylus, and mouse uniformly.

```typescript
const onVerticalSplitterPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  e.currentTarget.setPointerCapture(e.pointerId)
  const startY = e.clientY
  const startH = arrangerH

  const maxArrangerH = window.innerHeight - TRANSPORT_H - STATUS_BAR_H - MIN_MIXER_H - SPLITTER_H

  const onMove = (ev: PointerEvent) => {
    const next = Math.max(MIN_ARRANGER_H, Math.min(maxArrangerH, startH + (ev.clientY - startY)))
    setArrangerH(next)
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    document.body.style.cursor = ''
  }

  document.body.style.cursor = 'row-resize'
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
```

Apply the same pattern for the horizontal splitter (FX panel), replacing `clientY`/`startH`/`arrangerH` with `clientX`/`startW`/`fxPanelW`, and clamping to `[MIN_FX_W, MAX_FX_W]`.

**Constants to add near the top of App.tsx (alongside existing layout constants):**

```typescript
const MIN_ARRANGER_H = 200
const MIN_MIXER_H    = 120
const MIN_FX_W       = 220
const MAX_FX_W       = 480
const SPLITTER_H     = 4   // vertical splitter hit target height
const SPLITTER_W     = 4   // horizontal splitter hit target width
```

---

## Layout Wiring

The arranger and mixer components must receive their height via inline `style` props:

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

For the FX panel, pass `fxPanelW` as a prop. The panel applies it to its own root element width. The FX panel's `position: fixed` anchoring must not be changed — only the `width` value changes.

---

## Layout Constants Affected

| Constant | Status | Notes |
|---|---|---|
| `TRANSPORT_H = 52` | Unchanged | Used to compute available splitter travel range |
| `STATUS_BAR_H = 28` | Unchanged | Used to compute available splitter travel range |
| `TRACK_H = 64` | Unchanged (FR-01) | FR-02 makes this zoom-aware separately |
| `RULER_H = 24` | Unchanged | |
| `BAR_W = 72` | Unchanged | |

New constants added: `MIN_ARRANGER_H`, `MIN_MIXER_H`, `MIN_FX_W`, `MAX_FX_W`, `SPLITTER_H`, `SPLITTER_W`.

---

## Must-Not-Break List

1. **Clip drag math:** Clip `x = clip.bar * BAR_W`. No panel height involved. Verify no change.
2. **VU rAF loop:** The shared `requestAnimationFrame` loop in `MixerPanel` reads `AnalyserNode` data and writes directly to DOM. It does not depend on panel layout. Confirm the loop continues at all panel sizes — including mixer at its minimum 120px height.
3. **FX panel BFC fix:** The previous P1 bug: `overflow: clip` on `#root` created a block formatting context that caused `position: fixed` FX panel to anchor at the wrong offset. The fix scoped `overflow: clip` to `html, body` only. This fix must NOT be reverted. Widening the FX panel via `fxPanelW` state must change only the element's `width` — it must not introduce a new `overflow`, `transform`, or `filter` on any ancestor that would re-create a containing block for `position: fixed`.
4. **Global keyboard shortcuts:** Spacebar (play/pause), V/C (tool select), Escape (modal close) must not be captured by splitter `onKeyDown` handlers. Splitter keyboard handlers should only respond to Arrow keys, Home, End, Enter, and Space when the splitter itself is focused.
5. **Arranger scroll position:** Changing `arrangerH` must not reset `scrollLeft` on the arranger scroll container. Verify by scrolling to bar 20, then resizing the panel, then confirming bar 20 is still in view.

---

## ARIA

Both splitters must be keyboard-accessible and screen-reader-announced.

```tsx
// Vertical splitter (divides height — orientation is "horizontal" per ARIA spec)
<div
  role="separator"
  aria-orientation="horizontal"
  aria-valuenow={arrangerH}
  aria-valuemin={MIN_ARRANGER_H}
  aria-valuemax={maxArrangerH}
  aria-label="Resize arranger and mixer panels"
  tabIndex={0}
  onKeyDown={onVerticalSplitterKeyDown}
  onPointerDown={onVerticalSplitterPointerDown}
  onDoubleClick={resetVerticalSplitter}
/>

// Horizontal splitter (divides width — orientation is "vertical" per ARIA spec)
<div
  role="separator"
  aria-orientation="vertical"
  aria-valuenow={fxPanelW}
  aria-valuemin={MIN_FX_W}
  aria-valuemax={MAX_FX_W}
  aria-label="Resize FX panel"
  tabIndex={0}
  onKeyDown={onHorizontalSplitterKeyDown}
  onPointerDown={onHorizontalSplitterPointerDown}
  onDoubleClick={resetHorizontalSplitter}
/>
```

**Note on `aria-orientation`:** Per the ARIA separator spec, `aria-orientation` describes the dividing line direction, not the drag direction. A splitter that moves up/down uses `aria-orientation="horizontal"` (horizontal line). A splitter that moves left/right uses `aria-orientation="vertical"` (vertical line).

**Keyboard behavior for both splitters:**

| Key | Action |
|---|---|
| `ArrowUp` / `ArrowDown` (vertical) | Move by 8px |
| `ArrowLeft` / `ArrowRight` (horizontal) | Move by 8px |
| `Home` | Jump to minimum size |
| `End` | Jump to maximum size |
| `Enter` or `Space` | Reset to default (same as double-click) |

---

## Acceptance Criteria

1. The arranger panel can be made taller or shorter by dragging the horizontal splitter.
2. The arranger height cannot go below `MIN_ARRANGER_H = 200px` regardless of drag position.
3. The mixer height cannot go below `MIN_MIXER_H = 120px` regardless of drag position.
4. The FX panel can be made wider or narrower when open by dragging the vertical splitter.
5. The FX panel width cannot go below `MIN_FX_W = 220px` or above `MAX_FX_W = 480px`.
6. Double-clicking either splitter resets both panels to default sizes with a 200ms ease animation.
7. During live drag, the panel follows the pointer with no animation lag.
8. The splitter visible line brightens on hover (`C.metalLight`).
9. The cursor changes to `row-resize` (vertical) or `col-resize` (horizontal) on hover and during drag.
10. The VU meter rAF animation continues uninterrupted at all panel size configurations.
11. The FX panel appears at the correct position when open at any panel size (BFC fix not broken).
12. Clip drag and resize produce correct bar values at all panel heights.
13. Arranger scroll position (`scrollLeft`) is preserved when panel height changes.
14. Each splitter has `role="separator"`, `aria-orientation`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`.
15. Each splitter is focusable (`tabIndex={0}`) and responds to Arrow, Home, End, and Enter/Space keyboard controls.
16. `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes with zero errors.
17. No hardcoded hex color values — all colors reference `C.*` tokens.

---

## Definition of Done

- All 17 acceptance criteria pass.
- Tech Lead has reviewed the pointer event implementation and confirmed the BFC non-regression.
- UAT has run the Sprint 3-F test checklist for splitter scenarios with zero P0/P1 defects.
- Handoff doc committed to `docs/handoffs/resizable-panels-fe.md`.
- STATUS.md updated by Tech Lead.
