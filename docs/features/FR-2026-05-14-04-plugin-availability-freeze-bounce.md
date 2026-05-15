# FR-2026-05-14-04 — Plugin Availability + Freeze/Bounce Fallback

## Summary

When a collaborative session depends on an instrument/plugin owned by a collaborator who leaves or becomes unavailable, DAWin should preserve playback by freezing/bouncing the MIDI/instrument performance to audio. The user should be prompted before leaving when their plugin-dependent tracks would become unavailable to others.

## Problem

Collaborative music sessions can break when one user's local instrument or plugin is not available to the rest of the session. If the plugin owner leaves, other collaborators may lose the ability to hear or continue working against that part. This creates a trust problem: the song should not fall apart because one person closed their laptop.

## User Story

As a collaborator, I want plugin-dependent tracks to remain playable when the plugin owner leaves so the session stays usable for everyone.

## Scope

### In Scope

- Detect tracks that depend on a user's local instrument/plugin state.
- Prompt the plugin owner to bounce/freeze dependent tracks before they leave the session.
- Create an audio fallback track or fallback clip from the MIDI/instrument performance.
- Mark the original MIDI/instrument track as unavailable, frozen, or owner-dependent when the owner is offline.
- Allow collaborators to play the bounced fallback while the owner is unavailable.
- Restore/switch back to the live plugin/MIDI track when the owner returns, where appropriate.
- Clearly communicate track state: live, frozen, fallback, unavailable, owner offline.

### Out Of Scope

- Full third-party VST hosting in browser.
- Cloud plugin rendering farm.
- Exact offline rendering of every external plugin.
- Plugin licensing enforcement.
- Full DAW-style freeze architecture across all track types.

## UX Requirements

- Leaving owner should see a clear warning: their plugin-dependent track may become unavailable to collaborators.
- User should be able to bounce/freeze from the warning prompt.
- Collaborators should see why a track is frozen or fallback-only.
- The bounced fallback should retain a visible relationship to the source track.
- Avoid destructive language. This is preservation, not punishment.

## Technical Notes

- MVP may simulate plugin dependency using DAWin's existing plugin/instrument model before true third-party plugin support exists.
- Need a clear data model for source track, fallback audio track, ownership, and online availability.
- This touches session presence, track ownership, audio rendering/export, and playback routing.
- If using browser Web Audio, Tech Lead should evaluate `OfflineAudioContext` for rendering where applicable.

## Acceptance Criteria

- System can identify a track that depends on a collaborator-owned instrument/plugin.
- When the owner attempts to leave, the app can prompt them to bounce/freeze dependent tracks.
- User can create a bounced/frozen audio fallback from that prompt.
- Collaborators can continue playback using the fallback when the owner is offline.
- Track UI clearly indicates fallback/frozen/owner-offline state.
- Owner returning to the session can restore access to the live source version where supported.
- No TypeScript, lint, or Vite build errors.

## Dependencies

- Track ownership and role enforcement.
- Collaborator presence.
- Audio rendering/export path.
- Future file/session persistence model.

## Risks / Open Questions

- Need Tech Lead to define what constitutes a "plugin-owned" track in the current prototype.
- Need decision on whether bounce creates a separate track, linked clip, or hidden fallback asset.
- Need decision on whether leaving prompt is blocking, optional, or configurable.
- True third-party plugin support may not be browser-feasible without a native shell or server-rendered architecture.

## Recommended Priority

High

## Estimated Complexity

Large

## Suggested Owner

Tech Lead + Frontend Engineer + Backend Engineer + Audio/DSP owner.
