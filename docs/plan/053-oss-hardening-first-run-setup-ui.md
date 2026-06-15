# OSS Hardening First-Run Setup UI Plan

Date: 2026-06-15

Status: Planned.

## Goal

Add a web first-run setup experience so a fresh self-hosted Demo Composer instance can be initialized from the browser without direct API calls.

Target flow:

```text
self-hosted user
  -> opens the portal on a fresh instance
  -> portal checks public instance status
  -> setup_required is true
  -> portal shows first-run setup form
  -> user enters owner email, owner name, organization name, and password
  -> portal calls POST /api/v1/setup/first-run
  -> backend creates user, organization, owner org_user, and session
  -> user lands on /projects
```

This is required before open sourcing because a self-hosted project should be usable by a new person without reading API docs or manually posting JSON.

## Why This Comes Next

The backend already has:

- `GET /api/v1/public/instance`
- `POST /api/v1/setup/first-run`
- first-run setup service and DB tests
- cookie-backed sessions that work after setup
- login and project list portal routes

The missing piece is the portal entry flow.

Right now a new self-hosted instance has an awkward bootstrap path:

```text
run server
  -> call setup API manually
  -> then use /login
```

For OSS, that is not acceptable as the default first impression.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0017-deployment-aware-onboarding-mode.md
docs/adr/0018-web-first-run-setup-from-day-one.md
docs/adr/0019-separate-web-and-server-apps.md
docs/plan/001-foundation-setup-auth-project.md
docs/plan/002-db-backed-first-run-setup.md
docs/plan/003-password-auth-session.md
docs/plan/020-portal-auth-entry.md
docs/plan/021-project-list-portal-home.md
```

Important implications:

- self-hosted instances default to first-run setup
- hosted instances should later use signup/invite, not first-run setup
- portal and API remain separate apps
- the portal should call the API through the existing API client layer
- first-run setup creates the first owner and logs them in through the session cookie
- no default project should be created during setup
- no organization invitation or hosted signup UI belongs in this slice

## Current State

Already implemented:

- backend public instance status route:

```http
GET /api/v1/public/instance
```

- backend first-run setup route:

```http
POST /api/v1/setup/first-run
```

- backend setup creates:
  - `user_schema.user`
  - `organization_schema.organization`
  - `organization_schema.org_user`
  - `auth_schema.auth_session`

- setup response sets the portal session cookie
- `/login` route exists
- `/projects` route exists
- portal API client has generic JSON request behavior
- web app has manual route parsing in `apps/web/src/lib/routes.ts`

Known gaps:

- no `/setup` portal route
- no first-run setup page
- app boot does not check public instance status
- login page does not redirect to setup when setup is required
- no web API client helpers for public instance status or setup
- no portal tests for fresh instance onboarding
- public guide routes must remain readable even when the instance is uninitialized

## Scope

Included:

- add API client helper for `GET /api/v1/public/instance`
- add API client helper for `POST /api/v1/setup/first-run`
- add `/setup` portal route
- add `FirstRunSetupPage` under `apps/web/src/features/setup`
- update `App.tsx` routing so `/setup` renders the setup page
- add a lightweight app entry guard that routes portal/private users to `/setup` when `setup_required = true`
- explicitly exclude public reader routes from setup redirects
- ensure `/login` can show or redirect to setup when the instance reports setup required
- after successful setup, navigate to `/projects`
- show validation and server errors clearly
- keep setup form focused:
  - owner email
  - first name
  - last name
  - password
  - organization name
- add tests for API helpers, route parsing, setup page behavior, and app routing
- update `docs/project-zoomout-status.md` after implementation

Excluded:

- hosted signup UI
- invite acceptance
- organization member management
- password strength meter
- password confirmation policy beyond basic UX
- CLI bootstrap command
- creating a default project
- email verification
- changing backend setup persistence behavior unless a bug is discovered
- Docker/self-host docs; that is plan 056

## Product Behavior

### Fresh Self-Hosted Instance

When `GET /api/v1/public/instance` returns:

```json
{
  "deployment_mode": "self_hosted",
  "onboarding_mode": "first_run_setup",
  "setup_required": true,
  "signup_enabled": false
}
```

The portal should route to:

```text
/setup
```

The setup page should show:

```text
Set up Demo Composer
Owner email
First name
Last name
Organization name
Password
[Create owner account]
```

After successful setup:

```text
POST /api/v1/setup/first-run
  -> 201
  -> browser receives session cookie
  -> navigate /projects
