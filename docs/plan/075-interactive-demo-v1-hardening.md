# Interactive Demo V1 Hardening Plan

Date: 2026-06-22

Status: In progress; selected public viewer fallback slice implemented.

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

Manual portal dogfood on 2026-06-22 found the interactive demo workflow broadly usable:

- creating an interactive demo from a manual capture passed
- metadata and scene editing passed
- scene reorder passed
- hotspot create/edit/target-scene behavior passed
- publish, public viewer, embed route, hotspot navigation, password gate, and unlock passed

Manual extension dogfood did not produce usable extension events or assets, so extension-generated demo quality belongs to Phase 7 rather than this plan.

Carry-over from completed Phase 5 guide editor hardening:

- Do not mix guide-specific leftovers into this demo implementation.
- The only shared carry-over relevant here is the portal dogfood note that some controls were more reliable through keyboard activation than pointer click in automation; verify demo controls through normal button activation in focused tests and leave broader browser automation investigation for a portal accessibility/event follow-up.
- Guide-specific follow-ups such as screenshot picker clarity, guide annotations, and guide export messaging should remain separate guide plans.

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
- improve public viewer navigation when hotspot target scenes are missing or stale
- keep editor scene and hotspot workflows stable
- verify embed route usability
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
- guide editor follow-ups from Phase 5
- extension capture reliability fixes from Phase 7

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

### Selected Slice: Public Viewer Target Fallback

Primary issue:

- public demo hotspot navigation can become unclear if a published hotspot references a scene that is missing from the snapshot or stale after edits

Required work:

- add a failing public viewer test for a click hotspot with a missing `target_scene_id`
- make the viewer fall back to the next linear scene when the target scene cannot be resolved
- keep info hotspots opening their information panel
- keep embed mode behavior unchanged
- do not change backend snapshot shape unless the test proves frontend fallback is insufficient

Out of this slice unless directly required:

- hotspot editor redesign
- branching demo builder
- extension-generated demo capture quality
- guide editor leftovers from Phase 5

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

## Implementation Result: 2026-06-23

Completed slice:

- Public demo viewer now falls back to the next linear scene when a click hotspot references a missing or stale `target_scene_id`.
- Existing explicit target-scene navigation remains unchanged when the target scene exists.
- Info hotspots still open the information panel instead of navigating.
- Embed mode remains covered by the public viewer suite.
- No backend snapshot shape or API contract changes were required.

Verification run:

```bash
rtk pnpm --filter web test -- PublicInteractiveDemoViewerPage -t "falls back to the next scene"
rtk pnpm --filter web test -- PublicInteractiveDemoViewerPage
rtk pnpm --filter web test -- InteractiveDemoEditorPage PublicInteractiveDemoViewerPage
rtk pnpm --filter web test
rtk pnpm --filter web check-types
rtk git diff --check
```

Results:

- Targeted stale-target test passed.
- Public viewer suite passed with 3 tests.
- Focused interactive demo editor/viewer suites passed with 11 tests.
- Full web suite passed with 293 tests.
- Web typecheck passed.
- Whitespace check passed.

Missed or deferred work to keep as follow-up candidates:

- Manual browser smoke for target-scene fallback against a running app.
- Scene list/reorder feedback improvements.
- Hotspot editor affordance improvements.
- Narrow viewport and embed visual QA.
- Portal pointer-click/accessibility investigation from Phase 2 dogfood.
- Extension-generated demo quality after Phase 7 restores capture evidence.

## Implementation Plan

### 1. Triage Dogfood Findings

- [x] Read portal and extension dogfood logs.
- [x] Extract demo-specific issues.
- [x] Separate editor issues from public viewer issues.
- [x] Pick a small coherent slice: public viewer target-scene fallback.
- [x] Create follow-up notes for unrelated issues.

### 2. Add Or Update Tests

- [x] Add web tests for changed editor behavior. Not needed; the selected slice changed public viewer behavior only.
- [x] Add public viewer tests for stale target-scene fallback.
- [x] Add API client tests if request/response handling changes. Not needed; no API change.
- [x] Add server tests only if validation or snapshot behavior changes. Not needed; no server change.

### 3. Implement Focused Fix

- [x] Keep demo scenes and hotspots first-class.
- [x] Keep screenshot-first model.
- [x] Preserve hotspot coordinate validation.
- [x] Preserve public snapshot safety.
- [x] Avoid changing guide behavior.

### 4. Manual Verification

- [ ] Create demo from safe capture.
- [ ] Edit scene.
- [ ] Create hotspot.
- [ ] Test target-scene behavior. Deferred to next browser dogfood pass.
- [ ] Publish demo.
- [ ] Open public viewer.
- [ ] Open embed route.
- [x] Confirm password gate if publish controls changed. Not needed; publish controls did not change.

### 5. Docs And Tracking

- [x] Add implementation notes to this plan.
- [x] Update status docs only if visible behavior changed. Not needed; no visible layout change.
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
- portal pointer-click/accessibility investigation for controls that were easier through keyboard activation in dogfood
- extension-generated demo quality after Phase 7 restores automatic capture evidence
