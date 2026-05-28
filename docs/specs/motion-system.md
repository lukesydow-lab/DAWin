# Spec: Motion System

**Status:** Designed — consolidates motion principles, easing catalog, duration scale, and the choreographed motions that exist as prototypes but aren't specced individually.
**Prototypes referenced:**
- [`/motion-prototypes/02-startup-heartbeat-staggered.html`](../../public/motion-prototypes/02-startup-heartbeat-staggered.html) — heartbeat startup sequence
- [`/motion-prototypes/03-vu-meter-animation.html`](../../public/motion-prototypes/03-vu-meter-animation.html) — VU meter physics
- [`/comps/waveform-zoom-motion.html`](../../public/comps/waveform-zoom-motion.html) — zoom + reset spring motion

**Companion spec:** [`motion-figma-ds.md`](motion-figma-ds.md) — how this system lives in the Figma design system.

---

## 1. Principles

The non-negotiable rules that every motion decision in DAWin must honor.

| # | Principle | Meaning |
|---|---|---|
| 1 | **Premium hardware feel** | The motorized fader on an SSL/Neve console is the reference. Fast takeoff, smooth landing. No bounce, no slop, total mechanical authority. Every motion should feel like premium gear "trapped in a computer." |
| 2 | **Conditional easing** | Primary interactions (faders, knobs, clips, transitions) get smooth, expressive motion. Errors, utility overlays, and toasts get quick, direct motion. Things too fast to animate get no motion. |
| 3 | **Smooth over abrupt** | Always favor easing over instant snaps when motion is appropriate. Never let the user feel a discontinuity unless that discontinuity carries information (e.g., a cut). |
| 4 | **Joy on every interaction** | Pushing a fader, turning a knob, hitting record — each must feel slightly satisfying. A cheap MIDI controller should feel like a million bucks **in the software**. |
| 5 | **Reduced motion respected** | When `prefers-reduced-motion` is set: disable decorative passes (glow flares, shimmer sweeps, hover lifts). Preserve functional motion (attack/decay on meters, value changes that convey state). |

---

## 2. Easing catalog

Every easing curve has a token name. Components reference tokens, never raw cubic-beziers.

### Curves used in current designs

| Token | Curve | Math | Use when |
|---|---|---|---|
| `motion.easing.snappy` | easeOutBack soft (c1=1.2) | `1 + 2.2·(t−1)³ + 1.2·(t−1)²` — peaks +6% at t=0.68 | Zoom transitions, popover open/close, hover lift — soft overshoot with cubic settle |
| `motion.easing.expressive` | easeOutQuint | `1 − (1−t)⁵` | Heartbeat rise, fader rise — explosive launch, silky deceleration to peak |
| `motion.easing.weighted` | easeInOutQuart | `t<0.5 ? 8t⁴ : 1 − (−2t+2)⁴/2` | Heartbeat fall, fader settle — slow start, weighted middle, floats into landing |
| `motion.easing.spring` | Underdamped spring (ζ=0.5, ω=10) | `1 − e^(−ζωt)(cos(ω_d·t) + (ζω/ω_d)sin(ω_d·t))` | Zoom reset, return-home gestures — real bounce with visible secondary oscillation |
| `motion.easing.motorized` | easeOutQuart | `1 − (1−t)⁴` | Motorized recall, automation playback — fast initial velocity, smooth precise landing |
| `motion.easing.utility` | easeOutCubic | `1 − (1−t)³` | Position/center animation, generic utility motion |
| `motion.easing.linear` | identity | `t` | Audio level rendering, position interpolation where physics already shapes the curve |

### Curves explicitly NOT in the catalog

- **easeIn (any flavor) on its own** — never start slow on a primary action. The user expects feedback the instant they click. Always pair an ease-in with an ease-out (easeInOut) if you must.
- **Bounce curves with multiple oscillations** — except for the deliberate spring reset above. Multiple bounces on small UI motions read as buggy.

---

## 3. Duration scale

Like the color tokens — a small, deliberate scale. Components reference tokens, never raw milliseconds.

