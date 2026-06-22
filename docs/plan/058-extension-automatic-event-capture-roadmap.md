# Extension Automatic Event Capture Roadmap

Date: 2026-06-15

Status: Implemented as MVP; reliability follow-up active in `docs/plan/076-extension-capture-reliability-v2.md`.

## Goal

Move the Chrome extension from manual popup screenshot capture toward privacy-preserving automatic workflow recording.

This roadmap is partially complete. Automatic click capture MVP exists, but the 2026-06-22 extension dogfood run showed it is not reliable enough yet for alpha evidence.

## Current Baseline

The extension currently supports automatic click capture MVP plus manual screenshot fallback:

```text
popup
  -> user starts capture
  -> extension starts automatic click capture
  -> content script listens for safe click events on http/https pages
  -> background worker captures the visible tab
  -> extension uploads visible-tab PNG
  -> extension creates one ordered click event
  -> user can still click Capture screenshot as a fallback
  -> user finishes capture
  -> portal opens capture session detail
```

Current reliability findings from manual dogfood:

- setup, auth, project selection, start capture, pause/resume, backend finish, and local active-state cleanup worked
- automatic click capture created a backend capture session but produced zero click events and zero screenshot files in the dogfood run
- manual screenshot fallback produced no upload/event request or popup error in the dogfood run
- split API/web local setups need a separate portal URL so portal links do not open the API origin

It does not currently include:

- reliable browser-proven automatic click capture
- navigation timing capture
- input/change event capture
- pause/resume overlay
- full-page screenshots
- HTML snapshots

## Next Milestone Shape

Current reliability milestone:

```text
docs/plan/076-extension-capture-reliability-v2.md
```

Keep raw input values redacted by default.

## Design Questions To Resolve Before Implementation

- Should clicks and screenshots be separate capture events, or one enriched screenshot-backed capture event?
- Should a background service worker own capture state, with the popup only controlling start/pause/finish?
- How should capture continue when the popup closes?
- How should navigation after a click be handled without losing the screenshot timing?
- What selector strategy is safe enough for replay/helpful guide generation without collecting sensitive DOM?
- Should we record target text, accessible role, test id, CSS selector, or a ranked set of fallbacks?
- How do we prevent recording passwords, tokens, typed values, or sensitive visible text?
- Do we need a lightweight page overlay for pause/resume/stop?
- How should users exclude specific domains or pages?

## Suggested Implementation Phases

1. Add extension architecture for background-owned active capture state.
2. Add a content script that reports safe click metadata only while capture is active.
3. Add a browser message flow from content script to background/popup for screenshot capture.
4. Record screenshot-backed click events with safe metadata and redacted input values.
5. Add pause/resume/stop controls and visible capture status.
6. Add navigation handling and recovery for pages where content scripts cannot run.
7. Revisit whether HTML snapshots or full-page capture should be added.

## Acceptance Criteria For The Future Implementation

- user can start/stop automatic capture without keeping the popup open
- click events are ordered correctly
- screenshots are attached to the right step-worthy event
- raw input values are never stored
- restricted pages and extension-inaccessible pages fail gracefully
- manual screenshot capture remains available as a fallback
