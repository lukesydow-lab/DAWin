# ADR-008 — Zoom State Architecture (barW Prop Drilling)

**Status:** Accepted
**Date:** 2026-05-29
**Author:** Tech Lead
**Sprint:** 9

## Context

FR-02 (Arranger Timeline Zoom) introduces two new state values at App root:

```typescript
const [zoomX,      setZoomX]      = useState<number>(1.0)
const [trackZoomY, setTrackZoomY] = useState<Record<string, number>>({})
```

All arranger rendering currently references the fixed constant `BAR_W = 72`. After FR-02, every arranger calculation must instead use a derived `barW`:

```typescript
const barW = BAR_W * zoomX
```

The spec (`docs/specs/arranger-zoom.md` §Horizontal Zoom Model) explicitly leaves the propagation mechanism open, naming two options and requiring a Tech Lead decision before implementation begins:

- **(a) Prop drilling:** `barW` computed at App root, passed as a prop to every arranger component.
- **(b) React context:** `barW` placed in a context provider, consumed at each calculation site.

The spec notes option (a) as recommended for the single-file constraint.

Key facts bearing on the decision:

- The project constraint (`CLAUDE.md`) requires all components to remain in `src/App.tsx` until a second screen is scaffolded, and prohibits new `src/` files without Tech Lead approval. In a single-file codebase, React context adds JSX provider boilerplate and `useContext` call sites without the benefit that motivates context: avoiding prop threading across file and component boundaries.
- In Sprint 9, zoom is local-only. Each collaborator controls their own zoom independently. `barW` flows strictly downward: App root computes it, arranger child components consume it. There is no lateral consumption, no deep subscription, and no need for any component to trigger zoom changes internally.
- When WebSocket zoom sync is added in a future sprint, the integration point is already defined: the App root receives a remote `zoomX` value and calls `setZoomX`. Nothing about the propagation mechanism downstream changes.
- `zoomX` is a `number`; `trackZoomY` is `Record<string, number>`. Both are JSON-serializable without transformation. This property must be preserved regardless of which propagation mechanism is chosen — prop drilling makes it trivially obvious that it is.

## Decision

Option (a): prop drilling.

`barW` is computed at App root as `BAR_W * zoomX` and passed as an explicit prop to every arranger component that references it. `getTrackH` (the per-track height accessor) is similarly defined at App root and passed as a prop or called inline where needed.

```typescript
// At App root — the only source of truth for zoom
const [zoomX,      setZoomX]      = useState<number>(1.0)
const [trackZoomY, setTrackZoomY] = useState<Record<string, number>>({})

// Derived — never stored in state
const barW      = BAR_W * zoomX
const getTrackH = (id: string): number => TRACK_H * (trackZoomY[id] ?? 1.0)
```

Every arranger component that previously used `BAR_W` in a calculation must accept `barW` as a prop and use it instead. After Ticket 3-D, `grep -n "BAR_W" src/App.tsx` must return only the constant declaration line.

Do not mix patterns. React context must not be introduced for zoom in Sprint 9.

## Consequences

**Positive:**
- Component signatures are explicit about what they depend on. A reviewer reading any arranger component can see immediately that it takes `barW: number` — no context hunting required.
- The data flow is unidirectional and auditable: App root → arranger components. No component can silently consume a changed zoom value from a context without its prop signature reflecting the dependency.
- Serializing `zoomX` for WebSocket sync requires no transformation. The root calls `setZoomX(remoteValue)` and the derived `barW` propagates downward through normal React re-render.
- No new React patterns are introduced. The codebase stays internally consistent.

**Negative / accepted tradeoffs:**
- Every arranger component that uses `barW` or `getTrackH` must have those added to its prop signature. This is a one-time mechanical change (the BAR_W substitution pass in Ticket 3-D) and is not ongoing maintenance overhead.
- If a future sprint moves arranger components into separate files, prop drilling across files becomes more verbose. At that point the trade-off should be re-evaluated — React context or a lightweight selector pattern may become appropriate. This ADR does not prohibit that re-evaluation; it scopes the decision to the single-file constraint that holds today.

**Neutral:**
- `trackZoomY` itself stays at App root. `getTrackH` is passed as a function prop or called inline at App root before passing a resolved height value — whichever the Frontend Engineer judges cleaner. Either is acceptable as long as `trackZoomY` state never moves out of App root.

## Future Considerations

**WebSocket sync (future sprint):** `zoomX` is a plain `number`. When real-time zoom sync is added, the WebSocket event handler at App root calls `setZoomX(event.zoomX)`. The propagation mechanism downstream is unchanged. No refactor is required to enable sync.

**Multi-file migration (future sprint):** If arranger components are extracted to `src/components/`, revisit whether React context for zoom becomes worthwhile at that point. The migration to context from prop drilling is mechanical — all types are already defined and the state shape does not change. This ADR does not create lock-in.

**Vertical zoom (Ticket 3-E):** The same prop drilling decision applies to `trackZoomY` and `getTrackH`. No separate ADR is required — this ADR covers both axes.
