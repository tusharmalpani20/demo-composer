# Manual Extension Dogfood Plan

Date: 2026-06-22

Status: Completed with blocking capture failures.

## Parent Master Plan

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

This is Phase 3 of the alpha hardening master plan.

## Goal

Run the unpacked Chrome extension against a safe browser workflow and prove whether automatic click capture works outside unit tests.

Target outcome:

```text
operator builds and loads extension
  -> configures instance URL
  -> signs in
  -> selects project
  -> starts automatic capture
  -> clicks through safe test page
  -> verifies screenshot-backed click events in portal
  -> pauses/resumes capture
  -> uses manual screenshot fallback
  -> finishes capture and opens portal
  -> creates guide and demo from extension events
  -> records exact pass/fail evidence
```

This is evidence-first. Do not turn this into a broad extension rewrite.

## Dependencies

Should start after:

```text
docs/plan/070-verification-and-docs-sync.md
```

Strongly recommended after or alongside:

```text
docs/plan/071-manual-portal-dogfood.md
```

Reason:

- extension evidence should be recorded against a verified backend and portal
- guide/demo generation from extension events needs the portal to be usable
- Phase 2 found split API/web local URL friction, so extension dogfood must record both the API instance URL and the browser-facing portal URL

## Current Baseline

Extension scope is documented in:

```text
apps/extension/README.md
```

Current extension capabilities:

- instance URL setup
- extension login with bearer session token
- project listing and selection
- automatic click capture MVP
- manual screenshot fallback
- pause/resume
- finish-to-portal

Known deferred extension capabilities:

- raw DOM HTML capture
- input value capture
- navigation event capture
- full-page stitched screenshots
- HTML snapshots
- Chrome Web Store packaging

Before this run, manual extension smoke was pending in:

```text
docs/v1-dogfood-smoke-suite.md
```

After this run, manual extension smoke is recorded as failed/blocked in:

```text
docs/v1-dogfood-smoke-suite.md
```

Carry-over from completed portal dogfood:

- Manual portal smoke completed with non-blocking limitations in `docs/plan/071-manual-portal-dogfood.md`.
- Do not assume portal-only findings apply to the extension without extension evidence.
- If the API and web portal run on different ports, record both origins and verify extension portal-opening behavior after `Open active capture` and `Finish capture`.
- Keep using safe synthetic data and do not commit screenshots, invite tokens, extension storage, local storage files, or `apps/extension/dist`.

## Scope

Included:

- start from a disposable, migrated testing database or an explicitly approved development database
- create or reuse a safe smoke owner/project before extension capture
- build extension
- load unpacked extension in Chrome or Chromium
- configure instance URL
- sign in
- select project
- run automatic click capture on a safe test page
- verify portal capture detail receives ordered screenshot-backed click events
- verify extension-opened portal routes use a browser-facing URL that actually works in the local split API/web setup
- verify pause/resume behavior
- verify manual screenshot fallback
- finish capture and open portal detail
- generate guide from automatic click events
- generate interactive demo from automatic click events
- verify click position metadata is useful for guide annotations or demo hotspots
- test restricted/unsupported page behavior enough to record current limitations
- update smoke result log
- create follow-up reliability plans for meaningful failures

## Explicit Non-Goals

- implementing background-owned capture state
- implementing navigation capture
- implementing overlays
- implementing domain exclusion controls
- implementing Chrome Web Store packaging
- adding HTML replay
- collecting raw input values
- collecting full DOM HTML
- rewriting popup UI broadly

## Safe Test Page

Use a safe `http` or `https` page with no secrets.

Preferred options:

- local static page served from the repo or `/tmp`
- local dev app route with synthetic content
- public example page with no login and no personal data

The page should include:

- several normal clickable buttons/links
- at least one form input to confirm inputs are skipped
- text labels long enough to test truncation behavior
- navigation or route change if safe to test current behavior

Do not use:

- customer systems
- internal production systems
- password managers
- private admin portals
- pages containing tokens or personal data

## Expected File Touches

Expected docs updates:

```text
docs/v1-dogfood-smoke-suite.md
docs/plan/072-manual-extension-dogfood.md
```

Conditional docs updates:

```text
apps/extension/README.md
docs/plan/master/001-alpha-hardening-master-plan.md
docs/plan/<new-extension-follow-up-plan>.md
```

Expected pages and surfaces to exercise:

- Chrome or Chromium extension management page for loading unpacked extension
- extension popup
- safe synthetic test page
- portal capture session detail
- guide generation and guide editor for extension events
- interactive demo generation and demo editor for extension events
- unsupported or restricted browser page behavior

Do not commit `apps/extension/dist`. Product source files should stay untouched unless a tiny smoke-blocking fix is required. Any product fix made during this plan must be called out in the result log and implementation notes.

## Expected Environment

Before starting:

