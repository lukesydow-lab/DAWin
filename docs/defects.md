# UAT Defect Register — Sprint 1

> **Source:** UAT Agent sign-off run, 2026-05-10
> **Features tested:** Session room UI, clip editing, playhead animation, Neve studio theme
> **Status key:** `open` · `in progress` · `fixed` · `deferred`

---

| Priority | Status | Issue | File:Line |
|----------|--------|-------|-----------|
| **P0 — Blocker** | fixed | M/S/R buttons in track headers have no `onClick` — mute, solo, arm do nothing | [App.tsx:1069](../src/App.tsx) |
| **P0 — Blocker** | fixed | M/S buttons in mixer strip have no `onClick` — stuck state, Pad cannot be unmuted | [App.tsx:1397](../src/App.tsx) |
| **P0 — Blocker** | fixed | Mixer fader/pan state is isolated local state — `MixerPanel` receives no `setTracks`, changes don't persist | [App.tsx:1367](../src/App.tsx) |
| **P1 — High** | fixed | Spacebar does not play/pause — no `keydown` listeners exist anywhere in the codebase | [App.tsx:1742](../src/App.tsx) |
| **P1 — High** | fixed | Tool keyboard shortcuts (V/C/X) labeled in toolbar tooltips but not wired to any handler | [App.tsx:1751](../src/App.tsx) |
| **P1 — High** | fixed | Escape does not close modals — no keydown handling in `InviteModal` or `BounceModal` | [App.tsx:1524](../src/App.tsx) |
| **P1 — High** | fixed | "Send invite" primary CTA has no `onClick` — modal stays open, no confirmation | [App.tsx:1530](../src/App.tsx) |
| **P2 — Medium** | fixed | Clip drag ignores grab offset — `barOffset` stored in `DragState` but discarded in move calculation, clips snap to leading edge not grab point | [App.tsx:900](../src/App.tsx) |
| **P2 — Medium** | deferred | Crossfade tool has toolbar UI and type declaration but zero implementation — dragging clips does nothing | [App.tsx:45](../src/App.tsx) |
| **P2 — Medium** | fixed (partial) | Context menu items Delete, Duplicate, Loop region, Rename are stubs — Delete and Duplicate now wired; Loop region and Rename remain disabled stubs | [App.tsx:1223](../src/App.tsx) |
| **P2 — Medium** | fixed | FX badge hardcoded `"FX:2"` on every mixer strip — ignores actual plugin chain data | [App.tsx:1396](../src/App.tsx) |
| **P2 — Medium** | deferred | "Add Plugin +" button in FX Chain panel has no `onClick` handler — awaiting PM interaction spec | [App.tsx:1697](../src/App.tsx) |
| **P2 — Medium** | fixed | Stop (⏹) and Return to Zero (⏮) both reset playhead to bar 1 — DAW convention: Stop should keep position, only Return to Zero should reset | [App.tsx:1469](../src/App.tsx) |
| **P2 — Medium** | fixed | No `min-width: 1280px` enforced — layout breaks and elements overlap below 1280px | [App.tsx:1763](../src/App.tsx) |
| **P3 — Low** | open | VU meters are static — level derived from volume setting only, no animation during playback | [App.tsx:1268](../src/App.tsx) |
| **P3 — Low** | fixed | Master strip dB readout hardcoded `"+6.0 dB"` — does not respond to `masterVol` fader | [App.tsx:1434](../src/App.tsx) |
| **P3 — Low** | fixed | Fader dB curve is linear (0–100 → -6 to +6 dB) — DAW convention is logarithmic with unity gain (~0 dB) at ~75% fader travel | [App.tsx:161](../src/App.tsx) |
| **P3 — Low** | fixed | Design token violation: `'#2E2E42'` hardcoded for ruler sub-beat color — should use a `C.*` token | resolved |
| **P3 — Low** | fixed | BPM input accepts out-of-range values silently — `min={40}` `max={300}` attributes bypassed by direct text input | [App.tsx:1489](../src/App.tsx) |

---

## Open items summary (3 remaining + 1 partial)

| # | Defect | Reason |
|---|--------|--------|
| — | Context menu Loop region + Rename | `disabled: true` stubs — intentionally deferred to WP-2 scope |
| — | Add Plugin + button | Awaiting PM spec on interaction model |
| — | Crossfade tool | L effort, no spec — PM must scope before Frontend touches it |
| — | VU meter animation | Not addressed in WP-1; next candidate for WP-3 |

---

## Tech Lead sign-off

- **WP-1 Frontend:** Approved 2026-05-10 — 16 of 19 defects resolved; 2 correctly deferred; 1 (VU) remaining for WP-3
- **Backend architecture:** Approved with revisions 2026-05-10 — 4 spec clarifications required before Fastify scaffold (see `docs/adr/` for details)
