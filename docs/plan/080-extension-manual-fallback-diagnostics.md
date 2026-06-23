# Extension Manual Fallback And Diagnostics Plan

Date: 2026-06-23

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 3 of the alpha follow-through master plan.

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

### 1. Reproduce Current Fallback Behavior

- [ ] Build extension.
- [ ] Load unpacked extension.
- [ ] Configure instance and portal URL.
- [ ] Start capture session.
- [ ] Trigger manual screenshot fallback.
- [ ] Inspect popup state.
- [ ] Inspect service-worker logs.
- [ ] Inspect backend requests.
- [ ] Confirm whether screenshot capture, upload, or event creation is missing.

### 2. Define Fallback Contract

- [ ] Define happy-path popup state.
- [ ] Define upload failure message.
- [ ] Define auth/session failure message.
- [ ] Define project/session missing message.
- [ ] Define restricted-tab screenshot failure message.
- [ ] Define retry behavior if any.

### 3. Add Tests First

- [ ] Add failing tests for successful manual fallback event creation if code path exists.
- [ ] Add failing tests for visible failure messages.
- [ ] Add tests that local active capture state is not lost after recoverable failures.
- [ ] Add tests that no raw input values or HTML are collected.

### 4. Implement Fallback Reliability

- [ ] Wire missing request path if fallback does not currently upload.
- [ ] Create or reuse screenshot-backed capture event after upload.
- [ ] Surface backend errors in the popup.
- [ ] Avoid duplicate events on retry.
- [ ] Preserve event ordering.

### 5. Manual Verification

- [ ] Rebuild and reload extension.
- [ ] Run fallback happy path.
- [ ] Confirm portal capture detail shows screenshot-backed fallback event.
- [ ] Run one safe failure path if practical.
- [ ] Confirm actionable popup error.

### 6. Update Docs And Tracking

- [ ] Update extension README.
- [ ] Update dogfood smoke log.
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

If manual fallback depends on automatic-capture state fixes from plan `079`, record that dependency explicitly rather than hiding the blocker.
