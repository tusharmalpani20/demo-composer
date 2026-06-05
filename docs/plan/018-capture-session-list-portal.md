# Capture Session List Portal Plan

Date: 2026-06-05

## Goal

Make capture sessions discoverable inside the portal:

```text
authenticated portal user
  -> opens /projects/:project_id/capture-sessions
  -> sees project capture sessions
  -> clicks a capture session
  -> opens capture-session detail
  -> can create a guide from that capture source
```

This is the missing source-material index for the current workflow:

```text
capture session list
  -> capture session detail
  -> create guide
  -> guide editor
```

The goal is not a project dashboard or capture management console. The goal is a practical internal list page so users can find capture source material without a direct URL.

## Why This Comes Next

Current state:

- backend already lists capture sessions with `GET /api/v1/projects/:project_id/capture-sessions`
- portal can render capture-session detail when opened by direct URL
- portal can create a guide from a capture-session detail page
- portal can list and open generated guides

Missing product behavior:

- users cannot rediscover capture sessions from the portal
- capture-session URLs are the only navigation path
- the guide creation workflow still needs a manually known capture-session URL

This slice should add the smallest useful capture source list without changing backend behavior.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/012-capture-session-detail-portal.md
docs/plan/016-create-guide-from-capture-portal.md
docs/plan/017-project-guide-list-portal.md
```

Important implications:

- capture sessions are source material, not edited guide artifacts
- raw typed input values must not appear in the browser
- file storage internals must not appear in the browser
- no AI layer in this slice
- no Chrome extension changes in this slice
- keep the current lightweight route parser instead of adding React Router
- use cookie-backed requests with `credentials: "include"`

## Scope

Included:

- portal route `/projects/:project_id/capture-sessions`
- API client helper for listing project capture sessions
- capture-session list page under `apps/web/src/features/capture-session`
- optional status query support in the API helper, matching the backend contract
- loading state
- unauthenticated state
- not-found state for missing/inaccessible project
- generic error state with retry
- empty-state message when no capture sessions exist
- rows/cards for all capture-session statuses
- name, description, status, source type, started/completed timestamps, browser/system/viewport where present
- link/open action to `/projects/:project_id/capture-sessions/:capture_session_id`
- frontend tests for route parsing, API helper, page states, rendering, and App routing

Excluded:

- backend changes
- event count or asset count display
- capture-session detail read-model changes
- filtering UI
- search UI
- sorting controls
- pagination
- capture creation UI
- capture status mutation UI
- capture delete/archive UI
- guide creation directly from the list
- project dashboard
- project selector
- Chrome extension changes
- desktop app
- AI layer

## Backend Contract

Backend route already exists:

```text
GET /api/v1/projects/:project_id/capture-sessions
```

Optional query:

```text
status=draft|capturing|completed|canceled|archived
```

Success:

```json
{
  "capture_sessions": [
    {
      "id": "capture_session_id",
      "organization_id": "organization_id",
      "project_id": "project_id",
      "name": "Create department workflow",
      "description": "Source capture for the department setup guide",
      "status": "completed",
      "source_type": "extension",
      "started_at": "2026-06-05T10:00:00.000Z",
      "completed_at": "2026-06-05T10:05:00.000Z",
      "canceled_at": null,
      "start_url": "https://example.internal/app/department",
      "browser_name": "Chrome",
      "browser_version": "126",
      "operating_system": "Linux",
      "viewport_width": 1440,
      "viewport_height": 900,
      "device_pixel_ratio": 1,
      "user_agent": "Mozilla/5.0",
      "created_by_id": "org_user_id",
      "updated_by_id": "org_user_id",
      "version": 1,
      "created_at": "2026-06-05T10:00:00.000Z",
      "updated_at": "2026-06-05T10:05:00.000Z"
    }
  ]
}
```

Ordering is backend-owned. Frontend must render response order as-is.

Error mapping:

```text
401 unauthenticated
404 project_not_found
```

Important limitation:

- the existing list endpoint does not include event counts or asset counts
- do not add counts in this frontend slice
- if counts become important, plan a later backend read-model enhancement

## Route Contract

Add route:

```text
/projects/:project_id/capture-sessions
```

Existing capture-session detail route remains:

```text
/projects/:project_id/capture-sessions/:capture_session_id
```

Route parsing:

```ts
{ type: "project_capture_session_list", projectId: string }
```

Routing requirements:

- parse list route as `segments.length === 3`
- keep the existing detail route as `segments.length === 4`
- treat `/projects/:project_id/capture-sessions/` as the list route because the current parser removes empty path segments
- keep route parsing in `apps/web/src/lib/routes.ts`
- add tests in `apps/web/src/lib/routes.test.ts`
- wire route in `apps/web/src/App.tsx`
- add App route test in `apps/web/src/App.test.tsx`
- update unsupported-route copy so it mentions capture-session lists, guide lists, and direct detail links

## API Client Work

Add to:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Types:

```ts
import type {
  CaptureSession,
  CaptureSessionStatus,
} from "../features/capture-session/types";

export type ProjectCaptureSessionListResponse = {
  capture_sessions: CaptureSession[];
};

