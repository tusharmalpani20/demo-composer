# Verification And Docs Sync Plan

Date: 2026-06-22

Status: Completed.

## Implementation Notes

Completed on 2026-06-22.

Changes made:

- fixed stale organization invite service tests by injecting deterministic test time into pending invite public lookup and acceptance cases
- added explicit expired-invite regression coverage for public lookup and acceptance
- added a server Vitest timeout config so long DB integration workflows use a consistent 60s budget instead of relying on Vitest's 5s default
- marked `docs/plan/049-project-settings-archive-portal.md` implemented with notes and active files
- marked `docs/plan/067-docs-freshness-and-status-sync.md` completed by later docs polish with notes
- documented that `apps/docs` remains starter content parked for alpha
- added a current-status pointer to `docs/product-idea.md`
- updated the alpha hardening master plan completion table for Phase 1

Verification results:

```text
rtk pnpm --filter server test -- organization-invites.service.test.ts
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

All passed.

DB-backed checks were run against the configured PostgreSQL testing database. The testing database was reset with `rtk pnpm --filter server run test:db:drop` and `rtk pnpm --filter server run test:setup` before the final DB integration run, then reset again before the final smoke run so first-run setup started cleanly.

## Follow-Up Notes For Next Plans

These are not blockers for Phase 1 completion, but they should stay visible for the next implementation plans:

- DB-backed suites share first-run setup state. Run `test:db` and `test:smoke` sequentially, with a testing database reset before each suite, unless future work adds stronger per-suite isolation.
- Long DB integration workflows now have a 60s Vitest budget. If they keep approaching that limit, create a focused DB test performance/isolation plan instead of increasing timeouts again.
- Manual portal dogfood remains pending and should be handled by `docs/plan/071-manual-portal-dogfood.md`.
- Manual extension dogfood remains pending and should be handled by `docs/plan/072-manual-extension-dogfood.md`.
- Real product screenshots remain pending until dogfood evidence exists, then continue with `docs/plan/073-alpha-product-screenshots.md`.
- `apps/docs` is documented as parked starter content for alpha. Do not point users to it as canonical product docs unless a later docs-site plan implements it.

## Parent Master Plan

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

This is Phase 1 of the alpha hardening master plan.

## Goal

Make the repository's stated alpha status match actual behavior and make the baseline verification checks green before manual portal and extension dogfooding begins.

Target outcome:

```text
new agent or maintainer starts work
  -> reads current docs without stale planned/implemented contradictions
  -> runs the normal verification commands
  -> sees failures only when behavior is actually broken
  -> can proceed to manual dogfood from a trustworthy baseline
```

This is a hygiene and confidence slice. It should not add new product features.

## Why This Comes Next

The master plan's next phases depend on dogfood evidence. Dogfood should not start while the repo has avoidable noise:

- a time-sensitive server test fixture that now fails because the current date is after its hard-coded expiry
- stale plan statuses that make completed work look pending
- unclear status around `apps/docs` starter content
- unclear status around placeholder shared packages

Fixing those first keeps future agents from confusing old planning drift with current product gaps.

## Pre-Implementation Baseline

### Product Status

The current alpha can complete the backend smoke path:

```text
first-run setup
  -> project
  -> capture session
  -> screenshot-backed event
  -> guide publish
  -> interactive demo publish
  -> teammate invite acceptance
