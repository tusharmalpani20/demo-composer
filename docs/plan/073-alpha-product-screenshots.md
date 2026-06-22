# Alpha Product Screenshots Plan

Date: 2026-06-22

Status: Completed with portal-only visual evidence.

Completion update: this plan is closed as the portal visual-evidence phase. It added README screenshots from safe synthetic portal/public routes, updated status docs, and kept extension visuals out of scope because extension dogfood is failed/blocked. Remaining visual work should happen through follow-up plans, not by reopening this phase.

## Parent Master Plan

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

This is Phase 4 of the alpha hardening master plan.

## Goal

Add real, safe product screenshots to the public alpha documentation after portal dogfood has produced trustworthy screens and extension dogfood has identified current visual limits.

Target outcome:

```text
external reader opens README
  -> sees real Demo Composer screens
  -> understands capture, guide, demo, and publish shape
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

- screenshots should come from real dogfood flows or a clean synthetic scenario that follows those flows
- screenshots should reflect current product behavior
- dogfood may reveal UI states that should or should not be shown publicly
- extension dogfood is currently blocked, so extension screenshots must not be used as proof of working browser capture

## Current Baseline

Before this plan, README stated product screenshots were still pending.

Known state before implementation:

- no real product screenshots are committed
- docs use textual product description
- `apps/docs` remains starter content and is not canonical product docs
- public docs should not claim screenshots exist until this plan lands
- extension dogfood is failed/blocked, so portal screenshots can land now while extension visual evidence waits for Phase 7

After this plan:

- README includes six real portal/public screenshots from safe synthetic data.
- Screenshot assets live under `docs/assets/alpha/`.
- Extension screenshots remain pending until Phase 7 fixes or explicitly bounds extension capture.

## Scope

Included:

- choose screenshot set
- create safe synthetic data for screenshots
- capture real portal screenshots from local or test environment
- store images under `docs/assets/`
- update README with a compact visual section
- update status docs if they currently say screenshots are pending
- link README/status docs to the dated dogfood smoke result that produced the screenshots
- document that screenshots use synthetic data
- decide whether `apps/docs` should remain ignored/parked or get a separate follow-up plan
- carry extension screenshot work forward until extension capture has a passing or explicitly bounded path

## Explicit Non-Goals

- generated UI mockups
- fake screenshots
- customer or private screenshots
- visual redesign
- implementing a real docs website in `apps/docs`
- using extension screenshots as proof of working capture before Phase 7 resolves or bounds extension dogfood failures
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

## Implementation Notes

Run completed on 2026-06-23 local time against the `testing` `.env-cmdrc` environment, using the 2026-06-22 portal dogfood evidence as the baseline.

Environment:

- API: `http://localhost:4021`.
- Web portal: `http://localhost:3000` with `VITE_DEMO_COMPOSER_API_URL=http://localhost:4021`.
- Disposable database label: `test-dc`.
- Browser automation: `agent-browser` at `1440x900`.
- Synthetic owner: `owner@example.com`.
- Synthetic organization: `V1 Smoke Org`.
- Synthetic project: `V1 Dogfood Project`.
- Capture session: `Create department workflow`.
- Guide: `Department setup guide`.
- Interactive demo: `Create department workflow`.

Committed assets:

```text
docs/assets/alpha/alpha-project-workspace.png
docs/assets/alpha/alpha-capture-session-detail.png
docs/assets/alpha/alpha-guide-editor.png
docs/assets/alpha/alpha-public-guide-reader.png
docs/assets/alpha/alpha-demo-editor.png
docs/assets/alpha/alpha-public-demo-viewer.png
```

Verification performed:

- seeded safe synthetic portal data through real API calls
- captured screenshots through the running web portal and public routes
- confirmed all committed images are `1440x900`
- visually inspected a contact sheet for blank screens, broken routes, tokens, and private data

Limitations:

- Extension screenshots were intentionally excluded because Phase 3 extension dogfood failed/blocked.
- The screenshot source data is synthetic and should not be treated as customer evidence.

Missed work to carry forward:

- Add extension visual evidence after Phase 7 fixes or explicitly bounds extension capture.
- Consider a later screenshot refresh cadence after guide/editor and demo hardening changes the UI.
- Consider replacing the README image tables with a lighter gallery or docs-site page if the README becomes too image-heavy.
- Keep `apps/docs` as starter content for now; create a separate docs-site plan before presenting it as product documentation.

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
- manual extension smoke has run and has explicit failed/blocked limitations recorded
- any known UI limitations are understood before choosing screenshots

If manual dogfood has not run, do not proceed with screenshots. Return to Phase 2 or Phase 3.

Current note after 2026-06-22 dogfood:

- Portal dogfood has acceptable non-blocking limitations for visual evidence.
- Extension dogfood is blocked by capture failures, so do not use extension capture screens as proof until Phase 7 fixes or explicitly bounds the failure.
- This implementation should produce portal screenshots only. Keep an explicit note that extension screenshots remain pending.

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

Do not include extension popup screenshots in this implementation. Phase 3 completed as a failed/blocked smoke run, so extension visual evidence should wait until Phase 7 fixes or explicitly bounds the capture path.

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
- Extension screenshots remain explicitly pending because extension dogfood failed/blocked.
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
- extension visual evidence after Phase 7
- landing README visual polish
- short product demo GIF or video plan
