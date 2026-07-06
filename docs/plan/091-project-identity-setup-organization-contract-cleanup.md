# Project, Identity, Setup, And Organization Contract Cleanup Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Expanded and rechecked for implementation readiness on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `091` of the shared contracts and domainization track.

## Objective

Centralize the lower-level app shell contracts that are already shared by server, web, and extension, while preserving all existing auth, setup, project, organization, and public instance behavior.

This is a contract cleanup phase, not a feature phase. It should make current project, auth/session, setup, public instance, and organization invite/member payloads reusable through `@repo/types` and `@repo/constants`.

This phase should not create a domain package. The parent master plan allows moving product decisions into domain packages where useful; this child plan evaluates that option and defers it because current project/setup/organization behavior is server-only, permission-heavy, and coupled to authentication/session/persistence side effects. Extracting that behavior belongs in a later domain package phase after shared contracts are clean.

## Baseline From Completed 090

Plan `090` created `@repo/file-domain` and proved the domain package pattern with pure file metadata and screenshot upload policy.

Rules carried forward from `090`:

- Do not create a domain package unless real behavior moves into it.
- Keep auth/session/org-user permission context out of unrelated domain packages.
- Keep framework adapters, cookies, request parsing, SQL implementations, storage adapters, and token handling in `apps/server`.
- Preserve existing route-local error classes and error envelopes when moving contracts.
- Do not touch UI appearance or browser-visible behavior.

`091` has no direct dependency on `@repo/file-domain`. If implementation touches project or organization ownership around files/assets, preserve `@repo/file-domain` as file metadata/upload-policy only.

## Current Codebase Baseline

Relevant current modules:

```text
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/project/project.service.ts
apps/server/src/modules/project/project.repository.ts
apps/server/src/modules/project/project.routes.test.ts
apps/server/src/modules/project/project.service.test.ts
apps/server/src/modules/project/project.db.integration.test.ts
apps/server/src/modules/project/project.app.integration.test.ts
apps/server/src/modules/authentication/session.routes.ts
apps/server/src/modules/authentication/session.service.ts
apps/server/src/modules/authentication/session.repository.ts
apps/server/src/modules/authentication/request-session-token.ts
apps/server/src/modules/authentication/session-cookie.ts
apps/server/src/modules/authentication/session-token.ts
apps/server/src/modules/authentication/session.routes.test.ts
apps/server/src/modules/authentication/session.service.test.ts
apps/server/src/modules/authentication/session.db.integration.test.ts
apps/server/src/modules/authentication/session.app.integration.test.ts
apps/server/src/modules/setup/first-run-setup.routes.ts
apps/server/src/modules/setup/first-run-setup.service.ts
apps/server/src/modules/setup/first-run-setup.repository.ts
apps/server/src/modules/setup/first-run-setup.routes.test.ts
apps/server/src/modules/setup/first-run-setup.service.test.ts
apps/server/src/modules/setup/first-run-setup.db.integration.test.ts
apps/server/src/modules/setup/first-run-setup.app.integration.test.ts
apps/server/src/modules/public-instance/public-instance.routes.ts
apps/server/src/modules/public-instance/public-instance.service.ts
apps/server/src/modules/public-instance/public-instance.config.ts
apps/server/src/modules/public-instance/public-instance.repository.ts
apps/server/src/modules/public-instance/public-instance.integration.test.ts
apps/server/src/modules/organization/organization-invites.routes.ts
apps/server/src/modules/organization/organization-invites.service.ts
apps/server/src/modules/organization/organization-invites.repository.ts
apps/server/src/modules/organization/organization-invites.routes.test.ts
apps/server/src/modules/organization/organization-invites.service.test.ts
apps/server/src/modules/organization/organization-invites.db.integration.test.ts
```

Current shared constants already exist:

```text
packages/constants/src/project.ts
packages/constants/src/organization.ts
packages/constants/src/setup.ts
packages/constants/src/index.ts
packages/constants/src/constants.test.ts
```

Existing constants:

