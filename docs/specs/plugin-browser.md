# Spec: Plugin Browser + FX Chain (Studio Rack)

**Status:** Designed (lo-fi + hi-fi mockups complete). Awaiting PM + Tech Lead approval.
**Lo-fi prototype:** [`public/comps/plugin-browser-inline.html`](../../public/comps/plugin-browser-inline.html) · [http://localhost:5173/comps/plugin-browser-inline.html](http://localhost:5173/comps/plugin-browser-inline.html)
**Hi-fi prototype:** [`public/comps/plugin-browser-hifi.html`](../../public/comps/plugin-browser-hifi.html) · [http://localhost:5173/comps/plugin-browser-hifi.html](http://localhost:5173/comps/plugin-browser-hifi.html)
**Current implementation:** `src/App.tsx` — `PluginChainPanel` component, lines 2010–2091.

---

## Decision: inline popover, not modal

The plugin browser opens as an **inline popover** anchored to the FX chain panel, not a modal or full-screen view. Reasoning:

1. **Collaboration context never disappears.** Anna dropping a clip while you're choosing a plugin is part of the product thesis. A modal blocks the session and breaks "Figma for music production."
2. **Speed.** Adding plugins is a frequent action. One click open, click outside to dismiss.
3. **DAW convention.** Ableton, Pro Tools, Logic all use inline pickers from the channel. Modal browsers are a Reason/FL-Studio holdover.
4. **The chain panel already exists as a natural anchor.** No new layout to invent.

For deep discovery (full descriptions, screenshots, presets, "try before you add"), a **"Browse all plugins…"** link in the popover footer opens a richer modal. That's a future spec — out of scope for v1.

---

## Component anatomy

### The Cabinet (FX chain panel)

The existing `PluginChainPanel` becomes a **wooden cabinet** holding rack units.

| Element | Spec |
|---|---|
| Width | 320px (currently 280px — increase by 40px to fit screws + brackets) |
| Background | `var(--wood-dark)` — `#1a1208` |
| Top rail | 26px tall, wood gradient (`#3a2814` → `#1a1208`) with vertical-grain striations, inset highlight on top edge |
| Bottom rail | Mirror of top rail (gradient inverted) |
| Owner-color trim | 2px stripe with glow, runs along the inside edge of both rails — the only place the owner color appears in the chain |
| Rack interior | Very dark (`#060609`) with subtle 4px-wide rack rails on left + right inside edges (the simulated mounting strips) |
| Rail content (top) | "GDAW" brand badge (left) · track name (center, bold) · "X / 8 slots" badge (right) |
| Rail content (bottom) | Drag hint text in caps |

### The Rack Unit (plugin card)

Each plugin in the chain renders as a piece of **studio outboard gear**:

| Element | Spec |
|---|---|
| Height | 84px |
| Layout | `[bracket 14px][faceplate flex 1][bracket 14px]` |
| Brackets | Gunmetal vertical strips (`#4a4a54` → `#18181f` gradient), 2 Phillips screws each (top + bottom) at 6×6px |
| Faceplate | Dark anodized aluminum: `#1f1f27` → `#15151c` → `#0d0d12` vertical gradient, with subtle 1px brushed-metal scanlines at 1.2% opacity |
| Plugin name | 11px font, weight 800, letter-spacing 0.14em, uppercase, color `#d4d4dc` with embossed text-shadow |
| Subtitle | 8px, secondary text, manufacturer-style label (e.g. "Channel Strip · 4-Band", "Vintage · Optical") |
| LCD readout | Black inset (`#050505`) with amber LED-style monospace text (`#f5a623` + glow), 1px black border + inset shadow. Shows 2 key parameters at a glance. |
| Power LED | 18px recessed well with faux-LED dome. Off = dark grey. **On = bright owner color** with `0 0 6px / 0 0 12px` halo glow. |
| Card shadow | `0 3px 6px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)` |
| Hover | Lifts 1px (`translateY(-1px)`) with deeper shadow |

### Empty slot ("Add Unit" affordance)

A **diagonal-striped dashed rectangle** in the cabinet that reads as an empty rack slot:

- Same height as a rack unit (84px)
- Background: 4px/4px diagonal stripes at 2% white
- Border: 1.5px dashed at 12% white
- Label: "+ ADD UNIT" centered, 10px caps with 0.18em tracking
- **Hover:** border + label switch to owner color, with `0 0 16px` halo glow and inset bloom
- **Click:** opens the plugin browser popover

### The Browser (popover)

Stays **clean and functional** — not full rack aesthetic. The browser is a finding tool, not a piece of gear.

| Element | Spec |
|---|---|
| Width | 340px |
| Max height | 480px |
| Position | Absolute, bottom-right of the FX panel, 340px to the left of the cabinet |
| Open animation | `translateX(8px) scale(0.96)` → `translateX(0) scale(1)` with soft spring `cubic-bezier(0.2, 0.9, 0.3, 1.15)`, 240ms |
| Arrow | 14×14 rotated square pointing right into the chain panel |
| Sections | Recent · Favorites · EQ · Dynamics · Reverb & Delay · Modulation · Utility |
| Footer | "Browse all plugins…" link (left) + keyboard hints (right) |

---

## Interaction model

| Gesture | Behavior |
|---|---|
| **Click "+ Add Unit"** | Popover springs in from bottom-right (240ms). Search input autofocuses. |
| **Type to filter** | Categories collapse to match results. Recent + Favorites still visible. |
| **↑↓ keys** | Navigate plugin rows. |
| **Enter** | Add highlighted plugin to chain. Popover closes. New rack unit slides in at the bottom with confirmation pulse (its power LED lights up). |
| **Click a plugin row** | Same as Enter. |
| **Esc or click outside** | Close popover. |
| **Click power LED on a unit** | Toggle enable/disable. LCD readout dims with the LED. Faceplate desaturates slightly. |
| **Hover a rack unit** | Cursor changes to `grab`. Drag handle dots appear on left edge. Unit lifts 1px. |
| **Drag a unit** | Cursor changes to `grabbing`. A purple insertion line glows between rack units to show drop target. |
| **Drop a unit** | The chain reorders. The dropped unit settles with a brief shadow flash. |
| **Click "Browse all plugins…"** | Opens richer modal browser. (Future spec.) |

---

## Owner color application — where it appears

The owner color identifies which collaborator owns the track. In the FX chain it appears only on:

1. **Cabinet trim** — 2px glowing stripes along the inside of each wooden rail
2. **Power LED on enabled units** — the LED glows in owner color
3. **Empty-slot hover state** — border, label, and bloom switch to owner color
4. **Popover search focus ring** + "Browse all plugins…" link color

It does **not** appear on:
- Plugin name text (stays silver for legibility)
- Faceplate color (stays dark gunmetal for "manufactured outboard" feel)
- LCD readout color (stays amber for LED authenticity)
- Brackets / screws (stays gunmetal)

This separation matters. Too much owner color overwhelms the "real gear" aesthetic; this restraint is intentional.

---

## States

| State | Visual |
|---|---|
| **Active** (power on) | Faceplate at full luminance, LCD at full amber glow, power LED bright in owner color |
| **Disabled** (bypassed) | Faceplate `filter: brightness(0.7) saturate(0.8)`. LCD text drops to 18% alpha. Power LED dark grey, no glow. |
| **Hover** | Unit lifts 1px, shadow deepens slightly, drag grip becomes visible |
| **Dragging** | Cursor `grabbing`. Original position shows a faint outline. Insertion line glows between potential drop targets. |
| **Empty chain** | Just the "+ ADD UNIT" empty slot, centered vertically in the rack interior. |
| **Loading a plugin** | Placeholder skeleton unit slides into the chain with a soft pulse. (Future) |

---

## Accessibility

- **Power LED** is a `<button>` with `aria-label="Toggle {plugin name}"` and `aria-pressed` reflecting on/off state.
- **Rack unit** is a `<div role="listitem">` inside `<div role="list" aria-label="FX chain">`.
- **Drag-to-reorder** must support keyboard: with focus on a rack unit, `Cmd/Ctrl + ↑↓` moves it up/down in the chain. Live region announces "Moved {plugin} to position N".
- **Plugin browser popover** is a `role="dialog"` with `aria-modal="false"` (it's a popover, not a true modal), `aria-label="Add plugin"`, and focus is trapped via `Tab` cycling among search → list → footer.
- **Esc** closes the popover and returns focus to the "+ Add Unit" trigger.
- **Reduced motion:** disable the popover spring animation, disable the rack-unit lift on hover. Keep the power LED color change and the drag insertion line — they convey functional information.

---

## DAW convention callouts

- **Order matters in a signal chain.** EQ → Compressor → Reverb is a different sound than Reverb → Compressor → EQ. Drag-to-reorder is non-negotiable.
- **Power = bypass, not delete.** The convention is that disabling a plugin leaves it in the chain (you can re-enable). Delete is a separate action (e.g., right-click menu).
- **Insert vs. send.** This spec covers **inserts** only. Sends (parallel routing to a bus) are a different UI surface, future spec.
- **The browser is a finder, not a configurator.** Don't try to set plugin params in the browser — let the user add the unit and configure it on the rack. Adds happen frequently; the browser must stay fast.

---

## Tokens needed

The hi-fi mockup uses CSS custom properties that should become design tokens in `C`:

| Proposed token | Value | Purpose |
|---|---|---|
| `C.wood.light` | `#3a2814` | Wood rail gradient top |
| `C.wood.mid`   | `#2a1f0e` | Wood rail gradient middle |
| `C.wood.dark`  | `#1a1208` | Wood rail gradient bottom + cabinet bg |
| `C.metal.light` | `#4a4a54` | Bracket gradient top |
| `C.metal.mid`   | `#2a2a34` | Bracket gradient middle |
| `C.metal.dark`  | `#18181f` | Bracket gradient bottom |
| `C.plate.top`   | `#1f1f27` | Faceplate gradient top |
| `C.plate.mid`   | `#15151c` | Faceplate gradient middle |
| `C.plate.bot`   | `#0d0d12` | Faceplate gradient bottom |
| `C.lcd.bg`      | `#050505` | LCD background |
| `C.lcd.amber`   | `#f5a623` | LCD text + glow (reuses `C.warn`) |

Some of these are already used elsewhere (wood for mixer panel cheeks); we should reconcile and unify the wood/metal tokens so the rack and mixer feel like they live in the same studio.

---

## Implement this first

The **lo-fi structure** — popover open/close, power-button toggle, drag-handle affordance, plugin-row rendering — is enough to ship a working v1 that's functionally correct.

The hi-fi treatment (wooden cabinet, brushed-metal faceplates, brackets, screws, LCD readouts) is a separate visual pass that can land in a follow-up commit. Engineering should not try to deliver both at once.

**Step 1 priority for the Frontend Engineer:** wire up the popover open/close + click-outside-to-dismiss + Esc + search + plugin row click handler. The popover content (recent/favorites/categories) can be hardcoded for v1 since the plugin registry isn't wired up.
