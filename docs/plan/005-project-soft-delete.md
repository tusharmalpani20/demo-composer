# Project Soft Delete Plan

Date: 2026-06-05

## Goal

Add authenticated, organization-scoped project soft delete:

```text
authenticated session
  -> DELETE /api/v1/projects/:id
```

This completes the first practical project lifecycle without introducing hard deletes, restore flows, capture cleanup, or a broader permission system.

## Why This Comes Next

Current state:

- first-run setup creates the initial owner, organization, org_user, and session
- password login and logout are DB-backed
- `/api/v1/authentication/me` returns the current authenticated context
- project create/list/get/update exist
- project reads and updates already filter out rows where `is_deleted = TRUE`
- `project_schema.project` already has soft-delete columns:

```text
is_deleted
deleted_at
deleted_by_id
updated_by_id
updated_at
version
```

Risk if skipped:

- users can create test or mistaken projects but cannot remove them from normal workflows
- list/get/update hidden-delete behavior stays only partially proven
- future capture and guide APIs would need to work around undeletable project containers
- audit behavior for destructive project actions remains untested

This is a narrow backend slice that should be completed before capture sessions, assets, or guide documents depend on projects.

## Scope

Included:

- authenticated project soft delete route
- current-organization scoping
- audit fields from current `org_user.id`
- version increment on delete
- repeated delete returns not found
- deleted projects are hidden from list/get/update
- cross-org delete returns not found
- DB-backed integration tests through the public Fastify API

Excluded:

- hard delete
- restore/undelete
- bulk delete
- dedicated archive/unarchive endpoints
- deleting capture sessions, captures, guide docs, assets, publish links, or files under the project
- background cleanup jobs
- permissions beyond requiring an active authenticated org_user
- UI work
- analytics/audit event stream

## Existing Behavior To Preserve

Project list:

```text
GET /api/v1/projects
  -> only returns current organization projects
  -> only returns non-deleted projects
```

Project lookup:

```text
GET /api/v1/projects/:id
  -> returns 404 when missing, cross-org, or deleted
```

Project update:

```text
PATCH /api/v1/projects/:id
  -> returns 404 when missing, cross-org, or deleted
```

Soft delete should fit into those semantics instead of adding a separate deleted-project read path.

## API Contract

### Delete Project

```text
DELETE /api/v1/projects/:id
```

Auth:

```text
demo_composer_session cookie required
```

Success:

```text
204 No Content
```

The response body should be empty.

Unauthenticated:

```text
401 Unauthorized
```

Missing project:

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

Cross-organization project:

```text
404 Not Found
```

Use the same `project_not_found` response. Do not reveal whether a project id exists in another organization.

Already-deleted project:

```text
404 Not Found
```

Use the same `project_not_found` response. Delete should not expose deleted resources through a different status.

## Persistence Contract

On successful delete, update exactly the matching current-organization, non-deleted project:

```sql
UPDATE project_schema.project
SET
  is_deleted = TRUE,
  deleted_at = CURRENT_TIMESTAMP,
  deleted_by_id = $actor_org_user_id,
  updated_at = CURRENT_TIMESTAMP,
  updated_by_id = $actor_org_user_id,
  version = version + 1
WHERE
  id = $project_id
  AND organization_id = $organization_id
  AND is_deleted = FALSE
RETURNING ...
```

Recommended behavior:

- leave `status` unchanged
- treat deletion as represented by `is_deleted`
- return a boolean, or return the same public `Project` shape used by create/list/get/update
- map no affected rows to `project_not_found`
- do not expose `is_deleted`, `deleted_at`, or `deleted_by_id` in public API responses

Reasoning:

- `status` currently represents active versus archived workflow state
- `is_deleted` already represents removal from normal workflows
- mutating both can make future restore behavior ambiguous
- current project responses intentionally omit internal delete fields

DB integration tests should assert delete fields by querying the raw database row directly, not by expecting those fields in API responses.

## Auth Context

The delete service should receive explicit server-derived context:

```text
organization_id = auth.organization.id
actor_org_user_id = auth.org_user.id
```

Never accept these fields from the client:

```text
organization_id
deleted_by_id
updated_by_id
```

The route should use the same authenticated route/session mechanism as project create/list/get/update.

The project module currently uses snake_case service method names. Keep the new method consistent:

```text
delete_project
```

## Likely Files

Likely touched:

```text
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/project/project.routes.test.ts
apps/server/src/modules/project/project.service.ts
apps/server/src/modules/project/project.service.test.ts
apps/server/src/modules/project/project.repository.ts
apps/server/src/modules/project/project.db.integration.test.ts
apps/server/src/modules/project/project.app.integration.test.ts
```

