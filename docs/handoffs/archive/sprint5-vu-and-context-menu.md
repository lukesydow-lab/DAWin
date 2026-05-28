# Sprint 5 — VU Stereo Meters + Context Menu Design Spec

**Status:** Design complete — ready for FE implementation correction  
**Date:** 2026-05-18  
**Author:** Designer agent  
**References:** `src/App.tsx` (VU constants lines 2674–2686, MixerStrip lines 2825–2918, master strip lines 3150–3208, ContextMenu lines 1612–1651, ruler lines 2334–2368)

---

## 5-I-1: 0 VU Tick Mark

### What this is

A static reference mark on the VU meter bar indicating 0 VU, which corresponds to −18 dBFS in the IEC 60268-17 calibration. In the current 20-segment meter, 0 VU falls at the boundary between segment 12 (the last green segment) and segment 13 (the first amber segment). That boundary is at normalized level `13/20 = 0.65` — the `VU_AMBER_START` threshold already defined in the constants.

### Tick line

Draw a horizontal 1px rule that spans the full combined width of the two meter bars plus the 1px gap between them. The tick sits at the bottom edge of the amber zone — visually, it is positioned at the gap between segment index 12 and segment index 13 (counting from the bottom, 0-based).

**Positioning math (use the existing constants, do not hardcode):**

```
tickBottom = VU_AMBER_START * (VU_SEG_H + VU_SEG_GAP)
           = 13 * (3 + 1)
           = 52px from the bottom of the meter column
```

The tick is `position: absolute` within the `flex gap-px` wrapper that contains the two channel columns. Its `bottom` is `52px`. Width spans the full wrapper (both bars + gap) — approximately 9px (4px + 1px + 4px), but let the wrapper's natural width determine it; do not hardcode 9.

**Color:** `C.textSec` (`#888899`) at 60% opacity. This reads clearly against `C.metalDark` unlit segments and doesn't compete with the amber or green glow of lit segments.

```
style={{
  position: 'absolute',
  bottom: 52,       // = VU_AMBER_START * (VU_SEG_H + VU_SEG_GAP)
  left: 0,
  right: 0,
  height: 1,
  background: C.textSec,
  opacity: 0.6,
  pointerEvents: 'none',
  zIndex: 2,
}}
```

### "0" label

The "0" label sits to the **left** of the meter pair, outside the meter bar, not overlapping the lit segments. This matches every hardware VU meter convention (Neve, SSL, API all label to the side).

- Font: `font-mono`, `fontSize: 7`, `color: C.textSec`, `opacity: 0.7`
- Position: `position: absolute`, `right: 100%` from the meter pair wrapper, `bottom: 48px` (a 4px downward offset from the tick line so the label baseline aligns visually with the tick rather than sitting above it)
- `marginRight: 2px` between the label and the meter bars

Because the meter pair wrapper already has `role="presentation" aria-hidden="true"`, the "0" label is also `aria-hidden="true"`. The accessible level information lives in the `dB` readout span below.

**Implementation note:** The meter pair is currently rendered in an `aria-hidden` `div.flex.gap-px`. To add the tick and label, the FE needs to promote that wrapper to `position: relative` and place both the tick line and label as `position: absolute` children of the same wrapper. The channel column divs inside should remain `position: relative` for their own peak-hold dots.

The simplest approach is to wrap the existing `flex gap-px` div in a new outer `position: relative` container, add the tick and label there. Like:

```jsx
{/* outer container — relative for tick mark */}
<div style={{ position: 'relative' }} role="presentation" aria-hidden="true">
  {/* 0 VU label — left of meter bars */}
  <span style={{
    position: 'absolute',
    right: 'calc(100% + 2px)',
    bottom: 48,
    fontSize: 7,
    fontFamily: 'monospace',
    color: C.textSec,
    opacity: 0.7,
    lineHeight: 1,
    pointerEvents: 'none',
  }} aria-hidden="true">0</span>

  {/* tick line — spans both bars */}
  <div style={{
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    height: 1,
    background: C.textSec,
    opacity: 0.6,
    pointerEvents: 'none',
    zIndex: 2,
  }} />

  {/* existing meter bars */}
  <div className="flex gap-px" style={{ height: VU_HEIGHT }}>
    {/* ...existing channel columns... */}
  </div>
</div>
```

### Should the "0" label appear on the master strip?

**Yes.** The master strip uses an identical meter layout (same `VU_SEGS`, `VU_SEG_H`, `VU_SEG_GAP`, `VU_AMBER_START` constants, same two-column `flex gap-px` structure at lines 3174–3192). Apply the same tick and label treatment. The master strip is where clipping is most damaging — the 0 VU reference is most useful here.

### States

