# Extension Manual Fallback And Diagnostics Plan

Date: 2026-06-23

Status: Completed with follow-up notes.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 3 of the alpha follow-through master plan.

## Dependencies

Recommended after or alongside:

```text
docs/plan/079-extension-automatic-capture-reliability-v3.md
```

Reason:

- manual fallback diagnostics may share popup, background-worker, auth, upload, and active-capture state with automatic capture
- if this plan starts before plan `079` is complete, keep the slice strictly manual-fallback focused and do not mix in automatic click fixes

## Goal

Make manual screenshot fallback reliable and observable.

Target outcome:

```text
automatic capture is unavailable or unreliable
  -> user clicks manual screenshot fallback
  -> screenshot upload and capture event creation succeed
  -> or popup shows a clear actionable failure
```

## Current Baseline

Manual extension dogfood in plan `072` found:

- manual screenshot fallback was available in the popup
- no fallback upload/event request was observed
- no popup error explained the failure
- no extension-created file was stored

## Scope

Included:

- verify current manual fallback behavior in a headed/manual browser
- make fallback upload and event creation visibly succeed or fail
- add diagnostics for screenshot capture, upload, auth, project, session, and file-storage failures
- preserve active capture state recovery
- preserve split API/web portal URL behavior
- add focused extension tests

## Explicit Non-Goals

- automatic click capture reliability
- extension visual evidence
- guide/demo generation from extension events
- backend storage provider redesign

## Expected File Touches

Likely:

```text
apps/extension/src/
apps/extension/src/**/*.test.tsx
apps/extension/README.md
docs/v1-dogfood-smoke-suite.md
docs/plan/080-extension-manual-fallback-diagnostics.md
docs/plan/master/002-alpha-follow-through-master-plan.md
```

Conditional:

```text
apps/server/src/modules/capture-asset/
apps/server/src/modules/capture-event/
```

## Implementation Plan

## Implementation Result: 2026-06-30

Completed slice:

- Added persisted manual screenshot diagnostics to extension settings, separate from automatic capture diagnostics.
- Manual screenshot success now records the captured event index and timestamp.
- Manual screenshot capture, upload, and event-recording failures now record a retryable failure diagnostic while preserving active capture state.
- Manual diagnostic persistence is best-effort, so storage failures do not hide the original screenshot/upload/event error.
- The active-capture popup now shows the latest manual screenshot failure after reopening.
- Manual diagnostics stay minimized to status, optional message, optional event index, and timestamp.
- Split API/web portal URL behavior remains unchanged.
- Raw input values, page URLs, screenshot bytes, tokens, cookies, and page HTML are not stored in diagnostics.

Selected fallback slice:

- The existing code path already captured a screenshot, uploaded the asset, and created a linked `capture` event in tests.
- The gap was observability across popup reloads and clear separation from automatic capture diagnostics.
- This implementation does not claim a headed browser manual fallback run has passed yet.

Verification run:

```bash
rtk pnpm --filter extension test -- src/lib/settings.test.ts src/App.test.tsx src/lib/screenshot.test.ts src/lib/api.test.ts
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
rtk git diff --check
```

Results:

- Focused extension suites passed with 4 files and 61 tests.
- Full extension test suite passed with 9 files and 82 tests.
- Extension typecheck passed.
- Extension lint passed.
- Extension build passed.
- Whitespace check passed.

Post-implementation recheck:

- Re-ran the full extension verification suite after implementation; no additional code changes were needed.
- Confirmed the remaining gaps are headed-browser evidence gaps, not known unit-tested request-path gaps.

Missed or deferred work to keep as follow-up candidates:

- Manual headed browser verification of a manual screenshot happy path.
- Manual headed browser verification of at least one practical failure path.
- Service-worker and browser permission evidence from a real extension run.
- Extension visual evidence and artifact re-dogfood remain part of plan `081`.
- If manual fallback still produces no diagnostic in a headed run, the next slice should focus on popup lifecycle, extension permission, and browser API behavior.
- Plan `081` should record the exact API origin, portal origin, extension version/build, browser, and active capture session used for the manual fallback run.

### 1. Reproduce Current Fallback Behavior

- [x] Build extension.
- [ ] Load unpacked extension.
- [ ] Configure instance and portal URL.
- [ ] Start capture session.
- [ ] Trigger manual screenshot fallback.
- [ ] Inspect popup state.
- [ ] Inspect service-worker logs.
- [ ] Inspect backend requests.
- [ ] Confirm whether screenshot capture, upload, or event creation is missing.

### 2. Define Fallback Contract

- [x] Define happy-path popup state.
- [x] Define upload failure message.
- [x] Define auth/session failure message.
- [x] Define project/session missing message.
- [x] Define restricted-tab screenshot failure message.
- [x] Define retry behavior if any.

### 3. Add Tests First

- [x] Add failing tests for successful manual fallback event creation if code path exists.
- [x] Add failing tests for visible failure messages.
- [x] Add tests that local active capture state is not lost after recoverable failures.
- [x] Add tests that no raw input values or HTML are collected.

### 4. Implement Fallback Reliability

- [x] Wire missing request path if fallback does not currently upload. Existing request path was kept and diagnostics were added.
- [x] Create or reuse screenshot-backed capture event after upload.
- [x] Surface backend errors in the popup.
- [x] Avoid duplicate events on retry.
- [x] Preserve event ordering.

### 5. Manual Verification

- [ ] Rebuild and reload extension. Rebuild is covered by automated build; reload remains headed-browser follow-up.
- [ ] Run fallback happy path.
- [ ] Confirm portal capture detail shows screenshot-backed fallback event.
- [ ] Run one safe failure path if practical.
- [ ] Confirm actionable popup error.

### 6. Update Docs And Tracking

- [x] Update extension README.
- [x] Update dogfood smoke log.
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

Run server tests if backend behavior changes:

```bash
rtk pnpm --filter server test
```

## Acceptance Criteria

- Manual fallback creates a screenshot-backed capture event in the happy path, or a clear limitation is recorded.
- Failure cases show actionable popup messages.
- Event ordering remains stable.
- Active capture state remains recoverable.
- Tests cover the new fallback behavior.

## Follow-Up Notes

Carry these notes into the next relevant plan:

- Plan `081` should run the headed extension evidence pass and verify both automatic click capture diagnostics and manual screenshot fallback diagnostics.
- Keep manual diagnostics minimized; do not add page URLs unless the product explicitly accepts that privacy tradeoff.
- If the headed run still shows no manual diagnostic, investigate popup lifecycle, browser screenshot permissions, and whether `chrome.tabs.captureVisibleTab` is available from the popup context.
- Keep the manual fallback happy path tied to portal artifact evidence: after a screenshot-backed event is created, verify the capture detail can feed guide/demo artifact work.
