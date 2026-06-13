# Public Guide Access Controls Plan

Date: 2026-06-13

## Goal

Add first-class access controls to published guide links so teams can decide whether a guide link is publicly viewable and optionally set an expiry date.

Target flow:

```text
authenticated portal user
  -> opens /projects/:project_id/guides/:guide_id
  -> publishes or opens an already published guide
  -> sees the active public link settings
  -> keeps the link public, disables public access, or sets an expiry
  -> public reader enforces those settings for /p/:slug
  -> public asset streaming enforces the same settings
```

This builds directly on:

```text
docs/plan/031-guide-publish-foundation.md
docs/plan/032-public-guide-reader.md
docs/plan/033-portal-guide-publish-controls.md
docs/plan/034-guide-publish-controls-polish.md
```

The product gap now is share safety. We can already publish and open public guide links, but every active link is effectively public until revoked. Before we add embed, analytics, lead capture, or sales sharing, the published-link access model should be explicit.

## Why This Comes Next

Current state after `045`:

- guide publishing creates immutable published guide snapshots
- active publish links resolve publicly through `/p/:slug`
- portal users can publish, republish, copy, open, and revoke guide links
- guide list shows publish status and open-link affordances
- public guide reader and public asset streaming work without portal authentication

Remaining gap:

- active guide links only support public access
- there is no way to temporarily disable public viewing without revoking the link
- there is no expiry date for temporary sharing
- public reader cannot distinguish revoked, expired, and restricted/not-public states
- public asset streaming should enforce the same access rules as public guide resolution

Access controls should come before embed, analytics, password protection, viewer sessions, or sales tracking because it tightens the sharing surface we already expose.

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
```

Important implications:

- published guide links continue to resolve immutable snapshots, not mutable draft guides
- republish should keep the active slug and only update the linked snapshot/version
- revoke remains a destructive link action and should stay separate from access mode changes
- public readers must not need portal authentication for public links
- public asset file reads must be constrained to the active, accessible published snapshot
- access controls belong to the publish/link domain, not the guide draft domain
- keep the slice REST/Fastify/Zod style
- use DB migrations as source of truth
- use TDD for the backend and portal changes
- do not add passwords, viewer sessions, analytics, embeds, AI, or interactive demo publishing in this slice

## Scope

Included:

- extend `publish_schema.publish_link` to support non-public active links
- add optional expiry timestamp to publish links
- expose access mode and expiry in authenticated publish status responses
- add an authenticated endpoint to update guide publish-link access settings
- enforce access mode and expiry in public publish-link resolution
- enforce access mode and expiry in public published asset file streaming
- return stable public error types for inaccessible links
- update portal guide editor publish panel with access controls for active published guide links
- update guide list status display if access state materially affects the visible status
- update public reader states for inaccessible/expired links
- focused backend route/service/repository/DB tests
- focused web API, guide editor, guide list, and public reader tests
- update `docs/project-zoomout-status.md`

Excluded:

- password-protected links
- viewer sessions
- email allowlists or domain allowlists
- organization-member-only public reader mode
- magic links
- one-time links
- per-block or per-asset access settings
- analytics
- embed controls
- branded sharing pages
- interactive demo publishing/access controls
- changing snapshot generation
- changing guide generation
- changing revoke semantics
- changing public slug generation

## Access Model

Current publish foundation already has `publish_link.visibility`, but the schema only permits:

```text
public
```

Recommended first extension:

```text
visibility: public | restricted
expires_at: timestamptz | null
```

Meaning:

- `public`: active link can be resolved by anonymous public readers until revoked or expired.
- `restricted`: active link exists and keeps its slug, but anonymous public readers cannot resolve it.
- `expires_at = null`: no expiry.
- `expires_at <= now`: public readers cannot resolve it, even when `visibility = public`.

Why `restricted` instead of `private`:

- it avoids implying organization-authenticated public reader behavior that does not exist yet
- it gives us a simple "public access off" state without revoking the link
- it leaves room for later `password`, `organization`, or `domain_restricted` visibility modes

Do not add `expired` as a persisted link status in this slice. Expiry is computed from `expires_at` so a link can become accessible again if the owner extends or clears expiry.

## Database Work

Add a new migration after the current publish foundation migration.

Recommended migration:

```sql
ALTER TABLE publish_schema.publish_link
  ADD COLUMN expires_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE publish_schema.publish_link
  DROP CONSTRAINT chk_publish_link_visibility;

ALTER TABLE publish_schema.publish_link
  ADD CONSTRAINT chk_publish_link_visibility
  CHECK (visibility IN ('public', 'restricted'));

