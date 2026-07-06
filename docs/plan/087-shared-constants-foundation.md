# Shared Constants Foundation Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `087` of the shared contracts and domainization track.

## Objective

Make `@repo/constants` the canonical home for stable Demo Composer product constants that pass the reuse gate.

This plan should not move every constant into the shared package. It should identify constants that are genuinely shared, public API vocabulary, or likely to drift across active packages, then centralize only those values.

## Reuse Gate

A value can move into `@repo/constants` only when at least one condition is true:

- it is consumed by two or more active apps/packages;
- it defines public API vocabulary;
- it is an enum/status/type value persisted in API or database records and repeated in more than one place;
- this child plan documents a concrete drift risk.

Values that do not pass this gate stay local to their owning module.

## Current Baseline

Current package state:

```text
packages/constants/src/index.ts
```

The package currently exports an empty module and has a placeholder `test` script that exits with failure.

Known duplicated or high-risk constant families to inventory:

- capture session status and source type
- capture event type
- capture asset type and storage provider
- guide status, block type, annotation type
- interactive demo status, scene/hotspot/transition values
- publish artifact type, link visibility/access/password values
- organization role, invite status, org user status
- setup/onboarding mode and deployment mode
- common validation limits, upload limits, pagination defaults
- privacy and redaction defaults used by capture and extension code

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0015-user-organization-org-user-identity-model.md
docs/adr/0017-deployment-aware-onboarding-mode.md
```

## Scope

Included:

- inventory duplicated constants across `apps/server`, `apps/web`, `apps/extension`, `packages`, and tests
- document which values pass or fail the reuse gate
- replace the placeholder failing `@repo/constants` test script with a real script or remove the false test expectation
- add focused constant exports grouped by domain
- add `@repo/constants` dependencies only to packages/apps that import from it
- replace low-risk backend/shared duplicates with shared constants
- keep exported names stable and domain-specific

Explicitly excluded:

- UI redesign
- visual copy changes
- route URL changes
- database schema changes
- moving backend-only database table names or schema names into `@repo/constants` by default
- replacing every local constant mechanically
- adding domain behavior functions to `@repo/constants`

## Expected File Touches

Likely files:

```text
packages/constants/package.json
packages/constants/src/index.ts
packages/constants/src/<domain>.ts
packages/constants/src/**/*.test.ts
apps/server/package.json
apps/web/package.json
apps/extension/package.json
apps/server/src/modules/**/*
apps/extension/src/**/*
apps/web/src/**/*
```

Only add app/package dependencies when imports are actually introduced.

## Execution Guardrails

Existing behavior to preserve:

- current literal API and persisted values;
- route behavior for any backend code that switches imports;
- web and extension behavior when imports change.

Shared constants/types to add or reuse:

- add only constants that pass the reuse gate;
- do not add shared types in this plan unless needed for compile compatibility with constants exports.

Domain logic to move or create:

- none. This plan is constants-only.

Server adapter changes:

- limited to replacing duplicated literals with shared constants.

Web/extension consumer changes:

- limited to replacing duplicated literals with shared constants where the dependency is declared.

Rollback or containment notes:

- if a shared constant introduces churn or breaks imports, revert that constant's consumer replacements and keep the value local until its owning domain plan.
- keep each constant family in separate commits or clearly separable hunks during implementation.

## Discovery Checklist

- [ ] Run `rg` for repeated `z.enum([...])` values in server route schemas.
- [ ] Run `rg` for repeated string union types in web and extension code.
- [ ] Run `rg` for persisted status/type strings in repository/service tests.
- [ ] Identify constants that are currently server-only and keep them local unless they pass the reuse gate.
- [ ] Identify constants that are public API values and should be shared.
- [ ] Identify database identifiers and keep them out unless a concrete cross-package need is documented.
- [ ] Record the final extraction list in this plan before implementation.

Useful search commands:

```text
rtk rg "z\\.enum|status:|source_type|event_type|asset_type|block_type|artifact_type|visibility|onboarding_mode|deployment_mode|role" apps packages
rtk rg "\"(draft|capturing|completed|canceled|archived|owner|member|self_hosted|hosted|first_run_setup|signup)\"" apps packages
```

## Implementation Plan

1. Fix package script baseline.
   - Replace the placeholder failing `test` script with a meaningful command if tests are added.
   - If no runtime tests are needed in this slice, remove or replace the placeholder so the package does not advertise a failing test.
   - Add `check-types` if it is useful and consistent with other packages.

2. Add domain-grouped exports.
   - Add exports only for selected values that pass the reuse gate.
   - Prefer small files such as `capture.ts`, `guide.ts`, `demo.ts`, `publish.ts`, `organization.ts`, `setup.ts`, `file.ts`, and `pagination.ts`.
   - Re-export through `packages/constants/src/index.ts`.
   - Use readonly arrays and readonly objects that work well with Zod enums.

3. Replace low-risk duplicates.
   - Start with constants already duplicated between server tests/routes and extension/web code.
   - Keep the first implementation slice small enough to review.
   - Avoid behavior changes.

4. Document what was intentionally not moved.
   - Add a short note to this plan or a follow-up section listing server-local constants that failed the reuse gate.

## Testing Plan

Add tests only where they prove something useful:

- constants export expected literal values;
- enum arrays contain only supported values;
- importers compile against the shared constants;
- server routes still accept the same payload values after switching imports.

Do not add tests that merely duplicate every exported literal without a reason.

## Verification Commands

Run after implementation:

```text
rtk pnpm --filter @repo/constants lint
rtk pnpm --filter @repo/constants build
rtk pnpm check-types
```

If tests are added to `@repo/constants`:

```text
rtk pnpm --filter @repo/constants test
```

If server route constants are replaced:

```text
rtk pnpm --filter server test -- capture-session capture-event capture-asset guide interactive-demo publish organization setup
```

If web imports are introduced:

```text
rtk pnpm --filter web check-types
rtk pnpm --filter web test
```

If extension imports are introduced:

```text
rtk pnpm --filter extension check-types
rtk pnpm --filter extension test
```

## Acceptance Criteria

- `@repo/constants` no longer contains only an empty placeholder export.
- The package no longer has a knowingly failing placeholder test script.
- Every exported constant passes the reuse gate.
- Constants are grouped by Demo Composer domain language.
- No backend-only table/schema names are moved by default.
- Existing persisted string values and API values remain unchanged.
- Any app/package that imports constants declares the dependency.
- No UI output, styling, or user-visible behavior changes.

## Final Output Required

When executing this plan, report:

- constants moved;
- constants intentionally left local;
- files changed;
- tests run and results;
- any follow-up constants that should wait for later child plans.
