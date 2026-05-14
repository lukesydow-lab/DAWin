# Sprint 1 — Visual Reference
**Date:** 2026-05-14  
**Commit:** 5cb28dd (feat: crossfade bezier curves, plugin rack browser, VU heartbeat startup)

## What shipped this sprint
- **Session room shell** — transport bar, 7-track arranger, mixer panel, status bar, invite modal
- **Collaborator color model** — owner color tints track headers, clip waveforms, mixer strip caps, avatars
- **Bezier fade curves** — draggable midpoint handle on every clip fade; crossfade symmetry lock (padlock in overlap zone mirrors handles by default)
- **Plugin rack browser** — wood cabinet rails, brushed-metal faceplates, power LED in owner color, amber LCD param readout, drag-to-reorder
- **VU meters** — live post-fader RMS, 60fps rAF loop, peak-hold dot, transient glow, heartbeat startup bloom
- **Neve mixer theme** — logarithmic faders, pan knobs, mute/solo wired to shared state

## Known defects at sprint close
- **P1 — FX chain panel off-screen at 1920px** — panel positioned at `left: 1921px` (1px beyond viewport right edge). Visible only at viewports wider than the panel's anchor point. Fix: ensure panel is positioned relative to viewport, not document. Filed as GitHub defect.

## Screenshots in this folder
- `01-session-room-1440.jpg` — full session room, 1440×900
- `02-session-room-1920.jpg` — full session room, 1920×1080 (FX panel off-screen — see defect above)
