# Application Menu Bar — Designer Spec

**Status:** Current
**Last updated:** 2026-05-20
**Sprint:** 8
**Author:** Designer
**Implements:** Sprint 8 PM decisions (see `docs/sprints/sprint-08.md`)

> **Designer gate satisfied.** All 13 sections are complete. The Frontend Engineer may begin implementation once this spec is committed to `docs/specs/`.

---

## Overview

The application menu bar is a `24px` horizontal bar that sits at the very top of the app, above the TransportBar. It is visible in all session states (lobby excluded — the menu bar only renders when a session is active and the arranger is showing). It surfaces the DAW's full command vocabulary through standard desktop menu conventions, gives experienced users a discovery path for keyboard shortcuts, and contains the Keyboard Shortcuts and About modals.

The menu bar is the standard desktop application chrome layer — it does not replace the TransportBar. It adds `24px` of height to the top of the chrome stack.

**Total top chrome height at Sprint 8:** `24px (menu bar) + 52px (TransportBar) = 76px`. The arranger region begins at `76px` from the top of the viewport. The StatusBar at the bottom is unchanged at `28px`.

---

## 1. Bar Anatomy

**Position:** `position: fixed; top: 0; left: 0; right: 0; height: 24px; z-index: 100`. The TransportBar must shift down by `24px` — its `top` value changes from `0` to `24px`. All other fixed panels that used `top: TRANSPORT_H` (52px) must be updated to `top: 76px` to account for the combined chrome height. The FE must audit all `top: TRANSPORT_H` references in `App.tsx` and update them.

**Background:** `C.elevated` (`#1A1A24`). Same as the modal/card surface — the menu bar reads as an elevated chrome layer above the application content.

**Bottom edge:** `border-bottom: 1px solid C.border`. This `1px` line separates the menu bar from the TransportBar without a gap.

**Left section — wordmark:** The DAWin wordmark sits on the far left of the menu bar. `padding-left: 10px`. Text: `"DAWin"`. Typography: `font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: C.textSec`. This is a reduced presence compared to the lobby wordmark — it confirms app identity at a glance but does not compete with menu labels. It is not a clickable button; it is purely decorative.

**Menu labels:** Appear to the right of the wordmark with `margin-left: 16px` separating the wordmark from the first label. Labels: `File`, `Edit`, `Session`, `View`, `Transport`, `Help`. They are rendered left-to-right in this order.

**Menu label typography:**
- At rest: `font-size: 11px; color: C.textSec; padding: 0 8px; height: 24px; line-height: 24px; cursor: default; user-select: none; white-space: nowrap`.
- Hover: `color: C.textPri; background: rgba(255,255,255,0.05)`.
- Active (dropdown open): `color: C.textPri; background: C.accentMuted` (`rgba(107,92,231,0.13)`).
- Transition: `background 80ms ease, color 80ms ease`.

**Right section:** Empty at Sprint 8. No controls on the right side.

**Full bar layout:** `display: flex; align-items: center; flex-shrink: 0`.

---

## 2. Dropdown Panel

When a menu label is clicked, its dropdown panel appears directly below the bar, positioned flush with the left edge of the label.

**Geometry:** `min-width: 200px; border-radius: 4px; padding: 3px 0; position: fixed`. Y-position: `top: 24px` (flush below the bar bottom edge). X-position: aligned to the left edge of the triggering label element.

**Surface:** `background: C.elevated; border: 1px solid C.border; border-radius: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)`.

**Z-index:** `z-index: 200`. This ensures the dropdown appears above the TransportBar (`z-index: 100` for the menu bar itself), all arranger content, the mixer, and the FX panel slide-in (`z-index: 45`). The only elements that should appear above the menu bar dropdowns are modal overlays (InviteModal, ThreadPopover, etc., at `z-index: 50` and above). The menu dropdowns at `z-index: 200` appear above those too — this is correct behavior for a native-feeling menu system.

