# Manual Capture Event Ordering Portal Plan

Date: 2026-06-12

## Goal

Let authenticated portal users reorder events inside a manual capture session so guide generation follows the intended walkthrough sequence.

Target flow:

```text
authenticated portal user
  -> opens /projects/:project_id/capture-sessions/:capture_session_id
  -> sees a manual capture session with uploaded screenshot-backed events
  -> moves an event up or down
  -> backend persists the new event_index values
  -> detail page refreshes in the corrected order
  -> user creates a guide from the capture session
  -> generated guide steps follow the corrected event order
```

This builds directly on `043-manual-capture-session-upload-portal`. Users can now add source material from the portal; this slice lets them fix ordering before turning that source material into a Scribe-style guide.

## Why This Comes Next

Current state after `043`:

- users can create a manual capture session from the portal
- users can upload one screenshot at a time into a manual capture session
- each upload creates a linked `capture` event
- capture session detail shows ordered events and assets
- guide generation already uses persisted event order

Remaining product gap:

- manual screenshot/event order is append-only
- a wrong upload order creates a wrong guide step order
- users have no simple way to correct ordering before guide generation

Manual event ordering should come before bulk upload, drag-and-drop polish, manual event content editing, advanced exports, analytics, AI, or interactive demos because ordering is core to the documentation workflow.

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
```

Important implications:

- capture sessions remain reusable source material
- this slice only changes ordering metadata, not captured source content
- no raw input values should be introduced
- event ordering must remain deterministic for guide generation
- extension/import capture sessions should stay read-only for ordering in this slice, enforced by both portal UI and backend service validation
- use REST/Fastify/Zod route style
- use cookie-backed portal authentication
- keep route additions under existing capture event module boundaries
- use TDD for implementation
- do not add AI, analytics, HTML replay, or interactive demo behavior

## Scope

Included:

- backend API to reorder capture events inside one capture session
- service validation that:
  - project exists
  - capture session exists
  - capture session `source_type` is `manual`
  - all requested events belong to that capture session
  - requested event IDs are unique
  - event indexes are reassigned as contiguous positive integers starting at 1
- repository support for persisting the reordered `event_index` values
- safe persistence that avoids transient unique constraint collisions
- API client helper in `apps/web/src/lib/api.ts`
- portal up/down controls on `CaptureSessionDetailPage`
- controls only render for manual capture sessions
- controls are disabled at the first/last event boundary
- submit state prevents duplicate reorder requests
- reorder success refreshes capture session detail
- form-level or row-level reorder error messaging
- existing guide generation behavior should naturally use the reordered event list
- focused backend service, route, repository/DB tests
- focused web API and page tests
- update `docs/project-zoomout-status.md`

Excluded:

- drag-and-drop ordering
- bulk upload
- event content editing
- event delete UI
- asset ordering separate from event ordering
- ordering extension/import sessions
- ordering events across capture sessions
- guide block reordering changes
- guide generation changes unless tests reveal a contract gap
- capture session completion/finalization UI
- HTML snapshot/replay work
- annotations/redaction/cropping
- analytics
- AI
- interactive demo work

## Recommended Backend API

Add route:

```http
PUT /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/order
Content-Type: application/json
```

Request body:

```json
{
  "event_ids": [
    "capture_event_1",
    "capture_event_2",
    "capture_event_3"
  ]
}
```

Response:

```json
{
  "capture_events": []
}
```

Response should return the reordered capture events in persisted order.

Rationale for `event_ids` rather than `{ id, event_index }[]`:

- the client only needs to express final order
- backend owns contiguous index assignment
- avoids accepting duplicate or sparse indexes
- keeps client-side reorder logic simple

## Backend Validation

Add input type:

```ts
export type ReorderCaptureEventsInput = {
  event_ids: string[];
};
```

Validation rules:

- `event_ids` must be a non-empty array
- every ID must be a trimmed non-empty string
- every ID must be unique
- the capture session must have `source_type: "manual"`
- every listed event must be active and belong to the same organization/project/capture session
- the provided ID list must include all active events in that capture session
- persisted indexes become `1..event_ids.length` in the exact provided order

The "include all active events" rule is intentional for this slice.

Reasoning:

- avoids ambiguity about omitted events
- prevents accidentally hiding or preserving stale positions for unlisted events
- keeps the backend response and guide generation order deterministic
- fits simple up/down portal controls that already know the full visible event list

## Unique Constraint Safety

Current persistence has an active unique constraint on capture session event order:

```text
uq_capture_event_session_index_active
```

Reordering by naively updating rows one at a time can temporarily violate this constraint.

Recommended repository approach:

```text
single SQL statement or explicit transaction:
  1. verify active event IDs for scope
  2. move the affected active events to temporary negative indexes
  3. assign final positive contiguous indexes using the provided order
  4. return events ordered by event_index
