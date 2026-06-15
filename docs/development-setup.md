# Development Setup

Date: 2026-06-13

## Tooling

Required:

- Node.js `>=18`
- pnpm `9.x`
- PostgreSQL for server DB-backed development and integration tests

Install dependencies from the repository root:

```bash
pnpm install
```

## Environment Files

The server uses `env-cmd` with `.env-cmdrc`.

Expected environments:

```text
development
testing
```

Do not commit real secrets. Keep local database credentials, cookie secrets, and deployment-specific URLs in `.env-cmdrc` or an ignored environment file.

Common server variables:

```text
NODE_ENV
DEV_TYPE
TZ
SERVER_PORT
COOKIE_SECRET
COOKIE_DOMAIN
DEMO_COMPOSER_CORS_ALLOWED_ORIGINS
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
DB_MAX_POOL
DEMO_COMPOSER_DEPLOYMENT_MODE
DEMO_COMPOSER_ONBOARDING_MODE
DEMO_COMPOSER_LOCAL_STORAGE_ROOT
DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES
API_URL
```

`DEMO_COMPOSER_CORS_ALLOWED_ORIGINS` is required in production and accepts comma-separated browser origins, including Chrome extension origins when needed:

```text
https://portal.example.com,chrome-extension://<extension-id>
```

Development and test mode remain permissive for local browser/extension work, but keeping local origins in `.env-cmdrc` makes production parity easier.

Common web variable:

```text
VITE_DEMO_COMPOSER_API_URL
```

## Database

Development database:

```bash
rtk pnpm --filter server run db:create
rtk pnpm --filter server run migrate:up
```

Testing database:

```bash
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
```

Reset the testing database:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
```

Run DB integration tests:

```bash
rtk pnpm --filter server run test:db
```

DB tests use the `.env-cmdrc` `testing` environment and a real PostgreSQL database.

## Running Apps

Server:

```bash
rtk pnpm --filter server dev
```

Web portal:

```bash
rtk pnpm --filter web dev
```

Chrome extension:

```bash
rtk pnpm --filter extension dev
rtk pnpm --filter extension build
```

For self-hosted extension use, configure the extension with the server URL for the instance it should talk to.

## Storage

Local screenshot/file storage defaults to:

```text
./storage
```

Override with:

```text
DEMO_COMPOSER_LOCAL_STORAGE_ROOT
```

Limit screenshot upload size with:

```text
DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES
```

Do not treat local storage as durable production backup by itself.

## Verification

Non-DB checks:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

DB checks:

```bash
rtk pnpm --filter server run test:db
```

## Common Failures

- `test:db` fails to connect: check `.env-cmdrc` `testing` database credentials and make sure PostgreSQL is running.
- migrations fail because the database is already in a bad state: reset the testing DB with `test:db:drop`, `test:db:create`, and `test:migrate`.
- public guide images fail locally: check `DEMO_COMPOSER_LOCAL_STORAGE_ROOT` and make sure the server can read files written during upload.
- extension cannot authenticate: confirm the extension instance URL points to the running server and that cookies/credentials are accepted by the backend.
