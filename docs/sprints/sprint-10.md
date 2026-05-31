# Sprint 10 — Demo Hardening + Table-Stakes DAW Baseline

**Status:** Current — Planning
**Last updated:** 2026-05-31
**Theme:** Rein in scope drift, quality-check the playable beta, and prepare DAWin for musician friend testing.
**Depends on:** Sprint 9 CLOSED ✅ — resizable workspace panels (FR-01), arranger timeline zoom with keyboard + scroll shortcuts (FR-02).
**Unblocks:** Socializable musician demo; Sprint 11 recording / continuity / editing work orders.

---

## PM intent

Sprint 10 should not become a feature explosion. The goal is to organize the work, validate the demo, and promote only the right Need-to-Have items into implementation.

DAWin needs to feel like a working collaborative DAW prototype, not a beautiful backlog with a transport bar.

---

## Sprint 10 planning goals

1. Establish a formal backlog model with Need-to-Have, Post-MVP, Nice-to-Make, and Blue Sky tiers.
2. Create a socializable demo QA runbook.
3. Audit common DAW table-stakes features, menus, utilities, and shortcuts.
4. Promote Owner Continuity Bounce into a detailed spec for Tech Lead review.
5. Identify which Sprint 10 candidates are ready for implementation and which require ADR/spec work first.
6. Clean stale documentation that misdirects agents toward closed sprints.

---

## Candidate work packages

These are candidates, not active assignments. PM and Tech Lead must confirm before issuing work orders.

| ID | Candidate | Tier | Status | Owner recommendation | Notes |
|---|---|---|---|---|---|
| 10-A | Socializable Demo QA | Need-to-Have | Ready for work order | UAT + PM | Spec: `docs/specs/socializable-demo-qa.md` |
| 10-B | DAW Table-Stakes Audit | Need-to-Have | Ready for review | PM + Designer + Tech Lead | Research: `docs/research/daw-table-stakes-audit.md` |
| 10-C | Owner Continuity Bounce architecture/spec review | Need-to-Have | Needs Tech Lead review | Tech Lead + PM + Designer | Spec: `docs/specs/owner-continuity-bounce.md` |
| 10-D | Resizable Panels implementation | Need-to-Have | Ready if Tech Lead schedules | Frontend | Spec already exists: `docs/specs/resizable-workspace-panels.md` |
| 10-E | Arranger Zoom interaction model | Need-to-Have | Designer gate needed | Designer | Spec exists but has placeholder interaction model: `docs/specs/arranger-zoom.md` |
| 10-F | In-Browser Recording discovery/spec | Need-to-Have | Needs ADR/spec | Tech Lead + Backend + Frontend | Core remote contribution promise. |
| 10-G | Menu + Shortcut Baseline Cleanup | Need-to-Have | Needs scope decision | Designer + Frontend | Based on DAW audit. |
| 10-H | Known Limitations / Quick Start Help | Need-to-Have | Needs spec | PM + Designer + Frontend | Helps friend testers stay focused. |

---

## Suggested Sprint 10 scope options

### Option A — Stabilization sprint

- 10-A Socializable Demo QA
- 10-B DAW Table-Stakes Audit
- 10-G Menu + Shortcut Baseline Cleanup
- 10-H Known Limitations / Quick Start Help

Use this if the team needs confidence before touching deeper audio architecture.

### Option B — Demo + editing ergonomics sprint

- 10-A Socializable Demo QA
- 10-D Resizable Panels
- 10-E Arranger Zoom interaction model + horizontal zoom implementation
- 10-G Menu + Shortcut Baseline Cleanup

Use this if the goal is to make the current demo feel more like a real DAW fast.

### Option C — Collaboration promise sprint

- 10-A Socializable Demo QA
- 10-C Owner Continuity Bounce architecture/spec review
- 10-F In-Browser Recording discovery/spec
- One small implementation item only if gates are satisfied

Use this if the goal is to prepare the next major feature promise: remote contribution and session continuity.

---

## Recommended PM call

Recommended: **Option B + 10-C architecture review only**.

Reason:

- The demo needs QA and editing ergonomics now.
- Resizable panels and zoom are DAW table stakes.
- Owner Continuity Bounce is strategically critical, but should receive Tech Lead architecture review before implementation.
- In-browser recording is also critical, but may be too much to combine with continuity architecture and workspace ergonomics in the same sprint.

---

## Exit criteria

Sprint 10 should close only when:

- [ ] Backlog docs exist and are reviewed by Tech Lead.
- [ ] Socializable Demo QA checklist exists and has been run at least once.
- [ ] P0/P1 defects found during demo QA are logged and assigned.
- [ ] DAW table-stakes audit is reviewed and converted into concrete follow-up work.
- [ ] Owner Continuity Bounce spec reviewed by Tech Lead with ADR decision recorded.
- [ ] PM chooses which items move to Sprint 10.
- [ ] Stale sprint/doc indexes updated so no document incorrectly points agents to Sprint 6/7 as active.

---

## Key links

- `docs/backlog/DAWin_BACKLOG.md`
- `docs/backlog/feature-intake-template.md`
- `docs/specs/socializable-demo-qa.md`
- `docs/specs/owner-continuity-bounce.md`
- `docs/research/daw-table-stakes-audit.md`
- `docs/specs/resizable-workspace-panels.md`
- `docs/specs/arranger-zoom.md`
- `docs/specs/application-menu-bar.md`
- `docs/specs/keyboard-shortcuts.md`
