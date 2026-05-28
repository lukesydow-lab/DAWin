# Session Communication + Inline Comments — Design Spec

**Feature:** FR-2026-05-14-06 + FR-2026-05-14-07  
**Sprint:** 3  
**Status:** Ready for implementation  
**Author:** Designer  
**Date:** 2026-05-15

---

## Layout context

The existing session room layout from top to bottom:

- Transport bar — `TRANSPORT_H = 52px`, fixed top
- Arranger ruler — `RULER_H = 24px`, immediately below transport
- Track rows — `TRACK_H = 64px` each, 7 tracks
- Mixer — below arranger, height variable
- Status bar — `STATUS_BAR_H = 28px`, fixed bottom

The FX panel is a right-side fixed panel with its own toggle. The session chat panel described in § Session Chat Panel slots into the same right-side zone, toggled independently from FX. These two panels share a 280px right column but are not shown simultaneously — the active panel covers the other's space, with both toggle icons stacked vertically in a narrow rail at the far right edge.

---

## § Anchor Pins

### Purpose

A comment anchor pin is a small visual marker placed on the arranger ruler (`RULER_H = 24px`) indicating that one or more comments are attached to that timeline position. Pins must not obscure bar number labels and must read clearly at the default zoom level (`BAR_W = 72px`).

### Pin geometry

Each pin is a downward-pointing chevron flag, 8px wide × 10px tall, rendered as an SVG path. The chevron tip points down toward the clip lanes below. The flat top edge sits flush with the top of the ruler row. No emoji, no text inside the pin.

SVG path description (for FE reference): a rectangle capped with a downward V — start top-left, draw right, drop to a center bottom point, return up-left to close. The shape is compact enough that at `BAR_W = 72px` it occupies roughly 11% of one bar width.

Horizontal placement: pin center-x aligns to the pixel position of `startBar * BAR_W`. Vertical: top edge at `y = 0` within the ruler row, so the 10px pin fills the ruler height exactly (`RULER_H = 24px`; the pin sits in the lower 10px, leaving the top 14px for bar numbers).

When multiple pins would overlap (within 4px of each other at current zoom), they collapse into a single cluster pin — see Count Badge below.

### Color tinting

The pin fill color is the comment author's collaborator hex color (sourced from the `SessionComment.authorId` → collaborator lookup). The fill is applied via inline `style={{ fill: author.color }}`. No Tailwind color class — this must be a dynamic inline style.

When a thread has multiple authors (due to replies), the pin fill uses the original author's color (the thread opener), not the most recent replier.

### Open vs. resolved states

**Open state:** Pin fill is the author's collaborator color at full opacity. Stroke: none. The pin is fully saturated and reads at full contrast.

**Resolved state:** Pin fill is `C.textSec` (`#888899`). The shape is identical but the color reads as neutral/inactive. A resolved pin remains visible but is clearly de-emphasized. Hovering a resolved pin shows a tooltip: "Resolved — click to view thread."

Resolved pins are hidden by default when a "Hide resolved" toggle is active (see § Component Inventory for toggle placement). They remain in the DOM with `display: none` and are restored when the toggle is off.

### Count badge

When 2 or more comment threads share the same bar position (or are within 1 bar of each other at the current zoom level), they collapse into a single cluster pin. A count badge is overlaid at the top-right corner of the pin.

Badge geometry: 12px × 12px circle, background `C.elevated` (`#1A1A24`), border 1px solid author's collaborator color, text `9px` `C.textPri`, content is the thread count. If count exceeds 9, display "9+". The badge sits at `top: -4px; right: -4px` relative to the pin's bounding box using `position: absolute`.

At cluster pins, the pin fill defaults to the color of the most recent open comment author. If all threads in the cluster are resolved, the cluster pin renders in the resolved state.

### Hover state (open pin)

On `mouseenter`: pin scales to 110% via `transform: scale(1.1)` with `transition: transform 80ms ease-out`. A tooltip appears 4px above the ruler showing: "N comment(s) — Bar X — Author Name" in `12px` `C.textSec`. Tooltip background: `C.elevated`, border: `1px solid C.border`, border-radius: `4px`, padding: `4px 8px`.

