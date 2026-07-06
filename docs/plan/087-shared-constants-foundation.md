# Shared Constants Foundation Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Ready for implementation.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `087` of the shared contracts and domainization track.

## Objective

Activate `@repo/constants` as the canonical home for stable Demo Composer product constants that are reused across active packages or define public API vocabulary.

This is a backend/shared-contract refactor phase. It must preserve the current UI, routes, persisted values, database schema, and runtime behavior. The outcome should make later `@repo/types` and domain-package work safer by removing duplicated enum/status vocabularies first.

## Current Baseline

Current package state:

```text
packages/constants/package.json
packages/constants/src/index.ts
packages/constants/tsconfig.json
```

Observed baseline:

- `packages/constants/src/index.ts` currently exports an empty module.
- `packages/constants/package.json` currently has a placeholder `test` script that exits with failure.
- `@repo/constants` currently has no runtime dependencies and is not consumed by `apps/server`, `apps/web`, or `apps/extension`.
- Existing product constants are repeated in server Zod route schemas, server service/repository types, web API/client types, web feature types, extension API types, and tests.

Relevant app/package scripts to preserve:

- `@repo/constants`: `lint`, `build`, `dev`, `clean`; replace the placeholder failing `test`.
- `server`: `test`, `test:db`, `test:smoke`, `build`, `lint`, `check-types`.
- `web`: `test`, `build`, `lint`, `check-types`.
- `extension`: `test`, `build`, `lint`, `check-types`.

Before implementation, run:

```text
rtk git status --short
rtk rg "@repo/constants" .
rtk rg "z\\.enum|source_type|event_type|asset_type|storage_provider|block_type|hotspot_type|artifact_type|visibility|deployment_mode|onboarding_mode|role" apps packages
```

Record any uncommitted work from other agents that touches the affected files. Do not overwrite or revert unrelated work.

