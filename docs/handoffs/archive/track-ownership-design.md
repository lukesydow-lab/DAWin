# Handoff: Track Ownership Model

**Spec:** `docs/specs/track-ownership.md`
**Date:** 2026-05-10
**Designer:** UX/UI Agent

---

## What this covers

TrackHeader component, Avatar component, MiniBtn component, PanKnob component — the track header column in the arranger. Owner color tinting system. Record arm locking. Role-based access.

---

## Implementation confirmed

Read `src/App.tsx` lines 485–847. The implementation matches the spec with the following gaps noted.

---

## Gaps vs. spec (to be implemented)

1. **ARIA on MiniBtn (R, M, S):** `aria-label` and `aria-pressed` are missing from all three buttons. Single-letter labels are not accessible.
2. **Viewer role tooltip:** Disabled buttons have `opacity: 0.3` but no explanation. Add `title="View only"` to the disabled state.
3. **PanKnob drag interaction:** The PanKnob in the track header is read-only. The mixer strip's `Knob` component is draggable. Decision needed on whether pan is adjusted from the track header or only from the mixer.

---

## Open questions for PM

1. **PanKnob editability in track header:** Is the track header PanKnob display-only (pan set only in the mixer strip), or does it need to be interactive? If interactive — popover or in-place drag?

2. **Hover-reveal for R/M/S:** R/M/S buttons are only visible on hover. Should they be always-visible on armed or muted tracks? A muted track with an invisible mute button is a discoverability problem.

3. **Track reordering:** No drag-to-reorder for tracks is implemented. Standard DAW convention requires it. In scope?

---

## Open questions for Tech Lead

1. **lockedBy real-time sync:** The `lockedBy` field is seeded statically. When real-time collaboration is wired, this field updates via WebSocket. The TrackHeader already reads it and renders the lock indicator correctly — just needs live data.

---

## FE implementation priority

Add `aria-label` and `aria-pressed` to the R, M, and S MiniBtn elements. Three one-line additions — most impactful single accessibility change in this component.
