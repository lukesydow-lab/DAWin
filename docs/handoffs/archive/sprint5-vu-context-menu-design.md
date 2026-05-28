# Handoff: Sprint 5 VU + Context Menu Design

**Date:** 2026-05-18  
**From:** Designer agent  
**To:** Frontend Engineer + Tech Lead  
**Spec:** `docs/specs/sprint5-vu-and-context-menu.md`  
**Covers:** Task 5-I (VU meter polish — 0 VU tick, L/R stereo labels) and Task 5-J (context menu — rename clip, loop region)

---

## What I read before writing this

- `src/App.tsx` lines 2674–2918 (VU constants, `renderVUChannel`, `MixerStrip`)
- `src/App.tsx` lines 3150–3208 (master strip meter)
- `src/App.tsx` lines 1612–1651 (`ContextMenu` component)
- `src/App.tsx` lines 1554–1560 (clip label rendering)
- `src/App.tsx` lines 2334–2368 (ruler layout)
- `src/App.tsx` lines 3219–3299 (`TransportBar`)
- `docs/specs/vu-meter-motion.md` (existing VU spec, consulted for continuity)

The spec does not conflict with any existing implementation. It extends and completes partial or stubbed features.

---

## Corrections needed before UAT

### 5-I: VU meters

**No blocking visual issues found** in the existing stereo meter implementation. The L and R bars, peak-hold dots, and transient physics are already wired correctly per the motion spec. Two things are missing and must be added:

1. **The 0 VU tick mark does not exist anywhere** — neither in channel strips nor on the master strip. This is the primary 5-I deliverable. Without it, the meter has no scale reference. Add per spec Section 5-I-1.

2. **L/R micro-labels ("L" and "R" above each bar) do not exist** — the bars are unlabeled. Users cannot tell which bar is L and which is R without this. Add per spec Section 5-I-2.

3. **Audio wiring is mono, not stereo** — `readRMS` reads a single `AnalyserNode` and the current code mirrors L to R artificially. The spec flags this for Tech Lead. Do not block the visual polish on the audio fix — add the labels and tick mark now, fix the audio tap separately.

### 5-J: Context menu

**Two items in the context menu are `disabled: true` with "(soon)" labels:**
- `'✎  Rename…'` at line 1630
- `'◫  Loop region'` at line 1629

These are the Sprint 5 deliverables. They must be wired to real interactions per the spec. The "(soon)" suffix must be removed when these items are activated.

**Rename clip (5-J-1):**
- The input must use a semi-transparent dark scrim background (`rgba(0,0,0,0.45)`), not `C.elevated`. Using `C.elevated` would create an opaque rectangle over the clip, which destroys the collaborator color tinting that is a core product differentiator.
- The focus ring and caret color must use the clip owner's collaborator color (`track.owner.color`), not `C.accent`. The accent purple is a global application color; clip identity belongs to the owner's color.
- Commit on both Enter and blur. Cancel on Escape with revert. Do not commit on Escape.
- Do not allow empty clip labels — revert to original on empty commit.

**Loop region (5-J-2):**
- The loop overlay must extend the full height of the scroll area (ruler + all track rows), not just the ruler. Ruler-only is the wrong behavior for a DAW and breaks muscle memory from Ableton/Logic.
- The loop indicator in the transport bar must be added as a new button. Do not reuse any existing button. See spec for placement and all interaction states.
- The overlay's `zIndex` must be below comment anchor pins. Check the existing pin z-order before placing the overlay.
- Use `${C.accent}2E` (18% alpha) for the overlay fill. Do not use `C.accentMuted` — it is 13% alpha and too faint to read against dark track content.

---

## Open questions requiring PM or Tech Lead input before FE proceeds

1. **Stereo AnalyserNode split:** The audio graph currently has one mono `AnalyserNode` per track post-fader. Driving true L/R meters requires either a `ChannelSplitterNode` after the analyser, or two `AnalyserNode`s on L and R split outputs. This is an ADR-level decision because it touches the audio graph described in ADR-001. **Tech Lead should decide approach before FE implements audio wiring.**

2. **Loop playback behavior:** The spec covers the visual state of the loop region. It does not specify what the audio engine does when the playhead reaches `loopEnd` (does it jump back to `loopStart`? Does it play through?). This is a product decision the PM should confirm before FE implements transport logic for looping.

3. **Loop region persistence:** Does the loop region persist across sessions (stored in session state) or is it ephemeral (cleared on reload)? The spec treats it as local UI state for Sprint 5, but if it goes into session state it will need WS broadcast handling.

---

## Confirmation: no conflicts with existing implementation

The spec does not propose removing or changing any existing DOM structure, component API, or audio graph node. All additions are:
- New absolute-positioned children within existing `aria-hidden` wrappers (VU tick, L/R labels)
- Activation of two already-stubbed context menu items (rename, loop)
- One new button in the transport bar (LOOP)
- One new absolutely-positioned overlay in the scroll grid (loop region)

The collaborator color model is honored throughout: the rename input uses `track.owner.color` for its underline, caret, and focus ring. The loop region overlay uses `C.accent` (application-level color) because a loop region belongs to the session, not an individual collaborator.
