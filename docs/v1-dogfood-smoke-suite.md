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

### 2026-06-22 Manual Extension Dogfood

- Commit: `1da95db`
- Environment: `.env-cmdrc` `testing`; disposable DB label `test-dc`; API instance URL `http://localhost:4021`; web portal `http://localhost:3000`; safe test page `http://127.0.0.1:4179`; extension build path `apps/extension/dist`; local storage root `apps/server/storage`
- Browser: Chrome `149.0.0.0` via `agent-browser`; unpacked extension id `cohepadogfeidambknedbdflmcjepaam`
- Automated smoke: `rtk pnpm --filter extension test` passed; `rtk pnpm --filter extension build` passed; DB was reset and migrated before the browser run
- Manual portal smoke: passed with non-blocking limitations in the 2026-06-22 portal entry
- Manual extension smoke: failed/blocked
- Flows passed:
  - extension loaded unpacked from `apps/extension/dist`
  - API instance configuration accepted `http://localhost:4021`
  - owner sign-in returned the project list
  - smoke project selection persisted after popup reload
  - starting automatic capture created an extension-sourced backend capture session
  - popup restored active capture state
  - pause and resume toggled local active capture state
  - finish completed the backend capture session and cleared local active capture state
  - equivalent web portal route could inspect the completed capture session
  - `/healthz` and `/readyz`
- Flows failed or limited:
  - automatic click capture produced zero click events and zero screenshot files after multiple supported clicks on a safe HTTP page
  - manual screenshot fallback produced no upload/event request, no UI error, no file, and no capture event
  - `Open in portal` and `Finish capture` opened API-origin project URLs on `localhost:4021`, which returned 404 JSON instead of the web portal
  - guide and interactive demo creation from extension events was blocked because the capture session had no events or assets
  - unsupported-page behavior could only be recorded as no capture on `chrome://extensions`; no richer recovery surfaced
- Known limitations found:
  - direct extension-page automation is not identical to a human toolbar popup, so Phase 7 should reproduce in a headed/manual browser before deciding final root cause
  - extension browser-facing portal URL construction is not split API/web origin safe
  - extension capture failures did not surface a user-facing popup error in this run
- Follow-up plans/issues:
  - Feed automatic capture failure, silent fallback failure, and split-origin portal links into `docs/plan/076-extension-capture-reliability-v2.md`.
  - Do not proceed to alpha visual screenshots from extension capture until extension dogfood has a passing or explicitly bounded capture path.

### 2026-06-22 Manual Portal Dogfood

- Commit: `51d6b20`
- Environment: `.env-cmdrc` `testing`; disposable DB label `test-dc`; API `http://localhost:4021`; web `http://localhost:3000`; web proxy override `VITE_DEMO_COMPOSER_API_URL=http://localhost:4021`; local storage root `apps/server/storage`
- Browser: `agent-browser` isolated owner, public, and teammate sessions
- Automated smoke: quick package baseline passed with `rtk pnpm --filter server test`, `rtk pnpm --filter web test`, `rtk pnpm --filter extension test`, and `rtk git diff --check`; DB was reset and migrated before the manual run
- Manual portal smoke: passed with non-blocking limitations recorded in `docs/plan/071-manual-portal-dogfood.md`
- Manual extension smoke: failed/blocked in the 2026-06-22 manual extension dogfood entry
- Flows passed:
  - first-run owner setup, logout, and login
  - project creation, settings edit, archive, and unarchive
  - manual capture session creation, two synthetic screenshot uploads, event reorder, event edit, and redaction guard check
  - guide generation, metadata/step editing, highlight creation, preview, screenshot viewer, Markdown export, HTML ZIP export, publish, public route, embed route, password gate, and unlock
  - interactive demo generation, metadata/scene editing, scene reorder, hotspot creation/editing, publish, public route, embed route, hotspot navigation, password gate, and unlock
  - organization invite creation, teammate invite acceptance, teammate project list access, and teammate project open
  - `/healthz` and `/readyz`
- Flows failed or limited:
  - guide structural add-block controls were visible but did not create header, paragraph, or divider blocks
  - several portal controls required keyboard activation in automation even when pointer click did not navigate or submit
  - copied invite URL used `http://localhost/invites/<token>` while the web dev portal was running on `http://localhost:3000`; opening the equivalent web route worked
- Known limitations found:
  - local dogfood with a non-default server port requires explicit Vite API proxy alignment
  - local invite URL construction should be clarified for split API/web dev ports
  - generated screenshots and storage files were intentionally left uncommitted
- Follow-up plans/issues:
  - Feed guide add-block behavior into Phase 5 guide editor hardening.
  - Investigate pointer-click versus keyboard activation reliability as part of portal accessibility/editor hardening.
  - Keep manual extension dogfood pending for Phase 3.

### 2026-06-16 Initial Automated Smoke

- Commit: `1ff3d1e`
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
