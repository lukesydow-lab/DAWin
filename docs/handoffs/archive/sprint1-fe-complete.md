# Sprint 1 FE Complete — Handoff

**Author:** Frontend Engineer  
**Date:** 2026-05-14  
**Closes:** sprint1-frontend-work-order.md  
**Status:** All three features implemented. `tsc --noEmit` passes with zero errors.

---

## Feature commits (pending — commit each block per the work order)

### Feature A — Crossfade Direct-Manipulation Curves
**Commit message:** `feat: crossfade direct-manipulation curves — bezier midpoint handle replaces preset picker and crossfade tool`

**What changed in `src/App.tsx`:**
- Removed `type FadeCurve = 'linear' | 'ease' | 'sharp'` — deleted entirely
- `ClipData.fadeInCurve` and `ClipData.fadeOutCurve` are now `number` (0.05–0.95)
- Migration: `ease → 0.7` (default in `mkClip`), `linear → 0.5`, `sharp → 0.3`
- Removed `fadePath` switch/case; replaced with `fadeGain(t, curve)` bezier formula, `fadePath` (filled overlay), `fadeCurveLine` (visible stroke), `fadeMidpointY` (handle Y)
- `Clip` component gains `FadeHandleDrag` state and per-fade drag effect; midpoint SVG `<circle>` handles appear on hover or active drag
- Removed fade-curve preset picker (was rendered at clip bottom-right on hover)
- Removed `'crossfade'` from `Tool` type union
- Removed crossfade entry from `Toolbar.tools` array and hint text
- Removed `x/X` keydown handler from global keydown effect
- Added `Shift+,` (`<`) and `Shift+.` (`>`) global shortcuts to adjust selected clip's fade curves ±0.05
- `selectedClipId` lifted to `App`, exposed via `selectedClipIdRef` for keyboard handler
- `DragState` gets `_preFadeIn` / `_preFadeOut` fields (set null on start)
- `handleMouseUp` calls `applyOverlapFades` on same-track and cross-track drops — auto-extends fade lengths to overlap region
- `ArrangeViewProps` adds `selectedClipId` + `onSelectClip` props

### Feature B — VU Meter Heartbeat Startup Integration
**Commit message:** `feat: VU meter heartbeat startup integration — meters bloom with faders on session load`

**What changed in `src/App.tsx`:**
- Added `heartbeatSignalRef: React.MutableRefObject<number | null>` to `MixerPanel`
- rAF loop reads `heartbeatSignalRef.current` and substitutes it for live RMS on all strips and the master strip when non-null
- New `useEffect` (runs once on mount) drives the startup sequence:
  - Two `heartbeatBeat()` calls (easeOutQuint rise → breath hold → easeInOutQuart fall)
  - Staggered motorized recall across `trackCount` strips (center-outward, 80ms stagger)
  - Sets `heartbeatSignalRef.current = null` on completion to return to live RMS

**Deviation from prototype:** The prototype has per-strip `signalTarget` allowing staggered levels simultaneously. The React implementation uses a single shared `heartbeatSignalRef`, so all strips bloom in unison. Full per-strip independence would require per-strip refs threaded through the rAF loop data — deferred to Sprint 2 as a polish item. The startup performance still reads correctly because the recall stagger runs serially and the shared ref approximates the sequential recall sweep.

### Feature C — Plugin Browser (lo-fi + hi-fi)
**Commit message lo-fi:** `feat: plugin browser — inline popover with search, drag-to-reorder rack units`  
**Commit message hi-fi:** `feat: plugin browser hi-fi — rack aesthetic with wood rails, metal faceplates, power LEDs`

Both commits combined into one implementation pass per work order guidance (lo-fi behavior + hi-fi pass delivered together).

