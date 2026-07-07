# Web Large-File Refactor Plan

Date: 2026-07-07

Last reviewed: 2026-07-07

Status: Completed on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `106` of the alpha hardening and extension reliability track.

## Objective

Reduce risk in the largest web authoring and API client files by splitting responsibilities into smaller local modules without changing UI behavior, visual design, route behavior, API contracts, shared package contracts, or browser-visible workflows.

This is a maintainability/refactor phase after:

- the shared contracts/domainization track from master plan `003`;
- web shared contract consumption in child plan `097`;
- CI server smoke workflow coverage in child plan `105`.

This phase must not redesign the product or add authoring features.

## Source Of Truth From Completed Plan 105

Plan `105` completed on 2026-07-07.

Relevant carry-forward:

- `.github/workflows/ci.yml` now runs the existing server `test:smoke` workflow in the main `verify` job.
- DB-backed CI checks are serial and deterministic: DB integration tests run after an explicit drop/create/migrate sequence, and the smoke workflow runs after a second drop/create/migrate sequence.
- Focused local verification passed for the serial DB integration plus smoke sequence, server typecheck, repo typecheck, whitespace check, and workflow YAML parsing.
- For this phase, web large-file refactors can rely on CI having server smoke coverage, but they still need focused web tests and browser validation if guide/demo editor behavior paths move.

Do not edit server CI or server smoke tests in this phase.

## Recheck Notes

Rechecked on 2026-07-07 against completed plan `105`, master plan `004`, and the current web codebase.

Findings:

- The plan remains aligned with the completed `105` result: CI server smoke coverage is available as backend safety coverage, but web-specific focused tests and browser validation remain required when editor behavior moves.
- The plan matches master plan `004` by keeping the phase behavior-preserving, local to web internals, and explicitly avoiding UI redesign, API contract changes, shared package expansion, extension changes, and CI changes.
- No stale assumptions were found that would make implementation unsafe.

## Current Codebase Baseline

Current worktree expectation before implementation:

```bash
rtk git status --short
```

The implementation agent must stop and inspect any uncommitted changes before editing. Do not overwrite user or other-agent changes.

Current largest web files identified for this phase:

```text
apps/web/src/features/guide/GuideEditorPage.tsx                    2059 lines
apps/web/src/features/guide/GuideEditorPage.test.tsx               1939 lines
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx 1369 lines
apps/web/src/lib/api.ts                                            1123 lines
apps/web/src/lib/api.test.ts                                       2592 lines
```

Existing relevant tests:

```text
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
apps/web/src/lib/api.test.ts
apps/web/src/lib/routes.test.ts
apps/web/src/App.test.tsx
```

Current web scripts:

```text
apps/web/package.json

test        -> vitest run
check-types -> tsc --noEmit
lint        -> eslint --max-warnings 0
build       -> vite build
dev         -> vite
```

Current route entry points:

```text
apps/web/src/App.tsx
apps/web/src/lib/routes.ts
```

Editor routes:

```text
/projects/:projectId/guides/:guideId
/projects/:projectId/interactive-demos/:interactiveDemoId
```

Current architecture facts from plan `097`:

- `apps/web/src/lib/api.ts` already imports shared API DTOs directly from `@repo/types/*` for active shared API contracts.
- `apps/web` already depends on `@repo/constants`, `@repo/types`, and `@repo/ui`.
- `apps/web` must not depend on backend-only domain packages.
- Browser-only upload inputs, UI draft state, local route state, and public viewer defensive parsing remain app-local.
- Guide-named publish aliases in `apps/web/src/features/guide/types.ts` are intentional compatibility aliases and should not be removed mechanically.

## Exact Files To Read Before Implementation

Required:

```text
docs/plan/106-web-large-file-refactor-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/105-ci-smoke-workflow-coverage.md
docs/plan/097-web-shared-contract-consumption.md
apps/web/package.json
apps/web/src/App.tsx
apps/web/src/lib/routes.ts
apps/web/src/lib/routes.test.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/guide/GuideScreenshotViewer.tsx
apps/web/src/features/guide/publishLinks.ts
apps/web/src/features/guide/types.ts
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css
apps/web/src/features/interactive-demo/types.ts
```

Read only if an implementation slice touches adjacent behavior:

```text
apps/web/src/App.test.tsx
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/GuidePreviewPage.test.tsx
apps/web/src/features/guide/ProjectGuideListPage.tsx
apps/web/src/features/guide/ProjectGuideListPage.test.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx
packages/types/src/**/*
packages/constants/src/**/*
```

## Exact Affected Files

Expected implementation files:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
docs/plan/106-web-large-file-refactor-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Likely new local modules, only if the matching slice is implemented:

```text
apps/web/src/lib/api/core.ts
apps/web/src/lib/api/auth.ts
apps/web/src/lib/api/organization.ts
apps/web/src/lib/api/project.ts
apps/web/src/lib/api/capture.ts
apps/web/src/lib/api/guide.ts
apps/web/src/lib/api/demo.ts
apps/web/src/lib/api/publish.ts
apps/web/src/features/guide/guideEditorHelpers.ts
apps/web/src/features/guide/GuideEditorPublishingPanel.tsx
apps/web/src/features/guide/GuideEditorBlocks.tsx
apps/web/src/features/guide/GuideEditorExports.tsx
apps/web/src/features/guide/GuideEditorScreenshots.tsx
apps/web/src/features/interactive-demo/interactiveDemoEditorHelpers.ts
apps/web/src/features/interactive-demo/InteractiveDemoPublishingPanel.tsx
apps/web/src/features/interactive-demo/InteractiveDemoScenesPanel.tsx
apps/web/src/features/interactive-demo/InteractiveDemoHotspotsPanel.tsx
```

The exact names may differ, but new files must stay local to `apps/web/src/lib/`, `apps/web/src/features/guide/`, or `apps/web/src/features/interactive-demo/`. Do not create shared packages for React props or page-local state.

Conditional files:

```text
apps/web/src/App.tsx
apps/web/src/App.test.tsx
apps/web/src/lib/routes.ts
apps/web/src/lib/routes.test.ts
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css
apps/web/src/features/guide/types.ts
apps/web/src/features/interactive-demo/types.ts
```

CSS modules should be touched only if markup is split into local child components and class imports need to move. Do not change CSS declarations, class names, spacing, colors, layout rules, or visual styling.

Files out of scope unless this plan is revised first:

```text
apps/server/**/*
apps/extension/**/*
apps/docs/**/*
packages/**/*
pnpm-lock.yaml
package.json
turbo.json
.github/workflows/**/*
docs/assets/**/*
```

## Routes And API Contracts

No server route, HTTP method, request body, response envelope, public URL, error response, cookie behavior, or route parser behavior change is in scope.

The API client split must preserve current exported function names and fetch behavior from `apps/web/src/lib/api.ts`, including but not limited to:

```text
getPublicInstanceStatus
completeFirstRunSetup
getCurrentAuth
login
logout
listOrganizationMembers
listOrganizationInvites
createOrganizationInvite
revokeOrganizationInvite
getPublicOrganizationInvite
acceptPublicOrganizationInvite
listProjects
createProject
getProject
updateProject
getCaptureSessionDetail
listProjectCaptureSessions
createProjectCaptureSession
uploadCaptureSessionAsset
createCaptureSessionEvent
reorderCaptureSessionEvents
updateCaptureSessionEvent
getGuideDetail
exportGuideMarkdown
exportGuideHtmlZip
getGuidePublishStatus
publishGuide
revokeGuidePublishLink
updateGuidePublishAccess
updateGuidePublishPassword
getPublicPublishLink
createPublicPublishViewerSession
listProjectGuides
listProjectScreenshotAssets
createGuideFromCaptureSession
updateGuide
updateGuideStep
createGuideBlock
updateGuideBlock
updateGuideBlockScreenshot
updateGuideBlockAnnotations
uploadGuideBlockScreenshot
reorderGuideBlocks
deleteGuideBlock
createInteractiveDemoFromCaptureSession
listProjectInteractiveDemos
getInteractiveDemo
updateInteractiveDemo
archiveInteractiveDemo
listInteractiveDemoScenes
updateInteractiveDemoScene
reorderInteractiveDemoScenes
deleteInteractiveDemoScene
createInteractiveDemoHotspot
listInteractiveDemoHotspots
updateInteractiveDemoHotspot
reorderInteractiveDemoHotspots
deleteInteractiveDemoHotspot
getInteractiveDemoPublishStatus
publishInteractiveDemo
revokeInteractiveDemoPublishLink
updateInteractiveDemoPublishAccess
updateInteractiveDemoPublishPassword
resolveApiAssetUrl
ApiClientError
```

