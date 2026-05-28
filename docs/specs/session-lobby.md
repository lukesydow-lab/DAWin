# Session Lobby — Designer Spec

**Status:** Current
**Last updated:** 2026-05-20
**Sprint:** 8
**Author:** Designer
**Implements:** Sprint 8 PM decisions (see `docs/sprints/sprint-08.md`)

> **Designer gate satisfied.** All 12 sections are complete. The Frontend Engineer may begin implementation once the Backend Engineer confirms `GET /api/v1/sessions/:id` returns `{ id, name }`.

---

## Overview

The session lobby is a full-screen takeover rendered by the `App` component when no `?session=` URL parameter is present. It is the first thing a user sees when they open DAWin. The arranger never renders without an active session — there is no blank arranger state. The lobby replaces the entire viewport with a dark, dense entry surface that matches the Neve studio aesthetic of the main app.

The lobby is not a generic SaaS landing page. It reads like the front panel of a studio rack: dark surfaces, precise typography, high-contrast interactive elements, no decorative whitespace.

When a session is created or joined, the app navigates to `?session=<id>` and the lobby unmounts. The arranger renders normally.

---

## 1. Layout

**Viewport:** Full-screen, `position: fixed; inset: 0; z-index: 200`. Background: `C.bg` (`#0A0A0F`). No scrollbar on the outer container — content is designed to fit the minimum supported viewport height.

**Vertical centering:** The lobby card and recent sessions are grouped in a single column, horizontally and vertically centered using `display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px`. The group should sit at `~45%` from the top rather than dead center (slightly above the optical center, matching physical rack panel conventions).

**Lobby card:** `width: 480px; background: C.elevated; border: 1px solid C.border; border-radius: 6px; overflow: hidden`. No fixed height — height grows with content. Minimum supported viewport is 1280×800; the card must not overflow that.

**Decorative strip:** A `4px` horizontal band of the wood texture color (`C.wood`, `#2E1A0E`) spans the full width of the card at the very top, above the wordmark. This is applied as a `div` with `height: 4px; background: C.wood; width: 100%`. This small detail anchors the card visually in the studio hardware aesthetic without being a full image.

**Card interior padding:** `padding: 32px 40px 36px`.

**Section divider between Create and Join:** A `1px` horizontal rule: `border: none; border-top: 1px solid C.border; margin: 28px 0`.

---

## 2. Wordmark

The DAWin wordmark is centered at the top of the card interior, below the decorative wood strip.

- Text: `"DAWin"`. Typography: `font-size: 22px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: C.textPri`.
- Below the wordmark, a subtitle line: `"Collaborative Studio"`. Typography: `font-size: 11px; font-weight: 400; letter-spacing: 0.08em; color: C.textSec`. Margin: `4px` below wordmark.
- Group margin below: `28px` before the Create form begins.
- The wordmark is `text-align: center`. No logo SVG — text only per the no-images constraint.

---

## 3. Create Session Form

**Section label:** `"New Session"`. Typography: `font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: C.textSec`. Margin below: `10px`.

**Session name input:**
- Full width of card interior: `width: 100%`.
- Placeholder: `"Untitled Session"`.
- Geometry: `height: 32px; padding: 0 10px; border-radius: 4px; font-size: 13px`.
- Colors at rest: `background: C.well; border: 1px solid C.border; color: C.textPri`.
- Placeholder color: `C.textSec` (via `::placeholder` pseudo-element — pass as inline style on the element using the existing pattern).
- Focus state: `border-color: C.accent; outline: none; box-shadow: 0 0 0 2px ${C.accent}33`.
- Error state (if create fails): `border-color: C.danger; box-shadow: 0 0 0 2px ${C.danger}22`.
- Disabled state (while request is in flight): `opacity: 0.6; cursor: not-allowed`.
- ARIA: `id="create-session-name"; aria-label="Session name"; aria-describedby="create-error"` (the `aria-describedby` points to the error message container, which is always in the DOM).
- On mount: this input receives `autoFocus`. This is the correct initial focus per accessibility requirements (see §12).