```

### Already Initialized Instance

When setup is complete:

```json
{
  "setup_required": false
}
```

Opening `/setup` should not allow creating another owner. Recommended behavior:

- show `This instance is already set up.`
- link to `/login` or `/projects`

The backend is still the source of truth and may return `409 first_run_setup_completed`.

### Hosted Signup Mode

When public instance status says:

```json
{
  "onboarding_mode": "signup",
  "setup_required": false,
  "signup_enabled": true
}
```

The setup page should not show first-run setup. It can show:

```text
First-run setup is not available for this instance.
```

Hosted signup UI is not part of this slice.

### Public Routes

Public guide routes must not be blocked by setup-status checks:

```text
/p/:slug
/p/:slug/embed
```

Those routes should continue to render through the public guide reader flow. If an uninitialized instance has no public guides yet, the public reader should show its normal missing-link state rather than redirecting to `/setup`.

## Web Design

Add:

```text
apps/web/src/features/setup/FirstRunSetupPage.tsx
apps/web/src/features/setup/FirstRunSetupPage.test.tsx
apps/web/src/features/setup/FirstRunSetupPage.module.css
apps/web/src/features/setup/types.ts
```

Keep layout consistent with `LoginPage`:

- simple centered operational form
- no marketing hero
- clear submit/loading/error states
- no in-app documentation text beyond form labels and errors

Use existing navigation style:

```ts
navigate = (path) => window.location.assign(path)
```

## API Client Design

Add types and helpers in `apps/web/src/lib/api.ts`:

```ts
export type PublicInstanceStatus = {
  deployment_mode: "self_hosted" | "hosted";
  onboarding_mode: "first_run_setup" | "signup";
  setup_required: boolean;
  signup_enabled: boolean;
};

export const getPublicInstanceStatus = async (): Promise<PublicInstanceStatusResponse>;

export const completeFirstRunSetup = async (input: {
  owner: {
    email: string;
    password: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  organization: {
    name: string;
  };
}): Promise<AuthResponse>;
```

The setup request must include credentials so the session cookie is accepted.

## Routing

Update `apps/web/src/lib/routes.ts`:

```text
/setup -> { type: "setup" }
```

Update `apps/web/src/App.tsx` to render setup.

For app boot redirect, keep it minimal. Avoid a full routing framework in this slice.

Possible approach:

- `App` can call `getPublicInstanceStatus` for portal/private route types
- if setup is required and route is not `/setup`, navigate to `/setup`
- if route is `/login` and setup is required, navigate to `/setup`
- if route is public guide reader/embed, skip the setup check

Prefer centralizing this in `App` if it can be done without making every route harder to test.

Guard against redirect loops:

- `/setup` should never redirect to itself repeatedly
- an unavailable public-instance status request should show a stable portal error on private routes
- public guide routes should not depend on public-instance status

## Test Plan

Add/extend tests:

```text
apps/web/src/lib/api.test.ts
apps/web/src/lib/routes.test.ts
apps/web/src/App.test.tsx
apps/web/src/features/setup/FirstRunSetupPage.test.tsx
```

Test cases:

- API helper calls `/api/v1/public/instance`
- API helper posts `/api/v1/setup/first-run`
- `/setup` route parses correctly
- setup page renders owner/org fields
- successful setup navigates to `/projects`
- unsafe password/server validation error is shown
- repeated setup conflict is shown
- hosted signup mode does not render first-run form
- app routes fresh unauthenticated setup-required instances to setup
- app does not redirect public guide routes to setup
- setup status failures do not create redirect loops
- existing login/project routes continue working

Run:

```bash
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm lint
```

## Risks

- Adding a central app boot check could make public guide routes accidentally call auth/setup endpoints. Public guide routes should remain accessible without setup redirects.
- If the portal and API are served on different origins, cookies and CORS must already be configured correctly. Plan 054 handles the server-side config hardening.
- Hosted signup is intentionally not implemented, so copy must avoid promising signup.
- Security enforcement for hosted/signup mode is completed in plan 054. This UI slice should not rely on frontend checks as the source of truth.

## Commit Strategy

Suggested commits during implementation:

1. `Add first-run setup API client and route parsing`
2. `Add first-run setup portal page`
3. `Wire setup-required portal routing`
4. `Document first-run setup portal support`

## Acceptance Criteria

- fresh self-hosted instance can be set up through `/setup`
- successful setup creates an authenticated portal session
- setup page redirects or links to projects after success
- setup page handles already-complete and hosted/signup states
- no default project is created
- existing login/project/public guide routes still pass tests
- web tests, type checks, and lint pass
