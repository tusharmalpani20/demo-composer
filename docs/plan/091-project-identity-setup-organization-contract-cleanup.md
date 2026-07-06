# Project, Identity, Setup, And Organization Contract Cleanup Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `091` of the shared contracts and domainization track.

## Objective

Centralize lower-level app shell contracts and product rules before extracting capture, guide, demo, and publish domains.

This plan covers:

- Project
- User identity
- Auth/session-facing shared contracts where safe
- Instance status
- Deployment Mode and onboarding mode
- Owner Bootstrap and Web First-Run Setup
- Organization, Org User, roles, and invites

## Current Baseline

Relevant current modules:

```text
apps/server/src/modules/project/
apps/server/src/modules/authentication/
apps/server/src/modules/setup/
apps/server/src/modules/public-instance/
apps/server/src/modules/organization/
```

Important current terms:

- **User** is login identity.
- **Organization** is the tenant/workspace.
- **Org User** is the implementation record for Organization Member.
- **Owner** is the organization-scoped role with full control.
- **Instance** is the Demo Composer deployment the extension/apps connect to.
- **First-Run Setup** is for self-hosted initialization.
- **Signup Onboarding** is for hosted registration/invites.

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0015-user-organization-org-user-identity-model.md
docs/adr/0016-explicit-owner-bootstrap-command.md
docs/adr/0017-deployment-aware-onboarding-mode.md
docs/adr/0018-web-first-run-setup-from-day-one.md
docs/adr/0019-separate-web-and-server-apps.md
```

## Scope

Included:

- extract project status/lifecycle constants and contracts where reused
- extract public instance status contracts where reused by web/extension
- extract deployment/onboarding mode constants and schemas
- extract first-run setup request/response schemas when shared
- preserve Owner Bootstrap and Web First-Run Setup rules
- extract safe auth/session response DTOs if reused by web/extension
- extract organization role/member/invite constants and schemas
- preserve User, Organization, and Org User separation
- define whether identity/setup behavior stays in existing server modules for now or justifies new domain packages

Explicitly excluded:

- changing login behavior
- changing setup UI behavior or copy
- changing public signup/invite product behavior
- changing auth cookie/session infrastructure
- exposing password hashing or token internals through shared packages
- changing database schema
- adding new onboarding modes
- creating `@repo/user-domain`, `@repo/auth-domain`, or `@repo/instance-domain` mechanically

## Expected File Touches

Likely files:

```text
packages/constants/src/project.ts
packages/constants/src/organization.ts
packages/constants/src/setup.ts
packages/constants/src/auth.ts
packages/types/src/project.ts
packages/types/src/organization.ts
packages/types/src/setup.ts
packages/types/src/auth.ts
apps/server/src/modules/project/**/*
apps/server/src/modules/authentication/**/*
apps/server/src/modules/setup/**/*
apps/server/src/modules/public-instance/**/*
apps/server/src/modules/organization/**/*
apps/web/src/**/*
apps/extension/src/**/*
```

Conditional package files:

```text
packages/project-domain/**/*
packages/organization-domain/**/*
packages/auth-domain/**/*
packages/user-domain/**/*
packages/instance-domain/**/*
```

Only create a domain package when this plan moves real behavior into it.

## Execution Guardrails

Existing behavior to preserve:

- User, Organization, and Org User identity split;
- Owner Bootstrap and Web First-Run Setup behavior;
- public instance status behavior;
- login/session behavior;
- project and organization invite behavior.

Shared constants/types to add or reuse:

- deployment mode, onboarding mode, role/status constants, and setup/auth/org/project DTOs only when they pass the reuse gate.

Domain logic to move or create:

- project lifecycle policy, setup/onboarding policy, or organization invite/role policy only where real behavior is extracted.

Server adapter changes:

- server keeps cookies, session token handling, password hashing, environment parsing, and HTTP routes.

Web/extension consumer changes:

- web may consume setup/auth/project/org shared contracts;
- extension may consume public instance/auth contracts;
- no visible UI or capture behavior changes.

Rollback or containment notes:

- if identity/setup extraction risks auth behavior, keep behavior server-local and centralize only constants/contracts.
- keep auth-sensitive internals out of shared packages so contract changes can be reverted safely.

## Discovery Checklist

- [ ] Inspect project route schemas and service rules.
- [ ] Inspect public instance status response shape and web/extension consumers.
- [ ] Inspect setup route schemas and web setup API helpers.
- [ ] Inspect auth session response shape and web/extension consumers.
- [ ] Inspect organization invite role/status handling.
- [ ] Identify constants that pass the `@repo/constants` reuse gate.
- [ ] Identify contracts that pass the `@repo/types` reuse gate.
- [ ] Identify behavior that should move to a domain package versus remain server-local.

Useful search commands:

```text
rtk rg "setup_required|onboarding_mode|deployment_mode|org_user|organization|owner|member|invite|session|project" apps packages
rtk rg "first_run_setup|signup|self_hosted|hosted|Owner|Org User|Instance" docs apps packages
```

## Implementation Plan

1. Centralize safe constants.
   - Deployment Mode values.
   - Onboarding mode values.
   - Organization role values.
   - Project status values if duplicated.
   - Invite/session status values if duplicated.

2. Centralize reused contracts.
   - Public instance status.
   - First-run setup request/response if web/server both consume it.
   - Auth session response if web/extension both consume it.
   - Organization invite request/response if reused.

3. Keep sensitive internals server-only.
   - Password hashing inputs and internals.
   - Session token hashing.
   - Cookie details.
   - Fastify request context.

4. Extract domain behavior only where justified.
   - Project lifecycle policy may move to `@repo/project-domain`.
   - Organization invite/role policy may move to `@repo/organization-domain`.
   - Setup/onboarding policy may stay in server or move to a small domain only if reuse is real.

## Testing Plan

Server tests:

- public instance status still reports correct setup/onboarding state;
- first-run setup still creates User, Organization, owner Org User, and session transactionally;
- repeated setup remains blocked;
- hosted/signup mode does not expose first-run setup incorrectly;
- auth session routes remain compatible;
- organization invite and acceptance behavior remains stable;
- project CRUD/list behavior remains stable.

Shared package tests:

- setup/onboarding schemas parse current payloads;
- organization role constants match current accepted values;
- auth DTOs do not expose sensitive fields.

Client tests:

- web setup/auth/project/org tests remain green if imports change;
- extension instance/auth tests remain green if imports change.

## Verification Commands

```text
rtk pnpm --filter @repo/constants build
rtk pnpm --filter @repo/types build
rtk pnpm --filter server test -- public-instance setup authentication project organization
rtk pnpm --filter web check-types
rtk pnpm --filter web test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension test
rtk pnpm check-types
```

If DB-backed setup/auth/project/org persistence is touched:

```text
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- User, Organization, and Org User remain distinct.
- Owner Bootstrap and Web First-Run Setup rules remain intact.
- Deployment Mode and onboarding mode contracts are shared where reused.
- Auth-sensitive implementation details remain server-only.
- Project and organization constants/contracts are centralized only when justified.
- Existing routes, response shapes, and UI behavior remain stable.
- No new product feature is introduced.

## Final Output Required

When executing this plan, report:

- constants/contracts moved;
- identity/setup behavior intentionally left server-local;
- any domain package created and why;
- files changed;
- tests run and results;
- follow-ups for capture/domain extraction.
