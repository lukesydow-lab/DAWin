# Sprint 3 — Session Communication + Deep Links

**Status:** Historical Archive
**Last updated:** 2026-05-19
**Closed:** 2026-05-15
**Theme:** Give collaborators a shared communication layer: inline timeline comment anchors, a session chat panel, and deep links that navigate any client to an exact timeline position, track, or clip.
**Depends on:** Sprint 2 (Fastify scaffold, JWT auth, and WS transport must exist before building the WS client singleton and comments API).
**Unblocks:** Sprint 4/5 (persistence layer; comments API is ported to StorageAdapter in Sprint 5 pre-work).

---

## Goals

- Define a unified `CommentAnchor` model (ADR-003) covering all anchor types, WS event schema, and deep link URL format
- Ship the Designer spec for the comment UI before frontend implementation begins
- Build the comments REST API (POST/GET/DELETE/resolve/reopen/reply) and WS fan-out
- Wire the WS client singleton in the frontend (exponential backoff reconnect, `session.join` on open)
- Implement deep link URL routing: `?t=&track=&clip=&range=` format with playhead seek and highlight-on-navigate

---

## What Shipped

- **ADR-003:** Unified `CommentAnchor` model — anchor types (timeline, track, clip, range), bar-based storage, WS event schema (`comment.add/reply/resolve/reopen`), deep link URL format (`docs/adr/ADR-003-comment-anchor-model.md`)
- Designer comment UI spec: ruler pins, thread popover, chat panel, unread indicators (`docs/specs/` — delivered before frontend work began)
- Comments REST API: `POST/GET/DELETE /sessions/:id/comments`, `PATCH .../resolve`, `PATCH .../reopen`, `POST .../replies`; WS fan-out for all four event types (`server/routes/comments.ts`)
- WS client singleton (`getWsClient()`): exponential backoff reconnect, `session.join` on open, `sendWsMessage` helper, `wsStatus` → StatusBar dot (`src/App.tsx` — `useWebSocket` hook)
- Deep links: `copyDeepLink()`, `?t=&track=&clip=&range=` URL parsing on mount, playhead seek + highlight states (1500ms auto-clear), chain-link icon in TransportBar, right-click on track header (FR-07)
- Comment UI: ruler anchor pins (SVG chevrons, author-colored, count badges, timeRange bars), track header pins, `ThreadPopover` (body/replies/resolve/reopen/reply input/click-outside), session chat panel (flat list, compose input, unread badge on icon rail), WS-driven state updates

---

## Deferred

- Sprint 3 original plan (Audio Depth) was superseded by this reprioritization on 2026-05-15. The original Audio Depth goals (plugin parameter editing, VU calibration, context menu completions) were deferred:
  - Plugin parameter editing — no sprint scheduled as of Sprint 6; awaiting spec
  - Context menu completions (Loop region, Rename) — completed in Sprint 5 (5-J)
  - VU calibration (stereo SplitterNode, 0 VU tick mark) — completed in Sprint 5 (5-I)

---

## Exit Criteria

- [x] WebSocket client connected: transport sync and presence flow live between browser tabs
- [x] User can copy a deep link to a playhead moment, track, clip, or time range
- [x] Opening a deep link seeks the playhead and highlights the referenced object
- [x] User can post a session-level message in the chat panel
- [x] User can create an inline comment anchored to a timeline position, track, or clip
- [x] User can reply to a comment thread, resolve it, and reopen it
- [x] Unread comment indicators visible; clicking navigates to anchor
- [x] Comments fan out to all connected clients via WebSocket in real time
- [x] Viewer role cannot create or resolve comments (role enforcement)
- [x] `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes after all tickets
- [x] Tech Lead anchor model ADR committed to `docs/adr/`
- [x] Sprint 3 UAT signed off with zero P0/P1 defects (2026-05-15)

---

## Key Links

- `docs/adr/ADR-003-comment-anchor-model.md` — Unified CommentAnchor model
- `server/routes/comments.ts` — Comments REST API
- `docs/handoffs/archive/comments-backend.md` — Backend handoff
- `docs/handoffs/archive/session-communication-design.md` — Designer spec handoff
- `docs/specs/session-communication.md` — Feature spec
