# Spec: Arranger Zoom — Horizontal + Vertical (FR-02)

**Version:** 1.0
**Date:** 2026-05-15
**Sprint:** 3 — Tickets 3-D (horizontal) and 3-E (vertical)
**Status:** Partial — `§Interaction Model` is a placeholder pending Designer research (Ticket 3-B)
**FR:** `docs/features/FR-2026-05-14-02-multitrack-horizontal-vertical-zoom.md`

**Do NOT start Ticket 3-D until:**
1. Tech Lead ADR (Ticket 3-A) is committed — zoom state architecture must be decided.
2. Designer has filled `§Interaction Model` below (Ticket 3-B) — keyboard shortcuts must be specified before implementation.

**FE may begin the `barW` substitution pass** (replacing all `BAR_W` usages in arranger math with `barW`) before 3-B is complete. The shortcut implementation requires 3-B.

---

## Problem

At the default zoom level (`BAR_W = 72px`), a 32-bar session spans 2304px. Fade handles are 12px wide. At this density, placing a crossfade accurately requires pixel-perfect pointer control. Professional DAWs solve this by letting engineers zoom in to sub-bar precision for fine editing and zoom out to see the full arrangement. Without zoom, precise clip editing in DAWin is unnecessarily difficult.

Vertical zoom compounds the issue: a `TRACK_H` of 64px is barely enough to read a waveform label, let alone inspect transients. Per-track vertical expansion is standard in every professional DAW.

---

## User Story

As a session engineer editing clips, I want to zoom the arranger timeline in and out horizontally so I can place fades and cuts with precision, and expand individual tracks vertically to inspect waveform detail — all without leaving the session room.

---

## Horizontal Zoom Model

### Core abstraction

`BAR_W` remains a fixed constant. All arranger rendering uses a derived `barW`:

```typescript
const BAR_W = 72  // base constant — never changes, never used directly in arranger render

// At App root (or zoom-aware context — Tech Lead decides in ADR):
const barW = BAR_W * zoomX  // all arranger calculations use barW, not BAR_W
```

**Tech Lead must decide in Ticket 3-A** whether `barW` is:
- **(a) Prop drilling:** computed at App root, passed as a prop to all arranger components ← recommended for single-file constraint
- **(b) React context:** consumed at each calculation site

Pick one. Do not mix patterns.

### Zoom state

```typescript
// At App root
const [zoomX, setZoomX] = useState<number>(1.0)
```

| Property | Value |
|---|---|
| Default | `1.0` (100%, `barW = 72px`) |
| Minimum | `0.25` (25%, `barW = 18px`) |
| Maximum | `4.0` (400%, `barW = 288px`) |
| Keyboard/button step | `0.25` (Designer may adjust in §Interaction Model) |
| Clamp | `setZoomX(prev => Math.max(0.25, Math.min(4.0, next)))` |

### Complete audit: every `BAR_W` usage to replace with `barW`

Search `src/App.tsx` for every occurrence of `BAR_W` in arranger rendering and interaction handlers. **Every one of these must become `barW`.** After this ticket, `grep -n "BAR_W" src/App.tsx` must return only the constant declaration line.

| Calculation | Before | After |
|---|---|---|
| Clip `x` position | `clip.bar * BAR_W` | `clip.bar * barW` |
| Clip `width` | `clip.len * BAR_W` | `clip.len * barW` |
| Fade-in handle width | `clip.fadeIn * BAR_W` | `clip.fadeIn * barW` |
| Fade-out handle x offset | `(clip.len - clip.fadeOut) * BAR_W` | `(clip.len - clip.fadeOut) * barW` |
| Crossfade zone width | `overlap * BAR_W` | `overlap * barW` |
| Ruler tick positions | `bar * BAR_W` | `bar * barW` |
| Playhead `x` | `playheadBar * BAR_W` | `playheadBar * barW` |
| Seek on ruler click | `clientX / BAR_W` | `clientX / barW` |
| Clip resize delta | `deltaX / BAR_W` | `deltaX / barW` |
| Clip move delta | `deltaX / BAR_W` | `deltaX / barW` |
| Cut position | `clickX / BAR_W` | `clickX / barW` |
| Fade handle drag delta | `deltaX / BAR_W` | `deltaX / barW` |
| Crossfade bezier midpoint drag | `deltaX / BAR_W` | `deltaX / barW` |
| Arranger canvas total width | `BARS * BAR_W` | `BARS * barW` |

### Scroll position preservation on zoom

When `zoomX` changes, preserve the playhead's visible position by recalculating `scrollLeft` before the new zoom renders:

