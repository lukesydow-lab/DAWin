# Handoff: WP-1 Defect Fixes

**Submitted by:** Frontend Engineer  
**Date:** 2026-05-10  
**Work order:** `docs/specs/sprint1-defect-work-order.md` — WP-1

---

## What was built

Three fixes from the WP-1 defect list. The remaining WP-1 items were already implemented (see status notes below).

### Fix 1 — MixerStrip: remove isolated vol/pan state (P0 item 1)

`MixerStrip` previously initialized `vol` and `pan` as local state from `track.volume`/`track.pan`, then synced up via callbacks. This meant external changes to a track's volume or pan (e.g. future real-time sync) would not reflect in the mixer strip without a remount.

Removed `const [vol, setVol]` and `const [pan, setPan]`. The component now reads `track.volume` and `track.pan` directly and calls `onVolChange`/`onPanChange` on change without any local mirror.

### Fix 2 — Solo visual dimming (P0 item 2, partial gap)

M/S/R button wiring was already present in `TrackHeader` and the `ArrangeView` header column. The missing piece was the visual: non-soloed tracks were not dimmed when any track was soloed.

Added `const anySoloed = tracks.some(t => t.soloed)` in `ArrangeView` and updated the track row opacity to `track.muted ? 0.4 : (anySoloed && !track.soloed ? 0.4 : 1)`.

### Fix 3 — BounceModal: Escape closes modal (P1 item 6)

`InviteModal` already had an Escape listener. `BounceModal` did not. Added identical `useEffect` keydown handler in `BounceModal`.

---

## Files changed

- `src/App.tsx` — all three fixes

---

## Already-done audit (WP-1 items not touched)

| Item | Status at time of review |
|------|--------------------------|
| Wire M/S in mixer strips (item 3) | Already wired via `onToggleMute`/`onToggleSolo` callbacks in `MixerPanel` |
| Spacebar play/pause (item 4) | Already in global `keydown` handler at App level |
| V/C/X tool shortcuts (item 5) | Already in same global handler |
| Send invite CTA onClick (item 7) | `handleSend` already wired to the button |

---

## Review checklist for Tech Lead

- [ ] `MixerStrip` renders correct volume/pan from `track` prop with no local state shadow
- [ ] Soloing any track dims non-soloed arranger rows to 0.4 opacity
- [ ] Pressing Escape while BounceModal is open closes it
- [ ] No TypeScript errors (`tsc --noEmit` passes clean)