## Required Source Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0015-user-organization-org-user-identity-model.md
docs/adr/0017-deployment-aware-onboarding-mode.md
docs/adr/0018-web-first-run-setup-from-day-one.md
```

## Reuse Gate

A value can move into `@repo/constants` only when at least one condition is true:

- it is consumed by two or more active apps/packages;
- it defines public API vocabulary;
- it is an enum/status/type value persisted in API or database records and repeated in more than one place;
- this plan documents a concrete drift risk.

Values that fail the gate stay local to their owning module. Do not turn `@repo/constants` into a dumping ground.

## Implementation Scope

Included:

- Replace the placeholder `@repo/constants` package baseline with real domain-grouped exports.
- Add focused tests for the constants package.
- Add `@repo/constants` dependencies only to apps/packages that import from it.
- Replace low-risk duplicated literal unions and Zod enum arrays with shared constants.
- Preserve all existing string values byte-for-byte.
- Keep constants grouped by Demo Composer domain language.

Explicit non-scope:

- No UI redesign, layout changes, styling changes, or visible copy changes.
- No route URL changes.
- No request/response shape changes.
- No database schema or migration changes.
- No new product features.
- No domain behavior functions in `@repo/constants`.
- No backend-only table names, schema names, SQL aliases, or migration identifiers in `@repo/constants`.
- No activation of `@repo/types` unless an implementation compile issue makes a tiny type-only bridge unavoidable. Prefer no `@repo/types` changes in this phase.
- No mechanical replacement of every string literal in tests. Tests may keep example payload literals when that is clearer.

## Constants To Add

Use readonly tuple exports that work with Zod and inferred TypeScript types:

```ts
export const EXAMPLE_VALUES = ["one", "two"] as const;
export type ExampleValue = (typeof EXAMPLE_VALUES)[number];
```

Do not export display labels in this phase.

### Capture Constants

File:

```text
packages/constants/src/capture.ts
```

Exports:

- `CAPTURE_SESSION_STATUSES`: `["draft", "capturing", "completed", "canceled", "archived"]`
- `CaptureSessionStatus`
- `CAPTURE_SESSION_SOURCE_TYPES`: `["manual", "extension", "import"]`
- `CaptureSessionSourceType`
- `CAPTURE_EVENT_TYPES`: `["navigation", "click", "input", "capture", "note"]`
- `CaptureEventType`

Reuse reason:

- These are public API values used by server, web, extension, persisted records, and tests.

Do not move in this phase:

- Extension-local active capture modes `manual | automatic`.
- Extension diagnostic statuses `success | failed`.
- Extension storage keys.
- Capture redaction field-name sets unless implementation proves a second active consumer already exists. Privacy defaults should remain server-local until the capture-domain/privacy plan can move them with tests.

### File And Capture Asset Constants

File:

```text
packages/constants/src/file.ts
```

Exports:

- `CAPTURE_ASSET_TYPES`: `["screenshot", "html_snapshot", "thumbnail", "redacted_screenshot"]`
- `CaptureAssetType`
- `FILE_STORAGE_PROVIDERS`: `["local", "external"]`
- `FileStorageProvider`

Reuse reason:

- Capture asset types and storage providers are public API/persisted vocabulary repeated across server, web, extension, and publish snapshots.

Do not move in this phase:

- MIME allow-lists, file size limits, and storage paths unless discovery shows they are repeated across active packages. Those can be handled by file-domain child plans.

### Guide Constants

File:

```text
packages/constants/src/guide.ts
```

Exports:

- `GUIDE_STATUSES`: `["draft", "archived"]`
- `GuideStatus`
- `GUIDE_BLOCK_TYPES`: `["step", "header", "paragraph", "tip", "alert", "capture", "divider", "gif"]`
- `GuideBlockType`
- `GUIDE_CREATABLE_BLOCK_TYPES`: `["step", "header", "paragraph", "tip", "alert", "divider"]`
- `GuideCreatableBlockType`
- `GUIDE_BLOCK_PLACEMENTS`: `["before", "after"]`
- `GuideBlockPlacement`
- `GUIDE_ANNOTATION_TYPES`: `["highlight"]`
- `GuideAnnotationType`

Important behavior rule:

- Preserve the current distinction between the full persisted/read block set and the route/editor creatable subset. Current server create-block validation accepts only `step`, `header`, `paragraph`, `tip`, `alert`, and `divider`, while server/web read models also know `capture` and `gif`. Do not broaden create-block validation by replacing it with `GUIDE_BLOCK_TYPES`.

Reuse reason:

- Guide status/block/annotation vocabulary is public API/persisted vocabulary repeated in server and web.

### Interactive Demo Constants

File:

```text
packages/constants/src/demo.ts
```

Exports:

- `INTERACTIVE_DEMO_STATUSES`: `["draft", "archived"]`
- `InteractiveDemoStatus`
- `DEMO_HOTSPOT_TYPES`: `["click", "info", "next"]`
- `DemoHotspotType`

Reuse reason:

- Interactive demo status and hotspot values are public API/persisted vocabulary repeated in server, web, publish snapshots, and tests.

Terminology rule:

- Use `InteractiveDemoStatus` for the product entity status to align with the master plan and existing server service language. `DemoHotspotType` can keep the shorter existing name because current code already uses `DemoHotspot` for scenes/hotspots.

Do not move in this phase:

- Scene ordering policy, hotspot coordinate validation, transition behavior, or editor defaults.

### Publish Constants

File:

```text
packages/constants/src/publish.ts
```

Exports:

- `PUBLISH_ARTIFACT_TYPES`: `["guide", "interactive_demo"]`
- `PublishArtifactType`
- `PUBLISH_VISIBILITIES`: `["public", "restricted"]`
- `PublishVisibility`
- `PUBLISH_LINK_STATUSES`: `["active", "revoked"]`
- `PublishLinkStatus`

Reuse reason:

- Publish artifact type, visibility, and link status are public API/persisted vocabulary repeated across server, web, and public viewer behavior.

Security rule:

- These constants are values only. Do not change publish access checks, password handling, viewer-session behavior, or immutable snapshot resolution.

### Organization Constants

File:

```text
packages/constants/src/organization.ts
```

Exports:

- `ORGANIZATION_ROLES`: `["owner", "member"]`
- `OrganizationRole`
- `ORGANIZATION_INVITE_STATUSES`: `["pending", "accepted", "revoked", "expired"]`
- `OrganizationInviteStatus`
- `ORGANIZATION_MEMBER_STATUSES`: `["active", "disabled"]`
- `OrganizationMemberStatus`

Reuse reason:

- Role and invite status values are public API/persisted vocabulary repeated in organization route schemas, services, web feature types, auth payloads, and tests.

Security rule:

- Role constants do not grant permissions. Preserve existing owner-only checks and session/auth behavior. Do not replace permission conditions with broad string comparisons beyond current behavior.

### Project Constants

File:

```text
packages/constants/src/project.ts
```

Exports:

- `PROJECT_STATUSES`: `["active", "archived"]`
- `ProjectStatus`

Reuse reason:

- Project status is public API/persisted vocabulary repeated in server and web project filtering/update paths.

### Setup And Instance Constants

File:

```text
packages/constants/src/setup.ts
```

Exports:

- `DEPLOYMENT_MODES`: `["self_hosted", "hosted"]`
- `DeploymentMode`
- `ONBOARDING_MODES`: `["first_run_setup", "signup"]`
- `OnboardingMode`

Reuse reason:

- Deployment and onboarding modes define public instance/setup API behavior and are used by server config/startup and web setup gating.

Security rule:

- Do not change first-run setup eligibility, owner bootstrap checks, environment parsing, or setup completion behavior.

### Package Barrel

File:

```text
packages/constants/src/index.ts
```

Required exports:

- Re-export all domain files above.
- Keep exports named and domain-specific.
- Do not add default exports.

## Exact Affected Files

### Package Files

Expected changes:

```text
packages/constants/package.json
packages/constants/src/index.ts
packages/constants/src/capture.ts
packages/constants/src/file.ts
packages/constants/src/guide.ts
packages/constants/src/demo.ts
packages/constants/src/publish.ts
packages/constants/src/organization.ts
packages/constants/src/project.ts
packages/constants/src/setup.ts
packages/constants/src/constants.test.ts
```

Optional only if needed:

```text
packages/constants/tsconfig.json
pnpm-lock.yaml
```

Package script guidance:

- Replace the placeholder failing `test` script.
- Prefer `vitest run` for package tests, consistent with app packages.
- If adding `vitest`, add it as a dev dependency of `@repo/constants`.
- Keep `build` as `tsup ./src/index.ts --format esm,cjs --dts` unless implementation discovers an actual build issue.

### Server Files

Add `@repo/constants` to `apps/server/package.json` only if server imports are introduced.

Expected server import replacements:

```text
apps/server/src/config/startup.config.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.service.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/publish/publish.service.ts
apps/server/src/modules/publish/publish.repository.ts
apps/server/src/modules/organization/organization-invites.routes.ts
apps/server/src/modules/organization/organization-invites.service.ts
apps/server/src/modules/organization/organization-invites.repository.ts
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/project/project.service.ts
apps/server/src/modules/public-instance/public-instance.config.ts
apps/server/src/modules/public-instance/public-instance.routes.ts
apps/server/src/modules/public-instance/public-instance.service.ts
apps/server/src/modules/setup/first-run-setup.service.ts
```

Server tests should be changed only when type imports require it or when the test currently duplicates a central enum list. Keep request/response payload examples readable.

Server type ownership rule:

- Current service modules act as type-export surfaces for repositories and routes. When moving a service-local type alias to `@repo/constants`, either keep a compatibility re-export from the existing service module or update every downstream import in the same slice.
- Downstream repository files to compile-check carefully if compatibility re-exports are not preserved:

```text
apps/server/src/modules/capture-session/capture-session.repository.ts
apps/server/src/modules/capture-event/capture-event.repository.ts
apps/server/src/modules/capture-asset/capture-asset.repository.ts
apps/server/src/modules/guide/guide.repository.ts
apps/server/src/modules/interactive-demo/interactive-demo.repository.ts
apps/server/src/modules/project/project.repository.ts
```

- `apps/server/src/modules/interactive-demo/interactive-demo.service.ts` currently defines `InteractiveDemoSourceEventType` with the same values as capture events. Prefer a type alias to shared `CaptureEventType` only if behavior and naming stay clear.

### Web Files

Add `@repo/constants` to `apps/web/package.json` only if web imports are introduced.

Expected direct web import replacements:

```text
apps/web/src/lib/api.ts
apps/web/src/features/capture-session/types.ts
apps/web/src/features/guide/types.ts
apps/web/src/features/interactive-demo/types.ts
apps/web/src/features/organization/types.ts
apps/web/src/features/project/types.ts
```

Web implementation rule:

- Prefer type-only imports and type re-exports from existing feature `types.ts` files so component imports do not churn.
- Runtime constant comparisons are allowed only when they replace duplicated public API vocabulary and preserve behavior exactly.
- JSX structure, CSS modules, visible text, labels, ordering, navigation, and rendered UI behavior must not change.
- If touching a `.tsx` file only to replace string unions/comparisons, verify the rendered output remains unchanged through existing component tests.

Web runtime consumer files to inspect before deciding whether to touch them:

```text
apps/web/src/App.tsx
apps/web/src/features/setup/FirstRunSetupPage.tsx
apps/web/src/features/organization/OrganizationMembersPage.tsx
apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/ProjectGuideListPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx
apps/web/src/features/project/ProjectWorkspacePage.tsx
```

Do not mechanically touch all runtime consumer files in this phase. If a `.tsx` file would only swap literal option values that are also visible text, leave it local unless there is a concrete drift risk and matching component coverage.

### Extension Files

Add `@repo/constants` to `apps/extension/package.json` only if extension imports are introduced.

Expected extension import replacements:

```text
apps/extension/src/lib/api.ts
apps/extension/src/App.tsx
apps/extension/src/lib/automatic-capture.ts
```

Extension implementation rule:

- Replace public API literals such as `source_type: "extension"`, `event_type: "capture" | "click"`, and `asset_type: "screenshot"` only when it improves type safety without changing behavior.
- `apps/extension/src/lib/api.ts` also has project status values. Import or re-export `ProjectStatus` there if the project API type is updated.
- Do not move extension-local active capture mode, pause state, storage keys, or diagnostic status values in this phase.

## API Contracts And Routes

No route URLs, HTTP methods, auth requirements, request shapes, response shapes, or status codes should change.

Relevant contracts to preserve:

- Capture session routes:
  - `POST /api/v1/projects/:project_id/capture-sessions`
  - `GET /api/v1/projects/:project_id/capture-sessions`
  - `PATCH /api/v1/projects/:project_id/capture-sessions/:capture_session_id`
  - `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete`
  - Values: `CAPTURE_SESSION_STATUSES`, `CAPTURE_SESSION_SOURCE_TYPES`
- Capture event routes:
  - routes under `/api/v1/projects/:project_id/capture-sessions/:capture_session_id/events`
  - Values: `CAPTURE_EVENT_TYPES`
- Capture asset routes:
  - routes under `/api/v1/projects/:project_id/capture-assets`
  - Values: `CAPTURE_ASSET_TYPES`, `FILE_STORAGE_PROVIDERS`
- Guide routes:
  - routes under `/api/v1/projects/:project_id/guides`
  - Values: `GUIDE_STATUSES`, `GUIDE_CREATABLE_BLOCK_TYPES`, `GUIDE_BLOCK_PLACEMENTS`, `GUIDE_ANNOTATION_TYPES`
  - Do not use full `GUIDE_BLOCK_TYPES` for create-block validation.
- Interactive demo routes:
  - routes under `/api/v1/projects/:project_id/interactive-demos`
  - Values: `INTERACTIVE_DEMO_STATUSES`, `DEMO_HOTSPOT_TYPES`
- Publish routes:
  - guide publish routes under `/api/v1/projects/:project_id/guides/:guide_id/publish`
  - interactive demo publish routes under `/api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish`
  - public publish routes under `/api/v1/public/publish-links/:slug`
  - Values: `PUBLISH_ARTIFACT_TYPES`, `PUBLISH_VISIBILITIES`, `PUBLISH_LINK_STATUSES`
- Organization invite routes:
  - routes under `/api/v1/organization`
  - public invite routes under `/api/v1/public/invites/:token`
  - Values: `ORGANIZATION_ROLES`, `ORGANIZATION_INVITE_STATUSES`, `ORGANIZATION_MEMBER_STATUSES`
- Project routes:
  - routes under `/api/v1/projects`
  - Values: `PROJECT_STATUSES`
- Public instance/setup routes:
  - `GET /api/v1/public/instance`
  - first-run setup routes under `/api/v1/setup`
  - Values: `DEPLOYMENT_MODES`, `ONBOARDING_MODES`
  - Preserve current hosted/self-hosted defaults from `public-instance.config.ts`: hosted defaults to `signup`; self-hosted defaults to `first_run_setup`.

Zod guidance:

- Use shared readonly tuples directly where Zod accepts them.
- If Zod type inference needs a non-empty tuple helper, implement it locally in the server module or a server-local schema utility. Do not add helper behavior to `@repo/constants`.
- Preserve optional/nullable rules exactly as they are today.

## Schemas And Types

This phase should export constant-derived types from `@repo/constants`, not runtime schemas from `@repo/types`.

Required type replacement pattern:

- Server service/config aliases such as `CaptureSessionStatus`, `CaptureSessionSourceType`, `CaptureEventType`, `CaptureAssetType`, `FileStorageProvider`, `GuideStatus`, `GuideBlockType`, `GuideCreatableBlockType`, `InteractiveDemoStatus`, `DemoHotspotType`, `PublishArtifactType`, `PublishVisibility`, `PublishLinkStatus`, `OrgMemberRole`, `OrgInviteStatus`, `OrganizationMemberStatus`, `ProjectStatus`, `DeploymentMode`, and `OnboardingMode` should import from `@repo/constants` when the import does not create cycles.
- Web feature/API types should import or re-export matching type aliases from `@repo/constants` instead of re-declaring literal unions.
- Extension API types should import or re-export matching project/capture/file type aliases from `@repo/constants` instead of re-declaring literal unions.

Compatibility rule:

- Preserve current public type import paths where practical by re-exporting imported types from existing feature/service type modules. This keeps the constants phase small and avoids forcing broad component/repository rewrites before the `@repo/types` plans.
- Do not tighten broad `role: string` fields in auth/session DTOs to `OrganizationRole` unless the current server contract is verified in the same implementation slice and compile checks stay clean.

Do not move DTO shapes in this phase. Full request/response schemas belong to later `@repo/types` child plans.

## Behavior Rules

- Existing literal values must remain byte-for-byte identical.
- Existing validation breadth must remain identical.
- Existing defaults must remain identical:
  - capture sessions created by web/manual flows still use `source_type: "manual"`;
  - extension-created capture sessions still use `source_type: "extension"`;
  - extension screenshot events still use `event_type: "capture"`;
  - extension automatic click events still use `event_type: "click"`;
  - screenshot uploads still default to `asset_type: "screenshot"` and `storage_provider: "local"` where current code does so;
  - publish visibility defaults remain `public` where current code uses `public`;
  - invite role defaults remain `member` where current code uses `member`;
  - setup/public instance modes remain current environment-derived values.
- Do not broaden guide creatable block types.
- Do not change published snapshot payloads.
- Do not change auth/session payload shapes.
- Do not change public viewer fallback parsing behavior except replacing type guards with shared constant membership checks if behavior is identical.

## Security And Permission Rules

- Organization role constants are vocabulary only. Preserve owner-only invite/organization checks.
- Publish visibility constants are vocabulary only. Preserve restricted-link password/viewer-session behavior.
- Setup mode constants are vocabulary only. Preserve first-run setup eligibility and owner bootstrap protections.
- Capture privacy defaults and raw input redaction behavior must not weaken. Keep redaction field-name logic server-local in this phase unless a dedicated privacy test proves the shared move is behavior-neutral.
- Do not expose session tokens, passwords, password hashes, invite tokens, storage paths, or internal SQL identifiers from `@repo/constants`.
- Do not add runtime dependencies that pull browser-only code into the server or server-only code into browser bundles.

## Migration And Backwards Compatibility

- No database migration is required.
- No persisted rows need backfill because all values stay the same.
- No API version bump is required.
- No client migration is required beyond package imports.
- `@repo/constants` should remain private workspace package.
- Existing tests that assert literal payloads should continue to pass without expected-value changes.
- If implementation discovers a value mismatch between apps, stop and document it in this plan before choosing a canonical value. Do not silently normalize data in this phase.

## Implementation Steps

1. Confirm the worktree and dependency baseline.
   - Run `rtk git status --short`.
   - Run `rtk rg "@repo/constants" .`.
   - Inspect package manager changes before editing dependency manifests.

2. Activate the constants package.
   - Replace the empty `packages/constants/src/index.ts` with domain re-exports.
   - Add the domain files listed in this plan.
   - Replace the placeholder failing `test` script.
   - Add `vitest` as a dev dependency only if adding the planned constants tests.

3. Add constant tests.
   - Add `packages/constants/src/constants.test.ts`.
   - Test that each exported tuple is unique.
   - Test important subset relationships, especially `GUIDE_CREATABLE_BLOCK_TYPES` being a subset of `GUIDE_BLOCK_TYPES`.
   - Avoid tests that merely duplicate every literal without checking a useful invariant.

4. Wire server imports.
   - Replace route-local `z.enum([...])` arrays with shared tuples where behavior is identical.
   - Replace server service type aliases with imports from `@repo/constants`.
   - Keep route-local schemas for params, bodies, responses, optionality, and nullable values.
   - Preserve the guide full/read versus creatable/create distinction.

5. Wire web imports.
   - Replace duplicated literal union types in feature/API type files.
   - Replace inline membership guards only when a shared tuple plus `.includes` preserves current behavior exactly.
   - Do not change JSX output or styling.

6. Wire extension imports.
   - Replace API literal union types and low-risk request literals.
   - Keep extension-local capture mode and storage values local.

7. Verify and adjust.
   - Run focused package checks first.
   - Run server/web/extension checks only for packages touched.
   - If a consumer import causes bundling or module-resolution issues, revert that consumer replacement and document the follow-up instead of widening scope.

8. Update execution notes.
   - At the end of implementation, update this plan with a short execution note only if the implementation had to deviate from the planned file list or extraction set.

## Test And Verification Plan

Minimum verification after implementation:

```text
rtk pnpm --filter @repo/constants lint
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/constants build
rtk pnpm --filter server check-types
rtk pnpm --filter web check-types
rtk pnpm --filter extension check-types
```

Run focused server tests when server route/service imports are changed:

```text
rtk pnpm --filter server test -- capture-session capture-event capture-asset guide interactive-demo publish organization project setup
```

Run focused web tests when web files are changed:

```text
rtk pnpm --filter web test -- api capture-session guide interactive-demo organization project setup
```

Run focused extension tests when extension files are changed:

```text
rtk pnpm --filter extension test -- api automatic-capture
```

Run full workspace checks if the focused checks pass and the implementation touched all three apps:

```text
rtk pnpm check-types
rtk pnpm lint
```

Database tests:

- Not required for a pure constants import refactor.
- Run relevant DB integration tests only if implementation accidentally touches persistence behavior or if TypeScript changes require repository edits beyond imported type aliases.

## Agent-Browser Validation

This phase is expected to have no frontend/browser behavior changes. Agent-browser validation is not required if implementation only changes constants, type imports, route schemas, and non-rendered comparisons.

If implementation changes JSX structure, CSS, visible copy, navigation behavior, or browser runtime behavior, stop and update this plan before proceeding. The updated plan must include browser validation for:

- web first-run setup gate;
- project capture session list/create flow;
- guide editor block creation controls;
- interactive demo editor hotspot controls;
- public guide/demo viewer access where publish visibility is used;
- extension start capture, manual screenshot capture, automatic click capture, and finish capture flow where feasible.

## Acceptance Criteria

- `@repo/constants` contains real domain-grouped exports and no longer only exports an empty module.
- `@repo/constants` no longer has a knowingly failing placeholder `test` script.
- Every exported constant passes the reuse gate documented in this plan.
- Every app/package that imports `@repo/constants` declares the dependency.
- Existing API values, persisted values, defaults, validation breadth, and route behavior remain unchanged.
- Guide creatable block validation remains narrower than the full guide block read/persisted set.
- Backend-only database identifiers remain out of `@repo/constants`.
- No UI output, styling, visible copy, or user-visible behavior changes.
- Verification commands are run and results are recorded in the implementation handoff.

## Handoff Notes For The Implementing Agent

- Treat this as a constants-only foundation phase. Do not start `@repo/types` schema extraction here.
- Keep changes easy to review by grouping constants package activation separately from consumer rewiring.
- Prefer type imports for web and extension where possible.
- Be careful with guide block types: `capture` and `gif` are known/read block types, but not currently creatable through the server create-block route.
- Be careful with organization roles: importing a shared `OrganizationRole` type must not change owner-only permission checks.
- Be careful with setup modes: shared constants must not change environment parsing or first-run setup state.
- If a value appears duplicated only in tests, do not move it solely for test convenience.
- If a constant family feels useful but does not pass the reuse gate, leave it local and list it in the final output.

## Final Output Required

When executing this plan, report:

- constants added to `@repo/constants`;
- constants intentionally left local;
- files changed;
- dependency manifest changes;
- tests and checks run with results;
- any deviations from this plan;
- follow-up candidates for later `@repo/types` or domain-package child plans.
