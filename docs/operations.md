# Operations Guide

Date: 2026-06-15

This guide covers the operational basics for a self-hosted Demo Composer v1 instance. It does not cover one-command packaging, Kubernetes, Terraform, managed object storage, or external observability stacks.

## Health Checks

- `GET /healthz` is a liveness check. It does not touch PostgreSQL.
- `GET /readyz` is a readiness check. It returns `200` only when the API can reach PostgreSQL.
- Use `/healthz` for process liveness and `/readyz` before sending traffic to the API.

## Backups

Back up both durable stores together:

- PostgreSQL database
- `DEMO_COMPOSER_LOCAL_STORAGE_ROOT`

Example PostgreSQL backup:

```bash
pg_dump --format=custom --file=demo_composer.dump "$DATABASE_URL"
```

Example local storage backup:

```bash
tar -czf demo_composer_storage.tgz /var/lib/demo-composer/storage
```

Take the database dump and storage archive close together in time. If you restore only one side, captures and published assets can point at files that do not exist.

## Restore

Restore into a clean database and storage directory:

```bash
createdb demo_composer_restore
pg_restore --dbname=demo_composer_restore demo_composer.dump
mkdir -p /var/lib/demo-composer/storage
tar -xzf demo_composer_storage.tgz -C /
```

After restore:

- run migrations for the target application version
- point `DEMO_COMPOSER_LOCAL_STORAGE_ROOT` at the restored storage path
- start the API
- check `/readyz`
- open a project, a guide, a capture asset, and a published link

## Storage Permissions

The API process must be able to read and write `DEMO_COMPOSER_LOCAL_STORAGE_ROOT`.

Recommended production defaults:

- directory owned by the API service user
- no direct public web server access to the storage directory
- backups readable only by trusted operators
- filesystem snapshots or backup jobs scheduled before upgrades

## Retention And Cleanup

Demo Composer does not yet include automated retention cleanup. Treat storage growth as an operator responsibility for v1.

Before deleting local files manually:

- confirm whether the file is referenced by capture assets, guide blocks, published snapshots, or interactive demo scenes
- take a backup
- prefer archiving whole old projects only after the product has built explicit deletion workflows

## Migrations And Upgrades

Before upgrading:

1. Stop background writes if possible.
2. Back up PostgreSQL and local storage.
3. Build the new server and web artifacts.
4. Run `rtk pnpm --filter server migrate:up`.
5. Start the API.
6. Check `/readyz`.
7. Run a smoke test through sign-in, project access, guide preview, public guide, and interactive demo viewer.

## Reverse Proxy And HTTPS

Production deployments should terminate HTTPS before traffic reaches browsers.

Configure the reverse proxy to:

- forward the external API origin consistently
- allow the deployed portal origin in `DEMO_COMPOSER_CORS_ALLOWED_ORIGINS`
- add the Chrome extension origin when extension capture is used
- set body-size limits that are no larger than the configured API limits
- send liveness checks to `/healthz`
- send readiness checks to `/readyz`

## Secret And Token Rotation

`COOKIE_SECRET` signs web session cookies. Rotating it invalidates existing web sessions. Plan a maintenance window or communicate that users must sign in again.

Extension bearer sessions are ordinary authenticated sessions. To force rotation for v1, revoke/expire sessions operationally or ask users to sign out and sign in again after the server-side session cleanup path exists.

Never log submitted passwords, invite tokens, public viewer passwords, cookie values, or bearer tokens.

## Dependency Review

Run a dependency review before production upgrades:

```bash
rtk pnpm audit
```

If an advisory cannot be fixed immediately, record:

- package name and advisory
- affected runtime surface
- mitigation
- planned follow-up
