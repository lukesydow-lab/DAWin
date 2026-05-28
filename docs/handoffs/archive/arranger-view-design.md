# Handoff: Arranger View

**Spec:** `docs/specs/arranger-view.md`
**Date:** 2026-05-10
**Designer:** UX/UI Agent

---

## What this covers

ArrangeView, Toolbar, Clip, ContextMenu, BounceModal — the center arranger panel.

---

## Implementation confirmed

Read `src/App.tsx` lines 752–1634. The implementation matches the spec. The drag engine, clip rendering, fade system, context menu, and bounce modal are all implemented correctly.

---

## Gaps vs. spec (to be implemented)

1. **Scroll sync:** Track header column (`overflow-y-auto`) and grid (`overflow-auto`) are separate scroll containers. Y-scroll is not synchronized. When tracks exceed the viewport, headers and grid rows will desync.
2. **Crossfade tool behavior:** Selectable and sets a crosshair cursor but has no implemented behavior. Stub.
3. **Context menu ARIA:** `role="menu"` and `role="menuitem"` missing.
4. **Tool button ARIA:** `aria-pressed` missing from toolbar tool buttons.
5. **Ruler ARIA:** Click-to-seek ruler has no ARIA label. Add `aria-label="Timeline ruler — click to seek"`.

---

## Open questions for PM

1. **Crossfade tool:** What is the interaction model? Drag across the overlap between two adjacent clips? Click a boundary point? Pro Tools uses drag-in-overlap; Ableton uses warp mode. Which convention?

2. **Clip rename:** Context menu "Rename…" is stubbed as disabled. In scope for this milestone? If yes, F2 on a selected clip is the Pro Tools convention.

3. **Loop region:** Context menu "Loop region" is stubbed as disabled. Scope?

4. **Track add:** No "Add track" button or flow. In scope for this milestone?

---

## Open questions for Tech Lead

1. **Presence data:** `DEMO_PRESENCE` is a static array. When real-time collaboration is wired, presence must come from a WebSocket or server-sent events stream. Rendering is already correct — just needs live data.

2. **Playhead sync:** Two collaborators may have different playhead positions. The current system shows each collaborator's playhead as a colored cursor. Does the transport bar's play position affect all collaborators or only the local user?

---

## FE implementation priority

Implement Y-scroll synchronization between the track header column and the arranger grid. Structural layout requirement — without it, adding tracks beyond the viewport height breaks the core arranger UX.
