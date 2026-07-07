# Production Hardening Readiness Plan

Date: 2026-07-07

Last reviewed: 2026-07-07

Status: Completed on 2026-07-07.

## Recheck Notes

Rechecked on 2026-07-07 against master plan `004`, completed child plan `107`, and the current production-readiness/server-hardening baseline.

Findings:

- The plan aligns with master plan `004`: it is audit-first, focuses on production readiness gaps, preserves extension reliability leftovers as future work, and requires focused verification for any server hardening.
- The plan aligns with completed plan `107`: it does not reopen popup refactor work, does not treat true toolbar-popup manual validation as closed, and keeps the direct extension-page duplicate event-index follow-up out of scope unless a later focused plan takes it on.
- One verification ambiguity was fixed during this recheck: DB-backed smoke verification is required only when implementation changes or adds smoke-status claims, not merely because existing docs mention completed child plan `105`.
- One completion ambiguity was fixed during this recheck: larger production-readiness gaps must become explicit follow-up plan candidates with owner/scope/verification notes, not vague leftovers.
- No contradictions, stale assumptions, unclear ownership, missing security rules, migration gaps, browser-validation gaps, or unsafe implementation requirements remain after this recheck.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `108` of the alpha hardening and extension reliability track.

## Objective

Recheck the remaining production-readiness gaps after completed child plan `107` and either:

- close narrow, testable hardening/documentation gaps; or
- leave larger operational work explicitly documented as future production hardening.

This phase is a truthfulness and readiness-closeout phase. It must not pretend Demo Composer is fully production-ready unless the checklist and verification evidence genuinely support that claim.

## Source Of Truth From Completed Plan 107

Plan `107` completed on 2026-07-07 and was post-implementation rechecked.

Relevant carry-forward:

- `apps/extension/src/App.tsx` was reduced by extracting pure popup helpers into `apps/extension/src/popup/helpers.ts`.
- No popup JSX, event handlers, dependency construction, Chrome API boundaries, extension API request construction, storage behavior, portal URL behavior, capture lifecycle orchestration, popup copy, or CSS classes changed.
- Browser validation was not required for `107` because it was pure helper extraction only.
- True Chrome toolbar-popup manual capture remains unvalidated.
- The direct extension-page duplicate event-index follow-up after automatic clicks remains out of scope.
- For this plan, extension-specific leftovers are documentation/future-work items only unless the user explicitly expands scope to a focused extension reliability fix.

## Current Codebase Baseline

Baseline checked while expanding this plan on 2026-07-07:

- `rtk git status --short` was clean before editing this plan.
- At expansion time, master plan `004` had child plans `100` through `107` completed and this plan had not been implemented yet.
- `README.md`, `docs/production-readiness-checklist.md`, `docs/operations.md`, `docs/self-hosting.md`, `docs/roadmap.md`, and `docs/project-zoomout-status.md` already document alpha limitations around:
  - local file storage only;
  - manual backup/restore responsibility;
  - no automated retention cleanup;
  - in-memory rate limiting;
  - no one-command production deployment packaging;
  - true toolbar-popup manual extension validation still pending.
- `apps/server/src/app.ts` applies in-memory rate limiting to sensitive route families and `apps/server/src/app.test.ts` explicitly proves buckets are not shared across app instances.
- `apps/server/src/config/production-env-report.ts` builds a secret-safe production environment report with non-secret summaries for runtime/deployment, database config presence, cookies, CORS, API/public web origins, local storage classification, limits, in-memory rate limit config, and known operational limitations.
- `apps/server/src/config/production-env-report.test.ts` verifies the report omits `COOKIE_SECRET`, `DB_PASSWORD`, URL credentials, URL query secrets, URL paths, and the raw local storage root path.
- `apps/server/src/modules/file-storage/local-file-storage.provider.ts` is the only storage provider and includes safe storage-key checks, upload size enforcement, best-effort deletion, and local filesystem reads/writes.
- `docs/production-readiness-checklist.md` keeps checklist items unchecked and operator-owned; this phase must preserve that conservatism unless a specific item is verified by the implementation agent in the target environment, which is not expected.

## Current Known Gaps

