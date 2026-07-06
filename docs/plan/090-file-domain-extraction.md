# File Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Completed and post-implementation audited on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `090` of the shared contracts and domainization track.

## Objective

Move reusable file metadata and screenshot-upload policy into `@repo/file-domain` while preserving the current capture asset API, storage behavior, database shape, and UI behavior.

This phase should create the first real domain package only because there is concrete behavior to move:

- file metadata normalization and validation;
- screenshot upload MIME policy;
- upload-size decision helpers;
- file-domain error codes/status hints for file policy failures;
- framework-agnostic repository interfaces only if the extracted behavior needs persistence contracts.

Raw storage adapters, SQL implementations, Fastify multipart handling, auth/session lookup, and capture asset product rules stay in `apps/server`.

## Completion Summary

Completed on 2026-07-07.

Implementation commit:

- `24d70d8 feat(file-domain): extract file metadata policies`

What changed:

- Created `@repo/file-domain` with framework-agnostic file metadata and screenshot upload policy.
- Added file-domain tests for metadata normalization, required string validation, optional string compaction, supported storage-provider validation, non-negative integer size validation, image metadata validation, supported screenshot MIME types, and upload size limits.
- Added file-domain package scripts, package config, TypeScript config, ESLint config, README, and workspace lockfile wiring.
- Added `@repo/file-domain` as a server dependency.
- Updated capture asset service to delegate file metadata normalization and screenshot upload MIME/size checks to `@repo/file-domain`.
- Preserved existing capture asset route-local error classes and `instanceof` route mappings by translating file-domain policy errors back to existing server errors.
- Did not create repository interfaces because this phase moved pure policy only; SQL/file record creation remains a server adapter concern.
- Did not change shared constants, shared API DTOs, routes, database migrations, raw storage adapters, guide upload code, web code, or extension code.

Verification passed:

- `rtk pnpm --filter @repo/file-domain test`
- `rtk pnpm --filter @repo/file-domain lint`
- `rtk pnpm --filter @repo/file-domain check-types`
- `rtk pnpm --filter @repo/file-domain build`
- `rtk pnpm --filter server test -- capture-asset.service`
- `rtk pnpm --filter server test -- capture-asset.routes`
- `rtk pnpm --filter server test -- capture-asset.service capture-asset.routes`
- `rtk pnpm --filter server check-types`
- `rtk pnpm --filter server lint`
- `rtk pnpm check-types`

Browser validation:

- Not run. This phase did not touch `apps/web`, `apps/extension`, rendered upload controls, client-side validation, route behavior, or browser-visible messaging.

Leftovers for later plans:

- `092-capture-domain-extraction.md` should continue separating capture asset product meaning from file metadata policy.
- `093-guide-domain-extraction.md` should decide whether duplicated multipart field parsing in guide screenshot upload should be shared or stay route-local.
- `097-web-shared-contract-consumption.md` and `098-extension-shared-contract-consumption.md` can decide whether screenshot MIME constants should become cross-app constants. This phase kept the screenshot MIME allow-list domain-local because no frontend/extension imports were introduced.
- Future file storage provider work should keep local filesystem/object-storage adapter details outside `@repo/file-domain`.
- `091-project-identity-setup-organization-contract-cleanup.md` has no direct file-domain implementation dependency. If that phase touches capture asset ownership, project scoping, organization scoping, or setup-created ownership records, keep auth/session/org-user permission context in server or the relevant identity/project domain and keep `@repo/file-domain` limited to file metadata and upload policy.

## Completion Checklist

- [x] Worktree checked before implementation.
- [x] Baseline searches run.
- [x] `@repo/file-domain` created with real moved policy behavior.
- [x] File metadata normalization/validation moved into file-domain policy.
- [x] File storage provider and file size validation moved into file-domain policy.
- [x] Screenshot upload MIME and declared-size policy moved into file-domain policy.
- [x] Capture asset service delegates to file-domain policy helpers.
- [x] Existing capture asset API error codes/statuses preserved through server error translation.
- [x] Raw storage adapter stayed in `apps/server`.
- [x] SQL and database row mapping stayed in `apps/server`.
- [x] No file-domain repository interface created because no persistence-facing command/query moved.
- [x] No shared constants/types changed.
- [x] No frontend, extension, UI, browser, database, route URL, auth, or permission behavior changed.
- [x] Focused verification completed.
- [x] Browser validation explicitly not required.

