# UAT Bug Fixes — WP8

**Date:** 2026-05-11
**Files changed:** `src/App.tsx`

---

## Bug 1 — formatDb threshold corrected to -90 dB

**Location:** `formatDb` function (~line 469)

**What was wrong:** The floor guard `if (db < -60) return '-∞ dB'` triggered at roughly 55% fader travel because the fader law maps that position to ~-65 dB, which fell below -60.

**Fix:** Changed threshold from `db < -60` to `db < -90`. The -∞ label now only appears at near-silence levels well below audible range.

---

## Bug 2 — Double mute opacity eliminated

**Location:** ArrangeView track row style object (~line 1580 after edits)

**What was wrong:** Muted tracks had opacity applied in two places simultaneously — 0.4 on the row container and 0.5 on each clip inside — compounding to an effective opacity of ~0.2, making clips nearly invisible.

**Fix:** Removed `opacity: track.muted ? 0.4 : ...` from the row-level style. The clip-level `opacity: track.muted ? 0.5 : 1` in the `Clip` component is now the sole source of mute dimming. Solo-dimming (`anySoloed && !track.soloed ? 0.4 : 1`) on the row level is retained as-is since it has no clip-level counterpart.

---

## Bug 3 — Waveform cold-load placeholder

**Location:** `Clip` component canvas `useEffect` (~line 961–986)

**What was wrong:** When `AudioContext` had not yet initialized, `resolveBuffer` returned null and the function returned early, leaving the canvas element unpainted — blank grey boxes with no indication content would appear.

**Fix:** Instead of silently returning, the effect now draws a ghost waveform placeholder:
- Canvas filled with the track owner's color at 8% opacity (`color + '14'`)
- 24 vertical bars drawn at 18% opacity (`color + '2E'`), heights determined by a deterministic `Math.sin`-based hash seeded from the clip's id — stable across re-renders, no flicker

The placeholder is replaced by the real waveform on the next render after `audioCtxReady` becomes true (the effect dependency list already includes `audioCtxReady`).
