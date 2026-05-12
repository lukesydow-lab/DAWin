# WP8 Layout Shift Fix

**Date:** 2026-05-10
**File changed:** `src/App.css`
**Commit:** `fix: correct left-side layout shift — track headers and arranger left edge now flush`

---

## What was wrong

The track header column and the arranger left edge were shifted ~142px off-screen to the left, making them inaccessible without horizontal scrolling.

**Root cause:** `#root` in `src/App.css` was set to `overflow: hidden`. CSS `overflow: hidden` creates a scroll container — it prevents *user-initiated* scrolling via mouse/keyboard, but it does NOT prevent the browser from setting `scrollLeft` programmatically. Browsers automatically set `scrollLeft` on the nearest scroll-container ancestor to bring a focused element into view (the "scroll into view on focus" behavior). Because the inner React app div has `minWidth: 1280px` but the preview viewport is ~723px wide, whenever any element in the right half of the layout received focus, the browser scrolled `#root` rightward to center it — producing a measured `scrollLeft` of exactly 142.5px, pushing the left edge off-screen.

**Confirmed via DevTools eval:**
```
rootScrollLeft: 142.5
rootDivLeft: -142.5   // getBoundingClientRect().left
```

All CSS properties on the layout divs (`margin`, `padding`, `transform`, `left`) were clean — the shift was entirely the scroll position on `#root`.

---

## What was not the cause

- No unwanted `padding-left`, `margin-left`, or `left` offset on any layout div
- No `translateX` or `transform` on any container
- The FX panel overlay and backdrop are correctly `position: fixed` and do not affect document flow
- No `max-width` centering with auto margins
- No newly added wrapper divs with unexpected padding
- `MixerPanel` uses `overflow-x: auto` only on its own internal strip row, fully contained

---

## The fix

Changed `overflow: hidden` to `overflow: clip` on the `html, body, #root` rule in `src/App.css`.

`overflow: clip` is the correct value when you want to clip content without creating a scroll container. Unlike `overflow: hidden`, `overflow: clip` does NOT allow `scrollLeft` to be set — not by user input, not by browser focus-scroll, not programmatically. This eliminates the vector entirely.

**Before:**
```css
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

**After:**
```css
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: clip;
}
```

**Post-fix confirmation:**
```
rootScrollLeft: 0
rootDivLeft: 0
overflow (computed): clip
```

---

## Browser support note

`overflow: clip` is supported in all modern browsers (Chrome 90+, Firefox 81+, Safari 16+). It is safe to ship.

---

## No other changes

`tsc --noEmit` passes clean. No React component code was modified. The fix is contained entirely to one CSS property value.
