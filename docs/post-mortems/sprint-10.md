# Sprint 10 Post-Mortem — Demo Hardening + Table-Stakes DAW Baseline

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 10
**Dates:** 2026-05-31 – (in progress)
**Status:** In Progress
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

Sprint 10 was defined as a stabilization and planning sprint, not a feature sprint. The stated PM intent: "DAWin needs to feel like a working collaborative DAW prototype, not a beautiful backlog with a transport bar."

The sprint goals:
1. Establish a formal backlog model with Need-to-Have, Post-MVP, Nice-to-Make, and Blue Sky tiers
2. Create a socializable demo QA runbook
3. Audit common DAW table-stakes features, menus, utilities, and shortcuts
4. Promote Owner Continuity Bounce into a detailed spec for Tech Lead review
5. Identify which Sprint 10 candidates are ready for implementation and which require ADR/spec work first
6. Clean stale documentation that misdirects agents toward closed sprints

Note: Sprint 10's planning doc also listed candidates from Sprint 9 (`10-D: Resizable Panels`, `10-E: Arranger Zoom`) that had already shipped in Sprint 9. This was a naming/sequencing conflict from the planning document — those features were already complete and required only documentation updates, not re-implementation.

---

## What shipped (as of 2026-05-31)

- **Socializable Demo QA runbook** — `docs/specs/socializable-demo-qa.md`; UAT ran against it and produced 7 defects
- **DAW table-stakes audit** — `docs/research/daw-table-stakes-audit.md`
- **Formal backlog model** — `docs/backlog/DAWin_BACKLOG.md` with tier structure; `docs/backlog/feature-intake-template.md`
- **Owner Continuity Bounce spec** — `docs/specs/owner-continuity-bounce.md`; awaiting Tech Lead ADR-009 review
- **In-browser recording spec** — `docs/specs/in-browser-recording.md` from Designer; awaiting PM review
- **DAWin User Help Guide** — `docs/guides/dawin-user-guide.md`; 548 lines, 18 sections, documenting all Sprint 9 features; ready for friend-testers
- **P1 build fixes** — all 8 TypeScript errors resolved; `npm run build` passes; `?demo=1` bypass working; `DEMO_PRESENCE` / `SEED_COMMENTS` wired to demo mode; `AboutModal` version string updated to Sprint 9

---

## What had issues

**PR #36 naming conflict:** The PR created `docs/sprints/sprint-09.md` but Sprint 9 was already closed and its sprint doc already existed. Resolved by renaming to `sprint-10.md` and updating all internal references.

**UAT demo QA found P1 build failure (SPRINT-10-001) and 7 total defects:**

**SPRINT-10-001 (P1, fixed):** `npm run build` failed with 8 TypeScript errors, producing no deployable artifact. The most impactful: `bpm` was not passed as a prop to `ArrangeView`. This meant `bpm` was `undefined` inside `ArrangeView`, and `60 / undefined / 4 = NaN`. Every imported clip defaulted to 1 bar wide regardless of actual audio duration — an import that should produce 9 bars of audio produced 1 bar. The full error list:
- `App.tsx:305` TS6133 — `sendWsMessage` declared but never called (dead code)
- `App.tsx:2948` TS2304 — `bpm` not in scope inside `ArrangeView` (not passed as prop)
- `App.tsx:3231` TS2554 — `onZoom` called with 2 args; prop typed as 1 arg (`anchorBarOverride?` missing from `ArrangeViewProps`)
- `App.tsx:4640` TS6133 — `DEMO_PRESENCE` declared but not wired to state
- `App.tsx:4646` TS6133 — `SEED_COMMENTS` declared but not wired to state
- `App.tsx:5271` TS6133 — `loopEnd` destructured in `MenuBar` but never read in component body
- `App.tsx:5311` TS2538 — `openMenu` typed `MenuName | null`, used as index type before null narrowing
- `vite.config.ts:9` TS2769 — vitest `test` property type conflict on `defineConfig`

All 8 errors were addressed in a single Frontend pass. The fix also resolved SPRINT-10-002 (bpm prop), SPRINT-10-003 (demo mode bypass), and SPRINT-10-004 (demo seed data wiring) as side effects of wiring `DEMO_PRESENCE` and `SEED_COMMENTS` to state.

**SPRINT-10-002 (P1, fixed as part of 001 fix):** `bpm` not passed to `ArrangeView` — all imported clips defaulted to 1 bar wide regardless of audio duration. Fixed by adding `bpm: number` to `ArrangeViewProps` and passing `bpm={bpm}` at the call site.

**SPRINT-10-003 (P2, fixed as part of 001 fix):** `?demo=1` without `?session=` rendered the lobby rather than the session room. Fixed by seeding `sessionId` with `'demo'` when `isDemoMode` and no `?session=` param is present.

**SPRINT-10-004 (P2, fixed as part of 001 fix):** `DEMO_PRESENCE` and `SEED_COMMENTS` were declared but not wired to state. The collaboration story was invisible without a live backend. Fixed by initializing both state values conditionally on `isDemoMode`.

**SPRINT-10-005 (P2, open):** Known Limitations panel absent from Help menu. Per `docs/specs/socializable-demo-qa.md`, Help menu should include a Known Limitations surface. Currently only Keyboard Shortcuts and About DAWin are present. Blocked on Designer spec — SPRINT-10-007 is the corresponding process defect.

**SPRINT-10-006 (P3, fixed as part of 001 fix):** `AboutModal` showed "Sprint 8 — Playable Beta" and "v0.8.0-beta". Updated to "Sprint 9 — Playable Beta" and "v0.9.0-beta".

