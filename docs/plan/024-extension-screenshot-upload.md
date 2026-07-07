# Extension Screenshot Upload Plan

Date: 2026-06-06

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Let the Chrome extension capture the visible browser tab as a screenshot and upload it to the active capture session.

Target flow:

```text
user opens extension popup
  -> extension is connected and signed in
  -> active capture session exists
  -> user clicks Capture screenshot
  -> extension captures visible tab as an image
  -> extension uploads image to the active capture session
  -> backend creates capture asset + file metadata
  -> popup shows screenshot upload success
```

This slice should create the first real browser-sourced capture asset from the extension. It should not record clicks, input values, navigation, DOM, HTML snapshots, or finalize the capture session yet.

## Why This Comes Next

Current state:

- `apps/extension` exists.
- Extension can configure an instance URL.
- Extension can sign in with an extension bearer token.
- Extension can list projects.
- Extension can persist selected project id.
- Extension can create and restore an active capture session.
- Backend already supports multipart screenshot uploads through:

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
```

Missing product behavior:

- active capture sessions do not yet contain browser-created source material
- guide generation from a capture is only useful when screenshots exist
- the next event-recording slice needs an uploaded screenshot asset id to reference

This plan adds the smallest useful capture behavior: manual screenshot upload.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/plan/009-capture-asset-upload-storage.md
docs/plan/022-extension-foundation.md
docs/plan/023-extension-start-capture-session.md
```

Important implications:

- capture sessions are reusable source material
- screenshot capture comes before HTML replay
- extension requests should use bearer auth
- no raw typed input values are captured
- no content script or DOM inspection in this slice
- storage keys/local paths must stay server-private
- AI remains deferred

## Scope

Included:

- add capture asset upload API helper in the extension
- add visible tab screenshot helper in the extension
- add screenshot upload action to active capture popup state
- upload screenshot as multipart form data
- include safe current tab metadata with upload
- include viewport/device-pixel-ratio metadata when available
- show upload loading/success/error states in popup
- keep active capture state after upload
- update extension manifest permissions narrowly for visible tab capture
- update extension README with screenshot upload behavior
- update `docs/project-zoomout-status.md` so extension status is no longer stale
- update all capture asset backend routes to accept bearer-or-cookie auth
- add focused tests for backend bearer auth, extension API helper, screenshot helper, and popup upload behavior

Excluded:

- automatic click capture
- capture event recording
- input recording
- navigation tracking
- content scripts
- DOM or HTML capture
- full-page screenshot stitching
- screenshot annotation
- image redaction
- thumbnail generation
- capture session finalization
- redirect to portal after capture
- guide creation changes
- portal UI changes
- interactive demo changes
- analytics
- AI/BYO-key

## Backend Contract

Backend route already exists:

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
```

Multipart fields:

```text
file: required screenshot file
width: optional positive integer
height: optional positive integer
device_pixel_ratio: optional positive number
page_url: optional string
page_title: optional string
captured_at: optional ISO datetime
metadata: optional JSON object string
```

Current backend gap:

- capture asset routes currently use only the web session cookie
- extension screenshot upload must accept bearer tokens through the shared `session_token_from_request` helper

Backend requirements:

- update all capture asset routes to use bearer-or-cookie auth
- add route test proving bearer token can upload a screenshot
- add one lightweight route test proving another capture asset read/list route still accepts bearer auth
- keep existing cookie behavior unchanged
- do not add new DB columns
- do not change upload persistence behavior

Implementation detail:

- import `session_token_from_request` from authentication and use it inside the route-local `require_auth`
- remove the direct `web_session_cookie_name` dependency from capture asset routes
- apply this consistently to create, upload, list, get, file read, and delete routes
- keep existing unauthenticated and upload error response shapes unchanged

## Extension Screenshot Capture Contract

Add an extension-local screenshot helper.

Suggested type:

```ts
export type ScreenshotCapture = {
  blob: Blob;
  mimeType: "image/png";
  width: number | null;
  height: number | null;
  devicePixelRatio: number | null;
  capturedAt: string;
};
```

Suggested helper:

```ts
captureVisibleTabScreenshot(): Promise<ScreenshotCapture>
```

Rules:

- use Chrome extension APIs, not page scripts
- capture only the visible tab/window
- output PNG for this slice
- convert the returned data URL into a `Blob`
- infer MIME type from the data URL
- reject unsupported or malformed screenshot data URLs with a local error
- return `{ width, height }` by decoding the captured image when browser APIs allow it
- return null dimensions if image decoding fails but the PNG blob itself is valid
- return `devicePixelRatio` from the extension environment when available
- set `capturedAt` immediately after the screenshot is captured
- do not inspect DOM
- do not read form fields
- do not capture full-page stitched screenshots

Permission implication:

- add the narrow permission needed for `chrome.tabs.captureVisibleTab`
- preferred starting point is `activeTab` plus existing `tabs`
- do not add broad host permissions unless implementation proves they are required
- do not add `scripting`, content scripts, or host capture permissions in this slice

## Extension API Contract

Add helper:

```ts
uploadCaptureAsset(instanceUrl, sessionToken, projectId, captureSessionId, input)
```

Request requirements:

- URL-encode `projectId` and `captureSessionId`
- send `Authorization: Bearer <sessionToken>`
- send `accept: application/json`
- send `x-demo-composer-client: extension`
- use `FormData`
- append screenshot as `file`
- append the file with a stable generated filename, for example `screenshot-{captured_at}.png`
- append metadata fields only when values exist
- JSON-stringify `metadata` before appending it
- append numeric fields as strings
- do not manually set multipart `content-type`; browser must set boundary
- send `credentials: "include"` for consistency with existing helpers
- map backend errors through existing `ApiClientError`

Suggested input type:

```ts
export type UploadCaptureAssetInput = {
  file: Blob;
  fileName: string;
  width?: number | null;
  height?: number | null;
  devicePixelRatio?: number | null;
  pageUrl?: string | null;
  pageTitle?: string | null;
  capturedAt?: string | null;
  metadata?: Record<string, unknown>;
};
```

Response type:

```ts
export type CaptureAsset = {
  id: string;
  project_id: string;
  capture_session_id: string;
  asset_type: "screenshot" | "html_snapshot" | "thumbnail" | "redacted_screenshot";
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: string | null;
};