export type ListCaptureSessionsOptions = {
  status?: CaptureSessionStatus;
};
```

Function:

```ts
export const listProjectCaptureSessions = async (
  projectId: string,
  options: ListCaptureSessionsOptions = {}
): Promise<ProjectCaptureSessionListResponse>
```

Request:

```text
GET /api/v1/projects/:project_id/capture-sessions
GET /api/v1/projects/:project_id/capture-sessions?status=completed
```

Requirements:

- use shared `requestJson`
- use `credentials: "include"`
- send `accept: application/json`
- encode project ID
- encode query string when `status` is provided
- preserve backend `error.type` through `ApiClientError`
- no ad hoc fetch/error parsing in React components
- expose status support only through the API helper for now; do not add status UI controls in this slice

API tests:

- sends correct URL, credentials, and headers without status
- sends correct URL with `status=completed`
- returns capture-session list response
- maps `project_not_found` to `kind: "not_found"`

## Page Work

Create:

```text
apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx
apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx
apps/web/src/features/capture-session/ProjectCaptureSessionListPage.module.css
```

Props:

```ts
type ProjectCaptureSessionListPageProps = {
  projectId: string;
  loadCaptureSessions?: (
    projectId: string
  ) => Promise<ProjectCaptureSessionListResponse>;
};
```

Default:

```ts
loadCaptureSessions = listProjectCaptureSessions
```

The page does not accept or render a status filter in this slice. Filtering controls are deferred even though the API helper supports status for later reuse.

State model:

```ts
loading
loaded
unauthenticated
not_found
error
```

State behavior:

- loading: `Loading capture sessions...`
- unauthenticated: `Sign in to view capture sessions.`
- not found: `Project was not found.`
- generic error: `Could not load capture sessions.` plus retry button
- empty loaded state: `No capture sessions yet.`

## List UI

This is an internal operational source-material list.

Layout:

```text
top app bar
  Demo Composer
  project / capture sessions context

main
  header
    Capture sessions
    project id context

  list
    capture-session row
      name
      description if present
      status badge
      source type badge
      started / completed / canceled / updated times
      browser/system/viewport summary when present
      Open action/link
```

Rendering requirements:

- show capture-session name
- show description only when non-empty
- show status badge
- show source type badge
- show start URL hostname when `start_url` is present
- show `No start URL` when missing
- show `Started`, `Completed`, `Canceled`, and `Updated` times where applicable
- show browser/system/viewport summary only when present
- each row should link to `/projects/:project_id/capture-sessions/:capture_session_id`
- link text should be `Open capture session <name>` for accessible navigation
- encode project and capture-session IDs in generated URLs
- do not show organization IDs, creator IDs, updater IDs, versions, user agents, metadata, target selectors, storage keys, or raw typed input values

## UX Direction

Keep it quiet and dense:

- no hero
- no marketing copy
- no decorative graphics
- no nested cards
- no filters/search in this slice
- no create button until the portal has a clear capture creation flow

The page should feel like a source-material index in an internal tool: scannable, direct, and predictable.

## Edge Cases

Handle:

- empty list
- all capture-session statuses
- session without description
- session without start URL
- session without browser/system/viewport metadata
- project not found
- unauthenticated request
- generic network/server failure with retry
- invalid or non-URL `start_url`

Do not handle yet:

- event counts
- asset counts
- status filtering controls
- search
- sorting controls
- pagination
- deleting/archiving capture sessions from the list
- creating guides directly from the list
- showing source app favicons or screenshots

## Testing Plan

Follow test-driven development.

1. Route tests:
   - add red test for `/projects/project_1/capture-sessions`
   - keep existing capture-session detail route test green

2. API helper tests:
   - add red test for `listProjectCaptureSessions`
   - add status-query test
   - implement helper
   - verify the helper omits the query string when status is not provided

3. Page tests:
   - renders loaded capture sessions in backend response order
   - renders empty state
   - renders unauthenticated and not-found states
   - renders generic error and retry
   - rows link to encoded detail route
   - missing optional fields render clean fallback text
   - private/internal fields are not rendered

4. App test:
   - `/projects/project_1/capture-sessions` renders the list page
   - unsupported route fallback mentions capture-session lists

Suggested commands:

```text
pnpm --filter web test -- src/lib/routes.test.ts src/lib/api.test.ts src/features/capture-session/ProjectCaptureSessionListPage.test.tsx src/App.test.tsx
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

## Implementation Order

1. Add route parser red test.
2. Implement `project_capture_session_list` route parsing.
3. Add API helper red tests.
4. Implement `listProjectCaptureSessions`.
5. Add capture-session list page red test for loaded list.
6. Implement minimal page.
7. Add page tests for empty/error/auth/not-found/retry/fallback/private-field behavior.
8. Wire route in `App`.
9. Add App route test.
10. Run focused tests.
11. Run full web verification.
12. Commit as a small feature slice.

## Acceptance Criteria

- `/projects/:project_id/capture-sessions` opens a portal capture-session list page
- page fetches `GET /api/v1/projects/:project_id/capture-sessions`
- API helper can request a specific status when called with `status`
- list renders in backend response order
- each capture session can be opened in the existing capture-session detail route
- generated detail links URL-encode IDs
- empty projects show `No capture sessions yet.`
- unauthenticated, not-found, and generic error states are clear
- generic error state supports retry
- private org/user/version/user-agent/storage/raw-input fields are not rendered
- no backend behavior changes are required
- all web tests, typecheck, lint, and build pass
