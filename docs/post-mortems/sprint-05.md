# Sprint 5 Post-Mortem — Persistence Layer Live

> **Draft — awaiting PM review before this document is considered authoritative.**

**Sprint:** 5
**Dates:** 2026-05-18 – 2026-05-18
**Status:** Closed (with remediation required on two incomplete tickets)
**Author:** Writer Agent (reviewed by PM)

---

## What was planned

- Extend `session.snapshot` WS frame to include DB-backed session metadata, tracks, and clips
- Wire REST sessions endpoints to `StorageAdapter`
- Decode the JWT ticket on WS connect — remove hardcoded `dev-user-001` / `role: 'owner'`
- Have the frontend consume hydrated snapshot data and eliminate hard-coded seed state for tracks/clips
- Drive presence cursors from JWT-verified WS events rather than seed data
- Ship operational improvements: graceful shutdown, DB health check, `InMemoryStorageAdapter.reset()` for test isolation

---

## What shipped

- Session hydration on WS join: `session.snapshot` extended with `session`, `tracks`, and `clips` from DB
- `POST /api/v1/sessions` creates a `Session` DB row; `GET /api/v1/sessions/:id` reads from DB via `StorageAdapter`
- JWT ticket decoded on WS connect: `userId`, `displayName`, `color`, and `role` read from token; hardcoded `dev-user-001` / `role: 'owner'` removed
- `addReply` race condition fix; `InMemoryStorageAdapter.reset()` added
- Graceful shutdown: `prisma.$disconnect()` hook on `SIGTERM`/`SIGINT`
- DB startup health check: clear error message and non-zero exit if `DATABASE_URL` is set but DB is unreachable
- VU stereo (5-I): two-column visual render and `levelL`/`levelR` state shipped, but both driven by same mono `effectiveRMS` value — no `ChannelSplitterNode` in the audio graph
- Loop region context menu item: sets `loopStart`/`loopEnd` on clip
- Inline clip Rename: context menu triggers inline text edit on clip header
- **ADR-005:** Session hydration strategy on WS join
- Sprint 5 UAT: PASS, zero P0/P1 defects; 6 P2/P3 defects found and fixed during UAT

---

## What had issues

**Tickets 5-D and 5-E were not implemented at all.** These were the two frontend items that would have completed the persistence layer from the user's perspective:

- **5-D (Frontend snapshot hydration):** The backend sends the correct `session.snapshot` payload with `session`, `tracks`, and `clips` from the DB. The frontend `handleWsMessage` had no `case 'session.snapshot'` handler. `INITIAL_TRACKS` and `SEED_COMMENTS` still initialized state. `getWsClient` was still hardcoded to `'dev-session-001'`. The snapshot arrived but was silently discarded.

- **5-E (Real presence cursors):** `presence.joined` / `presence.left` WS events triggered `console.log` only. `DEMO_PRESENCE` seed data was still rendered unconditionally. No live presence data from the server was ever shown to the user.

**5-I (VU stereo) was cosmetically complete but technically incorrect.** Two meter columns rendered, but both columns were driven by the same mono `effectiveRMS` value. There was no `ChannelSplitterNode` in the audio graph — `levelL` and `levelR` were identical. This was logged as a P2 defect, did not block sprint close, and was carried forward. It was fixed in Sprint 8.

**Sprint 5 UAT also surfaced 6 defects in the UAT run itself:**

- SPRINT-5-002 (P1, fixed): Loop overlay spanned ruler only, not track lanes — `height: RULER_H` instead of `height: 100%`
- SPRINT-5-003 (P2, fixed): Loop overlay `zIndex: 5` occluded comment anchor pins
- SPRINT-5-004 (P1, fixed): Rename input missing dark scrim, owner-color caret, bottom border, and focus ring
- SPRINT-5-005 (P2, fixed): Transport loop badge used unicode glyph, abbreviated label, wrong position, and had no `aria-pressed`
- SPRINT-5-006 (P2, fixed): L/R micro-labels absent from VU meter bar columns
- SPRINT-5-007 (P3, fixed): 0 VU tick opacity 0.5 vs. spec 0.6; label used hardcoded positioning

