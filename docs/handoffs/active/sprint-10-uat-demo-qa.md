# Work Order: UAT — Sprint 10-A Socializable Demo QA

**To:** UAT Agent
**From:** Tech Lead
**Sprint:** 10
**Date issued:** 2026-05-31
**Status:** Unblocked — start immediately. No spec gate, no ADR gate.
**Spec:** `docs/specs/socializable-demo-qa.md` ✅ Ready

---

## Objective

Run the socializable demo QA pass defined in `docs/specs/socializable-demo-qa.md` against the current `main` branch. Log every defect found to `docs/defects.md`. This is the first musician-testing readiness gate.

---

## Entry criteria (confirm before starting)

- [ ] App boots locally (`npm run dev`)
- [ ] Backend is running (or note which features require backend for honest gap reporting)
- [ ] `npm run build` passes
- [ ] No open P0/P1 defects already in `docs/defects.md`

---

## What to run

Work through every checklist in `docs/specs/socializable-demo-qa.md` in this order:

1. **Smoke test checklist** — all 13 areas (App boot → Keyboard shortcuts)
2. **DAW muscle-memory checklist** — all 13 expectations (Spacebar → Zoom)
3. **Known limitations check** — confirm each limitation listed in the spec exists somewhere accessible in the UI or is explicitly documented

You do not need to run the Musician Friend Test Script — that requires a human tester. Focus on the smoke test and muscle-memory checklist.

---

## What to log

Every failure goes into `docs/defects.md` with the format defined in the spec:

```md
| Priority | Status | Issue | Repro steps | Expected | Actual | File:Line | Owner |
```

Assign severity using the spec's severity model:
- **P0** — app cannot boot, session cannot open, data loss
- **P1** — core happy path blocked
- **P2** — workaround exists
- **P3** — polish/visual

---

## Known context

- Sprint 9 shipped: resizable workspace panels (splitter drag) and arranger timeline zoom (`=`/`-`/`0` + Ctrl/Cmd+scroll wheel). Confirm these work in the smoke test.
- The app may show no tracks if running without a backend. Note this as a test environment gap, not a P0.
- A `?demo=1` URL mode that seeds initial tracks may or may not be available — if it exists, use it; if not, note the gap.
- Export Mix is confirmed missing — classify P2 per the table-stakes audit.
- Undo/Redo is stubbed — not a defect, confirm items are visually dimmed.

---

## Acceptance criteria for this work order

- [ ] Smoke test checklist fully run with pass/fail for each row
- [ ] DAW muscle-memory checklist fully run
- [ ] All defects logged to `docs/defects.md` with severity, repro, and owner
- [ ] P0/P1 count reported clearly — zero P0/P1 = demo ready; any P0/P1 = blocks musician testing
- [ ] Drop handoff at `docs/handoffs/sprint-10-uat-demo-qa-done.md` with summary and defect count

---

## Handoff output

Drop `docs/handoffs/sprint-10-uat-demo-qa-done.md` including:
- Date of test run
- Environment (local / staging / production)
- Smoke test result (pass / fail with count)
- Muscle-memory result (pass / fail with count)
- Defect summary table (P0/P1/P2/P3 counts)
- Recommendation: demo-ready, demo-ready with known limitations, or blocked

---

## Files to touch

- `docs/defects.md` — add defects found
- `docs/handoffs/sprint-10-uat-demo-qa-done.md` — new handoff file

## Files to not touch

- `src/` — UAT does not edit source
- `docs/specs/` — read-only for UAT
- `STATUS.md` — Tech Lead only