- `PROJECT_STATUSES`: `active`, `archived`
- `ORGANIZATION_ROLES`: `owner`, `member`
- `ORGANIZATION_INVITE_STATUSES`: `pending`, `accepted`, `revoked`, `expired`
- `ORGANIZATION_MEMBER_STATUSES`: `active`, `disabled`
- `DEPLOYMENT_MODES`: `self_hosted`, `hosted`
- `ONBOARDING_MODES`: `first_run_setup`, `signup`

Current shared types already exist:

```text
packages/types/src/project.ts
packages/types/src/setup.ts
packages/types/src/instance.ts
packages/types/src/common.ts
packages/types/src/index.ts
packages/types/src/project.test.ts
packages/types/src/setup.test.ts
packages/types/src/instance.test.ts
```

Existing shared contract coverage:

- Project request, query, response, and DTO schemas already live in `packages/types/src/project.ts`.
- First-run setup request schema and broad response placeholder already live in `packages/types/src/setup.ts`.
- Public instance status response schema already lives in `packages/types/src/instance.ts`.
- `apps/server/src/modules/project/project.routes.ts` already imports project request/query schemas from `@repo/types/project`.
- `apps/server/src/modules/setup/first-run-setup.routes.ts` already imports `FirstRunSetupRequestSchema` from `@repo/types/setup`.
- `apps/server/src/modules/public-instance/public-instance.routes.ts` already uses `PublicInstanceStatusResponse` from `@repo/types/instance`.
- `apps/web/src/features/setup/types.ts` already re-exports `FirstRunSetupInput` from `@repo/types/setup`.
- `apps/web/src/lib/api.ts` already imports `PublicInstanceStatus` from `@repo/types/instance`.
- `apps/extension/src/lib/api.ts` already imports project response types from `@repo/types/project`.

Known duplication and gaps this phase should address:

- Auth/session response types are duplicated in:
  - `apps/server/src/modules/authentication/session.service.ts`
  - `apps/web/src/features/auth/types.ts`
  - `apps/extension/src/lib/api.ts`
- Login request and response contracts are route-local or app-local:
  - `apps/server/src/modules/authentication/session.routes.ts`
  - `apps/web/src/lib/api.ts`
  - `apps/extension/src/lib/api.ts`
- First-run setup response currently uses `auth: z.unknown()` in `packages/types/src/setup.ts`.
- The current first-run setup route response is a setup-specific auth payload:
  - `auth.user` currently has `id` and `email`, but not `display_name`;
  - `auth.session` currently has `id`, but not `session_type` or `expires_at`;
  - this differs from normal authentication session responses and must not be changed in this phase.
- Organization invite/member contracts are app/server-local and duplicated in:
  - `apps/server/src/modules/organization/organization-invites.routes.ts`
  - `apps/server/src/modules/organization/organization-invites.service.ts`
  - `apps/web/src/features/organization/types.ts`
- Organization invite request schemas are route-local in `organization-invites.routes.ts`.

Important current terms:

- **User** is login identity.
- **Organization** is the tenant/workspace.
- **Org User** is the implementation record for Organization Member.
- **Owner** is the organization-scoped role with full control.
- **Instance** is the Demo Composer deployment the extension/apps connect to.
- **First-Run Setup** is for self-hosted initialization.
- **Signup Onboarding** is for hosted registration/invites.

