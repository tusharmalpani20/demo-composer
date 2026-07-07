# Guide Step Screenshot Management Plan

Date: 2026-06-11

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Let users fix guide screenshots after a guide has been generated from a capture session.

Target flow:

```text
user opens guide editor
  -> user finds a step with a missing or wrong screenshot
  -> user chooses another screenshot from the same project
  -> editor updates the step screenshot immediately
  -> private preview renders the selected screenshot
  -> republish captures the selected screenshot into the immutable public snapshot
```

This is the next core Scribe-style authoring slice. A generated guide is only useful if users can correct the visual evidence attached to each step without redoing the full browser capture.

## Why This Comes Next

Current state after `035`:

- extension capture can create ordered screenshot-backed capture sessions
- backend can generate guides from capture events
- guide editor can edit guide metadata and step text
- guide editor can insert step/header/tip/alert blocks
- guide editor can reorder and delete guide blocks
- guide editor can render source screenshots inline
- private preview and public reader render supported guide blocks and screenshots
- publishing snapshots are immutable and can be republished

Remaining product gap:

- users cannot replace a bad screenshot on an existing step
- users cannot attach a screenshot to a manually added step
- users cannot remove a screenshot from a step that should be text-only
- source screenshots are currently too tightly coupled to original capture events

This should be fixed before export, embeds, analytics, rich text, annotations, or interactive demos because screenshot correction is part of the basic internal documentation workflow.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0002-capture-sessions-as-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0008-file-domain-owns-storage-metadata.md
docs/plan/030-guide-editor-screenshot-rendering.md
docs/plan/031-guide-publish-foundation.md
docs/plan/035-guide-block-authoring-foundation.md
```

Important implications:

- capture assets are source material and should remain immutable
- guide blocks are editable guide composition records
- guide edits should reference existing assets instead of mutating source capture data
- file metadata and file bytes stay owned by the file/capture asset path already built
- public links resolve to immutable guide snapshots
- draft screenshot changes should not affect public output until republish
- screenshots must stay scoped to the same organization and project

## Scope

Included:

- backend API for changing the screenshot asset attached to a guide step block
- backend API support for removing the screenshot from a guide step block
- authenticated API for listing project screenshot assets that can be selected in the guide editor
- validation that selected assets belong to the same organization and project
- validation that selected assets are active screenshot assets
- service and repository updates that keep capture source records immutable
- guide detail read model updated to expose the selected guide screenshot asset
- publish snapshot generation updated to use the selected guide screenshot asset
- portal editor UI to attach, change, and remove screenshots on step blocks
- screenshot picker using existing project/capture assets
- private preview rendering of the selected screenshot
- public reader rendering of the snapshotted selected screenshot
- focused backend and web tests
- update `docs/project-zoomout-status.md`

Excluded:

- uploading a new screenshot directly from the guide editor
- cropping, masking, or annotating screenshots
- hotspot/callout overlays
- GIF/video attachment
- bulk screenshot reassignment
- drag-and-drop media management
- asset search across other projects
- external image URLs
- selecting HTML snapshot or thumbnail assets as step screenshots
- public access-rule changes
- analytics
- AI/BYO-key screenshot selection

## Recommended Approach

Add screenshot reassignment to guide blocks, not to capture events.

Recommended API shape:

```http
PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot
```

Attach or replace request:

```json
{
  "capture_asset_id": "asset_123"
}
```

Remove request:

```json
{
  "capture_asset_id": null
}
```

Response:

```json
{
  "guide_block": {}
}
```

Reasoning:

- screenshot attachment is a guide composition concern
- capture events and capture assets remain immutable source records
- a dedicated endpoint avoids overloading the general block text update endpoint
- returning the updated block lets the editor patch local state without a full reload
- republish can use the current guide block attachment as the source of truth

## Data Model Notes

Current guide blocks already have:

```text
source_capture_session_id
source_capture_event_id
source_capture_asset_id
```

Those fields currently represent where the block originally came from.

Recommended schema addition:

```sql
ALTER TABLE guide_schema.guide_block
ADD COLUMN selected_capture_asset_id TEXT NULL;
```

Recommended meaning:

- `source_capture_asset_id`: immutable provenance from the original generated capture event
- `selected_capture_asset_id`: editable guide-level screenshot choice
- when `selected_capture_asset_id` is `NULL`, use the source asset fallback if present
- when a step is intentionally text-only, the system needs to distinguish "inherit source" from "remove screenshot"

Because plain `NULL` cannot represent both "inherit source" and "remove screenshot", add a second explicit flag:

```sql
ALTER TABLE guide_schema.guide_block
ADD COLUMN screenshot_hidden BOOLEAN NOT NULL DEFAULT FALSE;
```

Effective screenshot rule:

```text
if screenshot_hidden = true:
  no screenshot
