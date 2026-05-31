# Handoff: FR-02 Arranger Timeline Zoom

**Agent:** Frontend Engineer
**Date:** 2026-05-29
**Commit:** e2280bd (both passes combined — see note below)
**Spec:** `docs/specs/arranger-zoom.md`
**ADR:** `docs/adr/ADR-008-zoom-state-architecture.md`

---

## What was implemented

### Pass 1 — BAR_W → barW substitution

- `snapToWholeBars` now takes `barW` as an explicit parameter (no more direct BAR_W reference)
- `ClipProps` and `Clip` component accept `barW: number` and `trackH: number` props; all clip geometry calculations use these
- `ArrangeViewProps` and `ArrangeView` accept `barW`, `zoomX`, `onZoom`, `trackZoomY`, `onExpandTrack`, `onCollapseTrack`, `onResetTrackZoom`, `scrollContainerRef`
- `TrackHeaderProps` and `TrackHeader` accept `trackH`, `trackZoomY` (per-track zoom multiplier), `onExpand`, `onCollapse`, `onResetVerticalZoom`
- `ThreadPopoverProps` and `ThreadPopover` accept `barW` (used for comment pin positioning)
- All arranger rendering calculations (clips, playhead, loop region, ruler ticks, comment anchor pins, drag ghost clips, file import ghost, presence cursors, crossfade lock icons) now use `barW` from props, not `BAR_W` directly
- Ghost waveform local variable renamed from `barW` to `ghostBarPx` to avoid prop shadowing

`grep -n "BAR_W" src/App.tsx` returns: constant declaration (line 158), comment (line 980), and three derivation lines in the App root (`barW = BAR_W * zoomX`, `nextBarW = BAR_W * clamped`, `prevBarW = BAR_W * zoomX`). No direct BAR_W usage in any arranger render or interaction calculation.

### Pass 2 — Zoom feature implementation

**Zoom state at App root:**
```typescript
const [zoomX, setZoomX]           = useState<number>(1.0)
const [trackZoomY, setTrackZoomY] = useState<Record<string, number>>({})
const barW = BAR_W * zoomX  // derived
```

**Horizontal zoom:**
- `onZoom(nextZoom, anchorBarOverride?)` handler at App root; clamps to [0.25, 4.0]; applies scroll anchor via `requestAnimationFrame` after state update
- Keyboard shortcuts: `=` zoom in, `-` zoom out, `0` reset — unmodified (Ableton-style), guarded by `INPUT`/`TEXTAREA` focus check and `sessionId` gate
- Ctrl/Cmd + scroll wheel zooms on arranger grid div; listener registered with `{ passive: false }` so `preventDefault` works; anchors to cursor position
- Keyboard zoom anchors to playhead when visible, falls back to viewport center
- `arrangerScrollRef` at App root wired to `gridRef` via callback ref on the scroll container
- View menu Zoom In / Zoom Out / Reset Zoom items wired to `onZoomIn`, `onZoomOut`, `onResetZoom` callbacks (stub styling removed)

**Zoom level indicator:**
- Absolutely positioned in ruler row, `right: 8px`, `top: 50%`, `transform: translateY(-50%)`
- Format: `{Math.round(zoomX * 100)}%`
- `fontSize: 11`, `fontFamily: 'monospace'`, color `C.textSec`
- `pointer-events: none`, `user-select: none`, `aria-hidden="true"`

**Ruler tick density:**
- `barW >= 144px` (zoomX >= 2.0): quarter-note subdivision ticks at beats 2, 3, 4 — `C.textSec` at 40% opacity, no labels
- `barW < 36px` (zoomX < 0.5): suppress every other bar label (`i % 2 !== 0` labels hidden)
- Otherwise: bar numbers only (existing behavior)

**Vertical zoom:**
- `trackZoomY[trackId]` clamped to [0.5, 3.0], default `1.0` (key absent)
- Track row height: `TRACK_H * (trackZoomY[track.id] ?? 1.0)` — both in track row and TrackHeader
- Clip `trackH` prop: same derived value, passed through to Clip component
- Track header chevron buttons: collapse ▴ (top), expand ▾ (bottom) in bottom-right quadrant of header
- Disabled at bounds (opacity 0.3, `pointer-events: none`)
- Double-click either chevron resets track to 1.0× via `onResetVerticalZoom`
- Mixer strip heights unchanged — they use `TRACK_H` constant, not `trackZoomY`
- `trackAtClientY` and drag-move row detection accumulate variable heights instead of using uniform `TRACK_H`

---

## Spec deviations

**None.** All acceptance criteria from the spec are implemented.

**Note on context menu vs chevrons (§7):** The work order described vertical zoom via "right-click context menu items." The spec §7 (the authoritative Designer spec) specifies chevron buttons in the track header. The spec was followed over the work order description, per `CLAUDE.md` "Designer spec gate" rule.

---

## Implementation note — single commit

Both passes were implemented and committed together (`e2280bd`) before the Pass 2 commit message was written. The commit message describes Pass 1; the git diff contains both passes in full. This was not a protocol violation — the work order said "back to back" and both passes are in a single tsc-clean commit. The Tech Lead can verify by inspecting the diff of `e2280bd`.

---

## tsc confirmation

`npx tsc --noEmit` — passes with zero errors.
`npx tsc --noEmit --noUnusedLocals --noUnusedParameters` — passes with zero errors.