On `mouseleave`: scale returns immediately (no delay), tooltip dismissed.

### Focus state (keyboard)

Pins are focusable via Tab. Focus ring: `2px solid C.accent` offset `2px` from the pin bounding box. On Enter or Space: opens the thread popover.

### ARIA

Each pin: `role="button"`, `aria-label="Comment at Bar {N} by {Author Name}, {open|resolved}, {count} {thread|threads}"`. Count badge has `aria-hidden="true"` since the count is encoded in the parent aria-label.

---

## § Thread Popover

### Trigger and positioning

Clicking a ruler pin opens the thread popover. The popover appears above the ruler, attached to the pin's horizontal position. Because the transport bar sits directly above the ruler, the popover must float above the transport bar — it is a `position: fixed` element, not `position: absolute` relative to the ruler. Calculate `top` as: `TRANSPORT_H - popover height - 8px gap` from the top of the viewport. This keeps the popover visible without clipping.

If the pin is within 160px of the right viewport edge, the popover right-aligns to the pin instead of left-aligning.

Only one popover is open at a time. Opening a new pin closes any existing popover.

### Dimensions

- `width: 320px` fixed
- `min-height: 120px`, `max-height: 480px` (scrollable thread body beyond this)
- `border-radius: 6px`
- Background: `C.elevated` (`#1A1A24`)
- Border: `1px solid C.border` (`#1E1E28`)
- Box shadow: `0 8px 24px rgba(0,0,0,0.6)`

### Header section

Height: `40px`, background: `C.surface` (`#111118`), bottom border: `1px solid C.border`.

Left side (horizontal flex, `gap-2`, vertically centered, `padding: 0 12px`):
- Author color dot: `8px × 8px` circle, fill = author's collaborator color, inline `style={{ background: author.color }}`, `border-radius: 50%`
- Author display name: `13px` `font-medium` `C.textPri`
- Anchor label: `12px` `C.textSec` — content is the anchor type formatted as: `"Bar 12"` (timeline), `"Bar 8–12"` (time range), `"Kick track"` (track), `"Clip: Kick A"` (clip)
- Timestamp: `11px` `C.textSec`, right of anchor label with a `·` separator, formatted as relative time ("2 min ago", "yesterday")

Right side (`padding-right: 8px`):
- Resolve button (open thread): icon-only button, checkmark SVG, `16px × 16px`, `C.textSec` at rest, `C.success` on hover. `aria-label="Resolve thread"`. `title="Resolve thread"`.
- Reopen button (resolved thread): same position, circular arrow SVG, `C.textSec` at rest, `C.warn` on hover. `aria-label="Reopen thread"`.
- Close button: `×` SVG, `16px × 16px`, `C.textSec` at rest, `C.textPri` on hover. `aria-label="Close thread"`. Keyboard shortcut: Escape.

### Original comment body

Padding: `12px`. Body text: `13px` `C.textPri` `leading-relaxed`. Long text wraps within the 320px width — no truncation on the original comment.

Below the body, on the right: a "Jump to location" text link in `11px` `C.accent`. Clicking this seeks the playhead to `comment.anchor.startTimeSec` and closes the popover. If the anchor is a clip, the clip's start position is used.

### Reply list

Each reply is a compact row: `padding: 8px 12px`, top border `1px solid C.border` on rows 2+.

Reply row layout (horizontal flex):
- Author color dot: `6px` circle, inline style, `flex-shrink: 0`, `margin-top: 3px` (aligns with first line of text)
- Content column (flex-grow):
  - Row 1: author name `12px` `font-medium` `C.textPri` + `·` + timestamp `11px` `C.textSec`
  - Row 2: body text `13px` `C.textPri`

Reply list scrolls independently within `max-height: 240px` if thread is long. Scrollbar: `2px` wide, `C.control` track, `C.textSec` thumb.

### Reply compose input

At the bottom of the popover, separated by `1px solid C.border`:

Input row: `padding: 8px 12px`, height `36px`, flex row with `gap-2`.

