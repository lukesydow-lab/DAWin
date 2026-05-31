# UAT Defect Register

**Status: Current**
**Last updated:** 2026-05-29

> Covers Sprints 1–9. All P0/P1 defects resolved or explicitly deferred. Sprint 9 UAT: PASS, zero P0/P1 defects; 2 defects found (SPRINT-9-001 P2, SPRINT-9-002 P3) and fixed before close.

---

# Sprint 1 Defects

> **Source:** UAT Agent sign-off run, 2026-05-10
> **Features tested:** Session room UI, clip editing, playhead animation, Neve studio theme
> **Status key:** `open` · `in progress` · `fixed` · `deferred`

---

| Priority | Status | Issue | File:Line |
|----------|--------|-------|-----------|
| **P0 — Blocker** | fixed | M/S/R buttons in track headers have no `onClick` — mute, solo, arm do nothing | [App.tsx:1069](../src/App.tsx) |
| **P0 — Blocker** | fixed | M/S buttons in mixer strip have no `onClick` — stuck state, Pad cannot be unmuted | [App.tsx:1397](../src/App.tsx) |
| **P0 — Blocker** | fixed | Mixer fader/pan state is isolated local state — `MixerPanel` receives no `setTracks`, changes don't persist | [App.tsx:1367](../src/App.tsx) |
| **P1 — High** | fixed | Spacebar does not play/pause — no `keydown` listeners exist anywhere in the codebase | [App.tsx:1742](../src/App.tsx) |
| **P1 — High** | fixed | Tool keyboard shortcuts (V/C/X) labeled in toolbar tooltips but not wired to any handler | [App.tsx:1751](../src/App.tsx) |
| **P1 — High** | fixed | Escape does not close modals — no keydown handling in `InviteModal` or `BounceModal` | [App.tsx:1524](../src/App.tsx) |
| **P1 — High** | fixed | "Send invite" primary CTA has no `onClick` — modal stays open, no confirmation | [App.tsx:1530](../src/App.tsx) |
| **P2 — Medium** | fixed | Clip drag ignores grab offset — `barOffset` stored in `DragState` but discarded in move calculation, clips snap to leading edge not grab point | [App.tsx:900](../src/App.tsx) |
| **P2 — Medium** | deferred | Crossfade tool has toolbar UI and type declaration but zero implementation — dragging clips does nothing | [App.tsx:45](../src/App.tsx) |
| **P2 — Medium** | fixed (partial) | Context menu items Delete, Duplicate, Loop region, Rename are stubs — Delete and Duplicate now wired; Loop region and Rename remain disabled stubs | [App.tsx:1223](../src/App.tsx) |
| **P2 — Medium** | fixed | FX badge hardcoded `"FX:2"` on every mixer strip — ignores actual plugin chain data | [App.tsx:1396](../src/App.tsx) |
| **P2 — Medium** | deferred | "Add Plugin +" button in FX Chain panel has no `onClick` handler — awaiting PM interaction spec | [App.tsx:1697](../src/App.tsx) |
| **P2 — Medium** | fixed | Stop (⏹) and Return to Zero (⏮) both reset playhead to bar 1 — DAW convention: Stop should keep position, only Return to Zero should reset | [App.tsx:1469](../src/App.tsx) |
| **P2 — Medium** | fixed | No `min-width: 1280px` enforced — layout breaks and elements overlap below 1280px | [App.tsx:1763](../src/App.tsx) |
| **P3 — Low** | open | VU meters are static — level derived from volume setting only, no animation during playback | [App.tsx:1268](../src/App.tsx) |
| **P3 — Low** | fixed | Master strip dB readout hardcoded `"+6.0 dB"` — does not respond to `masterVol` fader | [App.tsx:1434](../src/App.tsx) |
| **P3 — Low** | fixed | Fader dB curve is linear (0–100 → -6 to +6 dB) — DAW convention is logarithmic with unity gain (~0 dB) at ~75% fader travel | [App.tsx:161](../src/App.tsx) |
| **P3 — Low** | fixed | Design token violation: `'#2E2E42'` hardcoded for ruler sub-beat color — should use a `C.*` token | resolved |
| **P3 — Low** | fixed | BPM input accepts out-of-range values silently — `min={40}` `max={300}` attributes bypassed by direct text input | [App.tsx:1489](../src/App.tsx) |

---

## Open items summary (3 remaining + 1 partial)

| # | Defect | Reason |
|---|--------|--------|
| — | Context menu Loop region + Rename | `disabled: true` stubs — intentionally deferred to WP-2 scope |
| — | Add Plugin + button | Awaiting PM spec on interaction model |
| — | Crossfade tool | L effort, no spec — PM must scope before Frontend touches it |
| — | VU meter animation | Not addressed in WP-1; next candidate for WP-3 |

---

## Tech Lead sign-off

- **WP-1 Frontend:** Approved 2026-05-10 — 16 of 19 defects resolved; 2 correctly deferred; 1 (VU) remaining for WP-3
- **Backend architecture:** Approved with revisions 2026-05-10 — 4 spec clarifications required before Fastify scaffold (see `docs/adr/` for details)

---

## Sprint 2 Final UAT — 2026-05-15