The following are known production-readiness gaps and should remain visible unless actually closed:

- Rate limiting is in-memory and suitable only as a single-process alpha protection, not multi-instance abuse protection.
- Local file storage is the only storage provider.
- Operators must back up PostgreSQL and local file storage together.
- Backup/restore rehearsal is documented but not automatically verified by the app.
- Automated retention cleanup is not built.
- Manual local storage deletion is dangerous unless references are checked and a restorable backup exists.
- Dependency audit is an operator command/status, not a CI-enforced production gate in this plan.
- One-command production deployment packaging is deferred.
- True Chrome toolbar-popup manual capture validation remains pending.
- Direct extension-page duplicate event-index follow-up remains a future focused reliability item.

## Exact Files To Read Before Implementation

Required plan/source docs:

```text
docs/plan/108-production-hardening-readiness-plan.md
docs/plan/107-extension-popup-refactor-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/production-readiness-checklist.md
docs/operations.md
docs/self-hosting.md
docs/roadmap.md
docs/project-zoomout-status.md
README.md
docs/backend-route-inventory.md
docs/oss-alpha-summary.md
docs/v1-dogfood-smoke-suite.md
```

Required server code/config:

```text
apps/server/package.json
apps/server/src/app.ts
apps/server/src/app.test.ts
apps/server/src/config/startup.config.ts
apps/server/src/config/production-hardening.config.ts
apps/server/src/config/production-env-report.ts
apps/server/src/config/production-env-report.test.ts
apps/server/src/config/public-web-url.config.ts
apps/server/src/config/cors.config.ts
apps/server/src/config/cookie.config.ts
apps/server/src/ops/production-env-report.ts
apps/server/src/modules/file-storage/local-file-storage.provider.ts
apps/server/src/modules/file-storage/local-file-storage.provider.test.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-asset/capture-asset.routes.test.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/publish/publish.service.ts
```

Read only if the audit finds a concrete adjacent gap:

```text
.github/workflows/ci.yml
apps/server/src/smoke/v1-workflows.db.integration.test.ts
apps/server/src/db/**/*
apps/web/src/**/*
apps/extension/src/**/*
packages/**/*
```

Rules:

- If the implementation remains docs-only, do not read or modify broad app surfaces beyond the files needed to verify doc accuracy.
- If a server code gap is found, keep the fix narrow and testable. Do not start a broad production architecture rewrite inside this phase.

## Exact Affected Files

Expected docs-only affected files:

