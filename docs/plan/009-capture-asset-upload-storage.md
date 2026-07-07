# Capture Asset Upload Storage Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Add backend upload and local storage support for screenshot capture assets:

```text
authenticated session
  -> project
  -> capture session
  -> upload screenshot bytes
  -> file metadata
  -> capture asset metadata
```

This moves capture assets from metadata-only records to real source material that can be inspected, linked from capture events, and later used by guide/demo generation.

## Why This Comes Next

Current state:

- projects exist
- capture sessions exist
- capture asset metadata exists
- file metadata exists
- capture events exist and can reference capture assets
- no endpoint accepts screenshot bytes
- no storage adapter writes files
- no endpoint serves stored screenshots

Risk if skipped:

- the Chrome extension has nowhere to send screenshots
- capture events can reference asset metadata, but users cannot inspect the screenshot
- guide/demo generation would not have actual image bytes
- local/self-host use remains incomplete
- later storage adapters would be forced into route code without a provider boundary

This slice should create the storage boundary and the first local provider. It should not build extension capture, object storage, image processing, thumbnails, redaction, guide generation, or demo generation yet.

No new database table should be needed in this slice. Reuse:

```text
file_schema.file
capture_schema.capture_asset
```

If implementation discovers a genuinely missing persistence field, stop and update this plan before adding a migration.

## Existing Decisions To Honor

Relevant ADRs:

```text
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
```

Important implications:

- `file_schema.file` owns storage facts
- `capture_schema.capture_asset` owns product meaning
- storage keys must not be exposed publicly
- screenshot is the MVP upload type
- original capture source records should not be mutated after creation except soft delete/audit fields
- redaction creates derived assets later, not overwrites
- AI is not part of this slice

## Scope

Included:

- local filesystem storage provider
- backend storage service boundary
- app-level multipart configuration cleanup for route-controlled uploads
- multipart screenshot upload endpoint under capture sessions
- byte validation before metadata persistence
- checksum calculation
- local logical storage key generation
- file metadata row creation
- capture asset metadata row creation
- screenshot read endpoint for authenticated users
- project/session/asset scoping
- public API responses that do not expose storage keys or local paths
- DB-backed API tests through Fastify
- filesystem cleanup on failed DB write
- metadata cleanup behavior remains soft delete only

Excluded:

- Chrome extension implementation
- bulk upload
- resumable upload
- direct-to-object-storage upload
- S3/R2/MinIO adapters
- signed upload URLs
- public unauthenticated asset URLs
- thumbnail generation
- image dimension extraction if it requires non-trivial image processing
- image redaction
- HTML snapshot upload/replay
- guide generation
- interactive demo generation
- analytics

## Storage Model

### Storage Provider Boundary

Add a small local storage abstraction, likely under:

```text
apps/server/src/modules/file-storage/
```

Recommended files:

```text
file-storage.service.ts
local-file-storage.provider.ts
file-storage.config.ts
file-storage.service.test.ts
local-file-storage.provider.test.ts
```

Recommended interface:

```ts
type StoredFile = {
  storage_provider: "local";
  storage_key: string;
  size_bytes: number;
  checksum_sha256: string;
};

type FileStorageProvider = {
  put: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    file_id: string;
    file_name: string;
    mime_type: string;
    stream: NodeJS.ReadableStream;
  }) => Promise<StoredFile>;
  get: (input: {
    storage_key: string;
  }) => Promise<{
    stream: NodeJS.ReadableStream;
    size_bytes: number;
  }>;
  delete_best_effort: (input: {
    storage_key: string;
  }) => Promise<void>;
};
```

Notes:

- Keep the provider narrow.
- Do not leak absolute paths outside the provider.
- `storage_key` should be logical and relative, not a local absolute path.
- The local provider can map a logical key to a path internally.
- Let the capture asset service/repository provide the `file_id` so DB metadata and storage key can stay aligned.
- Future object storage providers should be able to implement the same boundary.

### Local Storage Root

Recommended environment variable:

```text
DEMO_COMPOSER_LOCAL_STORAGE_ROOT
```

Recommended default:

```text
./storage
```

For tests:

