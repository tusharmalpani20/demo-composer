# Capture Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `092` of the shared contracts and domainization track.

## Objective

Move Capture Session, Capture Event, and capture source-material business rules into `@repo/capture-domain`.

Capture remains source material. Finishing a capture session must not create a Guide or Interactive Demo automatically.

## Current Baseline

Relevant current server modules:

```text
apps/server/src/modules/capture-session/
apps/server/src/modules/capture-event/
apps/server/src/modules/capture-asset/
apps/server/src/modules/file-storage/
```

Relevant migrations:

```text
apps/server/src/db/migrations/002_capture_session_schema.sql
apps/server/src/db/migrations/003_capture_asset_metadata_schema.sql
apps/server/src/db/migrations/004_capture_event_foundation_schema.sql
```

Relevant clients:

```text
apps/extension/src/
apps/web/src/
```

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
```

## Scope

Included:

- create `@repo/capture-domain` when real capture behavior is moved
- extract Capture Session lifecycle rules
- extract Capture Event type, ordering, update, and reorder policies
- extract capture payload validation shared with extension where appropriate
- extract source asset reference validation
- preserve immutable source records
- preserve privacy-preserving capture defaults
- preserve screenshot-first behavior
- keep HTML replay deferred
- wire `apps/server` routes/services to call capture-domain commands/policies
- update extension shared contract consumption only where needed for capture payload agreement

Explicitly excluded:

- creating Guides or Interactive Demos automatically when capture finishes
- implementing HTML replay
- storing raw typed input values
- changing extension UI or capture user flow
- changing route URLs
- changing capture DB schema unless a documented bug requires it
- changing public viewer behavior
- moving file storage adapter behavior into capture-domain

## Expected File Touches

Likely files:

```text
packages/capture-domain/package.json
packages/capture-domain/tsconfig.json
packages/capture-domain/src/**/*
packages/constants/src/capture.ts
packages/types/src/capture.ts
apps/server/package.json
apps/server/src/modules/capture-session/**/*
apps/server/src/modules/capture-event/**/*
apps/server/src/modules/capture-asset/**/*
apps/extension/package.json
apps/extension/src/**/*
apps/web/src/**/*
```

Conditional files:

```text
packages/file-domain/src/**/*
```

Only touch file-domain if capture behavior needs file policy that was already extracted in plan `090`.

## Execution Guardrails

Existing behavior to preserve:

- Capture Session lifecycle behavior;
- Capture Event payload acceptance;
- immutable capture source records;
- screenshot-first capture;
- privacy-preserving defaults;
- extension-facing bearer/cookie auth behavior.

Shared constants/types to add or reuse:

- capture status, source type, event type, privacy constants, and capture payload schemas only when they pass the reuse gate.

Domain logic to move or create:

- session lifecycle, event validation, source asset reference validation, ordering, completion/cancel policy, and privacy defaults.

Server adapter changes:

- server keeps Fastify routes, SQL adapters, transactions, auth context, and storage adapters.

Web/extension consumer changes:

- extension may consume shared capture payload contracts;
- web may consume shared capture DTOs if already reused;
- no extension UI or portal UI behavior changes.

Rollback or containment notes:

- if extension/server contract alignment breaks capture, revert consumer imports first and keep domain policy server-only until tests are strengthened.
- keep capture-domain extraction separate from guide/demo creation so source-material behavior can be validated independently.

## Domain Boundaries

Capture domain owns:

- Capture Session lifecycle
- Capture Event semantics
- Manual Capture semantics
- source asset references
- event ordering rules
- privacy/redaction capture defaults
- screenshot-first capture assumptions

Capture domain does not own:

- Guide generation output rules
- Interactive Demo scene generation rules
- raw storage provider adapters
- extension popup UI
- public viewer UI

## Discovery Checklist

- [ ] Inspect capture session route/service/repository behavior.
- [ ] Inspect capture event route/service/repository behavior.
- [ ] Inspect capture asset behavior that belongs to capture versus file.
- [ ] Inspect extension payload builders and API calls.
- [ ] List lifecycle transitions currently accepted.
- [ ] List event types currently accepted.
- [ ] List update/reorder rules currently enforced.
- [ ] Identify immutable source-record protections.
- [ ] Identify privacy defaults currently enforced by extension/server.

Useful search commands:

```text
rtk rg "capture_session|capture-session|capture_event|capture-event|capture_asset|capture-asset|event_type|source_type|manual capture|input_value_redacted" apps packages
rtk rg "draft|capturing|completed|canceled|archived|navigation|click|input|capture|note" apps/server apps/extension apps/web
```

## Implementation Plan

1. Create package baseline.
   - Add package scripts.
   - Export only real domain behavior.
   - Add focused tests before wiring.

2. Extract constants/contracts.
   - Use `@repo/constants` for capture status, source type, event type, and privacy defaults only where they pass the reuse gate.
   - Use `@repo/types` for shared capture request/response/payload schemas only where server and extension/web consume them.

3. Extract lifecycle and validation policy.
   - Create/update/finish/cancel capture session rules.
   - Append/update/reorder capture event rules.
   - Source asset reference validation.

4. Wire server adapters.
   - Keep Fastify routes in `apps/server`.
   - Keep SQL adapters in `apps/server`.
   - Translate domain errors through the plan `089` convention.

5. Wire extension contracts.
   - Replace duplicated extension payload types with shared schemas/types only where safe.
   - Preserve user-visible extension behavior.

## Testing Plan

Domain tests:

- creates valid capture session command input;
- validates lifecycle transitions currently accepted;
- rejects invalid event types;
- preserves manual ordering rules;
- rejects invalid event reorder payloads;
- preserves privacy defaults and redacted input assumptions.

Server tests:

- create capture session;
- list/read/update capture session;
- append capture event;
- update/reorder capture event;
- create/list capture assets where capture-domain participates;
- bearer-or-cookie auth behavior remains stable for extension-facing routes.

Extension tests:

- payload builders produce shared contract-compatible payloads;
- existing capture flow tests remain green.

## Verification Commands

```text
rtk pnpm --filter @repo/capture-domain lint
rtk pnpm --filter @repo/capture-domain build
rtk pnpm --filter @repo/capture-domain test
rtk pnpm --filter server test -- capture-session capture-event capture-asset
rtk pnpm --filter extension check-types
rtk pnpm --filter extension test
rtk pnpm --filter web check-types
rtk pnpm check-types
```

If DB persistence behavior is touched:

```text
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- Capture Session and Capture Event business rules live in `@repo/capture-domain`.
- Capture source records remain immutable.
- Existing extension capture payloads remain accepted.
- Screenshot-first behavior remains unchanged.
- HTML replay remains deferred.
- No Guide or Interactive Demo is created implicitly by finishing capture.
- Existing route URLs and response shapes remain stable.
- No UI behavior or visual output changes.

## Final Output Required

When executing this plan, report:

- capture rules moved;
- route/service adapters changed;
- shared contracts/constants introduced;
- files changed;
- tests run and results;
- any capture follow-ups for guide/demo extraction.
