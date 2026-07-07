# Password Auth Session Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Make the web session created by first-run setup usable by the portal:

```text
first-run owner exists
  -> POST /api/v1/authentication/login
  -> create auth_session and set demo_composer_session cookie
  -> GET /api/v1/authentication/me returns current auth context
  -> POST /api/v1/authentication/logout revokes the session
```

This phase turns the foundation setup work into a real portal login loop. After this, the web app can reliably know the current user, organization, org_user membership, and active session before project APIs are added.

## Why This Comes Next

Current state:

- first-run setup persists `user`, `organization`, `org_user`, and `auth_session`
- first-run setup sets the `demo_composer_session` cookie
- session tokens are stored as SHA-256 hashes, not raw tokens
- public instance status can report whether setup is still required
- there is not yet a fresh password login route
- there is not yet a session-backed `/me` route for the new foundation tables
- there is not yet logout/revocation for the new session model

Risk if skipped:

- portal pages would have no reliable current-user contract
- project APIs would need to invent their own auth assumptions
- extension login later would depend on an unproven session validation path
- stale sessions could remain valid without a tested revocation path

## Scope

Included:

- password login with email and password
- session creation using `auth_schema.auth_session`
- `demo_composer_session` cookie handling
- current auth context lookup from cookie token hash
- logout by revoking the current session
- DB-backed integration tests through Fastify public API
- route-level error mapping for invalid credentials and invalid sessions
- shared cookie/token helper reuse with first-run setup
- session `last_active_at` update on successful validation
- repository/service tests where useful for edge cases

Excluded:

- signup mode for hosted deployments
- password reset
- email verification
- invite acceptance
- multi-org switching
- Chrome extension login UI
- portal UI pages
- project APIs
- refresh token model
- analytics/audit-event pipeline

## Design Decisions For This Phase

Use one browser session cookie:

```text
demo_composer_session=<raw random token>
```

The database stores only:

```text
token_hash = sha256(raw token)
```

Session lookup should:

- read the cookie
- hash the cookie value
- find one active, non-deleted, non-expired `auth_session`
- join to `user`, `organization`, and `org_user`
- return only safe public fields

Do not return:

- `password_hash`
- `token_hash`
- raw session token
- deleted/inactive membership records

Logout should:

- find the current session by cookie hash
- set `status = 'revoked'`, set `revoked_at`, and update `updated_at`
- clear `demo_composer_session`
- return success even if the cookie is already invalid, unless a stricter API contract is intentionally chosen later

For now, the current org is the `organization_id` stored on the session. Multi-org switching can be added later as a separate phase.

Cookie handling should be shared with first-run setup. If the implementation introduces a helper, it should own:

- cookie name
- `httpOnly`
- `sameSite`
- `path`
- clear-cookie behavior

This keeps setup, login, and logout from drifting.

## Existing Files Involved

Likely touched:

```text
apps/server/src/app.ts
apps/server/src/modules/setup/first-run-setup.service.ts
apps/server/src/modules/setup/first-run-setup.routes.ts
apps/server/src/modules/setup/first-run-setup.repository.ts
apps/server/src/modules/authentication/*
apps/server/src/root_router/pre_auth.root_router.ts
apps/server/src/root_router/post_auth.root_router.ts
apps/server/src/config/database.config.ts
```

Existing legacy auth files may be referenced for ideas, but the new implementation should follow the rebuilt foundation style:

```text
apps/server/src/modules/<domain>/<domain>.service.ts
apps/server/src/modules/<domain>/<domain>.repository.ts
apps/server/src/modules/<domain>/<domain>.routes.ts
apps/server/src/modules/<domain>/*.test.ts
```

Possible new files:

```text
apps/server/src/modules/authentication/session.service.ts
apps/server/src/modules/authentication/session.repository.ts
apps/server/src/modules/authentication/session.routes.ts
apps/server/src/modules/authentication/session.routes.test.ts
apps/server/src/modules/authentication/session.service.test.ts
apps/server/src/modules/authentication/session.db.integration.test.ts
apps/server/src/modules/authentication/session-cookie.ts
apps/server/src/modules/authentication/session-token.ts
```