**Create button:**
- Positioned directly below the input, `margin-top: 8px`.
- Width: `100%`.
- Geometry: `height: 32px; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em`.
- Label: `"Create Session"`.
- Colors: `background: C.accent; color: #fff; border: none`.
- Hover state: `filter: brightness(1.12)`.
- Focus state: `outline: 2px solid C.accent; outline-offset: 2px`.
- Active/pressed state: `filter: brightness(0.9)`.
- Disabled state: `opacity: 0.4; cursor: not-allowed`. The button is disabled when: (a) the session name input is empty (whitespace-only counts as empty), or (b) a create request is in flight.
- ARIA: `aria-label="Create session"; aria-disabled="true"` when disabled.

**Loading state (create request in flight):**
- Button label is replaced by a spinner. The spinner is a `16px × 16px` SVG circle with a rotating partial arc: `stroke: #fff; stroke-width: 2; fill: none`. Animated with a CSS `@keyframes spin` at `0.7s linear infinite`. No text visible while loading.
- Input is disabled (`aria-disabled="true"`, `opacity: 0.6`).
- The spinner communicates to screen readers via `aria-label` on the button updating to `"Creating session…"`.

**Create error message:**
- Appears below the Create button, `margin-top: 6px`.
- Container: `id="create-error"; role="alert"; aria-live="assertive"`. Always in the DOM. Empty when no error. When an error exists, it contains the error text.
- Typography: `font-size: 11px; color: C.danger`.
- Error copy: `"Could not create session — try again."` (covers both network failures and unexpected server errors).
- The error clears automatically when the user changes the input value.

---

## 4. Join Session Form

**Section label:** `"Join Session"`. Same typographic style as the Create section label above.

**Session ID input:**
- Full width: `width: 100%`.
- Placeholder: `"Paste session ID"`.
- Same geometry and color tokens as the Create input above.
- Error state: `border-color: C.danger; box-shadow: 0 0 0 2px ${C.danger}22`.
- ARIA: `id="join-session-id"; aria-label="Session ID"; aria-describedby="join-error"`.

**Join button:**
- Same visual spec as Create button, but label: `"Join Session"`.
- Disabled when: (a) the session ID input is empty, or (b) a join request is in flight.
- Loading state: same spinner behavior as Create.
- ARIA: `aria-label="Join session"`.

**Join error message:**
- Container: `id="join-error"; role="alert"; aria-live="assertive"`. Always in DOM.
- Typography: `font-size: 11px; color: C.danger`.
- Error copy when session not found: `"Session not found — check the ID and try again."` This is the PM-specified copy (see sprint-08.md §1). Do not alter the wording.
- Error copy for network/server failures: `"Could not reach the server — check your connection."`.
- The error clears when the user modifies the input.

---

## 5. Validation and Submit Behavior

**Create flow:**
1. User types session name (or leaves blank; default name `"Untitled Session"` is used only as placeholder — if the field is empty on submit, use `"Untitled Session"` as the actual name value. Do not block submit for an empty name; the placeholder communicates the default.)
   - **Correction:** The Create button is enabled even when the field is empty. On submit with empty field, send `name: "Untitled Session"` to the server. The button is only disabled when a request is already in flight.
2. Press Create or hit Enter in the name input.
3. Button enters loading state.
4. `POST /api/v1/sessions` with body `{ name }`.
5. On success (`201` with `{ id, name }` in response): navigate to `?session=<id>`. Store the session in `localStorage` recent sessions (see §6).
6. On failure: show create error, restore button to enabled state.

**Join flow:**
1. User pastes or types session ID.
2. Press Join or hit Enter in the session ID input.
3. Button enters loading state.
4. `GET /api/v1/sessions/:id` (using the trimmed input value as the ID).
5. On success (`200` with `{ id, name }`): navigate to `?session=<id>`. Store in `localStorage` recent sessions.
6. On `404`: show join error with "Session not found" copy.
7. On other failure: show join error with server connection copy.

**Enter key behavior:** Pressing Enter in the session name input submits the Create form. Pressing Enter in the session ID input submits the Join form. The two forms are entirely independent — Enter does not cross-submit.

---

## 6. Recent Sessions

**Container:** Positioned `24px` below the lobby card. Width matches the card: `480px`. No background, no border.

**Section label:** `"Recent"`. Typography: `font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: C.textSec`. Margin below: `8px`.