**Open/close:**
- Click a menu label to open its dropdown. If another dropdown is already open, it closes and the new one opens immediately (no animation between switches, no hover delay needed — the label is already in active state).
- Click outside any dropdown to close. "Outside" means any `mousedown` event whose target is not within the open dropdown or its triggering label. Implement via a document-level `mousedown` listener that unmounts the open dropdown.
- `Escape` key closes the open dropdown and returns focus to the triggering label.
- Clicking an active label (its dropdown is already open) closes the dropdown.

**Hover-open while a dropdown is already open:** When the mouse moves from one menu label to another while a dropdown is already open, the currently open dropdown closes and the newly hovered label's dropdown opens. This is standard native menu behavior (menu bar "sticks open"). Implement by tracking an `openMenu: string | null` state and replacing it on `mouseenter` while `openMenu !== null`.

**No nested submenus.** All items at Sprint 8 are flat. No hover delays, no submenu arrows.

---

## 3. Menu Item Anatomy

Each menu item row:

**Geometry:** `height: 22px; display: flex; align-items: center; padding: 0 12px; cursor: default; user-select: none; white-space: nowrap`.

**Left side:** Item label. `font-size: 11px; color: C.textPri; flex: 1`.

**Right side:** Keyboard shortcut hint (if applicable). `font-size: 10px; color: C.textSec; margin-left: 24px; font-family: inherit`.

**Hover state (active, non-stub items):**
- `background: rgba(107,92,231,0.18)` (slightly stronger than `C.accentMuted` to be clearly readable as a hover target).
- Label and shortcut hint: `color: C.textPri`.
- Transition: `background 60ms ease`.

**Active/pressed state:** `background: rgba(107,92,231,0.35)`. Applied on `mousedown` momentarily before the action fires.

**Cursor:** `cursor: default` for all items — menus do not use pointer cursor in native desktop apps. DAW muscle memory expects this.

---

## 4. Stub Item Appearance

Stub items are commands that will be implemented in Sprint 9 or later. They are visible but non-interactive.

- `opacity: 0.4`.
- `cursor: default`.
- No hover state — hovering a stub produces no visual change.
- No keyboard shortcut hint shown (stubs have no implemented shortcut).
- No tooltip, no "coming soon" label — absence of the hover state and reduced opacity is sufficient signal.
- ARIA: `aria-disabled="true"` on stub items.

---

## 5. Separator

A separator is a horizontal rule between groups of menu items.

- `height: 1px; background: C.border; margin: 3px 0`.
- Not a `<li>` item — it is a `<div>` with `role="separator"` inside the dropdown.
- Not keyboard-focusable.

---

## 6. Complete Menu Item Inventory

All 6 menus, all items, separators, stubs, and keyboard shortcut hints. Shortcut hints reflect what is wired in `src/App.tsx` at Sprint 7 close. New shortcuts added in Sprint 8 (e.g. `?` for Keyboard Shortcuts) are noted.

### File

| Item | Stub? | Shortcut hint | Action |
|---|---|---|---|
| New Session | No | — | Navigate to session lobby: clear `?session=` URL param, unmount arranger, show lobby |
| Open Session… | No | — | Open a small inline popover or focus the Join form — see note below |
| *(separator)* | | | |
| Import Audio | No | `I` | Triggers existing file picker (same as `I` key) |
| *(separator)* | | | |
| Leave Session | No | — | Same as New Session → returns to session lobby |

**Note on "Open Session…":** This item opens a lightweight overlay: a single text input (session ID) and a "Join" button, same specification as the lobby's Join form (§4 of session-lobby.md). It is not a full-screen takeover — it is a small centered modal (`width: 320px; background: C.elevated; border: 1px solid C.border; border-radius: 6px; padding: 20px`) overlaying the current session. This allows switching sessions without leaving the current one first. Escape closes it. Submitting a valid session ID navigates to `?session=<newId>` (which reloads the session). An invalid ID shows the same inline error as the lobby.

### Edit

