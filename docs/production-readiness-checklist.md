# Production Readiness Checklist

Date: 2026-06-13

Use this before deploying a self-hosted Demo Composer instance.

## Environment

- [ ] Set `NODE_ENV=production`.
- [ ] Set `DEV_TYPE=production`.
- [ ] Set `TZ`.
- [ ] Set `SERVER_PORT`.
- [ ] Set `COOKIE_SECRET` to a strong secret.
- [ ] Set `COOKIE_DOMAIN` for the deployed portal domain.
- [ ] Set PostgreSQL variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_MAX_POOL`.
- [ ] Set `DEMO_COMPOSER_DEPLOYMENT_MODE` to `self_hosted` or `hosted`.
- [ ] Set `DEMO_COMPOSER_ONBOARDING_MODE` to `first_run_setup` or `signup`.
- [ ] Set `DEMO_COMPOSER_LOCAL_STORAGE_ROOT` to a durable storage path.
- [ ] Set `DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES`.
- [ ] Set `API_URL` to the externally reachable API origin.
- [ ] Set `VITE_DEMO_COMPOSER_API_URL` for the portal build.

## Database

- [ ] Create the production database.
- [ ] Run migrations:

```bash
rtk pnpm --filter server run migrate:up
```

- [ ] Confirm backups exist before allowing real usage.

## Build

- [ ] Build the repo:

```bash
rtk pnpm build
```

- [ ] Start the server from `apps/server/dist`.
- [ ] Serve the web portal build from `apps/web/dist`.
- [ ] Package/load the extension build from `apps/extension/dist` if browser capture is needed.

## Security And Access

- [ ] Confirm CORS allows the deployed portal origin.
- [ ] Confirm cookies are secure on HTTPS.
- [ ] Confirm first-run setup is disabled after owner creation.
- [ ] Confirm local storage path is not publicly served except through API routes.
- [ ] Confirm published guide asset reads only work for assets referenced by accessible published snapshots.

## Smoke Test

- [ ] Open the portal.
- [ ] Complete first-run setup or sign in.
- [ ] Create a project.
- [ ] Create a manual capture session.
- [ ] Upload one or more screenshots.
- [ ] Reorder capture events if needed.
- [ ] Create a guide from the capture session.
- [ ] Edit guide steps.
- [ ] Publish the guide.
- [ ] Open the public guide URL.
- [ ] Disable public access and confirm the public URL no longer opens.
- [ ] Re-enable public access or clear the test publish link.
