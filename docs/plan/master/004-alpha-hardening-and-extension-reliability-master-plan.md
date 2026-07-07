# Master Plan 004: Alpha Hardening And Extension Reliability

Date: 2026-07-07

Status: Planned.

Master plan number: 004.

## 1. Purpose

Demo Composer has completed the shared contracts and domainization track from `docs/plan/master/003-shared-contracts-domainization-master-plan.md`. The repo is now closer to the intended Orca-style architecture: reusable shared contracts, domain packages, thinner server adapters, and app clients that consume shared package boundaries.

The next priority is to harden the alpha product around the remaining real-world risks:

- Chrome extension capture reliability is still not proven in a real browser dogfood run.
- A few docs still describe the old placeholder shared package architecture.
- CI does not yet appear to run the full server smoke workflow.
- Several large frontend, extension, and API client files need safer internal structure without UI changes.
- Production readiness still has known operational gaps around rate limiting, storage cleanup, backup/restore rehearsal, and dependency review.

This master plan turns those risks into a controlled sequence of child plans. The goal is not to add new product features. The goal is to make the current alpha behavior more reliable, more verifiable, easier to maintain, and better documented.

## 2. Current Baseline

Baseline checked on 2026-07-07:

- `rtk git status --short` was clean.
- `rtk pnpm check-types` passed across the repo.
- Shared package boundary checks found no app imports from packages and no direct web/extension imports of backend-only domain packages.
- `docs/plan/master/003-shared-contracts-domainization-master-plan.md` and child plans `087` through `099` are complete.
- The repo contains tests across server, DB integration, web, extension, docs, shared packages, and domain packages.

Important known gaps from current docs and code:

- `apps/extension/README.md` says the intended extension path exists in code/tests but manual dogfood on 2026-06-22 was not reliable: automatic clicks produced no events/files and manual fallback produced no upload/event.
- Prior split API/web dogfood also found portal links opening the API origin. Current extension code includes a separate portal URL setting, so this track must revalidate and close or fix that behavior instead of assuming the original bug is still present.
- `docs/project-zoomout-status.md` records Chrome extension dogfood as blocked by automatic capture and manual fallback failures.
- `README.md` still says `packages/*` are shared tooling placeholders and product contracts stay near owners.
- `docs/contributor-guide.md` still says `packages/` are shared tooling placeholders.
- `apps/server/src/common/helper_function/error_handler.helper.ts` has a legacy TODO in global error serialization.
- `apps/server/package.json` has `test:smoke`, but `.github/workflows/ci.yml` does not appear to run it.
- Large files remain in authoring/editor/client surfaces and should be split only after behavior is covered.

## 3. Source Documents To Preserve

This plan must preserve the product and architecture decisions already documented in:

- `README.md`
- `CONTEXT.md`
- `docs/system-design-pattern.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`
- `docs/backend-route-inventory.md`
- `docs/operations.md`
- `docs/production-readiness-checklist.md`
- `apps/extension/README.md`
- `docs/plan/master/001-alpha-hardening-master-plan.md`
- `docs/plan/master/002-alpha-follow-through-master-plan.md`
- `docs/plan/master/003-shared-contracts-domainization-master-plan.md`
- extension-related child plans `072`, `076`, `078`, `079`, `080`, and `081`
- child plans `087` through `099`
- ADRs under `docs/adr/`

Key decisions to protect:

- Screenshot-first capture remains the MVP; HTML replay stays deferred.
- Extension capture remains privacy-preserving and must not collect raw input values or page HTML.
- The extension uses instance-first login.
- Web and server remain separate apps.
- Shared types/constants/domain packages remain reusable package boundaries.
- Server routes remain REST/Fastify/Zod-oriented adapters.
- Publish links resolve to immutable snapshots.
- UI appearance must not change during hardening/refactor work unless a child plan explicitly documents a bug fix that requires a visible behavior adjustment.

## 4. Hard Scope Boundaries

In scope:

- Extension reliability investigation, reproduction, diagnostics, and fixes.
- Real browser validation for extension capture flows.
- Split API/web origin handling for extension finish/open portal behavior.
- Docs updates that reflect the current architecture.
- CI updates to include existing smoke coverage safely.
- Internal refactors of large files where behavior and UI output remain unchanged.
- Production readiness hardening plans for known alpha gaps.
- Test and verification improvements that make existing behavior easier to trust.

Out of scope:

- New capture modalities such as raw DOM capture, HTML replay, full-page capture, or input-value capture.
- AI behavior.
- Analytics.
- Visual redesign.
- New guide/demo authoring features.
- New public viewer behavior.
- Hosted SaaS signup.
- Chrome Web Store packaging.
- Storage provider replacement unless a child plan explicitly limits the work to readiness documentation or adapters.
- Route URL churn unless required to fix a documented bug.
- Database schema changes unless a child plan proves they are required for a current reliability issue.

