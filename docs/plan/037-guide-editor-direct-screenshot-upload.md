# Guide Editor Direct Screenshot Upload Plan

Date: 2026-06-11

## Goal

Let users upload a brand-new replacement screenshot directly from the guide editor and attach it to a guide step in one flow.

Target flow:

```text
user opens guide editor
  -> user finds a step with a missing or wrong screenshot
  -> user clicks upload/change screenshot
  -> user selects a local PNG/JPEG/WebP file
  -> backend stores the file as a normal capture asset in the same project
  -> backend selects that uploaded asset for the guide block
  -> editor immediately renders the uploaded screenshot
  -> private preview renders the uploaded screenshot
  -> republish captures the uploaded screenshot into the immutable public snapshot
```

This is the natural follow-up to `036-guide-step-screenshot-management`. Plan `036` lets users choose from screenshots that already exist in the project. This slice handles the common correction case where the right replacement screenshot is not already in the capture session.

## Why This Comes Next

Current state after `036`:

- guide blocks can keep source screenshot provenance separate from selected screenshot choice
- users can attach, change, or remove a step screenshot using existing project screenshots
- guide detail exposes effective screenshot assets
- private preview renders effective selected screenshots
- publish snapshots use selected or hidden screenshot state
- public reader renders the snapshotted selected screenshot
- capture assets remain immutable source material

Remaining product gap:

- users still need to create or find a capture session just to add one replacement screenshot
- manually added steps can select existing screenshots but cannot upload a screenshot inline
- the editor has no direct "fix this screenshot" path when the project screenshot list does not contain the right image

This should be fixed before annotations, export, richer blocks, analytics, or interactive demos because screenshot replacement is part of the basic internal documentation workflow.

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
docs/plan/009-capture-asset-upload-storage.md
docs/plan/030-guide-editor-screenshot-rendering.md
docs/plan/036-guide-step-screenshot-management.md
```

Important implications:

- capture assets are immutable once created
- guide screenshot edits should select assets, not mutate existing capture assets
- file bytes and storage metadata stay owned by the existing file/capture asset path
- public links resolve to immutable snapshots
- draft changes do not affect public output until republish
- uploaded replacement screenshots must stay scoped to the same organization and project
- no AI, annotation, cropping, masking, or image processing should be introduced in this slice

## Scope

Included:

- backend service support for uploading a screenshot for a specific guide block
- authenticated route for multipart guide-step screenshot upload
- validation that the guide, block, project, and organization all match
- validation that the target block is a `step` block
- validation that the guide is editable
- validation that only PNG/JPEG/WebP image uploads are accepted
- local file storage through the existing capture asset upload path
- creation of a normal `capture_schema.capture_asset` record for the uploaded screenshot
- automatic selection of the uploaded asset on the target guide block
- immediate response with the updated `guide_block` and uploaded `capture_asset`
- editor UI to upload a replacement screenshot from the step media controls
- editor state update so the uploaded asset appears without a full page reload
- private preview and public reader behavior should keep working through existing effective screenshot fields
- focused backend and web tests
- update `docs/project-zoomout-status.md`

Excluded:

- changing `capture_asset.capture_session_id` to nullable
- adding a separate generic project asset table
- adding an asset library/media manager
- bulk screenshot uploads
- drag-and-drop gallery management
- cropping, resizing, redaction, annotation, masking, or highlight overlays
- external image URL import
- HTML snapshot upload
- thumbnail upload
- GIF/video upload
- replacing screenshots across multiple blocks at once
- public access-rule changes
- analytics
- AI/BYO-key screenshot correction

## Recommended Approach

Use the existing capture asset model and keep uploads session-scoped for now.

The current schema requires every capture asset to belong to a capture session:

```text
capture_schema.capture_asset.capture_session_id NOT NULL
```

Changing that would ripple through asset listing, file reads, public asset access, capture-session detail, event generation, and repository assumptions. That is not needed to make the editor useful.

Recommended rule for this slice:

```text
When uploading a replacement screenshot from a guide step:
  create a normal screenshot capture asset under the guide block's source_capture_session_id
  then set guide_block.selected_capture_asset_id to that new asset
