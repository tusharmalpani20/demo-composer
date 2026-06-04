# Slice One Schema And API Grill

Date: 2026-06-05

## Scope

This grill session designs the first vertical implementation slice in detail.

Accepted starting point from `docs/grill/2026-06-04-system-design-grill.md`:

```text
auth/user/organization foundation
  -> project creation/list/detail
  -> authenticated server integration test
  -> minimal portal project list/workspace
```

The goal is to define enough schema, package boundaries, commands, queries, routes, and tests to start implementation with TDD.

Out of scope for this session:

- capture session schema
- screenshot upload
- Chrome extension implementation
- guide editor
- interactive demo editor
- publishing

## Questions

### Q1. Should slice one include email OTP signup or only seeded/admin-created users plus password sign-in?

Recommended answer:

Keep slice one focused on seeded/admin-created users plus password sign-in. Defer email OTP signup until the foundation API shape is proven.

Reasoning:

- The first vertical slice needs authenticated organization context, not a complete onboarding system.
- OTP adds email delivery/token UX, retry rules, expiration rules, and test setup.
- We can create users through fixtures/seeds/admin command during early development.
- Password sign-in is enough to prove auth session, user, organization member, and project isolation.

Suggested slice-one auth behavior:

```text
POST /api/v1/authentication/signin/password
GET  /api/v1/authentication/me
POST /api/v1/authentication/logout
```

Deferred:

```text
POST /api/v1/authentication/signup/email
POST /api/v1/authentication/signup/email/verify-otp
POST /api/v1/authentication/forgot-password
```

Risk:

- Early manual testing needs a seeded user or dev-only bootstrap path.
- That is acceptable for slice one.

Status:

Accepted. Slice one uses seeded/admin-created users plus password sign-in; email OTP signup is deferred.

### Q2. What auth/user/organization tables are required for slice one?

Recommended answer:

Use a minimal but future-safe foundation with a clear split between portal login identity and organization-scoped user identity:

```text
organization_schema.organization
user_schema.user
organization_schema.org_user
auth_schema.auth_session
```

Defer:

```text
auth_schema.otp_verification
auth_schema.auth_session_init_data
organization_schema.organization_role
user_schema.user_asset
```

Reasoning:

- `organization` is the tenant.
- `user` is the portal/login identity.
- `org_user` links a user to an organization and carries organization-scoped role/status.
- `auth_session` gives revocable session persistence.
- Separate `org_user` prevents confusing authentication identity with organization-scoped membership.
- Organization-owned records should use `created_by_id` / `updated_by_id` pointing to `org_user.id`, not directly to `user.id`.

Important model:

```text
user_schema.user
  one login-capable portal user

organization_schema.organization
  one tenant/team/workspace

organization_schema.org_user
  one user's membership inside one organization
  user_id -> user_schema.user.id
  organization_id -> organization_schema.organization.id
```

This allows one portal user to belong to multiple organizations:

```text
User A
  -> Org User A1 in Organization 1
  -> Org User A2 in Organization 2
```

Suggested roles for slice one:

```text
owner
admin
member
```

Role behavior can be simple in slice one:

- owner/admin/member can create projects for now
- stricter permissions can come later

Status:

Accepted. Slice one uses `user + organization + org_user`; org-owned records audit against `org_user.id`.

Decision records:

- `docs/adr/0015-user-organization-org-user-identity-model.md`

### Q3. Should `auth_session` point to `user`, `org_user`, or both?

Recommended answer:

Store both `user_id` and active `org_user_id` / `organization_id` on `auth_session`.

Suggested shape:

```text
auth_schema.auth_session
  id
  user_id
  organization_id
  org_user_id
  jwt_token or token_hash
  identity_provider
  ip_address
  user_agent
  expires_at
  is_session_active
  last_active_at
```

Reasoning:

- `user_id` identifies the login identity.
- `org_user_id` identifies the active organization membership.
- `organization_id` makes org scoping cheap and explicit.
- Most requests need active org context immediately.
- If a user switches organization later, create a new session or update active org context through an explicit switch endpoint.

Slice-one behavior:

- Seed/bootstrap user has one org_user.
- Sign-in picks that org_user as active.
- `GET /authentication/me` returns user, organization, and org_user.