CREATE INDEX IF NOT EXISTS idx_publish_link_public_access
  ON publish_schema.publish_link (slug, expires_at)
  WHERE status = 'active' AND visibility = 'public';
```

Do not backfill existing links to `restricted`; existing links should remain `public` for backward compatibility.

Foundation schema tests should assert:

- `expires_at` exists
- visibility constraint accepts `public` and `restricted`
- visibility constraint rejects unsupported values
- active slug/source uniqueness behavior is unchanged

Repository row mapping should also be updated anywhere `publish_link_select`, `PublishLinkRow`, public resolution rows, or test fixtures currently assume only the existing publish-link fields.

## Backend API Shape

Keep existing publish endpoints:

```text
GET    /api/v1/projects/:project_id/guides/:guide_id/publish
POST   /api/v1/projects/:project_id/guides/:guide_id/publish
DELETE /api/v1/projects/:project_id/guides/:guide_id/publish
GET    /api/v1/public/publish-links/:slug
GET    /api/v1/public/publish-links/:slug/assets/:capture_asset_id/file
```

Add one authenticated access-settings mutation:

```text
PATCH /api/v1/projects/:project_id/guides/:guide_id/publish/access
```

Request body:

```json
{
  "visibility": "public",
  "expires_at": "2026-07-01T00:00:00.000Z"
}
```

For no expiry:

```json
{
  "visibility": "public",
  "expires_at": null
}
```

For turning public access off:

```json
{
  "visibility": "restricted",
  "expires_at": null
}
```

Response:

```json
{
  "publish_link": {
    "id": "publish_link_1",
    "artifact_type": "guide",
    "artifact_id": "guide_1",
    "published_artifact_id": "published_artifact_1",
    "slug": "abc123",
    "visibility": "restricted",
    "status": "active",
    "published_at": "2026-06-11T00:00:00.000Z",
    "revoked_at": null,
    "expires_at": null,
    "public_url": "/p/abc123"
  },
  "published_artifact": {
    "id": "published_artifact_1",
    "artifact_type": "guide",
    "artifact_id": "guide_1",
    "version_number": 2,
    "title": "Create department workflow",
    "published_at": "2026-06-11T00:00:00.000Z"
  }
}
```

Reasoning:

- `PATCH` keeps access updates separate from publish/republish and revoke
- the guide editor can update its existing publish status shape from the response
- revoke still uses `DELETE`
- no draft guide state changes are implied by link access updates

Also update existing authenticated publish status and publish/republish responses so every full `publish_link` response includes:

```json
{
  "visibility": "public",
  "expires_at": null
}
```

The revoke response should include `expires_at` if it continues returning the full link shape. If it keeps returning only `{ id, status, revoked_at }` on the web side, the server route can still return the richer domain object and the web type may stay narrowed for the revoke result.

## Backend Validation

Authenticated access update validation:

- require an active publish link for the guide
- reject updates when no active link exists
- allow only `public` or `restricted`
- allow `expires_at` as ISO datetime or `null`
- reject invalid datetime strings
- reject dates too far in the past only if this creates poor UX; otherwise allow and treat the link as immediately expired
- normalize accepted datetimes to a UTC ISO string in service responses
- keep project/org scoping identical to existing publish status and revoke behavior

Suggested error mappings:

```text
publish_link_not_found
invalid_publish_access_visibility
invalid_publish_access_expiry
unauthenticated
forbidden
project_not_found
guide_not_found
```

Public resolution behavior:

- missing slug: `404 publish_link_not_found`
- revoked link: `404 publish_link_not_found` or existing revoked behavior
- active restricted link: `403 publish_link_not_public`
- active expired link: `410 publish_link_expired`
- active public non-expired guide link: existing success response

Add explicit domain errors for the new public states and wire them through the existing route error handler:

```text
PublishLinkNotPublicError -> 403 publish_link_not_public
PublishLinkExpiredError -> 410 publish_link_expired
```

Do not collapse restricted or expired links into `404`; the public reader needs stable states for users who were given a real link that is no longer accessible.

Use the same public access check for asset streaming:

- restricted link: no asset bytes
- expired link: no asset bytes
- referenced-asset constraint still applies after access check

The asset endpoint must not bypass access enforcement through a repository query that only checks slug and snapshot asset membership. Prefer one shared service helper that loads the active link plus snapshot, applies access rules, then either returns the snapshot result or continues to asset lookup.

## Backend Implementation Shape

Update:

```text
apps/server/src/db/migrations/
apps/server/src/db/foundation-schema.db.integration.test.ts
apps/server/src/modules/publish/publish.service.ts
apps/server/src/modules/publish/publish.repository.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/publish/publish.service.test.ts
apps/server/src/modules/publish/publish.routes.test.ts
apps/server/src/modules/publish/publish.app.integration.test.ts
apps/server/src/modules/publish/publish.db.integration.test.ts
```

Expected service/repository additions:

```ts
type PublishVisibility = "public" | "restricted";

