# Extension Capture Event Recording Plan

Date: 2026-06-06

## Goal

Turn each manual screenshot captured by the Chrome extension into ordered capture source material by creating a `capture` event linked to the uploaded screenshot asset.

Target flow:

```text
user opens extension popup
  -> extension is connected and signed in
  -> active capture session exists
  -> user clicks Capture screenshot
  -> extension captures visible tab screenshot
  -> extension uploads screenshot as capture asset
  -> extension creates capture event linked to that asset
  -> popup shows screenshot + event success
  -> portal capture session detail can show the screenshot-backed event in order
```

This slice should not add automatic click listeners, content scripts, DOM inspection, raw input capture, session finalization, or portal guide-generation changes. It should make the current manual screenshot button create the source record that later guide creation can trust.

## Why This Comes Next

Current state:

- `apps/extension` exists.
- Extension can configure an instance URL and sign in with an extension bearer token.
- Extension can list projects and start/restore an active capture session.
- Extension can capture the visible tab as a PNG screenshot.
- Extension can upload that screenshot to the backend as a capture asset.
- Backend capture session detail already returns ordered `capture_events` and `capture_assets`.
- Portal capture session detail already renders linked screenshots when events reference assets.

Missing product behavior:

- uploaded screenshots are isolated assets, not ordered steps
- guide generation cannot reliably infer step order from assets alone
- the capture session detail timeline remains empty after extension screenshot upload
- the next finalize/redirect slice should land users on a useful capture detail page

This plan adds the smallest useful event recording behavior: one manual screenshot click creates one screenshot asset and one linked `capture` event.

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
docs/plan/008-capture-event-foundation.md
docs/plan/011-capture-session-detail-read-model.md
docs/plan/024-extension-screenshot-upload.md
```

Important implications:

- capture events are source facts, not guide steps
- capture events should remain ordered by `event_index`
- screenshot assets should be linked to capture events through `capture_asset_id`
- extension requests should use bearer auth
- no raw typed input values are captured or sent
- no content scripts or DOM inspection in this slice
- AI remains deferred

## Scope

Included:

- update capture event backend routes to accept bearer-or-cookie auth
- add route tests proving bearer auth can create and list capture events
- add extension API helper for `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events`
- add extension API helper or local sequencing helper to determine the next `event_index`
- after screenshot upload succeeds, create a linked `capture` event
- send safe page metadata already available to the popup
- keep screenshot image dimensions on the asset record; do not pretend they are viewport dimensions
- show success only after both upload and event creation succeed
- keep active capture state after success or failure
- add focused popup tests for the upload-then-event flow
- update extension README and `docs/project-zoomout-status.md`

Excluded:

- automatic click capture
- input capture
- navigation tracking
- content scripts
- DOM or HTML capture
- target selector extraction
- raw typed values
- full-page screenshot stitching
- screenshot annotation
- capture session finalization
- redirect to portal after capture
- guide creation changes
- portal UI changes unless an existing read-model contract breaks
- interactive demo changes
- analytics
- AI/BYO-key

## Backend Contract

Existing route:

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
```

Event body for this slice:

```json
{
  "event_type": "capture",
  "event_index": 1,
  "capture_asset_id": "capture_asset_id",
  "occurred_at": "2026-06-06T00:00:00.000Z",
  "page_url": "https://example.com/path",
  "page_title": "Example Page",
  "input_value_redacted": true,
  "metadata": {
    "extension_version": "0.1.0",
    "capture_source": "extension_popup",
    "asset_type": "screenshot"
  }
}
```

Existing route gap:

- capture event routes currently read only `request.cookies[web_session_cookie_name]`
- extension capture events must accept bearer tokens through `session_token_from_request`

Backend requirements:

- import `session_token_from_request` in capture event routes
- use it consistently in create, list, get, and delete routes
- preserve existing cookie behavior
- preserve existing raw-input rejection
- do not add DB columns
- do not change event validation semantics
- add a route test for bearer-authenticated `POST /events`
- add a route test for bearer-authenticated `GET /events`

Viewport metadata note:

- `capture_event.viewport_width` and `capture_event.viewport_height` are CSS viewport dimensions
- the current extension screenshot helper returns captured image pixel dimensions
- do not map screenshot pixel width/height directly into event viewport fields in this slice
- keep image dimensions on the uploaded `capture_asset`
- keep `capture_event.viewport_width`, `capture_event.viewport_height`, and `capture_event.device_pixel_ratio` omitted/null until a later slice captures reliable tab viewport metadata

