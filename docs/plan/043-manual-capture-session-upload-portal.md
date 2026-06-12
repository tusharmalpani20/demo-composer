# Manual Capture Session Upload Portal Plan

Date: 2026-06-12

## Goal

Let authenticated portal users add screenshot source material to a manual capture session from the capture session detail page.

Target flow:

```text
authenticated portal user
  -> opens /projects/:project_id/capture-sessions/:capture_session_id
  -> sees a manual draft capture session
  -> selects a PNG/JPEG/WebP screenshot from disk
  -> portal uploads the screenshot as a capture asset
  -> portal creates a linked capture event for that uploaded asset
  -> detail page refreshes and shows the new asset/event
  -> user can generate a guide from the uploaded screenshot-backed event
```

This completes the first useful portal-only source-material loop after `042-capture-session-creation-portal`.

## Why This Comes Next

Current state after `042`:

- users can create projects from the portal
- users can create manual capture sessions from the portal
- capture session detail already renders capture events and assets
- capture session detail already supports creating a guide from capture source material
- backend already supports screenshot capture asset upload
- backend already supports capture event creation
- guide generation already creates useful steps from screenshot-backed `capture` events

Remaining product gap:

- a portal-created manual capture session is currently an empty container
- portal-only users still need the Chrome extension or a direct guide-editor workaround to add screenshot source material
- guide generation from a manual capture session needs ordered capture events linked to uploaded screenshots

Manual screenshot upload should come before manual event editing, bulk upload, drag-and-drop polish, analytics, AI, or interactive demos because it makes the portal-created capture session immediately useful.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0002-capture-sessions-as-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0008-file-domain-owns-storage-metadata.md
docs/adr/0009-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-privacy-preserving-capture-defaults.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/009-capture-asset-upload-storage.md
docs/plan/011-capture-session-detail-read-model.md
docs/plan/012-capture-session-detail-portal.md
docs/plan/027-guide-generation-from-capture-events.md
docs/plan/042-capture-session-creation-portal.md
```

Important implications:

- capture sessions remain reusable source material
- capture assets and capture events remain immutable source records
- uploads must use the existing file/capture asset storage path
- uploaded screenshots must be session-scoped, not generic project assets
- screenshots come first; no HTML replay work in this slice
- raw input values must not be captured
- keep Chrome extension capture behavior unchanged
- keep REST API helpers in `apps/web/src/lib/api.ts`
- use cookie-backed portal authentication
- use TDD for implementation
- do not add AI, analytics, or interactive demo behavior

## Scope

Included:

- API client helper for `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload`
- API client helper for `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events`
- request/response types for capture asset upload and capture event creation in the web app
- screenshot upload panel on `CaptureSessionDetailPage` for `source_type: "manual"` sessions
- file picker for one screenshot at a time
- supported file types in the portal UI:
  - PNG
  - JPEG
  - WebP
- client-side validation for missing file and unsupported file MIME type
- upload metadata sent with the asset:
  - `captured_at`
  - optional `page_url`
  - optional `page_title`
- capture event created after successful upload:
  - `event_type: "capture"`
  - linked `capture_asset_id`
  - next `event_index` based on current detail event count
  - `occurred_at` matching upload capture time
  - optional `page_url`
  - optional `page_title`
  - useful note or target label derived from filename/title
- submit loading state and duplicate-submit prevention
- upload/event error messaging that keeps the selected form data visible after failure
- refresh capture session detail after successful upload and linked event creation
- preserve existing guide creation behavior
- focused API helper tests
- focused capture session detail upload UI tests
- update `docs/project-zoomout-status.md`

Excluded:

- backend API changes unless implementation reveals a contract gap
- database migrations
- changing capture asset immutability rules
- changing guide generation rules
- bulk screenshot upload
- drag-and-drop upload
- upload progress bars
- image preview before upload
- screenshot reordering UI
- manual event edit/delete UI
- manual event notes UI beyond a simple generated note/label
- adding portal upload controls to extension/import capture sessions
- image dimension extraction in the browser unless already trivial and reliable
- screenshot annotation, redaction, cropping, masking, or compression
- HTML snapshot upload
- GIF/video upload
- capture session complete/finalize UI
- Chrome extension changes
- public sharing changes
- analytics
- AI
- interactive demo creation

## Backend Contracts

Existing upload route:

```http
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
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

Recommended first implementation should send:

```text
file
page_url, only if provided
page_title, only if provided
captured_at: current ISO timestamp
```

The existing upload route intentionally creates `asset_type: "screenshot"` assets. The portal should not append an `asset_type` multipart field for this route because the backend does not read it.

Success response:

```json
{
  "capture_asset": {
    "id": "capture_asset_1",
    "project_id": "project_1",
    "capture_session_id": "capture_session_1",
    "asset_type": "screenshot",
    "file_url": "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/file"
  }
}
```

Existing event route:

```http
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
Content-Type: application/json
```

Recommended request body after upload:

```json
{
  "event_type": "capture",
  "event_index": 1,
  "capture_asset_id": "capture_asset_1",
  "occurred_at": "2026-06-12T00:00:00.000Z",
  "page_url": "https://example.internal/app",
  "page_title": "Department List",
  "target_label": "Uploaded screenshot",
  "note": "Uploaded screenshot: department-list.png"
}
```

Important privacy rule:

```text
Do not send input_value or raw form values.
```

Expected error types to map:

```text
401 unauthenticated
404 project_not_found
404 capture_session_not_found
400 invalid_capture_asset_upload
400 upload_file_required
413 upload_too_large
400 invalid_capture_event
409 capture_event_index_conflict
unknown network/server failure
```