## 5. Execution Rules

Each child plan must follow the same workflow used in the shared-contracts track:

1. Expand the child plan into an implementation-ready document.
2. Recheck the expanded plan against this master plan and current code.
3. Implement only that child plan.
4. Run focused verification.
5. If browser behavior is involved, run agent-browser or an equivalent explicit browser validation path and document the result.
6. Update the child plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
7. Update this master plan only for completed phase items.
8. Commit only scoped work in small logical commits.
9. Recheck implemented work against the child plan before starting the next child plan.

Every child plan must include:

- exact affected files;
- routes/API contracts where relevant;
- schemas/types where relevant;
- behavior rules;
- security and permission rules;
- migration and backwards-compatibility notes where relevant;
- focused test/verification commands;
- browser validation requirements where relevant;
- explicit non-scope;
- handoff notes and leftovers.

## 6. Target Outcomes

This track is complete when:

- Extension capture has a documented, passing, real-browser validation path or a deliberately bounded limitation with clear user-facing and docs implications.
- Automatic click capture and manual screenshot fallback either work reliably or have narrowly documented constraints.
- Extension finish/open portal uses the correct web origin in split API/web deployments.
- Architecture docs no longer describe shared packages as placeholders.
- CI runs the existing server smoke workflow or documents why it cannot yet run there.
- Large-file refactors reduce risk and improve maintainability without changing UI behavior.
- Production readiness gaps are converted into implementation-ready follow-up work or closed.
- The repo remains type-safe, testable, and aligned with the domainized architecture from Master Plan 003.

## 7. Child Plan Index

Existing child plans currently run through `docs/plan/099-contract-regression-docs-sync-and-architecture-closeout.md`.

New child plans for this track should start at `100`.

### 100: Extension Reliability Baseline And Dogfood Repro

Status: Completed on 2026-07-07

File:

- `docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md`

Goal:

- Establish the exact current extension failure modes before applying fixes.

Scope:

- Re-read `apps/extension/README.md`, `docs/project-zoomout-status.md`, prior extension child plans, and current extension code.
- Inventory extension flows: instance URL setup, login, project selection, capture session start, automatic click capture, manual screenshot fallback, pause/resume, finish/open portal.
- Identify the current split-origin behavior between API origin and web origin.
- Reproduce or simulate the known dogfood failures with clear evidence.
- Document whether the failure is in content script messaging, background worker capture, screenshot capture, upload, event creation, auth/session token handling, active state restoration, or portal URL generation.

Expected affected areas:

- `apps/extension/README.md`
- `apps/extension/src/`
- extension tests under `apps/extension/src/`
- `docs/project-zoomout-status.md`
- prior extension-related plans, only as references

Tests and validation:

- Run existing extension unit tests.
- Run extension typecheck and lint.
- Use agent-browser or documented browser automation/manual steps to validate the real extension path if technically available.
- Capture logs/screenshots/artifacts needed for the next child plan.

Acceptance:

- The repo has an implementation-ready diagnosis of the extension reliability problem.
- Failure modes are separated instead of grouped under one generic dogfood failure.
- No product behavior is changed in this phase unless required to add safe diagnostics.

### 101: Extension Capture Upload And Event Fix

Status: Completed on 2026-07-07

File:

- `docs/plan/101-extension-capture-upload-and-event-fix.md`

Goal:

- Fix the automatic click capture and manual screenshot fallback path so extension capture creates screenshot assets and ordered capture events reliably.

Scope:

- Fix only the capture/upload/event failures identified by child plan `100`.
- Preserve privacy defaults: no raw input values, no page HTML, and `input_value_redacted` semantics for automatic click events.
- Preserve existing extension UI appearance.
- Preserve capture session ordering and server API contracts unless a bug fix explicitly requires a compatible adjustment.
- Add or update tests around background worker behavior, content script messaging, screenshot upload, event creation, active capture state, and failure recovery.

Expected affected areas:

- `apps/extension/src/`
- `apps/extension/src/**/*.test.ts`
- server capture asset/event routes only if the repro proves an API bug
- `@repo/types` or `@repo/constants` only if a missing shared contract caused drift
- `apps/extension/README.md`

Routes/API contracts to protect:

- capture session APIs;
- capture asset upload APIs;
- capture event creation APIs;
- extension auth/session APIs.

Tests and validation:

- Extension tests.
- Focused server capture asset/event tests if touched.
- Extension typecheck and lint.
- Browser validation proving at least one automatic click and one manual screenshot create the expected server-side asset/event records.

Acceptance:

- Automatic click capture works or has a precisely documented limitation.
- Manual screenshot fallback works or has a precisely documented limitation.
- Failures show actionable extension errors without destroying active capture state.
- No raw sensitive browser data is captured.

