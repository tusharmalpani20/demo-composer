# Backend Route Inventory

Date: 2026-06-13

## Purpose

This document records the backend route surface after the project health hardening pass. It exists so future backend work lands in the current Demo Composer modules instead of the removed legacy ORCA-style module tree.

## Current Runtime Path

The active Fastify app is built in:

```text
apps/server/src/app.ts
```

The current product backend path is:

```text
apps/server/src/modules/*
```

These modules are mounted under `/api/v1`:

| Area | Prefix | Source |
| --- | --- | --- |
| public instance status | `/api/v1/public` | `modules/public-instance` |
| first-run setup | `/api/v1/setup` | `modules/setup` |
| authentication session | `/api/v1/authentication` | `modules/authentication` |
| projects | `/api/v1/projects` | `modules/project` |
| capture sessions | `/api/v1/projects` | `modules/capture-session` |
| capture assets | `/api/v1/projects` | `modules/capture-asset` |
| capture events | `/api/v1/projects` | `modules/capture-event` |
| guides | `/api/v1/projects` | `modules/guide` |
| guide publishing | `/api/v1/projects` and `/api/v1/public` | `modules/publish` |

The current authentication model is cookie-backed session auth from `modules/authentication`. Project, capture, guide, and publish routes receive auth context by reading the `demo_composer_session` cookie through the current authentication session service.

## Removed Legacy Runtime Wiring

The hardening pass removed active registration for the older route tree:

```text
apps/server/src/root_router/*
apps/server/src/module/*
apps/server/src/config/passport.config.ts
```

That tree previously exposed ORCA-shaped endpoints under `/api/v1`, including:

| Removed surface | Notes |
| --- | --- |
| `/api/v1/authentication/signin/password` | Replaced by `/api/v1/authentication/login`. |
| `/api/v1/authentication/signup/email` | Not part of the accepted MVP; first-run setup and deployment-aware signup remain separate decisions. |
| `/api/v1/authentication/signup/email/verify-otp` | OTP signup remains out of scope. |
| `/api/v1/user/asset/profile-picture/:user_id` | Not part of the current Demo Composer product path. |
| `/api/v1/organization/role/*` | Replaced by future organization/member domain planning, not active MVP behavior. |
| `/api/v1/contact/*` | Not part of the Demo Composer capture-to-guide loop. |

The hardening pass added an app integration regression proving the old authentication route is no longer mounted.

## Current Backend Boundary

New backend work should follow this shape:

```text
apps/server/src/modules/<domain>/<domain>.routes.ts
apps/server/src/modules/<domain>/<domain>.service.ts
apps/server/src/modules/<domain>/<domain>.repository.ts
apps/server/src/modules/<domain>/<domain>.*.test.ts
```

Avoid adding new code under:

```text
apps/server/src/module/*
apps/server/src/root_router/*
```

Those paths were removed because they were legacy runtime wiring, created lint noise, and duplicated newer domain modules.