- Author color dot (current user): `6px` circle, `flex-shrink: 0`, `margin-top: auto margin-bottom: auto`
- `<input>` element, `flex-grow: 1`, background `C.well` (`#0D0D14`), border `1px solid C.border`, border-radius `4px`, padding `0 8px`, `font-size: 13px`, color `C.textPri`, placeholder "Reply…" in `C.textSec`
- Focus state on input: border becomes `1px solid C.accent`
- Submit behavior: Enter key submits. Empty input does nothing — no error state, just a no-op.
- No visible send button in the default state. A "Send" text button (`11px` `C.accent`) appears to the right of the input only when the input has content (`input.value.length > 0`).

### Dismiss behavior

- Escape key closes the popover
- Click outside the popover closes it (mousedown on any element not inside the popover bounds)
- Clicking a different ruler pin closes this popover and opens the new one
- Focus is trapped within the popover while open (Tab cycles through: Resolve/Reopen, Close, reply input, Send if visible)

### Resolved thread state

When `status === 'resolved'`, the popover header background is `C.surface` with a `2px solid C.success` left border. A resolved banner replaces the reply input area: `"Thread resolved"` in `12px` `C.textSec`, centered, height `32px`. The Reopen button is in the header. No new replies can be added to a resolved thread without reopening it first.

### Empty thread state

If a pin somehow opens with zero comments (race condition or deleted comment), the popover body shows: `"No comments"` in `13px` `C.textSec`, centered, height `80px`. This is a defensive state — it should not occur in normal flow.

---

## § Session Chat Panel

### Position and coexistence with FX panel

The chat panel occupies the same `280px` right-side column as the FX panel. Both panels are controlled by toggle icons in a `28px` wide vertical rail at the far right edge of the viewport (between the panel content area and the viewport edge). This rail sits above the status bar.

Rail layout (vertical stack, top-aligned, `gap-4`, `padding: 8px 4px`):
- FX panel toggle icon (plugin/rack SVG, existing)
- Chat panel toggle icon (speech bubble SVG, `20px × 20px`)

Active panel: the toggled panel's icon has `background: C.accentMuted`, border-radius `4px`. Inactive: no background. Only one panel is active at a time — activating chat deactivates FX, and vice versa. Keyboard: Tab navigates the rail, Enter/Space toggles.

`aria-label` on chat toggle: `"Session chat"`. When unread messages exist: `aria-label="Session chat, {N} unread"`.

When both panels are closed, the right column collapses and the arranger/mixer take the full width minus the 28px rail.

### Panel dimensions and structure

Width: `280px`. Panel height fills from below the transport bar to above the status bar: `calc(100vh - TRANSPORT_H - STATUS_BAR_H)px`.

Background: `C.surface` (`#111118`). Left border: `1px solid C.border`. No top border (transport bar provides visual separation).

Internal layout (vertical flex, top-to-bottom):

1. Panel header — `40px` fixed height
2. Message list — `flex-grow: 1`, scrollable
3. Compose area — `52px` fixed height

### Panel header

Background: `C.elevated`, bottom border: `1px solid C.border`, padding `0 12px`.

Left: "Chat" label `13px` `font-medium` `C.textPri`.

Right: "Hide resolved" toggle — pill toggle, `28px × 16px`, inactive = `C.control` bg with `C.textSec` dot, active = `C.accent` bg with white dot. Label text `11px` `C.textSec` to the left of the toggle: "Show resolved". This toggle applies globally to both the chat panel and ruler pins.

### Message list

`overflow-y: auto`, padding `8px 0`. Scroll anchor: newest message at bottom. On initial load and on new message arrival, auto-scroll to bottom. If the user has manually scrolled up, do not auto-scroll on new messages — instead show a "New message" chip at the bottom (see § Unread Indicators).

Each message bubble:

Container: `padding: 6px 12px`, full width.

Layout (horizontal flex, `gap-8px`, `align-items: flex-start`):
- Author color dot: `8px × 8px` circle, `flex-shrink: 0`, `margin-top: 4px`, inline style `background: author.color`
- Content column:
  - Row 1: author display name `12px` `font-medium` color `C.textPri` + `·` + timestamp `11px` `C.textSec`
  - Row 2+: message body `13px` `C.textPri` `leading-relaxed`, wraps to fill `calc(280px - 12px - 8px - 8px - 12px)` = `240px` usable width

