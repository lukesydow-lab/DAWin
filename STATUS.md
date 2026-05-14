# Project DAWin — Status Board

> **Last updated:** 2026-05-14 — Sprint 2 active, one item remaining  
> **Sprint:** 2 — Real-Time Collaboration  
> **Owner:** Luke (PM)

---

## Active Work

| Agent | Task | Issue | Status | Blocking? |
|-------|------|-------|--------|-----------|
| Backend + Frontend | Track locking + JWT role enforcement | #20 | Not started (next session) | No |

## Review Queue (waiting on Tech Lead)

| Agent | Task | Files changed | Submitted |
|-------|------|---------------|-----------|
| — | — | — | — |

## Done ✓ — Sprint 2

| Task | Completed by | Date |
|------|--------------|------|
| 4 spec items resolved in `docs/specs/multitrack-backend-api.md` | Backend | 2026-05-14 |
| Fastify scaffold: server/index.ts, routes/sessions.ts, routes/auth.ts, ws/handler.ts, store.ts, types.ts — tsc-clean | Backend | 2026-05-14 |
| WebSocket message routing: session.join/leave, transport.play/pause/stop/seek/bpm_change, presence.update fan-out, session.snapshot on connect | Backend | 2026-05-14 |
| Plugin chain audio graph: DynamicsCompressorNode, ConvolverNode (procedural IR), DelayNode + feedback GainNode, BiquadFilterNode, Limiter; rewirePluginChain reconciler; _pluginNodeMap; bypass without graph rebuild; Kick seeded with compressor | Frontend | 2026-05-14 |
| _masterPanner StereoPannerNode inserted (masterGain → masterPanner → masterAnalyser → destination); masterPan default fixed 0→50; mapping (masterPan-50)/50 | Frontend | 2026-05-14 |
| StudioFader: role=slider, track-scoped aria-label, ArrowUp/Down ±1, Shift+Arrow ±10 | Frontend | 2026-05-14 |
| FX badge click opens PluginChainPanel for selected track | Frontend | 2026-05-14 |
| PanKnob center detent: ±4 unit dead zone snaps to 0 during drag; 2px notch indicator at center | Frontend | 2026-05-14 |
| CI tightened: --noUnusedLocals --noUnusedParameters enforced at typecheck step | Tech Lead | 2026-05-14 |
| 3 unused variable TS errors fixed (rawY, _instrId, showInvite) — CI green | Frontend | 2026-05-14 |

## Done ✓ — Sprint 1 (closed 2026-05-14)

| Task | Completed by | Date |
|------|--------------|------|
| Session room UI (arranger + mixer) | Frontend | 2026-05-10 |
| Clip editing (resize, bezier-fade, cut, drag, bounce) | Frontend | 2026-05-10 |
| Playhead animation + seek | Frontend | 2026-05-10 |
| Neve studio theme (knobs, faders, VU, wood) | Frontend | 2026-05-10 |
| Sprint 1 UAT defect triage — 19 defects prioritized | Tech Lead | 2026-05-10 |
| WP-1 defect pass — 16/19 defects fixed | Frontend | 2026-05-10 |
| Backend shared types + API spec + ADR-001 | Backend | 2026-05-10 |
| Audio waveform rendering + procedural synth (7 tracks) | Frontend | 2026-05-10 |
| WP-4 Tech Lead review pass — 6 fixes | Frontend | 2026-05-10 |
| WP-5 ARIA pass | Frontend + Designer | 2026-05-10 |
| WP-6 FX chain view, interactive PanKnob, R/M/S, empty state | Frontend + Designer | 2026-05-10 |
| WP-7 PluginChainPanel 720px overlay with slide animation | Frontend | 2026-05-10 |
| UAT WP-8 bug fixes (formatDb, mute opacity, cold-load waveform) | Frontend | 2026-05-11 |
| Figma DSM completeness pass (Clip, Toolbar, StatusBar, MixerPanel, FXChainPanel, atoms) | Designer | 2026-05-11 |
| VU meters — live post-fader RMS, 60fps rAF, peak-hold, transient glow | Frontend | 2026-05-14 |
| VU heartbeat startup — bloom + staggered motorized recall on mount | Frontend | 2026-05-14 |
| Bezier fade curves — draggable midpoint handle, crossfade symmetry lock | Frontend | 2026-05-14 |
| Plugin rack browser — wood cabinet, metal faceplates, power LED, drag-to-reorder, PluginBrowser popover | Frontend | 2026-05-14 |
| FX chain panel viewport positioning fix (overflow:clip #root BFC bug) | Frontend | 2026-05-14 |
| PRD v1.0 + Roadmap | PM | 2026-05-14 |
| GitHub sprint infrastructure (milestones, labels, issue templates, Projects board) | PM | 2026-05-14 |
| Sprint 1 screenshot archive | UAT | 2026-05-14 |

## Blocked

| Agent | Blocker | Who can unblock |
|-------|---------|-----------------|
| — | No current blockers | — |

---

## Sprint 2 Goals

1. **WebSocket presence + transport sync** (#19) — ✅ Done
2. **Track locking + JWT role enforcement** (#20) — 🟡 Not started
3. **Plugin chain in audio graph** (#7) — ✅ Done
4. **Track ownership polish** (#8) — ✅ Done

## Sprint 2 Exit Criteria

- [x] Fastify scaffold committed, tsc-clean, WebSocket transport routing active
- [x] Plugin enable/disable toggle audibly changes track sound
- [x] All interactivity gaps in mix-view.md table closed
- [ ] Track locking enforced server-side; Viewer role enforced via JWT (#20)
- [ ] Zero P0 or P1 defects at UAT sign-off

---

## Handoff Protocol

1. **FE / BE → Tech Lead:** Drop a file in `docs/handoffs/` describing what was built, files changed, and what to review.
2. **Tech Lead → PM:** Updates STATUS.md "Done" table on approval.
3. **UAT:** Runs after each work package. Defects logged to `docs/defects.md`.
4. **PM:** Closes GitHub issues and updates this file.

## Shared Directories

| Path | Purpose |
|------|---------|
| `docs/specs/` | Feature specs and API contracts |
| `docs/specs/PRD.md` | Full product requirements (v1.1) |
| `docs/specs/ROADMAP.md` | Sprint-by-sprint roadmap (v1.1) |
| `docs/adr/` | Architecture Decision Records (Tech Lead writes) |
| `docs/handoffs/` | Agent → Tech Lead review requests |
| `STATUS.md` | This file — single source of truth |
| `screenshots/` | Visual archive per sprint |
| `server/` | Fastify backend scaffold (TypeScript, tsc-clean) |
