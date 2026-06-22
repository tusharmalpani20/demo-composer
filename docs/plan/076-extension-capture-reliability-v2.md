# Extension Capture Reliability V2 Plan

Date: 2026-06-22

Status: In progress; selected split API/web portal URL slice implemented.

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

Carry-over from completed Phase 6 interactive demo hardening:

- Do not mix public demo viewer/editor follow-ups into this extension implementation.
- Extension-generated demo quality remains blocked until extension capture produces real events and assets again.
- Once extension capture is reliable, rerun guide/demo generation from extension events and record whether click metadata produces usable guide annotations or demo hotspots.

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
- improve one real observed extension failure mode
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

### Selected Slice: Split API/Web Portal URLs

Problem:

- the extension stores the API instance URL for authenticated API calls
- in split local/self-host deployments, browser-facing portal routes may live on a different origin
- dogfood showed `Open in portal` and `Finish capture` opened `http://localhost:4021/projects/...`, which is the API origin and returned `404`, while `http://localhost:3000/projects/...` worked

Required work:

- add a separate optional portal URL setting
- keep API requests on `instanceUrl`
- open active/finished capture portal routes on `portalUrl` when configured
- preserve safe relative redirect-path handling
- clear the portal URL when changing instance settings
- update tests and README for split API/web configuration

Out of this slice unless directly required:

- automatic click capture diagnostics
- manual screenshot upload diagnostics
- background-owned capture state
- extension-generated guide/demo verification

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

## Implementation Result: 2026-06-23

Completed slice:

- Added optional `portalUrl` extension setting for split API/web deployments.
- Kept API calls on `instanceUrl`.
- `Open in portal` and `Finish capture` now build portal links on `portalUrl` when configured.
- Safe relative redirect-path handling is preserved; unsafe absolute/protocol-relative redirects still fall back to a locally constructed capture-session path.
- Changing the instance clears the stored portal URL with the rest of auth/project/capture state.
- README now documents local split-origin setup.
- Plan `058` now reflects that automatic click capture MVP exists but needs reliability follow-up.

Verification run:

```bash
rtk pnpm --filter extension test -- src/lib/url.test.ts
rtk pnpm --filter extension test -- src/lib/settings.test.ts
rtk pnpm --filter extension test -- src/App.test.tsx
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension build
rtk pnpm --filter extension lint
rtk git diff --check
```

Results:

- URL helper suite passed with 5 tests.
- Settings suite passed with 10 tests.
- Popup App suite passed with 31 tests.
- Full extension suite passed with 75 tests.
- Extension typecheck passed.
- Extension build passed.
- Extension lint passed.
- Whitespace check passed.

Missed or deferred work to keep as follow-up candidates:

- Reproduce automatic click capture in a headed/manual browser and determine whether the zero-event dogfood result is automation-specific or product behavior.
- Add popup-visible diagnostics for automatic click capture failures.
- Make manual screenshot fallback either upload/record a capture event or surface a clear actionable failure.
- Add diagnostics around content script to background worker message delivery.
- Re-run guide/demo generation from extension events after capture produces events and assets.

### 1. Review Evidence

- [x] Read `docs/v1-dogfood-smoke-suite.md`.
- [x] Extract extension-specific failures and limitations.
- [x] Read `apps/extension/README.md`.
- [x] Read current plan `058`.
- [ ] Reproduce automatic capture and manual fallback in a headed/manual browser if possible.
- [x] Reproduce split API/web portal opening behavior from recorded dogfood evidence.
- [x] Pick one reliability slice: split API/web portal URLs.

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

Status: completed for this slice.

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

Selected design:

- `instanceUrl` remains the API base URL used for login and API requests.
- `portalUrl` is an optional browser-facing web origin used only for portal links.
- if `portalUrl` is unset, portal links keep using `instanceUrl` for same-origin/self-host deployments.
- safe relative redirect paths remain required; absolute or protocol-relative redirects fall back to a locally constructed capture-session path.
- saving/changing the instance clears `portalUrl` with the rest of auth/project/capture state.
- no raw input values, page HTML, or new page metadata are introduced by this slice.

### 4. Implement And Test

- [x] Add failing tests where practical.
- [x] Update extension URL/settings/popup code.
- [x] Preserve manual screenshot fallback.
- [x] Preserve input redaction.
- [x] Preserve event ordering guarantees.
- [x] Improve user-facing settings copy.
- [x] Update README if behavior changes.

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

- automatic click capture diagnostics for zero-event dogfood failure
- manual screenshot fallback diagnostics for silent no-op dogfood failure
- background-owned active capture state
- navigation event capture
- domain exclusion controls
- visible capture overlay
- full-page screenshot research
- Chrome Web Store packaging
