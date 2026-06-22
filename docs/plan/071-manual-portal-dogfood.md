# Manual Portal Dogfood Plan

Date: 2026-06-22

Status: Completed with non-blocking limitations.

## Parent Master Plan

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

This is Phase 2 of the alpha hardening master plan.

## Goal

Run the full portal workflow manually from a clean self-host-style setup, record the result, and turn real browser friction into follow-up plans.

Target outcome:

```text
operator starts a clean local/self-host-style instance
  -> completes first-run setup
  -> creates a project and manual capture session
  -> uploads safe screenshots and creates capture events
  -> creates, edits, exports, publishes, and views a guide
  -> creates, edits, publishes, and views an interactive demo
  -> invites a teammate and verifies teammate project access
  -> records exact pass/fail evidence
```

This plan is evidence-first. Do not hide failures by fixing them in the same broad pass unless the failure is tiny, isolated, and necessary to complete the smoke. Create follow-up plans for meaningful issues.

## Dependencies

Should start after:

```text
docs/plan/070-verification-and-docs-sync.md
```

Reason:

- manual dogfood should start from green baseline checks and truthful docs
- this phase should not be mixed with test fixture or docs status cleanup
- Phase 1 found that DB-backed verification suites share first-run setup state, so DB verification should run sequentially with a reset before each DB suite when rerun

## Current Baseline

Automated backend smoke exists:

```text
apps/server/src/smoke/v1-workflows.db.integration.test.ts
```

Manual portal smoke checklist exists:

```text
docs/v1-dogfood-smoke-suite.md
```

Known current status:

- Phase 1 completed and recorded green baseline verification in `docs/plan/070-verification-and-docs-sync.md`
- automated DB-backed smoke has fresh passing evidence from Phase 1
- manual portal smoke is pending
- manual Chrome extension smoke is pending
- no real product screenshots are committed yet

## Scope

Included:

- run local or self-host-style portal smoke through a browser
- use only safe synthetic screenshots and data
- exercise setup, auth, projects, manual capture, guide authoring, guide publishing, interactive demo authoring, demo publishing, org invites, health, and readiness
- record pass/fail result in `docs/v1-dogfood-smoke-suite.md`
- create follow-up child plans for blockers or important friction
- update status docs only with evidence actually observed

## Explicit Non-Goals

- Chrome extension dogfood
- product screenshot capture for README
- guide editor redesign
- interactive demo editor redesign
- new product behavior unless required for a tiny smoke-blocking fix
- production deployment packaging
- HTML replay
- AI, analytics, lead capture, custom branding, hosted SaaS behavior

## Test Data Rules

Use safe synthetic data only.

Recommended names:

```text
organization: V1 Smoke Org
owner email: owner@example.com
project: V1 Dogfood Project
capture session: Create department workflow
guide: Department setup guide
teammate email: teammate@example.com
```

Screenshot rules:

- use synthetic app screens or throwaway local pages
- do not use customer systems
- do not use production accounts
- do not include private URLs, tokens, cookies, or personal data
- do not commit generated screenshots unless Phase 4 explicitly selects safe screenshots for docs

## Expected File Touches

Expected docs updates:

```text
docs/v1-dogfood-smoke-suite.md
docs/plan/071-manual-portal-dogfood.md
```

Conditional docs updates:

```text
docs/plan/master/001-alpha-hardening-master-plan.md
docs/project-zoomout-status.md
README.md
docs/plan/<new-follow-up-plan>.md
```

Expected pages and routes to exercise:

- `/setup` for first-run setup
- `/login` for sign-in and sign-out recovery
- `/` and `/projects` for project list
- `/projects/:project_id` for project workspace
- `/projects/:project_id/settings` for project settings and archive/unarchive
- `/projects/:project_id/capture-sessions` for capture session list and creation
- `/projects/:project_id/capture-sessions/:capture_session_id` for capture detail, uploads, event ordering, and event editing
- `/projects/:project_id/guides` for guide list
- `/projects/:project_id/guides/:guide_id` for guide editor, export, publish controls, password controls, and embed controls
- `/projects/:project_id/guides/:guide_id/preview` for guide preview
- `/p/:slug` for public guide reader
- `/p/:slug/embed` for public guide embed
- `/projects/:project_id/interactive-demos` for interactive demo list
- `/projects/:project_id/interactive-demos/:interactive_demo_id` for interactive demo editor, hotspots, publish controls, password controls, and embed controls
- `/d/:slug` for public interactive demo viewer
- `/d/:slug/embed` for public interactive demo embed
- `/organization/members` for organization members and invite creation
- `/invites/:token` for invite acceptance
- `/healthz` for server health
- `/readyz` for server readiness

