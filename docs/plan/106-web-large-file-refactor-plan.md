# Web Large-File Refactor Plan

Date: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `106` of the alpha hardening and extension reliability track.

## Objective

Reduce risk in the largest web files by splitting responsibilities without changing UI behavior, visual design, route behavior, or API contracts.

This plan should improve maintainability after the shared contracts/domainization track, not redesign the product.

## Current Baseline

Large web surfaces identified during repo analysis:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/lib/api.ts
```

These files have substantial tests and should be refactored only in small, behavior-preserving slices.

## Exact Files To Read Before Work

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/097-web-shared-contract-consumption.md
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/lib/routes.ts
apps/web/src/lib/routes.test.ts
```

Shared contracts to inspect only when API client code moves:

```text
packages/types/src/
packages/constants/src/
```

## Expected Affected Files

Likely:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
docs/plan/106-web-large-file-refactor-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Possible new local modules:

```text
apps/web/src/features/guide/
apps/web/src/features/interactive-demo/
apps/web/src/lib/
```

Conditional:

```text
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css
```

CSS files should be touched only if moving markup requires class colocation or test selectors. Do not change visual styles.

## Routes And API Contracts

No server route changes are in scope.

The web API client must continue to call the same API routes and return compatible data for existing callers.

If `apps/web/src/lib/api.ts` is split, preserve existing exported function names or provide compatibility re-exports so current feature imports keep working unless a narrow mechanical import update is part of the slice.

## Schemas And Types

- Keep public API DTO usage aligned with `@repo/types`.
- Do not move React component props into `@repo/types`.
- Do not add new shared package exports unless a real cross-package reuse need is proven.
- Prefer feature-local types for guide/demo editor state.
- Preserve current inferred DTO imports and response handling.

## Behavior Rules

- No UI redesign.
- No visible layout, copy, color, spacing, icon, or interaction changes.
- No route/navigation behavior changes.
- No API behavior changes.
- No change to guide block editing semantics.
- No change to interactive demo scene/hotspot/transition editing semantics.
- Refactor one file or feature area at a time.
- Keep PR/commit slices small enough to review.

## Security And Permission Rules

- Do not weaken auth handling in the API client.
- Preserve credential/cookie behavior.
- Do not expose public/private publish state incorrectly.
- Do not remove validation or error handling that protects destructive actions.

## Migration And Backwards Compatibility

No database migration is expected.

Backwards compatibility expectations:

- Existing component tests should keep asserting the same user-facing behavior.
- Existing imports should either keep working or be updated mechanically in the same small slice.
- Existing CSS class behavior should remain visually identical.

## Implementation Strategy

This plan should be expanded into smaller implementation slices before code changes.

Recommended order:

1. API client split:
   - separate capture, guide, demo, publish, project, auth, and organization clients if local patterns support it;
   - keep `apps/web/src/lib/api.ts` as a compatibility barrel if useful.
2. Guide editor split:
   - extract pure helpers first;
   - then local hooks;
   - then presentational subcomponents only where tests can protect behavior.
3. Interactive demo editor split:
   - extract geometry/state helpers first;
   - then local hooks;
   - then presentational subcomponents.

Do not do all three in one commit unless the edits are trivial.

## Test And Verification Plan

Required for any web refactor:

```bash
rtk pnpm --filter web test
rtk pnpm --filter web check-types
rtk pnpm --filter web lint
rtk git diff --check
```

Required if build-sensitive imports or CSS modules change:

```bash
rtk pnpm --filter web build
```

Recommended repo sanity:

```bash
rtk pnpm check-types
```

## Browser Validation Requirements

Browser validation is required if editor rendering, interactions, route navigation, or API call orchestration changes.

Validate:

- guide editor loads;
- guide step/block editing still works;
- guide preview/publish paths still work if touched;
- interactive demo editor loads;
- scene/hotspot editing still works if touched;
- no text overflow or layout break was introduced at desktop and mobile widths for touched pages.

If only pure helpers or API client internals change and tests cover the behavior, document why browser validation was not required.

## Explicit Non-Scope

- UI redesign.
- New guide editor features.
- New interactive demo features.
- Public viewer redesign.
- Server API changes.
- Database changes.
- Shared package expansion unless real reuse is proven.
- Extension changes.

## Completion Checklist

- [ ] Refactor slices selected and documented.
- [ ] Tests protect each moved behavior.
- [ ] API client compatibility preserved.
- [ ] Guide editor behavior preserved if touched.
- [ ] Interactive demo editor behavior preserved if touched.
- [ ] Browser validation completed or explicitly not required with reason.
- [ ] Verification commands run and recorded.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

This plan may be too large for a single implementation pass. If expansion shows high risk, split it into follow-up child plans for API client, guide editor, and interactive demo editor.

Do not start this refactor until extension reliability work has either passed or been explicitly bounded, unless the user chooses to reorder the track.