- **Tick always visible** — it is a static scale marking, not a dynamic indicator. It does not change color, animate, or respond to meter level.
- The tick is present in all meter states: silent, playing, muted, armed, during heartbeat startup.

---

## 5-I-2: L/R Stereo Meter Layout

### Current state

The implementation already renders two side-by-side bars per strip (lines 2883–2902 in `MixerStrip`, lines 3174–3192 in the master strip). `VUPhysics` already carries `levelL`/`levelR` and `peakL`/`peakR`. The `renderVUChannel` function already writes L and R independently. The stereo upgrade is architecturally complete. The visual design decisions below govern the polish layer.

### Bar dimensions — do not widen the strip

The channel strip is 64px wide (`width: 64` at line 2827). The VU pair must stay within the 10px budget it already occupies (2 bars × 4px + 1px gap = 9px). Do not widen the bars.

**Decision: keep 4px per bar, 1px gap.** This is the right call for a pro-density tool. The bars are small but legible because the colors do the work, not size.

### L and R micro-labels

Add 5px micro-labels "L" and "R" centered above each bar column. These are rendered above the top of the meter column (i.e., above the `VU_HEIGHT` block), not floating over it.

```
style={{
  fontSize: 5,
  fontFamily: 'monospace',
  letterSpacing: 0,
  color: C.textSec,
  opacity: 0.5,
  textAlign: 'center',
  width: 4,            // matches bar width
  lineHeight: '8px',   // 8px tall label row above the meter
  userSelect: 'none',
}}
```

The label row (`L` / `R`) sits between the M/S button group and the VU+fader row. The 8px height is absorbed into the existing `gap-1.5` spacing in the strip's flex column — no additional gap needed.

Do not use larger labels. At 5px, L and R are readable at the density required. At 7px or above they compete with the segment glow visually and look out of proportion.

### Peak-hold dot — one per channel

Each channel already has its own peak-hold dot ref (`peakDotL`, `peakDotR`). Keep them independent. The peak-hold dot on each channel reflects that channel's peak, not a combined stereo peak. This is correct DAW behavior (Pro Tools, Logic, Ableton all show independent L/R peaks).

The existing implementation at lines 2892–2901 already places the peak dot inside each channel column div. This is correct — no change needed here.

### Transient glow — independent per channel

The transient glow (`transientStartL`, `transientStartR` in `VUPhysics`) is already tracked independently. The `renderVUChannel` function applies glow per-channel independently. This is correct — do not share a single glow between channels. A transient that hits L harder than R is exactly the kind of information a stereo meter should show.

### Master strip — stereo in Sprint 5

**Yes, go stereo on the master strip in Sprint 5.** The master strip already has dual-column meter rendering (lines 3174–3192) with `masterSegRefsL`/`masterSegRefsR` and `masterPeakDotL`/`masterPeakDotR`. Apply the same L/R micro-labels treatment. The master strip is where stereo field information matters most (checking for L/R imbalance on the full mix).

Apply the 0 VU tick mark (Section 5-I-1) to the master strip meter as well.

### Audio wiring note (for FE / Tech Lead)

The current `readRMS` function reads from a single mono `AnalyserNode` per track (line 740–743). To drive true L/R meter levels, the FE needs to split the post-fader signal into two channels and read each independently, or use `getChannelData` on a stereo analyser. This is an audio engineering task outside the visual spec — flag to Tech Lead. Until the audio wiring is done, mirroring L to R with a slight offset (as the prototype does at 0.91×) is acceptable as a visual placeholder, but must be replaced before UAT.

---

## 5-J-1: Rename Clip

### Trigger

Right-clicking a clip opens the `ContextMenu`. Selecting "Rename…" should dismiss the context menu and activate an inline text input over the clip label area. Currently this item is `disabled: true` in the context menu (line 1630). This spec governs the activated state.

### Input appearance

The clip label lives in `div.absolute.inset-0.flex.items-center.px-2` with a `span` child (lines 1554–1560). The `<input>` replaces the `span` in place, not a modal or popover. It must respect the clip's existing color tinting.

**Input element:**

```
background: rgba(0, 0, 0, 0.45)   // semi-transparent dark scrim over clip color
border: none
border-bottom: 1px solid <owner.color>   // the collaborator color, via inline style
border-radius: 2px
color: C.textPri
caret-color: <owner.color>              // collaborator color caret, via inline style
font-size: 10px
font-weight: 700
letter-spacing: 0.08em
text-transform: uppercase
padding: 0 4px
width: 100%
outline: none
```

Do **not** use `C.elevated` as the input background. `C.elevated` is a panel-level surface — it would render as an opaque rectangle over the clip, destroying the collaborator color tinting that communicates ownership. The semi-transparent dark scrim (`rgba(0,0,0,0.45)`) preserves the clip's color texture underneath while ensuring the text is legible.

