# DAWin Feature Request Intake

Feature requests captured from product workshopping conversations. This folder is intentionally separate from `docs/specs/`: these are prioritizable work orders for PM + Tech Lead review before they are promoted into implementation specs, GitHub issues, milestones, or sprint tickets.

**Created:** 2026-05-14  
**Owner:** Luke / PM  
**Recommended next owner:** Tech Lead  
**Current sprint context:** Sprint 2 is focused on real-time collaboration; these requests should be groomed against the remaining Sprint 2 work and future Sprint 3+ scope.

---

## Intake List

| ID | Feature | Recommended Priority | Complexity | Suggested Track |
|---|---|---:|---:|---|
| FR-2026-05-14-01 | Resizable Workspace Panels | High | M | Core UX / Layout |
| FR-2026-05-14-02 | Multitrack Horizontal + Vertical Zoom | High | M | Arranger Editing |
| FR-2026-05-14-03 | File Browser + Local Sample Import | High | L | Media / Assets |
| FR-2026-05-14-04 | Plugin Availability + Freeze/Bounce Fallback | High | L | Collaboration / Audio |
| FR-2026-05-14-05 | Bounce Link + Detach Workflow | Medium-High | M/L | Audio Editing |
| FR-2026-05-14-06 | Session Communication + Inline Comments | High | L | Collaboration |
| FR-2026-05-14-07 | Timeline Deep Links | Medium-High | M | Collaboration / Navigation |
| FR-2026-05-14-08 | Standalone macOS Beta Build | High | M/L | QA / Distribution |

---

## Suggested Sprint Framing

### Sprint Candidate A — Core Editing Ergonomics
1. FR-2026-05-14-01 — Resizable Workspace Panels
2. FR-2026-05-14-02 — Multitrack Horizontal + Vertical Zoom

Why: These improve the daily editing surface without requiring a backend contract rewrite. They also make the app feel more like a serious DAW instead of a beautiful locked diorama.

### Sprint Candidate B — Collaboration Workflow
1. FR-2026-05-14-06 — Session Communication + Inline Comments
2. FR-2026-05-14-07 — Timeline Deep Links

Why: Comments without timeline anchors are just chat wearing a tiny hat. These two should be scoped together because the message/comment model depends on timeline references.

### Sprint Candidate C — Audio Asset + Resource Workflow
1. FR-2026-05-14-03 — File Browser + Local Sample Import
2. FR-2026-05-14-04 — Plugin Availability + Freeze/Bounce Fallback
3. FR-2026-05-14-05 — Bounce Link + Detach Workflow

Why: These are higher technical risk because they touch browser file APIs, audio rendering/export, plugin representation, session persistence, and collaborative ownership rules.

### Sprint Candidate D — QA / Beta Readiness
1. FR-2026-05-14-08 — Standalone macOS Beta Build

Why: This can run in parallel if the Tech Lead treats it as packaging/distribution infrastructure instead of product surface area.

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
