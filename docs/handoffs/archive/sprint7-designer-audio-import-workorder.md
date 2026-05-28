# Sprint 7 — Designer Work Order: Audio File Import Spec

**Created:** 2026-05-19
**Author:** Tech Lead
**Status:** Active — ready for pickup
**For:** Designer agent
**Delivers to:** Frontend Engineer (spec is the gate before FE starts)

---

## Your task

Complete the `docs/specs/audio-file-import.md` spec scaffold so the Frontend Engineer can implement audio file import in Sprint 7.

The scaffold already exists at `docs/specs/audio-file-import.md`. Every section is marked *"Designer to specify."* Your job is to fill in the interaction detail, visual treatments, and platform notes for each of the 17 sections.

**Do not write frontend code.** Your output is a complete spec document only.

---

## What to read before starting

1. `handoff-documentation/DAWin_CURRENT_CONTEXT.md` — current project state
2. `docs/sprints/sprint-07.md` — full Sprint 7 scope, PM decisions, and constraints
3. `docs/specs/audio-file-import.md` — the scaffold you are completing
4. `docs/specs/arranger-view.md` — existing arranger interaction patterns to stay consistent with
5. `docs/specs/session-communication.md` — existing comment pin patterns (reference for drag-over affordances)
6. `CLAUDE.md` — non-negotiable design constraints (especially: design tokens, collaborator colors, dense information density, desktop-first)

---

## PM decisions already made (do not reopen)

- **Waveform rendering:** local capable-runtime generation behind `PeakGenerator` abstraction
- **Drag source:** file picker + OS drag-and-drop; no in-app file browser panel
- **Clip color:** track owner/collaborator color; not from file metadata
- **Multi-file drop:** single-file only; show "Import one audio file at a time for now"
- **Device scope:** desktop browser + desktop app are primary targets; tablet/mobile need data model support and fallback states only

---

## Design constraints (non-negotiable)

- Never hardcode hex color values — always use `C.*` tokens from `src/App.tsx`
- Collaborator colors via inline `style` props, not Tailwind classes
- Desktop-first — minimum 1280px
- Dense information density is correct for a pro audio tool — do not add whitespace to "clean it up"
- Neve studio visual theme: wood rails, metal surfaces, amber LCDs — all new surfaces must fit this language
- Every new surface must honor the collaborator color model

---

## Definition of done

This work order is complete when:

- [ ] All 17 sections in `docs/specs/audio-file-import.md` are filled in (no remaining *"Designer to specify"* placeholders)
- [ ] The spec covers all required states: drag-over, valid drop, invalid drop, unsupported type, multi-file unsupported, uploading, decoding, placeholder, failed upload, failed decode
- [ ] Platform notes section addresses desktop browser, desktop app, tablet, and mobile
- [ ] Accessibility section covers keyboard alternative, ARIA, screen reader announcements, focus management
- [ ] `Status:` header in `docs/specs/audio-file-import.md` changed from `Draft` to `Current`
- [ ] Handoff dropped at `docs/handoffs/active/sprint7-designer-complete.md`

Do NOT update `STATUS.md` — the Tech Lead owns that file.
Do NOT write to `src/` or `server/`.
