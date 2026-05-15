# FR-2026-05-14-08 — Standalone macOS Beta Build

## Summary

Create a standalone macOS application build of DAWin so the team can beta test and run QA outside the browser during development.

## Problem

The current app runs locally through the Vite dev server. That is fine for active development, but it is not ideal for beta testing, stakeholder review, or QA. A packaged macOS build would make the prototype easier to distribute, validate, and test against a more app-like environment.

## User Story

As the product owner, I want a standalone macOS app build so I can share DAWin with testers and run QA without requiring everyone to start a local dev server.

## Scope

### In Scope

- Evaluate best packaging path for the current React/Vite app.
- Recommended candidates:
  - Tauri.
  - Electron.
  - Progressive Web App install flow as a lighter alternative.
- Define MVP packaging requirements.
- Produce a repeatable local build command for macOS.
- Document setup steps for testers.
- Include basic app icon/name metadata.
- Ensure packaged app can run the current root `src/` prototype.

### Out Of Scope

- Mac App Store distribution.
- Apple notarization unless Tech Lead decides beta distribution requires it.
- Auto-updater.
- Production installer pipeline.
- Windows/Linux packaging.
- Native audio plugin hosting.

## UX / QA Requirements

- App should launch into the current DAWin session room.
- App should not require the tester to run terminal commands after installation/opening.
- QA should be able to capture screenshots and report defects against the packaged build.
- App identity should clearly say DAWin or DAWin Beta.

## Technical Notes

- Need Tech Lead to choose between Tauri, Electron, or PWA install.
- Tauri may be lighter, but has Rust/toolchain implications.
- Electron may be heavier but familiar and straightforward for a Vite app.
- Current backend scaffold and WebSocket requirements need review: the packaged app may need to run frontend-only for V1 or include/connect to a local/server backend.
- If collaboration requires server connectivity, packaged app needs environment/config strategy.

## Acceptance Criteria

- Tech Lead documents packaging recommendation.
- Repo includes repeatable build command for macOS app bundle or installable equivalent.
- Packaged app launches the current DAWin UI.
- Packaged app supports core playback, arranger, mixer, FX panel, and presence assumptions currently available in local development.
- Basic QA instructions exist.
- Known limitations are documented.
- No TypeScript, lint, or Vite build errors.

## Dependencies

- Current Vite frontend build.
- Backend/server decision for packaged mode.
- QA artifact distribution plan.

## Risks / Open Questions

- Need decision on whether packaged beta should include backend locally or connect to hosted backend.
- Need decision on whether native shell is required now or whether PWA install is enough for early QA.
- If future native plugin hosting is expected, packaging choice may matter more than it does for the current browser-first prototype.

## Recommended Priority

High

## Estimated Complexity

Medium/Large

## Suggested Owner

Tech Lead + Frontend Engineer.
