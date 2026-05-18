# DAWin — Sprint Close Protocol

**Status: Current**
**Last updated:** 2026-05-18
**Owner:** Tech Lead
**Version:** 1.0

This is the authoritative process document defining what must happen at the end of every sprint before it can be marked CLOSED. The Tech Lead owns execution. The PM owns scope and product decisions but may delegate mechanical doc updates to a `haiku` sub-agent.

---

## 1a. Sprint Closeout Checklist

Every sprint must pass all of the following before being marked CLOSED. No exceptions.

### Tickets and code

- [ ] All sprint tickets are either: closed (done), explicitly deferred to a named future sprint, or moved to the backlog with justification
- [ ] Any ticket that shipped but was not in the original sprint plan is documented in the Done table
- [ ] Any ticket that was in the plan but did not ship is moved with a reason: blocked, descoped, or deferred
- [ ] `tsc --noEmit --noUnusedLocals --noUnusedParameters` passes on both frontend and backend

### STATUS.md

- [ ] Header line says `Sprint N CLOSED` and `Sprint N+1 PLANNING` (or ACTIVE if already started)
- [ ] Sprint N Active Work table is empty (all rows moved to Done or Blocked)
- [ ] Sprint N Done table is complete — all approved tasks listed with agent and date
- [ ] Blocked table reflects only current open blockers (no resolved blockers left in)
- [ ] Sprint N Exit Criteria section is checked off (all items have `[x]` or a justified `[ ]` with explanation)
- [ ] Sprint N+1 Active Work section exists with ticket rows (even if status is "Not started")
- [ ] No section in STATUS.md describes an older sprint as "Active" or "in progress"

### DAWin_PROJECT_STATE.md

- [ ] Sprint header at top of file says the correct current sprint and status
- [ ] Warning banner updated: lists closed sprints, states which sprint is active
- [ ] Sprint history section has a new row for Sprint N (summary, date closed)
- [ ] Sprint N is listed as `CLOSED` in the sprint history; Sprint N+1 as `ACTIVE` or `PLANNING`
- [ ] Component map reflects any new or changed components from Sprint N
- [ ] Key state snapshot updated if App state changed during Sprint N
- [ ] "Sprint N+1 ACTIVE" ticket sequence listed
- [ ] No section incorrectly claims Sprint N-1 or earlier as active
- [ ] `Status: Current` marker present in file header

### DAWin_HANDOFF.md

- [ ] Sprint header reflects the current sprint (not the just-closed one)
- [ ] Warning banner at top updated: closed sprints listed, current sprint stated
- [ ] Section 10 (Implementation Status) updated: items that shipped in Sprint N marked complete
- [ ] Section 10 "What is not yet implemented" updated: remove items that shipped, add new gaps
- [ ] Section 11 (Active sprint) updated to Sprint N+1 with correct ticket sequence
- [ ] Section 12 (Known Blockers) updated: resolved blockers removed, new ones added
- [ ] Section 13 (Open Questions) updated: resolved questions removed, new ones added
- [ ] Section 14 (ADR History) updated: any new ADRs from Sprint N added
- [ ] Section 18 (Recommended Next Steps) rewritten for Sprint N+1
- [ ] GitHub milestones section updated (Sprint N closed, Sprint N+1 open if applicable)
- [ ] `Status: Current` marker present in file header

### ROADMAP.md

- [ ] Sprint N marked CLOSED with the actual close date
- [ ] Sprint N features listed under "What shipped" with checkmarks
- [ ] Sprint N Exit Criteria all checked off
- [ ] Sprint N+1 section exists and is marked ACTIVE or PLANNING
- [ ] Any open decisions resolved during Sprint N are marked resolved in the Open Decisions table
- [ ] `Status: Current` marker present in file header

### PRD.md

- [ ] `Sprint context:` field in the header updated to Sprint N+1
- [ ] Any product decisions finalized in Sprint N reflected (e.g., architecture changes, descoped features)
- [ ] `Status: Current` marker present in file header

### ADRs

- [ ] Any architecture decisions made during Sprint N have a corresponding ADR in `docs/adr/`
- [ ] Each new ADR has: Status (Accepted/Proposed/Deprecated), Date, Deciders, and Supersedes field
- [ ] No ADR claims a superseded decision is still active

