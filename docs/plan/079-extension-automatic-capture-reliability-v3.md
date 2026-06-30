# Extension Automatic Capture Reliability V3 Plan

Date: 2026-06-23

Status: Completed with follow-up notes.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 2 of the alpha follow-through master plan.

## Dependencies

Recommended after:

```text
docs/plan/078-split-origin-url-hardening.md
```

Reason:

- split-origin portal-link issues should not obscure automatic capture diagnostics
- if plan `078` is not complete, explicitly record the API instance URL and portal URL used during extension verification

## Goal

Diagnose and improve automatic click capture in a headed/manual browser.

Target outcome:

```text
extension user starts automatic capture
  -> supported clicks are observed by content script
  -> background worker receives capture messages
  -> screenshots upload or fail visibly
  -> capture events are created in order
  -> unsupported pages fail clearly
```

## Current Baseline

Manual extension dogfood in plan `072` found:

- backend capture session was created
- automatic clicks created no events or files
- no useful popup diagnostic explained the failure
- guide/demo generation from extension events was blocked

Plan `076` fixed split API/web portal URL handling but did not resolve automatic capture.

## Scope

Included:

- reproduce automatic capture in a headed/manual browser
- trace content script activation
- trace content script to background worker message delivery
- trace screenshot capture and upload
- trace backend capture-event creation
- add popup-visible diagnostics for automatic capture failures
- preserve raw input redaction and no-HTML capture rules
- add focused tests for changed extension behavior

## Explicit Non-Goals

- manual screenshot fallback implementation
- extension visual evidence
- guide/demo generation from extension events
- broad extension redesign
- background-owned capture state unless the audit proves it is required for this slice

## Expected File Touches

Likely:

```text
apps/extension/src/
apps/extension/src/**/*.test.tsx
apps/extension/README.md
docs/v1-dogfood-smoke-suite.md
docs/plan/079-extension-automatic-capture-reliability-v3.md
docs/plan/master/002-alpha-follow-through-master-plan.md
```

Conditional:

```text
apps/server/src/modules/capture-event/
apps/server/src/modules/capture-asset/
docs/project-zoomout-status.md
```

## Implementation Plan

## Implementation Result: 2026-06-30

Completed slice:

- Added persisted automatic capture diagnostics to extension settings.
- Background automatic click capture now records the latest successful event index or failure message after screenshot, upload, or event-recording attempts.
- Content-script click message delivery failures now record a diagnostic when the background worker cannot receive the click message.
- The active-capture popup now shows the latest automatic capture failure and keeps the manual screenshot fallback available.
- The active-capture popup now shows the latest successful automatic capture step number when the background records one.
- Split API/web portal URL behavior from plan `076` remains unchanged.
- Raw input values, screenshot bytes, tokens, cookies, and page HTML are not stored in diagnostics.

Selected reliability slice:

- The previous zero-event dogfood failure was most harmful because automatic capture could fail with no popup-visible reason.
- This implementation does not claim that headed automatic capture now fully succeeds in every browser scenario.
- It makes the click pipeline observable at the content-script message-delivery, screenshot, upload, and event-recording failure points so the next headed run can identify the exact remaining blocker.

Verification run:

```bash
rtk pnpm --filter extension test -- src/lib/settings.test.ts src/lib/automatic-capture.test.ts src/lib/content-click-capture.test.ts src/App.test.tsx
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
rtk git diff --check
```

Results:

- Focused extension suites passed with 4 files and 53 tests.
- Full extension test suite passed with 9 files and 79 tests.
- Extension typecheck passed.
- Extension lint passed.
- Extension build passed.
- Whitespace check passed.

Missed or deferred work to keep as follow-up candidates:

- Manual headed browser verification of a safe automatic click capture scenario.
- Service-worker and content-script log capture from a real browser run.
- Unsupported/restricted page browser evidence.
- Manual screenshot fallback reliability remains part of plan `080`.
- Extension visual evidence and artifact re-dogfood remain part of plan `081`.
- Previous plan `078` manual split-origin invite dogfood is unrelated to this extension implementation and should stay with broader browser dogfood follow-up work.

### 1. Reproduce And Trace

- [x] Build the extension.
- [ ] Load `apps/extension/dist` unpacked in Chrome or Chromium.
- [ ] Configure API instance URL and portal URL.
- [ ] Start a safe capture session.
- [ ] Click supported targets on a safe `http` or `https` test page.
- [ ] Inspect popup state.
- [ ] Inspect service-worker logs.
- [ ] Inspect content-script logs or add temporary diagnostics if needed.
- [ ] Inspect backend requests for asset upload and event creation.
- [ ] Record where the click pipeline stops.

### 2. Design The Smallest Reliability Slice

Choose one focused fix if the failure is located:

- content script is not injected
- content script storage lookup fails
- [x] message delivery to background fails
- visible-tab screenshot capture fails
- [x] upload fails silently
- [x] event creation fails silently
- [x] popup state hides active failure

Manual browser evidence, content-script injection evidence, and unsupported-page behavior remain follow-up work.

### 3. Implement Diagnostics First

- [x] Add failing tests for the selected failure path.
- [x] Add user-visible popup state for actionable failures.
- [x] Avoid exposing raw URLs beyond what is already visible to the user.
- [x] Avoid logging tokens, cookies, screenshot data, input values, or HTML.
- [x] Preserve existing active-capture recovery behavior.

### 4. Implement Reliability Fix

- [x] Apply the smallest production change needed.
- [x] Preserve event ordering.
- [x] Preserve pause/resume behavior.
- [x] Preserve manual fallback availability.
- [x] Preserve split API/web portal URL behavior from plan `076`.

### 5. Manual Verification

- [x] Rebuild extension.
- [ ] Reload unpacked extension.
- [ ] Run the safe click capture scenario.
- [ ] Confirm ordered screenshot-backed click events arrive, or record the exact remaining blocker.
- [ ] Confirm unsupported pages fail clearly.
- [ ] Confirm no raw input values or HTML are captured.

### 6. Update Docs And Tracking

- [x] Update extension README if workflow or diagnostics changed.
- [x] Update dogfood smoke log with fresh evidence.
- [x] Add implementation notes to this plan.
- [x] Update master plan phase tracking after implementation.

## Testing Plan

Expected commands:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
rtk git diff --check
```

Run server tests only if backend behavior changes:

```bash
rtk pnpm --filter server test
```

## Acceptance Criteria

- The plan identifies where the previous zero-event capture failed.
- Supported clicks either create ordered screenshot-backed events or produce actionable user-visible diagnostics.
- Unsupported/restricted pages fail clearly.
- Raw input values and page HTML remain uncaptured.
- New or changed behavior is covered by focused tests.
- Manual browser evidence is recorded.

## Follow-Up Notes

Carry these notes into the next relevant plan:

- Plan `080` should keep manual screenshot fallback upload/event diagnostics separate from automatic capture.
- Plan `081` should run the headed extension evidence pass and capture whether automatic clicks now create screenshot-backed events or surface one of the new diagnostics.
- If the headed run still produces no diagnostic, the next reliability slice should focus on content-script injection/permissions and service-worker lifecycle evidence.
