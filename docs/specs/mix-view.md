# Spec: Mix View (Mixer Panel + Plugin Chain Panel)

**Status:** Partial — MixerPanel and MixerStrip implemented; MasterStrip partially implemented (height bug documented below); PluginChainPanel implemented with toggle; plugin parameter editing not implemented.
**Source:** `src/App.tsx` — `MixerStrip` (lines 1645–1750), `MixerPanel` (lines 1753–1833), `PluginChainPanel` (lines 2010–2091).

---

## MixerPanel layout

`div.flex-shrink-0.border-t.flex.flex-col.overflow-hidden`. `background: C.surface`. `border-color: C.border`. No fixed height — it sizes to its content.

Internal structure:
1. **Wood top rail** — `.wood-panel.w-full.flex-shrink-0`, `height: 6px`, `border-bottom: 1px solid rgba(255,255,255,0.07)`.
2. **Strips row** — `flex overflow-x-auto`, `padding: 10px 0`, `align-items: flex-end`. Strips align to the bottom edge — this is the standard mixer convention (faders bottom-aligned, labels at top).
   - **Left wood end cheek** — `.wood-panel.flex-shrink-0.self-stretch.rounded-l`, `width: 14px`, `margin: 0 10px`, `minHeight: 60px`, right border `1px solid rgba(255,255,255,0.06)`.
   - **Track strips group** — `flex gap-2 items-end`. One `MixerStrip` per track.
   - **Master strip** — inline, not a separate component. See Master Strip section.
   - **Right wood end cheek** — mirror of left.

---

## MixerStrip layout

Fixed width 64px. `flex flex-col items-center flex-shrink-0 rounded-lg overflow-hidden select-none`. `background: C.elevated`. `border: 1px solid C.control`.

Top to bottom:
1. **Wood + color top cap** — `.wood-panel.w-full.flex-shrink-0`, `height: 8px`, `border-bottom: 2px solid track.owner.color`. The color border at the bottom of the wood cap is the owner color signal for the mixer strip.
2. **Panel body** — `flex flex-col items-center gap-1.5 px-1.5 py-2 w-full`:
   a. **Track name** — `fontSize: 8`, `letterSpacing: 0.08em`, uppercase, `color: C.textSec`, `fontWeight: 700`, truncated.
   b. **FX badge** — `rounded px-1 py-px font-mono`, `fontSize: 8`, `background: C.control`, `color: C.textSec`. Displays `"FX:{count}"`. Clicking this should open the PluginChainPanel for that track — currently missing interaction.
   c. **Pan knob** — `Knob` component, `size={28}`, `label` = pan position string, `color: track.owner.color`. Drag: vertical drag mapped to pan value. Arc color uses `track.owner.color`.
   d. **M / S buttons** — `flex gap-1`. Each: `rounded font-bold flex items-center justify-center transition-all hover:brightness-125`. Dimensions: `width: 22px, height: 14px, fontSize: 8`. Mute: active bg `C.warn`, active color `#000`. Solo: active bg `C.success`, active color `#fff`. Inactive: `C.control` bg, `C.textSec` color. ARIA: `aria-label="Mute"` / `aria-label="Solo"`, `aria-pressed`.
   e. **VU meters + Fader** — `flex items-end gap-1.5`. VU pair on the left, fader on the right. Both sized to `vuHeight = 79px`.
   f. **dB read-out** — `font-mono`, `fontSize: 9`, `color: C.textSec`. Formatted via `formatDb(faderToDb(track.volume))`.
   g. **Owner avatar** — `Avatar` component, `size={16}`, `ring={true}`.
3. **Wood bottom cap** — `.wood-panel.w-full.flex-shrink-0`, `height: 6px`.

---

## VU meter spec

20 segments stacked column-reverse (bottom to top). Segment: `height: 3px`, `borderRadius: 1px`. Gap between segments: 1px.

Color bands:
- Segments 0–12 (frac 0–0.65): `#1EC94A` (vu green) when lit, `C.metalDark` when unlit.
- Segments 13–16 (frac 0.65–0.85): `#F5A623` (vu amber = `C.warn`) when lit.
- Segments 17–19 (frac 0.85–1.0): `#E94560` (vu red = `C.danger`) when lit.

Lit segments have `boxShadow: 0 0 3px ${col}99`. Unlit have none.

L channel level: `track.volume / 100`. R channel: `track.volume / 100 * 0.88` — prototype approximation. Real implementation should use post-fader audio analysis data.

Two 4px-wide columns rendered side by side with `gap: 1px`.

---

## StudioFader spec

`relative flex-shrink-0 select-none`, `width: 22px`, `height: vuHeight (79px)`.

**Groove:** `absolute rounded-full`, `width: 6px`, horizontally centered. Height: `vuHeight - 4px`. Background: `linear-gradient(180deg, C.metalDark 0%, C.well 100%)`, inset shadow. Level fill: `absolute bottom-0 w-full rounded-full`, height `{value}%`, `background: rgba(107,92,231,0.18)` — `C.accent` at 18% opacity.

**Cap:** `absolute cursor-ns-resize`, `width: 22px`, `height: 22px`. Position: `top = padV + (1 - value/100) * travel`. Background: multi-stop linear gradient simulating machined aluminum. Center white line at cap midpoint, grip ridges at ±3 and ±5px from center. `boxShadow: 0 2px 8px rgba(0,0,0,0.75), inset 0 1px 1px rgba(255,255,255,0.12)`.

**Drag:** `cursor-ns-resize`. MouseDown initiates drag: captures `startY` and `startVal`. On mousemove, calculates delta in pixels, maps to value 0–100 via travel distance. On mouseup, clears drag.

