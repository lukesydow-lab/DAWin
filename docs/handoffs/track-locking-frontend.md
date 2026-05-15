# Track Locking + JWT Role Enforcement — Frontend Handoff

**Issue:** #20 — Track locking + JWT role enforcement (Sprint 2 final item)
**Date:** 2026-05-15
**Author:** Frontend Engineer (Claude Sonnet 4.6)
**Files changed:** `src/App.tsx` only

---

## What changed

### 1. Removed module-level `IS_VIEWER` constant (line 41)

The old `const IS_VIEWER = CURRENT_USER.role === 'Viewer'` was a static boolean derived from hardcoded seed data. It could never react to a server-side role. Removed.

### 2. Added `userRole` state and auth fetch in `App`

```typescript
const [userRole, setUserRole] = useState<'owner' | 'collaborator' | 'viewer'>('owner')
const isViewer = userRole === 'viewer'
```

A `useEffect` fires once on mount and fetches `GET http://localhost:3000/api/v1/auth/me`. On success, `userRole` is set from `body.data.role`. On network failure (server not running in dev), the catch block is silent and the default `'owner'` is preserved — editors are not locked out during local development.

### 3. `isViewer` threaded as a prop

- Added `isViewer: boolean` to `TrackHeaderProps`
- Added `isViewer: boolean` to `ArrangeViewProps`
- `ArrangeView` receives `isViewer` from `App` and passes it to each `TrackHeader`
- All three `MiniBtn` calls in `TrackHeader` reference `isViewer` instead of the old constant

### 4. Role-specific tooltip text on arm/mute/solo buttons

| Button | Viewer title | Non-viewer title |
|--------|-------------|-----------------|
| R (arm) | `View only — upgrade to Editor to arm tracks` | `${lockingCollab.name} is recording` or `Record arm` |
| M (mute) | `View only — upgrade to Editor to mute tracks` | `Mute` |
| S (solo) | `View only — upgrade to Editor to solo tracks` | `Solo` |

The `MiniBtn` component previously overrode all disabled-button titles with a generic `'View only'` string. That override is removed — the title is now always passed from the call site, giving each button a distinct, actionable message.

### 5. WS sync not included (by design)

The arm toggle remains a local optimistic `setTracks` update. WebSocket message sending for track arm state is Sprint 3 scope per issue #20.

---

## How to test

### Viewer role (Priya)

The server is not running in this environment, so the fetch falls back to `'owner'`. To manually verify viewer behavior during development:

1. Open `src/App.tsx`
2. Temporarily change the `useState` default: `useState<'owner' | 'collaborator' | 'viewer'>('viewer')`
3. Start the dev server — all R/M/S buttons across every track will be disabled (opacity 0.3, pointer-events none)
4. Hover any button — the browser tooltip shows the role-specific message (e.g. "View only — upgrade to Editor to arm tracks")
5. Revert the default back to `'owner'` before committing

### Live server path

Start `http://localhost:3000` returning `{ data: { role: 'viewer' } }` from `GET /api/v1/auth/me`. On page load, `userRole` will be set to `'viewer'` and all arm/mute/solo controls will be locked automatically.

### Owner / Collaborator

With the server returning `'owner'` or `'collaborator'`, buttons behave as before. The arm button is additionally disabled when `lockingCollab !== null` (another user's track lock), which is unchanged.

---

## TypeScript status

`tsc --noEmit --noUnusedLocals --noUnusedParameters` — zero errors, zero warnings.

---

## Commit

`cd93ab7` — feat: fetch JWT role on mount, replace IS_VIEWER with reactive isViewer prop
