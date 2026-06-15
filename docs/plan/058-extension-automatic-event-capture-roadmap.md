# Extension Automatic Event Capture Roadmap

Date: 2026-06-15

Status: Planned.

## Goal

Move the Chrome extension from manual popup screenshot capture toward privacy-preserving automatic workflow recording.

This is a roadmap plan only. Do not implement automatic event capture as part of plan 057.

## Current Baseline

The extension currently supports manual screenshot capture:

```text
popup
  -> user starts capture
  -> user clicks Capture screenshot once per step-worthy moment
  -> extension uploads visible-tab PNG
  -> extension creates one ordered capture event
  -> user finishes capture
  -> portal opens capture session detail
```

It does not currently include:

- content scripts
- background-owned capture orchestration
- automatic click listeners
- DOM target metadata capture
- navigation timing capture
- input/change event capture
- pause/resume overlay
- full-page screenshots
- HTML snapshots

## Next Milestone Shape

Recommended next milestone:

```text
content script
  -> listens for safe click events
  -> extracts safe target metadata
  -> asks extension runtime to capture visible screenshot
  -> uploads screenshot
  -> records ordered capture event
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
