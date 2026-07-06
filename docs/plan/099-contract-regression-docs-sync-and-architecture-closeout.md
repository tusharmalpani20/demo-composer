# Contract Regression, Docs Sync, And Architecture Closeout Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `099` of the shared contracts and domainization track.

## Objective

Verify the full shared-contract and domainization track, close documentation gaps, and leave the repo with a durable architecture record.

This plan should be the final closeout after child plans `087` through `098` are complete or explicitly deferred.

## Dependencies

Review the final state of:

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
docs/plan/096-server-adapter-thinning.md
docs/plan/097-web-shared-contract-consumption.md
docs/plan/098-extension-shared-contract-consumption.md
```

## Scope

Included:

- verify all package boundaries and dependency directions
- verify shared constants/types exports are intentional and pass the reuse gate
- verify server routes remain behaviorally stable
- verify web and extension compile against shared contracts
- run full regression checks
- update `CONTEXT.md` only if domain language changed
- update architecture docs if implementation boundaries changed
- add ADRs only if a hard-to-reverse, surprising, trade-off decision was made
- record deferred work explicitly
- update master/child plan statuses and evidence summaries where appropriate

Explicitly excluded:

- adding new features
- broad refactors not required for closeout
- UI redesign
- visual QA unless a previous child plan changed UI behavior, which should not happen
- creating ADRs for routine implementation details
- hiding deferred work in code comments

## Closeout Audit Checklist

Package boundaries:

- [ ] `@repo/constants` exports only values that pass the reuse gate.
- [ ] `@repo/types` exports only schemas/types that pass the reuse gate.
- [ ] Domain packages do not import `apps/*`.
- [ ] Shared packages do not import app code.
- [ ] Domain packages avoid Fastify/React/browser-specific dependencies unless explicitly justified.
- [ ] No circular package dependencies were introduced.

Server:

- [ ] `apps/server` routes remain the HTTP boundary.
- [ ] Server services are mostly adapters/orchestrators.
- [ ] SQL/storage adapters remain server-owned unless a prior child plan explicitly moved them.
- [ ] Domain errors map consistently to HTTP responses.
- [ ] Route URLs and response shapes remain stable.

Web:

- [ ] `apps/web` consumes shared contracts/constants where useful.
- [ ] UI-only props and presentation state remain local.
- [ ] No visual/UI behavior changes were introduced by this track.

Extension:

- [ ] `apps/extension` consumes shared capture/API contracts where useful.
- [ ] Instance-first login behavior remains intact.
- [ ] Privacy defaults remain intact.
- [ ] Capture payloads remain server-compatible.

Docs:

- [ ] `CONTEXT.md` terms still match implementation.
- [ ] `docs/system-design-pattern.md` matches final package responsibilities.
- [ ] ADRs are still accurate.
- [ ] Every child plan has final output notes or an explicit deferred status.

## Execution Guardrails

Existing behavior to preserve:

- all product behavior from the completed child plans.

Shared constants/types to add or reuse:

- none by default. This plan audits final exports and removes or documents any that fail the reuse gate.

Domain logic to move or create:

- none by default. This plan closes and verifies previous work.

Server adapter changes:

- none expected except documentation or small cleanup found during closeout.

Web/extension consumer changes:

- none expected except documentation or small compile cleanup found during closeout.

Rollback or containment notes:

- if closeout finds a regression, reopen the specific child plan that introduced it instead of making broad corrective changes here.
- if a verification suite is blocked by environment setup, document the blocker and run the strongest available focused checks.

## Discovery Commands

Use these commands to audit references and boundaries:

```text
rtk rg "@repo/" apps packages
rtk rg "from ['\"]\\.\\./\\.\\./\\.\\./apps|from ['\"]apps/" packages
rtk rg "fastify|Fastify|react|React|window|document|chrome\\." packages
rtk rg "interactive-demo-domain|@repo/interactive-demo-domain" .
rtk rg "TODO|FIXME|deferred|follow-up" docs/plan packages apps
```

Adjust search patterns as needed after inspecting final package names.

## Testing Plan

Run tests in layers:

1. Shared packages.
2. Domain packages.
3. Server focused and full tests.
4. Web tests/typecheck.
5. Extension tests/typecheck.
6. Workspace build/typecheck/lint.
7. DB and smoke tests with documented database reset/setup.

## Verification Commands

Shared packages:

```text
rtk pnpm --filter @repo/constants lint
rtk pnpm --filter @repo/constants build
rtk pnpm --filter @repo/types lint
rtk pnpm --filter @repo/types build
```

Domain packages, as applicable:

```text
rtk pnpm --filter @repo/file-domain lint
rtk pnpm --filter @repo/file-domain build
rtk pnpm --filter @repo/file-domain test
rtk pnpm --filter @repo/capture-domain lint
rtk pnpm --filter @repo/capture-domain build
rtk pnpm --filter @repo/capture-domain test
rtk pnpm --filter @repo/guide-domain lint
rtk pnpm --filter @repo/guide-domain build
rtk pnpm --filter @repo/guide-domain test
rtk pnpm --filter @repo/demo-domain lint
rtk pnpm --filter @repo/demo-domain build
rtk pnpm --filter @repo/demo-domain test
rtk pnpm --filter @repo/publish-domain lint
rtk pnpm --filter @repo/publish-domain build
rtk pnpm --filter @repo/publish-domain test
```

Apps:

```text
rtk pnpm --filter server test
rtk pnpm --filter web check-types
rtk pnpm --filter web test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension test
```

Workspace:

```text
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
```

Database-backed checks:

```text
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

Before DB-backed checks, document the database setup/reset commands actually used. If `test:smoke` requires isolated state, reset the test database first.

## Documentation Updates

Update these only when the final implementation differs from current docs:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/project-zoomout-status.md
docs/roadmap.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/plan/089-domain-package-conventions-and-error-mapping.md
docs/plan/090-file-domain-extraction.md
docs/plan/091-project-identity-setup-organization-contract-cleanup.md
docs/plan/092-capture-domain-extraction.md
docs/plan/093-guide-domain-extraction.md
docs/plan/094-demo-domain-extraction.md
docs/plan/095-publish-domain-extraction.md
docs/plan/096-server-adapter-thinning.md
docs/plan/097-web-shared-contract-consumption.md
docs/plan/098-extension-shared-contract-consumption.md
```

Create a new ADR only when all are true:

- the decision is hard to reverse;
- the decision would surprise a future maintainer;
- there was a real trade-off.

## Acceptance Criteria

- All child plans are completed or explicitly deferred with reasons.
- Shared constants/types exports pass the reuse gate.
- Domain packages own major product behavior.
- Server adapters are thin enough to match the system-design direction.
- Web and extension consume shared contracts where appropriate.
- No UI changes were introduced by this track.
- Full verification commands and results are recorded.
- Documentation reflects final package responsibilities.
- Deferred work is explicit.

## Final Output Required

When executing this plan, report:

- final package boundary summary;
- child plan completion/deferment table;
- verification commands and results;
- docs updated;
- known residual risks;
- recommended next architecture or feature track.
