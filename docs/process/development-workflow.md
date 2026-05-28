# DAWin — Development Workflow

**Status: Current**
**Last updated: 2026-05-28**

This document describes how features move from idea to production, how branches are used, how tests are run, and how deploys work. Every person — human or agent — joining this project should read this first.

---

## Branch Strategy

```
main          ← production (protected — PR required, CI must pass)
  └── beta    ← staging / integration testing (protected — CI must pass)
        └── feature/sprint-N-description   ← feature work
        └── fix/description                ← bug fixes
```

**Rules:**
- Nothing goes directly to `main` — ever. All changes arrive via PR from `beta`.
- Feature branches merge into `beta` first. Once tested, `beta` → `main` via PR.
- Hotfixes may go `fix/*` → `beta` → `main` in fast succession, but must pass CI and UAT.
- Branch names: `feature/sprint-9-recording`, `fix/sprint-8-ws-handler`, etc.

---

## Feature Development Flow

```mermaid
flowchart TD
    A([Feature idea / FR]) --> B[PM adds to docs/features/]
    B --> C{Needs Designer spec?}
    C -->|Yes — all UI features| D[Designer writes docs/specs/feature.md]
    C -->|No — backend/infra only| E[Tech Lead writes ADR if needed]
    D --> F{PM approves spec?}
    F -->|No| D
    F -->|Yes| G[PM issues work order to agent]
    E --> G
    G --> H[Agent creates feature/sprint-N-name branch]
    H --> I[Agent implements + passes tsc]
    I --> J[Agent drops handoff in docs/handoffs/active/]
    J --> K[Tech Lead reviews]
    K -->|Changes needed| I
    K -->|Approved| L[Open PR: feature/* to beta]
    L --> M{CI passes?}
    M -->|No| I
    M -->|Yes| N[Merge to beta]
    N --> O[UAT tests on beta]
    O -->|Defects found P0/P1| I
    O -->|Pass — zero P0/P1| P[Open PR: beta to main]
    P --> Q[Merge to main]
    Q --> R([Production deploy])
```

---

## Sprint Cycle

```mermaid
flowchart LR
    A([Sprint N-1 closes]) --> B[PM defines Sprint N scope]
    B --> C[Tech Lead writes ADRs if needed]
    C --> D[Designer writes specs]
    D --> E{All gates satisfied?}
    E -->|No| C
    E -->|Yes| F[PM issues work orders]
    F --> G[Agents implement on feature branches]
    G --> H[PRs to beta]
    H --> I[UAT on beta]
    I -->|Defects P0/P1| G
    I -->|Zero P0/P1| J[PR: beta to main]
    J --> K[Tech Lead closes sprint and docs sync commit]
    K --> A
```

---

## Testing

### Running tests locally

```bash
# Run all unit tests (watch mode)
npm test

# Run once (for CI / pre-commit)
npm run test:run

# Visual test UI
npm run test:ui

# With coverage report
npm run test:coverage
```

### Test locations

```
tests/
  unit/
    utils/       -- pure functions: audio math, transport calculations
    server/      -- InMemoryStorageAdapter, route logic
  setup.ts       -- global setup (jest-dom matchers)
```

### What to test

| Type | Test | Where |
|---|---|---|
| Audio math | `faderToDb`, `fadeGain`, `formatDb`, peak calculation | `tests/unit/utils/audio.test.ts` |
| Storage adapter | All CRUD operations, edge cases, reset | `tests/unit/server/memory-adapter.test.ts` |
| New utility functions | Any pure function added to the codebase | `tests/unit/utils/` |

**What NOT to test** (at this stage): React component rendering, WebSocket event handling, Prisma queries against a real DB. These are covered by UAT and integration testing once the test suite matures.

### CI

Every push and PR runs:
1. `tsc --noEmit --noUnusedLocals --noUnusedParameters` (frontend + backend)
2. `npm run test:run` (all unit tests must pass)
3. `npm run build` (Vite build must succeed)

---

## Environments

| Environment | Branch | Frontend | Backend | Purpose |
|---|---|---|---|---|
| Local dev | any | `localhost:5173` | `localhost:3000` | Development |
| Beta / Staging | `beta` | Vercel beta URL | Railway staging | Integration testing before production |
| Production | `main` | Vercel production URL | Railway production | Live users |

See `docs/guides/deployment.md` for full setup instructions.

---

## Demo and Prototype Protections

Standalone HTML prototypes live in `public/`:
- `public/motion-prototypes/` — VU meter and startup animation prototypes
- `public/comps/` — early component explorations (waveform, plugin browser)

These are **read-only reference material**. Do not modify them — they document design decisions made before they were implemented. If you need a new prototype, create a new file; do not overwrite existing ones.

---

## Hotfix Flow

```mermaid
flowchart TD
    A([P0/P1 defect in production]) --> B[Create fix/description branch from main]
    B --> C[Implement fix]
    C --> D{tsc passes?}
    D -->|No| C
    D -->|Yes| E[Open PR: fix/* to beta]
    E --> F[CI must pass]
    F --> G[UAT verifies fix on beta]
    G -->|Fix confirmed| H[Open PR: beta to main]
    H --> I[Merge — production deploy]
    I --> J[Log to docs/defects.md]
    J --> K([Resolved])
```

---

## Adding a New Agent to the Team

1. Read `handoff-documentation/DAWin_CURRENT_CONTEXT.md` — the single entry point
2. Read `STATUS.md` for current active work
3. Read `CLAUDE.md` for all project constraints and non-negotiable rules
4. Read `docs/process/sprint-close-protocol.md` for sprint process
5. Read this file (`docs/process/development-workflow.md`) for branch and deploy workflow
6. Do not start any work until you have read all five
