# Handoff: Invite Flow Modal

**Spec:** `docs/specs/invite-flow.md`
**Date:** 2026-05-10
**Designer:** UX/UI Agent

---

## What this covers

The InviteModal component: overlay, card, email input, role picker, action buttons, sent state.

---

## Implementation confirmed

Read `src/App.tsx` lines 1904–1955. The implementation matches the spec. No visual conflicts.

---

## Accessibility gaps (blocking)

1. **Focus trap:** Modal does not trap focus. Tab can escape to behind-overlay elements.
2. **Auto-focus on open:** Email input does not receive focus when modal opens.
3. **role="dialog" + aria-modal="true":** Missing from the modal card.
4. **aria-labelledby:** Modal card does not reference the title `h2`.
5. **label/input association:** `label` and `input` are not linked via `for`/`id`.
6. **Role picker ARIA:** Container needs `role="radiogroup"`, each button needs `role="radio"` + `aria-checked`.

---

## Open questions for PM

1. **Collaborator color assignment:** When an invited user joins, what color do they get? Auto-assigned from a pool, or user-chosen? The modal has no color-assignment step.

2. **Error state on invite send:** What happens if the invite fails? The current stub always succeeds. An error state is required before production.

3. **Viewer role explanation:** The modal says nothing about what Viewers can and cannot do. Should there be helper text next to the Viewer option?

---

## Open questions for Tech Lead

1. **API contract:** `handleSend` is a stub. What is the POST endpoint, payload shape, and error response format?

---

## FE implementation priority

Implement focus trap on modal open. Focus the email input automatically and constrain Tab/Shift+Tab inside the modal. Most critical UX gap — must be resolved before any user testing.