**When to show:** Only when `localStorage` contains at least one recent session entry. If `localStorage` is empty or all entries are malformed, this entire section is absent — no empty state label, no "no recent sessions" message. The lobby is visually simpler with no recent sessions.

**Storage model:** Recent sessions are stored in `localStorage` under the key `dawin_recent_sessions`. The value is a JSON array of objects, maximum 3 entries, ordered most-recently-opened first:
```
[
  { id: string, name: string, openedAt: number }  // openedAt: Unix timestamp ms
]
```
On navigating to a session (either create or join), prepend the new entry to the array and trim to 3 entries. Duplicate IDs are moved to the front rather than duplicated.

**Entry layout:** Each recent session entry is a row: `display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 12px; border-radius: 4px; cursor: pointer`. Background at rest: `C.elevated`. Border: `1px solid C.border`. Margin between entries: `4px`.

Entry anatomy from left to right:
- A `6px × 6px` filled circle with `border-radius: 50%; background: C.accent` — acts as a session indicator dot.
- Session name: `font-size: 12px; font-weight: 500; color: C.textPri; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis`. Maximum width constrained by available space.
- Session ID: `font-family: monospace; font-size: 10px; color: C.textSec; white-space: nowrap`. Truncated to first 8 characters followed by `…` — e.g. `"a1b2c3d4…"`. This is not a click target by itself; the whole row is.
- Relative time: `font-size: 10px; color: C.textSec; white-space: nowrap; margin-left: 8px`. Format: `"just now"` (< 60s), `"N min ago"` (1–59 min), `"N hr ago"` (1–23 hr), `"N days ago"` (1+). Computed from `openedAt`.

**Hover state:** `background: C.control`. Transition: `background 100ms ease`.

**Focus state:** `outline: 2px solid C.accent; outline-offset: 2px`. Keyboard accessible via Tab.

**Pressed/active state:** `background: C.border`.

**Click behavior:** Clicking a recent session entry runs the Join flow using the stored session ID — it calls `GET /api/v1/sessions/:id`, shows loading state on the row (replace the indicator dot with a `12px` spinner), then navigates on success or shows an inline error. The error appears as a `font-size: 11px; color: C.danger` line below the clicked row, not in the Join form error slot.

If the session is no longer found (`404`): display the error inline below the entry and remove the entry from `localStorage`.

**ARIA:** Each entry is a `<button>` element (not a `<div>`) with `aria-label="Join session {name} (ID: {id})"`.

---

## 7. Visual Style — Neve Dark Theme

The lobby must read as the front door to the same tool as the session room — not a separate web product.

**Color application:**
- Outer surface: `C.bg`. This is the dark void surrounding the card.
- Card: `C.elevated`. Same surface as modals and panels in the session room.
- Form inputs: `C.well`. Same as inputs in InviteModal.
- Accent (Create button, focus rings, recent session dot): `C.accent`.
- Errors: `C.danger`.
- All typography: `C.textPri` and `C.textSec` as specified per element.

**No gradients on the card itself.** The card face is flat `C.elevated`. The only textural element is the `4px` `C.wood` strip at the top of the card.

**No images or external fonts.** The entire lobby is rendered from system fonts (same as the main app) and inline SVG for the spinner. No icon imports needed; the recent session indicator dot is a pure CSS shape.

**Depth:** The card has a subtle drop shadow: `box-shadow: 0 8px 32px rgba(0,0,0,0.5); 0 2px 8px rgba(0,0,0,0.3)`. This lifts it off the dark background without being theatrical.

**Consistency check:** The input style (`C.well` background, `C.border` border, `C.accent` focus ring) matches the existing InviteModal input. The button style (`C.accent` fill, `brightness` hover, `opacity: 0.4` disabled) matches the existing "Send invite" button pattern in InviteModal. The FE should reference those implementations for consistency.

---

## 8. Typography and Spacing

Full hierarchy summary:

| Element | font-size | font-weight | color | letter-spacing |
|---|---|---|---|---|
| Wordmark | 22px | 700 | `C.textPri` | 0.12em |
| Subtitle | 11px | 400 | `C.textSec` | 0.08em |
| Section labels ("New Session", "Join Session", "Recent") | 10px | 600 | `C.textSec` | 0.1em |
| Input text | 13px | 400 | `C.textPri` | 0 |
| Button label | 12px | 600 | `#fff` | 0.06em |
| Error messages | 11px | 400 | `C.danger` | 0 |
| Recent session name | 12px | 500 | `C.textPri` | 0 |
| Recent session ID | 10px | 400 | `C.textSec` | 0 (monospace) |
| Recent session time | 10px | 400 | `C.textSec` | 0 |

**Spacing summary (card interior):**
- Wood strip to card interior top edge: `0px` (strip is flush, interior starts at `padding: 32px` top).
- Below wordmark to subtitle: `4px`.
- Below subtitle to first section label: `28px`.
- Section label to its input: `10px`.
- Input to button: `8px`.
- Button to error message: `6px`.
- Section divider margin: `28px` on both sides.
- Section label to its input (Join section): `10px`.
- Card bottom padding: `36px`.

---

## 9. Input Component Spec

This is the definitive spec for lobby inputs. Both inputs (session name and session ID) use this spec.

**Geometry:** `height: 32px; width: 100%; padding: 0 10px; border-radius: 4px; font-size: 13px; font-family: inherit`.

**States:**

| State | Background | Border | Box-shadow | Cursor | Opacity |
|---|---|---|---|---|---|
| Rest | `C.well` | `1px solid C.border` | none | `text` | 1 |
| Focus | `C.well` | `1px solid C.accent` | `0 0 0 2px ${C.accent}33` | `text` | 1 |
| Hover (not focused) | `C.well` | `1px solid C.metalMid` | none | `text` | 1 |
| Error | `C.well` | `1px solid C.danger` | `0 0 0 2px ${C.danger}22` | `text` | 1 |
| Disabled | `C.well` | `1px solid C.border` | none | `not-allowed` | 0.6 |

`C.metalMid` is `#2A2A3C` from the token set. The hover border provides a subtle affordance without the full focus treatment.

**Placeholder color:** `C.textSec` (`#888899`). Applied via `style={{ color: ... }}` on the input itself — Tailwind's `placeholder:` utilities cannot be used with token values. The FE can use a global CSS rule for `::placeholder` color if preferred.

**`outline: none`** on all states (focus ring is the `box-shadow`, not the default browser outline).

---

## 10. Button Component Spec

**Primary button** (Create Session, Join Session):

| State | Background | Color | Border | Box-shadow | Opacity | Cursor |
|---|---|---|---|---|---|---|
| Rest | `C.accent` | `#fff` | none | none | 1 | `pointer` |
| Hover | `C.accent` + `brightness(1.12)` | `#fff` | none | none | 1 | `pointer` |
| Active/pressed | `C.accent` + `brightness(0.9)` | `#fff` | none | none | 1 | `pointer` |
| Focus | `C.accent` | `#fff` | none | `outline: 2px solid C.accent; outline-offset: 2px` | 1 | `pointer` |
| Disabled | `C.accent` | `#fff` | none | none | 0.4 | `not-allowed` |
| Loading | `C.accent` | — (spinner) | none | none | 1 | `default` |

**Loading state detail:** The spinner is centered in the button. The spinner SVG: `width="16" height="16"`, single `<circle>` with `cx="8" cy="8" r="6"`, `stroke="rgba(255,255,255,0.9)"`, `stroke-width="2"`, `fill="none"`, `stroke-dasharray="20 18"`, rotated via `animation: spin 0.7s linear infinite`. The `@keyframes spin` rule: `from { transform: rotate(0deg) } to { transform: rotate(360deg) }`. Applied as an inline `<style>` tag or via the app's global CSS.

**`transition`:** `filter 100ms ease` for the brightness hover/active transition.

**Height and border-radius:** `height: 32px; border-radius: 4px`. Matches the input height for visual alignment in the form.

---

## 11. Keyboard Interactions

| Key | Context | Behavior |
|---|---|---|
| `Tab` | Anywhere in lobby | Moves focus through: session name input → Create button → session ID input → Join button → recent session entries (top to bottom) → wraps |
| `Shift + Tab` | Anywhere in lobby | Reverse of above |
| `Enter` | Session name input focused | Submits Create form (same as clicking Create button) |
| `Enter` | Session ID input focused | Submits Join form (same as clicking Join button) |
| `Enter` or `Space` | Create button focused | Submits Create form |
| `Enter` or `Space` | Join button focused | Submits Join form |
| `Enter` or `Space` | Recent session entry focused | Triggers join flow for that session |
| `Escape` | Anywhere in lobby | No action — the lobby has no parent to dismiss to |