If `apps/web/src/lib/api.ts` is split, keep it as a compatibility barrel unless every import site is updated in the same slice. Existing callers should continue importing from `../../lib/api` or `./api` unless a slice explicitly documents and verifies a mechanical import update.

Routes currently parsed in `apps/web/src/lib/routes.ts` must remain compatible:

```text
/projects/:projectId/guides/:guideId
/projects/:projectId/guides/:guideId/preview
/projects/:projectId/guides
/projects/:projectId/interactive-demos/:interactiveDemoId
/projects/:projectId/interactive-demos
/p/:slug
/p/:slug/embed
/d/:slug
/d/:slug/embed
```

Do not touch route parsing unless a split import forces a mechanical move. If route parsing changes, run `routes.test.ts`, `App.test.tsx`, and browser validation for affected routes.

## Schemas And Types

No shared schema, Zod contract, domain package, or API DTO change is expected.

Rules:

- Keep API DTO imports aligned with `@repo/types/*` as established by plan `097`.
- Keep `@repo/constants` usage for current domain constants already consumed by web.
- Do not move React component props into `@repo/types`.
- Do not add `@repo/*-domain` dependencies to `apps/web`.
- Keep page-local load states, draft states, pending action strings, modal state, and browser-only helper types local.
- Keep browser `File`, `Blob`, `FormData`, clipboard, object URL, and download helper inputs local to web.
- Keep public guide/demo snapshot defensive parsing local unless a separate plan adds shared runtime schemas and public-viewer tests.
- Avoid `any` and broad casts. If a cast is needed for DOM/browser APIs or public snapshot parsing, keep it narrow and documented by surrounding code/tests.

Current local type areas to preserve:

```text
GuideEditorPageProps
LoadState / PublishState / GuideDraft / StepDraft / BlockContentDraft
InteractiveDemoEditorPageProps
DemoDraft / SceneDraft / HotspotDraft / PublishDraft
UploadCaptureAssetInput
UploadGuideBlockScreenshotInput
ProjectScreenshotAssetListResponse
guide publish compatibility aliases in apps/web/src/features/guide/types.ts
```

## Behavior Rules

Preserve all visible and workflow behavior:

- No UI redesign.
- No visible layout, copy, color, spacing, icon, class name, keyboard behavior, or navigation changes.
- No route parser or browser URL changes.
- No API path, method, request body, response parsing, or error classification changes.
- No change to `credentials: "include"` on JSON/blob API requests.
- No change to auth, setup gate, login `nextPath`, logout, organization invite, or public viewer flows.
- No change to guide editor metadata saving, step/block editing, block ordering, block deletion, screenshot picker, screenshot upload, screenshot annotations, screenshot viewer, markdown/HTML export, publish, revoke, access, password, copy-link, or embed behavior.
- No change to interactive demo metadata saving, scene editing, scene ordering, scene deletion, hotspot editing, hotspot ordering, publish, revoke, access, password, copy-link, or embed behavior.
- No change to archived/read-only behavior for guide or demo editors.
- No change to error messages, loading messages, empty states, or retry controls.
- Do not add new UI components from `@repo/ui` unless extracting existing markup requires moving existing imports.
- Keep slices small: one API client domain split or one editor responsibility split per commit.

## Security And Permission Rules

Do not weaken:

- same-origin credential handling;
- auth error classification for `unauthenticated`;
- not-found handling;
- project/capture/guide/demo/publish ID URL encoding;
- organization invite token URL encoding;
- login `nextPath` handling;
- public publish viewer password/session handling;
- multipart upload field names and metadata handling;
- public asset URL resolution via `resolveApiAssetUrl`;
- public guide/demo snapshot defensive parsing.

Do not log tokens, cookies, invite tokens, published private data, passwords, raw file contents, screenshot bytes, or API response bodies during browser validation.

## Migration And Backwards Compatibility Notes

No database migration is expected.

No backend migration is expected.

No package dependency or lockfile change is expected.

Backwards compatibility requirements:

