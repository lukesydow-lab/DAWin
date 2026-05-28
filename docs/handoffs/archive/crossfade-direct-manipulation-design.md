# Handoff: Crossfade + Fade — Direct-Manipulation Curves

**Spec:** [`docs/specs/crossfade-direct-manipulation.md`](../specs/crossfade-direct-manipulation.md)
**Date:** 2026-05-13
**Approved:** 2026-05-13
**Designer:** UX/UI Agent
**Routed to:** Tech Lead
**Status:** ✅ APPROVED — ready for engineering assignment

---

## Approval

Design is approved and locked. No prototype was built — the interaction is small and well-described in text + math. Engineering should be able to implement directly from the spec. Open questions below are **engineering decisions to resolve during planning**, not blockers.

---

## What this changes

Replaces two existing UI patterns with one direct-manipulation interaction:

1. **The toolbar Crossfade tool (⋈, shortcut X) is removed.** Crossfading is no longer a mode you enter; it happens implicitly when clips overlap.
2. **The fade-curve preset picker (linear / ease / sharp buttons at clip bottom-right) is removed.** Curve shape is set by grabbing a visible midpoint handle on the fade line and bending it.

The two changes share one interaction: every fade on every clip has a single midpoint handle. The user shapes the curve by dragging it. Crossfade is just two fades happening in the same overlap region — each with its own handle, **fully independent**.

---

## Decisions locked in

1. **No tool mode for crossfade.** Crossfade is implicit on overlap, not a tool you select.
2. **Each curve is independent.** No auto-mirroring. The user can drag clip A's handle up and clip B's handle down to create a duck in the overlap, or vice-versa.
3. **Single midpoint handle per curve.** One tension parameter, like a tape-machine fade. Quadratic bezier through (0, start), (0.5, midpoint), (1, end).
4. **Same interaction replaces single-clip fade-in/fade-out shape control.** Consistency across all fades. The preset picker (linear / ease / sharp) goes away.
5. **Data model: curve shape is a number 0..1**, not a string enum. Default 0.5 = linear. Migration map: linear → 0.5, ease → 0.7, sharp → 0.3.

---

## The math (engineer-ready)

Each curve is a quadratic bezier defined by `clip.fadeInCurve` / `clip.fadeOutCurve` ∈ [0.05, 0.95]:

```
Fade-in gain at t ∈ [0,1]:
    gain(t) = 2·curve·t·(1 − t)  +  t²

Fade-out gain at t ∈ [0,1]:
    gain(t) = 1 − [ 2·curve·t·(1 − t)  +  t² ]

Where curve = the Y position of the midpoint handle (0 bottom, 1 top).
```

When `curve = 0.5`, the formula reduces to `gain(t) = t` (linear).
Clamped to `[0.05, 0.95]` so the handle can't hit the extremes that would produce a 90° corner.

This is the same formula used both for drawing the SVG fade line and for computing the actual audio gain — single source of truth, no risk of visual/audio drift.

---

## FE implementation priority

1. **Replace the `FadeCurve` type** (`'linear' | 'ease' | 'sharp'`) with `number` on `clip.fadeInCurve` / `clip.fadeOutCurve`. Migrate existing clips using the map in decision #5.
2. **Replace the canvas fade-overlay drawing logic** that uses `FadeCurve` switches with the bezier formula above.
3. **Draw the fade line in SVG** over each clip's fade region (clip owner color, 1.5px stroke, 4px glow). The SVG path is the same bezier.
4. **Add the midpoint handle** as a draggable SVG circle. Drag updates `clip.fadeInCurve` / `clip.fadeOutCurve`. Snap to 0.5 within 4px.
5. **Remove the preset picker** at the clip bottom-right.
6. **Remove the Crossfade tool** from the toolbar + the `'crossfade'` value from the tool state. Unmap the X keyboard shortcut.
7. **Auto-extend `fadeIn` / `fadeOut` to match overlap length** when two clips on the same track overlap.

Steps 1–4 are the core. Steps 5–7 are cleanup + the implicit-overlap gesture.

---

## Open questions for Tech Lead

- [ ] **Audio path:** how is the fade gain currently applied to playback? The visual fade exists in the renderer but I don't see a corresponding audio gain ramp. When real playback is wired, the bezier formula above is what should drive the actual `GainNode.gain.linearRampToValueAtTime` / `setValueCurveAtTime` calls.
- [ ] **`react-spring` / GSAP / native React state for the handle drag?** Native state is fine — the drag is a one-input slider. But confirm.
- [ ] **Performance:** SVG fade lines render at ~60fps with no measurable cost. But on a track with 30 clips all with fades, that's 30+ SVG paths + handles in the DOM. If performance becomes a concern, fall back to canvas (same bezier, draw with `quadraticCurveTo`).
- [ ] **Keyboard adjust binding:** spec proposes `Shift + ,` / `Shift + .` to bend the active fade curve down/up by 0.05. These are unmapped today — confirm no collision in planning.
- [ ] **Overlap-fade-length preservation:** when the user shortens an overlap by dragging clips apart, should the original (pre-overlap) fade lengths be restored, or just zeroed? Either is reasonable; pick the simpler.

---

## Open question for PM

- [ ] **Equal-power compensation toggle:** some DAWs offer an "equal-power crossfade" toggle that auto-shapes both curves to maintain constant total energy through the overlap. The spec leaves the curves fully independent (per the user's explicit request). Want this as a feature flag for a future "I want the math right" mode, or is full manual control the whole story?

---

## What goes away (cleanup checklist)

- [ ] `type FadeCurve = 'linear' | 'ease' | 'sharp'` — delete
- [ ] `clip.fadeInCurve: FadeCurve` → `clip.fadeInCurve: number`
- [ ] `clip.fadeOutCurve: FadeCurve` → `clip.fadeOutCurve: number`
- [ ] Toolbar Crossfade button (⋈) — delete from the `tools` array in `Toolbar`
- [ ] `'crossfade'` case in tool state — delete
- [ ] X keyboard shortcut — delete from the global keydown handler
- [ ] Fade-curve preset picker (the three small buttons at the bottom-right of a clip on hover) — delete
- [ ] Any switch/case logic discriminating fade curve types in the canvas drawer — replace with bezier formula

---

## Confirmation

- [x] Read existing `Clip` component, `Toolbar`, and tool-state logic in `src/App.tsx`
- [x] User confirmed: no mirroring, single handle, replaces preset picker too
- [x] Spec aligns with existing data shape — only `FadeCurve` type changes
- [x] No conflicting handoffs in `docs/handoffs/`
- [x] Math verified: bezier formula reduces to linear at curve=0.5, produces convex at >0.5, concave at <0.5
