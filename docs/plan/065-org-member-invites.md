# Organization Member Invites Plan

Date: 2026-06-15

Status: Completed.

## Goal

Add the smallest collaboration layer needed for internal teams:

```text
owner invites teammate
  -> teammate accepts invite
  -> teammate becomes org_user
  -> teammate can use projects/captures/guides/demos
```

This should stay narrow. Do not build a full enterprise permission system yet.

## Current Baseline

Already built:

- user
- organization
- org_user
- owner first-run setup
- login/logout/current session
- org/project scoped backend behavior

Missing:

- invite table
- invite creation API
- invite acceptance API
- member list UI
- project-level permissions
- hosted signup flow

## Scope

Database:

Create migration:

```text
014_org_member_invites.sql
```

Create table:

```text
organization_schema.org_invite
```

Recommended fields:

```text
id
organization_id
email
role owner | member
token_hash
status pending | accepted | revoked | expired
expires_at
accepted_at nullable
accepted_user_id nullable
created_by_id
updated_by_id
created_at
updated_at
```

Constraints and indexes:

- `role` is constrained to `owner | member`
- `status` is constrained to `pending | accepted | revoked | expired`
- `token_hash` is unique and never returned by API responses
- active duplicate invites for the same organization/email should be blocked with a validation error
- email comparison should use normalized lowercase email
- foreign keys should reference `organization_schema.organization`, `organization_schema.org_user`, and `user_schema.user`

Backend APIs:

Authenticated owner routes:

```http
GET /api/v1/organization/members
POST /api/v1/organization/invites
GET /api/v1/organization/invites
DELETE /api/v1/organization/invites/:invite_id
```

Public invite routes:

```http
GET /api/v1/public/invites/:token
POST /api/v1/public/invites/:token/accept
```

Implementation details:

- generate invite tokens with crypto-safe random bytes
- store only a SHA-256 token hash, not the plaintext token
- return the plaintext invite URL only from the create-invite response
- use the existing password hashing helper used by setup/auth
- use the existing auth session cookie helper after successful acceptance
- all authenticated organization routes should derive organization/user from the current session cookie, not request body

Portal:

- organization settings or simple members page
- list current members
- invite member by email
- show pending invites
- revoke pending invite
- accept invite page
- add route parsing for `/organization/members` and `/invites/:token`
- add navigation entry only if it fits the existing portal shell; otherwise make the page directly routable for this slice

Acceptance UX:

- if invite recipient already has a user account, require login before accepting
- if invite recipient does not have a user account, allow setting a password during invite acceptance
- after acceptance, create a normal authenticated portal session and send the user to `/projects`
- do not add general public signup in this slice
- public lookup should tell the UI whether login is required for the invite email without exposing broader account enumeration

## Role Model

For v1:

- `owner`: can invite/revoke members and manage organization-level settings
- `member`: can create/edit projects, captures, guides, demos, and publish artifacts

Keep project-level role permissions out of scope unless a concrete need appears.

Do not add owner/member enforcement to project/capture/guide/demo operations in this slice. Existing org-scoped access remains unchanged for members.

## Auth Rules

- only owners can create/revoke invites
- invite tokens are one-time use
- expired/revoked/accepted invites cannot be accepted
- accepting an invite creates or links a user and creates `org_user`
- if a logged-in user accepts an invite for a different email, require careful validation or reject for v1
- do not email invites in this first slice unless mail config exists; return/copy invite link in UI
- token must be shown only once at invite creation time
- public invite lookup must not reveal whether unrelated emails already have accounts
- revoked invites should keep their row for traceability and set `status = revoked`
- expired invites may be marked `expired` lazily when looked up or accepted

## Tests

Backend tests:

- owner can list members
- owner can create invite
- member cannot create invite
- invite token is hashed at rest
- public invite lookup returns safe invite metadata
- accepting invite creates org_user
- accepting invite for a new user creates user with password hash
- accepting invite for an existing user requires the correct logged-in user
- accepting expired/revoked/accepted invite fails
- duplicate active invite is handled predictably
- invite lookup response does not expose token hash or account existence
- app composition wires the organization invite routes with the real repository/service

Web tests:

- members page lists members
- owner can create invite and copy link
- owner can revoke invite
- accept invite page handles valid/invalid/expired tokens
- accept invite page supports new-user password setup
- accept invite page handles existing-user login requirement
- routes are parsed for members and invite acceptance pages

## Acceptance Criteria

- owner can invite another person to the organization
- invite link can be copied manually
- invited person can accept and become an org member
- new member can log in and access org projects
- invite tokens are not stored in plaintext
- inviting people does not require SMTP to be configured
- owner/member roles are stored on `org_user`, but role editing is deferred

## Implementation Notes

Completed in this slice:

- added `organization_schema.org_invite` with hashed invite tokens, role/status constraints, and pending duplicate protection
- added owner-only organization member and invite APIs
- added public invite lookup and invite acceptance APIs
- invite acceptance creates a user when needed, links `org_user`, issues a web session cookie, and rejects mismatched existing users
- added `/organization/members` portal page for listing members, creating one-time invite links, copying the invite link, and revoking pending invites
- added `/invites/:token` public page for accepting invites as a new user or after signing in as an existing user
- added route parsing and API client helpers for the organization invite workflow

Deferred intentionally:

- SMTP/email delivery
- role editing UI
- project-level ACL enforcement
- hosted public signup
- global portal navigation entry for organization settings

## Verification

Run on 2026-06-15:

```bash
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
pnpm --filter server test
pnpm --filter server check-types
pnpm --filter server lint
pnpm --filter server test:db
```

## Out Of Scope

- SMTP/email delivery
- SSO
- project-level ACLs
- billing seats
- audit logs beyond basic timestamps
- fine-grained permissions
- open public signup
