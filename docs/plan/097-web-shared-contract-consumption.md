# Web Shared Contract Consumption Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `097` of the shared contracts and domainization track.

## Objective

Make `apps/web` consume the shared API contracts and constants that now exist after plans `087` through `096`, without changing UI appearance, rendered copy, browser navigation, fetch paths, request bodies, response handling behavior, public viewer behavior, or user-visible workflows.

This is a frontend integration cleanup plan. It is not a UI redesign, not a route rewrite, and not a backend contract change.

The desired end state is:

- web feature barrels import and re-export shared DTOs/constants when those types are true API contracts;
- `apps/web/src/lib/api.ts` uses shared request/response DTOs directly instead of redefining them locally or routing them through unrelated feature aliases;
- UI-only component props, local drafts, form state, parse helpers, and browser-only upload inputs remain local;
- guide-named compatibility aliases remain only where they protect existing guide UI imports and are explicitly documented.

## Implemented Baseline From 096

Plan `096` completed and was post-implementation audited on 2026-07-07.

Relevant carry-forward from `096`:

- Server route adapters now share standard error envelope builders.
- Publish route/test code imports publish policy errors and shared publish DTOs directly.
- `apps/server/src/modules/publish/publish.service.ts` no longer re-exports publish-domain errors or old server publish/revoke result aliases.
- No server route, fetch path, response envelope, status code, cookie, auth/session, SQL, storage, public viewer, or browser-visible behavior changed.
- Web should consume shared publish DTOs directly where practical, but `apps/web/src/features/guide/types.ts` guide UI compatibility aliases should remain until each import site is migrated safely.

## Current Web Baseline

`apps/web/package.json` already depends on:

```text
@repo/constants
@repo/types
@repo/ui
```

Do not add new dependencies unless implementation discovers a real missing package. `@repo/*-domain` packages must not be added to `apps/web`; the web app consumes shared contracts/constants, not domain policies.

Current feature barrels already consume many shared contracts:

```text
apps/web/src/features/auth/types.ts
apps/web/src/features/capture-session/types.ts
apps/web/src/features/guide/types.ts
apps/web/src/features/interactive-demo/types.ts
apps/web/src/features/organization/types.ts
apps/web/src/features/project/types.ts
```

Current remaining cleanup opportunities:

- `apps/web/src/lib/api.ts` still defines local response aliases that now exist in `@repo/types/project`, `@repo/types/capture`, and `@repo/types/guide`.
- `apps/web/src/lib/api.ts` imports many API DTOs through feature barrels, which keeps the API client coupled to UI feature modules.
- Web feature barrels already re-export several shared constant-derived types, but implementation must still audit duplicated domain fixed values against `@repo/constants` before deciding there is no constants cleanup.
- Guide publish types still use guide-named compatibility aliases in `apps/web/src/features/guide/types.ts` and guide UI files.
- Public guide/demo readers still parse public published snapshots from `unknown` manually. That parse behavior is browser-viewer defensive behavior and should not be changed in this phase unless tests and browser validation are expanded.
- Browser-only upload inputs are local and intentionally not represented by shared server DTOs because they include `File`, camelCase form metadata fields, and multipart behavior.

## Relevant Docs To Read Before Coding

```text
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/096-server-adapter-thinning.md
docs/adr/0019-separate-web-and-server-apps.md
docs/plan/086-modern-ui-migration.md
```

## Exact Affected Files

