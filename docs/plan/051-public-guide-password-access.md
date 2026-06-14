# Public Guide Password Access Plan

Date: 2026-06-14

Status: Implemented.

## Goal

Add password-protected access for published guide links so a team can share a guide without making it fully anonymous-public.

Target flow:

```text
authenticated portal user
  -> opens /projects/:project_id/guides/:guide_id
  -> publishes or opens an already published guide
  -> enables password protection in the publishing panel
  -> sets a password for the active publish link
  -> sends /p/:slug or iframe embed code to a viewer
  -> viewer opens /p/:slug or /p/:slug/embed
  -> public reader shows a password gate
  -> viewer enters the password
  -> server creates a short-lived viewer session for that publish link
  -> reader loads the same immutable published guide snapshot
  -> public asset streaming requires the same viewer session for protected links
```

This extends the existing publish/public-reader/embed loop without adding analytics, lead capture, organization-member public readers, or the interactive demo product.

## Why This Comes Next

The current product can:

- create guides from capture sessions
- edit and preview guides
- publish immutable guide snapshots
- keep stable public slugs across republish
- restrict or expire active links
- open public guides at `/p/:slug`
- embed public guides at `/p/:slug/embed`
- copy public URLs and iframe snippets from the guide editor

The remaining sharing gap is controlled external access. Right now, an active guide link is either:

- public to anyone with the URL
- restricted/off
- expired
- revoked

Password protection gives a useful middle ground for internal documentation, customer handoffs, and early sales/demo sharing without building full account-based public viewer sessions yet.

This should come before analytics because analytics should observe an access model that already knows the difference between anonymous public views and password-authorized views. It should also come before richer sales features because sales sharing usually needs access control before tracking.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0011-privacy-preserving-capture-defaults.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/031-guide-publish-foundation.md
docs/plan/032-public-guide-reader.md
docs/plan/033-portal-guide-publish-controls.md
docs/plan/034-guide-publish-controls-polish.md
docs/plan/046-public-guide-access-controls.md
docs/plan/050-public-guide-embed-foundation.md
```

Important implications:

- published guide links continue to resolve immutable snapshots, not mutable drafts
- republish keeps the active slug and password settings unless explicitly changed
- revoke still invalidates the active link
- expiry still blocks public access even if a viewer has a valid password session
- restricted links remain inaccessible to anonymous public readers, even with a password
- public asset file reads must enforce the same password/session gate as public guide reads
- password hashes and viewer session token hashes must never be exposed in API responses
- use DB migrations as the source of truth
- use the existing Fastify REST/Zod-ish local route style
- use TDD for backend and web behavior

## Current State

Already implemented:

- `publish_schema.publish_link` stores active/revoked publish links with:
  - `visibility: public | restricted`
  - `expires_at`
  - stable slug
  - published artifact target
- authenticated publish status reads expose publish link state to the portal
- authenticated access updates can switch public access on/off and set/clear expiry
- public reader resolves active accessible links through:

```http
GET /api/v1/public/publish-links/:slug
```

- public asset streaming uses:

```http
GET /api/v1/public/publish-links/:slug/assets/:asset_id/file
```

- public guide page route exists:

```text
/p/:slug
```

- public guide embed route exists:

```text
/p/:slug/embed
```

- public reader maps missing/revoked, restricted, expired, malformed, and unknown failures to stable states
- guide editor publish panel can publish, republish, revoke, copy URL, copy embed code, set access mode, and set/clear expiry

Known gaps:

- publish links cannot be password-protected
- authenticated publish status cannot tell the portal whether a link has a password
- public reader has no password gate
- there is no public viewer session table or cookie
- public asset streaming cannot distinguish a password-authorized viewer from an anonymous request
- no tests cover password-protected public links or password-protected embeds

## Scope

Included:

- extend publish-link persistence with password protection metadata
- store password hashes only, never raw passwords
- add short-lived public viewer sessions scoped to one publish link
- add public endpoint to create a viewer session by submitting a password
- update public guide resolution to return `password_required` until the viewer is authorized
- update public asset streaming to require viewer authorization for password-protected links
- expose `password_protected: boolean` in authenticated publish status and publish-link responses
- add authenticated portal controls to enable, update, and clear the publish-link password
- update `/p/:slug` reader with password-gate UI
- update `/p/:slug/embed` reader with compact password-gate UI
- add focused backend service, route, DB integration, app integration, API-client, public reader, and guide editor tests
- update `docs/project-zoomout-status.md`

Excluded:

- analytics or view tracking
- lead capture
- organization-member-only public readers
- invite-only public readers
- email allowlists
- domain allowlists
- magic links
- one-time links
- password reset flows for public links
- per-viewer identities
- public viewer account creation
- full cross-origin embed authentication hardening beyond cookie-based MVP behavior
- custom domains
- interactive demo password protection
- changing snapshot generation
- changing guide generation
- changing revoke semantics

## Product Behavior

### Portal Publishing Panel

For an active public link, the publishing panel should show whether password protection is enabled.

Recommended UI states:

```text
Password protection
Off
[Set password]
```

```text
Password protection
On
[Update password] [Clear password]
```

Behavior:

- setting a password turns password protection on for the active link
- updating a password replaces the old password immediately
- setting or updating a password revokes existing viewer sessions for that link so old password access does not continue
- clearing a password makes the active public link anonymous-public again
- clearing a password revokes existing viewer sessions because they are no longer needed
- password protection should not change the link slug
- password protection should not create a new published artifact
- republishing should preserve password protection settings
- revoking should invalidate the link and any viewer sessions for that link
- restricted links may keep password settings, but public readers still cannot access them while restricted
- expired links may keep password settings, but public readers still cannot access them while expired

Portal must never display the existing password. It can only show:

```text
Password protection is on.
```

### Public Reader

For unprotected active public links, existing behavior remains:

```text
GET /api/v1/public/publish-links/:slug
  -> 200 guide snapshot
