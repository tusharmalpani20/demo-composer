# Extension Evidence And Artifact Re-Dogfood Plan

Date: 2026-06-23

Status: Completed with follow-up notes.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 4 of the alpha follow-through master plan.

## Goal

Prove extension-created capture data can produce guide/demo artifacts and add extension visual evidence only if truthful.

Target outcome:

```text
extension capture creates events/assets
  -> guide generation works from extension data
  -> interactive demo generation works from extension data
  -> click metadata is safe and useful
  -> docs get extension screenshots only if evidence supports them
```

## Dependencies

Should start after:

```text
docs/plan/078-split-origin-url-hardening.md
docs/plan/079-extension-automatic-capture-reliability-v3.md
docs/plan/080-extension-manual-fallback-diagnostics.md
```

If either dependency is incomplete or blocked, this plan should become an evidence run that records the blocker instead of forcing screenshots.

Reason:

- extension evidence needs correct portal URL behavior plus at least one working extension capture or fallback path

## Current Baseline

Extension dogfood in plan `072` could not generate guide/demo artifacts because no extension-created events or assets existed. Plan `073` therefore added portal-only visual evidence and kept extension screenshots pending.

Plans `079` and `080` added persisted popup diagnostics for automatic click capture and manual screenshot fallback, but they intentionally did not claim headed-browser success. This phase must treat those diagnostics as evidence to verify in a real browser, not as proof that extension capture now works end to end.

Carry-forward items from the previous extension slices:

- record the exact API origin, portal origin, extension version/build, browser, and active capture session used for the run
- verify whether supported automatic clicks create screenshot-backed events or show the new automatic diagnostic
- verify whether manual screenshot fallback creates a screenshot-backed event or shows the new manual diagnostic
- collect service-worker/browser permission evidence where practical
- verify that a screenshot-backed extension capture can feed guide/demo artifact work before adding extension screenshots
- if no diagnostic appears in a headed run, record popup lifecycle, browser screenshot permission, content-script injection, or service-worker evidence as the next likely investigation area

## Scope

Included:

- run a fresh extension dogfood scenario
- confirm extension-created events and assets exist
- verify both automatic click capture diagnostics and manual screenshot fallback diagnostics
- record service-worker, content-script, and browser permission evidence where practical
- inspect click metadata safety and usefulness
- generate a guide from extension capture data
- generate an interactive demo from extension capture data
- capture safe extension screenshots only if the workflow is true
- update README/status docs if extension visual evidence is added

## Explicit Non-Goals

- fixing broad automatic/manual capture bugs discovered during the run
- marketing screenshots that overstate extension reliability
- using private pages or real customer data
- HTML replay

## Expected File Touches

Likely docs:

```text
docs/v1-dogfood-smoke-suite.md
docs/plan/081-extension-evidence-and-artifact-redogfood.md
docs/plan/master/002-alpha-follow-through-master-plan.md
```

Conditional:

```text
README.md
docs/project-zoomout-status.md
docs/oss-alpha-summary.md
docs/roadmap.md
docs/assets/alpha/
apps/extension/README.md
```

## Implementation Plan

## Implementation Notes

Completed on 2026-06-30 local time.

This phase was completed as a fresh evidence run, not as successful extension screenshot/artifact proof.

Run metadata:

- commit before the evidence-doc update: `7faa0da`
- API origin: `http://localhost:4021`
- portal origin: `http://localhost:3000`
- safe test page: temporary local page served at `http://127.0.0.1:4179/tmp-extension-dogfood-page.html`
- local storage root: `apps/server/storage`
- extension build path: `apps/extension/dist`
- extension id/version: `cohepadogfeidambknedbdflmcjepaam` / `0.1.0`
- browser: Chrome `149.0.0.0` through `agent-browser`
- project: `01KWCF7MTZXVDBP0H564E1HDYQ`
- capture session: `01KWCFBS480QYXSCY8005F5EZ1`

Verification run:

- `rtk pnpm --filter extension test`
- `rtk pnpm --filter extension check-types`
- `rtk pnpm --filter extension build`
- `rtk pnpm --filter server test:smoke`
- `rtk git diff --check`

What passed:

- extension loaded unpacked and was enabled
- extension site access was set to all sites
- instance URL and portal URL were configured separately
- extension sign-in and project selection worked
- starting capture created an extension-sourced backend capture session
- supported safe-page clicks produced a popup-visible automatic capture diagnostic instead of failing silently
- direct manual fallback attempt produced a popup-visible manual diagnostic and preserved active capture state
- `Open in portal` and `Finish capture` opened the capture detail on the portal origin
- finishing capture completed the backend session and cleared local active-capture state
- the portal could inspect the completed extension-sourced capture session

What remains blocked:

- automatic click capture created zero events and zero assets
- the automatic diagnostic was: `Either the '<all_urls>' or 'activeTab' permission is required.`
- direct extension-page manual fallback automation produced `Could not capture screenshot.`
- no screenshot-backed extension capture existed, so guide/demo generation from extension data remains blocked
- creating a guide from the empty extension capture produced an empty guide and is not valid artifact evidence
- interactive demo generation from the empty extension capture did not create a demo in this browser pass
- no extension screenshots were added because they would overstate the evidence

Privacy/safety result:

- no raw input values, page HTML, screenshot bytes, tokens, cookies, storage keys, or extension storage dumps were committed
- diagnostics stored only status, message, optional event index, and timestamp
- source page URL/title metadata could not be inspected on events/assets because none were created

