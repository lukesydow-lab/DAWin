# Spec: Track Ownership Model

**Status:** Partial — color tinting and avatar display implemented; record-arm locking partially implemented; input routing badge implemented; role-based disabling partially implemented.
**Source:** `src/App.tsx` — `TrackHeader` component, lines 787–847; `Avatar` component, lines 485–497; `MiniBtn`, lines 510–522.

---

## Concepts

Every track has a single owner (`track.owner: Collaborator`). The owner is set at track creation and is not transferable in the current prototype. Ownership manifests in three visual systems:

1. **Color tinting** — the owner's hex color tints the track header background, the colored left-edge bar, the avatar ring, and the clip fill/border/waveform in the arranger.
2. **Record arm and locking** — when a collaborator is recording on a track (`track.lockedBy` is set to their id), other users cannot arm that track.
3. **Role-based access** — Viewers (`IS_VIEWER`) cannot interact with any mute/solo/arm button.

---

## TrackHeader layout

The header is a `div` with:
- `flex items-center gap-1.5 px-2 border-b flex-shrink-0 group relative cursor-pointer`
- Height: `TRACK_H` (64px constant)
- Background:
  - **Selected:** `linear-gradient(90deg, ${track.owner.color}30 0%, ${C.elevated} 48px)` — 19% opacity owner color fading to elevated surface.
  - **Unselected:** `linear-gradient(90deg, ${track.owner.color}18 0%, ${C.surface} 48px)` — 9% opacity owner color fading to surface.
- Border color: selected → `track.owner.color`, unselected → `C.border`.
- Outline: selected → `1px solid ${track.owner.color}44`, unselected → none.

Left to right inside the header:

1. **Owner color bar** — `flex-shrink-0 rounded-full`, `width: 4px`, `height: 40px`, `background: track.owner.color`. This is the strongest tint signal in the header.

2. **Record arm pulse strip** (conditional) — `absolute left-0 top-0 bottom-0`, `width: 3px`, `background: C.danger`, `borderRadius: 0 2px 2px 0`, class `record-pulse`. Visible only when `track.armed` is true. Sits to the left of the color bar, behind the left edge.

3. **Owner avatar** — `Avatar` component, `size={20}`, `ring={true}`. Circle: `background: track.owner.color`, `border: 2px solid track.owner.color` (ring mode), `boxShadow: 0 0 0 1px C.bg`. Initials in white, `fontSize: 8.4px`, `font-bold`. Title: `"{name} ({role})"`.

4. **Track name + type** — `flex-1 min-w-0 maxWidth: 68px`. Track name: `text-xs font-medium C.textPri`, truncated with `overflow-hidden text-overflow: ellipsis whitespace-nowrap`. Track type (Audio / MIDI / Bus): `text-xs C.textSec`.

5. **Right controls column** — `flex flex-col gap-1 items-end`:
   - **Button row** — `flex items-center gap-0.5`, `opacity-0 group-hover:opacity-100 transition-opacity`. Buttons appear on hover of the entire header.
     - **Lock indicator** (conditional) — shown when `lockingCollab !== null` (another user is recording). A `span` with `🔒` emoji, `fontSize: 12`, color set to `lockingCollab.color`. Title: `"{name} is recording"`.
     - **Record arm (R)** — `MiniBtn`, `activeColor: C.danger`. Active state: `C.danger` bg, white label. Disabled when `IS_VIEWER` or `lockingCollab !== null`. Disabled appearance: `opacity: 0.3`, `pointer-events: none`, `cursor: not-allowed`. ARIA: `aria-label="Record arm"`, `aria-pressed` reflects `track.armed`.
     - **Mute (M)** — `MiniBtn`, `activeColor: C.warn` (`#F5A623`). Active: amber bg, black label (contrast note: `#000` on `#F5A623` is 8.6:1 — passes). Disabled when `IS_VIEWER`. ARIA: `aria-label="Mute"`, `aria-pressed`.
     - **Solo (S)** — `MiniBtn`, `activeColor: C.success`. Active: green bg, white label. Disabled when `IS_VIEWER`. ARIA: `aria-label="Solo"`, `aria-pressed`.
   - **PanKnob** — see PanKnob spec section below.

6. **Audio input badge** (conditional) — `absolute bottom-1 right-1.5`. `flex items-center gap-0.5 rounded px-1 py-0.5`, `background: C.control`, `fontSize: 9`. Microphone emoji + input label. When armed: label color `C.success`, `fontWeight: 700`. When unarmed: label color `C.textSec`, `fontWeight: 400`. Visible only when `track.audioInput !== null`.

---

## MiniBtn spec

20×20px (`w-5 h-5`). `rounded text-xs font-bold flex items-center justify-center transition-all hover:brightness-125 active:scale-95`.

States:
- **Active:** `background: activeColor`, `color: #fff`.
- **Inactive:** `background: C.control`, `color: C.textSec`.
- **Disabled:** `opacity: 0.3`, `pointer-events: none`, `cursor: not-allowed`. Note: the `disabled` HTML attribute is also set, which removes the button from keyboard tab order. This is intentional for Viewers.
- **Hover:** `hover:brightness-125` — applies to both active and inactive states via Tailwind.
- **Active press:** `active:scale-95`.
- **Focus-visible:** inherits global `outline: 2px solid C.accent; outline-offset: 2px` from App.css.