```

The broader manual browser flows are still pending:

- manual portal dogfood smoke
- manual Chrome extension dogfood smoke

Do not mark either manual flow as passed in this plan.

### Known Verification Issue Before Completion

`rtk pnpm --filter server test` had stale organization invite service tests because two pending invite fixtures expire at:

```text
2026-06-20T00:00:00.000Z
```

The current date for this plan is:

```text
2026-06-22
```

The failing tests are expected to be in:

```text
apps/server/src/modules/organization/organization-invites.service.test.ts
```

The likely failing cases are:

- public invite metadata for a pending invite
- accepting an invite for a new user

The service behavior appears correct: pending invites should be rejected after expiry. The tests are stale because they depend on wall-clock time without injecting a stable `now`.

### Known Docs Drift Before Completion

Known stale or ambiguous documents:

```text
docs/plan/049-project-settings-archive-portal.md
docs/plan/067-docs-freshness-and-status-sync.md
```

Observed drift before this plan was implemented:

- plan `049` still says `Status: Planned`, but project settings/archive controls exist in the portal
- plan `067` still says `Status: Planned`, but most of its intended docs freshness outcome appears to have landed through later OSS alpha polish work

Status to confirm before editing:

- whether plan `049` should be marked `Implemented` or `Completed`
- whether plan `067` should be marked `Implemented`, `Completed`, `Partially implemented`, or `Superseded by 069`

### Parked Areas To Document Truthfully

The repo also has areas that are present but not product-active:

```text
apps/docs
packages/types
packages/constants
packages/ui
```

Known current shape:

- `apps/docs` is still starter Next/Turborepo content
- `packages/types` and `packages/constants` are placeholder packages
- `packages/ui` contains basic/starter primitives and is not yet a mature product design system

This plan should document whether these are intentionally parked for alpha or need follow-up plans.

### Baseline Revalidation Rule

The baseline above is a snapshot from 2026-06-22. Before implementing, re-run the relevant checks and inspect the current files.

If the stale invite tests have already been fixed by another change:

- do not reintroduce the old failure
- verify invite expiry coverage still exists
- record in implementation notes that the test fix was already present
- continue with the docs/status sync portions if they are still stale

If new unrelated failures appear:

- do not expand this plan silently
- record the failure
- either create a focused follow-up plan or explicitly amend this plan before implementation

## Scope

Included:

- fix the stale organization invite service tests
- preserve invite expiry behavior
- add or adjust tests proving expired invites are rejected
- run the standard verification commands
- update stale plan statuses and implementation notes
- check high-level docs for stale "not built" claims
- check backend route inventory for obvious drift
- document the current parked status of `apps/docs`
- document the current placeholder status of shared packages if they remain intentionally thin
- update the master plan completion table only if this plan is completed during implementation

## Explicit Non-Goals

- manual portal dogfood smoke
- manual extension dogfood smoke
- adding product screenshots
- implementing `apps/docs` as a real docs site
- extracting domain packages
- adding new product behavior
- adding HTML replay
- adding AI or BYO-key behavior
- adding analytics, lead capture, custom branding, or hosted SaaS flows
- replacing local file storage
- replacing in-memory rate limiting

## Expected File Touches

Likely source/test files:

```text
apps/server/src/modules/organization/organization-invites.service.test.ts
```

Only touch service implementation if the audit proves there is a real bug:

```text
apps/server/src/modules/organization/organization-invites.service.ts
```

Likely docs:

```text
docs/plan/049-project-settings-archive-portal.md
docs/plan/067-docs-freshness-and-status-sync.md
docs/project-zoomout-status.md
docs/contributor-guide.md
docs/plan/master/001-alpha-hardening-master-plan.md
```

Conditional docs:

```text
README.md
CONTRIBUTING.md
docs/backend-route-inventory.md
docs/roadmap.md
docs/oss-alpha-summary.md
.github/workflows/ci.yml
```

Only touch `.github/workflows/ci.yml` if verification command expectations have actually changed. This plan is not intended to redesign CI.

## Risks And Guardrails

- Do not mark manual portal smoke as passed.
- Do not mark manual extension smoke as passed.
- Do not claim product screenshots exist.
- Do not change public product behavior unless a real bug is discovered and documented.
- Do not weaken invite expiry or token safety.
- Do not broaden placeholder shared packages with speculative contracts.
- Do not implement `apps/docs` as a docs site in this plan.
- Keep docs wording alpha-accurate; do not imply production readiness.
- Keep route inventory changes factual and based on active route files.

## Implementation Plan

### 1. Confirm Current Test Failure

Run:

```bash
rtk pnpm --filter server test
```

Expected current result before the fix:

- organization invite service tests fail due to expired pending invite fixtures

If this command already passes, inspect the invite tests and confirm deterministic expiry coverage exists. Then skip directly to the docs/status sync steps.

If different tests fail, record the new failure before expanding scope.

### 2. Fix Time-Sensitive Invite Fixtures

Inspect:

```text
apps/server/src/modules/organization/organization-invites.service.test.ts
apps/server/src/modules/organization/organization-invites.service.ts
```

Preferred approach:

- inject a deterministic `now` into `build_organization_invites_service` in the affected tests
- keep pending invite fixtures valid relative to that deterministic date
- keep explicit expired-invite coverage using a date before or equal to the deterministic `now`

Avoid:

- moving fixture dates far into the future without explaining the clock dependency
- weakening `public_invite_status_guard`
- removing expired invite coverage
- using real wall-clock time in tests where expiry matters

Suggested test shape:

```text
service = build_organization_invites_service(repository, {
  now: () => new Date("2026-06-10T00:00:00.000Z")
})
```

Then use:

```text
pending invite expires_at: 2026-06-20T00:00:00.000Z
expired invite expires_at: 2026-06-09T00:00:00.000Z
```

### 3. Re-Run Server Non-DB Tests

Run:

```bash
rtk pnpm --filter server test
```

Expected result:

- all server non-DB tests pass

If new failures appear, fix only failures directly related to this hygiene slice or create a follow-up plan.

### 4. Verify Other App Tests

Run:

```bash
rtk pnpm --filter web test
rtk pnpm --filter extension test
```

Expected result:

- web tests pass
- extension tests pass

These should not require product code changes in this plan.

### 5. Verify DB-Backed Backend Tests

Run:

```bash
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

