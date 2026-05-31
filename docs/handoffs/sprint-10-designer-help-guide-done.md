# Handoff: DAWin User Help Guide

**From:** Designer
**To:** Tech Lead / PM
**Sprint:** 10
**Date:** 2026-05-31
**Work order:** `docs/handoffs/active/sprint-10-designer-help-guide.md`

---

## What was delivered

- `docs/guides/dawin-user-guide.md` — complete user manual, all 18 required sections
- `docs/guides/README.md` — index file for the guides directory

---

## Acceptance criteria check

- [x] `docs/guides/dawin-user-guide.md` exists
- [x] All 18 sections present and complete
- [x] Sprint 9 features documented: resizable panels (drag splitter, keyboard nav, double-click reset), arranger horizontal zoom (=/-/0/Cmd+scroll, zoom indicator, 25–400% range), per-track vertical zoom chevrons
- [x] Known limitations listed honestly (recording, export, undo, track add/delete, mobile, offline)
- [x] "What is real vs. planned" section is accurate and complete
- [x] No features described that are not yet shipped
- [x] Keyboard shortcuts section verified against `src/App.tsx` — only wired shortcuts are listed. Added shortcuts found in source but not in the work order brief: `Shift+,` / `Shift+.` for fade curve, `↑`/`↓`/`←`/`→`/`Home` for focused mixer controls, `Cmd+↑`/`Cmd+↓` for plugin reordering, splitter keyboard nav shortcuts
- [x] No hex color values in the guide
- [x] No `src/` files touched

---

## Source verification

Keyboard shortcuts were verified directly against `src/App.tsx` global `onKeyDown` handler (line 6421) and the `KeyboardShortcutsModal` groups definition (line 5019). The splitter keyboard handlers were verified at lines 6668 and 6723. The work order brief's shortcut list was correct; I supplemented it with additional wired shortcuts found in the source that were not included in the work order brief but are fully functional.

---

## Open questions

None. The guide is complete for the Sprint 9 baseline. The Tech Lead should add a header note to `dawin-user-guide.md` whenever a new sprint ships features, flagging that an update is needed.

---

## Suggested next step

Tech Lead: review the keyboard shortcuts table against any shortcuts you know are wired but not yet in the guide. PM: this guide is ready to share with friend-testers.