```text
docs/production-readiness-checklist.md
docs/operations.md
docs/self-hosting.md
docs/roadmap.md
docs/project-zoomout-status.md
README.md
docs/backend-route-inventory.md
docs/oss-alpha-summary.md
docs/plan/108-production-hardening-readiness-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Conditional narrow server files if the audit proves a small hardening/doc-command gap:

```text
apps/server/src/config/production-hardening.config.ts
apps/server/src/config/production-env-report.ts
apps/server/src/config/production-env-report.test.ts
apps/server/src/ops/production-env-report.ts
apps/server/src/app.ts
apps/server/src/app.test.ts
apps/server/src/modules/file-storage/local-file-storage.provider.ts
apps/server/src/modules/file-storage/local-file-storage.provider.test.ts
apps/server/package.json
```

Files out of scope unless this plan is explicitly revised first:

```text
apps/web/**/*
apps/extension/**/*
apps/docs/**/*
packages/**/*
apps/server/src/db/migrations/**/*
pnpm-lock.yaml
package.json
turbo.json
.github/workflows/**/*
docs/assets/**/*
```

Conditional exceptions:

- Touch `.github/workflows/ci.yml` only if the audit discovers it contradicts the already completed child plan `105`; otherwise leave CI unchanged.
- Touch `apps/web/**/*` or `apps/extension/**/*` only if a production-readiness doc references a broken command that cannot be corrected without a minimal config fix. Browser-visible behavior is otherwise out of scope.
- Touch `packages/**/*` only if a shared contract import is broken by an already-existing code error. Creating new shared production-hardening packages is out of scope.

## Routes And API Contracts

No route/API contract changes are expected.

Route families to audit for readiness documentation and tests:

```text
GET  /healthz
GET  /readyz
POST /api/v1/authentication/login
POST /api/v1/setup/first-run
POST /api/v1/public/publish-links/:slug/viewer-sessions
POST /api/v1/public/invites/:token/accept
GET  /api/v1/public/publish-links/:slug/assets/:asset_id
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
```

Current behavior to preserve unless a narrow tested bug fix is explicitly made:

- `/healthz` returns liveness without a database dependency.
- `/readyz` returns `200` only when the database readiness check succeeds and `503` without leaking database URLs on failure.
- Sensitive `POST` routes are rate-limited by method, route family, and client IP.
- Rate-limit responses use status `429`, a `retry-after` header, and the existing error envelope:

```json
{
  "error": {
    "type": "rate_limited",
    "message": "Too many requests. Try again later."
  }
}
```

- Rate-limit buckets are in-memory and not shared between app instances.
- Capture asset uploads continue to enforce configured upload limits and local storage key safety.
- Published asset reads continue to serve only assets referenced by accessible published snapshots.

If a route behavior change is required:

- keep the existing response envelope unless the plan is revised;
- update focused tests first;
- update route inventory and readiness docs;
- do not change public URLs, method names, parameter names, auth/session behavior, cookie behavior, or publish access semantics without a dedicated follow-up plan.

## Schemas And Types

No shared schema, Zod API contract, database schema, or package type change is expected.

Server-local types to keep local:

```text
ProductionEnvReport
RateLimitBucket
FileStorageProviderName
StoredFile
ReadStoredFile
```

Rules:

- Keep production environment report output server-local unless another app/package already consumes it.
- Do not move production hardening config into `@repo/types`, `@repo/constants`, or a domain package in this phase.
- Do not add database migrations for retention, backup, storage providers, or rate-limit state in this phase.
- If `ProductionEnvReport` changes, update `production-env-report.test.ts` and docs describing report fields.
- If a new environment variable is introduced, document default behavior, production behavior, compatibility, and secret-handling expectations.

## Behavior Rules

Production readiness docs must distinguish:

- implemented app behavior;
- startup/config validation;
- CI/local verification;
- operator-owned deployment steps;
- known alpha limitations;
- future production hardening.

Checklist behavior:

- Do not check off `docs/production-readiness-checklist.md` items on behalf of an unknown operator environment.
- Do not mark backup/restore as complete unless a restore rehearsal was actually run in an isolated environment during implementation.
- Do not mark dependency audit complete unless the implementation agent runs and records `rtk pnpm audit` output and accepted risks.
- Do not mark multi-instance rate limiting complete. Current code intentionally does not share buckets across app instances.
- Do not mark automated retention cleanup complete. Current operations docs say cleanup is manual and dry-run inventory is deferred.

Docs sync behavior:

- Keep `README.md`, `docs/roadmap.md`, `docs/project-zoomout-status.md`, `docs/operations.md`, `docs/self-hosting.md`, `docs/backend-route-inventory.md`, and `docs/oss-alpha-summary.md` consistent with one another.
- Preserve the alpha warning: the app is not yet production-ready for real users without operator hardening.
- Preserve extension status from completed plans `103` and `107`: automatic-click extension evidence exists; true toolbar-popup manual validation remains pending; duplicate event-index follow-up remains future work.
- Preserve child plan `105` status: CI now runs the existing server smoke workflow.

Server behavior:

- Preserve existing rate-limit behavior unless implementing a narrow tested improvement.
- Preserve existing production env report secret safety.
- Preserve local file storage key safety and upload limit behavior.
- Preserve health/readiness endpoint behavior.
- Preserve startup validation behavior unless the audit finds a documented mismatch.

Storage/cleanup behavior:

- Do not implement automatic deletion of user files in this phase.
- If adding any cleanup/inventory command is explicitly chosen, it must be dry-run first by default, must not delete files without an explicit destructive flag, and must verify references across capture assets, guide blocks/snapshots, and interactive demo scenes before suggesting deletion.
- Prefer documenting deferred cleanup work over implementing risky deletion behavior.

## Security And Permission Rules

Do not weaken:

- production startup validation;
- CORS allowed-origin requirements;
- cookie secret length and secure-cookie expectations;
- API/public web origin separation;
- sensitive route rate limiting;
- upload size limits;
- local file storage safe path handling;
- published asset reference constraints;
- invite/public viewer token secrecy;
- bearer token/cookie/password secrecy;
- extension privacy limitations around no raw input values and no page HTML capture.

Do not introduce:

- committed secrets;
- secret values in production env reports;
- raw `COOKIE_SECRET`, `DB_PASSWORD`, cookies, bearer tokens, invite tokens, public viewer tokens, URL credentials, URL query secrets, or raw local storage root paths in logs/docs examples;
- analytics or telemetry;
- new external network calls;
- new hosted deployment automation;
- new Chrome extension permissions;
- direct public serving of `DEMO_COMPOSER_LOCAL_STORAGE_ROOT`.

Backup/restore docs must:

- avoid embedding real credentials;
- describe isolated restore targets;
- require database and storage backup pairing;
- require verification of project access, capture assets, guide preview, published guide, and interactive demo when present.

Dependency audit docs must:

- record command expectations without claiming all advisories are fixed unless verified;
- require accepted-risk notes for advisories that cannot be immediately remediated.

## Migration And Backwards Compatibility Notes

Expected:

- No database migration.
- No package dependency change.
- No lockfile change.
- No environment variable rename.
- No storage path migration.
- No storage provider migration.
- No route/API contract migration.
- No web/extension storage migration.

Compatibility rules:

- Existing `DEMO_COMPOSER_*`, `API_URL`, `VITE_DEMO_COMPOSER_API_URL`, database, cookie, and CORS env vars must remain supported.
- Existing local storage files under `DEMO_COMPOSER_LOCAL_STORAGE_ROOT` must remain readable.
- Existing capture asset storage keys must remain valid.
- Existing production env report consumers, if any, must not receive secrets or raw storage paths.
- Existing rate-limit config env vars must preserve current default values unless a dedicated tested change is made:
  - `DEMO_COMPOSER_RATE_LIMIT_MAX_ATTEMPTS`
  - `DEMO_COMPOSER_RATE_LIMIT_WINDOW_MS`
- Existing checklist items should stay conservative and unchecked unless the exact environment-specific verification has happened.

## Implementation Strategy

Treat this phase as an audit-first closeout.

Recommended order:

1. Confirm worktree status.
2. Reread master plan `004`, completed plan `107`, this plan, and the production docs listed above.
3. Inventory the exact current production-hardening behavior in code:
   - production startup validation;
   - production env report;
   - health/readiness;
   - rate-limited route families;
   - local file storage provider;
   - upload limits;
   - publish asset access;
   - server package scripts.
4. Reconcile `docs/production-readiness-checklist.md` against current code and keep items unchecked unless environment-specific verification actually occurred.
5. Reconcile `docs/operations.md` and `docs/self-hosting.md` against current scripts and env report behavior.
6. Reconcile `README.md`, `docs/roadmap.md`, `docs/project-zoomout-status.md`, `docs/backend-route-inventory.md`, and `docs/oss-alpha-summary.md` so they all describe the same production limitations.
7. Decide whether implementation is docs-only or includes a narrow server fix:
   - Prefer docs-only if the code already matches the intended behavior.
   - Implement a server fix only if a concrete, testable mismatch exists.
8. If implementing a server fix, use TDD:
   - add or update the focused failing test first;
   - confirm the failure;
   - make the smallest production code change;
   - rerun focused tests and broader server checks.
9. Convert broad production-readiness gaps that remain open into explicit follow-up plan candidates. Each candidate must name the owning area, intended scope, non-scope, and required verification.
10. Update this plan with implementation status, checklist, implementation log, verification notes, leftovers, and handoff notes.
11. Update master plan `004` only for completed child `108` status and a concise completed result.
12. Commit only scoped work in logical chunks.

Decision guidance:

- A stale doc sentence should be fixed in docs, not by changing behavior.
- A missing operator warning should be added to docs/checklists.
- A missing test for already-documented behavior can be added if it is narrow.
- Multi-instance rate limiting should become an explicit future plan candidate, not an implementation in this phase.
- Automated retention cleanup should become an explicit future plan candidate, not an implementation in this phase.
- Object storage support should become an explicit future plan candidate, not an implementation in this phase.

## Required Implementation Steps

1. Run:

   ```bash
   rtk git status --short
   ```

2. Inspect any uncommitted work. Do not overwrite user or other-agent changes.
3. Reread:

   ```text
   docs/plan/108-production-hardening-readiness-plan.md
   docs/plan/107-extension-popup-refactor-plan.md
   docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
   ```

4. Read the production docs and server files listed in "Exact Files To Read Before Implementation".
5. Produce an audit note in this plan's implementation log that states whether the phase is:
   - docs-only;
   - docs plus tests;
   - docs plus a narrow server fix.
6. Make only scoped edits.
7. Run the verification commands required by the actual touched files.
8. Update this plan:
   - status;
   - completion checklist;
   - implementation log;
   - verification notes;
   - browser validation notes;
   - leftovers;
   - handoff notes.
9. Update master plan `004` only for completed child `108` and final-track readiness if truly complete.
10. Commit scoped changes.

## Test And Verification Plan

Required for docs-only changes:

```bash
rtk git diff --check
```

Recommended for docs-only changes touching broad repo status:

```bash
rtk pnpm check-types
```

Required if server code/config/scripts change:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm check-types
rtk git diff --check
```

