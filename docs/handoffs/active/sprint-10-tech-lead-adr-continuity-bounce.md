# Work Order: Tech Lead — ADR-009 Owner Continuity Bounce Architecture

**To:** Tech Lead
**From:** PM
**Sprint:** 10
**Date issued:** 2026-05-31
**Status:** Unblocked — start immediately.
**Spec:** `docs/specs/owner-continuity-bounce.md` ✅ Ready for architecture review

---

## Objective

Review `docs/specs/owner-continuity-bounce.md` and write `docs/adr/ADR-009-owner-continuity-bounce-architecture.md`.

This is a **discovery and architecture decision** — not an implementation work order. No backend or frontend implementation begins until this ADR is accepted.

---

## Why this matters

Owner Continuity Bounce is a core collaboration promise, not a nice-to-have. When a collaborator who owns a virtual instrument or plugin-dependent track leaves the session, DAWin must not go silent. The spec is well-written and ready for architecture review, but it explicitly flags three Tech Lead decisions before any code is written. This ADR closes those gates.

---

## Questions the ADR must answer

### 1. Data model

The spec proposes a `ContinuityBounce` Prisma model as a separate table (candidate schema in `§Data model — Tech Lead decision required`). Decide:

- Separate `ContinuityBounce` table (spec recommendation), or fields on `Track`/`Clip`?
- What represents source revision for stale detection — integer version, hash, or `updatedAt`?
- Does the bounce link to an `AudioFile` entity or store its own file reference?

### 2. Render path for MVP

The spec lists four render options (§Render strategy). Decide which path is used for the first implementation:

| Option | Description |
|---|---|
| Browser `OfflineAudioContext` | DAWin-native Web Audio chain rendering |
| Desktop-side render | Native plugin chain — not yet built |
| Server render from uploaded audio only | Limited to existing audio clips |
| Simulated MVP render | Fastest to prove data model and UX |

**Tech Lead recommendation from spec:** Browser OfflineAudioContext for Web Audio-native tracks; native plugin path is desktop-future-only. Confirm or adjust.

### 3. ADR flag — is a new ADR required?

The spec asks whether this feature requires a new ADR before implementation. **Yes, it does** — the data model, render strategy, and WebSocket event shape all constrain backend, frontend, and future desktop architecture. This is that ADR.

---

## ADR sections to include

Standard format from `docs/adr/README.md`:

- **Context** — what problem this solves and why it matters now
- **Decision** — data model, render path, API shape, WS events
- **Consequences** — what becomes possible and what is deferred by this decision
- **Rejected alternatives** — other options considered and why they were set aside
- **Open questions resolved** — work through the 6 open questions in `§Open questions` of the spec

---

## Constraints

- Do not spec desktop-side native VST rendering — that is explicitly out of scope for web MVP
- The data model must remain serializable for future WS sync without transformation
- Backend API shape must be compatible with the existing Fastify + Prisma server at `server/`
- Keep the ADR under 400 lines — this is an architecture decision, not a second spec

---

## What this ADR unlocks

Once ADR-009 is accepted:
- **BE work order:** Data model migration + continuity bounce endpoints
- **Designer work order:** Track status chip/badge placement, owner-leaving modal, context menu language
- **FE work order:** Track state display, playback fallback routing, toasts/warnings

None of those work orders are issued until ADR-009 is committed and STATUS.md is updated.

---

## Acceptance criteria

- [ ] `docs/adr/ADR-009-owner-continuity-bounce-architecture.md` exists and is committed
- [ ] Data model decision recorded (table or Track/Clip fields; stale detection approach)
- [ ] Render path for MVP decided and justified
- [ ] API route shape confirmed (can be rough — BE will finalize)
- [ ] WS event names confirmed (matches spec candidates or explicitly adjusted)
- [ ] All 6 open questions from spec answered
- [ ] `STATUS.md` updated: remove this from Active Work, add to Done

---

## Handoff

Drop `docs/handoffs/sprint-10-tech-lead-adr-continuity-bounce-done.md` confirming:
- ADR is committed
- Which decisions were accepted as-spec and which were changed
- Whether any PM decision is needed before Designer or BE can start

---

## Files to touch

- `docs/adr/ADR-009-owner-continuity-bounce-architecture.md` — new file
- `docs/adr/README.md` — add entry for ADR-009
- `STATUS.md` — update Active Work row

## Files to not touch

- `docs/specs/owner-continuity-bounce.md` — read-only (Designer spec, not Tech Lead territory)
- `src/` — no implementation yet
- `server/` — no implementation yet
