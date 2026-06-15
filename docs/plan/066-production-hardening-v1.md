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

## Scope

Backend runtime:

- add `/api/v1/health` or `/healthz` endpoint
- add startup config validation for production-critical environment variables
- add rate limits for:
  - login
  - first-run setup
  - public password verification
  - public guide/demo resolution if needed
- review multipart upload limits and enforce configured size consistently
- ensure error responses do not leak internals

Storage/operations:

- document backup/restore for PostgreSQL and local storage
- document storage directory permissions
- document migration workflow for upgrades
- document reverse proxy headers and HTTPS assumptions
- document extension CORS origin setup

Security:

- confirm auth cookies are secure/httpOnly in production
- confirm bearer extension token behavior is documented
- confirm public asset access is snapshot-scoped
- add basic brute-force protection tests where rate limiting is introduced

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
6. Re-run full verification.

## Acceptance Criteria

- production startup fails early for unsafe critical config
- health endpoint exists for reverse proxies and uptime checks
- auth/public password/setup endpoints have basic abuse protection
- docs explain backup and restore for DB plus local storage
- production checklist covers the new hardening items
- full test/type/lint/build suite passes

## Out Of Scope

- one-command self-host setup
- Kubernetes manifests
- Terraform
- managed object storage implementation
- multi-region deployment
- external observability stack
- enterprise audit logging