## Event Type And Indexing

Use existing event type:

```text
capture
```

Reason:

- the backend already validates `capture` events as explicit capture/screenshot points
- `capture` events require `capture_asset_id`, which matches this slice
- we do not yet have safe click target data, so `click` would be inaccurate
- adding a new event type such as `screenshot_captured` would require schema/API changes without enough benefit

Event index requirement:

- each event must have a positive integer `event_index`
- events in a capture session must stay unique by active `(capture_session_id, event_index)`
- the extension needs a deterministic next index before creating an event

Recommended MVP indexing approach:

- store a local `activeCaptureEventIndex` in extension storage alongside `activeCaptureSessionId`
- initialize it to `0` when a capture session starts
- restore it when the popup reopens
- after a screenshot upload and event creation both succeed, increment and persist it
- when restoring older active captures without this value, default to `0`
- send `event_index = activeCaptureEventIndex + 1`
- if backend returns `capture_event_index_conflict`, surface the error and do not increment

Why local-first is acceptable for this slice:

- the extension is currently the only capture writer for the active session
- we do not yet support multi-device or concurrent capture
- it avoids adding a new backend "next index" endpoint
- the existing backend uniqueness constraint still protects integrity

Future hardening:

- add a backend append endpoint or server-assigned event index if concurrent capture becomes a real workflow
- recover local index by listing existing events when resuming an active capture from a different browser profile

## Extension Storage Contract

Extend extension settings with:

```ts
activeCaptureEventIndex: number | null;
```

Rules:

- default to `null` for existing installs
- when starting capture, store `activeCaptureEventIndex: 0`
- when discarding local active capture state, clear it
- when changing instance, clear it
- when sign-out clears local auth/session state, clear it with the rest of active capture state
- when creating a linked capture event succeeds, save the returned/sent index
- do not increment after screenshot upload failure
- do not increment after event creation failure

Backward compatibility:

- existing saved settings without this key should still parse
- active captures created before this plan should show `activeCaptureEventIndex` as `null`
- popup should treat `null` as `0` for the next manual capture

## Extension API Contract

Add event type:

```ts
export type CaptureEventType = "navigation" | "click" | "input" | "capture" | "note";
```

Add event response type matching the backend route response.

Add helper:

```ts
createCaptureEvent(instanceUrl, sessionToken, projectId, captureSessionId, input)
```

Request requirements:

- URL-encode `projectId` and `captureSessionId`
- send `Authorization: Bearer <sessionToken>`
- send `accept: application/json`
- send `content-type: application/json`
- send `x-demo-composer-client: extension`
- send `credentials: "include"` for consistency with existing helpers
- map backend errors through existing `ApiClientError`

Suggested input type:

```ts
export type CreateCaptureEventInput = {
  event_type: "capture";
  event_index: number;
  capture_asset_id: string;
  occurred_at?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  input_value_redacted?: true;
  metadata?: Record<string, unknown>;
};
```

Do not include:

- `input_value`
- `value`
- `typed_value`
- `password`
- `secret`
- `input_value_redacted: false`

## Popup Behavior

Active capture state should show:

- project name
- capture session id
- current local event count/index, if useful in compact text
- `Capture screenshot`
- discard local capture state

On `Capture screenshot`:

1. disable active capture actions
2. clear previous screenshot/event error
3. capture visible tab screenshot
4. upload screenshot asset
5. create `capture` event with:
   - next event index
   - uploaded asset id
   - captured timestamp
   - safe tab URL/title
   - extension metadata
6. persist the new active event index only after event creation succeeds
7. show success including the event index and/or event id
8. keep active capture state

Failure rules:

- if screenshot capture fails, do not upload asset and do not create event
- if asset upload fails, do not create event
- if event creation fails after upload succeeds, show a clear error and do not increment local index
- do not clear active capture state on any screenshot/event error
- keep the user able to retry

Event creation failure caveat:

- if upload succeeds but event creation fails, the backend may contain an unlinked screenshot asset
- this is acceptable for this slice
- a later cleanup/reconcile flow can list assets without events if this becomes noisy

## Portal Read Model

Expected result after this slice:

- capture session detail should include the new event in `capture_events`
- capture session detail should include the screenshot asset in `capture_assets`
- existing portal detail UI should show the linked screenshot because `capture_event.capture_asset_id` matches the asset id

Implementation expectation:

- no portal change should be required if the existing detail read model already returns linked events/assets
- add or adjust tests only if the extension-created event shape reveals a read-model gap

