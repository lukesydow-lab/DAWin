# Design Handoff: FX Chain View, Interactive PanKnob, Always-Visible R/M/S

**Date:** 2026-05-10
**Designer:** Designer (DAWin project)
**Status:** Ready for engineering

---

## Screens covered

- Session room — Arranger view (TrackHeader column)
- Session room — Mixer view (MixerStrip, Master strip, MixerPanel)
- FX Chain side panel (PluginChainPanel)

All changes confined to `src/App.tsx`.

---

## Spec

`/Users/lukesydow/daw-design/docs/specs/fx-chain-pan-rms-redesign.md`

---

## Implementation confirmed against existing code

- MiniBtn `w-5 h-5` (20×20px, line 518) — fits 64px track height without change
- R/M/S visibility guard is `opacity-0 group-hover:opacity-100` on one container (line 830) — single removal unblocks Decision 3
- PanKnob (lines 731–764) — zero drag logic today; direct port of Knob drag pattern (lines 566–581), axis switched to horizontal
- `selectedTrackId` state exists (line 2124); `PluginChainPanel` already conditionally rendered (line 2261) — Decision 1 requires only prop threading to MixerStrip, no new state
- `record-pulse` CSS class in use at lines 820 and 1888 — safe to reuse on R button
- `C.control` (`#2A2A38`) at line 14 — used throughout, referenced correctly in spec

---

## Open questions for PM / Tech Lead

1. **M button active color:** Confirmed amber (`C.warn` `#F5A623`) — PM decision 2026-05-10. Red reserved for Record arm only.

2. **S button active color:** Confirmed green (`C.success` `#1D9E75`) — PM decision 2026-05-10. Green = live/active, correct for solo.

3. **PanKnob drag sensitivity:** Spec uses `delta * 0.8`. FE should tune during implementation.

4. **PluginChainPanel width:** Currently 280px. Worth considering 320px now that the panel is actively triggered. No change specified — flagging for PM visibility.

5. **FX badge at 0 plugins:** Confirmed clickable at 0 plugins — PM decision 2026-05-10. Opens the designed empty state: "Clean signal" headline + signal-flow SVG + "Add Plugin +" CTA. Full empty state spec in "Empty Plugin Chain Panel — No Plugins State" section of the spec file.

6. **Viewer role + FX panel:** Spec allows Viewers to click FX badge (panel is read-only). Tech Lead should confirm this is the correct access model.

7. **Plugin browser spec:** "Add Plugin +" CTA in the empty state is a stub (`onClick` logs to console). PM spec pending. Do not block empty state implementation on this — button is fully styled and keyboard-accessible.