Requirements:

- PostgreSQL testing database configured through `apps/server/.env-cmdrc`
- migrations applied or test setup run as needed

If the database is missing or stale, run the documented setup commands:

```bash
rtk pnpm --filter server test:setup
```

Do not rewrite DB tests as part of this plan unless the invite fixture fix exposes a real persistence bug.

### 6. Verify Build, Types, Lint, And Whitespace

Run:

```bash
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

Expected result:

- all commands pass

If CI expectations differ from local verification, inspect `.github/workflows/ci.yml` and record whether CI needs a follow-up plan.

### 7. Update Plan 049 Status

Inspect current implementation before editing:

```text
apps/web/src/features/project/ProjectSettingsPage.tsx
apps/web/src/features/project/ProjectWorkspacePage.tsx
apps/web/src/lib/routes.ts
apps/web/src/lib/api.ts
apps/web/src/features/project/ProjectSettingsPage.test.tsx
apps/web/src/features/project/ProjectWorkspacePage.test.tsx
```

If the plan is implemented, update:

```text
docs/plan/049-project-settings-archive-portal.md
```

Minimum update:

- change status from `Planned` to `Implemented` or `Completed`
- add an `Implementation Notes` section near the top or bottom
- mention the active route `/projects/:project_id/settings`
- mention project detail editing and archive/unarchive behavior
- mention relevant tests

Do not rewrite the whole historical plan.

### 8. Resolve Plan 067 Status

Inspect:

```text
docs/plan/067-docs-freshness-and-status-sync.md
README.md
CONTRIBUTING.md
docs/project-zoomout-status.md
docs/backend-route-inventory.md
docs/product-idea.md
docs/plan/049-project-settings-archive-portal.md
docs/plan/069-oss-alpha-launch-polish.md
```

Choose one truthful status:

- `Implemented`
- `Completed`
- `Partially implemented`
- `Superseded by 069`

Recommended approach:

- If every acceptance criterion in plan `067` is satisfied after this plan updates `049`, mark it implemented/completed and add notes.
- If most docs were updated by plan `069` but `067` itself was never directly executed, mark it `Superseded by 069 and completed by later docs polish` only if acceptance criteria are true.
- If any acceptance criteria remain false, mark it `Partially implemented` and list the remaining items.

Do not claim manual smoke has passed.

### 9. Check High-Level Docs For Stale Claims

Check at minimum:

```text
README.md
CONTRIBUTING.md
docs/project-zoomout-status.md
docs/backend-route-inventory.md
docs/roadmap.md
docs/v1-dogfood-smoke-suite.md
docs/oss-alpha-summary.md
```

Look for stale claims around:

- interactive demos not built
- automatic click capture not built
- organization invites not built
- production hardening not built
- manual dogfood passed when it is still pending
- product screenshots existing when they are still missing
- `apps/docs` being a real product docs site

Only edit docs that are actually stale.

### 10. Record Parked `apps/docs` Status

If `apps/docs` remains starter content, make that explicit in one appropriate place:

Preferred locations:

- `docs/project-zoomout-status.md`
- `docs/contributor-guide.md`
- or plan `067` implementation notes

Suggested wording:

```text
apps/docs currently remains starter content and is not the canonical product documentation surface. Product docs live under docs/ for alpha.
```

If a real docs site should be built soon, create a follow-up plan instead of implementing it here.

### 11. Record Shared Package Placeholder Status

If shared packages remain intentionally thin, make that explicit where future contributors will see it:

```text
packages/types
packages/constants
packages/ui
```

Useful existing docs:

- `docs/system-design-pattern.md`
- `docs/contributor-guide.md`
- `docs/project-zoomout-status.md`

The desired message:

- product contracts remain near owning apps/modules until cross-app reuse is real
- placeholder packages should not be filled with speculative broad schemas
- UI primitives can grow as real portal components become reusable

### 12. Update Master Plan Tracking

If this plan is implemented completely in the same workstream, update:

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

Change Phase 1 from:

```text
Planned
```

to:

```text
Completed
```

and add this plan file as the result link.

If the child plan is only written but not implemented, do not update the completion table.

### 13. Add Implementation Notes To This Plan

When implementation is complete, update this plan with a short `Implementation Notes` section.

Include:

- final status
- summary of test fix or confirmation that it was already fixed
- docs updated
- commands run and result
- any follow-up plans created

Do not add long command logs. Record the meaningful result.

## Testing Plan

Required commands:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

If DB commands cannot run because PostgreSQL is unavailable, record the exact reason in implementation notes and do not claim DB verification passed.

If a command is skipped because it is not relevant after revalidation, record why. Prefer running the full list before marking this plan completed.

## Acceptance Criteria

- `rtk pnpm --filter server test` passes.
- Invite expiry behavior remains tested.
- Expired public invites are still rejected.
- Web and extension tests pass.
- DB integration and smoke tests pass in a documented test database environment.
- Typecheck, build, lint, and whitespace checks pass.
- Plan `049` no longer incorrectly says `Status: Planned`.
- Plan `067` has a truthful current status.
- High-level docs do not contain stale "not built" claims for already implemented alpha features.
- Docs still clearly say manual portal smoke is pending unless Phase 2 has actually completed.
- Docs still clearly say manual extension smoke is pending unless Phase 3 has actually completed.
- `apps/docs` starter status is either documented as parked or split into a follow-up plan.
- placeholder shared package status is documented or confirmed already documented.
- No new product behavior is added.
- Manual smoke status remains pending unless a separate dogfood phase has actually run.
- This plan has implementation notes when completed.

## Documentation Updates

Expected docs touched if implementation confirms current assumptions:

```text
docs/plan/049-project-settings-archive-portal.md
docs/plan/067-docs-freshness-and-status-sync.md
docs/project-zoomout-status.md
docs/contributor-guide.md
docs/plan/master/001-alpha-hardening-master-plan.md
```

Only touch `README.md`, `CONTRIBUTING.md`, `docs/backend-route-inventory.md`, `docs/roadmap.md`, or `docs/oss-alpha-summary.md` if the audit finds stale language.

When implementation finishes, this file should also be updated:

```text
docs/plan/070-verification-and-docs-sync.md
```

Set `Status:` to the truthful final state and add implementation notes.

## Suggested Commit Shape

Recommended commits:

1. `Fix time-stable invite service tests`
2. `Sync verification and docs status`

If the diff is small, a single commit is acceptable:

```text
Fix verification drift and docs status
```

## Follow-Up Plans

Likely next plan after this one:

```text
docs/plan/071-manual-portal-dogfood.md
```

Potential follow-ups if discovered during this plan:

- real docs site plan for `apps/docs`
- shared UI primitive cleanup plan
- route inventory refresh plan if route drift is larger than expected
- CI verification improvement plan if local and CI verification differ materially