## Privacy Rules

This slice must remain privacy-preserving:

- do not inject scripts
- do not inspect DOM
- do not read input values
- do not infer or store passwords/secrets
- always send `input_value_redacted: true`
- only send page URL/title already available through active tab metadata
- only send extension metadata on the event
- keep screenshot image dimensions and MIME metadata on the capture asset

Allowed metadata:

```json
{
  "extension_version": "0.1.0",
  "capture_source": "extension_popup",
  "asset_type": "screenshot"
}
```

Avoid metadata that stores:

- form values
- DOM HTML
- cookies
- localStorage/sessionStorage
- auth tokens
- full browser history

## Testing Plan

Use TDD.

Backend route tests:

- bearer-authenticated create event passes token to auth service
- bearer-authenticated list events passes token to auth service
- cookie-authenticated existing tests still pass
- raw input rejection still applies

Extension storage tests:

- default settings include `activeCaptureEventIndex: null`
- starting capture stores event index `0`
- discarding/changing instance clears event index
- saving event index persists it
- old settings without the key still load safely

Extension API tests:

- `createCaptureEvent` sends bearer-authenticated JSON to the encoded route
- payload contains `event_type: "capture"`, event index, asset id, safe metadata, and `input_value_redacted: true`
- payload does not map screenshot pixel dimensions into event viewport fields
- backend errors map through `ApiClientError`
- no raw input fields are sent

Popup tests:

- active capture with index `0` uploads screenshot, creates event index `1`, then persists index `1`
- active capture with restored index `3` creates event index `4`
- success renders after event creation succeeds
- if screenshot upload fails, event creation is not called and index is not incremented
- if event creation fails, active capture remains and index is not incremented
- active capture actions are disabled while upload/event creation is in flight

Read-model/portal tests:

- not required unless existing capture session detail cannot render extension-created `capture` events
- if needed, add a narrow test with `event_type: "capture"` and linked screenshot asset

Verification commands:

```bash
rtk pnpm --filter server test -- capture-event.routes.test.ts
rtk pnpm --filter extension test -- src/lib/api.test.ts src/lib/settings.test.ts src/App.test.tsx
rtk pnpm --filter web test -- CaptureSessionDetailPage.test.tsx
rtk pnpm --filter server test
rtk pnpm --filter extension test
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

DB integration tests are not expected unless implementation changes repository or persistence behavior. This slice should reuse the existing capture event persistence.

## Implementation Order

1. Add backend route tests for bearer auth on capture events.
2. Update capture event routes to use `session_token_from_request`.
3. Add extension settings tests for `activeCaptureEventIndex`.
4. Extend extension settings persistence.
5. Add extension API tests for `createCaptureEvent`.
6. Implement extension API helper and types.
7. Add popup tests for upload-then-event sequencing.
8. Wire event creation into the active capture screenshot flow.
9. Add or adjust portal read-model tests only if needed.
10. Update extension README and project zoom-out status.
11. Run full verification.

## Acceptance Criteria

- Extension creates a backend `capture` event after each successful screenshot upload.
- Created event links to the uploaded screenshot asset through `capture_asset_id`.
- Created event uses the next local positive `event_index`.
- Local active event index increments only after event creation succeeds.
- Extension sends bearer auth for event creation.
- Extension does not send unreliable viewport dimensions from screenshot pixel dimensions.
- Backend capture event routes accept bearer auth and preserve cookie auth.
- Raw input values are never sent by the extension.
- Popup shows clear success/error states and keeps active capture state.
- Existing capture session detail can show the linked screenshot event.
- Focused tests cover backend bearer auth, extension API, settings, and popup sequencing.
- Full tests, type checks, build, and lint pass.

## Risks And Tradeoffs

- Local event indexing can conflict if multiple clients write to the same capture session. The backend uniqueness constraint catches this; a server-side append API can come later.
- Event creation can fail after screenshot upload succeeds, leaving an unlinked asset. This is acceptable for MVP and can be reconciled later.
- The event currently represents a manual capture point, not a real user click. Using `event_type: "capture"` keeps that semantic honest.
- Without finalization and redirect, users still need to open the portal manually. That should be the next slice after event recording.

## Recommended Commit Shape

```text
feat: support bearer auth for capture events
feat: record extension screenshot capture events
docs: update capture event recording status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/026-extension-finalize-and-redirect.md
```

That slice should let the user stop/finalize the active capture session from the extension and redirect them to the portal capture session detail page, where the screenshot-backed capture events can be reviewed and converted into a guide.
