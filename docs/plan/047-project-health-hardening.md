# Project Health Hardening Plan

Date: 2026-06-13

Status: Implemented on 2026-06-13.

## Goal

Stabilize Demo Composer after the first working capture-to-guide loop so the project is easier to run, verify, maintain, and extend before starting the larger interactive demo product.

This is not a new product feature. It is a hardening pass around the foundation we have already built:

```text
capture source material
  -> guide generation
  -> guide editing
  -> preview
  -> publish
  -> public reader
```

The target outcome is a repo that has:

- a clean current-product backend path
- reliable test commands
- documented local setup and verification
- reduced lint/config noise
- clearer deployment/runtime expectations
- an updated project status document that reflects the real implementation state

This should happen after `docs/plan/046-public-guide-access-controls.md`, which is now implemented.

## Why This Comes Next

The project has moved from early scaffolding to a real MVP-shaped application:

- backend modules exist for setup, auth, projects, captures, guides, publish links, and file storage
- the web portal can complete the internal documentation loop
- the Chrome extension can record screenshot-backed capture events
- public guide publishing works through immutable snapshots
- tests are broad across server, web, and extension

The risk now is not lack of feature code. The risk is accumulated project friction:

- the current backend has both `src/modules/*` and older `src/module/*` trees, and the older tree is still reachable through `root_router/*` and `passport.config.ts`
- lint passes but still reports many server warnings
- DB integration tests depend on external `.env-cmdrc` configuration and are easy to skip
- setup/development commands are scattered across memory, package scripts, and prior conversation
- the status doc should stay current as hardening changes the actual project shape
- production runtime requirements are not documented strongly enough for open-source users

