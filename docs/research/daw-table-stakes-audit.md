# DAW Table-Stakes Audit — Menus, Shortcuts, Utilities, and Feature Baseline

**Status: Current**
**Last updated:** 2026-05-31
**Owner:** PM / Designer / Tech Lead
**Tier:** Need-to-Have research

## Purpose

This audit captures the common DAW features and app-shell conventions DAWin should respect before wider musician testing.

This document is not an instruction to copy Pro Tools, REAPER, FL Studio, Ableton Live, Cubase, or any other DAW. It separates:

1. Table-stakes DAW expectations DAWin should honor.
2. DAWin-specific features that should become differentiators.
3. Proprietary or high-risk inspiration that should be studied but not cloned.

Guiding rule:

> Copy expectations, not expressions.

Spacebar play/pause is a convention. A pixel-faithful clone of a competitor's layout or named workflow is not.

## Products reviewed

- Pro Tools
- REAPER
- FL Studio
- Ableton Live
- Cubase

## DAWin current state assumptions

As of Sprint 8 close, DAWin already includes:

- Session lobby.
- Real imported-audio playback from R2.
- File picker / drag-and-drop import.
- 7-track arranger.
- Clip drag/resize/cut.
- Fade handles and implicit crossfade on overlap.
- Mixer with faders, pan, mute/solo, master, and true stereo VU meters.
- Plugin chain with Web Audio nodes.
- Track locking / role enforcement.
- Comments, replies, chat, and deep links.
- Application menu bar: File / Edit / Session / View / Transport / Help.
- Keyboard Shortcuts modal.

## Table-stakes categories

### 1. Project / session lifecycle

| Feature | DAWin status | Tier | Notes |
|---|---|---|---|
| New session | Shipped | Need-to-Have | Lobby supports create. |
| Open / join session | Shipped | Need-to-Have | Session ID flow exists. |
| Recent sessions | Shipped | Need-to-Have | Local recent list exists. |
| Save / autosave clarity | Partial | Need-to-Have | Persistence exists, but user-visible save/sync model needs clarity. |
| Duplicate session / Save As | Missing | Post-MVP | Useful before external beta. |
| Import audio | Shipped | Need-to-Have | File picker + drag/drop. |
| Export mix | Missing | Need-to-Have | Musicians will ask how to get audio out. |
| Export stems | Missing | Post-MVP | Professional handoff. |
| Session settings | Partial | Need-to-Have | BPM exists; time signature/sample settings need product decision. |
| Missing file handling | Missing | Post-MVP | Needed when asset system expands. |

### 2. Transport

| Feature | DAWin status | Tier | Notes |
|---|---|---|---|
| Play / pause | Shipped | Need-to-Have | Spacebar convention. |
| Stop preserves playhead | Shipped | Need-to-Have | Locked DAW convention. |
| Return to zero | Shipped | Need-to-Have | Separate from Stop. |
| Record | UI/state partial; capture missing | Need-to-Have | Core contribution promise. |
| Loop / cycle region | Partial / needs QA | Need-to-Have | Menu item exists; validate behavior. |
| BPM | Shipped | Need-to-Have | 40–300 validation. |
| Time signature | Persisted in schema; UI unclear | Post-MVP / Need-to-Have-lite | Needed for serious sessions. |
| Metronome | Missing | Post-MVP | Becomes important once recording ships. |
| Count-in / pre-roll | Missing | Post-MVP | Recording polish. |
| Punch in/out | Missing | Post-MVP | Later pro workflow. |
| Markers / locators | Missing | Post-MVP | Expected for longer arrangements. |

### 3. Arranger / timeline editing

| Feature | DAWin status | Tier | Notes |
|---|---|---|---|
| Select tool | Shipped | Need-to-Have | `V`. |
| Cut tool | Shipped | Need-to-Have | `C`. |
| Move clips | Shipped | Need-to-Have | Verify under zoom later. |
| Resize clips | Shipped | Need-to-Have | Verify under zoom later. |
| Delete clips | Shipped | Need-to-Have | Context/menu. |
| Duplicate clips | Shipped | Need-to-Have | Context/menu. |
| Rename clips | Shipped per current context; verify | Need-to-Have | Older docs conflict; QA current build. |
| Split at playhead | Missing / unclear | Need-to-Have | Expected shortcut/action. |
| Fade in/out | Shipped | Need-to-Have | Direct manipulation. |
| Crossfade | Shipped | Need-to-Have | Implicit overlap + symmetry lock. |
| Snap/grid toggle | Missing | Post-MVP | Useful after zoom. |
| Nudge left/right | Missing | Post-MVP | Editing speed. |
| Horizontal zoom | Missing / partial spec | Need-to-Have | Required for precision editing. |
| Vertical track zoom | Missing / partial spec | Need-to-Have | Required for waveform detail. |
| Track height expand/collapse | Missing | Post-MVP | May overlap with vertical zoom. |
| Insert/delete time | Missing | Post-MVP | Pro editing. |

