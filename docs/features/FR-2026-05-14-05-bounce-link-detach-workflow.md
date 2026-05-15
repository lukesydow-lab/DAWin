# FR-2026-05-14-05 — Bounce Link + Detach Workflow

## Summary

Create a workflow where bounced audio remains linked to its source MIDI/instrument track by default, but can also be detached when the user wants to treat the bounced audio as an independent editable asset.

## Problem

Bouncing plugin-heavy MIDI/instrument material to audio is useful for collaboration and performance. However, users need two distinct modes:

1. Keep a relationship between source MIDI/instrument and bounced audio so the app can switch between them or show provenance.
2. Break the relationship when the bounced audio becomes the new creative source and should be edited/resequenced directly.

Without this distinction, bounce either becomes too rigid or too destructive. Users need both reversible freeze-style workflows and committed audio editing workflows.

## User Story

As a producer, I want bounced audio to stay connected to its source track until I intentionally detach it, so I can choose between reversible freeze-style workflows and committed audio editing workflows.

## Scope

### In Scope

- When bouncing a MIDI/instrument track, create an audio result that retains a visible source relationship.
- Show linked state between source track and bounced track/clip.
- Allow user to switch playback between source and bounced audio when the source is available.
- Allow user to detach the bounced audio from the source.
- Once detached, allow direct editing/resequencing of the audio without dependency on the MIDI track or instrument/plugin.
- Preserve the original source track unless user explicitly deletes it.

### Out Of Scope

- Full comping system.
- Advanced version history.
- Cloud rendering.
- Full DAW freeze/unfreeze parity.

## UX Requirements

- Linked bounced audio should visually communicate its relationship to the source track.
- Detach should require intentional user action.
- Detach language should be clear, e.g. "Detach From Source" or "Commit As Audio".
- Detached audio should behave like normal audio clips.
- Source track should not be silently deleted.

## Technical Notes

- Requires a data relationship such as `sourceTrackId`, `sourceClipIds`, `bounceId`, `linked`, and `detachedAt`.
- Playback routing should understand whether the linked source or bounced fallback is active.
- This can support both collaboration fallback and general system-resource optimization.
- Tech Lead should determine whether linked bounces are represented as separate tracks, lanes, or clips.

## Acceptance Criteria

- User can bounce a MIDI/instrument track into audio.
- Bounced result retains a visible link to the source.
- User can identify whether the bounced result is linked or detached.
- User can detach the bounced result from the source.
- Detached audio can be edited directly without requiring the source MIDI/instrument/plugin.
- Source material is preserved unless explicitly removed by the user.
- No TypeScript, lint, or Vite build errors.

## Dependencies

- Bounce/freeze fallback feature.
- Clip/track data model updates.
- Audio rendering/export path.

## Risks / Open Questions

- Need Tech Lead decision on terminology: "Freeze", "Bounce", "Commit", "Detach", or some combination.
- Need decision on visual pattern for linked source relationship.
- Need future design for how many linked bounces can exist from the same source.

## Recommended Priority

Medium-High

## Estimated Complexity

Medium/Large

## Suggested Owner

Product + Designer + Tech Lead + Frontend Engineer.
