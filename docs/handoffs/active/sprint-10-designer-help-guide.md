# Work Order: Designer — DAWin User Help Guide

**To:** Designer
**From:** Tech Lead / PM
**Sprint:** 10
**Date issued:** 2026-05-31
**Status:** Unblocked — start immediately. No spec gate, no ADR gate.
**Output location:** `docs/guides/dawin-user-guide.md`

---

## Objective

Write the first version of the DAWin User Help Guide. This is a living manual that explains how the current product works. It should be clear enough that a musician can open it, understand every current feature, and stay focused on the right feedback when testing the demo.

This guide is not documentation for agents. It is documentation for humans — musicians, collaborators, and friend-testers who encounter DAWin for the first time.

---

## Why this exists

DAWin is approaching the point where it can be shown to musician friends for real feedback. Before that, a Help Guide is required:

1. Testers need to know what features exist so they give feedback on the right things.
2. Known limitations must be documented honestly so testers do not waste time on future work.
3. Every future sprint should update this guide in parallel with shipping features. We should never be in a state where the product exists but no one can explain how to use it.

---

## Output file

Create `docs/guides/dawin-user-guide.md`.

If `docs/guides/` does not exist, create the directory with a `README.md` index.

---

## Required sections

Write each section at a level appropriate for a musician or producer who has used other DAWs. Assume basic DAW literacy but no prior DAWin knowledge.

### 1. What is DAWin?

One paragraph. The DAWin collaboration promise in plain language.

### 2. Getting started

#### Session Lobby
- What the lobby is
- Creating a new session (what happens, what you get)
- Joining an existing session by ID
- Recent sessions list
- What happens if a session ID is invalid

#### Session URL and sharing
- The `?session=` URL parameter
- How to share your session with a collaborator

### 3. The session room layout

Overview of the three main areas:
- The arranger / timeline (top)
- The mixer (bottom)
- The FX / plugin panel (right, when open)
- Resizing panels: drag the splitter between arranger and mixer up/down; drag the FX panel splitter left/right (Sprint 9)

### 4. Transport controls

- Play / Pause — `Space`
- Stop — preserves playhead position (does not return to zero)
- Return to Zero — resets playhead to bar 1
- BPM — click to edit; valid range 40–300
- Loop button — enables loop region playback
- Record button — explain current state: UI exists, in-browser capture coming in a future sprint

### 5. Importing audio

- File picker: `I` key or File → Import Audio
- Drag and drop audio files onto the arranger
- What happens after import (upload to cloud, waveform appears)
- Supported formats

### 6. Arranger / timeline basics

- The ruler and bar numbers
- Playhead — click anywhere on the ruler to seek
- Tracks — each track is a row

#### Clips
- Selecting a clip (Select tool, `V`)
- Moving a clip (drag)
- Resizing a clip (drag left/right handle)
- Cutting a clip (Cut tool, `C`, then click)
- Duplicating a clip (context menu or Edit menu)
- Deleting a clip (Delete/Backspace or context menu)
- Renaming a clip (double-click name)

#### Fades and crossfades
- Fade in: drag the top-left corner of a clip
- Fade out: drag the top-right corner of a clip
- Crossfade: overlap two clips on the same track — crossfade appears automatically

#### Horizontal zoom (Sprint 9)
- Zoom In: `=` key or View → Zoom In
- Zoom Out: `-` key or View → Zoom Out
- Reset Zoom: `0` key or View → Reset Zoom
- Scroll-wheel zoom: hold Ctrl (Windows/Linux) or Cmd (Mac) while scrolling
- Zoom indicator: visible in the ruler bar (shows `100%` at default zoom)
- Zoom range: 25% to 400%

#### Vertical track zoom (Sprint 9)
- Expand a track: click the ▼ chevron in the track header
- Collapse a track: click the ▲ chevron in the track header
- Range: 50% to 300% of default track height

### 7. Track headers

For each track:
- Track name (double-click to rename)
- Collaborator color bar (left edge)
- Mute button
- Solo button
- Record arm button
- Lock indicator (locked tracks cannot be edited by non-owners)
- Vertical zoom chevrons (▲ / ▼)

### 8. Collaborator colors and track ownership

- Each collaborator is assigned a unique color
- That color tints their track header and clips
- Ownership is visible from the arranger — no guessing who owns what
- You can only edit tracks you own (or unlocked tracks if you have Editor role)

### 9. Roles and permissions

| Role | Can do |
|---|---|
| Owner | Full session control, all editing, invite/manage collaborators |
| Editor / Collaborator | Edit own tracks, mix, comment, chat |
| Viewer | Play, comment, chat — no editing |

### 10. Mixer

- Each track has a strip in the mixer
- Volume fader (logarithmic curve, unity at ~75% travel)
- Pan knob (center detent)
- Mute button
- Solo button
- Stereo VU meters (post-fader)
- Master strip: controls overall output volume and pan

#### Resizing the mixer (Sprint 9)
- Drag the horizontal splitter between the arranger and mixer up or down
- Double-click the splitter to reset to default proportions

### 11. FX / Plugin panel

- Open: View → Show FX Panel (or menu shortcut)
- Each track's plugin chain is shown when the track is selected
- Click a plugin to expand its parameters
- Toggle bypass without removing the plugin

