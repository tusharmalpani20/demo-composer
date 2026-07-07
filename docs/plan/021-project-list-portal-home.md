# Project List Portal Home Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Create the portal home page that authenticated users see after login:

```text
authenticated portal user
  -> opens /projects or /
  -> sees accessible projects
  -> opens a project workspace
  -> continues into captures and guides
```

This completes the basic portal navigation loop:

```text
/login
  -> /projects
    -> /projects/:project_id
      -> capture sessions
      -> guides
```

The goal is not project creation or a project dashboard. The goal is a practical project index so users no longer need to know a project ID manually.

## Why This Comes Next

Current state:

- portal now has `/login`
- successful login currently defaults to `/`
- `/` is still unsupported
- backend already supports `GET /api/v1/projects`
- portal has a project workspace at `/projects/:project_id`
- project workspace links to capture sessions and guides

Missing product behavior:

- users cannot discover projects from the portal
- the login default destination is not useful
- the product still depends on manually known project URLs
- there is no authenticated portal home

This slice should make the first logged-in experience useful while keeping project creation/editing separate.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0001-system-shape-monorepo-rest-portal-extension.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/004-project-foundation-api.md
docs/plan/019-project-workspace-portal.md
docs/plan/020-portal-auth-entry.md
```

Important implications:

- keep REST API helpers in `apps/web/src/lib/api.ts`
- use cookie-backed requests with `credentials: "include"`
- keep lightweight route parsing; do not introduce React Router
- keep sign-in links on unauthenticated states
- keep the shared portal sign-out affordance
- do not add project creation in this slice
- do not add organization switching in this slice
- do not add analytics
- do not add AI

## Scope

Included:

- portal route `/projects`
- portal route `/` as the same project list/home page
- API helper for `GET /api/v1/projects`
- optional API-only status query support
- project list page under `apps/web/src/features/project`
- loading state
- unauthenticated state with sign-in link
- generic error state with retry
- empty state for no projects
- project rows/cards in backend response order
- project name, description when present, status, slug when present, created and updated timestamps
- link each project to `/projects/:project_id`
- shared top-bar sign out action
- update login default redirect from `/` to `/projects`
- update unsupported-route copy so `/projects` is presented as the normal portal home
- route tests
- API helper tests
- page tests
- App route tests

Excluded:

- backend changes
- project creation UI
- project edit UI
- project archive/delete UI
- status filter UI
- search
- sorting controls
- pagination
- project dashboard metrics
- capture-session or guide counts
- organization switcher
- invite/member management
- first-run setup UI
- signup
- Chrome extension work
- desktop app
- AI layer

## Backend Contract

Backend route already exists:

```text
GET /api/v1/projects
```

Optional query:

```text
status=active|archived
```

Success:

```json
{
  "projects": [
    {
      "id": "project_id",
      "organization_id": "organization_id",
      "name": "Internal onboarding demos",
      "description": "Reusable captures and guides for internal teams.",
      "slug": "internal-onboarding-demos",
      "color": "#2563eb",
      "icon": "folder",
      "status": "active",
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
unknown server/network failure
```

Frontend requirements:

- use shared `requestJson`
- use `credentials: "include"`
- send `accept: application/json`
- URL-encode status query when provided
- preserve backend `error.type` through `ApiClientError`
- do not render `organization_id`, `created_by_id`, `updated_by_id`, `version`, or metadata
- do not render project `color` or `icon` in this slice

## Route Contract

Add routes:

```text
/
/projects
```

Route parsing:

```ts
{ type: "project_list" }
```

Routing requirements:

- parse `/` as `project_list`
- parse `/projects` and `/projects/` as `project_list`
- keep `/projects/:project_id` as project workspace
- keep all existing project child routes intact
- keep `/login` intact
- keep route parsing in `apps/web/src/lib/routes.ts`
- add route tests in `apps/web/src/lib/routes.test.ts`
- wire route in `apps/web/src/App.tsx`
- add App tests in `apps/web/src/App.test.tsx`

## API Client Work

Add to:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Types:

```ts
export type ProjectListResponse = {
  projects: Project[];
};

export type ListProjectsOptions = {
  status?: ProjectStatus;
};
```

Function:

```ts
export const listProjects = async (
  options: ListProjectsOptions = {}
): Promise<ProjectListResponse>
```

Request:

```text
GET /api/v1/projects
GET /api/v1/projects?status=archived
```

API tests:

- sends correct URL, credentials, and headers without status
- sends correct URL with `status=archived`
- returns project list response
- maps unauthenticated responses to `kind: "unauthenticated"`

## Page Work

Create:

```text
apps/web/src/features/project/ProjectListPage.tsx
apps/web/src/features/project/ProjectListPage.test.tsx
apps/web/src/features/project/ProjectListPage.module.css
```

Props:

```ts
type ProjectListPageProps = {
  loadProjects?: () => Promise<ProjectListResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};
```

Default:

```ts
loadProjects = listProjects
currentPath = currentBrowserPath()
```

The page does not accept or render a status filter in this slice. The API helper supports status so later UI can reuse it.

State model:

```ts
loading
loaded
unauthenticated
error
```

State behavior:

- loading: `Loading projects...`
- unauthenticated: `Sign in to view projects.` plus `Sign in` link
- generic error: `Could not load projects.` plus retry button
- empty loaded state: `No projects yet.`

## List UI

This is an internal portal home page.

Layout:

```text
top app bar
  Demo Composer
  Projects
  Sign out

main
  header
    Projects
    portal home context

  list
    project row
      project name
      status badge
      description if present
      slug if present
      updated / created timestamps
      Open project link
```

Rendering requirements:

- show project name
- show description only when non-empty
- show status badge
- show slug only when present
- show created and updated timestamps
- link each row to `/projects/:project_id`
- link text should be `Open project <name>`
- URL-encode project IDs in generated links
- render projects in backend response order
- do not show organization IDs, creator IDs, updater IDs, versions, metadata, color, or icon
- do not show capture/guide counts in this slice

## Login Redirect Update

Update login default behavior:

```ts
nextPath = "/projects"
```

Requirements:

- direct `/login` success navigates to `/projects`
- `/login?next=/projects/project_1` still navigates to `/projects/project_1`
- unsafe `next` values fall back to `/projects`

Recommendation:

- use `/projects` as the login page default
- update `safeNextPath` to accept a fallback path, or add a login-specific wrapper that falls back to `/projects`
- keep sign-in link generation safe; unauthenticated page links should still encode the current relative path
- ensure tests explicitly cover direct `/login` default behavior
- ensure tests explicitly cover unsafe `next` values falling back to `/projects`

## UX Direction

Keep it quiet and operational:

- no hero
- no marketing copy
- no decorative graphics
- no nested cards
- no dashboard metrics
- no empty panels
- no create button until project creation is planned

This should feel like a straightforward workspace picker.

## Edge Cases

Handle:

- empty project list
- project without description
- project without slug
- archived projects if returned by API helper injection/test
- project ID requiring URL encoding
- unauthenticated request
- generic network/server failure with retry
- invalid date strings should not crash; use a safe formatter
- sign out success
- sign out failure without removing list content

Do not handle yet:

- project creation
- project editing
- project archive/delete
- project filtering UI
- search
- sorting controls
- pagination
- organization switching
- first-run setup

## Testing Plan

Follow test-driven development.

1. Route tests:
   - add red test for `/`
   - add red test for `/projects`
   - add trailing slash test for `/projects/`
   - keep `/projects/:project_id` workspace route green

2. API helper tests:
   - add red test for `listProjects`
   - add status-query test
   - verify credentials and headers
   - verify unauthenticated error mapping

3. Page tests:
   - renders loaded projects in response order
   - renders empty state
   - renders unauthenticated state with encoded sign-in link
   - renders generic error and retry
   - URL-encodes project IDs in links
   - hides private/internal fields and color/icon
   - renders optional description/slug only when present
   - handles invalid dates without crashing
   - includes `Sign out`
   - sign out success calls logout and navigates to `/login`
   - sign out failure keeps project list visible

4. App tests:
   - `/` renders project list page
   - `/projects` renders project list page
   - `/login` renders a login page whose default successful destination is `/projects`
   - unsupported route fallback mentions project list/home

Suggested commands:

```text
pnpm --filter web test -- src/lib/routes.test.ts src/lib/api.test.ts src/features/project/ProjectListPage.test.tsx src/features/auth/LoginPage.test.tsx src/App.test.tsx
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

## Implementation Order

1. Add route parser red tests for `/` and `/projects`.
2. Implement `project_list` route parsing.
3. Add API helper red tests for `listProjects`.
4. Implement `listProjects`.
5. Add project list page red test for loaded project list.
6. Implement minimal project list page.
7. Add page tests for empty/error/unauthenticated/retry/private-field/fallback behavior.
8. Wire route in `App`.
9. Add App route tests.
10. Update login default redirect to `/projects`.
11. Update unsafe login `next` fallback to `/projects`.
12. Update unsupported-route copy.
13. Run focused tests.
14. Run full web verification.
15. Commit as a small feature slice.

## Acceptance Criteria

- `/` opens the project list portal home
- `/projects` opens the project list portal home
- page fetches `GET /api/v1/projects`
- API helper can request a specific project status when called with `status`
- list renders in backend response order
- each project can be opened in the existing project workspace route
- generated project links URL-encode IDs
- empty project list shows `No projects yet.`
- unauthenticated state includes a sign-in link
- generic error state supports retry
- top bar includes sign out
- direct `/login` success navigates to `/projects`
- private org/user/version/metadata/color/icon fields are not rendered
- no backend behavior changes are required
- all web tests, typecheck, lint, and build pass
