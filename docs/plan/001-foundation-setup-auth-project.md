# Foundation Setup Auth Project Plan

Date: 2026-06-05

## Goal

Build the first working vertical slice for Demo Composer:

```text
web first-run setup
  -> authenticated portal session
  -> project list
  -> create project
  -> project workspace shell
```

This slice proves the foundational backend and portal structure before capture, guide, and interactive demo work begins.

## Source Decisions

This plan implements the accepted decisions from:

- `docs/grill/2026-06-04-system-design-grill.md`
- `docs/grill/2026-06-05-slice-one-schema-api-grill.md`
- `docs/system-design-pattern.md`
- `CONTEXT.md`

Important ADRs:

- `docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md`
- `docs/adr/0014-rest-fastify-zod-openapi-api-style.md`
- `docs/adr/0015-user-organization-org-user-identity-model.md`
- `docs/adr/0017-deployment-aware-onboarding-mode.md`
- `docs/adr/0018-web-first-run-setup-from-day-one.md`
- `docs/adr/0019-separate-web-and-server-apps.md`

## Scope

Included:

- clean app/package foundation for `apps/server` and `apps/web`
- REST API with Fastify, Zod, and OpenAPI/Scalar
- Postgres migrations for foundation tables
- web first-run setup for self-hosted mode
- password sign-in, current session, and logout
- DB-backed HTTP-only cookie sessions
- `user_schema.user`
- `organization_schema.organization`
- `organization_schema.org_user`
- `auth_schema.auth_session`
- `project_schema.project`
- project create/list/detail/update/archive/restore/soft-delete APIs
- minimal portal setup/login/project-list/project-workspace flow
- integration tests through public API
- focused portal tests for first-run/project behavior

Excluded:

- Chrome extension
- capture sessions
- screenshot upload
- file storage implementation
- guide editor
- interactive demo editor
- publishing
- organization switching
- invites/member management
- full permission engine
- email OTP signup
- AI/BYOK

## Working Rules

- Use TDD for implementation.
- Start each phase with one failing behavior test through a public interface.
- Prefer integration tests over implementation-detail tests.
- Keep commits small and phase-based.
- Do not preserve old server modules merely because they exist; current scaffold is reference-only where it conflicts with the accepted design.
- Follow the `orca_v2` style for separate `apps/web` and `apps/server`.
- Keep `apps/server` as an API server, not a portal static asset host.

## Target App Shape

```text
apps/server
  src/
    app.ts
    index.ts
    config/
    db/
      migrations/
      migrate.ts
    modules/
      public-instance/
      setup/
      authentication/
      project/

apps/web
  src/
    app/
    lib/
    features/
      setup/
      auth/
      projects/

packages/
  types/
  constants/
  typescript-config/
```

Package names and exact folder names can follow repo conventions, but the domain boundaries should remain clear.

## Database Model

### `user_schema.user`

Purpose: login-capable portal user.

Required fields:

```text
id
email
password_hash
first_name
last_name
display_name
status = active | disabled
metadata
is_deleted
deleted_at
version
created_at
updated_at
```

Notes:

- unique active email
- no organization ownership on `user`

### `organization_schema.organization`

Purpose: tenant/team boundary.

Required fields:

```text
id
name
slug
status = active | disabled
metadata
is_deleted
deleted_at
version
created_at
updated_at
```

Notes:

- no default project is created during setup

### `organization_schema.org_user`

Purpose: user membership inside one organization.

Required fields:

```text
id
organization_id
user_id
role = owner | admin | member
status = active | disabled
metadata
is_deleted
deleted_at
version
created_at
updated_at
```

Notes:

- unique active membership per `organization_id + user_id`
- org-owned records audit to `org_user.id`
- owner is the first setup role

### `auth_schema.auth_session`

Purpose: DB-backed portal session.

Required fields:

```text
id
user_id
organization_id
org_user_id
token_hash
session_type = web
ip_address
user_agent
expires_at
revoked_at
last_active_at
status = active | revoked | expired
created_at
updated_at
```

