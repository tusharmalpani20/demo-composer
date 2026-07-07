# Capture Session Foundation Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Create the first backend foundation for capture sessions inside a project:

```text
authenticated session
  -> project
  -> capture session
```

This gives the product a real source-material object for future screenshot capture, HTML snapshot metadata, capture events, guide creation, and interactive demo creation.

Capture sessions are not final artifacts. They are reusable raw/source material that can later produce:

- Scribe-style guide documents
- Storylane-style interactive walkthrough demos

## Why This Comes Next

Current state:

- first-run setup creates owner, organization, org_user, and auth session
- password auth sessions are DB-backed
- project create/list/get/update/delete exists
- project APIs are organization-scoped
- project soft delete hides deleted projects from normal workflows
- no capture domain exists yet

Risk if skipped:

- guide and demo APIs would lack a stable source-material parent
- extension work would start without a backend contract
- asset and event schemas would need to invent their own lifecycle
- project workspace cannot show real capture history

This slice should create only the capture-session lifecycle. Assets, events, uploads, and artifact generation should come after this contract is proven.

## Existing Decisions To Honor

Relevant ADRs:

```text
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
```

Important implications:

- capture sessions are source material, not guide/demo artifacts
- finishing a capture must not automatically create a guide or demo
- original capture events and capture assets should be immutable once created
- screenshot capture is the MVP path
- HTML replay is deferred
- raw typed values should not be stored by default
- AI should not own capture state

## Scope

Included:

- `capture_schema` migration
- `capture_schema.capture_session` table
- authenticated create/list/get/update routes under a project
- project and organization scoping for every route
- capture session lifecycle statuses
- audit fields from current `org_user.id`
- soft delete for capture sessions
- DB-backed integration tests through Fastify public API
- project-soft-delete guard so captures cannot be created under deleted projects

Excluded:

- screenshot upload
- file metadata table
- `capture_asset`
- `capture_event`
- HTML snapshot storage
- Chrome extension implementation
- extension-specific auth/session
- guide creation from capture
- interactive demo creation from capture
- project workspace UI
- analytics
- AI generation/summarization

## Domain Model

Recommended table:

```text
capture_schema.capture_session
  id
  organization_id
  project_id
  name
  description
  status
  source_type
  started_at
  completed_at
  canceled_at
  start_url
  browser_name
  browser_version
  operating_system
  viewport_width
  viewport_height
  device_pixel_ratio
  user_agent
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

Status values:

```text
draft
capturing
completed
canceled
archived
```

Source type values:

```text
manual
extension
import
```

Recommended defaults:

```text
status = draft
source_type = manual
is_deleted = false
version = 1
```

Notes:

- `organization_id` is duplicated on the capture session even though `project_id` implies organization.
- The duplicate organization id makes org scoping explicit and keeps future queries/indexes simple.
- Every route must verify the project belongs to the current organization and is not deleted.
- `metadata` is optional JSON for capture-environment facts that do not deserve columns yet.
- `metadata` should be stored as optional JSON, but not returned in the public response shape in this slice. This matches the current project API pattern and avoids exposing arbitrary capture-environment JSON before the UI needs it.
- Do not store screenshot paths or object-storage keys here.
- Do not store raw typed input values here.
- `started_at`, `completed_at`, and `canceled_at` are server-managed lifecycle timestamps. Do not accept them from clients in this slice.

## Migration Guidance

Create a new migration:

```text
apps/server/src/db/migrations/002_capture_session_schema.sql
```

The migration should:

- create `capture_schema`
- create `capture_schema.capture_session`
- add a status check constraint
- add a source type check constraint
- add positive-value check constraints for `viewport_width`, `viewport_height`, and `device_pixel_ratio` when present
- add indexes for project workspace queries
- include `COMMENT ON TABLE` / `COMMENT ON COLUMN` statements explaining what the table owns and what it does not own
- include a complete `DOWN` section that drops indexes, the table, and then `capture_schema`

Suggested indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_capture_session_project_status
ON capture_schema.capture_session (project_id, status, created_at DESC)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_capture_session_org_created
ON capture_schema.capture_session (organization_id, created_at DESC)
WHERE is_deleted = FALSE;
```

