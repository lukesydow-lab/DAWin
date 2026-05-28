# Spec: Keyboard Shortcuts (System Map)

**Status:** Living document — single source of truth for all keyboard shortcuts in DAWin.
**Last reviewed:** 2026-05-18
**Owner:** Designer (coordinated with Tech Lead)

---

## Purpose

Keyboard shortcuts are a finite, contested resource. Without a central map, features collide, muscle memory drifts, and the product feels incoherent. This doc lists every shortcut wired today, every shortcut planned, every reserved convention, and the process for requesting new ones.

**Rule:** No new shortcut ships without an entry in this doc. Any feature proposing a new shortcut must reference this doc in its spec.

---

## 1. Wired shortcuts (currently in `src/App.tsx`)

| Key | Action | Scope | Notes |
|---|---|---|---|
| `Space` | Play / pause | Global | Skipped in `INPUT` / `TEXTAREA` |
| `Escape` | Close modal · deselect track | Global + modal-scoped | |
| `V` | Switch to Select tool | Global | Skipped in inputs |
| `C` | Switch to Cut tool | Global | Skipped in inputs |
| `Shift + ,` (`<`) | Bend selected clip's fade curves down by 0.05 | Global | |
| `Shift + .` (`>`) | Bend selected clip's fade curves up by 0.05 | Global | |
| `↑` / `↓` | Fine-adjust focused knob/fader by 1 | Component | Knob, fader |
| `←` / `→` | Pan knob adjust by 1 | Component | Pan knob |
| `Home` | Center pan (0) | Component | Pan knob |
| `Enter` / `Space` | Open comment thread on focused pin | Component | Comment ruler |
| `Cmd/Ctrl + ↑` / `↓` | Move focused plugin up/down chain | Component | Plugin chain |

## 2. Designed but not yet wired

| Key | Action | Spec source |
|---|---|---|
| `T` (hold) | **Push-to-talk** | [p2p-foundation.html](../../public/comps/p2p-foundation.html), this doc |
| ~~`X`~~ | ~~Crossfade tool~~ — **removing** | [crossfade-direct-manipulation.md](crossfade-direct-manipulation.md) |
| `Cmd/Ctrl + Shift + E` | Emoji reaction picker (Round 2 P2P) | proposed |
| `Cmd/Ctrl + Shift + S` | Open soundboard (Round 2 P2P) | proposed |
| `Cmd/Ctrl + Shift + G` | Toggle gallery view (Round 3 P2P) | proposed |

## 3. Reserved — DAW conventions we must respect

Do not bind these. They are the muscle memory of every user who's used a DAW before.

| Modifier / Key | Convention | Source |
|---|---|---|
| `Option/Alt` + drag | Duplicate clip | Pro Tools, Logic |
| `Cmd/Ctrl` + drag | Constrain drag axis | Most apps |
| `Shift` + click | Extend selection | Universal |
| `Cmd/Ctrl + Z` / `Y` | Undo / redo | Universal |
| `Cmd/Ctrl + S` | Save | Universal |
| `Cmd/Ctrl + N` / `T` | New project / New track | Pro Tools, Logic |
| `Cmd/Ctrl + D` | Duplicate selection | Universal |
| `Tab` | Next clip edge / next track | Pro Tools |
| `R` (when track focused) | Arm record | Pro Tools, Logic |
| `M` (when track focused) | Mute | Universal |
| `S` (when track focused) | Solo | Universal |
| `L` | Loop | Universal |
| `I` / `O` | Mark in / mark out | Pro Tools |
| `B` | Bounce | Pro Tools |
| `K` | Sticky / metronome | Logic |

## 4. Future-reserved within DAWin (deliberately held)

These letters are not currently bound but we've discussed claiming them for specific future features. Don't grab them.

| Key | Reserved for | Rationale |
|---|---|---|
| `Y` | Tap tempo | T was the natural mnemonic but we gave it to Talk. Y is the next sensible key. |
| `X` | Trim tool (if added) | X is now free after the Crossfade tool was removed; reserve for clip-boundary trimming. |
| `D` | Draw / pencil tool (MIDI editing) | Standard letter for draw tool. |
| `E` | Eraser tool (MIDI editing) | Standard letter for eraser. |
| `Z` | Zoom tool / zoom presets | Standard letter for zoom. |

## 5. Letter keys still available

`A · F · G · H · J · N · P · Q · U · W` — open for assignment. Bring proposals.

---

## Default vs. user-rebindable

**Locked defaults (cannot be rebound):**
- Transport: `Space`, `Esc`
- Edit modifiers: `Cmd/Ctrl + Z/Y/S/D`
- Standard tool letters: `V`, `C`

**Rebindable in Preferences (eventually):**
- Push-to-talk key — `T` is default. Gamers/musicians have strong preferences (Caps Lock, side mouse buttons, backtick). Let them choose.
- Soundboard pad triggers (when Round 2 ships)
- Optional secondary bindings for tools

---

## The process for adding a new shortcut

1. **Read this doc** to check what's claimed and reserved.
2. **In your feature spec**, add a "Keyboard shortcuts" section listing the proposed bindings.
3. **In your handoff to Tech Lead**, add an open question: "Confirm `<key>` is free." Reference this doc.
4. **Tech Lead approves** the binding. The Designer updates this doc with the new entry — moving it from "designed but not yet wired" to "wired" once the engineer ships it.

This keeps the map honest. If we skip step 4 we'll have a feature shipped against a shortcut that's not in the central record.

---

## Notes on the `T` decision (2026-05-17)

`T` for push-to-talk was chosen after considering:
- `Option/Alt` (rejected — collides with Pro Tools "Option-drag to duplicate")
- `Cmd + T` (rejected — browser intercepts as "New Tab"; awkward to hold as a combo)
- `Backtick (`` ` ``)` (viable alternative — no mnemonic but lowest collision risk)
- `Caps Lock` (gaming convention but OS override is finicky)

Trade-offs made:
- `T` for **Tap tempo** moves to `Y` (or stays UI-button-only)
- `T` for **Trim tool** moves to `X` (now free since Crossfade was removed)

The mnemonic value of "T = Talk" plus the visual reinforcement on the button face itself (the button shows the letter `T` prominently) made T the right choice. See the p2p-foundation prototype.
