# Sprint 1 Post-Mortem — Core Session Room

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 1
**Dates:** 2026-05-10 – 2026-05-14
**Status:** Closed
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

- Ship a fully interactive 7-track arranger with clip editing (drag, resize, cut, bezier fades)
- Implement Neve studio visual theme with collaborator color tinting on all surfaces
- Build a live mixer with logarithmic fader, pan knob, mute/solo, VU meters driven by Web Audio API
- Ship a plugin rack browser with drag-to-reorder
- Establish the Figma Design System (DSM), GitHub sprint infrastructure, and PRD v1.0
- Define the backend shared types and API spec (ADR-001)

---

## What shipped

- Session room UI: transport bar, arranger, mixer, FX chain panel, status bar, invite modal — all surfaces present and interactive
- 7-track arranger: clip drag (bar-snapped with grab offset), resize (left/right handles), cut tool, playhead seek via ruler click, spacebar play/pause, return-to-zero
- Bezier fade curves with draggable midpoint handles; `crossfadeLocked` crossfade symmetry toggle on `ClipData`
- Neve studio visual theme: wood rails, metal faders, collaborator color tinting on all surfaces
- Mixer: logarithmic fader (unity at ~75% travel), pan knob with center detent, mute/solo wired to shared state, VU meters live from Web Audio API (post-fader RMS, 60fps rAF, peak-hold, transient glow)
- VU meter heartbeat startup animation: bloom + staggered motorized recall on mount
- Plugin rack browser: wood cabinet rails, brushed-metal faceplates, power LED in owner color, amber LCD, drag-to-reorder, `PluginBrowser` popover
- FX chain panel viewport positioning bug fixed (overflow:clip BFC on `#root`)
- Invite modal: role picker, email input, send CTA (UI only — no backend)
- ARIA pass: icon-only controls labeled, keyboard navigation on fader/pan/MiniBtn
- PRD v1.0 + Roadmap v1.0 (`docs/specs/PRD.md`, `docs/specs/ROADMAP.md`)
- Figma DSM completeness pass (Clip, Toolbar, StatusBar, MixerPanel, FXChainPanel, atoms)
- GitHub sprint infrastructure: milestones, labels, issue templates, Projects board
- Screenshot archive: `screenshots/sprint-1-2026-05-14/`
- Backend shared types + API spec + ADR-001

---

## What had issues

**UAT found 19 defects during the sprint — 3 P0 blockers, 4 P1s, 7 P2s, 5 P3s.**

The most significant problems were in functional wiring: UI controls existed visually but were not connected to any logic. This included:

- M/S/R buttons in track headers had no `onClick` handlers — mute, solo, arm did nothing
- M/S buttons in mixer strips were disconnected — mixer fader/pan state was isolated local state not shared with the rest of the app
- Spacebar produced no play/pause — no `keydown` listener existed anywhere in the codebase
- Tool keyboard shortcuts (V/C/X) labeled in toolbar tooltips but not wired to any handler
- Escape did not close modals
- "Send invite" primary CTA had no `onClick`

The root cause across all of these was the same: the first build pass prioritized visual completeness over wiring. Components were rendered correctly but event handlers were stubs or absent.

Additional issues:
- Clip drag ignored grab offset — clips snapped to their leading edge rather than the grab point
- Stop and Return to Zero both reset the playhead; the DAW convention is that Stop should hold position
- Fader dB curve was linear; logarithmic is the DAW standard (and was in the spec)
- A hardcoded hex color violated the `C.*` token system
- BPM input accepted out-of-range values silently despite having `min/max` attributes

---

## How issues were addressed

All 3 P0 and 4 P1 defects were fixed before sprint close. The fix pass wired `onClick` handlers to the correct state setters for all control buttons, connected `MixerPanel` to shared `setTracks` state, implemented global `keydown` listeners, and wired modal close and invite send actions.

The P2 fixes corrected clip drag offset math, separated Stop and Return-to-Zero behavior, corrected the fader dB curve to logarithmic, replaced the hardcoded hex value with a `C.*` token, and added BPM input validation clamping.

Two P2 items were correctly deferred: the crossfade tool (no spec at the time) and the "Add Plugin +" button (awaiting PM interaction spec). One P3 (VU meter animation) was deferred to a future sprint.

---

## Decisions made

**Collaborator color model (2026-05-10):** Each collaborator's unique hex color appears on track header accent bar and background tint, clip waveform fill and border, mixer strip wood cap border, avatar ring, FX badge when their track is selected, and power LED in the plugin rack. This became the most load-bearing visual system in the entire product — every subsequent sprint had to honor it on every new surface.

**VU meters post-fader (2026-05-12):** Meter tap placed after the GainNode, matching IEC 60268-17 and the practice in Pro Tools, Logic, and Ableton. This was the correct call and has not been revisited.

**Single rAF loop for VU (2026-05-12):** One shared `requestAnimationFrame` loop in MixerPanel writes to DOM refs directly — no React state updates. This prevents 240+ re-renders per second at 60fps. The pattern holds through Sprint 9 with no issues.

**ADR-001 — DSP locality (2026-05-10):** All DSP runs in the browser via the Web Audio API. Server-side DSP would require approximately 32 Mbps sustained for a 7-track session. Web Audio API nodes cover all required plugin types natively. The future path to CLAP/VST3 support is noted: Electron/Tauri sidecar with shared memory and local loopback WebSocket.

**Logarithmic fader curve:** `faderToDb()` mapping with unity gain at ~75% travel. Standard DAW convention. Not negotiable.

**masterPan default:** Initialized at 50 (center). Mapping `(masterPan-50)/50`. The earlier `masterPan/100` mapping was producing hard-left output and was caught before close.

---

## What was deferred

- Crossfade tool: toolbar UI and `ClipData.crossfadeLocked` type were shipped; implementation was not. Deferred pending PM scope decision.
- "Add Plugin +" button: wired to a no-op handler, awaiting PM interaction spec.
- VU meter animation (real-time RMS response during playback): P3, not addressed in this sprint.
- Context menu Loop region and Rename stubs: intentionally deferred to a later sprint.

---

## What was learned

**Wiring before polish:** The sprint shipped visually complete UI with disconnected controls. UAT found it quickly and the fix pass was effective, but it meant Sprint 1 had more defect-chasing than it needed to. Future sprints benefited from this lesson: wiring is part of implementation, not a polish step.

**Collaborator color model must be established early and held firmly:** By anchoring the color model in Sprint 1 before any backend existed, the team gave itself a clear constraint that every agent could follow. The decision to store collaborator color on the user/track object and apply it via inline `style` props (never Tailwind classes) was made here and never revisited.

**The single-file constraint (`src/App.tsx`) was not anticipated as a permanent fixture.** It was a pragmatic choice for speed in Sprint 1. It has continued through Sprint 9. Every subsequent sprint needs to account for the file growing substantially.

---

## Metrics

- Defects found: 19 (3 P0, 4 P1, 7 P2, 5 P3)
- Defects fixed before sprint close: 16
- Correctly deferred: 2 (crossfade, Add Plugin)
- Remaining for future sprint: 1 (VU animation, P3)
- All exit criteria met: yes
- `tsc --noEmit` status: clean at close

---

## Open questions going into the next sprint

- Crossfade tool interaction model: what should dragging overlapping clips actually do?
- "Add Plugin +" interaction spec: does adding a plugin require a modal, inline search, or something else?
- VU meter animation: when does this become high enough priority to schedule?