| Item | Stub? | Shortcut hint | Action |
|---|---|---|---|
| Undo | Yes (stub) | `⌘Z` | Stub — Sprint 9+ |
| Redo | Yes (stub) | `⌘⇧Z` | Stub — Sprint 9+ |
| *(separator)* | | | |
| Cut Clip | No | — | Existing cut action on selected clip (same as `C` tool + clip interaction) |
| Duplicate Clip | No | — | Existing duplicate action on selected clip |
| Delete Clip | No | `⌫` | Existing delete action on selected clip |
| *(separator)* | | | |
| Select All | Yes (stub) | `⌘A` | Stub — Sprint 9+ |
| *(separator)* | | | |
| Preferences | Yes (stub) | — | Stub — Sprint 9+ |

**Note on Cut Clip, Duplicate Clip, Delete Clip:** These are active only when a clip is selected. When no clip is selected, they should appear as stubs (`opacity: 0.4`, non-interactive). The FE should check `selectedClipId !== null` to determine enabled/stub state for these three items. This is dynamic stub behavior — not a fixed stub.

**Shortcut hint display format:** Use macOS-style symbols for brevity in the hint column: `⌘` for Cmd, `⌃` for Ctrl, `⇧` for Shift, `⌥` for Option/Alt, `⌫` for Backspace/Delete. The app targets desktop users familiar with these symbols. Do not spell out "Cmd" or "Ctrl" — the shortcut hint column is narrow.

### Session

| Item | Stub? | Shortcut hint | Action |
|---|---|---|---|
| Session Settings | Yes (stub) | — | Stub — Sprint 9+ |
| *(separator)* | | | |
| Copy Session Link | No | — | Existing `copyDeepLink()` action (copies `?session=<id>` deep link, same as chain icon in TransportBar) |
| Invite Collaborator | Yes (stub) | — | Stub — Sprint 9+ (full invite flow; the existing InviteModal in TransportBar is separate and remains) |
| *(separator)* | | | |
| Leave Session | No | — | Returns to session lobby (same as File → Leave Session) |

### View

| Item | Stub? | Shortcut hint | Action |
|---|---|---|---|
| Show/Hide Mixer | No | — | Toggle mixer panel visibility. Label reads "Show Mixer" when hidden, "Hide Mixer" when visible. |
| Show/Hide FX Panel | No | — | Toggle FX panel (PluginChainPanel) slide-in. Label reads "Show FX Panel" / "Hide FX Panel". |
| Show/Hide Chat | No | — | Toggle chat panel. Label reads "Show Chat" / "Hide Chat". Shows unread count if any: "Show Chat (3)". |
| *(separator)* | | | |
| Zoom In | Yes (stub) | `⌘+` | Stub — FR-02, Sprint 9+ |
| Zoom Out | Yes (stub) | `⌘–` | Stub — FR-02, Sprint 9+ |
| Reset Zoom | Yes (stub) | `⌘0` | Stub — FR-02, Sprint 9+ |

**Show/Hide Mixer:** The MixerPanel is currently always visible — there is no hide toggle in the existing implementation. Sprint 8 adds this toggle. The FE should add a `showMixer` boolean state (default `true`) to `App` and conditionally render the MixerPanel. The menu item label should reflect the current state.

**Show/Hide FX Panel:** The PluginChainPanel is currently visible when `selectedTrackId !== null`. "Show FX Panel" should select the last-selected track (or the first track if none was previously selected) and show the panel. "Hide FX Panel" should deselect all tracks (`setSelectedTrackId(null)`), which closes the panel per the existing implementation.

**Show/Hide Chat:** Toggles `chatOpen` state. Already implemented.

### Transport

| Item | Stub? | Shortcut hint | Action |
|---|---|---|---|
| Play/Pause | No | `Space` | Toggles `playing` state — same as spacebar |
| Stop | No | — | Sets `playing` to `false`; does not reset playhead position |
| Return to Zero | No | — | Sets `playing` to `false`; sets `playheadBar` to `0` |
| *(separator)* | | | |
| Toggle Loop | No | — | Toggles loop region on/off. If `loopStart` and `loopEnd` are both non-null, clears them (`setLoopStart(null); setLoopEnd(null)`). If they are null, sets a default loop region of bars 0–8. |
| *(separator)* | | | |
| Set BPM… | No | — | Focuses the BPM input in the TransportBar. Calls `.focus()` on the BPM input element. The dropdown closes first, then the focus call fires in a `setTimeout(fn, 0)` to ensure the dropdown has unmounted before focus is redirected. |

