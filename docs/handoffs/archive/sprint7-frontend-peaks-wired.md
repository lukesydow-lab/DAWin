---
Status: Current
Author: Frontend Engineer
Date: 2026-05-19
Sprint: 7
Commit: e25f506
---

# Sprint 7 — Server Peaks Wiring: Frontend Handoff

## Commit
`e25f506` — `feat: consume server peaks from upload response and audio.uploaded WS event (Sprint 7)`

## Changes completed

### 1. Consume `peaks` from upload response — DONE
In `runImportPipeline` (`src/App.tsx`), the `xhr.addEventListener('load', ...)` block now reads `serverData.peaks` from the JSON response. If the server returns a non-empty array, it is immediately converted to a `Float32Array` and applied via `updateImportClip` with `importStatus: 'complete'` — skipping local `PeakGenerator` entirely. If the array is empty (`[]`), `importPeaks` is set to `undefined` and `importStatus` to `'complete'`, causing `WaveformPlaceholder` to render. The local peak-generation path remains as a fallback for servers that omit the `peaks` field entirely.

### 2. `X-Filename` header on upload — DONE
`xhr.setRequestHeader('X-Filename', file.name)` is called immediately after `xhr.open(...)`, before `xhr.send(formData)`. This ensures the WS fan-out message carries the correct display filename for collaborators.

### 3. `audio.uploaded` WS event handler — DONE
A `case 'audio.uploaded'` branch has been added to `handleWsMessage`. Behavior:
- Finds all clips whose `audioFileId` matches `payload.audioFileId` and applies server peaks.
- Only overwrites if the clip is not already `complete` with non-empty peaks — avoids clobbering a successfully completed local-generator run.
- If no matching clip is found (collaborator's upload, no local clip yet): peaks are stored in `pendingServerPeaksRef` (a `Map<string, Float32Array>`) keyed by `audioFileId`.

### 4. Guard empty peaks in waveform rendering — DONE
Three locations in `src/App.tsx` updated:
1. Early-return guard: `hasPeaks = clip.importPeaks && clip.importPeaks.length > 0` gates the canvas draw path.
2. `peaks` local variable assignment: a zero-length `Float32Array` is treated as `undefined`, falling through to the `assetUrl` path.
3. `showCanvas` flag: `clip.importStatus === 'complete'` now requires either `clip.assetUrl` or non-empty `importPeaks` to show the canvas — a complete clip with empty peaks renders `WaveformPlaceholder` instead of a blank canvas.

## Flagged: collaborator upload with no local clip (Change 3, second bullet)

The `pendingServerPeaksRef` stores orphaned peaks but they are never consumed. The consuming side requires a `clips.created` (or equivalent) WS event that creates a clip on all clients when a collaborator uploads audio — this event is not yet implemented on the server. When it lands, the handler should check `pendingServerPeaksRef.current.get(clip.audioFileId)` after creating the clip and apply any cached peaks at that point.

This is out of scope for the current work order and flagged here for the next sprint.

## `tsc --noEmit` status
Clean — zero errors.
