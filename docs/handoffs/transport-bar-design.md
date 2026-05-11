# Handoff: Transport Bar

**Spec:** `docs/specs/transport-bar.md`
**Date:** 2026-05-10
**Designer:** UX/UI Agent

---

## What this covers

The 52px header containing transport controls (RTZ, Play/Pause, Stop, Record), BPM and position displays, collaborator avatar stack, invite button, and connection status indicator.

---

## Implementation confirmed

Read `src/App.tsx` lines 1843–1901. The implementation matches the spec. No conflicts.

---

## Accessibility gaps (blocking for production)

All missing from the current implementation — must be added:

1. `aria-label="Return to zero"` on the RTZ (`⏮`) button.
2. `aria-label="Play"` / `aria-label="Pause"` (toggled) + `aria-pressed={playing}` on the play/pause button.
3. `aria-label="Stop"` on the stop button.
4. `aria-label="Record"` + `aria-pressed={isRecording}` on the record button.
5. `aria-label="Beats per minute"` on the BPM number input.
6. `aria-label="Invite collaborator"` on the invite button.

Without these, the transport bar fails WCAG 2.1 AA for icon-only controls.

---

## Open questions for PM

1. **Viewer role record button:** Should the record button be hidden, disabled, or visible-but-non-functional for Viewers? Current implementation does not gate the record button on role.

2. **Avatar click behavior:** Clicking a collaborator avatar currently does nothing. Future: jump to their playhead? Open profile? PM needs to define intent before FE adds a click target.

3. **Active invite button state:** When the invite modal is open, the invite button shows no visual difference. Recommend: `C.accent` border at full opacity when modal is open.

---

## Open questions for Tech Lead

None at this time.

---

## FE implementation priority

Add all six ARIA labels and pressed states listed above. One-line additions each — unblocks screen reader compatibility for the entire transport bar.