**Note on Stop vs Return to Zero:** The TransportBar currently has a `⏮` RTZ button that sets `playing: false` and `playheadBar: 0`. There is also an implicit "stop" that just halts playback. The menu items reflect the distinction: Stop preserves playhead position (matches standard DAW behavior — Pro Tools `0` key = stop, spacebar = play/pause). Return to Zero is a separate action (Pro Tools `Return` key).

**Toggle Loop label:** When loop is active (`loopStart !== null`), label reads "Disable Loop". When loop is inactive, label reads "Enable Loop". This dynamic label communicates the current state.

### Help

| Item | Stub? | Shortcut hint | Action |
|---|---|---|---|
| Keyboard Shortcuts | No | `?` | Opens KeyboardShortcutsModal |
| *(separator)* | | | |
| About DAWin | No | — | Opens AboutModal |

---

## 7. Keyboard Navigation Within Dropdowns

When a dropdown is open, keyboard navigation applies to its items. Focus management:

**Opening via mouse click:** The dropdown appears; no item is focused initially. First keyboard `ArrowDown` focuses the first non-stub, non-separator item.

**Opening via keyboard (Tab to menu label + Enter):** The dropdown appears and the first non-stub item receives focus.

| Key | Behavior |
|---|---|
| `ArrowDown` | Move focus to the next non-separator, non-stub item. Wraps from last to first. |
| `ArrowUp` | Move focus to the previous non-separator, non-stub item. Wraps from first to last. |
| `Enter` | Activate the focused item (same as click). |
| `Space` | Activate the focused item. |
| `Escape` | Close the dropdown; return focus to the triggering label. |
| `Tab` | Close the dropdown; move focus out of the menu bar entirely to the next focusable element in the page (the BPM input or first arranger element). |
| `ArrowLeft` | Close the current dropdown; open the dropdown for the previous menu label (cycles left through `File → Help → Transport…`). |
| `ArrowRight` | Close the current dropdown; open the dropdown for the next menu label (cycles right). |

Stub items are skipped by arrow key navigation — they are not focusable.

**Focus ring on dropdown items:** `outline: 2px solid C.accent; outline-offset: -2px` (inset outline to stay within the item bounds). The hover background and focus ring may appear simultaneously.

**ARIA on the menu bar:**

```
<nav role="menubar" aria-label="Application menu">
  <button role="menuitem" aria-haspopup="menu" aria-expanded="false|true">File</button>
  <div role="menu" aria-label="File">
    <button role="menuitem">New Session</button>
    <div role="separator" />
    <button role="menuitem">Import Audio</button>
    …
  </div>
  …
</nav>
```

Stub items: `<button role="menuitem" aria-disabled="true">Undo</button>`.

Dynamic label items (Show/Hide Mixer): `aria-label` should reflect the current state: `aria-label="Show mixer panel"` or `aria-label="Hide mixer panel"`.

---

## 8. Keyboard Shortcuts Modal

**Trigger:** Help → Keyboard Shortcuts menu item, or `?` key (Shift+/ on standard US keyboard) when focus is not in an input. The `?` key shortcut is new in Sprint 8. It should be added to the global `keydown` handler in `App`, guarded the same as other shortcuts (skip when `tag === 'INPUT' || tag === 'TEXTAREA'`).

**Overlay:** `position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center`.

**Panel:** `width: 560px; max-height: 80vh; background: C.surface; border: 1px solid C.border; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden`.

**Panel header:** `height: 44px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; background: C.elevated; border-bottom: 1px solid C.border; flex-shrink: 0`.
- Title: `"Keyboard Shortcuts"`. `font-size: 13px; font-weight: 600; color: C.textPri`.
- Close button: `20px × 20px; border-radius: 3px; background: transparent; border: none; color: C.textSec; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center`. Icon: `"×"` character. Hover: `background: C.control; color: C.textPri`. Focus: `outline: 2px solid C.accent; outline-offset: 2px`. `aria-label="Close keyboard shortcuts"`.

