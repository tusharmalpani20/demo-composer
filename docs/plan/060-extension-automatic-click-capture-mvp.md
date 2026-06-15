# Extension Automatic Click Capture MVP Plan

Date: 2026-06-15

Status: Planned.

## Goal

Move the Chrome extension from manual screenshot capture to a basic Scribe-style automatic capture loop:

```text
start capture
  -> user clicks through browser workflow
  -> extension records safe click metadata
  -> extension captures a screenshot for each step-worthy click
  -> backend stores ordered screenshot-backed capture events
  -> user finishes capture and opens portal
  -> guide generation uses ordered click/capture source material
```

This is the largest remaining gap in the Scribe-like product. The current manual screenshot capture flow should remain available as a fallback.

## Current Baseline

Already built:

- extension instance URL configuration
- extension login with bearer session token
- project selection
- start active capture session
- manual visible-tab screenshot upload
- linked `capture` event creation
- local event index persistence
- finish capture and open portal capture detail
- active capture restore/discard

Deferred in `docs/plan/058-extension-automatic-event-capture-roadmap.md`:

- content script
- automatic click listener
- safe DOM metadata extraction
- navigation handling
- popup-independent capture orchestration

## Scope

Build the smallest reliable automatic capture path:

- add a background/service-worker owned active capture controller
- add a content script that only activates when capture is active
- listen for safe user click events
- collect safe target metadata:
  - tag name
  - accessible role when available
  - visible text trimmed and length-limited
  - element bounding box
  - current URL and page title
  - a best-effort selector or selector candidates
- send click metadata to the extension runtime
- capture the visible tab after the click is observed
- upload screenshot asset to the active capture session
- create a linked `click` or `capture` event with click metadata and screenshot asset
- preserve manual screenshot capture as a fallback button
- add pause/resume capture state
- clearly show active/paused/error state in the popup

## Recommended Event Model

For this slice, create one screenshot-backed event per captured click.

Recommended event shape:

```text
event_type = "click"
event_index = next ordered index
screenshot_capture_asset_id = uploaded screenshot
url = safe active tab URL
page_title = active tab title
element_text = safe trimmed text nullable
element_role = safe role nullable
element_selector = safe selector nullable
bounding_box = JSON object nullable
input_value_redacted = true
```

Do not create separate screenshot-only and click-only events for the same user action in this slice. One event should become one generated guide step unless guide generation later decides to merge or skip it.

## Privacy Rules

- never store raw input values
- never store password field values
- never inspect or upload full DOM HTML
- trim and cap element text length
- skip capture on browser-restricted pages
- skip capture on non-http/non-https pages
- keep current manual capture available for pages where content scripts cannot run

## Backend Impact

Likely no schema migration is required if existing capture event metadata fields can represent:

- click event type
- element text/role/selector
- bounding box JSON
- screenshot asset reference
- URL/title
- redacted input flags

Before implementation, confirm existing capture event schema and service allow `click` event creation from extension clients. If not, expand the capture event module with a small migration and DB tests.

## Frontend/Extension Impact

Extension pieces:

- manifest content script registration
- background/service-worker message handling
- capture state storage helpers
- content script click listener
- screenshot upload orchestration
- event creation orchestration
- popup controls for automatic mode, pause, resume, manual fallback, finish

Portal pieces:

- capture session detail should render click events with the same screenshot-backed event display used by manual capture
- guide generation should produce useful titles from click metadata when present

## Tests

Add or update extension tests for:

- content script ignores events when inactive
- content script sends safe metadata when active
- sensitive input values are never sent
- background handles click event by uploading screenshot then creating capture event
- failed upload keeps capture active and reports an error
- pause stops automatic event capture
- manual screenshot capture still works

Add or update server tests only if event schema/service needs changes.

Add or update web tests if capture session detail or guide generation display changes.

## Acceptance Criteria

- user can start automatic capture from extension
- popup does not need to remain open for click capture to continue
- user clicks create ordered screenshot-backed capture events
- manual screenshot button still works
- pause/resume works
- sensitive input values remain redacted
- unsupported pages fail gracefully
- finishing capture still opens the portal capture session detail page

## Out Of Scope

- full-page stitched screenshots
- HTML snapshots
- DOM replay
- input value capture
- AI step generation
- desktop app capture
- advanced selector healing
- analytics