```typescript
const onZoom = (nextZoom: number) => {
  const clamped = Math.max(0.25, Math.min(4.0, nextZoom))
  const nextBarW = BAR_W * clamped
  const anchorBar = playheadBar  // or center of current scroll if playhead is off-screen
  const newScrollLeft = anchorBar * nextBarW - arrangerViewportWidth / 2
  setZoomX(clamped)
  // Apply scrollLeft after state update via a ref or useLayoutEffect
  requestAnimationFrame(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = Math.max(0, newScrollLeft)
    }
  })
}
```

Designer may adjust the anchor behavior in §Interaction Model (cursor-centered vs. playhead-centered).

### Ruler tick density at different zoom levels

| `zoomX` range | Ruler behavior |
|---|---|
| `>= 2.0` | Show quarter-note subdivisions; bar labels every bar |
| `1.0 – 2.0` | Bar numbers only (current behavior) |
| `< 1.0` | Bar numbers; suppress alternating labels when `barW < 36px` |

Designer may refine these thresholds in §Interaction Model.

---

## Vertical Zoom Model

### Core abstraction

`TRACK_H` remains a fixed constant. Per-track height is derived:

```typescript
const TRACK_H = 64  // base constant — never changes

// Derived per track:
const getTrackH = (trackId: string): number => TRACK_H * (trackZoomY[trackId] ?? 1.0)
```

### Zoom state

```typescript
// At App root
const [trackZoomY, setTrackZoomY] = useState<Record<string, number>>({})
```

| Property | Value |
|---|---|
| Default (key absent) | `1.0` (`trackH = 64px`) |
| Minimum | `0.5` (`trackH = 32px`) |
| Maximum | `3.0` (`trackH = 192px`) |
| Step | `0.25` |

Set a single track's zoom:

```typescript
const setTrackZoom = (trackId: string, next: number) => {
  setTrackZoomY(prev => ({
    ...prev,
    [trackId]: Math.max(0.5, Math.min(3.0, next))
  }))
}
```

### What must update when `trackZoomY[trackId]` changes

| Element | Change |
|---|---|
| Track row height in arranger | `height: getTrackH(trackId)` |
| Clip height within that track | `height: getTrackH(trackId) - 2` (2px vertical padding) |
| Fade handle vertical range | `[0, getTrackH(trackId)]` |
| Waveform canvas height | scales with track height |

### What must NOT change when `trackZoomY[trackId]` changes

| Element | Reason |
|---|---|
| **Mixer strip height** | Mixer is independent of arranger track height. The mixer strip for each track uses the global `TRACK_H` and is not affected by vertical zoom. |
| **VU meter segment count** | VU meters are in the mixer, not the arranger. Unchanged. |
| **Horizontal zoom (`zoomX`)** | Per-track vertical zoom is fully independent. |
| **Other tracks** | Zooming track 3 does not change track 2 or track 4. |

---

## §Interaction Model

**Status: Complete — Ticket 3-B fulfilled by Designer, 2026-05-29**

---

### 1. Horizontal zoom keyboard shortcuts

**Convention rationale:** Ableton Live uses `+` / `-` on the numeric keypad (no modifier). Logic Pro uses `Cmd+=` / `Cmd+-`. Pro Tools uses `Cmd+]` / `Cmd+[`. Reaper uses `Ctrl+=` / `Ctrl+-`. In a browser context, `Cmd+W` closes the tab, `Cmd+N` opens a new window, and `Cmd+T` opens a new tab — these must be avoided. `Cmd+=` and `Cmd+-` are browser-reserved in most contexts (browser zoom). The safest and most cross-DAW-familiar option for a browser app is the unmodified `=` and `-` keys (Ableton-style), which are free in all major browsers when focus is not in an input. This matches the existing tool-shortcut philosophy in the codebase (unmodified single-key shortcuts: `v`, `c`, `?`).

| Action | Key | Notes |
|---|---|---|
| Zoom in (horizontal) | `=` (no modifier) | Same physical key as `+` without Shift; matches Ableton convention |
| Zoom out (horizontal) | `-` (no modifier) | Free in all browsers when not in input/textarea |
| Reset to 1.0× (horizontal) | `0` (no modifier) | Ableton: `0` resets zoom; matches muscle memory |

**Implementation note:** Add these three cases to the existing global `onKeyDown` handler in `src/App.tsx` (the `useEffect` at line ~6200). Guard conditions already present in that handler — `if (tag === 'INPUT' || tag === 'TEXTAREA') return` — cover these keys correctly. Each keypress calls `onZoom(zoomX + 0.25)`, `onZoom(zoomX - 0.25)`, or `onZoom(1.0)` respectively. Clamp is enforced inside `onZoom`.

