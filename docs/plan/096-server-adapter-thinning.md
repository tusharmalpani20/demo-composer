# Server Adapter Thinning Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `096` of the shared contracts and domainization track.

## Objective

Remove remaining domain decisions from `apps/server` after the main domain packages exist.

The server should mostly own HTTP, auth/session integration, persistence adapters, storage adapters, request/response validation, transaction boundaries, and domain error mapping.

## Dependencies

This plan should start only after the relevant parts of these plans have landed:

```text
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/plan/089-domain-package-conventions-and-error-mapping.md
docs/plan/090-file-domain-extraction.md
docs/plan/091-project-identity-setup-organization-contract-cleanup.md
docs/plan/092-capture-domain-extraction.md
docs/plan/093-guide-domain-extraction.md
docs/plan/094-demo-domain-extraction.md
docs/plan/095-publish-domain-extraction.md
```

## Current Baseline

Relevant current server modules:

```text
apps/server/src/modules/setup/
apps/server/src/modules/authentication/
apps/server/src/modules/public-instance/
apps/server/src/modules/project/
apps/server/src/modules/organization/
apps/server/src/modules/file-storage/
apps/server/src/modules/capture-session/
apps/server/src/modules/capture-event/
apps/server/src/modules/capture-asset/
apps/server/src/modules/guide/
apps/server/src/modules/interactive-demo/
apps/server/src/modules/publish/
```

## Relevant Docs

Read before implementation:

```text
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0019-separate-web-and-server-apps.md
```

## Scope

Included:

- audit server modules for remaining domain decisions
- move remaining duplicated validation into domain policies or shared schemas only where justified
- convert route handlers and services toward adapter/orchestration responsibilities
- standardize domain error to HTTP response mapping
- remove dead server-local constants/types made obsolete by shared packages
- keep SQL adapters and transaction boundaries explicit
- keep route URLs and response shapes stable

Explicitly excluded:

- rewriting every server module from scratch
- moving Fastify routes into domain packages
- moving auth cookie/session plumbing into domain packages
- moving raw SQL into shared packages unless a prior domain plan explicitly chose that boundary
- changing database schema
- changing API response shape
- changing UI behavior
- changing public viewer behavior

## Server Responsibility Target

After this plan, server code should primarily:

- register Fastify routes;
- attach request/response schemas;
- read params/body/query;
- build actor/request context;
- call domain commands/queries;
- manage transactions;
- call concrete SQL/storage adapters;
- map domain errors to HTTP responses;
- normalize transport-level response details.

Server code should avoid:

- deciding capture lifecycle transitions;
- deciding guide block semantics;
- deciding demo scene/hotspot rules;
- deciding publish access;
- defining product enum values duplicated elsewhere;
- duplicating shared API DTOs.

## Execution Guardrails

Existing behavior to preserve:

- all existing route URLs, status codes, response bodies, auth behavior, and public viewer behavior.

Shared constants/types to add or reuse:

- only replace route-local constants/schemas when they already pass the reuse gate.

Domain logic to move or create:

- remaining server-owned product decisions that belong to already-created domain packages.

Server adapter changes:

- this is the main scope: routes/services become thinner while persistence, auth, storage, and transactions remain server-owned.

Web/extension consumer changes:

- none expected unless a shared contract import needs a compile adjustment.

Rollback or containment notes:

- thin one server module at a time so behavior can be reverted without undoing the whole track.
- if route tests reveal behavior drift, revert the adapter wiring and add characterization tests before retrying.

## Discovery Checklist

- [ ] Inspect each server module for domain logic left behind after plans `090` through `095`.
- [ ] Identify route-local schemas that now have real shared consumers.
- [ ] Identify route-local schemas that should remain server-only.
- [ ] Identify dead constants/types replaced by shared packages.
- [ ] Identify inconsistent domain error mapping.
- [ ] Identify tests that should lock route behavior before thinning.

Useful search commands:

```text
rtk rg "z\\.enum|z\\.object|throw new|statusCode|reorder|transition|visibility|password|event_type|block_type|hotspot|snapshot" apps/server/src/modules
rtk rg "@repo/(constants|types|.*-domain)" apps/server/src packages
```

## Implementation Plan

1. Audit and choose slices.
   - Do not thin all modules in one commit-sized change.
   - Group changes by domain module or shared helper.
   - Record the selected slices before changing code.

2. Lock behavior with tests.
   - Use existing route tests where strong enough.
   - Add characterization tests before moving risky route/service behavior.

3. Move leftover domain decisions.
   - Policies move to domain packages.
   - Public shared schemas move to `@repo/types` only when reuse gate is met.
   - Product constants move to `@repo/constants` only when reuse gate is met.

4. Normalize adapters.
   - Routes should call services.
   - Services should build context and call domain commands/queries.
   - Repositories should stay boring and avoid business decisions.

5. Remove dead code.
   - Delete obsolete server-local types/constants only after imports are updated and tests are green.

## Testing Plan

Route tests should prove:

- status codes remain stable;
- response shapes remain stable;
- auth behavior remains stable;
- domain error mappings are compatible;
- DB-backed workflows remain stable if persistence adapters change.

Domain tests should already exist from prior child plans. Add missing domain tests if a server-only rule is moved for the first time.

## Verification Commands

Focused checks during implementation:

```text
rtk pnpm --filter server test -- setup authentication public-instance project organization capture-session capture-event capture-asset guide interactive-demo publish
rtk pnpm --filter server check-types
rtk pnpm check-types
```

Full checks before closing:

```text
rtk pnpm --filter server test
rtk pnpm --filter server test:db
rtk pnpm lint
rtk pnpm build
```

If smoke workflow is run:

```text
rtk pnpm --filter server test:smoke
```

Before running `test:db` or `test:smoke`, document database setup/reset requirements.

## Acceptance Criteria

- Server modules are visibly thinner.
- Remaining server-owned behavior is transport, auth, persistence, storage, transaction, or integration glue.
- Domain decisions live in domain packages.
- Shared schemas are used only where reuse/public contract justifies them.
- Existing API behavior remains stable.
- No UI behavior or visual output changes.
- Full server verification is documented.

## Final Output Required

When executing this plan, report:

- server modules thinned;
- domain decisions moved;
- route-local schemas intentionally kept;
- files changed;
- tests run and results;
- any remaining server-domain cleanup deferred.
