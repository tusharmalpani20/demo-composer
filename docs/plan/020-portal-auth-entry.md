# Portal Auth Entry Plan

Date: 2026-06-05

## Goal

Give the portal a real authentication entry point:

```text
unauthenticated portal user
  -> opens /login
  -> enters email and password
  -> receives cookie-backed session
  -> returns to requested portal page
```

This should turn the current authenticated-only portal pages into a usable browser flow without changing backend authentication behavior.

## Why This Comes Next

Current state:

- backend already supports cookie-backed authentication sessions
- backend exposes:
  - `GET /api/v1/authentication/me`
  - `POST /api/v1/authentication/login`
  - `POST /api/v1/authentication/logout`
- portal pages already call APIs with `credentials: "include"`
- project workspace, capture-session list/detail, guide list, and guide editor all handle unauthenticated API responses

Missing product behavior:

- portal has no `/login` route
- users cannot establish a session from the web app
- unauthenticated states are dead ends
- there is no basic logout affordance
- unsupported-route copy is still compensating for missing entry/navigation behavior

This slice should make auth usable in the portal while staying small. Signup, first-run setup, organization switching, project listing, and invites are separate workflows.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0001-system-shape-monorepo-rest-portal-extension.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/002-db-backed-first-run-setup.md
docs/plan/003-password-auth-session.md
docs/plan/019-project-workspace-portal.md
```

Important implications:

- keep server-owned HTTP-only cookie sessions
- use `credentials: "include"` for auth requests
- do not store session tokens in local storage, session storage, or React state
- do not add signup in this slice
- do not add first-run setup UI in this slice
- do not add organization switching in this slice
- do not add project list/home in this slice
- keep the lightweight route parser; do not introduce React Router
- keep the UI quiet and operational

## Scope

Included:

- portal route `/login`
- auth API types for current auth context
- API helpers for:
  - current session lookup
  - login
  - logout
- login page under `apps/web/src/features/auth`
- login form with email and password fields
- loading/submitting state
- invalid credentials state
- generic error state
- redirect after successful login
- optional `next` query parameter support for returning to the originally requested page
- sign-in links from unauthenticated portal states
- basic logout button in portal top bars
- route tests
- API helper tests
- login page tests
- App route wiring tests
- focused updates to existing page tests where unauthenticated states gain sign-in links or top bars gain logout buttons

Excluded:

- backend changes
- signup
- first-run setup UI
- password reset
- email verification
- OTP flows
- organization switching
- invite/member management
- project list/home page
- profile/settings page
- refresh token work
- local/session storage auth
- analytics
- Chrome extension login
- desktop app login
- AI layer

## Backend Contract

Existing backend routes:

```text
GET /api/v1/authentication/me
POST /api/v1/authentication/login
POST /api/v1/authentication/logout
```

Current session success:

```json
{
  "auth": {
    "user": {
      "id": "user_id",
      "email": "person@example.com",
      "display_name": "Person Example"
    },
    "organization": {
      "id": "organization_id",
      "name": "Example Org"
    },
    "org_user": {
      "id": "org_user_id",
      "role": "owner"
    },
    "session": {
      "id": "session_id",
      "session_type": "web",
      "expires_at": "2026-06-06T10:00:00.000Z"
    }
  }
}
```

Login request:

```json
{
  "email": "person@example.com",
  "password": "password"
}
```

Login success:

```json
{
  "auth": {
    "user": {
      "id": "user_id",
      "email": "person@example.com",
      "display_name": "Person Example"
    },
    "organization": {
      "id": "organization_id",
      "name": "Example Org"
    },
    "org_user": {
      "id": "org_user_id",
      "role": "owner"
    },
    "session": {
      "id": "session_id",
      "session_type": "web",
      "expires_at": "2026-06-06T10:00:00.000Z"
    }
  }
}
```

Logout success:

```text
204 No Content
```

Error mapping:

```text
401 unauthenticated
401 invalid_credentials
400 validation
unknown server/network failure
```

Frontend requirements:

- use shared `requestJson`
- use `credentials: "include"`
- send `accept: application/json`
- send `content-type: application/json` for login
- preserve backend `error.type` through `ApiClientError`
- do not render internal IDs by default
- displaying `auth.user.display_name`, `auth.user.email`, or `auth.organization.name` is allowed when useful
- do not persist auth response bodies beyond current UI needs

## Route Contract

Add route:

```text
/login
```

Route parsing:

```ts
{ type: "login" }
```

Routing requirements:

- parse `/login` and `/login/` as login
- keep all existing project routes intact
- keep route parsing in `apps/web/src/lib/routes.ts`
- add route tests in `apps/web/src/lib/routes.test.ts`
- wire route in `apps/web/src/App.tsx`
- add App tests in `apps/web/src/App.test.tsx`

Query handling:

```text
/login?next=/projects/project_1
```

The current route parser only parses `pathname`. `next` can be read by the login page or App from `window.location.search` in this slice. Do not expand the route parser to parse query strings unless needed.

## API Client Work

Add to:

```text
apps/web/src/features/auth/types.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Types:

