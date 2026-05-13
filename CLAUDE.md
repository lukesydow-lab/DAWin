# DAWin — Project Standing Instructions

These instructions apply to every agent and every session. Read this before starting any task.

---

## Resource stewardship

Read and follow `.claude/TOKEN_EFFICIENCY.md`.

The goal is not to be cheap. The goal is to spend tokens intelligently while preserving quality.

Before starting any task, identify:
1. the required outcome
2. the smallest reliable context needed
3. what context can be ignored
4. whether the task should be split
5. whether clarification would prevent meaningful rework

Do not over-read the repo, inspect unrelated files, process images, or use heavy reasoning modes unless the task requires it.

Never sacrifice correctness, accessibility, maintainability, design quality, code quality, validation, or source-of-truth alignment to save tokens.

Be frugal with exploration, not with quality.

---

## Source of truth

| Question | Where to look |
|---|---|
| What is the current project state? | `handoff-documentation/DAWin_HANDOFF.md` |
| What components exist and where? | `handoff-documentation/DAWin_PROJECT_STATE.md` |
| What is actively in progress? | `STATUS.md` |
| What are the architecture decisions? | `docs/adr/` |
| What specs must I implement? | `docs/specs/<feature>.md` |
| What has been handed off for review? | `docs/handoffs/<feature>.md` |

When these documents conflict, the most recently dated one wins. If still unclear, stop and ask the PM.

---

## Non-negotiable constraints

### Code
- All components in `src/App.tsx` until a second screen is scaffolded — do not create new files in `src/` without Tech Lead approval
- TypeScript strict mode — no `any`; use `unknown` + TODO if type is genuinely unknown
- No external state library (no Redux, Zustand, Jotai) without PM approval
- No CSS modules, no styled-components, no `@apply` — Tailwind v4 utility classes + inline `style` for dynamic values only
- One shared `AudioContext` (`_audioCtx` via `getAudioCtx()`) — do not create a second one
- Run `tsc --noEmit` before every commit

### Design
- Never hardcode hex color values — always use `C.*` tokens from `src/App.tsx`
- Collaborator colors are stored on track/user objects and applied via inline `style` props — never via Tailwind classes
- Every new surface must honor the collaborator color model (tinting tracks, clips, strips, avatars)
- Desktop-first — minimum 1280px; do not design for smaller viewports until mobile capture is formally scoped
- Dense information density is correct for a pro audio tool — do not add whitespace "to make it cleaner"

### DAW conventions (muscle memory — do not break)
- Spacebar = play/pause
- Stop preserves playhead position; Return-to-Zero resets it
- VU meters are post-fader (IEC 60268-17) — meter tap goes after the GainNode
- Fader curve is logarithmic with unity gain at ~75% travel

### Ownership boundaries
- The Designer agent may not write to or edit any file in `src/` — ever
- The Frontend Engineer may not write to `docs/adr/` or `STATUS.md`
- `STATUS.md` is written by the Tech Lead only
- `docs/adr/` is written by the Tech Lead only
- `docs/specs/` is written by the Designer or PM
- `docs/handoffs/` is written by any agent dropping work for Tech Lead review

---

## Commit protocol

Every commit from an agent must:
1. Pass `tsc --noEmit` (no type errors)
2. Include a meaningful message: `feat/fix/chore: <what changed and why>`
3. Include in the commit body: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

Do not commit `node_modules/`, `.env` files, or files outside `src/` and `docs/` unless explicitly instructed.

---

## Handoff protocol

1. Agent completes work → drops a file in `docs/handoffs/<feature>-<agent>.md`
2. Tech Lead reviews → updates `STATUS.md` Done table on approval
3. UAT runs after each work package → defects logged to `docs/defects.md` with priority and file:line
4. PM closes the GitHub Issue and updates `STATUS.md`

---

## Key layout constants (do not change without updating the Figma DSM)

```
BAR_W = 72      TRACK_H = 64     RULER_H = 24
HANDLE_W = 8    FADE_HDL_W = 12  TRANSPORT_H = 52    STATUS_BAR_H = 28
```

---

## Figma Design System

File key: `o4IccZFYzEvsHe3dVcco7X`
URL: https://www.figma.com/design/o4IccZFYzEvsHe3dVcco7X/GDAW---Design-System-
Canonical grid: components at x=380, section gap=120px, component gap=40px
All components must be `COMPONENT_SET` nodes — plain frames do not persist between plugin executions.
