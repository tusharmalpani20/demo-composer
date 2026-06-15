# Organization Member Invites Plan

Date: 2026-06-15

Status: Planned.

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
- role management UI
- project-level permissions
- hosted signup flow

## Scope

Database:

Create:

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

Portal:

- organization settings or simple members page
- list current members
- invite member by email
- show pending invites
- revoke pending invite
- accept invite page

Acceptance UX:

- if invite recipient already has a user account, require login before accepting
- if invite recipient does not have a user account, allow setting a password during invite acceptance
- after acceptance, create a normal authenticated portal session and send the user to `/projects`
- do not add general public signup in this slice

## Role Model

For v1:

- `owner`: can invite/revoke members and manage organization-level settings
- `member`: can create/edit projects, captures, guides, demos, and publish artifacts

Keep project-level role permissions out of scope unless a concrete need appears.

## Auth Rules

- only owners can create/revoke invites
- invite tokens are one-time use
- expired/revoked/accepted invites cannot be accepted
- accepting an invite creates or links a user and creates `org_user`
- if a logged-in user accepts an invite for a different email, require careful validation or reject for v1
- do not email invites in this first slice unless mail config exists; return/copy invite link in UI
- token must be shown only once at invite creation time
- public invite lookup must not reveal whether unrelated emails already have accounts

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

Web tests:

- members page lists members
- owner can create invite and copy link
- owner can revoke invite
- accept invite page handles valid/invalid/expired tokens
- accept invite page supports new-user password setup
- accept invite page handles existing-user login requirement

## Acceptance Criteria

- owner can invite another person to the organization
- invite link can be copied manually
- invited person can accept and become an org member
- new member can log in and access org projects
- invite tokens are not stored in plaintext
- inviting people does not require SMTP to be configured

## Out Of Scope

- SMTP/email delivery
- SSO
- project-level ACLs
- billing seats
- audit logs beyond basic timestamps
- fine-grained permissions
- open public signup
