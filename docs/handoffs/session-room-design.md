# Handoff: Session Room Layout

**Spec:** `docs/specs/session-room.md`
**Date:** 2026-05-10
**Designer:** UX/UI Agent

---

## What this covers

The root `App` component shell: transport bar, arranger, mixer panel, plugin chain panel, status bar — their composition, sizing relationships, and the conditional plugin panel layout shift.

---

## Implementation confirmed

Read `src/App.tsx` lines 2218–2251. The implementation matches the spec. No conflicts.

---

## Open questions for PM

1. **Empty session state:** When a new session has no tracks, what does the arranger show? An onboarding prompt? A "Add your first track" CTA? The current implementation shows an empty grid with a ruler and no tracks. Needs a designed empty state before shipping to users.

2. **Session loading:** When real session hydration is introduced (loading from server), what is the latency budget and what does the user see during load? A full-screen skeleton? A spinner over the arranger? Needs PM + Tech Lead alignment before design work.

---

## Open questions for Tech Lead

1. **Scroll sync:** The track header column and the arranger grid are separate scroll containers. Vertical scroll is not synchronized. When tracks overflow the viewport, headers and grid rows will desync. Needs a scroll-sync solution (shared ref + scroll listener, or virtualized list).

2. **App.css color literals:** Scrollbar styles in App.css use hardcoded hex values matching `C.bg` and `C.control` but not derived from them. If tokens change, scrollbars will not update. Consider extracting to CSS custom properties.

---

## FE implementation priority

Implement the PluginChainPanel conditional layout first. Confirm the 280px panel slides in without jarring the arranger or mixer layout before proceeding to other panel work.
