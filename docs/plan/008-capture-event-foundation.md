# Capture Event Foundation Plan

Date: 2026-06-05

## Goal

Add backend persistence and API contracts for ordered capture events:

```text
authenticated session
  -> project
  -> capture session
  -> capture event
  -> optional capture asset
```

This turns a capture session from "a bucket of screenshots" into a chronological source record that can later become:

- Scribe-like procedural documentation
- Storylane-like interactive demo scenes and hotspots
- structured review/edit workflows before guide/demo generation

This slice should still be metadata/API only. It should not generate docs, demos, scenes, hotspots, or browser-extension capture behavior yet.

## Why This Comes Next

Current state:

- users, organizations, org users, sessions, projects, and capture sessions exist
- capture sessions are scoped to project and organization
- file metadata exists
- capture asset metadata exists and can point to screenshots
- no ordered capture event exists

Risk if skipped:

- screenshots cannot be connected to user actions
- guide generation would need to infer steps from screenshots alone
- interactive demo generation would not know what was clicked, typed, or navigated
- the Chrome extension would not have a stable event ingestion contract
- later guide/demo models would be forced to own raw capture data

This slice creates the event ledger for source material. Later slices can build upload bytes, extension ingestion, guide block creation, and demo scene creation on top of it.

## Existing Decisions To Honor

Relevant ADRs:

```text
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
```

Important implications:

- capture events are source material, not guide steps
- guide blocks and demo scenes are later derived/editable artifacts
- original capture events should be immutable after creation except soft delete/audit fields
- screenshots are the MVP visual asset
- raw typed input values should not be stored by default
- AI should not be added in this slice
- events may reference capture assets, but should never reference file storage keys directly

## Scope

Included:

- new `capture_schema.capture_event` table
- ordered event records under capture sessions
- optional link from an event to a capture asset in the same capture session
- organization/project/session scoping for all event routes
- audit fields from current `org_user.id`
- route-level validation for MVP event payloads
- soft delete for capture event rows
- DB-backed integration tests through Fastify public API
- validation that linked capture assets belong to the same organization/project/session
- public API responses that omit private event metadata and delete internals

Excluded:

- Chrome extension implementation
- browser event listener code
- bulk event ingestion
- realtime capture streaming
- file byte upload
- screenshot capture itself
- image processing
- HTML snapshot replay
- guide generation
- interactive demo generation
- AI summary/instruction generation
- analytics
- user-facing event editor UI
- automatic redaction engine

## Domain Model

### Capture Event

Recommended table:

```text
capture_schema.capture_event
  id
  organization_id
  project_id
  capture_session_id
  capture_asset_id
  event_type
  event_index
  occurred_at
  page_url
  page_title
  target_label
  target_selector
  target_role
  target_test_id
  target_text
  client_x
  client_y
  viewport_width
  viewport_height
  device_pixel_ratio
  input_intent
  input_value_redacted
  note
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

Event type values:

```text
navigation
click
input
capture
note
```

Recommended defaults:

```text
occurred_at = current timestamp
input_value_redacted = true
is_deleted = false
version = 1
```

Notes:

- `capture_event` owns the source event semantics: "what happened during capture."
- `capture_asset_id` is optional because not every event has a screenshot yet.
- `capture_asset_id` must point to an active capture asset in the same organization/project/session when provided.
- If a linked capture asset is later soft-deleted, the event remains as source history but should not expose file/storage details.
- `event_index` is the user/session order, not necessarily the exact browser timestamp order.
- `metadata` is optional private JSON and should not be returned publicly in this slice.
- Do not store file IDs, storage keys, or local paths on events.
- Do not store raw typed input values by default.
- In this slice, `input_value_redacted` must be `true`; do not accept `false` until there is a dedicated opt-in/privacy policy.

### Event Type Semantics

#### `navigation`

Represents page load or route change.

Useful fields:

```text
page_url
page_title
occurred_at
capture_asset_id optional
```

Validation:

- `page_url` should be present for navigation events
- `target_*` fields are optional

#### `click`

Represents a user click or pointer activation.

Useful fields:

```text
target_label
target_selector
target_role
target_test_id
target_text
client_x
client_y
page_url
capture_asset_id optional
```

Validation:

- at least one of `target_label`, `target_selector`, `target_role`, `target_text`, or coordinates should be present
- `client_x` and `client_y` should be non-negative when present

#### `input`

Represents a form entry, selection, toggle, or similar user input.

Useful fields:

```text
target_label
target_selector
target_role
input_intent
input_value_redacted
page_url
capture_asset_id optional
```

Validation:

- do not accept/store raw input values in this slice
- `input_value_redacted` defaults to `true`
- reject `input_value_redacted = false`
- `input_intent` can describe the action without storing the value, for example `"entered text"` or `"selected option"`

#### `capture`

Represents an explicit capture/screenshot point.

Useful fields:

```text
capture_asset_id required
page_url
page_title
occurred_at
```

Validation:

- requires `capture_asset_id`
- linked asset must belong to the same capture session

#### `note`

Represents a manual note from the person capturing.

Useful fields:

```text
note
capture_asset_id optional
page_url optional
```

Validation:

- `note` should be a non-empty string
- note is still source material, not a final guide instruction

## Migration Guidance

Create a new migration:

```text
apps/server/src/db/migrations/004_capture_event_foundation_schema.sql
```

The migration should:

- create `capture_schema.capture_event`
- add event type and numeric check constraints
- add foreign keys to organization, project, capture_session, capture_asset, and org_user
- add indexes for session event listing and asset lookups
- add a unique active event order constraint per capture session
- include `COMMENT ON TABLE` / `COMMENT ON COLUMN` statements describing source-material boundaries
- include a complete `DOWN` section

Suggested constraints:

```text
capture_event.event_type IN ('navigation', 'click', 'input', 'capture', 'note')
capture_event.event_index >= 1
capture_event.input_value_redacted = TRUE
capture_event.client_x IS NULL OR client_x >= 0
capture_event.client_y IS NULL OR client_y >= 0
capture_event.viewport_width IS NULL OR viewport_width > 0
capture_event.viewport_height IS NULL OR viewport_height > 0
capture_event.device_pixel_ratio IS NULL OR device_pixel_ratio > 0
```

Foreign key guidance:

```text
organization_id -> organization_schema.organization(id) ON DELETE CASCADE
project_id -> project_schema.project(id) ON DELETE CASCADE
capture_session_id -> capture_schema.capture_session(id) ON DELETE CASCADE
capture_asset_id -> capture_schema.capture_asset(id) ON DELETE SET NULL
created_by_id / updated_by_id -> organization_schema.org_user(id) ON DELETE RESTRICT
deleted_by_id -> organization_schema.org_user(id) ON DELETE SET NULL
```

Cross-table scope cannot be guaranteed by a simple foreign key. The service/repository must verify that `capture_asset_id`, when provided, is active and belongs to the same `organization_id`, `project_id`, and `capture_session_id`.

Suggested indexes:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_capture_event_session_index_active
ON capture_schema.capture_event (capture_session_id, event_index)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_capture_event_session_order
ON capture_schema.capture_event (capture_session_id, event_index ASC)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_capture_event_asset
ON capture_schema.capture_event (capture_asset_id)
WHERE is_deleted = FALSE AND capture_asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_capture_event_project_created
ON capture_schema.capture_event (project_id, created_at DESC)
WHERE is_deleted = FALSE;
```

Suggested `DOWN` order:

```sql
DROP INDEX IF EXISTS capture_schema.idx_capture_event_project_created;
DROP INDEX IF EXISTS capture_schema.idx_capture_event_asset;
DROP INDEX IF EXISTS capture_schema.idx_capture_event_session_order;
DROP INDEX IF EXISTS capture_schema.uq_capture_event_session_index_active;
DROP TABLE IF EXISTS capture_schema.capture_event;
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
created_by_id
updated_by_id
deleted_by_id
file_id
storage_key
```

