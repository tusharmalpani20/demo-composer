# CI Smoke Workflow Coverage Plan

Date: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `105` of the alpha hardening and extension reliability track.

## Objective

Add the existing full server smoke workflow to CI safely, or document the concrete blocker if CI cannot run it deterministically yet.

The smoke workflow already exists in:

```text
apps/server/src/smoke/v1-workflows.db.integration.test.ts
apps/server/package.json -> test:smoke
```

The CI coverage should prove the current high-value alpha path:

```text
health/readiness
  -> first-run setup
  -> project creation
  -> capture session creation
  -> screenshot asset upload
  -> capture event creation
  -> capture completion
  -> guide generation and publish
  -> public guide lookup without storage_key leakage
  -> interactive demo generation
  -> hotspot creation
  -> demo publish
  -> public demo lookup without storage_key leakage
  -> organization invite creation
  -> public invite acceptance
  -> invited teammate project access
```

## Baseline From Completed Plan 104

Plan `104` completed documentation sync after domainization only. It changed architecture-facing docs and did not change runtime code, package metadata, dependencies, migrations, screenshots, generated assets, or app behavior.

Carry-forward item from plan `104`:

- CI smoke workflow coverage remained intentionally open for this child plan.
- This phase must inspect `.github/workflows/ci.yml`, DB setup ordering, and `apps/server` smoke execution before changing CI.

## Current Codebase Baseline

Current worktree expectation before implementation:

```bash
rtk git status --short
```

The implementation agent must stop and inspect any uncommitted changes before editing. Do not overwrite user or other-agent changes.

Current CI workflow:

```text
.github/workflows/ci.yml
```

Important current CI facts:

- The workflow has one `verify` job on `ubuntu-latest`.
- The job starts a `postgres:16` service with test credentials.
- The workflow writes `apps/server/.env-cmdrc` during CI with a `testing` environment.
- The workflow currently runs:
  - `pnpm --filter server test`
  - `pnpm --filter web test`
  - `pnpm --filter extension test`
  - `pnpm --filter server test:db:create`
  - `pnpm --filter server test:migrate`
  - `pnpm --filter server test:db`
  - `pnpm check-types`
  - `pnpm build`
  - `pnpm lint`
  - `git diff --check`
- The workflow does not currently run `pnpm --filter server test:smoke`.

Current server scripts:

```text
apps/server/package.json
```

Relevant scripts:

```text
test:db:create -> env-cmd -f .env-cmdrc -e testing -- tsx src/db/create-db.ts
test:migrate   -> env-cmd -f .env-cmdrc -e testing -- tsx src/db/migrate.ts up
test:db:drop   -> env-cmd -f .env-cmdrc -e testing -- tsx src/db/drop-db.ts
test:db        -> env-cmd -f .env-cmdrc -e testing -- vitest run --no-file-parallelism ...
test:smoke     -> env-cmd -f .env-cmdrc -e testing -- vitest run --no-file-parallelism src/smoke/v1-workflows.db.integration.test.ts
```

Current smoke test behavior:

- Uses `app.inject`, not a browser.
- Uses the real PostgreSQL test database through the server DB pool.
- Uses temporary local filesystem storage for uploaded screenshot bytes.
- Resets the smoke-owned workflow tables with one `TRUNCATE ... RESTART IDENTITY CASCADE` before each smoke test.
- Closes the Fastify app and database pool after the test.
- Exercises existing `/healthz`, `/readyz`, and `/api/v1` route behavior.

Known ordering risk:

- Prior closeout found that running DB integration tests and smoke tests concurrently or in the wrong order could deadlock around PostgreSQL table truncation.
- Serial DB-backed execution after a deterministic DB reset passed.
- This plan must make database ordering explicit. Do not add smoke coverage in a way that allows dirty or concurrent access to the same test database.

## Exact Files To Read Before Implementation

Required:

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/104-docs-architecture-sync-after-domainization.md
docs/plan/105-ci-smoke-workflow-coverage.md
.github/workflows/ci.yml
apps/server/package.json
apps/server/src/smoke/v1-workflows.db.integration.test.ts
apps/server/src/db/create-db.ts
apps/server/src/db/drop-db.ts
apps/server/src/db/migrate.ts
docs/development-setup.md
```

Read only if touched by the implementation:

```text
docs/production-readiness-checklist.md
docs/project-zoomout-status.md
apps/server/src/db/README.md
```

Do not rely on stale assumptions from older child plans if these files have changed.

## Exact Affected Files

Expected implementation files:

```text
.github/workflows/ci.yml
docs/plan/105-ci-smoke-workflow-coverage.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Conditional files, only if a narrow setup issue requires them:

```text
apps/server/package.json
apps/server/src/db/create-db.ts
apps/server/src/db/drop-db.ts
apps/server/src/db/migrate.ts
apps/server/src/smoke/v1-workflows.db.integration.test.ts
docs/development-setup.md
docs/production-readiness-checklist.md
docs/project-zoomout-status.md
apps/server/src/db/README.md
```

Files that should not be touched in this phase unless a deterministic CI blocker proves a setup-only defect:

```text
apps/server/src/modules/
apps/server/src/routes/
apps/web/
apps/extension/
packages/
```

## Routes And API Contracts

No route or API contract change is in scope.

The smoke workflow exercises these existing routes and route families:

```text
GET  /healthz
GET  /readyz
POST /api/v1/setup/first-run
POST /api/v1/projects
POST /api/v1/projects/:project_id/capture-sessions
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
PATCH /api/v1/projects/:project_id/capture-sessions/:capture_session_id
POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
POST /api/v1/projects/:project_id/guides/:guide_id/publish
GET  /api/v1/public/publish-links/:slug
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos
POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
POST /api/v1/organization/invites
POST /api/v1/public/invites/:invite_token/accept
GET  /api/v1/projects
```

The smoke test also asserts that public guide/demo snapshots emit asset file URLs in this shape, but it does not currently fetch the asset bytes:

```text
/api/v1/public/publish-links/:slug/assets/:asset_id/file
```

Implementation rule:

- If the CI smoke addition exposes route behavior failures, do not broaden this phase into product route fixes unless the failure is caused by CI/test setup itself.
- Product route bugs should be documented as leftovers and handled in a separate child plan.

## Schemas And Types

No schema, migration, shared type, domain package, or API payload contract changes are expected.

The smoke workflow should continue to validate current behavior through existing runtime routes. If `check-types` fails after CI/script edits, fix the CI/script/config issue rather than changing product types.

## Behavior Rules

CI behavior must satisfy these rules:

- Smoke tests must run serially with DB integration tests.
- Smoke tests must not share a dirty database with prior DB integration tests unless an explicit reset occurs immediately before smoke.
- Smoke tests must not run in parallel with any DB test command that can mutate the same `DB_NAME`.
- The CI workflow must fail loudly if database creation, migration, DB integration tests, or smoke tests fail.
- Keep the existing server, web, extension, typecheck, build, lint, and whitespace checks intact.
- Prefer explicit workflow steps over hiding sequencing in a new broad package script.
- If a new package script is added, preserve existing script names and document why the new script exists.
- Keep CI runtime deterministic. Avoid retries that hide real smoke failures.

Recommended CI sequencing:

```bash
pnpm --filter server test:db:drop
pnpm --filter server test:db:create
pnpm --filter server test:migrate
pnpm --filter server test:db
pnpm --filter server test:db:drop
pnpm --filter server test:db:create
pnpm --filter server test:migrate
pnpm --filter server test:smoke
```

The first `test:db:drop` should be tolerated because `drop-db.ts` uses `DROP DATABASE IF EXISTS` and refuses to drop outside testing runtime or non-test database names.

Alternative allowed approach:

- Add a separate isolated `server-smoke` CI job with its own Postgres service, env setup, DB create/migrate, and `test:smoke`.
- Use this if the existing `verify` job becomes too hard to reason about or if isolation is clearer than serial reset inside one job.
- If using a separate job, keep the same test-only env semantics and avoid duplicating secret-like values outside the workflow.

Do not choose an approach that runs `test:db` and `test:smoke` concurrently against the same database.

## Security And Permission Rules

- Do not commit real secrets.
- CI may use hard-coded local test credentials for the ephemeral GitHub Actions Postgres service only.
- Keep `NODE_ENV` and `DEV_TYPE` in testing mode for CI DB reset behavior.
- Preserve the `drop-db.ts` protections that refuse to drop non-test databases.
- Do not weaken environment validation, authentication, cookie settings, CORS handling, or production configuration to make smoke pass.
- Do not print session cookies, invite tokens, database URLs, or other sensitive values in new CI logs.
- Do not use production, staging, or developer-local databases from CI.

## Migration And Backwards Compatibility Notes