**Panel body:** `padding: 16px; overflow-y: auto; flex: 1`.

**Group headings:** `font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: C.textSec; margin-bottom: 6px; margin-top: 16px`. First group has no `margin-top`.

**Shortcut table:** Two columns within each group. Not an HTML `<table>` — use a `div` with `display: grid; grid-template-columns: 1fr auto; row-gap: 1px`.

**Shortcut row:** `height: 26px; display: contents`. Each row has two children:
- Action label cell: `display: flex; align-items: center; padding: 0 8px; font-size: 11px; color: C.textPri; background: C.elevated; border-radius: 3px 0 0 3px`.
- Shortcut key cell: `display: flex; align-items: center; justify-content: flex-end; padding: 0 8px; font-size: 11px; color: C.textSec; background: C.elevated; border-radius: 0 3px 3px 0; font-family: monospace; white-space: nowrap`.

**Alternating rows:** Even rows use `C.elevated`; odd rows use `background: rgba(255,255,255,0.02)`. Apply via CSS `:nth-child` or conditional class — not critical, just adds density readability.

**Separator between groups:** The `margin-top: 16px` on the group heading provides visual separation — no explicit `<hr>` needed.

**Close:** Clicking the close button, clicking the overlay background, or pressing `Escape` closes the modal. Focus returns to the triggering element (the Help menu label or the body if triggered by `?`).

**ARIA:** `role="dialog"; aria-modal="true"; aria-labelledby="shortcuts-title"`.

### Complete Shortcut Inventory (Sprint 8)

All shortcuts that exist in `src/App.tsx` at Sprint 8 ship time, plus the `?` shortcut added in Sprint 8.

**Group: Transport**

| Action | Shortcut |
|---|---|
| Play / Pause | `Space` |

**Group: Tools**

| Action | Shortcut |
|---|---|
| Select tool | `V` |
| Cut tool | `C` |

**Group: Editing**

| Action | Shortcut |
|---|---|
| Fade curve steeper | `Shift + ,` |
| Fade curve shallower | `Shift + .` |
| Rename selected clip (commit) | `Enter` (in rename input) |
| Cancel rename | `Escape` (in rename input) |
| Move focused plugin up | `⌘ + ↑` (in FX panel) |
| Move focused plugin down | `⌘ + ↓` (in FX panel) |

**Group: Import**

| Action | Shortcut |
|---|---|
| Open file import picker | `I` |

**Group: Navigation**

| Action | Shortcut |
|---|---|
| Adjust focused knob/fader up | `↑` (on knob/fader) |
| Adjust focused knob/fader down | `↓` (on knob/fader) |
| Adjust pan knob right (+1) | `→` (on pan knob) |
| Adjust pan knob left (−1) | `←` (on pan knob) |
| Center pan (0) | `Home` (on pan knob) |
| Open comment thread | `Enter` or `Space` (on comment pin) |

**Group: Panels and Modals**

| Action | Shortcut |
|---|---|
| Close modal / deselect track | `Escape` |
| Keyboard shortcuts | `?` |

**DAW convention note:** `Cmd/Ctrl + Z` (Undo) and `Cmd/Ctrl + S` (Save) are not listed because they are not yet wired. Do not include aspirational entries in the Keyboard Shortcuts modal — it only lists what is functional at Sprint 8 ship time.

---

## 9. About DAWin Modal

**Trigger:** Help → About DAWin.

**Overlay:** Same overlay spec as Keyboard Shortcuts Modal: `position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center`.

**Panel:** `width: 320px; background: C.surface; border: 1px solid C.border; border-radius: 6px; padding: 28px 28px 24px; text-align: center`.