export type CaptureAssetResponse = {
  capture_asset: CaptureAsset;
};
```

## Popup UX Contract

### Active Capture, No Upload In Flight

Show:

- active project name when resolvable
- active capture session id or short id
- `Capture screenshot` action
- `Discard local capture state` action

Behavior:

- clicking `Capture screenshot` captures visible tab
- then uploads screenshot to active capture session
- keep the active capture state after upload
- do not finalize/complete the session

### Upload In Flight

Show:

- loading state on the screenshot action
- disable `Capture screenshot`
- avoid changing selected project or active capture state while upload is in flight

### Upload Success

Show:

- confirmation that a screenshot was captured
- uploaded capture asset id or short id
- allow another manual screenshot capture

### Upload Error

Show:

- clear error message
- allow retry
- keep active capture state
- do not clear selected project/session token

Common errors:

- missing active capture ids
- screenshot permission failure
- restricted browser page cannot be captured
- unsupported screenshot data URL
- unauthenticated token
- project/session not found
- upload too large
- network/server failure

## Metadata Rules

Use existing `getCurrentTabSnapshot()` for safe URL/title metadata.

Upload fields:

```text
page_url = current tab HTTP(S) URL or omitted
page_title = current tab title or omitted
captured_at = screenshot capturedAt ISO timestamp
width = screenshot width when known
height = screenshot height when known
device_pixel_ratio = screenshot DPR when known
metadata.extension_version = "0.1.0"
metadata.capture_source = "extension_popup"
```

Rules:

- only `http://` and `https://` page URLs should be sent
- do not send `chrome://`, `about:`, `file:`, or extension URLs
- do not include DOM text or form values
- do not include cookies, local storage, or page source

## Testing Plan

Follow TDD.

Start with red tests for:

### Backend

- capture asset upload accepts bearer token for `POST /assets/upload`
- capture asset route accepts bearer token for at least one read/list endpoint
- existing cookie-auth tests still pass

### Extension API

- `uploadCaptureAsset` posts multipart form data to the configured instance/project/session
- project id and capture session id are URL-encoded
- bearer token is sent
- client header is sent
- multipart `content-type` is not manually set
- metadata fields are appended only when present
- backend errors map through `ApiClientError`

### Screenshot Helper

- returns a PNG blob from a valid `chrome.tabs.captureVisibleTab` data URL
- calls capture API with PNG format
- returns a captured timestamp
- decodes screenshot dimensions when possible
- still returns the PNG blob when dimension decoding fails
- rejects when Chrome screenshot API is unavailable
- rejects when Chrome reports a capture error
- rejects malformed or unsupported data URLs
- does not require DOM/content-script APIs

### Popup

- active capture state renders `Capture screenshot`
- clicking screenshot calls screenshot helper and upload API helper
- upload includes active project/session ids
- upload includes safe current tab metadata
- upload uses a generated screenshot filename
- upload success shows uploaded asset id and allows another capture
- upload failure renders retry/error without clearing active capture state
- screenshot action is disabled while upload is in flight
- discard local active capture still clears only active capture fields

Verification commands:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter server build
rtk pnpm --filter web test
rtk pnpm build
rtk pnpm check-types
rtk pnpm lint
```

DB integration tests are not required unless bearer auth changes unexpectedly affect DB-backed route behavior. This slice should reuse the existing backend screenshot upload persistence.

## Implementation Steps

1. Add backend capture asset bearer auth route tests.
2. Update capture asset routes to use `session_token_from_request`.
3. Add extension screenshot helper tests.
4. Implement extension screenshot helper.
5. Add extension upload API helper tests.
6. Implement extension upload API helper.
7. Add popup tests for upload success/error/loading states.
8. Wire screenshot capture/upload into active capture UI.
9. Update extension manifest permissions narrowly.
10. Update extension README.
11. Update `docs/project-zoomout-status.md`.
12. Run focused checks.
13. Run root checks.

## Acceptance Criteria

- Extension can capture the visible tab screenshot while an active capture session exists.
- Extension uploads the screenshot to the active capture session as a screenshot capture asset.
- Uploaded asset uses bearer auth from extension storage.
- Backend capture asset routes accept extension bearer auth.
- Popup keeps active capture state after successful upload.
- Popup shows useful upload success/error state.
- Screenshot upload sends safe URL/title metadata only.
- No DOM, click, input, navigation, HTML, finalization, redirect, analytics, or AI behavior is added.
- Extension manifest does not include broad host/content-script permissions for this slice.
- Extension tests cover screenshot helper, API helper, and popup behavior.
- Server tests cover bearer-auth capture asset upload and one read/list path.
- Required checks pass.

## Follow-Up Slice

After this plan, the next likely plan should be:

```text
025-extension-capture-event-recording
```

That slice should create a simple capture event linked to the uploaded screenshot asset, still avoiding raw input values and generalized content-script automation until the manual screenshot path is stable.