Product source files should stay untouched unless a tiny smoke-blocking fix is required. Any product fix made during this plan must be called out in the result log and implementation notes.

## Expected Environment

Before starting:

- confirm whether the run uses the `development` or `testing` `.env-cmdrc` environment
- use a disposable clean database for browser dogfood
- do not drop a developer's non-disposable database without an explicit operator decision
- record the actual DB name or disposable environment label in the result log

Likely local services:

```bash
rtk docker compose up -d postgres
rtk pnpm --filter server db:create
rtk pnpm --filter server migrate:up
rtk pnpm --filter server dev
rtk pnpm --filter web dev
```

Expected browser entry:

```text
http://localhost:3000
```

Port/proxy alignment:

- the server listens on `.env-cmdrc` `SERVER_PORT`
- the web dev proxy defaults to `http://localhost:3002`
- if the server port is not `3002`, start the web portal with `VITE_DEMO_COMPOSER_API_URL=http://localhost:<server_port>` or otherwise align the proxy before testing
- record the actual server URL, web URL, and storage root in the result log

If ports differ from the examples, record the actual ports in the result log.

## Carry-Over From Phase 1

Phase 1 left these operational notes for this implementation:

- `test:db` and `test:smoke` should not be run in parallel against the same testing database.
- Reset the testing database before `test:db`, and reset it again before `test:smoke`, unless future isolation work changes that.
- Long DB integration tests now have a 60s server Vitest timeout budget. If DB workflows approach that limit again, create a DB test performance/isolation follow-up instead of raising timeouts again.
- Manual extension dogfood and product screenshots remain pending; do not mark them complete in this plan.

## Implementation Plan

### Manual Checklist

Use `docs/v1-dogfood-smoke-suite.md` as the source checklist. This section expands it into execution notes.

#### Setup And Auth

- [x] Start PostgreSQL.
- [x] Create or reset a safe development database.
- [x] Run migrations.
- [x] Start API server.
- [x] Start web portal.
- [x] Open portal from a clean browser context.
- [x] Complete first-run setup.
- [x] Confirm first-run setup is disabled after owner creation.
- [x] Log out.
- [x] Log back in.
- [x] Confirm authenticated portal shell loads.

#### Project

- [x] Create a project.
- [x] Open project workspace.
- [x] Confirm project status and metadata render.
- [x] Open project settings.
- [x] Edit project name, description, or slug.
- [x] Archive project.
- [x] Unarchive project.
- [x] Return to project workspace.

#### Manual Capture

- [x] Create a manual capture session.
- [x] Upload one safe screenshot.
- [x] Upload multiple screenshots if the UI supports bulk upload.
- [x] Create screenshot-backed capture events.
- [x] Confirm events have correct order.
- [x] Reorder capture events.
- [x] Edit a manual capture event.
- [x] Confirm unsafe raw input values are not collected.
- [x] Complete or finalize the capture session if needed for artifact creation.

#### Guide Workflow

- [x] Generate a guide from the capture session.
- [x] Open guide editor.
- [x] Edit guide title and description.
- [x] Edit at least one step title/body.
- [ ] Add a header block. Blocked: visible add-block controls did not create blocks or requests.
- [ ] Add a paragraph block. Blocked: visible add-block controls did not create blocks or requests.
- [ ] Add a divider block. Blocked: visible add-block controls did not create blocks or requests.
- [ ] Reorder guide blocks. Not covered because only generated step blocks existed.
- [x] Upload or select a screenshot for a step if supported.
- [x] Add or edit screenshot annotation data.
- [x] Open guide preview.
- [x] Open screenshot viewer from preview.
- [x] Export Markdown.
- [x] Export HTML ZIP.
- [x] Publish guide.
- [x] Open public guide route.
- [x] Confirm public guide does not show private source metadata.
- [x] Enable guide password protection.
- [x] Verify password gate.
- [x] Open guide embed route.
- [ ] Revoke or restrict guide link if testing access controls. Not required for this smoke after password gate verification.

#### Interactive Demo Workflow

- [x] Create an interactive demo from the same capture session.
- [x] Open interactive demo editor.
- [x] Edit demo title or description.
- [x] Edit scene title.
- [x] Reorder scenes if more than one scene exists.
- [x] Create a hotspot.
- [x] Edit hotspot label/content/coordinates.
- [x] Set hotspot target scene if available.
- [x] Publish interactive demo.
- [x] Open public demo viewer.
- [x] Confirm public demo does not show private source metadata.
- [x] Verify viewer navigation through hotspots or next/back controls.
- [x] Enable password protection if available.
- [x] Verify password gate.
- [x] Open demo embed route.

#### Organization Invite