**Panel content (top to bottom):**
1. Wordmark: `"DAWin"`. `font-size: 20px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: C.textPri`. Margin below: `4px`.
2. Subtitle: `"Collaborative Studio"`. `font-size: 11px; color: C.textSec; letter-spacing: 0.06em`. Margin below: `20px`.
3. Sprint label: `"Sprint 8 — Playable Beta"`. `font-size: 11px; color: C.textSec`. Margin below: `4px`.
4. Version: `"v0.8.0-beta"`. `font-size: 11px; color: C.textSec; font-family: monospace`. Margin below: `24px`.
5. Close button: full-width, `height: 30px; border-radius: 4px; background: C.control; color: C.textSec; font-size: 12px; border: 1px solid C.border; cursor: pointer`. Label: `"Close"`. Hover: `background: C.metalMid; color: C.textPri`. Focus: `outline: 2px solid C.accent; outline-offset: 2px`.

**Close:** Close button, overlay background click, or `Escape` key. Focus returns to Help menu label.

**ARIA:** `role="dialog"; aria-modal="true"; aria-labelledby="about-title"`. Panel title element: `id="about-title"` on the wordmark element.

**No external links.** No GitHub link, no website link. This is a closed desktop-context panel.

---

## 10. Layout Impact

**Summary of changes to fixed element positioning in `App.tsx`:**

The menu bar is `24px` at `top: 0`. Every other fixed element that was at `top: 0` or `top: TRANSPORT_H` shifts down by `24px`.

| Element | Current `top` | New `top` |
|---|---|---|
| MenuBar (new) | — | `0` |
| TransportBar | `0` | `24px` |
| PluginChainPanel (`position: fixed`, `top: TRANSPORT_H`) | `52px` | `76px` |
| Chat panel (`position: fixed`, `top: TRANSPORT_H`) | `52px` | `76px` |
| Icon rail (`position: fixed`, `top: TRANSPORT_H`) | `52px` | `76px` |
| ThreadPopover (if using fixed positioning) | check implementation | +24px |
| Any other `top: TRANSPORT_H` reference | `52px` | `76px` |

**New constant:** The FE should define `MENU_BAR_H = 24` as a constant alongside the existing layout constants. The combined chrome height `CHROME_TOP = MENU_BAR_H + TRANSPORT_H = 76` can be derived from it.

**StatusBar at bottom:** `bottom: 0; height: STATUS_BAR_H (28px)`. No change.

**Arranger region:** Previously started at `TRANSPORT_H (52px)`. Now starts at `MENU_BAR_H + TRANSPORT_H (76px)`. The ArrangeView must account for this in its height calculation: `height: calc(100vh - 76px - 28px)` instead of `calc(100vh - 52px - 28px)`.

---

## 11. Interaction States — Complete Summary

**Menu label (not open):**
- Rest: `color: C.textSec; background: transparent`
- Hover: `color: C.textPri; background: rgba(255,255,255,0.05)`
- Active (dropdown open): `color: C.textPri; background: C.accentMuted`

**Dropdown item (non-stub):**
- Rest: `color: C.textPri; background: transparent`
- Hover: `background: rgba(107,92,231,0.18); color: C.textPri`
- Pressed: `background: rgba(107,92,231,0.35)`
- Keyboard focused: `outline: 2px solid C.accent; outline-offset: -2px`

**Dropdown item (stub):**
- All states: `color: C.textPri; opacity: 0.4; background: transparent`. No hover, no focus ring.

**Dynamic label items (Show/Hide Mixer, etc.):**
- Label text changes to reflect current state. No icon — text label only.

---

## 12. DAW Convention Callouts

**Menu bar at 24px:** Native macOS menu bars are typically 22–24px. At 24px, this matches the Ableton Live application chrome height. Do not reduce to 20px — the hit targets for 11px text need adequate padding.

**`Space` in Transport menu:** The spacebar shortcut hint is shown for Play/Pause. The global `keydown` handler for `Space` must remain active while a menu is open ONLY if no dropdown item has keyboard focus. If a dropdown is open and an item is focused, `Space` should activate the item (not play/pause). The FE must guard the global `Space` handler: skip it when `document.activeElement` is within the menu bar component.

