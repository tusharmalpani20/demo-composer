# Web Shared Contract Consumption Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `097` of the shared contracts and domainization track.

## Objective

Make `apps/web` consume shared constants and shared API contracts where appropriate without changing UI appearance or user-visible behavior.

This is a frontend integration cleanup plan, not a UI plan.

## Dependencies

This plan should start after the relevant shared contracts exist:

```text
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/plan/091-project-identity-setup-organization-contract-cleanup.md
docs/plan/093-guide-domain-extraction.md
docs/plan/094-demo-domain-extraction.md
docs/plan/095-publish-domain-extraction.md
```

Parts that involve capture pages may also depend on:

```text
docs/plan/092-capture-domain-extraction.md
```

## Current Baseline

Relevant app:

```text
apps/web
```

The web app currently depends on:

```text
@repo/ui
```

It does not currently depend on:

```text
@repo/types
@repo/constants
```

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0019-separate-web-and-server-apps.md
docs/plan/086-modern-ui-migration.md
```

## Scope

Included:

- add `@repo/types` and/or `@repo/constants` dependencies to `apps/web` only when imports are introduced
- replace duplicated API request/response types with shared types where they pass the reuse gate
- replace duplicated stable product constants with shared constants where they pass the reuse gate
- keep UI-only component props local
- keep feature-specific view models local when they are not API contracts
- keep rendered markup, copy, styling, and flows unchanged

Explicitly excluded:

- UI redesign
- CSS or Tailwind changes for visual reasons
- component layout changes
- route/navigation behavior changes
- broad API client rewrite
- changing backend contracts
- adding new product features
- replacing every local type mechanically

## Expected File Touches

Likely files:

```text
apps/web/package.json
apps/web/src/lib/api.ts
apps/web/src/lib/**/*.ts
apps/web/src/features/setup/**/*
apps/web/src/features/auth/**/*
apps/web/src/features/project/**/*
apps/web/src/features/organization/**/*
apps/web/src/features/capture-session/**/*
apps/web/src/features/guide/**/*
apps/web/src/features/interactive-demo/**/*
```

Avoid touching CSS or component markup unless required by TypeScript after import changes.

## Execution Guardrails

Existing behavior to preserve:

- rendered markup, copy, styling, navigation, setup/auth/project/capture-session/guide/demo/public viewer behavior.

Shared constants/types to add or reuse:

- only consume contracts/constants that already pass the reuse gate and are exported by shared packages.

Domain logic to move or create:

- none. Web remains a consumer of contracts and UI state.

Server adapter changes:

- none expected unless a schema export reveals a server contract mismatch that must be fixed and tested separately.

Web/extension consumer changes:

- web imports shared constants/types;
- extension is not touched by this plan.

Rollback or containment notes:

- if shared imports make feature code less clear or expose an unstable contract, revert that feature to local types and document the deferred contract.
- avoid JSX/CSS changes so rollback remains mostly import/type-level.

## Discovery Checklist

- [ ] Inventory duplicated API request/response types in web.
- [ ] Inventory local string unions that duplicate shared constants.
- [ ] Identify UI-only types that should remain local.
- [ ] Identify feature view models that intentionally differ from API DTOs.
- [ ] Identify tests that should prove behavior remains stable.
- [ ] Decide the smallest safe migration slices.

Useful search commands:

```text
rtk rg "type .*Response|type .*Request|interface .*Response|interface .*Request|status:|role:|block_type|event_type|artifact_type|onboarding_mode|deployment_mode" apps/web/src
rtk rg "\"(owner|member|draft|completed|archived|first_run_setup|signup|guide|interactive_demo)\"" apps/web/src
```

## Implementation Plan

1. Add dependencies only as needed.
   - Add `@repo/types` if shared types are imported.
   - Add `@repo/constants` if shared constants are imported.

2. Start with low-risk API helpers.
   - Public instance/setup/auth contracts.
   - Organization role/invite contracts.
   - Guide/demo/publish DTOs after domain contracts exist.

3. Preserve UI types.
   - Do not move component props into `@repo/types`.
   - Keep presentation-specific state local.

4. Migrate feature by feature.
   - Avoid one large app-wide rewrite.
   - Keep tests green after each slice.

5. Check for visual accidental changes.
   - Review diffs for JSX/CSS changes.
   - If JSX changes are required, keep them mechanical and behavior-preserving.

## Testing Plan

Web tests should prove:

- API helpers still call the same paths;
- pages still render expected states;
- form submissions still send compatible payloads;
- public readers/viewers still parse expected responses;
- setup/auth/project/organization/capture/guide/demo flows remain stable where touched.

Typecheck is required because this plan primarily changes compile-time contracts.

## Verification Commands

```text
rtk pnpm --filter web check-types
rtk pnpm --filter web test
rtk pnpm check-types
```

If shared packages are touched:

```text
rtk pnpm --filter @repo/types build
rtk pnpm --filter @repo/constants build
```

If server contracts are touched to support web imports:

```text
rtk pnpm --filter server test -- public-instance setup authentication project organization capture-session guide interactive-demo publish
```

## Acceptance Criteria

- `apps/web` imports shared contracts/constants only where useful.
- UI-only props and view models remain local.
- Rendered UI, copy, styling, and navigation behavior remain unchanged.
- API helper behavior remains stable.
- Web tests and typecheck pass.
- No backend behavior changes are introduced by this plan unless explicitly documented and tested.

## Final Output Required

When executing this plan, report:

- web areas migrated;
- local types intentionally kept;
- dependencies added;
- files changed;
- tests run and results;
- any deferred web contract cleanup.
