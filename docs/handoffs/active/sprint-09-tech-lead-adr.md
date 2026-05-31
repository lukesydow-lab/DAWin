# Work Order: ADR-008 — Zoom State Architecture

**To:** Tech Lead
**From:** PM
**Sprint:** 9
**Date issued:** 2026-05-29
**Priority:** Gate-blocking — FR-02 FE pass 1 (`BAR_W → barW` substitution) is unblocked after this ADR is committed. FR-02 pass 2 (shortcuts + zoom triggers) requires this ADR plus Designer `§Interaction Model`.

---

## Objective

Write `docs/adr/ADR-008-zoom-state-architecture.md` formalizing the zoom state architecture for FR-02 (Arranger Timeline Zoom).

---

## Decision to formalize

The `docs/specs/arranger-zoom.md` spec leaves one architecture question open:

> **Tech Lead must decide in Ticket 3-A** whether `barW` is:
> - **(a) Prop drilling:** computed at App root, passed as a prop to all arranger components ← recommended for single-file constraint
> - **(b) React context:** consumed at each calculation site

**Recommended answer: prop drilling (option a).**

Rationale:
- The single-file constraint (`src/App.tsx`) means all arranger components are in the same file — React context threading adds boilerplate without the cross-file benefit that makes context worthwhile.
- Zoom is local-only in Sprint 9; `zoomX` and `barW` flow in one direction (App root → arranger components). There is no need for deep consumption or avoid-prop-threading.
- The state shape (`number`, `Record<string, number>`) must remain serializable for future WebSocket sync. Prop drilling keeps the data flow visible and easy to audit.

---

## What the ADR must cover

1. **Context** — why zoom state architecture needed a decision (single-file constraint, local-only vs. future sync, avoid mixing patterns).
2. **Options considered** — prop drilling vs. React context (brief; no need to explore Zustand/Redux — those are prohibited by project constraints).
3. **Decision** — prop drilling. `barW` computed at App root as `BAR_W * zoomX`, passed as a prop to arranger components.
4. **Consequences** — every arranger component that uses `barW` receives it as a prop; component signatures change; the pattern is consistent and auditable.
5. **Future sync path** — note that `zoomX` (`number`) is already serializable; when WebSocket sync is added, the App root simply listens for remote zoom updates and calls `setZoomX`.

---

## Format requirements

Follow the format of existing ADRs in `docs/adr/`. Include:
- Title, Status (Accepted), Date, Deciders
- Context
- Decision
- Consequences
- Future considerations

After writing, add a row to `docs/adr/README.md`:
```
| [ADR-008](ADR-008-zoom-state-architecture.md) | Zoom State Architecture (barW prop drilling) | Accepted | 2026-05-29 |
```

---

## Acceptance criteria

- [ ] `docs/adr/ADR-008-zoom-state-architecture.md` exists and is committed
- [ ] `docs/adr/README.md` includes the ADR-008 row
- [ ] The ADR clearly states: prop drilling, `barW = BAR_W * zoomX` at App root, passed as prop
- [ ] Drop `docs/handoffs/active/sprint-09-adr-008-done.md` confirming ADR-008 is committed so PM can unblock FR-02 FE pass 1

---

## Files to write

- `docs/adr/ADR-008-zoom-state-architecture.md` (new)
- `docs/adr/README.md` (append row)

## Files to not touch

- `src/App.tsx` — implementation is not part of this task
- `docs/specs/arranger-zoom.md` — spec is owned by Designer for the `§Interaction Model` fill; do not edit other sections
