# Manual Capture Event Editing Portal Plan

Date: 2026-06-13

Status: Implemented on 2026-06-13.

## Goal

Let authenticated portal users clean up manual capture event text before generating a guide, so uploaded screenshot sessions can produce stronger Scribe-style guide drafts.

Target flow:

```text
authenticated portal user
  -> opens /projects/:project_id/capture-sessions/:capture_session_id
  -> reviews uploaded screenshot-backed manual capture events
  -> edits safe event fields such as title, URL, target label, or note
  -> backend persists the event changes without accepting raw sensitive input
  -> capture session detail refreshes in the same order
  -> user creates a guide from the capture session
  -> generated guide steps use the corrected source event text
```

This builds directly on:

- `043-manual-capture-session-upload-portal`
- `044-manual-capture-event-ordering-portal`
- `045-manual-capture-bulk-upload-portal`

Users can now create manual sessions, bulk upload screenshots, and reorder screenshot-backed capture events. The remaining source-material gap is editing event text before guide generation.

## Why This Comes Next

The first shareable capture-to-guide loop works, but manual capture sessions are still too rigid:

- screenshot uploads infer event text from shared upload-level fields
- bulk upload can create many events quickly, but all events can inherit weak or repeated labels
- event ordering can be corrected, but event content cannot
- generated guides therefore often need cleanup after generation instead of before generation

Manual event editing should come before project settings/archive UI, richer exports, password-protected links, analytics, AI, or interactive demos because it improves the main MVP workflow at the source:

```text
better capture events -> better generated guide -> less guide-editor cleanup
```

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
docs/plan/008-capture-event-foundation.md
docs/plan/011-capture-session-detail-read-model.md
docs/plan/012-capture-session-detail-portal.md
docs/plan/027-guide-generation-from-capture-events.md
docs/plan/043-manual-capture-session-upload-portal.md
docs/plan/044-manual-capture-event-ordering-portal.md
docs/plan/045-manual-capture-bulk-upload-portal.md
```

Important implications:

- capture sessions remain reusable source material
- this slice edits safe event metadata, not screenshot bytes
- no raw input values should ever be accepted or returned
- manual capture sessions are editable; extension/import capture sessions stay read-only in this slice
- event ordering already exists and should not be reworked
- guide generation should naturally consume the updated capture event fields
- use REST/Fastify/Zod route style
- use cookie-backed portal authentication
- keep route additions under the existing capture event module boundary
- use TDD for implementation
- do not add AI, analytics, HTML replay, or interactive demo behavior

## Current State

Already implemented:

- backend capture event create/list/get/delete
- backend manual capture event reordering
- portal capture session detail event timeline
- portal manual screenshot upload and bulk upload
- portal manual event up/down controls
- guide generation from ordered capture events

Current capture event fields available in the read model:

```text
event_type
event_index
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
```

Fields currently used by deterministic guide generation include page title, page URL, target label, target text, input intent, note, and event type.

## Scope

Included:

- backend API to update one capture event in a manual capture session
- service validation that:
  - project exists
  - capture session exists
  - capture session `source_type` is `manual`
  - capture session status is not `archived` or `canceled`
  - capture event exists and belongs to the organization/project/capture session
  - raw input values are rejected
  - event type, event index, capture asset, and sensitive/system fields are not changed in this slice
- repository support for updating safe editable fields
- optimistic version increment on successful event update
- API client helper in `apps/web/src/lib/api.ts`
- web types for update request/response
- inline event edit UI on `CaptureSessionDetailPage`
- edit controls only render for manual capture sessions
- user can save or cancel event edits
- successful save refreshes capture session detail
- failed save keeps the current event list visible and shows a useful error
- existing reorder/upload/create-guide flows keep working
- focused backend service, route, app integration, and DB integration tests
- focused web API and page tests
- update `docs/project-zoomout-status.md`

Excluded:

- editing extension/import capture sessions
- changing event order
- changing event type
- changing `event_index`
- changing `capture_asset_id`
- changing `occurred_at`
- changing screenshot asset metadata or file bytes
- deleting events from the portal
- editing raw input values
- editing click coordinates or viewport/device metadata
- editing capture session metadata
- guide editor changes
- guide generation algorithm changes unless tests reveal an existing contract gap
- drag-and-drop ordering
- advanced redaction/cropping/annotation on capture sessions
- AI-generated rewrite suggestions
- analytics
- interactive demo work

## Editable Field Policy

Recommended safe editable fields for this slice:

```ts
export type UpdateCaptureEventInput = {
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_text?: string | null;
  input_intent?: string | null;
  note?: string | null;
};
```

Rationale:

- these fields directly improve generated guide text
- they are already part of the current event read model
- they are safe text metadata, not captured secrets
- they avoid changing event identity, order, timing, linked screenshot, or browser geometry

Do not accept:

```text
input_value
value
typed_value
password
secret
metadata.raw_input
event_type
event_index
capture_asset_id
occurred_at
client_x
client_y
viewport_width
viewport_height
device_pixel_ratio
```

The route schema should be strict enough to reject unknown keys, or the route should explicitly pick only allowed keys before passing data to the service. Prefer a strict schema for update.

## Recommended Backend API

Add route:

```http
PATCH /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
Content-Type: application/json
```

Request body:

```json
{
  "page_title": "Department list",
  "page_url": "https://example.test/departments",
  "target_label": "Add Department",
  "target_text": null,
  "input_intent": null,
  "note": "Open the department list and add a new department."
}
```

Response:

```json
{
  "capture_event": {
    "id": "capture_event_1",
    "event_type": "capture",
    "event_index": 1,
    "page_title": "Department list",
    "page_url": "https://example.test/departments",
    "target_label": "Add Department",
    "target_text": null,
    "input_intent": null,
    "note": "Open the department list and add a new department.",
    "version": 2
  }
}
```

The real response should return the full existing `CaptureEvent` DTO shape, matching other capture event routes.

## Backend Validation

Add input type:

```ts
export type UpdateCaptureEventInput = {
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_text?: string | null;
  input_intent?: string | null;
  note?: string | null;
};
```

Validation rules:

- request body must include at least one editable field
- string values are trimmed
- empty strings are normalized to `null`
- `page_url` can be `null` or a trimmed string
- `page_title`, `target_label`, `target_text`, `input_intent`, and `note` can be `null` or trimmed strings
- raw input-like keys are rejected
- unknown keys are rejected
- manual capture session required
- capture session status must allow edits
- event must belong to the provided scope
- deleted/archived events cannot be updated

Recommended domain errors:

```text
InvalidCaptureEventInputError
CaptureEventUpdateNotAllowedError
ProjectNotFoundError
CaptureSessionNotFoundError
CaptureEventNotFoundError
```

Route mapping:

```text
InvalidCaptureEventInputError      -> 400 invalid_capture_event
CaptureEventUpdateNotAllowedError  -> 409 capture_event_update_not_allowed
ProjectNotFoundError               -> 404 project_not_found
CaptureSessionNotFoundError        -> 404 capture_session_not_found
CaptureEventNotFoundError          -> 404 capture_event_not_found
UnauthenticatedSessionError        -> 401 unauthenticated
```

## Repository Work

Extend `CaptureEventRepository` with:

```ts
update_capture_event: (input: {
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  capture_event_id: string;
  actor_org_user_id: string;
  data: NormalizedUpdateCaptureEventInput;
}) => Promise<CaptureEvent | null>;
```

SQL behavior:

- update only active events in scope
- set allowed text fields from normalized input
- set `updated_by_id`
- increment `version`
- set `updated_at = CURRENT_TIMESTAMP`
- return the updated row using the existing DTO mapper

The repository should not decide whether the session is manual. Keep that business rule in the service, using the existing `get_capture_session_source_type` helper.

The current repository already has `with_transaction`, `capture_event_select`, and `map_capture_event` helpers. Reuse the existing mapping style for the update query and do not introduce a broader DB abstraction for this slice.

If status validation needs more than `source_type`, either extend `get_capture_session_source_type` into a narrowly named helper such as `get_capture_session_editability` or add a second repository read method that returns only `source_type` and `status`. Keep the service responsible for the editability decision.

## Backend TDD Plan

Start with service tests:

1. updates safe fields for a manual capture session
2. trims strings and normalizes empty strings to `null`
3. rejects an empty update body
4. rejects raw input-like keys
5. rejects updates for extension/import sessions
6. rejects updates for archived or canceled manual sessions
7. returns `CaptureEventNotFoundError` when event is outside scope
8. preserves event type, event index, linked asset, timing, and redaction state

Route tests:

1. `PATCH /events/:id` returns `{ capture_event }`
2. unauthenticated request returns 401
3. missing project/session/event returns 404 with expected error type
4. invalid input returns 400
5. extension/import update returns 409
6. archived/canceled manual session update returns 409
7. unknown/raw fields are rejected before service mutation

DB integration tests:

1. update a manual capture event and verify persisted values, version increment, `updated_by_id`, and unchanged event order
2. verify guide generation uses the updated capture event text
3. verify extension capture event update is rejected and row remains unchanged
4. verify archived/canceled manual capture session update is rejected and row remains unchanged
5. verify raw input-like keys cannot be stored

App integration test:

- create setup/auth/project/manual session/event through real routes, update the event through HTTP, then read session detail and ensure the edited fields appear.

## Web API Plan

Add types:

```ts
export type UpdateCaptureEventInput = {
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_text?: string | null;
  input_intent?: string | null;
  note?: string | null;
};

