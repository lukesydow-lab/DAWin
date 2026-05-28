# Sprint 8 — Playable Beta

**Status: Historical Archive**
**Last updated:** 2026-05-28
**Closed:** 2026-05-28 — UAT PASS, zero P0/P1 defects. All exit criteria met.
**Theme:** Ship the three features that make the prototype feel like a real application: a proper entry point (session lobby), real audio that plays back from uploaded files, and a standard application menu bar that surfaces all existing functionality.
**Depends on:** Sprint 7 ✅ — audio upload + presigned stream URL live; `audioFileId` and `GET /api/v1/audio/:audioFileId/stream-url` available
**Unblocks:** Sprint 9 (in-browser recording, plugin parameter editing, resizable panels)

---

## Goals

- Users arrive at a session lobby instead of a blank arranger when no `?session=` URL param is present
- Imported audio clips play real audio via Web Audio API using presigned R2 URLs
- A full application menu bar sits at the top of the app, surfacing all existing and Sprint-8-added functionality through standard desktop menu conventions

---

## PM Decisions (all resolved 2026-05-20)

### 1. Session Lobby

- Full-screen takeover when no `?session=` param is present — not a modal overlay; the arranger never renders without a session
- Two primary actions: (a) **Create** — name input + Create button → `POST /api/v1/sessions` → redirect to `?session=<newId>`; (b) **Join** — session ID input + Join button → `GET /api/v1/sessions/:id` validates existence → redirect to `?session=<id>`
- **Recent sessions:** last 3 sessions stored in `localStorage` (session ID + name + last-opened timestamp); shown below the create/join forms; clicking a recent session triggers the join validation flow
- **Error state:** if the session ID does not exist, show a friendly inline error ("Session not found — check the ID and try again"); no crash, no blank screen
- **Visual style:** Neve dark theme, same `C.*` design tokens as the main app — this is the front door to the DAW, not an afterthought
- **Backend scope:** `POST /api/v1/sessions` already exists. Backend Engineer must verify (and add if missing) `name` field support; confirm `GET /api/v1/sessions/:id` returns at minimum `{ id, name }` for lobby display

### 2. Audio Playback

- Only clips with `audioFileId` play real audio — clips without `audioFileId` continue to use procedural synthesis; no regression on synthetic tracks
- **Playback path:** on transport play, for each clip with `audioFileId`: fetch presigned URL via `GET /api/v1/audio/:audioFileId/stream-url`, `fetch()` the audio bytes, decode via `getAudioCtx().decodeAudioData()`, schedule via `AudioBufferSourceNode` inserted into the existing per-track plugin chain
- **Loading indicator:** clip shows a subtle loading state while the `AudioBuffer` is being fetched and decoded; no other new UI required
- **Caching:** decoded `AudioBuffer` cached in memory keyed by `audioFileId`; presigned URL TTL is 1 hour — re-fetch URL only if cached entry is expired; never re-decode an already-decoded buffer
- **Trigger:** existing spacebar / play transport; no new playback controls needed
- **Error handling:** if fetch or decode fails, clip shows the existing `failed-decode` warn tint; transport continues playing other clips

### 3. Application Menu Bar

- Position: horizontal bar at the very top of the app (above TransportBar); `C.elevated` surface; height 24px
- Standard desktop dropdown behavior: click to open, hover to switch between open menus, arrow keys to navigate items, Enter to activate, Escape to close
- **Stub items** (Sprint 9+): visually dimmed (`opacity: 0.4`, `cursor: default`), non-interactive; no tooltips or "coming soon" labels

**File**
- New Session → navigate to session lobby (clears `?session=` param)
- Open Session... → triggers join flow (session ID input)
- *(separator)*
- Import Audio → triggers existing file picker (same as `I` key)
- *(separator)*
- Leave Session → returns to session lobby

**Edit**
- Undo *(disabled stub — Sprint 9+)*
- Redo *(disabled stub — Sprint 9+)*
- *(separator)*
- Cut Clip → existing cut action on selected clip
- Duplicate Clip → existing duplicate action
- Delete Clip → existing delete action
- *(separator)*
- Select All *(disabled stub)*
- *(separator)*
- Preferences *(disabled stub — Sprint 9+)*

**Session**
- Session Settings *(disabled stub — Sprint 9+)*
- *(separator)*
- Copy Session Link → existing copy deep link action
- Invite Collaborator *(disabled stub — Sprint 9+)*
- *(separator)*
- Leave Session → same as File → Leave Session

**View**
- Show/Hide Mixer → toggle mixer panel visibility
- Show/Hide FX Panel → toggle FX panel
- Show/Hide Chat → toggle chat panel / unread badge
- *(separator)*
- Zoom In *(disabled stub — FR-02, Sprint 9+)*
- Zoom Out *(disabled stub)*
- Reset Zoom *(disabled stub)*

**Transport**
- Play/Pause → spacebar equivalent
- Stop → existing stop action
- Return to Zero → existing RTZ action
- *(separator)*
- Toggle Loop → existing loop region toggle
- *(separator)*
- Set BPM... → focuses BPM input in TransportBar

**Help**
- Keyboard Shortcuts → opens KeyboardShortcutsModal (`?` key)
- *(separator)*
- About DAWin → small modal: app name, "Sprint 8", version "0.8.0-beta"

### 4. Keyboard Shortcuts Modal