- confirm whether the run uses the `development` or `testing` `.env-cmdrc` environment
- prefer a disposable clean testing database for browser dogfood
- do not drop a developer's non-disposable database without an explicit operator decision
- record the actual DB name or disposable environment label in the result log
- record the API instance URL used by the extension
- record the browser-facing portal URL used for portal verification
- record local storage root and confirm extension-created screenshots land there

Port/origin alignment:

- the extension instance URL is the API origin used for API requests, for example `http://localhost:<server_port>`
- the web portal may run on a different origin, for example `http://localhost:3000`
- if API and web portal origins differ, explicitly verify `Open active capture` and `Finish capture` behavior rather than assuming the constructed portal route works
- if a workaround is needed to open the portal route, record it as a limitation

## Implementation Plan

### Manual Checklist

#### Setup

- [x] Start or confirm PostgreSQL.
- [x] Create or reset a safe disposable database.
- [x] Run migrations.
- [x] Start API server and record API instance URL.
- [x] Start web portal and record browser-facing portal URL.
- [x] Complete first-run setup or confirm the smoke owner already exists.
- [x] Confirm project exists for extension smoke.
- [x] Build extension with `rtk pnpm --filter extension build`.
- [x] Open `chrome://extensions`.
- [x] Enable Developer mode.
- [x] Load unpacked extension from `apps/extension/dist`.
- [x] Record Chrome or Chromium version.

#### Connect And Sign In

- [x] Open extension popup.
- [x] Configure API instance URL, for example `http://localhost:<server_port>`.
- [x] Sign in with owner account.
- [x] Confirm project list loads.
- [x] Select the smoke project.
- [x] Close and reopen popup to confirm selected project persists.

#### Automatic Capture

- [x] Open safe test page in active tab.
- [x] Start automatic capture.
- [x] Confirm popup shows active automatic capture state.
- [x] Click a supported button or link.
- [ ] Confirm extension does not capture clicks on input fields or editable content. Blocked because no automatic events were captured at all.
- [x] Click multiple supported targets.
- [x] Open portal capture detail without finishing.
- [ ] Confirm ordered screenshot-backed `click` events arrive. Failed: no click events or files were created.
- [ ] Confirm each event links to a screenshot asset. Failed: no click events or files were created.
- [ ] Confirm metadata is safe and useful. Failed: no click events were available to inspect.
  - page URL/title
  - target text or label
  - role
  - selector/test id when available
  - client coordinates
  - viewport dimensions
  - device pixel ratio
  - target bounding box
- [x] Confirm no raw input value appears in event payload or portal UI.
- [x] Confirm DB events remain `input_value_redacted = true`.

#### Pause, Resume, Fallback

- [x] Pause automatic capture.
- [ ] Click supported targets while paused. Not meaningful because automatic capture produced no events while unpaused.
- [x] Confirm no new automatic click events are recorded while paused.
- [x] Resume automatic capture.
- [ ] Click supported target and confirm event is recorded. Failed: no automatic events were created after resume.
- [x] Use manual screenshot fallback.
- [ ] Confirm fallback creates screenshot-backed `capture` event. Failed: no fallback upload/event request was observed.
- [ ] Confirm event ordering remains correct after fallback. Blocked because fallback did not create an event.
- [ ] Confirm local file storage contains extension-created screenshots and no storage paths are exposed in public data. Failed: no extension-created files were stored.

#### Finish And Artifact Creation

- [x] Finish capture from extension.
- [x] Confirm active capture state clears locally.
- [ ] Confirm portal opens completed capture session detail. Failed in split API/web setup: extension opened the API origin.
- [x] If API and web portal origins differ, confirm whether the extension-opened URL is usable or record the exact workaround.
- [ ] Generate guide from extension click events. Blocked because no extension events were captured.
- [ ] Generate interactive demo from extension click events. Blocked because no extension events were captured.
- [ ] Confirm guide steps use useful deterministic text. Blocked because no guide could be generated from extension events.
- [ ] Confirm demo scenes use screenshots. Blocked because no demo could be generated from extension events.
- [ ] Verify click positions can become guide annotations or demo hotspots. Blocked because no click metadata was captured.

#### Unsupported Page Behavior

- [x] Try a restricted page such as `chrome://extensions` only if safe.
- [x] Confirm extension fails gracefully or does not capture.
- [x] Try a page where content scripts cannot run if available. Covered by `chrome://extensions`; no separate page was needed.
- [x] Record exact user-facing error/recovery behavior.

#### Cleanup

- [x] Remove or ignore generated `apps/extension/dist`.
- [x] Remove temporary safe test page artifacts.
- [x] Confirm no screenshots, extension storage dumps, cookies, session tokens, or local storage files are staged.

## Implementation Notes

Run completed on 2026-06-22 against commit `1da95db` with the `testing` `.env-cmdrc` environment.

Environment:

- Testing database label: `test-dc`.
- API instance URL configured in extension: `http://localhost:4021`.
- Browser-facing portal URL: `http://localhost:3000`.
- Safe test page: `http://127.0.0.1:4179` served from `/tmp/demo-composer-extension-dogfood`.
- Extension build path: `apps/extension/dist`.
- Browser: Chrome `149.0.0.0` via `agent-browser`, loaded as unpacked extension `cohepadogfeidambknedbdflmcjepaam`.
- Local storage root checked: `apps/server/storage`.

Verification performed:

- `rtk pnpm --filter extension test` passed.
- `rtk pnpm --filter extension build` passed.
- Testing DB was dropped, recreated, and migrated before the browser run.
- `/healthz` and `/readyz` returned `200`.
- First-run setup, owner login, and smoke project creation passed through the portal.
- Extension instance setup, sign-in, project list loading, project selection, selected-project persistence, start capture, pause, resume, finish, and local active-capture-state clearing passed.

Failures and limitations:

- Automatic click capture created a backend capture session but produced zero click events and zero screenshot files after multiple supported clicks on a safe HTTP page.
- Input field typing did not leak into backend data; however, this is only because no automatic events were created.
- Manual screenshot fallback produced no upload/event request, no UI error, no file record, and no capture event in this automation run.
- `Open in portal` and `Finish capture` opened `http://localhost:4021/projects/...`, which is the API origin and returned a 404 JSON response. Opening the equivalent `http://localhost:3000/projects/...` route worked.
- Guide/demo generation from extension events was blocked because the completed capture session had no events or assets.

Carry these findings into `docs/plan/076-extension-capture-reliability-v2.md`.

## Missed Work To Carry Forward

Do not reopen this evidence phase as an implementation bucket. Carry the failed proof points into Phase 7:

- Reproduce automatic click capture in a headed/manual browser and determine whether the failure is automation-specific or a product bug.
- Make manual screenshot fallback either upload and record a `capture` event or surface a clear user-facing failure.
- Split extension API origin from browser-facing portal origin so `Open in portal` and `Finish capture` work in local split-port setups.
- Keep extension-captured product screenshots out of Phase 4 until capture has a passing or explicitly bounded path.
- Re-run guide/demo generation from extension events after extension capture reliability is fixed.

## Result Recording

Update:

```text
docs/v1-dogfood-smoke-suite.md
```

Record:

- date
- commit
- environment
- browser version
- extension build path
- instance URL
- portal URL
- database/environment label
- storage root
- automated smoke status if rerun
- manual portal smoke status if already run
- manual extension smoke status
- flows passed
- flows failed
- known limitations
- follow-up plans/issues

## Failure Handling

For each failure:

- record the exact step
- record expected vs actual behavior
- record whether active capture state was preserved
- record whether backend data was partially created
- record whether user could recover without manual DB/storage cleanup
- create follow-up plan for reliability issues

Do not fix broad reliability problems inside this dogfood plan. This plan produces evidence for Phase 7.

## Testing Plan

Run before the manual browser pass if not already fresh:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension build
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:setup
rtk git diff --check
```

Only run `rtk pnpm --filter server test:smoke` before the manual extension pass if the database has been reset for that suite. Do not run `test:smoke` against the same first-run state intended for manual browser dogfood unless the database is reset afterwards.

Manual browser testing is required for this plan. Unit tests alone do not complete it.

## Acceptance Criteria

- Extension is built and loaded unpacked.
- Instance configuration and extension sign-in are verified.
- Automatic click capture is tested on a safe page.
- Pause/resume behavior is verified.
- Manual screenshot fallback is verified or has a specific failure recorded.
- Finish-to-portal behavior is verified or has a specific failure recorded.
- Guide and interactive demo creation from extension events is verified or has a specific blocker recorded.
- Unsafe input value collection is not observed.
- Unsupported page behavior is recorded.
- Result is logged in `docs/v1-dogfood-smoke-suite.md`.
- Meaningful failures have follow-up plans or explicit limitations.
- API/web split-origin behavior is recorded, including whether extension-opened portal links work.
- Generated extension build artifacts and screenshots are not committed.

## Documentation Updates

Expected:

```text
docs/v1-dogfood-smoke-suite.md
```

Conditional:

```text
apps/extension/README.md
docs/project-zoomout-status.md
docs/plan/058-extension-automatic-event-capture-roadmap.md
docs/plan/master/001-alpha-hardening-master-plan.md
```

Update the master plan completion table only if this plan is completed.

## Suggested Commit Shape

Recommended:

```text
Record manual extension dogfood smoke
```

If reliability follow-up plans are added:

```text
Document extension dogfood reliability follow-ups
```

## Follow-Up Plans

Likely next related plan:

```text
docs/plan/076-extension-capture-reliability-v2.md
```

Potential follow-ups:

- background-owned active capture state
- navigation handling
- unsupported page recovery
- upload retry and recovery
- page exclusion controls
- visible capture status indicator