Tradeoff:

- Session stores some denormalized context.
- It avoids looking up active organization selection from a separate preference table on every request.

Status:

Accepted. Auth sessions store login identity and active organization context: `user_id`, `organization_id`, and `org_user_id`.

### Q4. Should `auth_session` store the raw JWT token or only a token hash / session id?

Recommended answer:

Store a session id and token hash, not the raw JWT token.

Recommended approach:

- JWT contains `session_id` and token/session type only.
- DB stores `auth_session.id`.
- DB stores `token_hash` if we need token-level revocation/rotation checks.
- DB does not store the raw JWT string.
- DB-backed `auth_session` is the source of active user/org context.

Suggested shape:

```text
auth_session
  id
  user_id
  organization_id
  org_user_id
  token_hash
  identity_provider
  ip_address
  user_agent
  expires_at
  is_session_active
  last_active_at
```

Reasoning:

- Raw JWT storage is unnecessary and riskier if the DB leaks.
- Session id lookup is enough for revocation.
- Token hash allows stricter matching if we want it.
- Keeping org/user context in the session table avoids stale JWT claims when membership changes.

MVP simplification:

- Store `session_id` in JWT and validate DB session by id.
- Store `token_hash` from day one if practical.

Status:

Accepted. JWT carries only session identity; `auth_session` is the source of user/org/org_user context and stores token hash instead of raw JWT when practical.

### Q5. What should the slice-one `project` table contain?

Recommended answer:

Keep project small and workspace-focused.

Suggested table:

```text
project_schema.project
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

Required in slice one:

- `organization_id`
- `name`
- `status`
- audit/version columns

Optional but useful:

- `description`
- `slug`
- `color`
- `icon`
- `metadata`

Uniqueness:

```text
unique active project name per organization
unique slug per organization when slug is present
```

Reasoning:

- Project is a workspace, not a marketing page.
- We do not need branding/publishing settings in slice one.
- Slug can support clean URLs later, but id-based routes are enough initially.

Status:

Accepted. Slice-one project table is small and workspace-focused with org scope, name, status, optional slug/display metadata, soft-delete, versioning, and audit columns.

### Q6. Should project detail return capture/guide/demo summary sections in slice one?

Recommended answer:

Yes, return empty summary arrays/counts from the project detail endpoint even before capture/guide/demo domains are implemented.

Suggested response shape:

```text
GET /api/v1/project/:id

