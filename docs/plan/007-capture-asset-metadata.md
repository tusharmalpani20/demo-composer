# Capture Asset Metadata Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Add backend metadata for stored files and capture assets:

```text
authenticated session
  -> project
  -> capture session
  -> capture asset metadata
  -> file metadata
```

This gives capture sessions real reusable source material without building binary upload, Chrome extension capture, event ingestion, guide generation, or interactive demo generation yet.

## Why This Comes Next

Current state:

- projects exist and are soft-deletable
- capture sessions exist under projects
- capture sessions are organization-scoped and project-scoped
- capture sessions can be completed/canceled/archived
- no screenshot/file metadata exists yet
- no capture event can reference a screenshot yet

Risk if skipped:

- capture events would need to reference nonexistent assets
- guide/demo generation would not have source screenshots
- upload work would mix storage design with asset semantics
- future file storage adapters would leak provider details into capture tables

This slice creates the persistence and API contract for asset metadata only. Actual byte upload should be a later slice.

## Existing Decisions To Honor

Relevant ADRs:

```text
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
```

Important implications:

- file metadata owns storage facts
- capture assets own product meaning
- product domains reference `file_id`, not local paths or provider-specific keys
- screenshot is the MVP asset type
- HTML snapshots are schema-allowed but replay/storage behavior is deferred
- original capture source records should be treated as immutable after creation
- redaction should create derived assets later, not overwrite original assets

## Scope

Included:

- new `file_schema.file` table
- new `capture_schema.capture_asset` table
- metadata-only API to create/list/get/delete capture assets under a capture session
- organization/project/session scoping for all asset routes
- audit fields from current `org_user.id`
- soft delete for file and capture asset rows
- DB-backed integration tests through Fastify public API
- validation for screenshot dimensions and file metadata

Excluded:

- multipart binary upload
- local filesystem write adapter
- S3/R2/object storage adapter
- signed upload/download URLs
- serving files back to the browser
- image processing
- thumbnail generation
- redaction workflow
- capture events
- HTML replay
- Chrome extension implementation
- guide/demo creation from capture

## Domain Model

### File Metadata

Recommended table:

```text
file_schema.file
  id
  organization_id
  storage_provider
  storage_key
  mime_type
  size_bytes
  original_name
  checksum_sha256
  metadata
  is_deleted
  deleted_at
  deleted_by_id
  version
  created_by_id
  updated_by_id
  created_at
  updated_at
```

Storage provider values:

```text
local
external
```

Recommended defaults:

```text
storage_provider = local
is_deleted = false
version = 1
```

Notes:

- `storage_key` is a logical key, not necessarily a filesystem path.
- Do not expose local absolute paths through the API.
- `metadata` is optional JSON and should not be returned publicly in this slice.
- The file table stores physical/storage facts only.
- A file can later be reused by guide thumbnails, exports, publish snapshots, or derived redactions.
- `storage_key` should be unique per organization for non-deleted files to avoid accidentally pointing two logical files at the same object.

### Capture Asset

Recommended table:

```text
capture_schema.capture_asset
  id
  organization_id
  project_id
  capture_session_id
  file_id
  asset_type
  width
  height
  device_pixel_ratio
  page_url
  page_title
  captured_at
  metadata
  is_deleted
  deleted_at
  deleted_by_id
  version
  created_by_id
  updated_by_id
  created_at
  updated_at
```

Asset type values:

```text
screenshot
html_snapshot
thumbnail
redacted_screenshot
```

Recommended MVP behavior:

- allow only `screenshot` through the create API in this slice
- keep the DB check constraint broad enough for future asset types
- do not implement HTML snapshot behavior
- do not implement redaction/thumbnail generation

Notes:

- `capture_asset` owns product meaning: "this file is a screenshot source asset for this capture session."
- `file_schema.file` owns storage facts: provider, key, MIME type, size, checksum.
- `capture_asset` should not store storage keys or local paths.
- Original capture assets should not be updated after creation except soft delete/audit fields.
- Later derived assets can point to their own file row and carry metadata linking back to the original asset.