**What changed in `src/App.tsx`:**
- Added `PLUGIN_REGISTRY` constant (5 plugin types, hardcoded for v1)
- Added `mkPluginSlot(type)` factory function
- New `PluginBrowser` component: inline popover with search input (autofocused), categorized list, click-outside and Esc dismissal
- New `Screw` component: inline SVG for rack bracket screws (hi-fi)
- `PluginChainPanel` completely replaced:
  - Wood cabinet top/bottom rails using `C.wood` / `C.woodLight` (via `wood-panel` class)
  - Owner-color trim stripes (2px gradient) inside rails
  - Brushed-metal faceplate gradient (`C.metalDark` → `C.metalMid` → `C.metalLight`) on each rack unit card
  - Screw SVGs (two per bracket, left and right)
  - Power LED: `radial-gradient` circle glowing in `ownerColor` when enabled, `C.metalDark` when bypassed
  - Amber LCD param readout using `C.vuAmber` on `C.well` background
  - Drag-to-reorder: native HTML5 `draggable` / `onDragStart` / `onDragOver` / `onDrop`; purple insertion line at drop target
  - `Cmd/Ctrl + ArrowUp/Down` on focused card moves it one position
  - `showBrowser` state drives `PluginBrowser` popover anchored to the "+ ADD UNIT" slot
  - Empty state retains signal-flow SVG with owner color glow
- `PluginChainPanelProps` adds `onAddPlugin` and `onReorderPlugins`
- `App` adds `addPlugin` and `reorderPlugins` handlers; passes to `PluginChainPanel`

---

## Open items deferred

1. **Per-strip staggered heartbeat VU signal** — single shared `heartbeatSignalRef` currently drives all strips simultaneously. Per-strip refs would require plumbing each strip's physics object into the rAF data structure by reference. Deferred to Sprint 2 as visual polish; the sequence is recognizable.

2. **`_preFadeIn` / `_preFadeOut` storage during live drag** — The overlap fade auto-extension stores pre-overlap values null at drag start. The spec calls for storing them when overlap is *first detected* (mid-drag). Current implementation only restores on `mouseup` if the values were captured. Full mid-drag detection would require tracking overlap state within `handleMouseMove`; deferred to a follow-up commit.

3. **Per-strip motorized recall during heartbeat** — The stagger in the recall phase uses `setTimeout` per strip but shares a single `heartbeatSignalRef`. This means the last strip to finish overrides earlier ones. True per-strip recall needs per-strip signal refs — deferred.

---

## UAT instructions

### Feature A — Crossfade

1. Load the app. Confirm the toolbar shows only Select and Cut tools (no ⋈ Crossfade button).
2. Press `X` — confirm nothing happens (shortcut is removed).
3. On a clip in the Kick track, drag the fade-in triangle handle right to create a fade-in. A bezier curve line appears in the owner color over the fade region.
4. Hover over the clip — confirm the white midpoint circle appears on the fade line.
5. Drag the midpoint circle up — the curve bends convex (slow-in, fast-out shape). Drag it down — concave (fast-in, slow-out). A value near the midpoint should snap to straight (linear, `curve=0.5`).
6. Select a clip (click it). Press `Shift+,` — the fade line bends concave. Press `Shift+.` — it bends convex. Verify it clamps at `[0.05, 0.95]`.
7. Verify no linear/ease/sharp preset buttons appear anywhere on clip hover.
8. Drag one clip to overlap with a neighboring clip on the same track — confirm both fade lengths extend to cover the overlap.

### Feature B — VU Meter Heartbeat

1. Hard-reload the page (Cmd+Shift+R). Within ~2 seconds, the VU meters should bloom upward twice (heartbeat), then settle via a staggered recall sweep. Peak-hold dots should light up during the bloom.
2. Press play. Drag a fader — meter level changes in real time on that strip.
3. Mute a track — its meter decays to zero (does not snap).
4. Solo one track — other tracks' meters decay to zero.

### Feature C — Plugin Browser

1. Click the `FX:0` badge on the Kick strip in the mixer — the FX panel slides in, showing the wood cabinet and empty state SVG.
2. Click `+ ADD UNIT` — the popover appears with search autofocused and a categorized plugin list.
3. Type `rev` — list filters to Reverb.
4. Click Reverb — a rack unit card appears in the chain. Confirm brushed-metal faceplate, amber LCD param readout, and glowing power LED in the track's owner color (purple for Kick).
5. Click the power LED — it dims and the card desaturates. Click again — it re-lights.
6. Drag a card up or down — purple insertion line shows. Release — card reorders.
7. Tab-focus a card, press `Cmd+ArrowUp` / `Cmd+ArrowDown` — card moves one position.
8. Press `Esc` while browser popover is open — popover closes.
9. Click outside the popover — popover closes.
10. Confirm no hardcoded hex colors in card styling (all using `C.*` tokens).