{
  project,
  summaries: {
    capture_sessions: {
      total_count,
      recent: []
    },
    guides: {
      total_count,
      recent: []
    },
    interactive_demos: {
      total_count,
      recent: []
    }
  }
}
```

Reasoning:

- The project workspace UI can be built against the final shape early.
- Empty sections make the intended workspace model explicit.
- Later domains can fill these summaries without changing the project detail contract drastically.

Tradeoff:

- The project-domain query has placeholders before those tables exist.
- That is acceptable if the response is clearly documented as workspace summary data.

Status:

Accepted. Project detail returns workspace summary sections for capture sessions, guides, and interactive demos, empty until those domains are implemented.

### Q7. What project routes and domain functions should slice one expose?

Recommended answer:

Expose basic project CRUD minus hard delete, with archive as the non-destructive lifecycle action.

Routes:

```text
POST   /api/v1/project/
GET    /api/v1/project/
GET    /api/v1/project/:id
PUT    /api/v1/project/
POST   /api/v1/project/:id/archive
POST   /api/v1/project/:id/restore
DELETE /api/v1/project/:id/:version
```

Domain commands:

```text
create_project
update_project
archive_project
restore_project
soft_delete_project
```

Domain queries:

```text
list_projects
get_project_workspace
```

Reasoning:

- Create/list/detail/update are needed for the first portal workflow.
- Archive is useful product lifecycle distinct from soft delete.
- Soft delete can exist for cleanup/admin behavior.
- `get_project_workspace` names the detail query after what the UI actually needs.

MVP permissions:

- Any active org_user can create/update/archive/restore projects in slice one.
- Stricter project permissions are deferred.

Status:

Accepted. Slice one exposes basic project CRUD, archive/restore, soft delete, and `get_project_workspace` detail query.

### Q8. How should the first user and organization be created before signup exists?

Recommended answer:

Use an explicit, idempotent owner bootstrap command, adapted from the `orca-echo` Administrator bootstrap pattern.

Do not expose a public first-run bootstrap endpoint in slice one.

Suggested script:

```text
apps/server/src/module/auth/bootstrap-owner.command.ts
```

Inputs from env or CLI:

```text
ORGANIZATION_NAME
OWNER_EMAIL
OWNER_PASSWORD
OWNER_FIRST_NAME
OWNER_LAST_NAME
```

Behavior:

```text
validate bootstrap password safety
find or create first user
find or create default organization
find or create owner org_user membership
assign owner role
return a summary without printing secrets
```

Reasoning:

- Slice one intentionally defers public signup.
- A command is safer than exposing a public endpoint.
- Tests can use fixtures/domain commands directly.
- Self-hosted users can still create the first owner.
- `orca-echo` proves this shape works well for self-hosted first-run setup: it uses an idempotent bootstrap service, a command wrapper, safe password validation, and tests that prove repeated execution does not create duplicate users/workspaces/memberships.
- Demo Composer should adapt the same structure, but use our language: **User**, **Organization**, and **Org User** instead of ORCA Echo's `Administrator`, `Workspace`, and `Workspace Membership`.

Recommended MVP defaults:

```text
ORGANIZATION_NAME = "Default Organization"
OWNER_EMAIL is required
OWNER_PASSWORD is required and must pass minimum safety checks
OWNER_FIRST_NAME / OWNER_LAST_NAME are optional
org_user.role = owner
```

Safety rules:

- require a strong enough owner password
- reject obvious unsafe values such as `admin`, `password`, `changeme`, `demo`, and `democomposer`
- never print the password or password hash
- make the command idempotent
- do not rotate an existing owner's password on repeat bootstrap
- do not allow later flows to remove/disable the last owner

Future:

- Replace or supplement with email signup/invite flows.
- Keep script useful for local/dev/admin recovery.

Status:

Accepted after reviewing `/home/tm/Desktop/work/project_orca/orca-echo`. Demo Composer will use an ORCA Echo inspired explicit owner bootstrap command, adapted to `user + organization + org_user`.

Decision records:

- `docs/adr/0016-explicit-owner-bootstrap-command.md`

### Q9. Should first-run setup and signup be configurable by deployment type?

Recommended answer:

Yes. Demo Composer should support configurable onboarding mode because hosted deployments and self-hosted deployments need different defaults.

Recommended configuration:

```text
DEMO_COMPOSER_DEPLOYMENT_MODE = self_hosted | hosted
DEMO_COMPOSER_ONBOARDING_MODE = first_run_setup | signup
```

Default behavior:

```text
self_hosted -> first_run_setup
hosted      -> signup
```

Self-hosted behavior:

- first run shows setup UI or runs setup command for the first owner
- setup collects owner name, owner email, password, organization name, and optional organization metadata
- once an owner organization exists, first-run setup is locked
- later users join through invite/signup flows only if enabled

Hosted behavior:

- no first-run setup page
- users enter through signup, invite, or SSO flows when those are implemented
- organization creation happens as part of signup/onboarding
- owner bootstrap remains available only as an operational/admin command, not as a public web flow

Important safety rules:

- Never leave first-run setup publicly available after an owner exists.
- Hosted mode must not expose first-run setup.
- Self-hosted mode should work without email delivery.
- Signup can be disabled in self-hosted mode.
- The API should expose a safe public instance setup status, not secrets:

```text
GET /api/v1/public/instance
{
  deployment_mode,
  onboarding_mode,
  setup_required,
  signup_enabled
}
```

Reasoning:

- Self-hosted users often want Docker-style first-run setup without configuring email first.
- Hosted deployments need public signup/invite flows instead of a one-time setup screen.
- A config switch lets the open-source product support both without forking the codebase.
- Keeping first-run setup and signup as different onboarding modes prevents accidentally exposing owner bootstrap on hosted instances.

Status:

Accepted. Demo Composer will support deployment-aware onboarding defaults: self-hosted uses first-run setup by default, hosted uses signup by default.

Decision records:

- `docs/adr/0017-deployment-aware-onboarding-mode.md`

### Q10. Should first-run setup be CLI-only for MVP or include a web setup screen from day one?

Recommended answer:

Build the web first-run setup screen from day one, while keeping an admin bootstrap command for recovery and automation.

Self-hosted first-run web flow:

```text
GET /api/v1/public/instance
  -> setup_required = true