### 102: Extension Finish Portal Origin Verification And Fix

Status: Planned

File:

- `docs/plan/102-extension-finish-portal-origin-fix.md`

Goal:

- Verify and, if still needed, fix extension finish/open portal behavior so it uses the correct web origin in split API/web deployments.

Scope:

- Identify where the extension derives portal URLs and how the current portal URL setting is stored.
- Confirm how server and web expose API origin, web origin, and instance status.
- If current code already handles split-origin URLs correctly, add or update tests/docs and mark the issue closed with evidence.
- If a bug remains, fix URL generation so local and deployed split-origin setups open the portal rather than the API origin.
- Preserve instance-first login behavior.
- Preserve existing route URLs where possible.

Expected affected areas:

- `apps/extension/src/`
- `apps/server/src/modules/public-instance/`
- `apps/web/src/` only if web origin contract consumption requires it
- `@repo/types` public instance contracts only if a contract is missing or stale
- `apps/extension/README.md`
- relevant operations/setup docs

Security and compatibility:

- Do not trust arbitrary browser-provided origins for privileged API calls.
- Preserve CORS/session behavior.
- Keep backwards compatibility for existing configured instance URLs where possible.

Tests and validation:

- Extension tests for portal URL generation.
- Server public instance contract tests if touched.
- Browser validation in a split API/web local setup.

Acceptance:

- Finish/open portal opens the correct web URL.
- API origin and web origin are clearly documented.
- Existing single-origin setups remain compatible.

### 103: Extension Browser Validation And Screenshots

Status: Planned

File:

- `docs/plan/103-extension-browser-validation-and-screenshots.md`

Goal:

- Prove the fixed extension workflow in a real browser and refresh extension evidence/screenshots.

Scope:

- Run the complete extension workflow from instance setup through portal output.
- Validate automatic capture, manual fallback, finish/open portal, and generated guide/demo source material.
- Update docs evidence and screenshots that were blocked by prior extension failures.
- Document any remaining limitations with dates and exact reproduction notes.

Expected affected areas:

- `docs/assets/`
- `README.md`
- `docs/project-zoomout-status.md`
- `apps/extension/README.md`
- optional dogfood notes under `docs/`

Browser validation:

- Use agent-browser where feasible.
- If extension loading cannot be automated, document exact manual Chrome steps and captured evidence.
- Validate at desktop viewport. Mobile browser validation is not required for the Chrome extension unless a child plan adds that scope.

Acceptance:

- Extension dogfood is no longer generically blocked.
- Captured-workflow extension screenshots are refreshed or explicitly marked impossible with a clear reason.
- Docs state the current extension reliability status accurately.

### 104: Docs Architecture Sync After Domainization

Status: Planned

File:

- `docs/plan/104-docs-architecture-sync-after-domainization.md`

Goal:

- Remove stale documentation that still describes shared packages as placeholders.

Scope:

- Update `README.md` architecture sections to reflect active shared constants, shared types, domain packages, and server/web/extension usage.
- Update `docs/contributor-guide.md` package descriptions.
- Check related architecture docs for contradictions introduced by the domainization track.
- Keep this as documentation-only unless a broken doc command requires a small config fix.

Expected affected areas:

- `README.md`
- `docs/contributor-guide.md`
- `docs/system-design-pattern.md` only if a contradiction is found
- `docs/project-zoomout-status.md` only if status wording needs alignment

Tests and validation:

- `rtk git diff --check`
- docs app typecheck/build only if docs app files are touched
- no browser validation required unless rendered docs app pages change

Acceptance:

- Docs no longer say shared packages are placeholders.
- Docs accurately describe the post-003 architecture.
- No feature or UI behavior changes.

### 105: CI Smoke Workflow Coverage

Status: Planned

File:

- `docs/plan/105-ci-smoke-workflow-coverage.md`

Goal:

- Add the existing full server smoke workflow to CI safely.

Scope:

- Inspect `.github/workflows/ci.yml`, server test environment setup, migrations, DB reset behavior, and `apps/server/package.json`.
- Decide whether `test:smoke` can run in the main CI job or needs a separate isolated job.
- Add smoke execution only when DB ordering and environment setup are deterministic.
- Avoid making tests flaky by sharing dirty DB state between DB integration and smoke tests.

Expected affected areas:

- `.github/workflows/ci.yml`
- `apps/server/package.json` only if script names or composition need cleanup
- server test setup files only if required for deterministic CI execution
- `docs/production-readiness-checklist.md` or `docs/project-zoomout-status.md` if verification status changes

Tests and validation:

- Run the exact server smoke command locally.
- Run focused DB tests if setup changes.
- Run `rtk pnpm check-types`.
- Verify the CI workflow syntax.

Acceptance:

- CI includes full workflow smoke coverage or documents a concrete blocker.
- The smoke path proves first-run setup, project, capture, guide/demo, publish, and invite behavior.
- CI remains deterministic.

### 106: Web Large-File Refactor Plan

Status: Planned

File:

- `docs/plan/106-web-large-file-refactor-plan.md`

Goal:

- Make the largest web authoring and API client files easier to maintain without UI changes.

Scope:

- Analyze large web files before editing.
- Split by existing feature boundaries, hooks, helpers, or API modules only where tests protect behavior.
- Preserve UI output, copy, layout, keyboard behavior, and navigation.
- Prefer local feature modules over broad abstractions unless reuse is real.
- Keep shared packages limited to product contracts/constants, not React component props.

Expected affected areas:

- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/web/src/lib/api.ts`
- adjacent focused tests

Tests and validation:

- Web unit tests for touched features.
- Web typecheck and lint.
- Browser validation for guide editor and interactive demo editor if behavior paths are touched.

Acceptance:

- Files are smaller or responsibilities are clearer.
- No visible UI redesign.
- Existing guide/demo authoring behavior is preserved.

### 107: Extension Popup Refactor Plan

Status: Planned

File:

- `docs/plan/107-extension-popup-refactor-plan.md`

Goal:

- Reduce `apps/extension/src/App.tsx` complexity after reliability fixes are proven.

Scope:

- Refactor extension popup state, API calls, capture lifecycle orchestration, and presentational pieces into smaller modules where useful.
- Preserve extension UI appearance and wording.
- Preserve fixed capture behavior from child plans `101` through `103`.
- Keep browser-specific code isolated behind adapters where practical.

Expected affected areas:

- `apps/extension/src/App.tsx`
- new local extension modules under `apps/extension/src/`
- extension tests

Tests and validation:

- Extension unit tests.
- Extension typecheck and lint.
- Browser validation for setup/login/start capture/capture screenshot/finish if behavior boundaries move.

Acceptance:

- Popup code is easier to reason about.
- Reliability fixes remain intact.
- No extension UI redesign.

### 108: Production Hardening Readiness Plan

Status: Planned

File:

- `docs/plan/108-production-hardening-readiness-plan.md`

Goal:

- Convert remaining production-readiness gaps into either implemented hardening fixes or explicit follow-up plans.

Scope:

- Recheck `docs/production-readiness-checklist.md`, `docs/operations.md`, `docs/roadmap.md`, and `README.md`.
- Review in-memory rate limiting and whether the repo needs shared/persistent rate limiting for production.
- Review storage cleanup/retention gap and define a safe dry-run-first cleanup path.
- Review backup/restore rehearsal docs and identify missing commands or verification.
- Review dependency audit expectations and CI/local commands.
- Review local-only storage warning and deployment implications.

Expected affected areas:

- `docs/production-readiness-checklist.md`
- `docs/operations.md`
- `docs/roadmap.md`
- server rate-limit/storage areas only if this child plan intentionally implements a narrow fix
- scripts only if needed for repeatable ops verification

Tests and validation:

- Focused server tests for any implemented backend hardening.
- Docs validation for docs-only changes.
- `rtk pnpm check-types` if code/config changes.

Acceptance:

- Production readiness gaps are accurately documented.
- Any implemented hardening is tested.
- Remaining future work is explicit, prioritized, and not hidden as completed.

## 8. Master Plan Checklist

- [x] Create master plan.
- [x] Create child plan files `100` through `108`.
- [x] Expand and recheck child plan `100`.
- [x] Implement and close child plan `100`.
- [x] Expand and recheck child plan `101`.
- [x] Implement and close child plan `101`.
- [x] Expand and recheck child plan `102`.
- [ ] Implement and close child plan `102`.
- [ ] Expand and recheck child plan `103`.
- [ ] Implement and close child plan `103`.
- [ ] Expand and recheck child plan `104`.
- [ ] Implement and close child plan `104`.
- [ ] Expand and recheck child plan `105`.
- [ ] Implement and close child plan `105`.
- [ ] Expand and recheck child plan `106`.
- [ ] Implement and close child plan `106`.
- [ ] Expand and recheck child plan `107`.
- [ ] Implement and close child plan `107`.
- [ ] Expand and recheck child plan `108`.
- [ ] Implement and close child plan `108`.
- [ ] Run final track closure against this master plan.

## 9. Final Closure Requirements

Before this master plan can be marked complete:

- Every child plan must have status, checklist, implementation log, verification notes, leftovers, and handoff notes.
- This master plan must mark only truly completed items as complete.
- Extension dogfood status must be current and dated.
- CI smoke status must be current and documented.
- Docs must reflect the real shared package/domain architecture.
- Remaining production readiness gaps must be explicit.
- `rtk git status --short` must be clean after scoped commits.
