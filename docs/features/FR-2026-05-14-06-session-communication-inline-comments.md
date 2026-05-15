# FR-2026-05-14-06 — Session Communication + Inline Comments

## Summary

Add lightweight collaborator communication inside DAWin, focused on session chat, quick messages, and timeline/track/clip-specific comments. Prioritize text-based and context-aware communication for V1. Voice notes or push-to-talk can be considered after the core comment model is stable. Full video chat should remain optional/future-facing.

## Problem

DAWin currently identifies collaborators in the session, but collaborators need a way to communicate about what they are hearing, editing, and reviewing. Generic chat is useful, but music collaboration needs context: who is talking about which track, at what moment, and what action is needed.

## User Story

As a collaborator, I want to leave comments and messages tied to the music timeline so feedback stays attached to the exact part of the session it refers to.

## Scope

### In Scope

- Add a session chat or comments panel.
- Support plain text messages between active collaborators.
- Support mentions of collaborators.
- Support inline comments attached to:
  - Overall timeline position.
  - Time range.
  - Track.
  - Clip.
- Support comment threads with reply, resolve, and reopen behavior.
- Show unread indicators and notification states.
- Allow user to jump playback to the comment location.
- Permission model should respect collaborator roles.

### Out Of Scope

- Full video chat in MVP.
- Full always-on voice chat in MVP.
- Complex moderation tools.
- External Slack/Discord integration.
- Rich text editor beyond basic links/mentions.

## UX Requirements

- Comment anchors should be visually obvious but not clutter the arranger.
- A user should be able to quickly understand what feedback belongs to which moment, track, or clip.
- Resolved comments should be hidden or visually de-emphasized but recoverable.
- Clicking a comment should jump to the relevant location and highlight the referenced object.
- The communication layer should feel like part of the DAW workflow, not a generic chat widget bolted to the wall.

## Technical Notes

- Message model should support context references so timeline deep links can reuse the same anchor model.
- Likely needs backend persistence once sessions become durable.
- For initial prototype, comments may be held in session state, but Tech Lead should mark this as temporary if done.
- WebSocket transport can broadcast comment create/update/resolve events once backend is ready.

## Suggested Data Model

```ts
type CommentAnchor = {
  anchorType: 'timeline' | 'timeRange' | 'track' | 'clip'
  trackId?: string
  clipId?: string
  startTimeSec?: number
  endTimeSec?: number
  startBar?: number
  endBar?: number
}

type SessionComment = {
  id: string
  sessionId: string
  authorId: string
  body: string
  anchor: CommentAnchor
  status: 'open' | 'resolved'
  createdAt: string
  updatedAt: string
}
```

## Acceptance Criteria

- User can send a session-level message.
- User can create a comment tied to a timeline position.
- User can create a comment tied to a track or clip.
- User can reply to a comment thread.
- User can resolve and reopen a comment.
- Clicking a comment moves the user to the relevant timeline location and highlights the referenced object.
- Collaborator mentions are rendered and produce a visible notification/unread state.
- No TypeScript, lint, or Vite build errors.

## Dependencies

- Collaborator identity model.
- WebSocket/session state model.
- Timeline deep link feature if scoped separately.

## Risks / Open Questions

- Need Tech Lead to decide whether chat/comment storage is memory-only for now or persisted.
- Need decision on whether comments are part of project history/versioning.
- Need design decision for how comments appear on dense tracks without creating visual noise.

## Recommended Priority

High

## Estimated Complexity

Large

## Suggested Owner

Product + Designer + Frontend Engineer + Backend Engineer + Tech Lead.
