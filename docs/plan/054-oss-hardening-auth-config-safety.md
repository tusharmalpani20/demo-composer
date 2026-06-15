# OSS Hardening Auth And Config Safety Plan

Date: 2026-06-15

Status: Implemented.

## Goal

Harden instance onboarding, CORS, cookies, and production configuration so Demo Composer is safe and predictable for self-hosted and hosted deployments.

Target outcome:

```text
server starts
  -> validates production-critical configuration
  -> exposes first-run setup only when onboarding mode allows it
  -> uses explicit CORS origins from env
  -> never silently uses weak production cookie secrets
  -> emits Demo Composer branded OpenAPI metadata
```

This phase turns the working backend into a safer OSS-ready backend.

## Why This Comes Next

Plan 053 adds the portal first-run setup UI. That UI only makes sense if the backend enforces the same onboarding rules it reports through `/api/v1/public/instance`.

Current risks:

- `/api/v1/public/instance` can report signup mode while `/api/v1/setup/first-run` is still callable when no owner exists
- CORS origins are hardcoded in `apps/server/src/app.ts`
- cookie secret falls back to `my-secret`
- production cookie behavior is tied to `DEV_TYPE`
- OpenAPI docs still say ORCA
- startup config validation is incomplete and has old wording

This plan fixes those backend safety issues before repo hygiene and public release work.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0017-deployment-aware-onboarding-mode.md
docs/adr/0018-web-first-run-setup-from-day-one.md
docs/adr/0019-separate-web-and-server-apps.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/001-foundation-setup-auth-project.md
docs/plan/002-db-backed-first-run-setup.md
docs/plan/003-password-auth-session.md
docs/plan/047-project-health-hardening.md
docs/production-readiness-checklist.md
docs/development-setup.md
```

Important implications:

- self-hosted defaults to first-run setup
- hosted defaults to signup
- first-run setup must be blocked when onboarding mode is not `first_run_setup`
- Fastify API and React portal remain separate apps
- CORS must allow configured portal origins
- production cookies must be secure
- OpenAPI metadata should be Demo Composer branded

## Current State

Relevant files:

```text
apps/server/src/app.ts
apps/server/src/config/cors.config.ts
apps/server/src/config/cookie.config.ts
apps/server/src/config/runtime.config.ts
apps/server/src/index.ts
apps/server/src/modules/public-instance/public-instance.config.ts
apps/server/src/modules/setup/first-run-setup.service.ts
apps/server/src/modules/setup/first-run-setup.routes.ts
apps/server/.env-cmdrc.example
docs/development-setup.md
docs/production-readiness-checklist.md
```

Known gaps:

- no service-level check for onboarding mode before first-run setup
- no route-level setup unavailable error
- runtime/deployment config is read directly from `process.env` in multiple places
- production detection is split across `NODE_ENV` and `DEV_TYPE`
- CORS allowed origins are hardcoded to localhost
- no `CORS_ALLOWED_ORIGINS` env parsing
- extension origins are not modeled explicitly for production CORS
- cookie secret fallback is weak
- production can start without an explicit strong cookie secret
- OpenAPI title/description still say ORCA
- generated swagger temp output is written on startup; this may be fine locally but should be documented or made dev-only if needed

## Scope

Included:

- add centralized config helpers for runtime mode, deployment/onboarding mode, CORS origins, and cookie settings
- block first-run setup unless `onboarding_mode === "first_run_setup"`
- return a stable error when setup is unavailable by config
- make CORS allowed origins env-driven
- support configured Chrome extension origins or document a safe extension-origin policy
- keep dev/test easy by allowing localhost defaults outside production
- require a strong `COOKIE_SECRET` in production
- remove `my-secret` fallback in production paths
- make cookie domain optional rather than forcing `localhost` in all non-production cases if needed for local host/port flexibility
- separate startup configuration validation from app construction so app tests can continue to inject services without full production env
- update OpenAPI/Scalar metadata from ORCA to Demo Composer
- update `.env-cmdrc.example`
- update development and production docs
- add focused backend unit/route/app tests

Excluded:

- hosted signup implementation
- org invites
- OAuth or SSO
- CSRF framework changes
- public guide password/session changes
- Docker/CI docs; plan 056 owns those
- extension auth redesign

## Backend Behavior

### First-Run Setup Guard

When onboarding mode is `first_run_setup`:

```http
POST /api/v1/setup/first-run
```

works only if no owner exists.

When onboarding mode is `signup`:

```http
POST /api/v1/setup/first-run
```

must return a stable client error, recommended:

```json
{
  "error": {
    "type": "first_run_setup_unavailable",
    "message": "First-run setup is not available for this instance"
  }
}
```

Use status `409` because the endpoint exists, but the instance mode conflicts with this operation.

### CORS

Add env:

```text
DEMO_COMPOSER_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000,chrome-extension://<extension-id>
```

Behavior:

- in production, only configured origins are allowed
- in development/test, preserve easy local behavior
- requests with no origin can continue to be allowed for server-to-server/local tools
- invalid/empty origin list in production should fail startup clearly

Extension behavior must be considered separately because Chrome extension requests can use origins like:

```text
chrome-extension://<extension-id>
```

Recommended production options:

- allow configured `chrome-extension://...` origins through `CORS_ALLOWED_ORIGINS`
- document that unpacked extension IDs change and must be configured per deployment
- keep non-production permissive enough for local extension testing

