# Guide Editor V1 Hardening Plan

Date: 2026-06-22

Status: In progress; first focused implementation slice completed.

## Parent Master Plan

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

This is Phase 5 of the alpha hardening master plan.

## Goal

Improve guide authoring so repeated real usage feels reliable, understandable, and efficient.

Target outcome:

```text
portal user opens a generated guide
  -> edits title and steps
  -> manages screenshots and annotations
  -> adds useful content blocks
  -> previews and exports
  -> publishes or republishes with clear status
  -> recovers from errors without losing work
```

This plan should be driven by manual portal dogfood findings, not speculative redesign.

## Dependencies

Should start after:

```text
docs/plan/071-manual-portal-dogfood.md
docs/plan/073-alpha-product-screenshots.md
```

Reason:

- guide hardening priorities should come from observed authoring friction
- this phase should fix real issues, not redesign the editor without evidence
- Phase 4 added portal screenshots, so any guide editor UI change should note whether screenshot refresh is needed later

## Current Baseline

Guide capabilities currently include:

- guide creation from capture sessions
- guide editor
- block insertion/editing/reorder/delete
- step editing
- screenshot rendering
- screenshot selection
- direct screenshot upload
- rectangle annotations
- preview
- screenshot viewer
- Markdown export
- HTML ZIP export
- publish controls
- password controls
- embed-copy controls
- public guide reader and embed route

Manual portal dogfood on 2026-06-22 found one guide-specific blocker-level limitation:

- Generated guide editing, preview, screenshot viewer, annotation, export, publish, public, embed, and password-gate flows worked.
- Add-block controls for header, paragraph, tip, alert, and divider were visible but did not create blocks or API requests in the browser run.
- Guide block reordering was not covered because only generated step blocks existed after add-block controls failed.
- Some guide editor controls were more reliable through keyboard activation than pointer click in automation; investigate only where it reproduces outside the automation tool.

Carry-over from completed Phase 4:

- README portal screenshots now include the guide editor; if this phase changes guide editor visuals materially, note that screenshots may need a later refresh.
- Keep `apps/docs` as starter content in this phase. A real docs-site or gallery belongs in a separate follow-up plan.
- Do not add extension visual evidence here; that remains blocked on Phase 7 extension capture reliability.

