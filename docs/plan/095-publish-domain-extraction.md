# Publish Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `095` of the shared contracts and domainization track.

## Objective

Move Publish Link, Published Artifact, immutable snapshot, and public access rules into `@repo/publish-domain`.

Publish behavior must stay generic enough to support both Guides and Interactive Demos.

## Current Baseline

Relevant current server module:

```text
apps/server/src/modules/publish/
```

Relevant migrations:

```text
apps/server/src/db/migrations/006_publish_foundation_schema.sql
apps/server/src/db/migrations/009_publish_link_access_controls.sql
apps/server/src/db/migrations/010_public_publish_password_access.sql
```

Relevant source domains:

```text
apps/server/src/modules/guide/
apps/server/src/modules/interactive-demo/
```

Relevant web features:

```text
apps/web/src/features/guide/
apps/web/src/features/interactive-demo/
```

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/plan/093-guide-domain-extraction.md
docs/plan/094-demo-domain-extraction.md
```

## Scope

Included:

- create `@repo/publish-domain` when real publish behavior is moved
- extract publish link status/visibility/access constants and contracts where reused
- extract Published Artifact snapshot creation policy
- extract Guide and Interactive Demo publish target handling
- extract public access validation
- extract password and expiry policy if currently implemented
- extract public viewer session rules if currently domain-owned
- wire `apps/server` publish routes/services to publish-domain commands/policies
- preserve immutable snapshot behavior

Explicitly excluded:

- changing public viewer UI
- changing public route URLs
- changing publish link URL shape
- making publish links point directly at draft rows
- adding analytics or lead capture
- adding custom domains
- adding new access modes unless an existing mode is already implemented but not centralized
- changing database schema unless a documented bug requires it

## Expected File Touches

Likely files:

```text
packages/publish-domain/package.json
packages/publish-domain/tsconfig.json
packages/publish-domain/src/**/*
packages/constants/src/publish.ts
packages/types/src/publish.ts
apps/server/package.json
apps/server/src/modules/publish/**/*
apps/server/src/modules/guide/**/*
apps/server/src/modules/interactive-demo/**/*
apps/web/package.json
apps/web/src/features/guide/**/*
apps/web/src/features/interactive-demo/**/*
apps/web/src/lib/api.ts
```

Conditional files:

```text
packages/guide-domain/src/**/*
packages/demo-domain/src/**/*
```

Only touch guide/demo domains if this plan needs explicit snapshot-preparation interfaces.

## Execution Guardrails

Existing behavior to preserve:

- Publish Link resolution to immutable Published Artifact snapshots;
- guide and Interactive Demo publish behavior;
- password/public access behavior;
- public viewer response shapes;
- public asset access tied to snapshots.

Shared constants/types to add or reuse:

- artifact type, access/visibility, password/expiry, viewer-session constants, and public response schemas only when they pass the reuse gate.

Domain logic to move or create:

- snapshot creation policy, publish link lifecycle, access policy, password/expiry policy, and viewer session policy where currently implemented.

Server adapter changes:

- server keeps routes, SQL adapters, transactions, cookie/session plumbing, password hashing/checking adapter details, and HTTP error mapping.

Web/extension consumer changes:

- web may consume shared publish/public viewer contracts/constants;
- extension changes are not expected.

Rollback or containment notes:

- if snapshot behavior changes unexpectedly, revert publish-domain command wiring and keep snapshot creation server-local until fixture coverage is stronger.
- keep access-policy extraction separate from public viewer rendering so public UI remains stable.

## Domain Boundaries

Publish domain owns:

- Published Artifact snapshot policy
- Publish Link lifecycle
- public access rules
- password/expiry access policy where currently implemented
- public viewer session policy where currently implemented
- generic target handling for Guide and Interactive Demo snapshots

Publish domain does not own:

- Guide editing behavior
- Demo editing behavior
- public viewer visual rendering
- storage/CDN provider details
- analytics/lead capture

## Discovery Checklist

- [ ] Inspect publish routes, services, repositories, and tests.
- [ ] Identify current snapshot shape for Guide and Interactive Demo.
- [ ] Identify current public link access modes.
- [ ] Identify current password unlock and viewer session behavior.
- [ ] Identify where Guide/Demo snapshot preparation belongs.
- [ ] Identify shared contracts consumed by web public viewers.
- [ ] Identify error/status codes that must remain stable.

Useful search commands:

```text
rtk rg "publish|published_artifact|publish_link|public_publish_viewer_session|password|visibility|artifact_type|snapshot" apps/server/src apps/web/src packages
rtk rg "guide|interactive_demo|demo_scene|demo_hotspot" apps/server/src/modules/publish apps/web/src/features
```

## Implementation Plan

1. Create package baseline.
   - Add scripts, exports, and focused tests.
   - Export only publish-domain behavior.

2. Extract constants/contracts.
   - Publish target/artifact type values.
   - Link access/visibility values.
   - Password/expiry/viewer session contracts where reused.

3. Extract snapshot policy.
   - Preserve immutable snapshot behavior.
   - Preserve target-specific snapshot differences.
   - Keep draft rows separate from published snapshots.

4. Extract access policy.
   - Public access.
   - Password unlock.
   - Expiry/revocation behavior if implemented.
   - Viewer session behavior if currently domain-owned.

5. Wire server adapters.
   - Keep routes and SQL adapters in `apps/server`.
   - Map domain errors to existing HTTP responses.

6. Keep web behavior stable.
   - Web changes should only replace duplicated types/constants with shared imports.
   - Public reader/viewer output must not change.

## Testing Plan

Domain tests:

- creates immutable Guide snapshot payloads;
- creates immutable Interactive Demo snapshot payloads;
- resolves link to current Published Artifact;
- rejects revoked/expired/password-protected access according to current behavior;
- validates password unlock behavior where implemented.

Server tests:

- publish guide;
- publish interactive demo;
- revoke/unpublish where supported;
- resolve public guide link;
- resolve public demo link;
- password unlock and viewer session behavior;
- public asset access tied to published snapshots.

Web tests:

- public guide reader compiles/uses shared contract if touched;
- public interactive demo viewer compiles/uses shared contract if touched;
- editor publish controls remain behaviorally stable if touched.

## Verification Commands

```text
rtk pnpm --filter @repo/publish-domain lint
rtk pnpm --filter @repo/publish-domain build
rtk pnpm --filter @repo/publish-domain test
rtk pnpm --filter server test -- publish
rtk pnpm --filter web check-types
rtk pnpm --filter web test
rtk pnpm check-types
```

If DB persistence or snapshot storage behavior is touched:

```text
rtk pnpm --filter server test:db
```

If the full workflow should be revalidated:

```text
rtk pnpm --filter server test:smoke
```

Before `test:smoke`, document the required test database setup/reset state.

## Acceptance Criteria

- Publish Link and Published Artifact rules live in `@repo/publish-domain`.
- Publish links still resolve to immutable snapshots.
- Publish links do not point directly to draft Guide or Interactive Demo rows.
- Guide and Interactive Demo publishing remain supported.
- Public access/password behavior remains compatible.
- Existing route URLs and response shapes remain stable.
- Public viewer UI behavior does not change.
- Tests cover moved behavior.

## Final Output Required

When executing this plan, report:

- publish rules moved;
- snapshot/access behavior preserved;
- server adapters changed;
- shared contracts/constants introduced;
- files changed;
- tests run and results;
- any public viewer or snapshot follow-ups deferred.