## Required Source Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/plan/089-domain-package-conventions-and-error-mapping.md
docs/plan/090-file-domain-extraction.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0015-user-organization-org-user-identity-model.md
docs/adr/0016-explicit-owner-bootstrap-command.md
docs/adr/0017-deployment-aware-onboarding-mode.md
docs/adr/0018-web-first-run-setup-from-day-one.md
docs/adr/0019-separate-web-and-server-apps.md
docs/adr/0020-domain-package-conventions-and-error-mapping.md
```

Before implementation, run:

```text
rtk git status --short
rtk rg "AuthContext|AuthResponse|LoginResponse|session_token|login_body_schema|FirstRunSetupResponseSchema" apps packages
rtk rg "OrganizationMember|OrganizationInvite|PublicOrganizationInvite|invite_body_schema|accept_invite_body_schema" apps/server/src/modules/organization apps/web/src packages
rtk rg "PROJECT_STATUSES|ORGANIZATION_ROLES|ORGANIZATION_INVITE_STATUSES|ORGANIZATION_MEMBER_STATUSES|DEPLOYMENT_MODES|ONBOARDING_MODES" apps packages
```

Record uncommitted work that touches affected docs, shared packages, auth/session, setup, public instance, organization invite/member, project, web API/types, or extension API/types files. Do not overwrite or revert unrelated work.

## Implementation Scope

Included:

- Add shared auth/session schemas and inferred types to `@repo/types`.
- Replace duplicated web/extension auth response and login response types with imports from `@repo/types`.
- Update server authentication routes to use shared login request/body schemas.
- Tighten first-run setup response schema from `z.unknown()` to a setup-specific shared auth shape that matches the current wire response.
- Add shared organization member/invite/public-invite schemas and inferred types to `@repo/types`.
- Replace duplicated web organization member/invite types with imports from `@repo/types`.
- Update organization invite routes to use shared request schemas.
- Reuse the existing project/setup/instance constants and types; do not recreate them.
- Add shared schema tests for auth and organization.
- Update existing setup schema tests to prove `FirstRunSetupResponseSchema` accepts the real current setup auth shape and rejects unsafe shape drift.
- Preserve existing route URLs, HTTP methods, request body behavior, response body behavior, status codes, and error envelopes.
- Update this plan after implementation with status, checklist, implementation log, verification notes, browser validation notes, and leftovers.
- Update the parent master plan only for completed `091` phase items.

Explicit non-scope:

- No UI redesign, copy changes, layout changes, or visible behavior changes.
- No new onboarding modes, roles, statuses, project statuses, invite statuses, or session types.
- No hosted SaaS signup implementation.
- No extension first-run setup flow.
- No database schema or migration changes.
- No route URL, method, status code, response envelope, or cookie behavior changes.
- No password hashing changes.
- No session token generation, hashing, storage, cookie, bearer-token, or CORS changes.
- No invite token generation or hashing changes.
- No changes to rate limiting.
- No changes to permission rules.
- No broad route response-schema registration unless a route already used that style and the implementation proves serialization behavior is unchanged.
- No creation of `@repo/project-domain`, `@repo/organization-domain`, `@repo/user-domain`, `@repo/auth-domain`, or `@repo/instance-domain` in this phase.
- No movement of repository interfaces, SQL row types, database adapters, auth services, setup services, or organization invite services into shared packages.
- No changes to `@repo/file-domain`.

## Exact Affected Files

Expected shared package changes:

```text
packages/types/src/auth.ts
packages/types/src/auth.test.ts
packages/types/src/organization.ts
packages/types/src/organization.test.ts
packages/types/src/setup.ts
packages/types/src/setup.test.ts
packages/types/src/index.ts
```

Expected server changes:

```text
apps/server/src/modules/authentication/session.routes.ts
apps/server/src/modules/authentication/session.service.ts
apps/server/src/modules/authentication/session.routes.test.ts
apps/server/src/modules/setup/first-run-setup.routes.ts
apps/server/src/modules/setup/first-run-setup.routes.test.ts
apps/server/src/modules/setup/first-run-setup.service.ts
apps/server/src/modules/organization/organization-invites.routes.ts
apps/server/src/modules/organization/organization-invites.routes.test.ts
apps/server/src/modules/organization/organization-invites.service.ts
```

Expected web changes:

```text
apps/web/src/features/auth/types.ts
apps/web/src/features/organization/types.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/auth/LoginPage.test.tsx
apps/web/src/features/setup/FirstRunSetupPage.test.tsx
apps/web/src/features/organization/OrganizationMembersPage.test.tsx
```

Expected extension changes:

```text
apps/extension/src/lib/api.ts
apps/extension/src/lib/api.test.ts
apps/extension/src/App.test.tsx
```

Expected docs changes:

```text
docs/plan/091-project-identity-setup-organization-contract-cleanup.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

Conditional files:

