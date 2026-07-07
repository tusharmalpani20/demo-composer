# Production Hardening Readiness Plan

Date: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `108` of the alpha hardening and extension reliability track.

## Objective

Recheck remaining production-readiness gaps and either close narrow hardening items or convert larger work into explicit follow-up plans.

This phase should make readiness status truthful. It should not pretend alpha limitations are complete.

## Current Known Gaps

Known areas from repo docs and prior analysis:

- in-memory rate limiting for sensitive routes;
- local-only file storage warning and deployment implications;
- storage cleanup/retention tooling is not fully built;
- backup/restore rehearsal needs explicit verification;
- dependency audit expectations need repeatable commands/status;
- production checklist has items that must stay unchecked unless actually verified.

## Exact Files To Read Before Work

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/production-readiness-checklist.md
docs/operations.md
docs/roadmap.md
docs/project-zoomout-status.md
README.md
docs/backend-route-inventory.md
apps/server/src/app.ts
apps/server/src/config/production-hardening.config.ts
apps/server/src/config/production-env-report.ts
apps/server/src/config/production-env-report.test.ts
apps/server/src/ops/production-env-report.ts
apps/server/src/modules/file-storage/local-file-storage.provider.ts
apps/server/src/modules/file-storage/local-file-storage.provider.test.ts
apps/server/package.json
```

## Expected Affected Files

Likely docs:

```text
docs/production-readiness-checklist.md
docs/operations.md
docs/roadmap.md
docs/project-zoomout-status.md
docs/plan/108-production-hardening-readiness-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Conditional narrow implementation files:

```text
apps/server/src/config/production-hardening.config.ts
apps/server/src/config/production-env-report.ts
apps/server/src/config/*.test.ts
apps/server/src/ops/
apps/server/src/modules/file-storage/
apps/server/package.json
```

Do not implement a broad storage provider replacement, background job system, external rate-limit store, or hosted deployment automation in this phase unless the plan is explicitly narrowed and approved.

## Routes And API Contracts

No route/API contract changes are expected.

Sensitive route families to review for readiness docs:

```text
POST /api/v1/authentication/login
POST /api/v1/setup/first-run
POST /api/v1/public/publish-links/:slug/viewer-sessions
POST /api/v1/public/invites/:token/accept
```

If route behavior changes are required, they must preserve existing response envelopes and tests or be split into a dedicated follow-up plan.

## Schemas And Types

No shared schema/type changes are expected.

If production env report output is changed, keep it server-local unless another app/package consumes it.

## Behavior Rules

- Truthfully distinguish implemented hardening from documented operator responsibility.
- Do not mark checklist items complete without verification.
- Preserve current alpha warning around self-hosted usage.
- Preserve rate limiting behavior unless implementing a narrow, tested improvement.
- Prefer dry-run-first behavior for destructive cleanup tooling.
- Do not introduce automatic deletion of user files without explicit tests and docs.

## Security And Permission Rules

- Do not commit secrets.
- Do not print secrets in production env reports.
- Preserve auth/rate-limit protections on sensitive routes.
- Do not weaken CORS or cookie settings.
- Backup/restore docs must avoid leaking credentials in command examples.
- Cleanup docs must warn before destructive operations.

## Migration And Backwards Compatibility

- No database migration is expected by default.
- Existing local storage paths and files must remain compatible.
- Existing env var names should remain supported.
- If a new env var is required, document default behavior and compatibility.
- Existing production checklist items should remain conservative.

## Implementation Strategy

This plan should start as an audit.

Recommended order:

1. Reconcile production checklist against current code.
2. Reconcile operations docs against current scripts.
3. Verify rate-limit coverage and limitations.
4. Verify local storage backup/restore and cleanup story.
5. Verify dependency audit expectations.
6. Implement only narrow, low-risk hardening gaps that are clearly testable.
7. Create follow-up plans for broad work.

## Test And Verification Plan

Required for docs-only changes:

```bash
rtk git diff --check
```

Required if server code/config/scripts change:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm check-types
rtk git diff --check
```

Recommended if production env report changes:

```bash
rtk pnpm --filter server test -- production-env-report
rtk pnpm --filter server run env:report
```

Recommended if rate limiting changes:

```bash
rtk pnpm --filter server test -- app production-hardening
```

Recommended if storage cleanup/provider behavior changes:

```bash
rtk pnpm --filter server test -- file-storage capture-asset
```

## Browser Validation Requirements

No browser validation is required unless this phase changes web-facing production warnings, public viewer behavior, or browser-visible auth/session behavior.

If browser-visible behavior changes, validate the affected page or flow in the browser and document the result.

## Explicit Non-Scope

- Hosted SaaS deployment.
- Chrome Web Store packaging.
- Replacing local file storage with S3 or another provider.
- Building a full background job system.
- Building analytics.
- Building retention automation that deletes files without a dry-run-first design.
- UI redesign.
- Extension reliability fixes.

## Completion Checklist

- [ ] Production checklist rechecked against current code.
- [ ] Operations docs rechecked against current scripts.
- [ ] Rate-limit status documented truthfully.
- [ ] Storage cleanup/retention status documented truthfully.
- [ ] Backup/restore rehearsal status documented truthfully.
- [ ] Dependency audit status documented truthfully.
- [ ] Narrow implemented fixes tested, if any.
- [ ] Broad leftovers converted into explicit follow-up notes/plans.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

This phase is successful even if some production-readiness items remain incomplete, as long as they are accurately documented and prioritized.

Do not mark the app production-ready unless the checklist and verification evidence genuinely support that claim.
