# WP6 Handoff: FX Chain View, Interactive PanKnob, Always-Visible R/M/S

**Date:** 2026-05-10
**Engineer:** Frontend Engineer
**Spec:** `/docs/specs/fx-chain-pan-rms-redesign.md`
**Design handoff:** `/docs/handoffs/fx-chain-pan-rms-design.md`
**File modified:** `src/App.tsx` only

---

## Changes with approximate line numbers

All line numbers are approximate post-edit offsets.

### 1. Remove opacity-0 group-hover:opacity-100 from TrackHeader (Decision 3, step 1)

**~line 830** — removed `opacity-0 group-hover:opacity-100` from the wrapper div around the R/M/S MiniBtn row. Buttons are now permanently visible.

### 2. MiniBtn — pulse prop (Decision 3)

**~line 510** — added `pulse?: boolean` to `MiniBtn` props interface and implementation. When `pulse && active`, applies `boxShadow: 0 0 0 2px ${activeColor}44, 0 0 8px ${activeColor}33` and adds `record-pulse` CSS class. The R button in TrackHeader passes `pulse={track.armed}`.

### 3. TrackHeader layout redesign (Decision 3)

**~lines 820–900** — right column restructured to a single flex row containing the R/M/S buttons (left sub-group) and the PanKnob side by side. Name `<p>` now has `opacity: track.muted ? 0.5 : 1` inline. Height stays at `TRACK_H = 64px`.

Active colors confirmed:
- R: `C.danger` (#E94560) with pulse ring when armed
- M: `C.warn` (#F5A623)
- S: `C.success` (#1D9E75)

### 4. TrackHeaderProps — onPanChange (Decision 2)

**~line 844** — added `onPanChange?: (trackId: string, value: number) => void` to interface. Wired in ArrangeView's TrackHeader render with inline `setTracks` updater.

### 5. PanKnob — interactive drag (Decision 2)

**~lines 731–810** — full rewrite. Added `onChange?: (v: number) => void` prop. Implemented horizontal drag via `useRef` + `window.addEventListener` pattern matching the existing `Knob` component (axis switched to `clientX`, multiplier `delta * 0.8`). Double-click resets to 0. ARIA: `role="slider"`, `aria-label="Pan"`, `aria-valuenow/min/max={-100/100}`, `tabIndex={0}`, ArrowLeft/ArrowRight/Home keyboard handlers. `cursor: ew-resize` when interactive. Hover state shows `C` label in `C.textPri` when `pan === 0` to signal interactivity. When `onChange` is not provided, all interaction attrs suppressed.

### 6. MixerStrip FX badge → interactive button (Decision 1)

**~lines 1652–1710** — added `onSelectTrack: (trackId: string) => void` and `selectedTrackId: string | null` to `MixerStripProps`. Static `<span>FX:{n}</span>` replaced with a `<button>` that calls `onSelectTrack(track.id)`. Active state: `background: C.accent, color: #fff, boxShadow: 0 0 0 1px C.accent` when `selectedTrackId === track.id`. Default: `background: C.control, color: C.textSec`.

### 7. MixerPanel — props threading (Decision 1)

**~lines 1834–1840** — added `onSelectTrack` and `selectedTrackId` to `MixerPanel` function signature. Both props threaded into each `MixerStrip` instance. Master strip FX badge (`FX:—`) also converted to interactive `<button>` calling `onSelectTrack('master')`.

### 8. App root — handleSelectTrack + Escape handler (Decision 1)

**~lines 2285–2290** — added `handleSelectTrack` toggle function: `setSelectedTrackId(prev => prev === id ? null : id)`. All `onSelectTrack` call sites now use `handleSelectTrack`.

**~line 2275** — Escape key handler extended: `setSelectedTrackId(null)` added alongside existing `setShowInvite(false)`.

### 9. PluginChainPanel — ownerColor left border (Decision 1d)

**~line 2125** — added `ownerColor: string` to `PluginChainPanelProps`. Panel header div receives `borderLeft: 3px solid ${ownerColor}`.

**App root ~line 2355** — `ownerColor` derived as `selectedTrackId === 'master' ? C.accent : tracks.find(t => t.id === selectedTrackId)?.owner.color ?? C.accent`.

### 10. PluginChainPanel — empty state (spec §5)

**~lines 2135–2210** — replaced the `plugins.length === 0` branch ("No plugins on this track" span) and the footer "Add Plugin +" stub. New empty state:

- Signal-flow SVG (220×80, `aria-hidden="true"`, IN/OUT nodes, dashed empty slot stroked with `ownerColor` at 22% opacity, radial glow at 8% opacity)
- "Clean signal" headline: 13px, weight 500, `C.textPri`
- "Add Plugin +" CTA button: full width minus 24px gutter, 36px height, `C.accent` bg, hover/focus/active states via inline `onMouseEnter/Leave/Down/Up/Focus/Blur` handlers, `aria-label="Add plugin to FX chain"`, `onClick: console.log('plugin browser: TODO')`
- Subtext: "Add compression, reverb, EQ, and more." at 10px, `C.textSec`

Footer "Add Plugin +" button now only renders when `plugins.length > 0`.

### 11. Clip opacity — muted tracks (Decision 3)

**~line 975** — clip opacity changed from `isGhost ? 0.35 : isDragging ? 0.85 : 1` to `isGhost ? 0.35 : isDragging ? 0.85 : track.muted ? 0.5 : 1`.

---

## tsc result

`npx tsc --noEmit` passes with zero errors after each step and at final state.

---

## Adaptations

**PanKnob `interactiveAttrs` spread** — the interactive and non-interactive attribute sets are computed as two separate objects and spread onto the outer `<div>`. This avoids conditional JSX attribute clutter and keeps the two modes clearly separated. The `style` key in each branch is a plain object; the `role` key uses `as const` to satisfy TypeScript's ARIA role type.

**`onPanChange` threading via ArrangeView** — the spec proposed adding `onPanChange` to `ArrangeViewProps`, but since `ArrangeView` already has direct `setTracks` access, the update is inlined at the `TrackHeader` call site: `onPanChange={(trackId, v) => setTracks(prev => prev.map(...))}`. This avoids an unnecessary prop on `ArrangeViewProps`.

---

## Empty state visual verification (dev server)

Confirmed on `http://localhost:5173` with the Kick track selected (0 plugins):

- "Clean signal" headline renders at 13px, `C.textPri` (#F0F0F5)
- Signal-flow SVG renders with IN/OUT nodes, dashed slot, and owner color glow (purple `#6B5CE7` for Luke)
- "Add Plugin +" CTA button renders with `C.accent` background, white text, 36px height
- "Add compression, reverb, EQ, and more." subtext at 10px below CTA
- Panel header left border: 3px solid `#6B5CE7` (confirmed via `window.getComputedStyle`)

Bass Line track (3 plugins) confirmed: owner color border `3px solid #E94560` (Miguel), plugins list renders, footer "Add Plugin +" button visible, empty state absent.
