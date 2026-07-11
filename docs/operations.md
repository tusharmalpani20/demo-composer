# Operations Guide

Date: 2026-06-15

This guide covers the operational basics for a self-hosted Ossie alpha instance. It does not cover one-command packaging, Kubernetes, Terraform, managed object storage, or external observability stacks.

## Health Checks

- `GET /healthz` is a liveness check. It does not touch PostgreSQL.
- `GET /readyz` is a readiness check. It returns `200` only when the API can reach PostgreSQL.
- Use `/healthz` for process liveness and `/readyz` before sending traffic to the API.

## Production Environment Report

Before starting a production API process, operators can run a read-only environment report from the server app:

```bash
cd apps/server
rtk pnpm env:report
```

Run the command with the same environment variables that the production API process will use. The command reuses server startup validation and exits non-zero if required production configuration is missing or malformed.

The report prints JSON with non-secret summaries only:

- runtime and deployment modes
- whether database host/user/name/password settings are configured
- cookie and CORS summary
- API and browser-facing portal origins
- local storage provider and storage path classification
- upload/body-size limits
- in-memory rate-limit settings
- known alpha operational limitations

It does not print `COOKIE_SECRET`, `DB_PASSWORD`, raw cookies, bearer tokens, invite tokens, or the local storage root path. Treat the report as a preflight aid, not a replacement for `/readyz`, reverse proxy testing, backup rehearsal, or a full production readiness review.

## Backups

Back up both durable stores together:

- PostgreSQL database
- `OSSIE_LOCAL_STORAGE_ROOT`

Before relying on a backup, rehearse restore into an isolated database and storage directory. Do not rehearse against the live production database or storage path.

Example PostgreSQL backup:

```bash
pg_dump --format=custom --file=ossie.dump "$DATABASE_URL"
```

Example local storage backup:

```bash
tar -czf ossie_storage.tgz /var/lib/ossie/storage
```

Take the database dump and storage archive close together in time. If you restore only one side, captures and published assets can point at files that do not exist.

## Restore

Restore into a clean database and storage directory:

```bash
createdb ossie_restore
pg_restore --dbname=ossie_restore ossie.dump
mkdir -p /var/lib/ossie/storage
tar -xzf ossie_storage.tgz -C /
```

After restore:

- run migrations for the target application version
- point `OSSIE_LOCAL_STORAGE_ROOT` at the restored storage path
- set `API_URL` to the API origin used for the rehearsal environment
- start the API
- check `/readyz`
- open a project
- open a capture session and at least one capture asset
- open a guide preview
- open a published guide link
- open a published interactive demo if the instance has demos

Record the backup timestamp, database dump name, storage archive name, restore target, application version, and verification result. If any capture asset or published asset is missing after restore, treat the backup pair as incomplete.

## Storage Permissions

The API process must be able to read and write `OSSIE_LOCAL_STORAGE_ROOT`.

Recommended production defaults:

- directory owned by the API service user
- no direct public web server access to the storage directory
- backups readable only by trusted operators
- filesystem snapshots or backup jobs scheduled before upgrades

## Retention And Cleanup

Ossie does not yet include automated retention cleanup. Treat storage growth as an operator responsibility for the alpha.

Before deleting local files manually:

- confirm whether the file is referenced by capture assets, guide blocks, published snapshots, or interactive demo scenes
- take a backup
- prefer archiving whole old projects only after the product has built explicit deletion workflows

Do not delete individual files from `OSSIE_LOCAL_STORAGE_ROOT` unless you have verified they are unreferenced and have a restorable backup. A dry-run storage inventory command is still deferred.

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
- allow the deployed portal origin in `OSSIE_CORS_ALLOWED_ORIGINS`
- add the Chrome extension origin when extension capture is used
- set body-size limits that are no larger than the configured API limits
- send liveness checks to `/healthz`
- send readiness checks to `/readyz`

For split API/web deployments:

- set server `API_URL` to the externally reachable API origin
- set server `OSSIE_PUBLIC_WEB_URL` to the browser-facing portal origin, without a path, query, or hash
- set the portal build `VITE_OSSIE_API_URL` to that API origin when the portal is not same-origin proxied
- configure the extension instance URL as the API origin
- configure the extension portal URL as the browser-facing portal origin

Server startup validates the API-side production settings and the configured public web origin format. It cannot validate the deployed portal build, reverse proxy, TLS certificate, backup jobs, or extension origin until those are exercised in the target environment.

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