Use `modules/authentication` for the rebuilt foundation slice because the public route prefix is `/api/v1/authentication`. Keep it clearly separate from the legacy `src/module/authentication` tree.

## API Contract

### Login

```text
POST /api/v1/authentication/login
```

Request:

```json
{
  "email": "owner@example.com",
  "password": "safe local password"
}
```

Success:

```text
200 OK
Set-Cookie: demo_composer_session=<token>; HttpOnly; SameSite=Lax; Path=/
```

Response:

```json
{
  "auth": {
    "user": {
      "id": "user_id",
      "email": "owner@example.com",
      "display_name": "Owner User"
    },
    "organization": {
      "id": "organization_id",
      "name": "Acme"
    },
    "org_user": {
      "id": "org_user_id",
      "role": "owner"
    },
    "session": {
      "id": "session_id",
      "session_type": "web",
      "expires_at": "2026-07-05T00:00:00.000Z"
    }
  }
}
```

Invalid credentials:

```text
401 Unauthorized
```

Response:

```json
{
  "error": {
    "type": "invalid_credentials",
    "message": "Email or password is incorrect"
  }
}
```

### Current Session

```text
GET /api/v1/authentication/me
```

Success:

```text
200 OK
```

Response:

```json
{
  "auth": {
    "user": {},
    "organization": {},
    "org_user": {},
    "session": {}
  }
}
```

Missing, invalid, inactive, deleted, or expired session:

```text
401 Unauthorized
```

Response:

```json
{
  "error": {
    "type": "unauthenticated",
    "message": "Authentication is required"
  }
}
```

### Logout

```text
POST /api/v1/authentication/logout
```

Success:

```text
204 No Content
Set-Cookie: demo_composer_session=; Max-Age=0; Path=/
```

Recommended behavior:

- missing/invalid cookie still returns `204`
- known active session is revoked
- cookie is always cleared

## TDD Sequence

### Step 1: Auth Context Lookup Contract

Failing tests first:

```text
valid session cookie returns current auth context
missing session cookie returns unauthenticated
invalid session token returns unauthenticated
expired session returns unauthenticated
inactive session returns unauthenticated
```

Work:

- add session repository lookup by `token_hash`
- join `auth_session`, `user`, `organization`, and `org_user`
- filter inactive, revoked, deleted, disabled, and expired rows
- update `last_active_at` after successful validation
- return a safe auth context shape
- add route mapping for `GET /api/v1/authentication/me`

Acceptance:

- `/me` works with the cookie produced by first-run setup
- `/me` never returns `password_hash`, `token_hash`, or raw token
- `/me` rejects disabled users, disabled organizations, disabled memberships, revoked sessions, and expired sessions
- invalid session states return `401`

Commit:

```text
feat: add current auth session lookup
```

### Step 2: Password Login

Failing tests first:

```text
owner can login with email and password after first-run setup
wrong password returns invalid credentials
unknown email returns invalid credentials
deleted or inactive user cannot login
login creates a new auth_session and stores only token_hash
```

Work:

- add login request validation
- find user by normalized email
- verify password with existing `Password` service
- select a valid active org_user membership in a valid active organization
- create a new `auth_session`
- set `demo_composer_session` cookie
- return the same safe auth context shape as `/me`

Acceptance:

- login succeeds against real first-run setup data
- password comparison uses the stored hash
- raw session token is not stored
- failed login does not create sessions
- disabled users, disabled organizations, and disabled memberships cannot login
- invalid credentials use the same `401` response for wrong password and unknown email

Commit:

```text
feat: add password login session creation
```

### Step 3: Logout

Failing tests first:

```text
logout revokes the active session
logout clears the session cookie
revoked session no longer works with /me
logout without a valid session still clears cookie
```