Portal shows setup screen
  -> owner name
  -> owner email
  -> owner password
  -> organization name

POST /api/v1/setup/first-run
  -> creates first user
  -> creates default organization
  -> creates owner org_user
  -> creates authenticated session or redirects to login
```

Required guardrails:

- only enabled when onboarding mode allows `first_run_setup`
- only available when no owner organization exists
- reject repeat setup after initialization
- validate password strength server-side
- never expose setup secrets through public instance status
- wrap creation in one transaction
- return a generic conflict if another setup process completed first

Keep CLI bootstrap for:

- Docker automation
- local development
- recovery when the web setup screen cannot be reached
- tests/fixtures

Reasoning:

- Self-hosted users expect a browser-first setup experience after starting the app.
- Web setup removes friction compared with requiring a terminal command.
- Keeping CLI bootstrap gives operators a fallback without making CLI the primary UX.
- The same domain service can power both the web setup endpoint and the CLI command.

Status:

Accepted. Demo Composer will ship a web first-run setup screen from day one for self-hosted mode, backed by the same idempotent setup service used by the admin bootstrap command.

Decision records:

- `docs/adr/0018-web-first-run-setup-from-day-one.md`

### Q11. After web first-run setup, should the new owner be logged in automatically?

Recommended answer:

Yes. After successful web first-run setup, create a normal authenticated web session and send the owner to the portal.

Recommended flow:

```text
POST /api/v1/setup/first-run
  -> transaction creates user, organization, and owner org_user
  -> create normal auth_session using the same session path as password sign-in
  -> set auth cookie or return session token
  -> portal opens authenticated project/workspace area
```

Reasoning:

- First-run setup already collected and validated the owner's password.
- Asking the owner to log in immediately after setup adds friction without much security benefit.
- Reusing the normal auth session path keeps logout, revocation, expiry, and audit behavior consistent.

Safety rules:

- only auto-login after setup transaction succeeds
- session must be a normal web session, not a special setup-only session
- if session creation fails after setup succeeds, report setup complete and send the user to login

Status:

Accepted. Web first-run setup creates a normal authenticated session and routes the owner into the portal.

### Q12. After setup or login, should the portal land on an organization dashboard or the project area?

Recommended answer:

Land users directly on the Project List / Project Workspace area. Defer a global organization dashboard.

Recommended flow:

```text
setup/login complete
  -> /portal/projects

if no projects exist
  -> show empty project list
  -> primary action: Create Project

after project creation
  -> /portal/projects/:project_id
```

Reasoning:

- Project is the core working object in Demo Composer.
- Captures, guides, and interactive demos all belong under projects.
- A fresh organization has little useful dashboard data.
- The first useful action is usually creating a project.
- This keeps slice one aligned with the agreed vertical slice: auth/user/organization foundation into project create/list/detail and minimal portal workspace.

Deferred:

- organization dashboard
- member/invite management surface
- usage/storage/billing summaries
- audit log dashboard
- analytics overview

Status:

Accepted. Setup/login routes to the project area; organization dashboard is deferred.

### Q13. Should first-run setup create a default project automatically?

Recommended answer:

No. First-run setup should create only the owner user, organization, and owner org_user. The owner should manually create the first project after landing on the project list.

Recommended flow:

```text
first-run setup
  -> create user
  -> create organization
  -> create owner org_user
  -> create auth session
  -> redirect to /portal/projects
  -> empty project list with Create Project action