```

Because `build_capture_event_repository` currently receives a simple `Queryable` rather than a repository-level transaction helper, prefer a single SQL CTE-based implementation if it stays readable. If a transaction helper is introduced, keep it local to the capture event repository boundary and avoid broad DB abstraction changes.

Alternative acceptable implementation:

```text
single SQL statement or CTE that avoids unique collisions under the existing constraint
```

Do not drop or weaken the unique constraint for this feature.

## Error Handling

Recommended domain errors:

```text
InvalidCaptureEventOrderError -> 400 invalid_capture_event_order
CaptureEventReorderNotAllowedError -> 409 capture_event_reorder_not_allowed
CaptureEventNotFoundError -> 404 capture_event_not_found
CaptureSessionNotFoundError -> 404 capture_session_not_found
ProjectNotFoundError -> 404 project_not_found
UnauthenticatedSessionError -> 401 unauthenticated
```

Recommended user-facing messages:

```text
Could not reorder capture events.
Capture session was not found.
Capture event order is invalid.
Only manual capture sessions can be reordered.
Sign in to reorder capture events.
```

## Backend Work

Update:

```text
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/capture-event/capture-event.repository.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-event/*.test.ts
```

Service additions:

- `reorder_capture_events`
- ensure the capture session is reorderable by checking `source_type: "manual"`
- validate all event IDs belong to the requested scope
- reject duplicate/empty IDs
- reject partial event lists
- return reordered events

Repository additions:

- method to read capture session source type for scope, or include source-type verification in a scoped reorder precheck
- method to list active event IDs for scope, or combine verification in reorder method
- method to persist order safely
- update `updated_by_id`, `updated_at`, and `version` for reordered rows
- preserve immutable event content fields

Route additions:

- Zod body schema for `event_ids`
- `PUT /:project_id/capture-sessions/:capture_session_id/events/order`
- map new invalid-order error to `400 invalid_capture_event_order`
- map reorder-not-allowed error to `409 capture_event_reorder_not_allowed`

## Web API Client Work

Update:

```text
apps/web/src/features/capture-session/types.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Add types:

```ts
export type ReorderCaptureEventsInput = {
  event_ids: string[];
};

export type ReorderCaptureEventsResponse = {
  capture_events: CaptureEvent[];
};
```

Add helper:

```ts
reorderCaptureSessionEvents(projectId, captureSessionId, input)
```

Helper expectations:

- URL-encodes project and capture session IDs
- uses `PUT`
- sends JSON body
- keeps `credentials: "include"`
- preserves `ApiClientError` behavior

## Portal UI Work

Update:

```text
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css
apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx
```

Add injectable dependency:

```ts
reorderEvents?: (
  projectId: string,
  captureSessionId: string,
  input: ReorderCaptureEventsInput
) => Promise<ReorderCaptureEventsResponse>;
```

UI behavior:

- render event ordering controls only for manual capture sessions
- render ordering controls only when there are at least two events
- each event row gets:
  - Move up button
  - Move down button
- first row has disabled Move up
- last row has disabled Move down
- while one reorder request is pending:
  - disable all ordering controls
  - keep existing event list visible
- when there are zero or one events:
  - do not show move controls
  - keep the normal empty/single-event display
- on success:
  - refresh capture session detail
- on failure:
  - show error message near the Events section
  - keep current visible order until reload/success

Recommended controls:

```text
icon or text buttons are acceptable for this slice
```

If adding icons, use existing icon conventions/libraries if already present. Do not introduce a new icon package just for this.

## Reorder Algorithm In The Portal

For a Move up/down action:

```text
currentOrder = detail.capture_events.map(event => event.id)
swap selected event ID with adjacent event ID
call reorderCaptureSessionEvents(projectId, captureSessionId, { event_ids: nextOrder })
reload detail on success
```

Do not optimistically reorder the UI in this first slice.

Reasoning:

- keeps failure behavior simple
- backend response/detail reload stays source of truth
- avoids local state drift with the detail read model

## Testing Plan

Follow TDD.

Backend service tests:

- rejects empty/duplicate/partial event ID lists
- rejects reorder attempts for extension/import capture sessions
- rejects event IDs outside the capture session
- persists contiguous indexes in requested order
- returns reordered events
- leaves event content fields unchanged

Backend route tests:

- requires authentication
- validates body shape
- calls service with project/session/auth/input
- maps invalid order to `400 invalid_capture_event_order`
- maps reorder-not-allowed to `409 capture_event_reorder_not_allowed`
- maps not-found and unauthenticated errors

Backend DB integration tests:

- creates multiple events, reorders them, and verifies list/detail order
- verifies indexes are contiguous after reorder
- verifies soft-deleted events are not required in the reorder list
- verifies unique constraint is not violated during swap/reorder

Web API tests:

- helper calls encoded `PUT /events/order`
- helper sends `{ event_ids }` JSON
- helper keeps session credentials
- helper maps errors through `ApiClientError`

Portal tests:

- manual sessions show move controls
- manual sessions with zero or one event hide move controls
- extension/import sessions hide move controls
- first/last move controls are disabled at boundaries
- clicking Move up sends swapped event IDs
- clicking Move down sends swapped event IDs
- successful reorder reloads detail
- failed reorder shows a clear message and keeps current list visible
- controls disable during pending reorder
- guide creation still uses loaded capture detail behavior

Recommended focused commands:

```bash
rtk pnpm --filter server test -- capture-event
rtk pnpm --filter web test -- api.test.ts CaptureSessionDetailPage.test.tsx
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

## Implementation Sequence

1. Add failing backend service tests for reorder validation and successful ordering.
2. Add repository reorder support and service method.
3. Add route tests and route endpoint.
4. Add DB integration test for real unique-constraint-safe reordering.
5. Add failing web API helper test.
6. Add web types and API helper.
7. Add failing portal UI tests for manual event move controls.
8. Add portal controls and reorder workflow.
9. Update `docs/project-zoomout-status.md`.
10. Run focused and full verification.

## Acceptance Criteria

- Manual capture session events can be moved up/down from the portal.
- Event indexes persist as contiguous positive integers in the requested order.
- Capture session detail returns events in the corrected order.
- Guide generation from the capture session uses the corrected order without guide-generation changes.
- Extension/import capture sessions remain read-only for event ordering.
- Backend rejects reorder attempts for extension/import capture sessions.
- Backend rejects invalid, duplicate, partial, or cross-session event ID lists.
- Reorder persistence does not violate the existing active event index unique constraint.
- Focused backend, DB, web API, and portal tests cover the behavior.
- No drag-and-drop, event content editing, AI, analytics, HTML replay, or interactive demo behavior is introduced.

## Commit Plan

Recommended small commits when implementing:

1. `Add capture event reorder API`
2. `Add portal manual event ordering`
3. `Update manual event ordering status docs`
