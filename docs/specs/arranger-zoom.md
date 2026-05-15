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

**[PLACEHOLDER — Designer fills this section in Ticket 3-B]**

Designer: research keyboard shortcut conventions across Ableton Live 12, Logic Pro 11, Pro Tools 2024, and Reaper 7. Define the following for each axis, then write the final spec below:

1. **Horizontal zoom in:** key or gesture?
2. **Horizontal zoom out:** key or gesture?
3. **Horizontal zoom reset to 1.0×:** key?
4. **Zoom anchor:** does zoom center on the playhead, the cursor position, or the viewport center?
5. **Scroll wheel behavior:** does the scroll wheel scroll the timeline or zoom it? Does a modifier key toggle?
6. **Vertical zoom in (per track):** key or gesture? Where is the control in the track header UI?
7. **Vertical zoom out (per track):** key or gesture?
8. **Vertical zoom reset for a track:** key?
9. **Ruler tick subdivision threshold:** adjust the `zoomX` breakpoints in the ruler tick density table above if needed.
10. **Zoom indicator format:** `"100%"` or `"1×"` or `"72px/bar"`?
11. **Zoom indicator placement:** where in the arranger toolbar area?
12. **Scroll behavior at extreme zoom:** at 0.25×, `barW * BARS = 576px` — the scroll container shrinks. At 4.0×, `barW * BARS = 9216px` — the scroll container grows. Confirm this is the desired behavior (correct answer: yes, the scroll container width is always `barW * BARS`).

**Until this section is filled, Ticket 3-D keyboard shortcut implementation is blocked.**

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