Consecutive messages from the same author within 60 seconds collapse: subsequent messages omit the author dot and name row, showing only the body indented `16px` from the left (to align with the start of the previous body text). The author dot placeholder is still present but transparent (`opacity: 0`) to preserve alignment.

**New comment highlight:** When a message arrives from another collaborator, it renders with a `3px solid {author.color}` left border replacing the normal left padding. After 3 seconds, the border fades to transparent over `0.4s` transition, and the left padding returns to normal. This is the "new from others" indicator — it does not apply to messages sent by the current user.

**@mention rendering:** If a message body contains `@DisplayName`, that token is rendered as a `<span>` with `color: C.accent` and `font-weight: 500`. Clicking a mention has no action in V1 (no navigation). The token is visually distinct from plain text.

### Compose area

Height: `52px`, background: `C.elevated`, top border: `1px solid C.border`, padding `8px 12px`.

Layout: horizontal flex, `gap-8px`.

- `<input>` element, `flex-grow: 1`, background `C.well`, border `1px solid C.border`, border-radius `4px`, padding `0 10px`, `font-size: 13px`, color `C.textPri`, placeholder "Message session…" `C.textSec`
- Focus: border `1px solid C.accent`
- Submit: Enter key. Empty message: no-op.

**@mention picker:** Typing `@` in the compose input opens a compact dropdown above the input showing collaborators in the session. The dropdown is `position: absolute`, `bottom: 52px`, `left: 12px`, `width: calc(280px - 24px)`, background `C.elevated`, border `1px solid C.border`, border-radius `4px`.

Dropdown rows: `32px` tall, padding `0 10px`, horizontal flex. Each row: author color dot `6px`, display name `13px` `C.textPri`. Hover: `background: C.control`. Selected via ArrowUp/ArrowDown + Enter, or click. Selecting inserts `@DisplayName ` into the input and closes the dropdown. Escape closes the dropdown without inserting.

Maximum 4 rows visible; scrollable if more collaborators. `role="listbox"` on the dropdown, `role="option"` on each row.

### Collapsed state

When the chat panel toggle is deactivated, the panel and its 280px column disappear. The toggle icon in the 28px rail remains. If there are unread messages, a badge appears on the toggle icon — see § Unread Indicators.

---

## § Unread Indicators

### Ruler pin pulse

When a new comment is created at a timeline position, the corresponding ruler pin plays a single pulse animation on arrival:

```
@keyframes pinPulse {
  0%   { transform: scale(1); opacity: 1; }
  40%  { transform: scale(1.4); opacity: 0.9; }
  70%  { transform: scale(0.95); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```

Duration: `320ms`, easing: `ease-out`, `animation-iteration-count: 1`. After the animation completes the pin returns to its static state. The animation is applied by adding a class `pin-pulse` to the SVG element, then removing it after 400ms. This is a one-shot effect — it does not loop.

This animation should be suppressed if `prefers-reduced-motion: reduce` is detected. In that case, the pin simply appears at its final state with no motion.

### Chat tab unread badge

When the chat panel is collapsed and new messages arrive that the current user has not seen, an unread count badge appears on the chat toggle icon in the right rail.

Badge geometry: `16px × 16px` circle, background `C.danger` (`#E94560`), positioned `top: -4px; right: -4px` relative to the toggle icon. Text: `11px` `font-bold` white. Count display: 1–9 as a numeral, 10+ displays as "9+". The badge disappears when the user opens the chat panel (all messages are marked read).

`aria-label` on the toggle icon updates to include the count: `"Session chat, 3 unread"`.

### "New message" scroll chip

When the message list is scrolled up and a new message arrives, a chip appears anchored at the bottom of the message list area (not the compose area). The chip is `position: sticky` at `bottom: 8px` within the scroll container.

