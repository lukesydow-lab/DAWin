# Owner Continuity Bounce — Plugin / Instrument Owner Leaving Session

**Status: Current**
**Last updated:** 2026-05-31
**Owner:** PM / Tech Lead / Designer
**Tier:** Need-to-Have
**Sprint candidate:** Sprint 9 discovery / Sprint 10 implementation unless Tech Lead approves earlier split
**Related FRs:**
- `docs/features/FR-2026-05-14-04-plugin-availability-freeze-bounce.md`
- `docs/features/FR-2026-05-14-05-bounce-link-detach-workflow.md`

## Overview

Owner Continuity Bounce preserves playback when a collaborator-owned virtual instrument, MIDI/instrument track, or plugin-dependent track becomes unavailable because the owner leaves the session, disconnects, or no longer has the required local rendering context active.

This is not a generic export feature. It is a collaboration continuity feature.

## Product promise

A shared DAWin session should not fall apart because the person holding the magic plugin closes their laptop.

When a collaborator owns a track that other collaborators cannot render locally, DAWin must preserve a playable audio proxy so the session keeps making sound.

## Problem

DAWin's long-term desktop product may support native VST3 / VSTi plugin hosting. The web app intentionally does not host native plugins. That creates a continuity gap:

1. A collaborator owns an instrument/plugin-dependent track.
2. Other collaborators can hear the result while the owner is online and rendering it.
3. The owner leaves.
4. Other collaborators may no longer be able to play that part.

Without a continuity bounce, the track becomes visually present but sonically missing. That is a trust failure.

## Terminology

| Term | Meaning |
|---|---|
| Source track | The original editable track containing MIDI, instrument, or plugin-dependent state. |
| Continuity bounce | A rendered audio proxy linked to the source track for playback continuity. |
| Linked bounce | A bounce that remains associated with its source track. |
| Detached bounce | A bounce converted into a normal editable audio clip/track, no longer dependent on source state. |
| Owner available | The source track owner is online and can render the track. |
| Owner unavailable | The source track owner is offline or the render context is missing. |

## MVP scope

The first version should prove continuity, not full DAW freeze parity.

### In scope

- Manual command: **Create Continuity Bounce**.
- Manual command: **Update Continuity Bounce**.
- Track-level continuity status.
- Audio proxy stored as an `AudioFile` and linked to the source track or source clip group.
- Playback routing falls back to the current bounce when owner/source render is unavailable.
- Owner-leave prompt when owned plugin/instrument-dependent tracks have missing or stale bounces.
- Clear unavailable state when no valid bounce exists.
- Source relationship visible in UI.
- Stale detection when source track changes after the last bounce.

### Out of scope for MVP

- Cloud plugin render farm.
- Browser-native VST hosting.
- Exact rendering of third-party native plugins from web clients.
- Full freeze/unfreeze parity with mature DAWs.
- Automatic background rendering after every edit.
- Bounce selected region only.
- Multi-version bounce history.
- Plugin license validation.

## Required continuity states

Each source track that may require continuity should expose one of these states.

| State | Meaning | Playback behavior |
|---|---|---|
| `not_required` | Track does not depend on unavailable owner/plugin state. | Normal playback. |
| `live_render_available` | Owner/source renderer is available. | Play source. |
| `bounce_current` | Valid bounce exists and matches source. | Play source if available; fallback to bounce if needed. |
| `bounce_stale` | Source changed after bounce. | Warn; fallback can play but may be outdated. |
| `bounce_missing` | Continuity is required but no bounce exists. | Warn; track may be silent if owner leaves. |
| `owner_offline_using_bounce` | Owner unavailable; valid bounce exists. | Play bounce. |
| `owner_offline_no_bounce` | Owner unavailable; no valid bounce exists. | Track unavailable / silent with explicit UI. |

## UX model

### Track status display

The track header should expose continuity state without overwhelming the mixer/arranger.

Suggested label language:

| State | UI label |
|---|---|
| `bounce_current` | Continuity Bounce Current |
| `bounce_stale` | Continuity Bounce Stale |
| `bounce_missing` | Continuity Bounce Needed |
| `owner_offline_using_bounce` | Playing Continuity Bounce |
| `owner_offline_no_bounce` | Source Unavailable |

### Context menu / menu commands

Add to track context menu or Track menu once that menu exists:

- Create Continuity Bounce
- Update Continuity Bounce
- Use Bounced Proxy
- Restore Live Source
- Detach Bounce as Audio

### Owner leaving prompt

Trigger when a user attempts to leave and owns one or more tracks with `bounce_missing` or `bounce_stale`.

Suggested modal copy:

> Some tracks you own may become unavailable to collaborators after you leave.
>
> Create continuity bounces so the session can keep playing without your local instrument/plugin?

Actions:

| Action | Behavior |
|---|---|
| Bounce & Leave | Render/update bounces, then leave session. |
| Leave Without Bounce | Leave and mark affected tracks unavailable/stale as appropriate. |
| Cancel | Close modal and stay in session. |

Abrupt disconnects cannot show a prompt. In that case, DAWin uses the most recent valid continuity bounce if one exists.

## Data model — Tech Lead decision required

This spec intentionally does not mandate final schema. Tech Lead should decide whether this requires ADR before implementation.

### Minimum data needed

A continuity bounce relationship needs to answer:

- Which source track or source clip(s) created this bounce?
- Which audio file is the playable proxy?
- Is the bounce current or stale?
- Who created it?
- When was it created?
- What source revision did it match?
- Has it been detached?