```text
packages/constants/src/organization.ts
packages/constants/src/project.ts
packages/constants/src/setup.ts
packages/constants/src/constants.test.ts
```

Only touch constants files if implementation discovers a currently duplicated constant that already exists but is not exported correctly, or a test needs to cover an existing constant set. Do not add new enum values.

## Routes And API Contracts

The following routes must keep the same external behavior:

```text
GET    /api/v1/public/instance
POST   /api/v1/setup/first-run
GET    /api/v1/authentication/me
POST   /api/v1/authentication/login
POST   /api/v1/authentication/logout
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id
GET    /api/v1/organization/members
GET    /api/v1/organization/invites
POST   /api/v1/organization/invites
DELETE /api/v1/organization/invites/:invite_id
GET    /api/v1/public/invites/:token
POST   /api/v1/public/invites/:token/accept
```

Contracts to centralize or preserve:

- Public instance status is already centralized as `PublicInstanceStatusResponseSchema`; preserve its shape:
  - `deployment_mode`
  - `onboarding_mode`
  - `setup_required`
  - `signup_enabled`
- First-run setup request is already centralized as `FirstRunSetupRequestSchema`; preserve its shape:
  - `owner.email`
  - `owner.password`
  - `owner.first_name?`
  - `owner.last_name?`
  - `organization.name`
- First-run setup response must remain:
  - `{ auth: FirstRunSetupAuthContext }`
  - It must continue setting the web session cookie.
  - It must not expose `session_token` in the JSON response.
- Authentication `GET /me` response must remain:
  - `{ auth: AuthContext }`
- Authentication `POST /login` request must remain:
  - `{ email, password }`
- Authentication `POST /login` response must remain:
  - Web/cookie clients: `{ auth: AuthContext }`
  - Extension clients with `x-demo-composer-client: extension`: `{ auth: AuthContext, session_token: string }`
- Authentication `POST /logout` must remain `204` with no JSON body.
- Organization member/invite responses must remain:
  - `{ members: OrganizationMember[] }`
  - `{ invites: OrganizationInvite[] }`
  - `{ invite: OrganizationInvite, invite_token: string, invite_url: string }`
  - `{ invite: OrganizationInvite }`
  - `{ invite: PublicOrganizationInvite }`
- Invite acceptance response must remain:
  - `{ auth: AuthContext }`
  - It must continue setting the web session cookie.
- Project contracts are already shared. This phase may replace local web aliases with `@repo/types/project` imports, but must not change the project API.

## Schemas And Types To Add Or Update

Add `packages/types/src/auth.ts`:

- `AuthUserSchema`
  - `id: IdSchema`
  - `email: z.string()`
  - `display_name: z.string()`
- `AuthOrganizationSchema`
  - `id: IdSchema`
  - `name: z.string()`
- `AuthOrgUserSchema`
  - `id: IdSchema`
  - `role: z.enum(ORGANIZATION_ROLES)`
- `AuthSessionSchema`
  - `id: IdSchema`
  - `session_type: z.string()`
  - `expires_at: IsoDateTimeStringSchema`
- `AuthContextSchema`
  - `user`
  - `organization`
  - `org_user`
  - `session`
- `AuthResponseSchema`
  - `{ auth: AuthContextSchema }`
- `LoginRequestSchema`
  - `email: z.string().min(1)`
  - `password: z.string().min(1)`
- `LoginResponseSchema`
  - `{ auth: AuthContextSchema }`
- `ExtensionLoginResponseSchema`
  - extends login response with `session_token: z.string().min(1)`
- inferred types:
  - `AuthUser`
  - `AuthOrganization`
  - `AuthOrgUser`
  - `AuthSession`
  - `AuthContext`
  - `AuthResponse`
  - `LoginRequest`
  - `LoginResponse`
  - `ExtensionLoginResponse`

Update `packages/types/src/setup.ts`:

- Add `FirstRunSetupAuthContextSchema` that matches the current setup route response:
  - `user.id: IdSchema`
  - `user.email: z.string()`
  - no `user.display_name`
  - `organization.id: IdSchema`
  - `organization.name: z.string()`
  - `org_user.id: IdSchema`
  - `org_user.role: z.literal("owner")`, because first-run setup only creates the initial owner
  - `session.id: IdSchema`
  - no `session.session_type`
  - no `session.expires_at`
