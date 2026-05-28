# Sprint 7 — Designer Handoff: Audio File Import Spec Complete

**Created:** 2026-05-19
**Author:** Designer agent
**Status:** Complete — ready for Frontend Engineer pickup
**Delivers to:** Frontend Engineer, Tech Lead

---

## What this covers

The `docs/specs/audio-file-import.md` spec is now marked `Status: Current`. All 17 sections are filled in. The Frontend Engineer may begin implementation.

**Spec location:** `docs/specs/audio-file-import.md`

---

## What was produced

All 17 sections specified with implementable detail:

1. **File Picker Entry Point** — `ImportButton` in toolbar, `I` shortcut, disabled states, ARIA.
2. **Drag-Over State** — `DropOverlay` component, `C.accentMuted` tint, inset box-shadow ring, fade-in/out animation.
3. **Valid Drop Target State** — `TrackDropTarget` per-track highlight, `ImportGhostClip` at snap position, overlay switches to `C.success` border.
4. **Invalid Drop State** — danger tint overlay, `cursor: no-drop`, no ghost clip.
5. **Unsupported File Type State** — danger flash animation, `ImportToast` with exact copy string, `aria-live` announcement.
6. **Multi-File Drop Unsupported State** — same `ImportToast` pattern with PM-specified copy.
7. **Uploading State** — immediate clip creation with `assetUrl: null`, `ClipProgressOverlay` with determinate + indeterminate progress bar variants.
8. **Decoding / Waveform Generating State** — separate visual state from upload; animated waveform bar skeleton, owner-color tinted.
9. **Waveform Placeholder State** — static SVG path (hardcoded path string provided), owner-color stroke at 20% opacity; mobile permanent placeholder behavior.
10. **Failed Upload State** — clip stays in arranger, danger inset ring, error badge with retry tooltip, `ImportToast`, retry flow.
11. **Failed Decode State** — clip is functional (upload succeeded), permanent placeholder, warn-color toast (not danger), no retry in Sprint 7.
12. **Clip Creation Behavior** — immediate synchronous creation, drop zone rejection rules, whole-bar snap, 1-bar initial width with silent resize after decode.
13. **Clip Naming Behavior** — filename strip rule, truncation behavior, hover tooltip threshold.
14. **Clip Color Behavior** — track owner color confirmed; all surfaces listed where `owner.color` appears.
15. **Drop-Position Behavior** — complete reference table for all drop targets (track row, header, ruler, empty space), playhead fallback for file picker.
16. **Accessibility Requirements** — keyboard alternative, ARIA on drop zone, complete `aria-live` announcement table, focus management, contrast ratios verified.
17. **Platform Notes** — desktop browser (full), desktop app (full, same as browser), tablet (file picker primary, 50MB decode limit, `capabilityHint` param), mobile (upload only, no local decode, no drag events expected).

---

## Existing implementation reviewed

Read `src/App.tsx` (design tokens, `ClipData` type, `Track` type, `DragState` type, clip visual patterns) and `docs/specs/arranger-view.md` (toolbar geometry, clip component spec, drag states, `snapBar` logic, track row backgrounds). The spec does not conflict with any existing component.

**One FE flag:** The `ClipData` interface in `src/App.tsx` does not have an `importStatus` field. The spec requires `importStatus: 'uploading' | 'decoding' | 'failed-upload' | 'failed-decode' | 'complete'` to be added to `ClipData`. This is a TypeScript interface change — the Tech Lead should confirm it is within Sprint 7 scope before the FE adds it.

---

## Open questions

None that block implementation.

One flag for Tech Lead / PM awareness (not a blocker):

- **`capabilityHint` parameter on `PeakGenerator`:** The spec calls for the `PeakGenerator` abstraction to accept a `capabilityHint` parameter so the host platform can signal decode capability (e.g. mobile = skip decode). The spec does not define the shape of this parameter — that is a Backend/FE architecture decision. The Designer's requirement is only that the behavior (skip decode on low-capability devices) is supported; the implementation shape is the FE's call.

---

## Work order reference

Original work order: `docs/handoffs/active/sprint7-designer-audio-import-workorder.md`

All definition-of-done checkboxes satisfied:
- All 17 sections filled — no remaining "Designer to specify" placeholders.
- All required states covered: drag-over, valid drop, invalid drop, unsupported type, multi-file unsupported, uploading, decoding, placeholder, failed upload, failed decode.
- Platform notes address desktop browser, desktop app, tablet, and mobile.
- Accessibility section covers keyboard alternative, ARIA, screen reader announcements, focus management.
- `Status` changed from `Draft` to `Current` in `docs/specs/audio-file-import.md`.