```

Reasoning:

- Project names should be meaningful because captures, guides, and interactive demos are organized around real product/workflow areas.
- Auto-created "Default Project" records usually become clutter.
- The first product action should be intentional.
- Setup should stay focused on identity and organization creation only.
- Slice one gets a real project creation path immediately instead of hiding it behind seed data.

Status:

Accepted. First-run setup does not create a default project.

### Q14. Should slice one implement organization switching?

Recommended answer:

Model multi-organization membership in the schema from day one, but defer organization switching UI/API from slice one.

Slice-one behavior:

```text
user can belong to multiple organizations in schema
signin selects the first/only active org_user
auth_session stores active organization_id and org_user_id
portal does not show an organization switcher yet
API does not expose switch-organization yet
```

Deferred route:

```text
POST /api/v1/authentication/switch-organization
```

Reasoning:

- `user -> org_user -> organization` already supports multiple organizations.
- Slice one only needs first-run setup, login, active organization context, and project CRUD.
- Organization switching adds UI, session switching rules, permission checks, and edge cases.
- Keeping active organization context in `auth_session` makes switching straightforward later.

Status:

Accepted. Schema supports multi-organization users, but slice one has no organization switcher or switch endpoint.

### Q15. Should slice one include organization invites and member management?

Recommended answer:

Defer organization invites and member management UI/API from slice one, while keeping `org_user` ready for later roles and statuses.

Slice-one behavior:

```text
org_user table supports role/status
first-run setup creates one owner org_user
no invite routes
no member management UI
no email dependency for setup
```

Deferred routes:

```text
POST /api/v1/organization/invite
GET  /api/v1/organization/members
POST /api/v1/organization/invite/:token/accept
POST /api/v1/organization/members/:id/change-role
POST /api/v1/organization/members/:id/remove
```

Reasoning:

- First-run setup only needs one owner.
- Project CRUD does not require inviting members yet.
- Invites require email delivery or invite-token UX, expiration, resend/cancel, acceptance, and role assignment.
- Self-hosted users may not configure email early, so invites should not block setup.

Status:

Accepted. Slice one defers invites/member management but keeps `org_user` role/status fields.

### Q16. How strict should slice-one roles and permissions be?

Recommended answer:

Use simple organization-level roles in slice one, but do not build a full permission engine yet.

Slice-one roles:

```text
owner
admin
member
```

Slice-one behavior:

```text
owner/admin/member can create, list, update, archive, restore, and soft-delete projects
owner is reserved for future organization administration actions
permission checks are simple role/status checks
no DB-backed permission matrix
no custom roles
```

Reasoning:

- Demo Composer needs enough role shape for future invites and hosted organizations.
- A full permission table/CASL-style engine is not required for the first project workflow.
- Project CRUD does not need fine-grained permissions yet.
- Simple role checks are easier to test and can be replaced later if real permission complexity appears.

Status:

Accepted. Slice one uses simple `org_user.role` checks and defers a full permission engine.

### Q17. Should slice-one auth use HTTP-only cookie sessions, Bearer tokens, or both?

Recommended answer:

Use HTTP-only cookie sessions for the web portal in slice one. Defer Bearer tokens and extension-scoped sessions until the Chrome extension sprint.

Slice-one behavior:

```text
POST /api/v1/authentication/signin/password
  -> validates credentials
  -> creates DB auth_session
  -> sets HTTP-only session cookie

GET /api/v1/authentication/me
  -> reads session cookie
  -> loads auth_session from DB
  -> returns user, organization, org_user, and active session context

POST /api/v1/authentication/logout
  -> revokes DB auth_session
  -> clears cookie