Primary likely implementation files:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/auth/types.ts
apps/web/src/features/capture-session/types.ts
apps/web/src/features/guide/types.ts
apps/web/src/features/interactive-demo/types.ts
apps/web/src/features/organization/types.ts
apps/web/src/features/project/types.ts
```

Likely feature files if type import cleanup is needed:

```text
apps/web/src/features/project/ProjectListPage.tsx
apps/web/src/features/project/ProjectSettingsPage.tsx
apps/web/src/features/project/ProjectWorkspacePage.tsx
apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/guide/ProjectGuideListPage.tsx
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx
apps/web/src/features/organization/OrganizationMembersPage.tsx
apps/web/src/features/organization/InviteAcceptPage.tsx
apps/web/src/App.tsx
```

Likely focused test files if imports or type fixtures are touched:

```text
apps/web/src/lib/api.test.ts
apps/web/src/App.test.tsx
apps/web/src/features/project/ProjectListPage.test.tsx
apps/web/src/features/project/ProjectSettingsPage.test.tsx
apps/web/src/features/project/ProjectWorkspacePage.test.tsx
apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx
apps/web/src/features/guide/ProjectGuideListPage.test.tsx
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/guide/PublicGuideReaderPage.test.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx
apps/web/src/features/organization/OrganizationMembersPage.test.tsx
apps/web/src/features/organization/InviteAcceptPage.test.tsx
apps/web/src/features/auth/LoginPage.test.tsx
apps/web/src/features/setup/FirstRunSetupPage.test.tsx
```

Plan status files to update after implementation:

```text
docs/plan/097-web-shared-contract-consumption.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

Do not modify unless implementation discovers a real contract bug and the plan is updated first:

```text
packages/constants/src/**/*
packages/types/src/**/*
packages/*-domain/src/**/*
apps/server/**/*
apps/extension/**/*
apps/web/src/**/*.module.css
apps/web/src/index.css
apps/web/src/App.module.css
```

Do not modify browser-visible JSX, rendered text, class names, CSS modules, routes, or navigation behavior unless TypeScript forces a purely mechanical import adjustment. If JSX changes become necessary, pause and update this plan with the exact validation requirements before coding.

## Routes And API Contracts

No route URL, method, request body, response envelope, or error response behavior should change.

The web API client must continue using the existing paths, including:

```text
GET    /api/v1/public/instance
POST   /api/v1/setup/first-run
GET    /api/v1/authentication/me
POST   /api/v1/authentication/login
POST   /api/v1/authentication/logout
GET    /api/v1/organization/members
GET    /api/v1/organization/invites
POST   /api/v1/organization/invites
DELETE /api/v1/organization/invites/:invite_id
GET    /api/v1/public/invites/:token
POST   /api/v1/public/invites/:token/accept
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
GET    /api/v1/projects/:project_id/capture-sessions
POST   /api/v1/projects/:project_id/capture-sessions
GET    /api/v1/projects/:project_id/capture-sessions/:id/detail
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
PUT    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/order
PATCH  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
GET    /api/v1/projects/:project_id/capture-assets?asset_type=screenshot
GET    /api/v1/projects/:project_id/guides
POST   /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
GET    /api/v1/projects/:project_id/guides/:guide_id
PATCH  /api/v1/projects/:project_id/guides/:guide_id
GET    /api/v1/projects/:project_id/guides/:guide_id/export/markdown
GET    /api/v1/projects/:project_id/guides/:guide_id/export/html.zip
PATCH  /api/v1/projects/:project_id/guides/:guide_id/steps/:guide_step_id
POST   /api/v1/projects/:project_id/guides/:guide_id/blocks
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/annotations
POST   /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/reorder
DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id
GET    /api/v1/projects/:project_id/interactive-demos
POST   /api/v1/projects/:project_id/interactive-demos
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos
GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes
POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
PUT    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/order
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id
PUT    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/order
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id
GET    /api/v1/projects/:project_id/guides/:guide_id/publish
POST   /api/v1/projects/:project_id/guides/:guide_id/publish
DELETE /api/v1/projects/:project_id/guides/:guide_id/publish
PATCH  /api/v1/projects/:project_id/guides/:guide_id/publish/access
PATCH  /api/v1/projects/:project_id/guides/:guide_id/publish/password
GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/access
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/password
GET    /api/v1/public/publish-links/:slug
POST   /api/v1/public/publish-links/:slug/viewer-sessions
```

## Schemas And Types

Use existing shared contracts only. Do not add new schemas or types to shared packages in this phase unless a real mismatch is discovered and this plan is updated first.

