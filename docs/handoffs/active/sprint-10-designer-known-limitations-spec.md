# Work Order: Designer — Known Limitations Panel Spec

**To:** Designer
**From:** Tech Lead
**Sprint:** 10
**Date issued:** 2026-05-31
**Status:** Unblocked — write the spec. Frontend is blocked until spec exists.
**Defects addressed:** SPRINT-10-005 (P2), SPRINT-10-007 (P3 process)

---

## Objective

Write `docs/specs/known-limitations-panel.md` — the spec for a Known Limitations surface accessible from the Help menu.

This is a **spec-writing task only**. Do not edit `src/`.

---

## Why this exists

Musician friend-testers encountering DAWin for the first time will try features that don't exist yet (recording, export, undo). Without a Known Limitations surface, they waste their feedback slot on prototype gaps instead of real product behavior.

The Help Guide (`docs/guides/dawin-user-guide.md`) already documents limitations in prose. The Known Limitations panel is the in-product version — surfaced directly from the Help menu so testers find it without needing to read external docs.

---

## What to specify

### 1. Entry point

How does the user reach this surface?
- **Required:** Help → Known Limitations menu item (currently missing from Help menu)
- Optionally: also accessible via a `?` badge or footer link in the session room

### 2. Surface type

Choose one:
- **Modal** — same pattern as the existing Keyboard Shortcuts modal (`role="dialog"`, focus trap, Escape to close). Recommended for consistency.
- Inline panel — a separate view, not modal
- Popover — lightweight, anchored to the Help menu item

Specify which pattern and why. If modal, describe its dimensions, scroll behavior, and close affordance.

### 3. Content sections

The Known Limitations panel must include at minimum:

| Topic | What to say |
|---|---|
| In-browser recording | Not yet available. Import audio files instead. |
| Export / mix bounce | Not yet available. Cannot get audio out of the session yet. |
| Undo / Redo | Not yet available. Be careful with destructive edits. |
| Add/delete tracks | Sessions have a fixed 7-track layout in the current demo. |
| Native VST/VSTi plugins | Web version uses Web Audio effects only. Native plugin hosting is desktop-future. |
| Mobile | Desktop-first. Minimum 1280px. Mobile planned for a future sprint. |
| Offline mode | Requires a network connection. No offline mode. |

You may also add a brief intro sentence and a closing "What's coming" line. Keep tone honest, not apologetic.

### 4. Visual design

- Use existing modal design patterns (same `C.*` tokens, same backdrop, same close button)
- `C.textPrimary` for section headers; `C.textSec` for body copy
- No status icons or severity indicators — this is not a bug list
- Each limitation: one bold label + one sentence description

### 5. Component name

Specify the React component name and where it should be rendered (inline in App or as a child of an existing modal system).

### 6. Interaction

- Opens from Help → Known Limitations
- Escape closes it
- No interactive elements inside (read-only)
- Does not pause playback when opened (same as other modals)

---

## Design constraints

- All colors via `C.*` tokens — no hex values
- Consistent with existing modal patterns in the codebase (Keyboard Shortcuts modal is the reference)
- No new design tokens needed — use what exists
- Desktop-first (1280px minimum) — no responsive layout required

---

## Acceptance criteria

- [ ] `docs/specs/known-limitations-panel.md` exists with `Status: Current`
- [ ] Surface type (modal / panel / popover) is specified with rationale
- [ ] All 7 minimum content items are present with specified copy or copy direction
- [ ] Component name is specified
- [ ] Entry point from Help menu is specified
- [ ] ARIA/keyboard behavior is specified (Escape, focus trap if modal)
- [ ] No hex color values in the spec
- [ ] Drop `docs/handoffs/sprint-10-designer-known-limitations-spec-done.md` confirming spec is complete

---

## Reference

- Existing modal pattern to match: Keyboard Shortcuts modal (`?` key) — find in `src/App.tsx`
- Known limitations prose: `docs/guides/dawin-user-guide.md` §17 Known limitations
- Help menu current items: "Keyboard Shortcuts" and "About DAWin" — new item goes between or after
- Design tokens: `C.*` const in `src/App.tsx` (read-only for Designer)

---

## Files to touch

- `docs/specs/known-limitations-panel.md` — create
- `docs/specs/README.md` — add entry
- `docs/handoffs/sprint-10-designer-known-limitations-spec-done.md` — create when done

## Files to not touch

- `src/` — Designer agents may not edit source files
