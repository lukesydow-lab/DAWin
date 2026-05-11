# Handoff: Mix View

**Spec:** `docs/specs/mix-view.md`
**Date:** 2026-05-10
**Designer:** UX/UI Agent

---

## What this covers

MixerPanel, MixerStrip, StudioFader, VU meters, master strip, PluginChainPanel.

---

## Implementation confirmed

Read `src/App.tsx` lines 1645–2091. The implementation matches the spec with one confirmed bug and several gaps noted below.

---

## Bug: Master fader height (line 1798) — fix required before next review

**File:** `src/App.tsx`
**Line:** 1798
**What:** `<div style={{ height: 14 }} />` is a spacer inside the master strip that substitutes for the FX badge, M/S buttons, and owner avatar present in track strips. At 14px it undercompensates by approximately 34px, causing the master fader to render shorter than track faders in the `items-end` flex row.

**Fix:** Replace the 14px spacer with elements that match the vertical rhythm of track strips:
- A blank FX badge placeholder: `"FX:—"` at the same 8px font + padding = ~16px.
- An M/S button placeholder row: 14px height, no interaction, transparent.
- A label or icon in the owner avatar slot: approximately 16px.
- Total: ~46–48px.

The exact approach (magic number vs. placeholder elements) is an FE call — placeholder elements preferred as they are self-documenting.

---

## Gaps vs. spec (to be implemented)

1. **FX badge click → open plugin chain:** Clicking the FX badge on a mixer strip should select that track and open the PluginChainPanel. Currently clicking a mixer strip does nothing.
2. **Fader ARIA:** `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label` missing from StudioFader.
3. **Fader keyboard control:** ArrowUp/Down should increment/decrement fader value when focused.
4. **Master pan knob state:** The master pan Knob has no `onChange` — it is display with no effect.
5. **Mute/Solo ARIA in mixer strip:** `aria-label` and `aria-pressed` missing from M and S buttons in MixerStrip.

---

## Open questions for PM

1. **FX badge click behavior:** Should clicking the FX badge (a) select the track and open the right-side plugin panel, or (b) open an inline mini-chain popover attached to the strip? Decision affects layout significantly.

2. **Plugin parameter editing:** Plugin params are read-only. Is inline editing in scope for this milestone?

3. **Plugin reordering:** Is drag-to-reorder plugin slots in scope?

4. **Add Plugin flow:** Clicking "Add Plugin +" has no behavior. Is there a plugin browser flow designed?

---

## Open questions for Tech Lead

1. **VU meter data source:** VU levels derived from `track.volume / 100` (static ratio). Real implementation needs post-fader audio analysis (e.g., AnalyserNode). What is the plan?

2. **Master bus plugin chain:** `pluginChains['master']` is seeded but the master strip has no way to open the PluginChainPanel for `'master'`. Define the selection model.

---

## FE implementation priority

Fix the master fader height bug (line 1798). Most visible layout defect in the mix view — observable on first load with no user interaction required.