### 4. Tracks

| Feature | DAWin status | Tier | Notes |
|---|---|---|---|
| Track list | Shipped | Need-to-Have | 7 tracks. |
| Track ownership color | Shipped | Need-to-Have | Core differentiator. |
| Track rename | Needs QA | Need-to-Have | Basic table-stakes. |
| Mute / solo | Shipped | Need-to-Have | Role-gated for Viewer. |
| Record arm | Shipped UI/lock | Need-to-Have | Needs recording pipeline to become meaningful. |
| Track lock | Shipped | Need-to-Have | Collaboration safety. |
| Input source display | Partial | Need-to-Have with recording | Audio input badge exists in concept. |
| Input monitoring | Missing | Post-MVP | Needed for serious recording. |
| Add/delete tracks | Missing | Post-MVP | Fixed 7-track demo acceptable short-term. |
| Duplicate track | Missing | Nice-to-Make | Later. |
| Freeze/bounce track | Partial concept | Need-to-Have as Owner Continuity Bounce | Collaboration survival, not just utility. |
| Folder/group tracks | Missing | Blue Sky / Post-MVP | Later scale workflow. |

### 5. Mixer

| Feature | DAWin status | Tier | Notes |
|---|---|---|---|
| Volume faders | Shipped | Need-to-Have | Logarithmic curve. |
| Pan knobs | Shipped | Need-to-Have | Center detent. |
| Mute / solo | Shipped | Need-to-Have | Shared state. |
| Stereo meters | Shipped | Need-to-Have | True L/R. |
| Master strip | Shipped | Need-to-Have | Master pan/volume. |
| Plugin inserts | Shipped | Need-to-Have | Web Audio nodes. |
| Plugin bypass | Shipped | Need-to-Have | No graph rebuild. |
| Plugin reorder | Shipped / verify | Need-to-Have | Verify current behavior. |
| Plugin parameter editing | Missing | Need-to-Have decision | Current cards are read-only-ish. |
| Sends / returns | Missing | Post-MVP | Mix depth. |
| Busses / groups | Missing | Post-MVP | Later. |
| Peak reset | Missing | Nice-to-Make | Pro polish. |

### 6. Plugins / devices

| Feature | DAWin status | Tier | Notes |
|---|---|---|---|
| Add plugin/effect | Shipped | Need-to-Have | PluginBrowser. |
| Remove plugin/effect | Needs QA | Need-to-Have | Must be clear. |
| Reorder plugin/effect | Shipped / verify | Need-to-Have | Shortcut docs mention chain movement. |
| Bypass plugin/effect | Shipped | Need-to-Have | Existing audio graph supports bypass. |
| Edit parameters | Missing | Need-to-Have decision | Required before plugins feel real. |
| Presets | Missing | Post-MVP | Useful later. |
| Automation | Missing | Blue Sky / Post-MVP | Big system. |
| Native VST/VSTi hosting | Desktop future only | Blue Sky / Desktop | Not web scope. |

### 7. Browser / media / asset pool

| Feature | DAWin status | Tier | Notes |
|---|---|---|---|
| Import audio | Shipped | Need-to-Have | Current path. |
| Audio asset list / pool | Missing | Post-MVP | Needed once sessions grow. |
| Preview / audition samples | Missing | Nice-to-Make / Post-MVP | Useful for file browser. |
| Recent imports | Missing | Nice-to-Make | Quality-of-life. |
| Relink missing files | Missing | Post-MVP | Needed if local assets become first-class. |
| Sample marketplace | Missing | Blue Sky | Product/legal discovery. |

### 8. Collaboration

