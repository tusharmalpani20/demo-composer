# Self-Host Ops Tooling V3 Plan

Date: 2026-06-23

Status: Completed with follow-up notes.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 7 of the alpha follow-through master plan.

## Dependencies

Recommended after when URL config or deployment docs are touched:

```text
docs/plan/078-split-origin-url-hardening.md
```

Reason:

- self-host docs and packaging should use the final API-origin vs portal-origin terminology from split-origin hardening
- ops slices unrelated to URL config, such as storage inventory dry-run tooling, may start earlier if they stay isolated

## Goal

Move self-host operations beyond documentation-only guidance where a conservative tool is justified.

This implementation pass is narrowed to a production environment report that validates the same startup configuration and prints only non-secret summaries.

## Current Baseline

Plan `077` improved production startup validation and docs. Remaining self-host gaps:

- no storage reference inventory or dry-run cleanup command
- no one-command production packaging or Docker image
- no shared rate-limit backend
- no object storage provider
- no production env report
- no recorded backup/restore rehearsal against a disposable deployment

## Scope

This phase must choose one focused operational slice before implementation.

Selected operational slice:

- add a server-side production env report command
- reuse startup validation instead of creating a competing production-config rule set
- print safe summaries such as runtime mode, configured origins, storage path classification, numeric limits, and known operational limitations
- never print secret values such as `COOKIE_SECRET`, `DB_PASSWORD`, cookies, tokens, or raw credentials
- exit non-zero when startup validation fails

Carry-forward from plan `083`:

- no authoring leftovers belong in this self-host ops implementation
- manual browser smoke of the guide screenshot picker, guide editor polish, and demo editor polish should remain future authoring-focused work unless Phase 8 docs need to describe current alpha limitations

Candidate slices:

- storage reference inventory and dry-run cleanup reporting
- production env report without secrets
- real backup/restore rehearsal
- Docker image or one-command packaging plan/prototype
- shared rate-limit backend plan or implementation
- object storage provider plan or implementation
- dependency audit process and accepted-risk recording

Deferred from this implementation:

- storage reference inventory and dry-run cleanup reporting
- destructive storage cleanup
- real backup/restore rehearsal
- Docker image or one-command packaging
- shared rate-limit backend
- object storage provider
- dependency audit acceptance workflow beyond existing docs

## Implementation Result

Completed on 2026-06-30 local time.

This phase was implemented as the selected production environment report slice.

Implementation result:

- added `rtk pnpm --filter server env:report`
- added a server-side report builder that reuses startup validation before producing output
- report output is JSON and includes non-secret summaries for runtime/deployment mode, database config presence, cookie/CORS state, API and portal origins, local storage classification, upload/body-size limits, in-memory rate limiting, and known alpha operational limitations
- report output avoids `COOKIE_SECRET`, `DB_PASSWORD`, raw cookies, bearer tokens, invite tokens, and the local storage root path
- invalid production config exits non-zero through the same startup validation errors used by server startup
- operations, self-hosting, and production readiness docs now describe the command and its limits

Verification run:

```bash
rtk pnpm --filter server test -- production-env-report
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk git diff --check
```

Results:

- focused production env report suite passed with 2 tests
- full non-DB server suite passed with 252 tests
- server typecheck passed
- server lint passed
- whitespace check passed

Skipped commands:

- `rtk docker compose config` was not run because this slice did not change Compose files.
- DB-backed tests and smoke tests were not run because this slice does not touch database schema, persistence, or runtime routes.
- backup/restore rehearsal was not run because it remains a deferred operational slice.

Missed or deferred work to keep as follow-up candidates:

- storage reference inventory and dry-run cleanup reporting
- destructive storage cleanup with explicit confirmation
- real backup/restore rehearsal against disposable database and storage
- Docker image or one-command production packaging
- shared rate-limit backend for multi-instance deployments
- object storage provider
- dependency audit accepted-risk workflow

## Explicit Non-Goals

- Kubernetes or Terraform platform
- hosted SaaS operations
- destructive cleanup as a first step
- object storage and shared rate limiting in the same patch
- full observability platform integration

## Expected File Touches

Likely docs:

```text
docs/operations.md
docs/self-hosting.md
docs/production-readiness-checklist.md
docs/plan/084-self-host-ops-tooling-v3.md
docs/plan/master/002-alpha-follow-through-master-plan.md
```

Conditional code:

```text
apps/server/src/
apps/server/src/**/*.test.ts
scripts/
package.json
docker-compose.yml
```

## Implementation Plan

### 1. Select One Operational Risk

- [x] Review plan `077`.
- [x] Review current operations docs.
- [x] Review local storage provider and DB schema if storage tooling is considered. Not selected for this pass.
- [x] Review rate-limit code if shared rate limiting is considered. Not selected for this pass.
- [x] Pick one slice and write it down before implementation: production env report without secrets.
- [x] Move unrelated ops items to follow-up notes.

### 2. Design Conservative Behavior

For tooling:

- [x] Default to read-only or dry-run.
- [x] Print summaries without secrets.
- [x] Require explicit confirmation before destructive behavior. Not applicable; selected command is read-only.
- [x] Define exit codes.
- [x] Define test fixtures.

For docs/rehearsal:

- [x] Use disposable database and storage paths. Not applicable; no rehearsal was selected.
- [x] Record commands and assumptions.
- [x] Do not imply production readiness beyond what was run.

### 3. Implement Or Rehearse

- [x] Add failing tests before code changes.
- [x] Implement minimal tooling or docs change.
- [x] Avoid broad packaging or infrastructure churn.
- [x] Keep local file storage as the current default unless object storage is the selected slice.

### 4. Verify

- [x] Run focused tests.
- [x] Run server checks if code changes.
- [x] Run `rtk docker compose config` if Compose changes. Not needed; no Compose changes.
- [x] Run backup/restore rehearsal if selected and environment supports it. Not selected.
- [x] Record skipped commands with reasons.

### 5. Update Tracking

- [x] Update operations docs.
- [x] Update production readiness checklist.
- [x] Add implementation notes to this plan.
- [x] Update master plan phase tracking after implementation.

## Testing Plan

Likely commands:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk git diff --check
```

Conditional:

```bash
rtk docker compose config
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

## Acceptance Criteria

- Operators get either a tested tool or a precise implementation plan for the selected risk.
- Cleanup behavior, if any, is non-destructive by default.
- Docs remain alpha-honest.
- Backup, storage, packaging, object storage, and rate-limit limitations remain explicit unless implemented.
- Deferred ops work is recorded.

## Follow-Up Notes

If this plan selects only one operational slice, keep the other candidate slices in the missed/deferred section for the next ops plan.
