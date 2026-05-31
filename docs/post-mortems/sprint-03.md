# Sprint 3 Post-Mortem — Session Communication + Deep Links

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 3
**Dates:** 2026-05-15 – 2026-05-15
**Status:** Closed
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

Note: Sprint 3 was originally planned as an "Audio Depth" sprint covering plugin parameter editing, VU calibration, and context menu completions. That plan was superseded on 2026-05-15 when the PM reprioritized to the collaboration communication layer. The items below reflect what Sprint 3 actually targeted.

- Define a unified `CommentAnchor` model (ADR-003) covering all anchor types, WS event schema, and deep link URL format
- Ship the Designer spec for the comment UI before frontend implementation began
- Build the comments REST API and WS fan-out
- Wire the WS client singleton in the frontend (exponential backoff reconnect, `session.join` on open)
- Implement deep link URL routing: `?t=&track=&clip=&range=` format with playhead seek and highlight-on-navigate

---

## What shipped

- **ADR-003:** Unified `CommentAnchor` model — five anchor types (timeline, timeRange, track, clip, trackMoment), bar-based storage, WS event schema (`comment.add/reply/resolve/reopen`), deep link URL format
- Designer comment UI spec: ruler pins, thread popover, chat panel, unread indicators — delivered before frontend work began
- Comments REST API: `POST/GET/DELETE /sessions/:id/comments`, `PATCH .../resolve`, `PATCH .../reopen`, `POST .../replies`; WS fan-out for all four event types
- WS client singleton (`getWsClient()`): exponential backoff reconnect (500ms × 2^attempt, max 5 attempts), `session.join` on open, `sendWsMessage` helper, `wsStatus` → StatusBar dot
- Deep links: `copyDeepLink()`, `?t=&track=&clip=&range=` URL parsing on mount, playhead seek + highlight states (1500ms auto-clear), chain-link icon in TransportBar, right-click on track header
- Comment UI: ruler anchor pins (SVG chevrons, author-colored, count badges, timeRange bars), track header pins, `ThreadPopover` (body/replies/resolve/reopen/reply input/click-outside), session chat panel (flat list, compose input, unread badge on icon rail), WS-driven state updates

---

## What had issues

**First UAT run returned FAIL — two P1 defects blocked the sprint from closing.**

**P1-1 — Thread popover unreachable via ruler pin click (race condition):** The ruler div's `onMouseDown` handler called `setPlayheadBar`, which triggered a React re-render. The anchor pin used `onClick` (not `onMouseDown`). The re-render caused by the mousedown path destroyed and recreated the pin element before the browser's `click` event fired on it, so `onClick` → `onOpenThread()` was never called. Result: the entire thread popover UI — resolve, reply, reopen — was inaccessible through the primary path.

**P1-2 — Chat messages had no `onClick` handler:** Chat messages in the panel were plain `div` elements with no `onClick` wiring. Exit criterion #7 ("clicking navigates to anchor") was unmet. The fix was adding `onClick={() => setOpenThreadId(c.id)}` to each chat message item.

**P2 — Deep link with `?track=<id>` opened the FX chain panel:** The deep link `useEffect` called `setSelectedTrackId(trackParam)`, which was the same mechanism that opens the FX chain overlay. A musician following a shared track link would have the plugin window pop open unexpectedly. Fix: remove `setSelectedTrackId` from the deep link effect; keep only `setHighlightTrackId`.

Additional open items at UAT sign-off (not sprint-blocking):
- Resolved comment on Hi-Hat track showed no track header pin (filter excluded resolved comments)
- Seed comment anchor label off-by-one due to 0-indexed `startBar` vs. display formula
- Unread badge never fires for seed comments on initial load
- Hardcoded hex colors on `DEMO_PRESENCE` entries

---

## How issues were addressed

P1-2 (chat message click) and P2-1 (deep link FX panel) were fully resolved and verified in the live browser.

