# Alpha Product Screenshots Plan

Date: 2026-06-22

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

This is Phase 4 of the alpha hardening master plan.

## Goal

Add real, safe product screenshots to the public alpha documentation after portal and extension dogfood have produced trustworthy screens.

Target outcome:

```text
external reader opens README
  -> sees real Demo Composer screens
  -> understands capture, guide, demo, publish, and extension shape
  -> sees alpha limitations clearly
  -> does not mistake mockups for implemented behavior
```

This plan is about truthful visual evidence, not marketing redesign.

## Dependencies

Should start after:

```text
docs/plan/071-manual-portal-dogfood.md
docs/plan/072-manual-extension-dogfood.md
```

Reason:

- screenshots should come from real dogfood flows
- screenshots should reflect current product behavior
- dogfood may reveal UI states that should or should not be shown publicly

## Current Baseline

Current README states product screenshots are still pending.

Known current state:

- no real product screenshots are committed
- docs use textual product description
- `apps/docs` remains starter content and is not canonical product docs
- public docs should not claim screenshots exist until this plan lands

## Scope

Included:

- choose screenshot set
- create safe synthetic data for screenshots
- capture real screenshots from local or test environment
- store images under `docs/assets/`
- update README with a compact visual section
- update status docs if they currently say screenshots are pending
- link README/status docs to the dated dogfood smoke result that produced the screenshots
- document that screenshots use synthetic data
- decide whether `apps/docs` should remain ignored/parked or get a separate follow-up plan

## Explicit Non-Goals

- generated UI mockups
- fake screenshots
- customer or private screenshots
- visual redesign
- implementing a real docs website in `apps/docs`
- adding analytics, lead capture, branding, or hosted SaaS language
- changing product behavior to make screenshots look better

## Screenshot Set

Recommended minimum set:

- portal project workspace
- capture session detail with safe screenshot-backed events
- guide editor with screenshot annotation
- public guide reader
- interactive demo editor with scene and hotspot
- public interactive demo viewer
- extension popup during active automatic capture

Optional if useful:

- first-run setup
- organization invite page
- guide publish controls
- demo publish controls
- password gate

Avoid overloading README. Prefer a few strong images and link to more if needed.

## Expected File Touches

Expected docs and assets:

```text
README.md
docs/assets/
docs/plan/073-alpha-product-screenshots.md
```

Required evidence source:

```text
docs/v1-dogfood-smoke-suite.md
```

Conditional docs:

```text
docs/project-zoomout-status.md
docs/oss-alpha-summary.md
docs/v1-dogfood-smoke-suite.md
docs/plan/master/001-alpha-hardening-master-plan.md
docs/plan/<new-docs-site-follow-up-plan>.md
```

Product source files should not change for this plan. If the app needs product changes before screenshots are truthful, stop and create a focused product-hardening plan instead.

## Asset Location And Naming

Recommended directory:

```text
docs/assets/
```

Recommended naming:

```text
alpha-project-workspace.png
alpha-capture-session-detail.png
alpha-guide-editor.png
alpha-public-guide-reader.png
alpha-demo-editor.png
alpha-public-demo-viewer.png
alpha-extension-popup.png
```

If using subdirectories:

```text
docs/assets/alpha/
```

Keep names stable and descriptive.

## Safe Data Rules

Screenshots must not contain:

- customer names
- private URLs
- production hostnames
- cookies
- bearer tokens
- invite tokens
- API keys
- local absolute storage paths
- private emails beyond `example.com`
- real internal product data

Use synthetic names:

```text
V1 Smoke Org
V1 Dogfood Project
Create department workflow
Department setup guide
owner@example.com
teammate@example.com
```

If a screenshot includes a localhost URL, decide whether to crop, redact, or leave it. Do not show tokens or secrets.

## Implementation Plan

### 1. Confirm Dogfood Evidence

Read:

```text
docs/v1-dogfood-smoke-suite.md
```

Confirm:

- manual portal smoke has passed or has acceptable limitations
- manual extension smoke has passed or has acceptable limitations
- any known UI limitations are understood before choosing screenshots

If manual dogfood has not run, do not proceed with screenshots. Return to Phase 2 or Phase 3.

