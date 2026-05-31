# DAWin Backlog — MVP, Post-MVP, Nice-to-Make, Blue Sky

**Status: Current**
**Last updated:** 2026-05-31
**Owner:** PM / Tech Lead

This document is the working backlog control surface for DAWin. It is not a sprint plan by itself. It exists so PM and Tech Lead can triage ideas, promote the right work into specs, and prevent DAWin from drifting away from a functional socializable demo.

## Current product state summary

Sprint 8 shipped a playable beta: session lobby, real imported-audio playback from R2, application menu bar, Keyboard Shortcuts modal, About modal, configurable `API_BASE`, and true stereo VU metering.

Sprint 9 is planning. No work order should begin until PM sets scope and Tech Lead confirms required specs / ADRs.

## Backlog tier definitions

### Need-to-Have

Required for the socializable MVP/demo promise or the core DAWin collaboration promise.

A feature belongs here when it:

- Prevents the demo from feeling broken, fake, or unsafe.
- Protects the core collaboration promise.
- Unblocks musician testing.
- Resolves a table-stakes DAW expectation.
- Blocks another committed feature.

### Post-MVP

Important, likely needed, but not required for the first musician testing round.

A feature belongs here when it:

- Makes the product more complete.
- Supports scale, persistence, distribution, or pro workflow depth.
- Can wait until the core loop is validated.

### Nice-to-Make

Useful polish or workflow speed, but not demo-blocking.

A feature belongs here when it:

- Improves usability but does not define the product promise.
- Can be pulled forward if a sprint has spare capacity.
- Should not interrupt demo stabilization.

### Blue Sky / Needs Discovery

Large, undefined, expensive, or strategically important ideas that require discovery before sprint scoping.

A feature belongs here when it:

- Has major product, legal/IP, technical, or cost uncertainty.
- Could become a future pillar.
- Would be reckless to assign directly to implementation.

## Promotion gates

A backlog item may not become sprint work until all applicable gates are satisfied.

| Gate | Required for | Owner |
|---|---|---|
| PM priority | All items | PM |
| Tech Lead architecture review | All technical work | Tech Lead |
| Designer spec in `docs/specs/` | All user-visible work | Designer / PM |
| ADR | New architecture, storage model, audio rendering model, desktop shell, sync model | Tech Lead |
| Work order | All implementation | PM / Tech Lead |
| UAT checklist | All user-facing work | UAT |

## Sprint 9 candidate stack

Recommended Sprint 9 theme:

**Demo Hardening + Table-Stakes DAW Baseline**

Recommended work order sequence:

| Candidate | Tier | Recommended owner | Why |
|---|---|---|---|
| Socializable Demo QA | Need-to-Have | UAT + PM | Gives repeatable pass/fail before showing musicians. |
| DAW Table-Stakes Audit | Need-to-Have | PM + Designer | Prevents missing obvious DAW shell functions. |
| Owner Continuity Bounce spec | Need-to-Have | Tech Lead + PM + Designer | Protects the collaboration promise when a plugin/instrument owner leaves. |
| In-Browser Recording spec/build | Need-to-Have | Tech Lead + Backend + Frontend | Unlocks actual remote contribution into the shared session. |
| Resizable Panels | Need-to-Have | Frontend | Already has ready spec; makes the workspace feel real. |
| Arranger Zoom interaction model + horizontal zoom | Need-to-Have | Designer + Frontend | DAW editing table stakes. |

Recommended constraint: Sprint 9 should not include speculative blue-sky work. Do not pull in mobile, live low-latency jamming, desktop VST hosting, AI music generation, or marketplace concepts.

## Need-to-Have backlog

| ID | Feature | Status | Source / spec | Notes |
|---|---|---|---|---|
| MVP-001 | Socializable Demo QA Checklist | Ready for spec | `docs/specs/socializable-demo-qa.md` | Create repeatable QA before friend testing. |
| MVP-002 | DAW Table-Stakes Audit | Ready for review | `docs/research/daw-table-stakes-audit.md` | Establish standard DAW menus, shortcuts, utilities, and gaps. |
| MVP-003 | In-Browser Recording | Needs spec / ADR | PRD + existing recording pipeline notes | Core contribution promise for web collaborators. |
| MVP-004 | Owner Continuity Bounce | Needs ADR + spec | `docs/specs/owner-continuity-bounce.md`, FR-04, FR-05 | Core continuity promise when instrument/plugin owner leaves. |
| MVP-005 | Horizontal Timeline Zoom | Partial spec | `docs/specs/arranger-zoom.md` | Interaction model is currently blocking full implementation. |
| MVP-006 | Resizable Panels | Ready for implementation | `docs/specs/resizable-workspace-panels.md` | Spec exists and is implementation-ready. |
| MVP-007 | Menu + Shortcut Baseline Cleanup | Needs audit pass | `docs/specs/application-menu-bar.md`, `docs/specs/keyboard-shortcuts.md` | Add missing Track / Clip concepts or consciously defer. |
| MVP-008 | Known Limitations / Demo Mode Help | Needs spec | Help menu / demo QA | Makes prototype boundaries explicit during musician testing. |
| MVP-009 | Basic Export Mix | Needs discovery | New spec required | Musicians will ask how to get audio out. |
| MVP-010 | Plugin Parameter Editing Decision | Needs PM decision + spec | PRD open decision 8.8 | Current plugin cards are effectively read-only. |

