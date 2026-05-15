# FR-2026-05-14-01 — Resizable Workspace Panels

## Summary

Allow users to resize the major DAWin workspace panels by dragging dividers between regions. The core panels called out for this request are the multitrack arranger, mixer, and FX/plugin panel.

## Problem

The current workspace is visually strong, but fixed panel sizing limits editing comfort. A real DAW user needs to change focus depending on the task: arranging clips, mixing levels, editing FX, or reviewing automation-like details. Static layout makes the interface feel less professional and slows focused work.

## User Story

As a music producer working in a shared session, I want to resize the major workspace panels so I can prioritize the view that matters for the task I am doing.

## Scope

### In Scope

- Add draggable splitters between primary workspace panels.
- Support resizing of:
  - Multitrack arranger area.
  - Mixer panel.
  - FX/plugin panel.
- Enforce minimum and maximum panel sizes so the app cannot collapse into unusable chaos soup.
- Persist panel sizing during the current session.
- Preserve current desktop-first minimum viewport behavior.
- Ensure resize controls work with pointer/mouse input.
- Add keyboard accessibility for focused splitters where feasible.

### Out Of Scope

- Mobile responsive layout.
- Full saved user preferences across accounts.
- Multi-monitor detachable panels.
- Complete layout preset system.

## UX Requirements

- Splitter hit targets should be easy to grab without visually overpowering the studio UI.
- Cursor should change on hover to communicate resize direction.
- Dragging should feel immediate and smooth.
- Panels should stop at safe minimum dimensions.
- Double-click reset to default panel size is recommended.

## Technical Notes

- Current frontend is primarily in `src/App.tsx`; avoid broad refactors unless Tech Lead approves.
- Coordinate with existing constants such as `TRACK_H`, `TRANSPORT_H`, and `STATUS_BAR_H`.
- Avoid hardcoded colors outside the `C` token object.
- Consider using CSS grid/flex layout with controlled size state.

## Acceptance Criteria

- User can drag between the arranger and mixer to resize available vertical space.
- User can resize the FX/plugin panel relative to the main workspace.
- Resize state does not break playhead, clip drag, mixer controls, or FX panel behavior.
- Minimum sizes prevent important controls from disappearing.
- Resize handles are visually discoverable on hover/focus.
- Layout remains stable at the enforced desktop minimum width.
- No TypeScript, lint, or Vite build errors.

## Dependencies

- Existing layout structure in `src/App.tsx`.
- Existing mixer and FX panel sizing rules.

## Risks / Open Questions

- Need Tech Lead to confirm whether resizing should persist only in memory or to local storage.
- Need Tech Lead to determine if this should be a lightweight layout update or the start of a larger layout manager.

## Recommended Priority

High

## Estimated Complexity

Medium

## Suggested Owner

Frontend Engineer with Tech Lead review.