- Existing `apps/web/src/lib/api.ts` exports remain available.
- Existing page component props remain stable unless tests prove every caller changed safely.
- Existing feature barrel exports remain stable.
- Existing CSS module class names remain stable.
- Existing route paths remain stable.
- Existing tests should continue asserting the same user-facing behavior.

## Implementation Strategy

This phase is allowed to refactor more than one target file, but it must be done in small logical commits. Do not move all large files in one edit.

Recommended order:

1. API client split first:
   - Extract low-level request helpers into a local `apps/web/src/lib/api/core.ts` or equivalent.
   - Extract domain-specific API functions into local modules by active domain: auth/setup/instance, organization, project, capture, guide, demo, publish.
   - Keep `apps/web/src/lib/api.ts` as a compatibility barrel exporting the same names.
   - Keep `api.test.ts` passing against the public barrel unless tests are intentionally split by domain.
2. Guide editor helper split:
   - Extract pure helper functions first, such as sorting, draft derivation, asset labels, date formatting, publish error mapping, screenshot viewer IDs, annotation formatting, and default block input creation.
   - Add focused helper tests only where behavior is not already covered by `GuideEditorPage.test.tsx`.
3. Guide editor UI/state split:
   - Extract small local child components or hooks only after helper extraction is green.
   - Prefer boundaries around publishing panel, export controls, block list/block editor, screenshot picker/upload/annotation UI, and screenshot viewer orchestration.
   - Keep `GuideEditorPage.tsx` as the route-level orchestrator.
4. Interactive demo helper split:
   - Extract pure helper functions such as scene sorting, hotspot sorting, draft derivation, hotspot box validation, source capture URL creation, scene asset URL creation, expiry input formatting, portal URL/embed code helpers, and HTML attribute escaping.
   - Add focused helper tests only where behavior is not already covered.
5. Interactive demo UI/state split:
   - Extract publishing panel, scene list/editor, and hotspot editor panels only after helper extraction is green.
   - Keep `InteractiveDemoEditorPage.tsx` as the route-level orchestrator.

Stop after a coherent maintainability improvement if a later slice becomes risky. Document leftovers rather than forcing a large refactor.

## Required Implementation Steps

1. Reread this plan, completed plan `105`, completed plan `097`, and master plan `004`.
2. Run `rtk git status --short` and inspect any unrelated changes.
3. Run baseline focused tests before editing if practical:

   ```bash
   rtk pnpm --filter web test -- api GuideEditorPage InteractiveDemoEditorPage routes
   rtk pnpm --filter web check-types
   ```

4. Pick one small slice and write/adjust tests before moving behavior when the slice creates a new helper or component contract.
5. Move code without changing rendered markup/copy/CSS classes.
6. Preserve API barrel compatibility and page prop compatibility.
7. Run focused tests for the touched slice.
8. Repeat only if the next slice remains low risk.
9. Run required final verification.
10. If editor rendering/interactions or API orchestration moved, run agent-browser validation and record paths/steps/results.
11. Update this plan with status, checklist, implementation log, verification notes, browser validation notes, leftovers, and handoff notes.
12. Update master plan `004` only for completed phase status and concise completed result.
13. Commit only scoped work in small logical commits.

## Test And Verification Plan

Required after any implementation:

```bash
rtk pnpm --filter web check-types
rtk pnpm --filter web lint
rtk git diff --check
```

Required if `apps/web/src/lib/api.ts` or new API modules are touched:

```bash
rtk pnpm --filter web test -- api
```

Required if guide editor files are touched:

```bash
rtk pnpm --filter web test -- GuideEditorPage GuideScreenshotViewer publishLinks
```

Required if interactive demo editor files are touched:

```bash
rtk pnpm --filter web test -- InteractiveDemoEditorPage
```

Required if route parsing or app routing is touched:

```bash
rtk pnpm --filter web test -- routes App
```

Required if imports, CSS modules, component boundaries, or Vite build behavior are touched:

```bash
rtk pnpm --filter web build
```

Recommended final repo sanity:

```bash
rtk pnpm check-types
```

Recommended when time permits:

```bash
rtk pnpm --filter web test
```

Do not run server DB/smoke tests for docs-only or web-only refactor changes unless the web refactor changes API contracts, which is out of scope.

## Agent-Browser Validation Requirements

Agent-browser validation is required if the implementation moves or changes any of:

- editor rendered JSX;
- editor child component boundaries;
- editor event handlers;
- editor API call orchestration;
- route navigation behavior;
- CSS module imports/classes;
- publish/copy/export controls;
- screenshot viewer/picker/upload/annotation controls;
- scene/hotspot editor controls.

Browser validation may be skipped only if the implementation is limited to:

- API client module extraction with `api.test.ts` coverage and no feature imports changed beyond compatibility barrel internals;
- pure helper extraction with no rendered JSX, event handler, route, CSS, or API orchestration changes.

If browser validation is required, use agent-browser and record:

- dev server command and URL;
- mocked API setup or local backend setup used;
- exact paths visited;
- desktop viewport result;
- mobile/narrow viewport result if touched layouts are rendered;
- screenshots or notes for any layout/text-overflow issue.

Minimum browser paths when guide editor behavior moves:

```text
/projects/project_1/guides/guide_1
```

Validate:

- editor loads;
- guide title/description fields render;
- at least one block/step renders;
- save guide or save step path works with mocked/stubbed API or local backend;
- publish panel renders if touched;
- screenshot viewer/picker/upload/annotation path works if touched;
- no visible layout regression at desktop width;
- no text overlap/overflow at a narrow/mobile width if touched markup is responsive.

Minimum browser paths when interactive demo editor behavior moves:

```text
/projects/project_1/interactive-demos/interactive_demo_1
```

Validate:

- editor loads;
- demo title/status controls render;
- scenes render in order;
- hotspot controls render and can be edited if touched;
- publish panel renders if touched;
- no visible layout regression at desktop width;
- no text overlap/overflow at a narrow/mobile width if touched markup is responsive.

Minimum browser paths when API client split only changes API orchestration:

```text
/projects
/projects/project_1/guides/guide_1
/projects/project_1/interactive-demos/interactive_demo_1
```

Validate enough mocked/local API calls to prove the split did not break app loading.

## Explicit Non-Scope

- UI redesign.
- New guide editor features.
- New interactive demo features.
- Public viewer redesign.
- Server route or API changes.
- Database schema or migration changes.
- Shared package expansion.
- Adding web dependencies.
- Moving React component props or UI draft state into shared packages.
- Replacing public viewer defensive parsing with blind casts.
- Extension code changes.
- CI workflow changes.
- Docs app changes.
- Screenshot asset refreshes.
- Large visual/CSS rewrites.
- Accessibility copy changes unless required to preserve existing accessible names after extraction.

## Completion Checklist

- [x] Worktree checked before edits.
- [x] Current 105 result, plan 097, and master 004 reread.
- [x] Refactor slices selected and documented.
- [x] API client compatibility preserved if touched.
- [x] Guide editor behavior preserved if touched.
- [x] Interactive demo editor behavior preserved if touched.
- [x] Route behavior preserved.
- [x] CSS modules/classes unchanged or mechanically preserved.
- [x] Focused tests run for every touched slice.
- [x] Web typecheck, lint, and whitespace verification run.
- [x] Web build run if imports/CSS/component boundaries changed.
- [x] Browser validation completed or explicitly skipped with a valid reason.
- [x] Parent master plan updated only for completed phase status.
- [x] Leftovers and next-phase handoff documented.

## Implementation Log

- Confirmed the pre-edit worktree contained only the two newly added red helper tests for this phase.
- Ran the focused baseline before implementation:
  - `rtk pnpm --filter web test -- api GuideEditorPage InteractiveDemoEditorPage routes`
  - `rtk pnpm --filter web check-types`
- Chose the lowest-risk slice from the plan: pure helper extraction from the guide and interactive demo editor pages. This avoided rendered JSX, event handler, route, CSS, API client, and API orchestration changes.
- Added red tests for the new helper module contracts:
  - `apps/web/src/features/guide/guideEditorHelpers.test.ts`
  - `apps/web/src/features/interactive-demo/interactiveDemoEditorHelpers.test.ts`
- Confirmed the red state with `rtk pnpm --filter web test -- guideEditorHelpers interactiveDemoEditorHelpers`; Vite failed to resolve the missing helper modules as expected.
- Added `apps/web/src/features/guide/guideEditorHelpers.ts` and moved guide editor pure helpers/types into it:
  - block sorting
  - asset display/alt labels
  - captured-at formatting
  - screenshot viewer IDs
  - block asset lookup
  - step/content draft derivation
  - immutable step/block replacement helpers
  - annotation helpers
  - percent formatting
  - selected asset merge helper
  - default block input creation