Required if production env report changes:

```bash
rtk pnpm --filter server test -- production-env-report
rtk pnpm --filter server env:report
```

Note: `rtk pnpm --filter server env:report` may fail without a complete production-like environment. If it fails for missing environment, document that as expected and run the focused unit tests that cover secret safety.

Required if rate limiting changes:

```bash
rtk pnpm --filter server test -- src/app.test.ts
```

The test evidence must continue to cover:

- repeated login attempts rate limit by route/client;
- setup, public viewer session, and invite acceptance rate limits;
- rate-limit buckets are not shared across app instances unless this plan is explicitly revised to implement shared state.

Required if local file storage behavior changes:

```bash
rtk pnpm --filter server test -- src/modules/file-storage/local-file-storage.provider.test.ts
rtk pnpm --filter server test -- src/modules/capture-asset/capture-asset.routes.test.ts
```

Required if published asset access behavior changes:

```bash
rtk pnpm --filter server test -- src/modules/publish
```

Required if implementation changes or adds CI smoke status claims beyond the already completed child plan `105` wording:

```bash
rtk sed -n '1,220p' .github/workflows/ci.yml
rtk pnpm --filter server test:smoke
```

Only run DB-backed smoke verification if the implementation changes smoke docs/status or CI-smoke claims and the local DB environment is available. If unavailable, document the blocker and do not mark new smoke claims complete. Existing references to completed child plan `105` do not by themselves require rerunning smoke.

