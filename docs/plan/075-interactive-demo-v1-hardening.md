# Interactive Demo V1 Hardening Plan

Date: 2026-06-22

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

This is Phase 6 of the alpha hardening master plan.

## Goal

Improve interactive demo authoring and public viewing so screenshot-first demos are credible for alpha use.

Target outcome:

```text
portal user creates demo from capture
  -> understands scenes
  -> places hotspots
  -> controls simple navigation
  -> publishes demo
  -> verifies public viewer and embed behavior
  -> can recover from common editing mistakes
```

This plan should be driven by portal and extension dogfood evidence.

## Dependencies

Should start after:

```text
docs/plan/071-manual-portal-dogfood.md
docs/plan/072-manual-extension-dogfood.md
```

Reason:

- demo hardening should address observed editing/viewing friction
- extension click metadata may affect demo scene and hotspot quality

## Current Baseline

Interactive demo capabilities currently include:

- interactive demo creation from capture sessions
- demo list
- demo editor
- scene management
- scene ordering
- hotspot creation/editing/reorder/delete
- publish controls
- password controls
- public demo viewer
- demo embed route

Likely files:

```text
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.service.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.repository.ts
apps/server/src/modules/publish/publish.service.ts
apps/server/src/modules/publish/publish.routes.ts
```

## Scope

Included:

- audit dogfood findings for demo editor and viewer
- improve scene orientation and editing feedback
- improve hotspot positioning and validation feedback
- improve target-scene selection if needed
- improve public viewer navigation if needed
- verify embed route usability
- improve narrow viewport behavior if dogfood shows issues
- add focused tests
- update docs for behavior changes

## Explicit Non-Goals

- HTML replay
- branching demo builder beyond existing target-scene behavior
- analytics
- lead capture
- custom branding
- forms or simulated input validation
- merging guide and demo models
- broad visual redesign without dogfood evidence

## Discovery Checklist

Read:

```text
docs/v1-dogfood-smoke-suite.md
docs/plan/059-interactive-demo-domain-foundation.md
docs/plan/061-create-interactive-demo-from-capture.md
docs/plan/062-interactive-demo-editor-portal.md
docs/plan/063-interactive-demo-hotspots.md
docs/plan/064-public-interactive-demo-viewer-and-publish.md
```

Inspect:

- current editor UI
- public viewer behavior
- public snapshot shape
- hotspot target scene validation
- embed route behavior

Record the specific dogfood issue before changing code.

## Expected File Touches

Exact files must be narrowed during discovery before implementation. Likely areas:

```text
apps/web/src/
apps/web/src/**/interactive-demo*
apps/web/src/**/InteractiveDemo*
apps/server/src/modules/interactive-demo/
docs/plan/075-interactive-demo-v1-hardening.md
```

Likely tests:

```text
apps/web/src/**/*.test.*
apps/server/src/modules/interactive-demo/**/*.test.ts
```

Conditional docs:

```text
docs/project-zoomout-status.md
README.md
docs/plan/master/001-alpha-hardening-master-plan.md
docs/plan/<new-demo-follow-up-plan>.md
```

Do not change guide behavior unless the selected issue proves a shared publish or snapshot bug.

## Candidate Hardening Areas

### Scene Orientation

Potential issues:

- selected scene is hard to identify
- scene order changes are not obvious
- missing asset state is unclear
- scene title/description save feedback is weak

Possible work:

- clearer scene list active state
- stable scene counters
- better empty/missing background messages
- clearer save/reorder busy state

### Hotspot Editing

Potential issues:

- normalized coordinates are hard to reason about
- form fields are too raw
- hotspot target selection is unclear
- validation messages are generic
- overlapping hotspots are hard to inspect

Possible work:

- improve labels and helper text
- better preview overlay
- clearer target-scene options
- stronger validation feedback
- focused tests for invalid boxes and target scenes

### Public Viewer

Potential issues:

- click/next/back behavior is unclear
- hotspot content is not visible enough
- target-scene navigation surprises users
- embed mode layout is cramped
- mobile/narrow viewport behavior breaks visual context

Possible work:

- clearer navigation controls
- better hotspot affordances
- robust scene fallback when target is missing
- embed-specific spacing fixes
- viewport-responsive screenshot framing

## Implementation Plan

### 1. Triage Dogfood Findings

- [ ] Read portal and extension dogfood logs.
- [ ] Extract demo-specific issues.
- [ ] Separate editor issues from public viewer issues.
- [ ] Pick a small coherent slice.
- [ ] Create follow-up plans for unrelated issues.

### 2. Add Or Update Tests

- [ ] Add web tests for changed editor behavior.
- [ ] Add public viewer tests if viewer behavior changes.
- [ ] Add API client tests if request/response handling changes.
- [ ] Add server tests only if validation or snapshot behavior changes.

### 3. Implement Focused Fix

- [ ] Keep demo scenes and hotspots first-class.
- [ ] Keep screenshot-first model.
- [ ] Preserve hotspot coordinate validation.
- [ ] Preserve public snapshot safety.
- [ ] Avoid changing guide behavior.

### 4. Manual Verification

- [ ] Create demo from safe capture.
- [ ] Edit scene.
- [ ] Create hotspot.
- [ ] Test target-scene behavior.
- [ ] Publish demo.
- [ ] Open public viewer.
- [ ] Open embed route.
- [ ] Confirm password gate if publish controls changed.

### 5. Docs And Tracking

- [ ] Add implementation notes to this plan.
- [ ] Update status docs only if visible behavior changed.
- [ ] Update master plan completion table if Phase 6 is complete.

## Testing Plan

Likely commands:

```bash
rtk pnpm --filter web test -- InteractiveDemoEditorPage
rtk pnpm --filter web test -- PublicInteractiveDemoViewerPage
rtk pnpm --filter web test
rtk pnpm --filter server test -- interactive-demo
rtk pnpm --filter server test -- publish
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

Run DB tests if server persistence changes:

```bash
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- Selected demo hardening work is tied to dogfood evidence.
- Users can create and understand a multi-scene demo more easily.
- Hotspot behavior remains validated and predictable.
- Public viewer and embed route remain usable.
- Public snapshots do not expose storage keys or private metadata.
- Tests cover changed behavior.
- Docs remain alpha-accurate.

## Documentation Updates

Expected:

```text
docs/plan/075-interactive-demo-v1-hardening.md
```

Conditional:

```text
docs/project-zoomout-status.md
docs/roadmap.md
README.md
docs/plan/master/001-alpha-hardening-master-plan.md
```

## Suggested Commit Shape

Use focused commits, for example:

```text
Clarify demo hotspot target editing
Improve public demo viewer navigation
Harden demo scene reorder feedback
```

## Follow-Up Plans

Possible follow-ups:

- branching demo navigation
- demo analytics
- lead capture
- custom branding
- richer hotspot types
- viewer accessibility pass
