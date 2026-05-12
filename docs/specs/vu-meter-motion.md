# Spec: VU Meter Motion + Audio Wiring

**Status:** Designed (prototyped). Awaiting engineering implementation.
**Source prototype:** `public/motion-prototypes/03-vu-meter-animation.html`
**Live URL:** `http://localhost:5173/motion-prototypes/03-vu-meter-animation.html`
**Reference:** [mastering.com — Understanding VU Meters](https://mastering.com/vu-meter/)

---

## Summary

The VU meter has two simultaneous concerns that the engineering team must keep coupled:

1. **Audio-engineering correctness.** The meter must reflect the actual audio signal on its channel, scaled by that channel's fader. This is **post-fader metering** — the convention in every professional DAW.
2. **Motion design.** The meter responds with smooth, perception-aligned physics: fast attack, slow decay, peak-hold dots, transient glow, and integrated startup performance with the fader.

If the two are decoupled (e.g., the meter reads pre-fader, or animates independently of the actual signal), the meter becomes decorative rather than functional. That is unacceptable for a pro audio tool.

---

## Audio wiring (engineering requirement)

### Signal flow

```
  Track audio source
        │
        ▼
   ┌─────────┐
   │ Plugin  │   (FX chain — series of inserts)
   │  Chain  │
   └─────────┘
        │
        ▼
   ┌─────────┐
   │ Fader   │   (channel volume — `track.volume` in current state)
   └─────────┘
        │
        ▼
   ┌─────────┐
   │ VU Meter│   ← reads this point (POST-FADER)
   └─────────┘
        │
        ▼
   Bus / Master mix
```

**The meter must read the signal AFTER the fader applies its gain**, not before. This is the IEC 60268-17 convention and the behavior of Pro Tools, Logic, Ableton, and every other professional DAW.

### Implementation notes

- **Audio source:** the per-track `AudioBuffer` (or live mic input when armed for recording). Already exists in the prototype state model.
- **Fader gain:** `track.volume / 100` mapped to linear gain. Apply via a `GainNode` in the audio graph.
- **Metering tap:** install an `AnalyserNode` immediately after the `GainNode` so the meter sees post-fader audio.
- **Sampling:** read `analyser.getFloatTimeDomainData()` per animation frame, compute the RMS of the buffer, convert to the 0..1 normalized scale the renderer expects.

### Reference levels

Per mastering.com and the IEC standard:

- **0 VU ≈ −18 dBFS** in digital systems. This is the industry calibration point — not "loudest", just the nominal operating level.
- **VU meters show average moment-to-moment volume**, not instantaneous peaks. RMS over a short window approximates this well.
- A peak meter is a different instrument — captures instantaneous max. The peak-hold dot in this spec serves that role; the main lit segments serve the VU role.

We're building a **hybrid**: an RMS-driven body (the "VU" character) with a peak-hold indicator (the "peak meter" character). This gives the user both pieces of information in one display, which is the modern DAW convention.

---

## Motion design

### Color band layout

For a 20-segment meter (matches the current in-app implementation):

| Segments | Range          | Color             | Token       |
|----------|---------------|-------------------|-------------|
| 0–12     | 0–65%         | Green             | `#1EC94A`   |
| 13–16    | 65–85%        | Amber             | `C.warn`    |
| 17–19    | 85–100%       | Red               | `C.danger`  |

The prototype demonstrates this with 26 segments for clarity; production should keep 20 to match the current in-app design.

### Attack / decay physics

The meter's displayed level is a low-pass-filtered version of the source RMS. Asymmetric rates produce the "feels right" character:

| Phase  | Rate           | Result                                                              |
|--------|----------------|---------------------------------------------------------------------|
| Attack | **32 / sec**   | Meter rises ~53% per frame at 60 fps. Transients are visible the moment they hit. |
| Decay  | **4 / sec**    | Meter falls 4× slower than it rises. Glides down over ~250ms after a peak.        |

**Update math (per frame):**

```js
if (target > current) {
  current += (target - current) * Math.min(1, ATTACK_RATE * dt);
} else {
  current += (target - current) * Math.min(1, DECAY_RATE * dt); // delta is negative
}
```

Where `dt` is the frame delta in seconds (clamp to 50ms max as a safety).

This is faster than a strict IEC 60268-17 VU meter (300ms to 99%) — closer to a modern DAW LED meter. The result is more responsive for production work where transient visibility matters, while still feeling "VU-like" because of the slow decay.

### Peak-hold dot

A thin 2px white bar floats at the highest recent level. Behavior:

- **Refresh:** any time the live level meets or exceeds the held peak, the dot snaps up to match and the hold timer resets.
- **Hold time:** **700ms** at the peak before drop begins.
- **Drop rate:** **0.5 / sec** after the hold expires (so a peak in red can take ~2 seconds to fade fully off-screen). Decay is linear for predictability.
- **Color:** white for green/amber zones, amber when peak is in amber zone, red when peak is in red zone. A red peak-hold dot is a clear "you clipped" indicator.
- **Glow:** `0 0 4px` matching color at 60% alpha.

### Per-segment glow

Lit segments have a tinted glow at `0 0 4px [color]99` (60% alpha). The **topmost lit segment** gets extra treatment:

- **Transient kiss:** when the meter advances to a new top segment (delta > 0.05 of full scale in one frame), the topmost segment briefly expands its glow to `0 0 8px [color]ff` for **120ms** then fades back.
- **Effect:** every transient that pushes the meter higher gets a tiny visual emphasis. You can see "kick hit, snare hit, kick hit" as distinct moments even when the surrounding meter activity is busy.

### Partial segment shading (anti-aliased look)

The leading-edge segment (the one above the fully-lit segments) is shaded between off and full-color proportional to the fractional level. Example: if the meter is at 6.7 segments worth of level, segments 0–5 are full color, segment 6 is shaded at 70% intensity, segments 7+ are off. This makes the meter feel smooth rather than steppy.

### Stereo asymmetry

The right channel renders at **0.91×** the left in the prototype — a placeholder for the natural asymmetry in real audio. When wired to real audio, both channels should come from their respective channel data and not be artificially scaled.

---

## Integration with startup heartbeat performance

The VU meters perform alongside the faders during the startup sequence. The "signal" driving the meter during the performance is *the heartbeat itself*, not real audio.

### Sequence phases

1. **Heartbeat rise (316ms, easeOutQuint)** — faders bloom upward to peak volume. Meters follow with `signalTarget = t * 0.95`, so the lit segments climb in sync with the fader cap. The transient flash fires at the top of the rise.
2. **Hold (100ms)** — faders sit at peak. Meters do a gentle breathing pulse: `signalTarget = 0.95 + sin(t*π) * 0.04`. The peak-hold dots are now sitting at their highest point of the journey.
3. **Heartbeat fall (416ms, easeInOutQuart)** — faders exhale down to zero. Meters follow with `signalTarget = (1 - t) * 0.95`. The peak-hold dots remain at the top, slowly dropping at 0.5/sec — leaving a visible "memory" of the heartbeat shape that's still visible during the second beat.
4. **Second beat** — same shape, softer (peak 60 instead of 78).
5. **Motorized recall (520ms per strip, staggered 80ms center-outward)** — each strip's fader flies to its session volume. The meter rides up with the fader to a temporary `signalTarget = 0.5`, then settles to the strip's slider value over 300ms.

### Design intent

The startup performance isn't just "faders move" — it's the whole channel waking up. By driving the meter signal during the heartbeat, the meter becomes part of the choreography rather than sitting dead until real audio plays. After the recall, the meters resume normal post-fader behavior with whatever real audio is playing.

---

## States

| State                            | Meter behavior                                                                                  |
|----------------------------------|-------------------------------------------------------------------------------------------------|
| Track silent, fader up           | Bottom 2–3 segments lit faintly from idle noise (or fully dark — choose based on noise floor).  |
| Track playing, fader down (−∞)   | Meter fully dark. Peak-hold dot fades.                                                          |
| Track playing, fader up          | Meter responds with physics as specified. Peak dot active.                                      |
| Track muted                      | Meter goes dark over its decay timing. **Do not snap to zero** — the decay makes mute feel smooth. |
| Track soloed (when another is)   | Same as muted from this track's perspective.                                                    |
| Track armed (recording)          | Meter reads the input signal, not the playback. Otherwise identical behavior.                   |
| During heartbeat startup         | Driven by `signalTarget` from the heartbeat sequence, not real audio.                           |

---

## Performance budget

- The renderer needs to update 6+ strips × 2 channels × 20 segments = 240 DOM elements per frame at 60 fps. The prototype shows this is fine with `requestAnimationFrame` and direct style writes.
- For larger sessions (20+ tracks), consider:
  - Batching style writes via a single re-style pass per frame.
  - Using `transform` and `opacity` only (already do) — these are GPU-accelerated.
  - For peak-hold dots, prefer `bottom: Xpx` (computed each frame) over a separate state pass.

---

## Accessibility

- **ARIA:** the meter is a presentation element — does not need to be focusable. Add `role="presentation"` and `aria-hidden="true"` to the segment containers.
- **Screen readers:** the `dB` readout label next to the fader IS the accessible representation of the channel level. Make sure that label has `aria-live="polite"` and `aria-label="{track.name} output level"` so screen readers can announce level changes when the user opens an inspector.
- **Reduced motion:** if `prefers-reduced-motion` is set, disable the transient glow flash and the peak-hold drop animation (snap peak directly to current level). Keep the attack/decay physics — they convey functional information.

---

## Implement this first

Wire the meter to **post-fader audio** before tuning any motion characteristics. The motion design is meaningless if the meter doesn't reflect the channel's actual sound. Once that's working with a simple "lit = audio level" mapping, layer in the attack/decay physics, then the peak-hold dot, then the transient glow, then the heartbeat integration.