**Keyboard interaction:** Not implemented. Faders should support ArrowUp/ArrowDown for fine adjustment when focused. Flag for FE.

**ARIA:** Missing. Should have `role="slider"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow={value}`, `aria-label="{track.name} volume"`.

---

## Master strip

The master strip is rendered inline in `MixerPanel` (not as a separate component). It sits to the right of all track strips and has accent-colored chrome instead of owner-color chrome.

Structure:
- `width: 64px`, `background: C.elevated`, `border: 1px solid ${C.accent}44`.
- **Top cap:** `height: 8px`, `background: C.accent`, `border-bottom: 2px solid C.accent`.
- **Body:**
  - Label `"MSTR"` — `fontSize: 8, letterSpacing: 0.1em, uppercase, color: C.accent, fontWeight: 800`.
  - Pan knob — `Knob size={28} value={50} label="C" color={C.accent}`. Static 50 — not connected to state. No `onChange`. Flag: this knob does nothing.
  - **Height spacer `<div style={{ height: 14 }} />`** — this is the master fader height bug. See bug section below.
  - VU + Fader — same structure as track strips, `vuHeight = 79px`. VU levels hardcoded to 0.92 / 0.88.
  - dB read-out — derived from `masterVol` state.
  - Label `"Master"` — `fontSize: 8, fontWeight: 700, color: C.textPri`.
- **Bottom cap:** `height: 6px`, `background: ${C.accent}44`.

### Master fader height bug (line 1798)

**What is broken:** The master strip renders shorter than the track strips. Track strips contain (top to bottom in the body): name label, FX badge, pan knob, M/S buttons, VU+fader, dB readout, owner avatar. The master strip omits FX badge, M/S buttons, and owner avatar, replacing them with a `<div style={{ height: 14 }} />` spacer.

The spacer value (14px) does not match the combined height of the missing elements:
- FX badge: approximately 16px.
- M/S buttons: 14px height.
- Owner avatar: 16px (size 16) + ring border.

Combined missing vertical bulk: approximately 46–48px. The 14px spacer accounts for less than one-third of this, causing the master strip to bottom-align lower than track strips in the `items-end` flex row.

**The fix:** Replace `<div style={{ height: 14 }} />` with placeholder elements that match the vertical rhythm of track strips: a blank FX badge (`"FX:—"`), invisible M/S button placeholders, and a brand icon or label in the owner avatar slot. Total should be approximately 46–48px of vertical bulk.

---

## PluginChainPanel layout

`flex flex-col flex-shrink-0 border-l overflow-y-auto`. `width: 280px`. `background: C.elevated`. `border-color: C.border`.

Internal structure:
1. **Header** — `flex items-center justify-between px-4 py-3 border-b flex-shrink-0`. Left: `"FX Chain"` label + track name. Right: slot count badge.
2. **Plugin card list** — `flex flex-col gap-2 p-3 flex-1`. One card per plugin slot.
3. **Add Plugin button** — `px-3 pb-3 flex-shrink-0`. `w-full rounded py-2 text-xs font-medium`, `background: transparent`, `border: 1px dashed C.border`, `color: C.textSec`. Stub — no action. ARIA: `aria-label="Add plugin"`.

**Empty state:** `flex items-center justify-center py-8`. Text: `"No plugins on this track"`, `text-xs C.textSec`.

**Plugin card:**
- `rounded-lg p-3`, `background: C.surface`, `border: 1px solid ${slot.enabled ? C.border : C.well}`. `opacity: slot.enabled ? 1 : 0.55`.
- Header row: plugin type label + enable toggle button.
- **Enable toggle:** `rounded-full`, 18×18px. Enabled: `background: C.accent`. Disabled: `background: C.control`. Inner dot: 6×6px circle, white (enabled) / `C.textSec` (disabled). `hover:brightness-125`. ARIA: `aria-label="{type} enabled"`, `aria-pressed={slot.enabled}`, `role="switch"`.
- **Param rows:** up to 3 key-value pairs. Key: `text-xs capitalize C.textSec`. Value: `text-xs font-mono C.textSec`. No interactive editing.

---

## Interactivity gaps (partial implementation)

| Feature | Status | Priority |
|---|---|---|
| FX badge click → focus plugin chain | Missing | High |
| Fader keyboard control (ArrowUp/Down) | Missing | High |
| Fader ARIA role="slider" | Missing | High |
| Master pan knob state connection | Missing | Medium |
| Plugin parameter editing (click value) | Stubbed | Medium |
| Add Plugin action | Stubbed | Medium |
| Plugin reorder (drag slots) | Not started | Low |

---

## Collaborator color tinting

- Mixer strip top cap border: `track.owner.color`.
- Pan knob arc: `track.owner.color`.
- Owner avatar at strip bottom: `track.owner.color`.
- Master strip: all three color positions use `C.accent` instead of an owner color — correct, the master has no owner.

---

## DAW convention callouts

- Mixers are conventionally left-to-right with master on the far right. Current implementation follows this correctly.
- VU meters below the fader cap (not above) is correct for a channel strip — Pro Tools, Logic, and Neve consoles all share this layout.
- M/S buttons at 8px font in a 22×14px hit target are below the 44×44px minimum touch target. Desktop-only tool, so acceptable by DAW convention.
- The wood panel texture at top and bottom of each strip is a deliberate hardware console aesthetic. Do not remove it.

---

## Implement this first

Fix the master fader height bug (line 1798). Replace `<div style={{ height: 14 }} />` with a spacer matching approximately 48px to align the master fader cap with the track fader caps at the bottom-align boundary. This is the most visible layout defect in the mix view.