**SPRINT-10-007 (P3 process, open):** No Designer spec for Known Limitations surface. Per `CLAUDE.md`, no user-visible frontend feature may begin without a Designer spec in `docs/specs/`. Work order issued to Designer; implementation blocked until spec is written.

---

## How issues were addressed

All 8 build errors (SPRINT-10-001) were fixed in a single Frontend pass covering `src/App.tsx` and `vite.config.ts`. The handoff at `docs/handoffs/sprint-10-frontend-p1-fixes-done.md` documents every fix with line references and a self-review checklist confirming no regressions on transport, clip editing, splitters, or zoom.

One deviation from the work order: `DEMO_PRESENCE` was also missing the required `displayName: string` field from the `PresenceEntry` interface. Without this, wiring it to typed state would have produced a new TS2741 error. The Frontend agent added `displayName: 'Anna'` and `displayName: 'Miguel'` and an explicit `PresenceEntry[]` type annotation. This was the right call — silently fixing a type gap the work order didn't mention.

SPRINT-10-005 and SPRINT-10-007 remain open pending Designer spec for Known Limitations.

ADR-009 (continuity bounce architecture) remains in progress.

---

## Decisions made

**Backlog tier model established:** Need-to-Have / Post-MVP / Nice-to-Make / Blue Sky. This is the first sprint with formal backlog tiers. The tier system gives the PM a clear vocabulary for prioritization conversations without having to re-negotiate scope definitions each sprint.

**In-browser recording spec (Designer) submitted, not yet approved:** The Designer wrote a full recording spec (`docs/specs/in-browser-recording.md`) covering `getUserMedia`, `MediaRecorder`, arm-to-record model, recording gutter, WS broadcast of recording state, and upload-at-stop-time pipeline. PM review is the gate before any FE work order is issued.

**Owner Continuity Bounce spec submitted, ADR-009 pending:** The continuity bounce spec defines what happens when a track owner leaves mid-session with unresolved recording or mixing work. ADR-009 needs to be written by the Tech Lead before implementation. PM decisions on tier (is this truly Need-to-Have?) are outstanding.

**Sprint 10 scope in retrospect:** The sprint achieved its planning goals (backlog model, QA runbook, table-stakes audit, continuity spec, recording spec, help guide) and its quality goals (P1 build fixed). The PM table-stakes decisions — which items from the audit move to Sprint 11 — are still outstanding at the time of this document.

---

## What was deferred

- Known Limitations panel — requires Designer spec; deferred past current Sprint 10
- ADR-009 continuity bounce architecture — in progress; not complete at sprint close
- PM decisions on table-stakes audit items — outstanding; determines Sprint 11 scope
- Export Mix tier decision — PM decision outstanding
- In-browser recording FE implementation — waiting on PM approval of Designer spec; no FE work order issued

---

## What was learned

**`tsc --noEmit` passing does not guarantee `npm run build` passing.** Sprint 10 found 8 build errors that did not appear in `tsc --noEmit` runs during Sprint 9. The `vite.config.ts` error (TS2769) is a `vite` vs. `vitest/config` type conflict that only surfaces in the build step. Future commits should run `npm run build`, not just `tsc --noEmit`, before submitting for UAT.

**The `bpm` prop gap is a recurring pattern.** This is the second time `bpm` was missing from an important component (first: Sprint 7, SPRINT-7-003 hardcoded `const bpm = 128`). The pattern: `bpm` state lives at App root; when a new component is created or a function is refactored inside an existing component, `bpm` needs to be explicitly passed as a prop. Because `bpm` doesn't have an obvious "you'll see a crash" failure mode — instead, clip widths are subtly wrong — it can persist through multiple commits before being caught. Any arranger component that does duration/bar calculations must receive `bpm` as an explicit prop.

**Dead constants that are never wired to state are a code smell that TypeScript can catch.** `DEMO_PRESENCE` and `SEED_COMMENTS` were declared at module scope and used in seed state during development, but were disconnected when the app was refactored to only show state when `isDemoMode`. The `--noUnusedLocals` flag should have caught these as `TS6133` errors. It did — but only in the build step, not in `tsc --noEmit` with the project's current config. This gap should be investigated.

**The help guide and planning documentation are genuinely useful.** The User Help Guide (`docs/guides/dawin-user-guide.md`) is 548 lines covering 18 sections. Section 18 ("What is real vs. what is planned") is the most important for friend-tester sessions — it sets expectations honestly. Future sprints should update this guide within the same sprint as any new feature lands.

---

## Metrics (as of 2026-05-31)

- Defects found by Sprint 10 UAT: 7 (0 P0, 2 P1, 3 P2, 2 P3)
- P1 defects fixed: 2 (build failure, bpm prop)
- P2 defects fixed: 2 (demo mode bypass, demo seed data)
- P3 defects fixed: 1 (AboutModal version string)
- P2 defects remaining: 1 (SPRINT-10-005 — Known Limitations panel)
- P3 defects remaining: 1 (SPRINT-10-007 — process gate missing)
- Build errors resolved: 8 (all)
- `npm run build`: passes at 2026-05-31

---

## Open questions going into the next sprint

- Which items from the table-stakes audit does the PM promote to Sprint 11?
- Is in-browser recording Need-to-Have for Sprint 11, or does ADR-009 continuity bounce take priority?
- When does the Known Limitations Designer spec land? (SPRINT-10-005 is blocked on it)
- Is ADR-009 a Sprint 10 or Sprint 11 deliverable?
- What is the Export Mix tier decision?
