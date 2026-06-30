# Portal Interaction Accessibility Pass Plan

Date: 2026-06-23

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 5 of the alpha follow-through master plan.

## Goal

Determine whether pointer-click vs keyboard activation issues from dogfood automation are product bugs, test-tool limitations, or accessibility gaps.

## Current Baseline

Portal dogfood in plan `071` found several controls more reliable through keyboard activation than pointer click in automation, including:

- first-run submit
- settings save/archive
- event edit
- guide preview link
- workspace/settings navigation

The dogfood notes did not prove these were user-facing browser bugs. This plan should verify before making product changes.

Plan `081` added one portal-facing carry-forward item: captures with zero events/assets can still present artifact creation controls that produce empty or no-op artifacts. The extension permission work from plan `081` is explicitly out of scope for this phase, but the empty-capture artifact controls are in scope as an accessibility/product-state issue because users should not be offered enabled actions that cannot produce meaningful output.

## Scope

Included:

- audit the controls called out by dogfood
- verify accessible names and semantics
- test pointer and keyboard activation where practical
- prevent empty-capture artifact actions from behaving like enabled primary actions
- fix real product issues
- document automation-only limitations if they do not reproduce
- keep changes focused and avoid redesign

## Explicit Non-Goals

- broad design-system rewrite
- visual redesign
- extension screenshot permission or toolbar-popup reliability from plan `081`
- guide/demo feature polish unless directly tied to activation semantics
- replacing the test framework

## Expected File Touches

Likely:

```text
apps/web/src/features/setup/
apps/web/src/features/project/
apps/web/src/features/capture-session/
apps/web/src/features/guide/
apps/web/src/lib/
docs/plan/082-portal-interaction-accessibility-pass.md
docs/plan/master/002-alpha-follow-through-master-plan.md
```

Conditional:

```text
docs/v1-dogfood-smoke-suite.md
docs/project-zoomout-status.md
```

## Implementation Plan

### 1. Audit Dogfood Evidence

- [x] Read plan `071`.
- [x] List every control with pointer/keyboard activation friction.
- [x] Map each control to component and route.
- [x] Check whether later plans already changed the affected component.

Audit notes:

- first-run submit: `apps/web/src/features/setup/FirstRunSetupPage.tsx`; native form submit button with existing click coverage
- settings save/archive: `apps/web/src/features/project/ProjectSettingsPage.tsx`; native submit/status buttons with existing click coverage
- event edit: `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`; native edit/save/cancel buttons with existing click coverage
- guide preview link: `apps/web/src/features/guide/GuideEditorPage.tsx`; native anchor with existing route/assertion coverage
- workspace/settings navigation: `apps/web/src/features/project/ProjectWorkspacePage.tsx`; native anchors with existing route/assertion coverage
- guide add-block controls from plan `071` were handled in plan `074`
- empty extension capture artifact actions from plan `081` map to `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`

### 2. Verify Current Behavior

- [ ] Add or run focused tests for accessible names.
- [ ] Add or run focused tests for keyboard activation.
- [ ] Add or run focused tests for pointer activation where practical.
- [ ] Add focused tests for empty-capture artifact action disabled state and explanatory copy.
- [ ] Manually inspect browser behavior if tests are inconclusive.
- [ ] Separate product bugs from automation-only issues.

### 3. Fix Product Issues

- [ ] Use semantic `button` or `a` behavior where appropriate.
- [ ] Avoid nested interactive elements.
- [ ] Ensure disabled/loading states remain accessible.
- [ ] Ensure click handlers and submit handlers are not competing.
- [ ] Ensure empty captures do not expose enabled guide/demo creation actions.
- [ ] Preserve existing route and API behavior.

### 4. Document Remaining Limits

- [ ] Record automation-only limitations.
- [ ] Record any controls intentionally deferred to authoring polish.
- [ ] Update dogfood notes or this plan with evidence.
- [ ] Update master plan phase tracking after implementation.

## Testing Plan

Expected commands:

```bash
rtk pnpm --filter web test
rtk pnpm --filter web check-types
rtk pnpm --filter web lint
rtk pnpm --filter web build
rtk git diff --check
```

Run broader checks if shared behavior changes:

```bash
rtk pnpm check-types
rtk pnpm lint
```

## Acceptance Criteria

- Affected controls have clear accessible semantics.
- Product-relevant pointer and keyboard activation paths work.
- Any automation-only limitation is recorded with evidence.
- Focused tests cover changed behavior.
- No unrelated portal redesign is mixed into the slice.

## Follow-Up Notes

If a control needs deeper guide/demo workflow changes, move that item to plan `083` instead of expanding this accessibility pass.

Carry extension permission/manual-popup work from plan `081` into a separate extension reliability plan, not this portal accessibility pass.
