# Sprint 7 Defect Fix — Frontend Handoff

**Agent:** Frontend Engineer
**Commit:** 30bbae4
**Date:** 2026-05-19
**tsc --noEmit:** PASSED — zero errors

---

## Changes per defect

### SPRINT-7-003 — BPM hardcoded to 128 in import pipeline

**File:** `src/App.tsx` — `runImportPipeline` (~line 2710)

Removed `const bpm = 128` and replaced the reference with the live `bpm` state variable, which is already in scope (same `App` component, declared at line 4695). The `durationBars` calculation `Math.max(1, Math.ceil(durationSec / (60 / bpm / 4)))` now uses the correct session tempo. The TODO comment was also removed.

### SPRINT-7-004 — `failed-decode` clips visually indistinguishable from loading state

**File:** `src/App.tsx` — `Clip` component render logic (~line 1742)

Added `const isFailedDecode = clip.importStatus === 'failed-decode'` alongside the existing `isFailed` variable. Updated `borderColor` and `ringColor` derivations:

- `failed-upload` (isFailed): `C.danger` border + `C.danger` 88-alpha ring — unchanged
- `failed-decode` (isFailedDecode): `C.warn` border + `C.warn` 44-alpha ring — new
- all other states: `track.owner.color` — unchanged

No badge added for `failed-decode` (per spec). `WaveformPlaceholder` already renders for this state via the `!showCanvas` path.

### SPRINT-7-002 — Wire `audioFileId` and `peaks` from session snapshot (frontend half)

**File:** `src/App.tsx` — `case 'session.snapshot'` handler (~line 4784)

Extended the local `ClipRow` type with `audioFileId: string | null` and `peaks: number[]`. In the clip mapping:

- `audioFileId: cl.audioFileId ?? null` — always set
- If `cl.peaks` is non-empty: spread `{ importPeaks: new Float32Array(cl.peaks), importStatus: 'complete' as const }` so the waveform canvas renders immediately on session restore
- If `cl.peaks` is empty or absent: no spread, leaving `importPeaks` and `importStatus` unset — `WaveformPlaceholder` renders correctly

---

## Ready for Tech Lead review