```

Deferred:

```text
Authorization: Bearer <extension_token>
extension-scoped sessions
API keys
personal access tokens
```

Reasoning:

- Slice one is backend plus portal, not the Chrome extension.
- Cookies are the simplest browser auth path for the portal.
- HTTP-only cookies reduce token exposure to frontend JavaScript.
- Chrome extension auth has different needs: instance URL plus extension-scoped token/session.
- Separating portal sessions from extension sessions keeps contracts clearer.

Status:

Accepted. Slice-one portal auth uses HTTP-only DB-backed cookie sessions; extension/Bearer tokens are deferred.

### Q18. Should slice-one session cookies support cross-site portal/API deployments?

Recommended answer:

Use same-origin/same-site portal auth in slice one. Defer cross-site cookie/CORS support until there is a concrete deployment need.

Slice-one cookie defaults:

```text
httpOnly = true
sameSite = lax
secure = true in production
path = /
```

Deployment assumption:

```text
portal and API are served from the same origin for MVP
```

Reasoning:

- Same-site cookies are simpler and safer for the first portal/backend slice.
- Cross-site cookies require trusted-origin configuration, stricter CORS handling, `sameSite=None`, HTTPS, and more deployment documentation.
- Chrome extension auth will use a separate extension-scoped token/session later, so cross-site portal cookies are not needed for extension work.

Status:

Accepted with a later refinement in Q19. Slice one should keep simple HTTP-only cookie defaults, but Demo Composer will follow the `orca_v2` separate web/server app pattern rather than forcing the server to serve the portal.

Follow-up:

- See Q19 for the corrected web/server deployment shape.

### Q19. Should the backend serve the built portal, or should Demo Composer follow the `orca_v2` separate web/server app pattern?

Recommended answer:

Follow the `orca_v2` pattern: keep the portal and API as separate apps, with explicit API base URL, credentialed requests, CORS configuration, and cookie configuration.

`orca_v2` pattern observed:

```text
apps/web
  -> Vite React app
  -> calls API through VITE_API_BASE_URL or relative API URL
  -> fetch uses credentials: "include"

apps/ap-web
  -> separate Vite React app
  -> calls API through VITE_API_BASE_URL
  -> fetch uses credentials: "include"

apps/server
  -> Fastify API
  -> registers @fastify/cors with credentials enabled
  -> registers @fastify/cookie
  -> controls allowed web origins through CORS_ALLOWED_ORIGINS
  -> controls cookie domain through COOKIE_DOMAIN when needed
```

Demo Composer slice-one shape:

```text
apps/web
  -> Vite portal
  -> VITE_API_BASE_URL points to apps/server
  -> API client sends credentials: "include"

apps/server
  -> Fastify API only
  -> does not own portal static hosting by default
  -> supports configured CORS allowed origins
  -> sets HTTP-only auth cookie
```

Development:

```text
apps/web    -> Vite dev server
apps/server -> Fastify API server
```

Production/self-hosting:

```text
default deployment can run web and server as separate services
reverse proxy may place them under one domain or sibling subdomains
server does not need to serve the built web assets
```

Cookie/CORS guidance:

- keep `httpOnly = true`
- use `credentials: "include"` from the portal API client
- allow configured trusted frontend origins only
- omit cookie domain by default for local/dev
- allow `COOKIE_DOMAIN` only when deployment needs shared parent-domain cookies
- use secure cookies in production

Reasoning:

- This matches the project style we want to borrow from `orca_v2`.
- Keeping web and server separate preserves clean app boundaries.
- The backend stays an API service rather than becoming a static asset host.
- Self-hosters can still put both behind a reverse proxy if they want one public origin.
- It avoids baking one deployment topology into the application code.

Status:

Accepted. Demo Composer will follow the `orca_v2` separate web/server app pattern. Fastify will not serve the portal by default.

Decision records:

- `docs/adr/0019-separate-web-and-server-apps.md`

### Q20. Should Demo Composer split frontend surfaces into multiple web apps?

Recommended answer:

No. Demo Composer should have one portal app in `apps/web` for MVP.

Recommended shape:

```text
apps/web
  -> web first-run setup
  -> authentication
  -> project list
  -> project workspace
  -> capture session views later
  -> guide editor later
  -> interactive demo editor later
  -> publish/admin surfaces later
```

Do not create:

```text
apps/admin-web
apps/guide-web
apps/demo-web
```

Reasoning:

- Demo Composer has one core product surface: the portal.
- Scribe-style guides and Storylane-style interactive demos are separate artifact editors, not separate frontend applications.
- Multiple web apps would add routing, auth, deployment, shared UI, and duplicated setup work without a real product boundary.
- `orca_v2` has multiple web apps because procurement and AP are meaningfully different product surfaces. Demo Composer does not have that split in MVP.

Future:

- A separate public viewer app for published artifacts can be revisited if publishing needs a very different runtime, performance profile, or anonymous access model.

Status:

Accepted. Demo Composer MVP uses one `apps/web` portal app.
