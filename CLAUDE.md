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

### Model selection for sub-agents

When spawning a sub-agent, always set the model explicitly. Default to the least capable model that can complete the task at the required quality level.

| Model | Use when |
|---|---|
| `haiku` | Status updates, docs edits, issue/label creation, simple formatting, low-risk file moves, checklist generation |
| `sonnet` | Standard feature implementation, component scaffolding, spec writing, code review, Figma DSM updates, UAT runs, backend contract drafting |
| `opus` | **Requires PM approval before use** — see rule below |

Opus is for tasks where the cost of a wrong answer outweighs the cost of the model. Reserve it for:
- Highly technical audio engine or Web Audio API work where mistakes cascade
- Complex multi-file architectural refactors with downstream risk
- High-fidelity UI work where design precision is load-bearing (e.g. pixel-accurate DSM components, motion specs)
- Backend contract design that the frontend will stub against for weeks

Do not use opus for tasks that are merely large or time-consuming. Size is not the criterion — risk of expensive rework is.

**Opus approval rule:** Before assigning `opus` to any sub-agent, stop and tell the PM:
1. Which agent and what task
2. Why `sonnet` is not sufficient — name the specific risk, not just "it's complex"
3. What rework would look like if `sonnet` got it wrong

Do not proceed until approval is given. If the PM is not available, default to `sonnet` and flag the decision in the handoff.

---

## Source of truth

| Question | Where to look |
|---|---|
| Where do I start? (outside collaborators / new agents) | `handoff-documentation/DAWin_CURRENT_CONTEXT.md` |
| What is the current project state? | `handoff-documentation/DAWin_HANDOFF.md` |
| What components exist and where? | `handoff-documentation/DAWin_PROJECT_STATE.md` |
| What is actively in progress? | `STATUS.md` |
| What did Sprint N ship? | `docs/sprints/sprint-NN.md` (e.g. `sprint-05.md`) |
| What is the active sprint work order? | `docs/handoffs/active/` |
| What are the architecture decisions? | `docs/adr/README.md` then the specific ADR |
| What specs must I implement? | `docs/specs/README.md` then the specific spec |
| Historical handoffs (Sprints 1–5) | `docs/handoffs/archive/` — do not treat as current instructions |
| What is the sprint close process? | `docs/process/sprint-close-protocol.md` |

**Conflict resolution:** Source-of-truth hierarchy wins first (see `DAWin_CURRENT_CONTEXT.md`). Only `Status: Current` documents are authoritative. If two same-tier documents conflict, the one with the newer in-document `Last updated` date wins. If still unclear, stop and ask the PM.

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

### Designer review gate (process — no exceptions)
- No frontend implementation of any user-visible feature may begin without a Designer spec in `docs/specs/<feature>.md`
- The PM must link the spec in every Frontend Engineer work order
- The Frontend Engineer must stop and notify PM if assigned a frontend task with no spec on file
- The Tech Lead must confirm a spec link before approving any FE work order
- UAT must verify implementation matches the spec; deviations are P2 minimum

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

## Branch strategy

| Branch | Purpose | Deploy | How to merge |
|---|---|---|---|
| `main` | Production — what real users see | Vercel production + Railway production | PR from `beta` only; CI must pass |
| `beta` | Staging — integration testing before production | Vercel beta + Railway staging | PR from `feature/*` or `fix/*`; CI must pass |
| `feature/sprint-N-description` | Feature work | None | PR to `beta` when complete and tsc-clean |
| `fix/description` | Bug fixes | None | PR to `beta`, then fast-track to `main` |

**Rule:** Nothing ever goes directly to `main`. All changes go `feature/* → beta → main`.

See `docs/process/development-workflow.md` for the full workflow with flowcharts.

---

## Commit protocol

Every commit from an agent must:
1. Pass `tsc --noEmit` (no type errors)
2. Include a meaningful message: `feat/fix/chore: <what changed and why>`
3. Include in the commit body: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

Do not commit `node_modules/`, `.env` files, or files outside `src/` and `docs/` unless explicitly instructed.

---

## Handoff protocol

0. **Before FE work order:** Designer spec must exist in `docs/specs/` — PM confirms link before issuing to FE
1. Agent completes work → drops a file in `docs/handoffs/<feature>-<agent>.md`
2. Tech Lead reviews → updates `STATUS.md` Done table on approval
3. UAT runs after each work package → defects logged to `docs/defects.md` with priority and file:line
4. PM closes the GitHub Issue and updates `STATUS.md`

## STATUS.md update rules

`STATUS.md` is the single source of truth for what is happening right now. It must stay current at all times — not just at sprint close. Every agent is responsible for updating it at the moment their status changes.

**When to update STATUS.md:**

| Moment | What to update |
|---|---|
| Agent picks up a task | Add a row to Active Work table: Agent, Task, Ticket, Status=In Progress, Blocking? |
| Agent completes work and drops handoff | Change Status in Active Work to "Handoff submitted" |
| Tech Lead approves | Remove row from Active Work; add row to the current sprint's Done table |
| UAT finds a defect | Add to `docs/defects.md`; if P0/P1, add a row to the Blocked table in STATUS.md |
| Defect fixed | Remove from Blocked table |
| Sprint closes | Check all sprint exit criteria; move Goals section to history; open next sprint section |

**Rules:**
- Never leave Active Work stale. If a task is done, move it to Done immediately — do not wait for the next sprint review.
- The Done table is append-only and must include enough detail for a stakeholder to understand what shipped without reading the code.
- The Blocked table must be kept current. A blocker that is resolved but still listed is worse than no blocker table.
- `STATUS.md` is written by the Tech Lead only for sprint-level changes. Individual agents update Active Work rows for their own tasks.

## Sprint close protocol

The full sprint close protocol is at `docs/process/sprint-close-protocol.md`. That document is authoritative. The summary below is for quick reference only — follow the full protocol for actual sprint closes.

**Tech Lead owns documentation accuracy at sprint close.** This means: reading every document in the source-of-truth hierarchy, verifying it against the actual codebase state, adding `Status:` markers, correcting stale content (wrong sprint numbers, stale ticket states, resolved blockers still listed), and creating the documentation sync commit. The PM defines scope and product decisions; the Tech Lead verifies that implementation reality, repo state, and documentation all match.

**Documentation sync commit format:**
```
docs: sync project documentation after Sprint N closeout

- Sprint N completed: YYYY-MM-DD
- Major features shipped: [list]
- Docs updated: [list]
- Next sprint: Sprint N+1 ([status])
- Known blockers: [list or "none"]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Key files to update at sprint close (full checklist in `docs/process/sprint-close-protocol.md`):**
- [ ] `handoff-documentation/DAWin_CURRENT_CONTEXT.md` — update sprint, recent features, blockers, next steps
- [ ] `handoff-documentation/DAWin_HANDOFF.md` — update sprint header, implementation status, blockers, open questions, recent decisions, recommended next steps
- [ ] `handoff-documentation/DAWin_PROJECT_STATE.md` — update sprint header, component map (if changed), sprint history, active sprint ticket sequence, current App state snapshot
- [ ] `STATUS.md` — mark sprint exit criteria all closed, move items to Done table, open next sprint section
- [ ] `docs/adr/` — confirm any new ADRs from the sprint are committed
- [ ] Warning banner at top of `DAWin_PROJECT_STATE.md` updated to reflect new sprint status
- [ ] All docs have a `Status:` marker in their header
- [ ] Documentation sync commit created

**No sprint is CLOSED until the Tech Lead has completed this pass and created the sync commit.**

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
