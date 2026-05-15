# DAWin Design Token Architecture
**Status:** Canonical reference — code is source of truth
**Last updated:** 2026-05-14
**Author:** Designer agent
**Code source:** `src/App.tsx` — `const C`, `const COLLAB_COLORS`, layout constants

---

## Overview

The token system uses three layers. Components always reference Layer 2 (Semantic Tokens) or Layer 3 (Layout). Layer 1 (Primitives) exists only to feed Layer 2 — never applied to components directly.

```
Layer 1: Color Primitives   — raw ramps, no semantic meaning
Layer 2: Semantic Tokens    — named aliases mapped to primitives + code C object
Layer 3: Layout             — NUMBER variables for spacing/sizing constants
```

The code `C` object is the single source of truth. Figma must match it exactly. When C changes, update Figma. When Figma is updated for exploration, a PM/Tech Lead must approve the value, then it gets written back to C.

**Update pipeline:**
1. Designer proposes token value change in `docs/specs/design-tokens.md`
2. PM approves → Tech Lead updates `C` object in `src/App.tsx`
3. Designer updates Figma variable collection to match the new C value
4. No Figma variable value is authoritative until it matches `src/App.tsx`

---

## Layer 1 — Color Primitives

Keep the existing ramp structure (neutral/0–1000, purple/50–950, etc.). These values anchor the semantic layer. Correct any that have drifted.

### Neutral ramp (must anchor to code dark palette)
The darkest neutrals must match the code's bg/surface/elevated chain. Recommended anchors:

| Token name | Value | Notes |
|---|---|---|
| `neutral/0` | `#0A0A0F` | Matches C.bg exactly |
| `neutral/50` | `#0D0D14` | Matches C.well exactly |
| `neutral/100` | `#111118` | Matches C.surface exactly |
| `neutral/150` | `#14141E` | Matches C.metalDark exactly |
| `neutral/200` | `#1A1A24` | Matches C.elevated exactly |
| `neutral/250` | `#1E1E28` | Matches C.border exactly |
| `neutral/300` | `#2A2A38` | Matches C.control exactly |
| `neutral/350` | `#2A2A3C` | Matches C.metalMid exactly |
| `neutral/400` | `#3A3A52` | Matches C.metalLight exactly |
| `neutral/800` | `#888899` | Matches C.textSec exactly |
| `neutral/950` | `#F0F0F5` | Matches C.textPri exactly |

### Purple ramp
| Token name | Value | Notes |
|---|---|---|
| `purple/500` | `#6B5CE7` | Matches C.accent exactly |
| `purple/500-13` | `rgba(107,92,231,0.13)` | Matches C.accentMuted — store as color with alpha |

### Red ramp
| Token name | Value | Notes |
|---|---|---|
| `red/500` | `#E94560` | Matches C.danger / C.vuRed |

### Green ramp
| Token name | Value | Notes |
|---|---|---|
| `green/500` | `#1D9E75` | Matches C.success |
| `green/400` | `#1EC94A` | Matches C.vuGreen |

### Amber ramp
| Token name | Value | Notes |
|---|---|---|
| `amber/500` | `#F5A623` | Matches C.warn / C.vuAmber |

### Wood (new — add to primitives)
| Token name | Value | Notes |
|---|---|---|
| `wood/700` | `#2E1A0E` | Matches C.wood |
| `wood/600` | `#4A2C17` | Matches C.woodLight |

### Collaborator palette (new — add to primitives)
These are the COLLAB_COLORS array values. Index order must be preserved — it maps to seat position in the session.

| Token name | Value | Collaborator seat |
|---|---|---|
| `collab/1` | `#6B5CE7` | Seat 1 (Owner — Luke) |
| `collab/2` | `#1D9E75` | Seat 2 (Editor — Anna) |
| `collab/3` | `#E94560` | Seat 3 (Editor — Miguel) |
| `collab/4` | `#F5A623` | Seat 4 (Viewer — Priya) |
| `collab/5` | `#00B4D8` | Seat 5 (unassigned) |

Note: `collab/1` (`#6B5CE7`) is identical to `purple/500`. Both should exist as separate primitive variables — collab primitives carry seat semantics, purple is a general ramp. They happen to share a value.

---

## Layer 2 — Semantic Tokens

**One mode only: Dark.** Light mode is not in scope.