| Feature | DAWin status | Tier | Notes |
|---|---|---|---|
| Presence | Shipped | Need-to-Have | Verify multi-client. |
| Track locking | Shipped | Need-to-Have | Server enforced. |
| Roles | Shipped | Need-to-Have | Owner/collaborator/viewer. |
| Comments | Shipped | Need-to-Have | Timeline/track/clip anchors. |
| Chat | Shipped | Need-to-Have | Basic panel. |
| Deep links | Shipped | Need-to-Have | Timeline/track/clip/range. |
| Owner Continuity Bounce | Spec candidate | Need-to-Have | Core owner-leaving scenario. |
| Ownership transfer | Missing | Post-MVP | Important later. |
| Voice/video chat | Deferred | Blue Sky / Post-MVP | Evaluate carefully; do not derail MVP. |

## Recommended menu model

Current menu bar has File, Edit, Session, View, Transport, Help. This is enough for Sprint 8. Before wider demo, consider whether Track and Clip menus should be added or whether those commands remain contextual only.

### File

| Command | Status | Tier |
|---|---|---|
| New Session | Shipped | Need-to-Have |
| Open Session | Shipped | Need-to-Have |
| Open Recent | Shipped via lobby | Need-to-Have |
| Import Audio | Shipped | Need-to-Have |
| Export Mix | Missing | Need-to-Have |
| Export Stems | Missing | Post-MVP |
| Session Settings | Stub / partial | Need-to-Have |
| Leave Session | Shipped | Need-to-Have |

### Edit

| Command | Status | Tier |
|---|---|---|
| Undo | Stub | Post-MVP / high-risk |
| Redo | Stub | Post-MVP / high-risk |
| Cut Clip | Shipped | Need-to-Have |
| Copy | Missing | Post-MVP |
| Paste | Missing | Post-MVP |
| Duplicate | Shipped | Need-to-Have |
| Delete | Shipped | Need-to-Have |
| Rename | Needs QA | Need-to-Have |
| Select All | Stub | Post-MVP |
| Split at Playhead | Missing | Need-to-Have |

### Session / Collaboration

| Command | Status | Tier |
|---|---|---|
| Copy Session Link | Shipped | Need-to-Have |
| Copy Deep Link | Shipped | Need-to-Have |
| Invite Collaborator | UI exists / menu stub | Post-MVP unless friend test needs it |
| Add Comment at Playhead | Missing | Need-to-Have-lite |
| Open Chat | Shipped | Need-to-Have |
| Manage Roles | Missing | Post-MVP |

### View

| Command | Status | Tier |
|---|---|---|
| Show/Hide Mixer | Shipped per Sprint 8 menu spec; verify | Need-to-Have |
| Show/Hide FX Panel | Shipped per Sprint 8 menu spec; verify | Need-to-Have |
| Show/Hide Chat | Shipped | Need-to-Have |
| Zoom In | Stub | Need-to-Have |
| Zoom Out | Stub | Need-to-Have |
| Reset Zoom | Stub | Need-to-Have |
| Zoom to Selection | Missing | Nice-to-Make |

### Transport

| Command | Status | Tier |
|---|---|---|
| Play/Pause | Shipped | Need-to-Have |
| Stop | Shipped | Need-to-Have |
| Return to Zero | Shipped | Need-to-Have |
| Record | Missing capture | Need-to-Have |
| Toggle Loop | Partial / verify | Need-to-Have |
| Metronome | Missing | Post-MVP |
| Count-in | Missing | Post-MVP |
| Set BPM | Shipped | Need-to-Have |

### Track — proposed future menu

| Command | Tier |
|---|---|
| Add Audio Track | Post-MVP |
| Rename Track | Need-to-Have |
| Delete Track | Post-MVP |
| Duplicate Track | Nice-to-Make |
| Arm Track | Need-to-Have |
| Mute Track | Need-to-Have |
| Solo Track | Need-to-Have |
| Lock / Unlock Track | Need-to-Have |
| Create Continuity Bounce | Need-to-Have |
| Update Continuity Bounce | Need-to-Have |
| Detach Bounce as Audio | Post-MVP / Nice-to-Make depending on continuity scope |

### Clip — proposed future menu

| Command | Tier |
|---|---|
| Rename Clip | Need-to-Have |
| Delete Clip | Need-to-Have |
| Duplicate Clip | Need-to-Have |
| Split Clip | Need-to-Have |
| Loop Clip / Region | Need-to-Have |
| Bounce / Consolidate Clip | Post-MVP |
| Reveal Source Audio | Post-MVP |
| Export Clip | Nice-to-Make |

### Help