### Create Capture Event

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
```

Request:

```json
{
  "event_type": "click",
  "event_index": 2,
  "capture_asset_id": "capture_asset_id",
  "occurred_at": "2026-06-05T00:00:00.000Z",
  "page_url": "https://example.internal/app/department",
  "page_title": "Department",
  "target_label": "Add Department",
  "target_selector": "button[data-testid='add-department']",
  "target_role": "button",
  "target_test_id": "add-department",
  "target_text": "Add Department",
  "client_x": 1200,
  "client_y": 84,
  "viewport_width": 1440,
  "viewport_height": 900,
  "device_pixel_ratio": 1,
  "metadata": {
    "source": "manual"
  }
}
```

Required:

```text
event_type
event_index
```

Optional:

```text
capture_asset_id
occurred_at
page_url
page_title
target_label
target_selector
target_role
target_test_id
target_text
client_x
client_y
viewport_width
viewport_height
device_pixel_ratio
input_intent
input_value_redacted
note
metadata
```

Behavior:

- verifies project belongs to current organization and is not deleted
- verifies capture session belongs to the project/current organization and is not deleted
- validates linked capture asset belongs to the same capture session when provided
- rejects linked capture assets that are deleted or from another organization/project/session
- creates one capture event row
- records current org_user as creator/updater
- defaults `occurred_at` to current timestamp when omitted
- rejects duplicate active `event_index` in the same capture session
- stores optional metadata but does not return metadata publicly in this slice
- rejects raw input value fields if a client tries to send them
- rejects `input_value_redacted = false` in this slice

Success:

```text
201 Created
```

Response:

```json
{
  "capture_event": {
    "id": "capture_event_id",
    "organization_id": "organization_id",
    "project_id": "project_id",
    "capture_session_id": "capture_session_id",
    "capture_asset_id": "capture_asset_id",
    "event_type": "click",
    "event_index": 2,
    "occurred_at": "2026-06-05T00:00:00.000Z",
    "page_url": "https://example.internal/app/department",
    "page_title": "Department",
    "target_label": "Add Department",
    "target_selector": "button[data-testid='add-department']",
    "target_role": "button",
    "target_test_id": "add-department",
    "target_text": "Add Department",
    "client_x": 1200,
    "client_y": 84,
    "viewport_width": 1440,
    "viewport_height": 900,
    "device_pixel_ratio": 1,
    "input_intent": null,
    "input_value_redacted": true,
    "note": null,
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
metadata
is_deleted
deleted_at
deleted_by_id
storage keys
file metadata
raw input values
```

### List Capture Events

```text
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
```

Query:

```text
event_type optional: navigation | click | input | capture | note
```

Behavior:

- verifies project and capture session access
- returns non-deleted events only
- sorts by `event_index ASC, created_at ASC, id ASC`
- omits metadata and delete internals
- returns `capture_asset_id` as an identifier only; do not expand file or storage details

Success:

```json
{
  "capture_events": []
}
```

### Get Capture Event

```text
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
```

Behavior:

- verifies project and capture session access
- finds event by id, organization, project, and capture session
- hides deleted events
- omits metadata and delete internals
- returns `capture_asset_id` as an identifier only; do not expand file or storage details

Missing/deleted/cross-org event:

```text
404 capture_event_not_found
```

### Delete Capture Event

```text
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
```

Behavior:

- soft deletes the capture event
- does not delete the linked capture asset
- does not delete file metadata or physical bytes
- sets `deleted_at`, `deleted_by_id`, `updated_by_id`
- increments `version`
- returns `204 No Content`
- repeated delete returns `404 capture_event_not_found`

Reasoning:

- events are source records
- assets/files may be referenced by other events or later derived artifacts
- deleting an event should not delete the underlying screenshot asset

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
400 invalid_capture_event
409 capture_event_index_conflict
404 project_not_found
404 capture_session_not_found
404 capture_asset_not_found
404 capture_event_not_found
```

Messages:

```text
Authentication is required
Capture event input is invalid
A capture event with this index already exists
Project was not found
Capture session was not found
Capture asset was not found
Capture event was not found
```

## Module Shape

Create a new singular module:

```text
apps/server/src/modules/capture-event/
```

Likely files:

```text
capture-event.service.ts
capture-event.repository.ts
capture-event.routes.ts
capture-event.service.test.ts
capture-event.routes.test.ts
capture-event.app.integration.test.ts
capture-event.db.integration.test.ts
```

Use the same patterns as project, capture-session, and capture-asset modules:

- snake_case service/repository method names
- auth context passed explicitly
- route-level Zod validation
- repository maps rows into public response shapes
- DB integration tests through Fastify public API
- public response shape omits metadata and delete internals

Recommended service methods:

```text
create_capture_event
list_capture_events
get_capture_event
delete_capture_event
```

Recommended repository methods:

```text
project_exists
capture_session_exists
capture_asset_exists
create_capture_event
list_capture_events
find_capture_event
delete_capture_event
```

The service must verify project/session access before event operations. Recommendation:

- use `project_exists` for missing/deleted/cross-org project checks
- use `capture_session_exists` for missing/deleted/cross-org session checks
- use `capture_asset_exists` only when `capture_asset_id` is provided
- keep project, capture-session, and capture-asset modules unchanged
- avoid a broad cross-domain permission abstraction for this slice

## App Wiring

Register capture event routes under:

```text
/api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
```

Recommendation:

- mount the route module at `/api/v1/projects`
- define nested paths in `capture-event.routes.ts`

```text
/:project_id/capture-sessions/:capture_session_id/events
/:project_id/capture-sessions/:capture_session_id/events/:id
```

## TDD Sequence

### 1. Migration And Schema Test

Add DB schema test first:

- migration creates `capture_schema.capture_event`
- required columns exist
- event type check constraint rejects invalid values
- numeric constraints reject invalid event indexes, coordinates, viewport values, and DPR
- active event indexes are unique per capture session
- indexes exist
- table/comment boundaries exist

Expected RED:

- table does not exist
- columns/indexes/constraints do not exist

### 2. Service Tests

Add service tests for:

- create validates project and capture session before insert
- create validates optional capture asset belongs to the same session
- create rejects deleted or cross-scope capture assets
- create normalizes optional strings
- create rejects raw typed input value fields
- create rejects `input_value_redacted = false`
- create rejects invalid event-type-specific payloads
- duplicate `event_index` maps to `CaptureEventIndexConflictError`
- list/get/delete are scoped by organization/project/session
- missing project maps to `ProjectNotFoundError`
- missing session maps to `CaptureSessionNotFoundError`
- missing asset maps to `CaptureAssetNotFoundError`
- missing event maps to `CaptureEventNotFoundError`
- delete does not delete capture asset or file metadata

Expected RED:

- service module does not exist or lacks methods/errors

### 3. Route Tests

Add route tests for:

- auth required on all routes
- create uses auth context and URL project/session ids
- client-supplied organization/project/session/audit fields are ignored
- list/get/delete pass correct scoped inputs
- invalid payloads return 400
- domain errors map to stable error responses
- public responses omit metadata/delete internals

Expected RED:

- route module does not exist or route contracts are missing

### 4. App Integration Test

Add app test for:

- route module is mounted under `/api/v1/projects`
- auth guard is used by default app wiring

Expected RED:

- requests return 404

### 5. DB-Backed API Integration Test

Add DB-backed Fastify test for:

- setup owner
- create project
- create capture session
- create capture asset
- create several events
- list returns event order by `event_index ASC`
- get returns the expected event
- duplicate event index returns 409
- invalid linked asset returns 404
- deleted linked asset returns 404
- missing project/session returns the correct 404 error type
- `input_value_redacted = false` returns 400
- delete soft-deletes only the event
- linked asset and file remain active after event delete
- deleted event is hidden from list/get
- raw metadata is persisted but not exposed publicly

Expected RED:

- migration/API/module missing

### 6. Implementation

Implement in this order:

1. migration
2. repository
3. service
4. routes
5. app wiring
6. package `test:db` update

Keep the implementation narrow. Do not add shared abstractions unless the existing module patterns force it.

## Validation Recommendations

Route-level Zod validation:

- `event_type`: enum
- `event_index`: positive integer
- `capture_asset_id`: optional string
- `occurred_at`: optional datetime string
- coordinates: optional non-negative numbers
- viewport width/height: optional positive integers
- device pixel ratio: optional positive number
- note: optional non-empty string
- reject `input_value_redacted = false`
- reject known raw value fields such as `input_value`, `value`, `typed_value`, `password`, and `secret`

Implementation note:

- If using `.passthrough()` on Zod schemas to ignore unknown ownership/audit fields, add an explicit `superRefine` or equivalent guard for raw value field names before passing the body to the service.

Service-level validation:

- event-type-specific rules
- raw input value defense
- capture asset same-session validation
- project/session existence checks

DB-level validation:

- check constraints for broad invariants
- unique active event order per session
- foreign keys for scope ownership

## Privacy Notes

The MVP should default to privacy-preserving capture:

- Do not accept raw typed values in event payloads.
- Store `input_value_redacted = true` by default.
- Reject `input_value_redacted = false` until there is an explicit opt-in design.
- Allow `input_intent` to describe the action without storing the value.
- Keep event `metadata` out of public responses.
- Keep future redaction work as derived assets/events, not mutation of original source rows.

Examples:

Good:

```json
{
  "event_type": "input",
  "event_index": 3,
  "target_label": "Department Name",
  "input_intent": "entered text",
  "input_value_redacted": true
}
```

Bad:

```json
{
  "event_type": "input",
  "event_index": 3,
  "target_label": "Password",
  "input_value": "super-secret-password"
}
```

## Implementation Notes

- Keep capture events immutable after creation except soft delete/audit fields.
- Do not add update endpoints in this slice.
- Do not renumber events automatically in this slice.
- If the client needs to correct ordering later, add a dedicated reorder plan.
- Do not cascade delete capture assets from event deletion.
- Do not include asset file details in event responses yet.
- Consider `capture_asset_id` enough for later joins.

## Verification Commands

Run focused tests first:

```bash
rtk pnpm --filter server test -- src/modules/capture-event/capture-event.service.test.ts src/modules/capture-event/capture-event.routes.test.ts src/modules/capture-event/capture-event.app.integration.test.ts
```

Apply test migrations:

```bash
rtk pnpm --filter server test:setup
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
docs: add capture event foundation plan
feat: add capture event schema
feat: add capture event api
test: harden capture event foundation
```

If implementation becomes large, split further:

```text
feat: add capture event repository service
feat: add capture event routes
```

## Open Questions To Revisit Later

Do not block this slice on these:

- Should we support bulk event ingest from the Chrome extension?
- Should event ordering be server-assigned or client-assigned during real capture?
- Should events keep a browser tab/window identifier?
- Should click coordinates be stored relative to viewport, element bounds, or screenshot pixels?
- Should guide generation consume only `capture` events or all event types?
- Should raw input values ever be opt-in per organization?
- Should event metadata eventually be encrypted at rest?

## Done Definition

This plan is complete when:

- `capture_schema.capture_event` exists with constraints, indexes, comments, and rollback
- create/list/get/delete capture event routes work under capture sessions
- project/session/asset scoping is enforced
- event ordering is stable and unique per active capture session
- public responses omit metadata, storage facts, and delete internals
- event deletion does not delete assets/files
- DB-backed tests prove the public API behavior
- full server tests, DB tests, typecheck, and lint pass