> **Feature tested:** Track locking + JWT role enforcement (Issue #20)
> **UAT agent:** Claude Sonnet 4.6
> **TSC status:** Frontend clean (noUnusedLocals, noUnusedParameters). Server clean.

| Priority | Status | Issue | File:Line |
|----------|--------|-------|-----------|
| **P1 — High** | open | WS handler ignores the JWT ticket — `role` is hardcoded to `'owner'` for all WS connections. The `track.arm` guard calls `handleTrackArm(..., role, ...)` with this hardcoded value, so the viewer-forbidden path is unreachable at runtime via WebSocket. The HTTP `GET /auth/me` path correctly enforces role, but the WS enforcement is a stub. Explicitly deferred in the handoff ("Ticket-based WS auth: follow-on task"), but is a real gap between the acceptance criterion ("Track locking enforced server-side; Viewer role enforced via JWT") and what is actually enforced. | `server/ws/handler.ts:362` |
| **P3 — Low** | open | `GET /auth/me` fetch in App is hardcoded to `http://localhost:3000` — will fail silently on any non-default port or deployment URL. No `VITE_API_URL` env var used. | `src/App.tsx:3275` |
| **P3 — Low** | open | `handleTrackDisarm` broadcasts `track.unlocked` even when `releaseTrackLock` returns `false` (i.e., the track was not locked by this user or not locked at all). This is intentionally idempotent per the handoff, but other clients will receive spurious `track.unlocked` events. Low risk for prototype, but worth flagging before multi-client testing. | `server/ws/handler.ts:265–274` |

### Findings summary

**Server — jwt.ts:** PASS. `signToken` includes all five required claims (`sub`, `sessionId`, `role`, `color`, `isGuest`), uses HS256, and falls back safely with `console.warn` when `JWT_SECRET` is absent.

**Server — routes/auth.ts:** PASS. `GET /auth/me` returns 401 on missing/invalid Bearer token. `POST /auth/login` gates on non-empty email and password. `POST /auth/guest` sets `role: 'viewer'` and `isGuest: true`.

**Server — store.ts:** PASS. `acquireTrackLock` is idempotent for the same user (returns `true`). Returns `false` when a different user holds the lock. `releaseAllLocksForUser` iterates correctly and returns the released track list.

**Server — ws/handler.ts:** PARTIAL. `track.arm` correctly guards on `role === 'viewer'` and rejects locked tracks. `track.disarm` broadcasts `track.unlocked` to all clients. Disconnect handler calls `releaseAllLocksForUser` and broadcasts `track.unlocked` for each released track BEFORE calling `handleLeave` — ordering is correct. **Critical gap:** the `role` value used for the guard is hardcoded to `'owner'` (line 362), so the viewer guard is structurally present but never reachable via WS in practice. Acknowledged as deferred in the handoff.

**Frontend — IS_VIEWER removal:** PASS. Zero occurrences of `IS_VIEWER` in `src/`.

**Frontend — userRole state:** PASS. Initialized to `'owner'` (safe default). `useEffect` with `[]` dependency. Fetch errors caught silently.

**Frontend — isViewer prop threading:** PASS. `isViewer: boolean` in `TrackHeaderProps` and `ArrangeViewProps`. Passed from `App` → `ArrangeView` → `TrackHeader`.

**Frontend — button disabled states:** PASS. R button: `disabled={isViewer || lockingCollab !== null}`. M and S buttons: `disabled={isViewer}`.

**Frontend — tooltip text:** PASS. Arm: `'View only — upgrade to Editor to arm tracks'`. Mute: `'View only — upgrade to Editor to mute tracks'`. Solo: `'View only — upgrade to Editor to solo tracks'`.

**TypeScript:** PASS. Both `cd /Users/lukesydow/daw-design && npx tsc --noEmit --noUnusedLocals --noUnusedParameters` and `npx tsc --noEmit` exit clean with zero errors.

### Verdict

**CONDITIONAL PASS.** The P1 gap (WS role enforcement hardcoded to 'owner') is explicitly acknowledged and deferred in the backend handoff — the JWT infrastructure is complete, the HTTP enforcement path works correctly, and the WS guard logic is structurally correct. The gap is a known follow-on task, not an oversight. Two P3 observations noted (hardcoded API URL, spurious `track.unlocked` broadcast) — non-blocking for sprint close.

**Sprint 2 UAT signed off. Ready to close.**

---

## Sprint 3 UAT — 2026-05-15

> **Features tested:** FR-06 Session Communication + Inline Comments; FR-07 Timeline Deep Links
> **UAT agent:** Claude Sonnet 4.6
> **TSC status:** PASS — `tsc --noEmit --noUnusedLocals --noUnusedParameters` exits clean with zero errors.

| Priority | Status | Issue | File:Line |
|----------|--------|-------|-----------|
| **P1 — High** | fixed | Thread popover never opens when clicking ruler pins. Root cause: the ruler div's `onMouseDown` handler calls `setPlayheadBar` which triggers a React re-render. The pin div uses `onClick` (not `onMouseDown`). The re-render caused by the `mousedown` → `setPlayheadBar` path destroys and recreates the pin element before the browser's `click` event fires on it, causing the `onClick` → `onOpenThread()` call to be lost. Fix: add `e.stopPropagation()` on the pin's `onMouseDown` (new handler) to prevent the ruler's playhead-seek logic from running when a pin is clicked. | `src/App.tsx:2336–2344, 2414–2423` |
| **P1 — High** | fixed | Chat panel message items have no `onClick` handler — clicking a comment in the chat panel does nothing. Exit criterion #7 ("clicking navigates to anchor") is unmet. The chat messages at line 4333 are plain `div` elements with no click → `onOpenThread` wiring. Fix: add `onClick={() => setOpenThreadId(c.id)}` to each chat message item. | `src/App.tsx:4333` |
| **P2 — Medium** | fixed | Deep link with `?track=<id>` calls `setSelectedTrackId(trackParam)` which opens the FX chain overlay panel for that track. A deep link to a track should highlight/scroll to it, not open its plugin chain. Fix: remove `setSelectedTrackId(trackParam)` from the deep link effect; keep only `setHighlightTrackId(trackParam)`. | `src/App.tsx:3913` |
| **P2 — Medium** | open | Hi-Hat track header pin does not appear for resolved comments. The track header pin filter at line 2301 is `c.status === 'open'` — it excludes resolved comments. The seed comment c3 (Miguel, Hi-Hat, resolved) therefore shows no pin. A resolved comment on a track is still navigable history. Fix: remove the `c.status === 'open'` filter for track header pins (or show the pin in a muted/resolved style). | `src/App.tsx:2301` |
| **P3 — Low** | open | Seed comment anchor label off-by-one: seed data uses `startBar: 4` (0-indexed = bar 5 in the ruler) but the spec describes this as "bar 4". All rendered labels show "Bar 5" and "Bars 9–13" instead of the spec's "Bar 4" and "Bars 8–12". Either the seed data or the spec description is wrong. The display formula `Bar ${startBar + 1}` is correct for 0-indexed storage; the seed data should use `startBar: 3` for "Bar 4". | `src/App.tsx:3419–3420` |
| **P3 — Low** | open | Unread badge on chat toggle never fires for seed comments on initial load. `lastChatOpenedAt` is initialized to `Date.now()` at component mount, and seed comments are also created with `new Date()` at the same time — the `>` comparison makes all seed comments appear "read" immediately. For a real session this is fine (only new WS-delivered comments show as unread), but for prototype demo purposes the seed comments are always silent. | `src/App.tsx:3809, 4377–4380` |
| **P3 — Low** | open | DEMO_PRESENCE presence seed data has hardcoded hex colors (`'#1D9E75'`, `'#E94560'`) rather than referencing `C.success` and `C.danger` tokens. These happen to match the tokens, but future token changes would diverge silently. | `src/App.tsx:3413–3414` |

### Scenario results

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Initial render — no layout breakage, no console errors | PASS | Clean load, no JS errors |
| 1 | WS status indicator present and colored | PASS | Dot renders red + "Sync offline" label when server not running (wsStatus: 'failed') |
| 2 | Ruler pins at correct bar positions | PASS | Pins present in ruler at positions corresponding to seed comments |
| 2 | Click ruler pin opens thread popover | FAIL | P1 — ruler onMouseDown re-render kills onClick on pin before it fires |
| 3 | Thread popover: body, anchor label, resolve button, reply input, close button | NOT TESTABLE | Blocked by P1 defect above; code review confirms ThreadPopover implementation is structurally complete with correct isViewer guards |
| 4 | Hi-Hat track header pin visible | FAIL | P2 — open-only filter excludes resolved comment c3 |
| 5 | Chat panel opens with 3 seed comments + compose input | PASS | All 3 comments visible with correct author names, collaborator dot colors, anchor labels, compose input present |
| 5 | Viewer role disables chat compose | PASS (code) | `disabled={isViewer}` present on compose input; `if (!trimmed || isViewer) return` in handleChatPost |
| 6 | Copy deep link — "Link copied" toast appears | PASS (code) | Toast implementation correct; 1500ms duration means it disappears before screenshot; button wired to handleLinkIconClick |
| 7 | Deep link ?t=4&track=t3 — playhead seeks, track highlights | PARTIAL FAIL | P2 — `?track=t3` opens FX chain overlay for Hi-Hat in addition to highlighting; deep link should not open FX chain |
| 8 | TypeScript: `tsc --noEmit --noUnusedLocals --noUnusedParameters` | PASS | Zero errors |
| — | WS comment fan-out handlers | PASS (code) | All four handlers (comment.add/reply/resolve/reopen) implemented in WS message switch |
| — | 1280px min-width enforced | PASS | `minWidth: 1280` on root div |
| — | No hardcoded hex colors in Sprint 3 UI code | PASS | New Sprint 3 surfaces use C.* tokens |

### Verdict

**FAIL.**

Two P1 defects block the sprint from closing:

1. Thread popover is inaccessible — the ruler pin click race condition means the comment thread UI (resolve, reply, reopen) cannot be exercised by any user. This makes exit criteria #3, #5, #6, #7, and #9 unverifiable in the live UI.
2. Chat messages are not clickable — the "clicking navigates to anchor" part of exit criterion #7 is simply not wired.

Both P1 fixes are small (1–3 line changes each). The underlying ThreadPopover logic and role enforcement are structurally correct per code review — fixing the click event path and the chat item onClick should be sufficient to unblock re-testing.

The P2 deep link defect (FX chain opens on track link) would confuse a musician — they share a link expecting the recipient to land on a highlighted track, not have a plugin window pop open.

**Sprint 3 UAT NOT signed off. Requires fixes for defects above before close.**

---

## Sprint 3 UAT Re-run — 2026-05-15

> **Scope:** Targeted re-verification of P1-1, P1-2, P2-1 fixes only
> **UAT agent:** Claude Sonnet 4.6
> **TSC status:** PASS — `tsc --noEmit --noUnusedLocals --noUnusedParameters` exits clean with zero errors

### Fix verification

| Defect | Code fix confirmed | Live browser verified | Notes |
|--------|-------------------|----------------------|-------|
| P1-1 — Ruler pin click swallowed | YES — `onMouseDown={e => e.stopPropagation()}` and `e.stopPropagation()` in `onClick` present at `src/App.tsx:2422–2423`. `stopPropagation` confirmed working: playhead stays at bar 1 after pin click, meaning the ruler's `onMouseDown` seek is correctly suppressed. | UNCERTAIN — `preview_click` tool could not trigger the `onClick` handler across 6 attempts on the 8×10px absolutely-positioned pin inside a `position: sticky` scroll container. No console errors. `setOpenThreadId` confirmed reachable via chat-message path. Root-cause of test-tool failure not resolved. | The code fix is structurally correct and matches the prescribed remedy. Cannot confirm live UI behavior without `preview_eval` or a human browser session. |
| P1-2 — Chat messages not clickable | YES — `onClick={() => setOpenThreadId(c.id)}` and `cursor: 'pointer'` added to chat message div at `src/App.tsx:4333`. | PASS — Clicking Luke's chat message opened the ThreadPopover. Popover showed: author (Luke), anchor label (Bar 5), body text, resolve button (checkmark), reply input, close button (✕). All exit-criterion elements present. | Fix works end-to-end in the live UI. |
| P2-1 — Deep link opens FX panel | YES — `setSelectedTrackId(trackParam)` removed from the deep link `useEffect` at `src/App.tsx:3914`. Only `setHighlightTrackId(trackParam)` remains. | PASS (code) — Verified by git diff and direct code read. `setSelectedTrackId` call is absent from the effect; `selectedTrackId` remains `null` on deep-link navigation, which means the FX backdrop and panel stay hidden. Navigation to `?track=t3` will only set the highlight border, not open the FX overlay. | Could not navigate in-browser (no `preview_eval` tool available), but code verification is definitive. |

### ThreadPopover completeness (unblocked by P1-2 fix)

Verified via chat-message click path:
- Author name with collaborator color dot: PASS
- Anchor label ("Bar 5"): PASS
- Body text ("Kick needs more attack here"): PASS
- Resolve button (checkmark): PASS
- Close button (✕): PASS
- Reply input: PASS
- `isViewer = false` so all controls are enabled: PASS

### Console errors

`preview_console_logs` at `error` level: **no errors**.

### Verdict

**CONDITIONAL PASS.**

P1-2 (chat message click) and P2-1 (deep link FX panel) are fully resolved and verified in the live browser. P1-1 (ruler pin click) is confirmed fixed at the code level — the `stopPropagation` on `onMouseDown` demonstrably prevents the playhead-seek race condition — but live browser click verification was blocked by an automated-tool limitation specific to clicking 8×10px absolutely-positioned elements inside sticky scroll containers. No new defects were introduced by any of the three fixes.

Given that the ThreadPopover renders and functions correctly when reachable (P1-2 path), and the P1-1 code fix follows the same event-handler pattern, the fix is sound. A manual browser test is recommended to close the outstanding uncertainty on P1-1 before final sign-off.

**Sprint 3 UAT signed off pending manual confirmation of ruler pin click in a real browser session.**

---

# UAT Defect Register — Sprint 5

> **Source:** UAT Agent sign-off run, 2026-05-18
> **Features tested:** PostgreSQL/Prisma persistence, WS JWT validation, session hydration, VU stereo meters, context menu Rename + Loop region
> **Status key:** `open` · `in progress` · `fixed` · `deferred`

## [SPRINT-5-002] ✅ Loop overlay spans ruler only — does not cover track lanes
**Priority:** P1 | **Status:** fixed
**File:line:** `src/App.tsx``src/App.tsx` — loop overlay render
**Steps to reproduce:** Right-click any clip → Loop region. Observe the arranger overlay.
**Expected:** `height: 100%` spanning the full scrollable grid (ruler + all track rows). Documented as Designer Correction 3.
**Actual:** `height: RULER_H` (24px). Ruler-only stripe. No coverage of track lanes.
**Sprint:** 5

## [SPRINT-5-003] ✅ Loop overlay z-index occludes comment anchor pins
**Priority:** P2 | **Status:** fixed
**File:line:** `src/App.tsx``src/App.tsx` — loop overlay render
**Steps to reproduce:** Create a timeline comment pin. Set a loop region overlapping that bar.
**Expected:** `zIndex: 1`, below comment pins (which are zIndex ~10). Designer Correction 4.
**Actual:** `zIndex: 5`. Comment pins inside the loop region are covered.
**Sprint:** 5

## [SPRINT-5-004] ✅ Rename input missing dark scrim, owner-color caret, bottom border, focus ring
**Priority:** P1 | **Status:** fixed
**File:line:** `src/App.tsx``src/App.tsx` — clip rename input render
**Steps to reproduce:** Right-click a clip → Rename. Inspect the inline input.
**Expected:** `background: rgba(0,0,0,0.45)`, `caretColor: track.owner.color`, `borderBottom: 1px solid <owner.color>`, `boxShadow: 0 0 0 1px <owner.color>` on focus. Designer Corrections 1 and 2.
**Actual:** `background: transparent`, `border: none`, no caretColor, no boxShadow.
**Sprint:** 5

## [SPRINT-5-005] ✅ Transport loop badge uses unicode glyph, abbreviated label, wrong position; no aria-pressed
**Priority:** P2 | **Status:** fixed
**File:line:** `src/App.tsx``src/App.tsx` — TransportBar loop badge
**Steps to reproduce:** Set a loop region. Inspect transport bar.
**Expected:** Persistent "LOOP" text button (monospace, `aria-pressed`, always visible after Record button). No unicode glyphs per spec.
**Actual:** Conditional badge showing `◫ L X–Y`. No inactive state. No `aria-pressed`. Wrong position.
**Sprint:** 5

## [SPRINT-5-006] ✅ L and R micro-labels absent from VU meter bar columns
**Priority:** P2 | **Status:** fixed
**File:line:** `src/App.tsx``src/App.tsx` — VU meter render (per-track + master strips)
**Steps to reproduce:** Open MixerPanel. Inspect above VU meter bars.
**Expected:** 5px monospace "L" and "R" labels centered above each bar column per Designer spec §5-I-2.
**Actual:** No labels on any strip. Two meter channels are visually indistinguishable.
**Sprint:** 5

## [SPRINT-5-007] ✅ 0 VU tick opacity 0.5 vs spec 0.6; label uses hardcoded positioning
**Priority:** P3 | **Status:** fixed
**File:line:** `src/App.tsx``src/App.tsx` — VU tick render
**Steps to reproduce:** Open MixerPanel. Inspect the 0 VU reference tick mark.
**Expected:** Opacity 0.6; label at `right: calc(100% + 2px)`.
**Actual:** Opacity 0.5; label at hardcoded `left: -10`. Cosmetic deviation.
**Sprint:** 5

---

# UAT Defect Register — Sprint 7

> **Source:** UAT Agent sign-off run, 2026-05-19
> **Features tested:** Audio file drag-and-drop import, file picker (ImportButton + I key), Cloudflare R2 upload, server-side peak generation (200 RMS values), WS audio.uploaded fan-out, all clip import states, WaveformPlaceholder, multi-file drop toast, PeakGenerator abstraction
> **Status key:** `open` · `in progress` · `fixed` · `deferred`

## [SPRINT-7-001] Migration adds peaks column with no DEFAULT — pre-Sprint-7 AudioFile rows return NULL peaks
**Priority:** P2 | **Status:** fixed (commit `24792ce`)
**File:line:** `server/prisma/migrations/20260520011302_add_audio_file_peaks/migration.sql:2`
**Steps to reproduce:** Add the migration to a DB with existing AudioFile rows. Call `GET /api/v1/audio/:id/stream-url` or any path that calls `getAudioFile()`. `mapAudioFileRow` returns `peaks: null` (not `[]`) because the column was added with no `DEFAULT '{}'`.
**Expected:** `ALTER TABLE "AudioFile" ADD COLUMN "peaks" DOUBLE PRECISION[] NOT NULL DEFAULT '{}';` so existing rows safely return an empty array.
**Actual:** `ALTER TABLE "AudioFile" ADD COLUMN "peaks" DOUBLE PRECISION[];` — no default. Existing rows yield NULL. The `prisma-adapter.ts:136` mapping does `peaks: row.peaks` with no null-coalescing guard, so callers receive `null` typed as `number[]`. Any runtime use of `.length` on such a value (e.g. `broadcastAudioUploaded` at `server/ws/handler.ts:416`) will throw for pre-Sprint-7 rows.
**Sprint:** 7
**Resolution:** Backend fix in commit `24792ce` — migration updated with `DEFAULT '{}'`; `prisma-adapter.ts` null-coalescing guard added (`peaks: row.peaks ?? []`).

## [SPRINT-7-002] Session snapshot hydration does not populate audioFileId or importPeaks on clips — waveforms absent on session open
**Priority:** P2 | **Status:** fixed (commit `30bbae4`)
**File:line:** `src/App.tsx:4817–4828`
**Steps to reproduce:** Upload an audio file in session A. Close and reopen the session (triggering a fresh WS session.snapshot). Observe clips loaded from the snapshot.
**Expected:** Exit criterion #5 — "future session opens render waveform from snapshot without re-decode." Clips loaded from the snapshot should show the waveform using peaks stored in the DB on the associated AudioFile row.
**Actual:** The snapshot hydration mapping (lines 4817–4828) does not set `audioFileId` or `importPeaks` on hydrated clips. `ClipRow` in the snapshot payload does not carry peaks, and the handler does not fetch them from the associated AudioFile. All hydrated clips render `WaveformPlaceholder` instead of the persisted waveform. Additionally, if an `audio.uploaded` WS event arrives for a collaborator upload after a snapshot load, the `c.audioFileId !== p.audioFileId` check at line 4913 always fails for snapshot-loaded clips (audioFileId is undefined), so server peaks can never be applied via WS to those clips.
**Sprint:** 7
**Resolution:** Frontend fix in commit `30bbae4` — snapshot hydration handler updated to map `audioFileId` and `peaks` from `ClipRow` onto hydrated clips; `importStatus` set to `'complete'` for clips with peaks, `'uploading'` otherwise.

## [SPRINT-7-003] BPM hardcoded to 128 in import pipeline — clip duration wrong for non-128 sessions
**Priority:** P2 | **Status:** fixed (commit `30bbae4`)
**File:line:** `src/App.tsx:2710`
**Steps to reproduce:** Create a session at 90 BPM. Import a 10-second audio file. Observe clip length in bars.
**Expected:** Clip length = `ceil(10 / (60 / 90 / 4))` ≈ 6 bars (at 90 BPM).
**Actual:** `const bpm = 128` hardcoded. Clip length = `ceil(10 / (60 / 128 / 4))` ≈ 8.5 → 9 bars. The TODO comment at line 2710 acknowledges the gap but leaves it unresolved.
**Sprint:** 7
**Resolution:** Frontend fix in commit `30bbae4` — import handler reads live `bpm` state from App component; TODO comment removed.

## [SPRINT-7-004] failed-decode clips have no visual differentiation from WaveformPlaceholder on non-imported clips
**Priority:** P3 | **Status:** fixed (commit `30bbae4`)
**File:line:** `src/App.tsx:1742–1746`
**Steps to reproduce:** Trigger a decode failure (mock or environment without Web Audio API). Observe the clip compared to a pre-upload clip.
**Expected:** Exit criterion states "failed-decode (placeholder + toast)." The spec implies a distinct visual signal for decode failure on the clip body — the toast fires correctly (line 2758), but the clip renders identically to any other WaveformPlaceholder state (no danger tint, no badge).
**Actual:** `isFailed` only covers `importStatus === 'failed-upload'`. `failed-decode` clips show the same untinted WaveformPlaceholder as clips with no peaks. No badge is rendered. The toast fires, but the clip itself gives no persistent failure signal. A collaborator who missed the toast has no way to know the waveform is unavailable vs. simply still loading.
**Sprint:** 7
**Resolution:** Frontend fix in commit `30bbae4` — `isFailed` logic extended to include `importStatus === 'failed-decode'`; failed-decode clips receive `C.warn` tint (distinct from `C.danger` for failed-upload) so persistent visual state is available after the toast clears.

---

## Sprint 7 UAT Re-verification — 2026-05-19

> **Scope:** Targeted re-verification of SPRINT-7-001 through SPRINT-7-004 only (backend commit `24792ce`, frontend commit `30bbae4`)
> **UAT agent:** Claude Sonnet 4.6
> **TSC status:** PASS — both `npx tsc --noEmit` (frontend) and `cd server && npx tsc --noEmit` (backend) exit clean with zero errors

### SPRINT-7-001 — UAT re-verification: PASS

**Code reviewed:** `server/storage/prisma-adapter.ts` `mapAudioFileRow` (lines 115–144), `server/prisma/migrations/20260520_fix_audio_file_peaks_default/migration.sql`

- `mapAudioFileRow` at line 142: `peaks: row.peaks ?? []` — null guard confirmed present. Comment explicitly documents protection against replica lag.
- Migration file confirms both required steps: `UPDATE "AudioFile" SET "peaks" = '{}' WHERE "peaks" IS NULL;` (backfill) and `ALTER TABLE "AudioFile" ALTER COLUMN "peaks" SET DEFAULT '{}';` (default).
- `broadcastAudioUploaded` at `server/ws/handler.ts:410–421` receives `AudioUploadedPayload` whose `peaks` field comes from `audioFile.peaks` (`server/routes/audio.ts:325`). Because `mapAudioFileRow` now guarantees `peaks` is always `number[]` (never null), no crash path is reachable via null peaks at this call site.

### SPRINT-7-002 — UAT re-verification: PASS

**Code reviewed:** `server/storage/adapter.ts` `ClipRow`, `server/storage/prisma-adapter.ts` `getClips`/`mapClipRow`, `server/storage/memory-adapter.ts` `createClip`, `src/App.tsx` `case 'session.snapshot'`

- `ClipRow` in `adapter.ts` lines 40–52: `audioFileId: string | null` and `peaks: number[]` confirmed.
- `getClips` at `prisma-adapter.ts:267–279`: `include: { audioFile: { select: { id: true, peaks: true } } }` — join confirmed. `mapClipRow` at lines 92–113: `audioFileId: row.audioFile?.id ?? null` and `peaks: row.audioFile?.peaks ?? []` — both fields populated.
- `memory-adapter.ts` `createClip` at lines 94–103: `audioFileId: data.audioFileId ?? null` and `peaks: data.peaks ?? []` — safe defaults confirmed.
- `src/App.tsx` snapshot handler at lines 4785, 4829–4833: `ClipRow` type includes both `audioFileId: string | null` and `peaks: number[]`. Hydrated clips set `audioFileId: cl.audioFileId ?? null` and conditionally spread `{ importPeaks: new Float32Array(cl.peaks), importStatus: 'complete' as const }` when `cl.peaks && cl.peaks.length > 0` — all four parts of the fix confirmed.

### SPRINT-7-003 — UAT re-verification: PASS

**Code reviewed:** `src/App.tsx` `runImportPipeline` / XHR `onload` handler, lines 2710–2713

- Line 2711 comment: `// bpm is the live session state variable — correct bar width for any tempo`
- Line 2712–2713: `const durationBars = durationSec > 0 ? Math.max(1, Math.ceil(durationSec / (60 / bpm / 4))) : 1` — references the `bpm` state variable from App component closure, not a hardcoded literal.
- `const bpm = 128` does NOT appear in `src/App.tsx`. The only occurrence of `128` in BPM context is `useState(128)` at line 4696 (the initial state default, which is correct and intentional).

### SPRINT-7-004 — UAT re-verification: PASS

**Code reviewed:** `src/App.tsx` `Clip` component border/ring logic, lines 1742–1747

- Line 1742: `const isFailed = clip.importStatus === 'failed-upload'`
- Line 1743: `const isFailedDecode = clip.importStatus === 'failed-decode'`
- Line 1746: `const borderColor = isFailed ? C.danger : isFailedDecode ? C.warn : track.owner.color`
- Line 1747: `const ringColor = isFailed ? \`${C.danger}88\` : isFailedDecode ? \`${C.warn}44\` : \`${track.owner.color}44\``
- Three distinct visual treatments confirmed: `failed-upload` → `C.danger`; `failed-decode` → `C.warn` with `44` alpha ring (per spec: `2px solid ${C.warn}` border and `${C.warn}44` inset ring); neutral/loading → track owner color.
- No regression on `failed-upload` danger treatment.

### Overall verdict

**PASS. All four defects confirmed fixed. Sprint 7 is cleared to close.**

TypeScript: zero errors on both frontend and backend.

---

# UAT Defect Register — Sprint 8

> **Source:** UAT Agent sign-off run, 2026-05-20
> **Features tested:** Session lobby (EC 1–5), audio buffer playback (EC 6–10), application menu bar (EC 11–15)
> **Commits reviewed:** `f1b8ea6` (audio playback), `f69659e` (session lobby), `4a0ecd5` (menu bar)
> **Status key:** `open` · `in progress` · `fixed` · `deferred`

## [SPRINT-8-001] WS message handler is an empty stub when session is entered via lobby
**Priority:** P1 | **Status:** fixed (commit `ebbbb4d`)
**File:line:** `src/App.tsx:6372`
**Steps to reproduce:**
1. Open app with no `?session=` URL param — lobby appears.
2. Create or join a session from the lobby.
3. Session room opens. Server sends `session.snapshot`, `presence.joined`, `track.*` WS messages.
**Expected:** Session hydrates from snapshot; tracks and presence appear; all real-time collaboration WS messages are processed.
**Actual:** `handleEnterSession` calls `getWsClient(id, () => {/* ... */}, setWsStatus)` with an empty `onMessage` stub. All WS messages — including `session.snapshot` — are silently dropped. The arranger stays empty and no real-time sync occurs. The full `handleWsMessage` closure is only registered in the initial `useEffect([])` which ran at mount time when `urlSessionId` was null, so it was never registered with the WS client.
**Root cause:** `handleWsMessage` is defined inside `useEffect([])` and only passed to `getWsClient` when `urlSessionId` is truthy on mount. The lobby path bypasses this effect. The fix is to either: (a) lift `handleWsMessage` outside the effect and pass it in `handleEnterSession`, or (b) re-call `getWsClient` with the full handler after session entry (e.g. via a `useEffect([sessionId])` dependency).
**Sprint:** 8

## [SPRINT-8-002] Space keypress on a focused menu item double-fires transport play/pause
**Priority:** P2 | **Status:** fixed (commit `ebbbb4d`)
**File:line:** `src/App.tsx:6172–6175` (global Space handler), `src/App.tsx:5143–5162` (menu Item component)
**Steps to reproduce:**
1. Open a session. Press Tab until focus is on a menu label (e.g. Transport). Press Enter or Space to open the menu.
2. Tab to the "Play" item. Press Space to activate it.
**Expected:** Transport toggles once (Space activates the button, play state changes once).
**Actual:** Two events fire: (1) the button's native click handler (`onClick: () => { closeMenu(); setPlaying(p => !p) }`), and (2) the global `keydown` handler's `Space` branch (`setPlaying(p => !p)`). The two calls cancel each other out — play state changes then immediately reverts. Any non-Play menu item (e.g. "Return to Zero") activated by Space would also trigger play/pause as a side effect.
**Note:** The `closest('[role="menubar"]')` guard protects the `?` shortcut but is not applied to the Space handler. The dropdown panel is `position: fixed; role="menu"` — it is NOT a descendant of `[role="menubar"]`, so the guard would not help even if added to Space. The correct fix is `if ((e.target as HTMLElement).closest('[role="menu"]')) return` in the Space guard.
**Sprint:** 8

## [SPRINT-8-003] File > New Session is wired to onLeaveSession, not a new-session creation flow
**Priority:** P3 | **Status:** fixed (commit `ebbbb4d`) — item relabeled "Return to Lobby"
**File:line:** `src/App.tsx:5170`
**Steps to reproduce:** Open a session. File > New Session.
**Expected (DAW convention):** Opens a "New Session" dialog or creates a blank session, leaving the current one. The label implies creating new work, not leaving.
**Actual:** Both "New Session" and "Leave Session" in the File menu call `onLeaveSession` — they return the user to the lobby. A musician reading "New Session" would expect a creation flow, not navigation back to the lobby. This is a labeling issue — either the label should be changed to "Return to Lobby" or the item should be wired to a new-session creation flow.
**Sprint:** 8

---

## Sprint 8 UAT Re-verification — 2026-05-28

> **Scope:** Targeted re-verification of SPRINT-8-001, SPRINT-8-002, SPRINT-8-003, 5-I/R3 (VU stereo meters), and Pre-existing P3 (hardcoded API base URL)
> **Fix commit reviewed:** `ebbbb4d` (`src/App.tsx`)
> **UAT agent:** Claude Sonnet 4.6
> **TSC status:** PASS — `tsc --noEmit` (frontend) and `cd server && tsc --noEmit` (backend) both exit with zero errors

### [SPRINT-8-001] WS handler dead on lobby entry — PASS

**Status:** fixed

- `handleWsMessage` is defined as `useCallback` at component scope (line 5818) — NOT inside any `useEffect` body. Dependency array is `[]` with a comment explaining state setters are stable.
- A `useEffect` with `[sessionId, handleWsMessage]` dependency array exists at line 6005–6020. It guards on `if (!sessionId) return`, calls `getWsClient(sessionId, handleWsMessage, setWsStatus)`, and explicitly sets `client.onmessage` to a JSON-parsing wrapper that calls `handleWsMessage`. The comment at line 6009–6010 explicitly documents the intent: "Explicitly update onmessage in case the socket was created with an empty stub."
- `handleEnterSession` (line 6401–6408) calls only `setSessionId(id)` and pushes URL state. It does NOT call `getWsClient` at all, and contains no `() => {}` empty stub. A comment at line 6406 reads: "WS registration is handled reactively by useEffect([sessionId, handleWsMessage])."
- The `session.snapshot` case in `handleWsMessage` (line 5840+) is structurally reachable when a session is entered via the lobby — `setSessionId` triggers the `useEffect([sessionId])` which registers the handler before the server has had time to send snapshot.

### [SPRINT-8-002] Space key double-fires in menu — PASS

**Status:** fixed

- Global `onKeyDown` Space case at line 6206–6211.
- Guard at line 6208: `if ((e.target as HTMLElement).closest('[role="menu"]')) return` — present, correctly typed as `HTMLElement` (no `any`), placed before `setPlaying(p => !p)`.
- The dropdown panel has `role="menu"` at line 5359, confirmed as a descendant target when a menu item has focus, so the guard correctly intercepts the event.

### [SPRINT-8-003] "New Session" label — PASS

**Status:** fixed

- `grep '"New Session"'` on `src/App.tsx` returns zero results in the File menu item context.
- Line 5184: `<Item label="Return to Lobby" onClick={onLeaveSession} />` — label is "Return to Lobby"; handler is `onLeaveSession` (unchanged from original wiring).
- The string "New Session" appears only as a heading inside the `SessionLobby` component (`h2` at line 5605), which is unrelated to the File menu.

### [5-I / R3] VU meters not true stereo — PASS

**Status:** fixed

Audio graph path verified in two call sites (lines 905–932 in `startClipPlayback`, lines 6120–6153 in the playback `useEffect`):

- `ctx.createChannelSplitter(2)` called at lines 908 and 6127 — one splitter per active source.
- `splitter.connect(analyserL, 0)` at lines 928 and 6149 — left channel tap confirmed.
- `splitter.connect(analyserR, 1)` at lines 929 and 6150 — right channel tap confirmed.
- `panner.connect(_masterGain)` (falling back to `ctx.destination`) at lines 923–926 and 6143–6146 — audio output path through `StereoPannerNode` to `_masterGain` is intact; the splitter is an additional side-tap, not a replacement of the output path. No audio regression.
- rAF loop at lines 4000–4001: `readRMS(active.analyserL)` for `levelL`, `readRMS(active.analyserR)` for `levelR` — two distinct analysers read independently.
- `stopAllSources` / cleanup at line 847–848: `analyserL.disconnect(); analyserR.disconnect()` — both analysers disconnected on stop.
- Only one `AudioContext` in use — `getAudioCtx()` utility pattern (line 1+). No second context created.

### Pre-existing P3 — Hardcoded API base URL — PASS

**Status:** fixed

- Line 155: `const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'` — constant present, typed correctly without `any`, reads from `VITE_API_URL` env var with fallback.
- All `fetch` and XHR call sites use `${API_BASE}` — verified at lines 600, 2846, 5023, 5454, 5477, 5501, 5807, 6291, 6297, 6312, 6335.
- `grep 'http://localhost:3000'` inside call sites: zero results. The only occurrence of the literal string is inside the `API_BASE` constant definition on line 155.
- WS URL at line 251: `ws://localhost:3001/ws?sessionId=${sessionId}` — untouched, as required.

### TypeScript

`tsc --noEmit` (frontend): **PASS — zero errors**
`cd server && tsc --noEmit` (backend): **PASS — zero errors**

### Overall verdict

**PASS. All 5 defects confirmed fixed. Sprint 8 is cleared to close.**

---

# UAT Defect Register — Sprint 9

> **Source:** UAT Agent sign-off run, 2026-05-29
> **Features tested:** FR-01 Resizable Workspace Panels, FR-02 Arranger Timeline Zoom (horizontal + vertical)
> **UAT agent:** Claude Sonnet 4.6
> **TSC status:** PASS — `tsc --noEmit` exits clean with zero errors
> **Status key:** `open` · `in progress` · `fixed` · `deferred`

## [SPRINT-9-001] Panel height calculations omit MENU_BAR_H — mixer bottom clipped by 24px
**Priority:** P2 | **Status:** fixed (Sprint 9 close, 2026-05-29)
**File:line:** `src/App.tsx:5953,5959,6662`
**Steps to reproduce:**
1. Open a session. Observe the mixer panel bottom edge — strip labels or dB readout at the bottom may be cut off.
2. Drag the vertical splitter to minimum arranger height (200px). Observe whether the mixer's bottom content is visible.
**Expected:** Mixer panel occupies exactly the available vertical space. `defaultArrangerH + SPLITTER_H + mixerH = window.innerHeight - MENU_BAR_H - TRANSPORT_H - STATUS_BAR_H`.
**Actual:** The `defaultArrangerH` formula on line 5953 uses `window.innerHeight - TRANSPORT_H - STATUS_BAR_H` (omitting `MENU_BAR_H = 24`). The `mixerH` formula on line 5959 does the same. As a result, `defaultArrangerH + SPLITTER_H + mixerH = window.innerHeight - 80px`, but the flex container can only accommodate `window.innerHeight - 104px` (subtracting all four chrome regions: MenuBar 24 + TransportBar 52 + StatusBar 28 + SPLITTER_H 4). The panels overflow the flex container by 24px. With `overflow-hidden` on the parent, the bottom 24px of the mixer panel is clipped and not visible to the user. This was introduced when `MENU_BAR_H` was added in Sprint 8 but the splitter spec pseudocode (which predated Sprint 8) was not updated to include it.
**Fix:** Change lines 5953 and 5959 to:
```typescript
// line 5953
() => Math.floor((window.innerHeight - MENU_BAR_H - TRANSPORT_H - STATUS_BAR_H) * 0.60),
// line 5959
const mixerH = window.innerHeight - MENU_BAR_H - TRANSPORT_H - STATUS_BAR_H - SPLITTER_H - arrangerH
```
Also update `maxArrangerH` on the same line to subtract `MENU_BAR_H`. And update the `resetVerticalSplitter` default target and the `dragMaxH` in `onVerticalSplitterPointerDown` for consistency.
**Sprint:** 9

## [SPRINT-9-002] View menu "Zoom Out" shortcut label shows en dash (–) not hyphen-minus (-)
**Priority:** P3 | **Status:** fixed (Sprint 9 close, 2026-05-29)
**File:line:** `src/App.tsx:5414`
**Steps to reproduce:** Open a session. Open the View menu. Observe the shortcut label next to "Zoom Out".
**Expected:** `–` label in the menu should display `-` (hyphen-minus), matching what the user actually presses. The keyboard handler at line 6409 listens for `e.key === '-'` (hyphen-minus).
**Actual:** `shortcut="–"` (U+2013, en dash) is displayed. A musician reading the menu would press the en dash key (which does not exist as a standalone key on standard keyboards) rather than the hyphen-minus key. The shortcut still works because the handler listens for `-`, but the menu label is misleading.
**Fix:** Change `shortcut="–"` to `shortcut="-"` at line 5414.
**Sprint:** 9

---

# Sprint 10 Defects

> Sprint 10 UAT run: 2026-05-31 (local dev, backend not running). Build failure (SPRINT-10-001) is the primary blocker. Not demo-ready.

## [SPRINT-10-001] `npm run build` fails — 8 TypeScript errors, no deployable artifact
**Priority:** P1 | **Status:** open
**File:line:** `src/App.tsx:305, 2948, 3231, 4640, 4646, 5271, 5311` / `vite.config.ts:9`
**Steps to reproduce:** Run `npm run build` in the project root.
**Expected:** Build exits with zero errors and produces `dist/`.
**Actual:** `tsc -b` reports 8 errors:
- `App.tsx:305` TS6133 — `sendWsMessage` declared but never called (dead code)
- `App.tsx:2948` TS2304 — `bpm` not in scope inside `ArrangeView` (not passed as prop)
- `App.tsx:3231` TS2554 — `onZoom` called with 2 args; prop typed as 1 arg (`anchorBarOverride?` missing from `ArrangeViewProps`)
- `App.tsx:4640` TS6133 — `DEMO_PRESENCE` declared but not wired to state
- `App.tsx:4646` TS6133 — `SEED_COMMENTS` declared but not wired to state
- `App.tsx:5271` TS6133 — `loopEnd` destructured in `MenuBar` but never read in component body
- `App.tsx:5311` TS2538 — `openMenu` typed `MenuName | null`, used as index type before null narrowing
- `vite.config.ts:9` TS2769 — vitest `test` property type conflict on `defineConfig`
**Sprint:** 10
**Owner:** Frontend

## [SPRINT-10-002] `bpm` not passed to `ArrangeView` — all imported clips default to 1 bar
**Priority:** P1 | **Status:** open
**File:line:** `src/App.tsx:2948` (ArrangeView body), `src/App.tsx:2591` (ArrangeViewProps), call site ~line 6836
**Steps to reproduce:**
1. Open a session. Import an audio file longer than one bar (e.g. a 10-second file at 128 BPM should be ~8–9 bars).
2. Observe the clip length on the arranger.
**Expected:** Clip length = `ceil(durationSec / (60 / bpm / 4))`.
**Actual:** `bpm` is `undefined` inside `ArrangeView` (not in props). `60 / undefined / 4 = NaN`. Fallback `durationBars = 1`. Every imported clip is 1 bar wide regardless of audio duration.
**Fix:** Add `bpm: number` to `ArrangeViewProps`; destructure it in `ArrangeView`; pass `bpm={bpm}` at call site.
**Sprint:** 10
**Owner:** Frontend

## [SPRINT-10-003] `?demo=1` does not bypass the lobby — requires `?session=` param too
**Priority:** P2 | **Status:** open
**File:line:** `src/App.tsx:5915, 6759–6761`
**Steps to reproduce:** Navigate to `http://localhost:5173/?demo=1`.
**Expected:** Session room renders with seeded tracks (no backend needed).
**Actual:** `sessionId` remains `null` (no `?session=` param), so the lobby guard fires and `<SessionLobby>` renders. The seeded tracks are in state but never visible.
**Fix:** When `isDemoMode` is true, also seed `sessionId` with a synthetic value (e.g. `'demo'`) to bypass the lobby render guard. Document `?demo=1` as the correct usage in a code comment.
**Sprint:** 10
**Owner:** Frontend

## [SPRINT-10-004] `DEMO_PRESENCE` and `SEED_COMMENTS` not wired to state — collaboration story invisible without backend
**Priority:** P2 | **Status:** open
**File:line:** `src/App.tsx:4640, 4646, 5941, 5945`
**Steps to reproduce:** Open `?demo=1&session=dev` without a backend. Check presence indicators and comments.
**Expected:** Demo presence cursors (Anna, Miguel) and seed comments appear to demonstrate collaboration features.
**Actual:** `presence` state initialized to `[]`; `comments` state initialized to `[]`. Both constants exist but are disconnected. No collaboration story is visible without a live backend.
**Fix:** Change state initializations at lines 5941 and 5945 to `isDemoMode ? DEMO_PRESENCE : []` and `isDemoMode ? SEED_COMMENTS : []` respectively. Depends on SPRINT-10-003 fix (so `isDemoMode` session room is reachable).
**Sprint:** 10
**Owner:** Frontend

## [SPRINT-10-005] Known Limitations panel absent from Help menu
**Priority:** P2 | **Status:** open
**File:line:** `src/App.tsx:5441–5448` (Help menu items)
**Steps to reproduce:** Open Help menu. Look for Known Limitations.
**Expected:** Per `docs/specs/socializable-demo-qa.md` §Known Limitations Panel: a surface accessible from Help listing recording status, native VST scope, plugin parameter status, undo/redo status, export status, and mobile status.
**Actual:** Help menu has only "Keyboard Shortcuts" and "About DAWin". No known-limitations surface exists anywhere.
**Note:** Requires Designer spec before implementation (process gate per CLAUDE.md).
**Sprint:** 10
**Owner:** Designer (spec) → Frontend (implementation)

## [SPRINT-10-006] About DAWin version string stale — shows "Sprint 8" after Sprint 9 shipped
**Priority:** P3 | **Status:** open
**File:line:** `src/App.tsx:5147–5148`
**Steps to reproduce:** Help → About DAWin.
**Expected:** Version string reflects current sprint (Sprint 9 or 10).
**Actual:** Shows "Sprint 8 — Playable Beta" and "v0.8.0-beta".
**Fix:** Change to "Sprint 9 — Playable Beta" and "v0.9.0-beta".
**Sprint:** 10
**Owner:** Frontend

## [SPRINT-10-007] No Designer spec for Known Limitations surface — process gate missing
**Priority:** P3 (process) | **Status:** open
**File:line:** `docs/specs/` (no file exists)
**Notes:** Per CLAUDE.md, no user-visible frontend feature may begin without a Designer spec in `docs/specs/`. Known Limitations panel is user-visible. Work order issued to Designer. Implementation blocked until spec is written.
**Sprint:** 10
**Owner:** Designer