| Command | Status | Tier |
|---|---|---|
| Keyboard Shortcuts | Shipped | Need-to-Have |
| About DAWin | Shipped | Need-to-Have |
| Quick Start Demo Guide | Missing | Need-to-Have |
| Known Limitations | Missing | Need-to-Have |
| Report Bug | Missing | Nice-to-Make |

## Recommended baseline shortcuts

Do not ship shortcuts without updating `docs/specs/keyboard-shortcuts.md`.

| Action | Recommended shortcut | Tier | Notes |
|---|---|---|---|
| Play / Pause | Space | Shipped | Locked convention. |
| Stop | Button/menu; consider Shift+Space later | Need-to-Have | Must preserve playhead. |
| Return to Zero | Home or `0` | Need-to-Have | Confirm against existing behavior. |
| Record | `R` when track/session focus supports it | Need-to-Have after recording | Avoid conflict while typing. |
| Import Audio | `I` | Shipped | Existing. |
| Select Tool | `V` | Shipped | Existing. |
| Cut Tool | `C` | Shipped | Existing. |
| Split at Playhead | Cmd/Ctrl + E | Need-to-Have | Common enough; confirm no conflicts. |
| Delete Selection | Delete / Backspace | Need-to-Have | Menu hint exists. |
| Duplicate | Cmd/Ctrl + D | Post-MVP / Need-to-Have-lite | Reserved convention. |
| Undo | Cmd/Ctrl + Z | Post-MVP | Architecture needed. |
| Redo | Cmd/Ctrl + Shift + Z | Post-MVP | Architecture needed. |
| Save / sync checkpoint | Cmd/Ctrl + S | Post-MVP | Autosave model first. |
| Zoom In | Cmd/Ctrl + `+` | Need-to-Have | Implement with zoom. |
| Zoom Out | Cmd/Ctrl + `-` | Need-to-Have | Implement with zoom. |
| Reset Zoom | Cmd/Ctrl + `0` | Need-to-Have | Implement with zoom. |
| Toggle Loop | `L` | Need-to-Have | Existing convention. |
| Mute selected track | `M` | Post-MVP | Requires selected track model. |
| Solo selected track | `S` | Post-MVP | Requires selected track model. |
| Keyboard Shortcuts | `?` | Shipped | Existing. |
| Escape | Esc | Shipped | Close modal/menu/deselect. |

## Proprietary / high-risk inspiration log

| Product | Feature worth studying | Risk | DAWin-safe riff |
|---|---|---:|---|
| Ableton Live | Session View / clip launching | High | Later: DAWin Ideas Board for collaborative scratch clips; do not clone grid behavior. |
| Ableton Live | Capture performance into arrangement | Medium-high | Later: Commit Jam to Timeline with collaborator attribution. |
| Pro Tools | Commands Keyboard Focus single-key editing | Medium | Build DAWin's own shortcut philosophy; do not clone full map. |
| Pro Tools | Playlist / Commit / AudioSuite workflows | Medium | Later: Take Stack and Render Clip with DAWin ownership model. |
| REAPER | Actions/macros/custom menus | Medium | Later: Command Palette + Agent Recipes; avoid copying action architecture. |
| FL Studio | Channel Rack + Pattern/Playlist workflow | High | Avoid cloning; DAWin is shared timeline/session-first. |
| Cubase | MediaBay | Medium | Build simple Session Audio Pool first; do not mirror taxonomy/UI. |
| Cubase | Chord Track / VariAudio | High | Later: Guide Track or Harmony Notes after discovery. |
| Any DAW | Exact visual mixer or menu styling | Medium | Use pro-audio conventions but keep DAWin visual identity. |

## Recommended Sprint 9 outcomes from this audit

1. Confirm which existing menu items are wired vs stale stubs.
2. Decide whether Track and Clip menus enter Sprint 9 or remain contextual.
3. Update `docs/specs/keyboard-shortcuts.md` after shortcut decisions.
4. Fill missing interaction model in `docs/specs/arranger-zoom.md`.
5. Add Known Limitations / Quick Start to Help menu before musician testing.
6. Promote Basic Export Mix to a feature request if PM agrees it blocks socialization.

## Open questions for Tech Lead / PM

1. Should Sprint 9 include Track and Clip menus, or only context menu cleanup?
2. Should Undo/Redo remain visible stubs or be hidden until architecture exists?
3. What is the lowest-cost Basic Export Mix implementation?
4. Does recording ship before metronome/count-in, or do those ship together?
5. Should Continuity Bounce be a Sprint 9 architecture/spec item only, or should a simulated MVP be implemented in the same sprint?