```

For password-protected active public links without a valid viewer session:

```text
GET /api/v1/public/publish-links/:slug
  -> 401 publish_link_password_required
```

The web reader should show a password gate:

```text
This guide is password protected.
[Password input]
[Unlock guide]
```

On submit:

```http
POST /api/v1/public/publish-links/:slug/viewer-sessions
Content-Type: application/json

{
  "password": "viewer entered password"
}
```

If the password is correct:

- server sets a public viewer session cookie
- public reader reloads the guide snapshot
- guide renders normally

If the password is wrong:

- show a stable inline error:

```text
Password is incorrect.
```

Do not reveal whether the slug exists beyond the current route behavior. For missing/revoked links, keep the existing not-found state.

### Embed Reader

`/p/:slug/embed` must use the same password rules as `/p/:slug`.

In embed mode, the password gate should be compact:

```text
Password required
[Password input]
[Unlock]
```

Important browser note:

- cookie-based protected embeds are the correct first implementation because screenshots use plain `<img src>` asset URLs
- cross-site iframe password sessions require the browser to send the viewer-session cookie inside the iframe
- production HTTPS should use `SameSite=None; Secure` for the viewer cookie if cross-site embeds are expected
- local development can use a relaxed cookie option so the feature is testable over HTTP
- some browsers or enterprise policies may block third-party cookies; a later embed-specific signed asset/session strategy can address that if needed

Do not solve third-party cookie blocking in this slice.

## Access Model

Keep the existing public access model:

```text
visibility: public | restricted
expires_at: timestamptz | null
status: active | revoked
```

Add password state independently:

```text
password_hash: text | null
password_salt: text | null
password_set_at: timestamptz | null
password_updated_at: timestamptz | null
```

Derived API field:

```text
password_protected: boolean
```

Access decision order:

1. active publish link must exist
2. link visibility must be `public`
3. link must not be expired
4. if `password_protected = false`, allow
5. if `password_protected = true`, viewer session must be valid for this publish link
6. viewer session must be unexpired and not revoked

Do not add a new `visibility = password` value in this slice.

Reason:

- `visibility` currently controls whether anonymous public access is enabled at all
- password protection is an additional gate on public links
- keeping it independent avoids weird states such as `visibility = password` plus public access off
- it keeps the portal controls clear: public access, expiry, and password protection are separate settings

Password rotation rule:

- every set/update/clear operation should revoke active viewer sessions for that publish link
- this is simpler and safer than storing a password version in every viewer session
- after a password update, viewers must unlock again with the new password
- after a password clear, viewers no longer need a viewer session

## Database Work

Add a migration after the current publish/access/embed work.

Recommended publish link columns:

```sql
ALTER TABLE publish_schema.publish_link
  ADD COLUMN password_hash TEXT DEFAULT NULL,
  ADD COLUMN password_salt TEXT DEFAULT NULL,
  ADD COLUMN password_set_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN password_updated_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE publish_schema.publish_link
  ADD CONSTRAINT chk_publish_link_password_fields
  CHECK (
    (
      password_hash IS NULL
      AND password_salt IS NULL
      AND password_set_at IS NULL
      AND password_updated_at IS NULL
    )
    OR (
      password_hash IS NOT NULL
      AND password_salt IS NOT NULL
      AND password_set_at IS NOT NULL
      AND password_updated_at IS NOT NULL
    )
  );
