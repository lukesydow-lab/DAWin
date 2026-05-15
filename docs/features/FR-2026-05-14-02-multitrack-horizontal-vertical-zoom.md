# FR-2026-05-14-02 — Multitrack Horizontal + Vertical Zoom

## Summary

Add zoom controls to the multitrack arranger so users can zoom horizontally across time and vertically per track. Horizontal zoom affects all tracks and clips. Vertical zoom can be applied track-by-track to make individual clips taller for detailed editing.

## Problem

The arranger needs to support both macro arrangement work and micro-scale editing. Fixed bar width and fixed track height make it difficult to edit fine clip timing, fades, cuts, overlaps, and crossfades with confidence.

## User Story

As a producer editing a multitrack session, I want to zoom in and out horizontally and vertically so I can move between high-level song structure and precise clip-level edits.

## Scope

### In Scope

- Horizontal timeline zoom across all tracks and clips.
- Vertical track zoom on a track-by-track basis.
- Mouse and keyboard controls for zooming.
- Preserve existing clip drag, resize, fade, cut, crossfade, and playhead seek behaviors while zoomed.
- Update ruler/bar rendering to match the current zoom level.
- Ensure horizontal scrolling remains usable when zoomed in.
- Define DAW-standard shortcut behavior after competitor pattern review.

### Out Of Scope

- Waveform redraw from real audio files.
- Piano roll / MIDI editor zoom.
- Automation lane zoom.
- Saved zoom presets.

## UX Requirements

- Horizontal zoom should increase/decrease pixels per bar globally.
- Vertical zoom should allow a selected track to become taller without forcing all tracks to grow.
- Default view should match the current visual density.
- Zoom should have sensible bounds to prevent unusable extremes.
- Controls should feel familiar to users of professional DAWs.

## Proposed Interaction Model

Tech Lead / Designer should confirm the final standard, but suggested defaults:

- Modifier + mouse wheel / trackpad gesture for horizontal zoom.
- Keyboard shortcut for horizontal zoom in/out.
- Modifier + vertical scroll or track header control for track height zoom.
- Reset zoom command for returning to default density.

## Technical Notes

- Current constants include `BAR_W = 72` and `TRACK_H = 64`. This feature likely requires converting those fixed constants into derived zoom-aware values.
- Clip positioning, resize math, playhead seek, fade handles, overlap/crossfade rendering, ruler ticks, and scroll calculations need to reference the same horizontal zoom scale.
- Track height should be represented by per-track UI state rather than a single global `TRACK_H` if vertical zoom is per-track.

## Acceptance Criteria

- User can zoom the arranger horizontally in and out.
- Horizontal zoom affects all tracks, clips, ruler ticks, playhead positioning, and clip hit areas consistently.
- User can vertically enlarge or shrink an individual track.
- Vertical zoom does not break mixer strip alignment, clip interactions, or track ownership coloring.
- Keyboard and mouse actions are documented in the feature spec.
- Zoom has min/max bounds.
- Reset-to-default behavior exists.
- No TypeScript, lint, or Vite build errors.

## Dependencies

- Arranger layout math in `src/App.tsx`.
- Existing drag/resize/cut/fade interaction model.
- Potential UX research into common DAW zoom shortcuts.

## Risks / Open Questions

- Need confirmation of exact keyboard/mouse shortcut standards after reviewing Ableton, Logic, Pro Tools, Reaper, and/or Studio One patterns.
- Need Tech Lead to decide whether zoom state is local-only or eventually collaborative/persistent.
- Per-track vertical zoom may complicate timeline virtualization later.

## Recommended Priority

High

## Estimated Complexity

Medium

## Suggested Owner

Frontend Engineer with Designer and Tech Lead review.