### Candidate schema

```prisma
model ContinuityBounce {
  id              String   @id @default(cuid())
  sessionId       String
  sourceTrackId   String
  audioFileId     String
  status          String   // "current" | "stale" | "detached"
  sourceRevision  Int      // or source hash; Tech Lead decides
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  detachedAt      DateTime?

  session         Session  @relation(fields: [sessionId], references: [id])
  sourceTrack     Track    @relation(fields: [sourceTrackId], references: [id])
  audioFile       AudioFile @relation(fields: [audioFileId], references: [id])

  @@index([sessionId])
  @@index([sourceTrackId])
  @@index([audioFileId])
}
```

Open decision: this may also be represented by fields on `Clip` / `Track` instead of a new table. A table is cleaner if more than one bounce version may exist later.

## Render strategy — Tech Lead decision required

MVP rendering options:

| Option | Pros | Cons |
|---|---|---|
| Browser `OfflineAudioContext` render | Reuses Web Audio concepts; good for DAWin-native Web Audio plugin chain. | Browser only; may not represent native desktop plugins later. |
| Desktop-side render | More realistic for future native instruments/plugins. | Requires desktop shell and native architecture not currently built. |
| Server render from uploaded audio only | Useful for audio clips. | Cannot render native/local instruments. |
| Simulated MVP render | Fastest to prove UX/data model. | Must be clearly marked as prototype behavior. |

Recommended MVP: use DAWin-native Web Audio/procedural/plugin-chain rendering where possible, and treat native third-party plugin rendering as future desktop scope.

## Playback routing

On play:

1. If source can render live, play source.
2. Else if current continuity bounce exists, play bounce audio.
3. Else if stale bounce exists, play stale bounce with warning.
4. Else mark track unavailable and do not fail silently.

No track should silently disappear from the mix.

## Backend/API candidate endpoints

Final routes require Tech Lead approval.

```txt
POST /api/v1/sessions/:sessionId/tracks/:trackId/continuity-bounce
  Creates or updates a continuity bounce for the source track.

GET /api/v1/sessions/:sessionId/tracks/:trackId/continuity-bounce
  Returns current bounce status and linked audio file metadata.

POST /api/v1/sessions/:sessionId/tracks/:trackId/continuity-bounce/detach
  Converts the bounce into normal editable audio material.
```

Potential WebSocket events:

| Event | Direction | Payload |
|---|---|---|
| `continuity_bounce.created` | server → all | `{ trackId, bounce }` |
| `continuity_bounce.updated` | server → all | `{ trackId, bounce }` |
| `continuity_bounce.stale` | server → all | `{ trackId, reason }` |
| `continuity_bounce.detached` | server → all | `{ trackId, audioFileId, clipId? }` |
| `track.source_unavailable` | server → all | `{ trackId, ownerId }` |
| `track.using_continuity_bounce` | server → all | `{ trackId, bounceId, audioFileId }` |

## Acceptance criteria — MVP

- [ ] A track can be marked as requiring continuity bounce.
- [ ] Owner can manually create a continuity bounce.
- [ ] Bounce produces or references an `AudioFile` that can be streamed like imported audio.
- [ ] Bounce is visibly linked to the source track.
- [ ] Track displays current/stale/missing/unavailable continuity state.
- [ ] When source changes after bounce, status becomes stale.
- [ ] When owner attempts to leave with stale/missing bounces, prompt appears.
- [ ] If owner is offline and valid bounce exists, collaborators hear the bounce.
- [ ] If owner is offline and no bounce exists, collaborators see an explicit unavailable state.
- [ ] Detached bounce behaves like ordinary audio material.
- [ ] No hardcoded hex colors; use `C.*` or collaborator inline colors.
- [ ] TypeScript strict mode passes.

## Recommended work breakdown

### TL-1 — Architecture decision

Tech Lead decides:

- Data model.
- Render path.
- API shape.
- Whether this requires a new ADR.
- How to represent source revision / stale detection.

### D-1 — UX spec refinement

Designer defines:

- Track status chip/badge placement.
- Owner leaving modal.
- Context menu language.
- Linked vs detached visual pattern.

### BE-1 — Data model + endpoints

Backend implements:

- Schema/migration or storage adapter extension.
- Create/update/get/detach endpoints.
- WS events.
- Auth/role enforcement.

### FE-1 — UI + playback routing

Frontend implements:

- Track state display.
- Commands and modal.
- Playback fallback routing.
- Toasts/warnings.

### UAT-1 — Continuity test pass

UAT verifies:

- Happy path.
- Stale state.
- Owner leaves with current bounce.
- Owner leaves with missing bounce.
- Abrupt disconnect fallback.
- Detach workflow.

## Open questions

1. Is source revision an integer version, hash of source state, or `updatedAt` comparison?
2. Does the first MVP create a hidden proxy clip, visible clip, or separate linked audio track?
3. Should stale bounces play by default or require collaborator confirmation?
4. Is `Leave Without Bounce` allowed for owners, or should this be stricter for locked/armed tracks?
5. Does detach create a new track or convert the existing proxy into visible audio on the same track?
6. Does recording implementation need to ship before continuity bounce, or can continuity bounce be proven from imported/procedural material first?

## Non-goal reminder

This is not web VST hosting. Web DAWin can preserve and play audio proxies. Desktop DAWin may later create those proxies from native instruments/plugins.
