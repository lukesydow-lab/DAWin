# Audio File Import — Designer Spec

**Status:** Current
**Last updated:** 2026-05-19
**Sprint:** 7
**Author:** Designer
**Implements:** Sprint 7 PM decisions (see `docs/sprints/sprint-07.md`)

> **Designer gate satisfied.** All 17 sections are complete. The Frontend Engineer may begin implementation.

---

## Overview

Users can import an audio file into the active DAWin session by using a file picker or by dragging a file from their OS onto the arranger timeline. The import creates a clip on the target track at the drop position. A waveform renders from peaks returned by the server in the upload response; the client-side `PeakGenerator` provides a local preview while the upload is in flight. The system must gracefully handle upload failures, decode failures, and unsupported states across desktop browser, desktop app, tablet, and mobile.

---

## Component Inventory

New and modified components required to implement this feature:

**New components:**
- `ImportButton` — file picker trigger, appears in the toolbar row
- `DropOverlay` — full-arranger semi-transparent overlay active when any file drag is detected over the arranger grid
- `TrackDropTarget` — per-track visual highlight active when a valid file is being dragged over a specific track row
- `ImportGhostClip` — dashed-border placeholder clip rendered at the drop position during drag-over
- `ClipProgressOverlay` — inset overlay within a clip showing upload or decode progress; layered above the waveform canvas
- `WaveformPlaceholder` — static or animated SVG rendered inside a clip when peak data is not yet available
- `ImportToast` — non-modal notification strip appearing at the top of the arranger grid for errors and informational messages

**Modified components:**
- `Clip` — gains three new visual states: `uploading`, `decoding`, `failed`; waveform canvas conditionally renders from persisted peaks
- `ArrangeView` — gains `dragenter`/`dragover`/`dragleave`/`drop` event handlers on the arranger grid container; mounts `DropOverlay` and `TrackDropTarget` during drag events
- `Toolbar` — gains `ImportButton` as the rightmost item in the left toolbar group

---

## 1. File Picker Entry Point

**Location:** The `ImportButton` sits in the `Toolbar` row at the far right of the left tool cluster, immediately after the crossfade tool button. It does not share the tool button group — it is separated by a `1px` vertical divider (`background: C.border`, `height: 14px`, `mx-2`).

**Appearance:** `22×18px` button matching the existing toolbar button geometry (`rounded text-xs transition-all`). Background: `C.control`. Icon: a small upward arrow over a horizontal line — `↑▬` — rendered as a 12×12px SVG. Icon color: `C.textSec` at rest. Label: none (icon only). `title` attribute: `"Import audio file (I)"`. `aria-label`: `"Import audio file"`.

**Keyboard shortcut:** `I` key (no modifier) opens the file picker when focus is in the arranger, consistent with other single-key tool shortcuts. This is a new shortcut that does not conflict with Ableton (I = loop region in Ableton, but DAWin uses `L` for that per existing convention — confirm with PM if needed; no conflict found in current codebase).

**Hover state:** `filter: brightness(1.25)`, icon color shifts to `C.textPri`.

**Active/pressed state:** background `C.accent`, icon color `#fff`. Returns to rest state immediately after the file picker opens (it is not a mode toggle).

**Focus state:** `outline: 2px solid C.accent`, `outline-offset: 2px`.

**Disabled state:** `opacity: 0.35`, `cursor: not-allowed`. The button is disabled when: (a) an import is currently in progress on any track, or (b) the current user's role is Viewer. ARIA: `aria-disabled="true"`.

**File picker dialog:** The browser's native `<input type="file" accept=".wav,.mp3,.ogg,.flac,.aiff,.aif,.m4a" />` element, hidden from view (`display: none`), triggered by a programmatic `.click()` call. The `accept` attribute limits visible file types in the dialog on supporting OSes. Single-file selection only — `multiple` attribute is NOT set.

**After file selection:** The file picker closes. The selected file enters the upload flow immediately. A placeholder clip appears on the currently selected track at the current playhead bar position. If no track is selected, the topmost Audio track is used. See §7 for upload state.

**Empty track state:** If the session has no Audio tracks, the `ImportButton` is still enabled. On click, the file picker opens normally. On file selection, the system creates a placeholder clip on the topmost track regardless of type — this is a Backend/FE decision to flag; the Designer's position is that the button should never be silently disabled due to track composition.

---

## 2. Drag-Over State — Arranger/Timeline

