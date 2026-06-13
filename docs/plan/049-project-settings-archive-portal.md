# Project Settings And Archive Portal Plan

Date: 2026-06-13

Status: Planned.

## Goal

Give authenticated portal users a project lifecycle surface so projects are no longer create-only from the UI.

Target flow:

```text
authenticated portal user
  -> opens /projects/:project_id
  -> opens project settings
  -> edits project name, description, or slug
  -> saves through the existing project update API
  -> sees the workspace update with the latest project details
  -> archives the project when the workspace should be hidden from active work
  -> can still open the archived project directly and unarchive it later
```

This is the next foundation slice after the first capture-to-guide loop because the product now has enough project-owned artifacts that users need basic workspace lifecycle controls.

## Why This Comes Next

The current product can complete a shareable Scribe-style guide workflow:

```text
project
  -> capture session
  -> screenshots and events
  -> generated guide
  -> guide editor
  -> preview
  -> publish link
  -> public reader
```

But projects are still missing portal ownership controls:

- projects can be created, listed, and opened
- project details can be read
- backend project updates already exist
- portal users cannot edit project display fields
- portal users cannot archive/unarchive projects
- archived projects appear in list filtering, but there is no user-facing lifecycle action

Project settings should come before embed, password-protected sharing, analytics, richer exports, or interactive demos because those later features will probably attach project-level defaults and policies. A settings page gives those future controls a durable home.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/004-project-foundation-api.md
docs/plan/005-project-soft-delete.md
docs/plan/019-project-workspace-portal.md
docs/plan/021-project-list-portal-home.md
docs/plan/041-project-creation-portal.md
docs/plan/047-project-health-hardening.md
```

Important implications:

- projects are organization-scoped workspaces
- project status is currently `active | archived`
- archived is workflow state, not physical deletion
- physical delete/soft-delete semantics remain backend-only and are not exposed in this portal slice
- keep one portal app under `apps/web`
- use the existing REST API style
- use cookie-backed portal authentication
- use TDD for implementation
- do not add organization/member/invitation settings in this slice
- do not add analytics, AI, embed, password sharing, or interactive demo behavior

## Current State

Already implemented:

- backend project create/list/get/update/delete foundation
- project update API accepts:

```ts
export type UpdateProjectInput = Partial<{
  name: string;
  description: string | null;
  slug: string | null;
  color: string | null;
  icon: string | null;
  metadata: unknown;
  status: "active" | "archived";
}>;
```

- `PATCH /api/v1/projects/:id` already maps domain errors:
  - `project_not_found`
  - `project_name_conflict`
  - `project_slug_conflict`
  - `empty_project_update`
  - `unauthenticated`
- `GET /api/v1/projects?status=active|archived` already supports active and archived project lists
- portal project list can request archived projects
- portal project workspace can load project details and show status
- portal project creation exists

Known gaps:

- no API client helper for updating a project
- no settings route in the portal router
- no settings link from project workspace
- no project settings page
- no project archive/unarchive button in the portal
- no visible archived-project guidance beyond the status badge
- no portal tests proving archived project lifecycle behavior
- `apps/web/src/features/project/types.ts` currently has `CreateProjectInput` only for create form fields, so update types should be added deliberately instead of overloading create input

## Scope

Included:

- add web API client helper for project updates
- add web types for project update input/response if needed
- add portal route:

```text
/projects/:project_id/settings
```

- add a settings link/action from the project workspace
- add `ProjectSettingsPage`
- load project details on the settings page
- render editable fields:
  - name
  - description
  - slug
- save project detail changes through `PATCH /api/v1/projects/:id`
- archive an active project by updating `status: "archived"`
- unarchive an archived project by updating `status: "active"`
- show current project status and updated timestamp
- handle unauthenticated, not found, validation, and generic errors
- after successful save, refresh the project detail or update local state from the response
- after archive/unarchive, keep the user on the settings page and show the new status
- add a clear link back to the project workspace
- update project workspace to link to settings
- keep project list active/archived filters unchanged
- add tests for API helper, route parsing, app routing, workspace settings link, and settings page behavior
- update `docs/project-zoomout-status.md`

Excluded:

- backend schema changes
- new project update routes
- physical delete UI
- restoring soft-deleted projects
- project member settings
- organization settings
- invite flows
- role/permission enforcement changes
- project branding controls beyond fields already supported by the API
- project-level publish defaults
- project-level embed settings
- project-level analytics
- project list bulk actions or inline settings controls
- enforcing archived-project read-only behavior across every existing nested page unless an existing backend contract already requires it
- bulk project archive actions
- destructive confirmation modals beyond a simple explicit archive/unarchive confirmation

## Product Behavior

### Workspace Entry

Project workspace should show a settings action near the existing project header or workspace actions:

```text
Project workspace
Internal onboarding demos    active
[Project settings]
```

The link should URL-encode the project ID:

```text
/projects/:project_id/settings
```

### Settings Page Layout

Suggested page structure:

```text
Demo Composer topbar

