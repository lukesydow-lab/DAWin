# Spec: Crossfade + Fade — Direct-Manipulation Curves

**Status:** Designed (text spec, no prototype — interaction is small enough to ship from spec). Awaiting Tech Lead approval.
**Current implementation:**
- `src/App.tsx` — `Clip` component (fade handles + fade overlay), lines around 1015–1075
- `src/App.tsx` — `Toolbar` Crossfade tool button, lines around 752–776
- Existing data model: `clip.fadeIn`, `clip.fadeOut` (length in bars), `clip.fadeInCurve` / `clip.fadeOutCurve` (`'linear' | 'ease' | 'sharp'`)

---

## What this replaces

Two existing UI surfaces collapse into one consistent interaction:

1. **The Crossfade (⋈) toolbar tool** — currently a stub that only changes the cursor. **Remove it entirely.** Crossfading is no longer a mode you enter; it's a result of clip overlap.
2. **The fade-curve preset picker** that appears at the bottom-right of a clip on hover (linear / ease / sharp). **Remove the picker.** The curve shape is set by grabbing the visible fade line directly.

---

## The interaction in one sentence

When two audio clips overlap on the same track, each clip's fade region shows a draggable volume curve, and the user shapes each curve independently by grabbing a midpoint handle and bending it.

---

## Visual anatomy

### Fade region (single clip — fade-in or fade-out at a clip edge)

```
┌────────────────────────────────────────┐
│                                        │
│ ╲                                      │   ← fade-in curve drawn on top of
│  ╲                                     │     the waveform, in clip owner color
│   ╲                                    │
│    ●                                   │   ← midpoint handle (8px circle)
│     ╲                                  │
│      ╲                                 │
│       ╲___________________________     │   ← line resolves to waveform top
│                                        │     when fade is complete
└────────────────────────────────────────┘
   ↑                  ↑
fade start         fade end
```

The fade line traces the **volume envelope** across the fade region. At fade-start, the line sits at the top of the clip body (full volume); at fade-end, it sits at the bottom (silent). The midpoint handle is in the middle of the fade horizontally; its vertical position determines the curve shape.

### Crossfade region (two overlapping clips)

```
       clip A                    clip B
┌──────────────────┬───────────────────────┐
│                  │ ───── overlap ─────   │
│                  │                       │
│                  │ ╲             ●       │   ← clip B fade-in curve
│                  │  ╲           ╱        │     (with its own handle)
│                  │   ●         ╱         │   ← clip A fade-out curve
│                  │    ╲       ╱          │     (with its own handle)
│                  │     ╲     ╱           │
│                  │      ╲___╱            │
│                  │                       │
└──────────────────┴───────────────────────┘
```

Two curves, two handles, **fully independent**. The user can drag clip A's handle up while pulling clip B's handle down — creating a brief dip in total volume through the overlap (a "duck"). Or the inverse — both handles up, creating a brief boost (an "emphasis"). Or both at the linear default.

---

## Curve math (engineering reference)

Each curve is a **quadratic Bézier** through three points:

- **P₀ = (0, y_start)** — line origin (1 for fade-out start, 0 for fade-in start)
- **P₁ = (0.5, y_mid)** — control point at horizontal midpoint, vertical = `clip.fadeCurve` (0..1)
- **P₂ = (1, y_end)** — line endpoint (0 for fade-out end, 1 for fade-in end)

For a **fade-in** (silent → full), given t ∈ [0,1] across the fade region:

```
gain(t) = 2·y_mid·t·(1 − t)  +  t²
```

For a **fade-out** (full → silent):

```
gain(t) = 1 − [ 2·y_mid·t·(1 − t)  +  t² ]
```

