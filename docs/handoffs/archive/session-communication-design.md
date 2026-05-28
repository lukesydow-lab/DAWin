# Handoff — Session Communication + Inline Comments

**Feature:** FR-2026-05-14-06 + FR-2026-05-14-07  
**Designer:** Designer agent  
**Date:** 2026-05-15  
**Status:** Ready for FE implementation

---

## What this covers

The complete UI design for Sprint 3 session communication, covering:

- Ruler anchor pins (comment markers on the arranger timeline)
- Thread popover (comment reading, replying, resolving)
- Session chat panel (sidebar messaging with @mentions)
- Unread indicators (badge, pulse animation, new-message highlight)
- Copy link context actions (ruler, track header, clip, transport bar)
- Deep link navigation highlights (track, clip, ruler bar)

---

## Spec file

`/Users/lukesydow/daw-design/docs/specs/session-communication.md`

---

## Source documents read before writing this spec

- `/Users/lukesydow/daw-design/docs/features/FR-2026-05-14-06-session-communication-inline-comments.md`
- `/Users/lukesydow/daw-design/docs/features/FR-2026-05-14-07-timeline-deep-links.md`
- `/Users/lukesydow/daw-design/handoff-documentation/DAWin_HANDOFF.md` — layout constants, C token definitions, collaborator color model

The spec does not conflict with the existing implementation. It slots into the existing arranger ruler row, extends the existing right-click context menu pattern, and adds a new right-side panel that coexists with the FX panel via a shared toggle rail.

---

## Key design decisions the FE should not second-guess

1. **Popover is `position: fixed`, not `position: absolute`.** The ruler sits immediately below the transport bar, leaving no upward space for an absolutely positioned popover. Fixed positioning is required.

2. **Chat panel and FX panel share the same 280px column, not a wider layout.** Only one is visible at a time. This preserves the arranger's minimum 1000px of horizontal working space at 1280px viewport.

3. **Pin fill is always an inline `style`, never a Tailwind class.** Collaborator colors are dynamic hex values — the color system constraint from `CLAUDE.md` applies here.

4. **Resolved pins stay in the DOM with `display: none` when "Hide resolved" is active.** Do not unmount them — the toggle must be instantaneous without a data refetch.

5. **Pin pulse animation is one-shot and respects `prefers-reduced-motion`.** Do not use `animation-iteration-count: infinite`. No looping.

---

## Open questions — needs PM or Tech Lead input before FE starts

1. **Comment storage:** FR-06 explicitly defers this decision to the Tech Lead. The spec assumes comments are held in React session state for the prototype. Tech Lead must confirm whether to use in-memory state or to stub a WebSocket broadcast for comment creation. The pin pulse and new-message highlight animations in the spec both assume live WebSocket delivery — if storage is local-only, the FE should implement the highlight triggers on local state mutation instead.

2. **Deep link URL format:** FR-07 asks Tech Lead to define stable `projectId` and `sessionVersionId`. The Copy Link context actions in the spec produce a link payload but the spec does not define the URL schema. Tech Lead must provide the route/hash format before the playhead link icon and copy-link context menu items can write to the clipboard meaningfully. Design is not blocked — FE can implement all UI except the actual URL string.

3. **"Show resolved" toggle scope:** The spec places this toggle in the chat panel header and scopes it to both the chat panel and ruler pins globally. If PM wants this to be per-panel (separate toggles for chat vs. ruler), the spec needs an update before FE builds the toggle wiring.

4. **Mention notification behavior:** The spec renders `@DisplayName` tokens in `C.accent` color but does not define a notification or unread state for mentions specifically. FR-06 requires mentions to "produce a visible notification/unread state." This needs a PM decision: does an @mention increment the chat unread badge, trigger a separate notification surface, or both? FE should not implement mention notifications until this is answered.

---

## Confirmed not blocked

Everything in § Anchor Pins, § Thread Popover, and § Deep Link Highlight can begin implementation immediately. The data model in FR-06 (`CommentAnchor`, `SessionComment`) is sufficient to drive the rendering logic.

The § Copy Link Actions can be visually implemented (menu items, icon, "Copied!" tooltip) with a placeholder clipboard payload while the URL schema is being finalized by Tech Lead.