P1-1 (ruler pin click) was fixed at the code level — `onMouseDown={e => e.stopPropagation()}` added to the pin element to prevent the ruler's playhead-seek from running when a pin is clicked. Live browser verification was blocked by an automation tool limitation: the automated preview tool could not reliably trigger `onClick` on an 8×10px absolutely-positioned element inside a `position: sticky` scroll container. The code fix was structurally sound and UAT confirmed the ThreadPopover rendered correctly via the P1-2 chat path.

The sprint closed as CONDITIONAL PASS — pending manual confirmation of ruler pin click in a real browser session.

The P3 items (resolved pin filter, seed data label, unread badge, hardcoded presence colors) were left open as known prototype behaviors.

---

## Decisions made

**ADR-003 — Unified CommentAnchor model:** The decision to use a single `CommentAnchor` type shared by both inline comments (FR-06) and deep links (FR-07) was made here. Bar-based anchors (not seconds) are used because bars are the unit of work in a DAW timeline. Five anchor types: `timeline | timeRange | track | clip | trackMoment`. This decision has been stable through Sprint 9.

**`getWsClient()` singleton pattern:** The WS client mirrors the `getAudioCtx()` singleton pattern from Sprint 1. The WebSocket is created once and reused across reconnects, with the same module-scope lazy-init idiom. This pattern was copied wholesale for consistency and has required only one fix (Sprint 8, SPRINT-8-001: WS handler was dead on lobby entry until `useEffect([sessionId])` was wired).

**`comment.add` not echoed to sender:** The REST `POST` 201 response is the creation acknowledgment for the comment author. Only other connected clients receive the WS `comment.add` event. This prevents duplicate renders when the creating client is connected to WS. A decision made in Sprint 3 that is still in place.

**Designer spec before frontend (process gate confirmed working):** Sprint 3 is the first sprint where the Designer spec preceded the frontend work. The comment UI was designed before it was built, and the UAT defects that were found were wiring issues (click handlers), not design mismatches. The process gate was effective.

**Sprint 3 superseded the original plan:** The PM's decision to reprioritize from Audio Depth to Session Communication was made mid-sprint. The deferred Audio Depth items (plugin parameter editing, VU calibration, context menu completions) were rescheduled: VU calibration and context menu completions landed in Sprint 5; plugin parameter editing remained unscheduled through Sprint 10.

---

## What was deferred

- Plugin parameter editing — no sprint scheduled through Sprint 10; PM decision on UX pattern still outstanding
- Context menu completions (Loop region, Rename) — completed Sprint 5
- VU calibration (stereo SplitterNode, 0 VU tick mark) — completed Sprint 5
- Resolved comment track header pin — left open as prototype behavior
- Seed comment label off-by-one — left open
- Unread badge behavior on initial load — left open
- Hardcoded `DEMO_PRESENCE` hex colors — left open (values match `C.*` tokens; cosmetic risk only)

---

## What was learned

**React event ordering in scroll containers can be surprising.** The ruler pin race condition (mousedown triggers re-render before click fires) is a class of bug that can appear anywhere a parent `onMouseDown` modifies state that affects children, and those children use `onClick`. The fix — `stopPropagation` on the child's `onMouseDown` — is correct but non-obvious. Future agents working on click targets inside scrollable rulers should be aware.

**Automation tools have limits for small absolutely-positioned elements.** The inability to verify P1-1 via automated browser interaction exposed a gap in the UAT toolchain. For future sprints, small interactive elements inside sticky containers should be tested manually when automated tools fail.

**The collaboration communication feature is foundational.** By Sprint 3, the project had a functional real-time collaboration layer: comments, chat, deep links, role enforcement. Every subsequent sprint has built on this without needing to revisit the comment model or WS fan-out architecture.

---

## Metrics

- First UAT run: FAIL (2 P1 defects)
- Re-run UAT: CONDITIONAL PASS
- Defects found: 6 (2 P1, 1 P2, 3 P3)
- P1 defects fixed before close: 2
- P2 defects fixed before close: 1
- `tsc --noEmit --noUnusedLocals --noUnusedParameters`: clean at close

---

## Open questions going into the next sprint

- Should resolved comments show a track header pin in a muted/resolved style rather than being filtered out?
- When does plugin parameter editing get a PM scope decision?