Existing shared modules to consume:

```text
@repo/types/auth
@repo/types/setup
@repo/types/instance
@repo/types/organization
@repo/types/project
@repo/types/capture
@repo/types/guide
@repo/types/demo
@repo/types/publish
@repo/constants
```

Shared constants currently available for web use include:

```text
PROJECT_STATUSES / ProjectStatus
CAPTURE_SESSION_STATUSES / CaptureSessionStatus
CAPTURE_SESSION_SOURCE_TYPES / CaptureSessionSourceType
CAPTURE_EVENT_TYPES / CaptureEventType
CAPTURE_ASSET_TYPES / CaptureAssetType
GUIDE_STATUSES / GuideStatus
GUIDE_BLOCK_TYPES / GuideBlockType
GUIDE_CREATABLE_BLOCK_TYPES / GuideCreatableBlockType
GUIDE_BLOCK_PLACEMENTS / GuideBlockPlacement
GUIDE_ANNOTATION_TYPES / GuideAnnotationType
INTERACTIVE_DEMO_STATUSES / InteractiveDemoStatus
DEMO_HOTSPOT_TYPES / DemoHotspotType
PUBLISH_VISIBILITIES / PublishVisibility
PUBLISH_LINK_STATUSES / PublishLinkStatus
PUBLISH_ARTIFACT_TYPES / PublishArtifactType
ORGANIZATION_ROLES / OrganizationRole
ORGANIZATION_INVITE_STATUSES / OrganizationInviteStatus
ORGANIZATION_MEMBER_STATUSES / OrganizationMemberStatus
DEPLOYMENT_MODES / DeploymentMode
ONBOARDING_MODES / OnboardingMode
```

Required API client cleanup targets:

- Replace local `ProjectGuideListResponse` in `apps/web/src/lib/api.ts` with `ProjectGuideListResponse` from `@repo/types/guide`.
- Replace local `ProjectDetailResponse`, `ProjectListResponse`, `ProjectCreateResponse`, and `ProjectUpdateResponse` with shared project response types from `@repo/types/project`.
- Replace local `ProjectCaptureSessionListResponse` and `CaptureSessionCreateResponse` with shared capture response types from `@repo/types/capture`.
- Replace inline guide block response shapes such as `Promise<{ guide_blocks: GuideBlock[] }>` with the matching shared guide response type from `@repo/types/guide` when the shape is identical.
- Prefer direct `@repo/types/*` imports in `apps/web/src/lib/api.ts` for API request/response DTOs instead of importing those contracts through feature barrels.
- Keep `ApiClientError`, `ApiClientErrorKind`, `ApiErrorBody`, `ListProjectsOptions`, `ListCaptureSessionsOptions`, `requestJson`, `requestBlob`, `resolveApiAssetUrl`, and browser upload helpers local to `apps/web/src/lib/api.ts`.

Required constants cleanup targets:

- Audit hard-coded domain status/type/visibility values in web code against `@repo/constants`.
- Prefer shared constant-derived types for API contract fields and filter/query option fields.
- Use runtime constant arrays from `@repo/constants` only when the UI currently duplicates a domain option list or needs membership checks. Do not introduce runtime constants just to replace isolated fixture values or direct equality checks unless it improves type safety without changing behavior.
- Do not move local UI state-machine statuses into shared constants. Values such as `loading`, `loaded`, `error`, `unauthenticated`, `not_found`, `queued`, `uploading`, `event_created`, `failed`, and local route discriminants are browser/UI control state, not shared API constants.
- Do not rewrite tests merely to avoid string literals in response fixtures. Test fixtures may keep literal domain values when they are modeling JSON returned by the server; update them only when type annotations require shared literal compatibility.

Feature barrel rules:

- Keep feature barrels as ergonomic import surfaces for page components.
- Feature barrels may re-export shared API contracts, but they should not redefine response/request DTOs that already exist in `@repo/types`.
- Keep browser-only upload input types local:
  - `UploadCaptureAssetInput`
  - `UploadCaptureAssetResponse` if it models browser upload response through `CaptureAssetWithFileUrl`
  - `UploadGuideBlockScreenshotInput`
- Keep `ProjectScreenshotAssetListResponse = ProjectCaptureAssetListResponse` only if it remains useful as a feature-specific alias for screenshot-only asset lists.
- Preserve guide-named publish aliases initially:
  - `GuidePublishResult`
  - `GuidePublishStatusResponse`
  - `GuideRevokePublishResult`
  - `UpdateGuidePublishAccessInput`
  - `UpdateGuidePublishPasswordInput`
- If removing a guide alias, update every import site in the same slice and prove with typecheck/tests. Do not remove all aliases mechanically.

Public viewer parse rules:

- `PublicGuideReaderPage.tsx` and `PublicInteractiveDemoViewerPage.tsx` currently parse `published_artifact.snapshot` from `unknown` with local defensive guards.
- Do not replace this parsing with a blind type cast.
- Moving parse validation to shared Zod schemas is out of scope unless this plan is updated to include focused tests for invalid public snapshot handling and browser validation for public reader/viewer flows.

## Behavior Rules

Preserve:

- rendered markup and text;
- CSS module imports and class names;
- route parsing/navigation behavior in `App.tsx` and feature navigation helpers;
- setup gate behavior and redirects;
- auth/login/logout behavior and `nextPath` safety behavior;
- organization invite accept flow behavior;
- project list/settings/workspace behavior;
- capture session list/detail behavior, including multipart upload form fields and event order paths;
- guide editor, guide list, screenshot viewer, public guide reader, publish controls, and export behavior;
- interactive demo editor, demo list, public demo viewer, scene/hotspot order behavior, and publish controls;
- API error classification behavior in `ApiClientError`;
- `credentials: "include"` behavior on JSON/blob requests;
- public viewer password session behavior.

## Security And Permission Rules

Do not change:

- same-origin credential handling;
- invite token URL encoding;
- project/capture/guide/demo/publish ID URL encoding;
- auth error handling that distinguishes `unauthenticated` from other errors;
- `nextPath` validation in login flow;
- public viewer password request body shape;
- upload file field name or metadata field names;
- public asset URL resolution through `resolveApiAssetUrl`;
- public published snapshot defensive parsing.

Because this phase is client-side contract cleanup, it must not loosen type safety by replacing structured DTOs with `unknown`, `any`, or broad casts. Any cast that remains must be justified as runtime parsing of public snapshot data.

## Migration And Backwards Compatibility

No database migration is expected or allowed.

No backend migration or API contract migration is expected.

Backwards compatibility requirements:

- Existing API client function names and exported names should remain stable unless every consumer is updated in the same slice.
- Existing page prop names should remain stable.
- Existing feature barrel exports should remain stable unless every consumer is updated in the same slice.
- Keep `apps/web/package.json` dependency shape stable unless a dependency is actually added or removed. Since `@repo/types` and `@repo/constants` already exist, no dependency change is expected.
- Do not change generated output, public URLs, or fetch paths.

## Implementation Plan

### Step 1: Baseline Audit

Before editing:

1. Run `rtk git status --short`.
2. Reread this plan, `096`, and the master plan.
3. Run inventory searches:

```text
rtk rg -n "export type .*Response|export type .*Input|type .*Response|type .*Input" apps/web/src/lib/api.ts apps/web/src/features -g '*.ts' -g '*.tsx'
rtk rg -n "GuidePublish|InteractiveDemoPublish|RevokePublish|Published.*Snapshot|PublicPublish|UpdateGuidePublish|UpdatePublish" apps/web/src -g '*.ts' -g '*.tsx'
rtk rg -n "@repo/(types|constants)|from \"\\.\\./features|from \"../features" apps/web/src/lib/api.ts apps/web/src/features -g '*.ts' -g '*.tsx'
rtk rg -n "\"(draft|active|archived|completed|canceled|manual|extension|screenshot|public|restricted|revoked|pending|member|owner|admin|callout|image|text|video|click|input|navigation)\"" apps/web/src -g '*.ts' -g '*.tsx'
```

