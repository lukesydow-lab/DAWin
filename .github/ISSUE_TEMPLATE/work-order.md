---
name: Work Order
about: New feature, fix, or spec task for the agent team
title: "[Agent]: Short description"
labels: ''
assignees: ''
---

## Work Order

**Agent(s):** <!-- Designer / Frontend / Backend / Tech Lead / UAT -->  
**Priority:** <!-- P0 blocker / P1 high / P2 medium / P3 low -->  
**Milestone:** <!-- Sprint 1 / Sprint 2 -->  
**Depends on:** <!-- Issue # or "none" -->

---

### Problem statement

<!-- What user-facing problem does this solve? One paragraph. Do not describe the solution. -->

### User story

As a <!-- musician / collaborator / viewer / producer -->,  
I want to <!-- do specific thing -->,  
So that <!-- specific outcome -->.

### Acceptance criteria

- [ ] <!-- Specific, testable, user-visible criterion -->
- [ ] <!-- Another criterion — each must be verifiable by the UAT agent -->

### Scope — IN

- <!-- What this work order explicitly covers -->

### Scope — OUT (defer)

- <!-- What this work order does NOT cover -->

### Design constraints

- Use `C.*` design tokens — no hardcoded hex values
- Collaborator colors must appear on: <!-- specific elements -->
- Interactive states required: <!-- hover / focus / active / disabled / empty / error -->
- ARIA labels needed for: <!-- icon-only controls -->
- DAW conventions to honor: <!-- keyboard shortcuts, timeline behavior -->

### Technical notes

<!-- File paths, line numbers, relevant specs, perf risk callouts -->

### Open questions (must be answered before implementation)

1. <!-- Question → who answers it -->

### Definition of done

- [ ] `tsc --noEmit` passes
- [ ] UAT agent has validated all acceptance criteria
- [ ] Committed with `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- [ ] Handoff dropped to `docs/handoffs/` for Tech Lead review
- [ ] `STATUS.md` updated
- [ ] This issue closed