Project settings
Internal onboarding demos                         active
Back to workspace

Details
  Name
  Description
  Slug
  Save changes

Lifecycle
  Archive project / Unarchive project
```

Keep this page utilitarian. It is an operational settings surface, not a marketing page.

Use the existing `PortalTopbar` pattern from the project workspace so sign-out behavior and project context remain consistent across project pages.

### Editable Fields

Fields:

```ts
type ProjectSettingsForm = {
  name: string;
  description: string;
  slug: string;
};
```

Normalization should happen on the server as it already does, but the portal should:

- require non-empty name before saving
- send `description: null` when description is cleared
- send `slug: null` when slug is cleared
- avoid sending color/icon/metadata in this slice
- avoid saving if no user-visible field changed, or show a low-friction “No changes to save” message
- reset dirty-state tracking after a successful save using the returned project values

### Archive And Unarchive

For active projects:

```json
{
  "status": "archived"
}
```

For archived projects:

```json
{
  "status": "active"
}
```

Archive copy should be direct but not dramatic:

```text
Archive project
Archived projects are hidden from the active project list but can still be opened directly and restored later.
```

Unarchive copy:

```text
Unarchive project
Return this project to the active project list.
```

Avoid implementing hard-delete or irreversible wording in this slice.

## Backend Contract

No backend route is expected to be added.

Existing route:

```http
PATCH /api/v1/projects/:id
Content-Type: application/json
```

Request examples:

```json
{
  "name": "Internal training demos",
  "description": "Guides for onboarding and support",
  "slug": "internal-training-demos"
}
```

```json
{
  "status": "archived"
}
```

Response:

```json
{
  "project": {
    "id": "project_1",
    "name": "Internal training demos",
    "description": "Guides for onboarding and support",
    "slug": "internal-training-demos",
    "status": "active",
    "version": 2,
    "updated_at": "2026-06-13T10:00:00.000Z"
  }
}
```

If implementation reveals route schema passthrough allows unsafe or confusing values to reach the service, tighten only the project route schema/picker necessary for this flow and add focused backend tests. Do not redesign the project module in this slice.

## Web API Client

Add:

```ts
export type ProjectUpdateResponse = {
  project: Project;
};

export const updateProject = async (
  projectId: string,
  input: UpdateProjectInput
): Promise<ProjectUpdateResponse> => (
  requestJson<ProjectUpdateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);
```

Add or extend feature types:

```ts
export type UpdateProjectInput = Partial<{
  name: string;
  description: string | null;
  slug: string | null;
  status: ProjectStatus;
}>;
```

Keep color/icon/metadata out of the web helper type for now. The backend can support more than the portal chooses to use, but this page should only send fields it actually renders.

## Routing

Add route type:

```ts
{
  type: "project_settings";
  projectId: string;
}
```

Route parser behavior:

```text
/projects/project_1/settings
  -> { type: "project_settings", projectId: "project_1" }

/projects/project%20%2F%201/settings
  -> { type: "project_settings", projectId: "project / 1" }
```

Make sure this route is checked before generic unsupported fallback and does not conflict with:

```text
/projects/:project_id
/projects/:project_id/guides
/projects/:project_id/capture-sessions
```

Update `App` to render the settings page for `project_settings`.

## Portal Components

Recommended new files:

```text
apps/web/src/features/project/ProjectSettingsPage.tsx
apps/web/src/features/project/ProjectSettingsPage.test.tsx
apps/web/src/features/project/ProjectSettingsPage.module.css
```

Existing files likely touched:

```text
apps/web/src/features/project/types.ts
apps/web/src/features/project/ProjectWorkspacePage.tsx
apps/web/src/features/project/ProjectWorkspacePage.test.tsx
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/lib/routes.ts
apps/web/src/lib/routes.test.ts
apps/web/src/App.tsx
apps/web/src/App.test.tsx
docs/project-zoomout-status.md
```

## Error Handling

Map API errors to stable portal copy:

```text
unauthenticated
  Sign in to manage this project.

not_found
  Project was not found.

project_name_conflict
  A project with this name already exists.

project_slug_conflict
  A project with this slug already exists.

empty_project_update
  Change at least one project field before saving.

other validation
  Project settings are invalid.

unknown
  Could not update project.