Current note after 2026-06-22 dogfood:

- Portal dogfood has acceptable non-blocking limitations for visual evidence.
- Extension dogfood is blocked by capture failures, so do not use extension capture screens as proof until Phase 7 fixes or explicitly bounds the failure.

### 2. Prepare Synthetic Scenario

Use a clean or disposable environment.

Create:

- organization
- owner account
- project
- capture session
- safe screenshots
- guide
- interactive demo
- publish links if needed

Prefer dogfood-created data so screenshots match tested flows.

### 3. Capture Screenshots

Use consistent viewport sizes.

Suggested desktop size:

```text
1440x900
```

Suggested extension popup:

```text
actual Chrome extension popup size
```

For public reader/embed screenshots, capture the actual route as a viewer would see it.

Route patterns likely used for screenshots:

```text
/projects
/projects/:project_id
/projects/:project_id/capture-sessions/:capture_session_id
/projects/:project_id/guides/:guide_id
/projects/:project_id/guides/:guide_id/preview
/p/:slug
/p/:slug/embed
/projects/:project_id/interactive-demos/:interactive_demo_id
/d/:slug
/d/:slug/embed
```

For extension screenshots, capture the actual unpacked extension popup after Phase 3 has verified it.

### 4. Review And Redact

Before committing:

- inspect each image manually
- zoom in to check tokens, emails, URLs, and storage paths
- crop browser chrome if it contains unnecessary local details
- redact unsafe details if needed
- delete unsafe intermediate files

### 5. Add Assets

Add images under the chosen `docs/assets/` path.

Do not commit:

- raw screen recordings
- browser profile data
- local storage directories
- generated ZIP exports unless explicitly needed as fixtures

### 6. Update README

Update:

```text
README.md
```

Add:

- concise screenshots section
- captions that name the actual product surface
- note that images use synthetic data
- link to the dated dogfood smoke result or status entry that produced the screenshots
- links to relevant docs if useful

Keep README alpha-honest:

- no HTML replay claim
- no analytics claim
- no Chrome Web Store claim
- no production-ready claim

### 7. Update Status Docs

Update only if stale:

```text
docs/project-zoomout-status.md
docs/oss-alpha-summary.md
docs/roadmap.md
```

Remove or narrow "screenshots pending" language only after screenshots are committed.

### 8. Decide `apps/docs` Follow-Up

If `apps/docs` remains starter content:

- ensure README does not point users there as product docs
- optionally add a follow-up plan for a real docs landing site

If implementing `apps/docs` becomes desirable:

- create a separate child plan
- do not combine docs-site implementation with screenshot capture

## Testing Plan

Run:

```bash
rtk git diff --check
```

If README image links are added, verify locally by opening rendered Markdown or using the repository viewer if available.

If assets are large, check file sizes:

```bash
rtk ls -lh docs/assets
```

No app tests are required unless product code changes, which this plan should avoid.

## Acceptance Criteria

- README includes real screenshots from the current app.
- README or the linked status docs include dated dogfood smoke evidence for the screenshot set.
- Screenshots use safe synthetic data.
- Screenshots do not expose secrets, tokens, private URLs, or customer data.
- README captions are accurate.
- Docs no longer say screenshots are pending if screenshots are committed.
- Docs still clearly mark the project alpha.
- `apps/docs` starter status is not misrepresented as product docs.
- `rtk git diff --check` passes.

## Documentation Updates

Expected:

```text
README.md
docs/project-zoomout-status.md
docs/assets/
```

Conditional:

```text
docs/oss-alpha-summary.md
docs/roadmap.md
docs/plan/master/001-alpha-hardening-master-plan.md
docs/plan/078-docs-site-foundation.md
```

Use the next available plan number if creating a docs-site follow-up.

## Suggested Commit Shape

Recommended:

```text
Add alpha product screenshots
```

If a follow-up docs-site plan is added:

```text
Plan product docs site follow-up
```

## Follow-Up Plans

Possible follow-ups:

- real docs site foundation for `apps/docs`
- screenshot refresh cadence
- landing README visual polish
- short product demo GIF or video plan
