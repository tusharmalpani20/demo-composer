# Create Guide From Capture Portal Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Connect the capture-session detail portal to guide creation:

```text
authenticated portal user
  -> opens capture session detail
  -> reviews captured source material
  -> clicks Create guide
  -> backend creates a draft guide from that capture session
  -> portal redirects to the guide editor
```

This is the missing bridge between:

```text
docs/plan/012-capture-session-detail-portal.md
docs/plan/013-create-guide-from-capture.md
docs/plan/015-guide-editor-portal.md
```

The goal is to make the first internal end-to-end workflow usable:

```text
capture source -> generated draft guide -> editable guide document
```

## Why This Comes Next

Current state:

- portal can render capture-session source material
- backend can create a draft guide from a capture session
- backend can return created guide detail
- portal can open and edit a guide when given a guide URL

Missing product behavior:

- internal users cannot create a guide from the capture-session screen
- users need to manually know or call the backend guide creation endpoint
- there is no natural handoff from source review to guide editing

This slice should close that workflow gap without adding new backend domain behavior.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/012-capture-session-detail-portal.md
docs/plan/013-create-guide-from-capture.md
docs/plan/015-guide-editor-portal.md
```

Important implications:

- capture sessions remain source material and must not be mutated
- guide rows are the editable document artifacts
- no AI generation, rewrite, or suggestion layer in this slice
- raw typed input values must not be displayed or copied into guide text
- file storage internals must not be exposed in the browser
- the frontend should use the existing REST API shape
- authentication remains cookie-based with `credentials: "include"`
- the portal remains an internal operational tool, not a landing page

## Scope

Included:

- API client helper for creating a guide from a capture session
- capture-session detail page action to create a guide
- default guide title derived from capture-session metadata
- default guide description derived from capture-session metadata when available
- success redirect to `/projects/:project_id/guides/:guide_id`
- pending state while the guide is being created
- stable mutation error state
- unauthenticated/not-found behavior through existing API error handling for page load
- mutation errors that keep the already-loaded capture detail visible
- frontend tests for API helper, action rendering, create request, redirect, disabled/pending state, and error state

Excluded:

- backend route changes
- new guide-generation algorithm
- event selection UI
- choosing only some capture events
- project guide list page
- guide creation modal
- manually creating a blank guide
- title/description edit form before creation
- duplicate-guide detection UI
- public guide viewer
- publishing snapshots
- share links
- analytics
- Chrome extension changes
- desktop app
- AI layer

## Current Contract

Backend route already exists:

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

For this portal slice, do not send `selected_capture_event_ids` yet. Let the backend generate from all meaningful capture events.

Initial request body should be:

```json
{
  "title": "Create department workflow",
  "description": "Source capture for the department setup guide"
}
```

If the capture session has no description:

```json
{
  "title": "Create department workflow",
  "description": null
}
```

Important request detail:

- omit `selected_capture_event_ids` entirely
- do not send an empty selected-event array
- trim the capture-session name before sending it as the guide title
- capture-session names are already required by the backend, so no naming form is needed in this slice

Response:

```text
201 Created
```

```json
{
  "guide": {
    "id": "guide_id",
    "project_id": "project_id",
    "source_capture_session_id": "capture_session_id",
    "title": "Create department workflow",
    "description": null,
    "status": "draft"
  },
  "guide_blocks": []
}
```

The frontend should redirect using `response.guide.id`.

## API Client Work

Add to:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Function:

```ts
export const createGuideFromCaptureSession = async (
  projectId: string,
  captureSessionId: string,
  data: {
    title: string;
    description?: string | null;
  }
): Promise<GuideDetail>
```

Request:

```text
POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
```

Requirements:

- use shared `requestJson`
- use `credentials: "include"`
- send `accept: application/json`
- send `content-type: application/json`
- encode project and capture-session IDs
- preserve backend `error.type` through `ApiClientError`
- do not duplicate fetch/error parsing in React code

API tests:

- sends correct URL, method, headers, credentials, and JSON body
- returns the guide detail response
- preserves backend error types for invalid guide creation failures

## Capture Session Page Work

Update:

```text
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css
```

Add injectable props for testability:

```ts
createGuide?: (
  projectId: string,
  captureSessionId: string,
  data: {
    title: string;
    description?: string | null;
  }
) => Promise<GuideDetail>;