Chip: `height: 24px`, `background: C.accent`, `border-radius: 12px`, `padding: 0 10px`, centered `12px` text `font-medium` white, content: "New message — click to scroll". Clicking it scrolls to the bottom of the message list. The chip disappears automatically when the user scrolls to within 40px of the bottom.

### New comment left border (chat messages)

Described in § Session Chat Panel — a `3px solid {author.color}` left border appears on new messages from other collaborators, fades over `0.4s` after a 3-second hold. Uses CSS `transition: border-color 0.4s ease, padding-left 0.4s ease` — border-color goes to `transparent` and left padding restores simultaneously so the text does not jump.

---

## § Copy Link Actions

### Context menu placements

These items appear in right-click context menus on the respective targets. The existing clip right-click menu already has items (Delete, Duplicate, Bounce-to-clip, etc.). New items append to the bottom of those menus, separated by a `1px C.border` divider.

**Right-click on ruler (empty area or existing pin):**
- Menu item: `"Copy link to Bar {N}"`
- Behavior: copies a deep link URL to clipboard, shows a brief 1.5s tooltip "Copied!" (`12px` `C.textSec`, `C.elevated` background, border-radius `4px`) that appears at the cursor position and auto-dismisses.

**Right-click on track header:**
- Menu item: `"Copy link to track"`
- Behavior: same clipboard copy + "Copied!" tooltip behavior.

**Right-click on a clip:**
- Menu item: `"Copy link to clip"`
- Behavior: same clipboard copy + "Copied!" tooltip behavior.

**Right-click on ruler with an active time selection (range):**
- Menu item: `"Copy link to selected range (Bar {N}–{M})"`
- Appears above the "Copy link to Bar N" item when a range is selected.

### Playhead link in transport bar

A small link/chain icon (`16px × 16px` SVG) sits in the transport bar, immediately to the right of the bar:beat:tick counter display. The icon is `C.textSec` at rest, `C.textPri` on hover, `C.accent` for 1.5 seconds after being clicked (visual confirmation).

`aria-label="Copy link to current playhead position"`. `title="Copy link to playhead"`.

Clicking it copies the link to the current playhead moment and shows the same "Copied!" tooltip directly below the icon.

### Action label text (canonical)

| Context | Label |
|---|---|
| Ruler (point) | `Copy link to Bar {N}` |
| Ruler (range selected) | `Copy link to selected range (Bar {N}–{M})` |
| Track header | `Copy link to track` |
| Clip | `Copy link to clip` |
| Transport bar icon | (no label — aria-label only) |

The label text must match exactly in implementation. Do not abbreviate or rephrase — these are the strings the PM approved based on the FR-07 UX requirements.

---

## § Deep Link Highlight

When a user arrives in the session via a deep link, the target is highlighted immediately after the session loads and the playhead seeks to position. Each highlight is a one-shot animation — it plays once and leaves the element in its normal state.

### Track row highlight

The target track row receives a left border pulse. The left `4px` of the track header div (the existing collaborator color accent bar) widens briefly from `4px` to `8px` and brightens.

Animation: `border-left-width` transitions from `4px` to `8px` over `200ms`, holds for `800ms`, then returns to `4px` over `500ms`. Simultaneously, `background-color` of the track row adds a `rgba(255,255,255,0.06)` white overlay that fades to `rgba(255,255,255,0)` over the 1.5s total duration.

Total duration: `1.5s`. If `prefers-reduced-motion: reduce`, skip the animation and instead render the track row with a `2px solid C.accent` left border that the user can dismiss by clicking anywhere — do not auto-dismiss for reduced-motion users, as they need longer to process the highlight.

### Clip highlight

The target clip's border (already present as a `1px` collaborator-colored border) pulses:

`border-width` transitions `1px → 3px → 1px` over `600ms`. `border-color` stays as the collaborator color — this is not a separate highlight color. The clip does not change size or position; only the border width changes.

Simultaneously, a `box-shadow: 0 0 8px 2px {collaborator.color}` glow is applied at `opacity: 0.7`, then fades to `opacity: 0` over `1.5s`.

Total duration: `1.5s`. Reduced-motion: only the glow, no border animation — glow appears instantly at `opacity: 0.5` and the user must click to dismiss.

