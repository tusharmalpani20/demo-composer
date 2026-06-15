# Production Hardening V1 Plan

Date: 2026-06-15

Status: Planned.

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
- config validation summary
- backup/restore documentation
- storage cleanup/retention guidance
- stronger public/auth abuse protections
- basic operational logging guidance
- dependency/security audit guidance

## Scope

Backend runtime:

- add `/api/v1/health` or `/healthz` endpoint
- separate liveness from readiness if the readiness check touches the database
- add startup config validation for production-critical environment variables
- add rate limits for:
  - login
  - first-run setup
  - public password verification
  - invite acceptance if plan 065 has landed
  - public guide/demo resolution if needed
- review multipart upload limits and enforce configured size consistently
- ensure error responses do not leak internals
- set and document request body limits for JSON routes

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

Testing/CI:

- add tests for health/config behavior
- add tests for rate limits
- keep DB integration in CI
- avoid adding external service dependencies

## Recommended Implementation Order

1. Add health endpoint and tests.
2. Add production config validation tests.
3. Add rate limiting plugin/config and focused route tests.
4. Update production readiness docs.
5. Add backup/restore docs.
6. Add dependency/security review docs or CI step if stable.
7. Re-run full verification.

## Acceptance Criteria

- production startup fails early for unsafe critical config
- health endpoint exists for reverse proxies and uptime checks
- auth/public password/setup endpoints have basic abuse protection
- docs explain backup and restore for DB plus local storage
- production checklist covers the new hardening items
- full test/type/lint/build suite passes
- hardening does not require one-command self-host packaging

## Out Of Scope

- one-command self-host setup
- Kubernetes manifests
- Terraform
- managed object storage implementation
- multi-region deployment
- external observability stack
- enterprise audit logging
