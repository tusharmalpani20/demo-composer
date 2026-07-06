# Guide Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Implementation-ready. Do not implement until explicitly requested.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `093` of the shared contracts and domainization track.

## Objective

Create `@repo/guide-domain` and move pure Guide, Guide Block, Guide Step, Guide Annotation, and guide export rendering rules out of `apps/server` while preserving every existing route, payload, auth, storage, database, web, public reader, and editor behavior.

Guides remain Scribe-style document artifacts derived from capture source material or created/edited directly by users. Capture remains source material only. Creating, completing, or mutating capture records must not automatically create or mutate guides.

This phase should extract reusable guide domain policies and pure rendering decisions. The server remains the application adapter that owns Fastify routes, auth/session context, SQL repositories, transactions, file storage, multipart parsing, cookies, response headers, and error-to-HTTP mapping.

## Baseline From Completed 092

Plan `092` completed and post-implementation audited `@repo/capture-domain`.

Rules carried into this phase:

- Capture remains source material only.
- Guide and interactive-demo generation must continue to happen through explicit existing user actions, not capture completion.
- Keep `@repo/guide-domain` free of capture storage adapters, auth/session internals, Fastify request/reply objects, SQL clients, transactions, file streams, and server file-storage adapters.
- Reuse capture constants/types where helpful, but do not make guide-domain mutate Capture Session, Capture Event, Capture Asset, or File records.
- Preserve capture source immutability when guides select, hide, replace, or annotate screenshots.
- Existing route `instanceof` error mapping must stay stable after domain errors move or are re-exported.

Existing shared contracts after `092`:

- `@repo/constants` already exports guide status, guide block type, creatable guide block type, guide block placement, and guide annotation type constants.
- `@repo/constants` already exports capture event, capture source, capture session status, capture asset type, file provider, project, organization, setup, and publish constants used by related domains.
- `@repo/types/capture` owns shared capture route and DTO schemas.
- `@repo/types` does not yet contain guide schemas.
- `apps/web/src/features/guide/types.ts` still owns duplicated guide DTOs and publish-related guide types.
- `apps/server/src/modules/guide/guide.service.ts` still owns guide DTOs, repository interface, domain errors, normalization, generation, markdown export, HTML export orchestration, and service workflows.

## Current Codebase Baseline

Relevant shared package files:

```text
packages/constants/src/guide.ts
packages/constants/src/constants.test.ts
packages/constants/src/index.ts
packages/types/src/index.ts
packages/types/src/common.ts
packages/types/src/capture.ts
packages/capture-domain/src/**/*
packages/file-domain/src/**/*
```

Relevant server files:

```text
apps/server/package.json
apps/server/src/app.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/guide/guide.service.test.ts
apps/server/src/modules/guide/guide.repository.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
apps/server/src/modules/guide/guide.app.integration.test.ts
apps/server/src/modules/guide/guide-html-export.ts
apps/server/src/modules/guide/guide-html-export.test.ts
apps/server/src/modules/guide/guide-zip-export.ts
apps/server/src/modules/guide/guide-zip-export.test.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/file-storage/local-file-storage.provider.ts
```

Relevant web files:

```text
apps/web/package.json
apps/web/src/lib/api.ts
apps/web/src/features/guide/types.ts
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/GuidePreviewPage.test.tsx
apps/web/src/features/guide/GuideScreenshotViewer.tsx
apps/web/src/features/guide/GuideScreenshotViewer.test.tsx
apps/web/src/features/guide/ProjectGuideListPage.tsx
apps/web/src/features/guide/ProjectGuideListPage.test.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.test.tsx
apps/web/src/features/guide/publishLinks.ts
apps/web/src/features/guide/publishLinks.test.ts
```

Relevant migrations:

```text
apps/server/src/db/migrations/005_guide_foundation_schema.sql
apps/server/src/db/migrations/007_guide_block_content.sql
apps/server/src/db/migrations/008_guide_block_screenshot_selection.sql
```

