# FR-2026-05-14-07 — Timeline Deep Links

## Summary

Add a way to copy links to specific DAWin timeline moments, ranges, clips, or tracks. These links should let collaborators jump directly to the referenced project location and optionally open the related comment thread.

## Problem

Collaborators need to talk about exact musical moments. Without deep links, comments like "check the snare before the drop" force people to hunt through the timeline. DAWin should make the session itself addressable.

## User Story

As a collaborator, I want to copy a link to a specific moment, range, clip, or track so another collaborator can jump directly to the thing I am talking about.

## Scope

### In Scope

- Add a contextual action for copying a timeline reference.
- Supported link targets:
  - Current playhead moment.
  - Selected time range.
  - Track.
  - Clip.
  - Track + time combination.
- Link payload should include enough state to locate the item within a project/session version.
- Opening a link should:
  - Load or focus the project/session.
  - Seek to the referenced time.
  - Highlight the referenced track/clip/range.
  - Optionally open related comment thread if present.
- Links should be usable in chat/comments.

### Out Of Scope

- Public unauthenticated sharing.
- External preview pages.
- Permission model beyond existing project/session access.
- Permanent cloud routing if backend persistence is not ready.

## UX Requirements

- Right-click/context menu action should use clear language such as "Copy Link To This Moment" or "Copy Timeline Link".
- Links pasted into comments should render as understandable references, not only raw URLs.
- Jumping to a link should visibly highlight the target so the user does not land in the right place and still feel lost.
- Highlight should fade or be dismissible.

## Suggested Link Payload

```ts
type TimelineLinkPayload = {
  projectId: string
  sessionVersionId: string
  anchorType: 'moment' | 'range' | 'track' | 'clip' | 'trackMoment'
  trackId?: string
  clipId?: string
  startTimeSec?: number
  endTimeSec?: number
  startBar?: number
  endBar?: number
  commentThreadId?: string
}
```

## Technical Notes

- In the browser-only prototype, links may initially be route/hash based.
- Future backend persistence should replace local/seed identifiers with durable project/session IDs.
- Should share anchor model with inline comments to avoid building two parallel reference systems.
- Needs graceful failure states if the referenced clip/track no longer exists.

## Acceptance Criteria

- User can copy a link to the current timeline moment.
- User can copy a link to a selected range.
- User can copy a link to a track or clip.
- Opening a link seeks/focuses the relevant location.
- Referenced object or range is highlighted after navigation.
- Link payload supports project/session version context.
- Missing/deleted targets show a useful error or fallback state.
- No TypeScript, lint, or Vite build errors.

## Dependencies

- Router/navigation decision for session/project URLs.
- Collaborator permissions.
- Inline comments if shipped together.

## Risks / Open Questions

- Need Tech Lead to define stable `projectId` and `sessionVersionId` before backend persistence lands.
- Need product decision on whether links should reference absolute time, bar/beat position, or both.
- Need versioning behavior when the session changes after a link is copied.

## Recommended Priority

Medium-High

## Estimated Complexity

Medium

## Suggested Owner

Frontend Engineer + Backend Engineer + Tech Lead.