Possibly touched:

```text
apps/server/package.json
```

Only update `package.json` if a new test file needs to be added to `test:db`. If the existing project DB integration file is extended, no script change should be needed.

## TDD Sequence

### 1. Route Contract

Add route-level tests first:

- `DELETE /api/v1/projects/:id` without a session returns `401`
- authenticated delete calls the project service with:

```text
project_id
organization_id from auth context
actor_org_user_id from auth context
```

- service not-found maps to `404 project_not_found`
- service success returns `204` with no body

Implementation:

- register `DELETE /api/v1/projects/:id`
- reuse current authenticated route/session helper
- add `delete_project` to `ProjectRouteDependencies`
- call `project_service.delete_project`
- keep the route under the existing project route plugin, which is mounted at `/api/v1/projects`
- do not add a request body
- keep not-found responses aligned with current project routes:

```json
{
  "error": {
    "type": "project_not_found",
    "message": "Project was not found"
  }
}
```

Suggested commit:

```text
feat: add project delete route contract
```

### 2. Service And Repository

Add service/repository tests next:

- service delegates scoped soft delete to repository
- service throws or returns the existing not-found domain error when repository reports no row
- repository sets soft-delete fields
- repository increments version
- repository requires `organization_id` and `is_deleted = FALSE` in the update predicate

Implementation:

- add `delete_project` to project service
- add `soft_delete_project` or `delete_project` to repository
- keep error type consistent with get/update not-found behavior
- let the repository catch unique-constraint mapping only where relevant; delete should not need name or slug conflict mapping
- keep `ProjectRow`/`Project` as the public response shape if returning the deleted row

Suggested commit:

```text
feat: add project soft delete service
```

### 3. DB Integration

Add DB-backed tests through Fastify public API:

- first-run or fixture creates an authenticated owner session
- create a project
- delete the project
- assert response is `204`
- direct DB assertion verifies:

```text
is_deleted = TRUE
deleted_at is not null
deleted_by_id = current org_user.id
updated_by_id = current org_user.id
version incremented
```

- list no longer includes the deleted project
- direct API response assertions confirm delete internals are not exposed by list/get responses
- get deleted project returns `404 project_not_found`
- patch deleted project returns `404 project_not_found`
- deleting the same project again returns `404 project_not_found`
- deleting a project from another organization returns `404 project_not_found`
- deleting with an expired, revoked, disabled-user, disabled-organization, or disabled-membership session continues to return the existing auth failure behavior through the shared auth service

Suggested commit:

```text
test: verify db backed project soft delete
```

### 4. Final Verification

Run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server test:setup
rtk pnpm --filter server test:db
rtk pnpm check-types
rtk pnpm --filter server lint
```

Expected:

- all tests pass
- type-check passes
- lint has no errors
- existing lint warnings are acceptable only if they already existed and are unrelated to this slice

Suggested commit if only polish or missed edge cases are fixed:

```text
fix: harden project soft delete behavior
```

## Acceptance Criteria

- `DELETE /api/v1/projects/:id` exists
- route requires a valid `demo_composer_session`
- delete is scoped to the authenticated organization
- delete uses current `org_user.id` for `deleted_by_id` and `updated_by_id`
- delete sets `is_deleted = TRUE`
- delete sets `deleted_at`
- delete increments `version`
- successful delete returns `204 No Content`
- missing project returns `404 project_not_found`
- cross-org project returns `404 project_not_found`
- already-deleted project returns `404 project_not_found`
- deleted project internal fields are not exposed by the public API
- deleted project is excluded from list
- deleted project cannot be fetched
- deleted project cannot be updated
- DB integration tests prove behavior against real PostgreSQL

## Design Notes

Soft delete should remain a project-domain concern for now. Storage, captures, guide documents, and publishable demos will later reference projects, but this slice should not cascade into those domains.

When those child domains exist, project deletion policy can be revisited through an ADR. The likely future options are:

- block project deletion while published demos exist
- allow project deletion but unpublish public links
- keep child records soft-deleted with the project
- keep files until a retention cleanup job removes unreferenced storage objects

Do not solve that now. This slice only removes the project from normal authenticated project workflows.

## Next Slice After This

After project soft delete, the recommended next plan is:

```text
docs/plan/006-capture-session-foundation.md
```

That should introduce the backend model for a capture session as source material for both future outputs:

- guided doc/demo prepper output
- interactive demo walkthrough output