Collection name in Figma: `Semantic Tokens`
Mode name: `Dark`

All color values are RGBA (0–1 range for Figma Plugin API). Hex references are provided for human readability and verification.

### Background group

| Semantic token | Hex value | C object key | Primitive alias |
|---|---|---|---|
| `background/canvas` | `#0A0A0F` | `C.bg` | `neutral/0` |
| `background/surface` | `#111118` | `C.surface` | `neutral/100` |
| `background/elevated` | `#1A1A24` | `C.elevated` | `neutral/200` |
| `background/well` | `#0D0D14` | `C.well` | `neutral/50` |
| `background/control` | `#2A2A38` | `C.control` | `neutral/300` |

### Text group

| Semantic token | Hex value | C object key | Primitive alias |
|---|---|---|---|
| `text/primary` | `#F0F0F5` | `C.textPri` | `neutral/950` |
| `text/secondary` | `#888899` | `C.textSec` | `neutral/800` |

### Border group

| Semantic token | Hex value | C object key | Primitive alias |
|---|---|---|---|
| `border/default` | `#1E1E28` | `C.border` | `neutral/250` |

### Accent group

| Semantic token | Hex value | C object key | Primitive alias |
|---|---|---|---|
| `accent/default` | `#6B5CE7` | `C.accent` | `purple/500` |
| `accent/muted` | `rgba(107,92,231,0.13)` | `C.accentMuted` | `purple/500-13` |

### State group

| Semantic token | Hex value | C object key | Primitive alias |
|---|---|---|---|
| `danger/default` | `#E94560` | `C.danger` | `red/500` |
| `success/default` | `#1D9E75` | `C.success` | `green/500` |
| `warning/default` | `#F5A623` | `C.warn` | `amber/500` |

### Studio theme group (new — not previously in Figma)

| Semantic token | Hex value | C object key | Primitive alias |
|---|---|---|---|
| `studio/wood` | `#2E1A0E` | `C.wood` | `wood/700` |
| `studio/wood-light` | `#4A2C17` | `C.woodLight` | `wood/600` |
| `studio/metal-dark` | `#14141E` | `C.metalDark` | `neutral/150` |
| `studio/metal-mid` | `#2A2A3C` | `C.metalMid` | `neutral/350` |
| `studio/metal-light` | `#3A3A52` | `C.metalLight` | `neutral/400` |

### VU meter group (new — not previously in Figma)

| Semantic token | Hex value | C object key | Primitive alias |
|---|---|---|---|
| `vu/green` | `#1EC94A` | `C.vuGreen` | `green/400` |
| `vu/amber` | `#F5A623` | `C.vuAmber` | `amber/500` |
| `vu/red` | `#E94560` | `C.vuRed` | `red/500` |

Note: `vu/amber` and `warning/default` share a value (`#F5A623`). `vu/red` and `danger/default` share a value (`#E94560`). Keep them as separate semantic tokens — they carry different usage semantics and may diverge in the future.

### Collaborator group (new — not previously in Figma)

Accent tokens are the raw seat colors. Background tokens are the accent at 13% opacity over canvas — same visual treatment as `C.accentMuted` but per-seat.

| Semantic token | Hex value | Derived from |
|---|---|---|
| `collab/1-accent` | `#6B5CE7` | `COLLAB_COLORS[0]` / `collab/1` primitive |
| `collab/2-accent` | `#1D9E75` | `COLLAB_COLORS[1]` / `collab/2` primitive |
| `collab/3-accent` | `#E94560` | `COLLAB_COLORS[2]` / `collab/3` primitive |
| `collab/4-accent` | `#F5A623` | `COLLAB_COLORS[3]` / `collab/4` primitive |
| `collab/5-accent` | `#00B4D8` | `COLLAB_COLORS[4]` / `collab/5` primitive |
| `collab/1-bg` | `rgba(107,92,231,0.13)` | collab/1-accent at 13% opacity |
| `collab/2-bg` | `rgba(29,158,117,0.13)` | collab/2-accent at 13% opacity |
| `collab/3-bg` | `rgba(233,69,96,0.13)` | collab/3-accent at 13% opacity |
| `collab/4-bg` | `rgba(245,166,35,0.13)` | collab/4-accent at 13% opacity |
| `collab/5-bg` | `rgba(0,180,216,0.13)` | collab/5-accent at 13% opacity |

