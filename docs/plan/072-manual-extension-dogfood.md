# Manual Extension Dogfood Plan

Date: 2026-06-22

Status: Planned.

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

Manual extension smoke is currently pending in:

```text
docs/v1-dogfood-smoke-suite.md
```

## Scope

Included:

- build extension
- load unpacked extension in Chrome or Chromium
- configure instance URL
- sign in
- select project
- run automatic click capture on a safe test page
- verify portal capture detail receives ordered screenshot-backed click events
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

## Implementation Plan

### Manual Checklist

#### Setup

- [ ] Confirm API and web portal are running.
- [ ] Confirm project exists for extension smoke.
- [ ] Build extension with `rtk pnpm --filter extension build`.
- [ ] Open `chrome://extensions`.
- [ ] Enable Developer mode.
- [ ] Load unpacked extension from `apps/extension/dist`.
- [ ] Record Chrome or Chromium version.

#### Connect And Sign In

- [ ] Open extension popup.
- [ ] Configure instance URL, for example `http://localhost:3002`.
- [ ] Sign in with owner account.
- [ ] Confirm project list loads.
- [ ] Select the smoke project.
- [ ] Close and reopen popup to confirm selected project persists.

#### Automatic Capture

- [ ] Open safe test page in active tab.
- [ ] Start automatic capture.
- [ ] Confirm popup shows active automatic capture state.
- [ ] Click a supported button or link.
- [ ] Confirm extension does not capture clicks on input fields or editable content.
- [ ] Click multiple supported targets.
- [ ] Open portal capture detail without finishing.
- [ ] Confirm ordered screenshot-backed `click` events arrive.
- [ ] Confirm each event links to a screenshot asset.
- [ ] Confirm metadata is safe and useful:
  - page URL/title
  - target text or label
  - role
  - selector/test id when available
  - client coordinates
  - viewport dimensions
  - device pixel ratio
  - target bounding box
- [ ] Confirm no raw input value appears in event payload or portal UI.

#### Pause, Resume, Fallback

- [ ] Pause automatic capture.
- [ ] Click supported targets while paused.
- [ ] Confirm no new automatic click events are recorded while paused.
- [ ] Resume automatic capture.
- [ ] Click supported target and confirm event is recorded.
- [ ] Use manual screenshot fallback.
- [ ] Confirm fallback creates screenshot-backed `capture` event.
- [ ] Confirm event ordering remains correct after fallback.

#### Finish And Artifact Creation

- [ ] Finish capture from extension.
- [ ] Confirm active capture state clears locally.
- [ ] Confirm portal opens completed capture session detail.
- [ ] Generate guide from extension click events.
- [ ] Generate interactive demo from extension click events.
- [ ] Confirm guide steps use useful deterministic text.
- [ ] Confirm demo scenes use screenshots.
- [ ] Verify click positions can become guide annotations or demo hotspots.

#### Unsupported Page Behavior

- [ ] Try a restricted page such as `chrome://extensions` only if safe.
- [ ] Confirm extension fails gracefully or does not capture.
- [ ] Try a page where content scripts cannot run if available.
- [ ] Record exact user-facing error/recovery behavior.

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
rtk pnpm --filter server test:smoke
rtk git diff --check
```

Manual browser testing is required for this plan. Unit tests alone do not complete it.

## Acceptance Criteria

- Extension is built and loaded unpacked.
- Instance configuration and extension sign-in are verified.
- Automatic click capture is tested on a safe page.
- Pause/resume behavior is verified.
- Manual screenshot fallback is verified.
- Finish-to-portal behavior is verified.
- Guide and interactive demo creation from extension events is verified.
- Unsafe input value collection is not observed.
- Unsupported page behavior is recorded.
- Result is logged in `docs/v1-dogfood-smoke-suite.md`.
- Meaningful failures have follow-up plans or explicit limitations.

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