- New component in `src/App.tsx` per the single-file rule
- Opened by: Help → Keyboard Shortcuts, and `?` key
- Two-column table; groups: Transport, Editing, Import, Navigation, Panels
- Lists all shortcuts that exist at Sprint 8 ship time — no aspirational entries
- Follows existing modal patterns (dark overlay, `C.surface` panel)

---

## In Scope

- Session lobby screen (full-screen, create + join + recent sessions)
- `localStorage` recent sessions (last 3 entries)
- Backend: session name support in `POST /api/v1/sessions`; `GET /api/v1/sessions/:id` returns `{ id, name }`
- Real audio playback for clips with `audioFileId` via presigned URL + `AudioBufferSourceNode`
- `AudioBuffer` in-memory cache with 1hr presigned URL TTL awareness
- Clip loading indicator during fetch/decode
- Application menu bar (24px, `C.elevated`, full menu structure)
- Keyboard Shortcuts modal (`?` key + Help menu)
- About DAWin modal (name, sprint, version)
- Stub menu items visually dimmed and non-interactive
- Tech Lead ADR for audio playback architecture
- Designer specs: `docs/specs/session-lobby.md` and `docs/specs/application-menu-bar.md`

## Out of Scope

- In-browser audio recording (Sprint 9+)
- Plugin parameter editing UI (PM decision on UX pattern deferred)
- Resizable panels (FR-01, deferred from Sprint 4)
- Timeline zoom (FR-02, deferred from Sprint 4)
- Undo/redo implementation (disabled stubs only; Sprint 9+)
- Invite Collaborator flow (stub only)
- Session Settings (stub only)
- Mobile capture screen (desktop-first mandate)
- Multi-session management or session listing beyond 3 recent-sessions
- Persistent session rename (name set at create time)

---

## Work Sequence

**Gate rules:**
- Frontend Engineer may not begin session lobby or menu bar until the corresponding Designer spec is committed to `docs/specs/`
- Frontend Engineer may begin audio playback after the Tech Lead ADR is committed
- No work order issued to Frontend Engineer until Designer specs and ADR are on file

1. **Tech Lead** — ADR for audio playback architecture: `AudioBufferSourceNode` lifecycle (create-per-play), in-memory `AudioBuffer` cache keyed by `audioFileId`, presigned URL TTL detection and re-fetch, error handling (fetch fail, decode fail, TTL expiry), interaction with existing plugin chain graph

2. **Designer** — two specs in parallel:
   - `docs/specs/session-lobby.md` — full-screen layout, create/join forms, recent sessions, error state, Neve dark theme
   - `docs/specs/application-menu-bar.md` — 24px bar, dropdown interaction model, full menu item inventory with stub callouts, Keyboard Shortcuts modal layout, About DAWin modal

3. **Backend Engineer** — verify/add `name` field to `POST /api/v1/sessions`; verify `GET /api/v1/sessions/:id` returns `{ id, name }`; no other backend work required this sprint

4. **Frontend Engineer** — implement in this order:
   a. Audio playback (unblocked once ADR is committed)
   b. Session lobby (unblocked once Designer spec + Backend Engineer task complete)
   c. Application menu bar + Keyboard Shortcuts modal + About modal (unblocked once Designer spec committed)

5. **UAT** — sprint sign-off; zero P0/P1 required

6. **Tech Lead** — documentation sync commit + sprint close

---

## Exit Criteria

- [x] Opening the app with no `?session=` param shows the session lobby, not a blank arranger
- [x] User can create a new named session from the lobby and land in the session room at `?session=<newId>`
- [x] User can join an existing session by ID from the lobby
- [x] Recent sessions (up to 3) shown in lobby from localStorage
- [x] Invalid session ID shows a friendly inline error; no crash or blank screen
- [x] An imported clip with `audioFileId` plays real audio when transport plays
- [x] Procedural synthesis tracks still play without regression
- [x] Audio loading state visible on clip while AudioBuffer is being fetched and decoded
- [x] `AudioBuffer` cached in memory; replaying same clip does not re-fetch or re-decode
- [x] Fetch or decode failure shows failed-decode warn tint; transport continues playing other clips
- [x] Menu bar visible at top of app in all session states
- [x] All non-stub menu items are functional and match keyboard shortcut equivalents
- [x] Stub items are visually dimmed (`opacity: 0.4`) and non-interactive
- [x] Keyboard Shortcuts modal opens via Help menu and `?` key; lists all current shortcuts grouped by category
- [x] About DAWin modal shows name, "Sprint 8", version "0.8.0-beta"
- [x] `tsc --noEmit` passes
- [x] Sprint 8 UAT signed off with zero P0/P1 defects

---

## Key Links

- Designer spec (session lobby): `docs/specs/session-lobby.md` *(to be written — Sprint 8 step 2)*
- Designer spec (menu bar): `docs/specs/application-menu-bar.md` *(to be written — Sprint 8 step 2)*
- ADR (audio playback): `docs/adr/ADR-007-audio-buffer-playback.md` *(to be written — Sprint 8 step 1)*
- Depends on: `GET /api/v1/audio/:audioFileId/stream-url` (Sprint 6), `POST /api/v1/sessions` (Sprint 5), `GET /api/v1/sessions/:id` (Sprint 5)
- ROADMAP: `docs/specs/ROADMAP.md`
- PRD: `docs/specs/PRD.md`