## Web API Client Work

Update:

```text
apps/web/src/features/capture-session/types.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Add types:

```ts
export type UploadCaptureAssetInput = {
  file: File;
  page_url?: string | null;
  page_title?: string | null;
  captured_at?: string;
};

export type UploadCaptureAssetResponse = {
  capture_asset: CaptureAsset;
};

export type CreateCaptureEventInput = {
  event_type: CaptureEventType;
  event_index: number;
  capture_asset_id?: string | null;
  occurred_at?: string;
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  note?: string | null;
};

export type CreateCaptureEventResponse = {
  capture_event: CaptureEvent;
};
```

Add helpers:

```ts
uploadCaptureSessionAsset(projectId, captureSessionId, input)
createCaptureSessionEvent(projectId, captureSessionId, input)
```

API helper expectations:

- upload helper uses `FormData`
- upload helper appends only backend-supported multipart fields
- upload helper does not set `content-type` manually
- both helpers keep `credentials: "include"` through `requestJson`
- both helpers URL-encode project and capture session IDs
- event helper sends JSON with `content-type: application/json`
- tests assert request URL, method, credentials, and body shape

## Portal UI Work

Update:

```text
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css
apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx
```

Add injectable dependencies to `CaptureSessionDetailPage`:

```ts
uploadAsset?: (projectId, captureSessionId, input) => Promise<UploadCaptureAssetResponse>;
createCaptureEvent?: (projectId, captureSessionId, input) => Promise<CreateCaptureEventResponse>;
```

Recommended UI placement:

```text
Header/action area
  Create guide button remains primary guide action

New source material panel above Events/Assets
  Upload screenshot
  File input
  Page title input, optional
  Page URL input, optional
  Upload button
  Status/error message
```

The panel should appear on manual capture session detail pages regardless of whether the list is empty, because manual sessions may already have some screenshots and users may want to add more. Do not show the portal upload panel for extension/import sessions in this slice; those sessions keep their existing capture/source behavior.

Initial behavior:

- allow one selected file at a time
- validate file presence before submit
- reject unsupported MIME types before submit
- disable submit while upload/event creation is in progress
- after success, clear the form and reload detail
- if upload succeeds but event creation fails, show a specific message explaining the screenshot uploaded but the event was not created
- do not create a guide automatically after upload

## Event Index Rule

First implementation:

```text
next_event_index = max(existing capture_events.event_index) + 1
```

If no events exist:

```text
next_event_index = 1
```

Reasoning:

- preserves ordered guide generation
- avoids relying on array length when events could have gaps after soft deletes
- keeps ordering deterministic for manually uploaded screenshots

If the backend returns `capture_event_index_conflict`:

```text
reload detail and tell the user to try again
```

Do not build automatic retry in this slice unless tests reveal it is trivial and safe.

## Error Messaging

Recommended messages:

```text
Choose a screenshot to upload.
Only PNG, JPEG, and WebP screenshots can be uploaded.
Sign in to upload screenshots.
Capture session was not found.
Screenshot input is invalid.
Screenshot is too large.
Screenshot uploaded, but the capture event could not be created. Reload and try again.
Could not upload screenshot.
Another event used that order. Reload and try again.
```

Keep errors form-level. Do not add global toasts in this slice.

## Testing Plan

Follow TDD.

API tests:

- upload helper posts `FormData` to the encoded asset upload route
- upload helper includes optional page metadata and captured timestamp when provided
- event helper posts JSON to the encoded events route
- event helper preserves session-cookie credentials
- error handling continues to produce `ApiClientError`

Portal tests:

- upload panel renders on a loaded capture session
- upload panel is hidden for extension/import capture sessions
- missing file validation prevents upload
- unsupported MIME type validation prevents upload
- successful upload creates a linked `capture` event with next event index
- successful upload reloads capture session detail and clears form
- submit button is disabled while upload/event creation is pending
- upload failure shows a form error and keeps entered metadata
- event creation failure after upload shows the partial-success error
- unauthenticated upload/event errors map to a sign-in message
- not-found upload/event errors map to capture-session-not-found messaging
- event-index conflict maps to reload-and-try-again messaging
- existing create guide tests keep passing

Recommended focused commands:

```bash
rtk pnpm --filter web test -- api.test.ts CaptureSessionDetailPage.test.tsx
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

## Implementation Sequence

1. Add failing API helper tests for upload and event creation.
2. Add web capture-session types and API helpers.
3. Add failing `CaptureSessionDetailPage` tests for upload form behavior.
4. Add upload form state, validation, and injected dependencies.
5. Implement upload-then-event-create workflow.
6. Reload capture session detail after success.
7. Add CSS for the upload panel using the existing portal visual language.
8. Update `docs/project-zoomout-status.md`.
9. Run focused tests, full web tests, typecheck, lint, build, and diff checks.

## Acceptance Criteria

- A portal user can upload one screenshot into a manual capture session.
- The uploaded screenshot is stored as a normal `screenshot` capture asset.
- A linked `capture` event is created for guide generation.
- The capture session detail page reloads and shows the new asset and event.
- Existing guide generation from capture session can use the uploaded screenshot-backed event.
- File upload and event creation have focused API tests.
- The detail page has focused UI tests for success, validation, and important error cases.
- Existing Chrome extension capture behavior is unchanged.
- Existing guide editor direct screenshot upload behavior is unchanged.
- No AI, analytics, HTML replay, bulk upload, or interactive demo behavior is introduced.

## Commit Plan

Recommended small commits when implementing:

1. `Add capture session upload API helpers`
2. `Add portal manual screenshot upload`
3. `Update manual capture upload status docs`
