# Spec: Invite Flow Modal

**Status:** Implemented.
**Source:** `src/App.tsx` — `InviteModal` component, lines 1904–1955.

---

## Trigger

The modal opens when the `"+ Invite"` button in the TransportBar is clicked (`setShowInvite(true)`). It also closes on `Escape` keydown (global listener added on mount, removed on unmount).

---

## Overlay

A `div.fixed.inset-0.z-50.flex.items-center.justify-center` with `background: rgba(0,0,0,0.7)`. Clicking the overlay closes the modal (`onClick={onClose}`). The modal card stops propagation (`onClick={e => e.stopPropagation()}`).

The overlay uses `z-50` — this is correct as the highest z-index layer in the app.

---

## Modal card

`div.rounded-xl.p-6.shadow-2xl`, `width: 384px` (`w-96`). `background: C.elevated` (`#1A1A24`). `border: 1px solid C.control` (`#2A2A38`).

Not centered in a `flex-col` — it centers via the overlay's `flex items-center justify-center`. The card has no close button (only Escape and clicking the overlay). Flag: consider adding an explicit close button for users who do not know the Escape convention.

---

## Card content — default state

### Header
- Title: `"Invite a collaborator"` — `text-base font-semibold`, `color: C.textPri`. `mb-1`.
- Subtitle: `"They'll join the live session with the role you assign."` — `text-sm`, `color: C.textSec`. `mb-5`.

### Email field
- Label: `"Email address"` — `block text-xs mb-1`, `color: C.textSec`.
- Input: `type="email"`, `placeholder="friend@studio.com"`. `w-full rounded px-3 py-2 text-sm mb-4`. `background: C.well`, `border: 1px solid C.control`, `color: C.textPri`, `outline: none`. No explicit focus ring in inline styles — relies on App.css global focus-visible rule (`outline: 2px solid C.accent`). ARIA: `aria-label="Email address"` should be added (label/input are not programmatically associated via `for`/`id` — this is an accessibility gap).

### Role picker
- Label: `"Role"` — `block text-xs mb-2`, `color: C.textSec`.
- Two toggle buttons in `flex gap-2 mb-6`:
  - `Editor` — `flex-1 rounded py-1.5 text-sm font-medium transition-all hover:brightness-110`. Selected: `background: C.accent`, `color: #fff`, `border: 1px solid C.accent`. Unselected: `background: C.control`, `color: C.textSec`, `border: 1px solid transparent`.
  - `Viewer` — same structure, same states.
  - These function as a radio group. They need `role="radiogroup"` on the container, `role="radio"` on each button, and `aria-checked` reflecting selection state.

### Action buttons
Two buttons in `flex gap-2`:
- **Cancel** — `flex-1 rounded py-2 text-sm transition-all hover:brightness-110`, `background: C.control`, `color: C.textSec`.
- **Send invite** — `flex-1 rounded py-2 text-sm font-semibold transition-all hover:brightness-110`. Active (email filled): `background: C.accent`, `color: #fff`, `cursor: pointer`. Disabled (empty email): `disabled` attribute + `opacity: 0.4` via `disabled:opacity-40` Tailwind class, `cursor: not-allowed`.

---

## Card content — sent state

After `handleSend()` is called (stub — no real API call), `sent` becomes `true`. The form area is replaced with:

`"Invite sent!"` — `text-sm text-center py-4`, `color: C.success`. After 1200ms, `onClose()` is called automatically and the modal dismisses.

There is no error state (e.g., invalid email, API failure). Flag for Tech Lead: when real invite API is wired, error handling must be added here.

---

## Loading state

Not implemented. The 1200ms timeout after `setSent(true)` simulates async resolution. When the real API call is introduced, a loading spinner should replace the Send button during the request. Use the same `animate-spin` spinner already present in the BounceModal render button as the pattern.

---

## Interactive states — complete

| Element | Idle | Hover | Focus | Active | Disabled |
|---|---|---|---|---|---|
| Overlay | `rgba(0,0,0,0.7)` | — | — | closes modal | — |
| Email input | `C.well` bg, `C.control` border | — | `2px solid C.accent` outline | — | — |
| Role buttons | `C.control` bg | `brightness-110` | `2px solid C.accent` outline | `C.accent` bg (selected) | — |
| Cancel button | `C.control` bg | `brightness-110` | `2px solid C.accent` outline | — | — |
| Send button | `C.accent` bg | `brightness-110` | `2px solid C.accent` outline | — | `opacity: 0.4`, `cursor: not-allowed` |

---

## Keyboard navigation

1. Modal opens — focus should trap inside the modal. Currently focus is not trapped or auto-set on open. Flag for FE: implement focus trap (focus the email input on open, Tab cycles through email → role buttons → Cancel → Send, Shift+Tab in reverse, Escape closes).
2. Escape closes the modal via the global keydown listener.
3. Enter on the email input should not auto-submit (no `form` element, so Enter does not trigger submission by default — this is acceptable).

---

## ARIA

Missing attributes:
- `role="dialog"` on the modal card.
- `aria-modal="true"` on the modal card.
- `aria-labelledby` pointing to the title `h2`.
- `id` on the `h2` to match `aria-labelledby`.
- `for`/`id` association between the `label` and `input`.
- `role="radiogroup"` + `role="radio"` + `aria-checked` on the role picker.

These are blocking accessibility issues for the invite flow.

---

## Collaborator color tinting

None in this modal. The modal is role-assignment UI, not collaborator-presence UI. When the invited user joins, their avatar will appear in the transport bar with whatever color they are assigned. Color assignment on invite is out of scope for this modal — see PM open question in handoff.

---

## DAW convention callouts

Invite flows are not a DAW convention at all — this is a collaboration layer on top of the DAW. No muscle memory conflicts to flag. The modal chrome (Escape to close, overlay click to close) follows standard web modal convention.

---

## Implement this first

Focus trap: on modal open, set focus to the email input and constrain Tab/Shift+Tab to the modal's interactive elements. Without this, keyboard users can interact with elements behind the overlay, which is a critical UX and accessibility failure.
