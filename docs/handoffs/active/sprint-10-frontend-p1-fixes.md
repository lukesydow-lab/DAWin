# Work Order: Frontend Engineer — Sprint 10 P1/P2 Build Fixes

**To:** Frontend Engineer
**From:** Tech Lead
**Sprint:** 10
**Date issued:** 2026-05-31
**Status:** Unblocked — start immediately. P1 defects block musician demo.
**Defects:** SPRINT-10-001 (P1), SPRINT-10-002 (P1), SPRINT-10-003 (P2), SPRINT-10-004 (P2), SPRINT-10-006 (P3)

---

## Objective

Fix all P1/P2 build and runtime defects found during the Sprint 10 UAT pass so that `npm run build` succeeds and the core demo workflows function correctly.

**Do not make any other changes.** This is a defect-fix work order — no new features, no refactoring beyond the minimum needed to fix the defects listed.

---

## File to edit

`src/App.tsx` — all fixes are in this file unless noted.

---

## Fix 1 — SPRINT-10-001a: Remove dead `sendWsMessage` function (line 305)

The function `sendWsMessage` at line 305 is defined but never called anywhere in the file.

**Fix:** Check whether any `_wsClient.send(JSON.stringify(...))` calls in the file should be using `sendWsMessage` instead. If yes, replace those calls. If no such calls exist (or if all WS message sending is handled via a different path), remove the `sendWsMessage` function entirely.

Do not keep a dead function just because it was useful once. If it is removed, leave a comment near the relevant WS section explaining where outgoing messages are sent.

---

## Fix 2 — SPRINT-10-001b / SPRINT-10-002: Add `bpm` prop to `ArrangeView` (line 2948, 2591)

`bpm` is referenced at line 2948 inside `ArrangeView`'s `runImportPipeline`, but `bpm` is a state variable in the `App` component — not a prop of `ArrangeView`. This makes all imported clips default to 1 bar regardless of actual audio duration.

**Exact changes:**

1. Add `bpm: number` to `ArrangeViewProps` (the props type definition, ~line 2591).
2. Destructure `bpm` in the `ArrangeView` function signature (~line 2608).
3. Pass `bpm={bpm}` at the `ArrangeView` call site (~line 6836).

No other changes to the import pipeline are needed.

---

## Fix 3 — SPRINT-10-001c: Fix `onZoom` prop type (line 2591, 3231)

`onZoom` in `ArrangeViewProps` is typed as `(nextZoom: number) => void` (1 argument). But the scroll-wheel zoom handler inside `ArrangeView` calls it with 2 arguments: `onZoom(zoomX + delta, anchorBar)` at line 3231. The actual `onZoom` implementation in `App` accepts an optional second argument.

**Fix:** Update the `onZoom` prop type in `ArrangeViewProps` to:
```typescript
onZoom: (nextZoom: number, anchorBarOverride?: number) => void
```

---

## Fix 4 — SPRINT-10-001d / SPRINT-10-003 / SPRINT-10-004: Wire demo mode constants to state (lines 4640, 4646, 5915, 5941, 5945)

`DEMO_PRESENCE` (line 4640) and `SEED_COMMENTS` (line 4646) are declared but never read — causing TS6133 errors. They also need to be wired for demo mode to function.

**Fix A — Wire to `isDemoMode` state initialization:**

At ~line 5941, change:
```typescript
const [presence, setPresence] = useState<PresenceEntry[]>([])
```
to:
```typescript
const [presence, setPresence] = useState<PresenceEntry[]>(isDemoMode ? DEMO_PRESENCE : [])
```

At ~line 5945, change:
```typescript
const [comments, setComments] = useState<SessionComment[]>([])
```
to:
```typescript
const [comments, setComments] = useState<SessionComment[]>(isDemoMode ? SEED_COMMENTS : [])
```

**Fix B — Bypass lobby when `isDemoMode` is true:**

The render guard at ~line 6759–6761 returns `<SessionLobby>` when `sessionId` is null. When `isDemoMode` is true, also seed `sessionId` to bypass this guard.

At the `isDemoMode` declaration (~line 5915), change:
```typescript
const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1'
```
to:
```typescript
const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1'
// In demo mode, use the ?session= value if provided, or fall back to a synthetic 'demo' ID
// so the session room renders without requiring a backend connection.
```

Then adjust the `sessionId` initialization so that when `isDemoMode` is true and no `?session=` param is provided, `sessionId` is seeded with `'demo'` rather than `null`. This allows `?demo=1` alone (without `?session=`) to bypass the lobby.