- Define `FirstRunSetupResponseSchema` as `{ auth: FirstRunSetupAuthContextSchema }`.
- Export `FirstRunSetupAuthContext`.
- Preserve `FirstRunSetupRequestSchema`.
- Do not add password-strength rules to the shared schema. Password strength remains server behavior in `first-run-setup.service.ts`.

Add `packages/types/src/organization.ts`:

- `OrganizationMemberSchema`
  - `id: IdSchema`
  - `organization_id: IdSchema`
  - `user_id: IdSchema`
  - `email: z.string()`
  - `display_name: z.string()`
  - `role: z.enum(ORGANIZATION_ROLES)`
  - `status: z.enum(ORGANIZATION_MEMBER_STATUSES)`
  - `created_at: IsoDateTimeStringSchema`
  - no `updated_at`, because the current server member response does not include it.
- `OrganizationInviteSchema`
  - `id: IdSchema`
  - `organization_id: IdSchema`
  - `email: z.string()`
  - `role: z.enum(ORGANIZATION_ROLES)`
  - `status: z.enum(ORGANIZATION_INVITE_STATUSES)`
  - `expires_at: IsoDateTimeStringSchema`
  - `accepted_at: IsoDateTimeStringSchema.nullable()`
  - `accepted_user_id: IdSchema.nullable()`
  - `created_by_id: IdSchema`
  - `updated_by_id: IdSchema`
  - `created_at: IsoDateTimeStringSchema`
  - `updated_at: IsoDateTimeStringSchema`
- `PublicOrganizationInviteSchema`
  - `id: IdSchema`
  - `organization_name: z.string()`
  - `email: z.string()`
  - `role: z.enum(ORGANIZATION_ROLES)`
  - `status: z.enum(ORGANIZATION_INVITE_STATUSES)`
  - `expires_at: IsoDateTimeStringSchema`
  - `requires_login: z.boolean()`
- request schemas:
  - `CreateOrganizationInviteRequestSchema` with `email: z.string().trim().email()`, `role: z.enum(ORGANIZATION_ROLES).optional()`, and `.passthrough()` to preserve current route behavior.
  - `AcceptOrganizationInviteRequestSchema` with `password: z.string().optional()`, `display_name: z.string().nullable().optional()`, and `.passthrough()` to preserve current route behavior.
- response schemas:
  - `OrganizationMemberListResponseSchema`
  - `OrganizationInviteListResponseSchema`
  - `OrganizationInviteCreateResponseSchema`
  - `OrganizationInviteUpdateResponseSchema`
  - `PublicOrganizationInviteResponseSchema`
  - `AcceptOrganizationInviteResponseSchema`, aliasing `AuthResponseSchema`
- inferred types matching current web/server names where possible:
  - `OrganizationMember`
  - `OrganizationInvite`
  - `PublicOrganizationInvite`
  - `OrganizationMemberListResponse`
  - `OrganizationInviteListResponse`
  - `OrganizationInviteCreateInput`
  - `OrganizationInviteCreateResponse`
  - `OrganizationInviteUpdateResponse`
  - `PublicOrganizationInviteResponse`
  - `AcceptOrganizationInviteInput`
  - `AcceptOrganizationInviteResponse`

Update `packages/types/src/index.ts`:

- Export `./auth`.
- Export `./organization`.

## Behavior Rules

Project behavior:

- `GET /api/v1/projects` must still default to active projects when no `status` query is provided.
- Project create/update normalization stays in `apps/server/src/modules/project/project.service.ts`.
- Empty project update still returns `400` with `empty_project_update`.
- Project not found still returns `404` with `project_not_found`.
- Name/slug conflicts still return `409`.

Public instance behavior:

- `first_run_setup` mode computes `setup_required` from owner existence.
- `signup` mode sets `signup_enabled: true`.
- Existing environment parsing and config defaults stay in `apps/server/src/modules/public-instance/public-instance.config.ts`.

