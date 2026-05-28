# Sprint 5 Remediation — Frontend Engineer Work Order

**Created:** 2026-05-19
**Author:** Tech Lead
**Status:** Active — ready for pickup
**Priority:** R1 and R2 block Sprint 6 start. R3 is P2 and can ship separately.
**Handoff target:** When complete, drop `docs/handoffs/active/sprint-05-remediation-complete.md`

---

## Background

A post-sprint gap analysis found that three Sprint 5 exit criteria were marked done in documentation but were not implemented in the frontend. The backend work for all three items shipped correctly. This work order covers the frontend half only — do not touch `server/`.

This work order is frontend-only. All changes go in `src/App.tsx`. Do not create new files in `src/` without Tech Lead approval. `tsc --noEmit` must pass before every commit.

---

## R1 — Session snapshot handler (BLOCKING Sprint 6)

**Priority: P0 — Sprint 6 cannot start until this is complete.**

### Problem

The WS client receives a `session.snapshot` message from the server on join. The server payload is correct — it includes `session`, `tracks`, `clips`, `comments`, and `transport` fields populated from the database. The frontend does not handle this message. It falls through without a `case 'session.snapshot'` handler in `handleWsMessage`.

As a result, the frontend always renders from hard-coded seed state:
- `INITIAL_TRACKS` constant (initializes track state) — `src/App.tsx:3981`
- `SEED_COMMENTS` constant (initializes comment state) — `src/App.tsx:4003`
- `getWsClient` hardcoded to `'dev-session-001'` — `src/App.tsx:4086`
- Deep link resolver references `INITIAL_TRACKS` IDs directly — `src/App.tsx:4111` and `4122`

No data from the database ever reaches the frontend. The persistence layer built in Sprint 5 is effectively bypassed.

### What to implement

**1. Add `case 'session.snapshot'` to `handleWsMessage`**

When a `session.snapshot` message arrives:
- Replace track state with `msg.tracks` from the snapshot
- Replace clip state with `msg.clips` from the snapshot
- Replace comment state with `msg.comments` from the snapshot
- Set transport state from `msg.transport`: `bpm`, `totalBars`, `timeSignature`

The snapshot payload shape is defined in `server/types.ts`. Use those types — do not invent new ones or use `any`.

**2. Replace hardcoded `'dev-session-001'` in `getWsClient` (line 4086)**

The WS connection must use a real `sessionId`. The source of truth for `sessionId` is the URL. The existing deep link routing already parses URL params — use the same mechanism. If no `sessionId` is present in the URL (fresh load with no query param), the frontend should either show a session creation/join screen or leave the WS disconnected until a session is selected. Do not fall back silently to `'dev-session-001'` — that hides the problem.

**3. Fix deep link resolver (lines 4111 and 4122)**

These lines look up track IDs from `INITIAL_TRACKS`. After R1 lands, live state is the source of truth for tracks. Update these lookups to use the live track state array, not the constant.

**4. `INITIAL_TRACKS` and `SEED_COMMENTS`**

Once snapshot hydration is wired, the app should boot with empty (or loading) state and populate on snapshot receipt. `INITIAL_TRACKS` and `SEED_COMMENTS` must not be the default initial state that users see. If you keep them as development fallbacks for the no-backend case, guard them clearly and comment that they are dev-only — but the snapshot handler must overwrite them when a real snapshot arrives.

### Acceptance criteria for R1

- [ ] `handleWsMessage` contains a `case 'session.snapshot'` branch
- [ ] Receiving `session.snapshot` updates track, clip, comment, and transport state from the payload
- [ ] `getWsClient` does not contain the string `'dev-session-001'` as a hardcoded session ID used in production flow
- [ ] Deep link resolver (lines 4111, 4122) does not reference `INITIAL_TRACKS` for ID lookup
- [ ] `tsc --noEmit` passes with zero errors after the change

---

## R2 — Real presence state from WS events (BLOCKING Sprint 6)

**Priority: P0 — Sprint 6 cannot start until this is complete.**

### Problem

The frontend renders collaborator cursors from `DEMO_PRESENCE` seed data. This is hardcoded and does not reflect real connected users.