- [x] Open organization members page.
- [x] Create teammate invite.
- [x] Copy invite link.
- [x] Open invite link in a clean browser context.
- [x] Accept invite as teammate.
- [x] Confirm teammate can access project list.
- [x] Confirm teammate can open the smoke project.
- [x] Record any role or permission ambiguity.

#### Operations Checks

- [x] Check `/healthz`.
- [x] Check `/readyz`.
- [x] Confirm local storage files are created under configured local storage root.
- [x] Confirm no direct storage URL is required to view published assets.

## Implementation Notes

Run completed on 2026-06-22 against commit `51d6b20` with the `testing` `.env-cmdrc` environment.

Environment:

- Testing database label: `test-dc`.
- API server: `http://localhost:4021`.
- Web portal: `http://localhost:3000`.
- Web API proxy override: `VITE_DEMO_COMPOSER_API_URL=http://localhost:4021`.
- Local storage root: `apps/server/storage`.
- Browser runner: `agent-browser` with isolated owner, public, and teammate sessions.
- Screenshots: synthetic PNGs generated under `/tmp/demo-composer-dogfood`; not committed.

Verification performed:

- Quick baseline before dogfood passed: `rtk pnpm --filter server test`, `rtk pnpm --filter web test`, `rtk pnpm --filter extension test`, and `rtk git diff --check`.
- Disposable testing DB was dropped and recreated, then 14 migrations were applied before manual dogfood.
- `/healthz` and `/readyz` returned `200`.
- Storage contained two 70-byte synthetic screenshots under `apps/server/storage`.
- DB sanity check found 1 project, 2 capture events, 2 file records, 1 invite, 1 accepted invite, and 0 unredacted capture events.

Observed limitations and follow-ups:

- Guide add-block controls for header, paragraph, tip, alert, and divider were visible but did not create blocks or API requests in this run. This should feed Phase 5 guide editor hardening.
- Several portal buttons/links were more reliable through keyboard activation than pointer click in automation, including first-run submit, settings save/archive, event edit, preview link, and workspace/settings navigation. This needs targeted UI event/accessibility investigation before treating it as user-facing breakage.
- Invite copy produced a link with `http://localhost/invites/<token>` while the Vite web portal was on `http://localhost:3000`; the equivalent `http://localhost:3000/invites/<token>` route worked. Local dev URL construction should be clarified or made portal-origin aware.

## Result Recording

Update:

```text
docs/v1-dogfood-smoke-suite.md
```

Use the existing result log template.

Record:

- date
- commit
- environment
- database setup
- storage root
- browser
- web URL and API/server URL
- whether browser automation or fully manual interaction was used
- automated smoke status if rerun
- manual portal smoke status
- manual extension smoke status remains pending unless Phase 3 has run
- flows passed
- flows failed
- known limitations found
- follow-up plan files or issue names

## Failure Handling

If a flow fails:

- record the exact step
- record expected vs actual behavior
- capture safe screenshot only if it helps and contains no secrets
- note browser console or server log summary if useful
- decide whether it blocks the whole smoke or is a non-blocking limitation
- create a follow-up plan for meaningful fixes

Do not mark a failed item as passed because a workaround exists. Record the workaround.

## Testing Plan

Before manual dogfood, run a quick baseline unless the same commit already has fresh results:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk git diff --check
```

If rerunning DB-backed checks, do them sequentially:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:setup
rtk pnpm --filter server test:db
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:setup
rtk pnpm --filter server test:smoke
```

For this manual phase, the browser walkthrough is the main verification artifact.

## Acceptance Criteria

- Manual portal smoke has a dated result entry in `docs/v1-dogfood-smoke-suite.md`.
- Each required portal checklist item is marked passed, failed, skipped, or not applicable with a reason.
- Manual extension smoke remains pending unless Phase 3 has actually run.
- Any blocker has a follow-up plan or explicit limitation.
- No private screenshots, cookies, invite tokens, bearer tokens, or local storage files are committed.
- README/status docs are updated only with truthful dogfood evidence.

## Documentation Updates

Expected:

```text
docs/v1-dogfood-smoke-suite.md
```

Conditional:

```text
docs/project-zoomout-status.md
README.md
docs/roadmap.md
docs/plan/master/001-alpha-hardening-master-plan.md
```

Update the master plan completion table only if this plan is completed.

## Suggested Commit Shape

Recommended:

```text
Record manual portal dogfood smoke
```

If follow-up plans are created:

```text
Record portal dogfood follow-up plans
```

## Follow-Up Plans

Likely next plan:

```text
docs/plan/072-manual-extension-dogfood.md
```

Possible follow-ups:

- guide editor issue plan
- interactive demo editor issue plan
- capture upload recovery plan
- public publish/password bug plan
- invite acceptance bug plan
