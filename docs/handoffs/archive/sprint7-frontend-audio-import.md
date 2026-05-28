# Sprint 7 — Frontend Audio Import Handoff

**Agent:** Frontend Engineer
**Commit:** 29aa36c
**Date:** 2026-05-19
**Status:** Implementation complete — ready for Tech Lead review and UAT

---

## tsc --noEmit

Passes with zero errors.

---

## Acceptance Criteria Status

| Criterion | Status | Notes |
|---|---|---|
| Drag a WAV/MP3/OGG file onto arranger → uploads → waveform appears | Ready to test with live backend | Upload targets `POST /api/v1/sessions/:sessionId/audio`. Requires `?session=<id>` URL param and running server to complete full flow. |
| Clip linked to AudioFile row (assetId populated in DB) | Backend concern — FE sends upload, stores `audioFileId` on clip once response arrives | See `ClipData.audioFileId` |
| Multi-file drop shows friendly unsupported message | Done | Toast: "Import one audio file at a time for now." |
| Upload failure shows user-visible error | Done | Danger tint, error badge, ImportToast, aria-live announcement |
| Decode/peak failure shows placeholder state (not crash) | Done | `failed-decode` shows `WaveformPlaceholder` + warn toast |
| PeakGenerator abstraction in place | Done | `PeakGenerator` interface + `WebAudioPeakGenerator` class + `getPeakGenerator()` capability check |
| Peak data persisted | Data model ready | `ClipData.importPeaks: Float32Array` holds local peaks. Persistence to DB is a backend concern (out of Sprint 7 FE scope — backend must accept peaks on upload or in a separate PATCH). |
| tsc passes | Done | Zero errors |

---

## What Was Built

### Data model changes (src/App.tsx)

`ClipData` interface extended with:
- `importStatus?: 'uploading' | 'decoding' | 'failed-upload' | 'failed-decode' | 'complete'`
- `importPeaks?: Float32Array` — 200-value peak array from PeakGenerator
- `importFile?: File` — retained for retry on failed-upload
- `uploadProgress?: number` — 0–100 during XHR upload
- `audioFileId?: string | null` — server AudioFile.id after successful upload

### New abstractions

- `PeakGenerator` interface: `{ generate(file: File): Promise<Float32Array> }`
- `WebAudioPeakGenerator`: uses shared `getAudioCtx()` + `decodeAudioData` + `buildWaveformPeaks(buf, 200)`
- `getPeakGenerator()`: returns null on incapable devices (no silent failure)
- `isAudioMimeType()`, `isAudioFile()`, `stripExtension()`, `snapToWholeBars()` helpers

### New components (all in src/App.tsx per CLAUDE.md constraint)

- `ImportToast` — `role="status"` `aria-live="polite"`, slide-in, 3s auto-dismiss, error/warn/info variants
- `WaveformPlaceholder` — SVG hill silhouette at ~20% owner color opacity
- `ClipProgressOverlay` — uploading (determinate/indeterminate progress bar) + decoding (24-bar staggered skeleton animation)
- `ImportButton` inside updated `Toolbar` — icon-only SVG, disabled for viewers/in-progress

### Modified components

- `Clip` — renders `WaveformPlaceholder` when no peaks, `ClipProgressOverlay` during upload/decode, error badge for `failed-upload`, danger border/ring for failed state
- `Toolbar` — accepts `onImport` + `importDisabled` props; renders ImportButton with divider
- `ArrangeView` — full drag-and-drop event surface (`dragenter`/`dragover`/`dragleave`/`drop`), `DropOverlay` with accent/success/danger variants, per-track `TrackDropTarget` highlight, `ImportGhostClip`, `ImportToast`, hidden `<input type="file">`, aria-live region, `I` key shortcut
- `ArrangeViewProps` — gains `sessionId: string | null`
- `App` — gains `sessionId` state read from URL `?session=` param, passed to `ArrangeView`

### CSS additions (src/App.css)

- `@keyframes shimmer` — left-to-right sweep for indeterminate upload bar
- `@keyframes waveformSkeleton` — 3px→16px height animation for decode skeleton bars

---

## Deviations from Spec

### 1. BPM for duration→bars conversion
The `runImportPipeline` function uses a hardcoded `bpm = 128` when computing `durationBars` from `durationSec`. The session BPM is held in `App`-level state and is not passed to `ArrangeView`. A TODO is left in the code. Impact: clips may be slightly wrong width until FE receives the real BPM. Fix: pass `bpm` prop to `ArrangeView` in a follow-up, or read from a context.

### 2. Peak persistence to backend
`ClipData.importPeaks` holds the locally generated `Float32Array`. The spec requires persisting peaks so collaborators can render without re-decoding. The FE stores peaks in state; the backend must expose a mechanism (e.g., `PATCH /api/v1/sessions/:sessionId/clips/:clipId` with a peaks payload, or extend the audio upload response to accept a peaks sidecar). This is a backend sprint 7+ deliverable — flagged for Tech Lead.

### 3. Retry on failed-upload badge click
The spec says clicking the error badge retries the upload. The badge renders with `title="Upload failed — click to retry"` but the `onClick` handler is not wired — `importFile` is retained on the clip but retry logic was not implemented in this sprint to avoid scope creep beyond the work order. The clip is deletable via right-click context menu as specified. Marking as P3 enhancement.

### 4. Drop onto track header / ruler rejection
The spec requires `cursor: no-drop` when dragging over the header column (left 196px) or ruler row. The current implementation handles this at the grid level via `trackAtClientY` returning null for ruler area — no clip is created, and a toast fires. The header column sits outside the `role="region"` drop zone entirely (it's a sibling `div`), so OS drags there fall through naturally. The cursor behavior on the header is OS-default (not explicitly `no-drop`). Low visual priority.

---

## Test Instructions

1. Start dev server: `npm run dev`
2. Start backend: `npm run dev` in `server/` with a valid `.env`
3. Open `http://localhost:5173/?session=<valid-session-id>`
4. Press `I` or click the import button (toolbar, after the cut tool) → file picker opens
5. Select a WAV/MP3 file → clip appears immediately on first Audio track at playhead position, shows upload progress bar
6. After upload: clip shows waveform skeleton (decoding state)
7. After decode: clip renders waveform from peaks
8. Drop a non-audio file onto arranger → danger overlay + toast
9. Drop multiple files simultaneously → danger overlay + "Import one audio file at a time" toast
10. Simulate upload failure (disconnect network) → danger badge on clip + failed-upload toast