## Implementation Log

- 2026-07-07: Added failing file-domain policy tests before production policy code.
- 2026-07-07: Verified the tests failed first because the target policy modules were missing.
- 2026-07-07: Implemented file-domain errors, types, file metadata policy, screenshot upload policy, package exports, and package config.
- 2026-07-07: Wired capture asset service to call file-domain policy helpers while keeping route-facing server error classes stable.
- 2026-07-07: Added server dependency and lockfile wiring for `@repo/file-domain`.
- 2026-07-07: Ran focused package/server verification and workspace typecheck.
- 2026-07-07: Post-implementation audit found missing domain-side validation for unsupported `storage_provider` values and invalid `size_bytes`.
- 2026-07-07: Added failing file-domain tests for unsupported storage providers and negative/non-integer sizes, verified they failed, then updated file metadata policy to reject those inputs with `InvalidFileMetadataError`.
- 2026-07-07: Relabeled the original codebase baseline as pre-implementation context so the completed plan does not claim domain packages are still absent.

## Baseline From Completed 089

Plan `089` completed and audited the domain package convention phase.

Rules from `089` that this phase must follow:

- Create a domain package only when real behavior moves into it.
- Use folders such as `policies/`, `errors/`, `types/`, and `__tests__/` only when files belong there.
- Keep domain packages framework-agnostic.
- Domain packages must not import Fastify, React, app code, database clients, storage SDKs, cookies, sessions, or raw HTTP request objects.
- `@repo/types` owns public/shared API DTOs. Domain packages own domain-local command/query inputs, policy inputs/results, repository interfaces, and domain read models.
- Server adapters translate domain errors to existing API response bodies and status codes.
- Preserve the existing route error body shape `{ error: { type, message } }` for domain-like route errors.
- Do not convert global Fastify/Zod validation errors to the domain error envelope.
- `unauthenticated` remains server-owned unless a later auth-domain plan changes that.

Carryover from `089` for this phase:

- Preserve capture asset/file upload error codes and statuses, especially `upload_too_large`, `file_bytes_not_found`, `unsupported_file_storage_provider`, `file_storage_write_failed`, and `file_storage_key_conflict`.
- Keep raw storage adapters in `apps/server`.
- Expose only file-domain repository interfaces/policies from any domain package.

## Pre-Implementation Codebase Baseline

At implementation start, no domain packages existed. After this phase, `packages/file-domain` exists and owns pure file metadata normalization/validation plus screenshot upload MIME/declared-size policy.

At implementation start, file/capture implementation lived in:

```text
apps/server/src/modules/file-storage/local-file-storage.provider.ts
apps/server/src/modules/file-storage/local-file-storage.provider.test.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/capture-asset/capture-asset.repository.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-asset/capture-asset.service.test.ts
apps/server/src/modules/capture-asset/capture-asset.routes.test.ts
apps/server/src/modules/capture-asset/capture-asset.db.integration.test.ts
apps/server/src/modules/capture-asset/capture-asset.app.integration.test.ts
apps/server/src/db/migrations/003_capture_asset_metadata_schema.sql
apps/server/src/db/foundation-schema.db.integration.test.ts
```

Guide screenshot upload delegated, and still delegates, to capture asset upload and duplicates multipart field parsing in:

```text
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
```

Shared packages already included at implementation start:

```text
packages/constants/src/file.ts
packages/types/src/capture.ts
```

File constants already present before implementation:

- `CAPTURE_ASSET_TYPES`
- `FILE_STORAGE_PROVIDERS`

Shared API contracts already present before implementation:

- `CaptureAssetFileSchema`
- `CaptureAssetSchema`
- `CaptureAssetWithFileUrlSchema`
- capture asset response/list response schemas in `packages/types/src/capture.ts`

Pre-implementation server-only file policies in `capture-asset.service.ts` that this phase moved or preserved:

- create JSON capture assets currently only support `asset_type: "screenshot"`;
- create JSON capture asset file `mime_type` must be non-empty and start with `image/`;
- upload capture asset MIME type must be one of `image/png`, `image/jpeg`, `image/webp`;
- upload max size defaults to `10 * 1024 * 1024` and is wired from `DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES` through app config;
- upload declared size larger than max raises `UploadTooLargeError`;
- local storage provider size overflow raises `FileStorageUploadTooLargeError`, which capture asset service maps to `UploadTooLargeError`;
- unsupported stored file provider during file read raises `UnsupportedFileStorageProviderError`;
- duplicate active storage key per organization raises `FileStorageKeyConflictError` from repository unique constraint handling.

Raw storage behavior in `local-file-storage.provider.ts` that remains server-owned:

- only local storage provider writes bytes;
- storage keys are generated under organization/project/capture-session paths;
- unsafe storage keys are rejected internally;
- MIME-to-extension mapping exists for `image/png`, `image/jpeg`, and `image/webp`;
- file bytes are read from the configured local root;
- provider-specific filesystem paths are not exposed in API responses.

## Required Source Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/plan/089-domain-package-conventions-and-error-mapping.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0020-domain-package-conventions-and-error-mapping.md
```

Before implementation, run:

```text
rtk git status --short
rtk rg "storage_provider|storage_key|mime_type|size_bytes|checksum_sha256|capture_asset" apps/server/src/modules apps/server/src/db packages
rtk rg "image/png|image/jpeg|image/webp|upload_too_large|file_storage_write_failed|file_storage_key_conflict" apps packages
rtk rg "UploadTooLargeError|UnsupportedCaptureAssetUploadTypeError|InvalidCaptureAssetUploadError|FileStorage" apps/server/src/modules
```

Record any uncommitted work from other agents that touches affected docs, shared packages, server capture asset, guide upload, file storage, or package metadata files. Do not overwrite or revert unrelated work.

## Implementation Scope

Included:

- Create `@repo/file-domain` with real policy behavior and tests.
- Move pure file metadata normalization/validation out of `capture-asset.service.ts` into `@repo/file-domain`.
- Move screenshot upload MIME policy out of `capture-asset.service.ts` into `@repo/file-domain`.
- Add file-domain error classes or a `DomainError`-compatible shape following `089`.
- Update capture asset service to call file-domain policy helpers.
- Preserve route-local error mapping and existing API error codes/statuses.
- Add package scripts and dependencies needed for `@repo/file-domain` verification.
- Update server package dependency wiring only when imports are introduced.
- Add or reuse shared constants only when they pass the reuse gate.
- Update this plan after implementation with status, checklist, implementation log, verification notes, and leftovers.
- Update the parent master plan only for the completed `090` phase.

Explicit non-scope:

- No UI redesign, layout, copy, style, or visible behavior changes.
- No route URL, method, request body, response body, or error envelope changes.
- No database schema or migration changes.
- No storage provider replacement.
- No object storage/S3/provider SDK work.
- No movement of local filesystem storage adapter into `@repo/file-domain`.
- No movement of SQL implementations or database row types into `@repo/file-domain`.
- No auth/session or permission behavior changes.
- No capture-domain lifecycle extraction.
- No guide-domain extraction.
- No broad server adapter thinning beyond the capture asset file-policy call sites needed here.
- No conversion of every route-local error mapper to a generic helper.
- No movement of `@repo/types` public API DTOs into `@repo/file-domain`.
- No frontend or extension edits unless the plan is amended first with exact files and browser/consumer validation.

## Exact Affected Files

Expected domain package files:

```text
packages/file-domain/package.json
packages/file-domain/tsconfig.json
packages/file-domain/README.md
packages/file-domain/src/index.ts
packages/file-domain/src/errors/file-domain-error.ts
packages/file-domain/src/policies/file-metadata-policy.ts
packages/file-domain/src/policies/screenshot-upload-policy.ts
packages/file-domain/src/types/file-metadata.ts
packages/file-domain/src/__tests__/file-metadata-policy.test.ts
packages/file-domain/src/__tests__/screenshot-upload-policy.test.ts
```

Optional domain repository files only if implementation moves a real persistence-facing file command/query into the package:

```text
packages/file-domain/src/repositories/file-metadata-repository.ts
packages/file-domain/src/__tests__/file-metadata-repository.contract.test.ts
```

Do not create repository files for placeholder compliance. If this phase only extracts pure metadata/upload policy, record that no repository interface was needed because SQL/file record creation remains a server adapter concern.

Expected server files:

```text
apps/server/package.json
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/capture-asset/capture-asset.service.test.ts
apps/server/src/modules/capture-asset/capture-asset.routes.test.ts
apps/server/src/modules/capture-asset/capture-asset.db.integration.test.ts
```

Expected lockfile:

```text
pnpm-lock.yaml
```

Touch only if shared constants are added after confirming the reuse gate:

```text
packages/constants/src/file.ts
packages/constants/src/constants.test.ts
```

Touch only if implementation deliberately removes duplicated multipart upload parsing or needs guide upload regression coverage:

```text
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
```

Do not touch by default:

```text
apps/web/src/**
apps/extension/src/**
packages/types/src/capture.ts
apps/server/src/db/migrations/003_capture_asset_metadata_schema.sql
apps/server/src/modules/file-storage/local-file-storage.provider.ts
```

`packages/types/src/capture.ts` already owns selected capture asset API response DTOs. Do not move or duplicate those DTOs in this phase.

## Package Shape

Create `@repo/file-domain` only with folders that have real files:

```text
packages/file-domain/
  package.json
  tsconfig.json
  README.md
  src/
    index.ts
    errors/
      file-domain-error.ts
    policies/
      file-metadata-policy.ts
      screenshot-upload-policy.ts
    types/
      file-metadata.ts
    __tests__/
      file-metadata-policy.test.ts
      screenshot-upload-policy.test.ts
```

Suggested package scripts:

```json
{
  "lint": "eslint . --max-warnings 0",
  "test": "vitest run",
  "build": "tsup ./src/index.ts --format esm,cjs --dts",
  "check-types": "tsc --noEmit",
  "dev": "tsup ./src/index.ts --format esm,cjs --watch --dts",
  "clean": "rm -rf dist"
}
```

Expected dependencies:

- `@repo/constants`: only if file-domain consumes `FILE_STORAGE_PROVIDERS` or a new shared screenshot MIME constant.

Expected dev dependencies:

- `@repo/eslint-config`
- `@repo/typescript-config`
- `eslint`
- `typescript`
- `vitest`

Do not add `zod` unless implementation chooses runtime schemas inside the domain package. Prefer simple typed policy functions unless Zod materially reduces risk.

## Schemas And Types

Domain-local types should model file policy inputs/results, not public API responses.

Expected domain types:

```ts
import type { FileStorageProvider } from "@repo/constants";

export type FileMetadataInput = {
  storage_provider?: FileStorageProvider;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  original_name?: string | null;
  checksum_sha256?: string | null;
  metadata?: unknown;
};

export type NormalizedFileMetadata = {
  storage_provider: FileStorageProvider;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  original_name?: string | null;
  checksum_sha256?: string | null;
  metadata?: unknown;
};

export type ScreenshotUploadFileInput = {
  mime_type: string;
  declared_size_bytes?: number;
};
```

Policy functions should be pure:

```ts
normalize_file_metadata(input: FileMetadataInput): NormalizedFileMetadata
assert_supported_screenshot_upload_mime_type(mime_type: string): string
assert_upload_size_within_limit(input: {
  declared_size_bytes?: number;
  max_upload_bytes: number;
}): void
```

Rules:

- Preserve compact string behavior from `capture-asset.service.ts`: trim strings, convert empty optional strings to `null`, reject missing required strings.
- Preserve default `storage_provider: "local"` when omitted.
- Preserve current create JSON behavior where file `mime_type` must be a non-empty image MIME type.
- Preserve upload behavior where only `image/png`, `image/jpeg`, and `image/webp` are supported.
- Preserve upload size behavior for declared sizes and storage-stream overflows.
- Do not export database row types.
- Do not export Fastify multipart field types.
- Do not duplicate `CaptureAssetSchema` or `CaptureAssetFileSchema` from `@repo/types`.

## Repository Ownership

The master plan says file-domain should define file repository interfaces. For this child plan, that must be interpreted through the `089` convention: add interfaces only when real behavior needs them.

Default expected outcome:

- no file-domain repository interface is created;
- `capture-asset.repository.ts` continues to own SQL for `file_schema.file` plus `capture_schema.capture_asset`;
- `local-file-storage.provider.ts` continues to own byte storage;
- file-domain owns pure policy only.

Create `FileMetadataRepository` only if implementation moves a command/query that needs persistence into `@repo/file-domain`. If created, it must:

- use domain terms such as `create_file_metadata` or `find_file_metadata`;
- accept one input object per method;
- hide SQL, table names, constraints, storage roots, and provider SDK details;
- return domain records, not database rows;
- keep concrete implementations in `apps/server`.

## Constants

`FILE_STORAGE_PROVIDERS` already exists in `@repo/constants`.

If implementation adds a shared screenshot upload MIME list, use a file-domain/product name such as:

```ts
export const SCREENSHOT_UPLOAD_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export type ScreenshotUploadMimeType = (typeof SCREENSHOT_UPLOAD_MIME_TYPES)[number];
```

Only add this if at least server plus another active package consumes it during this phase, or if the implementation documents a concrete drift risk. If only `@repo/file-domain` consumes the MIME list, keep it domain-local.

Do not move local storage path segments, database schema/table names, environment variable names, or UI labels into `@repo/constants`.

## Domain Error Rules

Use typed errors that can be mapped by the existing server route mapper.

Recommended file-domain errors:

```text
InvalidFileMetadataError -> invalid_capture_asset, 400 when used by capture asset create
UnsupportedScreenshotUploadMimeTypeError -> unsupported_capture_asset_upload_type, 400
UploadTooLargeError -> upload_too_large, 413
UnsupportedFileStorageProviderError -> unsupported_file_storage_provider, 400
```

Notes:

- It is acceptable for the server adapter to continue exporting route-specific `Error` subclasses if changing class names would create churn. The important outcome is that the file policy logic is in `@repo/file-domain`.
- If file-domain error classes are introduced, the server must either re-export/alias them from `capture-asset.service.ts` or convert them to the existing route-local error classes before they reach `handle_domain_error`. Do not break existing `instanceof` route mappings.
- Do not expose `details` or `cause` in API responses.
- Do not move `FileBytesNotFoundError`, `FileStorageWriteFailedError`, or `FileStorageKeyConflictError` into `@repo/file-domain` unless the implementation proves they are domain policy errors rather than storage/persistence adapter errors. By default they stay server-owned adapter failures and keep their current API mapping.
- Unknown errors must continue to be thrown to the global handler.

## Routes And API Contracts

No route URLs, HTTP methods, request shapes, response shapes, response statuses, or error envelope shapes may change.

Routes whose behavior must remain compatible:

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
GET /api/v1/projects/:project_id/capture-assets
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/file
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
POST /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload
```

API body/response contracts to preserve:

- JSON create capture asset accepts the existing `.passthrough()` body schema in `capture-asset.routes.ts`.
- Multipart upload keeps the same `file` field requirement.
- Multipart metadata parsing remains equivalent: missing/empty metadata is omitted, invalid JSON or non-object metadata returns `invalid_capture_asset_upload`.
- File response stream keeps `Content-Type`, `Content-Length`, and `Cache-Control: private, max-age=300`.
- Delete capture asset keeps `204` with no response body.
- Shared capture asset response schemas in `@repo/types` remain valid.

Error codes/statuses to preserve:

```text
unauthenticated: 401
project_not_found: 404
capture_session_not_found: 404
capture_asset_not_found: 404
unsupported_capture_asset_type: 400
invalid_capture_asset: 400
invalid_capture_asset_upload: 400
unsupported_capture_asset_upload_type: 400
upload_file_required: 400
upload_too_large: 413
file_bytes_not_found: 404
unsupported_file_storage_provider: 400
file_storage_write_failed: 500
file_storage_key_conflict: 409
```

Do not add new Fastify params validation in this phase. Route params may remain unvalidated at the Fastify schema layer; domain/server inputs should continue to use semantic names such as `capture_asset_id`.

## Behavior Rules

Preserve:

- File and Capture Asset separation.
- File metadata belongs to file-domain policy; capture asset product meaning remains capture-domain/server-local until capture-domain extraction.
- Stored files are referenced by `file_id`; API responses expose metadata and file URLs, not local filesystem paths.
- JSON create capture asset supports only `asset_type: "screenshot"` today.
- Project-level screenshot picker supports `screenshot` and `redacted_screenshot` as currently implemented.
- Upload accepts only PNG, JPEG, and WebP screenshots.
- Upload max size remains wired from server config and environment.
- Local storage provider still computes SHA-256 and generated storage keys.
- Storage key safety checks remain in `local-file-storage.provider.ts`.
- Duplicate storage key handling remains based on the database unique constraint.
- Best-effort cleanup after failed upload remains in capture asset service.
- Public guide/publish/demo behavior remains unchanged.

Do not:

- Move capture event privacy/redaction policy into file-domain.
- Move guide export ZIP behavior into file-domain.
- Move local filesystem path resolution into file-domain.
- Treat `external` storage as readable/writable unless existing behavior already supports it. Current file read of non-local stored files must continue to return `unsupported_file_storage_provider`.
- Broaden accepted MIME types.
- Change max upload defaults or environment variable names.

## Security And Permission Rules

- Preserve all existing auth requirements for capture asset and guide screenshot upload routes.
- Preserve organization/project scoping before reads, writes, uploads, and deletes.
- Do not pass session tokens, cookies, Fastify requests, or auth service objects into `@repo/file-domain`.
- Do not expose raw storage keys in public API responses beyond existing server-internal file read lookup behavior.
- Do not expose local filesystem paths.
- Do not log uploaded file contents, raw captured input values, passwords, session tokens, storage roots, or cookies.
- Keep unsafe storage key rejection in the server local storage provider.
- Preserve upload size protection for declared file size and streamed bytes.
- Preserve best-effort deletion of uploaded bytes when database creation fails after storage succeeds.
- Preserve current private cache headers on authenticated file reads.

## Migration And Backwards Compatibility

- No database migration is required.
- No persisted enum/string values may change.
- No route/API migration is required.
- Existing `file_schema.file` rows remain compatible.
- Existing local storage keys remain compatible.
- Existing capture asset, guide, publish, and interactive demo references to files remain compatible.
- Existing web upload error handling depends on `invalid_capture_asset_upload`, `upload_file_required`, and `upload_too_large`; those codes must remain byte-for-byte stable.
- Existing extension screenshot upload behavior must remain accepted.
- If package exports change unexpectedly, keep compatibility aliases in server code rather than forcing broad rewrites.

## Implementation Steps

1. Confirm the worktree is clean or identify unrelated changes to avoid.
2. Run the baseline searches listed above.
3. Create `packages/file-domain` with only the policy/type/error/test files needed for this phase.
4. Add package scripts and dependencies.
5. Implement pure file metadata and screenshot upload policy tests first.
6. Move compacting/defaulting/upload policy from `capture-asset.service.ts` to file-domain helpers.
7. Update `capture-asset.service.ts` to call file-domain helpers while preserving exported service types and route-facing errors where useful.
8. Keep `local-file-storage.provider.ts` server-local. Touch it only if tests prove a direct import of shared MIME constants is necessary and behavior remains identical.
9. Update capture asset service tests for moved policy behavior.
10. Run route tests to prove error mapping and response shapes are unchanged.
11. Run DB integration tests only if repository behavior or persistence constraint handling is touched.
12. Update this plan with implementation status/checklist/log/verification/leftovers.
13. Update the master plan only for completed `090` items.

## Test And Verification Plan

Domain package tests:

```text
rtk pnpm --filter @repo/file-domain test
rtk pnpm --filter @repo/file-domain lint
rtk pnpm --filter @repo/file-domain check-types
rtk pnpm --filter @repo/file-domain build
```

Domain tests must cover:

- normalizes valid file metadata with default `storage_provider: "local"`;
- trims required and optional strings;
- converts empty optional strings to `null`;
- rejects missing/blank required `storage_key`;
- rejects missing/blank required `mime_type`;
- preserves `metadata`;
- accepts supported screenshot upload MIME types case-insensitively only if current server behavior does so;
- rejects unsupported screenshot upload MIME types;
- rejects declared upload size over max bytes;
- allows omitted declared size;
- does not know Fastify, SQL, local paths, or storage SDKs.

Focused server tests:

```text
rtk pnpm --filter server test -- capture-asset.service
rtk pnpm --filter server test -- capture-asset.routes
```

Server tests must prove:

- create JSON capture asset still returns `invalid_capture_asset` for invalid file metadata;
- unsupported JSON create asset type still returns `unsupported_capture_asset_type`;
- multipart upload still returns `unsupported_capture_asset_upload_type` for unsupported MIME;
- upload too large still returns `upload_too_large` with status `413`;
- missing upload file still returns `upload_file_required`;
- file read of missing bytes still returns `file_bytes_not_found`;
- unsupported stored provider still returns `unsupported_file_storage_provider`;
- storage write failure still returns `file_storage_write_failed`;
- duplicate storage key still returns `file_storage_key_conflict`;
- file stream response headers remain unchanged.

If guide upload code is touched:

```text
rtk pnpm --filter server test -- guide.routes
```

If repository or DB behavior is touched:

```text
rtk pnpm --filter server test:db
```

If constants are touched:

```text
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/constants lint
rtk pnpm --filter @repo/constants build
```

Always run:

```text
rtk pnpm --filter server check-types
rtk pnpm check-types
```

## Agent-Browser Validation

Browser validation is not required if implementation stays within:

- `@repo/file-domain`;
- server capture asset service/routes/tests;
- server guide upload tests;
- shared constants without frontend imports;
- docs/plan updates.

If implementation touches `apps/web`, `apps/extension`, rendered upload controls, accepted file attributes, client-side validation, or browser-visible error messaging, stop and amend this plan first. The amended browser validation must include:

- web capture session manual screenshot upload flow;
- guide block screenshot upload flow if touched;
- extension screenshot capture upload flow if extension upload code is touched;
- screenshots or agent-browser assertions proving no visible UI/copy/layout behavior changed.

## Acceptance Criteria

- `@repo/file-domain` exists only with real moved file policy behavior.
- File-domain package is framework-agnostic and does not import app/server/browser infrastructure.
- File metadata policy and screenshot upload policy are covered by package tests.
- Capture asset service delegates file policy decisions to `@repo/file-domain`.
- Raw storage adapters remain in `apps/server`.
- SQL and database row mapping remain in `apps/server`.
- File and Capture Asset remain distinct concepts.
- Existing routes, request shapes, response shapes, status codes, and error envelopes are unchanged.
- Existing persisted file rows and local storage keys remain compatible.
- Existing web/extension behavior is unchanged.
- No UI/browser validation is skipped if browser-facing files are touched.
- This plan and the master plan are updated after implementation with accurate status and verification notes.

## Rollback And Containment Notes

- Keep the capture asset service as the server adapter boundary so file-domain policy imports can be reverted without route URL or database changes.
- If the new package causes broad dependency churn, keep the pure policy in server for this phase and document why package extraction is deferred.
- If route tests reveal changed error status/body, revert the server wiring and keep package tests until mapping is corrected.
- If storage provider behavior becomes tangled with filesystem paths or environment config, leave that behavior server-local and document the deferral.
- Do not partially migrate guide upload and capture asset upload to different policies; either preserve both current behaviors or leave guide upload untouched.

## Handoff Notes

- Start with policy tests in `@repo/file-domain`; do not begin by editing routes.
- Treat capture asset request/response DTOs as already owned by `@repo/types`.
- Treat `CAPTURE_ASSET_TYPES` and `FILE_STORAGE_PROVIDERS` as already owned by `@repo/constants`.
- The most important regression risk is error mapping. Preserve public `error.type` strings and statuses exactly.
- The second most important regression risk is uploaded byte cleanup after storage succeeds and DB insert fails.
- Leave guide/demo/publish file read/export behavior alone unless a focused test proves the file-domain policy call is required there.
- Carry unresolved MIME constant reuse into `097`/`098` if frontend/extension imports are intentionally deferred.

## Final Output Required

When executing this plan, report:

- files changed;
- package files created;
- file policies moved;
- server adapters changed;
- routes/API behavior preserved;
- error codes/statuses verified;
- tests run and results;
- browser validation status and reason;
- any leftovers for `092-capture-domain-extraction.md`, `093-guide-domain-extraction.md`, `097-web-shared-contract-consumption.md`, or `098-extension-shared-contract-consumption.md`.
