# ADR 001 — DSP Locality: Browser vs. Server vs. Native Sidecar

> **Status:** Accepted  
> **Date:** 2026-05-10  
> **Decided by:** Backend Engineer + Tech Lead  

---

## Context

The multitrack engine needs to process audio through a plugin chain (compressor, reverb, delay, maximizer, EQ) in real time. There are three candidate locations for this DSP work:

1. **Browser (Web Audio API)** — processing runs on the client's audio thread
2. **Server-side** — audio streamed to the server, processed, streamed back
3. **Native sidecar** — an Electron/Tauri sidecar process on the client machine, communicating via local loopback WebSocket or shared memory

## Decision

**DSP runs in the browser via the Web Audio API for the prototype.**

## Rationale

**Server-side DSP is a bandwidth dead-end.** At 48 kHz / 24-bit stereo, one track produces ~2.3 Mbps of raw audio. Seven tracks = ~16 Mbps sustained upload + ~16 Mbps download, before any processing overhead. This makes server-side DSP impractical for a prototype and expensive in production for a general internet use case.

**Web Audio API covers every plugin type needed.** The current plugin list maps directly to native Web Audio nodes with no approximation:

| Plugin | Node |
|--------|------|
| Compressor | `DynamicsCompressorNode` |
| Reverb | `ConvolverNode` |
| Delay | `DelayNode` |
| Maximizer | `WaveShaperNode` + `GainNode` |
| EQ | `BiquadFilterNode` ×N |

**Hardware access is handled automatically.** Web Audio on desktop runs on the OS audio layer (CoreAudio on macOS, WASAPI/ASIO on Windows, JACK/PipeWire on Linux). The browser exposes physical device selection via `navigator.mediaDevices.enumerateDevices()`. No driver integration code needed in the prototype.

**Audio thread isolation.** `AudioWorkletProcessor` runs on a dedicated real-time thread with 128-sample buffers (~2.67 ms at 48 kHz). Garbage collection pauses in the main JS thread do not affect audio output.

**Plugin state remains server-persisted.** Although DSP runs in the browser, all parameter values (every knob, every toggle) are persisted on the server and synced via `plugin.param_change` WebSocket events. Collaborators apply parameter changes to their local audio graphs on receipt. This is the standard pattern for browser-based collaborative audio tools.

## Consequences

**Positive:**
- Zero streaming infrastructure cost for DSP
- Sub-3 ms audio latency (hardware buffer, not network-bound)
- Native device support without driver code
- Simple fan-out model: parameter changes are small JSON messages, not audio streams

**Negative / Trade-offs:**
- Plugin implementations are Web Audio nodes only — no CLAP/VST3 user-installed plugins
- Audio graph is not portable: a non-browser client would need to rebuild the DSP layer
- Plugin state sync creates fan-out pressure at high knob velocity (mitigated by 16 ms throttle — see API spec)

## Future path to native sidecar

If CLAP/VST3 support is required later: run an Electron or Tauri sidecar process that exposes a local loopback WebSocket. The browser's `AudioWorkletNode` routes audio to/from it via shared memory (SAB). The server architecture does not change — the sidecar is a client-side concern. This is the architecture used by REAPER's web interface and several production Electron DAWs.

## Alternatives considered

| Option | Rejected because |
|--------|-----------------|
| Server-side DSP | ~32 Mbps per 7-track session; impractical on general internet |
| Native sidecar (now) | Over-engineering for prototype; adds Electron/Tauri build complexity before VST need is confirmed |
| WebAssembly DSP (AudioWorklet + WASM) | Valid future path for custom algorithms; not needed while Web Audio nodes suffice |