**Trigger:** The `dragenter` event fires on the arranger grid container (`div.flex-1.overflow-auto` in `ArrangeView`). This state activates as soon as any file drag enters the arranger grid area — before the type is validated.

**DropOverlay:** A `div.absolute.inset-0.pointer-events-none.z-40` is mounted over the entire arranger grid (the scrollable `div`, not the full viewport). It does not cover the ruler row or the track header column.

Overlay background: `rgba(107, 92, 231, 0.07)` expressed as `C.accentMuted` (already defined in the token set). The overlay must use inline `style={{ background: C.accentMuted }}` — not a Tailwind color class.

Overlay border: `2px dashed` border rendered as a full-bleed inset ring using `box-shadow: inset 0 0 0 2px ${C.accent}55`. No `border` CSS property — using inset box-shadow avoids layout shifts.

**Cursor:** `cursor: copy` on the arranger grid while a file drag is active.

**Track row highlight:** All track rows remain at their normal background. No per-track highlight fires until the drag cursor enters a specific track row (see §3).

**Ruler and toolbar:** No visual change. The overlay does not extend above the ruler.

**Animation:** The overlay fades in with `opacity: 0` → `opacity: 1` over `120ms ease-out`. It does not pulse or animate further — a static low-intensity tint is correct for a pro audio tool.

**dragleave behavior:** When the cursor leaves the arranger grid entirely (verified by checking `relatedTarget` — the cursor must leave to an element outside the arranger container), the overlay fades out over `80ms ease-in` and the `DropOverlay` unmounts.

---

## 3. Valid Drop Target State

**Trigger:** The `dragover` event is firing on the arranger grid AND the dragged item is a single file AND the file's MIME type or extension matches the supported audio set (`.wav`, `.mp3`, `.ogg`, `.flac`, `.aiff`, `.aif`, `.m4a`). MIME types to check: `audio/*` prefix covers the majority; also check `video/mp4` as `.m4a` may report as `video/mp4` in some browsers.

**Note on early validation:** On `dragover`, only `event.dataTransfer.items[0].type` is available — the full file is not. Use MIME type checking on `dragover` for visual feedback, then revalidate extension + MIME on `drop` before proceeding.

**TrackDropTarget activation:** The track row currently under the cursor receives `TrackDropTarget` state. Visual treatment:
- Left border of the track row changes from `2px solid transparent` to `2px solid ${track.owner.color}` (already the existing pattern; intensify to full opacity).
- Track row background: `linear-gradient(90deg, ${track.owner.color}22 0%, transparent 220px)`. Inline `style` prop only — never Tailwind.
- Track name in the header: no change.

**ImportGhostClip:** A `ImportGhostClip` is rendered at the snap position (nearest bar to current cursor x-position within the track row). The ghost clip:
- Width: `1 * BAR_W - 4px` (1 bar wide; will be updated to actual file duration after decode, but at drag time, duration is unknown — use 1 bar).
- Height: `TRACK_H - 12px` (same as a real clip: `top: 1.5, bottom: 1.5`).
- Background: `${track.owner.color}18` — the track owner's color at ~10% opacity.
- Border: `1.5px dashed ${track.owner.color}88`.
- Border-radius: same as real clips (`rounded` = `4px`).
- No label, no waveform, no handles.
- The ghost clip tracks the cursor in real time during `dragover`, snapping to the nearest bar on the x-axis (using the existing `snapBar` logic from the arranger).

**Cursor over valid target:** `cursor: copy`.

**DropOverlay during valid state:** Remains visible. Border changes from `C.accent` to `C.success` — `box-shadow: inset 0 0 0 2px ${C.success}55`. This confirms the drop will succeed. Background remains `C.accentMuted`.

---

## 4. Invalid Drop State

**Definition:** The cursor is dragging over the arranger grid but the dragged item is either (a) a non-audio file type, (b) a non-file drag (e.g. text selection), or (c) more than one file.

**Visual treatment:**
- `DropOverlay` switches to danger treatment: `box-shadow: inset 0 0 0 2px ${C.danger}55`. Background: `${C.danger}0D` (danger at ~5% opacity). Inline `style` only.
- No `TrackDropTarget` activates — no per-track highlight, no ghost clip.
- Cursor: `cursor: no-drop`. This requires `event.preventDefault()` on `dragover` with `effectAllowed = 'none'`.
- No tooltip during drag (tooltips require stable cursor position; they are disruptive during active drag).

**On drop of invalid type:** See §5 (unsupported file type) and §9 (multi-file).

