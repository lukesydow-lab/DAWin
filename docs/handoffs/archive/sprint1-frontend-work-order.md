# Sprint 1 Frontend Work Order

**Issued by:** Tech Lead  
**Date:** 2026-05-14  
**Closes:** VU Meter open questions (issue #1), unblocks Plugin Browser (issue #4) and Crossfade (issue #10)  
**Consumer:** Frontend Engineer — read this, not the full specs

---

## 1. Tech Lead Sign-Off Block

### VU Meter (commit 3507382)

**Q1 — AudioContext singleton.** The existing `_audioCtx` via `getAudioCtx()` is the correct and only context for meter taps. There is no separate playback context and there must never be one. Confirmed.

**Q2 — Per-track signal order.** The implemented order in commit 3507382 is `source → GainNode(fader) → AnalyserNode(VU tap) → StereoPannerNode → _masterGain → _masterAnalyser → destination`. This is correct — post-fader tap is confirmed. Note: the plugin chain is not yet in this graph (plugins are UI-only); when real audio plugins land in Sprint 2, they insert between the source and the fader GainNode: `source → plugins → GainNode(fader) → AnalyserNode → panner → master`.

**Q3 — Pre-fader meter mode.** Out of scope for v1. No flag needed.

**Q4 — VU meter on master bus.** Commit 3507382 includes the master strip. The master bus wiring is: `_masterGain → _masterAnalyser → destination` (lines 186–187 of `src/App.tsx`). The rAF loop reads `_masterAnalyser` directly at line 2099 and drives `masterSegRefsL/R` DOM nodes. Master strip is wired and complete. No gap.

**Q5 — Reduced-motion.** Handled. `const prefersReducedMotion` (line 1773) is evaluated once at module load time and gates both the transient flash intensity in `renderVUChannel` (line 1834) and the peak drop animation in `stepPeak` (line 1815). Confirmed correct.

**VU Meter verdict: commit 3507382 is signed off. No defects. Implementation matches spec.**

---

### Plugin Browser

**Q1 — Plugin data model.** The existing `PluginSlot` shape `{ id, type, enabled, params }` is sufficient for v1 lo-fi behavior. Do not add `subtitle` or `positionIndex` fields now — `subtitle` is pending PM confirmation on manufacturer metadata scope, and `positionIndex` is implicit from array order in `pluginChains[trackId]`. If drag-to-reorder is implemented by reordering the array, no index field is needed.

**Q2 — Drag-to-reorder implementation.** No new dependencies. Use native HTML5 drag-and-drop (`draggable`, `onDragStart`, `onDragOver`, `onDrop`). The mockup already uses native HTML5 drag-drop; the React port is a clean lift. `react-dnd` and `dnd-kit` are not in the project and must not be added without PM approval.

**Q3 — Plugin enable/disable audio bypass.** For v1, toggling `enabled` on a plugin slot is UI-only — the audio graph does not yet include real plugin nodes, so there is nothing to disconnect. The `togglePlugin` handler at line 2678 of `src/App.tsx` already flips `slot.enabled` in state. When Sprint 2 wires real audio nodes into the chain, the correct bypass approach is: leave the node connected but set its wet/dry to bypass (unity passthrough), not disconnect and reconnect. Dynamic disconnection/reconnection causes audio glitches. Do not implement disconnect-on-bypass.

**Q4 — Token reconciliation for wood/metal.** The `C` object already has `C.wood`, `C.woodLight`, `C.metalDark`, `C.metalMid`, `C.metalLight` (lines 20–27 of `src/App.tsx`). Use these tokens for all rack cabinet and faceplate styling — do not inline new hex values. Extraction of `C.wood*` and `C.metal*` into named sub-groups is deferred to Sprint 2. For v1: use the existing flat `C.*` tokens.

**Q5 — Performance budget for brushed-metal gradients.** 8 plugin slots with CSS gradients and box-shadows is acceptable for v1. The PluginChainPanel is not in the hot render path (it only renders when a track is selected). Confirmed.

**Q6 — Keyboard reorder collision check.** The global keydown handler (lines 2648–2669 of `src/App.tsx`) maps: Space (play/pause), Escape, V (select tool), C (cut tool), X (crossfade tool — being removed). ArrowUp and ArrowDown are only mapped locally inside `StudioFader`'s `onKeyDown` on the fader cap element, not globally. `Cmd/Ctrl + ArrowUp/Down` for plugin reorder is clean — no collision. Confirmed safe to implement.

**Q7 — v1 plugin browser empty state.** Option (a) is confirmed: selecting from the placeholder list creates a UI-only rack unit with no audio effect. This matches the existing mock state approach in `pluginChains`. Switch to a real empty state when the plugin registry is wired.

---

### Crossfade Direct Manipulation

**Q1 — Audio path for fade gain.** Fade gain is visual-only for v1. The `fadePath` function (line 495 of `src/App.tsx`) drives the SVG/canvas overlay only — there is no audio gain ramp wired to it, and that is correct for now. When real per-clip playback lands in Sprint 2+, the bezier formula in the spec drives `GainNode.gain.setValueCurveAtTime`. Single source of truth between render and audio is the goal — same formula, same parameters. Confirmed: visual-only for v1.

**Q2 — Handle drag implementation.** Native React state only. `useState` for the dragged curve value, `onMouseMove` on the SVG (or on `window` during a drag, cleaned up on `mouseup`). No `react-spring`, no GSAP. This is a single float slider — native mouse events are the correct tool.

**Q3 — Performance.** 30 clips × SVG fade lines is acceptable at v1. Each clip already renders an SVG overlay (the existing `fadePath` SVG). Adding a midpoint handle circle per fade region is negligible DOM overhead. If perf degrades in practice, replace SVG fade lines with canvas `quadraticCurveTo` — same bezier, same parameters. Canvas is the confirmed escape hatch.

**Q4 — Keyboard binding collision check.** `Shift + ,` and `Shift + .` are not mapped anywhere in either the global keydown handler (lines 2648–2669) or the `BounceModal` local handler (line 1249). No collision. Confirmed safe to implement.

**Q5 — Overlap-fade-length preservation.** When clips are dragged apart after overlapping, restore the original pre-overlap fade lengths. Do not zero them. This is the correct UX — it matches user expectation that separating clips un-crossfades them rather than destroying the fade shape. Store `_preFadeIn` and `_preFadeOut` on the drag state when an overlap is first detected; restore on separation.

**Q6 — Equal-power toggle.** Out of scope for v1. No flag needed.

**Cleanup checklist verification:** The handoff cleanup list is complete and correct. All items (`FadeCurve` type, `clip.fadeInCurve/fadeOutCurve` types, Toolbar crossfade button, `'crossfade'` tool state value, X keyboard shortcut at line 2665, fade-curve preset picker, `fadePath` switch/case logic) are present in the codebase and must all be removed. Verify `tsc --noEmit` passes after each deletion step — the `Tool` type union and the `DragState.mode` union both include `'crossfade'`; delete the union member before removing references or TypeScript will catch them for you.

---

## 2. Implementation Sequence

**Order: Crossfade → VU Meter (motion polish only) → Plugin Browser**

Rationale:

1. **Crossfade first** because it is a breaking data migration. Changing `FadeCurve` from a string enum to `number` touches `ClipData`, `mkClip`, all existing clip initializations, the `fadePath` function, and the canvas overlay — this is the highest blast radius change of the three. Getting it done first means VU meter and plugin browser work on a stable data model. Crossfade also removes the `'crossfade'` tool from the `Tool` type, which the FE must do before the tool state type can be finalized.

2. **VU Meter motion polish second** because commit 3507382 already landed the foundations. The remaining work is layering physics on top of working audio wiring — no data model changes, no breaking changes. This is the safest second step.

3. **Plugin Browser third** because it is self-contained. It touches only `PluginChainPanel` (lines 2392–2557 of `src/App.tsx`) and the `pluginChains` state, neither of which is touched by crossfade or VU meter work. It can also be started in parallel with VU meter polish if capacity allows, but sequence it last to avoid merge conflicts on the `PluginChainPanel` block.

---

## 3. Per-Feature Task Lists

### Feature A — Crossfade Direct Manipulation

Reference: `docs/handoffs/crossfade-direct-manipulation-design.md`, `docs/specs/crossfade-direct-manipulation.md`

**Step 1 — Data migration (do this first, commit separately)**
- Change `type FadeCurve = 'linear' | 'ease' | 'sharp'` (line 44) to `type FadeCurve = number` — or delete the type alias entirely and inline `number` on the interface fields.
- Update `ClipData.fadeInCurve` and `ClipData.fadeOutCurve` from `FadeCurve` to `number`.
- Update `mkClip` (line 156): change `fadeInCurve: 'ease', fadeOutCurve: 'ease'` to `fadeInCurve: 0.7, fadeOutCurve: 0.7` (the migration map: linear→0.5, ease→0.7, sharp→0.3).
- Run `tsc --noEmit` — TypeScript will surface every remaining reference to the old string values. Fix them all before continuing.

**Step 2 — Replace the canvas fade renderer**
- Delete `fadePath` (lines 495–506). Replace every call site with the bezier formula from the spec: `gain(t) = 2·curve·t·(1−t) + t²`. For fade-in, this gives the SVG quadratic bezier control point; for fade-out, invert. The spec's math section has the exact curve.
- The SVG path shape: for a fade-in region of width `w` and height `h`, the bezier draws from `(0, h)` to `(w, 0)` with control point at `(w * 0.5, h * (1 - 2 * curve * 0.5 * 0.5 - 0.5 * 0.5))` — derive from the spec formula directly.

**Step 3 — Draw fade line in SVG over each clip**
- Render a `<path>` element (1.5px stroke, clip owner color, 4px glow via `filter: drop-shadow`) over each clip's fade-in and fade-out region. The path traces the gain curve from top to bottom of the clip.
- Add the midpoint handle: `<circle>` at `(w * 0.5, h * (1 - gain(0.5)))`, radius 5px, fill white, cursor `ns-resize`. Visible only when the pointer is over the clip or the handle is being dragged.

**Step 4 — Wire handle drag**
- On `mousedown` on the handle circle, capture the drag. On `mousemove` (attached to `window`), compute new curve value from mouse Y position relative to the clip height: `newCurve = clamp(1 - mouseY / clipHeight, 0.05, 0.95)`. Update `clip.fadeInCurve` or `clip.fadeOutCurve` via `setTracks`. On `mouseup`, release.
- Snap to 0.5 (linear) within 4px of the midpoint — add a snap threshold check.
- `Shift + ,` / `Shift + .`: in the global keydown handler, when a clip is selected, adjust its active fade curve ±0.05. Add `selectedClipId` state if one does not already exist, or use the existing selection model.

**Step 5 — Cleanup (all must be done, all must compile)**
- Remove the `'crossfade'` value from the `Tool` type (line 45).
- Remove the crossfade entry from the `tools` array in `Toolbar` (line 856).
- Remove the `x/X` keydown handler (line 2665).
- Remove the crossfade hint text from `Toolbar` (line 872).
- Remove the fade-curve preset picker buttons from the clip hover UI (search for the three small curve buttons, currently rendered at clip bottom-right on hover — locate by searching for `'linear'` or `'ease'` string references in JSX).
- Run `tsc --noEmit`. Zero errors required.

**Step 6 — Implicit overlap crossfade**
- When two clips on the same track overlap (detect in `setTracks` or on drag end), auto-extend `fadeOut` of the earlier clip and `fadeIn` of the later clip to match the overlap length in bars.
- Store `_preFadeIn` and `_preFadeOut` in the drag state (`DragState` interface, line 82) when overlap is first detected. On drag end, if clips no longer overlap, restore those values.

---

### Feature B — VU Meter Motion Polish

Reference: `docs/handoffs/vu-meter-motion-design.md`, `docs/specs/vu-meter-motion.md`  
Prototype reference: `public/motion-prototypes/03-vu-meter-animation.html`

Commit 3507382 is signed off. The remaining work is motion polish only — audio wiring is already correct.

**Task 1 — Verify fader drag changes meter level**
- Play a clip. Drag a fader. Confirm the meter responds. If it does not, check that Effect B (lines 2632–2645) is updating `active.gain.gain` correctly and that `readRMS` (line 463) is returning non-zero values from the analyser.
- This is a correctness gate, not new work. Do it before any polish.

**Task 2 — Mute/solo correctness**
- When a track is muted or effectively muted by a solo, `targetL` and `targetR` are forced to 0 (line 2077). Confirm the meter decays to zero on mute rather than snapping instantly. The existing `stepMeter` decay rate handles this — verify in the browser.

**Task 3 — Heartbeat sequence integration**
- During the existing `heartbeatPulse` sequence, drive `signalTarget` per strip so the meter performs alongside the fader bloom. Read the prototype's `Heartbeat launch sequence` button implementation for the signal curve shape. Wire the heartbeat curve to the VU physics `levelL`/`levelR` targets during the sequence, bypassing the live RMS read while the animation runs.
- This requires access to the heartbeat animation state. If `heartbeatPulse` is not yet in `src/App.tsx`, escalate to Tech Lead before implementing.

**Task 4 — Match prototype motion exactly**
- Load `public/motion-prototypes/03-vu-meter-animation.html` in a browser tab side-by-side with the dev server. Compare attack/decay speed, peak hold timing, peak drop speed, and transient glow duration against the constants already in code (`ATTACK_RATE=32`, `DECAY_RATE=4`, `PEAK_HOLD_MS=700`, `PEAK_DROP_RATE=0.5`, `TRANSIENT_DUR_MS=120`). If any constant differs from the prototype's behavior, adjust to match.

---

### Feature C — Plugin Browser (lo-fi first)

Reference: `docs/handoffs/plugin-browser-design.md`, `docs/specs/plugin-browser.md`  
Mockup: `public/comps/plugin-browser-inline.html` (lo-fi), `public/comps/plugin-browser-hifi.html` (hi-fi)

Ship lo-fi structure first. Hi-fi visual pass is a separate commit.

**Task 1 — Replace PluginChainPanel content (lines 2392–2557 of `src/App.tsx`)**
- Keep the component signature and the `onTogglePlugin` handler — they are already wired correctly.
- Replace the plugin card markup with the new structure: drag grip on left edge, plugin name, plugin type badge, power LED button (round, glows in `ownerColor`), key param display, drag handle.
- The empty state SVG (lines 2448–2501) can stay as-is or be replaced with the lo-fi "+ Add Unit" affordance from the mockup. Do not delete the empty state — the "no plugins loaded" path must still render something.
- Use `C.wood`, `C.woodLight`, `C.metalDark`, `C.metalMid`, `C.metalLight` for any cabinet/rack styling. No new hex values.

**Task 2 — Power button toggle**
- The existing `onTogglePlugin` call at line 2516 is already wired to `togglePlugin` in the parent. Replace the existing circular toggle button with the new round LED button styled per the mockup. The LED glows in `ownerColor` when enabled, unlit when bypassed. The LCD / faceplate desaturates at `opacity: 0.55` (already in the existing card at line 2507).

**Task 3 — Popover open/close**
- Add a `showBrowser: boolean` state to `PluginChainPanel` (or hoist to the panel's parent if the popover needs to know about other panels).
- The popover opens when the "+ ADD UNIT" empty slot (or the existing "Add Plugin" button, line 2481) is clicked.
- Popover dismisses on: Esc (local keydown handler inside the popover component), click outside (attach `mousedown` listener to `document`, check if event target is outside the popover ref).
- Search input autofocuses on open (`useEffect` with a `ref.current.focus()` call after mount).
- Popover content for v1: hardcoded list of plugin types (`compressor`, `reverb`, `delay`, `maximizer`, `eq`). Selecting one adds a new `PluginSlot` to `pluginChains[selectedTrackId]` with `enabled: true` and default params.

**Task 4 — Drag-to-reorder**
- Add `draggable={true}` to each plugin card div.
- `onDragStart`: store the slot's index in a local ref.
- `onDragOver`: `e.preventDefault()` to allow drop; show the purple insertion line (absolutely positioned 1px div) above the hovered card.
- `onDrop`: reorder `pluginChains[trackId]` array by moving the dragged index to the drop index. Call `setPluginChains` with the reordered array.
- Clean up insertion line on `onDragLeave` and `onDrop`.
- `Cmd/Ctrl + ArrowUp/Down` on a focused card: move the card one position up or down in the array. Handle in a local `onKeyDown` on the card element (not the global handler).

**Task 5 — Hi-fi visual pass (separate commit)**
- Wooden cabinet top and bottom rails using `C.wood` and `C.woodLight` with the existing `wood-panel` CSS class.
- Owner-color trim stripes inside the rails: a 2px border or inset glow using `ownerColor`.
- Brushed-metal faceplate: CSS `linear-gradient` using `C.metalDark`, `C.metalMid`, `C.metalLight` — reference the existing `StudioFader` cap gradient (line 734) as the pattern.
- Screw SVGs (two per bracket): small circles with radial gradient, cross-slot line — can be inline SVG or a tiny reusable `Screw` component.
- LCD parameter readout: `font-family: monospace`, amber `C.vuAmber` text on a near-black background. Shows `keyParams` values already computed by `keyParams()` at line 2407.
- Power LED: replace the existing circular div with a proper recessed LED — outer ring `C.metalDark`, inner glow circle in `ownerColor` when enabled. Reference the mockup at `public/comps/plugin-browser-hifi.html`.

---

## 4. Definition of Done

UAT checks the following for each feature before the Tech Lead marks it complete in `STATUS.md`.

### Crossfade Direct Manipulation

- [ ] `tsc --noEmit` passes with zero errors after all cleanup steps.
- [ ] `clip.fadeInCurve` and `clip.fadeOutCurve` are type `number` in all interfaces and all usages. No string enum values remain in the codebase.
- [ ] The `'crossfade'` tool no longer appears in the `Tool` type, the toolbar, or the global keydown handler.
- [ ] The fade line on a clip with `fadeIn > 0` draws as a smooth bezier curve. Setting `curve = 0.5` produces a visually straight diagonal (linear).
- [ ] Dragging the midpoint handle up produces a convex (slow-to-fast) fade. Dragging down produces a concave (fast-to-slow) fade.
- [ ] Snap to linear: dragging the handle to within 4px of the midpoint snaps to `curve = 0.5` and the line straightens visibly.
- [ ] `Shift + ,` decreases the active clip's fade curve by 0.05. `Shift + .` increases it by 0.05. Both clamp at [0.05, 0.95].
- [ ] When two clips overlap, fade lengths auto-extend to the overlap length on both clips.
- [ ] Dragging clips apart after an overlap restores the original pre-overlap fade lengths (not zero).
- [ ] The fade preset picker buttons (linear/ease/sharp) are gone from clip hover UI.

### VU Meter

- [ ] Dragging a fader while audio is playing changes the corresponding meter level in real time.
- [ ] Muting a track causes its meter to decay to zero (not snap).
- [ ] Soloing one track causes all other tracks' meters to decay to zero.
- [ ] Peak-hold dots appear, hold for approximately 700ms, then drop slowly.
- [ ] With `prefers-reduced-motion` active (simulate via DevTools): peak-hold dots snap to zero instead of dropping, transient glow does not fire.
- [ ] Master strip meter responds to master volume fader changes.
- [ ] Meter attack feels instant and meter decay feels slow — quantitative check is not required, but it must be visually distinguishable.

### Plugin Browser

**Lo-fi (first ship)**
- [ ] Clicking "+ Add Unit" opens the popover. Esc closes it. Clicking outside closes it.
- [ ] Search input is focused when the popover opens.
- [ ] Selecting a plugin type from the list adds a new rack unit to the chain. The unit appears immediately in the panel.
- [ ] Power LED button on each unit toggles `enabled`. Disabled units render at reduced opacity.
- [ ] Drag-to-reorder works: grab a card, drag up/down, purple insertion line appears, release reorders the chain.
- [ ] `Cmd/Ctrl + ArrowUp` and `Cmd/Ctrl + ArrowDown` move the focused card one position.
- [ ] Owner color appears on power LEDs and the empty-slot hover state. It does not appear on plugin faceplate text or type labels.
- [ ] `tsc --noEmit` passes.

**Hi-fi (second commit)**
- [ ] Cabinet rails use `C.wood` / `C.woodLight` tokens. No hardcoded hex values for wood tones.
- [ ] Faceplate gradient uses `C.metalDark`, `C.metalMid`, `C.metalLight` tokens. No hardcoded hex values for metal tones.
- [ ] LCD parameter readout shows the same values as the lo-fi card param display.
- [ ] Screws are present (two per bracket), styled consistently across all cards.
- [ ] Visual treatment matches the hi-fi mockup at `public/comps/plugin-browser-hifi.html` at a glance. Pixel-perfect is not the bar — recognizable rack-unit aesthetic is.

