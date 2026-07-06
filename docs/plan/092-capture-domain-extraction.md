# Capture Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Expanded and rechecked for implementation readiness on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `092` of the shared contracts and domainization track.

## Objective

Create `@repo/capture-domain` and move pure Capture Session, Capture Event, and capture asset policy logic out of `apps/server` while preserving every existing route, payload, auth, storage, database, extension, and web behavior.

Capture remains source material. Finishing a capture session must not create a Guide or Interactive Demo automatically.

This phase should extract reusable domain policies, not introduce product behavior. The server remains the application adapter that owns Fastify routes, auth/session context, SQL repositories, transactions, file storage, multipart parsing, cookies, and error-to-HTTP mapping.

## Baseline From Completed 091

Plan `091` completed and post-implementation audited the app-shell contract cleanup.

Rules carried into this phase:

- Keep capture-domain free of server auth/session internals.
- Use shared auth DTOs only at public API/client boundaries.
- Keep server request auth context and permission adapters server-owned unless a later auth-domain phase explicitly extracts them.
- Preserve `@repo/file-domain` as file metadata/upload-policy only.
- Do not import organization invite permission context or session token handling into capture-domain.
- Do not create or move project/setup/organization domain packages in this phase.

Existing shared contracts after `091`:

- `@repo/constants` already exports capture session statuses, capture source types, event types, file storage providers, and capture asset types.
- `@repo/types/capture` already exports most capture route params, request schemas, response schemas, and DTO types.
- Web capture-session feature already consumes many `@repo/types/capture` types.
- Extension capture API still keeps reduced local capture DTOs for extension-specific request/response usage.

## Current Codebase Baseline

Relevant existing shared package files:

```text
packages/constants/src/capture.ts
packages/constants/src/file.ts
packages/constants/src/index.ts
packages/constants/src/constants.test.ts
packages/types/src/capture.ts
packages/types/src/capture.test.ts
packages/types/src/index.ts
packages/file-domain/src/index.ts
packages/file-domain/src/errors/file-domain-error.ts
packages/file-domain/src/policies/file-metadata-policy.ts
packages/file-domain/src/policies/screenshot-upload-policy.ts
packages/file-domain/src/types/file-metadata.ts
```

Relevant server files:

```text
apps/server/package.json
apps/server/src/app.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-session/capture-session.repository.ts
apps/server/src/modules/capture-session/capture-session.routes.test.ts
apps/server/src/modules/capture-session/capture-session.service.test.ts
apps/server/src/modules/capture-session/capture-session.db.integration.test.ts
apps/server/src/modules/capture-session/capture-session.app.integration.test.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/capture-event/capture-event.repository.ts
apps/server/src/modules/capture-event/capture-event.routes.test.ts
apps/server/src/modules/capture-event/capture-event.service.test.ts
apps/server/src/modules/capture-event/capture-event.db.integration.test.ts
apps/server/src/modules/capture-event/capture-event.app.integration.test.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/capture-asset/capture-asset.repository.ts
apps/server/src/modules/capture-asset/capture-asset.routes.test.ts
apps/server/src/modules/capture-asset/capture-asset.service.test.ts
apps/server/src/modules/capture-asset/capture-asset.db.integration.test.ts
apps/server/src/modules/capture-asset/capture-asset.app.integration.test.ts
apps/server/src/modules/file-storage/local-file-storage.provider.ts
```

Relevant extension files:

```text
apps/extension/package.json
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/src/lib/api.ts
apps/extension/src/lib/api.test.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/automatic-capture.test.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/content-click-capture.test.ts
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/screenshot.test.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/settings.test.ts
```

Relevant web files:

```text
apps/web/package.json
apps/web/src/lib/api.ts
apps/web/src/features/capture-session/types.ts
apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx
apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx
```

Relevant migrations:

```text
apps/server/src/db/migrations/002_capture_session_schema.sql
apps/server/src/db/migrations/003_capture_asset_metadata_schema.sql
apps/server/src/db/migrations/004_capture_event_foundation_schema.sql
```

