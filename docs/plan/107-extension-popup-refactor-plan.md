# Extension Popup Refactor Plan

Date: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `107` of the alpha hardening and extension reliability track.

## Objective

Reduce `apps/extension/src/App.tsx` complexity after extension reliability has been proven or bounded.

The refactor must preserve extension behavior, popup appearance, extension permissions, and all fixes from child plans `100` through `103`.

## Required Inputs

Before implementation, read completed plans:

```text
docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md
docs/plan/101-extension-capture-upload-and-event-fix.md
docs/plan/102-extension-finish-portal-origin-fix.md
docs/plan/103-extension-browser-validation-and-screenshots.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Do not start this refactor while capture behavior is still actively changing unless the user explicitly chooses to reorder the work.

## Exact Files To Read Before Work

```text
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/api.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/navigation.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/current-tab.ts
apps/extension/src/lib/*.test.ts
apps/extension/public/manifest.json
apps/extension/README.md
```

## Expected Affected Files

Likely:

```text
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/src/lib/
apps/extension/src/**/*.test.ts
apps/extension/src/**/*.test.tsx
docs/plan/107-extension-popup-refactor-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Possible new local modules:

```text
apps/extension/src/popup/
apps/extension/src/lib/
```

Conditional:

```text
apps/extension/README.md
```

Only update README if internal module names or validation instructions change. Do not use docs to hide behavior changes.

## Routes And API Contracts

No route/API contract changes are in scope.

Extension API calls must remain compatible with:

```text
GET  /api/v1/public/instance
GET  /api/v1/authentication/me
POST /api/v1/authentication/login
POST /api/v1/authentication/logout
GET  /api/v1/projects/
POST /api/v1/projects/:project_id/capture-sessions
POST /api/v1/projects/:project_id/capture-sessions/:id/complete
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
```

## Schemas And Types

- Preserve shared DTO usage from `@repo/types`.
- Keep extension-specific browser adapter types local.
- Do not move popup React props into `@repo/types`.
- Do not create broad abstractions unless they reduce real complexity or match an existing local pattern.

## Behavior Rules

- No popup UI redesign.
- Preserve visible text, button order, disabled states, and error messages unless a completed reliability plan explicitly changed them.
- Preserve instance URL and portal URL setup.
- Preserve login/logout behavior.
- Preserve project selection.
- Preserve active capture state restoration.
- Preserve automatic capture, manual screenshot fallback, pause/resume, finish, and open portal behavior.
- Preserve in-flight guards and failure recovery.

## Security And Permission Rules

- Do not add extension permissions.
- Do not capture raw input values.
- Do not capture page HTML.
- Do not log session tokens or screenshot binary data.
- Preserve instance-first login and extension session token handling.
- Preserve portal URL validation rules.

## Migration And Backwards Compatibility

- Existing extension storage must remain readable.
- Existing active capture state must remain compatible.
- Existing tests should keep passing with the same user-facing expectations.
- No database migration is expected.
- No manifest permission migration is expected.

## Implementation Strategy

Recommended extraction order:

1. Extract pure state transition helpers from `App.tsx`.
2. Extract API orchestration helpers only if they are not browser-global dependent.
3. Extract popup sections into local components while preserving markup and copy.
4. Keep browser adapters in `lib/` and popup UI in a local popup folder if introduced.
5. Keep `App.tsx` as the composition root.

Avoid mixing refactor with new reliability fixes. If a new bug is discovered, pause and create or update a reliability plan.

## Test And Verification Plan

Required:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk git diff --check
```

Required if build/runtime imports change:

```bash
rtk pnpm --filter extension build
```

Recommended repo sanity:

```bash
rtk pnpm check-types
```

## Browser Validation Requirements

Browser validation is required if popup behavior boundaries move.

Validate:

- setup screen;
- login;
- project selection;
- start capture;
- automatic capture state;
- manual screenshot capture;
- pause/resume;
- open portal;
- finish capture;
- popup reload during active capture.

If only pure helper extraction happens and tests fully cover the behavior, document why browser validation was not required.

## Explicit Non-Scope

- Extension reliability fixes not already completed.
- UI redesign.
- New capture features.
- New extension permissions.
- Server API changes.
- Shared contract changes.
- Chrome Web Store packaging.

## Completion Checklist

- [ ] Completed reliability plans reviewed.
- [ ] Refactor slices selected and documented.
- [ ] `App.tsx` responsibilities reduced.
- [ ] Existing popup behavior preserved.
- [ ] Existing extension storage compatibility preserved.
- [ ] Browser validation completed or explicitly not required with reason.
- [ ] Verification commands run and recorded.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

This refactor should be postponed if child plans `101` or `102` leave unresolved behavior that still needs code changes in `App.tsx`.