Work:

- add session revoke repository method
- add `POST /api/v1/authentication/logout`
- revoke by `token_hash`, not by user id
- clear cookie in the response
- keep behavior idempotent

Acceptance:

- known sessions are no longer accepted after logout
- logout does not revoke other active sessions for the same user
- repeated logout calls do not error
- cookie is cleared on every logout response

Commit:

```text
feat: add session logout
```

### Step 4: DB-Backed Auth Integration

Failing tests first:

```text
first-run setup cookie authenticates /me
password login creates a second usable session
logout invalidates only the current session
expired and revoked sessions are rejected
```

Recommended scenario:

```text
test:setup
  -> POST /api/v1/setup/first-run
  -> GET /api/v1/authentication/me with setup cookie
  -> POST /api/v1/authentication/login
  -> GET /api/v1/authentication/me with login cookie
  -> POST /api/v1/authentication/logout with login cookie
  -> GET /api/v1/authentication/me with login cookie returns 401
```

Acceptance:

- auth works against real Postgres data
- setup session and login session are separate rows
- logging out one session does not accidentally revoke all user sessions
- `last_active_at` changes only for validated sessions
- DB tests clean their rows deterministically

Commit:

```text
test: verify db backed password auth session
```

### Step 5: Route Wiring And Cleanup

Failing tests first:

```text
default app build mounts authentication routes under /api/v1/authentication
normal server tests exclude DB integration tests
server DB test command includes auth DB integration tests
```

Work:

- wire auth routes in `app.ts`
- update `apps/server/package.json` `test:db` script to include auth DB tests
- remove accidental legacy-route overlap if any
- keep old legacy modules untouched unless they block the new route contract
- consider exporting/reusing setup token hashing from a common session helper so setup and login cannot diverge

Acceptance:

- default app exposes all three auth endpoints
- route prefixes are consistent
- no duplicated route conflicts
- existing first-run setup tests still pass

Commit:

```text
chore: wire password auth session routes
```

### Step 6: Final Verification

Run:

```text
pnpm --filter server test
pnpm --filter server test:setup
pnpm --filter server test:db
pnpm check-types
pnpm --filter server lint
```

Expected:

- all normal server tests pass
- DB integration tests pass against `.env-cmdrc` testing profile
- root type-check passes
- lint has no errors

Commit if cleanup is needed:

```text
chore: verify password auth session phase
```

## Acceptance Criteria

This phase is done when:

- first-run setup cookie works with `/authentication/me`
- password login creates a fresh session
- `/authentication/me` returns safe current auth context
- logout revokes the current session and clears the cookie
- missing/invalid/expired/inactive sessions return `401`
- disabled users, organizations, and memberships cannot authenticate
- wrong password and unknown email return `401` without leaking which field was wrong
- raw session tokens are never stored
- password hashes and token hashes are never returned
- successful session validation updates `last_active_at`
- DB integration tests prove the full setup/login/me/logout loop
- normal tests, DB tests, type-check, and lint pass

## Open Implementation Notes

- Keep cookie name aligned with first-run setup: `demo_composer_session`.
- Extract `generate_session_token` and `hash_session_token` into a shared auth/session helper before login creates new sessions.
- Move first-run setup cookie constants into a shared cookie helper if login/logout need the same options.
- Reuse the existing `Password` service for hash verification.
- Prefer `modules/authentication` for rebuilt auth code and avoid expanding legacy `src/module/authentication`.
- Keep multi-org switching out of this phase; session organization is enough for now.
- The schema already has `last_active_at`; use it for successful `/me` validation and leave richer activity tracking for later.

## Next Phase After This

After auth/session is proven, move to project foundation APIs:

```text
POST /api/v1/projects
GET /api/v1/projects
GET /api/v1/projects/:id
PATCH /api/v1/projects/:id
```

Project APIs should require the auth context produced by this phase and audit changes with `org_user_id`.
