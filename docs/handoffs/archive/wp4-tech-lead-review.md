# WP-4 Tech Lead Review — Handoff

**Date:** 2026-05-10  
**Author:** Frontend Engineer (Claude)  
**Files changed:** `src/App.tsx` only

---

## Fixes applied

### Fix 1 — fadeCurve picker wiring (P1)

The `ClipData` interface already used the more specific `fadeInCurve`/`fadeOutCurve` field names rather than the single `fadeCurve` field described in the work order — no interface change was needed there, and the SVG fade overlays already passed those fields correctly to `fadePath()`.

What was done:
- Added `onUpdate: (trackId: string, clipId: string, patch: Partial<ClipData>) => void` to `ClipProps` and the `Clip` component signature.
- Added `updateClip()` helper in `ArrangeView` that dispatches an immutable patch via `setTracks`.
- Replaced the inert `onMouseDown={e => e.stopPropagation()}` on each fade curve `<span>` with a real handler that calls `onUpdate` with `fadeInCurve` and/or `fadeOutCurve` patches depending on which fades are active.
- Added visual active state (accent background, white text) so the currently selected curve is highlighted.
- Passed `onUpdate={updateClip}` at the `<Clip>` call site in `ArrangeView`.

### Fix 2 — Plugin enable toggle: lift state + wire onClick (P1)

- Renamed module-level `DEMO_PLUGIN_CHAINS` constant to `INITIAL_PLUGIN_CHAINS`.
- Added `[pluginChains, setPluginChains]` state in `App` initialized from `INITIAL_PLUGIN_CHAINS`.
- Added `onTogglePlugin: (slotId: string) => void` to `PluginChainPanelProps`.
- Defined `togglePlugin()` in `App` that calls `setPluginChains` with an immutable update toggling `enabled` on the matching slot for the currently selected track.
- Threaded `pluginChains` down to `MixerPanel` (for the `FX:n` count badge) and `onTogglePlugin={togglePlugin}` down to `PluginChainPanel`.
- Wired `onClick={() => onTogglePlugin(slot.id)}` onto the enable button in `PluginChainPanel`.

### Fix 3 — formatDb -∞ floor (P2)

Added `if (db < -60) return '-∞ dB'` guard before the formatted return in `formatDb()`. Fader positions at the low end (volume ~55 and below) now show `-∞ dB` instead of e.g. `-120.0 dB`.

### Fix 4 — Move InviteModal to App root (P2)

Cut `{showInvite && <InviteModal onClose={() => setShowInvite(false)} />}` from inside `<header>` in `TransportBar` and placed it after `<StatusBar />` at the App root level. `showInvite`/`setShowInvite` were already in App scope. `TransportBar` still receives those props to trigger `setShowInvite(true)` via the Invite button.

### Fix 5 — Playback effect split (P2)

Replaced the single combined `useEffect([playing, tracks])` with two effects:

- **Effect A** — depends only on `[playing]`. Creates/destroys `AudioBufferSourceNode`, `GainNode`, and `StereoPannerNode`. Sources only restart when transport toggles.
- **Effect B** — depends on `[playing, tracks]`. When playing, iterates `_activeSources` and calls `setTargetAtTime(..., 0.01)` (10 ms ramp) on each gain and panner node. Mute/solo/volume/pan changes during playback are now click-free.

### Fix 6 — Cleanup sweep (P3)

**6a — `synthBass` return type:**
- Changed signature from `AudioContext extends AudioContext ? AudioBuffer : never` to `: AudioBuffer`.
- Removed `as unknown as AudioContext extends AudioContext ? AudioBuffer : never` from the return statement.
- Removed `as unknown as AudioBuffer` cast at the `synthesizeBuffer` call site.

**6b — Removed unused `useMemo` import:**
- Confirmed via `grep -n "useMemo"` that it was imported but never called.
- Removed from the React import on line 1.

---

## Type check

`npx tsc --noEmit` completed with no output (zero errors).

## Dev server

Running on port 5173. App loads with no console errors. All mixer strips render correctly, including the `-∞ dB` floor on low-volume tracks.

## Skipped / adapted

None — all six fixes were applied as specified, with the adaptation noted in Fix 1 (the codebase used `fadeInCurve`/`fadeOutCurve` rather than a single `fadeCurve`, so no interface change was required and the SVG overlays were already correct).
