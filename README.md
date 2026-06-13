# Demo Composer

Demo Composer is an open-source capture-to-guide product. It captures browser workflows and turns them into Scribe-style walkthrough docs with screenshots, editable steps, annotations, Markdown export, and publishable public guide links.

The first product loop is focused on internal documentation:

```text
capture screenshots
  -> create capture events
  -> generate an editable guide
  -> preview and edit the guide
  -> publish an immutable public snapshot
```

Interactive demos, analytics, sales tracking, and AI are intentionally deferred.

## Apps

```text
apps/server     Fastify REST API
apps/web        React/Vite portal and public guide reader
apps/extension  React/Vite Chrome extension popup
apps/docs       Next.js docs app scaffold
```

Shared packages live under `packages/`.

## Setup

Start with:

```bash
pnpm install
```

Detailed local setup, environment variables, database commands, storage configuration, and verification commands are documented in:

```text
docs/development-setup.md
```

## Verification

Common non-DB verification:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

DB-backed verification:

```bash
rtk pnpm --filter server run test:db
```

The DB tests require a real PostgreSQL testing database configured through `.env-cmdrc`.

## Backend Shape

The current backend product path is:

```text
apps/server/src/modules/*
```

Route ownership and the removed legacy route surface are documented in:

```text
docs/backend-route-inventory.md
```

## Deployment Checklist

Before deploying, use:

```text
docs/production-readiness-checklist.md
```

## Product Status

Current product progress and known gaps are tracked in:

```text
docs/project-zoomout-status.md
```
