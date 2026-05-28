# Handoff: VU Meter Motion + Audio Wiring

**Spec:** [`docs/specs/vu-meter-motion.md`](../specs/vu-meter-motion.md)
**Prototype:** [`public/motion-prototypes/03-vu-meter-animation.html`](../../public/motion-prototypes/03-vu-meter-animation.html)
**Live URL:** `http://localhost:5173/motion-prototypes/03-vu-meter-animation.html`
**Reference reading:** [mastering.com — Understanding VU Meters](https://mastering.com/vu-meter/)
**Date:** 2026-05-12
**Approved:** 2026-05-13
**Designer:** UX/UI Agent
**Routed to:** Tech Lead
**Status:** ✅ APPROVED — ready for engineering assignment

---

## Approval

Design is approved and locked. The Tech Lead can now break this work down for the engineering team. Open questions below are **engineering decisions to resolve during planning**, not blockers on the design.

---

## What's verified working in the prototype

Engineering can reference the prototype at `/motion-prototypes/03-vu-meter-animation.html` as the source of truth for the meter's motion behavior. Each of the following is functional and inspectable:

- ✅ **Attack/decay physics** — drag any signal slider; meter rises fast (32/sec), decays slow (4/sec)
- ✅ **Peak-hold dots** — white bars hover at the highest recent level for 700ms, then drop at 0.5/sec; color shifts to amber/red in those zones
- ✅ **Transient flash** — topmost lit segment intensifies its glow for 120ms whenever level jumps >5%
- ✅ **Partial-segment shading** — leading edge fades between off and full color based on fractional level (smooth, not steppy)
- ✅ **Audition mode** — toggle the synthetic audio source (120 BPM rhythmic pattern) to see all 6 meters animate together
- ✅ **Heartbeat startup integration** — Launch Sequence button runs the full performance: faders + meters bloom together (easeOutQuint rise → breath at peak → easeInOutQuart fall → staggered motorized recall)
- ✅ **Peak hold toggle** — On/Off control to disable the peak-hold dots entirely

The motion code in the prototype is structured to be portable; the per-strip update loop in particular can lift directly into the React component with minor adaptation.

---

## What this covers

The full design + engineering specification for the per-track VU meter:

1. **Audio wiring** — how the meter gets its signal (post-fader tap from an `AnalyserNode`)
2. **Fader coupling** — channel volume comes from the fader's `track.volume`, applied via a `GainNode` before the meter tap
3. **Motion physics** — fast attack / slow decay, peak-hold dot, transient glow
4. **Startup integration** — the meter performs alongside the fader during the heartbeat sequence
5. **States** — mute, solo, armed, reduced motion

---

## The single most important thing

**The meter must be wired to post-fader audio.** Right now, the VU meter in `src/App.tsx` is driven by `track.volume / 100 * fixed_factor` (lines around 1665 in `MixerStrip`). That's a placeholder — it animates with the fader but is not reading actual audio.

When real audio playback is wired in, the meter must:

```
AudioSource → PluginChain → GainNode(fader) → AnalyserNode → AudioDestination
                                                      │
                                                      └──► RMS read → meter renderer
```

If the meter reads pre-fader, two things break:

1. **Dragging the fader doesn't change the meter** — the user can't see the result of their gain staging. This is the #1 reason VU meters exist in a DAW.
2. **Soloing/muting doesn't change the meter** — mute applies post-meter and the user sees a meter on a muted channel.

The mastering.com article makes this clear: a VU meter shows the energy of the channel *as it's being mixed*, which means post-fader. That's also IEC 60268-17.

---

## Implementation order

1. **Audio graph + post-fader tap.** Build the `GainNode → AnalyserNode` chain per track. Hook `track.volume` to `gainNode.gain.value` with the conversion `volume / 100`. Verify that dragging the fader changes the meter level.
2. **Replace the placeholder `track.volume` mapping** in `MixerStrip` with the live RMS read from the analyser, normalized 0..1.
3. **Apply attack/decay physics** — the asymmetric low-pass filter described in the spec (attack 32/sec, decay 4/sec).
4. **Add peak-hold dot** — 700ms hover, 0.5/sec drop after.
5. **Add transient glow** — topmost segment intensifies its box-shadow for 120ms on each upward jump > 5% of scale.
6. **Wire to heartbeat startup** — during the existing `heartbeatPulse` sequence, drive `signalTarget` per strip from the heartbeat curve so the meter performs alongside the fader.

Each step builds on the previous one. Don't skip the audio wiring to get to the visuals — the visuals are meaningless without it.

---

## Open questions for Tech Lead

1. **AudioContext lifecycle.** The prototype state already initializes an `AudioContext` for clip waveform rendering. Will the same context drive playback, or is there a separate "playback context" planned? The meter tap should live in whichever context owns track playback.

2. **Per-track plugin chain.** Where in the audio graph does the plugin chain sit relative to the fader? Conventionally it's: source → plugins → fader → meter. Confirm before wiring.

3. **Pre-fader meter mode.** Some DAWs offer a toggle between pre-fader and post-fader metering. Out of scope for now? If yes, ignore. If yes-eventually, the design supports it cleanly — just move the analyser tap before the gain node.

4. **VU meter on the master bus.** The master strip's meter is currently hardcoded (`vuHeight = 79px`, levels 0.92 / 0.88). It should follow the same wiring rules — tap the master gain node post-fader. Confirm the master bus has an equivalent gain/analyser pair.

5. **Reduced-motion handling.** The spec recommends disabling transient flash and peak-drop animation when `prefers-reduced-motion` is set. Is that implemented globally elsewhere in the codebase, or does this feature implement it directly?

---

## Open questions for PM

1. **0 dBVU calibration line.** Should there be a visible "0 VU" marker on the meter (e.g., a small tick at the 65% green/amber boundary, matching the −18 dBFS reference)? The mastering.com article emphasizes this calibration point as the primary reason engineers use VU meters. Pro Tools, Logic, and Ableton all show this marker.

2. **Color band assignment.** The current bands are 0-65% green, 65-85% amber, 85-100% red. These are arbitrary; the audio convention is to put the amber/red transition at the calibration point. Should we recalibrate so amber starts at 0 VU (= −18 dBFS)?

3. **Stereo asymmetry policy.** The prototype shows L and R with a 0.91× ratio for visual interest. In production, the meter must read actual L/R channel data from the analyser. Is mono-summed metering acceptable for a v1, or do we need true stereo from the start?

---

## Frontend Engineer priority

After Tech Lead signs off on the audio graph design:

1. **Wire post-fader meter** to verify dragging the fader changes the meter. This is the foundational correctness check.
2. **Drop the placeholder code** at `src/App.tsx` line ~1665 (the `track.volume / 100 * 0.88` VU calc) and replace with live RMS.
3. **Layer in the motion physics** in the order listed above.

The motion prototype is the visual reference — engineering should match it exactly. The renderer code in the prototype is structured to be portable; the per-strip update loop in particular can be lifted directly into the React component with minor adaptation.

---

## Confirmation

- [x] Read existing `MixerStrip` and VU rendering in `src/App.tsx`
- [x] Read the referenced mastering.com article on VU meter principles
- [x] Spec aligns with current implementation's shape (20 segments, color bands at 65%/85%)
- [x] Spec does not conflict with any in-flight handoff (no other meter work in `docs/handoffs/`)
