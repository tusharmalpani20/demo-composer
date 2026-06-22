# Self-Hosting Quickstart

Demo Composer is currently alpha. This guide describes a practical single-machine self-host path for evaluation and internal use.

## Prerequisites

- Node.js 22 or newer
- pnpm 9
- PostgreSQL 16 or compatible
- Chrome or Chromium for extension testing

Optional local PostgreSQL:

```bash
docker compose up -d postgres
```

## Install

```bash
pnpm install
```

## Configure The Portal

For local development, the web portal runs on `http://localhost:3000` and proxies same-origin `/api` requests to `http://localhost:3002`.

If the portal is served from a different origin without that dev proxy, set:

```text
VITE_DEMO_COMPOSER_API_URL=https://api.example.com
```

## Configure The Server

Create `apps/server/.env-cmdrc` from `apps/server/.env-cmdrc.example`.

For a local self-hosted evaluation using the provided Compose database:

```json
{
  "development": {
    "JWT_KEY": "",
    "TZ": "UTC",
    "SERVER_PORT": "3002",
    "DEV_TYPE": "development",
    "DB_HOST": "127.0.0.1",
    "DB_PORT": "5432",
    "DB_USER": "demo_composer",
    "DB_PASSWORD": "demo_composer",
    "DB_NAME": "demo_composer",
    "DB_MAX_POOL": "10",
    "NODE_ENV": "development",
    "COOKIE_SECRET": "",
    "DEMO_COMPOSER_DEPLOYMENT_MODE": "self_hosted",
    "DEMO_COMPOSER_ONBOARDING_MODE": "first_run_setup",
    "DEMO_COMPOSER_CORS_ALLOWED_ORIGINS": "http://localhost:3000,http://localhost:4000",
    "DEMO_COMPOSER_LOCAL_STORAGE_ROOT": "./storage",
    "DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES": "10485760",
    "DEMO_COMPOSER_JSON_BODY_LIMIT_BYTES": "1048576",
    "DEMO_COMPOSER_RATE_LIMIT_MAX_ATTEMPTS": "20",
    "DEMO_COMPOSER_RATE_LIMIT_WINDOW_MS": "60000",
    "API_URL": "http://localhost:3002",
    "AUTH_REDIRECT_URL": "http://localhost:3000/"
  }
}
```

For production, set `NODE_ENV=production`, `DEV_TYPE=production`, a strong `COOKIE_SECRET`, and explicit `DEMO_COMPOSER_CORS_ALLOWED_ORIGINS`.
For a production portal build, set `VITE_DEMO_COMPOSER_API_URL` when the API is not served from the same origin as the portal.

Production server startup validates these high-risk settings before listening:

- `SERVER_PORT`, `DB_PORT`, and `DB_MAX_POOL` must be positive integers.
- `COOKIE_SECRET` must be set to at least 20 characters.
- `DEMO_COMPOSER_CORS_ALLOWED_ORIGINS` must include the deployed portal origin and any extension origins that will call the API.
- `DEMO_COMPOSER_DEPLOYMENT_MODE` must be explicitly set to `self_hosted` or `hosted`.
- `DEMO_COMPOSER_ONBOARDING_MODE` must be explicitly set to `first_run_setup` or `signup`.
- `DEMO_COMPOSER_LOCAL_STORAGE_ROOT` must be set to an absolute durable production storage path, not the default `./storage`.
- `API_URL` must be an absolute `http` or `https` API origin.

## Database

```bash
rtk pnpm --filter server db:create
rtk pnpm --filter server migrate:up
```

## Run

Server:

```bash
rtk pnpm --filter server dev
```

Portal:

```bash
rtk pnpm --filter web dev
```

Open the portal, complete first-run setup, and create your first project.

## Chrome Extension

Build the extension:

```bash
rtk pnpm --filter extension build
```

Load `apps/extension/dist` in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `apps/extension/dist`.

In the extension popup:

1. Set the instance URL to your server origin, for example `http://localhost:3002`.
2. If the API and portal are on different origins, set the optional portal URL to the browser-facing portal origin, for example `http://localhost:3000` or `https://demo.example.com`.
3. Sign in with the owner account created through first-run setup.
4. Select a project.
5. Start a capture session.
6. Capture visible-tab screenshots.
7. Finish the capture session to open it in the portal.

## Publish A Guide

In the portal:

1. Open a completed capture session.
2. Create a guide from the capture.
3. Edit steps and screenshots.
4. Preview the guide.
5. Publish the guide.
6. Open or copy the public guide link.

## Storage And Backups

Local file storage defaults to `./storage` relative to the server working directory. Treat that directory and the PostgreSQL database as durable state. Back up both before real use.

Do not expose the storage directory directly through a static file server. Published guide assets should be served through the application routes.

Use [operations.md](operations.md) for backup/restore, storage permissions, retention cleanup, token rotation, and dependency review guidance.

## Reverse Proxy Notes

For production:

- serve the portal over HTTPS
- run the API behind HTTPS
- route `/healthz` to liveness checks and `/readyz` to readiness checks
- set `COOKIE_SECRET` to at least 20 characters
- set `COOKIE_DOMAIN` only when needed for your deployed domain
- set `DEMO_COMPOSER_CORS_ALLOWED_ORIGINS` to the deployed portal origin and any Chrome extension origin
- set `DEMO_COMPOSER_JSON_BODY_LIMIT_BYTES`, `DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES`, `DEMO_COMPOSER_RATE_LIMIT_MAX_ATTEMPTS`, and `DEMO_COMPOSER_RATE_LIMIT_WINDOW_MS` for your instance size
- keep first-run setup in `first_run_setup` mode only for self-hosted initialization

Use `docs/production-readiness-checklist.md` before allowing real users.
