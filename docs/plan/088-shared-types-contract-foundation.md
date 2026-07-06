# Shared Types And API Contract Foundation Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Completed on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `088` of the shared contracts and domainization track.

## Objective

Activate `@repo/types` as the canonical home for shared Zod API contracts that pass the reuse gate.

This is a backend/shared-contract refactor phase. It must preserve the current UI, routes, request shapes, response shapes, permission behavior, persisted values, and runtime behavior. The outcome should make later domain-package work safer by replacing duplicated request/response types with runtime schemas and inferred TypeScript types.

## Completion Summary

Completed on 2026-07-07.

Implementation commits:

- `e94b682 feat(types): add shared API contract schemas`
- `b7e2f7c refactor(apps): consume shared API contract types`

What changed:

- Activated `@repo/types` with direct `zod` and `@repo/constants` dependencies plus `test` and `check-types` scripts.
- Added shared Zod schemas and inferred types for common primitives, public instance status, first-run setup, project, capture session, capture event, and capture asset response DTOs.
- Added focused package schema tests for the selected contracts.
- Switched selected server route body/query schemas to shared schemas for setup, project, capture session, and capture event.
- Switched selected web/extension compile-time DTOs to shared inferred types or local compatibility aliases.
- Preserved extension-local narrowed capture session/event request DTOs where widening would have changed caller contracts.
- Kept multipart upload request construction and capture asset JSON create request validation local.
- Did not add new Fastify params validation or response validation.
- Did not change frontend/browser runtime behavior or UI.

Verification passed:

- `rtk pnpm --filter @repo/types test`
- `rtk pnpm --filter @repo/types lint`
- `rtk pnpm --filter @repo/types check-types`
- `rtk pnpm --filter @repo/types build`
- `rtk pnpm --filter server check-types`
- `rtk pnpm --filter web check-types`
- `rtk pnpm --filter extension check-types`
- `rtk pnpm --filter server test -- public-instance setup project capture-session capture-event capture-asset`
- `rtk pnpm --filter web test`
- `rtk pnpm --filter extension test`
- `rtk pnpm check-types`

Browser validation:

- Not run. This phase stayed within schemas, route validation imports, API helper type exports, and non-rendered TypeScript type files. No frontend or extension runtime behavior was changed.

Leftovers for later plans:

- Plan `091` should tighten auth/identity/setup/organization DTOs beyond the permissive first-run setup `auth: unknown` response.
- Plan `091` should decide whether project contracts move beyond API DTOs into project-domain behavior.
- Plan `092` should own capture lifecycle policy, privacy/redaction policy, extension capture request narrowing, and capture-domain behavior extraction.
- File-domain work should own MIME allow-lists, upload limits, storage paths, storage adapter contracts, and JSON create-capture-asset request centralization if another real consumer appears.
- Capture asset extension response subsets remain local because the extension currently models only the fields it consumes.

## Completion Checklist

- [x] `@repo/types` activated with runtime dependencies and package scripts.
- [x] Common API primitive schemas added.
- [x] Public instance and first-run setup contracts added.
- [x] Project contracts added.
- [x] Capture session and capture event contracts added.
- [x] Capture asset response contracts added.
- [x] Focused schema tests added and passing.
- [x] Selected server request/query route schemas switched to shared imports.
- [x] Selected web and extension DTO types switched to shared imports or compatibility aliases.
- [x] Multipart upload request construction left local.
- [x] No new params validation, response validation, UI behavior, route URL, database, auth, permission, or privacy behavior changes introduced.
- [x] Focused verification completed.

## Baseline From Completed Plan 087

Plan `087` completed and audited the shared constants foundation.

Available constants from `@repo/constants` that this phase must reuse:

- Capture: `CAPTURE_SESSION_STATUSES`, `CAPTURE_SESSION_SOURCE_TYPES`, `CAPTURE_EVENT_TYPES`
- File/capture assets: `CAPTURE_ASSET_TYPES`, `FILE_STORAGE_PROVIDERS`
- Guide: `GUIDE_STATUSES`, `GUIDE_BLOCK_TYPES`, `GUIDE_CREATABLE_BLOCK_TYPES`, `GUIDE_BLOCK_PLACEMENTS`, `GUIDE_ANNOTATION_TYPES`
- Interactive demo: `INTERACTIVE_DEMO_STATUSES`, `DEMO_HOTSPOT_TYPES`
- Publish: `PUBLISH_ARTIFACT_TYPES`, `PUBLISH_VISIBILITIES`, `PUBLISH_LINK_STATUSES`
- Organization: `ORGANIZATION_ROLES`, `ORGANIZATION_INVITE_STATUSES`, `ORGANIZATION_MEMBER_STATUSES`
- Project: `PROJECT_STATUSES`
- Setup/instance: `DEPLOYMENT_MODES`, `ONBOARDING_MODES`

Important leftovers from `087` that this plan must respect:

- `@repo/types` is still intentionally empty and must be activated here.
- Extension request literals such as `source_type: "extension"` and capture event type narrowing remain local until shared request schemas exist.
- Extension-local capture modes, pause state, diagnostics, and storage keys stay local.
- Capture privacy raw input field-name detection stays server-local.
- MIME allow-lists, upload limits, storage paths, and storage adapter details stay local until file-domain work.
- Public viewer UI state strings such as `restricted` and `expired` stay UI-local.
- Component-local draft unions and test fixture literals do not need mechanical replacement.

## Current Codebase Baseline

Current `@repo/types` package:

```text
packages/types/package.json
packages/types/src/index.ts
packages/types/tsconfig.json
```

Observed state:

- `packages/types/src/index.ts` exports an empty module.
- `packages/types/package.json` has no direct `zod` dependency.
- `packages/types/package.json` has `lint`, `build`, `dev`, and `clean`, but no `test` or `check-types` script.
- Server route schemas are route-local, mainly in `apps/server/src/modules/**/**.routes.ts`.
- Web and extension duplicate API request/response types in local feature/API files.

Before implementation, run:

```text
rtk git status --short
rtk rg "@repo/types" apps packages
rtk rg "z\\.object|z\\.enum|type .*Response|type .*Input|interface .*Response|interface .*Input" apps/server/src/modules apps/web/src apps/extension/src
```

Record any uncommitted work from other agents that touches affected files. Do not overwrite or revert unrelated work.