## Migration Guidance

Create a new migration:

```text
apps/server/src/db/migrations/003_capture_asset_metadata_schema.sql
```

The migration should:

- create `file_schema`
- create `file_schema.file`
- create `capture_schema.capture_asset`
- add status/type/check constraints
- add foreign keys to organization, org_user, project, capture_session, and file
- add indexes for capture session asset queries
- include `COMMENT ON TABLE` / `COMMENT ON COLUMN` statements describing ownership boundaries
- include a complete `DOWN` section

Suggested constraints:

```text
file.storage_provider IN ('local', 'external')
file.size_bytes >= 0
unique lower(file.storage_key) per organization where is_deleted = false
capture_asset.asset_type IN ('screenshot', 'html_snapshot', 'thumbnail', 'redacted_screenshot')
capture_asset.width IS NULL OR width > 0
capture_asset.height IS NULL OR height > 0
capture_asset.device_pixel_ratio IS NULL OR device_pixel_ratio > 0
```

Suggested indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_capture_asset_session_created
ON capture_schema.capture_asset (capture_session_id, created_at DESC)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_capture_asset_project_type
ON capture_schema.capture_asset (project_id, asset_type, created_at DESC)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_file_org_created
ON file_schema.file (organization_id, created_at DESC)
WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_file_storage_key_active_per_org
ON file_schema.file (organization_id, lower(storage_key))
WHERE is_deleted = FALSE;
```

Suggested `DOWN` order:

```sql
DROP INDEX IF EXISTS capture_schema.idx_capture_asset_project_type;
DROP INDEX IF EXISTS capture_schema.idx_capture_asset_session_created;
DROP TABLE IF EXISTS capture_schema.capture_asset;

DROP INDEX IF EXISTS file_schema.uq_file_storage_key_active_per_org;
DROP INDEX IF EXISTS file_schema.idx_file_org_created;
DROP TABLE IF EXISTS file_schema.file;
DROP SCHEMA IF EXISTS file_schema;
```

Do not edit existing migrations.

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

Never accept these fields from the client:

```text
organization_id
project_id outside URL
capture_session_id outside URL
file_id as an existing foreign row owned by another scope
created_by_id
updated_by_id
deleted_by_id
```

### Create Capture Asset Metadata

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
```

Request:

```json
{
  "asset_type": "screenshot",
  "width": 1440,
  "height": 900,
  "device_pixel_ratio": 1,
  "page_url": "https://example.internal/app/department",
  "page_title": "Department",
  "captured_at": "2026-06-05T00:00:00.000Z",
  "file": {
    "storage_provider": "local",
    "storage_key": "captures/org/project/session/screenshot-1.png",
    "mime_type": "image/png",
    "size_bytes": 123456,
    "original_name": "screenshot-1.png",
    "checksum_sha256": "hex-checksum"
  },
  "metadata": {
    "capture_mode": "manual"
  }
}
```

Required:

```text
asset_type
file.storage_key
file.mime_type
file.size_bytes
```

Optional:

```text
width
height
device_pixel_ratio
page_url
page_title
captured_at
file.storage_provider
file.original_name
file.checksum_sha256
file.metadata
metadata
```

Behavior:

- only accepts `asset_type = screenshot` for now
- for screenshot assets, requires `file.mime_type` to start with `image/`
- verifies project belongs to current organization and is not deleted
- verifies capture session belongs to the project/current organization and is not deleted
- creates a file metadata row and capture asset row in one DB transaction
- records current org_user as creator/updater for both rows
- defaults `captured_at` to current timestamp when omitted
- validates width/height as positive integers when present
- validates device pixel ratio as positive number when present
- validates size bytes as non-negative integer
- rejects duplicate active `storage_key` in the same organization
- stores optional metadata but does not return metadata publicly in this slice

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
      "original_name": "screenshot-1.png",
      "checksum_sha256": "hex-checksum"
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

Do not expose:

```text
file.storage_key
file.metadata
capture_asset.metadata
is_deleted
deleted_at
deleted_by_id
```

Missing/deleted/cross-org project:

```text
404 project_not_found
```

Missing/deleted/cross-org capture session:

```text
404 capture_session_not_found
```

Invalid non-MVP asset type:

```text
400 unsupported_capture_asset_type
```

### List Capture Assets

```text
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
```

Query:

```text
asset_type optional: screenshot | html_snapshot | thumbnail | redacted_screenshot
```

Behavior:

- verifies project and capture session access
- returns non-deleted assets only
- sorts newest first by `created_at DESC, id DESC`
- omits storage keys and metadata

Success:

```json
{
  "capture_assets": []
}
```

### Get Capture Asset

```text
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
```

Behavior:

- verifies project and capture session access
- finds asset by id, organization, project, and capture session
- hides deleted assets
- omits storage keys and metadata

Missing/deleted/cross-org asset:

```text
404 capture_asset_not_found
```

### Delete Capture Asset

```text
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
```

Behavior:

- soft deletes the capture asset
- soft deletes the directly associated file metadata row
- does not delete physical bytes
- sets `deleted_at`, `deleted_by_id`, `updated_by_id`
- increments `version` on both rows
- returns `204 No Content`
- repeated delete returns `404 capture_asset_not_found`

Reasoning:

- no bytes are managed in this slice
- physical cleanup requires a storage adapter and retention policy later

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
400 invalid_capture_asset
400 unsupported_capture_asset_type
409 file_storage_key_conflict
404 project_not_found
404 capture_session_not_found
404 capture_asset_not_found
```

Messages:

```text
Authentication is required
Capture asset input is invalid
Only screenshot capture assets are supported in this slice
A file with this storage key already exists
Project was not found
Capture session was not found
Capture asset was not found
```

## Module Shape

Create a new singular module:

```text
apps/server/src/modules/capture-asset/
```

Likely files:

```text
capture-asset.service.ts
capture-asset.repository.ts
capture-asset.routes.ts
capture-asset.service.test.ts
capture-asset.routes.test.ts
capture-asset.app.integration.test.ts
capture-asset.db.integration.test.ts
```

Use the same patterns as project and capture-session modules:

- snake_case service/repository method names
- auth context passed explicitly
- route-level Zod validation
- repository maps rows into public response shapes
- DB integration tests through Fastify public API
- public response shape omits storage keys, metadata, and delete internals

Recommended service methods:

```text
create_capture_asset
list_capture_assets
get_capture_asset
delete_capture_asset
```

Recommended repository methods:

```text
capture_session_exists
create_capture_asset
list_capture_assets
find_capture_asset
delete_capture_asset
transaction
```

The service must verify project/session access before asset operations. Recommendation:

- query through capture session existence joined to project by organization/project/session and `is_deleted = FALSE`
- keep project and capture-session modules unchanged
- avoid a broad cross-domain permission abstraction for this slice

File and asset writes must be transactional:

- create either inserts both file and capture asset or neither
- delete either soft-deletes both file and capture asset or neither
- unique storage-key conflicts should roll back the asset insert

The setup module already has a transaction pattern; reuse that style for this repository instead of adding a new shared database abstraction in this slice.

## App Wiring

Register capture asset routes under:

```text
/api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
```

Recommendation:

- mount the route module at `/api/v1/projects`
- define nested paths in `capture-asset.routes.ts`

```text
/:project_id/capture-sessions/:capture_session_id/assets
/:project_id/capture-sessions/:capture_session_id/assets/:id
```

## TDD Sequence

### 1. Migration And Schema Test

Add DB schema test first:

- migration creates `file_schema.file`
- migration creates `capture_schema.capture_asset`
- required columns exist
- constraints reject invalid storage provider
- constraints reject invalid asset type
- constraints reject negative file size
- constraints reject invalid dimensions/device pixel ratio
- unique active storage key per organization is enforced
- indexes exist
- table comments exist

Implementation:

- add `003_capture_asset_metadata_schema.sql`
- extend `foundation-schema.db.integration.test.ts` or add focused DB schema test
- update `apps/server/package.json` `test:db` if a new DB integration file is added

Suggested commit:

```text
feat: add capture asset metadata schema
```

### 2. Route Contract

Add route tests:

- unauthenticated create/list/get/delete returns `401`
- create passes auth-derived organization/actor and URL scope to service
- create ignores client-supplied organization/project/session/audit fields
- create rejects invalid file and asset input
- create rejects non-screenshot asset type with `unsupported_capture_asset_type`
- create rejects non-image MIME types for screenshot assets
- create maps duplicate storage key to `409 file_storage_key_conflict`
- list supports optional asset type query
- get passes URL scope and asset id
- delete returns `204` with no body
- not-found errors map to stable responses

Implementation:

- add `capture-asset.routes.ts`
- register routes in `app.ts`
- add app integration test proving nested route mount

Suggested commit:

```text
feat: add capture asset route contract
```

### 3. Service And Repository

Add service/repository tests:

- create verifies capture session access before insert
- create scopes file and asset rows to current organization/project/session
- create stores file metadata and capture asset together transactionally
- create returns public shape without storage key/metadata/delete internals
- list filters by organization/project/session and optional asset type
- get returns not found for missing/cross-org/deleted asset
- delete soft deletes asset and file metadata transactionally
- delete maps missing rows to not found
- duplicate storage keys map to `file_storage_key_conflict`

Implementation:

- implement a repository-local transaction method using the existing setup repository pattern
- keep asset rows immutable except soft delete
- keep DB uniqueness rules minimal; no asset name/order uniqueness in this slice

Suggested commit:

```text
feat: add capture asset metadata service
```

### 4. DB-Backed API Integration

Add DB integration tests through Fastify:

- setup owner
- create project
- create capture session
- create screenshot capture asset metadata
- assert file row and asset row persisted with audit fields
- assert storage key is persisted but not returned by API
- duplicate storage key in same organization returns `409 file_storage_key_conflict`
- list assets for capture session
- get asset
- filter list by asset type
- soft delete asset
- assert direct DB soft-delete fields for asset and file
- list/get/delete no longer expose deleted asset
- cross-org project access returns `404 project_not_found`
- cross-org capture session access returns `404 capture_session_not_found`
- cross-org asset access returns `404 capture_asset_not_found`
- creating under a deleted capture session returns `404 capture_session_not_found`
- public API responses do not expose storage keys, metadata, or delete internals
- transaction rollback leaves no orphan file row if asset creation fails

Suggested commit:

```text
test: verify db backed capture asset metadata
```

### 5. Final Verification

Run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server test:setup
rtk pnpm --filter server test:db
rtk pnpm check-types
rtk pnpm --filter server lint
```