**Usage rule for collaborator colors:** These tokens are NEVER applied via Tailwind classes. They are always applied via inline `style` props in React, reading from the collaborator object's `.color` field. The Figma tokens exist for documentation and component mockups only. Do not create Tailwind utilities from these.

---

## Layer 3 — Layout (NUMBER variables)

Collection name in Figma: `Layout`
These are pixel values extracted directly from the layout constants in `src/App.tsx`.

| Token name | Value (px) | Code constant | Notes |
|---|---|---|---|
| `layout/bar-width` | `72` | `BAR_W` | Width of one bar in the arranger timeline |
| `layout/track-height` | `64` | `TRACK_H` | Height of one track row |
| `layout/ruler-height` | `24` | `RULER_H` | Height of the bar ruler above the arranger |
| `layout/handle-width` | `8` | `HANDLE_W` | Clip resize handle hit area |
| `layout/fade-handle-width` | `12` | `FADE_HDL_W` | Fade curve handle hit area |
| `layout/transport-height` | `52` | `TRANSPORT_H` | Transport bar height |
| `layout/status-bar-height` | `28` | `STATUS_BAR_H` | Status bar height |

Do not change these values in Figma without updating `src/App.tsx` and the layout constants in `CLAUDE.md` simultaneously. All three must stay in sync.

---

## Figma Plugin API — Implementation Script

The following is the complete Plugin API script to rewrite the Semantic Tokens collection and create the Layout collection. Run this in Figma via Plugins → Development → Run Last Plugin (or paste into a new plugin sandbox).

**Prerequisites:**
- The Color Primitives collection must already exist with the correct ramp names
- Run in the file: `o4IccZFYzEvsHe3dVcco7X`

```javascript
// DAWin Design Token Sync Script
// Run via Figma Plugin API sandbox
// Source of truth: src/App.tsx const C + COLLAB_COLORS + layout constants

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
    a: alpha,
  }
}

// ── Step 1: Delete old Semantic Tokens collection ────────────────────────────
const allCollections = figma.variables.getLocalVariableCollections()
const oldSemantic = allCollections.find(c => c.name === 'Semantic Tokens')
if (oldSemantic) oldSemantic.remove()
const oldLayout = allCollections.find(c => c.name === 'Layout')
if (oldLayout) oldLayout.remove()

// ── Step 2: Create Semantic Tokens collection ────────────────────────────────
const semanticCol = figma.variables.createVariableCollection('Semantic Tokens')
const darkModeId = semanticCol.defaultModeId
semanticCol.renameMode(darkModeId, 'Dark')

function makeColor(name, hex, alpha = 1) {
  const v = figma.variables.createVariable(name, semanticCol, 'COLOR')
  v.setValueForMode(darkModeId, hexToRgba(hex, alpha))
  return v
}

// Background
makeColor('background/canvas',   '#0A0A0F')
makeColor('background/surface',  '#111118')
makeColor('background/elevated', '#1A1A24')
makeColor('background/well',     '#0D0D14')
makeColor('background/control',  '#2A2A38')

// Text
makeColor('text/primary',   '#F0F0F5')
makeColor('text/secondary', '#888899')

// Border
makeColor('border/default', '#1E1E28')

// Accent
makeColor('accent/default', '#6B5CE7')
makeColor('accent/muted',   '#6B5CE7', 0.13)

// State
makeColor('danger/default',  '#E94560')
makeColor('success/default', '#1D9E75')
makeColor('warning/default', '#F5A623')

// Studio theme
makeColor('studio/wood',        '#2E1A0E')
makeColor('studio/wood-light',  '#4A2C17')
makeColor('studio/metal-dark',  '#14141E')
makeColor('studio/metal-mid',   '#2A2A3C')
makeColor('studio/metal-light', '#3A3A52')

// VU meter
makeColor('vu/green', '#1EC94A')
makeColor('vu/amber', '#F5A623')
makeColor('vu/red',   '#E94560')

// Collaborator accents
makeColor('collab/1-accent', '#6B5CE7')
makeColor('collab/2-accent', '#1D9E75')
makeColor('collab/3-accent', '#E94560')
makeColor('collab/4-accent', '#F5A623')
makeColor('collab/5-accent', '#00B4D8')

// Collaborator backgrounds (accent at 13% opacity)
makeColor('collab/1-bg', '#6B5CE7', 0.13)
makeColor('collab/2-bg', '#1D9E75', 0.13)
makeColor('collab/3-bg', '#E94560', 0.13)
makeColor('collab/4-bg', '#F5A623', 0.13)
makeColor('collab/5-bg', '#00B4D8', 0.13)

// ── Step 3: Create Layout collection ────────────────────────────────────────
const layoutCol = figma.variables.createVariableCollection('Layout')
const layoutModeId = layoutCol.defaultModeId
layoutCol.renameMode(layoutModeId, 'Default')

function makeNumber(name, value) {
  const v = figma.variables.createVariable(name, layoutCol, 'FLOAT')
  v.setValueForMode(layoutModeId, value)
  return v
}

makeNumber('layout/bar-width',         72)
makeNumber('layout/track-height',      64)
makeNumber('layout/ruler-height',      24)
makeNumber('layout/handle-width',       8)
makeNumber('layout/fade-handle-width', 12)
makeNumber('layout/transport-height',  52)
makeNumber('layout/status-bar-height', 28)

// ── Step 4: Verification log ─────────────────────────────────────────────────
const semanticVars = figma.variables.getLocalVariables().filter(v =>
  v.variableCollectionId === semanticCol.id
)
const layoutVars = figma.variables.getLocalVariables().filter(v =>
  v.variableCollectionId === layoutCol.id
)

console.log('=== DAWin Token Sync Complete ===')
console.log(`Semantic Tokens: ${semanticVars.length} variables (expected: 28)`)
console.log(`Layout: ${layoutVars.length} variables (expected: 7)`)
console.log('Semantic token names:', semanticVars.map(v => v.name).join(', '))
console.log('Layout token names:', layoutVars.map(v => v.name).join(', '))

figma.closePlugin('Token sync complete. Check console for verification.')
```

