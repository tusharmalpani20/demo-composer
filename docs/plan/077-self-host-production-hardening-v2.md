# Self-Host Production Hardening V2 Plan

Date: 2026-06-22

Status: Planned.

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
```

Reason:

- verification should be stable first
- dogfood may reveal storage, upload, or operational recovery gaps

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

## Scope

Included:

- audit operations docs against current runtime behavior
- identify top operational risks for internal self-host use
- strengthen backup/restore rehearsal guidance
- clarify local storage permissions and cleanup responsibilities
- decide whether to implement storage reference inventory or only plan it
- decide Docker/Compose packaging scope
- decide rate-limit replacement strategy or document limitation more sharply
- add tests for any operator command/tooling introduced
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

## Candidate Work Areas

Choose a focused slice or split into separate follow-up plans.

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

### 2. Pick Focused Slice

Pick one:

- backup/restore rehearsal docs
- storage cleanup inventory plan/tool
- packaging docs/Compose improvement
- rate-limit strategy plan
- startup/env validation hardening

If more than one is important, create follow-up plans.

### 3. Implement Or Document

For docs-only slice:

- update relevant docs
- add examples
- keep alpha limitations explicit

For tooling slice:

- add conservative implementation
- default to read-only or dry-run
- add tests
- document usage and risks

### 4. Verify

- [ ] Run docs whitespace check.
- [ ] Run tests for any code touched.
- [ ] If backup/restore docs are changed, rehearse commands when practical and record assumptions.
- [ ] If packaging docs are changed, run the documented local path when practical.

### 5. Update Tracking

- [ ] Add implementation notes to this plan.
- [ ] Update master plan completion table if Phase 8 is complete.
- [ ] Add follow-up plans for deferred operational work.

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