**Important:** The lobby guard and sessionId wiring may be more complex than a simple change. Read the full `sessionId` / lobby guard logic before changing. The goal is: `?demo=1` alone renders the session room with seeded tracks, presence, and comments.

---

## Fix 5 — SPRINT-10-001e: Remove unused `loopEnd` from `MenuBar` destructuring (line 5271)

`loopEnd` is destructured from `MenuBar`'s props at line 5271 but is never read in the component body.

**Check first:** Search the `MenuBar` component body for any reference to `loopEnd`. If it is genuinely unused, remove it from:
1. The `MenuBarProps` type definition (if it is not needed)
2. The `MenuBar` function destructuring (line 5271)
3. The `MenuBar` call site — only if removing from props type

**Caution:** If `loopEnd` is used elsewhere in `MenuBar` but simply not visible from the grep (e.g. inside a nested expression), do not remove it. Fix the TS6133 error by verifying its actual usage first.

---

## Fix 6 — SPRINT-10-001f: Fix null index type in `MenuBar` Escape handler (line 5311)

```typescript
// Current (broken):
const current = openMenu  // type: MenuName | null
setOpenMenu(null)
setTimeout(() => labelRefs.current[current]?.focus(), 0)
//                                    ^^^^^^^  TS2538: null cannot be an index type
```

`current` captures `openMenu` before the `setOpenMenu(null)` call. At the point of the `setTimeout`, we know `current` was non-null (the `if (!openMenu) return` guard at the top of the `useEffect` ensures this). The fix is a non-null assertion:

```typescript
setTimeout(() => labelRefs.current[current!]?.focus(), 0)
```

---

## Fix 7 — SPRINT-10-001g: Fix `vite.config.ts` TS2769 error (line 9)

The `test` property on the Vite config causes a type error because the vitest type augmentation is not fully resolving.

**Check the current content of `vite.config.ts`.** The fix is usually one of:
- Ensure `/// <reference types="vitest" />` is at the top of the file before the imports
- Or change `import { defineConfig } from 'vite'` to `import { defineConfig } from 'vitest/config'`

Use whichever approach is consistent with what the file already has. Do not change any test configuration — only fix the import/type reference.

---

## Fix 8 — SPRINT-10-006 (P3): Update AboutModal version string

At ~line 5147–5148, update:
```typescript
// Change:
"Sprint 8 — Playable Beta"
"v0.8.0-beta"

// To:
"Sprint 9 — Playable Beta"
"v0.9.0-beta"
```

---

## Acceptance criteria

- [ ] `npm run build` exits with zero errors and produces `dist/`
- [ ] `tsc --noEmit` passes (no errors from strict mode check)
- [ ] `?demo=1` navigates directly to the session room (no lobby) with seeded tracks, presence, and comments
- [ ] Importing a 10-second audio file at 128 BPM produces a clip of ~8–9 bars (not 1 bar)
- [ ] Scroll-wheel zoom does not produce a type error and continues to function
- [ ] AboutModal shows "Sprint 9 — Playable Beta" and "v0.9.0-beta"
- [ ] No new TypeScript errors introduced

---

## Must-not-break list

- Spacebar play/pause
- Transport Stop (preserves playhead) and RTZ (resets to bar 0)
- Clip drag, resize, cut, duplicate, delete
- Fade handle interaction
- Splitter drag and keyboard navigation (Sprint 9)
- Zoom shortcuts `=`/`-`/`0` and Ctrl/Cmd+scroll (Sprint 9)
- VU meter rAF animation

---

## Commit requirements

- `npm run build` must succeed before committing
- `tsc --noEmit` must pass before committing
- Commit message format: `fix: resolve Sprint 10 P1 build failures (SPRINT-10-001 through SPRINT-10-004, SPRINT-10-006)`
- Include in commit body: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

---

## Handoff

When fixes are complete, drop `docs/handoffs/sprint-10-frontend-p1-fixes-done.md` including:
- Confirmation that `npm run build` passes
- Confirmation that `?demo=1` works as expected
- Any deviations from the fix instructions (with justification)
- `tsc --noEmit` output (zero errors)

---

## Files to touch

- `src/App.tsx` — primary
- `vite.config.ts` — Fix 7 only

## Files to not touch

- `docs/specs/` — read-only for FE
- `docs/adr/` — Tech Lead only
- `STATUS.md` — Tech Lead only