### Specs in docs/specs/

- [ ] Every spec touched during Sprint N has an accurate status marker: `Status: Current` (if fully implemented), `Status: Partial` (partially implemented), `Status: Draft` (not yet implemented), `Status: Historical Archive` (superseded by actual implementation)
- [ ] Any spec that diverges from the shipped implementation is noted with what changed
- [ ] No spec for a completed feature is still labeled "Sprint N — pending" or "not started"

### Defects

- [ ] `docs/defects.md` updated: all P0/P1 defects from Sprint N are either `fixed` or have an explicit `deferred` note with the target sprint
- [ ] STATUS.md Blocked table reflects only active P0/P1 defects; nothing from closed sprints

### Documentation staleness

- [ ] Every file in the source-of-truth hierarchy (see §1b) has a `Status:` marker in its header
- [ ] No document incorrectly shows an older sprint as the active sprint
- [ ] Date fields in all documents updated to the close date of Sprint N
- [ ] GitHub milestones/issues match documentation state

### Documentation sync commit

- [ ] A dedicated commit created (see §1e for exact format)

---

## 1b. Source-of-Truth Hierarchy

When documents conflict, consult in this order. A higher-numbered document wins when it conflicts with a lower-numbered one on the same fact.

Outside collaborators should read in this order:

1. **`handoff-documentation/DAWin_CURRENT_CONTEXT.md`** — Start here. Single-page summary of current state, sprint, features, and links to everything else. Most concise.

2. **`STATUS.md`** — Authoritative for what is actively in progress right now. Active Work, Blocked, Done tables. Updated by the Tech Lead and individual agents at task boundaries.

3. **`handoff-documentation/DAWin_HANDOFF.md`** — Full product and technical context for AI agents or outside collaborators who need to understand the whole system. Updated at sprint close.

4. **`handoff-documentation/DAWin_PROJECT_STATE.md`** — Technical snapshot: component map, audio graph, App state, sprint history. Updated at sprint close or when architecture changes.

5. **`docs/specs/ROADMAP.md`** — Sprint-by-sprint roadmap. Authoritative for what sprint scope was planned and what shipped.

6. **`docs/specs/PRD.md`** — Full product requirements. Authoritative for what DAWin is, who it is for, and what the full feature set should be.

7. **`docs/adr/`** — Architecture Decision Records. Authoritative for specific technical decisions. Each ADR supersedes prior decisions on the same topic.

8. **`docs/specs/<feature>.md`** — Feature implementation specs. Authoritative for a specific feature's design intent.

9. **`docs/handoffs/<feature>.md`** — Work handoffs from agents. Most recent is authoritative for a specific work package's status.

10. **`docs/defects.md`** — UAT defect register. Authoritative for known bugs, their status, and when they were resolved.

**Tie-breaking rule:** When two documents of equal rank conflict, the most recently dated document wins. If still unclear, ask the PM.

**Documents that are NOT sources of truth:**
- Feature request docs in `docs/handoffs/` from earlier sprints — treat as historical context
- Older sprint goal sections in STATUS.md that remain visible below the Done tables — these are historical record, not active scope

---

## 1c. Document Update Rules

| Document | When to update |
|---|---|
| `STATUS.md` | After every Tech Lead approval of a task; at sprint close; whenever a blocker is added or resolved |
| `DAWin_CURRENT_CONTEXT.md` | At sprint close; whenever a major feature ships that changes what a user can do; whenever outside collaborators would otherwise receive stale context |
| `DAWin_HANDOFF.md` | At sprint close; whenever outside collaborators would otherwise receive stale context about the product or team |
| `DAWin_PROJECT_STATE.md` | At sprint close; whenever architecture changes (new components, new audio graph nodes, significant App state changes) |
| `ROADMAP.md` | When sprint scope changes; when a sprint closes; when product-level decisions are made that affect the roadmap |
| `PRD.md` | When product requirements change; at sprint close to update the sprint context header |
| ADRs | When an architecture decision is made — write the ADR before implementation begins if possible; never retroactively after the fact unless documenting a decision already shipped |
| `docs/specs/<feature>.md` | When a spec is written (before implementation); when implementation deviates from the spec; when a feature is fully shipped (mark it Current/complete) |
| `docs/defects.md` | When UAT finds any defect (add immediately); when a defect is fixed (update status); at sprint close (confirm all Sprint N items are resolved or explicitly deferred) |

