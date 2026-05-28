# Handoff: Comment UI Frontend — FR-06

**Date:** 2026-05-15
**Agent:** Frontend Engineer
**Sprint:** 3
**Commit:** e893dec
**Status:** Complete — `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes clean

---

## What was built

All changes are in `src/App.tsx`. No new files created.

### Comment types (Step 1)
`CommentAnchorType`, `CommentAnchor`, `CommentReply`, and `SessionComment` interfaces added near the top of the types block, copied from ADR-003. These are local to the frontend — no import from `server/types.ts`.

### Comment state + seed data (Step 2)
- `SEED_COMMENTS: SessionComment[]` module-level constant with 3 entries covering all three rendered anchor types (`timeline`, `timeRange`, `track`).
- In App component: `comments`, `openThreadId`, `chatOpen`, `chatInput` state; `lastChatOpenedAt` ref for unread tracking.

### WS handlers wired (Step 3)
`handleWsMessage` switch cases for `comment.add`, `comment.reply`, `comment.resolve`, `comment.reopen` now update `comments` state. The no-op stubs are replaced.

### Ruler anchor pins (Step 4)
Rendered inside the sticky ruler row as absolute-positioned elements. Logic:
- Groups comments by `startBar` using a `Map<number, SessionComment[]>`.
- Cluster pin shows most-recent open comment's author color; all-resolved cluster uses `C.textSec`.
- SVG `<polygon points="0,0 8,0 4,10">` with inline `style={{ fill: pinColor }}` (no Tailwind color class).
- `timeRange` comments also render a thin horizontal range bar at 40% opacity.
- Count badge at `top: -4px; right: -4px` when cluster size > 1.
- Full ARIA: `role="button"`, `aria-label` with bar number / author / status / count.

### Track header pins (Step 5)
`TrackHeaderProps` extended with `commentCount`, `firstCommentId`, `firstCommentColor`, `onOpenThread`. When `commentCount > 0`, a small SVG chevron button is rendered inline after the track name. Track comment counts are computed in ArrangeView before each `TrackHeader` render.

### ThreadPopover component (Step 6)
New `ThreadPopover` component rendered in App root when `openThreadId !== null`. Positioned with `position: fixed` above the transport bar (`top: TRANSPORT_H - height - 8`). Left position clamped to `[8, window.innerWidth - 336]` to prevent viewport clip. Features:
- Header: author color dot, author name, anchor label (via `anchorLabel()`), relative timestamp, resolve/reopen icon button, close button.
- Body: comment text.
- Reply list with author dot, name, timestamp, body.
- Reply input: Enter submits; shows "Send" button inline when input has content.
- Resolved state: left border `2px solid C.success`, no reply input, shows "Thread resolved" banner.
- Click-outside: transparent fixed full-screen div behind the popover at `zIndex: 99`.
- Escape key: `useEffect` window listener.
- Optimistic resolve/reopen: local state updated immediately, REST PATCH fires async.

### Session chat panel + icon rail (Step 7 + 8)
- Right-side icon rail: `position: fixed`, `right: 0`, `width: 28`, `zIndex: 50`, contains the chat toggle button.
- Unread badge on toggle: counts comments from other users created after `lastChatOpenedAt.current`. Clears when chat opened (ref updated on toggle).
- Chat panel: `position: fixed`, `right: 28`, `width: 280`, shows all `comments` in a flat list with author dot, name, timestamp, body, and `📍 <label>` anchor footer.
- Compose input: Enter posts a new `timeline` comment anchored to `Math.round(playheadBar)`. Optimistic local state append; REST POST fires async.

---

## Component inventory

| Component/element | Location in file | Notes |
|---|---|---|
| `CommentAnchorType` / `CommentAnchor` / `CommentReply` / `SessionComment` types | Near top, after `Tool` | Local copies per ADR-003 |
| `SEED_COMMENTS` | After `DEMO_PRESENCE` | Module-level constant |
| `relTime()` | Before `ArrangeView` | Relative timestamp helper |
| `anchorLabel()` | Before `ArrangeView` | Formats anchor for display |
| `ThreadPopover` | Before `ArrangeView` | Standalone component |
| Ruler anchor pins | Inside `ArrangeView` ruler div | Absolute within sticky ruler row |
| Track header comment pins | Inside `TrackHeader` center column | Inline after track name |
| `TrackHeaderProps` extension | `TrackHeaderProps` interface | 4 new optional props |
| `ArrangeViewProps` extension | `ArrangeViewProps` interface | `comments`, `onOpenThread` |
| WS handlers | `handleWsMessage` in `useEffect` | Replaces no-op stubs |
| `handleResolveComment` / `handleReopenComment` / `handleReply` / `handleChatPost` | App component | Comment mutation handlers |
| ThreadPopover render | App return JSX | Above `showInvite` render |
| Chat panel | App return JSX | Fixed `right: 28` |
| Icon rail | App return JSX | Fixed `right: 0` |

---

## Known limitations

1. **Popover positioning is anchor-type-aware only for timeline/timeRange.** Track and clip comments (`anchorType: 'track'`, `'clip'`) can be opened from the track header pin or chat panel — the popover position defaults to `left: -100` from bar 0, which places it near the left edge. A future improvement would compute position from the track row's bounding rect.

2. **No "Hide resolved" toggle.** The spec (§ Session Chat Panel, header section) describes a pill toggle for "Show resolved" that globally hides resolved pins and chat entries. This was not implemented. The resolved c3 comment (Miguel's Hi-Hat comment) is visible in chat but its ruler pin doesn't render (correct — it's a `track` anchor, not `timeline`/`timeRange`).

3. **No pin pulse animation on new comment arrival.** The spec describes a `pinPulse` keyframe animation that fires once when a WS `comment.add` event adds a new comment. The static pin renders correctly but the one-shot pulse is not implemented. Requires tracking "new" pins separately (e.g. a `newCommentIds` Set state that clears after 400ms).

4. **No @mention picker in chat compose.** Spec describes a dropdown triggered by `@` in the input. Not implemented in V1.

5. **Chat panel does not push arranger width.** The spec says the 280px panel should collapse and restore arranger full width. Currently the arranger/mixer run behind the chat panel (they don't resize). This requires wiring the `chatOpen` state into the layout calculation — a layout refactor.

6. **FX panel and chat panel do not share exclusivity.** Spec says activating chat should close FX panel and vice versa. Currently they can coexist. The FX panel toggle is on the existing `selectedTrackId` state — wiring the exclusivity requires an `activeSidePanel` state replacing both toggles.

7. **`relTime()` reads `Date.now()` at render time.** Timestamps do not auto-update while the popover is open. Acceptable for a prototype.

8. **Popover stacks above FX panel backdrop.** The FX chain backdrop is `zIndex: 44`; the thread popover is `zIndex: 100`. Opening the FX chain while a thread popover is open will place the backdrop behind the popover. This is a z-index layering issue to resolve when the panel exclusivity is wired.

---

## Open questions for Tech Lead review

1. **Bar display convention.** The UI adds +1 to `startBar` for display (0-indexed storage, 1-indexed display). Confirm this matches the ruler's own display convention (`{i + 1}` rendering in the ruler loop). Currently consistent.

2. **Thread popover z-index vs. FX panel.** Should thread popover be dismissed when FX chain opens? Currently the two can coexist visually since popover sits above FX backdrop.

3. **Resolved comment visibility.** Currently resolved comments show in the chat panel list. Should they be hidden by default (requiring the "Hide resolved" toggle from the spec)? The toggle is deferred but the data is available.

4. **`comment.add` WS echo prevention.** Per ADR-003 Decision 5, the server must NOT broadcast `comment.add` back to the originating client. The frontend `handleChatPost()` adds the comment to local state immediately (optimistic). If the server does echo back, the comment will appear twice. This must be confirmed with the Backend Engineer — the WS handler contract says "do not echo to originator."
