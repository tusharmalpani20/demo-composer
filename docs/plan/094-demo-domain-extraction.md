# Demo Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `094` of the shared contracts and domainization track.

## Objective

Move Interactive Demo, Demo Scene, Demo Hotspot, and Demo Transition business rules into `@repo/demo-domain`.

The package name is `@repo/demo-domain` to match `docs/system-design-pattern.md`, while the product term remains **Interactive Demo**.

## Current Baseline

Relevant current server module:

```text
apps/server/src/modules/interactive-demo/
```

Relevant migrations:

```text
apps/server/src/db/migrations/011_interactive_demo_foundation_schema.sql
apps/server/src/db/migrations/012_interactive_demo_hotspots.sql
apps/server/src/db/migrations/013_demo_hotspot_target_scope.sql
```

Relevant web features:

```text
apps/web/src/features/interactive-demo/
```

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md
docs/plan/092-capture-domain-extraction.md
```

## Scope

Included:

- create `@repo/demo-domain` when real demo behavior is moved
- extract Interactive Demo creation rules from capture source material
- extract Demo Scene validation and ordering rules
- extract Demo Hotspot validation and ordering rules
- extract Demo Transition/target-scene validation rules
- preserve database-level target scene scope protection
- preserve Guide and Interactive Demo separation
- wire `apps/server` interactive-demo routes/services to demo-domain commands/policies
- share demo contracts with web only where the reuse gate is met

Explicitly excluded:

- creating package `@repo/interactive-demo-domain`
- UI redesign of the Interactive Demo Editor
- changing editor/viewer copy or layout
- changing route URLs
- changing public demo viewer behavior
- implementing branching demo flows beyond current target-scene behavior
- analytics, lead capture, custom branding, or forms
- merging Demo Scene with Guide Step
- changing database schema unless a documented bug requires it

## Expected File Touches

Likely files:

```text
packages/demo-domain/package.json
packages/demo-domain/tsconfig.json
packages/demo-domain/src/**/*
packages/constants/src/demo.ts
packages/types/src/demo.ts
apps/server/package.json
apps/server/src/modules/interactive-demo/**/*
apps/web/package.json
apps/web/src/features/interactive-demo/**/*
apps/web/src/lib/api.ts
```

Conditional files:

```text
packages/capture-domain/src/**/*
```

Only touch capture-domain if this plan needs a formal interface for reading capture source material.

## Execution Guardrails

Existing behavior to preserve:

- Interactive Demo creation from capture source material;
- Demo Scene, Demo Hotspot, and Demo Transition response shapes;
- editor/viewer API behavior;
- target-scene scope protection;
- Guide and Interactive Demo separation.

Shared constants/types to add or reuse:

- demo status, scene/hotspot/transition constants, and demo DTO schemas only when they pass the reuse gate.

Domain logic to move or create:

- demo generation, scene ordering, hotspot ordering, geometry validation, and target-scene validation.

Server adapter changes:

- server keeps `apps/server/src/modules/interactive-demo` routes, SQL adapters, transactions, auth context, and HTTP error mapping.

Web/extension consumer changes:

- web may consume shared demo contracts/constants;
- extension changes are not expected.

Rollback or containment notes:

- if demo-domain extraction weakens target-scene validation, revert command wiring and keep validation in server until domain tests cover it.
- do not rename existing server folders or database schemas as part of rollback or implementation.

## Domain Boundaries

Demo domain owns:

- Interactive Demo lifecycle rules
- Demo Scene structure
- Demo Hotspot structure
- Demo Transition/target rules
- demo generation from Capture Session material
- scene and hotspot reorder policy
- geometry validation according to current behavior

Demo domain does not own:

- Capture Event mutation
- Guide Block or Guide Step behavior
- public viewer visual styling
- editor layout
- publish link access rules

## Discovery Checklist

- [ ] Inspect interactive-demo routes, services, repositories, and tests.
- [ ] Identify demo creation from capture behavior.
- [ ] Identify scene order and hotspot order rules.
- [ ] Identify hotspot geometry and target-scene validation.
- [ ] Identify how migration `013_demo_hotspot_target_scope.sql` protects target scope.
- [ ] Identify shared contracts consumed by web.
- [ ] Identify publish snapshot preparation that should move later to publish-domain.

Useful search commands:

```text
rtk rg "interactive_demo|interactive-demo|demo_scene|demo_hotspot|target_scene|hotspot|transition" apps/server/src apps/web/src packages
rtk rg "scene_index|hotspot_index|target_scene_id|x|y|width|height" apps/server/src/modules/interactive-demo apps/web/src/features/interactive-demo
```

## Implementation Plan

1. Create package baseline.
   - Add scripts, exports, and focused tests.
   - Use package name `@repo/demo-domain`.

2. Extract constants/contracts.
   - Move scene/hotspot/transition constants only where reuse gate is met.
   - Move demo request/response schemas to `@repo/types` only where server and web consume the same contract.

3. Extract generation and validation policies.
   - Create demo from capture source material.
   - Scene ordering.
   - Hotspot creation/update/reorder.
   - Target-scene validation.
   - Geometry validation.

4. Wire server adapters.
   - Keep routes in `apps/server/src/modules/interactive-demo`.
   - Keep SQL adapters in `apps/server`.
   - Preserve HTTP status and response shape.

5. Keep web behavior stable.
   - Web changes should only replace duplicated types/constants with shared imports.
   - Do not change markup, styling, copy, layout, or viewer navigation.

## Testing Plan

Domain tests:

- creates demo scenes from representative capture assets;
- validates scene ordering;
- validates hotspot geometry according to current behavior;
- rejects target scenes outside the demo;
- validates hotspot reorder behavior.

Server tests:

- create interactive demo from capture session;
- list/read/update demo;
- create/update/reorder/delete scene if supported;
- create/update/reorder/delete hotspot;
- target-scene scope behavior remains protected.

Web tests:

- interactive demo API helpers compile/use shared types;
- existing editor/viewer tests remain green.

## Verification Commands

```text
rtk pnpm --filter @repo/demo-domain lint
rtk pnpm --filter @repo/demo-domain build
rtk pnpm --filter @repo/demo-domain test
rtk pnpm --filter server test -- interactive-demo
rtk pnpm --filter web check-types
rtk pnpm --filter web test
rtk pnpm check-types
```

If DB persistence or target-scope behavior is touched:

```text
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- Interactive Demo business rules live in `@repo/demo-domain`.
- Package is not named `@repo/interactive-demo-domain`.
- Demo Scene and Demo Hotspot remain first-class concepts.
- Demo Hotspot is not confused with Guide Annotation.
- Existing demo route shapes and editor/viewer behavior remain stable.
- Existing target-scene scope protections remain intact.
- Tests cover moved behavior.

## Final Output Required

When executing this plan, report:

- demo rules moved;
- server adapters changed;
- shared contracts/constants introduced;
- files changed;
- tests run and results;
- follow-ups for publish-domain snapshot preparation.