```

Keep loaded content visible if save/archive/unarchive fails.

## Archived Project Read-Only Policy

Recommended policy for this slice:

- archived projects can still be opened directly
- archived projects can still show capture sessions, guides, previews, and publish state
- archived projects should not be hidden from direct URL access
- the settings page can unarchive an archived project
- do not implement broad nested-page read-only enforcement unless an existing backend rule already rejects that action

Rationale:

- project archive currently means workspace lifecycle state, not a strict permission model
- broad enforcement would touch capture sessions, guide editor, publish controls, manual uploads, extension capture, and public links
- that should be a separate project-archive-policy hardening slice if needed

If implementation discovers that backend creation endpoints allow creating new captures/guides under archived projects and we want to block that, write a separate plan before changing that cross-domain behavior.

## Tests

Use TDD.

### Web API Tests

Add tests in `apps/web/src/lib/api.test.ts`:

1. `updateProject` sends PATCH to encoded project URL
2. sends JSON content type and request body
3. returns project response
4. maps validation errors through existing `ApiClientError`

### Route Tests

Add tests in `apps/web/src/lib/routes.test.ts`:

1. parses `/projects/project_1/settings`
2. decodes encoded project IDs
3. keeps `/projects/project_1` as workspace route
4. keeps project capture session and guide list routes unchanged

### App Tests

Add tests in `apps/web/src/App.test.tsx`:

1. renders `ProjectSettingsPage` for project settings route
2. passes decoded project ID
3. passes current path into the settings page for sign-in redirects
4. unsupported routes still render unsupported fallback

### Workspace Tests

Add tests in `ProjectWorkspacePage.test.tsx`:

1. renders project settings link for active project
2. URL-encodes project settings link
3. renders settings link for archived project too, so archived projects can be restored

### Settings Page Tests

Add tests in `ProjectSettingsPage.test.tsx`:

1. loads and renders project details
2. edits name/description/slug and saves
3. sends cleared optional fields as `null`
4. shows saved response values after success
5. resets dirty-state after successful save
6. disables save while request is pending
7. shows name-required validation before calling API
8. archives an active project
9. unarchives an archived project
10. disables lifecycle controls while archive/unarchive is pending
11. keeps form visible and shows conflict message on 409
12. handles unauthenticated state with sign-in link
13. handles not found state
14. handles generic load error with retry
15. signs out through the shared topbar

### Backend Tests

Backend project update tests already exist. Do not add backend tests unless the implementation changes backend behavior.

If backend route schema is tightened, add focused route tests for:

1. unknown project update keys are ignored or rejected according to chosen route policy
2. status update still works
3. metadata is not accidentally broken if still supported by backend contract

## Implementation Steps

1. Add web project update types and API helper red tests.
2. Implement `updateProject` in `apps/web/src/lib/api.ts`.
3. Add route parser red tests for project settings.
4. Implement `project_settings` route parsing.
5. Add app routing red test.
6. Wire `ProjectSettingsPage` into `App`.
7. Add workspace settings-link red tests.
8. Add settings link to `ProjectWorkspacePage`.
9. Add `ProjectSettingsPage` tests for loading, saving, archiving, unarchiving, and errors.
10. Implement `ProjectSettingsPage` and CSS.
11. Recheck route ordering and encoded URL behavior.
12. Recheck that project list active/archived filtering still behaves unchanged.
13. Update `docs/project-zoomout-status.md`.
14. Run focused tests.
15. Run full web tests, typecheck, lint, build, and `git diff --check`.

## Suggested Commit Slices

Keep commits small:

1. `docs: plan project settings and archive portal`
2. `feat: add project update portal api`
3. `feat: route project settings page`
4. `feat: add project settings editor`
5. `feat: add project archive controls`
6. `docs: update project settings status`

Depending on actual diff size, route and editor work can be combined if the implementation is compact.

## Acceptance Criteria

- `/projects/:project_id/settings` opens an authenticated project settings page
- settings page loads project details
- user can edit name, description, and slug
- empty description and slug save as `null`
- user can archive an active project
- user can unarchive an archived project
- settings page remains usable after validation failures
- settings page prevents duplicate save/archive submissions while a request is pending
- project workspace links to settings
- archived projects still expose settings so they can be restored
- active/archived project list behavior remains unchanged
- existing capture, guide, publish, public reader, and extension tests remain green
- `docs/project-zoomout-status.md` reflects the new settings/archive capability

## Verification Commands

Focused:

```bash
rtk pnpm --filter web test -- src/lib/api.test.ts src/lib/routes.test.ts src/App.test.tsx src/features/project/ProjectWorkspacePage.test.tsx src/features/project/ProjectSettingsPage.test.tsx
```

Broader:

```bash
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

If backend behavior changes:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server run test:db
```

## Risks And Guardrails

- Do not turn archive into destructive delete. Use reversible archive/unarchive language.
- Do not expose organization IDs, org user IDs, raw metadata, or internal versioning as editable settings.
- Do not add member or organization management here.
- Do not silently alter project creation/list semantics.
- Do not block public guide links only because a project is archived unless a separate publishing policy plan decides that.
- Avoid broad archived-project enforcement in this slice; it crosses too many domains.
- Keep backend changes out unless tests reveal the existing contract is insufficient.

## Recommended Next Slice After This

After project settings/archive UI, the strongest next candidates are:

1. public guide embed flow
2. password-protected public links or viewer sessions
3. richer export package such as HTML/ZIP-with-images
4. interactive demo foundation

Recommended next slice after this:

```text
050-public-guide-embed-foundation.md
```
