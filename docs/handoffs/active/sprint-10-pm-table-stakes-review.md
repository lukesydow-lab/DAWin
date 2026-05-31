# Work Order: PM — DAW Table-Stakes Audit Review + Sprint 10 Scope Confirmation

**To:** PM (Luke)
**From:** Tech Lead
**Sprint:** 10
**Date issued:** 2026-05-31
**Status:** Requires PM decisions — no implementation starts until this is resolved.
**Research doc:** `docs/research/daw-table-stakes-audit.md` ✅ Ready for review

---

## Objective

Review the DAW Table-Stakes Audit at `docs/research/daw-table-stakes-audit.md` and answer the open questions below. This unblocks the Designer and Frontend from acting on several audit findings.

---

## Decisions needed from PM

### 1. Sprint 10 scope confirmation

Tech Lead recommendation: **Option B + 10-C architecture-only**.

| Item | What it is | Recommendation |
|---|---|---|
| **10-A** Socializable Demo QA | UAT runs smoke test and muscle-memory checklist | ✅ Start immediately (work order already issued) |
| **10-B** DAW Table-Stakes Audit review | PM reviews findings, converts to issues | ✅ This document — decide and respond |
| **10-C** Owner Continuity Bounce — architecture only | Tech Lead writes ADR-009, no implementation yet | ✅ Start immediately (ADR work order already issued) |
| **10-D** Resizable Panels | Already shipped in Sprint 9 ✅ | Remove from scope |
| **10-E** Arranger Zoom | Already shipped in Sprint 9 ✅ | Remove from scope |
| **10-F** In-browser recording | Discovery/spec needed first | Defer to Sprint 11 unless PM explicitly prioritizes |
| **10-G** Menu + Shortcut Baseline Cleanup | Small — Designer + FE | Recommend include if UAT flags gaps |
| **10-H** Known Limitations / Quick Start Help | Part of Help Guide | ✅ Included in Help Guide work order (already issued) |

**PM decision needed:** Confirm 10-A, 10-B, 10-C, and Help Guide as Sprint 10. Confirm 10-D and 10-E are removed (already shipped). Confirm 10-F deferred to Sprint 11. Confirm whether 10-G is in Sprint 10 scope.

---

### 2. Track and Clip menu — add in Sprint 10 or remain contextual only?

The audit recommends a Track menu and Clip menu once context menus alone aren't enough. This is not urgent, but needs a decision before the Designer or FE touches menu structure.

Options:
- **A** — Add Track menu and Clip menu to the menu bar in Sprint 10 (with key actions only)
- **B** — Keep all track/clip commands contextual for now; add menus in a future sprint
- **C** — Add a Track menu only (no Clip menu yet)

**PM decision needed.**

---

### 3. Undo/Redo — visible stubs or hidden?

Currently Undo/Redo are visible but dimmed stubs. Options:
- **A** — Keep visible and dimmed (honest; sets expectations)
- **B** — Hide from the menu until architecture exists
- **C** — Add a tooltip that says "Undo/Redo is coming in a future version" when hovered

**PM decision needed.**

---

### 4. Export Mix — does it block the socializable demo?

The audit flags Export Mix as Need-to-Have. Musicians will want to get audio out. Options:
- **A** — Ship a basic "Bounce to WAV" using `OfflineAudioContext` in Sprint 10 (requires FE + BE scoping)
- **B** — Keep it as a known limitation, document it, and plan for Sprint 11
- **C** — Tech spike only in Sprint 10 — no UI, but estimate the work

**PM decision needed.** Tech Lead note: Option A is more work than it looks; server-side mix render may be more reliable than browser-side. A spike before commitment is strongly recommended.

---

### 5. Which items from the audit convert to GitHub Issues?

The audit identified missing Need-to-Have items that are not yet in any spec or backlog. These should become GitHub issues so nothing gets lost:

| Item | Audit status | Action needed |
|---|---|---|
| Split at Playhead | Missing | Convert to GitHub issue |
| Basic Export Mix | Missing | Convert to GitHub issue (PM decides tier first) |
| Rename Track (verify) | Needs QA | UAT to test; may be a defect |
| Rename Clip (verify) | Needs QA | UAT to test; may be a defect |
| Plugin parameter editing | Missing | PM decision on UX pattern needed before spec |
| Session Settings (BPM + time sig) | Partial | Designer needs to define what "complete" means |
| Add comment at playhead (menu) | Missing | Small — can be backlogged or Sprint 10 stretch |
| Known Limitations + Quick Start in Help | Missing | Already covered by Help Guide work order |

**PM decision needed:** Which of these should become GitHub issues this sprint?

---

## No PM action needed — already handled

- 10-D (Resizable Panels) — shipped in Sprint 9 ✅
- 10-E (Arranger Zoom) — shipped in Sprint 9 ✅
- Help Guide — work order already issued to Designer ✅
- Demo QA — work order already issued to UAT ✅
- ADR-009 (Continuity Bounce) — work order already issued to Tech Lead ✅

---

## How to respond

Reply to this work order or drop a `docs/handoffs/sprint-10-pm-scope-decisions.md` with answers to each numbered decision above. Once scope decisions are recorded, Tech Lead will update STATUS.md and issue any remaining work orders.