type PublishLink = {
  // existing fields
  visibility: PublishVisibility;
  expires_at: string | null;
};

type UpdateGuidePublishAccessInput = {
  auth: PublishAuthContext;
  project_id: string;
  guide_id: string;
  visibility: PublishVisibility;
  expires_at: string | null;
};

update_guide_publish_access(input): Promise<GuidePublishStatus>;
```

Public resolution should centralize this check so guide resolution and asset streaming cannot diverge:

```text
active link exists
  -> if visibility is not public, throw public_not_accessible
  -> if expires_at is set and <= now, throw public_expired
  -> return snapshot or asset
```

Inject current time for service tests rather than relying on real time.

Republish should call the existing link-update path in a way that preserves `visibility` and `expires_at`. Creating a new link after revoke should use the default access settings:

```text
visibility = public
expires_at = null
```

## Portal API Work

Update:

```text
apps/web/src/features/guide/types.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Types:

```ts
type GuidePublishVisibility = "public" | "restricted";

type GuidePublishLink = {
  // existing fields
  visibility: GuidePublishVisibility;
  expires_at: string | null;
};

type UpdateGuidePublishAccessInput = {
  visibility: GuidePublishVisibility;
  expires_at: string | null;
};
```

API helper:

```ts
updateGuidePublishAccess(projectId, guideId, input)
```

Endpoint:

```text
PATCH /api/v1/projects/:project_id/guides/:guide_id/publish/access
```

Public publish-link types should include:

```ts
visibility: "public" | "restricted";
expires_at: string | null;
```

The public reader should normally never receive a restricted success response, but the type should match the backend contract.

## Portal Guide Editor UX