First-run setup behavior:

- Only available when public instance onboarding mode is `first_run_setup`.
- Owner password safety checks remain service-only.
- First-run setup remains blocked after an owner exists.
- The service must still double-check owner existence inside the transaction.
- Successful setup creates User, Organization, owner Org User, and Session in one transaction.
- Successful setup still sets the web session cookie.

Authentication behavior:

- `GET /me` still accepts cookie or bearer token through `session_token_from_request`.
- `POST /login` still normalizes email in the service.
- Invalid credentials still return `401` with `invalid_credentials`.
- Missing/invalid sessions still return `401` with `unauthenticated`.
- Web login response must not include `session_token`.
- Extension login response must include `session_token` only when `x-demo-composer-client: extension` is present.
- Logout remains idempotent for missing session tokens.

Organization behavior:

- Only organization owners can list members, list invites, create invites, and revoke invites.
- Invite emails are still normalized in the service.
- New invites still default to role `member`.
- Duplicate active invites still return `409`.
- Public invite lookup still does not require auth.
- Existing users must sign in before accepting an invite.
- Signed-in user email must match invite email.
- Accepted, revoked, and expired invites preserve existing error statuses and types.
- Successful invite acceptance still creates or reuses the User, creates or reuses Org User, marks the invite accepted, creates a session, sets the web cookie, and returns `{ auth }`.

## Security And Permission Rules

- Do not expose password hashes, token hashes, invite token hashes, raw cookie options, secret material, or repository rows through `@repo/types`.
- Do not put `session_token` on `AuthContextSchema` or generic `AuthResponseSchema`.
- Only `ExtensionLoginResponseSchema` may include `session_token`.
- Do not change `web_session_cookie_name`, cookie options, or cookie setting/clearing behavior.
- Do not change bearer token parsing rules or the `x-demo-composer-client: extension` gate for returning session tokens.
- Do not move password hashing or comparison to shared packages.
- Do not move `generate_session_token`, `hash_session_token`, invite token generation, or invite token hashing to shared packages.
- Do not loosen owner-only organization invite permissions.
- Do not expose public invite tokens in shared invite DTOs beyond the existing create-invite response `invite_token` for owner-only route responses.
- Do not allow frontend/extension code to infer permissions from role constants alone; server remains authoritative for permissions.

## Migration And Backwards Compatibility Notes

- No database migrations are expected.
- No data backfill is expected.
- No API route URL changes are allowed.
- No response envelope changes are allowed.
- Shared schemas must accept the current production/test payloads before server or client imports are switched.
- If a stricter shared schema would reject an existing response shape, update the schema to match current behavior or document and stop; do not silently change route behavior.
- If adding a route schema to Fastify would serialize, strip, or otherwise alter a response, do not add that route response schema in this phase.
- Keep `.passthrough()` on shared request schemas where the current route-local schema used `.passthrough()`.
- Keep global Fastify/Zod validation error behavior unchanged.
- Existing clients that use cookies for web auth and bearer tokens for extension auth must remain compatible.

## Implementation Steps

1. Recheck current state.
   - Run the discovery commands.
   - Confirm no uncommitted work conflicts with shared types/constants, auth/session, setup, project, organization, web API/types, or extension API/types.
   - Inspect current route tests before editing to capture existing behavior.

2. Add shared auth contracts.
   - Create `packages/types/src/auth.ts`.
   - Add `packages/types/src/auth.test.ts`.
   - Cover valid `AuthResponse`, valid web login response, valid extension login response, invalid missing `display_name`, invalid missing `session_token` for extension login, and ensure generic auth response has no `session_token`.
   - Export auth contracts from `packages/types/src/index.ts`.

3. Update setup contracts to use a setup-specific auth contract.
   - Update `packages/types/src/setup.ts`.
   - Update `packages/types/src/setup.test.ts` so `FirstRunSetupResponseSchema` parses the real current setup auth shape, not `z.unknown()`.
   - Add a regression assertion that `FirstRunSetupResponseSchema` does not require normal login-only fields such as `auth.user.display_name` or `auth.session.expires_at`.
   - Preserve request schema behavior.