### Bar position (ruler) highlight

At the target bar position on the ruler, a `4px` wide vertical bar flashes. The bar is `C.accent` (`#6B5CE7`), `height: RULER_H = 24px`, rendered as an absolutely positioned `<div>` child of the ruler at `x = bar * BAR_W`.

Animation: `opacity: 0 → 0.9 → 0` over `1.2s`, using a keyframe:

```
@keyframes rulerFlash {
  0%   { opacity: 0; }
  15%  { opacity: 0.9; }
  100% { opacity: 0; }
}
```

After the animation, the element removes itself from the DOM (using `onAnimationEnd` handler). Reduced-motion: element renders at `opacity: 0.5` with `width: 2px solid C.accent` border marker that fades after 3 seconds.

### Error state (missing target)

If the deep link references a clip or track that no longer exists, the session loads normally and a toast notification appears in the bottom-right corner (above the status bar):

Toast: `width: 280px`, background `C.elevated`, border `1px solid C.warn`, border-radius `6px`, padding `10px 14px`. Icon: warning triangle SVG `16px`, color `C.warn`. Body text: `"Linked {clip|track|bar} not found in this session."` `13px` `C.textPri`. Auto-dismiss after `5s`. Manual dismiss: `×` icon top-right. `role="alert"` on the toast container.

---

## § Component Inventory

Every new UI element introduced in this spec, with its size, color tokens, and interaction:

| Component | Size | Background | Border | Text | Interaction |
|---|---|---|---|---|---|
| Ruler pin (open) | 8×10px SVG | author.color (inline) | none | — | click: open popover, hover: scale 110% + tooltip, focus: C.accent ring |
| Ruler pin (resolved) | 8×10px SVG | C.textSec | none | — | click: open popover, hover: tooltip "Resolved" |
| Cluster count badge | 12×12px circle | C.elevated | 1px author.color | 9px C.textPri | aria-hidden, parent handles interaction |
| Thread popover | 320px × variable | C.elevated | 1px C.border | — | Escape/outside click dismisses, focus-trapped |
| Popover header | 320×40px | C.surface | bottom 1px C.border | 13px C.textPri, 12px C.textSec | — |
| Resolve button | 16×16px icon | transparent | none | C.textSec → C.success | click: resolve thread |
| Reopen button | 16×16px icon | transparent | none | C.textSec → C.warn | click: reopen thread |
| Popover close button | 16×16px icon | transparent | none | C.textSec → C.textPri | click/Escape: dismiss |
| Jump-to-location link | inline text | — | — | C.accent 11px | click: seek playhead + close popover |
| Reply list container | 320px × max 240px | C.elevated | 1px C.border (row dividers) | 13px C.textPri, 11px C.textSec | scroll |
| Reply compose input | flex-grow × 20px | C.well | 1px C.border → accent (focus) | 13px C.textPri | Enter: submit |
| Resolved banner | 320×32px | C.elevated | — | 12px C.textSec | — |
| Chat panel | 280px × calc(100vh-80px) | C.surface | left 1px C.border | — | toggle collapses |
| Chat toggle icon | 20×20px | accentMuted (active) | — | — | click: toggle panel, aria-label with unread |
| FX+Chat rail | 28px × panel height | C.surface | left 1px C.border | — | Tab nav |
| Message bubble | 280px × variable | transparent | left 3px author.color (new, 3s) | 13px C.textPri | — |
| Unread count badge (chat) | 16×16px circle | C.danger | none | 11px white font-bold | appears on chat toggle icon |
| "New message" chip | auto × 24px | C.accent | none | 12px white | click: scroll to bottom |
| @mention picker dropdown | 256px × max 128px | C.elevated | 1px C.border | 13px C.textPri | ArrowUp/Down + Enter, click |
| Playhead link icon | 16×16px | — | — | C.textSec → accent (active 1.5s) | click: copy + tooltip |
| "Copied!" tooltip | auto × 24px | C.elevated | 1px C.border | 12px C.textSec | auto-dismiss 1.5s |
| Deep link toast | 280px × auto | C.elevated | 1px C.warn | 13px C.textPri + 16px C.warn icon | auto-dismiss 5s, manual × |
| Ruler flash bar | 4×24px div | C.accent | — | — | 1.2s animation, self-removes on end |
| Show resolved toggle | 28×16px pill | C.control (off) / C.accent (on) | — | 11px C.textSec | click: toggle resolved visibility globally |

