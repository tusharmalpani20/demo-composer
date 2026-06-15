# End-To-End Dogfood Smoke Suite Plan

Date: 2026-06-16

Status: Implemented.

## Goal

Prove the first usable v1 workflows from a clean local/self-host-style setup and record the result in the repository.

The codebase has strong unit, route, page, extension, and DB integration coverage. What is still missing is a concise dogfood layer that answers:

```text
Can a real operator install/run this alpha build
  -> set up the instance
  -> capture workflow source material
  -> create guide and demo artifacts
  -> publish them
  -> invite a teammate
  -> verify health/readiness and operational basics
```

This plan should create a repeatable v1 smoke process. It should not try to replace the full automated test suite.

## Why This Comes Next

Plan `067` will make docs factually current.

Before plan `069` polishes the repo for public alpha launch, we should have explicit evidence for the main flows and clear notes for any rough edges. Public docs should not rely only on "tests pass"; they should reflect dogfooded workflows.

## Current Baseline

Already covered by existing tests:

- backend route/service behavior
- DB migrations and DB integration for domains
- web route/API/page behavior
- extension popup/content/background behavior
- guide publish/access/password/embed behavior
- interactive demo publish/access/password/embed behavior
- org invite backend and portal behavior
- production hardening endpoints and rate limits

Still missing:

- one documented end-to-end smoke checklist for v1
- one cross-domain backend DB smoke that follows the main artifact flow end to end
- one manual browser/extension dogfood checklist for automatic click capture
- one place to record known smoke limitations before public alpha
- clear pass/fail criteria for calling the alpha build "usable"

## Scope

### Smoke Documentation

Add a dogfood smoke document, recommended path:

```text
docs/v1-dogfood-smoke-suite.md
```

It should include:

- prerequisites
- environment assumptions
- required `.env-cmdrc` testing entries
- clean database/storage setup expectations
- smoke data naming conventions
- pass/fail rules
- flow checklist
- known limitations log
- safe cleanup guidance

The document should be usable by the maintainer manually, even before browser automation exists.

### Automated Backend Cross-Domain Smoke

Add a narrow DB-backed integration smoke test that proves the backend can complete the core cross-domain workflow with real repositories:

```text
apps/server/src/smoke/v1-workflows.db.integration.test.ts
```

Recommended flow:

1. create owner/org through first-run setup
2. create a project
3. create a manual capture session
4. upload a tiny screenshot asset
5. create a screenshot-backed capture event
6. complete the capture session
7. create a guide from capture
8. publish the guide
9. resolve the public guide link
10. create an interactive demo from the same capture
11. add or verify a demo scene
12. add a hotspot
13. publish the interactive demo
14. resolve the public demo link
15. create an org invite
16. accept the invite as a new user
17. verify the invited user can call an authenticated project route

This should be a smoke test, not an exhaustive domain test. Domain edge cases already live in module-specific tests.

Add this smoke test to the server DB test command only if runtime remains acceptable. If it makes DB tests too slow, add a dedicated script:

```bash
pnpm --filter server test:smoke
```

The current server `test:db` script enumerates DB integration files explicitly, so implementation must either:

- append the new smoke file to that explicit `test:db` command; or
- add a dedicated `test:smoke` script and document when maintainers should run it.

Use the existing `.env-cmdrc` `testing` environment and the current DB setup scripts instead of inventing a second test configuration.

### Manual Portal Smoke Checklist

Document manual browser checks for:

- first-run setup
- login/logout
- project creation
- manual capture session creation
- screenshot upload
- event ordering/editing
- guide generation
- guide editor basic edits
- screenshot annotation
- guide preview
- markdown export
- HTML ZIP export
- guide publish
- public guide open
- public guide password gate
- public guide embed route
- interactive demo creation from capture
- scene title edit
- hotspot creation
- interactive demo publish
- public demo viewer
- public demo embed route
- org invite create/accept
- health/readiness checks

### Manual Extension Smoke Checklist

Document manual Chrome extension checks:

- load unpacked extension from `apps/extension/dist`
- configure instance URL
- sign in
- select project
- start automatic capture
- click through an `http` or `https` test page
- confirm ordered screenshot-backed `click` events arrive in portal capture detail
- pause/resume capture
- manual screenshot fallback
- finish capture
- portal opens completed capture session
- generate guide from automatic click events
- generate interactive demo from the same automatic click events
- verify click position metadata produces usable guide annotations or demo hotspots

### Smoke Result Recording

Add a small result log section or template in the smoke doc:

```text
Date:
Commit:
Environment:
Flows passed:
Flows failed:
Known limitations found:
Follow-up plans/issues:
```

Do not commit real secrets, private URLs, customer screenshots, session cookies, or invite tokens.

## Explicit Non-Goals

- Do not build one-command self-host packaging.
- Do not add Playwright browser automation unless it is very small and low-risk.
- Do not require Chrome Web Store packaging.
- Do not add analytics, lead capture, HTML replay, branding, or AI.
- Do not turn this into exhaustive QA for every domain edge case.
- Do not commit generated screenshots from private/internal systems.

## Recommended Implementation Order

1. Create `docs/v1-dogfood-smoke-suite.md` with manual checklist and result template.
2. Add backend DB smoke test for the cross-domain v1 workflow.
3. Add the smoke test to the explicit server `test:db` file list or add a dedicated `test:smoke` script, depending on runtime.
4. Run the existing server/web/extension checks.
5. Run the new smoke test.
6. Build server, web, and extension.
7. Manually run the documented browser/extension smoke where possible.
8. Record smoke result notes in the smoke doc without secrets.
9. If smoke finds product gaps, write follow-up plan(s) instead of silently expanding this one.

## Acceptance Criteria

- `docs/v1-dogfood-smoke-suite.md` exists and is usable as a maintainer checklist.
- backend cross-domain smoke proves guide and interactive demo publish flows from one capture source.
- org invite accept/access is included in smoke coverage.
- health/readiness checks are included in smoke coverage.
- extension automatic capture has a manual smoke checklist.
- smoke results can be recorded without leaking secrets or private screenshots.
- any failed or deferred smoke item is clearly documented as a known limitation or follow-up.
- no product behavior is changed unless a test exposes a small correctness bug that must be fixed.
- existing tests still pass.
- `rtk git diff --check` passes.

## Implementation Notes

- Added `docs/v1-dogfood-smoke-suite.md` with automated, portal, and extension smoke checklists plus a result log template.
- Added `apps/server/src/smoke/v1-workflows.db.integration.test.ts` as a DB-backed v1 workflow smoke test.
- Added `pnpm --filter server test:smoke` so the cross-domain smoke can run independently from the longer explicit `test:db` suite.
- The automated smoke currently passes and covers:
  - health/readiness
  - first-run setup
  - project creation
  - manual capture session creation
  - screenshot upload
  - screenshot-backed click event
  - capture completion
  - guide creation and public publish resolution
  - interactive demo creation, hotspot creation, and public publish resolution
  - org invite creation and acceptance
  - invited teammate project access
- Manual portal and extension dogfood checks remain documented as pending because they require a browser/Chrome extension run.

## Suggested Commit Shape

Recommended commits:

1. `Add v1 dogfood smoke checklist`
2. `Add cross-domain v1 DB smoke test`
3. `Record initial v1 smoke verification`

If no manual smoke result can be run in the implementation environment, the third commit should instead be:

```text
Document pending manual smoke steps
```

## Out Of Scope

- public launch README polish
- issue templates
- screenshots/GIF assets
- browser automation suite
- hosted deployment guide
- production Docker packaging
- release automation
