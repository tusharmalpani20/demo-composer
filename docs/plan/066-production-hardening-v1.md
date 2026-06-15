# Production Hardening V1 Plan

Date: 2026-06-15

Status: Completed.

## Goal

Close the operational gaps that remain before calling Demo Composer a serious v1 for self-hosted/internal use.

This plan intentionally excludes one-command self-host packaging because that has been deferred by product decision. It focuses on runtime safety and confidence.

## Current Baseline

Already built:

- production CORS config guard
- production cookie secret guard
- first-run setup config guard
- AGPL license
- README, contributing, security docs
- CI
- self-hosting quickstart
- production readiness checklist
- DB integration tests

Still needed:

- rate limiting
- health/readiness endpoint
- config validation summary for request/upload/rate-limit settings
- backup/restore documentation
- storage cleanup/retention guidance
- stronger public/auth abuse protections
- basic operational logging guidance
- dependency/security audit guidance

## Scope

Backend runtime:

- add `GET /healthz` for liveness with no database dependency
- add `GET /readyz` for readiness with a database ping
- readiness response should report stable high-level component status only, not credentials or internal DSNs
- add startup config validation for production-critical request/upload/rate-limit environment variables
- add rate limits for:
  - `POST /api/v1/authentication/login`
  - `POST /api/v1/setup/first-run`
  - `POST /api/v1/public/publish-links/:slug/viewer-sessions`
  - `POST /api/v1/public/invites/:token/accept`
  - public guide/demo resolution only if the implementation stays low-risk
- review multipart upload limits and enforce configured size consistently
- ensure error responses do not leak internals
- set and document request body limits for JSON routes through `DEMO_COMPOSER_JSON_BODY_LIMIT_BYTES`
- keep upload limits controlled through `DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES`
- add a small local in-memory limiter for this v1 slice; avoid external stores or Redis

Storage/operations:

- document backup/restore for PostgreSQL and local storage
- document storage directory permissions
- document migration workflow for upgrades
- document reverse proxy headers and HTTPS assumptions
- document extension CORS origin setup
- document how to rotate `COOKIE_SECRET` and expected session impact
- document how to rotate extension/session tokens by logging out sessions

Security:

- confirm auth cookies are secure/httpOnly in production
- confirm bearer extension token behavior is documented
- confirm public asset access is snapshot-scoped
- add basic brute-force protection tests where rate limiting is introduced
- add `pnpm audit` or documented dependency review guidance, even if not mandatory in CI yet
- do not log submitted passwords, invite tokens, public viewer passwords, cookie values, or bearer tokens

Testing/CI:

- add tests for health/config behavior
- add tests for rate limits
- keep DB integration in CI
- avoid adding external service dependencies
- keep rate-limit tests deterministic by injecting limiter options where needed

## Recommended Implementation Order

1. Add health/readiness tests.
2. Implement health/readiness routes.
3. Add request limit and rate-limit config tests.
4. Implement startup validation for the new numeric config.
5. Add route-level rate-limit tests.
6. Implement in-memory rate limiting for login, first-run setup, public password unlock, and invite acceptance.
7. Update production readiness, self-hosting, backup/restore, and security review docs.
8. Re-run full verification.

## Acceptance Criteria

- production startup fails early for unsafe critical config
- health endpoint exists for reverse proxies and uptime checks
- readiness endpoint can fail when the database is unavailable without breaking liveness
- auth/public password/setup endpoints have basic abuse protection
- invite acceptance has basic abuse protection
- JSON and screenshot upload limits are configurable and documented
- docs explain backup and restore for DB plus local storage
- docs explain storage permissions, retention cleanup expectations, reverse proxy headers, HTTPS, token/cookie rotation, and dependency review
- production checklist covers the new hardening items
- full test/type/lint/build suite passes
- hardening does not require one-command self-host packaging

## Implementation Notes

Completed in this slice:

- added `GET /healthz` liveness endpoint
- added `GET /readyz` readiness endpoint with database ping and sanitized failure response
- added `DEMO_COMPOSER_JSON_BODY_LIMIT_BYTES` for JSON body size limits
- centralized numeric hardening config validation for JSON body size, screenshot upload size, rate-limit max attempts, and rate-limit window
- added local in-memory rate limiting for login, first-run setup, public password unlock, and invite acceptance
- preserved Fastify parser 4xx statuses instead of converting body/parser failures into generic 500 responses
- updated env example, self-hosting docs, production readiness checklist, and operations docs

Deferred intentionally:

- distributed rate limiting
- Redis or external limiter stores
- automated storage retention cleanup
- mandatory dependency audit in CI

## Verification

Run on 2026-06-15:

```bash
pnpm --filter server test -- src/app.test.ts src/config/startup.config.test.ts
pnpm --filter server test
pnpm --filter server check-types
pnpm --filter server lint
pnpm --filter server build
pnpm --filter server test:db
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

Note: the first full `web test` run had a transient `App.test.tsx` timing failure. `App.test.tsx` passed in isolation immediately after, and the full `web test` suite passed on rerun without code changes.

## Out Of Scope

- one-command self-host setup
- Kubernetes manifests
- Terraform
- managed object storage implementation
- multi-region deployment
- external observability stack
- enterprise audit logging
- distributed rate limiting
- Redis or external limiter stores
