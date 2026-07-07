# Extension Capture Upload And Event Fix Plan

Date: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `101` of the alpha hardening and extension reliability track.

## Objective

Fix the extension capture path so automatic click capture and manual screenshot fallback reliably create screenshot assets and ordered capture events.

This plan must be implemented only after `docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md` has classified the current failure modes.

## Inputs From Previous Phase

Required before implementation:

- completed child plan `100`;
- exact finding for automatic click capture;
- exact finding for manual screenshot fallback;
- evidence showing whether failures are in extension code, API contracts, auth/session handling, server validation, or browser permissions.

Do not guess the root cause if `100` has not been completed.

## Exact Files To Read Before Work

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md
apps/extension/README.md
apps/extension/public/manifest.json
apps/extension/src/App.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/api.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/navigation.ts
```

Server files to read only if `100` proves the failure crosses the API boundary:

```text
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/authentication/request-session-token.ts
apps/server/src/modules/authentication/session.routes.ts
```

Shared package files to read only if contract drift is proven:

```text
packages/types/src/capture.ts
packages/types/src/auth.ts
packages/constants/src/capture.ts
packages/capture-domain/src/index.ts
```

## Expected Affected Files

Likely extension files:

```text
apps/extension/src/App.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/api.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/settings.ts
apps/extension/src/**/*.test.ts
apps/extension/src/**/*.test.tsx
apps/extension/README.md
```

Conditional server files, only if the baseline proves the server rejects a valid extension request or mishandles extension auth:

```text
apps/server/src/modules/capture-asset/
apps/server/src/modules/capture-event/
apps/server/src/modules/capture-session/
apps/server/src/modules/authentication/
```

Conditional shared package files, only if a missing shared contract caused drift:

```text
packages/types/src/
packages/constants/src/
packages/capture-domain/src/
```

Do not touch web editor/viewer code in this phase.

## Routes And API Contracts

Protect these existing route shapes:

```text
POST /api/v1/projects/:project_id/capture-sessions
POST /api/v1/projects/:project_id/capture-sessions/:id/complete
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
```

Request/response shapes should remain backward-compatible.

Expected extension order:

```text
capture visible tab screenshot
  -> upload screenshot asset
  -> create capture event referencing uploaded asset
  -> update local active capture status/index
```

## Schemas And Types

Use existing shared contracts where already available:

- `@repo/types/capture`;
- `@repo/types/project`;
- `@repo/types/auth`;
- `@repo/constants/capture`.

Keep extension-only narrowed input types local when they represent browser adapter input rather than public API contracts.

Do not move browser-only types into `@repo/types`.

## Behavior Rules

- Automatic click capture must create at most one ordered event per supported click.
- The in-flight guard must prevent duplicate event creation while a previous click is uploading.
- Manual screenshot fallback must remain available when automatic capture is active, paused, or recovering from an error.
- If upload succeeds but event creation fails, the extension must surface an actionable error and preserve active capture state.
- If screenshot capture fails, the extension must not create an event without an asset unless the existing product behavior explicitly permits that.
- Event ordering must remain deterministic and must not overwrite existing session events.
- Popup reloads must restore active capture state.
- Finish/open portal behavior is not the primary scope unless capture success reveals a coupled bug.

## Security And Permission Rules

- Do not capture raw input values.
- Do not capture page HTML.
- Preserve `input_value_redacted` behavior for automatic click events.
- Do not persist screenshots outside the existing asset upload path.
- Do not log auth tokens, cookies, passwords, or screenshot binary data.
- Do not broaden host permissions unless the completed `100` baseline proves a permission issue and the change is reviewed in this plan.
- Authenticated API calls must continue to use the configured instance API origin and extension session token.

## Migration And Backwards Compatibility

- No database migration is expected.
- Existing capture sessions/assets/events must remain readable.
- Existing extension storage keys must remain compatible.
- Existing API route URLs should not change.
- If local storage shape changes are unavoidable, add a compatibility read path and tests for older stored values.

## Implementation Steps

1. Reread this plan, the parent master plan, and completed plan `100`.
2. Confirm worktree state and protect unrelated changes.
3. Write or update failing focused tests for the exact failure from `100`.
4. Fix the smallest extension boundary that explains the failure.
5. Add server/shared changes only if the failing test proves the bug is outside extension code.
6. Verify automatic click capture and manual screenshot fallback separately.
7. Verify failures surface actionable popup/background state without clearing active capture.
8. Update `apps/extension/README.md` only if behavior, limitations, or validation status changed.
9. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
10. Update the master plan only for completed phase status.

## Test And Verification Plan

Required:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
```

Required if extension build/runtime code changes:

```bash
rtk pnpm --filter extension build
```

Required if server code changes:

```bash
rtk pnpm --filter server test -- capture-session capture-asset capture-event authentication
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
```

Required if shared packages change:

```bash
rtk pnpm --filter @repo/types test
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/constants build
rtk pnpm check-types
```

Always run:

```bash
rtk git diff --check
```

## Browser Validation Requirements

Browser validation is required.

Validate in a real extension run:

- start an extension capture session;
- trigger one supported automatic click;
- confirm one screenshot asset exists for that click;
- confirm one ordered capture event exists for that click;
- trigger one manual screenshot fallback;
- confirm one screenshot asset exists for the manual capture;
- confirm one ordered capture event exists for the manual capture;
- reload the popup during active capture and confirm state is preserved;
- pause/resume automatic capture and confirm behavior remains stable.

If agent-browser cannot load the unpacked extension in the local environment, record exact manual Chrome steps and evidence.

## Explicit Non-Scope

- Portal URL origin fix unless coupled to capture completion.
- Guide/demo generation quality.
- Public viewer changes.
- UI redesign.
- New capture modes.
- HTML replay.
- Full-page screenshots.
- Raw DOM capture.
- Raw input capture.
- Chrome Web Store packaging.

## Completion Checklist

- [ ] Completed plan `100` was used as the source of truth.
- [ ] Automatic click capture failure fixed or explicitly bounded.
- [ ] Manual screenshot fallback failure fixed or explicitly bounded.
- [ ] Tests cover the fixed failure path.
- [ ] Browser validation proves at least one automatic click event and one manual screenshot event.
- [ ] Privacy defaults preserved.
- [ ] Docs updated only where behavior/status changed.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

Child plan `102` owns split-origin finish/open portal verification and fix.

Child plan `103` owns final browser evidence and screenshots after capture and portal behavior are stable.