```

For manual step blocks that do not have their own source capture session:

```text
use the guide.source_capture_session_id as the upload anchor
```

Reasoning:

- keeps the data model stable
- reuses existing file storage and capture asset upload behavior
- keeps public asset file URLs compatible with the existing `/capture-sessions/:id/assets/:id/file` route
- keeps immutable capture source records intact
- avoids introducing an "asset library" domain before the product needs it
- gives users the practical editor workflow now

## API Shape

Recommended endpoint:

```http
POST /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload
Content-Type: multipart/form-data
```

Multipart fields:

```text
file: required image file
width: optional positive integer
height: optional positive integer
device_pixel_ratio: optional positive number
page_url: optional string
page_title: optional string
captured_at: optional ISO datetime
metadata: optional JSON object
```

Response status:

```text
201 Created
```

Response body:

```json
{
  "guide_block": {},
  "capture_asset": {
    "id": "asset_123",
    "capture_session_id": "capture_session_123",
    "asset_type": "screenshot",
    "file_url": "/api/v1/projects/project_123/capture-sessions/capture_session_123/assets/asset_123/file"
  }
}
```

Why a guide-scoped endpoint instead of only calling the existing asset upload route from the web client:

- the backend can validate the guide block and upload anchor before accepting file bytes
- the editor does not need to know which capture session should receive the uploaded asset
- the backend can expose upload-and-select as one product operation
- a failed selection should not leave the UI pretending the upload is attached
- route intent is clear: "upload screenshot for this guide step"

Implementation should delegate to the existing capture asset service for file storage and capture asset creation. The guide route can orchestrate the product operation while keeping file-storage ownership in the capture asset module.

Important implementation note:

```text
validate guide/block/editability/upload session first
  -> upload capture asset through capture_asset_service.upload_capture_asset
  -> select uploaded asset through guide_service.update_guide_block_screenshot
```

The file write and DB insert for the capture asset are already protected by the capture asset service. The follow-up guide selection is a second operation, so the implementation should validate all guide/block state before uploading and use best-effort cleanup if selection unexpectedly fails after upload.

## Backend Plan

### 1. Add Service Input

Add a guide service method for preflight validation and upload-session resolution:

```ts
prepare_guide_block_screenshot_upload(input: {
  auth: GuideAuthContext;
  project_id: string;
  guide_id: string;
  guide_block_id: string;
}): Promise<{
  capture_session_id: string;
}>
```

The guide service should:

- verify project exists in the actor organization
- verify guide exists in that project
- reject non-editable guides
- find the guide block
- reject non-step blocks
- resolve upload capture session:
  - `guide_block.source_capture_session_id`
  - fallback to `guide.source_capture_session_id`
- reject if no upload capture session exists
- return the capture session id that the upload should use

Then reuse the existing `update_guide_block_screenshot` method after upload to select the uploaded asset.

Recommended orchestration shape:

```ts
const prepared = await guide_service.prepare_guide_block_screenshot_upload(...)
const capture_asset = await capture_asset_service.upload_capture_asset({
  auth,
  project_id,
  capture_session_id: prepared.capture_session_id,
  file,
  data,
})
const guide_block = await guide_service.update_guide_block_screenshot({
  auth,
  project_id,
  guide_id,
  guide_block_id,
  data: { capture_asset_id: capture_asset.id },
})
return { guide_block, capture_asset: with_file_url(capture_asset) }
```

Reasoning:

- capture asset module remains the owner of file storage and asset creation
- guide module remains the owner of guide editability and screenshot selection rules
- the route becomes a thin product orchestration layer rather than a new storage implementation

### 2. Reuse Capture Asset Upload Logic

The existing capture asset service already handles:

- multipart image upload
- image MIME validation
- upload size limit
- local file storage write
- cleanup if metadata insert fails
- file metadata creation
- capture asset metadata creation

Use this implementation path:

- inject the capture asset service into `build_guide_routes`
- call `upload_capture_asset`
- call `update_guide_block_screenshot` with the returned asset id

The current app already builds a default capture asset service with `default_capture_file_storage`. Reuse that same service when registering guide routes so the guide upload endpoint has the same MIME validation, max-size limit, local storage root, file cleanup, and test behavior as the existing capture-session asset upload endpoint.

Avoid:

- duplicating file-storage write logic in the guide module
- creating a second local file storage provider only for guide uploads
- making guide service depend directly on low-level file storage

### 3. Add Route

Add route:

```http
POST /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload
```

Route responsibilities:

- require portal auth cookie
- parse multipart upload
- require `file`
- ignore client-managed fields like organization/project/asset ids
- call guide preflight validation before uploading bytes
- upload through `capture_asset_service.upload_capture_asset`
- select the uploaded asset through `guide_service.update_guide_block_screenshot`
- return the selected block and uploaded asset with a file URL
- pass safe upload metadata to service
- map domain errors to stable response types

Expected errors:

```text
401 unauthenticated
404 project_not_found
404 guide_not_found
404 guide_block_not_found
404 capture_session_not_found
400 invalid_capture_asset_upload
400 unsupported_capture_asset_upload_type
400 invalid_guide_block_screenshot
409 guide_not_editable
413 upload_too_large
500 file_storage_write_failed
```

### 4. App Wiring

Update app registration so guide routes can use the same capture asset upload service as capture asset routes.

Recommended app-level shape:

```ts
const default_capture_asset_service = capture_asset_service ?? build_capture_asset_service(
  build_capture_asset_repository(pool),
  {
    file_storage: default_capture_file_storage,
    max_upload_bytes: max_screenshot_upload_bytes,
  }
)