| Token | Value | Use when |
|---|---|---|
| `motion.duration.instant` | `0ms` | State change is too fast to animate. Just snap. (Cut tool blade position, keyboard nav focus.) |
| `motion.duration.fast` | `140ms` | Utility actions, toast appear/dismiss, error states. "Heard you" without ceremony. |
| `motion.duration.base` | `240ms` | Hover lifts, focus ring expansions, popover open/close. The default for component-level state changes. |
| `motion.duration.standard` | `340ms` | Zoom transitions, value changes the user initiated and wants to feel land. |
| `motion.duration.expressive` | `520ms` | Motorized recall, fader spring-in, single-track choreography. |
| `motion.duration.return` | `640ms` | Zoom reset / return-home gestures. Ceremonial, deliberate. |
| `motion.duration.ceremonial` | `833ms` | One human heartbeat at 72 BPM. Startup choreography, hero moments. |

**Rule of thumb:** if you find yourself reaching for a value between two tokens (e.g., 280ms), step back and pick the nearer token. A scale of 7 values is a feature, not a limitation.

---

## 4. Motion components (per feature)

Cross-reference table — where each motion is implemented and where its spec lives.

| Motion | Curve | Duration | Spec |
|---|---|---|---|
| Heartbeat startup — beat rise | `expressive` | `standard` (rise = 316ms within an 833ms beat) | This doc, §5 |
| Heartbeat startup — beat hold | n/a | `100ms` within an 833ms beat | This doc, §5 |
| Heartbeat startup — beat fall | `weighted` | rise time × 1.32 (416ms within an 833ms beat) | This doc, §5 |
| Heartbeat startup — recall stagger | `motorized` | `expressive` per strip, 80ms stagger center-outward | This doc, §5 |
| Zoom transition | `snappy` | `standard` | This doc, §6 |
| Zoom reset / return home | `spring` | `return` | This doc, §6 |
| Plugin browser popover open | `snappy` | `base` | [`plugin-browser.md`](plugin-browser.md) |
| FX rack unit lift on hover | `utility` | `base` (translate −1px) | [`plugin-browser.md`](plugin-browser.md) |
| Power LED state change | `utility` | `base` | [`plugin-browser.md`](plugin-browser.md) |
| VU meter attack | physics | rate = 32/sec | [`vu-meter-motion.md`](vu-meter-motion.md) |
| VU meter decay | physics | rate = 4/sec | [`vu-meter-motion.md`](vu-meter-motion.md) |
| VU meter peak hold | physics | hold 700ms, drop 0.5/sec | [`vu-meter-motion.md`](vu-meter-motion.md) |
| Crossfade curve drag | n/a | follows cursor (no easing) | [`crossfade-direct-manipulation.md`](crossfade-direct-manipulation.md) |

---

## 5. Heartbeat startup sequence

The signature choreography that plays on session load. Premium hardware powering up.

### Timing (driven by 72 BPM resting heartbeat)

Each beat = 833ms total, split:
- **Rise** — 316ms (38% of beat) with `motion.easing.expressive`
- **Hold** — 100ms (12% of beat) at peak
- **Fall** — 416ms (50% of beat) with `motion.easing.weighted`

### Stagger across strips

Linear 20ms stagger from left to right: cumulative delays `[0, 20, 40, 60, 80, 100, 120]ms`. Total spread 120ms — tight enough that the wave reads as a single coordinated gesture, just enough offset to give it life.

### Full sequence

1. **Pause** — 500ms after page mount before anything happens.
2. **Beat 1** — full-strength wave (peak fader value 78 on 0–100 scale). 833ms total.
3. **Diastole** — `BEAT_MS × 0.5` = 417ms rest between beats. The heart at rest.
4. **Beat 2** — softer, more intimate (peak fader value 60). Same shape.
5. **Pause** — `BEAT_MS` = 833ms. The board "deciding to wake up."
6. **Motorized recall** — each strip's fader flies to its session position. `motion.easing.motorized`. `expressive` duration per strip. Center-outward stagger at 80ms intervals.

### Visual accompaniments during the sequence

