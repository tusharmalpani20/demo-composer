# Shared Types And API Contract Foundation Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `088` of the shared contracts and domainization track.

## Objective

Make `@repo/types` the canonical home for Zod-backed shared API contracts that pass the reuse gate.

The package should expose runtime schemas and inferred TypeScript types for contracts that cross app/package boundaries. Server-only route schemas can remain local until there is real reuse.

## Reuse Gate

A schema or type can move into `@repo/types` only when at least one condition is true:

- the server and at least one client app consume it;
- the extension and server must agree on the payload;
- it defines public API behavior or public viewer response shape;
- it is needed by generated API docs or a domain package boundary;
- this child plan documents a concrete drift risk.

## Current Baseline

Current package state:

```text
packages/types/src/index.ts
```

The package currently exports an empty module. It does not directly declare `zod` as a package dependency, and it has no `test` or `check-types` script.

Server route schemas currently live primarily in `apps/server/src/modules/**/**.routes.ts`.

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0015-user-organization-org-user-identity-model.md
docs/adr/0019-separate-web-and-server-apps.md
```

## Scope

Included:

- add direct `zod` dependency to `@repo/types`
- add useful package scripts such as `check-types` and `test` if tests are added
- define naming conventions for schemas and inferred types
- create common schemas for IDs, timestamps, pagination, params, error envelopes, and response wrappers
- add first shared request/response schemas only where reuse is real
- use `@repo/constants` for enum-backed schemas where constants exist
- migrate low-risk server route schemas to shared schemas only when another consumer exists or public API stability justifies it

Explicitly excluded:

- moving every server route schema into `@repo/types`
- exporting database row types by default
- exporting React component props
- exporting server infrastructure types
- changing API response shapes
- changing route URLs
- changing UI behavior

## Expected File Touches

Likely files:

```text
packages/types/package.json
packages/types/src/index.ts
packages/types/src/common.ts
packages/types/src/<domain>.ts
packages/types/src/**/*.test.ts
apps/server/package.json
apps/web/package.json
apps/extension/package.json
apps/server/src/modules/**/**.routes.ts
apps/web/src/lib/api.ts
apps/extension/src/**/*
```

Only add consumer dependencies when imports are introduced.

## Execution Guardrails

Existing behavior to preserve:

- current route URLs, request bodies, response bodies, and error envelopes;
- current web and extension API helper behavior.

Shared constants/types to add or reuse:

- add Zod schemas and inferred types only when they pass the reuse gate;
- use `@repo/constants` enum arrays only after those constants exist.

Domain logic to move or create:

- none. This plan is contract-foundation work, not domain behavior extraction.

Server adapter changes:

- route schemas may import shared contracts only when another consumer or public contract reason exists.

Web/extension consumer changes:

- limited to compiling against shared request/response types for contracts already consumed by those apps.

Rollback or containment notes:

- if a shared schema is too broad or breaks a consumer, move that schema back to the owning route/domain and keep only common primitives.
- keep schema migrations grouped by domain so a failed contract extraction can be reverted without removing the whole package foundation.

## Contract Naming Convention

Use this convention unless discovery proves a better local pattern:

```text
<Domain><Thing>ParamsSchema
<Domain><Thing>QuerySchema
<Domain><Thing>RequestSchema
<Domain><Thing>ResponseSchema
<Domain><Thing>ListResponseSchema
type <Domain><Thing>Request = z.infer<typeof <Domain><Thing>RequestSchema>
type <Domain><Thing>Response = z.infer<typeof <Domain><Thing>ResponseSchema>
```

Use exact domain terms from `CONTEXT.md`:

- Capture Session
- Capture Event
- Capture Asset
- Guide
- Guide Block
- Guide Step
- Interactive Demo
- Demo Scene
- Demo Hotspot
- Published Artifact
- Publish Link
- Organization
- Org User
- Instance

## Discovery Checklist

- [ ] Inventory route-local schemas that are consumed by web or extension clients.
- [ ] Inventory API helper types duplicated in `apps/web`.
- [ ] Inventory extension payload types duplicated from server route expectations.
- [ ] Identify public viewer response shapes that need contract stability.
- [ ] Identify schemas that are server-only and should stay local.
- [ ] Confirm `@repo/constants` exports needed enum values before using them.
- [ ] Record selected first schemas in this plan before implementation.

Useful search commands:

```text
rtk rg "const .*schema|z\\.object|z\\.enum|type .*Response|type .*Request|interface .*Response|interface .*Request" apps packages
rtk rg "fetch\\(|apiFetch|capture.*payload|response\\.json" apps/web apps/extension
```

## Implementation Plan

1. Prepare the package.
   - Add `zod` as a direct dependency of `@repo/types`.
   - Add `check-types`.
   - Add `test` only if meaningful schema tests are included.

2. Add common schema primitives.
   - ID/string schemas.
   - ISO datetime string schema.
   - pagination query/response schemas.
   - common API error envelope if it matches current server behavior.

3. Add the first domain schemas.
   - Prefer setup/public instance/capture contracts if they are already used by clients.
   - Keep the first batch intentionally small.
   - Ensure every schema has an inferred type export.

4. Wire low-risk consumers.
   - Server can import schemas for route validation.
   - Web and extension can import inferred types or schemas when they actively consume the same contract.
   - Avoid broad consumer rewrites in this plan.

## Testing Plan

Tests should prove:

- schemas accept current valid payloads;
- schemas reject representative invalid payloads;
- inferred types compile in server/client import sites;
- route behavior remains stable after schema import changes.

Do not add tests that only restate Zod implementation details.

## Verification Commands

Run after implementation:

```text
rtk pnpm --filter @repo/types lint
rtk pnpm --filter @repo/types build
rtk pnpm check-types
```

If tests are added:

```text
rtk pnpm --filter @repo/types test
```

If server route schemas are switched:

```text
rtk pnpm --filter server test -- setup public-instance authentication capture-session capture-event capture-asset guide interactive-demo publish organization project
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

- `@repo/types` no longer contains only an empty placeholder export.
- `@repo/types` declares the runtime dependencies it needs.
- Shared schemas pass the reuse gate.
- Inferred types are exported from schemas.
- Server-only route schemas remain local unless justified.
- Existing API shapes remain unchanged.
- Any consumer that imports shared types declares the dependency.
- No UI behavior or visual output changes.

## Final Output Required

When executing this plan, report:

- schemas moved or created;
- schemas intentionally left route-local;
- files changed;
- tests run and results;
- any contracts deferred to later domain child plans.
