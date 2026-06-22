# Self-Host Production Hardening V2 Plan

Date: 2026-06-22

Status: Completed with follow-up notes.

## Parent Master Plan

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

This is Phase 8 of the alpha hardening master plan.

## Goal

Make self-hosted operation safer and easier after the alpha product path is proven.

Target outcome:

```text
operator evaluates self-hosted Demo Composer
  -> understands required environment
  -> can run backup and restore rehearsal
  -> understands local storage responsibilities
  -> has a cleanup/retention path or documented limitation
  -> understands rate-limit and multi-instance limits
  -> has clearer deployment packaging guidance
```

This plan improves operational confidence without overstating production readiness.

## Dependencies

Can start after:

```text
docs/plan/070-verification-and-docs-sync.md
```

Recommended after:

```text
docs/plan/071-manual-portal-dogfood.md
docs/plan/076-extension-capture-reliability-v2.md
```

Reason:

- verification should be stable first
- dogfood may reveal storage, upload, or operational recovery gaps
- Phase 7 clarified split API/web extension setup; this plan should document self-host deployment inputs without taking on remaining browser capture reliability work

## Current Baseline

Current operations docs:

```text
docs/self-hosting.md
docs/operations.md
docs/production-readiness-checklist.md
docs/development-setup.md
```

Current runtime hardening:

- health endpoint
- readiness endpoint
- production CORS/cookie configuration checks
- upload/body size limits
- in-memory rate limiting for sensitive routes
- local file storage provider
- PostgreSQL migrations
- backup/restore expectations documented

Known limits:

- one-command production deployment packaging is deferred
- local file storage is only provider
- split API/web local development can produce browser-facing invite URLs with the API host unless public URL construction is portal-origin aware
- automated retention cleanup is not built
- rate limiting is in-memory
- multi-instance production deployments need shared rate-limit state
- operators are responsible for DB and local file storage backups
- startup config validation exists, but it does not yet validate all production operator checklist requirements

## Scope

Included:

- audit operations docs against current runtime behavior
- identify top operational risks for internal self-host use
- strengthen backup/restore rehearsal guidance
- clarify local storage permissions and cleanup responsibilities
- implement the selected startup/env validation slice
- document the current limits for cleanup, packaging, and rate limiting sharply enough for internal self-host use
- add tests for any startup validation behavior introduced
- keep docs alpha-honest

## Explicit Non-Goals

- hosted SaaS packaging
- Kubernetes/Terraform production platform
- object storage provider unless separately approved
- distributed rate limiter implementation unless selected as the focused slice
- destructive cleanup without conservative dry-run behavior
- analytics/observability platform integration
- custom domains
- billing

## Expected File Touches

Expected docs:

```text
docs/operations.md
docs/production-readiness-checklist.md
docs/self-hosting.md
docs/plan/077-self-host-production-hardening-v2.md
```

Likely source files only if tooling is selected:

```text
apps/server/src/
apps/server/src/**/*.test.ts
scripts/
package.json
pnpm-workspace.yaml
```

Conditional docs:

```text
README.md
CONTRIBUTING.md
docs/project-zoomout-status.md
docs/plan/master/001-alpha-hardening-master-plan.md
docs/plan/<new-ops-follow-up-plan>.md
```

Any storage cleanup or backup-related code must ship with conservative tests and dry-run behavior before destructive behavior is considered.

## Prior Phase Carry-Forward Review

From `docs/plan/076-extension-capture-reliability-v2.md`:

- manual unpacked-extension browser verification, automatic click diagnostics, manual screenshot fallback events, background message delivery diagnostics, optional portal URL edit flow, and extension-generated guide/demo reruns remain extension reliability work
- this self-host plan should not implement those browser reliability items
- this plan should include the self-host documentation impact of split API/web deployments: API origin, portal origin, CORS origins, and extension portal URL setup should be clear in operator docs

## Candidate Work Areas

Selected focused slice:

- production startup/env validation and operator documentation

Deferred follow-up slices:

- storage reference inventory and dry-run cleanup tooling
- one-command production packaging or Docker image work
- shared rate-limit backend for multi-instance deployments
- object storage support

### Backup And Restore Rehearsal

Improve docs so operators can test:

- PostgreSQL backup
- local storage backup
- restore to clean database and storage path
- migration after restore
- verification of project, capture asset, guide, public guide, demo viewer

### Storage Cleanup And Retention

Options:

- docs-only retention guidance
- SQL inventory queries for referenced files/assets
- dry-run command to report unreferenced local files
- later cleanup command with explicit confirmation

Guardrail:

- do not delete files automatically in first slice
- if cleanup tooling is implemented, default to dry-run

### Deployment Packaging

Options:

- improve single-machine Compose example
- add Dockerfile plan
- document reverse proxy example
- document env validation checklist

Avoid claiming one-command production deployment unless it is actually built and tested.

### Rate Limiting

Options:

- document in-memory limit clearly
- design shared rate-limit storage for later
- implement Redis/Postgres-backed rate limiter only in a focused plan

### Startup/Env Validation

Options:

- improve startup config errors
- add production env report
- test missing/unsafe env combinations

## Implementation Plan

## Implementation Result: 2026-06-23

Completed slice:

- Added production startup validation for `SERVER_PORT`, `DB_PORT`, and `DB_MAX_POOL` positive-integer values.
- Added production startup validation for explicit `DEMO_COMPOSER_DEPLOYMENT_MODE` and `DEMO_COMPOSER_ONBOARDING_MODE` values.
- Added production startup validation for absolute, non-default durable `DEMO_COMPOSER_LOCAL_STORAGE_ROOT`.
- Added production startup validation for absolute `http` or `https` `API_URL`.
- Preserved existing production cookie secret and CORS validation precedence.
- Updated self-hosting, operations, and production readiness docs with validated startup settings, backup/restore rehearsal expectations, manual cleanup limits, in-memory rate-limit limits, and split API/web extension setup.

Verification run:

```bash
rtk pnpm --filter server test -- src/config/startup.config.test.ts
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter server build
rtk git diff --check
```

Results:

- Startup config suite passed with 11 tests.
- Server test suite passed with 41 files and 247 tests.
- Server typecheck passed.
- Server lint passed.
- Server build passed.
- Whitespace check passed.

Missed or deferred work to keep as follow-up candidates:

- Storage reference inventory and dry-run cleanup tooling.
- One-command production packaging or Docker image work.
- Shared rate-limit backend for multi-instance deployments.
- Object storage provider support.
- Production env report/logging that summarizes validated settings without printing secrets.
- Actual backup/restore rehearsal against a disposable deployment environment.

### 1. Audit Current Operations Surface

Read:

```text
docs/self-hosting.md
docs/operations.md
docs/production-readiness-checklist.md
docs/development-setup.md
apps/server/src/config/production-hardening.config.ts
apps/server/src/config/runtime.config.ts
apps/server/src/config/cors.config.ts
apps/server/src/config/cookie.config.ts
apps/server/src/modules/file-storage/local-file-storage.provider.ts
docker-compose.yml
.github/workflows/ci.yml
```

Record:

- docs that are stale
- runtime behavior that lacks docs
- operational risks not addressed
- whether implementation is needed or docs are enough

### 2. Selected Slice: Startup/Env Validation

Implement production startup validation for the highest-risk checklist items that are currently only documented:

- valid `SERVER_PORT`
- valid database port and pool values
- explicit production deployment/onboarding modes
- explicit production local storage root
- explicit production public API URL

Document:

- what startup validates
- what remains operator-verified
- backup/restore rehearsal steps
- split API/web self-host inputs, including extension portal URL setup
- rate-limit and cleanup limitations

### 3. Implement Or Document

For docs-only slice:

- update relevant docs
- add examples
- keep alpha limitations explicit

For this slice, do not add cleanup tooling or deployment packaging.

### 4. Verify

- [x] Run docs whitespace check.
- [x] Run startup config tests.
- [x] Run server tests if the startup change has wider config impact.
- [ ] If backup/restore docs are changed, rehearse commands when practical and record assumptions. Not run in this slice; docs now require a disposable rehearsal environment.
- [x] If packaging docs are changed, run the documented local path when practical. No packaging docs or Compose files changed.

### 5. Update Tracking

- [x] Add implementation notes to this plan.
- [x] Update master plan completion tracking after implementation.
- [x] Record missed/deferred production hardening items for the next master-plan wave.
- [x] Update master plan completion table if Phase 8 is complete.
- [x] Add follow-up plans for deferred operational work if they are specific enough to act on. Deferred items are recorded here and in the master plan; no child follow-up files were created in this slice.

## Acceptance Boundary

This phase can be marked complete when:

- production startup validation rejects the selected unsafe/missing env combinations with clear errors
- docs explain the validated env surface and the operator-only checks
- backup/restore rehearsal guidance is more concrete
- split API/web and extension portal URL setup are documented for self-host operators
- deferred cleanup, packaging, object storage, and shared rate limiting work are preserved as follow-up candidates

## Testing Plan

Docs-only minimum:

```bash
rtk git diff --check
```

If server config/tooling changes:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server test:db
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

If Docker/Compose changes:

```bash
rtk docker compose config
```

Run more deployment commands only if the selected slice requires them and the environment supports them.

## Acceptance Criteria

- Operational risk addressed by the selected slice is clearly improved.
- Docs remain alpha-honest and do not claim full production readiness.
- Backup/restore expectations remain tied to both PostgreSQL and local file storage.
- Storage cleanup guidance is conservative.
- Multi-instance rate limiting remains clearly unresolved unless actually implemented.
- Any operator tooling is tested and defaults to non-destructive behavior.
- Relevant docs are updated.
- Verification commands for touched areas pass or skipped commands are explained.

## Documentation Updates

Expected depending on selected slice:

```text
docs/operations.md
docs/production-readiness-checklist.md
docs/self-hosting.md
docs/development-setup.md
docs/plan/077-self-host-production-hardening-v2.md
```

Conditional:

```text
README.md
docker-compose.yml
docs/roadmap.md
docs/project-zoomout-status.md
docs/plan/master/001-alpha-hardening-master-plan.md
```

## Suggested Commit Shape

Use focused commit names:

```text
Document backup restore rehearsal
Plan local storage cleanup tooling
Clarify self-host rate limit limits
Improve self-host compose guidance
```

## Follow-Up Plans

Possible follow-ups:

- object storage provider support
- shared rate-limit backend
- Docker image packaging
- storage cleanup dry-run command
- automated retention policies
- production observability hooks
