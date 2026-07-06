# Publish Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Completed and post-implementation audited on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `095` of the shared contracts and domainization track.

## Objective

Create `@repo/publish-domain` and move pure Publish Link, Published Artifact snapshot, public access, password policy, and public viewer session rules out of `apps/server`, while preserving every existing route, payload, auth behavior, database shape, immutable snapshot behavior, public URL, public viewer behavior, and editor publish control behavior.

Publishing is a shared concern for both Guides and Interactive Demos:

- **Published Artifact** is an immutable snapshot of a guide or interactive demo at publish time.
- **Publish Link** is the stable public access route that points to the latest active Published Artifact for a target artifact.
- Guide and Interactive Demo draft rows must never be read directly by public viewers.

The server remains the application adapter that owns Fastify routes, auth/session context, SQL repositories, transactions, database migrations, row mapping, storage adapters, cookie plumbing, password hashing/checking implementation details, and error-to-HTTP mapping.

## Completion Summary

Completed on 2026-07-07. Post-implementation audit completed on 2026-07-07.

Implemented changes:

- Added shared publish route/public snapshot contracts in `@repo/types/publish`.
- Created `@repo/publish-domain` with pure snapshot, access, password, viewer-session, and publish-link helper policies.
- Wired `apps/server/src/modules/publish/publish.service.ts` to use publish-domain policies while keeping repository orchestration, transactions, auth scope, SQL, storage reads, password hashing/checking, viewer-token hashing, cookie handling, and HTTP error mapping server-owned.
- Replaced publish route body parsing for access, password, and public viewer-session requests with shared `@repo/types/publish` schemas while preserving existing error classes and response types.
- Replaced guide and interactive demo web publish/public snapshot type definitions with shared `@repo/types/publish` imports/re-exports.
- Removed guide-named publish type imports from `apps/web/src/features/interactive-demo/**`; guide feature compatibility aliases remain in `apps/web/src/features/guide/types.ts`.
- Fixed post-implementation shared contract drift so `GuidePublishResult` and `InteractiveDemoPublishResult` are non-null `PublishResult` responses, and `RevokePublishResultSchema` preserves the full returned `PublishLink` instead of narrowing it to `id`, `status`, and `revoked_at`.
- Updated guide and interactive-demo editor test doubles to return full publish/revoke result payloads that match the actual API responses.
- Added no database migration and changed no route URL, public URL shape, response envelope, status code, persisted value, JSX, CSS, rendered copy, fetch path, cookie name, cookie options, password hashing algorithm, or public viewer behavior.

Verification passed:

- `rtk pnpm --filter @repo/types test -- publish`
- `rtk pnpm --filter @repo/types check-types`
- `rtk pnpm --filter @repo/types lint`
- `rtk pnpm --filter @repo/types build`
- `rtk pnpm --filter @repo/publish-domain test`
- `rtk pnpm --filter @repo/publish-domain check-types`
- `rtk pnpm --filter @repo/publish-domain lint`
- `rtk pnpm --filter @repo/publish-domain build`
- `rtk pnpm --filter server test -- publish.service publish.routes public-link-password publish.app`
- `rtk pnpm --filter server check-types`
- `rtk pnpm --filter server lint`
- `rtk pnpm --filter web check-types`
- `rtk pnpm --filter web test -- GuideEditorPage PublicGuideReaderPage InteractiveDemoEditorPage PublicInteractiveDemoViewerPage`
- `rtk pnpm --filter web test -- api`
- Post-implementation audit rerun: `rtk pnpm --filter @repo/types test -- publish`
- Post-implementation audit rerun: `rtk pnpm --filter web check-types`
- Post-implementation audit rerun: `rtk pnpm --filter web test -- GuideEditorPage InteractiveDemoEditorPage`
- Post-implementation audit rerun: `rtk pnpm --filter server check-types`
- Post-implementation audit rerun: `rtk pnpm check-types`

Browser validation was not required because this phase changed shared types, route body schemas, and backend/domain wiring without changing JSX, CSS, rendered copy, navigation, fetch paths, form behavior, public viewer parsing behavior, or browser-visible publish behavior.

Database verification was not required because this phase did not change migrations, SQL, row mapping, transaction boundaries, persisted snapshot JSON shape, persisted values, cookie/session tables, or storage access SQL.

Completion checklist:

- [x] Added shared publish contracts and tests.
- [x] Added `@repo/publish-domain` package and pure policy tests.
- [x] Kept server routes, auth/session, SQL repositories, transactions, storage adapters, password hashing/checking, viewer-token hashing, cookies, and HTTP error mapping server-owned.
- [x] Preserved existing route URLs, public URL shapes, response envelopes, status codes, and error `type` strings.
- [x] Preserved immutable Published Artifact snapshot behavior for guides and interactive demos.
- [x] Preserved password-protected public access and public viewer session behavior.
- [x] Kept web UI behavior stable and avoided adding a web dependency on `@repo/publish-domain`.
- [x] Confirmed browser validation is not required.
- [x] Confirmed DB validation is not required.
- [x] Completed post-implementation audit against this plan and the master plan.
- [x] Confirmed publish-result and revoke-result shared contracts match the implemented route response shapes.

Carry into `096-server-adapter-thinning.md`:

- `apps/web/src/features/guide/types.ts` still intentionally keeps guide-named publish compatibility aliases for existing guide UI imports.
- `apps/server/src/modules/publish/publish.service.ts` still re-exports publish types/errors for server route/repository/test compatibility.
- Shared publish result aliases now match actual non-null route responses; keep that stricter API boundary intact when thinning server adapters.
- Publish repository SQL and row mapping remain server-owned and can be revisited only by adapter-thinning work that preserves database behavior.

## Baseline From Completed 094

Plan `094` completed and was post-implementation audited on 2026-07-07.

Relevant completed state:

- `@repo/demo-domain` exists and owns pure Interactive Demo input, generation, scene, hotspot, coordinate, order, and target-scene policies.
- `@repo/types/demo` exists and owns shared interactive demo route contracts.
- Existing Interactive Demo routes, response envelopes, status codes, SQL, auth behavior, and public viewer behavior were preserved.
- `apps/server/src/modules/publish/publish.service.ts` still owns `PublishedInteractiveDemoSnapshot` and public demo snapshot preparation.
- `apps/web/src/features/interactive-demo/types.ts` still owns `PublishedInteractiveDemoSnapshot*` public viewer types.
- Web publish controls and public viewer code still use guide-named publish types such as `GuidePublishStatusResponse`, `GuidePublishResult`, `GuideRevokePublishResult`, and `PublicPublishLinkResponse` for both guides and interactive demos.

Carry-forward requirements from `094`:

- Move publish snapshot/public contracts into a publish-owned shared contract module.
- Remove guide-named publish compatibility types from interactive demo publish usage.
- Preserve public viewer UI and editor publish control behavior.
- Do not change route URLs, fetch paths, public URL shapes, persisted values, or database schema.

## Current Codebase Baseline

Shared constants already exist:

```text
packages/constants/src/publish.ts
packages/constants/src/index.ts
```

`packages/constants/src/publish.ts` currently exports:

- `PUBLISH_ARTIFACT_TYPES = ["guide", "interactive_demo"]`
- `PublishArtifactType`
- `PUBLISH_VISIBILITIES = ["public", "restricted"]`
- `PublishVisibility`
- `PUBLISH_LINK_STATUSES = ["active", "revoked"]`
- `PublishLinkStatus`

Shared publish types do not yet exist:

```text
packages/types/src/publish.ts
packages/types/src/publish.test.ts
```

Domain package does not yet exist:

```text
packages/publish-domain/package.json
packages/publish-domain/tsconfig.json
packages/publish-domain/src/**/*
```

Current server publish module:

```text
apps/server/src/modules/publish/public-link-password.ts
apps/server/src/modules/publish/public-link-password.test.ts
apps/server/src/modules/publish/public-viewer-cookie.ts
apps/server/src/modules/publish/publish.app.integration.test.ts
apps/server/src/modules/publish/publish.db.integration.test.ts
apps/server/src/modules/publish/publish.repository.ts
apps/server/src/modules/publish/publish.routes.test.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/publish/publish.service.test.ts
apps/server/src/modules/publish/publish.service.ts
```

Current publish service owns pure behavior that should move:

- Guide snapshot creation through `build_snapshot`.
- Interactive Demo snapshot creation through `build_interactive_demo_snapshot`.
- `public_publish_response`.
- `assert_public_access`.
- `assert_viewer_access`.
- `validate_publish_password`.
- Viewer session TTL calculation: 12 hours.
- Slug retry limit as a policy constant or decision helper: 5 attempts after repository slug-conflict signals.
- Public asset access preconditions before storage read.

Current publish service also owns adapter behavior that must stay server-owned:

- `randomBytes` slug generation and viewer-token generation.
- `node:crypto` hashing details for passwords and viewer tokens.
- Viewer token hashing helper and token-hash lookup orchestration.
- `hash_public_link_password` and `verify_public_link_password` implementation in `public-link-password.ts`.
- Repository interface and calls.
- Project existence checks.
- Guide/demo existence checks.
- SQL transactions.
- File storage provider reads.
- Error-to-HTTP mapping.

Current server routes:

```text
POST   /api/v1/projects/:project_id/guides/:guide_id/publish
GET    /api/v1/projects/:project_id/guides/:guide_id/publish
DELETE /api/v1/projects/:project_id/guides/:guide_id/publish
PATCH  /api/v1/projects/:project_id/guides/:guide_id/publish/access
PATCH  /api/v1/projects/:project_id/guides/:guide_id/publish/password

POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/access
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/password

GET    /api/v1/public/publish-links/:slug
POST   /api/v1/public/publish-links/:slug/viewer-sessions
GET    /api/v1/public/publish-links/:slug/assets/:capture_asset_id/file
```

Current web publish/public type ownership:

```text
apps/web/src/features/guide/types.ts
apps/web/src/features/interactive-demo/types.ts
apps/web/src/lib/api.ts
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx
```

Current migrations that define the persisted publish model:

```text
apps/server/src/db/migrations/006_publish_foundation_schema.sql
apps/server/src/db/migrations/009_publish_link_access_controls.sql
apps/server/src/db/migrations/010_public_publish_password_access.sql
```

No migration is expected in this phase.

## Exact Affected Files

Create:

```text
packages/publish-domain/package.json
packages/publish-domain/tsconfig.json
packages/publish-domain/src/index.ts
packages/publish-domain/src/errors/publish-domain-error.ts
packages/publish-domain/src/types/publish-domain.ts
packages/publish-domain/src/policies/publish-access-policy.ts
packages/publish-domain/src/policies/publish-access-policy.test.ts
packages/publish-domain/src/policies/publish-link-policy.ts
packages/publish-domain/src/policies/publish-link-policy.test.ts
packages/publish-domain/src/policies/publish-password-policy.ts
packages/publish-domain/src/policies/publish-password-policy.test.ts
packages/publish-domain/src/policies/publish-snapshot-policy.ts
packages/publish-domain/src/policies/publish-snapshot-policy.test.ts
packages/types/src/publish.ts
packages/types/src/publish.test.ts
```

Modify:

```text
packages/types/src/index.ts
apps/server/package.json
apps/server/src/modules/publish/publish.service.ts
apps/server/src/modules/publish/publish.service.test.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/publish/publish.routes.test.ts
apps/server/src/modules/publish/publish.app.integration.test.ts
apps/server/src/modules/publish/publish.repository.ts
apps/web/src/features/guide/types.ts
apps/web/src/features/interactive-demo/types.ts
apps/web/src/lib/api.ts
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.test.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx
docs/plan/095-publish-domain-extraction.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

Conditional only if route-local parsing is replaced with shared schemas:

```text
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/publish/publish.routes.test.ts
```

Do not modify unless implementation discovers an actual contract mismatch:

```text
packages/constants/src/publish.ts
packages/constants/src/constants.test.ts
apps/server/src/db/migrations/**/*
apps/server/src/modules/publish/public-link-password.ts
apps/server/src/modules/publish/public-viewer-cookie.ts
apps/web/src/features/guide/*.module.css
apps/web/src/features/interactive-demo/*.module.css
apps/web/src/routes/**/*
```

## Shared Contract Plan

Add `packages/types/src/publish.ts` and export it from `packages/types/src/index.ts`.

Use Zod schemas for route contracts that are currently duplicated or guide-named in web/server code. Keep schemas permissive only where existing routes are permissive. Do not introduce stricter validation unless the current route already rejects the input.

Required exports:

- `PublishLinkSchema`
- `PublishedArtifactSchema`
- `PublishStatusResponseSchema`
- `PublishResultSchema`
- `RevokePublishResultSchema`
- `PublicPublishLinkSchema`
- `PublicPublishedArtifactSchema`
- `PublicPublishLinkResponseSchema`
- `UpdatePublishAccessRequestSchema`
- `UpdatePublishPasswordRequestSchema`
- `CreatePublicViewerSessionRequestSchema`
- `PublishedSnapshotAssetSchema`
- `PublishedGuideSnapshotBlockSchema`
- `PublishedGuideSnapshotSchema`
- `PublishedInteractiveDemoSnapshotHotspotSchema`
- `PublishedInteractiveDemoSnapshotSceneSchema`
- `PublishedInteractiveDemoSnapshotSchema`

Required types:

- `PublishLink`
- `PublishedArtifact`
- `PublishStatusResponse`
- `PublishResult`
- `GuidePublishStatusResponse = PublishStatusResponse`
- `GuidePublishResult = PublishResult`
- `InteractiveDemoPublishStatusResponse = PublishStatusResponse`
- `InteractiveDemoPublishResult = PublishResult`
- `RevokePublishResult`
- `PublicPublishLink`
- `PublicPublishedArtifact`
- `PublicPublishLinkResponse`
- `UpdatePublishAccessInput`
- `UpdatePublishPasswordInput`
- `CreatePublicViewerSessionInput`
- `PublishedSnapshotAsset`
- `PublishedGuideSnapshot`
- `PublishedInteractiveDemoSnapshot`

Schema rules:

- `PublishLink.artifact_type`: `z.enum(PUBLISH_ARTIFACT_TYPES)`.
- `PublishLink.visibility`: `z.enum(PUBLISH_VISIBILITIES)`.
- `PublishLink.status`: `z.enum(PUBLISH_LINK_STATUSES)`.
- `PublishLink.expires_at`: ISO datetime string or `null`.
- `PublishLink.revoked_at`: ISO datetime string or `null`.
- `PublishLink.password_protected`: boolean.
- `PublishLink.public_url`: string, preserving existing `/p/:slug` for guides and `/d/:slug` for demos.
- `PublishedArtifact.snapshot` is present only on `PublicPublishedArtifactSchema` and remains `z.unknown()` at the generic public response level.
- Published guide snapshot schema must include `artifact_type: "guide"`, `guide`, and ordered `blocks`.
- Published interactive demo snapshot schema must include `artifact_type: "interactive_demo"`, `schema_version: 1`, `interactive_demo`, and ordered `scenes`.
- Published snapshot asset file URLs must remain `/api/v1/public/publish-links/:slug/assets/:capture_asset_id/file`.
- `UpdatePublishAccessRequestSchema` must accept `{ visibility, expires_at }`, require valid visibility, and allow `expires_at` as string or `null`. Invalid date-string semantics may remain in domain/server policy if needed to preserve existing behavior.
- `UpdatePublishPasswordRequestSchema` must accept `{ password: string | null }`.
- `CreatePublicViewerSessionRequestSchema` must accept `{ password: string }`.

Backwards-compatible web exports:

- `apps/web/src/features/guide/types.ts` may temporarily re-export publish types under old guide names so existing imports can be migrated incrementally in this phase.
- By the end of this phase, `apps/web/src/features/interactive-demo/**` should not import guide-named publish types from `../guide/types`.
- `apps/web/src/features/guide/types.ts` should no longer define local publish response/snapshot types manually; it should import/re-export from `@repo/types/publish`.
- `apps/web/src/features/interactive-demo/types.ts` should no longer define local `PublishedInteractiveDemoSnapshot*` types manually; it should import/re-export from `@repo/types/publish`.

## Domain Package Plan

Create `@repo/publish-domain` following the same package style as `@repo/guide-domain` and `@repo/demo-domain`.

Package files:

```text
packages/publish-domain/package.json
packages/publish-domain/tsconfig.json
packages/publish-domain/src/index.ts
```

`package.json` must:

- use package name `@repo/publish-domain`;
- set `"type": "module"`;
- export `"."` and `"./*"`;
- include `lint`, `test`, `build`, `check-types`, `dev`, and `clean` scripts matching the existing domain packages;
- depend on `@repo/constants` and `@repo/types`;
- use the same dev dependencies as `@repo/guide-domain` and `@repo/demo-domain`.

Domain exports should include:

```text
packages/publish-domain/src/errors/publish-domain-error.ts
packages/publish-domain/src/types/publish-domain.ts
packages/publish-domain/src/policies/publish-access-policy.ts
packages/publish-domain/src/policies/publish-link-policy.ts
packages/publish-domain/src/policies/publish-password-policy.ts
packages/publish-domain/src/policies/publish-snapshot-policy.ts
```

The publish domain may depend on shared guide/demo route types from `@repo/types`, but it must not import from `apps/server`, `apps/web`, or React.

## Domain Types

Add domain source/input types needed by pure snapshot policies. Keep these adapter-shaped but app-independent.

Required type groups in `packages/publish-domain/src/types/publish-domain.ts`:

- `PublishTargetType = PublishArtifactType`
- `PublishAuthScope` with `organization_id`, `project_id`, and `actor_org_user_id` if needed by helper signatures.
- `PublishClock` or simple `now: Date` inputs for time-sensitive policies.
- `PublishSlugCandidate` or `select_publish_slug` input type for existing-link/new-link behavior.
- `GuidePublishSourceDetail` matching only the fields needed by snapshot construction from current `GuideDetail`.
- `InteractiveDemoPublishSourceDetail` matching only the fields needed by snapshot construction from current `InteractiveDemoPublishDetail`.
- `PublishViewerSessionRecord` with `publish_link_id`, `expires_at`, and `revoked_at`.

Do not move the server repository interface wholesale into the domain package. The server service remains the orchestration adapter and can pass repository results into pure domain functions.
Do not add crypto-shaped domain types such as password hash/salt result types unless a later plan explicitly creates a crypto adapter boundary.

## Domain Error Plan

Add a base `PublishDomainError` and specific errors that mirror current server error classes where the error is caused by domain policy:

- `InvalidPublishAccessSettingsError`
- `InvalidPublishPasswordSettingsError`
- `PublishLinkNotPublicError`
- `PublishLinkExpiredError`
- `PublishLinkPasswordRequiredError`
- `InvalidPublicViewerPasswordError`
- `GuideNotPublishableError`
- `GuideHasNoPublishableBlocksError`
- `InteractiveDemoHasNoPublishableScenesError`

Keep these server-owned or server compatibility re-exported as needed:

- `ProjectNotFoundError`
- `GuideNotFoundError`
- `InteractiveDemoNotFoundError`
- `PublishLinkNotFoundError`
- `PublishSlugConflictError`
- `PublishedAssetNotFoundError`
- `UnsupportedPublishedAssetStorageProviderError`

Server routes must keep the same HTTP statuses and `error.type` strings:

- `project_not_found`: 404
- `guide_not_found`: 404
- `interactive_demo_not_found`: 404
- `guide_not_publishable`: 409
- `guide_has_no_publishable_blocks`: 400
- `interactive_demo_has_no_publishable_scenes`: 400
- `invalid_publish_access_settings`: 400
- `invalid_publish_password_settings`: 400
- `publish_link_not_found`: 404
- `publish_link_not_public`: 403
- `publish_link_expired`: 410
- `publish_link_password_required`: 401
- `invalid_public_viewer_password`: 400
- `published_asset_not_found`: 404
- `unsupported_published_asset_storage_provider`: 501

## Domain Policy Details

### Snapshot Policy

Move pure snapshot construction from `apps/server/src/modules/publish/publish.service.ts` into `packages/publish-domain/src/policies/publish-snapshot-policy.ts`.

Required functions:

- `build_published_guide_snapshot(input)`
- `build_published_interactive_demo_snapshot(input)`
- shared asset helpers if useful

Guide snapshot behavior to preserve:

- Sort guide blocks by ascending `block_index`.
- Include `artifact_type: "guide"`.
- Include guide `id`, `title`, `description`, `source_capture_session_id`, `published_version`, and `published_at`.
- For each block, include `id`, `block_type`, `block_index`, `content`, `step`, and `source_asset`.
- `step` includes `id`, `title`, and `body`, or `null`.
- `source_asset` is selected from `display_capture_asset_id`, not directly from selected/draft-only fields.
- Missing source asset produces `source_asset: null`.
- Asset file URL remains `/api/v1/public/publish-links/${slug}/assets/${asset.id}/file`.
- Empty guide blocks are rejected before snapshot creation with `GuideHasNoPublishableBlocksError`.
- Non-draft guides are rejected before snapshot creation with `GuideNotPublishableError`.

Interactive Demo snapshot behavior to preserve:

- Sort scenes by ascending `scene_index`.
- Include `artifact_type: "interactive_demo"`.
- Include `schema_version: 1`.
- Include interactive demo `id`, `title`, `description`, `source_capture_session_id`, `published_version`, and `published_at`.
- Include only scenes that resolve to a background capture asset.
- Sort hotspots by ascending `hotspot_index` within each scene.
- Include hotspot `id`, `hotspot_type`, `label`, `content`, `x`, `y`, `width`, `height`, `target_scene_id`, and `hotspot_index`.
- Preserve current stale-target behavior: if a hotspot `target_scene_id` does not exist in the published scene set, publish it as `null`.
- If no publishable scenes remain after missing-background filtering, throw `InteractiveDemoHasNoPublishableScenesError`.
- Asset file URL remains `/api/v1/public/publish-links/${slug}/assets/${asset.id}/file`.

Do not introduce a standalone transition entity, transition table, transition route, or transition response shape.

### Publish Link Policy

Move pure link lifecycle calculations into `packages/publish-domain/src/policies/publish-link-policy.ts`.

Required behavior:

- Existing active publish link keeps its existing slug and is retargeted to the new Published Artifact.
- New publish link uses the generated slug supplied by the server adapter.
- Slug retry remains capped at 5 attempts when the repository adapter reports a slug conflict.
- The server service still owns the transaction loop, `PublishSlugConflictError`, and retry orchestration; the domain package may expose only the retry limit or a pure `should_retry_slug_conflict` helper that does not import persistence errors.
- `public_url` shape remains repository/server mapping behavior:
  - Guide: `/p/:slug`
  - Interactive Demo: `/d/:slug`
- Revoking a link requires an existing active link.
- Revoking a link must revoke public viewer sessions for that publish link.

Do not move SQL uniqueness detection into the domain package. The repository adapter still converts database unique-constraint errors into `PublishSlugConflictError`.

### Access Policy

Move public access checks into `packages/publish-domain/src/policies/publish-access-policy.ts`.

Required functions:

- `validate_publish_access_input(input)`
- `assert_public_publish_link_access(input)`
- `assert_public_viewer_session_access(input)`
- `should_touch_public_viewer_session(input)` if useful

Rules to preserve:

- `visibility !== "public"` throws `PublishLinkNotPublicError`.
- `expires_at` at or before current time throws `PublishLinkExpiredError`.
- Non-password-protected links do not require a viewer session.
- Password-protected links without a viewer token throw `PublishLinkPasswordRequiredError`.
- Missing, revoked, or expired viewer sessions throw `PublishLinkPasswordRequiredError`.
- Valid viewer sessions are touched by the server repository after domain approval.
- `visibility` must be one of `PUBLISH_VISIBILITIES`.
- `expires_at` must be `null` or a date string that JavaScript `Date` can parse to a finite time, preserving current semantics.

### Password Policy

Move password input validation and password-check decision rules into `packages/publish-domain/src/policies/publish-password-policy.ts`.

Required functions:

- `validate_publish_password_input(password)`
- `validate_public_viewer_password_input(password)`
- `public_viewer_session_expires_at(input)`
- `assert_public_viewer_password_result(input)`

Rules to preserve:

- Clearing publish password uses `password: null`.
- Setting publish password requires a string whose trimmed length is at least 8 and raw length is at most 128.
- Invalid publish password settings throw `InvalidPublishPasswordSettingsError`.
- Public viewer unlock request requires a string password.
- Invalid unlock request body throws `InvalidPublicViewerPasswordError`.
- Wrong password verification result throws `InvalidPublicViewerPasswordError`.
- Setting or clearing a publish password revokes existing public viewer sessions for the link.
- Public viewer sessions expire 12 hours after creation.

Keep scrypt hashing, salt generation, timing-safe comparison, and token generation in the server adapter unless there is a clear testable reason to inject them through domain function parameters.
Keep viewer token hashing in the server adapter as well; the domain should validate session record state after the server has found a session by token hash.

## Server Implementation Plan

Update `apps/server/package.json`:

- Add `@repo/publish-domain: "workspace:*"`.

Update `apps/server/src/modules/publish/publish.service.ts`:

- Import publish policy functions and policy errors from `@repo/publish-domain`.
- Import publish contracts from `@repo/types/publish` where they replace server-local shared shapes.
- Keep compatibility re-exports for types/errors consumed by `publish.routes.ts`, `publish.repository.ts`, and tests if needed.
- Replace local `build_snapshot` and `build_interactive_demo_snapshot` with domain snapshot functions.
- Replace local access/password validators with domain policy functions.
- Keep repository orchestration, transactions, storage reads, password hash creation/checking, token generation, viewer cookie handling, and HTTP mapping outside the domain package.
- Keep `ensure_project_exists` server-owned.
- Keep route-level auth and auth context construction server-owned.
- Keep not-found checks for project/guide/demo/link/asset server-owned.
- Keep `find_public_asset_file` and storage-provider checks server-owned, but reuse domain access checks before reading storage.

Update `apps/server/src/modules/publish/publish.routes.ts`:

- Prefer shared schemas from `@repo/types/publish` for parsing `PATCH /publish/access`, `PATCH /publish/password`, and `POST /viewer-sessions` bodies if they can preserve current error behavior.
- If using shared schemas would alter error details or timing, keep route-local parse helpers and document why in this plan during implementation.
- Do not change route URLs, route methods, response status codes, response envelopes, cookie names, cookie attributes, or error strings.

Update `apps/server/src/modules/publish/publish.repository.ts`:

- Import `PublishLink`, `PublishedArtifact`, `PublishStatusResponse`, `PublicPublishLinkResponse`, and snapshot types from `@repo/types/publish` where possible.
- Keep SQL, row types, row mapping, `public_url_for_slug`, transaction implementation, and DB constraint handling server-owned.
- Keep `snapshot_json` persistence as JSON and do not add migrations.

Server tests must remain focused on adapter behavior after pure policy tests move into `@repo/publish-domain`.

## Web Implementation Plan

Update `apps/web/src/features/guide/types.ts`:

- Remove local definitions of generic publish types and guide snapshot types once equivalent exports exist in `@repo/types/publish`.
- Re-export publish types from `@repo/types/publish`.
- Keep guide feature-specific capture/editor types in this file.
- Preserve old aliases temporarily if needed:
  - `GuidePublishVisibility`
  - `GuidePublishStatusResponse`
  - `GuidePublishResult`
  - `GuideRevokePublishResult`

Update `apps/web/src/features/interactive-demo/types.ts`:

- Remove local `PublishedInteractiveDemoSnapshotAsset`, `PublishedInteractiveDemoSnapshotHotspot`, `PublishedInteractiveDemoSnapshotScene`, and `PublishedInteractiveDemoSnapshot`.
- Import/re-export them from `@repo/types/publish`.
- Do not add a web dependency on `@repo/publish-domain`.

Update `apps/web/src/lib/api.ts`:

- Use shared publish request/response types from `@repo/types/publish` or the feature barrels that re-export them.
- Rename interactive demo publish API return types away from guide-named types:
  - `getInteractiveDemoPublishStatus` returns `InteractiveDemoPublishStatusResponse`.
  - `publishInteractiveDemo` returns `InteractiveDemoPublishResult`.
  - `updateInteractiveDemoPublishAccess` accepts `UpdatePublishAccessInput` and returns `InteractiveDemoPublishStatusResponse`.
  - `updateInteractiveDemoPublishPassword` accepts `UpdatePublishPasswordInput` and returns `InteractiveDemoPublishStatusResponse`.
  - `revokeInteractiveDemoPublishLink` returns `RevokePublishResult`.
- Do not change fetch paths or request bodies.

Update guide and interactive demo UI files only for type import changes:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx
```

Rules:

- No JSX layout changes.
- No CSS changes.
- No visible copy changes.
- No button labels, form labels, placeholders, or public viewer text changes.
- No route/navigation/fetch path changes.
- No behavior changes in password prompt, publish access forms, revoke flow, embed URLs, or public asset rendering.

## Routes And API Contracts

All route URLs and status codes must remain unchanged.

Authenticated routes require the existing web session cookie and `auth_service.get_current_auth_context`. Public routes do not require web auth.

### Publish Guide

`POST /api/v1/projects/:project_id/guides/:guide_id/publish`

- Auth: required.
- Body: none.
- Success: `201`, `PublishResult`.
- Errors unchanged:
  - 401 `unauthenticated`
  - 404 `project_not_found`
  - 404 `guide_not_found`
  - 409 `guide_not_publishable`
  - 400 `guide_has_no_publishable_blocks`

### Guide Publish Status

`GET /api/v1/projects/:project_id/guides/:guide_id/publish`

- Auth: required.
- Success: `200`, `PublishStatusResponse`.
- If no active link exists, response remains `{ publish_link: null, published_artifact: null }`.

### Revoke Guide Publish Link

`DELETE /api/v1/projects/:project_id/guides/:guide_id/publish`

- Auth: required.
- Success: `200`, `RevokePublishResult`.
- Must revoke public viewer sessions for the link.

### Guide Publish Access

`PATCH /api/v1/projects/:project_id/guides/:guide_id/publish/access`

- Auth: required.
- Body: `UpdatePublishAccessInput`.
- Success: `200`, `PublishStatusResponse`.
- Invalid body must still return 400 `invalid_publish_access_settings`.

### Guide Publish Password

`PATCH /api/v1/projects/:project_id/guides/:guide_id/publish/password`

- Auth: required.
- Body: `UpdatePublishPasswordInput`.
- Success: `200`, `PublishStatusResponse`.
- Setting/clearing password must revoke viewer sessions.
- Invalid body or password length must still return 400 `invalid_publish_password_settings`.

### Interactive Demo Publish Routes

The following routes mirror guide publish behavior with `artifact_type: "interactive_demo"` and interactive demo IDs:

```text
POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/access
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/password
```

Additional errors unchanged:

- 404 `interactive_demo_not_found`
- 400 `interactive_demo_has_no_publishable_scenes`

### Public Publish Link Resolve

`GET /api/v1/public/publish-links/:slug`

- Auth: public.
- Viewer token: existing public viewer cookie, if present.
- Success: `200`, `PublicPublishLinkResponse`.
- Response must omit password hash, salt, publish link ID, and internal viewer session fields.
- Restricted link returns 403 `publish_link_not_public`.
- Expired link returns 410 `publish_link_expired`.
- Password-protected link without a valid viewer session returns 401 `publish_link_password_required`.

### Public Viewer Session

`POST /api/v1/public/publish-links/:slug/viewer-sessions`

- Auth: public.
- Body: `CreatePublicViewerSessionInput`.
- Success: `204`, no JSON body.
- If the link is not password-protected, current behavior returns 204 and may not set a useful token.
- If password is valid, set existing `demo_composer_public_viewer` cookie with existing options:
  - `httpOnly: true`
  - `sameSite: "lax"`
  - `path: "/"`
  - `expires` set to session expiry.
- Invalid password returns 400 `invalid_public_viewer_password`.

### Public Published Asset File

`GET /api/v1/public/publish-links/:slug/assets/:capture_asset_id/file`

- Auth: public.
- Viewer token: existing public viewer cookie, if present.
- Success: `200`, streamed file.
- Must run the same public access and viewer-session checks before reading storage.
- Missing link or asset returns 404 `published_asset_not_found` for asset route behavior.
- Unsupported storage provider returns 501 `unsupported_published_asset_storage_provider`.

## Security And Permission Rules

Preserve all existing security boundaries:

- Authenticated publish management routes require a valid web session.
- Publish management remains scoped by authenticated organization ID.
- Project existence is checked within the authenticated organization.
- Guide and Interactive Demo publish/status/update/revoke actions are scoped to project and organization.
- Public routes never expose organization IDs, actor IDs, password hash, password salt, viewer token hash, or internal publish link ID.
- Public routes read only immutable `published_artifact.snapshot_json`, never draft guide/demo rows.
- Password-protected links require a valid non-revoked, non-expired viewer session for public resolve and asset reads.
- Viewer sessions must be revoked when a publish link is revoked or password settings change.
- Password hash/salt generation and verification remain server-side and must use timing-safe comparison.
- Public viewer cookie stays `httpOnly` and `sameSite: "lax"`.
- Public asset access remains tied to a publish link and capture asset inside the published snapshot flow.

No new roles, permissions, access modes, public signup behavior, custom domains, analytics, or lead capture are part of this phase.

## Migration And Backwards Compatibility

No database migration is expected.

Compatibility requirements:

- Existing rows in `publish_link`, `published_artifact`, and public viewer session tables must continue working.
- Existing published snapshot JSON must remain parseable by the web public readers.
- New snapshot JSON must keep the same shape as before this phase.
- Existing slugs and public URLs must continue resolving.
- Existing active links must keep their slug when republished.
- Existing password-protected links must keep working with existing password hash/salt records.
- Existing public viewer sessions must keep working until expiry/revocation.
- Existing route response envelopes must remain stable.
- Existing error status codes and `error.type` strings must remain stable.
- Web fetch paths and component behavior must remain stable.

Do not change migration SQL, database constraints, table names, column names, enum values, or row mapping unless implementation discovers a documented blocker and stops for a plan update.

## Implementation Sequence

1. Add shared publish contracts.
   - Create `packages/types/src/publish.ts`.
   - Add schema/type tests in `packages/types/src/publish.test.ts`.
   - Export from `packages/types/src/index.ts`.
   - Keep public snapshot schemas compatible with current guide/demo public viewer fixtures.

2. Add `@repo/publish-domain`.
   - Create package files matching existing domain package conventions.
   - Add error, type, access, link, password, and snapshot policy modules.
   - Add focused tests for every moved rule.

3. Wire server service to domain policies.
   - Add `@repo/publish-domain` to `apps/server/package.json`.
   - Replace local pure helpers in `publish.service.ts` with domain policy calls.
   - Keep repository, transaction, auth, storage, cookie, hash, and route mapping server-owned.
   - Preserve compatibility exports where server routes/repository/tests still import from `publish.service.ts`.

4. Wire route request contracts where safe.
   - Use `@repo/types/publish` request schemas for access/password/viewer-session body parsing if existing behavior is preserved.
   - Keep route-local wrappers if needed to preserve the exact error classes.

5. Wire web shared types.
   - Replace local publish and public snapshot type definitions with `@repo/types/publish`.
   - Remove guide-named publish types from interactive demo imports.
   - Keep public viewer parsing logic and rendered behavior unchanged.

6. Update docs only after verification.
   - Update this plan with status, checklist, implementation log, verification notes, and leftovers.
   - Update master plan `095` status and completed acceptance details only.

## Test And Verification Plan

Shared type tests:

```text
rtk pnpm --filter @repo/types test -- publish
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter @repo/types lint
rtk pnpm --filter @repo/types build
```

Required `@repo/types/publish` test cases:

- Parses guide publish status/result response.
- Parses interactive demo publish status/result response.
- Parses public publish link response with unknown snapshot.
- Parses published guide snapshot.
- Parses published interactive demo snapshot.
- Rejects invalid publish visibility/status/artifact type.
- Parses valid access/password/viewer-session request bodies.
- Rejects malformed request bodies according to current route behavior.

Domain tests:

```text
rtk pnpm --filter @repo/publish-domain test
rtk pnpm --filter @repo/publish-domain check-types
rtk pnpm --filter @repo/publish-domain lint
rtk pnpm --filter @repo/publish-domain build
```

Required domain test cases:

- Builds guide snapshots in block order.
- Preserves guide screenshot annotations/content/steps/source assets/file URLs.
- Rejects non-draft guide publishing.
- Rejects guide publishing with no blocks.
- Builds interactive demo snapshots in scene order.
- Drops scenes without background assets and rejects if none remain.
- Sorts hotspots by `hotspot_index`.
- Nulls stale hotspot `target_scene_id`.
- Preserves `schema_version: 1`.
- Validates access visibility and expiry.
- Rejects restricted public link access.
- Rejects expired public link access.
- Allows non-password-protected access without session.
- Requires viewer session for password-protected links.
- Rejects missing/revoked/expired viewer sessions.
- Validates password set/clear rules.
- Produces 12-hour viewer session expiry.
- Preserves publish-link slug reuse and retry decision behavior.

Server tests:

```text
rtk pnpm --filter server test -- publish.service
rtk pnpm --filter server test -- publish.routes
rtk pnpm --filter server test -- public-link-password
rtk pnpm --filter server test -- publish.app
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
```

Required server assertions:

- Guide publish response unchanged.
- Interactive demo publish response unchanged.
- Republish retargets existing active link and preserves slug.
- Slug conflict retry still attempts up to 5 times.
- Revoke still revokes viewer sessions.
- Access update rejects malformed body and invalid dates with same error type/status.
- Password update validates length and revokes sessions.
- Public resolve enforces restricted/expired/password-protected access.
- Viewer-session route sets the existing cookie and returns 204.
- Asset file route checks public/viewer access before reading file storage.
- Error mapping remains identical.

Web tests:

```text
rtk pnpm --filter web check-types
rtk pnpm --filter web test -- GuideEditorPage PublicGuideReaderPage
rtk pnpm --filter web test -- InteractiveDemoEditorPage PublicInteractiveDemoViewerPage
rtk pnpm --filter web test -- api
```

Repo-level verification:

```text
rtk pnpm check-types
rtk git diff --check
```

Conditional DB verification:

Run this only if SQL, row mapping, migrations, transaction behavior, or persisted snapshot JSON changes:

```text
rtk pnpm --filter server test:db
```

Expected decision for this plan: DB verification should not be required because no migration, SQL, transaction, or row mapping change is planned. If implementation touches any of those, document why and run DB verification.

Conditional smoke verification:

Run this only if publish workflow orchestration changes beyond pure policy extraction:

```text
rtk pnpm --filter server test:smoke
```

Before running `test:smoke`, document test database setup/reset requirements.

## Agent-Browser Validation Requirements

This phase should not change browser-visible UI. Agent-browser validation is required only if implementation touches JSX behavior beyond type-only imports, changes rendered copy, changes route/fetch paths, changes publish form behavior, changes public viewer parsing behavior, or changes CSS.

If required, validate at minimum:

- Guide editor publish panel still loads status, publishes, updates visibility/expiry, updates password, revokes, and shows the same visible states.
- Interactive Demo editor publish panel still loads status, publishes, updates visibility/expiry, updates password, revokes, and shows the same visible states.
- Public guide reader opens a public link, loads snapshot assets, prompts for password when required, and reloads after unlock.
- Public interactive demo viewer opens a public link, renders scenes/assets/hotspots, prompts for password when required, and reloads after unlock.
- Embed mode still renders for both guide and interactive demo public viewers.

If implementation is type-only for web and focused tests pass, record that browser validation was not required because JSX, CSS, rendered copy, routes, fetch paths, and browser-visible behavior were unchanged.

## Explicit Non-Scope

Do not do any of the following in this phase:

- Change public viewer UI, editor publish UI, rendered copy, CSS, or layout.
- Change public route URLs or public URL shapes.
- Change publish link slug format or length.
- Change cookie name or cookie options.
- Change password hashing algorithm, salt format, or timing-safe verification.
- Change database schema, migrations, constraints, or table names.
- Add custom domains.
- Add analytics, lead capture, or public viewer tracking beyond existing session touch behavior.
- Add new access modes.
- Add draft/live public links that bypass immutable snapshots.
- Add publish support for new artifact types.
- Move guide or demo editing behavior.
- Move repository SQL into domain packages.
- Add a web dependency on `@repo/publish-domain`.
- Add standalone demo transition entities, tables, routes, or response shapes.

## Handoff Notes

- Start with `@repo/types/publish` tests so shared contracts encode the current API before server/web code changes.
- Keep commits small:
  - shared publish contracts/tests;
  - publish-domain package/policies/tests;
  - server service/route wiring/tests;
  - web type wiring/tests;
  - docs/status updates.
- Preserve server compatibility exports from `publish.service.ts` until all local imports are safely migrated.
- Keep password hashing and cookie behavior server-owned unless a later plan explicitly creates crypto/session adapters.
- If shared Zod schemas reject something the current route accepts, either keep route-local parsing or document a deliberate compatibility decision before coding further.
- If snapshot fixtures need updates, update them to the real existing response shape, not a new desired shape.
- If implementation discovers an existing security bug, document the bug and stop before changing behavior unless the change is clearly required to preserve the current advertised security boundary.

## Final Output Required When Implemented

When executing this plan, report:

- Files changed by package/app area.
- Shared publish schemas/types added to `@repo/types/publish`.
- Publish rules moved into `@repo/publish-domain`.
- Server adapter behavior preserved.
- Web type wiring changes and whether guide-named publish compatibility types remain.
- Route/API compatibility confirmation.
- Security and permission behavior confirmation.
- Migration/DB verification decision and rationale.
- Agent-browser validation decision and rationale.
- Verification commands run with pass/fail results.
- Leftovers for `096-server-adapter-thinning.md`.
