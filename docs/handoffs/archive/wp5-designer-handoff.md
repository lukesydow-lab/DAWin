# WP5 Designer Handoff

**Date:** 2026-05-10
**Author:** Frontend Engineer (claude-sonnet-4-6)
**Source specs:** `track-ownership-design.md`, `mix-view-design.md`

---

## Fixes applied

### Fix 1 — Master fader height bug
**File:** `src/App.tsx`
**Lines changed:** ~1817–1821 (master strip body, inside `MixerPanel`)

Replaced the single `<div style={{ height: 14 }} />` spacer with three placeholder elements that mirror the vertical rhythm of a track strip:

- `<span>FX:—</span>` — same `fontSize: 8`, same `px-1 py-px` padding, same `C.control` background as the `FX:{n}` badge in `MixerStrip`. Renders at ~16px.
- `<div style={{ height: 14 }} aria-hidden="true" />` — matches the M/S button row height.
- `<div style={{ width: 16, height: 16 }} aria-hidden="true" />` — matches the owner avatar slot (`Avatar size={16}`).

The approach is intentionally self-documenting: each placeholder is structurally analogous to the element it stands in for, so the vertical budget is visible without a magic number.

Also took this opportunity to wire Fix 6 on the same Knob line (see below).

### Fix 2 — ARIA on MiniBtn (R, M, S) in track header
**File:** `src/App.tsx`
**Lines changed:** ~510–522 (`MiniBtn` component)

Added `aria-label={title}` and `aria-pressed={active}` to the MiniBtn `<button>`. Because `title` is already the semantic name of the action (`'Record arm'`, `'Mute'`, `'Solo'`) passed from each call site, this single change correctly covers all three buttons without touching the call sites.

### Fix 3 — Viewer role tooltip on disabled buttons
**File:** `src/App.tsx`
**Lines changed:** ~513 (inside `MiniBtn`)

Changed `title={disabled ? \`${title} (view only)\` : title}` to `title={disabled ? 'View only' : title}`. The old form combined two messages into one title string. The new form uses a clean, standalone message for disabled state. The control's accessible name is already carried by `aria-label` (Fix 2), so the tooltip is free to be contextual rather than redundant.

### Fix 4 — Mute/Solo ARIA in MixerStrip
**File:** `src/App.tsx`
**Lines changed:** ~1700–1710 (M/S buttons in `MixerStrip`)

Added `aria-label="Mute"` and `aria-pressed={track.muted}` to the M button; `aria-label="Solo"` and `aria-pressed={track.soloed}` to the S button.

### Fix 5 — StudioFader ARIA + keyboard control
**File:** `src/App.tsx`
**Lines changed:** ~632–712 (`StudioFader` component)

- Added `ariaLabel` prop (default `'Volume'`) to the component signature so the master fader can carry `'Master volume'` and track faders carry `'Volume'`.
- The fader cap `<div>` now has `role="slider"`, `aria-label={ariaLabel}`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-valuenow={Math.round(value)}`, `tabIndex={0}`.
- Added `onKeyDown` handler: `ArrowUp` calls `onChange(min(100, value + 1))`, `ArrowDown` calls `onChange(max(0, value - 1))`.
- The master fader call site (`~line 1840`) passes `ariaLabel="Master volume"`.

### Fix 6 — Master pan knob onChange
**File:** `src/App.tsx`
**Lines changed:** ~1773–1774, ~1817 (inside `MixerPanel`)

Added `const [masterPan, setMasterPan] = useState(0)` at the top of `MixerPanel`. Updated the master strip `<Knob>` to `value={masterPan}` and `onChange={setMasterPan}`, and updated `label` to reflect the actual pan position dynamically (same label logic as `MixerStrip`).

---

## TypeScript check

```
npx tsc --noEmit
```

Exited with no output — zero type errors.

---

## Fixes skipped

None. All six fixes in the implementation spec were completed.

Items listed in the handoff docs as "pending PM decision" were correctly left untouched:
- FX badge click → open plugin chain panel (PM decision pending on popover vs. panel behavior)
- PanKnob editability in track header (PM decision pending)
- Plugin parameter editing, reordering, Add Plugin flow (PM decision pending)