**Exiting invalid state:** Same `dragleave` logic as §2 — overlay fades out when cursor leaves the arranger grid.

---

## 5. Unsupported File Type State

**Trigger:** User drops a file whose extension and MIME type do not match the supported audio set. Examples: `.pdf`, `.jpg`, `.zip`, `.mid` (MIDI files are out of scope for import).

**No clip is created.**

**Visual response:** The `DropOverlay` plays a brief flash — `background` pulses from `${C.danger}1A` to `${C.danger}00` over `350ms ease-out` — then the overlay unmounts. This is the only animation on error; it is brief and non-intrusive.

**ImportToast message:** An `ImportToast` appears at the top-left of the arranger grid (below the ruler, above the first track row). Position: `position: absolute; top: 0; left: 4px; z-index: 45`. It slides in from `translateY(-100%)` to `translateY(0)` over `150ms ease-out`.

Toast geometry: `height: 28px`, `padding: 0 12px`, `border-radius: 4px`, `background: C.elevated`, `border: 1px solid ${C.danger}88`. Text: `font-size: 12px`, `color: C.textPri`, single line.

Toast copy: **"Unsupported file type. Drop a WAV, MP3, OGG, FLAC, or AIFF file."**

Toast auto-dismisses after `3000ms` with a `150ms ease-in` fade-out. No manual close button needed — it is ephemeral.

**Screen reader:** `role="status"` `aria-live="polite"` on the toast container div (which is always in the DOM, even when empty). The message text is injected; the `aria-live` region announces it to screen readers without focus change.

---

## 6. Multi-File Drop Unsupported State

**Trigger:** User drops 2 or more files onto the arranger grid simultaneously.

**No clips are created.** The first file is not processed. All files are rejected.

**Visual response:** Same `DropOverlay` danger flash as §5 — `${C.danger}1A` → `${C.danger}00` over `350ms`.

**ImportToast copy (PM-specified):** **"Import one audio file at a time for now."**

Toast appearance, position, timing, and ARIA are identical to §5. The same `ImportToast` component handles both messages — the message string is a prop.

**DAW convention note:** Pro Tools and Logic also reject multi-file drags onto the timeline without providing batch handling. This is an expected behavior. No special apology UX is needed — the toast is sufficient.

---

## 7. Uploading State

**Trigger:** A valid single audio file has been dropped onto a track (or selected via file picker). The file has passed type validation. Upload to R2 via `POST /api/v1/sessions/:sessionId/audio` has begun.

**Clip creation:** A real `ClipData` object is immediately created on the target track at the drop/playhead bar position. This clip has `assetUrl: null` and `importStatus: 'uploading'`. The clip is visible in the arranger immediately — users do not wait for the upload to complete before seeing a clip.

**Clip appearance during upload:**
- Background: same scan-line texture as all audio clips — `repeating-linear-gradient(180deg, ${owner.color}21 0px, ${owner.color}0A 2px, transparent 2px, transparent 6px)`.
- Left border: `2px solid ${owner.color}`.
- Inset ring: `box-shadow: inset 0 0 0 1px ${owner.color}44`.
- The waveform canvas is NOT rendered (no peaks exist yet).
- `WaveformPlaceholder` is rendered instead (see §9 for placeholder spec).

**ClipProgressOverlay:** An inset overlay `div.absolute.inset-0` with `z-index: 10` (above `WaveformPlaceholder`, below clip label). Background: `${C.bg}AA` (bg at ~67% opacity) — dims the clip surface to indicate in-progress state.

Inside `ClipProgressOverlay`:
- A horizontal progress bar centered vertically in the clip. Width: `calc(100% - 16px)`. Height: `3px`. Track: `background: C.control`, `border-radius: 2px`. Fill: `background: C.accent`, `border-radius: 2px`. Fill width is `${uploadProgress}%` driven by XHR/fetch progress events.
- Below the bar: `font-size: 10px`, `color: C.textSec`, text: `"Uploading… {percent}%"`. Truncated to single line.

**Clip label:** The filename (without extension) renders in the clip label position: `absolute inset-0 flex items-center px-2`, `font-bold uppercase truncate`, `font-size: 10`, `letter-spacing: 0.08em`, `color: ${owner.color}`, `text-shadow: 0 0 8px ${owner.color}66`. The label is always visible, even during upload. It is the user's primary confirmation that the right file was dropped.