---

## § Acceptance Criteria

1. **Pin renders on ruler at correct bar position.** A comment with `anchor.startBar = 12` renders a pin centered at `x = 12 * BAR_W` within the ruler row. Bar number labels at that position remain legible.

2. **Pin color matches comment author.** The pin fill uses the author's collaborator hex color via inline `style`, not a Tailwind class. Switching the comment author in the data model updates the pin color without a page reload.

3. **Resolved pin is visually distinct.** A resolved comment's pin renders with `C.textSec` fill. Open and resolved states are distinguishable without relying on color alone (resolved pins have lower contrast, which combined with the tooltip label provides a dual cue).

4. **Cluster badge appears for 2+ comments at the same bar.** Two comments anchored to bar 8 collapse into a single pin with a "2" count badge. The badge text is included in the pin's `aria-label`.

5. **Thread popover opens above the ruler.** Clicking a pin opens the popover with `position: fixed` above the transport bar. On a 1280px viewport, the popover does not clip outside the viewport on either side.

6. **Popover closes on Escape and outside click.** Pressing Escape from any element inside the popover closes it. Clicking anywhere outside the popover's `320px` bounds closes it.

7. **Reply submitted on Enter.** Typing in the reply input and pressing Enter appends the reply to the thread list. An empty input does not submit.

8. **Chat panel toggles independently from FX panel.** Activating the chat toggle closes the FX panel and opens the chat panel. Activating the FX toggle reverses this. Deactivating either closes that panel and returns the arranger/mixer to full width.

9. **Unread badge appears and clears.** While the chat panel is closed, receiving a new message causes the unread badge (`C.danger` background, count) to appear on the chat toggle icon. Opening the chat panel clears the badge immediately.

10. **Right-click on ruler shows copy link item.** Right-clicking anywhere on the arranger ruler (the 24px ruler row) shows a context menu item labeled exactly `"Copy link to Bar {N}"` where N is the bar number at the cursor position. Clicking it writes to the clipboard and shows a "Copied!" tooltip at the cursor.

11. **Playhead link icon is present in transport bar.** A link/chain SVG icon appears immediately to the right of the bar:beat:tick counter in the transport bar. It has `aria-label="Copy link to current playhead position"` and responds to keyboard activation (Enter/Space).

12. **Deep link navigation highlights the target.** Navigating to a deep link that references a clip causes the clip's border to pulse (`1px → 3px → 1px`) and a box-shadow glow to fade over 1.5s. A track deep link causes the track row's left border to briefly widen and a white overlay to fade.

13. **Missing deep link target shows an error toast.** Navigating to a deep link for a non-existent clip or track renders a `role="alert"` toast with `C.warn` border at the bottom-right of the viewport. The toast auto-dismisses after 5 seconds.

14. **All icon-only controls have ARIA labels.** The resolve button, reopen button, popover close button, playhead link icon, chat toggle, and FX toggle each have an explicit `aria-label` that communicates the action without relying on the icon shape.

15. **Pin pulse animation fires once on new comment arrival.** When a new comment is broadcast to the client, the corresponding ruler pin plays the `pinPulse` keyframe animation exactly once. It does not repeat or loop. Animation is suppressed when `prefers-reduced-motion: reduce` is active.

---

## Implement this first

**The ruler anchor pin.** Everything else in this feature — the popover, the chat panel, the deep link highlights — depends on the pin being correctly positioned, color-tinted, and interactive. The pin is the connective tissue between the comment data model and the arranger UI. Implement the static pin SVG rendering at the correct bar position with correct collaborator color first, validate it at multiple zoom levels, then layer in the popover, then the chat panel.

The pin placement logic must handle the edge case of `startBar = 0` (bar 1) and `startBar = BARS - 1` (bar 32) without clipping outside the ruler bounds.