**Focus ring:** a `box-shadow: 0 0 0 1px <owner.color>` on the input element, applied when focused. Do not use `C.accent` for the focus ring — the clip belongs to a specific collaborator, and their color should own the interaction. The accent purple is for application-level actions (transport, buttons) not per-clip identity signals.

Tailwind: `focus:outline-none` on the input element. The focus ring comes from inline `style` via `boxShadow` because it uses the dynamic collaborator color.

### Minimum width behavior

If the clip is narrower than 60px, the input can overflow the clip boundaries horizontally — set `min-width: 60px` on the input and allow it to overflow with `overflow: visible` on the clip container temporarily during rename. Do not truncate the input to a point where it becomes unusable. If the clip is very short, the user needs to be able to type a new name.

At widths below 40px, the clip is essentially a sliver and the rename affordance is borderline unusable. In this case, show the input at 60px minimum width and clip it with `overflow: hidden` on the clip container — the input renders over neighboring clips' z-layers but the clip itself does not grow. The user will trim the name to fit, which is the correct DAW behavior (clip labels truncate; names don't have to fit visually).

### Commit and cancel

**Commit on Enter and on blur.** Both are correct for a DAW rename. This matches Logic Pro, Ableton, and Pro Tools rename behavior. If the user clicks away (blur) without pressing Escape, the name change should commit. This is the expected behavior — blur-to-commit prevents data loss and matches user expectations from other DAWs.

**Cancel on Escape** — pressing Escape should revert to the original label and dismiss the input. The original label must be captured when the input is first mounted.

**Validation:** trim whitespace on commit. If the trimmed value is empty, revert to the original label rather than setting an empty clip name. Empty clip labels are invisible — do not allow them.

### Entry/exit animation

**None.** No fade, no scale. The input appears immediately on menu selection and disappears immediately on commit or cancel. Clip rename is a direct manipulation action — animation on entry/exit adds latency to a tight interaction loop. This is correct DAW behavior: all major DAWs show the rename input immediately with no transition.

The only motion allowed: the `caret-color` is already the collaborator color, so the blinking cursor gives subtle life to the input without an explicit animation.

### States

| State | Treatment |
|---|---|
| Default (no rename) | Clip label `span` renders as normal |
| Rename active | `span` replaced by `input`, semi-transparent scrim background, collaborator-color underline and caret, focus ring |
| Rename active, input empty | input shows empty with placeholder text (the original label, dimmed) — do not set placeholder to generic "Clip name" |
| Commit (Enter or blur, non-empty) | input unmounts, `span` re-renders with updated label |
| Cancel (Escape) | input unmounts, `span` re-renders with original label |
| Clip too narrow (<40px) | input min-width 60px, overflow visible, z-index elevated above neighbors |

---

## 5-J-2: Loop Region

### Overview

The loop region is defined by `loopStart` (bar index) and `loopEnd` (bar index). When set, three things render:
1. A translucent overlay on the ruler indicating the loop span
2. The overlay extends into the full track lane area below the ruler
3. A loop indicator button in the transport bar

### Ruler overlay

The overlay is an absolutely-positioned element that spans from `loopStart * BAR_W` to `loopEnd * BAR_W`, covering the full height of the scroll area (ruler + all track lanes). It sits at the same z-layer as the ruler bar highlights but below the playhead and comment pins.

**Revised treatment from the spec suggestion:**

The proposed `rgba(107, 92, 231, 0.18)` is correct for the fill — this maps to `C.accent` at 18% alpha. Do not hardcode the hex. Use `accentMuted` is not quite right either (`accentMuted` is `rgba(107,92,231,0.13)` — slightly too faint for a regional selection). Use inline style with `C.accent`:

```js
background: `${C.accent}2E`   // hex alpha: 2E = 18%
```

**Top border:** 1px solid `C.accent` — this is the correct treatment. The top border anchors the overlay visually to the ruler and makes the loop start/end positions precise.

**No bottom border.** The overlay fades into the track area naturally. Adding a bottom border would make the loop region look like a box, which conflicts with the "ambient region" convention Ableton and Logic use.

**Left and right edges:** 1px solid `C.accent` at 50% alpha (`${C.accent}80`). These mark the loop bracket endpoints precisely. This differs from the top border (which is full opacity) to create a subtle hierarchy: the top edge is the "ruler bar" authority line, the sides are "region extent" markers.

### Does the overlay conflict with ruler pins (comment anchors)?

Yes, potentially. Comment anchor pins live in the ruler at `z-index` above the ruler background. The loop overlay must sit **below** the comment pins in z-order. Assign the loop overlay `zIndex: 1` and ensure comment pins remain at their current z-index (they render with `position: absolute` within the ruler — check their z in the current ruler render). The loop overlay's fill is at 18% alpha, so pins will remain visible through it.

