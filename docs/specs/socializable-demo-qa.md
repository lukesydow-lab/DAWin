# Socializable Demo QA — MVP Friend-Testing Runbook

**Status: Current**
**Last updated:** 2026-05-31
**Owner:** PM / UAT / Tech Lead
**Tier:** Need-to-Have
**Sprint candidate:** Sprint 9

## Overview

This spec defines the QA process for turning the Sprint 8 playable beta into a socializable demo that can be shown to musician friends without losing the plot.

This is not a full production QA plan. It is a focused demo-readiness runbook for validating the core DAWin promise:

> A musician can join a shared session, understand ownership, play the session, add or review audio, make simple edits, mix, comment, and share a timeline reference without hand-holding.

## Why this matters

DAWin is at risk of drifting into a feature cloud. The next product milestone should prove that the demo works, not that the backlog is infinite. This QA runbook creates a repeatable pass/fail standard before wider musician testing.

## Demo personas

| Persona | Goal |
|---|---|
| Primary producer | Starts the session, owns tracks, imports/records material, drives playback. |
| Remote collaborator | Joins, identifies their track, contributes audio or feedback. |
| Reviewer / viewer | Plays back, comments, follows links, does not edit destructive state. |

## Test environments

| Environment | Required? | Notes |
|---|---|---|
| Local dev | Yes | First validation surface. |
| Beta/staging | Yes before friend testing | Matches intended review flow. |
| Production | No for Sprint 9 QA | Only after beta UAT pass. |
| Packaged desktop build | No | Separate backlog item. |

## Entry criteria

Before UAT begins:

- Sprint 8 code is current.
- App boots locally.
- Backend is running.
- Database is available if `DATABASE_URL` is set.
- R2 credentials are available for audio upload/playback testing.
- `npm run build` passes.
- Server `npm run typecheck` passes.
- No open P0/P1 defects in `docs/defects.md`.

## Severity model

| Severity | Meaning | Demo impact |
|---|---|---|
| P0 | App cannot boot, session cannot open, playback crashes, data loss, or core route impossible. | Blocks all demos. |
| P1 | Core happy path blocked: cannot create/join/import/play/edit/mix/comment/deep-link. | Blocks musician testing. |
| P2 | Important behavior broken but workaround exists. | Can demo with known limitation if documented. |
| P3 | Polish, copy, visual glitch, or edge case. | Does not block demo. |

## Smoke test checklist

Run before every demo.

| Area | Steps | Pass condition | Severity if failed |
|---|---|---|---|
| App boot | Start frontend and backend. Open app with no `?session=` param. | Session lobby renders; no blank arranger. | P0 |
| Create session | Create a named session from lobby. | User lands in session room with valid `?session=` URL. | P0 |
| Join session | Return to lobby and join by session ID. | Session opens correctly. | P1 |
| Invalid session | Enter bad session ID. | Friendly inline error; no crash. | P2 |
| Recent sessions | Create/join multiple sessions. | Up to 3 recent sessions display and rejoin. | P3 |
| Transport | Press Space. Press Stop. Press RTZ. | Space toggles playback; Stop preserves playhead; RTZ resets. | P1 |
| Audio import | Use `I` file picker. Drag/drop an audio file. | Clip appears, uploads, shows waveform/placeholder state. | P1 |
| Real playback | Press play after import completes. | Imported audio plays real audio. | P1 |
| Mixer | Change fader, pan, mute, solo. | Audio and VU meters respond correctly. | P1 |
| Comments | Add/open comment thread. Reply/resolve/reopen. | Thread behavior works without state loss. | P2 |
| Chat | Open chat, send message. | Message appears; unread badge behavior is sane. | P2 |
| Deep link | Copy link to timeline/track/clip/range. Open it. | Playhead/target highlights and navigates correctly. | P1 |
| Menu bar | Open all menus. Trigger active items. | Active items work; stubs dimmed/non-interactive. | P2 |
| Keyboard shortcuts | Open `?` modal. Test listed shortcuts. | Modal opens and listed shortcuts match reality. | P2 |

## DAW muscle-memory checklist

This validates whether the demo feels like a DAW to experienced users.

| Expectation | Pass condition | Notes |
|---|---|---|
| Spacebar play/pause | Works globally except when typing. | Locked convention. |
| Stop preserves position | Stop does not return to zero. | Locked convention. |
| RTZ is separate | Return-to-zero resets playhead. | Locked convention. |
| Click ruler to seek | Playhead moves to clicked bar. | Existing behavior. |
| Clip drag | Clip can move predictably. | Verify grab offset. |
| Clip resize | Left/right resize handles work. | Check edge cases. |
| Cut/split | Cut tool works where expected. | Shortcut should match displayed hint. |
| Delete/duplicate | Context menu or menu action works. | Must not require hidden knowledge. |
| Fade/crossfade | Fade handles and overlap crossfade remain usable. | Especially after zoom work ships. |
| Zoom | If Sprint 9 includes zoom, verify horizontal zoom does not break edit math. | Currently missing / candidate. |
| Panel resize | If Sprint 9 includes resize, verify arranger/mixer/FX panel resizing. | Currently missing / candidate. |

## Musician friend test script

Give testers tasks instead of a tour.

### Script

1. Join this DAWin session.
2. Press play.
3. Tell me who owns which track.
4. Find your track.
5. Import or record a short idea. If recording is not implemented yet, import an audio file.
6. Move the clip.
7. Trim or cut the clip.
8. Change volume and pan.
9. Leave a comment on a specific moment.
10. Send me a link to that moment.
11. Tell me what felt broken, fake, confusing, slow, or weird.

### Observer notes

Capture:

- First place they hesitate.
- First thing they try that does not exist.
- First DAW shortcut they expect.
- Any control they misread.
- Whether collaborator colors communicate ownership.
- Whether they understand what is real vs. prototype.
- Their top 3 “this is weird” comments.

## Known limitations panel

Before external friend testing, add or document a known-limitations surface accessible from Help.

Minimum contents:

- Browser recording may be missing until Sprint 9 recording ships.
- Native VST/VSTi hosting is desktop-only future work, not web scope.
- Plugin parameter editing may be incomplete.
- Undo/redo may be unavailable.
- Export/stem export may be unavailable.
- Mobile capture is planned but not part of the current demo.

Known limitations should feel honest, not apologetic. The point is to keep testers focused on the right feedback.

## Exit criteria for socializable demo

The demo is ready for musician friends when:

- [ ] Smoke test passes with zero P0/P1 defects.
- [ ] Musician friend test can be completed without PM intervention.
- [ ] All known limitations are documented.
- [ ] Keyboard Shortcuts modal matches wired shortcuts.
- [ ] Menu stubs are visually dimmed and non-interactive.
- [ ] Imported audio plays reliably from R2.
- [ ] Collaboration surfaces work: presence/ownership, comments, chat, deep links.
- [ ] UAT logs defects to `docs/defects.md` with severity and repro steps.

## Defect log template

```md
| Priority | Status | Issue | Repro steps | Expected | Actual | File:Line | Owner |
|---|---|---|---|---|---|---|---|
| P1 | open | Example issue | 1. ... 2. ... | ... | ... | `src/App.tsx:123` | Frontend |
```

## Work orders suggested from this spec

1. UAT Agent: Run smoke test and log defects.
2. UAT Agent: Run DAW muscle-memory checklist.
3. PM/Designer: Write known-limitations copy for Help menu.
4. Tech Lead: Convert P0/P1 findings into fix work orders.
5. PM: Run first musician friend test after zero P0/P1 pass.