The `onClick` has `e.stopPropagation()` to prevent triggering `TrackHeader`'s `onSelect`.

---

## PanKnob spec

Fixed 40×32px container. Two elements stacked vertically:

- **Label row** (12px tall): center-position shows `"C"` in `C.textSec`. Left pan shows `"L {value}"` in `C.accent bold`. Right pan shows `"R {value}"` in `C.accent bold`. `fontSize: 9`.
- **Bar** (6px tall, 36px wide): `background: C.control`, `rounded-sm`. Two halves separated by a 1px `C.border` center notch. Left half: fills `C.accent` from right edge proportional to left pan amount. Right half: fills `C.accent` from left edge proportional to right pan amount. Both halves have `C.well` background. Border-radius 2px on the inner fill edge.

The PanKnob is currently display-only (read state, no drag interaction). This is a partial implementation gap — see handoff for open question.

---

## Collaborator color tinting — complete rules

| Surface | Tint application |
|---|---|
| Track header background | `owner.color` at 9% (unselected) or 19% (selected) opacity, gradient fading to surface |
| Track header border | `owner.color` at full opacity when selected; `C.border` when unselected |
| Left edge bar | `owner.color` at 100% |
| Avatar fill | `owner.color` at 100% |
| Avatar ring | `border: 2px solid owner.color` in ring mode |
| Lock indicator emoji | `lockingCollab.color` |
| Clip background texture | `owner.color` at 13–34% opacity (Audio: horizontal lines; MIDI: vertical lines) |
| Clip left border | `owner.color` at 100% |
| Clip inset border | `owner.color` at 27% |
| Clip hover outline | `owner.color` at 53% |
| Clip label text | `owner.color` at 100%, with `textShadow: 0 0 8px ${owner.color}66` |
| Waveform canvas fill | `owner.color` at 80% (`CC` hex suffix) |
| Waveform canvas stroke | `owner.color` at 100% |
| Resize handle gradient | `owner.color` at 33% |
| Resize handle bar | `owner.color` at 100% |
| Fade handle triangle | `owner.color` at 55% (idle) / 90% (hovered) |
| Pan knob arc | `owner.color` at 100% |
| Mixer strip top cap border | `owner.color` at 100% |
| Mixer strip pan knob arc | `owner.color` at 100% |
| Mixer strip owner avatar | `owner.color` at 100% |
| Presence cursor line | `presence.color` at 60% opacity |
| Presence avatar chip | `presence.color` at 100% |
| Track row left border (presence) | `presence.color` at 100% |

---

## Record arm and locking behavior

- `track.lockedBy` is a collaborator id string or null.
- If `lockedBy === CURRENT_USER.id`, the current user is recording on the track — the armed state is visible.
- If `lockedBy` is another user's id (`lockingCollab !== null`), the record arm button is disabled and the lock indicator emoji appears.
- The lock indicator uses `lockingCollab.color` — this is the correct collaborator color signal. Do not use `C.danger` for the lock icon; it would create false alarm semantics.
- The record arm strip (3px left edge, `C.danger`) is shown when `track.armed` is true regardless of who locked it.

---

## Role-based access

`IS_VIEWER` is a boolean derived from `CURRENT_USER.role === 'Viewer'`. When true:
- All three MiniBtn controls (R, M, S) receive `disabled={true}`.
- Disabled buttons have `opacity: 0.3` and no pointer events.
- No tooltip explaining why they are disabled. Flag for FE: add `title="View only — upgrade to Editor to make changes"` on the disabled wrapper or button.

---

## Missing states to implement

1. **PanKnob drag interaction** — currently read-only. The mixer strip has a full `Knob` component with drag. The track header PanKnob should either (a) open a popover with a draggable pan control, or (b) become draggable in-place. Decision needed from PM — this is an open question in the handoff.
2. **Viewer role tooltip** — disabled buttons lack explanatory text.
3. **Track renaming** — name is static. The context menu has a "Rename…" item stubbed as `disabled: true` with "(soon)".

---

## DAW convention callouts

- In Ableton Live, mute is yellow and solo is blue. In Pro Tools, mute is green and solo is yellow. The current palette (mute = amber `C.warn`, solo = green `C.success`) does not match any single DAW exactly but reads correctly by color semantics. Do not swap these colors.
- The hover-reveal pattern for R/M/S buttons is a departure from standard DAW behavior — in most DAWs these buttons are always visible. Acceptable for a dense prototype but could hide discoverability. Flag for PM to evaluate.
- `record-pulse` on the left edge strip and the transport button simultaneously is correct — both should pulse in sync.

---

## Implement this first

Add `aria-label` and `aria-pressed` to the R, M, and S `MiniBtn` elements. These are icon-only single-letter buttons — the single letter is not an accessible label. The ARIA attributes are not present in the current implementation.