**Upload progress unavailability:** If the upload does not report progress (e.g. the browser/fetch does not support upload progress events), the progress bar is replaced by an indeterminate animation: the fill animates as a shimmer moving left-to-right — `background: linear-gradient(90deg, transparent, ${C.accent}AA, transparent)`, `background-size: 200% 100%`, animated via `@keyframes shimmer` at `1.5s linear infinite`. The text reads `"Uploading…"` without a percentage.

---

## 8. Decoding / Waveform Generating State

> **Peak generation architecture update (mid-sprint, 2026-05-19 — ADR-006):** With server-side peak generation, the decode state no longer follows a successful upload in the primary path. Server peaks are returned in the `POST /api/v1/sessions/:sessionId/audio` response and applied to the clip immediately on upload complete — the clip transitions directly from uploading state to waveform-rendered state. The decode state described in this section applies only to: (a) the local `PeakGenerator` preview path, which runs while the upload is in flight; and (b) fallback scenarios where server peaks are absent (null `AudioFile.peaks`). The visual specification below remains valid for those paths.

**Trigger:** The R2 upload has completed successfully. The local `PeakGenerator` has been invoked and is actively decoding the audio buffer and computing peak data.

**Visual distinction from uploading:** This is a separate visual state. The upload progress bar transitions away and is replaced by a decode indicator.