Relevant docs and ADRs:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
```

## Existing Behavior To Preserve

Capture session behavior:

- Create/list/get/detail/update/delete capture sessions remain scoped by URL `project_id` plus authenticated organization.
- Creation normalizes string fields by trimming and converting blank optional strings to `null`.
- Creation accepts optional `source_type`, defaulting downstream as currently implemented by the repository.
- Update normalizes editable strings and rejects an empty effective update.
- Update must continue rejecting client-managed `started_at`, `completed_at`, and `canceled_at` inputs before repository updates.
- Completion accepts no body or an empty JSON object only.
- Completion is idempotent for already-completed sessions through the repository outcome.
- Completion rejects non-completable statuses with the current `capture_session_not_completable` error envelope.
- Completion returns the same redirect object shape:
  - `redirect.reason`: `capture_session_completed`
  - `redirect.path`: `/projects/{project_id}/capture-sessions/{capture_session_id}`
- Detail responses continue adding relative asset file URLs of the form:
  - `/api/v1/projects/{project_id}/capture-sessions/{capture_session_id}/assets/{asset_id}/file`

Capture event behavior:

- Create/list/get/update/delete/reorder capture events remain scoped by URL `project_id`, URL `capture_session_id`, and authenticated organization.
- Event creation rejects raw input fields named `input_value`, `value`, `typed_value`, `password`, or `secret`.
- Event creation rejects `input_value_redacted: false`.
- Event creation always normalizes persisted `input_value_redacted` to `true`.
- Event creation trims optional strings and converts blank optional strings to `null`.
- `navigation` events require `page_url`.
- `click` events require at least one click target signal:
  - `target_label`
  - `target_selector`
  - `target_role`
  - `target_text`
  - `client_x`
  - `client_y`
- `capture` events require `capture_asset_id`.
- `note` events require `note`.
- If `capture_asset_id` is present, the asset must exist in the same organization, project, and capture session.
- Reorder accepts only a non-empty full ordered list of trimmed unique event ids.
- Reorder is allowed only for manual capture sessions.
- Reorder must reject missing, duplicate, or partial event id sets.
- Update accepts only safe manual fields:
  - `page_url`
  - `page_title`
  - `target_label`
  - `target_text`
  - `input_intent`
  - `note`
- Update rejects empty payloads, raw input fields, and unknown fields.
- Update is allowed only for manual sessions that are not archived or canceled.

Capture asset behavior:

- Metadata creation supports only screenshot assets.
- Upload supports screenshot file uploads only.
- Upload keeps the current max default of `10 * 1024 * 1024` bytes.
- Upload MIME type and declared size policy remain delegated to `@repo/file-domain`.
- Upload MIME type and size validation still happens before file writes.
- Upload writes bytes through the server file-storage adapter only after project/session scope checks.
- Upload deletes written bytes best-effort if DB metadata creation fails.
- Project screenshot picker keeps accepting only `screenshot` and `redacted_screenshot` filters.
- Route-local multipart parsing behavior stays in the server adapter.
- File bytes streaming, storage keys, private cache headers, and storage provider errors remain server-owned.

Auth and security behavior:

- Cookie and bearer-token behavior remains unchanged.
- Extension requests keep using `Authorization: Bearer <session_token>`.
- Web requests keep using the web session cookie.
- All route auth context derivation remains in `apps/server`.
- The domain package must not import `AuthContext`, session services, cookies, request objects, Fastify types, SQL, file storage providers, or organization invite permission context.
- Client-supplied organization ids, actor ids, project ids in bodies, and ownership fields remain ignored in favor of URL scope plus authenticated server context.
- Privacy defaults remain strict: raw typed input values are never accepted or persisted.

## Routes And API Contracts

Do not change route URLs, methods, status codes, response envelope shapes, or error envelope shapes.

Capture session routes:

```text
POST   /api/v1/projects/:project_id/capture-sessions
GET    /api/v1/projects/:project_id/capture-sessions
GET    /api/v1/projects/:project_id/capture-sessions/:id
GET    /api/v1/projects/:project_id/capture-sessions/:id/detail
PATCH  /api/v1/projects/:project_id/capture-sessions/:id
POST   /api/v1/projects/:project_id/capture-sessions/:id/complete
DELETE /api/v1/projects/:project_id/capture-sessions/:id
```

Shared schemas already used or available:

- `CreateCaptureSessionRequestSchema`
- `UpdateCaptureSessionRequestSchema`
- `CaptureSessionListQuerySchema`
- `CaptureSessionResponseSchema`
- `CaptureSessionListResponseSchema`
- `CompleteCaptureSessionResponseSchema`
- `CaptureSessionDetailResponseSchema`

Capture event routes:

```text
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
PATCH  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
PUT    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/order
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
```

Shared schemas already used:

- `CreateCaptureEventRequestSchema`
- `CaptureEventListQuerySchema`
- `UpdateCaptureEventRequestSchema`
- `ReorderCaptureEventsRequestSchema`
- `CaptureEventResponseSchema`
- `CaptureEventListResponseSchema`
- `ReorderCaptureEventsResponseSchema`

Capture asset routes:

```text
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
GET    /api/v1/projects/:project_id/assets
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/file
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
```

Capture asset contract gap to handle in this phase:

- `apps/server/src/modules/capture-asset/capture-asset.routes.ts` still defines route-local JSON schemas for metadata creation and list queries.
- `packages/types/src/capture.ts` currently contains asset response schemas but not a shared `CreateCaptureAssetRequestSchema` or `CaptureAssetListQuerySchema`.
- Add these shared schemas only if the exact current route-local behavior can be preserved:
  - `CreateCaptureAssetRequestSchema`
  - `CreateCaptureAssetRequest`
  - `CreateCaptureAssetInput`
  - `CaptureAssetListQuerySchema`
  - `CaptureAssetListQuery`
- Do not move multipart upload parsing into `@repo/types` or `@repo/capture-domain`.

## New Package

Create:

```text
packages/capture-domain/package.json
packages/capture-domain/tsconfig.json
packages/capture-domain/src/index.ts
packages/capture-domain/src/errors/capture-domain-error.ts
packages/capture-domain/src/policies/capture-session-policy.ts
packages/capture-domain/src/policies/capture-event-policy.ts
packages/capture-domain/src/policies/capture-asset-policy.ts
packages/capture-domain/src/types/capture-session.ts
packages/capture-domain/src/types/capture-event.ts
packages/capture-domain/src/types/capture-asset.ts
packages/capture-domain/src/policies/capture-session-policy.test.ts
packages/capture-domain/src/policies/capture-event-policy.test.ts
packages/capture-domain/src/policies/capture-asset-policy.test.ts
```

Package settings should mirror `@repo/file-domain`:

- `name`: `@repo/capture-domain`
- `private`: `true`
- `type`: `module`
- exports:
  - `"."`: `./src/index.ts`
  - `"./*"`: `./src/*.ts`
- scripts:
  - `lint`
  - `test`
  - `build`
  - `check-types`
  - `dev`
  - `clean`
- dependencies:
  - `@repo/constants`
  - `@repo/file-domain` only if capture asset policies directly reuse file-domain types/errors
- dev dependencies matching `@repo/file-domain`:
  - `@repo/eslint-config`
  - `@repo/typescript-config`
  - `eslint`
  - `typescript`
  - `vitest`

Add package dependency:

```text
apps/server/package.json
```

- Add `"@repo/capture-domain": "workspace:*"` to server dependencies.

Add extension/web dependencies only if implementation imports the new package there. Prefer not to import `@repo/capture-domain` into web/extension in this phase unless there is a concrete reuse need; client-side contracts should usually come from `@repo/types/capture`.

## Domain APIs To Extract

The implementation should extract pure functions and simple domain errors. Keep repository orchestration in server services.

Session policy exports:

```ts
normalize_create_capture_session(input)
normalize_update_capture_session(input)
assert_non_empty_capture_session_update(normalized)
assert_no_client_lifecycle_timestamp_input(input)
is_valid_capture_session_completion_body(body)
build_capture_session_completion_redirect(capture_session)
build_capture_session_asset_file_url(asset)
```

Session policy behavior:

- Preserve current trimming and blank-to-null semantics.
- Preserve empty update detection after normalization.
- Preserve lifecycle timestamp rejection at the adapter/service boundary.
- Preserve complete body validation.
- Preserve redirect path generation.
- Preserve detail asset `file_url` generation.

Event policy exports:

```ts
normalize_create_capture_event(input)
normalize_update_capture_event(input)
normalize_reorder_capture_events(input)
assert_capture_event_payload_safe(input)
assert_capture_event_matches_type_requirements(normalized)
assert_reorder_allowed_for_source_type(source_type)
assert_reorder_covers_all_events(event_ids, active_events)
assert_capture_event_update_allowed(editability)
```

Event policy behavior:

- Preserve raw input field rejection.
- Preserve `input_value_redacted` normalization to `true`.
- Preserve event-type-specific requirements.
- Preserve editable update field allow-list.
- Preserve reorder normalization, uniqueness, and full-set validation.
- Full-set reorder validation needs repository-provided active events but must remain a pure comparison in the domain package.
- Preserve manual-only reorder rule.
- Preserve manual active edit rule.

Asset policy exports:

```ts
normalize_create_capture_asset(input)
normalize_upload_capture_asset(input)
assert_supported_capture_asset_type(asset_type)
assert_project_screenshot_picker_asset_type(asset_type)
map_file_domain_upload_policy_error(error)
```

Asset policy behavior:

- Preserve screenshot-only metadata creation.
- Preserve project screenshot picker allowed filters.
- Preserve string compaction for page metadata.
- Preserve file metadata normalization via `@repo/file-domain`.
- Preserve upload MIME/size policy mapping without moving file-storage writes, stream handling, storage keys, or upload cleanup into `@repo/capture-domain`.

Error exports:

- Prefer one base `CaptureDomainError` with stable `code` values, plus small subclasses where current route/service tests need `instanceof`.
- Server routes must still emit the existing error response types and messages.
- Keep the existing error class names exported from server service modules if other server tests or routes import them. They may re-export or alias domain errors, but public server module imports must not break.
- Preserve `instanceof` behavior for any error class currently matched in routes. If aliasing domain errors through server service modules makes `instanceof` brittle, keep thin server-local subclasses or explicit mapping helpers.

Suggested domain error codes:

```text
capture_session_not_found
capture_session_not_completable
invalid_capture_session_completion
empty_capture_session_update
invalid_capture_session
capture_asset_not_found
unsupported_capture_asset_type
unsupported_capture_asset_upload_type
upload_too_large
invalid_capture_asset
invalid_capture_asset_upload
capture_event_not_found
invalid_capture_event
capture_event_index_conflict
invalid_capture_event_order
capture_event_reorder_not_allowed
capture_event_update_not_allowed
```

`ProjectNotFoundError` may remain server-local because project existence is an adapter/repository concern. If moved into capture-domain for consistency, server routes must preserve the current `project_not_found` envelope exactly.

## Server Wiring Plan

Do this with tests first and in small steps.

1. Add `@repo/capture-domain` package and tests.
   - Start with copied behavior tests from server service tests, reduced to pure policy inputs/outputs.
   - Keep tests red until policies are implemented.

2. Move session normalization and completion helpers.
   - Update `apps/server/src/modules/capture-session/capture-session.service.ts` to import policy functions.
   - Keep repository interface, project existence checks, auth context, and service method names in the server.
   - Keep route-level completion body validation or call the domain policy from the route; either is acceptable if error mapping remains unchanged.
   - Keep route `pick_create_capture_session_data` and `pick_update_capture_session_data` if needed to strip body passthrough fields before service calls.

3. Move event validation and ordering helpers.
   - Update `apps/server/src/modules/capture-event/capture-event.service.ts` to import event policy functions.
   - Remove duplicate route-level raw input value assertions only after service/domain tests prove the service rejects the same unsafe payloads.
   - Keep route `pick_create_capture_event_data` if needed to preserve passthrough stripping and explicit raw-field forwarding for rejection.
   - Keep repository checks for project, capture session, capture asset, editability, and active events in server.

4. Move asset normalization and picker helpers.
   - Update `apps/server/src/modules/capture-asset/capture-asset.service.ts` to import asset policy functions.
   - Keep file storage adapter calls, transactions, ULID generation, file deletion cleanup, and stream reads in server.
   - Keep `@repo/file-domain` upload policy integration either in server service or in capture-domain policy. If moved into capture-domain, do not import server storage provider types.

5. Close capture asset contract gap if safe.
   - Add shared JSON asset create/list schemas to `packages/types/src/capture.ts`.
   - Update `packages/types/src/capture.test.ts`.
   - Replace route-local JSON body/list query schemas in `apps/server/src/modules/capture-asset/capture-asset.routes.ts`.
   - Do not move multipart field parsing into shared contracts.
   - Keep multipart upload field validation in the server route unless a later dedicated upload-contract phase handles it.

6. Reduce extension local capture type duplication where safe.
   - Prefer importing shared response types from `@repo/types/capture`:
     - `CaptureSessionResponse`
     - `CompleteCaptureSessionResponse`
     - `CaptureAssetResponse`
     - `CaptureEventResponse`
   - For extension create inputs, keep narrowed local aliases if they intentionally restrict values:
     - extension session creation must keep `source_type: "extension"`
     - extension event creation currently allows only `"capture"` and `"click"`
   - If replacing extension types with shared types would widen client behavior in a way tests cannot guard, keep the narrowed local types and document why.

7. Keep web behavior unchanged.
   - Web already imports shared capture session/event contracts in `apps/web/src/features/capture-session/types.ts`.
   - Only touch web files if type changes require it.
   - Do not change rendered UI, copy, controls, routing, or workflow.

## Exact File Touch Expectations

Expected new files:

```text
packages/capture-domain/package.json
packages/capture-domain/tsconfig.json
packages/capture-domain/src/index.ts
packages/capture-domain/src/errors/capture-domain-error.ts
packages/capture-domain/src/policies/capture-session-policy.ts
packages/capture-domain/src/policies/capture-session-policy.test.ts
packages/capture-domain/src/policies/capture-event-policy.ts
packages/capture-domain/src/policies/capture-event-policy.test.ts
packages/capture-domain/src/policies/capture-asset-policy.ts
packages/capture-domain/src/policies/capture-asset-policy.test.ts
packages/capture-domain/src/types/capture-session.ts
packages/capture-domain/src/types/capture-event.ts
packages/capture-domain/src/types/capture-asset.ts
```

Expected modified files:

```text
apps/server/package.json
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-session/capture-session.service.test.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-session/capture-session.routes.test.ts
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/capture-event/capture-event.service.test.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-event/capture-event.routes.test.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/capture-asset/capture-asset.service.test.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-asset/capture-asset.routes.test.ts
packages/types/src/capture.ts
packages/types/src/capture.test.ts
```

Conditionally modified files:

```text
apps/extension/src/lib/api.ts
apps/extension/src/lib/api.test.ts
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/package.json
apps/web/src/lib/api.ts
apps/web/src/features/capture-session/types.ts
apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx
apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx
apps/web/package.json
pnpm-lock.yaml
```

Do not touch unless explicitly required by the extraction:

```text
apps/server/src/db/migrations/**/*
apps/server/src/modules/file-storage/**/*
apps/server/src/modules/guide/**/*
apps/server/src/modules/interactive-demo/**/*
apps/server/src/modules/authentication/**/*
apps/server/src/modules/organization/**/*
apps/web/src/features/guide/**/*
apps/web/src/features/interactive-demo/**/*
```

## Security And Permission Rules

- Server auth context remains server-owned.
- Capture-domain functions receive only plain inputs needed for pure decisions.
- Capture-domain must not accept or trust client-provided organization ids, actor ids, owner ids, or timestamps.
- Server services continue deriving:
  - `organization_id` from authenticated auth context;
  - `actor_org_user_id` from authenticated auth context;
  - `project_id`, `capture_session_id`, `capture_event_id`, and `capture_asset_id` from route params.
- Server services continue checking project existence before capture session/event/asset existence where current tests require it.
- Server services continue checking capture asset scope before creating linked capture events.
- Server services continue ensuring manual-only reordering and manual active editing using repository-provided session metadata.
- Upload validation continues rejecting unsupported MIME types and oversize files before file bytes are persisted.
- Upload byte persistence continues happening only after project and capture-session scope checks pass.
- File streams, storage keys, storage provider implementations, and private cache headers stay server-only.
- No raw typed input value can pass route/service/domain validation.

## Migration And Backwards Compatibility

- No database migration should be added.
- No stored data shape should change.
- No route URL, method, request body, response body, status code, or error envelope should change.
- Existing `.passthrough()` behavior in shared JSON capture request schemas must remain unless a test proves stricter validation was already applied.
- Extension API payloads must remain accepted exactly as today.
- Web capture session list/detail behavior must remain unchanged.
- Existing guide and interactive-demo creation from capture detail pages remains explicitly outside this domain extraction; do not change those routes or UI flows.
- Keep server service exports backward-compatible for current route tests and app wiring.
- Keep `@repo/types/capture` schema semantics backward-compatible, including current JSON passthrough behavior and current route-local multipart behavior.
- If package dependency changes update `pnpm-lock.yaml`, commit the lockfile with the package change.

## Test Plan

Use test-driven implementation.

New domain tests:

- `capture-session-policy.test.ts`
  - normalizes create input with trimming and blank-to-null optional strings;
  - normalizes update input and rejects empty effective updates;
  - detects client-managed lifecycle timestamp input;
  - validates completion body shape;
  - builds completion redirect;
  - builds detail asset file URLs.
- `capture-event-policy.test.ts`
  - rejects raw input fields and `input_value_redacted: false`;
  - always normalizes `input_value_redacted` to `true`;
  - validates event-type requirements for navigation, click, capture, and note;
  - normalizes reorder lists and rejects empty, duplicate, blank, and partial/mismatched lists;
  - enforces manual-only reorder;
  - normalizes safe update fields and rejects unknown/raw/empty updates;
  - enforces manual active editability.
- `capture-asset-policy.test.ts`
  - normalizes screenshot asset metadata;
  - rejects unsupported metadata asset types;
  - normalizes upload metadata;
  - preserves screenshot/redacted screenshot picker filters and rejects unsupported filters;
  - maps unsupported screenshot MIME and oversize upload policy errors.

Existing server tests to keep green and adjust only for imports/ownership:

```text
rtk pnpm --filter server test -- capture-session.service capture-session.routes
rtk pnpm --filter server test -- capture-event.service capture-event.routes
rtk pnpm --filter server test -- capture-asset.service capture-asset.routes
```

Contract tests:

```text
rtk pnpm --filter @repo/types test -- capture
rtk pnpm --filter @repo/types check-types
```

Extension tests if extension types/API imports change:

```text
rtk pnpm --filter extension check-types
rtk pnpm --filter extension test -- api App automatic-capture content-click-capture
```

Web tests if web type/API imports change:

```text
rtk pnpm --filter web check-types
rtk pnpm --filter web test -- CaptureSessionDetailPage ProjectCaptureSessionListPage api
```

Database tests:

- Not required if only pure policy extraction and route/schema imports change.
- Required if repository queries, transactions, migrations, persisted values, file metadata writes, or DB completion/update behavior changes.

If required, run focused DB tests:

```text
rtk pnpm --filter server test:db
```

Do not fake DB success. If the DB environment is unavailable, record the exact command and failure in this plan.

## Verification Commands

Minimum verification after implementation:

```text
rtk pnpm --filter @repo/capture-domain test
rtk pnpm --filter @repo/capture-domain check-types
rtk pnpm --filter @repo/capture-domain lint
rtk pnpm --filter @repo/capture-domain build
rtk pnpm --filter @repo/types test -- capture
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter server test -- capture-session.service capture-session.routes capture-event.service capture-event.routes capture-asset.service capture-asset.routes
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter extension check-types
rtk pnpm --filter extension test -- api App automatic-capture content-click-capture
rtk pnpm --filter web check-types
rtk pnpm check-types
rtk git diff --check
```

Add if source files or package config require it:

```text
rtk pnpm --filter extension lint
rtk pnpm --filter web lint
rtk pnpm --filter server build
```

## Agent-Browser Validation Requirements

This phase should not require browser validation by default because it is intended to move pure domain policy logic and shared type imports without changing rendered UI or extension/browser control flow.

Use `agent-browser` if implementation changes any runtime browser behavior, extension workflow, fetch path, route behavior observable from the browser, upload flow, event ordering flow, or rendered component.

If browser validation becomes required, validate at minimum:

- Web capture session list still loads for a project.
- Web manual capture session detail still displays metadata, events, and asset previews.
- Web manual screenshot upload still creates an asset and linked capture event.
- Web manual event reorder still sends the full event order and reloads detail.
- Extension popup still logs in with instance-first login, starts an extension capture, uploads a screenshot, records click/capture events, completes the capture, clears active local state, and opens the portal detail route.

Do not make visual assertions beyond confirming behavior remains stable and there are no obvious runtime errors.

## Handoff Notes

- Keep the first implementation commit focused on creating `@repo/capture-domain` with tests and pure policy functions.
- Wire one server module at a time: session, then event, then asset.
- Do not collapse server services into the domain package. Server services should continue orchestrating repository calls, auth scope, transactions, storage, and route-facing errors.
- Keep server route error response types and messages stable.
- Avoid broad frontend changes. Web should only change if shared type exports require it. Extension should only replace local capture DTOs where it does not widen extension behavior.
- If extracting a policy changes behavior, stop and update this plan before proceeding.
- If capture asset schema sharing becomes larger than expected, split it into a follow-up plan instead of mixing route multipart behavior into this domain extraction.
- Carry forward to `093-guide-domain-extraction.md`: capture remains source material only; guide/demo generation must continue to happen through explicit existing user actions, not capture completion.

## Explicit Non-Scope

- No guide auto-generation.
- No interactive-demo auto-generation.
- No HTML replay implementation.
- No raw typed input persistence.
- No extension UI redesign.
- No web UI redesign.
- No route URL changes.
- No public viewer changes.
- No auth/session package extraction.
- No project/setup/organization domain package extraction.
- No file storage adapter extraction.
- No database schema migration.
- No changes to guide or interactive-demo editor behavior.

## Completion Checklist

- [ ] Worktree checked before implementation.
- [ ] Current `091` completion notes reread.
- [ ] Current master plan reread.
- [ ] Existing capture session/event/asset services and routes inspected.
- [ ] `@repo/capture-domain` package created with tests.
- [ ] Session policies extracted and wired.
- [ ] Event policies extracted and wired.
- [ ] Asset policies extracted and wired.
- [ ] Existing route error `instanceof` mappings preserved or replaced with equally stable mapping helpers.
- [ ] Capture asset JSON schema gap closed or explicitly deferred.
- [ ] Extension local capture type duplication reduced or explicitly documented as intentionally narrowed.
- [ ] No auth/session/storage/SQL/Fastify internals moved into capture-domain.
- [ ] No route/API response behavior changed.
- [ ] No UI behavior changed.
- [ ] Focused verification completed.
- [ ] Browser validation completed or explicitly documented as not required.
- [ ] DB verification completed or explicitly documented as not required.

## Final Output Required

When executing this plan, report:

- files changed;
- domain policies added;
- server modules wired to `@repo/capture-domain`;
- shared schemas/types added or intentionally deferred;
- explicit confirmation that auth/session/storage/SQL behavior did not change;
- explicit confirmation that no UI behavior changed;
- verification commands run and results;
- browser validation result or reason it was not required;
- DB verification result or reason it was not required;
- leftovers for `093-guide-domain-extraction.md`.
