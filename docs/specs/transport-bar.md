# Spec: Transport Bar

**Status:** Implemented — this spec documents and hardens what exists.
**Source:** `src/App.tsx` — `TransportBar` component, lines 1843–1901.

---

## Layout

A `header` element, `flex items-center px-4 gap-5 flex-shrink-0 border-b`. Height 52px. Background `C.surface` (`#111118`). Border color `C.border` (`#1E1E28`).

Left to right:

1. **Logo wordmark** — `"COLLAB.DAW"`, `font-bold text-sm tracking-widest`, color `C.accent` (`#6B5CE7`). No click target. Static brand identity — do not make this a link without PM sign-off on navigation intent.

2. **Vertical divider** — 1px wide, 28px tall, `background: C.border`. Purely decorative.

3. **Transport controls group** — `flex items-center gap-2`:
   - **RTZ button** (`⏮`) — 28×28px, `background: C.control`, `color: C.textSec`. `hover:brightness-125 active:brightness-90`. ARIA: `aria-label="Return to zero"`.
   - **Play/Pause toggle** — 32×28px. Idle: `background: C.control`, `color: C.textSec`. Active (playing): `background: C.accent`, `color: #fff`, `boxShadow: 0 0 12px ${C.success}66, 0 0 4px ${C.success}44`. Icon switches between `▶` (paused) and `⏸` (playing). ARIA: `aria-label="Play"` / `aria-label="Pause"` toggled on state. `aria-pressed` attribute must match playing state.
   - **Stop button** (`⏹`) — 28×28px, same idle style as RTZ. ARIA: `aria-label="Stop"`.
   - **Record arm button** (`⏺`) — 32×28px. Idle: `background: C.control`, `color: C.danger`. Armed: `background: C.danger`, `color: #fff`, `boxShadow: 0 0 12px ${C.danger}66`, class `record-pulse` (CSS keyframe animation in App.css). ARIA: `aria-label="Record"`, `aria-pressed` reflects `isRecording`. This button pulses visually when active — the pulse is defined in `App.css` as `record-pulse` keyframes on `box-shadow`.

4. **BPM display** — Inset well: `background: C.well`, `border: 1px solid ${C.border}`, `boxShadow: inset 0 1px 3px rgba(0,0,0,0.6)`, `rounded px-2.5 py-1`. Contains label `"BPM"` (`text-xs C.textSec`) and a number `input` (`type="number"`, `min=40 max=300`). Input style: `w-12 bg-transparent font-mono text-sm font-semibold tabular-nums text-right`, `color: C.success`, `outline: none`, `caretColor: C.accent`. Value clamped 40–300 on both `onChange` and `onBlur`. ARIA: `aria-label="Beats per minute"` on the input.

5. **Position display** — Same inset well as BPM. Label `"POS"` (`C.textSec`). Value is formatted as `BBB.b.ttt` (bar, beat, ticks) in `C.textPri`, `font-mono font-semibold tabular-nums`. Read-only — not interactive. ARIA: `aria-label="Playhead position"` on the value span, `aria-live="off"` (updating too fast to announce).

6. **Flex spacer** — `flex-1` pushes the right group to the far edge.

7. **Right group** — `flex items-center gap-3`:
   - Label `"Live session"` in `C.textSec text-xs`.
   - **Collaborator avatar stack** — `flex -space-x-2`. One `Avatar` per collaborator, size 26px. Each avatar circle: `background: collab.color`, `border: 2px solid C.bg` (to create stack separation). Title tooltip shows `"{name} ({role})"`. No click target currently — future: clicking avatar opens that user's profile or jumps to their playhead.
   - **Invite button** — `rounded px-3 py-1 text-xs font-medium`, `background: C.accentMuted` (`rgba(107,92,231,0.13)`), `color: C.accent`, `border: 1px solid ${C.accent}44`. `hover:brightness-125`. ARIA: `aria-label="Invite collaborator"`. Opens InviteModal.

8. **Connection status** — `flex items-center gap-1.5`. Dot: `w-2 h-2 rounded-full`, `background: C.success`, `boxShadow: 0 0 6px ${C.success}`. Label `"Connected"` in `C.textSec text-xs`. In a future disconnected state: dot turns `C.danger`, label reads `"Disconnected"`.

---

## Interactive states

### Play/Pause
- **Idle (paused):** `C.control` bg, `C.textSec` icon.
- **Active (playing):** `C.accent` bg, white icon, success-tinted glow.
- **Focus-visible:** `outline: 2px solid C.accent; outline-offset: 2px` (from App.css global rule).
- **Disabled:** not applicable — play is always available.

### Record
- **Idle:** `C.control` bg, `C.danger` icon color (red icon on dark bg signals danger affordance even when off).
- **Armed:** `C.danger` bg, white icon, `record-pulse` box-shadow animation.
- **Disabled for Viewer role:** not yet implemented. Viewers should see the button at 40% opacity with `pointer-events: none` and `cursor: not-allowed`. Flag for FE.

### BPM Input
- **Idle:** no outline.
- **Focus:** `outline: 2px solid C.accent; outline-offset: 2px`.
- **Invalid (out of range):** currently silently clamped — no error state shown. Acceptable for now; flag if PM wants explicit feedback.

### Invite button
- **Idle:** `C.accentMuted` bg, `C.accent` text.
- **Hover:** `brightness-125`.
- **Active (modal open):** no visual difference currently. Consider adding `C.accent` border at full opacity as an active indicator.

---

## Keyboard navigation

All transport buttons are native `button` elements and receive Tab focus. Tab order left to right matches visual order: RTZ → Play → Stop → Record → BPM input → Invite. The position display is not interactive and must not receive focus (`tabindex="-1"` if it is ever a focusable element).

---

## ARIA labels (complete list)

| Element | `aria-label` | `aria-pressed` |
|---|---|---|
| RTZ (`⏮`) | `"Return to zero"` | — |
| Play/Pause | `"Play"` / `"Pause"` | `true` when playing |
| Stop | `"Stop"` | — |
| Record | `"Record"` | `true` when recording |
| BPM input | `"Beats per minute"` | — |
| Invite button | `"Invite collaborator"` | — |

None of these ARIA labels are in the current implementation. This is the primary accessibility gap in the transport bar.

---

## Collaborator color tinting

The avatar stack in the transport bar shows each collaborator's hex color as the avatar background. This is the first place in the UI where tinting appears — it sets the expectation for the track header and clip tinting below.

---

## DAW convention callouts

- Stop-without-RTZ is correct. Pro Tools, Logic, and Ableton all separate stop from RTZ. The current implementation is correct.
- BPM range 40–300 is standard. Some tools allow sub-40 for experimental use; out of scope for now.
- Record button uses `C.danger` red. In Pro Tools the record arm is always red. Do not change this color — it is a hard DAW convention.
- The `⏮⏹▶⏺` Unicode symbols are serviceable prototyping placeholders but should be replaced with custom SVG icons in production to avoid rendering inconsistencies across OS.

---

## Implement this first

Add `aria-label` and `aria-pressed` to the four transport buttons (RTZ, Play/Pause, Stop, Record). These are icon-only controls — without ARIA labels they are invisible to screen readers and fail WCAG 2.1 AA.
