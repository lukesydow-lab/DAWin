# WP7 — PluginChainPanel Overlay Handoff

## Layout constants found

| Constant | Value | Source |
|---|---|---|
| `TRANSPORT_H` | 52px | `TransportBar` inline `height: 52` |
| `STATUS_BAR_H` | 28px | `StatusBar` inline `height: 28` |

Both are now exported as named constants at the top of `src/App.tsx` (lines ~110–111) so they can be consumed by any future overlay or fixed-position element.

## Panel dimensions and z-index

- Panel width: 720px fixed
- Panel z-index: 45
- Backdrop z-index: 44
- InviteModal z-index: 50 (Tailwind `z-50`) — panel and backdrop stay below it

## Positioning

Both backdrop and panel use:
```
position: fixed
top: 52px   (TRANSPORT_H)
bottom: 28px (STATUS_BAR_H)
```

The panel is pinned to `right: 0`. The backdrop spans `left: 0` to `right: 0`.

## Slide animation

- Panel: `transform 220ms cubic-bezier(0.4, 0, 0.2, 1)`
  - Open: `translateX(0)`
  - Closed: `translateX(100%)`
- Backdrop: `opacity 180ms ease`
  - Open: `opacity: 1`, `pointerEvents: auto`
  - Closed: `opacity: 0`, `pointerEvents: none`

Both elements are always in the DOM — no conditional render — so the exit animation plays on close.

## Close mechanisms

1. Close button (`aria-label="Close FX chain"`) in the panel header, top-right — calls `onClose` prop passed from App
2. Clicking the backdrop calls `setSelectedTrackId(null)`
3. Keyboard Escape (existing handler in App) calls `setSelectedTrackId(null)`

## PluginChainPanel prop change

Added `onClose: () => void` to `PluginChainPanelProps`. The panel's root `<div>` no longer controls its own width or position — it renders as `flex: 1` inside the fixed overlay wrapper in App.

## Arranger / Mixer layout

The inner flex column (`flex-1 flex flex-col`) containing `ArrangeView` and `MixerPanel` now has no sibling — the plugin panel is removed from the document flow. Arranger and mixer fill full available width at all times. The overlay does not push or resize them.

## tsc result

`npx tsc --noEmit` exits clean with no output (no errors, no warnings).

## Verification steps confirmed

- Panel width confirmed 720px via DOM inspection
- Panel z-index 45, backdrop z-index 44 confirmed via computed styles
- Transport top value (52px) and status bar bottom value (28px) confirmed in DOM
- Slide animation: panel enters/exits translateX from right edge
- Backdrop opacity transitions on open/close
- Backdrop click closes panel (sets selectedTrackId null)
- Arranger fills full width when panel is closed — confirmed by screenshot
- tsc passes clean