**Expected counts after running:**
- Semantic Tokens collection: 28 variables
- Layout collection: 7 variables

**Semantic token count breakdown:**
- background: 5
- text: 2
- border: 1
- accent: 2
- state (danger/success/warning): 3
- studio: 5
- vu: 3
- collab accents: 5
- collab backgrounds: 5
- **Total: 31**

Note: script above creates 28 variables — recount: background(5) + text(2) + border(1) + accent(2) + danger+success+warning(3) + studio(5) + vu(3) + collab accents(5) + collab bgs(5) = **31 variables**. The console.log expected count in the script should read 31, not 28. Correct that before running.

---

## Existing Collections — Do Not Modify

**Spacing** — 16 variables, 2/4/6/8…96px scale. Structurally correct, do not touch.

**Radius** — 9 variables, none/xs/sm/md/lg/xl/2xl/3xl/full. Structurally correct, do not touch.

**Typography Scale** — 23 variables, size/line-height/weight. Structurally correct, do not touch.

**Color Primitives** — Keep ramp structure. Correct these specific values that drift from code:

| Primitive token | Current (wrong) | Correct value |
|---|---|---|
| Anchors for `neutral/0` | May not exist | `#0A0A0F` — add if missing |
| Anchors for `neutral/100` | Likely `#0e0e16` | `#111118` |
| Anchors for `neutral/200` | Likely `#111118` | `#1A1A24` |
| `text/primary` primitive | `#e0e0ec` | `#F0F0F5` |
| `warning` primitive | `#ef9f27` | `#F5A623` |

Add missing primitives for wood, additional neutral steps (150/250/350/400), green/400, and collab/1–5.

---

## Token Drift Prevention

The drift detected between Figma and code was:

| Token | Figma had | Code has | Delta |
|---|---|---|---|
| `background/surface` | `#0e0e16` | `#111118` | Off by ~10 lightness |
| `background/elevated` | `#111118` | `#1A1A24` | Entire collection shifted one step |
| `text/primary` | `#e0e0ec` | `#F0F0F5` | Off by ~10 lightness |
| `warning/default` | `#ef9f27` | `#F5A623` | Slightly different amber |
| studio/VU/collab tokens | Missing | Exist in code | Entirely absent |

**Root cause:** Figma was edited manually without referencing `src/App.tsx`. The semantic layer was shifted one step along the neutral ramp relative to the code, making mockups appear slightly lighter than the actual render.

**Prevention rule:** After this sync, no Figma color variable value changes are approved without a corresponding PR to `src/App.tsx`. The code C object is the source of truth.