**ClipProgressOverlay update:**
- Progress bar disappears (no decode percentage is available — decode is not a streaming operation).
- In its place: a waveform skeleton animation. This is a row of 24 equally spaced vertical bars (`width: 2px`, `border-radius: 1px`, `height` animating between `3px` and `16px`). Bars are staggered in phase (each bar's animation is offset by `i * 60ms`). Bar color: `${owner.color}66`.
- Below the animation: `font-size: 10px`, `color: C.textSec`, text: `"Generating waveform…"`.

**Why a waveform skeleton:** The waveform skeleton is semantically meaningful — it signals that audio analysis is happening, not a network operation. This distinction matters to DAW users who understand the decode pipeline.

**Duration:** Peak generation on a capable desktop runtime should complete within 1–4 seconds for typical clip lengths (≤5 minutes). Clips over 5 minutes may take longer — the loading state must be stable indefinitely. No timeout on the decode state.

**Fallback if decode never completes:** If the `PeakGenerator` returns an error, transition to §11 (Failed Decode state). There is no user-visible timeout threshold in the spec — the FE can implement a generous internal timeout (e.g. 30s) before escalating to failure, but the UI should remain in the decoding state until then.

---

## 9. Waveform Placeholder State

**When it appears:** (a) During upload (§7) — peaks don't exist yet. (b) During decode (§8) — peaks are computing. (c) After import completes on a device that could not generate peaks (mobile fallback, or device capability below threshold). (d) When persisted peak data is missing from a clip record (corrupted or missing from DB). (e) When `AudioFile.peaks` is null on a clip record — this includes all clips created before Sprint 7, which have no server-generated peaks. These clips render `WaveformPlaceholder` permanently with no error treatment (same treatment as the mobile/low-capability fallback described above). `WaveformPlaceholder` is the correct permanent state for null-peaks clips; no toast, no error badge.

**`WaveformPlaceholder` visual spec:**

The placeholder is a `div.absolute.inset-0` behind the `ClipProgressOverlay` and clip label, rendered in place of the waveform `<canvas>`.

It renders a static SVG waveform silhouette: a centered horizontal baseline with a symmetric soft hill shape — a gentle mountain profile that suggests audio content without being literal peaks. The SVG path is a smooth curve from left edge to right edge, peaking at 60% of clip height at the center.

SVG attributes: `width="100%" height="100%"`, `viewBox="0 0 200 40"` (aspect ratio not important — it stretches). Path fill: `none`. Stroke: `${owner.color}33` (owner color at ~20% opacity). `stroke-width: 1.5`. `stroke-linecap: round`.

The placeholder path (hardcoded, not generated from data):
`M 0,20 C 20,20 40,8 60,10 C 80,12 100,6 120,8 C 140,10 160,14 180,16 C 190,17 196,18 200,20`

This gives a gentle irregular hill that reads as "audio content pending" without being a meaningless flat line.

**Animation on placeholder:** None during the static fallback (device cannot generate peaks). During active upload/decode, the placeholder is obscured by the `ClipProgressOverlay` — no animation on the placeholder itself is needed.

**Mobile/low-capability permanent placeholder:** When the device cannot generate peaks and no persisted peak data exists, the `ClipProgressOverlay` is absent and the `WaveformPlaceholder` is the only waveform representation. The clip renders normally in all other respects (label, color, resize handles). There is no "peaks unavailable" label — the subtle placeholder SVG is sufficient; adding error language to a successfully imported clip would be unnecessarily alarming.

---

## 10. Failed Upload State

**Trigger:** The `POST /api/v1/sessions/:sessionId/audio` request returns a non-2xx status, or the network request fails (timeout, offline).

**The clip remains in the arranger.** It is not deleted. Users should not lose the position and name of what they were trying to import — they may want to retry.

**Clip appearance in failed upload state:**
- `ClipProgressOverlay` clears. The waveform canvas remains absent. `WaveformPlaceholder` is visible.
- The clip's inset ring changes to: `box-shadow: inset 0 0 0 1px ${C.danger}88`.
- The left border changes to: `2px solid ${C.danger}`.
- A small error badge appears at the top-right corner of the clip: `14px × 14px`, `border-radius: 50%`, `background: C.danger`, centered `!` character, `font-size: 9px`, `color: #fff`, `font-weight: 700`. Position: `absolute top-1 right-1`.

**Hover tooltip on error badge:** `"Upload failed — click to retry"`. Tooltip: `background: C.elevated`, `border: 1px solid C.danger`, `border-radius: 4px`, `padding: 4px 8px`, `font-size: 11px`, `color: C.textPri`. Appears `4px` above the badge after `400ms` hover delay.

**Click on error badge (or clip body when in failed state):** Triggers a retry — re-submits the file upload using the stored `File` object reference. The clip transitions back to uploading state (§7). If the `File` object is no longer available (e.g. the page was refreshed), the retry button is replaced by the tooltip: `"Upload failed — re-import the file"` and the click does nothing.

**ImportToast:** An `ImportToast` appears with copy: `"Upload failed. Check your connection and try again."` — same position, timing, and ARIA as §5/§6. Toast color: `border: 1px solid ${C.danger}88`.

**Screen reader:** The `aria-live` region announces: `"Upload failed for {filename}. {owner.name}'s clip on track {track.name}."`.

**Removing a failed clip:** The user can delete the failed clip via the existing right-click context menu → "Delete clip" (same as any other clip). No special affordance needed.

---

## 11. Failed Decode State

**Trigger:** The local `PeakGenerator` returns an error — the audio file could not be decoded. Causes: corrupt file, unsupported codec, file too large for available memory, or the `PeakGenerator` implementation reports a capability failure.

**Distinction from failed upload:** The file uploaded successfully to R2. The audio file record exists in the DB. The clip exists. Only waveform peak generation failed. The user's audio file is safe — they can still play it back (if streaming is available), they just cannot see the waveform.

**Clip appearance in failed decode state:**
- The clip is fully functional — it can be moved, resized, faded, and played.
- The waveform canvas is absent. `WaveformPlaceholder` renders permanently (same as the mobile fallback in §9).
- No error badge (unlike failed upload — the clip is not in an error state, just waveform-display-degraded).
- The inset ring and left border remain in their normal owner-color treatment. No danger color applied.

**ImportToast copy:** `"Waveform preview unavailable for {filename}."` Toast color: `border: 1px solid ${C.warn}88` (amber/warning, not danger). This is an informational message, not an error.

**Why no retry:** The file is already uploaded. Re-running peak generation would require re-fetching the audio from R2, which is a backend operation outside Sprint 7 scope. The placeholder is the permanent state for this clip in this session. A future sprint can add a "regenerate peaks" action.

**Screen reader:** The `aria-live` region announces: `"Waveform preview unavailable for {filename}. The clip has been imported but cannot display a waveform on this device."`.

---

## 12. Clip Creation Behavior

**Drop-to-clip creation is immediate.** When a valid file drop is detected, a `ClipData` object is created synchronously before the upload begins. The user sees a clip at the drop position with zero perceptible delay. The upload happens in the background.

**Track targeting:**
- Drop onto a track row → clip created on that track, no ambiguity.
- Drop onto the track header area (left 196px column) → rejected. The drop target is the arranger grid only. Cursor: `cursor: no-drop` when the drag is over the track header column.
- Drop onto empty arranger space below all tracks → rejected (no track to assign). The `DropOverlay` shows the invalid state (§4). ImportToast: `"Drop onto a track to import."`.
- Drop onto the ruler row → rejected. Cursor: `cursor: no-drop`.

**Bar snap:**
- Drop x-position is computed as `Math.round(clientX / BAR_W)` relative to the arranger grid scroll origin.
- Snaps to the nearest bar (whole bar snap only — no half-bar snap on import; the `snapBar` helper used for clip moves snaps to 0.5 bars, but import always uses whole bars for predictability).
- If the computed bar is beyond the current arranger length (`BARS = 32`), the clip is created at bar 31 (the last bar). This is an edge case — normal use will not hit it.

**Drop x-position ambiguity (file picker import):**
- When using the file picker (no drop coordinates available), the clip is created at the current playhead position (nearest bar).
- If no track is selected, the topmost Audio track is used.
- If the session has no Audio tracks at all, the topmost track of any type is used. Bus tracks are skipped.

**Clip width at creation:** `1 bar`. Once peak data is available and the audio duration is known, the FE should update `clip.len` to match the actual file duration in bars (rounded up to the nearest bar). This resize happens silently — the clip grows in place with no animation. This resize must not displace other clips to the right; it is a visual update to this clip only.

**Overlap behavior:** Clip creation does not check for overlap with existing clips. The new clip renders on top of any existing clips at the same position (z-index: newly created clip is on top). This is the same behavior as manual clip moves in the existing arranger — no auto-splitting or pushing.

---

## 13. Clip Naming Behavior

**Rule:** Clip name = filename without extension.

**Derivation:** Use the `File.name` property (from the drop event or file picker), then strip the extension: everything after and including the last `.` character. Examples: `"bass loop.wav"` → `"bass loop"`. `"My.Beat.v2.mp3"` → `"My.Beat.v2"` (only the final extension is stripped).

**Display:** The clip label renders at the existing position: `absolute inset-0 flex items-center px-2`, `font-bold uppercase truncate`, `font-size: 10`, `letter-spacing: 0.08em`. `truncate` applies — the label is single-line, clipped with an ellipsis when the clip is too narrow to display the full name.

**Truncation threshold:** At `1 bar` width (`BAR_W - 4px = 68px`), approximately 8–10 characters are visible at `font-size: 10`. This is sufficient to identify most files. The full name is accessible via hover.

**Hover tooltip on clip label:** When the clip is narrow enough that the label is truncated (detected by `scrollWidth > clientWidth` on the label element), a tooltip shows the full clip name. Tooltip: `background: C.elevated`, `border: 1px solid C.border`, `border-radius: 4px`, `padding: 4px 8px`, `font-size: 11px`, `color: C.textPri`. Appears after `600ms` hover delay (longer delay than error tooltips — this is informational, not urgent). The existing `title` attribute can serve this role as a zero-cost implementation; a custom tooltip is optional enhancement.

**Clip renaming:** Out of scope for Sprint 7. The "Rename" context menu item remains disabled (`opacity: 0.4`, `cursor: default`) as it already is.

---

## 14. Clip Color Behavior

**Rule (PM decision, confirmed):** Imported clips inherit the track owner's collaborator color. This is identical to all other clips in the arranger. No special color treatment for imported clips.

**Application:** The clip's owner color is `track.owner.color` — the hex color string from the collaborator object assigned to the track. It is applied via inline `style` props everywhere it appears in the `Clip` component. Never via Tailwind utility classes.

**Surfaces where owner color appears on an imported clip:**
- Left border: `2px solid ${owner.color}`
- Inset ring: `box-shadow: inset 0 0 0 1px ${owner.color}44`
- Background scan-line texture: uses `${owner.color}21` and `${owner.color}0A`
- Waveform canvas fill: `${owner.color}CC`; stroke: `${owner.color}FF`
- Waveform placeholder stroke: `${owner.color}33`
- Clip label color and text-shadow
- Resize handle gradient
- Fade handle fill
- `TrackDropTarget` highlight during drag-over (§3)
- `ImportGhostClip` border and background during drag-over (§3)

**Collaborator import scenario:** If User A (color `#1D9E75`) drops a file onto a track owned by User B (color `#E94560`), the clip color is `#E94560` — the track owner's color — not User A's color. The PM decision is explicit: color comes from track ownership, not from who performed the import.

---

## 15. Drop-Position Behavior

This section is a complete reference, consolidating rules from §12 and adding edge cases.

**On a track row:**
- Clip created on the track under the cursor.
- X-position snaps to nearest whole bar.
- Ghost clip preview updates in real time during `dragover` (§3).

**On the track header column (left 196px):**
- `dragover`: cursor `no-drop`, no overlay, no ghost clip.
- `drop`: event is canceled (`event.preventDefault()` not called, or `effectAllowed = 'none'`), no clip created.

**On the ruler row (`RULER_H = 24px` strip):**
- `dragover`: cursor `no-drop`.
- `drop`: canceled, no clip created.

**On empty arranger space below the last track:**
- `dragover`: `DropOverlay` shows invalid state (danger tint, §4).
- `drop`: ImportToast `"Drop onto a track to import."`, no clip created.

**Playhead fallback (file picker, no drop coordinates):**
- Clip placed at `Math.round(playheadBar)` — the playhead's current bar, snapped to the nearest whole bar.
- If `playheadBar` is 0, clip is placed at bar 0.

**Bar snap precision:** Whole bar snap only for import (distinct from the existing `snapBar` function which uses 0.5 bar precision for clip moves). The ghost clip during drag-over snaps in whole-bar increments — the preview always shows a bar-aligned position.

**Clip length on creation:** Always 1 bar at creation time. Updated silently after decode when duration is known (see §12).

---

## 16. Accessibility Requirements

**Keyboard alternative to drag-and-drop:**
The `ImportButton` in the toolbar (§1) is the fully keyboard-accessible alternative. It is reachable via Tab navigation. Pressing Enter or Space on the focused button opens the native file picker. The file picker itself is keyboard-navigable by the OS. After file selection, the import flow proceeds identically to a drop operation.

**Keyboard shortcut for experienced users:** Pressing `I` (no modifier) when arranger focus is active opens the file picker directly, without requiring Tab navigation to the `ImportButton`.

**ARIA on the arranger drop zone:**
The arranger grid container receives:
- `role="region"` with `aria-label="Arranger timeline"` (if not already set by the arranger implementation).
- During an active drag (after `dragenter`): `aria-dropeffect="copy"` on the arranger grid container.
- `aria-grabbed` is deprecated in ARIA 1.1 — do not use it.

The `ImportButton` receives:
- `aria-label="Import audio file"` (icon-only button, label required).
- `aria-disabled="true"` when disabled.

**Screen reader announcements — complete list:**

| Event | `aria-live` region content |
|---|---|
| Import begins (file selected or dropped) | `"Importing {filename} onto track {track.name}."` |
| Upload in progress | No repeat announcement — the initial "Importing" message is sufficient. |
| Waveform generating | `"Waveform generating for {filename}."` |
| Import complete (peaks ready) | `"Import complete. {filename} added to track {track.name} at bar {bar}."` |
| Upload failed | `"Upload failed for {filename}. Check your connection and try again."` |
| Decode failed (waveform unavailable) | `"Waveform preview unavailable for {filename}. The clip has been added to track {track.name}."` |
| Unsupported file type | `"Unsupported file type. Drop a WAV, MP3, OGG, FLAC, or AIFF file."` |
| Multi-file rejected | `"Import one audio file at a time for now."` |

The `aria-live` region is a `div` with `role="status"` and `aria-live="polite"`. It is always present in the DOM but visually hidden (`position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0)`). Messages are injected as text content. Each message replaces the previous — no accumulation.

**Focus management after successful import:**
On successful import completion (peaks rendered), focus does not move automatically. The user's current focus position is preserved. If the user invoked import via the `ImportButton` (keyboard), focus returns to the `ImportButton` after the file picker closes — this is the browser's default behavior for `<input type="file">` dialogs and requires no special handling.

If the user would benefit from navigating to the new clip, that is a future enhancement (e.g. clip keyboard navigation). Sprint 7 does not implement clip focus.

**Contrast verification:**
- `ImportButton` icon (`C.textSec` = `#888899`) on `C.control` (`#2A2A38`): contrast ratio ≈ 3.8:1. This fails WCAG AA for normal text but is acceptable for icon controls (WCAG 1.4.11 Non-text Contrast requires 3:1 — passes). Hover state raises contrast to `C.textPri` (`#F0F0F5`), which exceeds 7:1.
- ImportToast text (`C.textPri` = `#F0F0F5`) on `C.elevated` (`#1A1A24`): contrast ratio ≈ 12:1. Passes.
- Progress bar label (`C.textSec` = `#888899`) on `C.bg` (`#0A0A0F`) dimmed overlay: contrast ≈ 5.5:1. Passes AA.

---

## 17. Platform Notes

**Desktop browser (primary Sprint 7 target):**
Full feature set as specified in this document. File picker and OS drag-and-drop both fully supported. `PeakGenerator` uses the Web Audio API (`AudioContext.decodeAudioData`) to decode the file buffer and compute peak data. Progress reporting via `XMLHttpRequest` or `fetch` with `ReadableStream`. All states in §5–§14 must be implemented.

**Desktop app (primary Sprint 7 target):**
Full feature set. OS drag-and-drop is natively supported in Electron/Tauri-style wrappers. The `PeakGenerator` can use the same Web Audio API path as the desktop browser, or a native decode path — the abstraction must accommodate both. The file picker maps to the native OS dialog via the same `<input type="file">` mechanism. No behavioral difference from desktop browser in Sprint 7. Visual treatment is identical.

**Tablet (data model + fallback states required; full editing not required in Sprint 7):**
Drag-and-drop from the OS to the browser is not reliably supported on tablet browsers (iPadOS Safari does not support `dragover` from the Files app to a web page as of 2026). The `ImportButton` file picker is the primary import path on tablet.

File picker support: available via the native share sheet or Files picker. MIME type filtering works on iPadOS. Single-file selection enforced.

`PeakGenerator` on tablet: capable runtimes (iPad Pro, M-series iPads) should attempt local peak generation. Apply a file size limit of `50MB` before attempting decode — files above this threshold should skip generation and show the permanent placeholder (§9) with no ImportToast. The `PeakGenerator` abstraction must accept a `capabilityHint` parameter that the host platform populates; the implementation decides whether to attempt decode.

Visual states: all states are required to render correctly on tablet viewport widths down to `768px` wide. The import UX is not redesigned for tablet in Sprint 7 — it uses the same desktop layout, which may require horizontal scrolling. This is acceptable for Sprint 7.

**Mobile (fallback/placeholder states only; no editing workflow required in Sprint 7):**
Mobile import is not a Sprint 7 UI target. However, the data model must support it: `ClipData` must carry `importStatus` and a reference to persisted peak data so that mobile clients can render clips without local decode.

If a mobile user somehow accesses the arranger (e.g. on a large phone in landscape): the `ImportButton` should be present and functional. The file picker opens the native media picker. After import, the `PeakGenerator` should detect the mobile environment and skip local decode, immediately showing the permanent placeholder (§9). The `ClipProgressOverlay` shows `"Importing…"` (no percentage) while the upload is in progress, then disappears — no waveform skeleton (§8 decode state is skipped on mobile).

The `DropOverlay` and drag-over states are irrelevant on mobile (no file drag from OS). The `dragenter`/`dragover` handlers should remain in place but will never fire on mobile browsers.

---

## Open Questions

None. All design decisions have been resolved.

PM decisions confirmed as non-reopenable:
- Waveform generation: local `PeakGenerator` abstraction, persisted peaks.
- Import trigger: file picker + OS drag-and-drop.
- Clip color: track owner color.
- Multi-file: single file only, toast with PM-specified message.
- Device fallback: required, no silent failure.

---

## Design Tokens Reference

All colors must use tokens from the `C` const in `src/App.tsx`. Never hardcode hex values. Collaborator colors are applied via inline `style` props, not Tailwind classes. See `CLAUDE.md` § Design constraints.

| Token | Value | Used in this spec |
|---|---|---|
| `C.bg` | `#0A0A0F` | Overlay blend, `ClipProgressOverlay` background |
| `C.surface` | `#111118` | — |
| `C.elevated` | `#1A1A24` | Toast background, hover tooltips |
| `C.accent` | `#6B5CE7` | `DropOverlay` valid border, progress bar fill, `ImportButton` active bg |
| `C.accentMuted` | `rgba(107,92,231,0.13)` | `DropOverlay` background tint |
| `C.danger` | `#E94560` | Invalid drop, unsupported type, failed upload — borders and backgrounds |
| `C.success` | `#1D9E75` | `DropOverlay` border on valid drop |
| `C.warn` | `#F5A623` | Failed decode toast border |
| `C.textPri` | `#F0F0F5` | Toast text, clip label |
| `C.textSec` | `#888899` | Progress labels, secondary copy |
| `C.control` | `#2A2A38` | `ImportButton` resting background, progress track |
| `C.border` | `#1E1E28` | Tooltip borders |
| `C.well` | `#0D0D14` | — |
| `owner.color` | dynamic hex | All clip tinting, ghost clip, track row highlight, placeholder stroke |
