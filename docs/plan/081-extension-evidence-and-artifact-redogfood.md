# Extension Evidence And Artifact Re-Dogfood Plan

Date: 2026-06-23

Status: Planned.

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

### 1. Prepare Safe Evidence Environment

- [ ] Use safe synthetic project data.
- [ ] Use a safe `http` or `https` test page.
- [ ] Start API and portal.
- [ ] Build and load unpacked extension.
- [ ] Configure instance URL and portal URL.
- [ ] Record commit, browser version, API URL, portal URL, and storage root.
- [ ] Record extension version, extension build path, active capture session ID, and safe test page URL.

### 2. Run Extension Capture

- [ ] Start extension capture.
- [ ] Capture several supported clicks.
- [ ] Inspect automatic capture popup diagnostics after supported clicks.
- [ ] Use manual fallback and inspect manual screenshot diagnostics.
- [ ] Finish capture.
- [ ] Confirm portal opens the capture detail.
- [ ] Confirm extension-created events and assets exist.
- [ ] Confirm storage files exist under configured local storage root.
- [ ] Record service-worker, content-script, or browser permission evidence when available.

### 3. Inspect Safety And Quality

- [ ] Confirm no raw input values are captured and `input_value_redacted` stays true.
- [ ] Confirm no page HTML is captured.
- [ ] Confirm diagnostics do not store page URLs, screenshot bytes, tokens, cookies, storage keys, or page HTML.
- [ ] Inspect target text, role, selector, coordinates, viewport, and bounding box metadata.
- [ ] Confirm source capture URL/title metadata is limited to the safe synthetic test page.
- [ ] Confirm metadata is useful enough for guide/demo generation.
- [ ] Confirm public APIs do not expose storage keys or private metadata.

### 4. Generate Artifacts

- [ ] Generate guide from extension capture.
- [ ] Preview guide.
- [ ] Generate interactive demo from extension capture.
- [ ] Preview or publish demo if safe.
- [ ] Record any artifact quality limitations.

### 5. Add Visual Evidence If Truthful

- [ ] Decide whether extension screenshots are warranted.
- [ ] Capture safe screenshots at consistent viewport sizes.
- [ ] Redact local URLs, emails, tokens, or paths if visible.
- [ ] Add screenshots under `docs/assets/alpha/` only if they reflect real behavior.
- [ ] Update README/status docs only with evidence-backed claims.

### 6. Update Tracking

- [ ] Record result in dogfood smoke suite.
- [ ] Add implementation/evidence notes to this plan.
- [ ] Update master plan phase tracking after completion.

## Testing Plan

Expected:

```bash
rtk pnpm --filter extension build
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

If this run finds new reliability bugs, record them as follow-up candidates rather than mixing broad fixes into this evidence plan.