---

## How issues were addressed

Tickets 5-D and 5-E were not resolved in Sprint 5. A remediation work order was created: `docs/handoffs/active/sprint-05-remediation-frontend.md`. The incomplete exit criteria were documented explicitly:
- Frontend snapshot hydration (5-D): NOT MET — remediation required
- Real presence cursors (5-E): NOT MET — remediation required

The 6 UAT defects (SPRINT-5-002 through 007) were all fixed during the UAT cycle before sprint close. Sprint 5 UAT PASSED with zero P0/P1 defects remaining.

The VU stereo mono-signal issue (5-I) was accepted as P2 and deferred. It was eventually resolved in Sprint 8 with a `ChannelSplitterNode` added after `StereoPannerNode`.

---

## Decisions made

**ADR-005 — Session Hydration Strategy:** On WS join, the server sends `session.snapshot` with `session`, `tracks`, and `clips` fields from the DB. Ephemeral runtime state (transport position, track locks, active presence) is not persisted — it is rebuilt from live WS events. Unknown session IDs receive WS close code `4404`. This decision defined the persistent/ephemeral split that all subsequent WS work built on.

**The "PASS with explicit incomplete exit criteria" approach:** Sprint 5 closed with a PASS UAT result but two exit criteria formally marked NOT MET. This is a decision worth naming: the team chose to close the sprint, ship what was done, and create a remediation work order for the incomplete items rather than extending the sprint. The rationale was that the backend work (which was complete and correct) should not be held open for frontend items that were missed. The downside: the remediation was never completed as a standalone ticket — the frontend snapshot hydration work happened piecemeal across Sprints 6 and 7 as adjacent features created the opportunity.

**VU stereo deferred as P2:** The decision to ship cosmetically stereo but technically mono VU meters, label it P2, and carry it forward was pragmatic. The visual result was indistinguishable to someone not reading the code; the metrological accuracy issue only mattered during real stereo content playback. Sprint 8 fixed it once the true stereo audio path (from R2 files) was introduced.

---

## What was deferred

- 5-D frontend snapshot hydration — formally deferred via remediation work order; fully resolved across Sprints 6–7
- 5-E real presence cursors — formally deferred; the `DEMO_PRESENCE` seed data remained in the app through Sprint 9 under `isDemoMode`; real presence from WS was wired incrementally
- 5-I VU stereo — deferred P2; fixed Sprint 8

---

## What was learned

**Missing frontend tickets at sprint close is a different failure mode than having defects.** Defects are caught by UAT and documented. Missing implementations are harder to track — they require the exit criteria to be checked against the actual code. This sprint demonstrated that explicit exit criteria with NOT MET markers are more useful than assuming "planned = shipped."

**The backend is ahead of the frontend at this point in the project.** The server correctly sends a hydrated `session.snapshot`; the frontend silently discards it. This asymmetry — where the backend contract is correct but the frontend hasn't consumed it — is a common pattern in sprint-based development and needs active tracking. The remediation work order is the right mechanism; following through on it is the obligation.

**Designer corrections were material in Sprint 5.** The 6 UAT defects were mostly design-spec deviations: wrong heights, wrong z-indices, missing visual treatments, incorrect label positions. The spec was correct; the implementation deviated. This suggests the frontend agent should do a more careful spec-vs-implementation check before calling work complete.

---

## Metrics

- Defects found by UAT: 6 (2 P1, 3 P2, 1 P3)
- All 6 fixed before sprint close
- Exit criteria met: 11 of 14 (5-D, 5-E, 5-I formally NOT MET)
- Sprint UAT result: PASS (zero P0/P1 at sign-off)
- tsc-clean on both frontend and backend at close

---

## Open questions going into the next sprint

- When does the 5-D remediation land? The frontend is showing seed tracks to the user indefinitely.
- Can the 5-E presence cursor wiring be bundled with a near-term sprint rather than living in a remediation file?
