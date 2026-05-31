# Handoffs

**Status: Current**
**Last updated:** 2026-05-31

Agent-to-agent work records and active work orders.

## Active Work Orders

Work orders for sprints currently in progress. Agents executing sprint work should read these first.

| File | Sprint | Purpose |
|------|--------|---------|
| — | Sprint 9 | No active implementation work orders yet. Sprint 9 is planning. PM + Tech Lead must issue work orders before agents begin. |

## Archive

`archive/` contains completed handoff records from previous sprints. These are historical work records — do not treat them as current instructions. They are preserved for traceability only.

Known archived example:

- [archive/sprint-06-backend-workorder.md](archive/sprint-06-backend-workorder.md) — historical Sprint 6 backend work order.

## Work order rule

A new active work order should be added under `docs/handoffs/active/` only after:

1. PM confirms sprint scope.
2. Tech Lead confirms architecture gates.
3. Designer spec exists for user-visible work.
4. Acceptance criteria and UAT expectations are clear.
