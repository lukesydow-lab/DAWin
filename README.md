# DAWin

> "Figma for music production" — a browser-based collaborative DAW prototype.

A desktop-first collaborative digital audio workstation where musicians share a live session with track ownership, real-time presence, role-based access, and a professional studio aesthetic. Built as a React/TypeScript single-page app with Web Audio API playback.

---

## Current state

This is an active prototype. The core session room is fully functional — arranger, mixer, audio playback, VU meters, FX chain. No backend exists yet; all data lives in seed state in `src/App.tsx`. Real-time sync is planned for Sprint 2.

**Source of truth for current implementation:**
- [`handoff-documentation/DAWin_HANDOFF.md`](handoff-documentation/DAWin_HANDOFF.md) — full project context, architecture, agent roles, open questions, and work order format
- [`handoff-documentation/DAWin_PROJECT_STATE.md`](handoff-documentation/DAWin_PROJECT_STATE.md) — technical snapshot: component map, audio graph, feature status, git history
- [`STATUS.md`](STATUS.md) — live sprint board

---

## What's built

- **Arranger** — 7 tracks, 32 bars, clip drag/resize/fade/cut, right-click context menu, playhead seek
- **Mixer** — per-track fader (log curve), pan, mute, solo, FX badge; master bus with real GainNode
- **VU meters** — live post-fader RMS via AnalyserNode, attack/decay physics, peak-hold dot, transient glow
- **FX chain** — 720px overlay panel, plugin cards with enable toggle, empty state with signal flow diagram
- **Audio playback** — 7 procedurally synthesized instruments via Web Audio API (no sample files)
- **Neve studio theme** — wood panels, metallic faders, dark professional aesthetic
- **Collaborator color model** — each user's hex color tints their tracks, clips, mixer strip, and avatar throughout

---

## Getting started

```bash
npm install
npm run dev
# → http://localhost:5173
```

Requires Node 22. No backend, no environment variables, no configuration needed.

---

## Repo structure

```
src/
  App.tsx                  # All components (single file — intentional for early sprint)
  App.css                  # CSS animations and wood-panel class
public/
  motion-prototypes/       # Standalone HTML animation references
  comps/                   # Waveform composition studies
docs/
  specs/                   # Feature specs (PM/Designer write; agents implement)
  handoffs/                # Agent → Tech Lead review requests
  adr/                     # Architecture Decision Records
handoff-documentation/
  DAWin_HANDOFF.md         # Full project handoff for AI context
  DAWin_PROJECT_STATE.md   # Technical state snapshot
.github/
  workflows/ci.yml         # TypeScript typecheck + Vite build on every PR
  ISSUE_TEMPLATE/          # Work Order and Bug Report templates
daw-prototype/             # Secondary scaffold (experimental — not the main app)
supabase/                  # Figma webhook edge function (infrastructure)
scripts/                   # Figma token export utility
```

> **Note:** `daw-prototype/` is an experimental secondary scaffold and is not the active prototype. The active prototype is the root `src/` directory.

---

## Agent team

This project is built by a multi-agent AI team orchestrated in Claude Code:

| Agent | Owns |
|---|---|
| Product Manager | Feature planning, work orders, prioritisation |
| Tech Lead | Architecture decisions, code review, ADRs |
| Frontend Engineer | Everything in `src/` |
| Designer | Specs in `docs/specs/`, Figma DSM |
| Backend Engineer | API contracts, data models (backend not yet built) |
| UAT | Test scenarios, defect register |

Work orders use the GitHub Issue template. All agent commits include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`.

---

## Figma Design System

**File:** GDAW — Design System  
**Key:** `o4IccZFYzEvsHe3dVcco7X`  
**URL:** https://www.figma.com/design/o4IccZFYzEvsHe3dVcco7X/GDAW---Design-System-

---

## Sprint 1 status

See open [GitHub Issues](https://github.com/lukesydow-lab/DAWin/issues) for all active blockers and backlog items, tagged by agent and priority.