---

## 1d. Staleness Markers

Every document in the source-of-truth hierarchy must have one of these status markers in its header. The marker must be the second or third line of the document.

| Marker | Meaning |
|---|---|
| `Status: Current` | This document reflects the actual state of the project as of its Last updated date. Authoritative. |
| `Status: Draft` | This document has not yet been reviewed or validated. Do not treat as ground truth. |
| `Status: Partial` | This document covers some but not all of what it claims to cover. Note which sections are incomplete. |
| `Status: Superseded by [filename]` | This document has been replaced. Read the named document instead. Do not act on this document's content. |
| `Status: Deprecated` | This document's subject matter is no longer in scope or has been removed from the product. Keep for reference only. |
| `Status: Historical Archive` | This document describes a completed sprint, closed feature, or past state. Do not treat any "active" or "in progress" language as current. |

**Rule:** If a document does not have a Status marker, it must be treated as Draft by any reader. Tech Lead adds the correct marker as part of the documentation sync.

---

## 1e. Sprint-Close Commit Requirement

Each sprint must end with a dedicated documentation sync commit. This commit is created by the Tech Lead after all other documentation updates are complete.

Commit message format:

```
docs: sync project documentation after Sprint N closeout

- Sprint N completed: YYYY-MM-DD
- Major features shipped: [comma-separated list]
- Docs updated: [list of files touched]
- Next sprint: Sprint N+1 ([status: planning / active])
- Known blockers: [list or "none"]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

This commit must be the last commit before any Sprint N+1 implementation begins. It serves as a clean checkpoint that outside collaborators can verify against.

---

## 2. Who Owns What at Sprint Close

| Responsibility | Owner |
|---|---|
| Define sprint scope, accept/reject features | PM |
| Verify all tickets are correctly closed/deferred | Tech Lead |
| Update STATUS.md (sprint-level changes) | Tech Lead |
| Update DAWin_HANDOFF.md | Tech Lead (substantive); may delegate mechanical sections to `haiku` |
| Update DAWin_PROJECT_STATE.md | Tech Lead |
| Update DAWin_CURRENT_CONTEXT.md | Tech Lead |
| Update ROADMAP.md | PM; Tech Lead verifies accuracy |
| Update PRD.md | PM |
| Write or confirm ADRs | Tech Lead |
| Update spec staleness markers | Tech Lead |
| Update defects.md statuses | Tech Lead (with UAT input) |
| Create the documentation sync commit | Tech Lead |

**Tech Lead documentation ownership rule:** The Tech Lead owns final documentation accuracy at sprint close. This means: reading every doc in the source-of-truth hierarchy, verifying it against the actual codebase state, adding Status markers, correcting stale content, and creating the documentation sync commit. The PM defines scope and product decisions; the Tech Lead verifies that implementation reality, repo state, and documentation all match.

---

## 3. Common Failure Modes (and how to catch them)

| Failure | How to catch |
|---|---|
| DAWin_HANDOFF.md still says "Sprint 4 Active" after Sprint 5 closes | Check the warning banner and Section 11 header |
| ROADMAP.md shows Sprint 2 as "Active" | Check each sprint section header for "Active" language |
| STATUS.md Active Work table has rows from 2 sprints ago | Read every row; if the sprint number in the ID is older than current, it's stale |
| A spec says "Sprint 4 — pending" for something that shipped in Sprint 4 | Cross-reference the Done table in STATUS.md against all `pending` or `not started` labels in specs |
| An ADR is referenced in docs but not committed in `docs/adr/` | `ls docs/adr/` and verify every ADR mentioned in handoffs has a corresponding file |
| Outside collaborator reads old docs and acts on stale priorities | `DAWin_CURRENT_CONTEXT.md` must be the first thing they read; it must have a "historical docs" warning |
