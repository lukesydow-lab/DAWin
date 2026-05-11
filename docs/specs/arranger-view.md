# Spec: Arranger View

**Status:** Implemented — clip drag/resize/fade, cut tool, crossfade tool, playhead, collaborator presence cursors, context menu, bounce modal all implemented.
**Source:** `src/App.tsx` — `ArrangeView` (lines 1263–1634), `Clip` (lines 863–1079), `ContextMenu` (lines 1082–1121), `Toolbar` (lines 752–776).

---

## Layout

`div.flex-1.flex.flex-col.overflow-hidden`.

Top to bottom:
1. **Toolbar row** — `flex flex-shrink-0`. Left: `Toolbar` component. Right: `div.flex-1.border-b` (extends border across ruler area).
2. **Main area** — `flex-1 flex overflow-hidden`. Left column: track headers. Right area: scrollable grid.

---

## Toolbar

`div.flex.items-center.gap-1.px-3.flex-shrink-0.border-b.border-r`. `height: RULER_H (24px)`. `background: C.surface`. Three tool buttons:

- **Select (V)** — icon `↖`. Active: `background: C.accent`, `color: #fff`. Inactive: `background: C.control`, `color: C.textSec`.
- **Cut (C)** — icon `✂`. Same state colors.
- **Crossfade (X)** — icon `⋈`. Same state colors.

Each button: `22×18px`, `rounded text-xs transition-all hover:brightness-125`. ARIA: `aria-label` matching label, `aria-pressed` reflecting active tool. `title` attribute: `"{label} ({shortcut})"`.

Hint text to the right: `text-xs C.textSec`. Changes based on active tool.

---

## Track header column

`flex-shrink-0 flex border-r`, `width: 196px`. Left-side wood grain strip: `.wood-panel.flex-shrink-0`, `width: 6px`. Right: `flex flex-col flex-1 background: C.surface`. Spacer div at top: `height: RULER_H (24px)`. Track header list: `overflow-y-auto overflow-x-hidden flex-1`.

**Scroll sync issue:** Track headers and the grid are separate scroll containers. Y-scroll is not synchronized. Flag for FE: implement synchronized scroll — when grid scrolls vertically, headers must scroll to match.

---

## Grid

`div.flex-1.overflow-auto`, `background: C.bg`. Contains a `div` sized to `minWidth: BARS * BAR_W (32 * 72 = 2304px)` with `position: relative`.

**Ruler:** `flex.sticky.top-0.z-10.border-b.select-none`. `height: RULER_H (24px)`. `background: C.surface`. Clickable for seek. Each bar cell: `width: BAR_W (72px)`, `border-r C.border`. Bar number text: `text-xs pl-1.5`. Downbeat bars (i % 4 === 0): `C.textSec, fontWeight: 600`. Off-beat bars: lighter weight.

**Track rows:** One `div` per track. `height: TRACK_H (64px)`. `border-b`, `border-color: C.well`. Background alternates: even rows `C.surface`, odd rows `C.bg`. When armed and recording: `linear-gradient(90deg, ${C.danger}18 0%, {row base color} 200px)`. Opacity: `0.4` when muted or when another track is soloed. Left border: `2px solid presence.color` when a collaborator's presence is on this row.

**Bar cells:** `BARS (32)` divs per row. `width: BAR_W (72px)`. `border-r`: major grid at every 4th bar `C.border`, minor grid `C.well`. Downbeat cells: `background: rgba(255,255,255,0.025)`. Sub-beat lines at 25%, 50%, 75%: `width: 1px, background: rgba(255,255,255,0.03)`.

---

## Clip component

`div.absolute.top-1.5.bottom-1.5.rounded.overflow-hidden.select-none`. Positioned by `left: clip.bar * BAR_W + 2px`. Width: `clip.len * BAR_W - 4px`.

**Background texture:**
- Audio tracks: `repeating-linear-gradient(180deg, ...)` — horizontal scan-line pattern in owner color at 13%/4% opacity.
- MIDI tracks: `repeating-linear-gradient(90deg, ...)` — vertical tick pattern in owner color at 9%/3% opacity.

**Borders:** `border-left: 2px solid track.owner.color`. Inset: `box-shadow: inset 0 0 0 1px ${track.owner.color}44`.

**Hover:** `outline: 1px solid ${track.owner.color}88`, `filter: brightness(1.12)`.

**Drag states:**
- Dragging (same track): `opacity: 0.85`, `filter: brightness(1)`, `zIndex: 20`.
- Ghost (original position during cross-track drag): `opacity: 0.35`.
- Drop target ghost (on destination track): dashed border `C.success` (valid) or `C.danger` (invalid type mismatch). Background `${C.success}12` or `${C.danger}12`.

**Waveform canvas:** `canvas.absolute.inset-0.pointer-events-none`. `opacity: 0.55`. Only rendered when `clip.assetUrl !== null` and AudioContext is initialized. Fill: `owner.color + CC` (80% opacity). Stroke: `owner.color + FF`.

