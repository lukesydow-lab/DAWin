# Frontend Work Order — Sprint 1 Defect Fixes

> **Issued by:** Tech Lead  
> **Date:** 2026-05-10  
> **Source:** UAT Defect Register (`docs/defects.md`)  
> **Priority model:** Blockers first, then impact × effort within each tier

---

## WP-1 — P0 Blockers + P1 Keyboard & Modal Wiring
**Status:** In Progress  
**Do not close until all 7 items below are done.**

### P0 — State & Interactivity (fix as one PR)

**1. Lift mixer state to parent** `App.tsx:1650`
- `MixerPanel` currently manages fader/pan as isolated local state
- Pass `tracks` and `setTracks` down from the top-level `tracks` state
- All fader/pan/mute/solo changes must update the shared track array

**2. Wire M/S/R in track headers** `App.tsx:198`
- Add `onClick` to Mute, Solo, Arm buttons in each track header row
- Mute: toggle `track.muted`; Solo: toggle `track.soloed`; Arm: toggle `track.armed`
- Solo should visually dim all non-soloed tracks

**3. Wire M/S in mixer strips** `App.tsx:504`, `App.tsx:1252`
- Same pattern as above — `onClick` toggles on the shared `tracks` state
- Verify Pad track can be unmuted after being muted

### P1 — Keyboard Shortcuts & Modal Actions (can be same PR as P0 or follow-on)

**4. Spacebar play/pause**
- Add a `useEffect` with a `keydown` listener on `window` (or the main container)
- `Space` → toggle `isPlaying`; prevent default to avoid page scroll

**5. Tool shortcuts V / C / X**
- In the same `keydown` handler: `v` → select tool, `c` → cut tool, `x` → crossfade tool
- Read current active tool from state; set it on keypress

**6. Escape closes modals**
- `InviteModal`: add `keydown` listener → `Escape` calls `onClose()`
- `BounceModal`: same pattern

**7. "Send invite" CTA onClick** `App.tsx:1463`
- Add `onClick` handler to the primary Send button
- For now: close the modal and show a transient success toast (or just close — confirm with PM if toast is in scope)

---

## WP-2 — P2 Medium Fixes
**Status:** Queued (starts after WP-1 is merged and reviewed)

**8. Stop vs Return-to-Zero convention** `App.tsx`
- Stop (⏹): pause playback, **keep** playhead position
- Return to Zero (⏮): reset playhead to bar 1
- Currently both reset — remove the position reset from the Stop handler

**9. Enforce min-width 1280px** `App.tsx`
- Add `min-w-[1280px]` (or equivalent inline style) to the root layout container
- Confirm layout no longer breaks at narrow viewports

**10. Clip drag grab offset** `App.tsx:857`
- `barOffset` is already stored in `DragState` but discarded in the move calculation
- Apply the offset: `newBar = pointerBar - dragState.barOffset`
- Clips should land where the user grabbed them, not at the clip's leading edge

**11. FX badge reads actual plugin count** `App.tsx:1238`
- Replace hardcoded `"FX:2"` with the length of the track's plugin chain array
- If the array is empty, render nothing or `"FX:0"` — confirm with designer

**12. Context menu actions** `App.tsx`
- **Delete:** remove the clip from `track.clips`
- **Duplicate:** insert a copy of the clip starting immediately after the original
- **Loop region:** set the loop in/out points to the clip's start/end bars (requires loop state)
- **Rename:** open an inline text input on the clip label
- Scope: implement Delete and Duplicate first; Loop region and Rename are stretch goals for this WP

**13. "Add Plugin +" button** `App.tsx:1596`
- Needs a PM decision on the interaction (modal picker vs. inline dropdown) before implementation
- **Do not implement** until a spec lands in `docs/specs/` — flag to PM

**14. Crossfade tool implementation** `App.tsx:45`
- Deferred — L effort, no spec exists
- **Do not touch** until PM scopes it in a dedicated spec

---

## WP-3 — P3 Polish Batch
**Status:** Queued (starts after WP-2 is merged and reviewed)

**15. Design token: ruler sub-beat color** `App.tsx:1053`
- Replace hardcoded `'#2E2E42'` with the appropriate `C.*` token
- Likely `C.elevated` or a new `C.border` token — check with designer if unsure

**16. Master dB readout** `App.tsx:1359`
- Derive the dB string from `masterVol` (0–100 linear range)
- Display as `"+X.X dB"` matching the fader curve used (update once #18 is done)

**17. BPM input validation** `App.tsx`
- On `onChange`, clamp the value to `[40, 300]` before setting state
- Do not rely on HTML `min`/`max` attributes alone — they are bypassed by direct text input

**18. Fader logarithmic curve**
- Replace linear dB mapping with a log curve: unity gain (~0 dB) at ~75% fader travel
- Apply consistently to all track faders and the master fader
- Common formula: `dB = 20 * log10(value / 75)` scaled to the display range — adjust to taste

**19. VU meter animation** `App.tsx:1205`
- Drive VU level from a `requestAnimationFrame` loop when `isPlaying` is true
- Simulate level per track (use `track.volume` as the peak target, add noise/decay)
- Stop the RAF loop when playback stops; reset meters to zero

---

## Review Protocol

When each WP is ready:
1. Drop a file in `docs/handoffs/` describing what was built and what files changed
2. Update the Review Queue in `STATUS.md`
3. Tech Lead reviews against the checklist (correctness → types → tokens → perf → simplicity)
4. On approval, Tech Lead updates `STATUS.md` Done table and closes the WP
