# Handoff: WS Client Singleton + Deep Link URL Routing

**Feature:** FR-2026-05-14-07 (Deep Links) + WS Transport Layer (Sprint 3)
**Agent:** Frontend Engineer
**Date:** 2026-05-15
**Commit:** 2599b6b
**Status:** Ready for Tech Lead review

---

## What was implemented

### Part 1 — WebSocket client singleton

Location: `src/App.tsx`, immediately before the Audio Engine section.

**Module-level state:**
- `_wsClient`, `_wsSessionId`, `_wsReconnectAttempts`, `_wsConnFailed`, `_wsReconnectTimer`
- Constants: `WS_MAX_RECONNECT = 5`, `WS_BASE_DELAY_MS = 500`

**`getWsClient(sessionId, onMessage, onStatusChange)`** — lazy singleton, follows `getAudioCtx()` pattern exactly. Creates a `WebSocket` to `ws://localhost:3001/ws?sessionId=<id>`. On open sends `{ type: 'session.join', sessionId, payload: {} }`. Reconnect uses exponential backoff: `500 * 2^attempt` ms, stops at 5 attempts and sets `_wsConnFailed = true`. Cleanup timer is cleared on component unmount.

**`sendWsMessage(type, payload)`** — exported helper that gets the current client and calls `.send()`. Available for future use in comment UI and track locking interactions.

**`WsFrame` interface** — matches ADR-003 Decision 4 shape: `{ type, sessionId, from, payload: unknown, ts }`.

**`handleWsMessage` dispatcher** (inside App `useEffect`) handles:
- `transport.state_sync` → updates `bpm`, `isRecording` from payload if present
- `presence.joined` / `presence.left` → `console.log` (presence UI future ticket)
- `track.locked` → sets `lockedBy` on matching track in state
- `track.unlocked` → clears `lockedBy` on matching track
- `comment.add` / `.reply` / `.resolve` / `.reopen` → explicit no-op (comment UI ticket)
- All others → `console.debug`

**Status bar indicator** — `StatusBar` now accepts `wsStatus: 'connected' | 'reconnecting' | 'failed' | 'idle'`. Renders a colored dot: green (success), yellow (warn), red (danger) + "Sync offline" text. When server is not running the `getWsClient` try/catch swallows the connection error silently and status stays `'idle'` (grey dot, no label).

### Part 2 — Deep link URL routing

**`copyDeepLink({ t?, track?, clip?, range? })`** — module-level utility. Builds `?session=dev-session-001&t=N&track=X&clip=Y&range=A-B` and writes to clipboard. Silent on clipboard permission denial.

**URL param parsing** runs in the same `useEffect([], [])` as WS init (mount-once):
- `?t=N` → `setPlayheadBar(N)`, `setHighlightBar(N)`
- `?track=X` → validates against `INITIAL_TRACKS`, then `setSelectedTrackId(X)`, `setHighlightTrackId(X)`. Missing track shows 5s toast: "Linked track not found in this session."
- `?clip=Y` → validates across all tracks, then `setSelectedClipId(Y)`, `setHighlightClipId(Y)`. Missing clip shows 5s toast: "Linked clip not found in this session."
- All highlights clear after 1500ms via `setTimeout`

**New App state:**
- `wsStatus: 'connected' | 'reconnecting' | 'failed' | 'idle'`
- `highlightBar: number | null`
- `highlightTrackId: string | null`
- `highlightClipId: string | null`
- `toastMessage: string | null`
- `linkIconActive: boolean`

### Highlight rendering

**Ruler bar flash** — `highlightBar !== null` renders a `position: absolute` div at `left: highlightBar * BAR_W`, `width: BAR_W`, `height: RULER_H`, `background: C.accent`, `opacity: 0.6`. Disappears when state clears at 1500ms.

**Track header highlight** — `TrackHeader` accepts `highlighted?: boolean`. When true: `borderLeft: '3px solid C.accent'`, `backgroundColor: 'rgba(107,92,231,0.10)'`.

**Clip highlight** — `Clip` accepts `highlighted: boolean`. When true: `boxShadow` adds `0 0 0 2px C.accent` on top of the existing inner shadow.

### Copy link actions

**Transport bar chain icon** — positioned immediately right of the POS display. SVG chain (16×16, two linked arcs). `aria-label="Copy link to current playhead position"`. Calls `copyDeepLink({ t: Math.round(playheadBar) })`, flashes `C.accent` for 1500ms via `linkIconActive` state, shows "Link copied" toast.

**Track header right-click** — `TrackHeader.onContextMenu` → `copyDeepLink({ track: trackId })` + "Link copied" toast (2s auto-dismiss). Replaces default browser context menu via `e.preventDefault()`.

**Toast** — `position: fixed`, `bottom: 40px`, `left: 50%`, `transform: translateX(-50%)`. `C.elevated` background, `C.border` border, `C.textPri` text, `fontSize: 12`, `padding: 6px 12px`, `borderRadius: 4`. `role="status"` + `aria-live="polite"`. Auto-dismiss handled by caller's `setTimeout`.

---

## Props changes (breaking for callers)

**`TransportBar`** — added two required props: `linkIconActive: boolean`, `onLinkIconClick: () => void`. Existing call site in `App` updated.

**`ArrangeView`** — added four required props: `highlightBar`, `highlightTrackId`, `highlightClipId`, `onCopyTrackLink`. Existing call site in `App` updated.

**`TrackHeader`** — added two optional props: `highlighted?: boolean`, `onCopyLink?: (trackId: string) => void`. Backward-compatible.

**`Clip`** — added one required prop: `highlighted: boolean`. All call sites within `ArrangeView` updated.

**`StatusBar`** — added one required prop: `wsStatus`. Call site in `App` updated.

---

## Not implemented (explicitly deferred)

- `?thread=<commentId>` param parsing (comment UI ticket)
- Clip right-click context menu "Copy link to clip" menu item (requires ContextMenu refactor — separate ticket)
- Ruler right-click "Copy link to Bar N" (same reason)
- Any animation for the highlight (spec calls for `borderLeft-width` transition — deferred to UAT feedback)

---

## Testing notes

**WS connection:** Start `server/` on port 3001. On first load the status bar dot should turn green. Kill the server — dot turns yellow (reconnecting), then red after 5 attempts with "Sync offline" label.

**Deep link routing:** Navigate to `/?t=8&track=t3` — playhead should seek to bar 8, track t3 header highlighted briefly, track selected. Navigate to `/?clip=clip-1` — first Kick clip highlighted. Navigate to `/?track=nonexistent` — toast appears at bottom.

**Copy link:** Click transport chain icon — clipboard should contain URL with `?session=dev-session-001&t=N`. Right-click any track header — clipboard should contain URL with `?session=dev-session-001&track=<id>`.