#### Resizing the FX panel (Sprint 9)
- Drag the vertical splitter at the left edge of the FX panel
- Double-click to reset to default width

### 12. Comments

- Click the comment icon on any clip or track
- Type a comment and press Enter to submit
- Reply to a comment thread
- Resolve a comment when addressed
- Reopen a resolved comment

### 13. Chat

- Chat panel is separate from comments
- Use for general session conversation, not timeline-anchored feedback
- Unread indicator in the toolbar

### 14. Deep links

- Copy a link to the current playhead position: Session → Copy Deep Link
- Share it — opening the link navigates to the exact moment and highlights the target
- Links can reference a moment, a track, a clip, or a time range

### 15. Menu bar reference

Brief description of each menu and its most important active items. Mark clearly which items are **active** vs **currently unavailable (stub)**.

#### File
- New Session, Open Session, Open Recent, Import Audio, Leave Session (active)
- Export Mix — not yet available

#### Edit
- Cut, Duplicate, Delete, Rename (active)
- Undo/Redo — not yet available (architecture required)

#### Session
- Copy Session Link, Copy Deep Link, Open Chat (active)

#### View
- Show/Hide Mixer, Show/Hide FX Panel, Show/Hide Chat (active)
- Zoom In, Zoom Out, Reset Zoom (active — Sprint 9)

#### Transport
- Play/Pause, Stop, Return to Zero, Set BPM, Toggle Loop (active)
- Record — UI visible; in-browser capture not yet available

#### Help
- Keyboard Shortcuts (`?`)
- About DAWin

### 16. Keyboard shortcuts reference

List every currently wired shortcut. Do not list shortcuts that are stubs or not yet implemented — testers will try them and get confused.

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause |
| `V` | Select Tool |
| `C` | Cut Tool |
| `I` | Import Audio (file picker) |
| `=` | Zoom In |
| `-` | Zoom Out |
| `0` | Reset Zoom |
| `Cmd/Ctrl + scroll` | Scroll-wheel zoom |
| `?` | Open Keyboard Shortcuts modal |
| `Escape` | Close modal / deselect |

### 17. Known limitations

Be honest. This section makes testers more useful, not less.

- **In-browser recording** — not yet available. Import audio files instead.
- **Export / mix bounce** — not yet available. Cannot get audio out of the session yet.
- **Undo / Redo** — not yet available. Be careful with destructive edits.
- **Add or delete tracks** — the session has a fixed 7-track layout in the current demo. Adding/removing tracks is planned for a future sprint.
- **Native VST/VSTi plugins** — the web version uses Web Audio effects only. Native plugin hosting is a future desktop feature.
- **Plugin parameter editing** — parameter UI exists but full editing may be limited.
- **Mobile** — DAWin is desktop-first. Minimum 1280px wide. Mobile support is planned for a future sprint.
- **Offline mode** — DAWin requires a network connection to the backend for session sync, audio storage, and collaboration.

### 18. What is real vs. what is planned

Honest overview so testers know where to focus.

**Real today (Sprint 9 baseline):**
- Session create/join/recent
- Imported audio playback from cloud storage
- Drag/drop and file picker import
- Full clip editing: move, resize, cut, duplicate, delete, rename
- Fade in/out, crossfade
- Mixer: volume, pan, mute, solo, VU meters
- Plugin chain with Web Audio effects
- Track lock and role enforcement
- Comments, replies, resolve/reopen
- Chat
- Deep links (playhead, track, clip, range)
- Application menu bar
- Keyboard shortcuts modal
- Resizable workspace panels (Sprint 9)
- Arranger horizontal and vertical zoom (Sprint 9)
- Collaborator presence and ownership colors

**Planned (not yet in demo):**
- In-browser audio recording
- Export / mix bounce
- Undo/Redo
- Add/delete/reorder tracks
- Owner Continuity Bounce (when instrument owner leaves session)
- Native plugin support (desktop app)
- Mobile capture
- Stem export

---

## Design constraints

- Use clear, plain language. No internal jargon (no agent roles, no sprint numbers, no "FR-01").
- Do not hardcode hex values — reference features by behavior, not by color names.
- Do not invent features that do not exist. If something is planned, mark it "planned" or "not yet available."
- Keep the guide accurate as of Sprint 9 close (2026-05-29). The Tech Lead will add a header note if the guide becomes stale.

---

## Acceptance criteria

- [ ] `docs/guides/dawin-user-guide.md` exists
- [ ] All 18 sections above are present and complete
- [ ] Every shipped Sprint 9 feature is documented (resizable panels, zoom)
- [ ] Every known limitation is listed honestly
- [ ] "What is real vs. planned" section is accurate and complete
- [ ] No features are described that are not yet shipped
- [ ] Keyboard shortcuts section matches only wired shortcuts
- [ ] No hex color values appear in the guide
- [ ] Drop `docs/handoffs/sprint-10-designer-help-guide-done.md` confirming completion

---

## Commit requirements

- Commit message: `docs: add DAWin user help guide`
- Include: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

---

## Files to touch

- `docs/guides/dawin-user-guide.md` — create
- `docs/guides/README.md` — create (index file for the guides directory)

## Files to not touch

- `src/` — Designer agents may not edit source files
- `docs/specs/` — do not modify existing specs
- `STATUS.md` — Tech Lead only
