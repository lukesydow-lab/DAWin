# DAWin User Guide

**Version:** Sprint 9 baseline (last updated 2026-05-29)
**Status:** Current

This guide covers everything the current DAWin demo can do. If something is not in this guide, it is either not yet built or is a known stub. The "Known Limitations" and "What Is Real vs. Planned" sections at the end are the honest truth — read them before testing so you know where to focus your feedback.

---

## Table of contents

1. [What is DAWin?](#1-what-is-dawin)
2. [Getting started](#2-getting-started)
3. [The session room layout](#3-the-session-room-layout)
4. [Transport controls](#4-transport-controls)
5. [Importing audio](#5-importing-audio)
6. [Arranger / timeline basics](#6-arranger--timeline-basics)
7. [Track headers](#7-track-headers)
8. [Collaborator colors and track ownership](#8-collaborator-colors-and-track-ownership)
9. [Roles and permissions](#9-roles-and-permissions)
10. [Mixer](#10-mixer)
11. [FX / Plugin panel](#11-fx--plugin-panel)
12. [Comments](#12-comments)
13. [Chat](#13-chat)
14. [Deep links](#14-deep-links)
15. [Menu bar reference](#15-menu-bar-reference)
16. [Keyboard shortcuts reference](#16-keyboard-shortcuts-reference)
17. [Known limitations](#17-known-limitations)
18. [What is real vs. what is planned](#18-what-is-real-vs-what-is-planned)

---

## 1. What is DAWin?

DAWin is a collaborative DAW built for the web. You and your collaborators share a live session where every track has an owner, every edit is visible in real time, and the arrangement, mixer, and plugin chain are all in one place. It is designed for musicians who want the density and precision of a pro audio tool without losing track of who is doing what — because in DAWin, your color is always on your tracks.

---

## 2. Getting started

### Session Lobby

When you first open DAWin, you land in the Session Lobby. This is where you create or join a session before entering the main workspace.

**Creating a new session**

Click "New Session." DAWin generates a unique session ID, opens the session room, and gives you a starting set of tracks. You are automatically the session Owner.

**Joining an existing session by ID**

If a collaborator has shared their session ID with you, type it into the "Join Session" field and press Enter. You will enter the session room as a Collaborator.

**Recent sessions**

The lobby shows your recent sessions as a list. Click any entry to rejoin that session directly.

**Invalid session ID**

If you enter a session ID that does not exist or is no longer active, DAWin will show an error message in the lobby and let you try again. You will not leave the lobby.

### Session URL and sharing

Every session has a URL in the form `https://dawin.app/?session=<session-id>`. Once you are inside a session, copy the URL from your browser's address bar and share it with anyone you want to invite. When they open the link, they go directly into that session.

You can also use the Invite flow: open the Session menu and choose "Copy Session Link" to copy the URL to your clipboard without leaving the menu.

---

## 3. The session room layout

The session room has three main areas.

**Arranger / timeline (top)**
The arranger takes up most of the screen. It shows all tracks as horizontal rows, with audio clips placed on a timeline measured in bars. The ruler at the top shows bar numbers and the current playhead position.

**Mixer (bottom)**
The mixer shows a vertical strip for every track plus a master strip. Use it to control volume, pan, mute, solo, and to monitor levels on the VU meters.

**FX / Plugin panel (right, when open)**
When visible, the FX panel shows the plugin chain for the currently selected track. Open or close it from the View menu.

### Resizing panels

**Arranger / mixer split** — find the horizontal divider bar between the arranger and the mixer. Drag it up to give the mixer more height, or drag it down to give the arranger more height. The splitter is also keyboard-accessible: click it to focus it, then press Arrow Up / Arrow Down to nudge in 8px steps, Home to snap to minimum mixer height, End to snap to maximum, and Enter or Space to reset to default proportions.

**FX panel width** — find the vertical divider bar at the left edge of the FX panel. Drag it left to make the panel wider, or drag it right to make it narrower. Keyboard: Arrow Left / Arrow Right to nudge, Home to snap to minimum width, End to snap to maximum, Enter or Space to reset to default width.

---

## 4. Transport controls

The transport bar sits at the top of every screen.

| Control | What it does |
|---|---|
| **Play / Pause** | Starts or stops playback. Shortcut: `Space`. |
| **Stop** | Stops playback and holds the playhead at its current position. It does not jump back to bar 1. |
| **Return to Zero** | Moves the playhead back to the beginning (bar 1) without starting playback. |
| **BPM** | Click the BPM display to edit the session tempo. Type a number and press Enter. Valid range is 40–300 BPM. |
| **Loop** | Toggles loop region playback on and off. When active, playback repeats the defined loop region. |
| **Record** | The record button is visible in the transport. In-browser audio capture is not yet available — this button is a placeholder for a future sprint. Import audio files instead. |

---

## 5. Importing audio

DAWin does not yet support in-browser recording. You bring audio in by importing files.

**Using the file picker**

Press `I` or go to File → Import Audio. A file picker opens. Select one or more audio files.

**Drag and drop**

Drag audio files from your computer's file manager and drop them onto the arranger. Drop them onto an existing track to place clips there, or onto an empty area to create new clips.

**After import**

DAWin uploads the file to cloud storage, processes the waveform, and places a clip on the arranger. The waveform thumbnail appears in the clip once processing is complete. Clip placement is based on where you dropped the file or the current playhead position.

**Supported formats**

Standard web audio formats: WAV, MP3, OGG, FLAC, and AAC. If a file fails to import, try converting it to WAV first.

---

## 6. Arranger / timeline basics

### The ruler and bar numbers

The ruler runs across the top of the arranger. Numbers label every bar. The current zoom level is shown as a percentage in the ruler (for example, "100%" at default zoom).

### Playhead

The playhead is the vertical line that moves during playback. Click anywhere on the ruler to jump the playhead to that position.

### Tracks

Each track is a horizontal row in the arranger. The track header is on the left; clips appear to the right on the timeline.

---

### Clips

**Selecting a clip**

Make sure you are using the Select tool (press `V`). Click a clip to select it. A selected clip is visually highlighted.

**Moving a clip**

With the Select tool active, drag a clip left or right to move it along the timeline. You can also drag it to a different track row.

**Resizing a clip**

Hover over the left or right edge of a clip. The cursor changes to a resize indicator. Drag inward to shorten the clip or outward to reveal more of the audio file.

**Cutting a clip**

Press `C` to switch to the Cut tool. Click anywhere on a clip to split it at that point, creating two clips.

**Duplicating a clip**

Select a clip, then use Edit → Duplicate, or right-click the clip for the context menu. The duplicate appears immediately after the original.

**Deleting a clip**

Select a clip and press Delete or Backspace, or use Edit → Delete Clip, or right-click for the context menu.

**Renaming a clip**

Double-click the clip's name label to enter rename mode. Type the new name and press Enter to confirm, or Escape to cancel.

---

### Fades and crossfades

**Fade in**

Hover over the top-left corner of a clip. Drag right to extend the fade in.

**Fade out**

Hover over the top-right corner of a clip. Drag left to extend the fade out.

**Adjusting fade curve shape**

With a clip selected, press `Shift+,` (less-than key) to make the fade curve steeper, or `Shift+.` (greater-than key) to make it shallower. Each keypress adjusts the curve by a small amount.

**Crossfade**

Overlap two clips on the same track by dragging one so it overlaps the other. A crossfade region appears automatically in the overlap zone.

---

### Horizontal zoom

The arranger zoom controls how many bars fit on screen. More zoom in = fewer bars visible, more detail. More zoom out = more bars visible, less detail. The zoom range is 25% to 400%.

| Action | How to do it |
|---|---|
| Zoom in | Press `=` or use View → Zoom In |
| Zoom out | Press `-` or use View → Zoom Out |
| Reset to 100% | Press `0` or use View → Reset Zoom |
| Scroll-wheel zoom | Hold Cmd (Mac) or Ctrl (Windows/Linux) and scroll the mouse wheel over the arranger |

The current zoom level is displayed as a percentage in the ruler bar. The zoom anchors to the playhead position when using keyboard shortcuts, and to the cursor position when using scroll-wheel zoom.

---

### Vertical track zoom

Each track can be independently resized in height.

**Expand a track:** click the downward chevron (▼) in the track header. The track grows taller, giving you more vertical space to see waveform detail.

**Collapse a track:** click the upward chevron (▲) in the track header. The track shrinks back down.

The height range is 50% to 300% of the default track height. Changes are per-track and do not affect other tracks.

---

## 7. Track headers

Each track has a header on the left side of the arranger. From top to bottom:

- **Track name** — double-click to rename
- **Collaborator color bar** — a colored stripe on the left edge of the header showing which collaborator owns this track
- **Mute button** — silences the track in the mix
- **Solo button** — isolates this track (all others are silenced)
- **Record arm button** — arms the track for recording (in-browser recording is planned, not yet available)
- **Lock indicator** — a padlock icon appears when the track is locked. Locked tracks cannot be edited by anyone except the owner
- **Vertical zoom chevrons (▲ / ▼)** — expand or collapse track height (see Vertical track zoom above)

---

## 8. Collaborator colors and track ownership

Every collaborator in a DAWin session is assigned a unique color when they join. That color appears:

- As a stripe on the left edge of their track header in the arranger
- As a tint on the clips they own on the timeline
- On their avatar in the collaborator presence indicators

This means you can tell who owns what at a glance without reading names. If a clip has your collaborator's color, they created it and (depending on lock state) may be the only one who can edit it.

**Ownership rules:**

- You can only edit tracks you own.
- If a track is unlocked and you have Editor role, you may edit it even if you did not create it.
- Locked tracks display the padlock indicator and can only be edited by their owner.

---

## 9. Roles and permissions

| Role | Can do |
|---|---|
| **Owner** | Full session control — all editing, adding collaborators, managing roles, changing session settings |
| **Editor / Collaborator** | Edit your own tracks, adjust the mix, add comments, participate in chat |
| **Viewer** | Play back the session, add comments, participate in chat — no editing |

Your role is assigned when you join the session. The session Owner can change roles from the collaborator management panel.

---

## 10. Mixer

The mixer is at the bottom of the session room. It has one strip per track plus a master strip on the right.

Each strip contains:

- **Volume fader** — controls the track level. The fader uses a logarithmic curve so small movements at the bottom are fine adjustments and the same movement near the top is a larger jump. Unity gain (0 dB) is at approximately 75% of fader travel — the same convention as hardware consoles and most DAWs.
- **Pan knob** — controls left/right position in the stereo field. Center detent at 12 o'clock. Arrow keys adjust the focused knob; press `Home` to return pan to center.
- **Mute button** — same as mute in the track header. Both stay in sync.
- **Solo button** — same as solo in the track header. Both stay in sync.
- **Stereo VU meters** — show the post-fader signal level for left and right channels. Metered after the gain stage (IEC standard).

The **master strip** controls the overall session output volume and pan.

### Resizing the mixer

Drag the horizontal splitter between the arranger and the mixer up to give the mixer more height, down to give the arranger more. Double-click the splitter to reset both panels to their default proportions.

---

## 11. FX / Plugin panel

The FX panel shows the plugin chain for the currently selected track.

**Opening and closing the FX panel:** go to View → Show FX Panel or View → Hide FX Panel to toggle it.

**Viewing a track's plugins:** click a track (in the arranger or mixer) to select it. Its plugin chain appears in the FX panel.

**Expanding a plugin:** click a plugin in the chain to expand its parameter controls.

**Bypassing a plugin:** each plugin has a bypass toggle. Click it to disable the plugin without removing it from the chain. Click again to re-enable.

**Reordering plugins:** with focus on a plugin, press Cmd+↑ or Cmd+↓ to move it up or down in the chain.

### Resizing the FX panel

Drag the vertical splitter at the left edge of the FX panel left to make the panel wider, or right to make it narrower. Double-click the splitter to reset it to the default width.

---

## 12. Comments

Comments are anchored to clips or tracks on the timeline. Use them for specific, time-stamped feedback.

**Adding a comment:** click the comment icon on a clip or track. A comment input appears.

**Submitting:** type your comment and press Enter.

**Replying:** click an existing comment to open the thread. Type a reply and press Enter.

**Resolving:** click the resolve button on a comment thread when the feedback has been addressed. Resolved comments are hidden by default.

**Reopening:** if a resolved comment is still relevant, you can reopen it from the resolved comments view.

---

## 13. Chat

The chat panel is separate from comments. Use it for general conversation about the session — not for timeline-anchored feedback (use Comments for that).

**Opening chat:** go to Session → Open Chat.

**Posting a message:** type in the chat input and press Enter.

**Unread indicator:** if there are new chat messages while the panel is closed or not in focus, an unread indicator appears in the toolbar.

---

## 14. Deep links

Deep links let you share a precise moment in a session with a collaborator.

**Copying a deep link:** go to Session → Copy Deep Link. DAWin copies a URL that encodes the current playhead position.

**Using a deep link:** open the URL in a browser. DAWin opens the session and navigates to the exact moment, highlighting the referenced target.

Deep links can reference:
- A playhead moment
- A specific track
- A specific clip
- A time range

---

## 15. Menu bar reference

The menu bar sits at the top of the session room. Items marked **(stub)** are visible but not yet functional — clicking them does nothing or shows a "not yet available" message.

### File

| Item | Status |
|---|---|
| New Session | Active |
| Open Session | Active |
| Open Recent | Active |
| Import Audio | Active — shortcut `I` |
| Leave Session | Active |
| Export Mix | **Stub** — not yet available |

### Edit

| Item | Status |
|---|---|
| Cut | Active |
| Duplicate | Active |
| Delete | Active |
| Rename | Active |
| Undo | **Stub** — not yet available |
| Redo | **Stub** — not yet available |
| Select All | **Stub** — not yet available |

### Session

| Item | Status |
|---|---|
| Copy Session Link | Active |
| Copy Deep Link | Active |
| Open Chat | Active |

### View

| Item | Status |
|---|---|
| Show/Hide Mixer | Active |
| Show/Hide FX Panel | Active |
| Show/Hide Chat | Active |
| Zoom In | Active — shortcut `=` |
| Zoom Out | Active — shortcut `-` |
| Reset Zoom | Active — shortcut `0` |

### Transport

| Item | Status |
|---|---|
| Play / Pause | Active — shortcut `Space` |
| Stop | Active |
| Return to Zero | Active |
| Set BPM | Active |
| Toggle Loop | Active |
| Record | **Stub** — UI visible; in-browser capture not yet available |

### Help

| Item | Status |
|---|---|
| Keyboard Shortcuts | Active — shortcut `?` |
| About DAWin | Active |

---

## 16. Keyboard shortcuts reference

These are all currently wired shortcuts. Shortcuts listed here do something. If a shortcut is not in this table, it is not yet implemented — do not report missing shortcuts as bugs during early testing.

Shortcuts are disabled when focus is inside a text input (for example, the BPM field, a rename input, or the chat box).

### Playback

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause |

### Tools

| Shortcut | Action |
|---|---|
| `V` | Switch to Select tool |
| `C` | Switch to Cut tool |

### Zoom

| Shortcut | Action |
|---|---|
| `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom to 100% |
| `Cmd + scroll` (Mac) | Zoom in/out with scroll wheel |
| `Ctrl + scroll` (Windows/Linux) | Zoom in/out with scroll wheel |

### File

| Shortcut | Action |
|---|---|
| `I` | Open file import picker |

### Editing

| Shortcut | Action |
|---|---|
| `Shift + ,` | Make active clip fade curve steeper |
| `Shift + .` | Make active clip fade curve shallower |

### Mixer / FX

| Shortcut | Action |
|---|---|
| `↑` | Adjust focused fader or knob up |
| `↓` | Adjust focused fader or knob down |
| `→` | Pan focused knob right (+1) |
| `←` | Pan focused knob left (−1) |
| `Home` | Center focused pan knob (return to 0) |
| `Cmd + ↑` | Move focused plugin up in chain |
| `Cmd + ↓` | Move focused plugin down in chain |

### Panel splitters (when splitter is focused)

| Shortcut | Action |
|---|---|
| `↑` / `↓` | Nudge arranger/mixer split up or down |
| `←` / `→` | Nudge FX panel width left or right |
| `Home` | Snap splitter to minimum |
| `End` | Snap splitter to maximum |
| `Enter` or `Space` | Reset splitter to default position |

### Navigation and UI

| Shortcut | Action |
|---|---|
| `Enter` or `Space` | Open focused comment thread |
| `Escape` | Close modal / deselect track / cancel rename |
| `?` | Open Keyboard Shortcuts modal |

---

## 17. Known limitations

These are real limitations in the current demo. They are not bugs — they are features that have not been built yet. Knowing this up front makes your feedback more useful.

**In-browser recording** — not yet available. The record button is visible in the transport but does nothing. To get audio into a session, import files using `I` or drag and drop.

**Export / mix bounce** — not yet available. You cannot get audio out of a session yet. Export Mix appears in the File menu but is a stub.

**Undo / Redo** — not yet available. There is no undo history. Be careful with destructive edits (cutting, deleting). Undo and Redo appear in the Edit menu as stubs.

**Adding or deleting tracks** — not available in the current demo. Sessions have a fixed set of 7 tracks. You cannot add new tracks or remove existing ones.

**Native VST/VSTi plugins** — not available in the web version. The plugin chain uses Web Audio effects only. Native plugin hosting is a future feature of the desktop application.

**Full plugin parameter editing** — the parameter UI exists, but not all plugin parameters may be fully editable. This varies by plugin.

**Mobile** — DAWin is desktop-first. It requires a minimum viewport of 1280px wide. It may not function correctly on phones or tablets. Mobile support is a planned future sprint.

**Offline mode** — DAWin requires a network connection. Session data, audio files, and collaboration state are all handled by the backend. There is no offline mode.

---

## 18. What is real vs. what is planned

### Real today (Sprint 9 baseline — 2026-05-29)

- Session create, join, and recent sessions
- Session sharing via URL (`?session=` parameter)
- Imported audio playback from cloud storage
- Drag-and-drop and file picker import
- Full clip editing: move, resize, cut, duplicate, delete, rename
- Fade in/out on clips, adjustable curve shape
- Automatic crossfades when clips overlap on the same track
- Mixer: volume fader, pan knob, mute, solo, stereo VU meters (post-fader)
- Master output strip
- Plugin chain with Web Audio effects, bypass toggle, plugin reordering
- Track lock and role-based access enforcement
- Comments on clips and tracks: add, reply, resolve, reopen
- Chat panel: general session conversation with unread indicator
- Deep links: copy a link to a playhead moment, track, clip, or time range
- Application menu bar with all menus and active/stub state correctly indicated
- Keyboard shortcuts modal (`?`)
- Resizable arranger/mixer splitter and FX panel splitter (drag or keyboard)
- Arranger horizontal zoom: `=`, `-`, `0`, Cmd/Ctrl+scroll, zoom indicator in ruler
- Per-track vertical zoom chevrons (expand/collapse track height)
- Collaborator presence indicators and ownership color tinting on tracks and clips
- Role-based permissions: Owner, Editor/Collaborator, Viewer
- Invite flow

### Planned — not yet in the demo

- In-browser audio recording
- Export / mix bounce
- Undo/Redo
- Add, delete, or reorder tracks
- Owner Continuity Bounce (automated fallback when a track owner leaves mid-session)
- Native VST/VSTi plugin hosting (desktop application)
- Mobile capture mode
- Stem export