**Vertical zoom keyboard shortcuts (per-track):** Vertical zoom is not keyboard-driven in Sprint 9. It is controlled exclusively via the expand/contract chevron buttons in the track header (see §Vertical Zoom Controls below). Keyboard shortcuts for vertical zoom are deferred to a future sprint to avoid key-space conflicts.

---

### 2. Scroll wheel behavior

**Default (no modifier):** The scroll wheel scrolls the arranger timeline horizontally. This is the standard browser and DAW behavior. Do not intercept or redirect unmodified scroll events — they should pass through to the arranger's horizontal scroll container naturally.

**Modifier + scroll = zoom:** Holding `Ctrl` (Windows/Linux) or `Cmd` (Mac) while scrolling triggers horizontal zoom instead of scroll. Use `isMod = e.metaKey || e.ctrlKey` — this pattern is already established in `src/App.tsx` (line 4716). When `isMod` is true on a wheel event: call `onZoom(zoomX + delta)` where `delta` is derived from `e.deltaY`.

**Zoom step per wheel tick:** `0.25` per tick is confirmed. `e.deltaY` is typically `±100` for a standard wheel tick (browser-normalized). Map it as: `delta = e.deltaY < 0 ? +0.25 : -0.25`. Scrolling up (negative `deltaY`) zooms in; scrolling down (positive `deltaY`) zooms out. This matches Ableton and Logic trackpad convention.

**Passive event listener:** The wheel event listener must be registered with `{ passive: false }` so that `e.preventDefault()` can suppress the native scroll when `isMod` is true. If registered passively, calling `preventDefault()` will throw a console warning and fail silently — the browser will still scroll. The FE must attach this listener imperatively via `addEventListener('wheel', handler, { passive: false })`, not via React's synthetic `onWheel` prop (which defaults to passive in React 17+).

**Exact implementation pattern:**
```typescript
// Attach in useEffect on the arranger scroll container ref
arrangerScrollRef.current?.addEventListener('wheel', onWheel, { passive: false })

function onWheel(e: WheelEvent) {
  const isMod = e.metaKey || e.ctrlKey
  if (!isMod) return  // let native horizontal scroll proceed
  e.preventDefault()
  const delta = e.deltaY < 0 ? 0.25 : -0.25
  onZoom(zoomX + delta)
}
```

---

### 3. Zoom anchor behavior

**Primary anchor: playhead position.** When `zoomX` changes, the playhead must remain at the same horizontal screen position it occupied before the zoom. This is the standard DAW behavior (Ableton, Logic, Pro Tools all anchor to playhead when zooming via keyboard). It means the viewport scrolls so that `playheadBar * nextBarW` lands at the same screen x-coordinate as `playheadBar * prevBarW` was.

The scroll-to-playhead implementation in `§Horizontal Zoom Model` above is confirmed:
```typescript
const newScrollLeft = anchorBar * nextBarW - arrangerViewportWidth / 2
```
This centers the playhead in the viewport after zoom. This is the correct behavior.

**Fallback anchor: viewport center.** When the playhead is off-screen (i.e., `playheadBar * barW < scrollLeft` or `playheadBar * barW > scrollLeft + viewportWidth`), anchor to the current viewport center instead:
```typescript
const anchorBar = isPlayheadVisible
  ? playheadBar
  : (scrollLeft + arrangerViewportWidth / 2) / prevBarW
```
"Playhead is visible" means `playheadBar * barW` is within `[scrollLeft, scrollLeft + arrangerViewportWidth]` at the moment zoom is triggered.

**Keyboard shortcut anchor:** The same anchor logic applies when zoom is triggered by `=` / `-` key. There is no cursor position available for keyboard-triggered zoom; the playhead/viewport-center fallback above is the complete logic.

