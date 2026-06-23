# Extension Automatic Capture Reliability V3 Plan

Date: 2026-06-23

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 2 of the alpha follow-through master plan.

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

### 1. Reproduce And Trace

- [ ] Build the extension.
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
- message delivery to background fails
- visible-tab screenshot capture fails
- upload fails silently
- event creation fails silently
- popup state hides active failure

If more than one unrelated failure exists, split into follow-up plans.

### 3. Implement Diagnostics First

- [ ] Add failing tests for the selected failure path.
- [ ] Add user-visible popup state for actionable failures.
- [ ] Avoid exposing raw URLs beyond what is already visible to the user.
- [ ] Avoid logging tokens, cookies, screenshot data, input values, or HTML.
- [ ] Preserve existing active-capture recovery behavior.

### 4. Implement Reliability Fix

- [ ] Apply the smallest production change needed.
- [ ] Preserve event ordering.
- [ ] Preserve pause/resume behavior.
- [ ] Preserve manual fallback availability.
- [ ] Preserve split API/web portal URL behavior from plan `076`.

### 5. Manual Verification

- [ ] Rebuild extension.
- [ ] Reload unpacked extension.
- [ ] Run the safe click capture scenario.
- [ ] Confirm ordered screenshot-backed click events arrive, or record the exact remaining blocker.
- [ ] Confirm unsupported pages fail clearly.
- [ ] Confirm no raw input values or HTML are captured.

### 6. Update Docs And Tracking

- [ ] Update extension README if workflow or diagnostics changed.
- [ ] Update dogfood smoke log with fresh evidence.
- [ ] Add implementation notes to this plan.
- [ ] Update master plan phase tracking after implementation.

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

If automatic capture still cannot be made reliable in one slice, close this plan with a precise failure location and create the next extension reliability child plan.
