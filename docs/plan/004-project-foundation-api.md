# Project Foundation API Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Create the first authenticated project APIs for the portal:

```text
authenticated session
  -> POST /api/v1/projects
  -> GET /api/v1/projects
  -> GET /api/v1/projects/:id
  -> PATCH /api/v1/projects/:id
```

This gives the web app a real workspace/project home after first-run setup and login. Projects become the parent container for captures, guides, interactive demos, assets, and publishable outputs.

## Why This Comes Next

Current state:

- first-run setup creates the owner, organization, org_user, and session
- password login creates fresh DB-backed sessions
- `/api/v1/authentication/me` returns the current user, organization, org_user, and session
- logout revokes the current session
- `project_schema.project` already exists in the foundation migration
- no API creates or reads projects yet

Risk if skipped:

- later guide/capture/demo APIs would not have a stable parent container
- frontend work would need mock project state
- audit fields like `created_by_id` and `updated_by_id` would remain unproven
- multi-tenant scoping mistakes would be easier to introduce later

## Scope

Included:

- authenticated project creation
- authenticated project list for the current organization
- authenticated single project lookup
- authenticated project update for basic editable fields
- org isolation for all project reads and writes
- audit fields from current `org_user.id`
- duplicate name and duplicate slug conflict handling
- DB-backed integration tests through Fastify public API
- small shared auth-context helper for protected routes if useful

Excluded:

- project soft delete
- dedicated project archive/unarchive endpoints
- project slug generation policy beyond accepting optional slug if provided
- arbitrary client metadata editing beyond storing optional JSON as-is
- project membership permissions beyond requiring an active org_user
- roles/abilities policy matrix
- captures, guide docs, demos, assets, and publish links
- project dashboard UI
- multi-org switching

Soft delete should be handled in the next slice unless we decide we need full CRUD immediately:

```text
docs/plan/005-project-soft-delete.md
```

Status updates through `PATCH /api/v1/projects/:id` are included because the existing schema already supports `active` and `archived`. Separate archive/unarchive command endpoints can wait until the UI needs that workflow.

## Existing Schema

The current foundation migration already has:

```text
project_schema.project
  id
  organization_id
  name
  description
  slug
  color
  icon
  status
  metadata
  is_deleted
  deleted_at
  deleted_by_id
  version
  created_by_id
  updated_by_id
  created_at
  updated_at
```

Relevant constraints and indexes:

```text
status IN ('active', 'archived')
unique lower(name) per organization where is_deleted = false and status = active
unique lower(slug) per organization where slug is not null and is_deleted = false
project list index by organization, status, created_at desc
```

Important implication:

- active project names must be unique per organization
- active and archived projects cannot share a slug in the same organization while both are non-deleted
- archived projects may share a name with active projects because the existing name constraint only applies to active rows
- API conflict handling should reflect the actual DB constraints instead of inventing stricter rules in service code

## Auth Context

All project routes must require the same session model created in the auth phase:

```text
demo_composer_session cookie
  -> token hash lookup
  -> active user
  -> active organization
  -> active org_user
```

The project service should receive an explicit auth context:

```text
organization_id = auth.organization.id
actor_org_user_id = auth.org_user.id
```

Do not accept `organization_id`, `created_by_id`, or `updated_by_id` from client input.

## Existing Files Involved

Likely touched:

```text
apps/server/src/app.ts
apps/server/package.json
apps/server/src/modules/authentication/session.service.ts
apps/server/src/modules/authentication/session.repository.ts
apps/server/src/modules/authentication/session.routes.ts
apps/server/src/modules/project/*
```

Possible new files:

```text
apps/server/src/modules/project/project.service.ts
apps/server/src/modules/project/project.repository.ts
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/project/project.routes.test.ts
apps/server/src/modules/project/project.service.test.ts
apps/server/src/modules/project/project.app.integration.test.ts
apps/server/src/modules/project/project.db.integration.test.ts
apps/server/src/modules/authentication/authenticated-route.ts
```

The recommended package name is `modules/project`, singular, matching the table and domain language. The public API path should still be plural: `/api/v1/projects`.

## API Contract

### Create Project

```text
POST /api/v1/projects
```

Request:

```json
{
  "name": "Onboarding Demo",
  "description": "Internal onboarding demo flow",
  "slug": "onboarding-demo",
  "color": "#2563eb",
  "icon": "presentation"
}
```

Required:

```text
name
```

Optional:

```text
description
slug
color
icon
metadata
```

For this slice, `metadata` is optional JSON and should be stored as-is when provided. Do not build metadata-specific behavior or validation yet.

Success:

```text
201 Created
```

Response:

```json
{
  "project": {
    "id": "project_id",
    "organization_id": "organization_id",
    "name": "Onboarding Demo",
    "description": "Internal onboarding demo flow",
    "slug": "onboarding-demo",
    "color": "#2563eb",
    "icon": "presentation",
    "status": "active",
    "created_by_id": "org_user_id",
    "updated_by_id": "org_user_id",
    "created_at": "2026-06-05T00:00:00.000Z",
    "updated_at": "2026-06-05T00:00:00.000Z"
  }
}
```

Duplicate active project name in the same organization:

```text
409 Conflict
```

Response:

```json
{
  "error": {
    "type": "project_name_conflict",
    "message": "A project with this name already exists"
  }
}
```

Duplicate non-deleted project slug in the same organization:

```text
409 Conflict
```

Response:

```json
{
  "error": {
    "type": "project_slug_conflict",
    "message": "A project with this slug already exists"
  }
}
```

Unauthenticated:

```text
401 Unauthorized
```

### List Projects

```text
GET /api/v1/projects
```

Initial query parameters:

```text
status=active|archived
```

Default:

```text
status=active
```

Success:

```json
{
  "projects": [
    {
      "id": "project_id",
      "name": "Onboarding Demo",
      "description": "Internal onboarding demo flow",
      "slug": "onboarding-demo",
      "color": "#2563eb",
      "icon": "presentation",
      "status": "active",
      "created_at": "2026-06-05T00:00:00.000Z",
      "updated_at": "2026-06-05T00:00:00.000Z"
    }
  ]
}
```

The list response should stay compact. It does not need to include audit fields or metadata unless the UI requires them later.

Ordering:

```text
created_at DESC
```

The response should include only projects for the current session organization and exclude `is_deleted = true`.

### Get Project

```text
GET /api/v1/projects/:id
```

Success:

```json
{
  "project": {
    "id": "project_id",
    "organization_id": "organization_id",
    "name": "Onboarding Demo",
    "description": "Internal onboarding demo flow",
    "slug": "onboarding-demo",
    "color": "#2563eb",
    "icon": "presentation",
    "status": "active",
    "created_by_id": "org_user_id",
    "updated_by_id": "org_user_id",
    "created_at": "2026-06-05T00:00:00.000Z",
    "updated_at": "2026-06-05T00:00:00.000Z"
  }
}
```

Missing or cross-org project:

```text
404 Not Found
```

Response:

```json
{
  "error": {
    "type": "project_not_found",
    "message": "Project was not found"
  }
}
```

Cross-org access should return `404`, not `403`, so the API does not reveal that the project exists in another organization.

### Update Project

```text
PATCH /api/v1/projects/:id
```

Request:

```json
{
  "name": "Updated Demo",
  "description": "Updated description",
  "slug": "updated-demo",
  "color": "#16a34a",
  "icon": "sparkles"
}
```

Updatable fields:

```text
name
description
slug
color
icon
metadata
status
```

Rules:

- at least one field must be provided
- `status` must be `active` or `archived`
- `updated_by_id` must come from current `org_user.id`
- `updated_at` must change
- `version` should increment by one
- archiving through `status = archived` is allowed, but dedicated archive/unarchive routes are not part of this slice

Success:

```json
{
  "project": {
    "id": "project_id",
    "organization_id": "organization_id",
    "name": "Updated Demo",
    "description": "Updated description",
    "slug": "updated-demo",
    "color": "#16a34a",
    "icon": "sparkles",
    "status": "active",
    "created_by_id": "org_user_id",
    "updated_by_id": "org_user_id",
    "created_at": "2026-06-05T00:00:00.000Z",
    "updated_at": "2026-06-05T00:00:01.000Z",
    "version": 2
  }
}
```

Duplicate active name or duplicate non-deleted slug in the same organization:

```text
409 Conflict
```

Missing or cross-org project:

```text
404 Not Found
```

## TDD Sequence

### Step 1: Protected Route Contract

Failing tests first:

```text
project routes reject missing session cookies with 401
project routes receive auth context from session service
```

Work:

- add an authenticated route helper or lightweight per-route auth lookup
- reuse `AuthenticationSessionRouteService.get_current_auth_context`
- map `UnauthenticatedSessionError` to `401`
- avoid coupling project service directly to cookies

Acceptance:

- every project endpoint requires a valid session
- route tests can inject a fake auth/session service
- auth errors have the same shape as `/authentication/me`

Commit:

```text
feat: protect project routes with session auth
```

### Step 2: Create Project

Failing tests first:

```text
authenticated user creates a project in current organization
created_by_id and updated_by_id come from current org_user
client-supplied organization_id and audit ids are ignored/rejected
duplicate active project name returns 409
duplicate project slug returns 409
```

Work:

- add `project.service.ts`
- add `project.repository.ts`
- add `POST /api/v1/projects`
- map duplicate name/slug DB constraint errors to domain conflicts
- normalize empty optional strings to `null` where appropriate
- keep metadata as optional JSON passthrough only

Acceptance:

- project is created with current organization id
- project audit fields use current org_user id
- duplicate active name in same org returns `409`
- duplicate non-deleted slug in same org returns `409`
- response does not expose `is_deleted`, `deleted_at`, or `deleted_by_id`

Commit:

```text
feat: add project creation api
```

### Step 3: List Projects

Failing tests first:

```text
authenticated user lists projects for current organization
list excludes deleted projects
list excludes projects from other organizations
list defaults to active projects ordered newest first
archived filter returns archived projects
```

Work:

- add repository list query by `organization_id`
- add optional `status` query param
- keep pagination out unless the implementation naturally needs it

Acceptance:

- list is org-scoped
- list excludes soft-deleted rows
- status filter works for `active` and `archived`
- response order is deterministic

Commit:

```text
feat: add project list api
```

### Step 4: Get Project

Failing tests first:

```text
authenticated user fetches project by id in current org
unknown project returns 404
project in another org returns 404
deleted project returns 404
```

Work:

- add repository find-by-id query scoped by organization id
- map not found to stable `project_not_found` response

Acceptance:

- get is org-scoped
- cross-org project existence is not leaked
- deleted projects are not returned

Commit:

```text
feat: add project detail api
```

### Step 5: Update Project

Failing tests first:

```text
authenticated user updates project fields
updated_by_id uses current org_user
version increments
empty patch returns 400
duplicate name or slug returns 409
cross-org update returns 404
status archive update succeeds
```

Work:

- add update service validation
- add update repository query scoped by organization id
- update only provided fields
- always update `updated_by_id`, `updated_at`, and `version`
- map duplicate name and slug conflicts separately if possible

Acceptance:

- update is org-scoped
- audit fields and version change correctly
- duplicate conflicts are mapped
- empty update payload is rejected
- status can be changed between `active` and `archived`

Commit:

```text
feat: add project update api
```

### Step 6: DB-Backed Project Integration

Failing tests first:

```text
first-run setup creates owner session
create project through public API
list project through public API
get project through public API
update project through public API
cross-org project is invisible
```

Recommended scenario:

```text
test:setup
  -> POST /api/v1/setup/first-run
  -> POST /api/v1/projects
  -> GET /api/v1/projects
  -> GET /api/v1/projects/:id
  -> PATCH /api/v1/projects/:id
  -> direct DB assertion for organization_id, created_by_id, updated_by_id, version
  -> duplicate name and slug assertions against real constraints
```

Acceptance:

- project APIs work against real Postgres data
- auth context drives organization and audit fields
- duplicate constraints behave correctly in real DB
- archived-name behavior matches the existing partial unique index
- project DB tests clean their own rows deterministically

Commit:

```text
test: verify db backed project foundation api
```

### Step 7: Route Wiring And Final Verification

Failing tests first:

```text
default app build mounts project routes under /api/v1/projects
server DB test command includes project DB integration tests
```

Work:

- wire project routes in `app.ts`
- update `apps/server/package.json` `test:db`
- keep DB integration tests sequential while they share one database

Run:

```text
pnpm --filter server test
pnpm --filter server test:setup
pnpm --filter server test:db
pnpm check-types
pnpm --filter server lint
```

Expected:

- normal tests pass
- DB integration tests pass
- root type-check passes
- lint has no errors

Commit:

```text
chore: wire project api verification
```

## Acceptance Criteria

This phase is done when:

- all project routes require a valid auth session
- create uses current organization and org_user audit context
- list returns only non-deleted projects in current organization
- get returns only projects in current organization
- update is scoped to current organization
- duplicate active project names return `409`
- duplicate non-deleted project slugs return `409`
- cross-org project access returns `404`
- responses do not expose soft-delete internals
- DB-backed tests prove create/list/get/update against real Postgres
- normal tests, DB tests, type-check, and lint pass

## Open Implementation Notes

- Prefer a route-level auth helper so future guide/capture/demo routes can reuse it.
- Keep permission logic simple for this slice: active org_user can manage projects.
- Do not add roles/abilities until we have a concrete workflow that needs it.
- Keep delete and dedicated archive/unarchive endpoints separate unless implementation pressure proves that update status is not enough.
- Consider pagination in a later plan once UI requirements are clearer.
- Use DB unique constraints for final duplicate enforcement; service-level pre-checks are optional but not sufficient.

## Next Phase After This

Recommended next slice:

```text
docs/plan/005-project-soft-delete.md
```

After projects can be created and managed, soft delete/archive gives the portal a cleaner lifecycle before we attach captures and guide docs to projects.