```ts
export type AuthContext = {
  user: {
    id: string;
    email: string;
    display_name: string;
  };
  organization: {
    id: string;
    name: string;
  };
  org_user: {
    id: string;
    role: string;
  };
  session: {
    id: string;
    session_type: string;
    expires_at: string;
  };
};

export type AuthResponse = {
  auth: AuthContext;
};
```

Functions:

```ts
export const getCurrentAuth = async (): Promise<AuthResponse>

export const login = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse>

export const logout = async (): Promise<void>
```

API tests:

- `getCurrentAuth` sends `GET /api/v1/authentication/me`
- `login` sends `POST /api/v1/authentication/login`
- `login` includes `content-type: application/json`
- `login` includes the provided email/password JSON body
- `logout` sends `POST /api/v1/authentication/logout`
- all helpers include session cookies through shared `requestJson`
- `invalid_credentials` is preserved as an `ApiClientError` with `kind: "unauthenticated"` and `type: "invalid_credentials"`
- `getCurrentAuth` maps unauthenticated responses to `kind: "unauthenticated"`

## Login Page Work

Create:

```text
apps/web/src/features/auth/LoginPage.tsx
apps/web/src/features/auth/LoginPage.test.tsx
apps/web/src/features/auth/LoginPage.module.css
apps/web/src/features/auth/types.ts
```

Props:

```ts
type LoginPageProps = {
  nextPath?: string;
  submitLogin?: (data: {
    email: string;
    password: string;
  }) => Promise<AuthResponse>;
  navigate?: (path: string) => void;
};
```

Defaults:

```ts
submitLogin = login
navigate = (path) => window.location.assign(path)
nextPath = "/"
```

State behavior:

- initial: empty email/password fields
- submitting: disable submit button and show `Signing in...`
- invalid credentials: show `Email or password is incorrect.`
- generic error: show `Could not sign in.`
- successful login: navigate to sanitized `nextPath`

Validation:

- rely on browser-required inputs for empty fields
- do not add complex client validation in this slice
- trim email before sending
- send password exactly as entered

Next-path sanitization:

- allow only same-origin relative paths starting with `/`
- reject protocol URLs like `https://example.com`
- reject protocol-relative URLs like `//example.com`
- default rejected or missing values to `/`
- preserve query strings on relative paths

This prevents open redirects while still supporting:

```text
/login?next=/projects/project_1
/login?next=/projects/project_1/guides
```

## Unauthenticated Portal States

Current portal pages already render unauthenticated states. Update them to include sign-in links:

```text
Sign in to view this project.
Sign in to view capture sessions.
Sign in to view guides.
Sign in to edit this guide.
Sign in to view this capture session.
```

Requirements:

- keep existing messages
- add a link with accessible text `Sign in`
- link to `/login?next=<current path>`
- URL-encode the `next` value
- do not auto-redirect on unauthenticated API responses in this slice
- pass the current path into page components for tests instead of reading `window.location` deeply inside reusable components
- default to `window.location.pathname + window.location.search` only at App/page boundary when no explicit current path is provided

Reasoning:

- explicit sign-in links are easier to test and less surprising
- automatic redirects can be added later through a shared authenticated shell
- existing pages should remain usable in tests with dependency injection
- explicit current-path props keep existing component tests deterministic

