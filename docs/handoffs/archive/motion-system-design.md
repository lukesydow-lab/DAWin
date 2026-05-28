# Handoff: Motion System + Figma DS Representation

**Specs:**
- [`docs/specs/motion-system.md`](../specs/motion-system.md) — the canonical motion system (principles, easing catalog, duration scale, per-feature motion specs for heartbeat startup and zoom motion)
- [`docs/specs/motion-figma-ds.md`](../specs/motion-figma-ds.md) — how the motion system lives in the Figma DS file

**Prototypes (engineering reference):**
- [`/motion-prototypes/02-startup-heartbeat-staggered.html`](../../public/motion-prototypes/02-startup-heartbeat-staggered.html)
- [`/motion-prototypes/03-vu-meter-animation.html`](../../public/motion-prototypes/03-vu-meter-animation.html)
- [`/comps/waveform-zoom-motion.html`](../../public/comps/waveform-zoom-motion.html)

**Date:** 2026-05-15
**Approved:** 2026-05-15
**Designer:** UX/UI Agent
**Routed to:** Tech Lead
**Status:** ✅ APPROVED — ready for engineering assignment + Figma DS update

---

## What this covers

Two related pieces that together close the loop on motion delivery:

1. **The motion system itself** — the previously-undocumented foundation. Principles, named easing curves with cubic-bezier values, a duration token scale, and formal specs for the two big motions that only existed as prototypes (heartbeat startup + zoom/reset).
2. **How it represents in Figma** — a Motion section in the design system file with three pages (Principles, Easing Catalog, Duration Tokens), a Motion variable collection alongside the color tokens, and a standardized per-component annotation pattern.

---

## Tech Lead actions requested

### A — Documentation tree
- [ ] **Add the two specs** to the project's documentation index (wherever `docs/specs/*` is surfaced for engineering)
- [ ] Cross-link from `motion-system.md` ↔ the per-feature specs that reference motion (`plugin-browser.md`, `vu-meter-motion.md`, `crossfade-direct-manipulation.md`) so engineering can navigate from any motion mention to the central token definitions

### B — Figma DS update
- [ ] **Create the Motion variable collection** in the DAWin Design System file (`o4IccZFYzEvsHe3dVcco7X`) using Tokens Studio plugin. The 12 variables are listed in [`motion-figma-ds.md`](../specs/motion-figma-ds.md) §2.
- [ ] **Publish the collection** so concept files and component files can reference it.
- [ ] **Build the three Motion pages** in the DS file (Principles, Easing Catalog, Duration Tokens). Layout exact specs are in `motion-figma-ds.md` §"Page layout."
- [ ] **Start propagating Motion annotations** on existing component frames (Button, Fader, Avatar, Badge, etc.) using the standardized annotation pattern in `motion-figma-ds.md` §3. Begin with 1–2 components as a validation pass, then scale.

### C — Engineering implementation
- [ ] **Extract motion tokens into `src/tokens.ts`** alongside the color tokens (planned refactor — `C` is currently inline in `App.tsx`). Source: §8 of `motion-system.md`. This is the **foundation step** — every per-component motion spec references these by name.
- [ ] **Refactor existing motion code to reference the tokens.** Current implementations of fade transitions, hover animations, popover opens, etc. use hardcoded durations and bezier strings. Replace with `motion.duration.*` and `motion.easing.*` references.
- [ ] **Implement spring physics utility** for the reset motion. Cannot be done with CSS — needs a `requestAnimationFrame`-driven JS implementation of the damped harmonic oscillator described in `motion-system.md` §6 and `waveform-zoom-motion.html`.
- [ ] **Implement the heartbeat startup sequence.** The spec in `motion-system.md` §5 + the prototype at `/motion-prototypes/02` give engineering a complete reference. Hook to the session-load lifecycle.

---

## Key decisions locked

1. **Seven duration tokens, seven easing curves.** No more, no less. Components reference tokens by name; raw values are forbidden after the migration. Same discipline as color tokens.
2. **Spring physics is JS-driven, not CSS.** No CSS cubic-bezier can represent damped harmonic motion with visible secondary oscillation. The spring used in zoom reset (`ζ=0.5, ω=10`) requires a JS animation loop.
3. **Figma + HTML prototype split.** Figma documents *what* and *why* (principles + tokens + per-component annotations). HTML prototypes are the source of truth for *how it feels* (the live motion). Figma annotations link OUT to prototypes.
4. **Reduced motion handling is consistent across the system.** Functional motion (VU attack/decay, fader value changes) is preserved; decorative motion (glow flares, shimmer sweeps, hover lifts) is disabled. Heartbeat startup degrades to simple recall.
5. **Motion tokens flow through the same sync pipeline as color tokens.** Whatever workflow we lock in for color (MCP-mediated or REST API), motion uses the same. One pipeline, two collections.

---

## Open questions for Tech Lead planning

- [ ] **Heartbeat startup hook point.** Where in the React component tree does the startup sequence kick off? My guess: `App.tsx` `useEffect` on first mount, with a flag to skip on subsequent re-renders. Confirm or specify a different hook.
- [ ] **Spring utility implementation choice.** Native `requestAnimationFrame` (no dependencies, 30 lines of code) vs. `framer-motion` (battle-tested, adds ~30kb gzipped to the bundle) vs. `react-spring` (similar). My recommendation: native rAF — the spring needs are narrow and we want full control. But Tech Lead's call.
- [ ] **Motion token codegen.** When `src/tokens.ts` is the destination for both color and motion tokens, the codegen script needs to handle both collections. Worth a quick design pass before writing.
- [ ] **Annotation pattern in Figma — manual or scripted?** Adding Motion annotations to every component frame is tedious. Tokens Studio doesn't help here. Question: do we hand-build them, or write a Figma plugin to template them based on a JSON manifest? My instinct: hand-build the first 5–10, then evaluate.

---

## Open question for PM

- [ ] **Scope of Phase 1.** This is a substantial body of work — 7 duration tokens, 7 easing curves, two big choreographed motions, plus Figma DS work. Are we landing all of it in one engineering sprint, or do we phase it? My recommendation:
  - **Phase 1 (1 sprint):** Token extraction, replace hardcoded durations/easings in existing code, build the spring utility. Quiet refactor, no user-facing change. Foundation for everything else.
  - **Phase 2 (1 sprint):** Implement heartbeat startup + zoom-with-overshoot + zoom reset spring. User-facing payoff lands here.
  - **Phase 3 (parallel with 1+2):** Figma DS updates by the Designer (me, via Tokens Studio) — doesn't block engineering.

---

## What this DOES NOT include

These remain to be designed in future passes (not blocking this handoff):
- **Button compression + light-bloom motion** for the studio-rack button aesthetic (mentioned in plugin browser spec but not yet specced separately)
- **Collaborator avatar appear/leave** animation
- **Clip drop "thunk"** when a clip is dropped into the arranger grid
- **Record arm sustained pulse** rhythm + intensity tokens

Each of these can be specced separately when prioritized.

---

## Confirmation

- [x] Read all existing motion-touching specs (plugin-browser, vu-meter, crossfade) — no contradictions
- [x] Spec aligns with all three working prototypes
- [x] Token names follow the same convention as color tokens (`namespace.subgroup.variant`)
- [x] No conflicting handoffs in `docs/handoffs/`
- [x] Approval status set on both specs and this handoff