Optional dependency audit verification:

```bash
rtk pnpm audit
```

If run:

- record whether it passed or failed;
- do not paste sensitive environment output;
- document advisories or accepted risks in docs only if relevant and safe.

## Agent-Browser Validation Requirements

No browser validation is expected for this phase if it is docs-only or server-only production hardening.

Agent-browser validation is required if implementation changes any browser-visible behavior, including:

- web-facing production warning text rendered in the app;
- public viewer behavior;
- invite acceptance browser behavior;
- login/session browser behavior;
- capture upload/browser flow behavior;
- extension setup/login/capture/finish behavior;
- portal URL behavior.

If browser validation becomes required:

1. Use the `agent-browser` skill.
2. Record:
   - server command and URL;
   - web command and URL;
   - environment used;
   - route/page tested;
   - browser-visible expected behavior;
   - screenshots only if useful and safe;
   - whether any private URL, token, cookie, or screenshot was avoided.
3. Do not use customer systems, private production accounts, private URLs, or sensitive screenshots.

This plan should not require browser validation if it stays within the intended docs/server-readiness scope.

## Explicit Non-Scope

- Declaring Demo Composer fully production-ready.
- Hosted SaaS deployment.
- One-command production deployment packaging.
- Kubernetes, Terraform, Helm, Docker packaging, or reverse-proxy templates.
- Replacing local file storage with S3 or another object storage provider.
- Building a storage provider abstraction beyond what already exists.
- Building automated retention cleanup that deletes files.
- Building a background job system.
- Building shared/distributed rate limiting.
- Adding Redis or another external rate-limit store.
- Database migrations.
- Changing auth/session schemas.
- Changing public route URLs or response envelopes.
- Changing web UI behavior.
- Changing extension behavior.
- Fixing true Chrome toolbar-popup manual validation.
- Fixing the direct extension-page duplicate event-index follow-up.
- Chrome Web Store packaging.
- New analytics or telemetry.
- New AI behavior.
- New capture features.
- New package dependencies.
- Lockfile changes.
- Moving production-hardening types into shared packages.