- No production migration is expected.
- CI may run existing migrations against the ephemeral test database.
- Existing local commands must remain compatible:
  - `pnpm --filter server run test:db:create`
  - `pnpm --filter server run test:migrate`
  - `pnpm --filter server run test:db:drop`
  - `pnpm --filter server run test:db`
  - `pnpm --filter server run test:smoke`
- If the implementation edits `apps/server/package.json`, preserve current script names and update docs only when behavior visible to contributors changes.
- If CI cannot support the smoke workflow deterministically, do not mark the phase complete as implemented. Document the blocker with exact failing command, output summary, and next action.

## Implementation Steps

1. Reread this plan, plan `104`, and the parent master plan.
2. Run `rtk git status --short` and inspect any uncommitted changes before editing.
3. Reread `.github/workflows/ci.yml`, `apps/server/package.json`, and `apps/server/src/smoke/v1-workflows.db.integration.test.ts`.
4. Confirm whether the current workflow should use one serial `verify` job or a separate isolated smoke job.
5. Reproduce the local deterministic DB reset and smoke sequence before changing CI if local Postgres is available.
6. Patch `.github/workflows/ci.yml` to include smoke coverage with explicit DB ordering.
7. Keep the CI env file generation scoped to test-only values. Do not introduce real secrets.
8. Run focused verification commands from this plan.
9. If a command cannot be run because local infrastructure is unavailable, document the reason and the closest completed verification.
10. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
11. Update the parent master plan only for truly completed phase items.
12. Commit only scoped changes.

## Test And Verification Plan

Required before implementation changes if local Postgres is available:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
rtk pnpm --filter server run test:smoke
```

Required after CI workflow changes:

```bash
rtk git diff --check
rtk pnpm --filter server check-types
rtk pnpm check-types
```

Required after CI workflow changes if local Postgres is available:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
rtk pnpm --filter server run test:db
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
rtk pnpm --filter server run test:smoke
```

Recommended when time permits:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm build
rtk pnpm lint
```

CI workflow syntax verification:

- Review `.github/workflows/ci.yml` indentation and GitHub Actions structure manually.
- If a YAML parser or local workflow linter is already available in the repo, run it.
- Do not add new workflow-lint dependencies in this phase only for syntax validation.

## Browser Validation Requirements

No browser validation is required for this phase.

Reason:

- The smoke test uses Fastify `app.inject` and server-side integration behavior.
- This phase changes CI/test infrastructure only.
- Real browser extension validation was handled by earlier extension reliability child plans.

## Documentation Update Rules

Update docs only when implementation changes the documented developer workflow or project status.

Likely docs handling:

- `docs/plan/105-ci-smoke-workflow-coverage.md`: always update after implementation.
- `docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md`: update only completed phase status/checklist items.
- `docs/development-setup.md`: update only if local smoke or DB reset commands change.
- `docs/production-readiness-checklist.md` or `docs/project-zoomout-status.md`: update only if CI smoke status is currently documented there and becomes stale.

## Explicit Non-Scope

- Adding new smoke scenarios beyond the existing v1 dogfood smoke workflow.
- Changing product route behavior.
- Changing API response shapes.
- Changing database schema or production migrations.
- Refactoring smoke test internals unless required for deterministic CI setup.
- Refactoring server modules, web code, extension code, shared packages, or domain packages.
- Adding retries to hide flaky failures.
- Adding new CI services unrelated to the existing server smoke workflow.
- Browser, extension, or UI validation.

## Completion Checklist

- [ ] Current CI workflow inspected.
- [ ] Current server smoke script and smoke test inspected.
- [ ] Worktree checked for unrelated changes before editing.
- [ ] CI smoke placement chosen with reasoning.
- [ ] CI updated to run `test:smoke` or blocker documented with exact evidence.
- [ ] DB ordering avoids dirty or concurrent smoke state.
- [ ] Existing CI coverage preserved.
- [ ] Focused verification run and recorded.
- [ ] Any skipped verification has a concrete reason.
- [ ] Docs updated only where needed.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

- Prefer the serial reset sequence inside the existing `verify` job unless a separate isolated `server-smoke` job is clearer after inspecting the final workflow.
- Do not mark this phase complete merely because local smoke passes. The goal is CI coverage, unless a concrete CI blocker is documented and accepted by the master plan.
- If local Postgres is unavailable during implementation, still update CI only after reasoning from the existing workflow and record the unavailable local infrastructure clearly in verification notes.
- The next phase after this plan should be able to trust whether CI covers the full server smoke workflow.