app.register(build_capture_asset_routes({
  auth_service,
  capture_asset_service: default_capture_asset_service,
}), ...)

app.register(build_guide_routes({
  auth_service,
  guide_service,
  capture_asset_service: default_capture_asset_service,
}), ...)
```

This avoids accidentally creating two service instances with different storage options.

### 5. Repository Needs

The guide repository already supports updating guide block screenshot selection.

Add only what is missing:

- a way to read and validate the guide block upload target with its guide/source session context
- or reuse existing guide detail/block lookup methods

Do not add a schema migration unless implementation discovers a real missing field.

Expected no new DB migration in this slice because `036` already added:

```text
guide_block.selected_capture_asset_id
guide_block.screenshot_hidden
```

### 6. Publish Behavior

No publish schema change should be needed.

Published snapshots should already use:

```text
guide_block.display_capture_asset_id
```

The uploaded replacement screenshot should flow through the same effective screenshot path as any selected project screenshot.

Add/extend tests to prove:

- draft upload does not change active public snapshot until republish
- republish includes the uploaded screenshot
- public file access only allows assets referenced by the active snapshot

## Web Plan

### 1. API Client

Add helper:

```ts
uploadGuideBlockScreenshot(
  projectId: string,
  guideId: string,
  guideBlockId: string,
  input: {
    file: File;
    width?: number;
    height?: number;
    devicePixelRatio?: number;
    pageUrl?: string;
    pageTitle?: string;
    capturedAt?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{
  guide_block: GuideBlock;
  capture_asset: CaptureAssetWithFileUrl;
}>
```

Use `FormData`.

Do not manually set `Content-Type`; the browser must set the multipart boundary.

### 2. Editor UI

In `GuideEditorPage` step media controls:

- keep current "Attach/Change screenshot" picker
- add upload control beside it
- accept `.png,.jpg,.jpeg,.webp`
- show per-block uploading state
- disable duplicate upload actions while the block is uploading
- on success:
  - replace the block in local state
  - merge the returned capture asset into `source_capture_assets`
  - close any screenshot picker for that block
  - mark publish status stale if the guide has an active published link
  - show concise success notice
- on failure:
  - keep current block state unchanged
  - show concise failure notice

Recommended UI labels:

```text
Upload screenshot
Uploading...
Change screenshot
Remove screenshot
```

Keep the UI simple. This is not an asset manager.

### 3. Preview And Public Reader

No new rendering logic should be needed if the editor merges the returned asset and the backend read model exposes effective screenshot assets.

Still add regression tests for:

- uploaded screenshot renders in editor immediately
- preview renders blocks using `display_capture_asset_id`
- public reader still uses snapshot asset data after publish

## Test Plan

Use TDD for implementation.

### Backend Unit Tests

Guide service:

- resolves the upload capture session for a valid editable step block
- falls back to `guide.source_capture_session_id` when block source session is missing
- rejects non-step blocks
- rejects missing blocks
- rejects non-editable guides
- rejects missing upload capture session with `InvalidGuideBlockScreenshotError`
- keeps existing screenshot selection tests green

Capture asset service:

- no new behavior expected unless helper extraction changes public behavior
- keep existing upload cleanup tests green

### Backend Route Tests

Guide routes:

- parses multipart upload and passes only safe fields to the service
- calls guide preflight before `capture_asset_service.upload_capture_asset`
- uploads to the capture session returned by guide preflight
- selects the uploaded asset through `guide_service.update_guide_block_screenshot`
- returns `{ guide_block, capture_asset }`
- maps upload/domain errors to stable response types
- rejects missing file
- ignores client-managed fields
- does not upload bytes when guide preflight fails
- does not report success if screenshot selection fails after upload

### DB Integration Tests

Add one end-to-end DB integration test:

```text
create project
create capture session
create screenshot-backed guide
upload replacement screenshot from guide block route
assert file row exists
assert capture asset row exists under expected capture session
assert guide block selected_capture_asset_id points at uploaded asset
assert guide detail display_capture_asset_id points at uploaded asset
publish or republish
assert snapshot references uploaded asset
```

### Web Tests

API client:

- posts `FormData` to the new endpoint
- includes optional metadata fields correctly

Guide editor:

- shows upload action on step blocks
- uploads a selected file
- replaces local guide block on success
- merges returned asset into screenshot assets/read model
- displays the uploaded screenshot immediately
- shows error notice and preserves current screenshot on failure
- marks publish state stale after successful upload when currently published

## Edge Cases

### Upload Succeeds But Selection Fails

Preferred behavior:

- avoid this by validating guide/block/editability before uploading bytes
- after upload, selection should only fail for unexpected races
- if selection fails after upload, surface the error and do not show the asset as attached

Optional cleanup:

- best-effort soft-delete the newly created capture asset if selection fails, using the uploaded asset id and upload capture session id

Do not overbuild cleanup unless the existing service/repository shape makes it cheap.

### Manual Step Without Source Session

Use `guide.source_capture_session_id`.

If the guide has no source capture session, reject with `invalid_guide_block_screenshot`.

### Existing Published Link

Uploading a replacement screenshot is a draft edit.

Expected behavior:

- active public link remains unchanged
- editor shows stale published state
- republish creates a new immutable snapshot containing the uploaded screenshot

### Deleted Assets

Uploaded asset should be active.

If a selected uploaded asset is later deleted, existing read-model behavior should continue to avoid exposing deleted assets. Do not add asset delete UX in this slice.

## Security And Privacy

- require authenticated portal session
- enforce organization and project scope on every lookup
- never trust project, organization, capture session, file, or asset ids from the multipart body
- restrict upload MIME types to PNG/JPEG/WebP
- keep current upload size limit
- do not expose storage keys
- do not expose checksums publicly unless already intentionally exposed
- do not add public access to draft uploads unless included in an active published snapshot
- do not store raw user-entered secrets in metadata

## Acceptance Criteria

- A user can upload a PNG/JPEG/WebP screenshot from a step in the guide editor.
- The uploaded screenshot is stored as a normal capture asset in the same organization and project.
- The uploaded screenshot is selected on the target guide block.
- The editor renders the uploaded screenshot immediately after upload.
- The private preview renders the uploaded screenshot.
- Existing public links do not change until republish.
- Republished public snapshots render the uploaded screenshot.
- Source capture events and existing capture assets are not mutated.
- Non-step blocks cannot receive screenshot uploads.
- Unsupported files are rejected with stable errors.
- Backend and web tests cover success and failure cases.
- `docs/project-zoomout-status.md` is updated after implementation.

## Suggested Commit Split

Commit 1:

```text
Add guide screenshot upload API
```

Backend service, route, repository wiring if needed, and backend tests.

Commit 2:

```text
Add editor screenshot upload UI
```

Web API helper, editor controls, state updates, and web tests.

Commit 3:

```text
Update guide upload status docs
```

`docs/project-zoomout-status.md` update after verification.

## Open Questions Before Implementation

1. Should uploaded editor screenshots be visually labeled as "uploaded replacement" in the screenshot picker later?

   Recommendation: not in this slice. The picker can show them normally because they are project screenshots.

2. Should the editor extract image dimensions in the browser before upload?

   Recommendation: yes if cheap, but not required. Backend accepts optional dimensions; missing dimensions should not block upload.

3. Should failed post-upload selection soft-delete the uploaded asset?

   Recommendation: best-effort cleanup only if straightforward. The main safety boundary is validating guide/block/editability before uploading.

4. Should this create a dedicated manual/editor capture session?

   Recommendation: not yet. Use the guide or block source capture session. If asset-library needs grow later, revisit with a separate ADR.