**Defaults and edge cases:**
- `y_mid = 0.5` → curve is exactly **linear** (the default state on first overlap)
- `y_mid → 1.0` → **convex** (fast start, slow end) — sound rises quickly then plateaus
- `y_mid → 0.0` → **concave** (slow start, fast end) — sound stays quiet then rises sharply
- Clamp `y_mid` to `[0.05, 0.95]` so the handle never reaches the extremes (which would produce a 90° corner that's both ugly and hard to grab back)

---

## Data model changes

The existing `clip.fadeInCurve` / `clip.fadeOutCurve` fields change from a string enum to a number:

```ts
// BEFORE
type FadeCurve = 'linear' | 'ease' | 'sharp'
type Clip = {
  fadeIn: number       // bars
  fadeOut: number      // bars
  fadeInCurve: FadeCurve
  fadeOutCurve: FadeCurve
  ...
}

// AFTER
type Clip = {
  fadeIn: number          // bars
  fadeOut: number         // bars
  fadeInCurve: number     // 0..1, midpoint Y position. Default 0.5 (linear)
  fadeOutCurve: number    // 0..1, midpoint Y position. Default 0.5 (linear)
  ...
}
```

**Migration:** existing presets map cleanly:
- `'linear'` → `0.5`
- `'ease'`   → `0.7` (slightly convex — matches the current "ease" preset feel)
- `'sharp'`  → `0.3` (slightly concave — matches the current "sharp" preset feel)

---

## Interaction states

| State | Visual |
|---|---|
| **Clip has no fade** | No line drawn. Fade-in / fade-out handles at top corners stay as they are today (small triangles, drag horizontally to extend the fade region into existence). |
| **Clip has a fade** | The curve is drawn across the fade region in the clip owner color at full opacity, **1.5px stroke** with a subtle 4px-wide owner-color glow at 25% alpha. |
| **Hover over fade region** | Midpoint handle (8px filled circle, owner color, 1px white inset stroke) appears centered on the line. Cursor over the handle becomes `ns-resize`. |
| **Dragging the handle** | Cursor stays `ns-resize`. Handle position follows cursor Y, clamped to its fade-region rectangle and to `y_mid ∈ [0.05, 0.95]`. The line re-renders in real time. Other handles in the overlap remain interactive. |
| **Clips overlap (crossfade implicit)** | Both clips' fade-in/fade-out regions are visible in the overlap. Each has its own handle. **No special "crossfade" state** — it's just two fades coexisting. |
| **No overlap, fades meet at boundary** | Two adjacent fades render as two independent curves with no overlap; no special treatment. |
| **Snapping** | When the handle is within 4px of the linear position (`y_mid = 0.5`), snap. Light haptic-style snap (no animation needed — just lock the value). |

---

## Creating an overlap (the gesture that triggers a crossfade)

This part doesn't change from today: the user drags one clip toward another on the same track until they overlap. Today the overlap is unbordered and visually messy. The new behavior:

1. Once an overlap exists (clip B's start < clip A's end), automatically extend:
   - Clip A's `fadeOut` to match the overlap length
   - Clip B's `fadeIn` to match the overlap length
2. Both curves render in the overlap region.
3. The user can then bend each independently.

**If the user shortens or eliminates the overlap by dragging again**, the fade regions shrink with it. If overlap drops to zero, both clips snap back to their pre-overlap fade lengths (preserved as separate state, or just zeroed — engineering preference).

---

## What goes away

| Element | Action |
|---|---|
| Toolbar Crossfade tool (⋈, shortcut X) | **Remove.** No replacement — the X keyboard shortcut should now be unmapped. |
| `case 'crossfade'` in `tool` state | **Remove.** Tool state becomes `'select' | 'cut'` only. |
| Fade-curve preset picker (linear/ease/sharp buttons at clip bottom-right) | **Remove.** |
| `FadeCurve` type | **Remove.** |
| String-based curve discrimination in the canvas fade-overlay drawer | **Remove.** Replace with the bezier formula above. |

---

## Accessibility

- **Keyboard:** with a clip selected, `Shift + ,` (less-than) and `Shift + .` (greater-than) bend the active fade curve down/up by 0.05. If a single fade is targeted (last-edited or focused), it adjusts; otherwise the most recent fade edited adjusts. (Confirm key binding with Tech Lead — these are unmapped in the existing keybindings table.)
- **ARIA:** the midpoint handle is a `<button role="slider">` with `aria-valuemin="0"`, `aria-valuemax="1"`, `aria-valuenow={curve}`, `aria-label="{clip name} fade-{in|out} curve"`.
- **Live region** announces curve changes during keyboard adjustment: `"Fade-in curve 0.65"`.
- **Reduced motion:** no animation involved in the curve drag itself, so no special handling needed.

---

## Symmetry lock (crossfade pairs only)

**PM decision — 2026-05-14.** Each overlapping clip pair has a symmetry lock. When locked (default), the two handles mirror each other: dragging one to `n` automatically sets the partner to `1 − n`. This produces natural equal-power behavior without the user needing to think about it. Unlocking gives full independent control for creative ducking or asymmetric transitions.

### Data model
Add `crossfadeLocked: boolean` to `ClipData`, defaulting to `true`. Only meaningful when two clips on the same track overlap; has no effect on single-clip fades.

### UI
A padlock icon sits in the overlap region, centered on the crossfade zone, between the two midpoint handles. Click toggles locked/unlocked.
- Locked: `C.textSec` tint, closed-padlock SVG
- Unlocked: `C.accent` tint, open-padlock SVG (draws the eye so the user knows independence is active)

### Interaction when locked
When either handle is dragged in a locked pair, both `fadeInCurve` and `fadeOutCurve` update atomically. The handles visually move in opposite directions simultaneously. `Shift + ,` / `Shift + .` keyboard adjust also mirrors when locked.

### Interaction when unlocked
Handles move independently. The lock icon stays visible so the user can re-lock.

---

## DAW convention callouts

- **Direct manipulation of fade curves is the convention in every modern DAW.** Pro Tools, Logic, Ableton, Reaper, Studio One all let you grab and bend fade lines. Preset-only curve pickers are a deprecated convention.
- **Symmetry lock replaces a global equal-power setting.** Per-crossfade control is more expressive than a global toggle. The default-locked state means most users never need to think about equal-power math.
- **No quantize on curve bending.** This is a feel control, not a rhythmic control. Free drag, no snap-to-grid.

---

## Implement this first

1. **Replace `FadeCurve` type and curve preset picker** with the new `fadeInCurve` / `fadeOutCurve` numeric model. Migrate existing clips (linear → 0.5, ease → 0.7, sharp → 0.3). This is a non-visual data-model change that unblocks everything else.
2. **Render the new bezier fade line** on each clip in place of the current preset-driven fade overlay. Use the formula above.
3. **Add the midpoint handle** with the drag interaction.
4. **Remove the toolbar Crossfade tool** and the `'crossfade'` value from the tool state.
5. **Auto-extend fade regions on overlap** (the implicit crossfade gesture).

Steps 1–3 are the bulk of the work. Steps 4–5 are cleanup and the implicit-overlap gesture, respectively.