- Updated `apps/web/src/features/guide/GuideEditorPage.tsx` to import the extracted helpers while leaving rendering, mutation handlers, API calls, route behavior, copy, CSS classes, and page props unchanged.
- Added `apps/web/src/features/interactive-demo/interactiveDemoEditorHelpers.ts` and moved interactive demo pure helpers/types into it:
  - scene and hotspot sorting
  - demo/scene/hotspot/publish draft derivation
  - hotspot box validation
  - source capture and scene asset URL helpers
  - unpublished publish status fallback
  - expiry input formatting/parsing
  - portal URL, embed URL, HTML attribute escaping, and iframe embed code helpers
- Updated `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx` to import the extracted helpers while leaving rendering, mutation handlers, API calls, route behavior, copy, CSS classes, and page props unchanged.
- Tightened helper test fixtures to match the current shared `@repo/types` guide/demo contracts instead of using partial object casts.
- Resulting file-size movement:
  - `GuideEditorPage.tsx`: from the planned baseline of 2059 lines to 1909 lines.
  - `guideEditorHelpers.ts`: 177 lines.
  - `InteractiveDemoEditorPage.tsx`: from the planned baseline of 1369 lines to 1233 lines.
  - `interactiveDemoEditorHelpers.ts`: 165 lines.
- Did not split `apps/web/src/lib/api.ts` in this pass because the pure helper slice was coherent, low risk, and independently valuable. API client splitting remains documented as follow-up work.

## Verification Notes

- Baseline before implementation:
  - `rtk pnpm --filter web test -- api GuideEditorPage InteractiveDemoEditorPage routes` passed: 4 test files, 124 tests.
  - `rtk pnpm --filter web check-types` passed.
- Red test confirmation:
  - `rtk pnpm --filter web test -- guideEditorHelpers interactiveDemoEditorHelpers` failed before helper modules existed, as expected.
- Focused helper tests after implementation:
  - `rtk pnpm --filter web test -- guideEditorHelpers interactiveDemoEditorHelpers` passed: 2 test files, 8 tests.
- Focused editor tests:
  - `rtk pnpm --filter web test -- GuideEditorPage InteractiveDemoEditorPage GuideScreenshotViewer publishLinks` passed: 4 test files, 55 tests.
- Final focused combined test run:
  - `rtk pnpm --filter web test -- guideEditorHelpers interactiveDemoEditorHelpers GuideEditorPage InteractiveDemoEditorPage GuideScreenshotViewer publishLinks` passed: 6 test files, 63 tests.
- Typecheck:
  - `rtk pnpm --filter web check-types` passed.
- Lint:
  - `rtk pnpm --filter web lint` passed.
- Build:
  - `rtk pnpm --filter web build` passed.
- Whitespace:
  - `rtk git diff --check` passed.

## Browser Validation Notes

Browser validation was intentionally skipped for this phase because the implementation was limited to pure helper extraction and local helper tests. It did not move or change rendered JSX, event handlers, route navigation behavior, CSS module imports/classes, API client functions, or API orchestration.

## Leftovers

- `apps/web/src/lib/api.ts` is still large and can be split in a later focused plan or continuation slice with `api.test.ts` coverage and barrel compatibility checks.
- `GuideEditorPage.tsx` and `InteractiveDemoEditorPage.tsx` are still large route-level orchestrators. Deeper panel/component extraction remains possible, but it should be done in smaller follow-up slices with browser validation because rendered JSX and interaction boundaries would move.
- Existing large tests remain large. Splitting test fixtures/builders can be considered later if it does not weaken coverage or obscure user-facing assertions.

## Handoff Notes

- This phase completed the pure helper extraction slice only. Future work should treat API client splitting and rendered panel/component extraction as separate, explicitly tested slices.
- If future work moves JSX, event handlers, CSS imports/classes, or editor API orchestration, run agent-browser validation for the affected guide/demo editor paths and record desktop plus narrow viewport results.
- Preserve the current pattern: shared API DTOs/constants stay in `@repo/types` and `@repo/constants`; browser/page-local drafts and React props stay local to `apps/web`.