Suggested comment themes:

- `capture_session` is source material only.
- It does not store screenshots, file paths, guide blocks, demo scenes, or publish state.
- Future capture events and assets will reference it.
- Finishing a session does not automatically create an artifact.

Suggested `DOWN` order:

```sql
DROP INDEX IF EXISTS capture_schema.idx_capture_session_org_created;
DROP INDEX IF EXISTS capture_schema.idx_capture_session_project_status;
DROP TABLE IF EXISTS capture_schema.capture_session;
DROP SCHEMA IF EXISTS capture_schema;
```

Do not edit `001_foundation_schema.sql`; add the capture schema as a new migration.

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
project_id outside the URL
created_by_id
updated_by_id
deleted_by_id
```

### Create Capture Session

```text
POST /api/v1/projects/:project_id/capture-sessions
```

Request:

```json
{
  "name": "Create department workflow",
  "description": "Source capture for the department setup guide",
  "source_type": "manual",
  "start_url": "https://example.internal/app/department",
  "browser_name": "Chrome",
  "browser_version": "126",
  "operating_system": "Linux",
  "viewport_width": 1440,
  "viewport_height": 900,
  "device_pixel_ratio": 1,
  "user_agent": "Mozilla/5.0 ...",
  "metadata": {
    "capture_mode": "screenshot"
  }
}
```

Required:

```text
name
```

Optional:

```text
description
source_type
start_url
browser_name
browser_version
operating_system
viewport_width
viewport_height
device_pixel_ratio
user_agent
metadata
```

Behavior:

- trims `name`
- rejects blank `name`
- starts status as `draft`
- ignores any client-supplied status on create
- ignores any client-supplied lifecycle timestamps
- verifies the project exists in the current organization and is not deleted
- records `created_by_id` and `updated_by_id` from current org_user
- validates `source_type` as `manual`, `extension`, or `import`
- validates `viewport_width` and `viewport_height` as positive integers when present
- validates `device_pixel_ratio` as a positive number when present

Success:

```text
201 Created
```

Response:

```json
{
  "capture_session": {
    "id": "capture_session_id",
    "organization_id": "organization_id",
    "project_id": "project_id",
    "name": "Create department workflow",
    "description": "Source capture for the department setup guide",
    "status": "draft",
    "source_type": "manual",
    "started_at": null,
    "completed_at": null,
    "canceled_at": null,
    "start_url": "https://example.internal/app/department",
    "browser_name": "Chrome",
    "browser_version": "126",
    "operating_system": "Linux",
    "viewport_width": 1440,
    "viewport_height": 900,
    "device_pixel_ratio": 1,
    "user_agent": "Mozilla/5.0 ...",
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
is_deleted
deleted_at
deleted_by_id
metadata
```

Missing/deleted/cross-org project:

```text
404 project_not_found
```

### List Capture Sessions

```text
GET /api/v1/projects/:project_id/capture-sessions
```

Query:

```text
status optional: draft | capturing | completed | canceled | archived
```

Behavior:

- verifies project belongs to current organization and is not deleted
- returns non-deleted sessions only
- defaults to all statuses when no status is supplied
- sorts newest first by `created_at DESC, id DESC`

Success:

```json
{
  "capture_sessions": []
}
```

Missing/deleted/cross-org project:

```text
404 project_not_found
```

### Get Capture Session

```text
GET /api/v1/projects/:project_id/capture-sessions/:id
```

Behavior:

- verifies project belongs to current organization and is not deleted
- finds capture session by id, project, and organization
- hides deleted sessions

Missing/deleted/cross-org session:

```text
404 capture_session_not_found
```

Missing/deleted/cross-org project:

```text
404 project_not_found
```

### Update Capture Session

```text
PATCH /api/v1/projects/:project_id/capture-sessions/:id
```

Editable fields:

```text
name
description
status
start_url
browser_name
browser_version
operating_system
viewport_width
viewport_height
device_pixel_ratio
user_agent
metadata
```

Behavior:

- rejects empty update payload
- trims `name`
- rejects blank `name`
- ignores unknown fields after picking allowed fields, matching the project route pattern
- rejects client-supplied lifecycle timestamps
- validates `viewport_width` and `viewport_height` as positive integers when present
- validates `device_pixel_ratio` as a positive number when present
- verifies project belongs to current organization and is not deleted
- updates only non-deleted sessions
- increments `version`
- records `updated_by_id`
- manages lifecycle timestamps when status changes:
  - `capturing`: set `started_at` if currently null
  - `completed`: set `completed_at` if currently null
  - `canceled`: set `canceled_at` if currently null
  - `draft` or `archived`: do not clear existing lifecycle timestamps

Recommended status transition policy for this slice:

- allow any valid status transition
- timestamps are append-only facts
- stricter transition rules can come later when extension behavior is real

### Delete Capture Session

```text
DELETE /api/v1/projects/:project_id/capture-sessions/:id
```

Behavior:

- soft deletes the capture session
- sets `is_deleted = TRUE`
- sets `deleted_at`
- sets `deleted_by_id`
- sets `updated_by_id`
- increments `version`
- returns `204 No Content`
- repeated delete returns `404 capture_session_not_found`

Do not cascade into assets/events yet because they do not exist in this slice.

Status should remain unchanged on delete. Deletion is represented by `is_deleted`.

## Error Contract

Use the same stable error response shape used by project routes:

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
400 invalid_capture_session
400 empty_capture_session_update
404 project_not_found
404 capture_session_not_found
```

Messages:

```text
Authentication is required
Capture session input is invalid
At least one capture session field must be provided
Project was not found
Capture session was not found
```

## Module Shape

Create a new singular module:

```text
apps/server/src/modules/capture-session/
```

Likely files:

```text
capture-session.service.ts
capture-session.repository.ts
capture-session.routes.ts
capture-session.service.test.ts
capture-session.routes.test.ts
capture-session.app.integration.test.ts
capture-session.db.integration.test.ts
```

Use the same patterns as the project module:

- snake_case service/repository method names
- auth context passed explicitly
- route-level Zod validation
- repository maps rows into public response shapes
- DB integration tests through Fastify public API
- public response shape omits `metadata`, `is_deleted`, `deleted_at`, and `deleted_by_id` for this slice

Recommended service methods:

```text
create_capture_session
list_capture_sessions
get_capture_session
update_capture_session
delete_capture_session
```

Recommended repository methods:

```text
create_capture_session
list_capture_sessions
find_capture_session
update_capture_session
delete_capture_session
```

The service must also verify project access before capture-session operations. There are two acceptable implementation options:

1. Inject a small project-access dependency into the capture-session service.
2. Add a repository query that checks `project_schema.project` by id, organization, and `is_deleted = FALSE`.

Recommendation for this slice:

- use option 2 inside the capture-session repository/service boundary
- keep the project module API unchanged
- avoid creating a broad cross-domain permission abstraction too early

## App Wiring

Register capture session routes under:

```text
/api/v1/projects/:project_id/capture-sessions
```

The route module can be mounted directly at `/api/v1/projects` and define nested paths, or it can be mounted with the full nested prefix.

Recommendation:

- mount at `/api/v1/projects`
- define capture-session paths in the capture-session route module:

```text
/:project_id/capture-sessions
/:project_id/capture-sessions/:id
```

This keeps project-owned subresources visibly nested under the project URL.

## TDD Sequence

### 1. Migration And Schema Test

Add DB schema test first:

- migration creates `capture_schema.capture_session`
- required columns exist
- status constraint rejects invalid status
- source type constraint rejects invalid source type
- positive-value constraints reject invalid viewport/device pixel values
- indexes exist for project/status and organization/recent lookups
- table comments exist

Implementation:

- add `002_capture_session_schema.sql`
- extend `apps/server/src/db/foundation-schema.db.integration.test.ts` or add a focused capture schema DB integration test
- if a new DB integration file is added, update `apps/server/package.json` `test:db` to include it
- no test setup change is needed for migrations because the migrator automatically picks up new `*.sql` files

Suggested commit:

```text
feat: add capture session schema
```

### 2. Route Contract

Add route tests:

- unauthenticated create/list/get/update/delete returns `401`
- create passes auth-derived organization and actor into service
- create ignores client-supplied organization/project/audit/status fields
- create ignores client-supplied lifecycle timestamps
- create rejects blank name, invalid source type, invalid viewport values, and invalid device pixel ratio
- list supports optional status query
- get passes project id and capture session id
- update rejects empty payload
- update passes only allowed fields
- update rejects client-supplied lifecycle timestamps
- delete returns `204` with no body
- not-found errors map to stable responses

Implementation:

- add `capture-session.routes.ts`
- register routes in `app.ts`
- add app integration test proving routes are mounted under `/api/v1/projects/:project_id/capture-sessions`

Suggested commit:

```text
feat: add capture session route contract
```

### 3. Service And Repository

Add service/repository tests:

- create verifies project access before insert
- create scopes to current organization and actor
- list verifies project access and filters by current organization/project
- list defaults to all statuses when status is omitted
- get returns not found for missing/cross-org/deleted session
- update rejects empty normalized data
- update manages lifecycle timestamps
- delete soft deletes and maps missing rows to not found
- delete leaves `status` unchanged

Implementation:

- normalize optional string fields like project service
- keep client-provided status ignored during create
- use public capture session response shape that omits delete internals
- keep DB uniqueness rules minimal for now; no name uniqueness required in this slice

Suggested commit:

```text
feat: add capture session service
```

### 4. DB-Backed API Integration

Add DB integration tests through Fastify:

- setup owner
- create project
- create capture session under project
- assert audit fields and project/org scoping
- list capture sessions for project
- get capture session
- update status to `capturing` and assert `started_at`
- update status to `completed` and assert `completed_at`
- update status to `canceled` and assert `canceled_at`
- later status changes do not clear existing lifecycle timestamps
- soft delete capture session
- assert direct DB soft-delete fields
- assert delete leaves `status` unchanged
- list/get/update/delete no longer expose deleted session
- cross-org project access returns `404 project_not_found`
- cross-org session access returns `404 capture_session_not_found`
- creating under a soft-deleted project returns `404 project_not_found`
- public API responses do not expose `metadata`, `is_deleted`, `deleted_at`, or `deleted_by_id`

Suggested commit:

```text
test: verify db backed capture sessions
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

Suggested final hardening commit if needed:

```text
fix: harden capture session foundation
```

## Acceptance Criteria

- migration creates `capture_schema.capture_session`
- capture session table has org, project, lifecycle, metadata, audit, version, and soft-delete columns
- route requires valid `demo_composer_session`
- create/list/get/update/delete are available under project-owned URLs
- all operations are scoped to current organization
- all operations verify the project exists and is not deleted
- create rejects invalid source type and invalid viewport/device pixel values
- create records current `org_user.id` as creator/updater
- update records current `org_user.id` as updater
- delete records current `org_user.id` as deleter/updater
- delete is soft delete only
- deleted capture sessions are hidden from list/get/update/delete
- create under deleted project returns `404 project_not_found`
- cross-org access does not reveal foreign resources
- lifecycle timestamps are set on status updates
- lifecycle timestamps are not accepted from client input
- API responses do not expose metadata or delete internals in this slice
- DB-backed integration tests prove real PostgreSQL behavior

## Open Decisions Deferred

Do not decide these in this slice:

- exact capture event payload shape
- screenshot file upload protocol
- local filesystem versus object storage implementation
- extension auth token type
- automatic capture rules
- guide-generation command shape
- interactive-demo-generation command shape
- artifact analytics
- restore behavior for capture sessions

## Next Slice After This

After capture session foundation, the recommended next plan is:

```text
docs/plan/007-capture-asset-metadata.md
```

That should introduce file/storage metadata and capture assets for screenshots first, while keeping HTML replay deferred.