No other keyboard shortcuts are active in the lobby. The global app shortcuts (Space = play, V, C, etc.) must not fire in the lobby — the lobby replaces the entire app and none of those actions are meaningful here. The `keydown` listener for global shortcuts in `App` must be guarded so it does not attach when the lobby is visible.

---

## 12. Accessibility

**Focus management on mount:** The session name input (`id="create-session-name"`) receives `autoFocus`. This places the cursor in the first actionable field immediately on lobby load, enabling keyboard-only users to begin creating a session without a Tab press.

**Role and ARIA structure:**

```
<main role="main" aria-label="DAWin session lobby">
  <section aria-labelledby="create-heading">
    <h2 id="create-heading">New Session</h2>
    <input id="create-session-name" aria-label="Session name" aria-describedby="create-error" />
    <button aria-label="Create session" aria-disabled? >Create Session</button>
    <div id="create-error" role="alert" aria-live="assertive"></div>
  </section>
  <section aria-labelledby="join-heading">
    <h2 id="join-heading">Join Session</h2>
    <input id="join-session-id" aria-label="Session ID" aria-describedby="join-error" />
    <button aria-label="Join session" aria-disabled? >Join Session</button>
    <div id="join-error" role="alert" aria-live="assertive"></div>
  </section>
</main>
<nav aria-label="Recent sessions">
  <button aria-label="Join session {name} (ID: {id})">…</button>
</nav>
```

The `<h2>` section headings match the visual section labels — they can be visually styled as `font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase` while still being semantic headings.

**Contrast verification:**
- Wordmark `C.textPri` (`#F0F0F5`) on `C.elevated` (`#1A1A24`): contrast ≈ 12:1. Passes AAA.
- Subtitle `C.textSec` (`#888899`) on `C.elevated` (`#1A1A24`): contrast ≈ 4.5:1. Passes AA.
- Section labels `C.textSec` on `C.elevated`: same as above, passes AA.
- Input text `C.textPri` on `C.well` (`#0D0D14`): contrast ≈ 14:1. Passes AAA.
- Placeholder `C.textSec` on `C.well`: contrast ≈ 5.1:1. Passes AA.
- Button label `#fff` on `C.accent` (`#6B5CE7`): contrast ≈ 4.6:1. Passes AA.
- Error text `C.danger` (`#E94560`) on `C.elevated`: contrast ≈ 5.3:1. Passes AA.
- Recent session name `C.textPri` on `C.elevated`: ≈ 12:1. Passes AAA.
- Recent session ID/time `C.textSec` on `C.elevated`: ≈ 4.5:1. Passes AA.

All text meets WCAG 2.1 AA minimum 4.5:1 for normal-sized text.

---

## Design Tokens Reference

| Token | Value | Used in lobby |
|---|---|---|
| `C.bg` | `#0A0A0F` | Outer background |
| `C.elevated` | `#1A1A24` | Card, recent session entries |
| `C.well` | `#0D0D14` | Input backgrounds |
| `C.control` | `#2A2A38` | Recent entry hover background |
| `C.border` | `#1E1E28` | Card border, input rest border, section divider |
| `C.metalMid` | `#2A2A3C` | Input hover border |
| `C.accent` | `#6B5CE7` | Primary buttons, focus rings, session dot |
| `C.danger` | `#E94560` | Error states — border, text |
| `C.success` | `#1D9E75` | Not used in lobby |
| `C.textPri` | `#F0F0F5` | Wordmark, input text, session name |
| `C.textSec` | `#888899` | Subtitle, labels, placeholders, metadata |
| `C.wood` | `#2E1A0E` | Decorative top strip |

---

## Implement This First

**Implement the Create + Join form card with working `POST` and `GET` network calls before adding recent sessions.** The forms are the critical path: a user cannot enter the session room without them. Recent sessions are a localStorage enhancement; they do not block any core flow. Get the lobby rendering, forms submitting, and navigation working first.