## Required Source Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/087-shared-constants-foundation.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0017-deployment-aware-onboarding-mode.md
docs/adr/0018-web-first-run-setup-from-day-one.md
docs/adr/0019-separate-web-and-server-apps.md
```

## Reuse Gate

A schema or inferred type can move into `@repo/types` only when at least one condition is true:

- the server and at least one client app consume it;
- the extension and server must agree on the payload;
- it defines public API behavior or public viewer response shape;
- it is needed by generated API docs or a future domain package boundary;
- this plan documents a concrete drift risk.

Route schemas used only by `apps/server` should remain route-local until reuse is real.

## Implementation Scope

Included:

- Add `zod` as a direct runtime dependency of `@repo/types`.
- Add package scripts needed for verification.
- Add common schemas for reusable API primitives.
- Add runtime schemas and inferred types for the first selected shared contracts.
- Reuse `@repo/constants` for enum-backed schemas.
- Replace duplicated web and extension request/response types for selected contracts.
- Replace route-local server request/query schemas for selected contracts only when this does not change behavior.
- Add focused schema tests and focused route/client type verification.

Ownership boundary with later plans:

- Plan `088` owns only thin API contract foundations and low-risk consumer type imports.
- Plan `091` still owns deeper project, identity, setup, and organization cleanup, including auth-facing DTO tightening and domain/package extraction.
- Plan `092` still owns capture-domain behavior extraction, capture lifecycle policy, and privacy policy centralization.

Explicit non-scope:

- No UI redesign, layout changes, styling changes, copy changes, or visible behavior changes.
- No route URL changes.
- No HTTP method or status code changes.
- No API request/response shape changes.
- No database schema or migration changes.
- No new product features.
- No domain package extraction in this phase.
- No auth/session domain extraction.
- No organization, guide, interactive demo, publish, or file-domain contract sweep beyond shared primitives needed by selected contracts.
- No React component prop exports from `@repo/types`.
- No database row types in `@repo/types`.
- No server infrastructure types in `@repo/types`.
- No multipart upload request schema extraction unless it can exactly preserve current behavior without browser/runtime coupling.

## Selected First Contracts

The first implementation batch is intentionally narrow. It covers APIs with active cross-package reuse and low contract ambiguity.

### Common API Primitives

File:

```text
packages/types/src/common.ts
```

Exports:

- `IdSchema`
- `NonEmptyStringSchema`
- `NullableStringSchema`
- `IsoDateTimeStringSchema`
- `NullableIsoDateTimeStringSchema`
- `PositiveIntSchema`
- `PositiveNumberSchema`
- `NonNegativeNumberSchema`
- `UnknownMetadataSchema`
- `ApiErrorBodySchema`
- `ApiErrorResponseSchema`
- inferred types for the exported schemas where useful

Behavior rules:

- Request schemas may use transforms already present today, such as `z.string().trim().min(1)` for names.
- Response schemas must not transform values.
- Do not introduce UUID-only validation because current IDs are plain strings.
- Do not use one transforming ID schema for both route params and response DTOs. If params need trimming, define a separate `TrimmedIdParamSchema`; response IDs should remain non-transforming.
- Keep metadata as `z.unknown()` or a permissive record only where current contracts already accept unknown metadata.

### Public Instance Status Contract

Routes:

```text
GET /api/v1/public/instance
```

Files:

```text
packages/types/src/instance.ts
apps/server/src/modules/public-instance/public-instance.routes.ts
apps/web/src/lib/api.ts
```

Exports:

- `PublicInstanceStatusResponseSchema`
- `PublicInstanceStatusResponse`
- compatibility type alias `PublicInstanceStatus` if current web naming needs it

Schema fields:

- `deployment_mode`: `z.enum(DEPLOYMENT_MODES)`
- `onboarding_mode`: `z.enum(ONBOARDING_MODES)`
- `setup_required`: `z.boolean()`
- `signup_enabled`: `z.boolean()`

Behavior rules:

- Preserve the existing response body exactly.
- Do not change deployment-aware onboarding behavior.
- Do not change public accessibility of this endpoint.

### First-Run Setup Contract

Routes:

```text
POST /api/v1/setup/first-run
```

Files:

```text
packages/types/src/setup.ts
apps/server/src/modules/setup/first-run-setup.routes.ts
apps/web/src/features/setup/types.ts
```

Exports:

- `FirstRunSetupRequestSchema`
- `FirstRunSetupResponseSchema`
- `FirstRunSetupRequest`
- `FirstRunSetupResponse`
- compatibility type alias `FirstRunSetupInput` if current web naming needs it

Request schema fields:

- `owner.email`: `z.string().min(1)`
- `owner.password`: `z.string().min(1)`
- `owner.first_name`: `z.string().nullable().optional()`
- `owner.last_name`: `z.string().nullable().optional()`
- `organization.name`: `z.string().min(1)`

Response schema fields:

- `auth`: keep permissive as `z.unknown()` in this phase

Behavior rules:

- Preserve the current cookie-setting behavior in the server route.
- Preserve current password safety checks in the service.
- Do not expose `session_token` in the web first-run response; current route sends only `{ auth }` after setting the cookie.
- Auth response typing can be tightened in a later auth/identity plan.

### Project Contracts

Routes:

```text
POST /api/v1/projects
GET /api/v1/projects
GET /api/v1/projects/:id
PATCH /api/v1/projects/:id
DELETE /api/v1/projects/:id
```

Files:

```text
packages/types/src/project.ts
apps/server/src/modules/project/project.routes.ts
apps/web/src/features/project/types.ts
apps/web/src/lib/api.ts
apps/extension/src/lib/api.ts
```

Exports:

- `ProjectSchema`
- `ProjectIdParamsSchema`
- `CreateProjectRequestSchema`
- `UpdateProjectRequestSchema`
- `ProjectListQuerySchema`
- `ProjectResponseSchema`
- `ProjectListResponseSchema`
- inferred types for all schemas
- compatibility aliases for current names: `Project`, `CreateProjectInput`, `UpdateProjectInput`, `ProjectListResponse`, `ProjectCreateResponse`, `ProjectDetailResponse`, `ProjectUpdateResponse`

Project schema fields:

- `id`: `IdSchema`
- `organization_id`: `IdSchema`
- `name`: `z.string()`
- `description`: `z.string().nullable()`
- `slug`: `z.string().nullable()`
- `color`: `z.string().nullable()`
- `icon`: `z.string().nullable()`
- `status`: `z.enum(PROJECT_STATUSES)`
- `created_by_id`: `IdSchema`
- `updated_by_id`: `IdSchema`
- `version`: `z.number().int()`
- `created_at`: `IsoDateTimeStringSchema`
- `updated_at`: `IsoDateTimeStringSchema`

Create request schema fields:

- `name`: `z.string().trim().min(1)`
- `description`: `z.string().nullable().optional()`
- `slug`: `z.string().nullable().optional()`
- `color`: `z.string().nullable().optional()`
- `icon`: `z.string().nullable().optional()`
- `metadata`: `z.unknown().optional()`
- `.passthrough()`

Update request schema fields:

- same optional fields as create, plus `status: z.enum(PROJECT_STATUSES).optional()`
- `.passthrough()`

Params/query schemas:

- `ProjectIdParamsSchema`: `{ id: IdSchema }`
- `ProjectListQuerySchema`: `{ status: z.enum(PROJECT_STATUSES).optional() }`
- Do not create a delete response schema because current delete behavior has no response body to share.

Behavior rules:

- Preserve current `.passthrough()` behavior for create/update requests.
- Preserve current server-side empty update handling.
- Preserve current service conflict/error behavior.
- Do not add new Fastify params validation to project routes unless implementation first confirms current invalid-param behavior and focused route tests prove no behavior change.
- If web types currently omit `color`, `icon`, or `metadata` from inputs, it is acceptable for the shared type to be wider as long as no UI behavior changes.

### Capture Session Contracts

Routes:

```text
POST /api/v1/projects/:project_id/capture-sessions
GET /api/v1/projects/:project_id/capture-sessions
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/detail
PATCH /api/v1/projects/:project_id/capture-sessions/:capture_session_id
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id
```

Files:

```text
packages/types/src/capture.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/web/src/features/capture-session/types.ts
apps/web/src/lib/api.ts
apps/extension/src/lib/api.ts
```

Exports:

- `CaptureSessionSchema`
- `ProjectCaptureSessionParamsSchema`
- `ProjectCaptureSessionCollectionParamsSchema`
- `CreateCaptureSessionRequestSchema`
- `UpdateCaptureSessionRequestSchema`
- `CaptureSessionListQuerySchema`
- `CaptureSessionResponseSchema`
- `CaptureSessionListResponseSchema`
- `CaptureSessionDetailResponseSchema`
- `CompleteCaptureSessionResponseSchema`
- inferred types for all schemas
- compatibility aliases for current web/extension names where useful

Capture session schema fields:

- `id`, `organization_id`, `project_id`: `IdSchema`
- `name`: `z.string()`
- `description`: `z.string().nullable()`
- `status`: `z.enum(CAPTURE_SESSION_STATUSES)`
- `source_type`: `z.enum(CAPTURE_SESSION_SOURCE_TYPES)`
- `started_at`, `completed_at`, `canceled_at`: nullable ISO datetime strings
- `start_url`, `browser_name`, `browser_version`, `operating_system`, `user_agent`: nullable strings
- `viewport_width`, `viewport_height`: nullable positive integers
- `device_pixel_ratio`: nullable positive number
- `created_by_id`, `updated_by_id`: `IdSchema`
- `version`: `z.number().int()`
- `created_at`, `updated_at`: ISO datetime strings

Create request schema fields:

- match the current server `create_capture_session_body_schema` exactly, including `.passthrough()`
- use `z.enum(CAPTURE_SESSION_SOURCE_TYPES).optional()` for `source_type`

Update request schema fields:

- match the current server `update_capture_session_body_schema` exactly, including `.passthrough()`
- do not add lifecycle timestamp request fields; the route currently rejects lifecycle timestamp input separately

Complete response schema:

- `capture_session`: `CaptureSessionSchema`
- `redirect.path`: `z.string()`
- `redirect.reason`: `z.literal("capture_session_completed")`

Params/query schemas:

- `ProjectCaptureSessionParamsSchema`: `{ project_id: IdSchema, capture_session_id: IdSchema }`
- `ProjectCaptureSessionCollectionParamsSchema`: `{ project_id: IdSchema }`
- `CaptureSessionListQuerySchema`: `{ status: z.enum(CAPTURE_SESSION_STATUSES).optional() }`

Behavior rules:

- Preserve extension-created sessions with `source_type: "extension"`.
- Do not add new Fastify params validation to capture session routes unless implementation first confirms current invalid-param behavior and focused route tests prove no behavior change.
- Preserve server-local validation that rejects lifecycle timestamp update input.
- Preserve completion body handling: undefined or empty object is allowed; non-empty body is rejected by route logic.
- Do not broaden capture session lifecycle transitions.

### Capture Event Contracts

Routes:

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:capture_event_id
PATCH /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:capture_event_id
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/reorder
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:capture_event_id
```