Relevant docs and ADRs:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/092-capture-domain-extraction.md
```

## Existing Route And API Contracts To Preserve

Do not change route URLs, methods, status codes, response envelopes, error `type` strings, cookie auth behavior, or multipart field names.

Guide routes currently registered under the project API prefix include:

```text
POST   /:project_id/guides/from-capture-session/:capture_session_id
GET    /:project_id/guides
GET    /:project_id/guides/:guide_id
GET    /:project_id/guides/:guide_id/export/markdown
GET    /:project_id/guides/:guide_id/export/html.zip
PATCH  /:project_id/guides/:guide_id
PATCH  /:project_id/guides/:guide_id/steps/:guide_step_id
PATCH  /:project_id/guides/:guide_id/blocks/reorder
POST   /:project_id/guides/:guide_id/blocks
PATCH  /:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot
PATCH  /:project_id/guides/:guide_id/blocks/:guide_block_id/annotations
POST   /:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload
PATCH  /:project_id/guides/:guide_id/blocks/:guide_block_id
DELETE /:project_id/guides/:guide_id/blocks/:guide_block_id
```

Request body shapes to preserve:

- Create guide from capture:
  - `title: string`
  - `description?: string | null`
  - `selected_capture_event_ids?: string[]`
  - extra keys are currently ignored by route pickers after route validation allows passthrough.
- Update guide:
  - `title?: string`
  - `description?: string | null`
  - `status?: "archived"`
  - client-managed or unknown fields are ignored by route pickers.
- Update guide step:
  - `title?: string`
  - `body?: string | null`
- Reorder guide blocks:
  - `block_ids: string[]`
- Create guide block:
  - `block_type: "step" | "header" | "paragraph" | "tip" | "alert" | "divider"`
  - `position?: { placement: "before" | "after"; guide_block_id: string } | null`
  - `step?: { title?: string; body?: string | null } | null`
  - `content?: { title?: string | null; body?: string | null; annotations?: GuideScreenshotAnnotation[] | null } | null`
- Update guide block:
  - `content?: GuideBlockContent | null`
- Update guide block screenshot:
  - `capture_asset_id: string | null`
- Update guide block annotations:
  - `annotations: Array<{ id?: string; type: "highlight"; x: number; y: number; width: number; height: number }>`
  - max 10 annotations.
- Upload guide block screenshot:
  - multipart field `file` is required.
  - optional fields remain server-parsed as `width`, `height`, `device_pixel_ratio`, `page_url`, `page_title`, `captured_at`, and `metadata`.

Response shapes to preserve:

- Create guide from capture returns `GuideDetail` directly with status `201`.
- List guides returns `{ guides: Guide[] }`.
- Get guide detail returns `GuideDetail` directly.
- Markdown export returns `{ filename: string; markdown: string }`.
- HTML ZIP export returns a binary stream with:
  - `content-type: application/zip`
  - `content-length`
  - `content-disposition: attachment; filename="..."`
- Update guide returns `{ guide: Guide }`.
- Update guide step returns `{ guide_step: GuideStep }`.
- Reorder/create guide blocks return `{ guide_blocks: GuideBlock[] }`.
- Update screenshot/update annotations/update block return `{ guide_block: GuideBlock }`.
- Upload guide block screenshot returns `{ guide_block: GuideBlock; capture_asset: CaptureAssetWithFileUrl }`.
- Delete guide block returns `204`.

Stable error mapping to preserve:

```text
unauthenticated -> 401 unauthenticated
ProjectNotFoundError -> 404 project_not_found
CaptureSessionNotFoundError -> 404 capture_session_not_found
CaptureEventNotFoundError -> 404 capture_event_not_found
GuideNotFoundError -> 404 guide_not_found
GuideStepNotFoundError -> 404 guide_step_not_found
GuideBlockNotFoundError -> 404 guide_block_not_found
GuideNotEditableError -> 409 guide_not_editable
InvalidGuideInputError -> 400 invalid_guide
InvalidGuideStepInputError -> 400 invalid_guide_step
InvalidGuideBlockOrderError -> 400 invalid_guide_block_order
InvalidGuideBlockContentError -> 400 invalid_guide_block_content
InvalidGuideBlockScreenshotError -> 400 invalid_guide_block_screenshot
GuideExportFileNotFoundError -> 404 guide_export_file_not_found
UnsupportedGuideExportStorageProviderError -> 501 unsupported_guide_export_storage_provider
```

Capture asset upload errors mapped by guide routes must remain server/capture-owned:

```text
InvalidCaptureAssetUploadError -> 400 invalid_capture_asset_upload
UnsupportedCaptureAssetUploadTypeError -> 400 unsupported_capture_asset_upload_type
UploadFileRequiredError -> 400 upload_file_required
UploadTooLargeError -> 413 upload_too_large
FileStorageWriteFailedError -> 500 file_storage_write_failed
FileStorageKeyConflictError -> 409 file_storage_key_conflict
```

## Schemas And Types

Create shared guide contracts only where they pass the reuse gate. Guide DTOs and JSON request/response contracts are used by server routes and web API/client code, so they should move to `@repo/types/guide`.

Add:

```text
packages/types/src/guide.ts
packages/types/src/guide.test.ts
```

Export from:

```text
packages/types/src/index.ts
```

Schemas/types to define in `@repo/types/guide`:

- `GuideProjectParamsSchema`
- `GuideFromCaptureSessionParamsSchema`
- `GuideDetailParamsSchema`
- `GuideStepParamsSchema`
- `GuideBlockParamsSchema`
- `GuideBlockContentSchema`
- `GuideScreenshotAnnotationSchema`
- `GuideSchema`
- `GuideStepSchema`
- `GuideBlockSchema`
- `GuideSourceCaptureAssetSchema`
- `GuideDetailSchema`
- `GuideMarkdownExportSchema`
- `CreateGuideFromCaptureRequestSchema`
- `UpdateGuideRequestSchema`
- `UpdateGuideStepRequestSchema`
- `ReorderGuideBlocksRequestSchema`
- `CreateGuideBlockRequestSchema`
- `UpdateGuideBlockRequestSchema`
- `UpdateGuideBlockScreenshotRequestSchema`
- `UpdateGuideBlockAnnotationsRequestSchema`
- `ProjectGuideListResponseSchema`
- `UpdateGuideResponseSchema`
- `UpdateGuideStepResponseSchema`
- `GuideBlocksResponseSchema`
- `GuideBlockResponseSchema`
- `UploadGuideBlockScreenshotResponseSchema`

Export inferred types with the same names currently used by server/web where possible:

- `GuideProjectParams`
- `GuideFromCaptureSessionParams`
- `GuideDetailParams`
- `GuideStepParams`
- `GuideBlockParams`
- `Guide`
- `GuideStatus`
- `GuideBlockType`
- `GuideCreatableBlockType`
- `GuideAnnotationType`
- `GuideBlockContent`
- `GuideScreenshotAnnotation`
- `GuideStep`
- `GuideBlock`
- `GuideSourceCaptureAsset`
- `GuideDetail`
- `GuideMarkdownExport`
- `CreateGuideFromCaptureInput`
- `UpdateGuideInput`
- `UpdateGuideStepInput`
- `CreateGuideBlockInput`
- `UpdateGuideBlockInput`
- `UpdateGuideBlockScreenshotInput`
- `UpdateGuideBlockAnnotationsInput`
- `ProjectGuideListResponse`
- `UploadGuideBlockScreenshotResponse`

Keep these out of `@repo/types/guide` in this phase unless needed to preserve compilation after imports:

- Publish snapshot/link/access/password types that belong to publish-domain or existing web publish feature code.
- Project screenshot picker response schemas for `/api/v1/projects/:project_id/capture-assets?asset_type=screenshot`; reuse `ProjectCaptureAssetListResponseSchema` and `ProjectCaptureAssetListResponse` from `@repo/types/capture` instead of duplicating them under guide.
- React component props.
- Server repository row types.
- Multipart upload input containing browser `File` values.
- Node stream export types for HTML ZIP responses.
- Database-only persistence types.

Schema behavior rules:

- Use `TrimmedIdParamSchema` or the existing shared common id schemas for route params.
- Use `z.enum(...)` from `@repo/constants` arrays for guide status, block type, creatable block type, placement, and annotation type.
- Reuse `CaptureAssetWithFileUrlSchema` from `@repo/types/capture` for the `capture_asset` part of `UploadGuideBlockScreenshotResponseSchema`.
- Preserve current route passthrough behavior where routes currently use `.passthrough()` and pick known fields.
- Preserve nullable versus optional semantics exactly.
- Do not reject unknown keys at the shared schema layer unless the existing route already rejects them.
- Keep JSON schemas separate from multipart parsing. Multipart parsing stays in `apps/server/src/modules/guide/guide.routes.ts`.
- Keep capture-asset picker list contracts in `@repo/types/capture`; guide-domain may consume the resulting DTOs but must not redefine the capture asset API contract.

## Domain Package Target

Create:

```text
packages/guide-domain/package.json
packages/guide-domain/tsconfig.json
packages/guide-domain/src/index.ts
packages/guide-domain/src/errors/guide-domain-error.ts
packages/guide-domain/src/policies/guide-generation-policy.ts
packages/guide-domain/src/policies/guide-update-policy.ts
packages/guide-domain/src/policies/guide-block-policy.ts
packages/guide-domain/src/policies/guide-export-policy.ts
packages/guide-domain/src/types/guide-domain.ts
packages/guide-domain/src/policies/*.test.ts
```

Keep the package thin but real. Do not create unused folders.

Package scripts should mirror existing domain packages:

```text
lint
test
build
check-types
dev
clean
```

Package dependencies:

- `@repo/constants`
- `@repo/types`

Do not add dependencies on:

- `fastify`
- `@fastify/*`
- `pg`
- `pg-promise`
- server modules
- React
- browser APIs
- `jszip`
- `sharp`
- file-storage providers

`ulid` may be added only if annotation ID generation stays in the domain package. Prefer making ID generation injectable so the domain package can stay deterministic in tests and avoid runtime ID-package dependency where practical.

## Domain Responsibilities

`@repo/guide-domain` should own:

- Guide input normalization.
- Guide editability decisions.
- Guide generation from capture source material.
- Deterministic non-AI step title/body generation.
- Guide block creation validation.
- Guide block update validation.
- Guide block reorder validation.
- Guide step update validation.
- Guide screenshot selection policy.
- Guide annotation validation and ID assignment policy.
- Markdown export rendering decisions.
- HTML export rendering decisions and image reference generation.
- Domain error classes for guide behavior.
- Pure command helpers that prepare repository inputs from already-loaded domain data.

`@repo/guide-domain` must not own:

- Capture source record mutation.
- Capture asset byte upload, file metadata writes, file streams, or storage keys.
- Fastify route registration.
- Auth/session cookies or server `AuthContext`.
- SQL queries, transactions, row mapping, or DB clients.
- Response headers and streaming.
- `JSZip` archive creation.
- Web editor layout, copy, CSS, or visible interaction changes.
- Publish snapshot creation, publish links, public access policy, or public viewer behavior.
- Interactive Demo scenes/hotspots/transitions.

## Behavior Rules To Preserve

Guide creation from capture:

- Project and capture session scope checks remain required before guide creation.
- Input title is trimmed and required after trimming.
- Title is capped at 180 characters.
- Description is trimmed and blank values become `null`.
- `selected_capture_event_ids` are trimmed, blank ids are dropped, duplicates are rejected.
- If `selected_capture_event_ids` is provided, every selected id must resolve in the scoped capture session or `CaptureEventNotFoundError` is thrown.
- Source events are used in persisted event order as returned by the repository.
- One guide block is generated per source event.
- Generated blocks are `block_type: "step"` and `block_index` starts at `1`.
- A source event's `capture_asset_id` becomes `source_capture_asset_id` only when it is in the active capture asset id set.
- Missing/inactive source assets produce `source_capture_asset_id: null`.
- Source capture records are never updated or deleted.
- AI suggestions remain deferred; generation stays deterministic.

Step title/body generation:

- `note` title uses the note text or `Review this note`.
- `click` title uses target label, target text, target role, or page title, falling back to `the highlighted element`.
- `input` title uses target label, target text, target role, or page title, falling back to `the field`.
- `navigation` title uses page title or page URL, falling back to `the page`.
- `capture` title uses page title or page URL as `Capture "..."`, falling back to `Capture this screen`.
- Generated titles are capped at 180 characters.
- `capture` body uses `Captured from {page_url}.` when page URL and page title exist.
- `capture` body uses `Captured from this page.` when only page URL exists.
- Non-capture generated bodies remain `null`.

Guide edit/update:

- Only draft guides are editable.
- Archived guides reject guide, step, block, screenshot, annotation, upload-preflight, reorder, and delete mutations with `GuideNotEditableError`.
- Guide update rejects empty effective updates.
- Guide title update trims, requires non-blank, and caps at 180 characters.
- Guide description trims and converts blank to `null`.
- Guide status update currently only accepts `archived`.
- Updating to the guide's existing status remains invalid.

Guide step update:

- Reject empty effective updates.
- Title trims, requires non-blank, and caps at 180 characters.
- Body trims and converts blank to `null`.
- Step must exist within the scoped guide.

Guide block reorder:

- Trim ids and drop blanks before validation.
- Reject empty lists and duplicate ids.
- Active guide blocks must be non-empty.
- Unknown block ids produce `GuideBlockNotFoundError`.
- Missing or partial active block id sets produce `InvalidGuideBlockOrderError`.
- Reorder must include every active block exactly once.

Guide block creation:

- Allowed creatable block types remain `step`, `header`, `paragraph`, `tip`, `alert`, and `divider`.
- `capture` and `gif` remain known block types but are not creatable in this phase.
- Position is optional.
- Position placement must be `before` or `after`.
- Position target block id is trimmed and required when position is provided.
- Position target must exist when provided.
- `step` blocks require a non-blank step title, cap it at 180 characters, and normalize body to `null` when blank.
- `header` content requires title and stores `{ title }`.
- `paragraph` content requires body, rejects title, and stores `{ body }`.
- `divider` content rejects title/body and stores `null`.
- `tip` and `alert` content require at least title or body and store normalized `{ title, body }`.

Guide block update:

- Only `header`, `paragraph`, `tip`, and `alert` content blocks are editable through the block content route.
- Updating `step`, `divider`, `capture`, or `gif` content through this route remains invalid.
- Existing block-specific content rules remain unchanged.

Screenshot selection and upload preflight:

- Screenshot selection is valid only for `step` blocks.
- `capture_asset_id: null` hides the screenshot with `selected_capture_asset_id: null` and `screenshot_hidden: true`.
- Non-null screenshot selection trims the id, stores it as `selected_capture_asset_id`, and sets `screenshot_hidden: false`.
- A selected non-null capture asset must be an active screenshot asset in the scoped organization/project.
- Upload preflight is valid only for editable `step` blocks.
- Upload preflight chooses `block.source_capture_session_id ?? guide.source_capture_session_id`, compacted.
- Missing source capture session rejects with `InvalidGuideBlockScreenshotError`.
- The chosen capture session must exist in the scoped project.
- Actual multipart parsing and upload bytes stay in server and capture-asset service.

Annotations:

- Annotations are valid only for `step` blocks with a visible display screenshot.
- Hidden screenshots or blocks without `display_capture_asset_id` reject annotation updates.
- Annotation array must be an array of at most 10 annotations.
- Only `type: "highlight"` is accepted.
- `x`, `y`, `width`, and `height` must be finite numbers.
- `x` and `y` must be `>= 0`.
- `width` and `height` must be `> 0`.
- `x + width` and `y + height` must be `<= 1`.
- Existing annotation ids may be reused only if present on the current block.
- Duplicate input annotation ids reject.
- Missing annotation ids get newly assigned ids.
- Existing annotation content on the block is preserved except for replacing the `annotations` array.

Markdown export:

- Export drafts and archived guides.
- Filename slug is based on lowercased guide title, non-alphanumeric runs become `-`, duplicate/edge dashes are removed, and fallback is `guide-{guide.id}.md`.
- Markdown normalizes CRLF/CR line endings to LF.
- Markdown escapes backslashes and square brackets as currently implemented.
- Relative asset URLs are joined to `public_base_url`, with default `http://localhost:3000`.
- Existing section order and unsupported block comments remain stable.
- Annotations render as `Highlights:` followed by percentage geometry lines.

HTML export rendering:

- HTML export rendering may move to guide-domain only as pure HTML/image-reference generation.
- ZIP archive creation and image stream reads stay server-owned.
- Image path generation, HTML escaping, annotation rendering, block ordering, and unsupported block comments must remain stable.
- Server still owns finding asset files, rejecting missing files, rejecting unsupported storage providers, reading file streams, and setting response headers.

## Security And Permission Rules

- All guide operations remain scoped by authenticated organization plus URL `project_id`.
- Guide mutations continue to use `actor_org_user_id` only for repository writes.
- The domain package may accept a minimal `GuideAuthContext` shape, but must not import server authentication/session services.
- The server must continue deriving guide auth context from the web session cookie.
- No guide-domain policy may trust client-provided organization id, project id, owner id, created_by id, updated_by id, version, timestamps, source ids, or block indexes unless those values came from server repository reads.
- Route pickers must continue stripping client-managed fields before calling domain/server services.
- Multipart uploads must continue validating preflight before writing bytes.
- If screenshot selection fails after an upload, the existing route behavior of not reporting success must remain stable. Do not add cleanup behavior in this phase unless already present.
- Do not expose raw storage keys, absolute local filesystem paths, or provider internals in shared guide DTOs.
- Public guide access rules are publish-domain concerns and must not be moved into guide-domain in this phase.

## Migration And Backwards Compatibility

- No database migration is expected.
- Do not change persisted enum/string values.
- Do not change table names, column names, indexes, foreign keys, or soft-delete behavior.
- Do not rewrite existing guide rows.
- Do not change public API URLs, status codes, body envelopes, or error `type` values.
- Do not change web route URLs or browser-visible guide editor/public reader behavior.
- Keep server service exports or compatibility re-exports where route tests and other modules currently import guide errors/types from `guide.service.ts`.
- If guide errors move to `@repo/guide-domain`, re-export them from `apps/server/src/modules/guide/guide.service.ts` during this phase so existing `instanceof` route mapping and tests remain stable.
- If DTOs move to `@repo/types/guide`, update server and web imports without changing runtime payloads.
- Keep publish-related types in their current location unless import cleanup requires narrow aliases. Full publish contract extraction belongs to `095`.

## Implementation Plan

1. Reconfirm baseline before coding.
   - Run `rtk git status --short`.
   - Reread this plan, the master plan, and completed `092`.
   - Inspect any uncommitted work and do not overwrite unrelated changes.
   - Re-run targeted searches for guide service-owned logic:
     - `rtk rg "normalize_|generate_|render_guide|GuideNotEditableError|InvalidGuide" apps/server/src/modules/guide`
     - `rtk rg "GuideBlock|GuideDetail|CreateGuideBlockInput|UpdateGuideBlock" apps/server/src apps/web/src packages`

2. Add shared guide JSON contracts.
   - Add `packages/types/src/guide.ts`.
   - Add `packages/types/src/guide.test.ts`.
   - Export guide schemas/types from `packages/types/src/index.ts`.
   - Use existing constants from `@repo/constants`.
   - Import common route param helpers from `@repo/types/common`.
   - Import `CaptureAssetWithFileUrlSchema` from `@repo/types/capture` for guide screenshot upload response composition.
   - Do not create duplicate guide-owned project screenshot picker schemas; keep `/capture-assets?asset_type=screenshot` contracts in `@repo/types/capture`.
   - Keep publish snapshot/link schemas out of this file unless required by compilation.
   - Verify with:
     - `rtk pnpm --filter @repo/types test -- guide`
     - `rtk pnpm --filter @repo/types check-types`

3. Create `@repo/guide-domain`.
   - Add package files and scripts.
   - Add a focused public export surface in `src/index.ts`.
   - Add typed guide domain errors.
   - Add domain-local types only for command/policy inputs that are not public API DTOs.
   - Avoid server, database, stream, Fastify, and React imports.

4. Move pure policy logic from `guide.service.ts`.
   - Move compact optional string behavior where needed.
   - Move title capping and deterministic step generation.
   - Move guide create input normalization and block generation from source events.
   - Move update guide/step input normalization.
   - Move block id reorder validation.
   - Move create/update block content normalization.
   - Move screenshot selection normalization.
   - Move annotation validation and ID assignment, using an injectable id factory if practical.
   - Add domain tests that mirror existing service tests for each moved behavior.

5. Move pure export rendering decisions.
   - Move markdown filename/rendering helpers to `@repo/guide-domain`.
   - Move pure HTML export rendering from `guide-html-export.ts` into `@repo/guide-domain` if it can be done without pulling server-only dependencies.
   - Keep ZIP archive creation in `apps/server/src/modules/guide/guide-zip-export.ts`.
   - Keep file lookup/stream handling in `apps/server/src/modules/guide/guide.service.ts`.
   - Preserve current markdown and HTML output snapshots/expectations.

6. Wire server guide service as an adapter.
   - Add `@repo/guide-domain` to `apps/server/package.json`.
   - Import guide contracts from `@repo/types/guide` where route/service types are public API shapes.
   - Import guide domain policies/errors from `@repo/guide-domain`.
   - Keep the concrete `GuideRepository` implementation and SQL in server.
   - Prefer keeping cross-repository orchestration in `apps/server/src/modules/guide/guide.service.ts` for this phase, calling guide-domain policy/command helpers for decisions and normalized repository inputs.
   - Move a repository interface to guide-domain only if a guide-domain command genuinely needs to call abstract persistence for equivalence; if that happens, keep it as a TypeScript interface only and leave every adapter implementation in server.
   - Keep SQL in `guide.repository.ts`.
   - Keep Fastify schemas/routes in `guide.routes.ts`, but replace route-local JSON schemas with shared `@repo/types/guide` schemas when they match current passthrough behavior.
   - Preserve route picker functions that strip client-managed fields.
   - Preserve route `instanceof` error mapping.
   - Preserve multipart upload parsing and capture asset service delegation.

7. Wire web type imports without UI changes.
   - Add or keep `@repo/types` dependency in `apps/web/package.json`.
   - Replace duplicated guide DTO/request/response types in `apps/web/src/features/guide/types.ts` with imports/re-exports from `@repo/types/guide` where the shared contract matches.
   - Replace or alias `ProjectScreenshotAssetListResponse` to `ProjectCaptureAssetListResponse` from `@repo/types/capture` because the screenshot picker uses the capture asset list API, not a guide API.
   - Leave publish-specific guide types in the web feature file for now unless they already exist in a publish shared package.
   - Do not change JSX, CSS modules, displayed copy, button labels, layout, navigation, or visible behavior.
   - `apps/web/src/lib/api.ts` should continue using the same paths and request bodies.

8. Update tests.
   - Add `@repo/guide-domain` policy tests before deleting equivalent service-local logic.
   - Keep existing server service/route tests meaningful after extraction.
   - Update imports in tests only as required by moved errors/types.
   - Do not delete coverage for route mapping, upload preflight, export, DB persistence, or editor flows.

9. Update docs after implementation.
   - Update this plan with completion status, checklist, implementation log, verification notes, and leftovers.
   - Update the master plan only for completed `093` acceptance/status items.
   - Note carry-forward items for `094-demo-domain-extraction.md` and `095-publish-domain-and-public-contract-cleanup.md`.

## Expected File Touches

Expected new files:

```text
packages/guide-domain/package.json
packages/guide-domain/tsconfig.json
packages/guide-domain/src/index.ts
packages/guide-domain/src/errors/guide-domain-error.ts
packages/guide-domain/src/policies/guide-generation-policy.ts
packages/guide-domain/src/policies/guide-generation-policy.test.ts
packages/guide-domain/src/policies/guide-update-policy.ts
packages/guide-domain/src/policies/guide-update-policy.test.ts
packages/guide-domain/src/policies/guide-block-policy.ts
packages/guide-domain/src/policies/guide-block-policy.test.ts
packages/guide-domain/src/policies/guide-export-policy.ts
packages/guide-domain/src/policies/guide-export-policy.test.ts
packages/guide-domain/src/types/guide-domain.ts
packages/types/src/guide.ts
packages/types/src/guide.test.ts
```

Expected modified files:

```text
packages/types/src/index.ts
apps/server/package.json
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/guide/guide.service.test.ts
apps/server/src/modules/guide/guide-html-export.ts
apps/server/src/modules/guide/guide-html-export.test.ts
apps/web/src/features/guide/types.ts
apps/web/src/lib/api.ts
docs/plan/093-guide-domain-extraction.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

Conditional modified files:

```text
apps/server/src/modules/guide/guide-zip-export.ts
apps/server/src/modules/guide/guide-zip-export.test.ts
apps/server/src/modules/guide/guide.repository.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/ProjectGuideListPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/GuideScreenshotViewer.tsx
```

Only touch conditional files if type imports or equivalent moved behavior require it. Do not touch CSS modules for this plan.

Files that should not be touched unless a verified compile break demands a narrow import-only change:

```text
apps/extension/**/*
apps/server/src/modules/capture-session/**/*
apps/server/src/modules/capture-event/**/*
apps/server/src/modules/capture-asset/**/*
apps/server/src/db/migrations/**/*
apps/web/src/features/interactive-demo/**/*
apps/web/src/features/capture-session/**/*
```

## Test And Verification Plan

Run focused tests first:

```text
rtk pnpm --filter @repo/types test -- guide
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter @repo/guide-domain test
rtk pnpm --filter @repo/guide-domain check-types
rtk pnpm --filter @repo/guide-domain lint
rtk pnpm --filter @repo/guide-domain build
rtk pnpm --filter server test -- guide.service guide.routes guide-html-export guide-zip-export guide.app.integration
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter web check-types
```

Run web tests if any web guide types/imports are changed:

```text
rtk pnpm --filter web test -- GuideEditorPage GuidePreviewPage GuideScreenshotViewer ProjectGuideListPage PublicGuideReaderPage publishLinks
```

Run broader checks before final commit:

```text
rtk pnpm check-types
rtk git diff --check
```

Run DB verification only if repository SQL, migrations, transactions, or persistence mapping are changed:

```text
rtk pnpm --filter server test:db
```

If DB verification is not run, record why in this plan after implementation.

## Agent-Browser Validation Requirements

This phase is expected to be backend/shared-contract extraction with no visible UI changes. Browser validation is not required if implementation only changes domain packages, server adapters, shared schemas, tests, and type imports.

Use agent-browser validation if any frontend/browser-visible file beyond type-only imports is changed, especially:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/GuideScreenshotViewer.tsx
apps/web/src/lib/api.ts runtime behavior
```

