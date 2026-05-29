# Work Order: Designer — Complete §Interaction Model in Arranger Zoom Spec

**To:** Designer
**From:** PM
**Sprint:** 9
**Date issued:** 2026-05-29
**Priority:** Gate-blocking — FR-02 keyboard shortcut implementation is blocked until this section is complete.

---

## Objective

Fill the `§Interaction Model` placeholder section in `docs/specs/arranger-zoom.md`.

The spec is otherwise complete. The `§Interaction Model` section contains a placeholder that explicitly blocks the Frontend Engineer from implementing zoom keyboard shortcuts and scroll-wheel behavior. Your task is to replace that placeholder with a finished, implementable spec.

---

## File to edit

`docs/specs/arranger-zoom.md` — edit only the `§Interaction Model` section (lines marked as placeholder). Do not change any other section of the spec.

---

## Sections you must complete

### 1. Horizontal zoom keyboard shortcuts
- What key combination zooms in? (e.g., `Cmd+=`, `Cmd++`)
- What key combination zooms out? (e.g., `Cmd+-`)
- What key resets zoom to `1.0×`? (e.g., `Cmd+0`)
- Research reference: check Ableton Live 12, Logic Pro 11, Pro Tools 2024, and Reaper 7 for conventions. Choose the most common mapping or the one most appropriate for a browser app (avoid OS-reserved combos).

### 2. Scroll wheel behavior
- Does the scroll wheel scroll the timeline horizontally (default) or zoom it?
- Does holding a modifier key (e.g., `Ctrl` or `Cmd`) toggle the scroll wheel into zoom mode?
- What is the zoom step per wheel tick? (The spec default is `0.25` — confirm or adjust.)
- Note: browser scroll wheel interception requires `{ passive: false }` — flag this for the FE if applicable.

### 3. Zoom anchor behavior
- When zoom changes, does the viewport anchor to: the playhead position, the cursor position, or the viewport center?
- If the playhead is off-screen, what is the fallback anchor?
- The spec provides a `scroll-to-playhead` implementation using `requestAnimationFrame` — confirm this approach or specify an alternative.

### 4. Zoom level indicator placement and format
- The spec proposes a read-only text readout showing e.g. `"100%"`.
- Confirm format: `"100%"` or `"1×"` or `"72px/bar"`?
- Confirm placement: in the arranger toolbar area (the spec suggests this). Specify exact position — left of the track headers, right side of ruler, or elsewhere?
- The indicator is non-interactive (read-only text, `C.textSec`, 11px monospaced). Confirm or adjust.

### 5. Pinch gesture scope decision
- This is a desktop-first product (minimum 1280px). State explicitly: pinch-to-zoom on trackpad is **in scope** or **out of scope** for Sprint 9.
- Expected answer: out of scope. Desktop-first mandate applies; trackpad pinch requires separate scoping.
- If out of scope, note it as a future consideration.

### 6. Ruler tick subdivision thresholds (confirm or adjust)
- The spec proposes: `>= 2.0` show quarter-note subdivisions; `1.0–2.0` bar numbers only; `< 1.0` suppress alternating labels when `barW < 36px`.
- Confirm these thresholds are correct, or adjust based on your research.

---

## Design token reminder

Do not introduce any hex color values. Any color references must use `C.*` token names (e.g., `C.textSec`, `C.accent`). The FE will map these to hex values from the `C` const in `src/App.tsx`.

---

## Constraints

- Edit only `docs/specs/arranger-zoom.md` — specifically only the `§Interaction Model` section.
- Do not write to `src/` — Designer agents may not edit source files.
- Do not create new spec files — only amend the existing one.
- Keep the spec implementable: avoid vague language like "feels natural." Every behavior must be specified precisely enough for the FE to implement without follow-up questions.

---

## Acceptance criteria

- [ ] `§Interaction Model` section in `docs/specs/arranger-zoom.md` has no placeholder text remaining
- [ ] Horizontal zoom in/out/reset keyboard shortcuts are specified (key combos listed explicitly)
- [ ] Scroll wheel behavior is specified (default behavior + modifier key if applicable)
- [ ] Zoom step per wheel tick is confirmed or adjusted from the spec default of `0.25`
- [ ] Zoom anchor behavior is specified (playhead-centered or cursor-centered; off-screen fallback)
- [ ] Zoom level indicator format and placement are confirmed
- [ ] Pinch gesture scope is explicitly stated (in scope or out of scope)
- [ ] Ruler tick thresholds are confirmed or adjusted
- [ ] No hex color values in the spec — `C.*` tokens only
- [ ] Drop `docs/handoffs/active/sprint-09-designer-zoom-interaction-done.md` confirming section is complete, so PM can unblock FR-02 FE pass 2

---

## Reference

- Full spec: `docs/specs/arranger-zoom.md`
- Existing zoom state model (do not change): `§Horizontal Zoom Model` and `§Vertical Zoom Model` sections of the same spec
- Zoom step default: `0.25` (confirm or adjust in your spec)
- Zoom range: `0.25×` to `4.0×` (fixed — do not change)