The WS client receives `presence.joined` and `presence.left` events. Both currently call `console.log` only — they do not update any state. The active presence list shown to the user is therefore always the fake seed data regardless of who is actually connected.

Affected lines:
- `DEMO_PRESENCE` rendered at `src/App.tsx:2562`, `2702`, `3610`
- `presence.joined` handler: `console.log` only — no state update
- `presence.left` handler: `console.log` only — no state update

### What to implement

**1. Wire `presence.joined` to presence state**

When `presence.joined` fires, add the collaborator to the presence state array. The event payload contains `userId`, `displayName`, and `color` — these are the same fields used by the existing collaborator color model. Use the types from `server/types.ts`.

**2. Wire `presence.left` to presence state**

When `presence.left` fires, remove the collaborator with matching `userId` from the presence state array.

**3. Remove `DEMO_PRESENCE` from render**

`DEMO_PRESENCE` must not render by default. Collaborator cursors and presence indicators must only render when real WS presence events have populated the presence state. An empty state (no collaborators connected) must render as empty — no phantom users.

The `DEMO_PRESENCE` constant may remain in the file as a dev utility if you want, but it must not be passed to any render path in the default flow.

### Acceptance criteria for R2

- [ ] `presence.joined` handler updates presence state — the `console.log`-only branch is gone
- [ ] `presence.left` handler removes the user from presence state — the `console.log`-only branch is gone
- [ ] `DEMO_PRESENCE` is not passed to any component in the default render path
- [ ] With no WS connection (dev, no backend), presence renders as empty — no phantom collaborators shown
- [ ] Collaborator cursors appear when a real `presence.joined` event is received
- [ ] `tsc --noEmit` passes with zero errors after the change

---

## R3 — VU stereo correction (P2 — does not block Sprint 6)

**Priority: P2 — ship separately after R1 and R2. Do not hold R1/R2 for this.**

### Problem

The mixer renders two VU meter columns (L and R) and separate `levelL`/`levelR` state exists. However, both columns are driven by the same mono `effectiveRMS` value (lines 3138–3139). There is no `ChannelSplitterNode` in the audio graph. The two columns display identical values — metering is cosmetically stereo but metrologically mono. The Sprint 5 "true stereo SplitterNode calibration" claim is incorrect.

### What to implement

Add a `ChannelSplitterNode` to the audio graph for each metered track. The splitter output:
- Channel 0 feeds the `AnalyserNode` (or equivalent) for `levelL`
- Channel 1 feeds the `AnalyserNode` (or equivalent) for `levelR`

Both channels must be independently driven. When a mono source is connected, both channels will show the same value — that is correct behavior, not a bug. The fix is about wiring, not forcing artificial divergence.

The single shared `AudioContext` (`getAudioCtx()`) must remain the only context — do not create a second one.

### Acceptance criteria for R3

- [ ] A `ChannelSplitterNode` exists in the per-track audio graph for metered tracks
- [ ] `levelL` is driven by channel 0 of the splitter
- [ ] `levelR` is driven by channel 1 of the splitter
- [ ] The two meter columns display independent values when a stereo source is present
- [ ] `getAudioCtx()` is still the only `AudioContext` — no second context created
- [ ] `tsc --noEmit` passes with zero errors after the change

---

## Commit requirements

Every commit must:
1. Pass `tsc --noEmit` with zero errors (check before staging)
2. Use the format `fix: <what changed and why>`
3. Include in the commit body: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

Suggested commit sequence:
- `fix: wire session.snapshot handler; replace seed state with snapshot payload (R1)`
- `fix: wire presence.joined/left to state; remove DEMO_PRESENCE from render path (R2)`
- `fix: add ChannelSplitterNode for true stereo VU metering (R3)` — separate commit, after R1+R2

---

## Handoff

When R1 and R2 are complete (R3 may be in progress or complete), drop `docs/handoffs/active/sprint-05-remediation-complete.md` with:
- Which items completed (R1, R2, R3 or subset)
- Commit hashes for each fix
- Any deviations from this work order and why
- `tsc --noEmit` status (must be clean)

Do not update `STATUS.md` — the Tech Lead owns that file.
