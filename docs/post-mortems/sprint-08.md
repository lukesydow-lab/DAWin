# Sprint 8 Post-Mortem — Playable Beta

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 8
**Dates:** 2026-05-20 – 2026-05-28
**Status:** Closed
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

- Ship a session lobby as the entry point when no `?session=` URL param is present
- Implement real audio playback for imported clips via `AudioBufferSourceNode` from presigned R2 URLs
- Ship a full application menu bar at the top of the app with File/Edit/Session/View/Transport/Help menus
- Ship a `KeyboardShortcutsModal` (opened by `?` key and Help menu)
- Add an `AboutModal`
- Fix the VU stereo meter (carried P2 from Sprint 5)
- Resolve hardcoded `http://localhost:3000` API URL (carried P3 from Sprint 2)

---

## What shipped

- **Session lobby** — full-screen create/join/recent-sessions screen when no `?session=` URL param is present; `localStorage` recent sessions (max 3); inline error on invalid session ID
- **Real audio playback** — `AudioBufferSourceNode` from R2 presigned URLs; decoded `AudioBuffer` in-memory cache (1hr TTL awareness); clip loading indicator during fetch/decode; procedural synthesis preserved for non-imported tracks
- **Application menu bar** — 24px `C.elevated` bar; File/Edit/Session/View/Transport/Help menus; stub items dimmed (`opacity: 0.4`, non-interactive); all non-stub items wired to existing handlers
- **`KeyboardShortcutsModal`** — opened by `?` key and Help → Keyboard Shortcuts; all Sprint 8 shortcuts grouped by category
- **`AboutModal`** — Sprint 8, v0.8.0-beta
- **`API_BASE` constant** — reads `VITE_API_URL` env var; removes hardcoded `localhost:3000` from all fetch/XHR call sites
- **True stereo VU metering** — `ChannelSplitterNode` after `StereoPannerNode`; independent L/R `AnalyserNode`s; closes Sprint 5 5-I
- WS handler registered reactively on session entry via `useEffect([sessionId, handleWsMessage])` — SPRINT-8-001 fix
- Space key guard prevents double-fire transport toggle when menu item has focus — SPRINT-8-002 fix
- "New Session" File menu item relabeled "Return to Lobby" — SPRINT-8-003 fix
- ADR-007: `AudioBufferSourceNode` playback architecture

---

## What had issues

UAT found 3 defects:

**SPRINT-8-001 (P1, fixed):** WS message handler was an empty stub when a session was entered via the lobby. `handleEnterSession` called `getWsClient(id, () => {/* empty */}, setWsStatus)`. All WS messages — including `session.snapshot` — were silently dropped when entering via the lobby. The full `handleWsMessage` closure was only registered in the initial `useEffect([])`, which ran at mount time when `urlSessionId` was null and was never re-registered on lobby entry.

Root cause: `handleWsMessage` was defined inside `useEffect([])` and only passed to `getWsClient` when `urlSessionId` was truthy on mount. The lobby path bypassed this effect entirely. Fix: lift `handleWsMessage` to `useCallback` at component scope; add a `useEffect([sessionId, handleWsMessage])` that re-registers the handler whenever `sessionId` changes.

**SPRINT-8-002 (P2, fixed):** Space keypress on a focused menu item double-fired transport play/pause. Two events fired simultaneously: the button's native `onClick` handler and the global `keydown` Space handler. The result was that pressing Space to activate a menu item caused the transport to toggle and immediately revert. Fix: `if ((e.target as HTMLElement).closest('[role="menu"]')) return` guard in the Space branch of the global `onKeyDown` handler.

**SPRINT-8-003 (P3, fixed):** "File > New Session" was wired to `onLeaveSession`. A musician reading "New Session" expects a creation flow, not navigation back to the lobby. Relabeled to "Return to Lobby."

---

## How issues were addressed

All 3 defects were fixed in commit `ebbbb4d`. UAT re-verification confirmed all fixes. Sprint 8 UAT: PASS with zero P0/P1 defects.

