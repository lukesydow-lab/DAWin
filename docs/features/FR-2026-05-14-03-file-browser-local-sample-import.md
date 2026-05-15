# FR-2026-05-14-03 — File Browser + Local Sample Import

## Summary

Add a file browser workflow that allows users to load local audio files and samples into DAWin, preview them, and bring them into the session as clips or track material.

## Problem

The current prototype uses procedurally generated audio. To move toward real creative workflows, users need a way to bring in their own sounds. A collaborative DAW without file import is like a kitchen with no groceries: beautiful, but everyone is starving.

## User Story

As a producer, I want to browse and import local audio samples so I can build a real session using my own source material.

## Scope

### In Scope

- Add a file browser/import entry point in the DAWin UI.
- Allow users to select local audio files.
- Support common audio formats appropriate for browser decoding.
- Display imported samples in an asset list/library.
- Allow users to preview imported samples.
- Allow users to drag or place imported samples into the arranger as clips.
- Preserve basic metadata where available: name, duration, type, size.
- Handle unsupported files with a clear error state.

### Out Of Scope

- Cloud file storage.
- Cross-user file sync.
- Sample pack marketplace.
- Stem separation.
- Full media asset database.
- Mobile file capture.

## UX Requirements

- Users should be able to quickly find imported samples.
- Imported assets should have clear names and durations.
- Preview should not disrupt transport playback unless intentionally designed that way.
- Unsupported file errors should be human-readable.
- Imported clips should visually fit the existing collaborator/track color model.

## Technical Notes

- Browser approach likely uses File API + Web Audio `decodeAudioData`.
- Need Tech Lead decision on whether imported audio is session-local, stored in memory, stored in IndexedDB, or eventually uploaded to backend/blob storage.
- This should be designed so future collaborative file availability can be added without rewriting the entire model.
- Imported file references should not assume permanent local paths because browsers do not expose stable local paths.

## Acceptance Criteria

- User can open an import/file browser flow.
- User can select at least one local audio file.
- Valid supported files are decoded and added to an asset list.
- Imported sample can be previewed.
- Imported sample can be added to the arranger as a clip.
- Unsupported files produce a useful error message.
- Imported clips preserve existing clip drag/resize behavior where technically applicable.
- No TypeScript, lint, or Vite build errors.

## Dependencies

- Current Web Audio API graph.
- Arranger clip model.
- Future decision on session persistence and storage.

## Risks / Open Questions

- Need Tech Lead to define supported file types for MVP.
- Need decision on asset persistence: memory-only vs IndexedDB vs backend/blob storage.
- Need future collaboration model: what happens when one collaborator imports a local-only file another collaborator cannot access?

## Recommended Priority

High

## Estimated Complexity

Large

## Suggested Owner

Frontend Engineer + Backend Engineer + Tech Lead.