## Logout Work

Add a basic logout button to existing portal top bars:

```text
Demo Composer                         Sign out
project context
```

Requirements:

- button text: `Sign out`
- calls `logout`
- on success, navigates to `/login`
- use injectable `performLogout` and `navigate` props where practical so page tests do not depend on real navigation
- on failure, keeps the user on the page and may show `Could not sign out.`
- do not block the main page content while logout is pending
- keep this small; do not create a global app shell in this slice unless duplication becomes clearly worse than local helper reuse

Affected pages:

```text
ProjectWorkspacePage
ProjectCaptureSessionListPage
CaptureSessionDetailPage
ProjectGuideListPage
GuideEditorPage
```

If duplication becomes noticeable, create a small local shared component under:

```text
apps/web/src/features/portal/PortalTopbar.tsx
```

Only add this shared component if it reduces real duplication without changing layout behavior.

## UX Direction

Login page:

- no hero
- no marketing copy
- no decorative graphics
- centered compact auth panel is acceptable
- use clear field labels: `Email`, `Password`
- primary button text: `Sign in`
- keep error messages close to the form

Portal sign-in/sign-out:

- keep top bars quiet and predictable
- sign-out button should be secondary/chrome-like, not a large call to action
- unauthenticated states should stay simple and include one direct path forward

## Edge Cases

Handle:

- invalid credentials
- generic network/server failure
- double submit while login is pending
- `next` missing
- `next` is external URL
- `next` is protocol-relative URL
- `next` includes query parameters
- logout success
- logout failure
- unauthenticated state sign-in link preserves current path

Do not handle yet:

- signup
- first-run setup
- password reset
- remember-me settings
- multiple organizations
- session expiry banners
- global auth preload
- automatic redirects from every 401
- Chrome extension auth

## Testing Plan

Follow test-driven development.

1. Route tests:
   - add red test for `/login`
   - add trailing slash test for `/login/`
   - keep existing project route tests green

2. API helper tests:
   - add red tests for `getCurrentAuth`, `login`, and `logout`
   - verify credentials and headers
   - verify login JSON body
   - verify invalid credentials error mapping

3. Login page tests:
   - renders email/password fields and sign-in button
   - submits trimmed email and exact password
   - disables submit while pending
   - shows invalid credentials error
   - shows generic error
   - navigates to safe relative next path on success
   - rejects external/protocol-relative next paths

4. App tests:
   - `/login` renders login page
   - `/login?next=/projects/project_1` passes next path to login behavior

5. Existing portal page tests:
   - unauthenticated state includes `Sign in` link with encoded current path
   - top bar includes `Sign out`
   - sign out calls logout and navigates to `/login`
   - sign out failure is handled without removing main page content

Suggested commands:

```text
pnpm --filter web test -- src/lib/routes.test.ts src/lib/api.test.ts src/features/auth/LoginPage.test.tsx src/App.test.tsx
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

## Implementation Order

1. Add route parser red tests for `/login`.
2. Implement login route parsing.
3. Add auth web types.
4. Add API helper red tests.
5. Implement `getCurrentAuth`, `login`, and `logout`.
6. Add login page red tests.
7. Implement minimal login page.
8. Wire login route in `App`.
9. Add App route tests.
10. Add unauthenticated-state sign-in link tests to one page first.
11. Implement sign-in link pattern and apply to remaining portal pages.
12. Add logout tests to one page first.
13. Implement logout affordance and apply consistently.
14. Run focused tests.
15. Run full web verification.
16. Commit as a small feature slice.

## Acceptance Criteria

- `/login` opens a portal login page
- login posts to `POST /api/v1/authentication/login`
- successful login relies on backend cookie setting and navigates to safe `next`
- invalid credentials show a clear message
- generic login failure shows a clear message
- unsafe `next` values are rejected
- existing unauthenticated portal states include a sign-in link
- portal top bars include a basic sign-out action
- sign out posts to `POST /api/v1/authentication/logout`
- no session token is stored in browser storage
- no backend behavior changes are required
- all web tests, typecheck, lint, and build pass