```

Recommended viewer session table:

```sql
CREATE TABLE publish_schema.public_publish_viewer_session (
  id TEXT PRIMARY KEY,
  publish_link_id TEXT NOT NULL REFERENCES publish_schema.publish_link(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT uq_public_publish_viewer_session_token_hash UNIQUE (token_hash),
  CONSTRAINT chk_public_publish_viewer_session_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_public_publish_viewer_session_link_active
  ON publish_schema.public_publish_viewer_session (publish_link_id, expires_at)
  WHERE revoked_at IS NULL;
```

Use `ON DELETE CASCADE` as a safety net, but normal revoke behavior should not delete the publish link row. Service access checks should reject viewer sessions when the linked publish link is no longer active, public, or unexpired.

When password protection is set, updated, cleared, or the active publish link is revoked, mark existing viewer sessions for that publish link as revoked. This prevents stale sessions from surviving password rotation or link shutdown.

Foundation schema tests should assert:

- password columns exist
- password field consistency constraint rejects half-set password records
- viewer session table exists
- viewer session token hash is unique
- viewer session links to publish links
- viewer session expiry must be after creation

## Password Hashing

Use a dedicated helper in the publish domain or shared security utility:

```text
hash_public_link_password(password) -> { hash, salt }
verify_public_link_password(password, hash, salt) -> boolean
```

Recommended implementation:

- use Node built-in `crypto.scrypt` or `crypto.pbkdf2`
- generate a unique random salt for every password
- compare derived hashes with `timingSafeEqual`
- enforce password length limits before hashing

Recommended validation:

```text
minimum length: 8
maximum length: 128
```

Validation behavior:

- `password: null` clears password protection
- non-null password must be a string
- empty strings and whitespace-only passwords are invalid
- passwords should be trimmed only for validation if desired, but the stored password verifier should match what the viewer typed consistently
- route tests should prove raw password values are not included in error responses

Do not reuse web user password hashing unless it already exists as a clean local helper. Do not use plain SHA-256 for passwords.

## Viewer Session Token

Use the existing session-token pattern conceptually:

```text
generate random token
store SHA-256 token hash
send raw token only as an httpOnly cookie
```

Suggested cookie:

```text
demo_composer_public_viewer
```

Cookie properties:

- `httpOnly: true`
- `path: /`
- short expiry matching the viewer session expiry
- local/dev: `SameSite=Lax`
- production HTTPS/cross-site embed target: `SameSite=None; Secure`

Recommended session lifetime:

```text
12 hours
```

The cookie value can be a single token if we look up by hash. It does not need to include slug or publish link id.

The public guide and public asset routes should read this cookie and pass the raw viewer token into the publish service. The repository should only receive and store token hashes.

## API Contract

### Authenticated Publish Status

Existing:

```http
GET /api/v1/projects/:project_id/guides/:guide_id/publish
```

Extend `publish_link` response with:

```json
{
  "password_protected": true
}
```

Never return:

- `password_hash`
- `password_salt`
- viewer session tokens

### Authenticated Password Update

Recommended endpoint:

```http
PATCH /api/v1/projects/:project_id/guides/:guide_id/publish/password
```

Set/update password:

```json
{
  "password": "safe shared password"
}
```

Clear password:

```json
{
  "password": null
}
```

Response can reuse `GuidePublishStatus`:

```json
{
  "publish_link": {
    "id": "publish_link_1",
    "slug": "abc123",
    "visibility": "public",
    "expires_at": null,
    "password_protected": true
  },
  "published_artifact": {}
}
```

Errors:

- `401 unauthenticated`
- `404 project_not_found`
- `404 guide_not_found`
- `404 publish_link_not_found`
- `400 invalid_publish_password_settings`

### Public Guide Resolution

Existing:

```http
GET /api/v1/public/publish-links/:slug
```

New inaccessible response when password is required:

```http
401 Unauthorized
Content-Type: application/json

{
  "error": {
    "type": "publish_link_password_required",
    "message": "Publish link password is required"
  }
}
```

If viewer cookie is valid, return the same public publish response as today.

The returned `publish_link` should include `password_protected: true` for protected links after authorization. It must still not include password metadata.

### Public Viewer Session Create

New:

```http
POST /api/v1/public/publish-links/:slug/viewer-sessions
Content-Type: application/json

{
  "password": "viewer entered password"
}
```

Success:

```http
204 No Content
Set-Cookie: demo_composer_public_viewer=...
```

Alternative acceptable response:

```http
200 OK
{
  "viewer_session": {
    "expires_at": "2026-06-14T12:00:00.000Z"
  }
}
```

Prefer `204` unless the UI needs expiry details.

Errors:

- `404 publish_link_not_found`
- `403 publish_link_not_public`
- `410 publish_link_expired`
- `400 invalid_public_viewer_password`
- `429 public_viewer_password_rate_limited` can be deferred unless rate limiting already exists

Use the same not-public/expired behavior as public resolution.

If the link is active/public/unexpired but not password-protected, the endpoint should not create a durable viewer session. Prefer returning `204 No Content` without setting a cookie so accidental duplicate unlock submissions do not create unnecessary state.

### Public Asset Streaming

Existing:

```http
GET /api/v1/public/publish-links/:slug/assets/:asset_id/file
```

For password-protected links without a valid viewer session:

```http
401 publish_link_password_required
```

If viewer session is valid:

- stream only assets referenced by the active accessible published snapshot
- keep existing `published_asset_not_found` behavior for unreferenced assets

## Backend Implementation Notes

Likely touched files:

```text
apps/server/src/db/migrations/*
apps/server/src/db/foundation-schema.db.integration.test.ts
apps/server/src/modules/publish/publish.service.ts
apps/server/src/modules/publish/publish.service.test.ts
apps/server/src/modules/publish/publish.repository.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/publish/publish.routes.test.ts
apps/server/src/modules/publish/publish.app.integration.test.ts
apps/server/src/modules/publish/publish.db.integration.test.ts
apps/server/src/modules/publish/public-viewer-cookie.ts
apps/server/src/modules/publish/public-link-password.ts
```

Recommended service additions:

```text
update_guide_publish_password(input)
create_public_publish_viewer_session(input)
resolve_public_publish_link(input with viewer token)
get_public_published_asset_file(input with viewer token)
```

Repository additions:

```text
update_publish_link_password
clear_publish_link_password
create_public_viewer_session
find_public_viewer_session_by_token_hash
touch_public_viewer_session
revoke_public_viewer_sessions_for_publish_link
```

Domain errors:

```text
InvalidPublishPasswordSettingsError
PublishLinkPasswordRequiredError
InvalidPublicViewerPasswordError
```

Consider whether wrong-password errors should be generic. Recommended public response:

```text
invalid_public_viewer_password
```

This is acceptable because the viewer already knows the guide route exists if they reached the password gate. Still do not leak internal IDs.

## Web Implementation Notes

Likely touched files:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/guide/types.ts
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.test.tsx
apps/web/src/features/guide/PublicGuideReaderPage.module.css
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.test.tsx
docs/project-zoomout-status.md
```

API client additions:

```text
updateGuidePublishPassword(projectId, guideId, { password: string | null })
createPublicPublishViewerSession(slug, { password: string })
```

Type updates:

```ts
type PublicPublishLink = {
  slug: string;
  artifact_type: "guide" | "interactive_demo";
  visibility: "public" | "restricted";
  expires_at: string | null;
  status: "active" | "revoked";
  password_protected: boolean;
};
```

Public reader state additions:

```text
password_required
unlocking
invalid_password
```

Reader behavior:

- initial load calls `getPublicPublishLink(slug)`
- if API returns `publish_link_password_required`, render password gate
- password submit calls `createPublicPublishViewerSession(slug, { password })`
- after success, retry `getPublicPublishLink(slug)`
- preserve embed/page layout differences
- do not show portal navigation

Guide editor behavior:

- show password protection controls only for active publish links
- allow setting/updating/clearing password regardless of current `visibility`
- clearly show that restricted or expired links remain inaccessible even if password protection is on
- keep copy/open/embed controls governed by existing public/non-expired checks

Recommended copy:

```text
Password protection is off.
Password protection is on.
Password updated.
Password protection cleared.
Could not update password protection.
```

## Security And Privacy Requirements

- never store raw passwords
- never return password hashes or salts
- never log raw submitted passwords in tests or route errors
- validate password body before hashing
- use constant-time hash comparison
- bind viewer sessions to one publish link
- expired viewer sessions must not authorize guide or asset reads
- revoked links must not be authorized by old viewer sessions
- restricted links must not be authorized by password sessions
- public asset URLs must not become a bypass
- public reader errors should not expose organization/project/guide IDs

## Tests

Use TDD.

### Backend Service Tests

Add tests proving:

1. setting a password stores only password hash/salt metadata through the repository
2. clearing a password clears password metadata
3. authenticated publish status reports `password_protected` without hash/salt
4. public resolution for protected links without a valid viewer token throws `PublishLinkPasswordRequiredError`
5. public resolution for protected links with a valid viewer session returns the published snapshot
6. wrong password cannot create a viewer session
7. correct password creates a viewer session scoped to the publish link
8. setting or updating a password revokes existing viewer sessions for that link
9. clearing a password revokes existing viewer sessions and removes the password gate
10. expired viewer session does not authorize access
11. viewer session for another publish link does not authorize access
12. restricted links still reject even with a valid password session
13. expired links still reject even with a valid password session
14. public asset streaming requires the same viewer authorization as public guide resolution

### Backend Route Tests

Add tests proving:

1. authenticated password update requires web auth
2. password set/update validates request body
3. password clear accepts `password: null`
4. password update maps domain errors to stable response types
5. public GET maps protected links to `401 publish_link_password_required`
6. public viewer session POST sets the viewer cookie on correct password
7. public viewer session POST rejects wrong password
8. public viewer session POST avoids creating durable sessions for unprotected links
9. public asset file route passes viewer cookie token into service

### DB Integration Tests

Add tests proving:

1. password metadata persists as hash/salt, not raw password
2. authenticated publish status reports password state after set/update/clear
3. public protected link requires password before access
4. correct password unlocks public guide resolution through viewer cookie
5. protected public asset streaming requires viewer cookie
6. password update invalidates an existing viewer cookie
7. revoked/restricted/expired links deny access despite an existing viewer cookie

### Web API Tests

Add tests proving:

1. `updateGuidePublishPassword` sends `PATCH /publish/password`
2. password clear sends `password: null`
3. `createPublicPublishViewerSession` sends public password body with credentials included
4. API client maps `publish_link_password_required`
5. API client maps `invalid_public_viewer_password`

### Public Reader Tests

Add tests proving:

1. page mode renders password gate when public API says password required
2. embed mode renders compact password gate when password is required
3. submitting the correct password creates viewer session and reloads the guide
4. wrong password shows `Password is incorrect.`
5. restricted and expired states still win over password flow
6. successful unlock renders screenshots and annotations normally

### Guide Editor Tests

Add tests proving:

1. active published link shows password protection state
2. setting a password calls authenticated API and refreshes status
3. updating a password works while already protected
4. updating a password reports that existing viewers must unlock again
5. clearing a password calls authenticated API with `password: null`
6. password hashes/salts are never rendered
7. restricted/expired active links can still show password protection state without exposing copy/embed controls incorrectly
8. unpublished guides do not show password controls

## Implementation Steps

1. Add DB schema tests for password metadata and viewer session table.
2. Add migration for publish-link password metadata and public viewer sessions.
3. Add password hashing helper tests.
4. Implement password hash/verify helper.
5. Add publish service tests for password update and viewer session creation.
6. Implement repository/service support for password metadata and viewer sessions.
7. Add route tests for authenticated password update and public viewer session creation.
8. Implement route handlers, public viewer cookie helper, and error mapping.
9. Add DB integration tests for password-protected public guide and asset access.
10. Add web API client tests and helpers.
11. Add public reader password-gate tests.
12. Implement public reader password-gate flow for page and embed modes.
13. Add guide editor publish-panel tests for password controls.
14. Implement guide editor password controls.
15. Update `docs/project-zoomout-status.md`.
16. Run focused backend and web tests.
17. Run full `pnpm test` where available, DB integration tests, typecheck, lint, build, and `git diff --check`.

## Suggested Commit Slices

Keep commits small:

1. `docs: plan public guide password access`
2. `feat(server): add publish link password storage`
3. `feat(server): add public guide viewer sessions`
4. `feat(web): add public guide password gate`
5. `feat(web): add guide password controls`
6. `docs: update public guide password status`

If implementation is large, split server route/repository/service commits further.

## Acceptance Criteria

- active public guide links can be password-protected from the portal
- password protection can be updated or cleared
- authenticated publish status exposes only `password_protected`, never secret material
- `/p/:slug` shows a password gate for protected links without a valid viewer session
- `/p/:slug/embed` shows a compact password gate for protected links without a valid viewer session
- correct password creates a short-lived viewer session
- wrong password does not create a viewer session
- setting or updating the password invalidates old viewer sessions
- clearing the password removes the gate and invalidates old viewer sessions
- unlocked protected guide renders the same immutable published snapshot as before
- protected public asset file reads require the same viewer authorization
- restricted, expired, revoked, missing, and malformed states remain enforced
- existing anonymous public links keep working unchanged
- all new behavior is covered by focused tests