export type UpdateCaptureEventResponse = {
  capture_event: CaptureEvent;
};
```

Add API helper:

```ts
export const updateCaptureSessionEvent = async (
  projectId: string,
  captureSessionId: string,
  eventId: string,
  input: UpdateCaptureEventInput
): Promise<UpdateCaptureEventResponse>;
```

Expected endpoint:

```text
/api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:event_id
```

API tests:

- sends `PATCH`
- uses session cookies
- URL-encodes path params
- sends the update body unchanged except for JSON serialization
- maps API errors into existing `ApiClientError`

## Portal UI Plan

Update `CaptureSessionDetailPage`:

- inject `updateEvent` prop with default `updateCaptureSessionEvent`
- add local editing state:
  - currently edited event ID
  - draft values
  - save state
  - error message
- show an `Edit` button on event rows only when:
  - capture session `source_type === "manual"`
  - no upload/reorder/save action blocks the row
- edit form fields:
  - page title
  - page URL
  - target label
  - target text
  - input intent
  - note
- actions:
  - save
  - cancel
- on save:
  - call `updateEvent(projectId, captureSessionId, event.id, draft)`
  - refresh capture session detail on success
  - clear editing state on success
  - keep form open and show error on failure
- on cancel:
  - discard draft and return to read-only event row

Recommended event row read-only display after this slice:

- title line still uses existing event title fallback
- metadata still shows time and hostname
- add compact secondary text for `target_label`, `target_text`, or `note` when useful
- keep layout dense; this is an operational source-material editor, not a marketing page

Do not add a modal for this slice. Inline editing keeps source cleanup close to the timeline and matches the current page structure.

## Web TDD Plan

Page tests:

1. manual events show an edit action
2. extension/import events do not show edit actions
3. clicking edit opens a form prefilled with event values
4. cancel closes the form without calling the API
5. save calls `updateEvent` with edited values
6. successful save reloads capture session detail and clears the form
7. failed save keeps the form open and shows an error
8. save controls are disabled while a save request is pending
9. raw input fields are not rendered
10. reorder and create-guide controls still work with the new edit UI present

API tests:

- covered in the Web API Plan above.

## Guide Generation Contract

No guide generation code change is planned.

Instead, add a DB/integration test that proves the existing guide generation path reads updated capture event data:

```text
create manual capture event
  -> update page_title/target_label/note
  -> create guide from capture session
  -> expect guide block/step title and body to reflect updated values
```

If this fails, fix the smallest backend read-model/generation contract needed. Do not introduce a new guide-generation strategy in this slice.

## Privacy And Safety

This feature edits source material, so keep the privacy boundary strict:

- no raw input values accepted
- no password/secret-like keys accepted
- no unknown key passthrough
- `input_value_redacted` remains true
- do not expose file storage keys or checksums
- do not mutate screenshot files
- do not silently convert an extension/import session into editable source material

## Files Likely To Change

Backend:

```text
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/capture-event/capture-event.repository.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-event/capture-event.service.test.ts
apps/server/src/modules/capture-event/capture-event.routes.test.ts
apps/server/src/modules/capture-event/capture-event.app.integration.test.ts
apps/server/src/modules/capture-event/capture-event.db.integration.test.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
```

Web:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/capture-session/types.ts
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css
apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx
```

Docs:

```text
docs/project-zoomout-status.md
docs/plan/048-manual-capture-event-editing-portal.md
```

## Acceptance Criteria

Product:

- a portal user can edit safe text fields on a manual capture event
- edited values are visible after reload
- generated guide steps use edited capture event text
- extension/import capture sessions remain read-only for event editing
- source event order remains unchanged after editing
- screenshots and file metadata are unchanged after editing

Backend:

- `PATCH /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id` exists
- update route requires authentication
- route rejects invalid/raw/unknown fields
- service enforces manual-session-only editing
- repository increments version and audit fields
- DB integration confirms persistence and guide-generation behavior

Web:

- manual capture event rows expose edit/save/cancel controls
- edit controls are hidden for non-manual sessions
- save success refreshes detail
- save failure is visible and non-destructive
- tests cover happy path, errors, and read-only cases

Verification:

```bash
rtk pnpm --filter server test -- src/modules/capture-event/capture-event.service.test.ts src/modules/capture-event/capture-event.routes.test.ts src/modules/capture-event/capture-event.app.integration.test.ts
rtk pnpm --filter server exec env-cmd -f .env-cmdrc -e testing -- vitest run --no-file-parallelism src/modules/capture-event/capture-event.db.integration.test.ts src/modules/guide/guide.db.integration.test.ts
rtk pnpm --filter web test -- src/lib/api.test.ts src/features/capture-session/CaptureSessionDetailPage.test.tsx
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

If DB tests create `apps/server/storage`, remove that generated test artifact before committing.

## Suggested Commit Plan

1. `test: cover manual capture event editing`
   - failing backend service/route/DB tests
   - failing web API/page tests where practical

2. `feat: add manual capture event update api`
   - service/repository/route implementation
   - backend tests green

3. `feat: add manual capture event editor`
   - API client/types
   - portal inline edit UI
   - web tests green

4. `docs: update capture event editing status`
   - update project status after implementation
   - mark this plan implemented after the slice is complete

## Open Questions To Resolve During Implementation

Recommended default decisions:

- Field set: use only `page_url`, `page_title`, `target_label`, `target_text`, `input_intent`, and `note` for this slice.
- URL validation: allow any trimmed string or `null`; do not require absolute URL yet because existing captures may contain internal app URLs or browser-specific values.
- Editing status: allow manual session events in `draft`, `capturing`, or `completed` sessions as long as the session is not `archived` or `canceled`.
- Published guides: do not retroactively affect already published guide snapshots. Updating capture events only affects future guide generation from the capture source.
