# V1 Dogfood Smoke Suite

This checklist proves the first usable v1 workflow from a clean local or self-host-style setup.

It is intentionally narrow. Domain edge cases belong in module tests; this smoke suite answers whether the product hangs together as one operator workflow.

## Pass/Fail Rule

The v1 alpha is smoke-usable when all required automated smoke checks pass and the required manual checks have either passed or have an explicit limitation recorded below.

Do not mark a flow as passed from assumption. Record pending manual checks as pending.

## Prerequisites

- Node and pnpm versions supported by the repo.
- PostgreSQL available through `.env-cmdrc`.
- `.env-cmdrc` has a `testing` environment usable by `apps/server`.
- Server migrations have been run for the testing database.
- Local file storage is writable.
- Chrome or Chromium is available for extension dogfooding.

## Automated Smoke Command

From the repo root:

```bash
rtk pnpm --filter server test:smoke
```

The smoke command uses the existing `.env-cmdrc` `testing` environment. It does not create a separate database configuration.

If the testing database is missing or stale, run the existing DB setup commands first:

```bash
rtk pnpm --filter server test:setup
```

## Automated Coverage

The DB-backed smoke test covers:

- health and readiness endpoints
- first-run owner and organization setup
- authenticated project creation
- manual capture session creation
- screenshot upload through local storage
- screenshot-backed click event creation
- capture session completion
- Scribe-style guide creation from capture
- guide publishing and public resolution
- Storylane-style interactive demo creation from the same capture
- demo hotspot creation
- interactive demo publishing and public resolution
- organization invite creation
- invite acceptance by a new teammate
- teammate access to the authenticated project list

## Manual Portal Checklist

Use safe synthetic screenshots only.

- [ ] Open the portal from a clean database.
- [ ] Complete first-run setup.
- [ ] Log out and log back in.
- [ ] Create a project.
- [ ] Create a manual capture session.
- [ ] Upload one or more screenshots.
- [ ] Create screenshot-backed capture events.
- [ ] Reorder manual capture events.
- [ ] Edit a manual capture event.
- [ ] Generate a guide from the capture session.
- [ ] Edit guide title/body for a step.
- [ ] Add or edit screenshot annotation data.
- [ ] Open guide preview.
- [ ] Export guide markdown.
- [ ] Export guide HTML ZIP.
- [ ] Publish the guide.
- [ ] Open the public guide.
- [ ] Enable guide password protection and verify the password gate.
- [ ] Open guide embed route.
- [ ] Create an interactive demo from the same capture session.
- [ ] Edit a scene title.
- [ ] Create a hotspot.
- [ ] Publish the interactive demo.
- [ ] Open the public demo viewer.
- [ ] Open demo embed route.
- [ ] Invite a teammate.
- [ ] Accept the invite as the teammate.
- [ ] Confirm the teammate can access the project.
- [ ] Check `/healthz`.
- [ ] Check `/readyz`.

## Manual Extension Checklist

Use an `http` or `https` test page that does not contain secrets or customer data.

- [ ] Build the extension.
- [ ] Load the unpacked extension from `apps/extension/dist`.
- [ ] Configure the instance URL.
- [ ] Sign in from the extension.
- [ ] Select the smoke project.
- [ ] Start automatic capture.
- [ ] Click through the test page.
- [ ] Confirm ordered screenshot-backed `click` events arrive in portal capture detail.
- [ ] Pause capture.
- [ ] Resume capture.
- [ ] Use manual screenshot fallback.
- [ ] Finish capture.
- [ ] Confirm the portal opens the completed capture session.
- [ ] Generate a guide from automatic click events.
- [ ] Generate an interactive demo from the same automatic click events.
- [ ] Verify click position metadata creates usable guide annotations or demo hotspots.

## Smoke Data Naming

Use names that make cleanup obvious:

- organization: `V1 Smoke Org`
- owner email: `owner@example.com`
- project: `V1 Dogfood Project`
- capture session: `Create department workflow`
- guide: `Department setup guide`
- interactive demo: generated from the capture session
- teammate email: `teammate@example.com`

Do not use production accounts, customer systems, private URLs, or private screenshots.

## Cleanup

- Drop or truncate the testing database when the smoke run is finished.
- Remove temporary local storage created for smoke runs.
- Remove any unpacked extension build artifacts if they are no longer needed.
- Do not commit generated screenshots, cookies, invite tokens, or local storage contents.

## Result Log

### 2026-06-16 Initial Automated Smoke

- Commit: pending
- Environment: local test database through `.env-cmdrc` `testing`; temporary local file storage
- Automated smoke: passed with `rtk pnpm --filter server test:smoke`
- Manual portal smoke: pending
- Manual extension smoke: pending
- Known limitations found:
  - public guide and interactive demo snapshots intentionally omit internal source event IDs while preserving published source assets
- Follow-up plans/issues: none recorded yet

Use this template for future smoke runs:

```text
Date:
Commit:
Environment:
Automated smoke:
Manual portal smoke:
Manual extension smoke:
Flows passed:
Flows failed:
Known limitations found:
Follow-up plans/issues:
```