Required browser validation if triggered:

- Start the app with the repo's normal dev command.
- Open a guide editor route with seeded or existing test data.
- Verify guide metadata loads.
- Verify block order and screenshots render.
- Verify adding/editing a non-step block still works.
- Verify screenshot picker/upload controls still appear and errors remain recoverable.
- Verify annotation highlights render and can be added/removed.
- Verify guide preview renders ordered steps and screenshots.
- Verify public guide reader still renders published guide snapshots if publish/public files were touched.
- Capture screenshots or notes showing the flows checked.

Do not perform browser validation by changing production UI copy, CSS, or layout.

## Acceptance Criteria

- `@repo/guide-domain` exists with focused scripts and tests.
- Guide business rules no longer live primarily in `apps/server/src/modules/guide/guide.service.ts`.
- Server routes and repositories remain adapters.
- Guide route URLs, payloads, response envelopes, status codes, error type strings, and auth behavior remain stable.
- Guide Block and Guide Step remain separate first-class concepts.
- Guide Step is not confused with Capture Event.
- Guide Annotation is not confused with Interactive Demo Hotspot.
- Capture source records remain immutable.
- Guide and Interactive Demo generation remain explicit user actions.
- AI suggestions remain deferred.
- Markdown and HTML export output remains deterministic.
- ZIP/file stream handling remains server-owned.
- Shared guide DTO/request/response schemas live in `@repo/types/guide` where server and web consume the same contracts.
- Web guide pages compile against shared types without UI appearance or behavior changes.
- Existing guide service/route/web tests remain green after focused updates.
- Any skipped DB or browser verification is explicitly justified in the implementation notes.