The top border of the loop overlay may visually merge with pin triangles that sit at the top of the ruler. Mitigate this by positioning the loop overlay's top border at `top: 0` of the full scrollable grid area (not at `top: 0` of the ruler — otherwise the border overlaps the ruler's bottom border). The overlay's `top: 0` should be relative to the grid scroll container, which starts at the top of the ruler.

### Does the overlay extend into the track lane area?

**Yes, extend into the full track lane height.** This matches Ableton Live, Logic Pro, and Pro Tools — the loop region covers the full arrangement height, not just the ruler. This is muscle memory and the correct treatment.

The overlay height is `RULER_H + (tracks.length * TRACK_H)` dynamically, but in practice, setting `height: 100%` on the overlay within the scroll container achieves this without computing track count. The scroll container already knows its full height.

Position the overlay as `position: absolute` within the scrollable grid container (the same container that holds the ruler and track rows), with `top: 0`, `left: loopStart * BAR_W`, `width: (loopEnd - loopStart) * BAR_W`, `height: 100%`, `pointerEvents: none`, `zIndex: 1`.

### Loop handle grabs

The left and right edges of the loop overlay should be draggable to adjust `loopStart` and `loopEnd`. Each edge is a 8px-wide drag target (matching `HANDLE_W`) centered on the 1px border. `cursor: ew-resize`. This is the direct manipulation convention from every DAW.

For Sprint 5, if drag-to-resize handles are not implemented, show the edges as purely visual. Do not fake interactivity with `cursor: pointer` if dragging is not wired up.

### Transport bar loop indicator

**Use a text label, not a unicode glyph.** The loop bracket glyphs (↺, ⟳) are ambiguous at small sizes on dark backgrounds and have poor cross-platform rendering in monospaced UI contexts. Use the text label `LOOP` in the transport bar.

**Design:**

```
button, width: 44px, height: 28px
font: monospace, fontSize: 9px, fontWeight: 700, letterSpacing: 0.1em
text: "LOOP"
```

- **Inactive (no loop set):** `background: C.control`, `color: C.textSec`, `opacity: 0.5`
- **Active (loop set, loop playing):** `background: C.accentMuted`, `color: C.accent`, `border: 1px solid ${C.accent}44`, `boxShadow: 0 0 8px ${C.accent}33`
- **Active (loop set, transport stopped):** `background: C.accentMuted`, `color: C.accent`, `border: 1px solid ${C.accent}44` — no glow (glow only when transport is playing and looping)
- Hover (any state): `filter: brightness(1.2)`
- Focus-visible: `outline: 2px solid ${C.accent}`, `outlineOffset: 2px`
- ARIA: `aria-label="Loop region"`, `aria-pressed={loopActive}` (boolean: true when a loop region is set)

**Placement:** The LOOP button sits immediately after the Record button in the transport bar, separated by a 1px `C.border` divider. Current transport order left to right: RTZ | Play/Pause | Stop | Record | [divider] | LOOP | [gap] | BPM | POS | link icon.

### Clearing the loop region

Clicking the LOOP button when a loop is active clears the loop region (sets `loopStart` and `loopEnd` to null). The overlay disappears immediately and the button returns to inactive state. This is the standard toggle behavior used in Ableton and Logic.

### Right-click "Set loop region" on the ruler

This is out of scope for Sprint 5. The correct long-term behavior is: marquee-select a time range on the ruler (drag), then right-click to get "Set loop region from selection." This requires a range-selection interaction model on the ruler that does not yet exist. Flag as a Sprint 6 consideration — do not stub it in Sprint 5's context menu.

### States

| State | Overlay | Transport button |
|---|---|---|
| No loop set | Not rendered | Inactive (`C.control` bg, `C.textSec` text, 50% opacity) |
| Loop set, transport stopped | Overlay visible, no glow | Active (`C.accentMuted` bg, `C.accent` text) |
| Loop set, transport playing | Overlay visible | Active with glow (`boxShadow: 0 0 8px ${C.accent}33`) |
| Loop set, playhead outside loop | Overlay visible (loop region is still active; whether to auto-jump is an audio engineering concern, not a visual one) | Active |

---

## Implement this first

**5-I-1 (0 VU tick mark)** is the highest-ROI change for visual polish with the least implementation risk. It requires only adding two elements to an existing `aria-hidden` container — no audio wiring changes, no new state, no interaction logic. It immediately communicates the IEC reference level to any user who knows what 0 VU means, which is every working engineer who will evaluate this tool.

After the tick mark: implement **5-J-1 (Rename clip)** — it activates a disabled menu item that is already visible to users and is a visible missing feature. Then **5-J-2 (Loop region)**, which has the most state complexity. Do the audio wiring for stereo L/R meters last — it requires Tech Lead input on the `AnalyserNode` split approach.