Files:

```text
packages/types/src/capture.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/web/src/features/capture-session/types.ts
apps/extension/src/lib/api.ts
```

Exports:

- `CaptureEventSchema`
- `CaptureEventParamsSchema`
- `CaptureEventCollectionParamsSchema`
- `CreateCaptureEventRequestSchema`
- `UpdateCaptureEventRequestSchema`
- `CaptureEventListQuerySchema`
- `ReorderCaptureEventsRequestSchema`
- `CaptureEventResponseSchema`
- `CaptureEventListResponseSchema`
- `ReorderCaptureEventsResponseSchema`
- inferred types for all schemas

Create request schema fields:

- match the current server `create_capture_event_body_schema` exactly, including `.passthrough()`
- include current optional browser/target metadata fields
- keep raw input field detection out of `@repo/types`

Update request schema fields:

- match the current server `update_capture_event_body_schema`
- keep `.strict().refine((body) => Object.keys(body).length > 0)` behavior

Params/query schemas:

- `CaptureEventParamsSchema`: `{ project_id: IdSchema, capture_session_id: IdSchema, capture_event_id: IdSchema }`
- `CaptureEventCollectionParamsSchema`: `{ project_id: IdSchema, capture_session_id: IdSchema }`
- `CaptureEventListQuerySchema`: `{ event_type: z.enum(CAPTURE_EVENT_TYPES).optional() }`

