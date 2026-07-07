# Manual Capture Bulk Upload Portal Plan

Date: 2026-06-12

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Let authenticated portal users add multiple screenshots to a manual capture session in one workflow, creating one linked `capture` event per uploaded screenshot.

Target flow:

```text
authenticated portal user
  -> opens /projects/:project_id/capture-sessions/:capture_session_id
  -> sees a manual capture session
  -> selects multiple screenshot files
  -> portal uploads each screenshot sequentially
  -> portal creates one linked capture event for each uploaded screenshot
  -> page refreshes with the new screenshot-backed events
  -> user corrects order with the existing up/down controls if needed
  -> user creates a guide from the capture session
```

This builds directly on:

```text
docs/plan/043-manual-capture-session-upload-portal.md
docs/plan/044-manual-capture-event-ordering-portal.md
```

The product gap now is upload speed. Single-file upload works, and event ordering now makes bulk upload safe because users can fix order before guide generation.

## Why This Comes Next

Current state after `044`:

- users can create manual capture sessions from the portal
- users can upload one screenshot into a manual capture session
- each uploaded screenshot creates a linked `capture` event
- manual capture events can be moved up/down before guide generation
- guide generation uses persisted event order

Remaining gap:

- uploading a 10-20 screenshot guide one file at a time is too slow
- users naturally expect selecting several screenshots from a folder
- portal manual capture should be viable even before the Chrome extension is used

Bulk upload should come before drag-and-drop polish, event text editing, bulk reorder UI, advanced guide export, analytics, AI, or interactive demos because it improves the core manual documentation workflow without changing backend domains.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0002-capture-sessions-as-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0009-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-privacy-preserving-capture-defaults.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/011-capture-session-detail-read-model.md
docs/plan/027-guide-generation-from-capture-events.md
docs/plan/043-manual-capture-session-upload-portal.md
docs/plan/044-manual-capture-event-ordering-portal.md
```

Important implications:

- capture sessions remain reusable source material
- this slice should not create a separate bulk-upload backend domain unless the existing endpoints cannot support the workflow
- screenshot upload should remain screenshot-first; no HTML replay work
- no raw input values should be introduced
- one uploaded screenshot should still create one linked `capture` event
- event ordering should remain deterministic and contiguous
- extension/import capture sessions should remain read-only for manual portal uploads
- use cookie-backed portal authentication
- use TDD for implementation
- do not add AI, analytics, interactive demos, drag-and-drop, or advanced export behavior

## Scope

Included:

- portal multi-file screenshot input on `CaptureSessionDetailPage`
- multiple selected files accepted from the existing manual upload panel
- client-side validation for every selected file:
  - at least one file selected
  - all files are PNG, JPEG, or WebP
- sequential upload behavior:
  - upload first file
  - create linked `capture` event
  - then move to the next file
- initial event indexes assigned after the current max `event_index`
- selected file order preserved as the initial upload order
- per-file progress/status display
- selecting a new set of files replaces the previous queue and clears previous queue statuses/errors
- partial success handling:
  - already uploaded screenshots/events remain saved
  - failed file shows an error
  - user can reload or retry later
- pending state disables upload controls and prevents duplicate submissions
- successful completion refreshes capture session detail
- focused web page tests
- update `docs/project-zoomout-status.md`

Excluded:

- new backend bulk-upload endpoint
- uploading files concurrently
- drag-and-drop upload
- manual file reordering before upload
- editing event titles/notes during upload
- deleting failed/successful queued items from the queue
- canceling an in-progress upload batch
- resumable uploads
- chunked uploads
- zip upload
- folder upload via non-standard browser APIs
- custom client-side batch size limits beyond existing per-file/server limits
- asset-level ordering separate from event ordering
- changing guide generation behavior
- ordering extension/import capture sessions
- HTML snapshot/replay work
- AI
- analytics
- interactive demo work

## Recommended Implementation Shape

Prefer reusing existing APIs:

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/detail
```

Reasoning:

- backend already supports screenshot upload and event creation
- each screenshot is still a normal capture asset
- each linked event is still a normal capture event
- existing backend validations continue to protect scope and raw input values
- existing manual event ordering can fix any order mistakes after upload
- keeps this slice focused on portal workflow usability

Do not add a backend bulk endpoint in this slice unless tests expose a hard correctness gap.

## Portal UX

Update the existing manual upload panel from single screenshot upload to a simple batch-capable upload surface.

Recommended UI:

```text
Upload screenshot(s)
  file input with multiple=true
  optional shared Page title
  optional shared Page URL
  Upload Screenshots button
  selected file list with status:
    queued
    uploading
    event created
    failed
```

The page title/page URL fields should apply to every file in the batch for this first slice.

Normalize shared metadata once at submit time:

```text
page_title: trimmed value or null
page_url: trimmed value or null
```

For event content:

```text
target_label: "Uploaded screenshot"
note: "Uploaded screenshot: {file.name}"
page_title: shared title or null
page_url: shared URL or null
occurred_at: per-file upload timestamp
```

Button text:

```text
Upload Screenshot
Upload Screenshots
Uploading Screenshots...
```

Use singular text when exactly one file is selected and plural text when multiple files are selected.

## Upload Algorithm

Current event index source:

```text
nextIndex = max(detail.capture_events.event_index) + 1
```

For each selected file in browser-provided order:

```text
baseIndex = max(detail.capture_events.event_index) + 1
pageTitle = trimmed shared Page title or null
pageUrl = trimmed shared Page URL or null

for file, offset in selectedFiles:
  capturedAt = new Date().toISOString()
  upload asset with file/pageTitle/pageUrl/capturedAt
  create capture event with:
    event_type: "capture"
    event_index: baseIndex + offset
    capture_asset_id: uploaded asset id
    occurred_at: capturedAt
    page_title: pageTitle
    page_url: pageUrl
    target_label: "Uploaded screenshot"
    note: "Uploaded screenshot: {file.name}"
```

Sequential behavior is intentional.

Reasoning:

- avoids a burst of multipart uploads
- keeps event index assignment deterministic
- makes per-file failure easier to explain
- reduces risk of duplicate index conflicts in the first implementation

If another actor concurrently creates capture events and a duplicate index conflict occurs, keep the same behavior as the current single-file upload: stop the batch, show the mapped conflict/partial-success error, and let the user reload before retrying.

## Partial Success

If upload fails before asset creation:

```text
mark that file failed
stop the batch
show the mapped upload error
keep successful prior files visible in the status list
refresh detail if at least one file succeeded
do not clear the file input or shared metadata fields
```

If event creation fails after asset upload:

```text
mark that file failed with partial-success message
stop the batch
refresh detail if at least one prior event succeeded
tell user the screenshot uploaded but the event could not be created
do not clear the file input or shared metadata fields
```

Do not attempt cleanup in this slice.

Reasoning:

- existing single-file upload already treats asset-created/event-failed as a partial success
- cleanup would need a more deliberate asset delete/retry story
- stopping on first failure avoids hidden mixed ordering assumptions

## Validation

Client-side validation:

- reject when no files are selected
- reject when any selected file is not PNG, JPEG, or WebP
- reject the whole batch before uploading if any file is invalid
- clear validation errors when file selection or metadata fields change
- replace previous queue state when file selection changes
- rely on existing server-side upload size and multipart validation for actual persisted files

Server-side validation remains unchanged because this slice should reuse existing upload/event endpoints.

## Error Messages

Recommended user-facing messages:

```text
Choose one or more screenshots to upload.
Only PNG, JPEG, and WebP screenshots can be uploaded.
Screenshot input is invalid.
Screenshot is too large.
Sign in to upload screenshots.
Capture session was not found.
Screenshot uploaded, but another event used that order. Reload and try again.
Screenshot uploaded, but the capture event could not be created. Reload and try again.
Could not upload screenshots.
```

Use the existing single-file error mapping where possible.

## Web API Work

No new API helper is expected.

Reuse:

```ts
uploadCaptureSessionAsset(projectId, captureSessionId, input)
createCaptureSessionEvent(projectId, captureSessionId, input)
getCaptureSessionDetail(projectId, captureSessionId)
```

If types need small adjustment, keep them in:

```text
apps/web/src/features/capture-session/types.ts
apps/web/src/lib/api.ts
```

But avoid adding a bulk API client abstraction unless it removes real duplication in the page.

## Portal Work

Update:

```text
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css
apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx
```

Expected page behavior:

- manual capture sessions show bulk-capable screenshot upload controls
- extension/import sessions hide upload controls
- file input supports selecting multiple files
- one selected file behaves like the current single-file flow
- multiple selected files upload sequentially
- per-file status is visible while upload is pending and after failure
- changing the file selection replaces the queued file list and clears stale statuses
- successful full batch clears file input and metadata fields
- successful full batch refreshes detail
- partial success refreshes detail and keeps error/status visible
- partial success does not clear file input or metadata fields
- upload controls disable while pending
- event reorder controls remain available after reload

## Testing Plan

Follow TDD.

Portal tests:

- manual sessions render multi-file upload input
- extension sessions hide upload controls
- no file selected shows validation error
- invalid file anywhere in the selection rejects the whole batch before uploading
- one selected file still uploads and creates one event
- multiple selected files upload sequentially and create events in selected order
- event indexes start after current max `event_index`
- shared page title/page URL are applied to every uploaded asset/event
- changing selected files resets the queue/status list
- successful batch clears the form and reloads detail
- partial success does not clear the form and reloads detail when at least one event was created
- pending batch disables upload controls and prevents duplicate submit
- asset upload failure stops the batch and shows mapped error
- event creation failure after asset upload shows partial-success error
- partial success refreshes detail when at least one event was created

API tests:

- no new API tests expected unless API helper signatures change

Backend tests:

- no new backend tests expected if existing endpoints are reused unchanged

Recommended focused commands:

```bash
rtk pnpm --filter web test -- CaptureSessionDetailPage.test.tsx
rtk pnpm --filter web test -- api.test.ts
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

If backend code changes unexpectedly:

```bash
rtk pnpm --filter server test -- capture-asset capture-event capture-session
rtk pnpm --filter server exec env-cmd -f .env-cmdrc -e testing -- vitest run --no-file-parallelism src/modules/capture-asset/capture-asset.db.integration.test.ts src/modules/capture-event/capture-event.db.integration.test.ts
```

## Implementation Sequence

1. Add failing portal tests for multi-file selection, validation, sequential upload, and partial failure.
2. Update upload state from a single file to a selected file list.
3. Add per-file queue/status rendering.
4. Implement batch validation before any upload starts.
5. Implement sequential upload and linked event creation using existing helpers.
6. Preserve existing single-file behavior as the one-file case.
7. Add partial success handling and reload behavior.
8. Refine CSS for the selected file/status list.
9. Update `docs/project-zoomout-status.md`.
10. Run focused and full verification.

## Acceptance Criteria

- Users can select multiple PNG/JPEG/WebP screenshots in a manual capture session.
- Each uploaded screenshot creates a capture asset and linked `capture` event.
- Initial event order follows selected file order.
- Event indexes are contiguous after existing events for the batch.
- Uploads run sequentially.
- Invalid file selections are rejected before any upload starts.
- Upload controls are disabled while a batch is pending.
- Successful batches refresh capture session detail.
- Partial failures preserve already-created source material and show clear status/error messaging.
- Partial failures do not clear the selected file input or shared metadata fields.
- Existing manual event up/down ordering remains available after upload.
- Extension/import capture sessions do not show manual upload controls.
- No new backend bulk endpoint is introduced unless implementation proves it necessary.
- No drag-and-drop, AI, analytics, HTML replay, or interactive demo behavior is introduced.

## Commit Plan

Recommended small commits when implementing:

1. `Add portal bulk screenshot upload tests`
2. `Add manual capture bulk screenshot upload`
3. `Update bulk upload status docs`