4. Record any changed slice choice in this plan before coding if implementation scope differs from the plan below.

### Step 2: API Client Direct Shared DTO Imports

Update `apps/web/src/lib/api.ts` first.

Target:

- import project request/response DTOs from `@repo/types/project`;
- import capture request/response DTOs from `@repo/types/capture`;
- import guide request/response DTOs from `@repo/types/guide`;
- import demo request/response DTOs from `@repo/types/demo`;
- import publish request/response DTOs from `@repo/types/publish`;
- keep feature-specific browser upload types imported from feature barrels if they are browser-local.

Remove local response definitions only when the shared type already exists and the return shape is identical.

Do not change function bodies except import/type annotations. Fetch paths, methods, headers, body JSON, FormData, and blob handling must remain identical.

Focused tests:

```text
rtk pnpm --filter web test -- api
rtk pnpm --filter web check-types
```

### Step 3: Feature Barrel Cleanup

Update feature `types.ts` barrels only after `api.ts` is green.

Targets:

- remove feature aliases that merely duplicate shared DTOs and have no consumer;
- keep feature aliases that describe UI-specific behavior or protect existing imports;
- prefer `export type { ... } from "@repo/types/*"` when a barrel is only re-exporting shared contracts.

Recommended order:

1. `features/project/types.ts`
2. `features/capture-session/types.ts`
3. `features/guide/types.ts`
4. `features/interactive-demo/types.ts`
5. `features/organization/types.ts`
6. `features/auth/types.ts`

Do not remove guide-named publish aliases until all import sites are intentionally migrated and tests are updated.

### Step 4: Constants Usage Cleanup

Only touch page/component files for constants cleanup when there is a true duplicated domain option list, query option type, or membership check that should consume `@repo/constants`.

Allowed changes:

- type-only imports of shared constant-derived types;
- runtime imports of shared constant arrays for existing domain membership/option-list behavior;
- fixture annotation changes needed to satisfy stricter shared literal types.

Disallowed changes:

- replacing local UI/load-state strings with shared constants;
- changing labels, ordering, filtering behavior, badges, form options, or disabled/enabled logic;
- broad rewrites of tests or components just to remove string literals.

Focused verification:

```text
rtk pnpm --filter web check-types
rtk pnpm --filter web test -- api
```

Run page-specific tests for any page whose constants usage changes.

### Step 5: Component Import Cleanup

Only touch components/tests if type imports must move after Steps 2 through 4.

Allowed changes:

- type-only import source changes;
- fixture type annotations that point to shared DTOs instead of feature aliases;
- local test helper type annotations that align with stricter shared contracts.

Disallowed changes:

- JSX element changes;
- copy changes;
- CSS class changes;
- state machine behavior changes;
- route path/fetch path changes;
- form field changes;
- public snapshot parser behavior changes.

### Step 6: Browser Validation

Because this phase touches frontend code, browser validation is required if any component/page file changes, even if the JSX is intended to be unchanged.

If only `apps/web/src/lib/api.ts`, `apps/web/src/features/*/types.ts`, and tests are touched, browser validation is still recommended but may be documented as not required if:

- no JSX/TSX runtime code changed;
- `web test -- api` and relevant page tests pass;
- `web check-types` passes.

If any TSX page/component file changes, use agent-browser against the local web app and validate the affected routes/flows. Minimum routes by touched area:

- setup/auth: `/setup`, `/login`
- project: `/projects`, `/projects/:project_id/settings`, `/projects/:project_id`
- capture: `/projects/:project_id/capture-sessions`, `/projects/:project_id/capture-sessions/:capture_session_id`
- guide: `/projects/:project_id/guides`, `/projects/:project_id/guides/:guide_id`, `/p/:slug`
- interactive demo: `/projects/:project_id/interactive-demos`, `/projects/:project_id/interactive-demos/:interactive_demo_id`, `/d/:slug`
- organization: `/organization/members`, `/invites/:token`

