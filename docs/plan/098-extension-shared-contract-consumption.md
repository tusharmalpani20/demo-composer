# Extension Shared Contract Consumption Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `098` of the shared contracts and domainization track.

## Objective

Make `apps/extension` consume shared capture/API contracts and constants without changing extension UI behavior, capture semantics, privacy defaults, or instance-first login behavior.

## Dependencies

This plan should start after:

```text
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/plan/091-project-identity-setup-organization-contract-cleanup.md
docs/plan/092-capture-domain-extraction.md
```

It may also depend on web/server follow-up contracts if extension flows use them.

## Current Baseline

Relevant app:

```text
apps/extension
```

The extension currently depends on:

```text
@repo/ui
```

It does not currently depend on:

```text
@repo/types
@repo/constants
```

Important domain decisions:

- The extension connects to an Instance URL before login.
- Extension Session is scoped to one Demo Composer Instance.
- Capture should omit or redact sensitive input values by default.
- Screenshot capture is the MVP path.
- HTML replay remains deferred.

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/plan/092-capture-domain-extraction.md
```

## Scope

Included:

- add `@repo/types` and/or `@repo/constants` dependencies to `apps/extension` only when imports are introduced
- replace duplicated capture payload types with shared types where the reuse gate is met
- replace duplicated capture status/event/source/privacy constants with shared constants where the reuse gate is met
- replace duplicated instance/auth DTOs where safe and shared
- keep extension UI and popup behavior unchanged
- keep capture event semantics unchanged
- keep privacy defaults unchanged

Explicitly excluded:

- extension UI redesign
- changing popup copy, layout, or styling
- changing permissions
- changing instance-first login behavior
- adding HTML replay
- adding new automatic capture behavior
- changing which values are redacted or omitted
- changing backend route URLs
- changing capture lifecycle behavior

## Expected File Touches

Likely files:

```text
apps/extension/package.json
apps/extension/src/**/*
packages/types/src/capture.ts
packages/types/src/setup.ts
packages/types/src/auth.ts
packages/constants/src/capture.ts
packages/constants/src/setup.ts
```

Avoid touching extension CSS/markup unless required by TypeScript after import changes.

## Execution Guardrails

Existing behavior to preserve:

- Instance-first login;
- Extension Session behavior;
- project selection;
- capture start/finish behavior;
- automatic/manual capture event semantics;
- privacy/redaction defaults;
- popup UI markup, copy, layout, and styling.

Shared constants/types to add or reuse:

- consume capture, setup, instance, and auth contracts/constants only after they pass the reuse gate and are exported.

Domain logic to move or create:

- none. Extension remains a client of capture/auth contracts.

Server adapter changes:

- none expected unless a contract mismatch is discovered; any server fix must be tested with capture/auth route tests.

Web/extension consumer changes:

- extension imports shared constants/types;
- web is not touched by this plan.

Rollback or containment notes:

- if shared imports break capture reliability, revert extension imports first while keeping server/domain tests in place.
- keep behavior-changing extension reliability fixes in a separate plan.

## Discovery Checklist

- [ ] Inventory extension capture payload builders.
- [ ] Inventory extension API helper request/response types.
- [ ] Inventory duplicated event/status/source/privacy constants.
- [ ] Identify instance/auth contracts shared with server/web.
- [ ] Identify UI-only extension state that should remain local.
- [ ] Identify tests that prove capture semantics remain stable.

Useful search commands:

```text
rtk rg "capture|event_type|source_type|session|instance|login|project|redact|input_value|screenshot|payload" apps/extension/src
rtk rg "\"(navigation|click|input|capture|note|manual|extension|capturing|completed|canceled|first_run_setup|signup)\"" apps/extension/src
```

## Implementation Plan

1. Add dependencies only as needed.
   - Add `@repo/types` if shared types are imported.
   - Add `@repo/constants` if shared constants are imported.

2. Start with capture payload contracts.
   - Replace local event/session payload types with shared types.
   - Keep extension-specific local UI state local.

3. Apply privacy constants carefully.
   - Shared constants may name defaults.
   - Do not change runtime redaction behavior unless a failing test identifies a bug and the fix is documented.

4. Apply instance/auth contracts where safe.
   - Preserve Instance URL setup flow.
   - Preserve Extension Session behavior.

5. Keep changes mechanical.
   - No UI markup/styling changes unless required for compile.

## Testing Plan

Extension tests should prove:

- instance setup still stores and uses configured Instance URL;
- login/session calls still match current behavior;
- project selection still works if touched;
- capture start/finish payloads still match server contracts;
- automatic/manual capture event payloads still match server contracts;
- input value privacy behavior remains unchanged.

Server tests should remain green for extension-facing capture routes.

## Verification Commands

```text
rtk pnpm --filter extension check-types
rtk pnpm --filter extension test
rtk pnpm --filter server test -- public-instance authentication project capture-session capture-event capture-asset
rtk pnpm check-types
```

If shared packages are touched:

```text
rtk pnpm --filter @repo/types build
rtk pnpm --filter @repo/constants build
```

If DB-backed capture behavior is touched:

```text
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- Extension and server share capture payload contracts where appropriate.
- Extension and server share relevant capture/privacy constants where appropriate.
- Instance-first login behavior remains intact.
- Extension UI, copy, layout, and styling remain unchanged.
- Capture event semantics remain unchanged.
- Privacy defaults remain unchanged.
- Extension tests and typecheck pass.

## Final Output Required

When executing this plan, report:

- extension contracts migrated;
- local extension types intentionally kept;
- dependencies added;
- files changed;
- tests run and results;
- any deferred extension contract cleanup.