**Standard menu behavior:** Users expect menu items to fire on `mouseup`, not `mousedown`. The `mousedown` event should provide the pressed visual state; the action fires on `mouseup`. This prevents accidental activation during click-and-drag near menu labels.

**`Escape` closes menu, not app:** The existing global `Escape` handler closes the InviteModal and deselects tracks. Sprint 8 must ensure that when a menu dropdown is open, `Escape` closes the dropdown (and stops propagation) before the global handler has a chance to run. The menu's `Escape` handler should call `event.stopPropagation()`.

---

## 13. Accessibility

**Menu bar ARIA roles:**

```
<nav role="menubar" aria-label="Application menu">
  <button
    role="menuitem"
    aria-haspopup="menu"
    aria-expanded={open ? "true" : "false"}
    aria-controls="menu-file"
  >File</button>
  <div
    id="menu-file"
    role="menu"
    aria-label="File menu"
  >
    <button role="menuitem">New Session</button>
    <button role="menuitem">Open Session…</button>
    <div role="separator" />
    <button role="menuitem">Import Audio</button>
    <div role="separator" />
    <button role="menuitem">Leave Session</button>
  </div>
  …
</nav>
```

**Stub items:** `<button role="menuitem" aria-disabled="true" tabindex="-1">Undo</button>`. The `tabindex="-1"` removes them from the Tab order. Arrow key navigation skips them.

**Dynamic label items:** The `aria-label` on the button reflects the current state: `aria-label="Show mixer panel"` when mixer is hidden, `aria-label="Hide mixer panel"` when mixer is visible. The visible text label also updates — no mismatch between visible label and ARIA label.

**Focus trap:** When a dropdown is open, Tab closes the menu and moves focus to the next focusable element in the page (standard ARIA menu pattern — no focus trap within the dropdown). Arrow keys navigate within the dropdown.

**Focus return on close:** Closing via Escape or Tab returns focus to the triggering menu label button. Closing via click outside does not return focus (standard behavior — user clicked elsewhere).

**Keyboard Shortcuts Modal focus trap:** Unlike the menu dropdowns, the Keyboard Shortcuts modal IS a focus trap (`role="dialog"; aria-modal="true"`). Tab cycles between interactive elements inside the modal (close button only, in this modal — Tab should loop to close button). Escape closes and returns focus.

**Screen reader announcement for dynamic labels:** When the mixer is shown/hidden via the View menu, an `aria-live="polite"` region in the status bar or elsewhere should announce the change: `"Mixer panel shown"` / `"Mixer panel hidden"`. This is a small enhancement — the FE should use the existing StatusBar or a dedicated live region.

---

## Design Tokens Reference

| Token | Value | Used in menu bar |
|---|---|---|
| `C.bg` | `#0A0A0F` | — |
| `C.surface` | `#111118` | Keyboard Shortcuts and About panel backgrounds |
| `C.elevated` | `#1A1A24` | Menu bar background, dropdown panels, shortcut row cells |
| `C.control` | `#2A2A38` | Close button background (About modal) |
| `C.border` | `#1E1E28` | Menu bar bottom edge, dropdown borders, separators |
| `C.metalMid` | `#2A2A3C` | Close button hover (About modal) |
| `C.accent` | `#6B5CE7` | Active label background (via `accentMuted`), item hover bg, focus rings |
| `C.accentMuted` | `rgba(107,92,231,0.13)` | Active menu label background |
| `C.textPri` | `#F0F0F5` | Menu item labels, modal title |
| `C.textSec` | `#888899` | Menu label rest state, shortcut hints, wordmark, metadata |

---

## Implement This First

**Implement the menu bar chrome with all six dropdowns rendering correctly (including stub visual treatment) before wiring any actions.** A correctly positioned, styled, opening, and closing menu bar with working keyboard navigation is the foundation. Wire actions in this order: Transport (Play/Pause, Stop, RTZ are one-liners), then View (Show/Hide Chat is already implemented), then File (New Session and Leave Session), then Help (opens the two modals). Edit and Session actions can follow once the bar is stable.
