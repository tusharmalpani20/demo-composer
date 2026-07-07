# Create Guide From Capture Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Add the first guide-domain backend slice:

```text
authenticated user
  -> project
  -> non-deleted capture session
  -> create draft guide from capture
  -> deterministic guide blocks and guide steps
  -> editable guide source for the portal
```

This is the bridge between raw capture source material and the Scribe-like document artifact.

MVP choice:

- allow guide creation from any non-deleted capture session status
- completed sessions are the normal path after extension capture
- draft/capturing sessions may produce empty or partial guides during internal testing
- canceled/archived sessions remain readable source material unless soft-deleted

## Why This Comes Next

Current state:

- users can sign in
- projects exist
- capture sessions exist
- capture assets and events exist
- capture sessions can be completed
- the portal can view raw capture session detail

Missing product object:

- there is no editable guide artifact yet
- the portal can inspect source material but cannot prepare a Scribe-like document
- raw capture events/assets are not the right place to store edited instructions

This slice should create the first deterministic guide artifact from capture source material. It should not build the visual guide editor yet.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/grill/2026-06-04-system-design-grill.md
docs/plan/011-capture-session-detail-read-model.md
docs/plan/012-capture-session-detail-portal.md
```

Important implications:

- capture sessions remain immutable source material
- guide artifacts are separate edited product objects
- guides are ordered `guide_block` records
- step blocks have first-class `guide_step` details
- deterministic placeholder text is preferred for MVP
- AI is deferred
- screenshot assets are the visual source for guide steps
- raw typed input values must not be stored or generated into guide text
- REST/Fastify/Zod route style stays consistent

## Scope

Included:

- guide database schema
- guide repository/service/routes
- create draft guide from capture session
- deterministic block/step generation from selected capture events
- list guides for a project
- get guide detail with ordered blocks and step details
- project/session/org scoping
- soft-delete support for guides and guide blocks/steps
- DB-backed integration tests
- service tests
- route tests
- app route registration tests

Excluded:

- portal guide editor UI
- guide update/reorder/delete UI
- guide block editing APIs beyond what is needed for generated draft creation
- published guide viewer
- public sharing
- interactive demo creation
- Chrome extension changes
- AI text generation
- screenshot annotation editor
- GIF generation
- PDF/export
- analytics
- comments/collaboration
- guide version publishing snapshots

## Domain Model

### Guide

Represents an editable Scribe-like document draft inside a project.

Fields:

```text
guide
  id
  organization_id
  project_id
  source_capture_session_id nullable
  title
  description nullable
  status draft | archived
  created_by_id
  updated_by_id
  version
  created_at
  updated_at
  is_deleted
  deleted_at nullable
  deleted_by_id nullable
```

Notes:

- `source_capture_session_id` is nullable so later guides can be created manually.
- MVP creates only `draft` guides.
- Published state is deferred to publish snapshots.

### Guide Block

Ordered document row. A guide is not only steps long-term, so ordering belongs here.

Fields:

```text
guide_block
  id
  organization_id
  project_id
  guide_id
  block_type step | header | paragraph | tip | alert | capture | divider | gif
  block_index
  source_capture_event_id nullable
  source_capture_asset_id nullable
  created_by_id
  updated_by_id
  version
  created_at
  updated_at
  is_deleted
  deleted_at nullable
  deleted_by_id nullable
```

MVP behavior:

- generated blocks are all `step`
- `block_index` starts at `1`
- unique active index per guide:

```text
UNIQUE (guide_id, block_index) WHERE is_deleted = FALSE
```

### Guide Step

First-class detail for blocks where `block_type = step`.

Fields:

```text
guide_step
  id
  organization_id
  project_id
  guide_id
  guide_block_id
  title
  body nullable
  source_capture_event_id nullable
  source_capture_asset_id nullable
  created_by_id
  updated_by_id
  version
  created_at
  updated_at
  is_deleted
  deleted_at nullable
  deleted_by_id nullable
```

Notes:

- `title` stores deterministic instruction text.
- `body` is nullable for this MVP.
- Step annotations are deferred.
- Keep source references duplicated on `guide_step` and `guide_block` for convenient detail reads and integrity checks.

## Source Event Selection

Create guide command input may include:

```text
selected_capture_event_ids optional string[]
```

Behavior:

- if omitted, generate from all meaningful non-deleted capture events in event order
- if provided, generate from only those events
- selected event IDs must belong to the capture session/project/org
- selected event order follows persisted `event_index ASC`, not client input order
- omit events that do not produce useful guide steps

Meaningful event rules for MVP:

```text
note       -> included
click      -> included
input      -> included
navigation -> included
capture    -> included
```

If an event has no linked asset:

- still create the step
- leave source asset null

If an event references a soft-deleted asset:

- still create the step from the event
- leave source asset null

If no meaningful events remain:

- create the draft guide with zero blocks
- return an empty ordered block list

## Deterministic Step Text

No AI in this slice.

Recommended title generation:

```text
note:
  event.note

