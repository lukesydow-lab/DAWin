# Handoff: Status Bar

**Spec:** `docs/specs/status-bar.md`
**Date:** 2026-05-10
**Designer:** UX/UI Agent

---

## What this covers

The 28px footer: status text, online presence avatars with ping animation, CPU/RAM/latency readouts.

---

## Implementation confirmed

Read `src/App.tsx` lines 1958–1982. Implementation matches the spec. No conflicts.

---

## Gaps vs. spec (to be implemented)

1. **aria-live="polite"** on the status text span — needed so screen readers announce status changes.
2. **aria-hidden="true"** on the ping dot animation spans — purely decorative.
3. All display values are hardcoded. When real data is available: status, online count, CPU, RAM, and latency must become reactive props.

---

## Open questions for PM

1. **Status states:** What statuses beyond "Ready" should the bar display? Candidates: Recording, Rendering, Exporting, Syncing, Offline, Error. Define the full state machine before implementation.

2. **Disconnected state:** When network connection drops, what does the status bar show? Recommend: status changes to `"Disconnected"` in `C.danger` text, latency changes to `"—"`, online count to `"0 online"`.

---

## Open questions for Tech Lead

None. No implementation complexity at this stage — status bar is display only.

---

## FE implementation priority

No design work blocking here. Add the two ARIA attributes during the accessibility pass for the full app.
