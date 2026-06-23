# Self-Host Ops Tooling V3 Plan

Date: 2026-06-23

Status: Planned.

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

Candidate slices:

- storage reference inventory and dry-run cleanup reporting
- production env report without secrets
- real backup/restore rehearsal
- Docker image or one-command packaging plan/prototype
- shared rate-limit backend plan or implementation
- object storage provider plan or implementation
- dependency audit process and accepted-risk recording

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

- [ ] Review plan `077`.
- [ ] Review current operations docs.
- [ ] Review local storage provider and DB schema if storage tooling is considered.
- [ ] Review rate-limit code if shared rate limiting is considered.
- [ ] Pick one slice and write it down before implementation.
- [ ] Move unrelated ops items to follow-up notes.

### 2. Design Conservative Behavior

For tooling:

- [ ] Default to read-only or dry-run.
- [ ] Print summaries without secrets.
- [ ] Require explicit confirmation before destructive behavior.
- [ ] Define exit codes.
- [ ] Define test fixtures.

For docs/rehearsal:

- [ ] Use disposable database and storage paths.
- [ ] Record commands and assumptions.
- [ ] Do not imply production readiness beyond what was run.

### 3. Implement Or Rehearse

- [ ] Add failing tests before code changes.
- [ ] Implement minimal tooling or docs change.
- [ ] Avoid broad packaging or infrastructure churn.
- [ ] Keep local file storage as the current default unless object storage is the selected slice.

### 4. Verify

- [ ] Run focused tests.
- [ ] Run server checks if code changes.
- [ ] Run `rtk docker compose config` if Compose changes.
- [ ] Run backup/restore rehearsal if selected and environment supports it.
- [ ] Record skipped commands with reasons.

### 5. Update Tracking

- [ ] Update operations docs.
- [ ] Update production readiness checklist.
- [ ] Add implementation notes to this plan.
- [ ] Update master plan phase tracking after implementation.

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
