# Authoring Polish V2 Plan

Date: 2026-06-23

Status: Planned; rechecked and narrowed for implementation.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 6 of the alpha follow-through master plan.

## Dependencies

Recommended after:

```text
docs/plan/082-portal-interaction-accessibility-pass.md
```

Reason:

- some authoring friction may be caused by pointer/keyboard activation semantics rather than editor-specific behavior
- if this plan starts first, record whether the selected slice depends on any unresolved portal interaction issue

## Goal

Reduce remaining guide and demo authoring friction after the first hardening slices.

This implementation pass is narrowed to guide screenshot picker clarity and recovery.

## Current Baseline

Plans `074` and `075` completed narrow hardening slices:

- guide structural add-block reliability and post-insert ordering
- public demo stale target-scene fallback

They intentionally deferred broader authoring polish.

## Scope

This master phase is broad. The implementation for this plan now selects one coherent slice before coding.

Selected guide slice:

- make guide screenshot choices easier to distinguish without exposing raw asset IDs
- make the currently attached screenshot clear in the picker
- provide an inline retry path when screenshot choices fail to load
- preserve direct screenshot upload behavior and keep upload failures recoverable through the existing file control

Carry-forward from plan `082`:

- deeper guide/demo authoring workflow polish belongs here, but this implementation only takes the guide screenshot picker/recovery slice
- empty-capture artifact creation and portal activation semantics were already handled or deferred by plan `082`

Candidate guide slices:

- screenshot picker clarity
- direct screenshot upload recovery
- annotation editing affordances
- publish stale-state clarity
- export error messaging
- metadata and step save/error/retry behavior
- empty and partial-data states

Candidate demo slices:

- scene list and reorder feedback
- hotspot editor affordances
- target-scene selection clarity
- embed and narrow viewport QA
- public demo final-scene stale-target behavior
- extension-generated demo quality after extension evidence exists

Deferred from this implementation:

- guide annotation editing affordances
- guide publish stale-state clarity
- guide export error messaging
- guide metadata and step save/error/retry behavior
- empty and partial-data guide editor states
- demo scene list and reorder feedback
- demo hotspot editor affordances
- demo embed and narrow viewport QA
- public demo final-scene stale-target behavior
- extension-generated guide/demo quality until extension-created screenshot-backed events exist

## Explicit Non-Goals

- HTML replay
- AI generation
- broad information architecture rewrite
- extension-generated artifact quality before extension capture evidence exists
- style-only redesign without workflow benefit

## Expected File Touches

Likely guide files:

```text
apps/web/src/features/guide/
apps/web/src/features/guide/*.test.tsx
```

Likely demo files:

```text
apps/web/src/features/interactive-demo/
apps/web/src/features/interactive-demo/*.test.tsx
```

Conditional:

```text
apps/server/src/modules/guide/
apps/server/src/modules/interactive-demo/
README.md
docs/assets/alpha/
docs/project-zoomout-status.md
docs/plan/083-authoring-polish-v2.md
docs/plan/master/002-alpha-follow-through-master-plan.md
```

## Implementation Plan

### 1. Pick A Focused Slice

- [x] Review plans `074` and `075`.
- [x] Review current guide and demo carry-forward notes.
- [x] Pick one guide slice: screenshot picker clarity and picker load recovery.
- [x] Write the selected slice in this plan before implementation.
- [x] Define what is explicitly deferred.

### 2. Add Focused Tests

- [ ] Add failing tests for screenshot picker clarity and load recovery.
- [ ] Prefer user-visible behavior over private implementation details.
- [ ] Add server tests only if API contracts or validation change.
- [ ] Cover error states if the slice changes recovery behavior.

### 3. Implement Minimal Product Change

- [ ] Preserve capture source immutability.
- [ ] Preserve guide blocks and demo hotspots as separate concepts.
- [ ] Preserve public snapshot safety.
- [ ] Keep UI consistent with existing portal patterns.
- [ ] Avoid unrelated refactors.

### 4. Verify User Workflow

- [ ] Run focused tests.
- [ ] Run relevant broader web tests.
- [ ] Manually smoke the affected authoring workflow if practical.
- [ ] Decide whether README screenshots need refresh.

### 5. Update Tracking

- [ ] Add implementation notes to this plan.
- [ ] Record missed/deferred authoring items.
- [ ] Update master plan phase tracking after implementation.

## Testing Plan

Likely commands:

```bash
rtk pnpm --filter web test
rtk pnpm --filter web check-types
rtk pnpm --filter web lint
rtk pnpm --filter web build
rtk git diff --check
```

If backend changes:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server check-types
```

## Acceptance Criteria

- The selected authoring slice has focused tests.
- A real authoring workflow is clearer or more reliable.
- Public snapshots remain safe and immutable.
- Guide and demo concepts remain separate.
- Deferred work is explicitly recorded.

## Follow-Up Notes

Do not try to finish every authoring issue in one patch. If the selected scope grows beyond one coherent slice, split it into additional plans.