Expected:

- all tests pass
- type-check passes
- lint has no errors
- existing lint warnings are acceptable only if unrelated to this slice

Suggested hardening commit if needed:

```text
fix: harden capture asset metadata
```

## Acceptance Criteria

- migration creates `file_schema.file`
- migration creates `capture_schema.capture_asset`
- API routes exist under project/capture-session nested URLs
- all routes require valid `demo_composer_session`
- all operations are scoped to current organization
- all operations verify project and capture session are not deleted
- create only supports screenshot assets in this slice
- create stores file metadata and capture asset metadata transactionally
- file storage key is persisted but not returned publicly
- duplicate active storage key is rejected per organization
- metadata and delete internals are not returned publicly
- list/get return only non-deleted assets
- delete soft deletes both asset and file metadata transactionally
- DB constraints reject invalid provider/type/size/dimensions
- DB-backed integration tests prove behavior on real PostgreSQL

## Open Decisions Deferred

Do not decide these in this slice:

- multipart upload implementation
- local filesystem root/key format
- checksum generation
- storage adapter interface
- signed file access
- image processing and thumbnail generation
- redaction UX
- capture event schema
- guide/demo generation from assets
- asset restore behavior
- physical file retention/deletion policy

## Next Slice After This

After capture asset metadata, the recommended next plan is:

```text
docs/plan/008-capture-event-foundation.md
```

That should add meaningful capture events that can reference screenshot assets.
