# DAWin Feature Request Intake

**Status: Current**  
**Last updated:** 2026-05-31

Feature requests captured from product workshopping conversations. This folder is intentionally separate from `docs/specs/`: these are prioritizable work orders for PM + Tech Lead review before they are promoted into implementation specs, GitHub issues, milestones, or sprint tickets.

**Created:** 2026-05-14  
**Owner:** Luke / PM  
**Recommended next owner:** Tech Lead  

## How Feature Requests Enter This List

After a ChatGPT or external feature discovery conversation, the PM writes a new FR file using the naming format `FR-YYYY-MM-DD-NN-short-name.md`. Set `Status: Pending triage`. Tag the Tech Lead for architecture review within one business day before the FR is accepted into sprint planning. No FR may enter a sprint without: (1) Tech Lead architecture review, (2) a Designer spec in `docs/specs/`, and (3) PM sprint scheduling approval. See `CLAUDE.md` § Designer review gate.

---

**Current sprint:** Sprint 9 — Planning. See [docs/sprints/sprint-09.md](../sprints/sprint-09.md) for the planning shell.

**Backlog source:** See [docs/backlog/DAWin_BACKLOG.md](../backlog/DAWin_BACKLOG.md) for the current tiered backlog model.

---

## Intake List

| ID | Feature | Recommended Priority | Complexity | Suggested Track | Status |
|---|---|---:|---:|---|---|
| FR-2026-05-14-01 | Resizable Workspace Panels | High | M | Core UX / Layout | Deferred — spec ready |
| FR-2026-05-14-02 | Multitrack Horizontal + Vertical Zoom | High | M | Arranger Editing | Deferred — interaction model incomplete |
| FR-2026-05-14-03 | File Browser + Local Sample Import | Medium | L | Media / Assets | Partially superseded by Sprint 7 audio import; broader asset pool pending |
| FR-2026-05-14-04 | Plugin Availability + Freeze/Bounce Fallback | High | L | Collaboration / Audio | Promoted to Owner Continuity Bounce spec |
| FR-2026-05-14-05 | Bounce Link + Detach Workflow | Medium-High | M/L | Audio Editing | Incorporated into Owner Continuity Bounce spec; detach remains post-MVP unless PM pulls forward |
| FR-2026-05-14-06 | Session Communication + Inline Comments | High | L | Collaboration | Shipped |
| FR-2026-05-14-07 | Timeline Deep Links | Medium-High | M | Collaboration / Navigation | Shipped |
| FR-2026-05-14-08 | Standalone macOS Beta Build | Medium-High | M/L | QA / Distribution | Pending triage / post-MVP unless PM prioritizes packaged demo |

---

## Suggested Sprint Framing

### Sprint Candidate A — Demo Hardening
1. Socializable Demo QA
2. Known Limitations / Quick Start Help
3. Menu + Shortcut Baseline Cleanup

Why: This gets DAWin ready for musician friend testing without overbuilding.

### Sprint Candidate B — Core Editing Ergonomics
1. FR-2026-05-14-01 — Resizable Workspace Panels
2. FR-2026-05-14-02 — Multitrack Horizontal + Vertical Zoom

Why: These improve the daily editing surface without requiring a backend contract rewrite. They also make the app feel more like a serious DAW instead of a beautiful locked diorama.

### Sprint Candidate C — Collaboration Continuity
1. FR-2026-05-14-04 — Plugin Availability + Freeze/Bounce Fallback
2. FR-2026-05-14-05 — Bounce Link + Detach Workflow
3. In-browser recording

Why: These support DAWin's major feature promise: collaborators can contribute and the session keeps playing even when an owner leaves.

### Sprint Candidate D — QA / Beta Readiness
1. FR-2026-05-14-08 — Standalone macOS Beta Build

Why: This can run later if the Tech Lead treats it as packaging/distribution infrastructure instead of product surface area.

---

## Grooming Rules

Before implementation, Tech Lead should:

1. Convert each accepted feature request into a GitHub issue or milestone-backed work order.
2. Validate whether the feature belongs in `docs/specs/` as an implementation spec.
3. Split cross-functional features into the smallest independently testable work packets.
4. Add dependencies, owners, labels, and acceptance criteria before assigning to agents.
5. Keep implementation inside the active root app unless Tech Lead explicitly approves refactoring out of `src/App.tsx`.

---

## Feature Request Files

- [FR-2026-05-14-01 — Resizable Workspace Panels](./FR-2026-05-14-01-resizable-workspace-panels.md)
- [FR-2026-05-14-02 — Multitrack Horizontal + Vertical Zoom](./FR-2026-05-14-02-multitrack-horizontal-vertical-zoom.md)
- [FR-2026-05-14-03 — File Browser + Local Sample Import](./FR-2026-05-14-03-file-browser-local-sample-import.md)
- [FR-2026-05-14-04 — Plugin Availability + Freeze/Bounce Fallback](./FR-2026-05-14-04-plugin-availability-freeze-bounce.md)
- [FR-2026-05-14-05 — Bounce Link + Detach Workflow](./FR-2026-05-14-05-bounce-link-detach-workflow.md)
- [FR-2026-05-14-06 — Session Communication + Inline Comments](./FR-2026-05-14-06-session-communication-inline-comments.md)
- [FR-2026-05-14-07 — Timeline Deep Links](./FR-2026-05-14-07-timeline-deep-links.md)
- [FR-2026-05-14-08 — Standalone macOS Beta Build](./FR-2026-05-14-08-standalone-macos-beta-build.md)
