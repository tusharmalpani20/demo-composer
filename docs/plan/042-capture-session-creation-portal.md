# Capture Session Creation Portal Plan

Date: 2026-06-12

## Goal

Let authenticated portal users create a capture session inside a project from the portal.

Target flow:

```text
authenticated portal user
  -> opens /projects/:project_id/capture-sessions
  -> clicks New Capture Session
  -> enters capture session details
  -> submits
  -> backend creates a draft manual capture session in the current project
  -> portal opens /projects/:project_id/capture-sessions/:capture_session_id
```

This continues the self-serve portal path after project creation. A user should be able to create a project and then create an empty capture session that can later receive manual screenshots/events from the portal.

## Why This Comes Next

Current state after `041-project-creation-portal`:

- users can create projects from `/projects`
- users can open a project workspace
- users can list capture sessions for a project
- backend already supports capture session creation
- Chrome extension can create capture sessions, but portal users cannot
- capture session detail already renders source material and supports guide creation from existing capture material

Remaining product gap:

- portal-only users can create a project but cannot create source material containers
- manual screenshot upload needs a capture session parent before it can exist
- manual capture events need a capture session parent before they can be ordered and later turned into guide steps

Capture session creation should come before manual screenshot upload because it establishes the parent workflow boundary for assets, events, and guide generation.

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
docs/plan/006-capture-session-foundation.md
docs/plan/011-capture-session-detail-read-model.md
docs/plan/018-capture-session-list-portal.md
docs/plan/041-project-creation-portal.md
```

Important implications:

- capture sessions remain reusable source material
- captured source records stay immutable; this slice only creates the session container
- default portal-created sessions should use `source_type: "manual"`
- do not auto-create screenshots, assets, events, guides, or default content
- keep Chrome extension capture behavior unchanged
- keep REST API helpers in `apps/web/src/lib/api.ts`
- use cookie-backed portal authentication
- keep lightweight route parsing; do not introduce React Router
- use TDD for implementation
- do not add AI, analytics, or interactive demo behavior

## Scope

Included:

- API client helper for `POST /api/v1/projects/:project_id/capture-sessions`
- request/response types for capture session creation in the web app
- "New Capture Session" action on `/projects/:project_id/capture-sessions`
- inline capture session creation form on the capture-session list page
- injectable `createCaptureSession` dependency on `ProjectCaptureSessionListPage` for focused tests
- form fields:
  - name, required
  - description, optional
  - start URL, optional
- client-side empty-name validation
- optional field normalization before submit
- default `source_type: "manual"`
- submit loading state and duplicate-submit prevention
- cancel behavior
- success redirect to `/projects/:project_id/capture-sessions/:capture_session_id`
- form-level error messaging for:
  - unauthenticated session
  - project not found
  - backend validation failure
  - generic server/network failure
- empty capture-session state should present capture session creation as the clear next action
- focused API helper tests
- focused capture-session list/create UI tests
- App smoke test adjustment only if empty-state copy/control expectations change
- update `docs/project-zoomout-status.md`

Excluded:

- backend API changes unless tests reveal a contract gap
- database migrations
- capture session edit UI
- capture session archive/delete UI
- capture session complete/finalize UI
- manual screenshot upload
- manual capture event creation
- direct guide creation from an empty session
- browser/viewport/user-agent advanced fields in the UI
- Chrome extension changes
- organization switching
- analytics
- AI
- interactive demo creation

## Backend Contract

Backend route already exists:

```http
POST /api/v1/projects/:project_id/capture-sessions
```

Recommended portal request body:

```json
{
  "name": "Create department workflow",
  "description": "Manual screenshots for department setup.",
  "source_type": "manual",
  "start_url": "https://example.internal/app"
}
```

Allowed backend fields:

```text
name: string, required, non-empty after trim
description: string | null, optional
source_type: "manual" | "extension" | "import", optional
start_url: string | null, optional
browser_name: string | null, optional
browser_version: string | null, optional
operating_system: string | null, optional
viewport_width: number | null, optional
viewport_height: number | null, optional
device_pixel_ratio: number | null, optional
user_agent: string | null, optional
metadata: unknown, optional
```

Portal should only send:

```text
name
description
source_type: "manual"
start_url
```

Reasoning:

- this is a manual portal-created capture session
- browser/viewport/device fields are extension capture metadata and should not be manually collected yet
- metadata has no user-facing meaning yet
- richer metadata can be added later if manual capture tools need it

Success response:

```json
{
  "capture_session": {
    "id": "capture_session_1",
    "organization_id": "organization_1",
    "project_id": "project_1",
    "name": "Create department workflow",
    "description": "Manual screenshots for department setup.",
    "status": "draft",
    "source_type": "manual",
    "started_at": null,
    "completed_at": null,
    "canceled_at": null,
    "start_url": "https://example.internal/app",
    "browser_name": null,
    "browser_version": null,
    "operating_system": null,
    "viewport_width": null,
    "viewport_height": null,
    "device_pixel_ratio": null,
    "user_agent": null,
    "created_by_id": "org_user_1",
    "updated_by_id": "org_user_1",
    "version": 1,
    "created_at": "2026-06-12T00:00:00.000Z",
    "updated_at": "2026-06-12T00:00:00.000Z"
  }
}
```

Error responses already supported:

```text
401 unauthenticated
404 project_not_found
400 invalid_capture_session
```

Frontend should preserve backend `error.type` through `ApiClientError` and map those types to form-level messages.

## API Client Work

Update:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/capture-session/types.ts
```

Recommended types:

```ts
export type CreateCaptureSessionInput = {
  name: string;
  description?: string | null;
  source_type?: CaptureSessionSourceType;
  start_url?: string | null;
};

export type CaptureSessionCreateResponse = {
  capture_session: CaptureSession;
};
```