## Explicit Non-Scope

- UI redesign or visual styling changes.
- Editor workflow changes.
- New guide block types.
- AI-generated guide suggestions.
- HTML replay.
- Interactive Demo domain extraction.
- Publish-domain extraction.
- Public guide access policy changes.
- Public snapshot schema changes.
- Storage provider changes.
- Upload cleanup behavior changes.
- Database schema changes unless a separately documented bug is found and approved.
- Moving capture, project, organization, auth, setup, or publish behavior into guide-domain.
- Route URL changes.
- Changing browser-visible copy.

## Handoff Notes

Carry into `094-demo-domain-extraction.md`:

- Reuse the same extraction shape: pure generation/update policies in a domain package; server keeps routes, SQL, transactions, auth, and file/storage integration.
- Keep Interactive Demo Scene/Hotspot/Transition concepts separate from Guide Block/Step/Annotation.
- Capture source records should remain immutable for demo generation too.

Carry into `095-publish-domain-and-public-contract-cleanup.md`:

- Publish snapshot preparation for guides is intentionally not extracted here.
- Published guide snapshot, public publish link, password/access, stale/live publish status, and public reader contracts should be reviewed under publish-domain.
- If this phase leaves publish-related guide types in `apps/web/src/features/guide/types.ts`, `095` should decide their final shared home.

Rollback/containment notes:

- If domain command extraction creates behavioral drift, keep `@repo/guide-domain` limited to pure policies and restore orchestration in `apps/server/src/modules/guide/guide.service.ts`.
- If shared guide schemas cause web/server type churn beyond the reuse gate, keep DTO aliases in web/server while preserving runtime shapes and revisit during publish contract cleanup.
- If HTML export movement pulls in server-only dependencies, keep only markdown and guide-content policies in guide-domain and leave HTML ZIP export server-local for this phase.

## Final Output Required

When executing this plan, report:

- guide rules moved;
- shared guide schemas/types introduced;
- server adapters changed;
- web type import changes;
- files changed;
- tests run and results;
- DB/browser validation status and justification;
- leftovers for `094` and `095`.