Notes:

- cookie stores an opaque session token
- DB stores token hash, not raw token
- session is the source of active organization context

### `project_schema.project`

Purpose: workspace grouping captures, guides, and interactive demos.

Required fields:

```text
id
organization_id
name
description
slug
color
icon
status = active | archived
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

Notes:

- `created_by_id`, `updated_by_id`, and `deleted_by_id` reference `organization_schema.org_user`
- unique active project name per organization
- unique active slug per organization when slug is present

## API Surface

### Public Instance

```text
GET /api/v1/public/instance
```

Returns safe setup/runtime state:

```json
{
  "deployment_mode": "self_hosted",
  "onboarding_mode": "first_run_setup",
  "setup_required": true,
  "signup_enabled": false
}
```

### First-Run Setup

```text
POST /api/v1/setup/first-run
```

Input:

```json
{
  "owner": {
    "email": "owner@example.com",
    "password": "strong local password",
    "first_name": "Owner",
    "last_name": "User"
  },
  "organization": {
    "name": "Acme"
  }
}
```

Behavior:

- allowed only when deployment/onboarding mode permits first-run setup
- allowed only when no owner organization exists
- creates user, organization, and owner org_user in one transaction
- creates normal web auth session
- sets HTTP-only cookie
- returns current auth context

### Authentication

```text
POST /api/v1/authentication/signin/password
GET  /api/v1/authentication/me
POST /api/v1/authentication/logout
```

Behavior:

- sign-in creates DB-backed web session and HTTP-only cookie
- `me` returns user, organization, org_user, and session context
- logout revokes DB session and clears cookie

### Project

```text
POST   /api/v1/project/
GET    /api/v1/project/
GET    /api/v1/project/:id
PUT    /api/v1/project/
POST   /api/v1/project/:id/archive
POST   /api/v1/project/:id/restore
DELETE /api/v1/project/:id/:version
```

Project detail returns workspace summaries:

```json
{
  "project": {},
  "summaries": {
    "capture_sessions": { "total_count": 0, "recent": [] },
    "guides": { "total_count": 0, "recent": [] },
    "interactive_demos": { "total_count": 0, "recent": [] }
  }
}
```

## Portal Surface

Routes:

```text
/setup
/login
/portal/projects
/portal/projects/:project_id
```

Behavior:

- app loads `GET /api/v1/public/instance`
- if `setup_required = true`, route to `/setup`
- setup form creates owner/org and auto-logs in
- authenticated users land on `/portal/projects`
- no default project is created
- empty project list shows `Create Project`
- creating a project routes to `/portal/projects/:project_id`
- project workspace shell shows empty Capture Sessions, Guides, and Interactive Demos sections

## Environment

Recommended slice-one env:

```text
DEMO_COMPOSER_DEPLOYMENT_MODE=self_hosted
DEMO_COMPOSER_ONBOARDING_MODE=first_run_setup
SERVER_PORT=4000
WEB_PORT=3000
VITE_API_BASE_URL=http://localhost:4000
CORS_ALLOWED_ORIGINS=http://localhost:3000
COOKIE_SECRET=replace-with-local-secret
COOKIE_DOMAIN=
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=demo_composer
DB_MAX_POOL=10
```

Cookie defaults:

```text
httpOnly = true
secure = true in production
sameSite = lax locally unless cross-site production requires none
path = /
```

## Implementation Phases

### Phase 1: Clean Foundation Scaffold

Goal:

- align `apps/server`, `apps/web`, package scripts, TypeScript config, and env examples with the accepted architecture

Work:

- remove or isolate old reference modules that conflict with slice-one design
- keep migration tooling if usable
- keep common response/error helpers only if they fit the new API style
- add `apps/web` if missing
- add root scripts for dev/build/test by workspace

Tests:

- basic server health/public instance test can be added in Phase 2

Commit:

```text
chore: align foundation app scaffold
```

### Phase 2: Public Instance Status

Failing test first:

```text
GET /api/v1/public/instance returns deployment/onboarding/setup status
```

Work:

- config parser for deployment/onboarding mode
- public instance route
- setup status query that checks whether owner org_user exists

Acceptance:

- self-hosted default returns `first_run_setup`
- hosted mode can report signup mode
- no secrets are returned

Commit:

```text
feat: add public instance status
```

### Phase 3: Database Migrations

Failing test first:

```text
migrations create user, organization, org_user, auth_session, and project schemas
```

Work:

- schema creation migrations
- table migrations
- constraints/indexes
- migration test or database integration test through setup API once Phase 4 begins

Acceptance:

- migrations run cleanly on empty database
- uniqueness and FK constraints match this plan

Commit:

```text
feat: add foundation database schema
```

### Phase 4: Web First-Run Setup API

Failing test first:

```text
uninitialized self-hosted instance can create first owner and organization through setup endpoint
```

Work:

- password hashing
- setup command/service
- transaction wrapper
- create user/org/org_user
- create auth session
- set auth cookie
- reject weak passwords
- reject repeat setup

Acceptance:

- setup creates exactly one owner org_user
- setup auto-logs in owner
- repeat setup returns conflict
- hosted/signup mode does not expose first-run setup behavior

Commit:

```text
feat: add web first-run setup api
```

### Phase 5: Password Auth API

Failing test first:

```text
owner can sign in, fetch current auth context, and log out
```

Work:

- password sign-in
- current session lookup
- logout/revoke
- cookie set/clear
- auth middleware/helper

Acceptance:

- invalid credentials return 401
- disabled/revoked sessions fail
- `me` returns user, organization, org_user, and session

Commit:

```text
feat: add portal authentication api
```

### Phase 6: Project API

Failing test first:

```text
authenticated owner can create, list, and open project workspace
```

Work:

- project command/query functions
- project routes
- org scoping from auth session
- simple role/status checks
- archive/restore/soft-delete
- workspace summary placeholders

Acceptance:

- unauthenticated requests fail
- projects are organization-scoped
- duplicate active project name in same organization fails
- project detail includes empty summary sections
- version is required for soft delete

Commit:

```text
feat: add project workspace api
```

### Phase 7: Portal Setup/Auth/Projects

Failing test first:

```text
portal first-run setup creates owner and shows empty project list
```

Work:

- Vite React app
- API client with `credentials: "include"`
- setup route/form
- login route/form
- auth context loader
- project list page
- create project flow
- project workspace shell

Acceptance:

- uninitialized instance routes to setup
- setup auto-authenticates and routes to projects
- login works after logout
- empty project state is visible
- creating project routes to workspace

Commit:

```text
feat: add portal setup and project workspace
```

### Phase 8: Final Verification And Cleanup

Work:

- run focused server tests
- run focused web tests
- run type checks for touched workspaces
- update docs if implementation differs from this plan
- remove dead reference code left from scaffold cleanup

Acceptance:

- first vertical slice works locally
- docs match behavior
- no known setup/auth/project blockers remain

Commit:

```text
chore: verify foundation slice
```

## First Test To Write

Start with the highest-value server integration test:

```text
uninitialized self-hosted instance completes first-run setup and creates a project
```

Scenario:

```text
GET /api/v1/public/instance
  -> setup_required true

POST /api/v1/setup/first-run
  -> 201
  -> sets auth cookie
  -> returns user + organization + org_user

POST /api/v1/project/
  -> 201

GET /api/v1/project/
  -> contains created project

GET /api/v1/project/:id
  -> returns project workspace with empty capture/guide/demo summaries
```

This test should fail before implementation and drive the first useful vertical behavior.

## Open Questions To Defer

- exact public viewer app shape for published guides/demos
- extension session token schema
- file-domain storage schema
- capture session/event schema
- invite/member management UX
- organization switcher behavior
- hosted signup/OTP flow
