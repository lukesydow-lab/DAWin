# Spec: Status Bar

**Status:** Implemented — display only, no interactions.
**Source:** `src/App.tsx` — `StatusBar` component, lines 1958–1982.

---

## Layout

`footer.flex.items-center.px-4.gap-4.flex-shrink-0.text-xs.border-t`. `height: 28px`. `background: C.surface`. `border-color: C.border`. `color: C.textSec`.

Left to right:
1. **Status text** — `"Ready"`. Static string. Future: reflects session state (Recording, Exporting, Syncing).
2. **Pipe separator** — `span`, `color: C.border` (`│`).
3. **Online presence group** — `flex items-center gap-2`:
   - Avatar stack: `flex -space-x-1.5`. Each collaborator gets an `Avatar` (size 18, ring mode) with a ping dot overlay: `absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full`. First dot has `ping-dot` class (expanding ring animation). Second dot is static. Both `background: C.success, opacity: 0.75`.
   - Count label: `"4 online"`, `color: C.success`.
4. **Flex spacer** — `flex-1`.
5. **CPU** — `"CPU 14%"`. Static.
6. **RAM** — `"RAM 1.4 GB"`. Static.
7. **Latency** — `"Latency 12 ms"`. Static.

---

## States

All values are currently hardcoded. When real session data is available, these must become reactive:

| Field | Connected state | Disconnected state |
|---|---|---|
| Status | `"Ready"` / `"Recording"` / `"Exporting"` | `"Offline"` in `C.danger` |
| Online count | Live from session | `"0 online"` |
| CPU | Live from audio engine | — |
| RAM | Live from audio engine | — |
| Latency | Live from network | `"—"` |

---

## Collaborator color tinting

Each avatar in the presence stack uses `collab.color`. The ping dot uses `C.success` (not collab color) — this is correct, it signals "online" not "this specific person".

---

## Accessibility

- `aria-live="polite"` should be added to the status text span so screen readers announce status changes without interrupting.
- The ping dot animation spans should have `aria-hidden="true"` — purely decorative.

---

## Implement this first

No design work blocking here. Add the two ARIA attributes during the accessibility pass for the full app. When real data wiring begins, the status fields become the integration surface.