---

## Decisions made

**ADR-007 — Real AudioBuffer Playback:** `AudioBufferSourceNode` from R2 presigned URLs replaces procedural synthesis for clips with `audioFileId`. `AudioBuffer` cached in memory keyed by `audioFileId` with 1-hour TTL awareness (re-fetch URL on expiry; never re-decode buffer if cache hit). Procedural synthesis preserved for non-imported tracks. Error handling: fetch or decode failure → `failed-decode` warn tint on clip; transport continues for other clips.

**Session lobby as full-screen takeover (not modal overlay):** When no `?session=` param is present, the arranger never renders. A musician should never see a blank session room without having explicitly entered one. This is a clear UX decision that also simplifies the component model: the lobby and the session room are mutually exclusive renders, not layered UI.

**`localStorage` for recent sessions (max 3):** Stores session ID, name, and last-opened timestamp. Clicking a recent session triggers the join validation flow. Maximum of 3 entries chosen to keep the UI readable. Oldest entry is dropped when a 4th is added.

**Menu bar stub items visually dimmed:** Stub items have `opacity: 0.4` and `cursor: default`. They are not interactive and have no tooltips. This was the PM's explicit decision — no "coming soon" labels, no explanation. The stubs exist to show where features will land without overpromising.

**`MENU_BAR_H = 24` constant added:** The menu bar required a new layout constant. This constant's introduction created a technical debt that was caught in Sprint 9: the panel height calculations for arranger and mixer did not subtract `MENU_BAR_H`, causing the mixer to be clipped by 24px.

---

## What was deferred

- In-browser audio recording — Sprint 10+ candidate
- Plugin parameter editing UI — PM decision on UX pattern deferred
- Resizable panels (FR-01) — still deferred from Sprint 4; Sprint 9 target
- Timeline zoom (FR-02) — still deferred from Sprint 4; Sprint 9 target
- Undo/redo — stub items only; Sprint 10+ at earliest

---

## What was learned

**SPRINT-8-001 is a lesson in `useEffect` scope and WebSocket lifecycle.** The `handleWsMessage` closure was defined inside a `useEffect` body, making it unreachable after the initial render. In a single-file React app with a complex lifecycle (lobby → session → lobby), any stateful closure that needs to survive state transitions must be defined at component scope (e.g. via `useCallback`), not inside an effect body. This pattern is now documented in the code with explicit comments.

**Double-event handling at menu/keyboard intersections requires explicit guards.** The Space key fires both as a keyboard event and as a button activation when a button has focus. Any keydown handler that controls application state must account for focused interactive elements. The `closest('[role="menu"]')` guard pattern is now established and should be replicated whenever new keyboard shortcuts conflict with focusable UI.

**`MENU_BAR_H` was added without updating all dependent calculations.** Adding a new layout constant that contributes to total vertical height requires auditing every formula that calculates available height. Sprint 9 found the gap (SPRINT-9-001). The lesson: when adding a new constant that affects the layout budget, grep for every formula that uses the other height constants and update them all in the same commit.

**Sprint 8 is when the prototype became a product.** Session lobby, real audio playback, and menu bar together create the experience of using a real application rather than a component demo. The UAT language changed from "checking exit criteria" to "this feels like a DAW."

---

## Metrics

- Defects found: 3 (0 P0, 1 P1, 1 P2, 1 P3)
- All 3 fixed before sprint close
- UAT result: PASS
- Carried defects resolved: VU stereo (5-I), hardcoded API URL (Sprint 2 P3)
- `tsc --noEmit`: clean at close
- Sprint 8 is the first sprint where the prototype had a real entry point

---

## Open questions going into the next sprint

- Panel height calculations omit `MENU_BAR_H` — will this cause visible clipping? (Became SPRINT-9-001)
- FR-01 and FR-02 have been deferred for four sprints. Is Sprint 9 the right time?
