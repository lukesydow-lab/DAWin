# Spec: Motion in the Figma Design System

**Status:** Designed — defines how the motion system lives in the Figma DS file as a visual + token reference.
**Companion spec:** [`motion-system.md`](motion-system.md) — the underlying motion principles, easing catalog, and duration scale that this Figma representation surfaces.
**Figma file:** `o4IccZFYzEvsHe3dVcco7X` — DAWin Design System

---

## The challenge

Figma is a vector tool. Motion is time-based. Figma's built-in prototype mode can demonstrate simple A→B transitions via Smart Animate, but it can't represent:
- Spring physics with secondary oscillation
- Multi-stage choreography (heartbeat startup, zoom-with-glow-flare-and-shimmer)
- Physics-driven motion (VU meter attack/decay)

So the Figma DS captures the **system** (principles, named tokens, when-to-use), and links out to live HTML prototypes for the *feel*. Figma doesn't try to be a motion-rendering tool.

---

## The four-part structure

### 1. A "Motion" section in the Figma DS file

A dedicated set of pages alongside the existing component pages.

**Page A — Motion Principles**
A single frame documenting the five principles from `motion-system.md` §1. One frame, large legible type, the principle name + the meaning. The reader walks away knowing the philosophy.

**Page B — Easing Catalog**
One frame per named easing curve in the catalog (7 frames total). Each frame contains:
- Token name as the title (`motion.easing.snappy`)
- The bezier curve drawn on a 200×200 grid as an SVG line
- The cubic-bezier values
- A one-sentence "use when…"
- A list of components currently using this curve
- A "Live preview" link out to the prototype URL

**Page C — Duration Tokens**
A single frame showing all 7 duration tokens stacked vertically. Each row:
- Token name
- Value in ms
- A visual horizontal bar scaled to its duration (`instant` is invisible; `ceremonial` is 12× wider than `fast`)
- "Use when…" sentence

### 2. Motion variable collection in Figma

A new variable collection alongside the existing color tokens. Created via Tokens Studio plugin (same workflow as colors, since we don't have Enterprise REST API access).

**Collection name:** `Motion`

**Variables:**

| Variable name | Type | Value |
|---|---|---|
| `motion/duration/instant` | NUMBER | `0` |
| `motion/duration/fast` | NUMBER | `140` |
| `motion/duration/base` | NUMBER | `240` |
| `motion/duration/standard` | NUMBER | `340` |
| `motion/duration/expressive` | NUMBER | `520` |
| `motion/duration/return` | NUMBER | `640` |
| `motion/duration/ceremonial` | NUMBER | `833` |
| `motion/easing/snappy` | STRING | `cubic-bezier(0.34, 1.06, 0.4, 1)` |
| `motion/easing/expressive` | STRING | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `motion/easing/weighted` | STRING | `cubic-bezier(0.76, 0, 0.24, 1)` |
| `motion/easing/motorized` | STRING | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `motion/easing/utility` | STRING | `cubic-bezier(0.33, 1, 0.68, 1)` |
| `motion/easing/spring` | STRING | `spring(ζ=0.5, ω=10)` *(comment-only; JS-driven, not CSS)* |

Components in the Figma file reference these by name in their motion annotations.

### 3. Per-component Motion annotation pattern

Every component frame in the DS that has motion behavior gets a small annotation panel attached to it. Standardized format:

```
─────────────────────────────────
 MOTION
─────────────────────────────────
 Animates: [property]
 From → To: [start] → [end]
 Duration: motion.duration.[token]
 Easing: motion.easing.[token]
 Trigger: [hover / click / state]
 Preview: /prototypes/[file].html
─────────────────────────────────
```

The "Preview" link is a clickable URL inside the annotation that opens the live HTML prototype in a browser. This is the contract — Figma documents *what* and *why*; the prototype shows *how it feels*.

### 4. Living prototypes (already exist)

The actual motion lives in HTML files in `/public/motion-prototypes/` and `/public/comps/`. These are the source of truth for the *feel*. Engineering references them when implementing.

The Figma annotations link OUT to these URLs; the prototypes don't need to live in Figma.

---

## Page layout — exact spec for the Figma builder

Following the canonical DS grid (components at x=380, section gap=120px, component gap=40px):

### Motion Principles page
- One section at the canvas root
- Section frame: 1200×800px
- Inside: 5 principle blocks stacked vertically with 24px gap
- Each principle block: title (16/700/0.04em, white) + meaning (13/400/0.01em, textSec) — left-aligned

### Easing Catalog page
- One section at the canvas root
- Section frame: 1480×1200px
- Inside: 4×2 grid of easing cards (each 320×360px), 40px gap between cards
- Each card:
  - Top 120px: SVG curve preview on a `C.well` background
  - Middle 80px: Token name + cubic-bezier values
  - Bottom 160px: "Use when…" + components using + preview link

### Duration Tokens page
- One section at the canvas root
- Section frame: 1080×600px
- Inside: 7 horizontal rows stacked, 16px gap
- Each row:
  - Left column (180px wide): Token name + value in ms
  - Right column (flex): Horizontal bar scaled to duration. `ceremonial` fills the full width; smaller tokens are proportionally shorter
  - Bar color: `C.accent` at 100%, with subtle gradient

---

## Sync workflow — getting changes from Figma to code

This depends on the token sync workflow we discussed (see conversation history). Two viable paths:

**Path A — MCP-mediated, agent-driven (recommended for the team's current Figma plan)**

```
Designer edits motion token in Figma (via Tokens Studio plugin)
                          ↓
                  Variables in Figma
                          ↓
              Designer asks the agent:
              "Pull the latest motion tokens"
                          ↓
              Agent: get_variable_defs (MCP)
                          ↓
              Agent edits src/tokens.ts
                          ↓
                       Commit
```

**Path B — Automated CI pull (requires Figma Enterprise — REST API access)**

```
Designer edits → Figma → REST API → CI script → src/tokens.ts → PR opens
```

The motion tokens flow through the same pipeline as the color tokens. **One sync infrastructure, both collections.**

---

## Open questions

- **Spring easing in Figma variables.** Figma variables don't natively support spring physics — they only support strings and numbers. Storing `motion.easing.spring` as a string label is workable (the value is `'spring(ζ=0.5, ω=10)'`) but engineering needs to know it's a special case implemented in JS, not CSS. Worth a brief note in the easing catalog page.
- **Smart Animate for component-level previews.** Figma's prototype mode CAN demonstrate simple transitions. For component hover/focus/active states, we could prototype those directly in Figma instead of building HTML prototypes. Open question: where's the boundary? My instinct — anything that involves multiple simultaneous properties or physics belongs in HTML; anything that's a single property A→B can live in Figma Smart Animate.

---

## Implement this first

1. **Create the Motion variable collection** in the Figma file using Tokens Studio plugin. Loads all 12 motion tokens from the table above.
2. **Build the Easing Catalog page** with one curve example end-to-end (e.g., `motion.easing.snappy`). Validate the layout reads cleanly.
3. **If the test page works**: scale to all 7 easing curves, then add the Principles page and the Duration page.
4. **Add Motion annotations to 1–2 existing component frames** (Button, Fader) to validate the annotation pattern. Then propagate to every component that has motion behavior.