Likely files:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/GuidePreviewPage.test.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.test.tsx
apps/web/src/features/guide/GuideScreenshotViewer.tsx
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.repository.ts
apps/server/src/modules/guide/guide.service.test.ts
apps/server/src/modules/guide/guide.routes.test.ts
```

## Scope

Included:

- audit guide editor dogfood notes
- fix or explicitly bound add-block controls for step, header, paragraph, tip, alert, and divider
- verify block insertion creates API calls and visible blocks
- verify block ordering after insertion remains understandable
- improve focused UI states only where needed for add-block reliability
- add focused tests
- update docs with behavior changes

## Explicit Non-Goals

- broad visual redesign
- replacing guide data model
- merging guides and interactive demos
- collaborative editing
- AI-generated guide suggestions
- HTML replay
- PDF/DOCX/Confluence/Notion exports
- analytics
- custom branding
- docs-site/gallery implementation
- screenshot refresh unless the guide editor visual change invalidates current README screenshots

## Discovery Checklist

Before implementation, review:

```text
docs/v1-dogfood-smoke-suite.md
docs/plan/035-guide-block-authoring-foundation.md
docs/plan/036-guide-step-screenshot-management.md
docs/plan/037-guide-editor-direct-screenshot-upload.md
docs/plan/039-guide-screenshot-annotations-foundation.md
docs/plan/040-guide-markdown-export.md
docs/plan/052-rich-html-zip-export-foundation.md
```

Then inspect current editor code and tests.

Record:

- what dogfood issue is being solved
- affected user workflow
- current behavior
- desired behavior
- files expected to change

## Expected File Touches

Exact files must be narrowed during discovery before implementation. Likely areas:

```text
apps/web/src/
apps/web/src/**/guide*
apps/web/src/**/Guides*
apps/web/src/**/Guide*
apps/server/src/modules/guide/
docs/plan/074-guide-editor-v1-hardening.md
```

Likely tests:

```text
apps/web/src/**/*.test.*
apps/server/src/modules/guide/**/*.test.ts
```

Conditional docs:

```text
docs/project-zoomout-status.md
README.md
docs/plan/master/001-alpha-hardening-master-plan.md
docs/plan/<new-guide-follow-up-plan>.md
```

Do not touch server guide contracts unless the selected dogfood issue requires a backend behavior change.

## Candidate Hardening Areas

Prioritize from dogfood evidence.

### Selected Slice: Block Authoring

Primary issue:

- add-block controls can appear inert even though they are visible

Required work:

- reproduce current behavior in tests before changing product code
- restore or verify add-block submission for step, header, paragraph, tip, alert, and divider blocks
- add tests that fail if visible add-block controls do not create blocks
- verify inserted blocks appear in the editor in the expected order
- verify guide block reordering can operate after a structural block exists
- keep generated step editing, screenshot rendering, annotations, publish, preview, and export behavior stable

Out of this slice unless discovered as directly blocking:

- screenshot picker redesign
- annotation tool redesign
- publish panel redesign
- export pipeline changes

### Deferred Candidate Areas

These remain useful but should not be mixed into the selected implementation unless directly required by the add-block fix.

#### Editing Flow

Potential issues:

- unclear dirty/saved state
- repeated step saves feel slow or fragile
- errors are too generic
- controls allow conflicting actions while busy
- archived/read-only guide behavior is unclear

### Block Authoring

Potential issues:

- add-block controls can appear inert even though they are visible
- insertion controls are hard to scan
- block movement loses orientation
- content block fields are unclear
- delete action lacks enough context

Possible work:

- improve block labels
- improve reorder feedback
- add focused confirmation only if needed
- improve empty-state copy

### Screenshot Management

Potential issues:

- screenshot picker lacks context
- direct upload failure is unclear
- hidden screenshot state is confusing
- selected vs source screenshot is unclear

Possible work:

- show page title, dimensions, and capture session context
- improve upload progress/error state
- clarify hide/remove/select behavior
- preserve layout while images load

### Annotations

Potential issues:

- annotation creation is too coarse
- rectangles are hard to understand
- removal is unclear
- annotation limits are unexplained

Possible work:

- clearer highlight list
- better visual affordances
- safer validation messages
- keyboard-accessible controls where practical

### Preview, Publish, Export

Potential issues:

- preview does not reflect latest unsaved state
- stale draft vs published snapshot is unclear
- export errors do not identify missing screenshot/file problem
- password/embed controls are cramped or unclear

Possible work:

- clearer stale publish badge
- better export failure messages
- better public link action state
- stronger tests around exported content

## Implementation Result: 2026-06-23

Completed slice:

- Add-block authoring coverage now includes step, header, paragraph, tip, alert, and divider insertion paths.
- Header insertion is covered together with post-insert guide block ordering.
- Non-step guide block actions now use type-specific labels such as `Move header 2 down` and `Delete header 3`, so inserted structural blocks are easier to identify while reordering or deleting.
- No backend contract changes were required.
- README guide editor screenshots do not need refresh from this slice because the visible editor layout did not materially change.

Verification run:

```bash
rtk pnpm --filter web test -- GuideEditorPage
rtk pnpm --filter web test
rtk pnpm --filter web check-types
rtk git diff --check
```

Results:

- `GuideEditorPage` focused suite passed with 36 tests after the recheck coverage addition.
- Full web suite passed with 292 tests.
- Web typecheck passed.
- Whitespace check passed.

Remaining work to keep as follow-up candidates:

- Manual browser smoke for the affected add-block workflow against a running app.
- Screenshot picker clarity and upload recovery.
- Annotation editing affordances.
- Publish stale-state clarity.
- Markdown and HTML ZIP export error messaging.

## Implementation Plan

### 1. Triage Dogfood Findings

- [x] Read portal dogfood result log.
- [x] Extract guide-specific issues.
- [x] Group issues by editing, blocks, screenshots, annotations, preview/publish/export.
- [x] Pick a small coherent slice: structural add-block reliability and post-insert ordering.
- [ ] Create separate follow-up plans for unrelated issues.

### 2. Audit Current Tests

- [x] Read guide editor tests.
- [x] Identify existing coverage for the selected issue.
- [x] Add failing tests before implementation when practical.
- [x] Avoid asserting private implementation details.

### 3. Implement Focused Fixes

- [x] Make minimal product changes for structural add-block reliability.
- [x] Keep existing API contracts unless server behavior must change.
- [x] Keep source capture immutable.
- [x] Keep guide blocks and guide steps first-class.
- [x] Preserve public snapshot safety.

### 4. Verify Guide Workflows

- [x] Run focused web guide tests.
- [x] Run focused server guide tests if backend changed.
- [ ] Manually smoke the affected guide editor workflow.
- [x] Confirm publish/export still work for affected guide.

### 5. Update Docs And Follow-Ups

- [x] Update plan implementation notes.
- [ ] Update README/status docs only if visible behavior changed.
- [x] Note whether current README guide editor screenshot needs later refresh.
- [ ] Create follow-up plans for remaining guide editor issues.
- [ ] Update master plan completion table if Phase 5 is complete.

## Testing Plan

Likely commands:

```bash
rtk pnpm --filter web test -- GuideEditorPage
rtk pnpm --filter web test -- GuidePreviewPage
rtk pnpm --filter web test -- PublicGuideReaderPage
rtk pnpm --filter web test
rtk pnpm --filter server test -- guide
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

Run DB tests if backend persistence changes:

```bash
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- Selected guide editor friction is explicitly tied to dogfood evidence.
- Guide editor workflow improves without broad redesign.
- Tests cover changed behavior.
- Existing guide creation, preview, export, publish, and public reader paths still pass.
- Source capture data remains immutable.
- Public snapshots remain free of storage keys and private metadata.
- Docs are updated only for real behavior changes.

## Documentation Updates

Expected:

```text
docs/plan/074-guide-editor-v1-hardening.md
```

Conditional:

```text
docs/project-zoomout-status.md
docs/roadmap.md
README.md
docs/plan/master/001-alpha-hardening-master-plan.md
```

## Suggested Commit Shape

Use focused commits based on actual slice, for example:

```text
Harden guide screenshot picker states
Improve guide annotation editing feedback
Clarify guide publish stale state
```

Avoid a vague commit like:

```text
Improve guide editor
```

## Follow-Up Plans

Possible follow-ups:

- guide editor keyboard/accessibility pass
- richer annotation tools
- additional export destinations
- guide duplication/versioning
- collaborative editing conflict handling
