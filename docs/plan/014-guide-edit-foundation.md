# Guide Edit Foundation Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Add the first edit APIs for generated guide artifacts:

```text
authenticated user
  -> project
  -> existing draft guide
  -> update guide metadata
  -> update step text/body
  -> reorder guide blocks
  -> keep capture source material unchanged
```

This slice turns a generated guide from read-only output into an editable Scribe-like document draft.

The important product loop after this slice:

```text
capture session
  -> create guide from capture
  -> edit generated guide
  -> later render/edit in portal UI
```

## Why This Comes Next

Current state:

- users can create projects
- users can create capture sessions
- capture assets and capture events exist
- capture sessions can be read as raw source material
- users can create draft guides from capture sessions
- guides have ordered guide blocks and first-class guide steps

Missing product behavior:

- generated guides cannot be edited
- deterministic step titles cannot be corrected by a user
- step bodies cannot be written
- guide title/description cannot be changed after generation
- block order cannot be corrected after generation

This slice should only create the backend editing foundation. The portal editor UI comes next.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/013-create-guide-from-capture.md
```

Important implications:

- capture rows remain source material and must not be mutated by guide edits
- guide rows are the editable product artifact
- editing happens inside project/org scope
- only non-deleted guides/blocks/steps can be edited
- route style should stay Fastify/Zod/REST
- response shape should stay public and omit soft-delete internals
- no AI rewrite/suggestion layer in this slice
- no publishing or public sharing in this slice

## Scope

Included:

- update guide metadata
- update step title/body
- reorder active guide blocks
- soft-delete a guide block
- maintain active contiguous block indexes after reorder/delete
- project/org scoping for every operation
- service tests
- route tests
- DB-backed integration tests
- app route registration coverage if a new route dependency surface is added

Excluded:

- portal guide editor UI
- creating arbitrary new blocks manually
- duplicating blocks
- moving blocks between guides
- deleting the whole guide
- restoring deleted blocks
- published guide snapshots
- public guide viewer
- comments/collaboration
- analytics
- AI text generation
- screenshot annotation editing
- GIF generation
- export/PDF

## Domain Rules

### Editable State

MVP rule:

- `draft` guides are editable
- `archived` guides are not editable

Reason:

- `archived` is currently the only non-draft status
- archive should mean the guide is hidden/inactive and no longer being worked on
- publishing snapshots are deferred, so no publish-state edit rules are needed yet

Expected behavior:

```text
draft guide    -> update allowed
archived guide -> 409 guide_not_editable
deleted guide  -> 404 guide_not_found
```

Exception:

- the `draft -> archived` transition itself is allowed
- once a guide is archived, no further edits are allowed in this slice

### Guide Metadata

Editable fields:

```text
title
description
status
```

Allowed status changes:

```text
draft -> archived
archived -> not editable in this slice
```

Unsupported status changes:

```text
archived -> draft
draft -> draft via status-only patch
any value other than archived
```

Notes:

- title is required when provided, trimmed, non-empty
- title should be capped to the same maximum as generated guide titles, currently 180 characters
- description is optional nullable text
- client-managed fields must be ignored or rejected by route picking, not written
- updating guide metadata must increment `version`
- updating guide metadata must update `updated_by_id` and `updated_at`
- client-provided `version` is ignored in this slice
- a status-only archive patch is valid
- a patch that changes title/description and archives in the same request is valid
- a status-only patch that does not change the stored status is invalid

Concurrency note:

- optimistic concurrency with `expected_version` is deferred
- the portal editor can use latest-write-wins for the first internal MVP
- guide-level `version` is still incremented on every edit so we can add optimistic checks later without changing the read model

### Step Text

Editable fields:

```text
title
body
```

Rules:

- `title` required when provided, trimmed, non-empty
- `title` capped to 180 characters
- `body` optional nullable string
- body should be trimmed when provided
- empty body becomes `null`
- do not allow client to update source references in this slice
- do not allow client to update org/project/guide/block ownership fields
- updating a step increments `guide_step.version`
- updating a step also updates parent `guide.updated_by_id`, `guide.updated_at`, and `guide.version`

Reason for updating parent guide version:

- from a portal perspective, any edit to the guide document changes the guide artifact
- later autosave/editor state can observe guide-level version changes

### Block Reorder

Reorder command input:

```json
{
  "block_ids": ["block_1", "block_2", "block_3"]
}
```

Rules:

- request must include every active block in the guide exactly once
- duplicate block IDs are invalid
- unknown block IDs are invalid
- block IDs from another guide/project/org are invalid
- deleted blocks cannot be included
- order is client-provided array order
- resulting `block_index` starts at `1`
- operation is transactional
- parent guide version is incremented

Error behavior:

```text
missing active block in request -> 400 invalid_guide_block_order
duplicate block id             -> 400 invalid_guide_block_order
unknown block id               -> 404 guide_block_not_found
cross-scope block id           -> 404 guide_block_not_found
archived guide                 -> 409 guide_not_editable
```

Implementation note:

- active unique index on `(guide_id, block_index)` can conflict during naive updates
- use a two-phase reorder in a transaction:
  1. temporarily move active blocks to a large positive offset
  2. assign final positive indexes

### Soft Delete Guide Block

Endpoint should soft-delete a single active block.

Rules:

- block must belong to guide/project/org
- guide must be editable
- soft-delete guide block
- soft-delete associated guide step if the block is a step block
- compact remaining active block indexes to `1..n`
- update parent guide audit/version
- source capture rows are not touched

Reason:

- Scribe-like docs need users to remove noisy generated steps
- deleting a block is a core editing primitive
- hard delete is not needed and would remove audit/recovery options

## API Contract

Base path:

```text
/api/v1/projects/:project_id/guides
```

Authentication:

```text
demo_composer_session cookie required
```

### Update Guide

```text
PATCH /api/v1/projects/:project_id/guides/:guide_id
```

Body:

```json
{
  "title": "Create department workflow",
  "description": "Updated draft guide description",
  "status": "archived"
}
```

Validation:

- at least one supported field required
- `title` optional string, trimmed, non-empty
- `description` optional nullable string
- `status` optional enum: `archived`
- ignore client-managed org/project/user/source/version fields

Success:

```text
200 OK
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
    "description": "Updated draft guide description",
    "status": "archived",
    "created_by_id": "org_user_id",
    "updated_by_id": "org_user_id",
    "version": 2,
    "created_at": "2026-06-05T10:00:00.000Z",
    "updated_at": "2026-06-05T10:10:00.000Z"
  }
}
```

Error mapping:

```text
401 unauthenticated
404 project_not_found
404 guide_not_found
400 invalid_guide
409 guide_not_editable
```

### Update Step

```text
PATCH /api/v1/projects/:project_id/guides/:guide_id/steps/:step_id
```

Body:

```json
{
  "title": "Click \"Add Department\"",
  "body": "Use this button to start creating a new department."
}
```

Validation:

- at least one supported field required
- `title` optional string, trimmed, non-empty
- `body` optional nullable string
- ignore source and ownership fields

Success:

```text
200 OK
```

Response:

```json
{
  "guide_step": {
    "id": "guide_step_id",
    "organization_id": "organization_id",
    "project_id": "project_id",
    "guide_id": "guide_id",
    "guide_block_id": "guide_block_id",
    "source_capture_session_id": "capture_session_id",
    "source_capture_event_id": "event_id",
    "source_capture_asset_id": "asset_id",
    "title": "Click \"Add Department\"",
    "body": "Use this button to start creating a new department.",
    "created_by_id": "org_user_id",
    "updated_by_id": "org_user_id",
    "version": 2,
    "created_at": "2026-06-05T10:00:00.000Z",
    "updated_at": "2026-06-05T10:12:00.000Z"
  }
}
```

Error mapping:

```text
401 unauthenticated
404 project_not_found
404 guide_not_found
404 guide_step_not_found
400 invalid_guide_step
409 guide_not_editable
```

### Reorder Blocks

```text
PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/reorder
```

Body:

```json
{
  "block_ids": ["guide_block_2", "guide_block_1", "guide_block_3"]
}
```

Validation:

- `block_ids` required array
- `block_ids` must be non-empty
- every id must be a non-empty string
- no duplicate IDs
- must contain every active block in the guide exactly once
- guides with zero active blocks cannot be reordered

Success:

```text
200 OK
```

Response:

```json
{
  "guide_blocks": [
    {
      "id": "guide_block_2",
      "block_index": 1,
      "block_type": "step",
      "step": {}
    }
  ]
}
```

Use the same public guide block shape as guide detail.

Implementation note:

- register the static `blocks/reorder` route before `blocks/:block_id` routes if Fastify matching ever makes route order relevant

Error mapping:

```text
401 unauthenticated
404 project_not_found
404 guide_not_found
404 guide_block_not_found
400 invalid_guide_block_order
409 guide_not_editable
```

### Delete Block

```text
DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:block_id
```

Success:

```text
204 No Content
```

Behavior:

- soft-delete block
- soft-delete step detail when present
- compact remaining active block indexes
- update parent guide version/audit

Error mapping:

```text
401 unauthenticated
404 project_not_found
404 guide_not_found
404 guide_block_not_found
409 guide_not_editable
```

## Repository Plan

Update:

```text
apps/server/src/modules/guide/guide.repository.ts
```

Add methods:

```text
find_editable_guide
update_guide
update_guide_step
list_active_guide_blocks
reorder_guide_blocks
delete_guide_block
```

Recommended repository contract shape:

```text
project_exists(input)
find_guide_detail(input)
update_guide(input)
find_guide_step(input)
update_guide_step(input)
list_guide_blocks(input)
reorder_guide_blocks(input)
delete_guide_block(input)
```

Transactional methods:

- `update_guide_step`
- `reorder_guide_blocks`
- `delete_guide_block`

Reason:

- these update multiple rows or must preserve ordering consistency
- parent guide version/audit must change atomically with child edits

Read/write filters:

```text
organization_id = auth.organization_id
project_id = params.project_id
guide_id = params.guide_id
is_deleted = FALSE
```

Step update filters also include:

```text
guide_step.id = params.step_id
guide_step.guide_id = params.guide_id
guide_step.is_deleted = FALSE
```

Block update filters also include:

```text
guide_block.id = params.block_id
guide_block.guide_id = params.guide_id
guide_block.is_deleted = FALSE
```

Public row shapes must not include:

- `metadata`
- `is_deleted`
- `deleted_at`
- `deleted_by_id`
- file `storage_key`
- capture event `target_selector`
- capture event `input_intent`

## Service Plan

Update:

```text
apps/server/src/modules/guide/guide.service.ts
```

Add domain errors:

```text
GuideNotEditableError
GuideStepNotFoundError
GuideBlockNotFoundError
InvalidGuideStepInputError
InvalidGuideBlockOrderError
```

Add service methods:

```text
update_guide
update_guide_step
reorder_guide_blocks
delete_guide_block
```

Responsibilities:

- normalize and validate inputs
- ensure project exists
- ensure guide exists and belongs to current org/project
- ensure guide is editable before mutation
- reject empty patch bodies
- validate reorder list exactly matches active block set
- delegate transactional writes to repository

Input normalization:

- trim strings
- empty nullable strings become `null` where applicable
- empty required strings are invalid
- cap guide titles and step titles at 180 characters
- ignore client-managed fields before service call in route layer
- allow archive transition even though archived guides are otherwise not editable

## Route Plan

Update:

```text
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/guide/guide.app.integration.test.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
```

Routes:

```text
PATCH  /:project_id/guides/:guide_id
PATCH  /:project_id/guides/:guide_id/steps/:step_id
PATCH  /:project_id/guides/:guide_id/blocks/reorder
DELETE /:project_id/guides/:guide_id/blocks/:block_id
```

Registration order:

```text
specific routes before parameterized routes
blocks/reorder before blocks/:block_id
```

Route behavior:

- require `demo_composer_session`
- derive org/user from auth context
- take project/guide/block/step IDs from URL only
- pick allowed body fields explicitly
- map domain errors to stable response codes
- preserve existing create/list/detail endpoints

## Test Plan

### Service Tests

Extend:

```text
apps/server/src/modules/guide/guide.service.test.ts
```

Cover:

- update guide title/description with trimmed values
- reject empty guide patch
- reject empty guide title
- archive a draft guide
- reject edits to archived guide
- update step title/body
- reject empty step patch
- reject empty step title
- reject missing project/guide/step/block
- reorder blocks using client order
- reject reorder request for a guide with zero active blocks
- reject duplicate reorder IDs
- reject missing active block in reorder request
- reject unknown/cross-scope block ID
- delete block delegates compacting to repository

### Route Tests

Extend:

```text
apps/server/src/modules/guide/guide.routes.test.ts
```

Cover:

- unauthenticated update/reorder/delete requests return 401
- update guide passes auth/project/guide/body to service
- update step passes auth/project/guide/step/body to service
- reorder passes block ID list to service
- delete block passes URL scope to service
- route body picking ignores client-managed fields
- domain error mapping is stable
- invalid Zod bodies return 400

### DB Integration Tests

Extend:

```text
apps/server/src/modules/guide/guide.db.integration.test.ts
```

Cover:

- create guide from capture, then update guide metadata
- update step title/body and verify capture event unchanged
- reorder generated blocks and verify indexes persist as `1..n`
- delete a block and verify block/step soft-deleted
- after delete, guide detail hides deleted block and returns compacted indexes
- archived guide rejects further step/reorder/delete edits
- cross-project/cross-org guide/block/step edits return 404
- response does not expose soft-delete internals or capture/file internals

### Verification Commands

Run:

```text
pnpm --filter server check-types
pnpm --filter server test
pnpm --filter server test:db
pnpm --filter server lint
```

## Implementation Order

Use TDD:

1. Add red service tests for update guide, update step, reorder, and delete block.
2. Implement service input normalization and domain errors.
3. Add red route tests for the new endpoints.
4. Implement route schemas, body picking, and error mapping.
5. Add red DB integration tests for persistence and source immutability.
6. Implement repository methods and transactions.
7. Run focused tests.
8. Run full verification commands.
9. Commit the slice.

## Acceptance Criteria

- a generated guide can have its title/description changed
- a generated step can have its title/body changed
- guide blocks can be reordered
- noisy generated blocks can be soft-deleted
- block indexes stay contiguous after reorder/delete
- archived guides reject further edits
- capture sessions/events/assets are not mutated by guide edits
- all guide edit operations are org/project scoped
- route responses do not expose private/internal fields
- full server verification passes