Update:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/guide/GuideEditorPage.test.tsx
```

Add an access section inside the existing publish panel, visible only when there is an active publish link.

Recommended active public state:

```text
Sharing
Public access: On
Anyone with the link can view this published snapshot.
Expiry: No expiry
[Disable public access] [Set expiry]
```

Recommended restricted state:

```text
Sharing
Public access: Off
The link is kept, but public viewers cannot open it.
[Enable public access]
```

Recommended expired state:

```text
Sharing
Public access: Expired
The link expired on Jun 30, 2026.
[Clear expiry] [Set new expiry]
```

Control behavior:

- `Enable public access` sets `visibility = public`, preserving current `expires_at` unless it is already expired
- `Disable public access` sets `visibility = restricted`
- `Clear expiry` sets `expires_at = null`
- `Set expiry` can use a simple datetime-local input in this slice
- datetime-local values should be converted to UTC ISO strings before calling the API
- displayed expiry dates should use the same date formatting style already used by the publish panel
- update controls should have their own busy state and not block guide editing
- publish/republish should preserve existing link access settings when republishing the same active link
- publishing after revoke creates a new active link with default `visibility = public` and `expires_at = null`

Keep wording factual and compact. Do not add a long in-app explanation of publishing architecture.

## Guide List UX

Update only if the status response now exposes a useful distinction.

Recommended display:

```text
Published
Public
```

```text
Published
Access off
```

```text
Published
Expired
```

Opening a public guide from the list:

- show/open link only when active, public, and not expired
- for restricted or expired links, show status but do not show `Open public guide`
- keep publish mutations out of the list
- compute expired display state from `publish_link.expires_at` at render time, matching the backend rule

## Public Reader UX

Update:

```text
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.test.tsx
```

Expected states:

- active public link renders the guide as it does now
- malformed/unsupported snapshot state remains as-is
- `404 publish_link_not_found`: show missing/revoked message
- `403 publish_link_not_public`: show "This guide is not publicly accessible."
- `410 publish_link_expired`: show "This guide link has expired."
- asset requests for restricted/expired links do not render images because the page itself should not resolve

Keep public error states generic and avoid exposing project, guide, organization, actor, or storage details.

## Testing Plan

Follow TDD.

Backend migration/schema tests:

- `publish_link.expires_at` column exists
- visibility supports `public` and `restricted`
- visibility rejects unsupported values
- existing active-link uniqueness still works

Backend service tests:

- publish creates a public non-expiring link by default
- republish preserves active link visibility and expiry
- access update changes visibility
- access update sets expiry
- access update clears expiry
- access update rejects missing active link
- public resolution succeeds for active public non-expired link
- public resolution rejects restricted link
- public resolution rejects expired link
- public asset file read rejects restricted link
- public asset file read rejects expired link

Backend route/app tests:

- authenticated `PATCH /publish/access` updates visibility/expiry
- invalid access update returns validation error
- unauthenticated access update is rejected
- public restricted link returns stable inaccessible error
- public expired link returns stable expired error
- public asset endpoint enforces the same access checks

Backend DB integration tests:

- publish default link has `visibility = public` and `expires_at = null`
- update access persists restricted visibility
- update access persists and clears expiry
- public resolve returns 403/410 style behavior through the app for restricted/expired links

Web API tests:

- `updateGuidePublishAccess` sends `PATCH /publish/access`
- request body includes visibility and expiry
- response maps `expires_at`
- authenticated publish status and publish responses map `expires_at`
- public reader maps inaccessible/expired errors

Guide editor tests:

- active public published guide shows access controls
- disabling public access calls the access update helper
- enabling public access calls the access update helper
- setting expiry calls the access update helper
- clearing expiry calls the access update helper
- access update busy state does not disable normal guide editing controls
- access update failure shows an isolated publish-panel error
- publish/republish/revoke behavior remains intact

Guide list tests:

- public active published guide shows open public link
- restricted published guide shows access-off status and hides open link
- expired published guide shows expired status and hides open link
- publish status load failure remains isolated

Public reader tests:

- active public guide still renders
- restricted guide error renders a not-public state
- expired guide error renders an expired state
- missing/revoked behavior is preserved

## Implementation Sequence

1. Add failing migration/schema tests for `expires_at` and expanded visibility.
2. Add migration and update DB row mappings.
3. Add failing publish service tests for default access, update access, republish preservation, restricted resolve, and expired resolve.
4. Implement publish service/repository access settings and shared public access checks.
5. Add failing route/app tests for authenticated access update and public restricted/expired behavior.
6. Implement route schemas and error mappings.
7. Add or update DB integration tests for persisted access settings.
8. Add failing web API tests and implement `updateGuidePublishAccess`.
9. Add failing guide editor tests and implement publish-panel access controls.
10. Add failing guide list tests and update published status display/open-link behavior.
11. Add failing public reader tests and implement restricted/expired states.
12. Update `docs/project-zoomout-status.md`.
13. Run focused and full verification.

## Verification Commands

Recommended focused commands:

```bash
rtk pnpm --filter server test -- publish
rtk pnpm --filter server exec env-cmd -f .env-cmdrc -e testing -- vitest run --no-file-parallelism src/modules/publish/publish.db.integration.test.ts src/db/foundation-schema.db.integration.test.ts
rtk pnpm --filter web test -- GuideEditorPage.test.tsx ProjectGuideListPage.test.tsx PublicGuideReaderPage.test.tsx api.test.ts
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

If route-level changes touch shared app wiring, also run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
```

## Acceptance Criteria

- Existing published guide links remain public and non-expiring after migration.
- New published guide links default to `visibility = public` and `expires_at = null`.
- Authenticated users can disable and re-enable public access without revoking the link.
- Authenticated users can set and clear an expiry date on the active guide publish link.
- Republish preserves the active link slug, visibility, and expiry.
- Public guide resolution rejects restricted links.
- Public guide resolution rejects expired links.
- Public asset streaming rejects restricted and expired links.
- Portal publish panel shows current access state and can update it.
- Guide list does not offer `Open public guide` for restricted or expired links.
- Public reader shows distinct missing, not-public, and expired states.
- No storage keys, org user ids, snapshot internals, or private draft metadata are exposed.
- No password, viewer session, embed, analytics, AI, or interactive demo behavior is introduced.

## Risks And Tradeoffs

- `restricted` is not a full private/member-only reader. It only turns anonymous public access off while preserving the slug.
- Expiry is evaluated at request time, so a link can become accessible again if expiry is extended or cleared. That is intentional.
- Existing public links remain public after migration. This avoids surprising users and matches backward compatibility expectations.
- Guide list per-guide publish status calls remain simple but can become noisy for large guide lists. Keep this accepted MVP tradeoff for now.
- Password protection will need a separate design because it introduces secret handling, public form state, and possibly rate limiting.

## Commit Plan

Suggested small commits:

```text
test: cover publish link access schema
feat: add publish link access persistence
test: cover publish access service rules
feat: enforce public publish access controls
test: cover guide publish access portal states
feat: add guide publish access controls
test: cover public reader access states
feat: show public guide access errors
docs: update public guide access status
```
