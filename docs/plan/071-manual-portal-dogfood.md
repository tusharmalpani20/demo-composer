# Manual Portal Dogfood Plan

Date: 2026-06-22

Status: Planned.

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

- automated DB-backed smoke has historical passing evidence
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

If ports differ, record the actual ports in the result log.

## Implementation Plan

### Manual Checklist

Use `docs/v1-dogfood-smoke-suite.md` as the source checklist. This section expands it into execution notes.

#### Setup And Auth

- [ ] Start PostgreSQL.
- [ ] Create or reset a safe development database.
- [ ] Run migrations.
- [ ] Start API server.
- [ ] Start web portal.
- [ ] Open portal from a clean browser context.
- [ ] Complete first-run setup.
- [ ] Confirm first-run setup is disabled after owner creation.
- [ ] Log out.
- [ ] Log back in.
- [ ] Confirm authenticated portal shell loads.

#### Project

- [ ] Create a project.
- [ ] Open project workspace.
- [ ] Confirm project status and metadata render.
- [ ] Open project settings.
- [ ] Edit project name, description, or slug.
- [ ] Archive project.
- [ ] Unarchive project.
- [ ] Return to project workspace.

#### Manual Capture

- [ ] Create a manual capture session.
- [ ] Upload one safe screenshot.
- [ ] Upload multiple screenshots if the UI supports bulk upload.
- [ ] Create screenshot-backed capture events.
- [ ] Confirm events have correct order.
- [ ] Reorder capture events.
- [ ] Edit a manual capture event.
- [ ] Confirm unsafe raw input values are not collected.
- [ ] Complete or finalize the capture session if needed for artifact creation.

#### Guide Workflow

- [ ] Generate a guide from the capture session.
- [ ] Open guide editor.
- [ ] Edit guide title and description.
- [ ] Edit at least one step title/body.
- [ ] Add a header block.
- [ ] Add a paragraph block.
- [ ] Add a divider block.
- [ ] Reorder guide blocks.
- [ ] Upload or select a screenshot for a step if supported.
- [ ] Add or edit screenshot annotation data.
- [ ] Open guide preview.
- [ ] Open screenshot viewer from preview.
- [ ] Export Markdown.
- [ ] Export HTML ZIP.
- [ ] Publish guide.
- [ ] Open public guide route.
- [ ] Confirm public guide does not show private source metadata.
- [ ] Enable guide password protection.
- [ ] Verify password gate.
- [ ] Open guide embed route.
- [ ] Revoke or restrict guide link if testing access controls.

#### Interactive Demo Workflow

- [ ] Create an interactive demo from the same capture session.
- [ ] Open interactive demo editor.
- [ ] Edit demo title or description.
- [ ] Edit scene title.
- [ ] Reorder scenes if more than one scene exists.
- [ ] Create a hotspot.
- [ ] Edit hotspot label/content/coordinates.
- [ ] Set hotspot target scene if available.
- [ ] Publish interactive demo.
- [ ] Open public demo viewer.
- [ ] Confirm public demo does not show private source metadata.
- [ ] Verify viewer navigation through hotspots or next/back controls.
- [ ] Enable password protection if available.
- [ ] Verify password gate.
- [ ] Open demo embed route.

#### Organization Invite

- [ ] Open organization members page.
- [ ] Create teammate invite.
- [ ] Copy invite link.
- [ ] Open invite link in a clean browser context.
- [ ] Accept invite as teammate.
- [ ] Confirm teammate can access project list.
- [ ] Confirm teammate can open the smoke project.
- [ ] Record any role or permission ambiguity.

#### Operations Checks

- [ ] Check `/healthz`.
- [ ] Check `/readyz`.
- [ ] Confirm local storage files are created under configured local storage root.
- [ ] Confirm no direct storage URL is required to view published assets.

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

Before or after manual dogfood, run the baseline checks if Phase 1 has not just run them:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
rtk git diff --check
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