else if selected_capture_asset_id is not null:
  selected asset
else:
  source_capture_asset_id
```

Reasoning:

- preserves source provenance
- avoids rewriting original generated links
- supports manual steps with no source asset
- supports explicit screenshot removal
- keeps snapshot generation deterministic

Indexes:

- add an index on `selected_capture_asset_id` if needed for joins
- keep project/org predicates in queries to enforce tenancy

Allowed selected asset types:

- `screenshot`
- `redacted_screenshot`

Do not allow `html_snapshot` or `thumbnail` assets for guide step screenshots in this slice.

## Backend Plan

### 1. Add Migration

Add a migration after the current guide block content migration:

```text
apps/server/src/db/migrations/008_guide_block_screenshot_selection.sql
```

The migration should:

- add `selected_capture_asset_id`
- add `screenshot_hidden`
- add a foreign key to capture assets if the existing schema pattern supports it cleanly
- add a read-oriented index if useful
- include a down migration

Also update foundation schema tests.

### 2. Extend Guide Types

Update guide domain types so `GuideBlock` can expose:

```ts
selected_capture_asset_id: string | null;
screenshot_hidden: boolean;
display_capture_asset_id: string | null;
source_asset: GuideBlockSourceAsset | null;
```

`display_capture_asset_id` should be the effective screenshot asset id after applying hidden/selected/source fallback rules.

The current guide detail read model exposes `source_capture_assets` for screenshot rendering. After this slice, that collection must include every effective asset needed by guide blocks, including selected replacement screenshots. To reduce ambiguity, either:

- keep `source_capture_assets` for backwards compatibility and include both source assets and selected assets in it, or
- introduce a clearer `guide_capture_assets` collection and update the editor/preview to use it.

Prefer the backwards-compatible option for this slice unless the implementation becomes harder to reason about.

### 3. Add Service Method

Add a guide service method such as:

```ts
update_guide_block_screenshot(input)
```

Validation rules:

- actor must belong to the organization
- project must exist and be active
- guide must exist and be editable
- guide block must exist and be an active `step` block
- if `capture_asset_id` is not null:
  - asset must exist
  - asset must belong to the same organization and project
  - asset must be active
  - asset must be `screenshot` or `redacted_screenshot`
- if `capture_asset_id` is null:
  - set `screenshot_hidden = true`
- if `capture_asset_id` is present:
  - set `selected_capture_asset_id`
  - set `screenshot_hidden = false`

Manual step with no source screenshot:

- attaching a valid screenshot should work
- removing should leave it screenshot-free

Generated step with source screenshot:

- replacing should prefer selected asset
- removing should hide the source screenshot

### 4. Add Repository Method

Add a repository method that:

- updates `selected_capture_asset_id`
- updates `screenshot_hidden`
- bumps block version and timestamps
- touches the parent guide
- returns the updated block with its effective display asset data

Use existing transaction patterns from reorder/delete/update methods.

### 5. Add Screenshot Asset Listing

The editor needs valid screenshot choices that are not necessarily already referenced by the guide.

The current capture asset list API is capture-session scoped. That is useful for capture detail pages, but it is not enough for guide editing because a manual step or a replacement screenshot may come from another capture session in the same project.

Add a narrow authenticated listing API in the capture asset domain:

```http
GET /api/v1/projects/:project_id/capture-assets?asset_type=screenshot
```

Recommended behavior:

- list active assets for the project and current organization
- default to selectable screenshot assets only for this UI
- allow `asset_type=screenshot` and, if needed, `asset_type=redacted_screenshot`
- return the same asset shape and authenticated file URLs used by capture session detail
- order by `captured_at`, then `created_at`, then `id`
- keep pagination out of this first slice unless the current repository pattern already has it

Reasoning:

- keeps asset ownership in the capture asset domain
- lets guide editor choose screenshots across the project
- avoids bloating guide detail with a full project asset library
- keeps public asset access unchanged because this is an authenticated portal API

### 6. Add Screenshot Update Route

Add a route:

```http
PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot
```

Body schema:

```ts
{
  capture_asset_id: z.string().nullable()
}
```

Error mapping:

- invalid body -> existing validation response
- missing project/guide/block/asset -> `404`
- unsupported block type -> `400`
- invalid asset ownership/type/status -> `400`

### 7. Update Publish Snapshot

Published snapshots should use the effective screenshot asset:

```text
screenshot_hidden true -> no asset in snapshot
selected asset -> selected asset in snapshot
fallback source asset -> source asset in snapshot
```

The snapshot should keep enough asset metadata for public rendering, but should not expose unrelated assets.

Public asset streaming must continue to allow only assets referenced by the active published snapshot.

## Web Plan

### 1. Extend API Client

Add:

```ts
listProjectScreenshotAssets(projectId)
updateGuideBlockScreenshot(projectId, guideId, blockId, data)
```

Input:

```ts
{
  capture_asset_id: string | null;
}
```

Response:

```ts
{
  guide_block: GuideBlock;
}
```

### 2. Add Asset Choices To Editor

The editor needs screenshot choices from the current project.

Use the new authenticated project screenshot listing API for picker choices.

Recommended UX:

- for a generated guide, show screenshots from the source capture session first
- for manual guide steps, still allow choosing project screenshots
- show small thumbnails with capture order or file name
- make the current screenshot visibly selected

Keep this simple. A modal or inline picker is acceptable, but do not build a full asset manager.

### 3. Editor Controls

For each step block:

- show current screenshot if effective screenshot exists
- show `Change screenshot`
- show `Remove screenshot` when a screenshot is currently displayed
- show `Attach screenshot` when no screenshot is displayed
- disable actions while a screenshot mutation is in progress
- after success:
  - patch the block locally
  - mark published guide stale if it has an active publish
  - show a short notice

### 4. Preview And Public Reader

Private preview should render the effective screenshot already returned by guide detail.

Public reader should render the snapshotted screenshot selected at publish time.

No extra public API behavior should be required beyond snapshot changes and public asset authorization.

## Test Plan

Backend unit tests:

- service attaches a valid screenshot to a step block
- service removes a screenshot from a generated step block
- service rejects screenshot updates for non-step blocks
- service rejects assets from another project/org
- service rejects deleted/non-image assets
- publish snapshot uses selected screenshot instead of source screenshot
- publish snapshot omits screenshot when hidden

Backend route tests:

- `PATCH /blocks/:id/screenshot` validates body
- route returns updated guide block
- route maps invalid block/asset cases correctly

Backend DB integration tests:

- selected screenshot persists and appears in guide detail
- hidden screenshot suppresses source screenshot fallback
- republish snapshot references the selected asset
- public asset streaming permits selected snapshotted asset and rejects non-snapshot assets

Web API tests:

- API client lists project screenshot assets
- API client sends selected asset id
- API client sends `null` for removal
- API client handles updated block response

Web editor tests:

- step with source screenshot shows change/remove controls
- changing screenshot calls API and updates displayed image
- removing screenshot hides the image and marks publish stale
- manual step without screenshot can attach a screenshot
- non-step blocks do not show screenshot controls

Preview/public reader tests:

- private preview renders selected screenshot
- private preview hides screenshot when removed
- public reader renders the snapshotted selected screenshot

## Implementation Order

1. Add backend failing tests for screenshot attach/remove behavior.
2. Add migration and schema test coverage.
3. Add project-level screenshot asset listing tests and API support in the capture asset domain.
4. Implement repository read/write support for selected screenshots.
5. Implement guide service validation and route handler.
6. Update publish snapshot generation and public asset authorization tests.
7. Add web API client tests and helpers.
8. Add editor screenshot attach/change/remove UI tests.
9. Implement the editor controls, picker, and local state patching.
10. Update private preview/public reader fixtures if the contract changes.
11. Run focused tests, then full typecheck/build/lint/test.
12. Update `docs/project-zoomout-status.md`.

## Acceptance Criteria

- A generated guide step can replace its source screenshot with another valid project screenshot.
- A generated guide step can explicitly hide its source screenshot.
- A manual step can attach an existing project screenshot.
- Non-step blocks cannot receive screenshots.
- Screenshot changes are scoped to the same organization and project.
- The screenshot picker can show valid screenshots that are not already referenced by the guide.
- Capture assets and capture events remain immutable.
- Private preview reflects draft screenshot changes.
- Public reader reflects only the last published snapshot.
- Public asset streaming remains constrained to snapshot-referenced assets.
- Editor marks an active published guide stale after screenshot changes.
- Tests cover backend service, routes, DB behavior, web API, editor behavior, and reader rendering.

## Risks And Guardrails

- Do not mutate `source_capture_asset_id`; keep provenance intact.
- Do not expose all project assets publicly; public asset access must remain snapshot-bounded.
- Do not allow cross-project asset references.
- Do not add upload-from-editor in this slice; that can come after screenshot reassignment.
- Do not build a full DAM-style asset manager.
- Keep UI practical and compact because guide editing is the main workflow.

## Future Follow-Ups

After this slice:

- upload a replacement screenshot directly from the guide editor
- annotate screenshots with highlight boxes or arrows
- crop/blur sensitive regions
- add paragraph/divider blocks
- add export to PDF/Markdown/HTML
- add embed support for public guides
- add interactive demo scene/hotspot foundation
