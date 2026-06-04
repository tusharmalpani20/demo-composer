# DB Backed First Run Setup Plan

Date: 2026-06-05

## Goal

Prove that web first-run setup works against a real Postgres database:

```text
migrate test database
  -> POST /api/v1/setup/first-run
  -> persist user, organization, owner org_user, auth_session
  -> set web session cookie
  -> reject repeat setup
```

This is the next phase before password login and project APIs. The setup route and service already exist, but the real repository path needs database-backed verification.

## Why This Comes Next

Current state:

- first-run setup service is tested with an in-memory repository
- route contract is tested with an injected fake service
- default app wiring exists
- foundation SQL migration exists
- no real Postgres setup test has proven persistence yet

Risk if skipped:

- later auth/project work may build on a setup path that compiles but does not actually persist correctly
- database schema or migration runner issues would be discovered too late
- session cookie behavior might be correct at route level but broken with the real repository

## Scope

Included:

- test database lifecycle scripts/helpers
- migration execution against a real test database
- DB-backed first-run setup integration test through Fastify public API
- repeat setup conflict behavior through public API
- route error mapping for setup-domain failures
- transaction/race-safety checks for first owner creation
- repository bug fixes discovered by the integration test
- environment examples for test DB usage

Excluded:

- password sign-in
- `/authentication/me`
- logout
- project APIs
- portal UI
- Docker Compose polish
- hosted signup
- organization invites

## Existing Files Involved

Likely touched:

```text
apps/server/package.json
apps/server/.env-cmdrc.example
apps/server/src/db/create-db.ts
apps/server/src/db/migrate.ts
apps/server/src/db/migrator.ts
apps/server/src/db/migrations/001_foundation_schema.sql
apps/server/src/modules/setup/first-run-setup.repository.ts
apps/server/src/modules/setup/first-run-setup.service.ts
apps/server/src/modules/setup/first-run-setup.routes.ts
apps/server/src/modules/setup/*.test.ts
```

Possible new files:

```text
apps/server/src/db/drop-db.ts
apps/server/src/db/test-database.ts
apps/server/src/modules/setup/first-run-setup.db.integration.test.ts
apps/server/src/modules/setup/first-run-setup.repository.test.ts
```

## Test Database Strategy

Recommended approach:

```text
use a dedicated test database name from env
create it before DB integration tests
run migrations before DB integration tests
drop or clean it after tests
```

Recommended env:

```text
NODE_ENV=test
DEV_TYPE=testing
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=demo_composer_test
DB_MAX_POOL=10
COOKIE_SECRET=replace-with-test-secret
```

Add a `testing` block to `apps/server/.env-cmdrc.example` so developers do not reuse development database settings accidentally.

Add scripts:

```text
pnpm --filter server test:db:create
pnpm --filter server test:migrate
pnpm --filter server test:db:drop
pnpm --filter server test:setup
pnpm --filter server test:db
```

Suggested script behavior:

```text
test:setup
  -> create test database if missing
  -> run migrations

test:db
  -> run DB integration tests only
```

If local Postgres is not running, DB integration tests should fail clearly with a setup message rather than hiding the failure.

Safety rules:

- `test:db:drop` must refuse to run unless `NODE_ENV=test` or `DEV_TYPE=testing`.
- `test:db:drop` must refuse database names that do not look like test databases, for example names not ending in `_test`.
- DB integration tests must clean their own rows or recreate the test database so repeated runs are deterministic.
- Never point DB integration tests at the development database.

## TDD Sequence

### Step 1: Test DB Lifecycle

Failing test or command first:

```text
pnpm --filter server test:setup
```

Expected behavior:

- creates the configured test database
- runs `001_foundation_schema.sql`
- exits successfully

Work:

- add `drop-db.ts` if needed
- add test DB scripts
- make create/drop scripts safe for test database names
- make migration tooling usable in test mode

Acceptance:

- test database can be created, migrated, and dropped repeatedly
- no production database name is used by default for tests
- unsafe drop attempts fail before connecting to Postgres

Commit:

```text
chore: add server test database lifecycle
```

### Step 2: Migration Smoke Test

Failing test first:

```text
foundation migrations create required schemas and tables in Postgres
```

Test should verify real database state:

```sql
information_schema.schemata
information_schema.tables
information_schema.columns
```

Required assertions:

```text
user_schema.user exists
organization_schema.organization exists
organization_schema.org_user exists
auth_schema.auth_session exists
project_schema.project exists
user_schema.user has no organization_id column
auth_schema.auth_session has token_hash and org_user_id
project_schema.project audits to org_user ids
```

Acceptance:

- migration runner applies SQL cleanly
- DB catalog matches foundation schema decisions

Commit:

```text
test: verify foundation migrations on postgres
```

### Step 3: First-Run Setup Persistence Test

Failing test first:

```text
uninitialized instance completes first-run setup through public API with real repository
```

Scenario:

```text
POST /api/v1/setup/first-run
  body owner + organization
  -> 201
  -> sets demo_composer_session cookie
  -> returns auth context
```

Then query database to verify:

```text
one user_schema.user row
one organization_schema.organization row
one organization_schema.org_user row with role owner
one auth_schema.auth_session row with token_hash
raw session token is not stored
```

Important:

- Querying DB is acceptable here because the behavior being tested is persistence/migration integration.
- The main assertion still starts through the public HTTP API.

Acceptance:

- public API creates all expected records
- cookie token differs from stored `token_hash`
- stored `token_hash` equals the SHA-256 hash of the cookie token
- `auth_session.organization_id` and `auth_session.org_user_id` match created owner context
- response does not include `password_hash` or `token_hash`
- `GET /api/v1/public/instance` reports `setup_required = false` after owner setup

Commit:

```text
test: verify db backed first run setup
```

### Step 4: Repeat Setup Conflict

Failing test first:

```text
second first-run setup request is rejected after owner exists
```

Expected behavior:

```text
first request -> 201
second request -> 409
database remains with one owner org_user
```

Work:

- map `FirstRunSetupAlreadyCompletedError` to HTTP 409
- map `UnsafeOwnerPasswordError` to HTTP 400
- ensure check happens before inserts
- keep transaction behavior intact
- re-check owner existence inside the transaction or otherwise prevent concurrent double-owner setup
- consider a partial unique index or lock if the repository test exposes a race

Acceptance:

- repeat setup does not create duplicate user/org/org_user/session records
- response does not leak internal DB details
- weak owner passwords return 400 through the public API
- two concurrent setup requests cannot create two owner org_users

Commit:

```text
feat: reject repeated first run setup
```

### Step 5: Repository Transaction Behavior

Failing test first:

```text
repository rolls back all setup records when one setup insert fails
```

Recommended checks:

```text
create user succeeds
create organization succeeds
create org_user fails
transaction rolls back user and organization
```

This can be covered either through a focused repository integration test or through the public setup API by inducing a real constraint failure.

Acceptance:

- setup persistence is all-or-nothing
- failed setup does not leave partial owner/user/organization rows

Commit:

```text
test: verify first run setup transaction rollback
```

### Step 6: Final Verification

Run:

```text
pnpm --filter server test
pnpm --filter server test:db
pnpm check-types
pnpm --filter server lint
```

Expected:

- all server unit/integration tests pass
- DB integration tests pass when Postgres is running
- root type-check passes
- lint has no errors

Commit if cleanup is needed:

```text
chore: verify db backed setup phase
```

## Acceptance Criteria

This phase is done when:

- test DB lifecycle is documented and scripted
- migrations run on a real test database
- first-run setup API persists the correct records
- setup creates a normal web auth session
- raw session token is never stored
- repeat setup returns 409 and does not duplicate records
- weak password returns 400 through the setup API
- concurrent setup cannot create duplicate owners
- failed setup transactions roll back partial records
- server tests pass
- root type-check passes

## Known Constraint

At the time this plan was written, local Postgres was not responding on `127.0.0.1:5432`. Implementation may need either:

- start local Postgres, or
- point env to an available Postgres instance, or
- add a Docker Compose service in a later infrastructure plan

Do not fake DB integration for this phase. If Postgres is unavailable, stop after adding scripts/tests and report the external dependency clearly.

## Next Phase After This

After DB-backed first-run setup is proven, move to:

```text
password sign-in
GET /api/v1/authentication/me
POST /api/v1/authentication/logout
```

That auth phase should reuse the same `auth_session` table and session cookie created here.
