# Handoff: Sprint 8 Designer Specs Complete

**Date:** 2026-05-20
**From:** Designer
**To:** Frontend Engineer (via Tech Lead review)
**Sprint:** 8

---

## Summary

Both Sprint 8 Designer specs are written, complete, and committed. Both carry `**Status:** Current`. The Frontend Engineer may begin implementation subject to the gate conditions noted below.

---

## Specs delivered

| Spec | Path | Status | FE gate |
|---|---|---|---|
| Session Lobby | `docs/specs/session-lobby.md` | Current | Backend Engineer must confirm `GET /api/v1/sessions/:id` returns `{ id, name }` before FE begins lobby implementation. Create flow (`POST /api/v1/sessions`) is already available. |
| Application Menu Bar | `docs/specs/application-menu-bar.md` | Current | No backend dependency. FE may begin immediately after Tech Lead approves this handoff. |

---

## What each spec covers

**Session Lobby (`docs/specs/session-lobby.md`):**
- Full-screen takeover rendered when no `?session=` URL param is present
- Lobby card: centered `480px` card on `C.bg` with wood-strip top detail
- Create Session form: session name input + Create button + error state + loading spinner
- Join Session form: session ID input + Join button + "Session not found" error + loading spinner
- Recent sessions: up to 3 entries from `localStorage`, join-on-click, inline error on 404
- Complete input, button, and error state specs (all interactive states defined)
- Keyboard navigation (Tab order, Enter-to-submit on each form, no accidental global shortcuts)
- Full ARIA structure with `role="main"`, `role="alert"`, `aria-live`, `aria-describedby`
- Focus-on-mount: session name input receives `autoFocus`
- Contrast verification: all text passes WCAG 2.1 AA
- "Implement this first" guidance: Create + Join forms before recent sessions

**Application Menu Bar (`docs/specs/application-menu-bar.md`):**
- `24px` fixed bar at `top: 0`, `C.elevated` background, `1px solid C.border` bottom edge
- DAWin wordmark on far left; six menu labels: File, Edit, Session, View, Transport, Help
- Dropdown panel spec: geometry, z-index, open/close behavior, hover-switch behavior
- Complete menu item anatomy: label, shortcut hint, hover/active/stub states
- Full inventory of all 6 menus with every item, separator positions, stub callouts, and shortcut hints
- Keyboard navigation within dropdowns (Arrow keys, Enter, Escape, Tab, ArrowLeft/Right)
- Keyboard Shortcuts Modal: panel layout, two-column shortcut table, complete shortcut inventory (Sprint 8 wired shortcuts only — no aspirational entries), ARIA dialog pattern
- About DAWin Modal: centered `320px` panel, wordmark, "Sprint 8 — Playable Beta", "v0.8.0-beta"
- Layout impact: all `top: TRANSPORT_H` references must shift to `top: 76px`; `MENU_BAR_H = 24` constant defined
- DAW convention callouts: Space guard when menu is open, mouseup-fires-action, Escape propagation stop
- Full ARIA: `role="menubar"`, `role="menu"`, `role="menuitem"`, `aria-haspopup`, `aria-expanded`, `aria-disabled`
- "Implement this first" guidance: bar chrome + all six dropdowns with keyboard nav before wiring actions

---

## Implementation notes for the Frontend Engineer

1. **Existing modal pattern to reference:** `InviteModal` in `src/App.tsx` (line ~4209) — overlay, panel, Escape key handler, click-outside handler. The Keyboard Shortcuts and About modals follow the same structural pattern.

2. **Layout constant to add:** `const MENU_BAR_H = 24`. All panels currently referencing `TRANSPORT_H` (52) as their `top` offset must be updated to `MENU_BAR_H + TRANSPORT_H` (76). Affected: TransportBar, PluginChainPanel, chat panel, icon rail. Search `src/App.tsx` for `top: TRANSPORT_H` and `top: 52`.

3. **Space key guard:** The global `keydown` handler for `Space` (play/pause) must not fire when a menu dropdown item has focus. Guard with: `if ((e.target as HTMLElement).closest('[role="menu"]')) return`.

4. **Escape propagation:** The menu bar's Escape handler must call `event.stopPropagation()` to prevent the global Escape handler from also firing (which would deselect tracks and close modals unintentionally).

5. **`?` shortcut for Keyboard Shortcuts Modal:** Add `if (e.key === '?') { setShowShortcutsModal(true); return }` to the global `keydown` handler (guarded for inputs as usual).

6. **The lobby must suppress global shortcuts:** When the lobby is visible (`!sessionId`), the global `keydown` listener for Space/V/C etc. must not attach. Guard the `useEffect` with `if (!sessionId) return`.

7. **New state in App:** Three new boolean states are needed: `showMixer` (default `true`), `showShortcutsModal` (default `false`), `showAboutModal` (default `false`). The menu bar also needs `openMenu: string | null` (default `null`) to track which dropdown is open.

---

## Open questions before FE begins

1. **Backend confirmation needed for lobby:** Does `GET /api/v1/sessions/:id` currently return `{ id, name }`? The sprint-08.md indicates the Backend Engineer must verify and add `name` field support if missing. FE should not begin the lobby network calls until this is confirmed.

2. **"Open Session…" modal scope:** The File → "Open Session…" item is specced as a small centered modal (not a full lobby takeover). If the Tech Lead has concerns about this pattern (e.g. it implies multi-session capability), flag before implementation. The simplest alternative is to route "Open Session…" to the session lobby (same as "Leave Session") — this is a PM call, not a design call.

---

## Confirmation of spec-vs-implementation check

I have read `src/App.tsx` (layout constants, token definitions, existing modal patterns, existing keyboard shortcut handlers, existing state). Neither spec conflicts with the existing implementation. The specs extend the existing patterns rather than replace them.

The `docs/specs/keyboard-shortcuts.md` living document is consistent with the shortcut inventory in the Keyboard Shortcuts Modal spec — no new shortcuts are proposed that conflict with the reserved keys listed there. The `?` shortcut is not in the reserved list, is not currently bound, and does not conflict with any DAW convention.