## Post-MVP backlog

| ID | Feature | Status | Notes |
|---|---|---|---|
| PMVP-001 | Auto-update Continuity Bounce after edits | Needs discovery | Useful after manual continuity bounce exists. |
| PMVP-002 | Background idle rendering | Needs ADR | Could be expensive or performance-sensitive. |
| PMVP-003 | Session version history | Needs architecture | Important once collaboration becomes destructive. |
| PMVP-004 | Undo / redo architecture | Needs ADR | Critical but complex in collaborative state. |
| PMVP-005 | Track ownership transfer | Needs product decision | Helps collaboration but not required for first demo. |
| PMVP-006 | Export stems | Needs spec | Professional handoff workflow. |
| PMVP-007 | Session audio pool | Needs spec | Needed once recordings/imports accumulate. |
| PMVP-008 | Markers / locators | Needs spec | Expected in longer arrangements. |
| PMVP-009 | Metronome + count-in | Needs spec | Becomes important once recording is live. |
| PMVP-010 | Mobile capture companion | Needs product/tech plan | PRD says planned, but desktop/web demo comes first. |

## Nice-to-Make backlog

| ID | Feature | Status | Notes |
|---|---|---|---|
| NTM-001 | Bounce selected region | Deferred | Great workflow, not required for continuity v1. |
| NTM-002 | Zoom to selection | Deferred | Editing polish. |
| NTM-003 | Recent imports | Deferred | Helpful once asset library exists. |
| NTM-004 | Sample auditioning | Deferred | Useful for file browser / asset pool. |
| NTM-005 | Mixer peak reset | Deferred | Pro polish. |
| NTM-006 | Track templates | Deferred | Helpful later. |
| NTM-007 | Custom shortcut mapping | Deferred | Power-user feature. |
| NTM-008 | Comment filters | Deferred | Useful when sessions get noisy. |

## Blue Sky / Needs Discovery backlog

| ID | Feature | Status | Discovery needed |
|---|---|---|---|
| SKY-001 | Live low-latency jamming | Needs discovery | Latency, networking, expectation management. |
| SKY-002 | Full desktop VST/VSTi hosting | Needs architecture | Desktop shell, native sidecar, licensing, crash isolation. |
| SKY-003 | Collaborative MIDI editing | Needs architecture | Conflict model and edit ownership. |
| SKY-004 | AI mix assistant | Needs product definition | Avoid vague AI sparkle. Define jobs-to-be-done. |
| SKY-005 | Agent-generated session summaries | Needs product definition | Could become DAWin-native collaboration memory. |
| SKY-006 | Plugin availability detection | Needs architecture | Requires plugin inventory, compatibility, privacy decisions. |
| SKY-007 | Cloud render for plugin tracks | Needs legal + architecture | Expensive and licensing-heavy. |
| SKY-008 | Marketplace / shared session assets | Needs product/legal | Asset rights, moderation, ownership, storage. |

## New-idea triage questions

Before promoting any new idea, answer:

1. Does this protect the socializable demo promise?
2. Does this protect the DAWin collaboration promise?
3. Does this unblock a musician task users expect immediately?
4. Is this a table-stakes DAW expectation or a DAWin differentiator?
5. What breaks if we do not build it now?
6. Is there a lower-cost version that proves the value?

If the answer to the first three questions is no, the item probably belongs in Post-MVP, Nice-to-Make, or Blue Sky.

## Tech Lead next actions

1. Review `docs/specs/owner-continuity-bounce.md` and decide whether it requires an ADR before implementation.
2. Review `docs/specs/socializable-demo-qa.md` and turn it into UAT work orders.
3. Review `docs/research/daw-table-stakes-audit.md` and decide which menu/shortcut gaps become Sprint 9 work.
4. Decide whether Sprint 9 is a stabilization sprint, a recording sprint, or a split sprint.
5. Convert selected Need-to-Have items into GitHub issues or work orders under `docs/handoffs/active/`.
