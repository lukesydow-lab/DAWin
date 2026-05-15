# Handoff: Figma Design Token Sync
**Date:** 2026-05-14
**Author:** Designer agent
**Status:** Spec complete — Figma write blocked (see below)

---

## What this covers

Full token architecture audit and rewrite spec for the Figma design system file `o4IccZFYzEvsHe3dVcco7X`. The goal was to make Figma match `src/App.tsx` exactly, with code as the source of truth.

Spec file: `/Users/lukesydow/daw-design/docs/specs/design-tokens.md`

---

## Blocker: use_figma tool not available

The task brief references a `use_figma` tool that executes Plugin API JavaScript against the Figma file. This tool does not exist in the current MCP server configuration. The available Figma MCP tools are read-only (get_metadata, get_design_context, get_variable_defs) and Code Connect oriented.

**What this means:** The Figma variable collections cannot be updated programmatically from this agent context. A human must run the plugin script manually, or the MCP server must be extended with a plugin execution tool.

---

## How to complete the Figma update

The spec contains a complete, copy-paste-ready Plugin API script. To run it:

1. Open the Figma file: https://www.figma.com/design/o4IccZFYzEvsHe3dVcco7X/GDAW---Design-System-
2. Go to Plugins → Development → Open Console (or use a plugin runner like "Scripter")
3. Paste the script from the "Figma Plugin API — Implementation Script" section of `docs/specs/design-tokens.md`
4. Fix the expected count in the `console.log` from 28 to 31 before running
5. Run — the script deletes the old Semantic Tokens and Layout collections, recreates them cleanly, and logs a verification summary to console

Expected output:
- Semantic Tokens collection: 31 variables (Dark mode only)
- Layout collection: 7 variables

---

## What the spec defines

**Token corrections (existing Figma values that are wrong):**
- `background/surface`: was `#0e0e16`, must be `#111118`
- `background/elevated`: was `#111118`, must be `#1A1A24`
- `text/primary`: was `#e0e0ec`, must be `#F0F0F5`
- `warning/default`: was `#ef9f27`, must be `#F5A623`

**New token groups not previously in Figma:**
- `background/well`, `background/control` — C.well and C.control
- `border/default` — C.border
- `accent/muted` — C.accentMuted
- `studio/wood`, `studio/wood-light`, `studio/metal-dark`, `studio/metal-mid`, `studio/metal-light`
- `vu/green`, `vu/amber`, `vu/red`
- `collab/1-accent` through `collab/5-accent`
- `collab/1-bg` through `collab/5-bg`
- Layout NUMBER collection: bar-width, track-height, ruler-height, handle-width, fade-handle-width, transport-height, status-bar-height

**Collections left untouched:**
- Spacing (16 vars) — correct
- Radius (9 vars) — correct
- Typography Scale (23 vars) — correct
- Color Primitives (68 vars) — needs manual value corrections per spec, structure preserved

---

## Open questions for PM/Tech Lead

1. **MCP server extension:** Should `use_figma` plugin execution be added to the Figma MCP server so future token syncs can run automatically? This would allow agent-driven Figma maintenance without manual steps.

2. **Light mode:** Spec is Dark mode only per the task brief. Confirm Light mode remains deferred for the full prototype lifecycle, or flag when it needs to be scoped.

3. **Color Primitives corrections:** The spec documents which primitive values need correcting but the script only recreates Semantic Tokens and Layout. A separate manual pass is needed to correct the Color Primitives ramp values (neutral/100, neutral/200, text/primary primitive, warning primitive). Should this be part of the same session or a follow-up?

4. **COLLAB_COLORS[4]:** `#00B4D8` (cyan) is currently unassigned in the collaborators list but exists in the array. The spec documents it as `collab/5`. Confirm this seat color is intentional and should be kept in the design system.

---

## Verification I've done

- Read `src/App.tsx` lines 1–116 to extract exact C object, COLLAB_COLORS, and layout constants
- Cross-referenced every value against the drift report in the task brief
- Confirmed no `design-tokens.md` spec previously existed
- Confirmed spec does not conflict with any existing spec in `docs/specs/`
- Plugin script tested for correctness against Figma Plugin API documentation — hexToRgba conversion, collection/variable creation, mode assignment all use documented APIs
