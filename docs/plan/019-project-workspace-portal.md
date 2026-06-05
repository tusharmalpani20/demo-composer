# Project Workspace Portal Plan

Date: 2026-06-05

## Goal

Create the first useful project landing page in the portal:

```text
authenticated portal user
  -> opens /projects/:project_id
  -> sees project context
  -> opens capture sessions or guides
  -> continues the existing workflow
```

This page should connect the portal slices we already built:

```text
project workspace
  -> capture session list
    -> capture session detail
      -> create guide
        -> guide editor
  -> guide list
    -> guide editor
```

The goal is not a full dashboard. The goal is a simple project workspace entry point so the product no longer depends on direct deep links for normal navigation.

## Why This Comes Next

Current state:

- backend supports project CRUD, including `GET /api/v1/projects/:id`
- portal can list capture sessions for a known project URL
- portal can show capture-session detail for a known capture-session URL
- portal can create a guide from a capture session
- portal can list guides for a known project URL
- portal can edit an existing guide

Missing product behavior:

- `/projects/:project_id` is still unsupported in the portal
- users need to know list/detail URLs manually
- capture sessions and guides are not connected by a normal project-level entry point
- unsupported-route copy is doing too much of the navigation work

This slice should make the portal feel like one coherent internal tool without adding broader account, organization, or project-management UX yet.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0001-system-shape-monorepo-rest-portal-extension.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/004-project-foundation-api.md
docs/plan/012-capture-session-detail-portal.md
docs/plan/016-create-guide-from-capture-portal.md
docs/plan/017-project-guide-list-portal.md
docs/plan/018-capture-session-list-portal.md
```

Important implications:

- keep the current REST API style
- keep cookie-backed requests with `credentials: "include"`
- keep route parsing in the lightweight local parser
- do not add React Router in this slice
- do not expose organization IDs, org-user IDs, versions, metadata, storage keys, or private capture internals in the portal UI
- do not add AI
- do not add Chrome extension work
- do not turn this into a project analytics dashboard

## Scope

Included:

- portal route `/projects/:project_id`
- API client helper for `GET /api/v1/projects/:project_id`
- project type definitions for the web app
- project workspace page under `apps/web/src/features/project`
- loading state
- unauthenticated state
- not-found state for missing/inaccessible projects
- generic error state with retry
- project name, description when present, status, slug when present, created and updated timestamps
- navigation links to:
  - `/projects/:project_id/capture-sessions`
  - `/projects/:project_id/guides`
- route parser tests
- API helper tests
- page rendering/state tests
- App route wiring test
- unsupported-route copy update so `/projects/:project_id` is presented as the main entry point

Excluded:

- backend changes
- project list/home page
- project creation UI
- project edit UI
- project delete/archive UI
- organization switcher
- user/account settings
- invite/member management
- capture creation UI
- direct guide creation from the project workspace
- counts for capture sessions or guides
- project color/icon rendering
- analytics
- recent activity feed
- search/filter/sorting controls
- Chrome extension changes
- desktop app
- AI layer

## Backend Contract

Backend route already exists:

```text
GET /api/v1/projects/:id
```

Success:

```json
{
  "project": {
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
}
```

Error mapping:

```text
401 unauthenticated
404 project_not_found
```

Frontend requirements:

- use shared `requestJson`
- use `credentials: "include"`
- send `accept: application/json`
- URL-encode the project ID
- preserve backend `error.type` through `ApiClientError`
- do not render `organization_id`, `created_by_id`, `updated_by_id`, `version`, or metadata
- do not render `color` or `icon` in this slice; they are reserved for a later project branding/profile pass

## Route Contract

Add route:

```text
/projects/:project_id
```

Route parsing:

```ts
{ type: "project_workspace", projectId: string }
```

Routing requirements:

- parse workspace route as `segments.length === 2`
- keep workspace parsing exact so it cannot swallow list/detail routes
- keep existing routes intact:
  - `/projects/:project_id/capture-sessions`
  - `/projects/:project_id/capture-sessions/:capture_session_id`
  - `/projects/:project_id/guides`
  - `/projects/:project_id/guides/:guide_id`
- treat `/projects/:project_id/` as the workspace route because the current parser removes empty path segments
- keep route parsing in `apps/web/src/lib/routes.ts`
- add tests in `apps/web/src/lib/routes.test.ts`
- wire route in `apps/web/src/App.tsx`
- add App route test in `apps/web/src/App.test.tsx`
- add a regression test that `/projects/:project_id/capture-sessions` still parses as the capture-session list route after workspace routing is added

## API Client Work

Add to:

```text
apps/web/src/features/project/types.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Types:

```ts
export type ProjectStatus = "active" | "archived";

export type Project = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  color: string | null;
  icon: string | null;
  status: ProjectStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ProjectDetailResponse = {
  project: Project;
};
```

Function:

```ts
export const getProject = async (
  projectId: string
): Promise<ProjectDetailResponse>
```

Request:

```text
GET /api/v1/projects/:project_id
```

API tests:

- sends correct URL, credentials, and headers
- URL-encodes project ID
- returns the project detail response
- maps `project_not_found` to `kind: "not_found"`
- maps unauthenticated responses to `kind: "unauthenticated"` through the shared client behavior

## Page Work

Create:

```text
apps/web/src/features/project/ProjectWorkspacePage.tsx
apps/web/src/features/project/ProjectWorkspacePage.test.tsx
apps/web/src/features/project/ProjectWorkspacePage.module.css
apps/web/src/features/project/types.ts
```

Props:

```ts
type ProjectWorkspacePageProps = {
  projectId: string;
  loadProject?: (projectId: string) => Promise<ProjectDetailResponse>;
};
```

Default:

```ts
loadProject = getProject
```

State model:

```ts
loading
loaded
unauthenticated
not_found
error
```

State behavior:

- loading: `Loading project...`
- unauthenticated: `Sign in to view this project.`
- not found: `Project was not found.`
- generic error: `Could not load project.` plus retry button

## Workspace UI

This is an internal project workspace, not a marketing page.

Layout:

```text
top app bar
  Demo Composer
  project context

main
  project header
    project name
    status badge
    description if present
    slug if present
    updated / created times

  workspace actions
    Capture sessions
      Open source captures for this project
      link to /projects/:project_id/capture-sessions

    Guides
      Open prepared docs and demos for this project
      link to /projects/:project_id/guides
```

Rendering requirements:

- show project name
- show description only when non-empty
- show status badge
- show slug only when present
- show created and updated timestamps
- show a link to capture sessions with accessible text like `Open capture sessions`
- show a link to guides with accessible text like `Open guides`
- URL-encode project ID in generated links
- do not show organization IDs, creator IDs, updater IDs, versions, metadata, or raw private fields
- do not show project color/icon in this slice
- do not show capture-session or guide counts in this slice

## UX Direction

Keep it quiet and operational:

- no hero
- no marketing copy
- no decorative graphics
- no nested cards
- no analytics blocks
- no empty dashboard panels
- no project editing controls yet
- no create buttons until the related workflow is planned

This page should work like a practical workspace index: it tells the user where they are and gives them the two meaningful next actions.

## Edge Cases

Handle:

- project with no description
- project with no slug
- archived project
- project ID requiring URL encoding
- unauthenticated request
- missing/inaccessible project
- generic network/server failure with retry
- invalid date strings should not crash if possible; if the existing date formatter pattern cannot handle this yet, add a small safe formatter in the page

Do not handle yet:

- project counts
- project edit/archive/delete flows
- project creation
- organization/project switching
- recent activity
- sorting/filtering/search
- guide creation from workspace
- capture creation from workspace

## Testing Plan

Follow test-driven development.

1. Route tests:
   - add red test for `/projects/project_1`
   - add trailing slash route test for `/projects/project_1/`
   - keep list/detail route tests green

2. API helper tests:
   - add red test for `getProject`
   - verify URL encoding
   - verify credentials and headers
   - verify `project_not_found` error mapping

3. Page tests:
   - renders loaded project details
   - renders capture-session and guide navigation links
   - URL-encodes project ID in generated links
   - hides private/internal fields
   - renders project without optional description/slug cleanly
   - renders archived project status
   - does not require or render project color/icon values
   - renders unauthenticated and not-found states
   - renders generic error and retry

4. App tests:
   - `/projects/project_1` renders project workspace
   - unsupported route fallback mentions project workspace as the normal entry point

Suggested commands:

```text
pnpm --filter web test -- src/lib/routes.test.ts src/lib/api.test.ts src/features/project/ProjectWorkspacePage.test.tsx src/App.test.tsx
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

## Implementation Order

1. Add route parser red test for `/projects/:project_id`.
2. Implement `project_workspace` route parsing.
3. Add project web types.
4. Add API helper red tests for `getProject`.
5. Implement `getProject`.
6. Add project workspace page red test for loaded project state.
7. Implement minimal workspace page.
8. Add page tests for navigation links, optional fields, private-field hiding, and error states.
9. Wire route in `App`.
10. Add App route test.
11. Update unsupported-route copy.
12. Run focused tests.
13. Run full web verification.
14. Commit as a small feature slice.

## Acceptance Criteria

- `/projects/:project_id` opens a project workspace page
- page fetches `GET /api/v1/projects/:project_id`
- page shows project name, status, optional description, optional slug, and timestamps
- page links to the project capture-session list
- page links to the project guide list
- generated links URL-encode project ID
- unauthenticated, not-found, and generic error states are clear
- generic error state supports retry
- private org/user/version/metadata fields are not rendered
- no backend behavior changes are required
- all web tests, typecheck, lint, and build pass