**Clip label:** `absolute inset-0 flex items-center px-2`. `font-bold uppercase truncate`, `fontSize: 10`, `letterSpacing: 0.08em`, `color: track.owner.color`, `textShadow: 0 0 8px ${owner.color}66`.

**Resize handles:** Left and right edges, `width: HANDLE_W (8px)`. `cursor: ew-resize`. Gradient from `owner.color + 55` to transparent. Inner bar: `2px wide, 20px tall, background: owner.color`. Opacity: 1 on hover, 0.5 idle. Select tool only.

**Fade handles:** Triangles at top-left (fade-in) and top-right (fade-out). `FADE_HDL_W = 12px` square hit area. SVG polygon filled with `owner.color`. Opacity: 0.9 on hover, 0.55 idle. Select tool only.

**Fade overlay:** SVG path fills the clip from left (fade-in) or right (fade-out) with `C.bg` at `opacity: 0.72`. Shape determined by `FadeCurve` — linear, ease, or sharp.

**Fade curve picker:** Shown on hover when a fade exists, Select tool active. Three buttons at bottom-right: `—` (linear), `∫` (ease), `⌐` (sharp). `fontSize: 8`. Active: `C.accent` bg, white text. Inactive: `C.control` bg, `C.textSec` text.

---

## Playhead

`div.absolute.top-0.bottom-0.pointer-events-none`. `left: playheadBar * BAR_W`. `zIndex: 30`.

- **Triangle head:** `svg 13×11px`, `position: absolute top-5 left-−6`. Polygon: `fill: C.accent`, `filter: drop-shadow(0 0 3px C.accent)`.
- **Vertical line:** `position: absolute top-RULER_H bottom-0 left-0 width-1`. `background: C.accent, opacity: 0.75`. `boxShadow: 0 0 6px ${C.accent}88, 0 0 2px ${C.accent}`.

---

## Collaborator presence cursors

One per entry in `DEMO_PRESENCE`. Each:
- `div.absolute.top-0.bottom-0.pointer-events-none`. `left: presence.playheadBar * BAR_W`. `zIndex: 25`.
- **Avatar chip:** 18×18px circle, `background: presence.color`, white initial, `fontSize: 9`, `boxShadow: 0 0 4px ${presence.color}88`.
- **Vertical line:** 1px, `background: presence.color`, `opacity: 0.6`.

---

## Context menu

`div.fixed.z-50.rounded-lg.shadow-2xl.py-1.min-w-40`. `background: C.elevated`. `border: 1px solid C.border`. Position: `top: menu.y, left: menu.x`.

Closes on any `mousedown` outside. Items:
- Bounce to Audio (MIDI only) — accent color.
- Delete clip — danger color.
- Duplicate — primary text.
- Loop region — disabled (soon).
- Rename — disabled (soon).

Disabled items: `opacity: 0.4`, `cursor: default`. No hover effect on disabled items.

ARIA: `role="menu"` on container, `role="menuitem"` on each button. Currently missing.

---

## Bounce modal

Triggered from context menu on MIDI clips. `div.fixed.inset-0.z-50.flex.items-center.justify-center`. Overlay `rgba(0,0,0,0.75)`. Card: `width: 580px, maxHeight: 82vh`. `background: C.elevated`. `border: 1px solid C.control`. `rounded-xl shadow-2xl flex flex-col`.

Left column (260px): instrument browser with category tabs and instrument list.
Right column (flex-1): preset grid + AI Humanizer toggle + render button.

Humanizer toggle: `36×20px` pill. Active: `C.accent`. Inactive: `C.control`. White circle thumb slides left/right.

Render button: Active: `C.accent` bg. Loading: `C.control` bg, `C.textSec` text, `animate-spin` spinner.

Escape closes modal.

---

## Tool behaviors

| Tool | Clip click | Clip drag | Grid click | Resize handles | Fade handles |
|---|---|---|---|---|---|
| Select | — | Move clip | Seek | Visible, resize | Visible, adjust |
| Cut | Split at cursor | — | — | Hidden | Hidden |
| Crossfade | — | — | — | Hidden | Hidden |

Crossfade tool: no implemented behavior beyond cursor — stub.

---

## DAW convention callouts

- Drag-to-move with snap to half-bar (`snapBar` function) is correct.
- Cross-track type validation (Audio → Audio, MIDI → MIDI only) is correct. Bus tracks cannot receive clip drops.
- Right-click context menu is the standard DAW clip interaction pattern.
- The cut tool crosshair cursor on the grid is correct — matches Ableton's razor tool.
- The fade overlay using `C.bg` at 72% opacity creates a fade visualization that depends on clip background. Monitor against very bright collaborator colors.

---

## Implement this first

Synchronized Y-scroll between the track header column and the grid. Without this, when there are more tracks than fit in the viewport, the headers and the grid rows will desync on scroll — a fundamental DAW layout failure.
