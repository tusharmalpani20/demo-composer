# Project Creation Portal Plan

Date: 2026-06-12

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Let authenticated portal users create a project from the project home page without seed data, direct API calls, or manually known project IDs.

Target flow:

```text
authenticated portal user
  -> opens /projects
  -> clicks New Project
  -> enters project details
  -> submits
  -> backend creates the project in the current organization
  -> portal opens /projects/:project_id
```

This is a self-serve product foundation slice. It should make the portal usable from an empty organization before adding capture-session creation, portal uploads, or richer sharing settings.

## Why This Comes Next

Current state after `040-guide-markdown-export`:

- the capture-to-guide loop is functionally strong once a project exists
- backend already supports project creation
- the project list/home page can show projects
- the project workspace can open captures and guides
- extension capture requires a selected project
- many workflows still assume a project already exists

Remaining product gap:

- a new self-hosted or freshly onboarded user can land in the portal and see an empty project list, but cannot create the first project from the UI
- Chrome extension setup depends on a project existing before capture can begin
- future capture-session creation and upload flows need a project workspace users can create themselves

Project creation should come before capture-session creation because project is the parent boundary for captures, guides, assets, and future demos.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0001-system-shape-monorepo-rest-portal-extension.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0015-user-organization-org-user-identity-model.md
docs/plan/004-project-foundation-api.md
docs/plan/019-project-workspace-portal.md
docs/plan/021-project-list-portal-home.md
docs/plan/022-extension-foundation.md
```

Important implications:

- keep the backend project domain as the owner of project creation rules
- scope project creation to the authenticated user's current organization
- do not expose organization IDs in the UI or request body
- use cookie-backed portal authentication
- keep REST API helpers in `apps/web/src/lib/api.ts`
- keep lightweight route parsing; do not introduce React Router
- use TDD for the implementation slice
- do not add organization switching or invitations in this slice
- do not add project edit/archive UI in this slice
- do not add analytics or AI

## Scope

Included:

- API client helper for `POST /api/v1/projects`
- request/response types for project creation in the web app
- "New Project" action on the project list/home page
- project creation form in the portal
- injectable `createProject` dependency on `ProjectListPage` for focused tests
- form fields:
  - project name, required
  - description, optional
  - slug, optional
- client-side empty-name guard
- submit loading state
- cancel/back behavior
- success redirect to `/projects/:project_id`
- conflict/error messaging for:
  - unauthenticated session
  - duplicate project name
  - duplicate project slug
  - generic server/network failure
- empty project-list state should present project creation as the clear next action
- focused API helper tests
- focused project list/create UI tests
- App smoke test adjustment only if the project-list empty state text or controls change existing expectations
- update `docs/project-zoomout-status.md`

Excluded:

- backend API changes unless tests reveal a contract gap
- database migrations
- project edit UI
- project archive/delete UI
- project color/icon/metadata UI
- organization switching
- organization/user/member invitation UI
- first-run setup changes
- capture session creation
- manual screenshot upload
- Chrome extension changes
- analytics
- AI

## Backend Contract

Backend route already exists:

```http
POST /api/v1/projects
```

Request body:

```json
{
  "name": "Internal onboarding demos",
  "description": "Reusable captures and guides for internal teams.",
  "slug": "internal-onboarding-demos"
}
```

Allowed fields:

```text
name: string, required, non-empty after trim
description: string | null, optional
slug: string | null, optional
color: string | null, optional
icon: string | null, optional
metadata: unknown, optional
```

Portal should only send:

```text
name
description
slug
```

Reasoning:

- color/icon/metadata are backend-supported, but they are not meaningful product controls yet
- adding those fields now adds UI decisions without improving the first-project workflow
- these can be added later in project settings

Success response:

```json
{
  "project": {
    "id": "project_1",
    "organization_id": "organization_1",
    "name": "Internal onboarding demos",
    "description": "Reusable captures and guides for internal teams.",
    "slug": "internal-onboarding-demos",
    "color": null,
    "icon": null,
    "status": "active",
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
409 project_name_conflict
409 project_slug_conflict
```

Frontend should preserve backend `error.type` via `ApiClientError` and map those types to user-facing form messages.

## API Client Work

Update:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/project/types.ts
```

Recommended types:

```ts
export type CreateProjectInput = {
  name: string;
  description?: string | null;
  slug?: string | null;
};

export type ProjectCreateResponse = {
  project: Project;
};
```

Recommended helper:

```ts
export const createProject = async (
  input: CreateProjectInput
): Promise<ProjectCreateResponse> => (
  requestJson<ProjectCreateResponse>("/api/v1/projects", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  })
);
```

Test requirements:

- sends `POST /api/v1/projects`
- includes `credentials: "include"` through shared `requestJson`
- sends `content-type: application/json`
- sends only `name`, `description`, and `slug`
- can send `description` and `slug` as `null` when the UI intentionally clears optional fields
- returns parsed `{ project }`
- maps duplicate name/slug errors through existing `ApiClientError`

## Route And UI Shape

Preferred first slice: keep creation on `/projects` as an inline form or panel instead of adding a new route.

Reasoning:

- it keeps the flow compact
- avoids adding route state just for a small form
- reduces route parsing work
- works well for empty state and normal list state

Recommended UI behavior:

```text
/projects
  header: Projects + New Project button
  when clicked: show create form above the list
  submit success: navigate("/projects/:project_id") when navigate prop exists
                  otherwise set window.location.assign("/projects/:project_id")
  cancel: hide the form and keep current list loaded
```

`ProjectListPage` should accept:

```ts
createProject?: typeof createProject
navigate?: (path: string) => void
```

The default navigation fallback matters because `App` currently renders `ProjectListPage` without injecting `navigate`.

Form fields:

```text
Name: required text input
Slug: optional text input
Description: optional textarea
```

UX requirements:

- focus name input when the form opens if practical
- trim the name before submit
- convert whitespace-only optional description/slug values to `null` or omit them
- keep button labels concrete:
  - New Project
  - Create Project
  - Cancel
- disable submit while request is in flight
- preserve typed values when submit fails
- clear form after success only if navigation does not happen
- do not reload the project list on failed create
- do not create duplicate competing "New Project" buttons; prefer one header action and make the empty state point to that action or reuse the same control deliberately
- do not display internal IDs, `organization_id`, `created_by_id`, `updated_by_id`, or `version`

Empty state should change from only:

```text
No projects yet.
```

to a useful action state:

```text
No projects yet.
[New Project]
```

Do not create a default project automatically.

## Error Handling

Client-side validation:

```text
empty or whitespace-only name -> "Project name is required."
```

Backend/API errors:

```text
unauthenticated -> show sign-in state or form-level "Sign in to create a project."
project_name_conflict -> "A project with this name already exists."
project_slug_conflict -> "A project with this slug already exists."
other -> "Could not create project."
```

The page should keep existing list error behavior:

```text
Could not load projects.
Retry
```

Creation errors should not replace the loaded list with a full-page error.

## Implementation Plan

1. Add failing API helper tests for `createProject`.
2. Implement `CreateProjectInput`, `ProjectCreateResponse`, and `createProject`.
3. Add failing `ProjectListPage` tests for:
   - New Project opens the form
   - client-side required-name validation
   - optional description/slug whitespace is normalized before submit
   - submit button is disabled while create is in flight
   - successful create redirects to the new project workspace
   - duplicate name/slug errors render as form messages
   - generic create failures keep the form open with typed values intact
   - empty state exposes New Project
4. Implement the project creation form inside `ProjectListPage`.
5. Add or adjust CSS in `ProjectListPage.module.css`.
6. Run focused tests.
7. Run broader web tests, typecheck, lint, build, and `git diff --check`.
8. Update `docs/project-zoomout-status.md`.

## Testing Checklist

Focused commands:

```bash
pnpm --filter web test -- api.test.ts ProjectListPage.test.tsx App.test.tsx
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
pnpm --filter server test -- project.service.test.ts project.routes.test.ts project.app.integration.test.ts
```

## Acceptance Criteria

- authenticated users can create a project from `/projects`
- newly created projects open in `/projects/:project_id`
- empty organizations have a visible next action
- duplicate name and duplicate slug errors are understandable
- required project name is validated before the API call
- create submit cannot fire duplicate requests while the first request is pending
- optional description/slug blanks are not sent as meaningful strings
- project creation remains scoped to the current authenticated organization
- no organization/user IDs leak into create UI
- no project is created automatically
- tests cover API helper behavior and portal create behavior
- docs reflect that project creation UI exists

## Follow-Up Work

After this slice, the next best milestone is:

```text
042-capture-session-creation-portal.md
```

That should let users create a capture session from the portal once they can create and open a project.
