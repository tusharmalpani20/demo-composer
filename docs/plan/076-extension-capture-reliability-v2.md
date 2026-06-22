# Extension Capture Reliability V2 Plan

Date: 2026-06-22

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

This is Phase 7 of the alpha hardening master plan.

## Goal

Move the extension from automatic click capture MVP toward reliable real-browser capture.

Target outcome:

```text
extension user starts automatic capture
  -> popup lifecycle does not easily break capture
  -> supported clicks produce ordered screenshot-backed events
  -> unsupported pages fail clearly
  -> upload failures are recoverable
  -> manual screenshot fallback remains available
  -> raw input values and page HTML remain uncaptured
```

This plan should be driven by manual extension dogfood evidence.

## Dependencies

Should start after:

```text
docs/plan/072-manual-extension-dogfood.md
```

Reason:

- reliability priorities should come from observed browser failures
- plan `058` must be refreshed because automatic click capture MVP now exists

## Current Baseline

Current extension capabilities:

- popup app
- instance URL setup
- bearer token auth
- project selection
- active capture persistence
- automatic click capture
- background upload orchestration
- content click metadata collection
- manual screenshot fallback
- pause/resume
- finish-to-portal

Manual extension dogfood on 2026-06-22 produced these Phase 7 inputs:

- Extension setup, API sign-in, project listing, project selection persistence, start capture, pause/resume state, backend finish, and local active capture cleanup worked.
- Automatic click capture created an extension-sourced capture session but produced zero click events and zero screenshot files on a safe HTTP page.
- Manual screenshot fallback produced no upload/event request, no popup error, no file, and no capture event.
- `Open in portal` and `Finish capture` opened API-origin project URLs when API and web ran on different local ports; those URLs returned 404 JSON instead of the web portal.
- Guide/demo generation from extension events was blocked because no events or assets were captured.

Phase 7 should first reproduce these failures in a headed/manual browser session to separate automation limitations from product defects, then pick the smallest reliability slice.

Likely files:

```text
apps/extension/src/App.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/api.ts
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/navigation.ts
apps/extension/src/*.test.tsx
apps/extension/src/lib/*.test.ts
apps/extension/public/manifest.json
apps/extension/README.md
docs/plan/058-extension-automatic-event-capture-roadmap.md
```

Known deferred:

- HTML snapshots
- raw DOM replay
- raw input values
- full-page screenshots
- navigation event capture
- Chrome Web Store packaging

## Scope

Included:

- review manual extension dogfood findings
- refresh plan `058` to reflect current automatic click capture baseline
- choose one reliability slice
- improve capture behavior around real observed failure mode
- preserve privacy defaults
- preserve manual fallback
- add focused tests
- update extension README if behavior changes

## Explicit Non-Goals

- HTML replay
- collecting raw input values
- broad popup redesign
- Chrome Web Store packaging
- desktop capture
- analytics
- guide/demo editor changes
- backend schema changes unless required by selected reliability slice

## Expected File Touches

Expected docs:

```text
docs/plan/058-extension-automatic-event-capture-roadmap.md
docs/plan/076-extension-capture-reliability-v2.md
```

Likely extension files:

```text
apps/extension/src/
apps/extension/README.md
```

Likely tests:

```text
apps/extension/src/**/*.test.*
```

Conditional files:

```text
apps/server/src/
apps/web/src/
docs/project-zoomout-status.md
docs/plan/master/001-alpha-hardening-master-plan.md
docs/plan/<new-extension-follow-up-plan>.md
```

Only touch backend or portal code if the selected reliability slice needs a contract or display change.

## Candidate Reliability Slices

Choose one primary slice for implementation.

### Background-Owned Active Capture State

Problem:

- popup lifecycle can confuse users if capture state depends too much on popup state

Possible work:

- move active capture orchestration further into background worker
- keep popup as control/status surface
- ensure capture continues after popup closes where Chrome APIs allow
- add tests around popup close/reopen state

### Navigation Handling

Problem:

- click-triggered navigation can race screenshot capture or content script availability

Possible work:

- define whether screenshot should capture pre-click or post-click state
- record current page metadata consistently
- add recovery for navigation between click and upload
- document limitation if full handling is deferred

### Unsupported Page Recovery

Problem:

- pages where content scripts or capture APIs cannot run need clearer user recovery
- the 2026-06-22 dogfood run surfaced silent capture/fallback failure with no popup error

Possible work:

- improve popup and background error messages
- surface last automatic capture failure
- keep active capture state intact
- guide user to manual screenshot fallback where possible

### Upload/Event Failure Recovery

Problem:

- screenshot upload or event creation can fail after a user clicks
- manual screenshot fallback can fail without creating any upload/event request or user-facing error

Possible work:

- avoid advancing local event index on failure
- show recoverable error
- offer retry if safe
- prevent duplicate events
- preserve local active capture state

### Domain/Page Exclusions

Problem:

- users may need to avoid capturing specific pages

Possible work:

- allow lightweight exclusion list in extension settings
- skip capture with clear reason
- keep privacy posture explicit

### Split API/Web Portal URLs

Problem:

- extension instance URL is the API origin, but browser-facing portal routes may need a different web origin in local/self-host split deployments

Possible work:

- add a separate portal/base web URL setting or derive it from a server-provided public web origin
- keep API calls on the API instance URL
- open portal routes on the browser-facing web origin
- add tests for `Open active capture` and `Finish capture` URL construction

## Implementation Plan

### 1. Review Evidence

- [ ] Read `docs/v1-dogfood-smoke-suite.md`.
- [ ] Extract extension-specific failures and limitations.
- [ ] Read `apps/extension/README.md`.
- [ ] Read current plan `058`.
- [ ] Reproduce automatic capture and manual fallback in a headed/manual browser if possible.
- [ ] Reproduce split API/web portal opening behavior.
- [ ] Pick one reliability slice.

### 2. Refresh Plan 058

Update:

```text
docs/plan/058-extension-automatic-event-capture-roadmap.md
```

Minimum updates:

- automatic click capture MVP is now implemented
- list current extension baseline
- mark remaining roadmap items accurately
- point to this plan for reliability V2

Do not rewrite history as if plan `058` implemented work directly.

### 3. Design The Selected Slice

For the selected slice, write down:

- current behavior
- desired behavior
- privacy implications
- state transitions
- message contracts
- recovery behavior
- affected tests

Keep this design in implementation notes or split into a new narrower plan if it grows.

### 4. Implement And Test

- [ ] Add failing tests where practical.
- [ ] Update extension state/message code.
- [ ] Preserve manual screenshot fallback.
- [ ] Preserve input redaction.
- [ ] Preserve event ordering guarantees.
- [ ] Improve user-facing error or status copy.
- [ ] Update README if behavior changes.

### 5. Manual Verification

- [ ] Build extension.
- [ ] Load unpacked extension.
- [ ] Run selected reliability scenario in browser.
- [ ] Confirm active capture state remains recoverable.
- [ ] Confirm no raw input values or HTML are captured.
- [ ] Confirm finish-to-portal still works.

## Testing Plan

Likely commands:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension build
rtk pnpm --filter extension lint
rtk pnpm check-types
rtk git diff --check
```

If backend API contracts change, also run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server test:db
```

Manual browser verification is required for the selected reliability scenario.

## Acceptance Criteria

- Plan `058` reflects current automatic click capture baseline.
- One dogfood-proven reliability issue is improved.
- Manual screenshot fallback remains available.
- Raw input values are not captured.
- Page HTML is not captured.
- Event ordering behavior remains safe.
- Extension tests cover new behavior.
- Extension build succeeds.
- Browser verification result is recorded.

## Documentation Updates

Expected:

```text
docs/plan/058-extension-automatic-event-capture-roadmap.md
docs/plan/076-extension-capture-reliability-v2.md
apps/extension/README.md
```

Conditional:

```text
docs/v1-dogfood-smoke-suite.md
docs/project-zoomout-status.md
docs/plan/master/001-alpha-hardening-master-plan.md
```

## Suggested Commit Shape

Use a commit based on the selected slice, for example:

```text
Harden extension capture upload recovery
Clarify extension unsupported page handling
Refresh extension capture roadmap
```

## Follow-Up Plans

Possible follow-ups:

- background-owned active capture state
- navigation event capture
- domain exclusion controls
- visible capture overlay
- full-page screenshot research
- Chrome Web Store packaging
