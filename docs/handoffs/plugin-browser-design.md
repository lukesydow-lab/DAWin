# Handoff: Plugin Browser + FX Chain (Studio Rack)

**Spec:** [`docs/specs/plugin-browser.md`](../specs/plugin-browser.md)
**Lo-fi mockup:** [`public/comps/plugin-browser-inline.html`](../../public/comps/plugin-browser-inline.html) · [http://localhost:5173/comps/plugin-browser-inline.html](http://localhost:5173/comps/plugin-browser-inline.html)
**Hi-fi mockup:** [`public/comps/plugin-browser-hifi.html`](../../public/comps/plugin-browser-hifi.html) · [http://localhost:5173/comps/plugin-browser-hifi.html](http://localhost:5173/comps/plugin-browser-hifi.html)
**Date:** 2026-05-13
**Designer:** UX/UI Agent
**Status:** ✅ APPROVED 2026-05-13 — ready for engineering assignment

---

## Approval

Design is approved and locked. The Tech Lead can now break this work down for the engineering team. Remaining items below are **engineering decisions to make during planning**, not blockers on the design.

---

## What's verified working in the hi-fi mockup

Engineering can reference the mockup as the source of truth for interaction behavior. Each of the following is functional and inspectable in the prototype:

- ✅ **Popover open/close** with spring animation, search autofocus, Esc + click-outside dismissal
- ✅ **Power button toggle** — click any LED to bypass/enable a unit; LCD dims with the LED, faceplate desaturates slightly
- ✅ **Drag-to-reorder** — grab any rack unit, drag up or down; purple insertion line shows drop target; release commits the new order
- ✅ **Owner-color swap** — click any of the 5 swatches at the top; trim stripes + power LEDs update live
- ✅ **Empty-slot affordance** — "+ Add Unit" hover-glows in owner color and opens the browser

The drag-to-reorder uses native HTML5 drag-and-drop in the mockup. Engineering can implement equivalent React behavior however fits the codebase (`react-dnd`, `dnd-kit`, or native — Tech Lead's call).

---

## What this covers

The complete design for the plugin browser interaction and the FX chain panel:

1. **The interaction model** — inline popover anchored to the chain panel (not a modal)
2. **The lo-fi UI** — structure, behaviors, hierarchy, drag-to-reorder, power button (not toggle switch)
3. **The hi-fi visual treatment** — wooden cabinet, brushed-metal rack units, screws, LCDs, recessed power LEDs glowing in the owner color
4. **The escape hatch** — "Browse all plugins…" footer link opens a richer modal for deep discovery (future spec)

---

## Decisions locked in

1. **Inline popover, not modal.** Decided after weighing modal/inline/full-screen options. Inline keeps the collaborative session visible, matches DAW convention, and uses the existing chain panel as a natural anchor.
2. **Power button (round LED), not toggle switch.** Reads as a hardware power button. Matches studio-rack aesthetic and convention (every piece of outboard has a power LED).
3. **Drag to reorder is mandatory.** Order matters in a signal chain; the affordance and interaction are specified.
4. **Owner color appears only on cabinet trim, power LEDs, and empty-slot hover** — not on plugin faceplates or text. Restraint preserves the "real gear" aesthetic.
5. **The browser popover stays clean, not full rack.** It's a finding tool, not a piece of gear.
6. **Hi-fi treatment is a separate visual pass** — the lo-fi structure is enough to ship v1 functional behavior; the rack styling lands in a follow-up.

---

## Approval requested for:

### From PM
- [ ] Decision on **modal vs. inline** approach (recommendation: inline)
- [ ] Decision to use **rack-unit hi-fi aesthetic** as the visual direction (vs. flat cards)
- [ ] **Scope of v1:** confirm we ship the lo-fi structure first, hi-fi treatment in a follow-up commit
- [ ] **"Browse all plugins…" modal** — deferred to a future spec, or in scope for v1?
- [ ] **Manufacturer subtitles** (e.g., "Channel Strip · 4-Band", "Vintage · Optical") — does each plugin metadata need a subtitle field?
- [ ] **Plugin registry** — where does the catalog of available plugins live? Hardcoded for v1, server-driven later?

### From Tech Lead
- [ ] Plugin data model — confirm the shape needed to render rack units (name, subtitle, params display, enable state, position, owner-bind)
- [ ] **Drag-to-reorder implementation** — is `react-dnd` already in the project? If not, native HTML5 drag-drop is sufficient.
- [ ] **Plugin enable/disable** — bypass logic in the audio graph (skip plugin's processor when disabled, not unload)
- [ ] **Token reconciliation** — the wooden cabinet rails already exist in the mixer panel CSS. We should extract `C.wood.*` and `C.metal.*` token groups and unify both surfaces so the rack and mixer feel like one studio.
- [ ] **Performance budget** — at 8 plugin slots × multiple selected tracks rendering, are we OK with the brushed-metal scanline gradient + multi-layer box-shadows on each rack unit? (My read: yes, but worth confirming.)
- [ ] **Keyboard reorder** — `Cmd/Ctrl + ↑↓` to move a focused unit up/down in the chain. Confirm key binding doesn't collide with anything else.

---

## What you'll see in the mockups

### Lo-fi (`/comps/plugin-browser-inline.html`)
- 6 plugin cards in the FX chain on the right
- "+ Add Plugin" button at the bottom
- Click it → popover springs in from bottom-right with search, Recent, Favorites, and categorized list
- Round purple power-button on each card (click to toggle bypass)
- Drag-grip dots on the left edge of each card (visible on hover)
- 4 annotation cards below explaining anchor/placement, hierarchy, interaction, power button + drag, hi-fi direction, and escape hatch

### Hi-fi (`/comps/plugin-browser-hifi.html`)
- Wooden cabinet with GDAW brand on the top rail, track name center, slot count right
- Owner-color trim stripes glowing inside the rails
- 3 rack units (Parametric EQ active, Compressor active, Plate Reverb bypassed)
- Each with: 2 screws on each bracket, embossed plugin name, manufacturer subtitle, amber LCD parameter readout, glowing power LED in owner color
- "+ ADD UNIT" diagonal-striped empty slot below
- Owner-color picker at the top of the page — click swatches (purple, red, green, amber, blue) to see the rack trim + power LEDs update
- 6 annotation cards covering cabinet, rack unit, power LED, drag, empty slot, browser

---

## FE implementation priority

1. **Replace the existing `PluginChainPanel` content** in `src/App.tsx` (lines 2010–2091) with the new structure — but ship as **lo-fi first**.
2. **Wire the popover open/close** with click-outside, Esc, and search focus.
3. **Wire the power button** to toggle the plugin's enable state.
4. **Wire drag-to-reorder** between the existing plugin slot positions in the `pluginChains` state.
5. **Add the empty-slot affordance** as the popover trigger (replaces the existing dashed "+ Add Plugin" button).
6. **Hi-fi visual pass** in a separate commit: wooden cabinet rails, brushed-metal faceplates, screws, LCD readouts, recessed power LEDs.

Don't skip steps 2–5 to get to step 6. The functional behavior is more valuable than the aesthetic for the first ship.

---

## Open question for both PM + Tech Lead

**How does the v1 plugin browser handle "no plugins available yet"?** When the audio engine isn't wired up to a real plugin registry, the popover content is placeholder. Two options:

- **(a) Allow selecting from the placeholder list** — adding a unit creates a UI-only rack unit with no audio effect. Useful for design review, useless for music production.
- **(b) Show "No plugins loaded" empty state** in the popover when the registry is empty. Honest but blocks the entire design flow until plugins are wired.

My recommendation: (a) for the design prototype phase, switch to (b) when real plugin support lands. The placeholder rack units exist in mock state today (`pluginChains` in `src/App.tsx`).

---

## Confirmation

- [x] Read existing `PluginChainPanel` implementation in `src/App.tsx`
- [x] Read the lo-fi feedback round (toggle → power button, drag-to-reorder)
- [x] Both mockups verified rendering correctly in the browser
- [x] Spec aligns with current `pluginChains` state shape (slots with id, type, params, enabled)
- [x] No conflicting handoffs in `docs/handoffs/`
- [x] Nav widget updated to include both mockups under "Comps"