Behavior rules:

- Do not add new Fastify params validation to capture event routes unless implementation first confirms current invalid-param behavior and focused route tests prove no behavior change.
- Preserve server-local privacy behavior that copies raw input fields only when present and applies redaction policy in the service.
- Preserve extension narrowing locally when the extension only sends `"capture"` and `"click"` event types.
- Do not move event reorder policy into `@repo/types`.

### Capture Asset Response Contract

Routes:

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
GET /api/v1/projects/:project_id/capture-assets
```

Files:

```text
packages/types/src/capture.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/web/src/features/capture-session/types.ts
apps/web/src/features/guide/types.ts
apps/extension/src/lib/api.ts
```

Exports:

- `CaptureAssetParamsSchema`
- `CaptureAssetCollectionParamsSchema`
- `CaptureAssetFileSchema`
- `CaptureAssetSchema`
- `CaptureAssetWithFileUrlSchema`
- `CaptureAssetResponseSchema`
- `CaptureAssetListResponseSchema`
- `ProjectCaptureAssetListResponseSchema`
- inferred types for all schemas

Behavior rules:

- Share response schemas only in this phase.
- `CaptureAssetSchema.captured_at` must match the server service response shape, which is currently a non-null ISO datetime string. Extension upload inputs may still pass nullable `capturedAt`; that is a request concern and stays local.
- Use `CaptureAssetWithFileUrlSchema` for project-level/list/detail responses that include `file_url`.
- Keep extension-local capture asset subset response types local unless implementation proves the extension safely consumes the full server response type without runtime or type churn.
- Do not add new Fastify params validation to capture asset routes unless implementation first confirms current invalid-param behavior and focused route tests prove no behavior change.
- Keep multipart upload request construction local to web/extension.
- Keep JSON create-capture-asset request schema route-local unless implementation finds an active web/extension consumer that posts that exact JSON body.
- Keep server multipart parsing, MIME validation, size limits, storage paths, and file storage details local.
- If implementation discovers that extension response types intentionally model only a subset, keep the extension subset type local and document the deferred contract instead of weakening the shared response schema.

## Files To Touch

Must touch:

```text
packages/types/package.json
packages/types/src/index.ts
packages/types/src/common.ts
packages/types/src/instance.ts
packages/types/src/setup.ts
packages/types/src/project.ts
packages/types/src/capture.ts
packages/types/src/common.test.ts
packages/types/src/instance.test.ts
packages/types/src/setup.test.ts
packages/types/src/project.test.ts
packages/types/src/capture.test.ts
pnpm-lock.yaml
```

Consumer files expected for this phase:

```text
apps/server/package.json
apps/server/src/modules/public-instance/public-instance.routes.ts
apps/server/src/modules/setup/first-run-setup.routes.ts
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/web/package.json
apps/web/src/lib/api.ts
apps/web/src/features/setup/types.ts
apps/web/src/features/project/types.ts
apps/web/src/features/capture-session/types.ts
apps/web/src/features/guide/types.ts
apps/extension/package.json
apps/extension/src/lib/api.ts
```

Allowed only if TypeScript compatibility requires local alias cleanup:

```text
apps/server/src/modules/project/project.service.ts
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
```

Do not touch other files without documenting why this plan was incomplete.

## Package And Export Rules

Package rules:

- Add `zod` to `packages/types/package.json` `dependencies`, not only root dependencies.
- Add `@repo/constants` to `packages/types/package.json` `dependencies`.
- Add `vitest` as a dev dependency because this phase requires package schema tests.
- Add `test`, `check-types`, and keep existing `lint`, `build`, `dev`, `clean`.

Recommended scripts:

```json
{
  "test": "vitest run",
  "check-types": "tsc --noEmit"
}
```

Export rules:

- `packages/types/src/index.ts` must re-export every public schema/type module.
- Prefer direct module imports such as `@repo/types/capture` in app code when that reduces import size and domain coupling.
- Every exported shared schema must have an inferred type export.
- Compatibility aliases are allowed to avoid broad app churn, but they must point to inferred schema types.

Naming convention:

```text
<Domain><Thing>ParamsSchema
<Domain><Thing>QuerySchema
<Domain><Thing>RequestSchema
<Domain><Thing>ResponseSchema
<Domain><Thing>ListResponseSchema
type <Domain><Thing>Request = z.infer<typeof <Domain><Thing>RequestSchema>
type <Domain><Thing>Response = z.infer<typeof <Domain><Thing>ResponseSchema>
```

Use exact product terms from the master plan: Capture Session, Capture Event, Capture Asset, Project, Instance, and First-Run Setup.

## Server Migration Rules

- Replace route-local request/query schemas with shared schemas only for the selected routes above.
- Treat shared params schemas as exported contracts first. Only wire them into Fastify route schemas when the route already validates params or focused tests prove the new validation does not change public behavior.
- Keep error response helpers route-local; shared error schemas are for shape documentation/tests, not behavior extraction.
- Do not attach new Fastify response validation unless existing route infrastructure already supports it and focused tests prove no behavior change.
- Keep auth context, permission checks, service dependencies, repository dependencies, and domain errors server-local.
- Keep pick/normalization helper functions server-local.
- Preserve existing `.passthrough()`, `.strict()`, `.refine()`, `.trim()`, nullable, and optional behavior exactly.

## Web And Extension Migration Rules

- Replace duplicated selected request/response type declarations with imports from `@repo/types`.
- Preserve current API helper function signatures where possible through type aliases.
- Do not change fetch URLs, fetch methods, headers, body serialization, FormData construction, error parsing, or retry behavior.
- Do not change JSX, CSS, copy, layout, routing, or user interactions.
- Extension runtime payload builders may continue to use local narrowed types such as extension-only source/event values if that is clearer and safer.

## Security And Permission Rules

- Do not change authentication requirements on any route.
- Do not change organization/project authorization checks.
- Do not expose additional setup/auth/session data to the browser.
- Do not move password hashing, session-cookie handling, invite security, or publish access checks into `@repo/types`.
- Do not weaken capture privacy. Raw input field-name detection and redaction behavior remain server-local.
- Do not parse or trust client metadata beyond the current server behavior.

## Migration And Backwards Compatibility

- No database migration is required.
- Persisted enum values remain byte-for-byte compatible through `@repo/constants`.
- Existing request payloads must continue to parse.
- Existing response bodies must remain structurally compatible.
- The package should be safe for ESM consumers in server, web, and extension.
- If a shared response schema reveals a mismatch between server, web, and extension types, do not silently pick the loosest type. Keep the questionable contract local, document the mismatch in this plan's leftovers, and defer it to the relevant domain child plan.

## Test Plan

Package tests:

- Common primitives accept representative current values and reject representative invalid values.
- Enum-backed schemas use the `@repo/constants` arrays.
- First-run setup request accepts the current web payload.
- Project create/update schemas preserve passthrough and trimming behavior.
- Capture session create/update schemas preserve passthrough and numeric validation behavior.
- Capture event create/update/reorder schemas preserve passthrough, strict update, and non-empty update behavior.
- Capture asset response schema accepts the current server response shape used by web and extension.

Focused server route tests to run after migration:

```text
rtk pnpm --filter server test -- public-instance setup project capture-session capture-event capture-asset
```

Existing test files that should remain green:

```text
apps/server/src/modules/public-instance/public-instance.integration.test.ts
apps/server/src/modules/setup/first-run-setup.routes.test.ts
apps/server/src/modules/setup/first-run-setup.app.integration.test.ts
apps/server/src/modules/project/project.routes.test.ts
apps/server/src/modules/project/project.app.integration.test.ts
apps/server/src/modules/capture-session/capture-session.routes.test.ts
apps/server/src/modules/capture-session/capture-session.app.integration.test.ts
apps/server/src/modules/capture-event/capture-event.routes.test.ts
apps/server/src/modules/capture-event/capture-event.app.integration.test.ts
apps/server/src/modules/capture-asset/capture-asset.routes.test.ts
apps/server/src/modules/capture-asset/capture-asset.app.integration.test.ts
```

Type and build verification:

```text
rtk pnpm --filter @repo/types lint
rtk pnpm --filter @repo/types test
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter @repo/types build
rtk pnpm --filter server check-types
rtk pnpm --filter web check-types
rtk pnpm --filter extension check-types
rtk pnpm check-types
```

Run broader tests if route schema changes are not covered by focused tests:

```text
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
```

## Agent-Browser Validation

This phase should not require browser validation if implementation stays within type exports, route schemas, API helper type imports, and non-rendered TypeScript files.

Use agent-browser validation only if implementation changes any frontend or extension runtime behavior beyond type-only imports. If needed, validate:

- first-run setup form still submits to the same endpoint and reaches the same post-setup state;
- project list/create/detail flows still render and call the same APIs;
- capture session create/detail flows still call the same APIs;
- extension capture startup still creates a session and sends capture events/assets against a local instance.

Any browser validation must include notes about URL tested, flow tested, and result.

## Acceptance Criteria

- `@repo/types` no longer exports only an empty placeholder module.
- `@repo/types` declares its runtime dependencies directly.
- Shared schemas use `@repo/constants` for enum-backed values.
- Every shared schema has an inferred type export.
- Selected server routes use shared request/query schemas without behavior changes.
- Selected web and extension type declarations import shared inferred types or compatibility aliases.
- Server-only schemas remain route-local unless selected above.
- Multipart upload request handling remains local.
- Existing API shapes remain unchanged.
- Existing auth, permission, setup, and privacy behavior remains unchanged.
- Focused package/server/client verification passes or failures are documented with exact commands and causes.
- No UI output changes.

## Handoff Notes For Implementer

- Start by activating `@repo/types` and adding package-level tests before touching app consumers.
- Migrate one domain file at a time: instance/setup, then project, then capture.
- After each domain migration, run the smallest relevant typecheck or package test before continuing.
- Prefer compatibility aliases to keep app changes small.
- If a schema's current server behavior is unclear, copy the existing route schema first and add tests around the copied behavior before replacing imports.
- If a response type mismatch appears between server, web, and extension, stop that specific extraction and document it instead of broadening the shared type unsafely.

## Final Output Required

When executing this plan, report:

- schemas created;
- route schemas switched to shared imports;
- schemas intentionally left route-local;
- files changed;
- tests and verification commands run with results;
- any contracts deferred to later child plans, especially plan `091` for identity/setup/organization cleanup and plan `092` for capture-domain extraction.