**Scroll wheel anchor:** When zoom is triggered by `Ctrl/Cmd + scroll`, anchor to the cursor position (the mouse pointer's x position over the arranger) rather than the playhead. This matches browser zoom conventions and gives the user precision control when hovering over a region of interest. Compute anchor bar as `(e.clientX - arrangerLeft + scrollLeft) / barW`.

---

### 4. Zoom level indicator

**Format:** `"{Math.round(zoomX * 100)}%"` — confirmed. Examples: `"25%"`, `"100%"`, `"400%"`. This is the clearest format for a non-engineer user and avoids ambiguity with `"1×"` (which implies different things in different DAWs) or `"72px/bar"` (which exposes implementation detail).

**Placement:** Right side of the ruler bar, flush right, before the ruler ticks end. Specifically: absolutely positioned within the ruler row, `right: 8px`, vertically centered. It sits in the ruler row (`RULER_H = 24px`) so it does not consume arranger real estate. It must not overlap the last few ruler tick labels — the FE should ensure there is at least 48px of clear space to the left of the indicator text (the text itself is at most ~36px wide at 11px monospace for "400%").

**Visual spec:**
- Color: `C.textSec`
- Font size: 11px
- Font: monospaced (use `font-variant-numeric: tabular-nums` or `font-family: monospace`)
- No background, no border, no padding box
- `pointer-events: none` — it must not intercept click events intended for the ruler
- `user-select: none`
- `aria-hidden="true"` — this is a visual readout, not meaningful to screen readers (the zoom level is communicated via keyboard shortcut context elsewhere)

---

### 5. Pinch gesture scope

**Out of scope for Sprint 9.** This product is desktop-first (minimum 1280px). Trackpad pinch-to-zoom is a separate gesture system requiring `GestureEvent` or `TouchEvent` handling with cross-browser inconsistencies (Safari exposes `GestureEvent`; Chrome and Firefox do not). It is deferred. Note for future sprint scoping: if pinch is added, it must use the same `onZoom` function and the same anchor logic defined in §3 above.

---

### 6. Ruler tick subdivision thresholds

The thresholds in `§Horizontal Zoom Model` are confirmed with one clarification:

| `zoomX` range | `barW` at this range | Ruler behavior |
|---|---|---|
| `>= 2.0` | `>= 144px` | Show quarter-note subdivisions (tick at every beat); bar numbers every bar |
| `1.0 – <2.0` | `72px – <144px` | Bar numbers only (current behavior) |
| `0.5 – <1.0` | `36px – <72px` | Bar numbers; render every bar label |
| `< 0.5` | `< 36px` | Bar numbers; suppress every other bar label (`bar % 2 !== 0` labels omitted) |

**Clarification on the `< 1.0` threshold:** the original spec said "suppress alternating labels when `barW < 36px`." At `zoomX = 0.5`, `barW = 36px` exactly, which is the boundary. The correct implementation: suppress alternating labels when `barW < 36px` (strictly less than), meaning at `zoomX < 0.5`. At exactly 36px, all labels render. This avoids a label density jump at 0.5×.

**Quarter-note subdivisions at `>= 2.0×`:** subdivisions are short tick marks (half the height of bar ticks) at beat positions 2, 3, 4 within each bar. They carry no label. Color: `C.textSec` at 40% opacity (use `opacity: 0.4` inline style).

---

### 7. Vertical zoom controls (track header UI)

Vertical zoom is controlled via two icon buttons in each track header, and is not keyboard-driven in Sprint 9.

**Expand button:** chevron-down icon (`▾`), positioned in the track header, bottom-right quadrant. `aria-label="Expand track"`. On click: `setTrackZoom(trackId, trackZoomY[trackId] + 0.25)`. Disabled (opacity 0.3, `pointer-events: none`) when track is at maximum (`3.0×`).

**Collapse button:** chevron-up icon (`▴`), adjacent to expand button. `aria-label="Collapse track"`. On click: `setTrackZoom(trackId, trackZoomY[trackId] - 0.25)`. Disabled when track is at minimum (`0.5×`).

**Reset:** Double-clicking either button resets the track to `1.0×`. `aria-label` for double-click behavior is communicated via `title="Double-click to reset"` tooltip.

Both buttons: `focus-visible` ring using `C.accent`, 16×16px hit target minimum (can be 12×12px visually inside a 16×16px button).

---

### 8. Scroll container width at extreme zoom

Confirmed: the arranger scroll container width is always `barW * BARS`. At 0.25×, `barW * BARS = 576px` — the scroll container shrinks and a short session fits entirely within most viewport widths without scrolling. At 4.0×, `barW * BARS = 9216px` — the scroll container grows and the user must scroll to reach late bars. Both extremes are correct. The FE must set `width: barW * BARS` (in pixels, via inline style) on the inner arranger canvas element, not on the scroll container itself — the scroll container has `overflow-x: auto` and takes the full available width.

---

## Zoom Level Indicator

A read-only zoom readout in the arranger toolbar:

- **Format:** `"{Math.round(zoomX * 100)}%"` e.g. "100%", "25%", "400%" (Designer may change in §Interaction Model)
- **Color:** `C.textSec` (`#888899`)
- **Size:** 11px, monospaced or tabular figures
- **No background** — inline text only
- **No interaction** — read-only display, not a button
- **Updates live** as `zoomX` changes

---

## State Summary

```typescript
// Both at App root — the only source of truth for zoom
const [zoomX,       setZoomX]       = useState<number>(1.0)
const [trackZoomY,  setTrackZoomY]  = useState<Record<string, number>>({})

// Derived — never stored in state
const barW      = BAR_W * zoomX
const getTrackH = (id: string) => TRACK_H * (trackZoomY[id] ?? 1.0)
```

**Collaboration scope (per Tech Lead ADR Ticket 3-A):** Zoom is local-only for Sprint 3. Each collaborator controls their own zoom. State must not preclude future sync — use plain serializable values (`number`, `Record<string, number>`) that could be sent over WebSocket without transformation.

---

## Must-Not-Break List

1. **Clip drag snap:** `Math.round(deltaX / barW)` gives bar delta. Confirm bar-snapping is correct at 0.25× and 4.0×.
2. **Clip resize:** Left and right handle drag use `deltaX / barW`. Confirm correct at both extremes.
3. **Ruler click seek:** `clickX / barW` gives playhead bar. Confirm at 0.25× and 4.0×.
4. **Cut tool:** `clickX / barW` gives cut position. Confirm cut splits at correct bar at all zoom levels.
5. **Fade handle drag:** `deltaX / barW` gives fade length delta. Confirm fade-in and fade-out handles at 4.0×.
6. **Crossfade bezier midpoint drag:** Same scaling. Confirm at 4.0×.
7. **VU rAF loop:** Does not reference `BAR_W` or `TRACK_H`. Confirm it continues uninterrupted through zoom changes.
8. **Mixer strip heights:** Fixed at `TRACK_H`. Confirm mixer strip height does not change when `trackZoomY` changes.
9. **Arranger scroll container width:** At 0.25× zoom, `barW * BARS = 576px`. At 4.0×, `barW * BARS = 9216px`. The scroll container `width` must always be `barW * BARS`. Confirm clips at bar 31 are reachable at 0.25×.
10. **FX panel positioning:** Zoom changes must not affect the FX panel. The FX panel is not inside the arranger scroll container.
11. **No `BAR_W` remaining in arranger render:** After this ticket, `grep -n "BAR_W" src/App.tsx` returns only the constant declaration line. Zero remaining usages in any calculation.

---

## Acceptance Criteria

### Horizontal zoom (Ticket 3-D)

1. Zooming in increases `zoomX`; clip positions, widths, ruler ticks, and playhead scale correctly.
2. Zooming out decreases `zoomX`; same elements scale correctly.
3. `zoomX` cannot go below 0.25 or above 4.0.
4. The zoom level indicator in the toolbar shows the current zoom as a percentage, updated live.
5. Dragging a clip at any zoom level drops it at the correct bar position.
6. Resizing a clip at any zoom level produces the correct `len` value.
7. Clicking the ruler at any zoom level seeks the playhead to the correct bar.
8. Cutting a clip at any zoom level splits at the correct bar.
9. Fade-in and fade-out handles drag correctly and produce correct fade lengths at any zoom level.
10. The arranger scroll container width updates with zoom — clips at bar 31 are reachable at 0.25×.
11. Zoom anchors to the playhead position (or viewport center if playhead is off-screen) — the user does not lose their place in the timeline on zoom.
12. Keyboard shortcuts from §Interaction Model are implemented and functional.

### Vertical zoom (Ticket 3-E)

13. Expanding a track with vertical zoom increases its row height in the arranger; all other tracks are unaffected.
14. Contracting a track decreases its row height; clip content scales with the row.
15. `trackZoomY` for any track cannot go below 0.5 or above 3.0.
16. The mixer strip height for a vertically-zoomed track does not change.
17. VU meters continue animating correctly after vertical zoom changes.

### Non-regression (both tickets)

18. `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes with zero errors.
19. No hardcoded hex colors — all colors reference `C.*` tokens.
20. `grep -n "BAR_W" src/App.tsx` returns only the constant declaration line after Ticket 3-D.
21. VU rAF loop continues at 60fps at all zoom levels (verify via DevTools Performance panel).

---

## Definition of Done

- All 21 acceptance criteria pass.
- §Interaction Model is filled by Designer (Ticket 3-B) and shortcuts implemented per that spec.
- Tech Lead has reviewed the zoom abstraction (`barW`, `getTrackH`) and approved against the ADR.
- UAT (Ticket 3-F) has run the zoom test checklist with zero P0/P1 defects.
- Handoff doc committed to `docs/handoffs/arranger-zoom-fe.md`.
- STATUS.md updated by Tech Lead.
