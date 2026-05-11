# Spec: Session Room Layout

**Status:** Implemented — this spec documents what exists and hardens it.
**Source:** `src/App.tsx` — root `App` component, lines 2218–2251.

---

## Overview

The session room is the outermost shell. It is a full-viewport flex column with a fixed minimum width of 1280px. Every pixel is intentional DAW density — no whitespace for whitespace's sake.

---

## Layout structure

The root `div` is `flex flex-col` with `height: 100vh`, `minWidth: 1280`, `background: C.bg` (`#0A0A0F`), `color: C.textPri`, and `fontFamily: 'Inter, system-ui, sans-serif'`.

Stack order, top to bottom:

1. **TransportBar** — fixed height 52px, `flex-shrink-0`, `background: C.surface`, `border-b` at `C.border`.
2. **Main content row** — `flex-1 flex overflow-hidden`. Contains:
   a. **Left column** — `flex-1 flex flex-col overflow-hidden`. Contains:
      - `ArrangeView` — takes all available vertical space minus the mixer.
      - `MixerPanel` — pinned to bottom of the left column, `flex-shrink-0`, appears only when tracks exist.
   b. **PluginChainPanel** (conditional) — 280px wide, `flex-shrink-0`, `border-l` at `C.border`, shown only when `selectedTrackId !== null`. Uses `C.elevated` background.
3. **StatusBar** — fixed height 28px, `flex-shrink-0`, `background: C.surface`, `border-t` at `C.border`.

The `InviteModal` renders as a fixed overlay (`z-50`) above the entire shell when `showInvite` is true.

---

## Collaborator color tinting

The session room shell itself carries no tinting — tinting lives inside the arranger (track rows and clips) and mixer strips. The transport bar shows collaborator avatars in a stacked `-space-x-2` group, each avatar circle filled with the collaborator's hex color.

---

## Empty states

- **No tracks:** ArrangeView renders normally with an empty track list. The grid shows the ruler and empty rows. MixerPanel renders with no strips visible (only the wood end cheeks and the master strip). This state is not currently designed beyond the structural shell — flag for PM: do we want an onboarding prompt in the empty arranger?
- **No selected track:** PluginChainPanel is hidden. The left column expands to full width.

---

## Loading state

Not designed. The app currently initializes synchronously from `INITIAL_TRACKS`. When real session loading is introduced, a skeleton state must be specced. Flag for Tech Lead: where does session hydration happen and what is the latency budget?

---

## Error state

Not designed. Flag for PM.

---

## Keyboard navigation

- `Space` — toggle play/pause. Blocked when focus is in `INPUT` or `TEXTAREA`.
- `Escape` — close InviteModal.
- `V` — switch arranger tool to Select.
- `C` — switch arranger tool to Cut.
- `X` — switch arranger tool to Crossfade.

These are global `window` keydown listeners registered in the root `App` component.

---

## DAW convention callouts

- Stop button (`⏹`) halts playback but does not reset the playhead. RTZ (`⏮`) resets to bar 1. This matches Pro Tools / Logic behavior — do not merge stop and RTZ.
- The scrollbar style is 6px wide, `C.bg` track, `C.control` thumb. This is correct for a dense dark UI. Do not widen it — it competes with clip handles at 8px.

---

## Token violations in current implementation

None found. All backgrounds, borders, and text colors reference the `C` object. App.css scrollbar colors use hardcoded hex (`#0A0A0F`, `#2a2a38`, `#3a3a4e`) — these match `C.bg`, `C.control`, and an intermediate value. Flag for FE: extract these to CSS custom properties from `C` to prevent drift.

---

## Implement this first

The PluginChainPanel conditional render. When `selectedTrackId` is null the panel is absent and the main content column is full width. When a track is selected the panel slides in from the right, taking 280px and pushing the arranger+mixer to the left. This is the most visible layout shift in the session room and must be confirmed as non-jarring before any other panel work starts.