redirectTo?: (path: string) => void;
```

Defaults:

```ts
createGuide = createGuideFromCaptureSession
redirectTo = (path) => window.location.assign(path)
```

Create action placement:

- put a primary `Create guide` button in the capture-session header actions
- keep capture metadata visible
- avoid a modal for this slice

Default data:

```ts
{
  title: capture_session.name.trim(),
  description: capture_session.description ?? null,
}
```

If `capture_session.name.trim()` is unexpectedly empty, disable the create action and show `Capture session needs a name before creating a guide.`. This is defensive only; the current backend capture-session contract already requires a non-empty name.

Success behavior:

```ts
redirectTo(`/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(response.guide.id)}`)
```

Use the frontend portal route, not the API route.

Pending behavior:

- disable `Create guide`
- show button text `Creating guide...`
- prevent duplicate clicks while the request is in flight

Error behavior:

- show stable inline message: `Could not create guide.`
- keep the user on the capture-session detail page
- re-enable the button after failure
- if backend returns unauthenticated, show stable inline message rather than replacing the whole already-loaded detail screen
- do not clear already-loaded capture events/assets after a mutation failure

Reason:

- load-state auth errors already cover opening the page
- mutation auth errors can happen if the session expires after the page loaded
- staying on the page with a clear action error is more useful for this internal flow

## UX Direction

This is still an internal operational interface.

Keep the action quiet and direct:

```text
Capture session header
  title
  description
  status/source badges
  Create guide button
```

Do not add:

- hero copy
- explanatory marketing text
- a large wizard
- decorative cards
- event-selection controls

The user should be able to review the capture source and start guide preparation with one explicit action.

## Edge Cases

Handle:

- create succeeds with zero guide blocks
  - redirect anyway; guide editor already has empty-block state
- capture session has no description
  - send `description: null`
- capture session name has surrounding whitespace
  - send trimmed title
- unexpected empty capture session name
  - disable create action with a stable inline message
- create request fails
  - show `Could not create guide.`
- user double-clicks create
  - only one create request should be sent while pending
- session expires before create
  - show mutation error on the page
- backend returns validation conflict
  - show mutation error on the page

Do not handle yet:

- duplicate guide warning
- choosing events
- naming form
- create-and-stay behavior
- create multiple guides intentionally

## Testing Plan

Follow test-driven development.

1. API helper tests:
   - add red test for `createGuideFromCaptureSession`
   - implement helper
   - verify focused API tests

2. Capture page action tests:
   - renders `Create guide` on loaded capture-session detail
   - clicking sends project ID, capture session ID, title, and description
   - title is trimmed before create
   - missing description sends `description: null`
   - pending state disables button and prevents duplicate request
   - success redirects to guide editor URL
   - failure shows `Could not create guide.` and does not redirect
   - mutation failure keeps already-loaded events/assets visible
   - unexpected empty capture-session name disables the create action

3. Regression tests:
   - existing capture-session rendering remains unchanged
   - existing guide editor tests remain green
   - route tests remain green

Suggested commands:

```text
pnpm --filter web test -- src/lib/api.test.ts src/features/capture-session/CaptureSessionDetailPage.test.tsx
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

## Implementation Order

1. Add API client red test.
2. Implement `createGuideFromCaptureSession`.
3. Add capture page red tests for create/redirect/error behavior.
4. Add injected `createGuide` and `redirectTo` props.
5. Add header action UI and pending/error state.
6. Keep styles aligned with existing capture-session page CSS.
7. Run focused tests.
8. Run full web verification.
9. Commit as a small feature slice.

## Acceptance Criteria

- a user can open a capture-session detail page and click `Create guide`
- the browser sends the backend create-guide-from-capture request
- guide creation uses the capture-session name as the draft guide title
- guide creation uses the capture-session description when available
- successful guide creation redirects to `/projects/:project_id/guides/:guide_id`
- failed guide creation leaves the user on the capture-session page with a stable error
- duplicate clicks do not create duplicate requests while pending
- no capture source rows are mutated by frontend behavior
- no raw typed input values or storage internals are surfaced
- all web tests, typecheck, lint, and build pass