Do not solve this by allowing every origin in production.

### Cookie Secret

Behavior:

- production requires `COOKIE_SECRET`
- production secret must be at least 20 characters
- dev/test may use a named fallback test/dev secret only if clearly non-production
- avoid logging the secret

Cookie config should not accidentally make local development impossible. Be careful with `domain: localhost`; many local setups work better when cookie domain is omitted.

### Runtime Mode

Use a single helper for production detection so `NODE_ENV` and `DEV_TYPE` do not drift silently:

```text
production when NODE_ENV=production or DEV_TYPE=production
test when NODE_ENV=test or DEV_TYPE=testing
development otherwise
```

Startup validation should happen in `index.ts` before listening. The reusable `build()` function should remain usable in app tests with injected dependencies and should not require a complete production environment unless the test explicitly asks for production config behavior.

### Branding

OpenAPI info should become:

```text
title: Demo Composer
description: Demo Composer API
```

Remove stale ORCA comments where practical.

## Test Plan

Add/extend tests:

```text
apps/server/src/modules/setup/first-run-setup.service.test.ts
apps/server/src/modules/setup/first-run-setup.routes.test.ts
apps/server/src/modules/setup/first-run-setup.app.integration.test.ts
apps/server/src/modules/public-instance/public-instance.integration.test.ts
apps/server/src/config/runtime.config.test.ts
apps/server/src/config/cors.config.test.ts
apps/server/src/config/cookie.config.test.ts
apps/server/src/app.test.ts or app integration tests if existing pattern allows
```

Test cases:

- self-hosted first-run mode allows first setup
- signup mode rejects first-run setup before creating records
- public instance status and setup route agree on mode
- repeated setup still returns already-completed conflict
- production cookie config rejects missing/short secret
- non-production cookie config remains usable
- production CORS allows configured origin
- production CORS rejects unconfigured origin
- configured Chrome extension origin can authenticate and call capture APIs
- OpenAPI info uses Demo Composer branding
- startup validation fails production when required CORS/cookie config is missing
- app construction remains usable in tests without production env

Run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server test:db
rtk pnpm check-types
rtk pnpm lint
```

## Risks

- Environment-dependent tests can leak env values across tests. Save and restore `process.env` carefully.
- Cookie domain changes can affect existing auth tests. Preserve current local/test behavior intentionally.
- Production-only validation should not break `build()` calls in tests that do not simulate server startup.
- CORS hardening can accidentally break the Chrome extension. Include at least one configured extension-origin test or a documented manual smoke test.
- Changing cookie domain defaults can invalidate browser auth if the backend starts setting `Domain=localhost`; prefer omitting `domain` unless explicitly configured.

## Commit Strategy

Suggested commits:

1. `Guard first-run setup by onboarding mode`
2. `Make CORS and cookies production safe`
3. `Clean API documentation branding`
4. `Document hardened server configuration`

## Acceptance Criteria

- hosted/signup mode cannot complete first-run setup
- self-hosted first-run setup still works
- production CORS uses configured origins
- production CORS has an explicit extension-origin story
- production requires a strong cookie secret
- startup validation fails fast when production config is incomplete
- OpenAPI no longer says ORCA
- `.env-cmdrc.example` and docs list required config
- server tests and DB tests pass

## Implementation Notes

Implemented on 2026-06-15.

Added:

- service-level first-run setup guard using deployment-aware onboarding config
- stable `first_run_setup_unavailable` API error mapping
- shared runtime mode helper for `NODE_ENV`/`DEV_TYPE`
- production-safe cookie config with strong secret enforcement
- env-driven CORS config with explicit production origins and Chrome extension origin support
- startup config validator used by `index.ts`
- Demo Composer OpenAPI metadata
- updated `.env-cmdrc.example`, development setup docs, and production readiness checklist

Verification:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server test:db
rtk pnpm check-types
rtk pnpm lint
rtk git diff --check
```
