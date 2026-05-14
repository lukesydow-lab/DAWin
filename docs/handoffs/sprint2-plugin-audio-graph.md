# Sprint 2 — Plugin Audio Graph Wiring

**Agent:** Frontend Engineer
**Date:** 2026-05-14
**GitHub Issue:** #7
**Status:** Complete — pending Tech Lead review and UAT

---

## What was built

Plugin chain nodes are now wired into the Web Audio graph, so enabling and disabling plugin toggles produces an audible change in the rendered signal.

### Signal order (per track)

```
source → [plugin chain] → GainNode(fader) → AnalyserNode(VU tap) → StereoPannerNode → _masterGain → _masterAnalyser → destination
```

---

## Files changed

- `/Users/lukesydow/daw-design/src/App.tsx` — all changes are surgical within the audio engine section and App component effects

---

## Implementation details

### Type

`PluginType` union extended with `'limiter'`. `PLUGIN_REGISTRY` gets a `Limiter` entry.

### Module-level state

`_pluginNodeMap: Map<string, Map<string, AudioNode>>` — persists across renders, parallel to `_activeSources`. Key is `trackId`; inner key is `pluginId`. Delay's feedback GainNode is stored under `${pluginId}__fb`.

### Node factory — `createPluginNode`

| Plugin type | Web Audio node(s) |
|---|---|
| `compressor` | `DynamicsCompressorNode` (threshold: -24, knee: 30, ratio: 4, attack: 0.003, release: 0.25) |
| `reverb` | `ConvolverNode` with synthetic IR from `createReverbIR(ctx, 2.5, 3)` |
| `delay` | `DelayNode` (maxDelay: 2s, delayTime: 0.25s) + internal feedback `GainNode` (0.3) |
| `eq` | `BiquadFilterNode` (type: 'peaking', freq: 1000 Hz, gain: 0 dB) |
| `limiter` / `maximizer` | `DynamicsCompressorNode` (threshold: -3, knee: 0, ratio: 20, attack: 0.001, release: 0.1) |

### Synthetic reverb IR — `createReverbIR`

Procedural: filtered white noise × exponential decay curve. No file fetch. Stereo. Parameters: `duration` (seconds), `decay` (power law exponent).

### Chain reconciler — `rewirePluginChain`

Called on transport start (Effect A) and on live plugin changes (Effect C). Logic:
1. Creates nodes for any `pluginId` not yet in the map.
2. Removes and disconnects nodes for plugin IDs no longer in the chain.
3. Disconnects `source` and all primary plugin nodes cleanly.
4. Reconnects: `source → enabled[0] → enabled[1] → ... → gain`. Disabled plugins are bypassed — signal skips them entirely without destroying their nodes.

### Avoid transport restart on toggle

Effect A reads `pluginChainsRef.current` (a stable ref, not a state dep) so that `pluginChains` changes do not appear in Effect A's dep array and do not restart sources.

### Effect C (new)

Runs on `[playing, pluginChains]`. While playing, iterates `pluginChains` entries and calls `rewirePluginChain` for each track that has active sources. This handles: enable/disable toggles, reorder (drag), add plugin, remove plugin — all without audible source restart.

### Cleanup

`stopAllSources` now also calls `clearTrackPluginNodes` for all tracked IDs, so plugin nodes are fully released when transport stops.

---

## Seed data change

`INITIAL_PLUGIN_CHAINS` now includes track `t1` (Kick) with a compressor (enabled: true) so the acceptance criterion is immediately testable on load + play.

---

## Acceptance criteria verification

- `tsc --noEmit` passes clean (zero errors)
- Toggling the compressor on Kick (`t1`) while playing routes signal through `DynamicsCompressorNode` (enabled) or bypasses it directly to the fader GainNode (disabled) — audible dynamic difference on the kick transient
- Reverb on t4 (disabled by default in seed data) can be enabled mid-playback without restarting the transport
- Delay on t4 maintains its feedback loop when enabled; feedback GainNode is cleaned up on transport stop

---

## What was not touched

- VU meter rAF loop
- MixerPanel
- Master gain/analyser chain
- Fader law, panning, or mute/solo logic
- Any file outside `src/App.tsx`

---

## Follow-up work

- Plugin `params` (threshold, ratio, wet level, etc.) are stored in state but not yet applied to the Web Audio nodes — a future sprint should wire param knobs to `AudioParam.setTargetAtTime` calls.
- ConvolverNode dry/wet blend needs a parallel dry path + wet GainNode for controllable reverb mix.
- Delay wet mix similarly needs a dry/wet splitter.