- **Cabinet glow** — purple board-level halo brightens during beat rise, fades during fall. Tracks the wave.
- **VU meters** — meter `signalTarget` is driven by the heartbeat curve itself, so meters bloom upward in sync with the fader spring. After recall, meters resume normal post-fader behavior.
- **Color glow on each fader cap** — during the motorized recall, each fader cap gets a brief owner-color bloom (`Math.sin(t·π) × 0.5` intensity) on its CSS box-shadow as it flies to position. Bloom decays as the spring settles.

### Design intent

This isn't "faders move" — it's **the whole channel waking up**. By driving the meter signal and the cap glow during the heartbeat, the meters become part of the choreography rather than sitting dead until real audio plays. After recall, normal post-fader audio behavior resumes.

---

## 6. Zoom motion + return-home

Two distinct gestures, two distinct motion characters.

### Zoom in/out (any non-reset zoom)

| Property | Value |
|---|---|
| Easing | `motion.easing.snappy` (easeOutBack c1=1.2) |
| Duration | `motion.duration.standard` (340ms) |
| Anchor | Cursor X position — the sample under the mouse stays under the mouse |
| Companion: glow flare | Halo intensity briefly multiplied to `1.35×` for 140ms via sine impulse — the "playful" response |
| Companion: style crossfade | Smooth opacity blend between macro / normal / detail / sample / microscopic styles based on continuous zoom value |

### Return home (zoom reset)

| Property | Value |
|---|---|
| Easing | `motion.easing.spring` (underdamped spring ζ=0.5, ω=10) |
| Duration | `motion.duration.return` (640ms) |
| Companion: glow flare | Sustained over 560ms at `1.55×` peak — halo brightens for the entire journey |
| Companion: shimmer sweep | Owner-color highlight travels left-to-right across the clip over 640ms |
| Companion: canvas scaleX | The spring oscillation drives a scaleX deviation on the canvas. Overshoot → 9% horizontal compression. Undershoot → 3% expansion. The visual signature of the spring "pulling past macro then settling." |

### Design intent

The reset has its own motion character because it's a different kind of gesture — a "return home" carries ceremony that a regular zoom doesn't. The spring with visible secondary oscillation is the only multi-bounce motion in the system, and it's reserved for this one moment.

---

## 7. Reduced motion handling

When `prefers-reduced-motion: reduce` is set:

| Motion category | Action |
|---|---|
| Decorative transient flashes (VU glow kiss, glow flare) | Disable |
| Shimmer sweeps, glow halos on zoom | Disable |
| Hover lifts (translateY, scale) | Disable |
| Popover open/close spring | Replace with fade (240ms opacity only) |
| Functional motion (VU attack/decay, fader value, meter level changes) | **Preserve** — these convey audio state |
| Heartbeat startup sequence | Replace with simple fader recall over 400ms `motion.easing.utility`. Skip the heartbeat altogether — the ceremony is decorative; the recall is functional. |

---

## 8. Implementation tokens (for engineering)

When the codegen pipeline is wired up, the motion tokens should ship as:

```ts
// AUTO-GENERATED from Figma Motion variable collection — DO NOT EDIT
export const motion = {
  duration: {
    instant:    0,
    fast:       140,
    base:       240,
    standard:   340,
    expressive: 520,
    return:     640,
    ceremonial: 833,
  },
  easing: {
    snappy:     'cubic-bezier(0.34, 1.06, 0.4, 1)',    // easeOutBack c1=1.2 approximation
    expressive: 'cubic-bezier(0.22, 1, 0.36, 1)',      // easeOutQuint approximation
    weighted:   'cubic-bezier(0.76, 0, 0.24, 1)',      // easeInOutQuart approximation
    motorized:  'cubic-bezier(0.16, 1, 0.3, 1)',       // easeOutQuart approximation
    utility:    'cubic-bezier(0.33, 1, 0.68, 1)',      // easeOutCubic approximation
    // Spring is implemented in JS, not CSS — its math is in §6
  },
} as const;
```

CSS animations use the cubic-bezier strings. Spring animations are JS-driven because no CSS cubic-bezier can represent damped harmonic motion with visible secondary oscillation.

---

## Implement this first

The principles (§1), easing catalog (§2), and duration scale (§3) are the foundation. Get these into the codebase as token modules first — then per-component motion can reference them by name. Without the token foundation, motion will drift the same way colors drift without `C`.
