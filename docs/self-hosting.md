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
    "API_URL": "http://localhost:3002",
    "AUTH_REDIRECT_URL": "http://localhost:3000/"
  }
}
```

For production, set `NODE_ENV=production`, `DEV_TYPE=production`, a strong `COOKIE_SECRET`, and explicit `DEMO_COMPOSER_CORS_ALLOWED_ORIGINS`.

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
2. Sign in with the owner account created through first-run setup.
3. Select a project.
4. Start a capture session.
5. Capture visible-tab screenshots.
6. Finish the capture session to open it in the portal.

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

## Reverse Proxy Notes

For production:

- serve the portal over HTTPS
- run the API behind HTTPS
- set `COOKIE_SECRET` to at least 20 characters
- set `COOKIE_DOMAIN` only when needed for your deployed domain
- set `DEMO_COMPOSER_CORS_ALLOWED_ORIGINS` to the deployed portal origin and any Chrome extension origin
- keep first-run setup in `first_run_setup` mode only for self-hosted initialization

Use `docs/production-readiness-checklist.md` before allowing real users.