Before running agent-browser, start the dev server with a free port if needed and document the URL used.

## Test And Verification Plan

Minimum focused verification for `api.ts` and type barrel changes:

```text
rtk pnpm --filter web test -- api
rtk pnpm --filter web check-types
rtk pnpm check-types
rtk git diff --check
```

If page/component imports or fixtures are touched, also run the relevant page tests:

```text
rtk pnpm --filter web test -- App LoginPage FirstRunSetupPage OrganizationMembersPage InviteAcceptPage ProjectListPage ProjectSettingsPage ProjectWorkspacePage
rtk pnpm --filter web test -- ProjectCaptureSessionListPage CaptureSessionDetailPage
rtk pnpm --filter web test -- ProjectGuideListPage GuideEditorPage PublicGuideReaderPage GuidePreviewPage GuideScreenshotViewer
rtk pnpm --filter web test -- ProjectInteractiveDemoListPage InteractiveDemoEditorPage PublicInteractiveDemoViewerPage
```

If all web feature barrels or many components are touched:

```text
rtk pnpm --filter web test
rtk pnpm --filter web lint
rtk pnpm --filter web build
```

If shared packages are unexpectedly touched after a plan update:

```text
rtk pnpm --filter @repo/types test
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/constants check-types
```

No server verification is expected because server code should not change. If server code is touched after a plan update, run the focused server route tests for every touched contract.

## Completion Checklist

- [ ] Audited current web shared imports and uncommitted work before editing.
- [ ] Kept changes scoped to contract/type consumption.
- [ ] Removed local API response aliases only where shared DTOs already exist.
- [ ] Preserved browser-only upload types and public snapshot defensive parsing.
- [ ] Preserved fetch paths, methods, headers, request bodies, credentials, blob behavior, and error classification.
- [ ] Preserved rendered UI, copy, CSS, route/navigation behavior, and public viewer behavior.
- [ ] Avoided server, extension, shared package, and CSS changes unless explicitly documented.
- [ ] Ran focused web API/type verification.
- [ ] Ran page tests and agent-browser validation if TSX behavior-bearing files changed.
- [ ] Updated this plan and the master plan after implementation.

## Handoff Notes

- Start with `apps/web/src/lib/api.ts`; it has the clearest remaining duplicated response aliases.
- Do not assume a shared type should replace a local type just because the shape is similar. Browser `File` inputs, local form drafts, view state, and defensive public snapshot parsers are intentionally local.
- The web app already has `@repo/types` and `@repo/constants` dependencies. Dependency changes should be unusual.
- Keep guide publish compatibility aliases unless the implementing slice migrates all consumers at once and the tests stay clear.
- Public guide/demo snapshot parsing is runtime safety code for untrusted public snapshot JSON. Do not reduce it to compile-time-only typing in this phase.
- If a shared contract mismatch is discovered, stop and update this plan; do not silently change backend contracts from the web cleanup phase.

## Explicit Non-Scope

- No UI redesign, visual styling, CSS, layout, copy, or icon changes.
- No route/navigation behavior changes.
- No backend/server code changes.
- No extension code changes.
- No shared package changes unless a real contract bug is found and this plan is updated first.
- No new product features.
- No broad API client rewrite or fetch abstraction replacement.
- No replacing all local types mechanically.
- No moving UI-only props, page state, form drafts, or public snapshot parse helpers into shared packages.
- No domain package usage from `apps/web`.

## Final Output Required When Implemented

The implementing agent must report:

- files changed;
- local aliases removed and intentionally kept;
- shared DTO/constants now consumed directly;
- route/API paths confirmed unchanged;
- UI/browser behavior impact assessment;
- browser validation result or explicit reason it was not required;
- verification commands run and results;
- leftovers for later cleanup.
