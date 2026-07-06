# Domain Package Conventions And Error Mapping Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `089` of the shared contracts and domainization track.

## Objective

Define the conventions every new domain package should follow before extracting business logic out of `apps/server`.

This plan should produce a small, practical convention layer. It should not create a broad framework or force empty folders into packages.

## Current Baseline

The repo currently has runnable apps and thin shared packages:

```text
apps/server
apps/web
apps/extension
packages/constants
packages/types
packages/ui
```

Domain packages such as `@repo/capture-domain`, `@repo/guide-domain`, and `@repo/demo-domain` do not exist yet.

Server modules currently contain route, service, repository, and test code under:

```text
apps/server/src/modules/<domain>/
```

## Relevant Docs

Read before implementation:

```text
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
```

## Scope

Included:

- define package structure conventions for domain packages
- define command/query naming conventions
- define repository interface conventions
- define domain actor/context conventions
- define typed domain error conventions
- define how `apps/server` maps domain errors to HTTP responses
- create minimal shared helpers only if they remove immediate duplication
- add a template README section or doc notes future child plans can copy

Explicitly excluded:

- extracting a full domain
- creating all candidate domain packages mechanically
- adding empty `policy`, `command`, `query`, or `repository` folders without real behavior
- changing API responses unless current error mapping already has a documented mismatch
- replacing all server error handling in one pass

## Proposed Package Shape

Use this shape when a domain package has the matching behavior:

```text
packages/<domain>-domain/
  package.json
  tsconfig.json
  README.md
  src/
    index.ts
    command/
    query/
    repository/
    policy/
    error/
    types/
    __tests__/
```

Folder rules:

- `command/` exists when the package owns writes.
- `query/` exists when the package owns read assembly.
- `repository/` exists when the domain needs persistence interfaces.
- `policy/` exists only for deterministic business decisions.
- `error/` exists when the domain has typed failures.
- `types/` exists for domain-local types, not public API DTOs.

## Domain Error Convention

Define a typed error shape that supports:

- stable domain error code;
- user-safe message when appropriate;
- optional cause/details for logs;
- HTTP mapping in the server adapter;
- no Fastify dependency in domain packages.

Recommended starting shape:

```text
code: string
message: string
status_hint?: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable"
details?: unknown
```

The exact TypeScript implementation should be decided during implementation.

## Repository Convention

Repository interfaces should:

- use domain language;
- hide SQL details;
- accept transaction/client handles only through explicit adapter types;
- avoid business decisions;
- return domain-ready records or command results;
- avoid importing Fastify or web/extension code.

Server repository adapters should stay in `apps/server` until a child plan proves package-level persistence is appropriate.

## Server Error Mapping

`apps/server` should map domain errors to HTTP responses near the route/service boundary.

Rules:

- domain packages do not import Fastify;
- HTTP status codes are assigned by server adapters;
- response shape must remain compatible with existing API tests;
- auth/session errors remain server-owned unless a child plan extracts them explicitly.

## Expected File Touches

Likely files:

```text
docs/system-design-pattern.md
docs/plan/089-domain-package-conventions-and-error-mapping.md
packages/<small-shared-helper-if-needed>/
apps/server/src/**/error*
apps/server/src/**/response*
```

This plan may be documentation-only if the existing server helpers are good enough to guide later work.

## Execution Guardrails

Existing behavior to preserve:

- current API error status codes and response shapes;
- current server route behavior.

Shared constants/types to add or reuse:

- none by default. Add shared error constants/types only if this plan proves immediate reuse.

Domain logic to move or create:

- none beyond small framework-agnostic error helpers if justified.

Server adapter changes:

- limited to representative error mapping helpers/tests if code changes are necessary.

Web/extension consumer changes:

- none expected.

Rollback or containment notes:

- if helper abstractions make route code less clear, remove the helper and keep the documented convention.
- do not block later child plans on a helper that is not needed by the first real domain extraction.

## Discovery Checklist

- [ ] Inspect existing server error classes and response helpers.
- [ ] Inspect route tests that assert error shape/status.
- [ ] Inspect repository/service patterns in capture, guide, demo, publish, setup, auth, project, and organization modules.
- [ ] Identify the smallest common pattern to standardize.
- [ ] Decide whether a shared helper is justified or whether docs are enough.

Useful search commands:

```text
rtk rg "class .*Error|throw new|statusCode|code:|error:" apps/server/src
rtk rg "repository|service|routes" apps/server/src/modules -g "*.ts"
```

## Implementation Plan

1. Document conventions.
   - Add concrete command/query/repository/error naming rules.
   - Add import-boundary rules.
   - Add package script expectations for future domain packages.

2. Add minimal helpers only if needed.
   - Prefer a small domain error helper over many ad hoc error classes if it reduces real duplication.
   - Keep helpers framework-agnostic.

3. Add server mapping tests if code changes.
   - Preserve existing response shape.
   - Prove one representative domain error maps to the expected HTTP response.

## Testing Plan

If implementation is documentation-only:

- no runtime tests are required.

If helpers are added:

- unit test domain error creation;
- unit test server HTTP mapping;
- run focused server route tests for one mapped route.

## Verification Commands

Always run for docs/package consistency:

```text
rtk pnpm check-types
```

If code is added:

```text
rtk pnpm lint
rtk pnpm build
rtk pnpm --filter server test -- error response
```

If a new package is added:

```text
rtk pnpm --filter <new-package-name> lint
rtk pnpm --filter <new-package-name> build
```

## Acceptance Criteria

- Future domain child plans have a clear package structure convention.
- Domain packages remain framework-agnostic.
- Server remains responsible for HTTP mapping.
- Existing API error response behavior is preserved.
- No empty package/folder scaffolding is created without real use.
- No UI or public API behavior changes are introduced.

## Final Output Required

When executing this plan, report:

- conventions finalized;
- any helper code added;
- files changed;
- tests run and results;
- known conventions deferred to the first real domain extraction.