Before opening the next big domain, especially interactive demos, we should tighten the foundation.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md
docs/adr/0008-rebuild-in-place-preserve-decision-docs.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0017-deployment-aware-onboarding-mode.md
docs/adr/0018-web-first-run-setup-from-day-one.md
docs/adr/0019-separate-web-and-server-apps.md
```

Important implications:

- the intended current product path is the newer `apps/server/src/modules/*` backend; any remaining `apps/server/src/module/*` runtime wiring must be audited before deletion
- do not rewrite working product behavior during this hardening pass
- keep tests behavior-focused and avoid broad refactors
- preserve the web/server app split
- preserve `.env-cmdrc`-based DB testing support
- do not introduce interactive demo schemas or AI in this slice
- keep domain-oriented module boundaries intact

## Scope

Included:

- run and document the full non-DB verification suite
- run and document the DB integration suite using `.env-cmdrc`
- identify and fix any DB integration failures
- reduce or isolate server lint warnings that come from stale legacy code/configuration
- clarify whether old `apps/server/src/module/*` code is still needed
- either remove unreachable legacy backend code or mark still-reachable legacy routes explicitly
- document local setup, environment variables, database setup, migration, test, and build commands
- update `docs/project-zoomout-status.md` after the hardening pass
- add a short project readiness checklist
- keep commits small and reversible

Excluded:

- new user-facing product features
- additional public guide access-control feature work beyond what was implemented in `046`
- interactive demo implementation
- analytics
- AI
- role/member invitation flows
- package extraction into domain packages
- replacing the custom web router
- adding React Query
- switching storage providers
- redesigning UI screens
- changing auth/session semantics

## Current Health Baseline

As of the post-`046` verification pass on 2026-06-13:

```text
focused server publish/access tests: 21 passed
focused web publish/access tests: 99 passed
focused publish DB integration tests: 13 passed
extension tests: 57 passed
check-types: passed
build: not rerun after 046 in the focused access-control pass
lint: passed with server warnings
```

Known caveat:

- The focused schema + publish DB integration tests pass, but the full `server test:db` script should still be rerun during this hardening pass.
- `rtk pnpm lint` exits successfully but reports many warnings, mostly from server env vars and older backend code.
- Most current product route registration uses `apps/server/src/modules/*`.
- `apps/server/src/app.ts` still registers `index_root_routes`, and `root_router/*` plus `passport.config.ts` still import older `apps/server/src/module/*` code.

## Workstream 1: Verification Baseline

Run and record the expected verification commands.

Non-DB:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

DB-backed:

```bash
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
rtk pnpm --filter server run test:db
```

If DB setup should be reset:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
rtk pnpm --filter server run test:db
```

Acceptance:

- all non-DB tests pass
- all DB integration tests pass against `.env-cmdrc` testing config
- any required database setup assumptions are documented
- failures are fixed before broader cleanup begins

## Workstream 2: Legacy Backend Boundary

Current server layout includes:

```text
apps/server/src/modules/*  -> current product modules
apps/server/src/module/*   -> older legacy-style modules
```

The active `build()` route wiring imports and registers current modules from `src/modules/*` for:

- public instance
- first-run setup
- authentication session
- project
- capture session
- capture asset
- capture event
- guide
- publish

The same `build()` function also registers:

```text
index_root_routes -> root_router/* -> apps/server/src/module/*
configure_passport -> apps/server/src/module/authentication/service/authentication.service
```

That means `src/module/*` is not safe to delete blindly. The hardening pass should first identify whether those old routes/auth hooks are still needed, duplicated by the newer session/auth modules, or vestigial.

Recommended approach:

1. List every runtime import from `apps/server/src/module/*`.
2. List every route currently exposed through `index_root_routes`.
3. Compare those routes against the newer `apps/server/src/modules/*` contracts.
4. Decide whether each old route is still required, duplicated, or unused.
5. Record the audit in `docs/backend-route-inventory.md` before deleting anything.
6. If duplicated/unused, remove route registration first and prove tests/build still pass.
7. If the old passport hook is unused by cookie/session auth, remove or replace it.
8. If old files become unreachable, remove them in a dedicated commit.
9. If deletion is too risky for this pass, mark the tree explicitly with a `LEGACY.md` note and exclude it from lint only if the current product path remains covered.

Preferred outcome:

```text
remove old root route registration and delete unreachable legacy module files
```

Reasoning:

- reduces lint warnings
- removes old ORCA-shaped code from the active product
- makes onboarding easier
- avoids future edits landing in the wrong module tree

Acceptance:

- `rtk pnpm --filter server build` still passes
- `rtk pnpm --filter server test` still passes
- DB tests still pass
- lint warning count meaningfully drops
- no current product route disappears
- a route inventory document exists before route deletion
- old API routes are either intentionally preserved and documented, or removed with tests proving the current product path still works

## Workstream 3: Lint And Config Noise

Current lint passes but reports warnings around:

- undeclared env vars in `turbo.json`
- older backend files using `any`
- unused legacy values
- minor server cleanup issues

Recommended scope:

- add legitimate server env vars to `turbo.json` `globalEnv`
- remove stale legacy files if workstream 2 proves they are no longer reachable
- fix simple warnings in current product files where low-risk
- avoid broad type rewrites in legacy code if it is going away

Likely env vars to review:

```text
NODE_ENV
DEV_TYPE
JWT_KEY
TZ
SERVER_PORT
COOKIE_SECRET
COOKIE_DOMAIN
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
DB_MAX_POOL
AUTH_REDIRECT_URL
DEMO_COMPOSER_DEPLOYMENT_MODE
DEMO_COMPOSER_ONBOARDING_MODE
```

Acceptance:

- `rtk pnpm lint` remains passing
- warnings are reduced or intentionally documented
- no env var required by server runtime is omitted from Turbo env dependency tracking

## Workstream 4: Setup And Operations Documentation

Add or update a focused developer setup document.

Recommended file:

```text
docs/development-setup.md
```

Content to include:

- required tooling:
  - Node version
  - pnpm version
  - PostgreSQL requirement
- `.env-cmdrc` shape and environments:
  - development
  - testing
- database commands:
  - create DB
  - migrate up/down
  - run DB tests
- app commands:
  - server dev
  - web dev
  - extension dev/build
- storage configuration:
  - `DEMO_COMPOSER_LOCAL_STORAGE_ROOT`
  - `DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES`
- public URL/API URL expectations:
  - `API_URL`
  - `VITE_DEMO_COMPOSER_API_URL`
- first-run setup/onboarding modes
- verification commands
- common failure cases

Also update the existing root `README.md` so it points to the deeper setup and readiness docs.

Acceptance:

- a new contributor can bootstrap the project from docs
- testing DB setup is explicit
- extension configuration expectations are clear
- no secrets are committed

## Workstream 5: Project Status Refresh

Update:

```text
docs/project-zoomout-status.md
```

Refresh it to include:

- implemented plan count after `046`
- current test counts if useful
- current product maturity:
  - internal guide loop mostly built
  - interactive demo not started
  - AI deferred
- current known debt:
  - legacy backend tree status
  - old root route/passport wiring status
  - lint warning status
  - DB integration test status
- recommended next product direction after hardening

Acceptance:

- status doc matches actual code
- "Not Built Yet" does not incorrectly list implemented features
- "Recommended Next Direction" reflects the next domain decision

## Workstream 6: Production Readiness Checklist

Add a short checklist document.

Recommended file:

```text
docs/production-readiness-checklist.md
```

Include:

- environment variables required
- cookie/security settings
- CORS allowed origins
- database migration command
- file storage location and backup concern
- public URL/API URL settings
- extension self-host URL configuration
- max upload size
- first-run setup mode
- logging level
- build commands
- smoke test flow:
  - create first org/user
  - login
  - create project
  - create manual capture session
  - upload screenshots
  - create guide
  - publish guide
  - open public guide

Acceptance:

- checklist is short enough to use before deployment
- no feature implementation is required by the checklist itself

## Testing Plan

This is mostly cleanup and documentation, but tests still matter.

If deleting or moving legacy backend code:

- run server build
- run server non-DB tests
- run server DB tests
- run full typecheck
- run full lint

If changing env config:

- run `rtk pnpm lint`
- run `rtk pnpm build`
- verify Turbo no longer warns for known current env vars where practical

If adding docs only:

- run `rtk git diff --check`
- optionally run `rtk pnpm build` because docs app exists in the monorepo

Recommended final verification:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm --filter server run test:db
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

## Implementation Sequence

1. Run baseline verification and record failures.
2. Run DB integration tests against `.env-cmdrc` testing config.
3. Fix DB/test failures if any.
4. Audit imports and route wiring for `apps/server/src/module/*`, `root_router/*`, and `passport.config.ts`.
5. Record the current route/import audit in `docs/backend-route-inventory.md`.
6. Decide whether old root routes are still part of the supported API surface.
7. Remove duplicated/unneeded old route registration first, then delete unreachable legacy backend files in a dedicated commit.
8. Update Turbo env var tracking and fix low-risk lint warnings in current product files.
9. Add `docs/development-setup.md`.
10. Add `docs/production-readiness-checklist.md`.
11. Refresh `docs/project-zoomout-status.md`.
12. Run full verification again.

## Acceptance Criteria

- Full non-DB verification passes.
- DB integration verification passes or the blocker is documented with exact failing command/output.
- Current backend product path is clearly separated from old root route/passport wiring.
- Backend route inventory documents current, legacy, and removed route surfaces.
- Legacy backend code is removed, migrated, or explicitly quarantined with documented route impact.
- Server lint warning noise is reduced meaningfully.
- Development setup docs exist and are accurate.
- Production readiness checklist exists.
- Project zoomout status reflects the current codebase.
- No guide/capture/publish behavior regresses.
- No new product domain is introduced.

## Risks And Tradeoffs

- Removing legacy code may reveal hidden imports or old routes. That is useful signal, but route registration should be removed separately from file deletion so behavior changes are reviewable.
- Some lint warnings may come from old infrastructure code that is not worth fixing deeply. Prefer deletion or quarantine over cosmetic rewrites.
- DB integration tests depend on a real PostgreSQL testing environment. If the environment is missing, do not fake success; document the exact setup gap.
- Hardening work does not create visible user features, but it lowers the cost of all future features.

## Commit Plan

Suggested small commits:

```text
test: record project verification baseline
chore: retire old root route wiring
chore: remove unreachable legacy server modules
chore: reduce server env lint noise
docs: add development setup guide
docs: add production readiness checklist
docs: refresh project status after hardening
```

Access-control commits from `046` are already separate from this hardening plan.
