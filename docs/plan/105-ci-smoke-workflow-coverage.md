# CI Smoke Workflow Coverage Plan

Date: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `105` of the alpha hardening and extension reliability track.

## Objective

Add the existing full server smoke workflow to CI safely, or document the blocker if CI cannot run it deterministically yet.

The smoke workflow should prove the high-value alpha path:

```text
first-run setup
  -> project
  -> capture session
  -> screenshots and capture events
  -> guide and interactive demo
  -> publishable links
  -> invite flow
```

## Current Baseline

Current server script:

```text
apps/server/package.json -> test:smoke
```

Current CI workflow:

```text
.github/workflows/ci.yml
```

Known issue from prior closeout:

- Running DB integration and smoke tests concurrently or in the wrong order caused a PostgreSQL deadlock during smoke table truncation.
- After resetting the test database and running DB-backed checks serially, `test:db` and `test:smoke` passed.

This plan must handle DB ordering explicitly.

## Exact Files To Read Before Work

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/099-contract-regression-docs-sync-and-architecture-closeout.md
.github/workflows/ci.yml
apps/server/package.json
apps/server/src/smoke/v1-workflows.db.integration.test.ts
apps/server/src/db/create-db.ts
apps/server/src/db/drop-db.ts
apps/server/src/db/migrate.ts
apps/server/.env-cmdrc
docs/development-setup.md
docs/production-readiness-checklist.md
```

## Expected Affected Files

Likely:

```text
.github/workflows/ci.yml
docs/plan/105-ci-smoke-workflow-coverage.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Conditional:

```text
apps/server/package.json
apps/server/src/smoke/
apps/server/src/db/
docs/production-readiness-checklist.md
docs/project-zoomout-status.md
```

Do not change product route behavior, schemas, migrations, web UI, extension code, or docs app pages unless a deterministic CI blocker requires a narrow test/setup fix.

## Routes And API Contracts

No API contract changes are in scope.

The smoke test may exercise many current route families. If adding CI coverage exposes a route behavior issue, fix it in a separate child plan unless it is strictly a test setup problem.

## Schemas And Types

No schema/type changes are expected.

If typecheck breaks due to CI script edits, fix the script/config issue rather than changing shared contracts.

## Behavior Rules

- CI must not run DB integration and smoke tests against a dirty or concurrently mutated database.
- Smoke should run after a deterministic DB drop/create/migrate sequence or in a separate isolated job/database.
- Keep existing test coverage intact.
- Prefer explicit CI steps over hiding complex sequencing in opaque scripts unless the repo already has that pattern.
- The workflow should fail loudly if migrations or smoke behavior fail.

## Security And Permission Rules

- Do not commit real secrets.
- CI should use test-only database credentials.
- Do not expose tokens or credentials in CI logs.
- Do not weaken production environment checks to make smoke pass.

## Migration And Backwards Compatibility

- No production migration is expected.
- Existing local scripts should remain compatible.
- If `apps/server/package.json` script composition changes, preserve current script names where possible.

## Implementation Steps

1. Reread this plan and the parent master plan.
2. Confirm worktree state and protect unrelated changes.
3. Inspect current CI PostgreSQL service, env setup, migration, DB test, and typecheck/build/lint steps.
4. Reproduce the intended smoke sequence locally.
5. Decide whether smoke belongs in the existing CI job or a separate job.
6. Patch CI with deterministic ordering and DB reset.
7. Run focused local verification.
8. Update readiness/status docs if CI smoke status changes.
9. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
10. Update the master plan only for completed phase status.

## Test And Verification Plan

Required local sequence:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
rtk pnpm --filter server run test:smoke
```

Required if CI or server scripts change:

```bash
rtk pnpm --filter server check-types
rtk pnpm check-types
rtk git diff --check
```

Recommended if DB setup changes:

```bash
rtk pnpm --filter server run test:db
```

CI syntax must be reviewed manually against GitHub Actions YAML rules.

## Browser Validation Requirements

No browser validation is required. This is CI/test infrastructure work.

## Explicit Non-Scope

- Adding new product smoke scenarios beyond the existing v1 smoke workflow.
- Fixing unrelated flaky tests.
- Changing production database migrations.
- Refactoring server route code.
- Extension dogfood validation.
- UI changes.

## Completion Checklist

- [ ] Existing CI workflow inspected.
- [ ] Local smoke sequence run and recorded.
- [ ] CI smoke placement chosen with reasoning.
- [ ] CI updated or blocker documented.
- [ ] DB ordering avoids dirty/concurrent smoke state.
- [ ] Focused verification run and recorded.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

If CI cannot run smoke because of infrastructure limits, document the blocker clearly and leave a future action item. Do not mark the CI smoke target complete unless CI actually runs it or the master plan explicitly accepts the documented limitation.