Missed or deferred work to keep as follow-up candidates:

- fix or redesign extension screenshot permission behavior for background automatic capture; the current MV3 `activeTab` flow did not authorize `captureVisibleTab` during safe-page automatic capture
- verify whether adding an explicit `<all_urls>` permission, requesting active tab access through the browser action, or moving screenshot capture into a user-gesture path is the right product tradeoff
- run a true toolbar-popup manual fallback happy path, because direct `chrome-extension://.../index.html` automation is not equivalent to a human toolbar popup capturing the active tab
- add a browser-run assertion that manual fallback uploads a screenshot-backed event once permission behavior is fixed
- add a portal guard or clearer empty-state behavior for artifact creation from captures with zero events/assets
- keep extension visual evidence pending until at least one extension-created screenshot-backed event can generate non-empty guide/demo artifacts

### 1. Prepare Safe Evidence Environment

- [x] Use safe synthetic project data.
- [x] Use a safe `http` or `https` test page.
- [x] Start API and portal.
- [x] Build and load unpacked extension.
- [x] Configure instance URL and portal URL.
- [x] Record commit, browser version, API URL, portal URL, and storage root.
- [x] Record extension version, extension build path, active capture session ID, and safe test page URL.

### 2. Run Extension Capture

- [x] Start extension capture.
- [x] Capture several supported clicks.
- [x] Inspect automatic capture popup diagnostics after supported clicks.
- [x] Use manual fallback and inspect manual screenshot diagnostics.
- [x] Finish capture.
- [x] Confirm portal opens the capture detail.
- [ ] Confirm extension-created events and assets exist. Blocked: zero events/assets were created.
- [ ] Confirm storage files exist under configured local storage root. Blocked: no assets were uploaded.
- [x] Record service-worker, content-script, or browser permission evidence when available.

### 3. Inspect Safety And Quality

- [ ] Confirm no raw input values are captured and `input_value_redacted` stays true. Blocked: no extension events were created.
- [x] Confirm no page HTML is captured.
- [x] Confirm diagnostics do not store page URLs, screenshot bytes, tokens, cookies, storage keys, or page HTML.
- [ ] Inspect target text, role, selector, coordinates, viewport, and bounding box metadata. Blocked: no extension click events were created.
- [ ] Confirm source capture URL/title metadata is limited to the safe synthetic test page. Blocked: no extension events/assets were created.
- [ ] Confirm metadata is useful enough for guide/demo generation. Blocked: no extension events/assets were created.
- [ ] Confirm public APIs do not expose storage keys or private metadata. Blocked for extension-created assets because no assets were uploaded.

### 4. Generate Artifacts

- [ ] Generate guide from extension capture. Empty guide was created from an empty extension capture; this is not valid extension-data evidence.
- [ ] Preview guide. Not useful because the generated guide had no source blocks.
- [ ] Generate interactive demo from extension capture. Blocked: no demo was created from the empty capture in this browser pass.
- [ ] Preview or publish demo if safe. Blocked: no demo was created.
- [x] Record any artifact quality limitations.

### 5. Add Visual Evidence If Truthful

- [x] Decide whether extension screenshots are warranted.
- [ ] Capture safe screenshots at consistent viewport sizes. Not done because screenshots would overstate extension capture reliability.
- [ ] Redact local URLs, emails, tokens, or paths if visible. Not applicable; no screenshots added.
- [ ] Add screenshots under `docs/assets/alpha/` only if they reflect real behavior. Not done.
- [ ] Update README/status docs only with evidence-backed claims. Not needed because no extension visual evidence was added.

### 6. Update Tracking

- [x] Record result in dogfood smoke suite.
- [x] Add implementation/evidence notes to this plan.
- [x] Update master plan phase tracking after completion.

## Testing Plan

Expected:

```bash
rtk pnpm --filter extension build
rtk git diff --check
```

Completed verification:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension build
rtk pnpm --filter server test:smoke
rtk git diff --check
```

Run broader checks if code changes:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter web test
rtk pnpm --filter server test
```

## Acceptance Criteria

- Extension dogfood has a fresh dated result.
- Guide/demo generation from extension data is proven or blocked with a specific cause.
- Any extension screenshots use safe synthetic data.
- Docs do not overstate extension reliability.
- No private data, tokens, cookies, or local storage files are committed.

## Follow-Up Notes

Completion status:

- This plan is complete as an evidence run.
- It did not complete the original ideal outcome of extension-created events driving guide/demo artifacts.
- The artifact path is explicitly blocked by extension screenshot permission behavior, not by missing guide/demo server smoke coverage.

Carry these missed items into the next relevant extension plan:

- fix or redesign MV3 screenshot permission behavior for background automatic capture
- decide whether the product should request explicit `<all_urls>`, rely on browser-action active-tab grants, or move screenshot capture into a user-gesture path
- run a true toolbar-popup manual fallback happy path after permission behavior is fixed
- verify manual fallback uploads a screenshot-backed event and preserves event ordering in a real browser
- verify automatic capture creates screenshot-backed click events, including target metadata, in a real browser
- add portal guardrails for creating guide/demo artifacts from captures with zero events/assets
- keep extension screenshots and public extension claims pending until extension-created screenshot-backed events can produce non-empty guide/demo artifacts
