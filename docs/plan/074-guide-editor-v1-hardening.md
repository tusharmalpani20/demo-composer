# Guide Editor V1 Hardening Plan

Date: 2026-06-22

Status: Planned.

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
```

Reason:

- guide hardening priorities should come from observed authoring friction
- this phase should fix real issues, not redesign the editor without evidence

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
- identify top guide authoring friction points
- improve focused UI states and workflows
- improve save/error/retry behavior
- improve screenshot picker and upload feedback
- improve annotation usability if dogfood shows issues
- improve publish stale-state clarity
- improve export failure clarity
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

### Editing Flow

Potential issues:

- unclear dirty/saved state
- repeated step saves feel slow or fragile
- errors are too generic
- controls allow conflicting actions while busy
- archived/read-only guide behavior is unclear

Possible work:

- clearer per-step save status
- better disable states
- more specific error messages
- retry affordances
- clearer read-only banners

### Block Authoring

Potential issues:

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

## Implementation Plan

### 1. Triage Dogfood Findings

- [ ] Read portal dogfood result log.
- [ ] Extract guide-specific issues.
- [ ] Group issues by editing, blocks, screenshots, annotations, preview/publish/export.
- [ ] Pick a small coherent slice.
- [ ] Create separate follow-up plans for unrelated issues.

### 2. Audit Current Tests

- [ ] Read guide editor tests.
- [ ] Identify existing coverage for the selected issue.
- [ ] Add failing tests before implementation when practical.
- [ ] Avoid asserting private implementation details.

### 3. Implement Focused Fixes

- [ ] Make minimal product changes for selected issue.
- [ ] Keep existing API contracts unless server behavior must change.
- [ ] Keep source capture immutable.
- [ ] Keep guide blocks and guide steps first-class.
- [ ] Preserve public snapshot safety.

### 4. Verify Guide Workflows

- [ ] Run focused web guide tests.
- [ ] Run focused server guide tests if backend changed.
- [ ] Manually smoke the affected guide editor workflow.
- [ ] Confirm publish/export still work for affected guide.

### 5. Update Docs And Follow-Ups

- [ ] Update plan implementation notes.
- [ ] Update README/status docs only if visible behavior changed.
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