Recommended helper:

```ts
export const createProjectCaptureSession = async (
  projectId: string,
  input: CreateCaptureSessionInput
): Promise<CaptureSessionCreateResponse> => (
  requestJson<CaptureSessionCreateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);
```

Test requirements:

- sends `POST /api/v1/projects/:project_id/capture-sessions`
- URL-encodes `project_id`
- includes session cookies through shared `requestJson`
- sends `content-type: application/json`
- sends only `name`, `description`, `source_type`, and `start_url`
- returns parsed `{ capture_session }`
- maps unauthenticated, project-not-found, and validation errors through existing `ApiClientError`

## UI Shape

Keep creation on `/projects/:project_id/capture-sessions` as an inline form or panel.

Reasoning:

- avoids adding a new route for a small form
- works well for empty state and normal list state
- matches the project creation portal pattern from plan `041`
- keeps the next redirect target as the existing capture session detail route

Recommended UI behavior:

```text
/projects/:project_id/capture-sessions
  header: Capture sessions + New Capture Session button
  when clicked: show create form above the list
  submit success: navigate("/projects/:project_id/capture-sessions/:capture_session_id") when navigate prop exists
                  otherwise window.location.assign(...)
  cancel: hide form and keep current list loaded
```

`ProjectCaptureSessionListPage` should accept:

```ts
createCaptureSession?: typeof createProjectCaptureSession
navigate?: (path: string) => void
```

Keep the existing `loadCaptureSessions`, `performLogout`, and `currentPath` injections intact. The default `loadCaptureSessions` prop currently receives `projectId`; creation should follow the same dependency-injection style and receive the current `projectId` from the page instead of asking the form for a project.

The default navigation fallback matters because `App` currently renders this page without injecting `navigate`.

Form fields:

```text
Name: required text input
Start URL: optional text input
Description: optional textarea
```

UX requirements:

- focus name input when the form opens if practical
- trim the name before submit
- convert whitespace-only optional description/start URL values to `null` or omit them
- always submit `source_type: "manual"` from this portal form
- keep button labels concrete:
  - New Capture Session
  - Create Capture Session
  - Cancel
- disable submit while request is in flight
- preserve typed values when submit fails
- clear form only after success if navigation does not happen
- do not reload the capture session list on failed create
- do not hide or alter the shared topbar sign-out behavior
- do not display internal IDs, `organization_id`, `created_by_id`, `updated_by_id`, or `version`
- do not create duplicate competing "New Capture Session" buttons; prefer one header action and make the empty state point to that action or reuse the same control deliberately

Empty state should change from only:

```text
No capture sessions yet.
```

to a useful action state:

```text
No capture sessions yet.
[New Capture Session]
```

Do not create a default capture session automatically.

## Error Handling

Client-side validation:

```text
empty or whitespace-only name -> "Capture session name is required."
```

Backend/API errors:

```text
unauthenticated -> "Sign in to create a capture session."
project_not_found -> "Project was not found."
invalid_capture_session -> "Capture session input is invalid."
other -> "Could not create capture session."
```

The page should keep existing list error behavior:

```text
Could not load capture sessions.
Retry
```

Creation errors should not replace the loaded list with a full-page error.

## Implementation Plan

1. Add failing API helper tests for `createProjectCaptureSession`.
2. Implement `CreateCaptureSessionInput`, `CaptureSessionCreateResponse`, and `createProjectCaptureSession`.
3. Add failing `ProjectCaptureSessionListPage` tests for:
   - New Capture Session opens the form and focuses name
   - client-side required-name validation
   - optional description/start URL whitespace is normalized before submit
   - submit includes `source_type: "manual"`
   - submit button is disabled while create is in flight
   - successful create redirects to the new capture session detail page
   - unauthenticated/project-not-found/validation errors render as form messages
   - generic create failures keep the form open with typed values intact
   - empty state exposes New Capture Session
4. Implement the capture session creation form inside `ProjectCaptureSessionListPage`.
5. Add or adjust CSS in `ProjectCaptureSessionListPage.module.css`.
6. Run focused tests.
7. Run broader web tests, typecheck, lint, build, and `git diff --check`.
8. Update `docs/project-zoomout-status.md`.

## Testing Checklist

Focused commands:

```bash
pnpm --filter web test -- api.test.ts ProjectCaptureSessionListPage.test.tsx App.test.tsx
```

Broader commands:

```bash
pnpm --filter web test
pnpm check-types
pnpm lint
pnpm build
git diff --check
```

Backend tests are not required if the implementation stays frontend-only. If any backend contract changes become necessary, run:

```bash
pnpm --filter server test -- capture-session.service.test.ts capture-session.routes.test.ts capture-session.app.integration.test.ts
```

## Acceptance Criteria

- authenticated users can create a manual capture session from `/projects/:project_id/capture-sessions`
- newly created capture sessions open in `/projects/:project_id/capture-sessions/:capture_session_id`
- empty project capture-session lists have a visible next action
- required capture session name is validated before the API call
- create submit cannot fire duplicate requests while the first request is pending
- optional description/start URL blanks are not sent as meaningful strings
- portal-created capture sessions use `source_type: "manual"`
- capture session creation remains scoped to the current authenticated organization/project
- no organization/user IDs leak into create UI
- no capture assets, capture events, or guides are created automatically
- tests cover API helper behavior and portal create behavior
- docs reflect that capture session creation UI exists

## Follow-Up Work

After this slice, the next best milestone is:

```text
043-manual-screenshot-upload-to-capture-session.md
```

That should let portal users add screenshot source material to a manually created capture session.