4. Add shared organization contracts.
   - Create `packages/types/src/organization.ts`.
   - Add `packages/types/src/organization.test.ts`.
   - Test current member list, invite list, create invite, revoke invite, public invite, and accept invite response shapes.
   - Test invalid role/status rejection and invite email trimming.
   - Export organization contracts from `packages/types/src/index.ts`.

5. Wire server auth routes to shared auth schemas and types.
   - Replace route-local `login_body_schema` in `session.routes.ts` with `LoginRequestSchema`.
   - Import route body type from `@repo/types/auth`.
   - Keep response-building logic unchanged, especially extension-only `session_token`.
   - Consider importing `AuthContext` type from `@repo/types/auth` into `session.service.ts` only if it does not create friction with repository/service internals. The repository `LoginIdentity` type remains server-local because it includes `password_hash`.

6. Wire server setup routes/services to shared first-run setup response types where safe.
   - Keep service behavior unchanged.
   - Type route service result with `FirstRunSetupAuthContext` or `FirstRunSetupResponse` only if it matches the current wire response exactly.
   - Do not move password safety rules.

7. Wire server organization routes to shared organization schemas and types.
   - Replace route-local invite body schemas with `CreateOrganizationInviteRequestSchema` and `AcceptOrganizationInviteRequestSchema`.
   - Use shared request/response types where they match service outputs.
   - Keep invite service behavior and error mapping unchanged.
   - Keep `OrganizationInviteAuth` server-local because it includes actor permission context.

8. Replace web duplicated types with shared imports.
   - Update `apps/web/src/features/auth/types.ts` to re-export `AuthContext` and `AuthResponse` from `@repo/types/auth`.
   - Update `apps/web/src/features/organization/types.ts` to re-export organization DTO/input/response types from `@repo/types/organization`.
   - Update `apps/web/src/lib/api.ts` to use `FirstRunSetupInput`, `FirstRunSetupResponse`, `AuthResponse`, `LoginRequest`, organization shared types, and existing project/instance shared types where this can be done without changing function signatures.
   - Update `FirstRunSetupPage` dependency types from `AuthResponse` to `FirstRunSetupResponse` only if needed; the page should still navigate the same way and not render auth details.
   - Keep API client error mapping unchanged.

9. Replace extension duplicated auth types with shared imports.
   - Update `apps/extension/src/lib/api.ts` to import/re-export `AuthResponse`, `ExtensionLoginResponse`, `LoginRequest`, and existing project shared types.
   - Keep `x-demo-composer-client: extension` header behavior unchanged.
   - Keep extension storage and settings types unchanged unless they reference auth response DTOs directly.

10. Run focused verification.
    - Run shared package tests/typechecks first.
    - Run server route/service tests for touched modules.
    - Run web and extension typechecks/tests.
    - Run workspace typecheck.
    - Run browser validation only if implementation changes runtime browser behavior or rendered components.

11. Update docs.
    - Update this plan with status, checklist, implementation log, verification notes, browser validation notes, and leftovers.
    - Update the parent master plan only to mark completed `091` items and verification.

## Test And Verification Plan

Shared package checks:

```text
rtk pnpm --filter @repo/types test
rtk pnpm --filter @repo/types lint
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter @repo/types build
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/constants lint
rtk pnpm --filter @repo/constants build
```

Focused server checks:

```text
rtk pnpm --filter server test -- session.routes session.service first-run-setup.routes first-run-setup.service public-instance organization-invites.routes organization-invites.service project.routes project.service
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
```

Focused client checks:

```text
rtk pnpm --filter web test -- api LoginPage FirstRunSetupPage OrganizationMembersPage
rtk pnpm --filter web check-types
rtk pnpm --filter web lint
rtk pnpm --filter extension test -- api App
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
```

Workspace checks:

```text
rtk pnpm check-types
rtk git diff --check
```

Database-backed verification is not required if implementation only changes contracts/imports and route-local schemas. If service behavior, repository behavior, transaction flow, or persistence-facing types are touched, run DB verification after resetting the testing DB as documented in prior plans:

```text
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:setup
rtk pnpm --filter server test:db -- src/modules/setup/first-run-setup.db.integration.test.ts src/modules/authentication/session.db.integration.test.ts src/modules/project/project.db.integration.test.ts src/modules/organization/organization-invites.db.integration.test.ts
```

If the DB environment is unavailable, do not fake success. Record the exact failure and leave DB verification as a leftover.

## Agent-Browser Validation Requirements

This phase should not include browser validation by default because it is intended to change TypeScript imports and shared schemas without changing rendered UI or runtime browser behavior.

Use `agent-browser` only if implementation changes runtime browser behavior, fetch paths, auth/setup/invite control flow, or rendered components.

If browser validation becomes required, validate at minimum:

- Web first-run setup route still renders and submits successfully against a running local API.
- Web login route still logs in and reaches the project list.
- Web organization members/invites page still lists members/invites, creates an invite, and can revoke an invite.
- Public invite route still renders invite state and accepts an invite.
- Extension popup still connects to an instance, logs in through the extension client header path, receives `session_token`, and lists projects.

Do not make visual assertions beyond confirming behavior remains stable and there are no obvious runtime errors.

## Acceptance Criteria

- `@repo/types` exports auth/session schemas and types used by server, web, and extension.
- `@repo/types` exports organization member/invite schemas and types used by server and web.
- `FirstRunSetupResponseSchema` no longer uses `z.unknown()` for `auth`; it uses a setup-specific shared auth response shape that matches the current setup route.
- Project/setup/instance contracts continue using existing shared packages without duplication.
- Existing constants remain canonical and unchanged.
- Existing routes, request shapes, response shapes, cookies, status codes, and error envelopes remain compatible.
- Web login responses still do not expose `session_token`.
- Extension login responses still expose `session_token` only for extension client requests.
- Owner Bootstrap and Web First-Run Setup rules remain intact.
- Organization invite owner-only permissions remain intact.
- No auth-sensitive implementation details are exported from shared packages.
- No new domain package is created in this phase.
- No UI behavior or visible copy changes are introduced.

## Completion Checklist

- [ ] Worktree checked before implementation.
- [ ] Discovery searches run.
- [ ] Shared auth contracts added and tested.
- [ ] Shared setup response contract updated to use a setup-specific auth contract.
- [ ] Shared organization contracts added and tested.
- [ ] Server auth route uses shared login request schema.
- [ ] Server setup route/service types use shared first-run setup response types where safe.
- [ ] Server organization route uses shared invite request schemas.
- [ ] Web auth and organization local type duplication replaced with shared imports.
- [ ] Extension auth local type duplication replaced with shared imports.
- [ ] Project/setup/instance existing shared contracts preserved.
- [ ] No password/token/cookie/rate-limit behavior changed.
- [ ] No database migration added.
- [ ] No UI behavior changed.
- [ ] Focused verification completed.
- [ ] Browser validation completed or explicitly documented as not required.

## Handoff Notes

- Keep changes small and mechanical after schemas are added. The highest-risk part is accidentally changing auth response behavior, especially `session_token` exposure.
- Prefer adding shared schemas first, then replacing imports in one surface at a time.
- Preserve current `.passthrough()` behavior for organization invite request bodies.
- Treat `AuthContext` as a public safe DTO only because it excludes password hashes and token hashes. Keep login identities and persistence rows server-local.
- Treat `OrganizationInviteAuth` as server-local permission context. Do not export it from `@repo/types`.
- If actual server organization member rows differ from the current web type, make the shared schema match the real route response and update web types accordingly without changing rendered behavior.
- If implementation reveals a need for project/organization/setup domain packages, stop and update this plan instead of creating them mechanically.

## Final Output Required

When executing this plan, report:

- files changed;
- schemas/types added or updated;
- routes updated to consume shared schemas;
- explicit confirmation that auth cookie/session/token behavior did not change;
- explicit confirmation that no UI behavior changed;
- verification commands run and results;
- browser validation result or reason it was not required;
- leftovers for `092-capture-domain-extraction.md`.