click:
  Click "<target_label || target_text || target_role || page_title || 'the highlighted element'>"

input:
  Enter the required value in "<target_label || target_text || page_title || 'the field'>"

navigation:
  Navigate to "<page_title || page_url || 'the page'>"

capture:
  Review this screen
```

Rules:

- trim generated text
- never include `target_selector`
- never include raw input values
- never include `input_intent` if it could reveal sensitive details later
- cap generated titles to a reasonable length, for example 180 characters
- allow users to edit generated titles in a later slice

## API Contract

Base path:

```text
/api/v1/projects/:project_id/guides
```

Authentication:

```text
demo_composer_session cookie required
```

### Create Guide From Capture

```text
POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
```

Body:

```json
{
  "title": "Create department workflow",
  "description": "Optional draft guide description",
  "selected_capture_event_ids": ["event_1", "event_2"]
}
```

Validation:

- `title` required, trimmed, non-empty
- `description` optional nullable string
- `selected_capture_event_ids` optional array of non-empty strings
- reject duplicate selected event IDs
- ignore all client-managed org/project/user/status/source fields

Success:

```text
201 Created
```

Response:

```json
{
  "guide": {
    "id": "guide_id",
    "organization_id": "organization_id",
    "project_id": "project_id",
    "source_capture_session_id": "capture_session_id",
    "title": "Create department workflow",
    "description": null,
    "status": "draft",
    "created_by_id": "org_user_id",
    "updated_by_id": "org_user_id",
    "version": 1,
    "created_at": "2026-06-05T10:00:00.000Z",
    "updated_at": "2026-06-05T10:00:00.000Z"
  },
  "guide_blocks": [
    {
      "id": "guide_block_id",
      "organization_id": "organization_id",
      "project_id": "project_id",
      "guide_id": "guide_id",
      "block_type": "step",
      "block_index": 1,
      "source_capture_event_id": "event_id",
      "source_capture_asset_id": "asset_id",
      "created_by_id": "org_user_id",
      "updated_by_id": "org_user_id",
      "version": 1,
      "created_at": "2026-06-05T10:00:00.000Z",
      "updated_at": "2026-06-05T10:00:00.000Z",
      "step": {
        "id": "guide_step_id",
        "title": "Click \"Add Department\"",
        "body": null,
        "source_capture_event_id": "event_id",
        "source_capture_asset_id": "asset_id"
      }
    }
  ]
}
```

Error mapping:

```text
401 unauthenticated
404 project_not_found
404 capture_session_not_found
404 capture_event_not_found
400 invalid_guide
409 guide_block_index_conflict
```

### List Project Guides

```text
GET /api/v1/projects/:project_id/guides
```

Success:

```json
{
  "guides": [
    {
      "id": "guide_id",
      "organization_id": "organization_id",
      "project_id": "project_id",
      "source_capture_session_id": "capture_session_id",
      "title": "Create department workflow",
      "description": null,
      "status": "draft",
      "created_by_id": "org_user_id",
      "updated_by_id": "org_user_id",
      "version": 1,
      "created_at": "2026-06-05T10:00:00.000Z",
      "updated_at": "2026-06-05T10:00:00.000Z"
    }
  ]
}
```

Ordering:

```text
created_at DESC, id DESC
```

### Get Guide Detail

```text
GET /api/v1/projects/:project_id/guides/:guide_id
```

Success:

```json
{
  "guide": {},
  "guide_blocks": []
}
```

Behavior:

- verifies project belongs to current org
- verifies guide belongs to project/current org and is not deleted
- returns non-deleted blocks ordered by `block_index ASC`
- returns step details for step blocks
- does not expose soft-delete internals
- does not expose capture event metadata
- does not expose file storage internals

## Database Migration Plan

Create migration:

```text
apps/server/src/db/migrations/005_guide_foundation_schema.sql
```

Create new schema if needed:

```text
guide_schema
```

Tables:

```text
guide_schema.guide
guide_schema.guide_block
guide_schema.guide_step
```

Indexes:

```text
idx_guide_project_active_created
idx_guide_source_capture_session_active
idx_guide_block_guide_active_order
uq_guide_block_guide_index_active
idx_guide_step_block_active
uq_guide_step_block_active
```

Constraints:

- guide organization/project FK
- guide source capture session FK nullable
- guide block guide/project/org FK
- guide block source event/asset FK nullable
- guide step guide/block/project/org FK
- guide step source event/asset FK nullable
- active unique guide block order
- `guide_step.guide_block_id` unique where not deleted
- status check
- block type check
- positive block index check
- optional composite FK or service-level guard to ensure guide/block/step rows keep matching organization and project IDs

Important DB note:

- source event/asset FKs can point at rows that are later soft-deleted because source history may be hidden later without deleting guide drafts.
- Reads must not require source event/asset to still be active.
- use `ON DELETE SET NULL` for source capture event/asset references if the physical row is ever deleted by a future hard-delete maintenance job
- use `ON DELETE CASCADE` from `guide` to `guide_block` and `guide_step` because guide blocks/steps have no useful life without their guide

## Implementation Plan

### 1. Migration Tests

Extend foundation schema DB tests for:

- `guide_schema` exists
- `guide`, `guide_block`, and `guide_step` tables exist
- expected columns exist
- expected indexes exist
- status/block type constraints reject invalid values
- active block index uniqueness works
- guide step has one active row per step block
- migration comments describe guide rows as editable artifacts, not capture source material

### 2. Guide Service Tests

Create:

```text
apps/server/src/modules/guide/guide.service.test.ts
```

Cover:

- creates a guide draft from all capture events in persisted order
- creates from selected event IDs but preserves persisted event order
- rejects duplicate selected IDs
- maps missing project/session/events to domain errors
- creates an empty guide when there are no meaningful events
- generates safe deterministic text for click/input/navigation/capture/note events
- omits source asset when asset is soft-deleted or missing

### 3. Guide Repository

Create:

```text
apps/server/src/modules/guide/guide.repository.ts
```

Responsibilities:

- `project_exists`
- `find_capture_session`
- `find_capture_events_for_guide`
- `find_active_capture_assets_by_id`
- `create_guide_from_capture` transaction
- `list_guides`
- `get_guide_detail`

The create operation should be transactional so guide, blocks, and steps are all created or none are.

Repository detail reads should return public row shapes only:

- no `metadata`
- no `is_deleted`
- no `deleted_at`
- no `deleted_by_id`
- no capture event `target_selector`
- no file `storage_key`

### 4. Guide Service

Create:

```text
apps/server/src/modules/guide/guide.service.ts
```

Responsibilities:

- project/session scope validation
- input normalization
- duplicate selected-event validation
- deterministic step-title generation
- call repository transaction
- return public guide detail shape

### 5. Guide Routes

Create:

```text
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/guide/guide.app.integration.test.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
```

Route tests should cover:

- unauthenticated access
- create guide from capture passes auth/project/session/body to service
- list/get pass auth/project/guide IDs to service
- error mapping
- invalid body rejection

### 6. App Wiring

Update:

```text
apps/server/src/app.ts
```

Register guide routes under:

```text
/api/v1/projects
```

Follow the existing dependency-injection pattern used by capture session/assets/events.

Concrete app changes:

- import `build_guide_routes` and `GuideRouteDependencies`
- import `build_guide_repository`
- import `build_guide_service`
- add optional `guide_service?: GuideRouteDependencies["guide_service"]` to `BuildOptions`
- destructure `guide_service` from `opts`
- register routes after capture routes or alongside them under `/api/v1/projects`
- pass `default_authentication_session_service.get_current_auth_context` as route auth dependency

### 7. DB Integration Tests

DB-backed tests should prove:

- create guide from capture creates guide, ordered blocks, and steps
- selected event IDs are scoped and ordered by persisted event order
- generated step text is deterministic and safe
- list guides hides deleted guides
- get guide detail hides deleted guide blocks/steps
- cross-org project/session/event resources are not revealed
- soft-deleted capture session cannot create a guide
- soft-deleted source assets are not linked in new guide steps
- guide creation does not mutate capture session/event/asset rows

DB test reset helpers must truncate the new guide tables before capture/project/org/user tables:

```text
guide_schema.guide_step
guide_schema.guide_block
guide_schema.guide
capture_schema.capture_event
capture_schema.capture_asset
file_schema.file
capture_schema.capture_session
project_schema.project
organization_schema.org_user
organization_schema.organization
user_schema.user
```

## TDD Sequence

Follow red-green-refactor:

1. Write migration/foundation DB tests.
2. Add guide migration.
3. Write guide service tests.
4. Implement deterministic service behavior with a fake repository.
5. Write route tests.
6. Implement routes and domain errors.
7. Write repository/DB integration tests.
8. Implement repository SQL and app wiring.
9. Run focused tests after each green step.
10. Run full server verification.

## Verification

Run:

```text
pnpm --filter server check-types
pnpm --filter server test
pnpm --filter server test:db
pnpm --filter server lint
```

No web verification is required unless the implementation touches `apps/web`.

## Acceptance Criteria

- new guide schema/tables exist
- authenticated users can create a draft guide from a capture session
- guide creation does not mutate capture session/events/assets
- generated guide blocks are ordered by capture event order
- generated guide steps have deterministic safe titles
- selected event IDs are validated and scoped
- missing/deleted/cross-org resources are hidden with stable 404s
- raw input values, selectors, metadata, storage keys, and soft-delete internals are not exposed
- users can list project guides
- users can get guide detail with ordered blocks and step details
- service, route, app integration, and DB integration coverage exists
- full server verification passes

## Recommended Next Slice After This

After this backend guide creation slice, build:

```text
014-guide-detail-portal-read-model.md
```

That slice should let the portal open a created guide and render the Scribe-like ordered document skeleton before adding editing/reordering.