## Completion Checklist

- [x] Worktree checked before edits.
- [x] Master plan `004` and completed plan `107` reread.
- [x] Production checklist rechecked against current code.
- [x] Operations docs rechecked against current scripts and env report behavior.
- [x] Self-hosting docs rechecked against current production env expectations.
- [x] README, roadmap, project status, backend route inventory, and OSS summary checked for production-readiness consistency.
- [x] Rate-limit status documented truthfully as in-memory and not multi-instance safe.
- [x] Storage provider status documented truthfully as local-only.
- [x] Storage cleanup/retention status documented truthfully as manual/deferred.
- [x] Backup/restore rehearsal status documented truthfully as operator-owned unless actually rehearsed.
- [x] Dependency audit status documented truthfully.
- [x] Extension leftovers from `107` preserved as future work, not hidden as production readiness.
- [x] Narrow implemented fixes tested, if any.
- [x] Broad leftovers converted into explicit follow-up plan candidates with owner, scope, non-scope, and verification notes.
- [x] Browser validation completed or explicitly skipped with a valid reason.
- [x] Parent master plan updated only for completed phase status.

## Implementation Log

- Confirmed the pre-edit worktree was clean.
- Reread this plan, master plan `004`, and completed plan `107` before implementation.
- Audited the production-readiness docs:
  - `docs/production-readiness-checklist.md`
  - `docs/operations.md`
  - `docs/self-hosting.md`
  - `docs/roadmap.md`
  - `docs/project-zoomout-status.md`
  - `README.md`
  - `docs/backend-route-inventory.md`
  - `docs/oss-alpha-summary.md`
  - `docs/v1-dogfood-smoke-suite.md`
- Audited the production-hardening server surfaces:
  - `apps/server/src/app.ts`
  - `apps/server/src/app.test.ts`
  - `apps/server/src/config/startup.config.ts`
  - `apps/server/src/config/production-hardening.config.ts`
  - `apps/server/src/config/production-env-report.ts`
  - `apps/server/src/config/production-env-report.test.ts`
  - `apps/server/src/config/public-web-url.config.ts`
  - `apps/server/src/config/cors.config.ts`
  - `apps/server/src/config/cookie.config.ts`
  - `apps/server/src/ops/production-env-report.ts`
  - `apps/server/src/modules/file-storage/local-file-storage.provider.ts`
  - `apps/server/src/modules/file-storage/local-file-storage.provider.test.ts`
  - `apps/server/src/modules/capture-asset/capture-asset.routes.ts`
  - `apps/server/src/modules/capture-asset/capture-asset.routes.test.ts`
  - `apps/server/src/modules/publish/*`
  - `apps/server/package.json`
- Audited `.github/workflows/ci.yml` only to confirm it still matches completed child plan `105`: CI runs DB integration tests and the server smoke workflow after separate drop/create/migrate sequences.
- Determined this implementation is docs-only. The code already matches the intended readiness posture:
  - production startup validation enforces high-risk production env settings;
  - health and readiness endpoints are implemented and tested without leaking DB details;
  - sensitive route families are rate-limited in memory and tests explicitly prove buckets are not shared across app instances;
  - production env report is server-local and tested to avoid secrets, URL credentials/query values, URL paths, and the raw local storage root;
  - local file storage validates safe storage keys, upload size, missing bytes, and best-effort deletion behavior;
  - published asset access is constrained through publish service/routes and covered by publish tests.