```text
DEMO_COMPOSER_LOCAL_STORAGE_ROOT = temporary test directory
```

Storage layout recommendation:

```text
{root}/organizations/{organization_id}/projects/{project_id}/capture-sessions/{capture_session_id}/{file_id}.{ext}
```

Logical storage key recommendation:

```text
organizations/{organization_id}/projects/{project_id}/capture-sessions/{capture_session_id}/{file_id}.{ext}
```

Security requirements:

- normalize and validate storage keys before reading
- reject path traversal
- never accept a client-provided local path
- never return absolute local paths from APIs

## API Contract

All routes require:

```text
demo_composer_session cookie
```

All routes use auth-derived context:

```text
organization_id = auth.organization.id
actor_org_user_id = auth.org_user.id
```

### Upload Screenshot Capture Asset

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
```

Request:

```text
multipart/form-data
```

Fields:

```text
file: required binary screenshot
width: optional positive integer
height: optional positive integer
device_pixel_ratio: optional positive number
page_url: optional string
page_title: optional string
captured_at: optional ISO datetime
metadata: optional JSON string
```

Behavior:

- verifies project belongs to current organization and is not deleted
- verifies capture session belongs to project/current organization and is not deleted
- accepts only screenshot upload in this slice
- accepts only image MIME types
- recommended MIME allowlist: `image/png`, `image/jpeg`, `image/webp`
- enforces max upload size
- generates file/capture asset IDs server-side
- writes bytes through local storage provider
- computes SHA-256 checksum while writing
- creates `file_schema.file` row with storage metadata
- creates `capture_schema.capture_asset` row with screenshot metadata
- records current org user as creator/updater
- if DB insert fails after file write, deletes the written file best-effort
- if request validation fails before storage write, no local file should be left behind
- returns the existing public capture asset shape
- does not expose `storage_key`, absolute path, file metadata JSON, or delete internals

Recommended max size:

```text
DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES default 10485760
```

Success:

```text
201 Created
```

Response:

```json
{
  "capture_asset": {
    "id": "capture_asset_id",
    "organization_id": "organization_id",
    "project_id": "project_id",
    "capture_session_id": "capture_session_id",
    "file": {
      "id": "file_id",
      "storage_provider": "local",
      "mime_type": "image/png",
      "size_bytes": 123456,
      "original_name": "screenshot.png",
      "checksum_sha256": "hex"
    },
    "asset_type": "screenshot",
    "width": 1440,
    "height": 900,
    "device_pixel_ratio": 1,
    "page_url": "https://example.internal/app/department",
    "page_title": "Department",
    "captured_at": "2026-06-05T00:00:00.000Z",
    "created_by_id": "org_user_id",
    "updated_by_id": "org_user_id",
    "version": 1,
    "created_at": "2026-06-05T00:00:00.000Z",
    "updated_at": "2026-06-05T00:00:00.000Z"
  }
}
```

### Read Screenshot Capture Asset

```text
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/file
```

Behavior:

- verifies auth
- verifies project/session/asset scope
- verifies capture asset and file are not soft-deleted
- supports `storage_provider = local` only in this slice
- reads bytes through storage provider
- streams file bytes
- sets `Content-Type` from file metadata
- sets `Content-Length` when known
- sets conservative cache headers for authenticated source material
- does not expose storage key

Recommended response headers:

```text
Content-Type: image/png
Content-Length: 123456
Cache-Control: private, max-age=300
```

Missing/deleted/cross-org asset:

```text
404 capture_asset_not_found
```

Missing local file bytes:

```text
404 file_bytes_not_found
```

Unsupported storage provider:

```text
400 unsupported_file_storage_provider
```

Reasoning:

- asset metadata can exist even if local bytes are missing due to manual filesystem cleanup or disk issues
- this should be distinguishable from an asset that does not exist

## Error Contract

Use the same stable response shape as current routes:

```json
{
  "error": {
    "type": "error_type",
    "message": "Human readable message"
  }
}
```

Suggested errors:

```text
401 unauthenticated
400 invalid_capture_asset_upload
400 unsupported_capture_asset_upload_type
400 upload_file_required
413 upload_too_large
404 project_not_found
404 capture_session_not_found
404 capture_asset_not_found
404 file_bytes_not_found
400 unsupported_file_storage_provider
409 file_storage_key_conflict
500 file_storage_write_failed
```

Messages:

```text
Authentication is required
Capture asset upload is invalid
Only screenshot image uploads are supported
A screenshot file is required
Screenshot upload is too large
Project was not found
Capture session was not found
Capture asset was not found
Stored file bytes were not found
Only local file storage is supported in this slice
File storage key already exists
File storage write failed
```

## Domain And Module Shape

Recommended option:

- extend `apps/server/src/modules/capture-asset/`
- add upload/read methods there
- add a separate `file-storage` module for byte storage provider

Reasoning:

- capture asset owns product meaning and route scope
- file-storage owns byte IO only
- file metadata remains in `file_schema.file`
- no new product domain is needed for upload itself

Recommended new capture asset service methods:

```text
upload_capture_asset
get_capture_asset_file
```

Recommended capture asset repository additions:

```text
create_uploaded_capture_asset
find_capture_asset_file
```

`find_capture_asset_file` is internal-only and may return storage details:

```ts
type CaptureAssetFileRecord = {
  capture_asset: CaptureAsset;
  storage_provider: "local" | "external";
  storage_key: string;
  mime_type: string;
  size_bytes: number;
};
```

Route responses must still not expose `storage_key`.

Recommended storage service methods:

```text
put_file
get_file
delete_file_best_effort
```

## Multipart Handling

Current app already registers `@fastify/multipart`, but it also has an `onFile` hook that writes incoming files to a temp folder globally.

Before implementation, inspect current multipart behavior carefully.

Current risk:

- `onFile` writes every uploaded file to `./${common_temp_folder}` before route code can validate business scope.
- This can leave temp files for unauthenticated, invalid, unsupported, or too-large requests.
- It makes checksum/final storage harder to reason about because bytes may be written twice.

Recommended direction for this slice:

- remove the global `onFile` temp-write behavior from `app.ts`
- configure multipart with limits only
- use route-level multipart parsing for upload storage
- route/service should control validation, checksum, and final storage location
- avoid storing duplicate temp files long term

Important:

- Do not break existing routes accidentally.
- Search for existing reliance on `part.filepath`, `generated_file_name`, `file_extension`, and `file_id` before removing the hook.
- If another route still depends on those temp fields, either migrate that route in the same small slice or defer upload storage until the global multipart behavior is isolated.
- Add regression tests proving invalid upload requests do not leave files in the configured storage root.

## Validation Recommendations

Route-level validation:

- request must contain exactly one uploaded file field named `file`
- file must have a non-empty filename
- MIME type must be allowed
- metadata string, if present, must parse as JSON object
- width/height positive integers when present
- device pixel ratio positive when present
- captured_at valid datetime when present

Service-level validation:

- project/session scope
- file size max
- MIME allowlist
- storage provider result has expected fields
- checksum is SHA-256 hex
- no storage key from client

Storage-level validation:

- safe logical key generation
- path traversal prevention
- atomic-ish write behavior where possible
- parent directory creation
- best-effort delete on rollback/failure

## Filesystem Failure Behavior

Upload flow should be:

```text
validate request
verify project/session scope
write bytes to storage provider
create DB metadata rows
return public asset
```

If storage write fails:

```text
return 500 file_storage_write_failed
do not create DB rows
```

If DB write fails after storage write:

```text
delete file best-effort
return mapped DB/domain error
```

If best-effort cleanup fails:

```text
do not hide the original error
log cleanup failure later when logging exists
```

## TDD Sequence

### 1. Storage Service Tests

Add tests for local provider:

- writes bytes under configured root
- returns logical storage key, size, and SHA-256 checksum
- uses caller-provided server-side `file_id` in the generated key
- creates parent directories
- rejects path traversal on read
- reads stored bytes back
- best-effort delete removes stored bytes
- missing file maps to `FileBytesNotFoundError`

Expected RED:

- storage module does not exist

### 2. Capture Asset Service Tests

Add tests for:

- upload verifies project/session before storage write
- upload validates MIME and size
- upload calls storage provider
- upload creates file + capture asset metadata through repository
- upload deletes written bytes if DB creation fails
- upload does not write bytes if project/session validation fails
- upload does not write bytes for unsupported MIME or too-large file
- upload maps duplicate storage key
- read verifies project/session/asset scope
- read returns stream metadata without exposing storage key
- read maps missing bytes
- read rejects non-local storage provider with a stable error

Expected RED:

- upload/read methods do not exist

### 3. Route Tests

Add route tests for:

- auth required on upload/read
- multipart upload creates screenshot asset
- invalid/missing file returns stable errors
- unsupported MIME returns stable error
- too-large file returns 413
- client-supplied storage fields are ignored/rejected
- read streams bytes with correct headers
- domain errors map to stable error responses

Expected RED:

- upload/read routes do not exist

### 4. DB-Backed API Integration Tests

Add DB-backed Fastify test for:

- setup owner
- create project
- create capture session
- upload PNG bytes
- assert `file_schema.file` row has local provider, logical key, MIME, size, checksum
- assert `capture_schema.capture_asset` row exists
- assert generated storage key is not an absolute path
- public upload response omits storage key and metadata
- read endpoint returns exact bytes and content type
- missing/deleted project/session/asset returns stable errors
- soft-deleted asset cannot be read
- non-local file metadata returns `unsupported_file_storage_provider`
- invalid upload request does not leave final storage bytes behind
- DB failure cleanup test where feasible with injected fake storage/repository

Expected RED:

- upload/read API does not exist

### 5. Implementation

Implement in this order:

1. inspect multipart usage and remove/isolate global temp-write hook safely
2. local storage provider and tests
3. capture asset service upload/read methods
4. capture asset repository additions
5. upload/read routes
6. app/storage dependency wiring
7. DB-backed tests

Keep commits small.

## Configuration

Recommended config values:

```text
DEMO_COMPOSER_LOCAL_STORAGE_ROOT=./storage
DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES=10485760
```

Testing:

- use a temp directory per test file or test case
- cleanup temp directories after tests
- do not write test files into repo storage paths
- override storage root via injected config/service where possible instead of mutating global process env mid-test

Production/self-host:

- document that local storage must be backed up with the database
- document that deleting files manually can break read endpoints
- object storage adapter can come later

## Security Notes

- Never expose local absolute paths.
- Never trust filename for storage path.
- Preserve original filename only as metadata.
- Generate storage key server-side.
- Validate MIME type, but do not assume MIME alone proves file content.
- Do not serve files without auth and scope checks.
- Use conservative cache headers.
- Prevent path traversal on all storage reads.
- Avoid logging storage keys if they could reveal tenant structure.

## Open Questions To Revisit Later

Do not block this slice on these:

- Should we inspect image headers to verify actual image type?
- Should we extract width/height server-side instead of trusting client values?
- Should we generate thumbnails during upload?
- Should storage keys include content hashes?
- Should reads become signed URLs for published assets?
- Should local storage support retention cleanup?
- Should object storage be implemented before extension MVP?

## Verification Commands

Run focused tests first:

```bash
rtk pnpm --filter server test -- src/modules/file-storage/file-storage.service.test.ts src/modules/capture-asset/capture-asset.service.test.ts src/modules/capture-asset/capture-asset.routes.test.ts
```

Run DB tests:

```bash
rtk pnpm --filter server test:db
```

Run full server checks:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
```

## Commit Plan

Recommended commits:

```text
docs: add capture asset upload storage plan
feat: add local file storage provider
feat: add capture asset upload api
feat: add capture asset file read api
test: harden capture asset upload storage
```

## Done Definition

This plan is complete when:

- screenshot bytes can be uploaded under a capture session
- local storage provider writes and reads bytes
- upload creates file metadata and capture asset metadata
- upload response uses existing safe public capture asset shape
- read endpoint streams stored screenshot bytes with correct content type
- storage keys and absolute paths are never exposed
- project/session/asset auth scope is enforced
- cleanup happens best-effort when DB persistence fails after file write
- DB-backed tests prove upload/read behavior
- full server tests, DB tests, typecheck, and lint pass
