# Guide Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `093` of the shared contracts and domainization track.

## Objective

Move Guide, Guide Block, Guide Step, and Guide Annotation business rules into `@repo/guide-domain`.

Guides are Scribe-style document artifacts derived from capture source material or created/edited directly by users.

## Current Baseline

Relevant current server module:

```text
apps/server/src/modules/guide/
```

Relevant migrations:

```text
apps/server/src/db/migrations/005_guide_foundation_schema.sql
apps/server/src/db/migrations/007_guide_block_content.sql
apps/server/src/db/migrations/008_guide_block_screenshot_selection.sql
```

Relevant web features:

```text
apps/web/src/features/guide/
```

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/plan/092-capture-domain-extraction.md
```

## Scope

Included:

- create `@repo/guide-domain` when real guide behavior is moved
- extract guide creation rules from capture source material
- extract Guide Block and Guide Step validation
- extract block insertion, update, reorder, screenshot selection, and annotation policies
- preserve deterministic placeholder behavior where AI remains deferred
- preserve Guide and Interactive Demo separation
- wire `apps/server` guide routes/services to guide-domain commands/policies
- share Guide contracts with web only where the reuse gate is met

Explicitly excluded:

- UI redesign of the Guide Editor
- changing guide editor copy or layout
- changing route URLs
- changing public guide viewer behavior
- implementing AI Suggestions
- merging Guide Step and Capture Event concepts
- merging Guide Annotation and Demo Hotspot concepts
- changing database schema unless a documented bug requires it

## Expected File Touches

Likely files:

```text
packages/guide-domain/package.json
packages/guide-domain/tsconfig.json
packages/guide-domain/src/**/*
packages/constants/src/guide.ts
packages/types/src/guide.ts
apps/server/package.json
apps/server/src/modules/guide/**/*
apps/web/package.json
apps/web/src/features/guide/**/*
apps/web/src/lib/api.ts
```

Conditional files:

```text
packages/capture-domain/src/**/*
```

Only touch capture-domain if this plan needs a formal interface for reading capture source material.

## Execution Guardrails

Existing behavior to preserve:

- guide creation from capture source material;
- Guide Block, Guide Step, and Guide Annotation response shapes;
- editor API behavior;
- deterministic non-AI placeholder behavior;
- Guide and Interactive Demo separation.

Shared constants/types to add or reuse:

- guide status, block type, annotation type, and guide DTO schemas only when they pass the reuse gate.

Domain logic to move or create:

- guide generation, block/step update policy, reorder policy, screenshot selection, and annotation validation.

Server adapter changes:

- server keeps routes, SQL adapters, transactions, auth context, and HTTP error mapping.

Web/extension consumer changes:

- web may consume shared guide contracts/constants;
- extension changes are not expected.

Rollback or containment notes:

- if guide generation extraction changes output shape, revert that command wiring and keep only pure validation policies in the domain package.
- keep publish snapshot preparation out of this plan unless needed to preserve current guide behavior.

## Domain Boundaries

Guide domain owns:

- Guide lifecycle rules
- Guide Block structure
- Guide Step structure
- Guide Annotation structure
- guide generation from Capture Session material
- guide block reorder/update policy
- screenshot selection policy for guide blocks

Guide domain does not own:

- Capture Event mutation
- Capture Asset/File storage policy
- Interactive Demo scene/hotspot behavior
- Guide Editor visual layout
- Public viewer styling

## Discovery Checklist

- [ ] Inspect guide routes, services, repositories, and tests.
- [ ] Identify how guide creation from capture events currently works.
- [ ] Identify block type values and validation rules.
- [ ] Identify screenshot selection and annotation rules.
- [ ] Identify reorder/update rules.
- [ ] Identify current public snapshot preparation logic that belongs to publish-domain instead.
- [ ] Identify shared contracts consumed by web.

Useful search commands:

```text
rtk rg "guide|guide_block|guide_step|guide_annotation|block_type|selected_capture_event_ids|selected_capture_asset|annotations" apps/server/src apps/web/src packages
rtk rg "step|header|paragraph|tip|alert|divider|highlight" apps/server/src/modules/guide apps/web/src/features/guide
```

## Implementation Plan

1. Create package baseline.
   - Add scripts, exports, and focused tests.
   - Export only guide-domain behavior.

2. Extract constants/contracts.
   - Move block types, annotation types, and guide status only where reuse gate is met.
   - Move Guide request/response schemas to `@repo/types` only where server and web consume the same contract.

3. Extract generation and update policies.
   - Guide creation from capture events.
   - Guide block insert/update/reorder.
   - Guide step updates.
   - Screenshot selection.
   - Annotation validation.

4. Wire server adapters.
   - Routes remain in `apps/server`.
   - SQL remains in server repository adapters unless this plan documents a different package boundary.
   - Domain errors map to existing HTTP responses.

5. Keep web visual behavior stable.
   - Web changes should only replace local duplicated types/constants with shared imports.
   - Do not change markup, classes, copy, or layout unless required to keep compilation after type changes.

## Testing Plan

Domain tests:

- creates guide blocks from representative capture events;
- preserves source Capture Event and Capture Asset immutability;
- validates allowed block types;
- reorders blocks without losing steps;
- validates screenshot selection;
- validates annotation limits and geometry according to current behavior.

Server tests:

- create guide from capture session;
- update guide;
- update guide step;
- reorder guide blocks;
- create/update guide block;
- update block screenshot;
- update annotations;
- public publish-related guide behavior remains stable if touched.

Web tests:

- guide API helpers compile/use shared types;
- existing editor tests remain green.

## Verification Commands

```text
rtk pnpm --filter @repo/guide-domain lint
rtk pnpm --filter @repo/guide-domain build
rtk pnpm --filter @repo/guide-domain test
rtk pnpm --filter server test -- guide
rtk pnpm --filter web check-types
rtk pnpm --filter web test
rtk pnpm check-types
```

If DB persistence or publish snapshots are touched:

```text
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- Guide business rules live in `@repo/guide-domain`.
- Guide Block and Guide Step remain first-class concepts.
- Guide Step is not confused with Capture Event.
- Guide Annotation is not confused with Demo Hotspot.
- Existing guide route shapes and editor behavior remain stable.
- AI Suggestions remain deferred.
- Tests cover moved behavior.

## Final Output Required

When executing this plan, report:

- guide rules moved;
- server adapters changed;
- shared contracts/constants introduced;
- files changed;
- tests run and results;
- follow-ups for publish-domain snapshot preparation.