- Left production checklist items unchecked because they are operator/environment-specific and were not verified against a real production deployment during this phase.
- Did not run DB-backed smoke because this implementation did not change smoke behavior or add new smoke-status claims beyond the already completed child plan `105` wording.
- Did not run `rtk pnpm audit` because dependency-advisory remediation was not implemented in this phase; dependency review remains an operator/future hardening item.
- Updated this plan with completed status, audit notes, verification notes, browser-validation notes, explicit follow-up plan candidates, and handoff notes.
- Updated master plan `004` only for completed child plan `108` status/checklist.

## Verification Notes

- Docs-only verification:
  - `rtk git diff --check` passed.
- Repo sanity:
  - `rtk pnpm check-types` passed.
- Browser validation was not required because this phase changed only planning/status documentation and did not change browser-visible behavior.
- Server tests were not required because no server code, config, route behavior, package scripts, storage behavior, production env report output, or API contracts changed.
- DB-backed smoke was not rerun because no smoke behavior or new smoke-status claim changed in this phase.

## Browser Validation Notes

Browser validation was not required. This phase was a docs-only production-readiness audit and did not change web UI, public viewer behavior, invite acceptance browser behavior, login/session browser behavior, capture upload/browser flows, extension behavior, or portal URL behavior.

## Leftovers

The audit closed the child plan by making the remaining production-readiness gaps explicit. These are follow-up plan candidates, not completed work:

- Owner: server/platform. Scope: replace in-memory rate limiting with shared rate-limit state for multi-instance deployments. Non-scope: changing sensitive route response envelopes or weakening current single-process limits. Verification: focused app/rate-limit tests plus deployment docs for the selected shared backend.
- Owner: server/storage. Scope: add an object storage provider or provider adapter suitable for production. Non-scope: changing existing local storage keys, published asset URLs, or capture asset contracts without a dedicated migration plan. Verification: storage provider tests, capture asset upload/read tests, publish asset streaming tests, and backup/restore docs.
- Owner: server/ops. Scope: add dry-run storage inventory and retention cleanup tooling. Non-scope: automatic deletion without explicit destructive opt-in, reference checks, and backup requirements. Verification: dry-run tests across capture assets, guide blocks/snapshots, and interactive demo scenes before any destructive mode is considered.
- Owner: ops/docs. Scope: automate or script backup/restore rehearsal evidence for PostgreSQL plus local storage. Non-scope: running against live production data or printing credentials. Verification: isolated restore run that checks project access, a capture asset, guide preview, published guide, and interactive demo when present.
- Owner: platform/release. Scope: one-command production packaging/deployment path. Non-scope: hosted SaaS signup, Kubernetes/Terraform-only deployment assumptions, or changing app runtime behavior. Verification: build, migrate, start, health/readiness, smoke workflow, and rollback/backup notes.
- Owner: security/maintenance. Scope: recurring dependency audit triage and remediation process. Non-scope: unplanned package upgrades without focused tests. Verification: `rtk pnpm audit`, advisory notes, accepted-risk records, and relevant package test suites.
- Owner: extension. Scope: true Chrome toolbar-popup manual capture validation. Non-scope: claiming direct extension-page automation as equivalent evidence. Verification: real toolbar/action popup path with screenshot-backed manual `capture` event evidence.
- Owner: extension. Scope: direct extension-page duplicate event-index follow-up after automatic clicks. Non-scope: broader popup refactor or unrelated extension UX changes. Verification: focused extension tests plus bounded browser validation if runtime capture ordering changes.

## Handoff Notes

- This phase is successful even if some production-readiness items remain incomplete, as long as they are accurately documented, prioritized, and not hidden as completed.
- Keep checklist language conservative. Operators own environment-specific production verification.
- If the audit finds that current docs already tell the truth, make only the minimum docs/status updates needed and close the plan.
- If the audit finds a real code gap, keep the fix small, server-local, and test-first.
- Broad hardening work should become separate future plans instead of being partially implemented here.
- This phase intentionally did not mark Demo Composer production-ready. It converted the remaining hardening gaps into explicit future plan candidates and preserved the current alpha production warnings.
