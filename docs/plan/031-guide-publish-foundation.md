# Guide Publish Foundation Plan

Date: 2026-06-10

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Create the backend foundation for publishing a guide as a stable, shareable artifact.

Target flow:

```text
authenticated user finishes editing a draft guide
  -> user publishes the guide
  -> server materializes an immutable published snapshot
  -> server creates or updates a stable publish link
  -> public clients can resolve the link to the latest active snapshot
  -> authenticated users can revoke the link later
```

This slice should make guide publishing real at the API/data-model layer. It should not build the public React reader page yet.

## Why This Comes Next

Current state:

- extension capture can create screenshot-backed capture sessions
- capture sessions can be turned into draft guides
- guide editor can edit title/body and show source screenshots inline
- private guide preview can render the guide and inspect screenshots

Remaining product gap:

- a completed guide cannot be shared
- there is no publish-link domain implementation
- there is no immutable published snapshot
- public viewers should not read mutable draft guide rows directly

This is the next best slice because it locks down the publishing model before building the public reader UI.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/grill/2026-06-04-system-design-grill.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/028-guide-preview-reader.md
docs/plan/029-guide-screenshot-viewer.md
docs/plan/030-guide-editor-screenshot-rendering.md
```

Important implications:

- publish links resolve to immutable snapshots, not live guide draft rows
- publishing should become a generic domain that can later support guides and interactive demos
- this first slice should implement guide publishing only
- public responses must not expose raw storage keys, private metadata, organization internals, or soft-delete internals
- source screenshots are allowed in published guide snapshots, but file access must be through controlled API URLs
- access rules should start simple and leave room for password, expiry, invite-only, and analytics later

## Scope

Included:

- add a publish domain under `apps/server/src/modules/publish`
- add `006_publish_foundation_schema.sql` for published artifacts and publish links
- support guide artifact publishing only
- materialize immutable guide snapshot JSON from current guide detail
- create a stable publish link for a guide
- republish by creating a new snapshot version and moving the link to that latest snapshot
- revoke/unpublish the active guide publish link
- read publish status for an authenticated guide
- resolve a public guide publish link without portal authentication
- expose public snapshot data safe enough for a future public reader
- add public published asset file route or signed/resolved asset URL strategy needed by public snapshot reads
- add server tests and DB integration tests through Fastify public APIs
- update `docs/project-zoomout-status.md`

Excluded:

- public React guide reader page
- portal publish buttons/UI
- embed flow
- passwords
- expiry
- invite-only/internal-only access mode
- custom domains
- analytics/view tracking
- SEO metadata
- export
- published interactive demos
- snapshot diff/history UI
- image redaction tools

## Domain Model

Add a generic publish foundation even though this slice only publishes guides.

### `published_artifact`

Purpose:

- immutable materialized version of an artifact at publish time
- can later support guide and interactive demo snapshots

Suggested columns:

```text
id
organization_id
project_id
artifact_type = guide | interactive_demo
artifact_id
version_number
title
snapshot_json
created_by_id
published_at
created_at
```

Notes:

- no update route
- no soft delete required for the snapshot row in this slice
- if a publish link is revoked, the snapshot can remain for audit/history
- `artifact_id` points to the source guide id for this slice
- `version_number` is per `(organization_id, artifact_type, artifact_id)`
- add a unique constraint on `(organization_id, artifact_type, artifact_id, version_number)`
- store `snapshot_json` as `jsonb`

### `publish_link`

Purpose:

- stable public/access handle that points at the currently published snapshot
- owns access state, not the guide content itself

Suggested columns:

```text
id
organization_id
project_id
artifact_type = guide | interactive_demo
artifact_id
published_artifact_id
slug
visibility = public
status = active | revoked
created_by_id
revoked_by_id
published_at
revoked_at
created_at
updated_at
```

Notes:

- one active link per source guide for this MVP
- republishing keeps the same `slug` and updates `published_artifact_id`
- revoking sets `status = revoked` and `revoked_at`
- later access modes can extend `visibility`
- add a unique constraint on `slug`
- add a partial unique index for one active link per `(organization_id, artifact_type, artifact_id)`
- keep revoked rows instead of rewriting them into active links later

If a guide is published, revoked, and then published again, create a new active link with a new slug. Do not reactivate the revoked slug, because a user who revoked a public URL should not be surprised by the same URL becoming public again.

## Snapshot Shape

The published guide snapshot should be denormalized enough that public reads do not need to query mutable guide blocks.

Recommended shape:

```json
{
  "artifact_type": "guide",
  "guide": {
    "id": "guide_1",
    "title": "Department guide",
    "description": "Set up departments.",
    "source_capture_session_id": "capture_session_1",
    "published_version": 1,
    "published_at": "2026-06-10T00:00:00.000Z"
  },
  "blocks": [
    {
      "id": "block_1",
      "block_type": "step",
      "block_index": 1,
      "step": {
        "id": "step_1",
        "title": "Navigate to Department List",
        "body": "Open the Department module."
      },
      "source_asset": {
        "id": "asset_1",
        "asset_type": "screenshot",
        "width": 1440,
        "height": 900,
        "page_title": "Department List",
        "page_url": "https://example.test/departments",
        "file": {
          "id": "file_1",
          "original_name": "departments.png",
          "mime_type": "image/png",
          "size_bytes": 123456
        },
        "file_url": "/api/v1/public/publish-links/{slug}/assets/asset_1/file"
      }
    }
  ]
}
```

Snapshot rules:

- include ordered guide blocks
- include first-class step title/body for step blocks
- include only active source screenshot assets
- use the generated publish link slug when creating public asset URLs inside the snapshot
- include stable client keys only where the reader needs them
- do not include `source_capture_event_id`
- do not include `organization_id`, `created_by_id`, or `updated_by_id`
- do not include raw storage keys
- do not include private file metadata or capture asset metadata JSON
- do not include organization user ids in public snapshot response
- do not mutate old snapshot rows when guide content changes later

## API Contract

### Authenticated Portal APIs

Publish or republish a guide:

```text
POST /api/v1/projects/:project_id/guides/:guide_id/publish
```

Response:

```json
{
  "publish_link": {
    "id": "publish_link_1",
    "artifact_type": "guide",
    "artifact_id": "guide_1",
    "published_artifact_id": "published_artifact_2",
    "slug": "abc123",
    "visibility": "public",
    "status": "active",
    "published_at": "2026-06-10T00:00:00.000Z",
    "public_url": "/p/abc123"
  },
  "published_artifact": {
    "id": "published_artifact_2",
    "artifact_type": "guide",
    "artifact_id": "guide_1",
    "version_number": 2,
    "title": "Department guide",
    "published_at": "2026-06-10T00:00:00.000Z"
  }
}
```

Read guide publish status:

```text
GET /api/v1/projects/:project_id/guides/:guide_id/publish
```

Response when published:

```json
{
  "publish_link": { "...": "..." },
  "published_artifact": { "...": "..." }
}
```

Response when never published or revoked:

```json
{
  "publish_link": null,
  "published_artifact": null
}
```

Revoke guide publish link:

```text
DELETE /api/v1/projects/:project_id/guides/:guide_id/publish
```

Response:

```json
{
  "publish_link": {
    "id": "publish_link_1",
    "status": "revoked",
    "revoked_at": "2026-06-10T00:00:00.000Z"
  }
}
```

### Public APIs

Resolve a public published guide snapshot:

```text
GET /api/v1/public/publish-links/:slug
```

Response:

```json
{
  "publish_link": {
    "slug": "abc123",
    "artifact_type": "guide",
    "visibility": "public",
    "status": "active"
  },
  "published_artifact": {
    "id": "published_artifact_2",
    "artifact_type": "guide",
    "version_number": 2,
    "title": "Department guide",
    "published_at": "2026-06-10T00:00:00.000Z",
    "snapshot": { "...": "..." }
  }
}
```

Read public published asset bytes:

```text
GET /api/v1/public/publish-links/:slug/assets/:asset_id/file
```

Rules:

- link must be active
- asset must be referenced by the active published snapshot for that slug
- response should look up the referenced capture asset/file internally and stream through the existing storage adapter
- no storage key or local path should be exposed
- deleted or archived source assets should not be newly added to snapshots, but already-published snapshots should still be able to stream the referenced file while the file record exists

## Validation And Access Rules

Publish:

- requires authenticated portal session
- user must belong to the guide organization/project
- guide must exist and not be deleted
- guide must be in a publishable state
- publishing a `draft` guide is allowed
- publishing an `archived` guide should be rejected with `guide_not_publishable`
- guide must have at least one block
- source screenshots are optional; text-only guides can publish

Republish:

- creates a new immutable `published_artifact`
- increments `version_number`
- preserves the existing active link slug
- points the active link to the new artifact
- old snapshots remain readable only through internal/admin future history, not through public latest-link resolution
- if the previous link was revoked, create a new active link with a new slug instead of reusing the revoked slug

Revoke:

- requires authenticated portal session
- user must belong to the guide organization/project
- revoked links return not found from public resolve
- revoke should be idempotent enough to avoid surprising failures when a link is already revoked

Public resolve:

- no portal authentication required
- inactive/revoked/missing slugs return not found
- public response includes snapshot data only
- no organization ids, org user ids, storage keys, private metadata, or soft-delete internals

## Testing Plan

Use TDD.

Server tests:

- migration creates `published_artifact` and `publish_link`
- migration enforces unique snapshot versions, unique slugs, and one active link per source artifact
- publishing a guide creates an immutable snapshot
- published snapshot contains ordered guide steps
- published snapshot contains safe screenshot asset display data and public asset URLs
- publish response does not expose storage keys, private metadata, delete internals, or org user ids
- publishing a text-only guide works
- publishing a guide with no blocks fails
- publishing an archived guide fails with `guide_not_publishable`
- publishing a guide from another organization is forbidden/not found
- republishing creates a new snapshot version and keeps the same slug
- publishing after revoke creates a new active slug and keeps the revoked slug unavailable
- old snapshot row remains unchanged after source guide edits
- publish status returns the active link and latest artifact
- revoke marks the link revoked
- revoked links do not resolve publicly
- public resolve returns the latest active snapshot without authentication
- public asset route streams only assets referenced by the active snapshot
- public asset route rejects missing/unreferenced assets

No web tests are required in this slice unless API client helpers are added for future UI work. If API client helpers are added, add focused web API tests only.

## Implementation Order

1. Add failing DB integration tests for publish schema.
2. Add `006_publish_foundation_schema.sql` for `published_artifact` and `publish_link`.
3. Add failing route/service tests for publishing a guide.
4. Add publish repository for snapshot/link persistence.
5. Add publish service that materializes guide snapshots from the guide read model.
6. Add authenticated guide publish routes.
7. Add failing public resolve tests.
8. Add public publish-link resolve route.
9. Add public published asset file route using snapshot reference checks plus the existing file storage provider.
10. Add revoke and publish-status tests/routes.
11. Update `docs/project-zoomout-status.md`.
12. Run focused server tests.
13. Run full verification.

## Verification Commands

```bash
rtk pnpm --filter server test -- publish
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

If DB integration tests are touched, run the relevant DB integration test command with `.env-cmdrc` as the repo currently expects.

## Acceptance Criteria

- A guide can be published through an authenticated API.
- Publishing creates an immutable published snapshot.
- Republishing creates a new snapshot version and preserves the stable public slug.
- Public link resolution reads the latest active published snapshot, not mutable draft guide rows.
- Revoked links no longer resolve publicly.
- Public snapshot responses are safe and do not expose private/storage/internal fields.
- Public snapshot asset bytes can only be read if the active snapshot references that asset.
- Publishing after revoke creates a new active slug rather than reactivating a revoked public URL.
- Archived guides cannot be newly published.
- Existing guide editing and preview behavior remains unchanged.
- Full tests, type checks, build, and lint pass.

## Risks And Tradeoffs

- A generic publish model is slightly more work than `guide_publish_link`, but it avoids duplicating the same publishing behavior for interactive demos later.
- Snapshot JSON duplicates guide content. That is intentional: public links need stable content independent of mutable drafts.
- Public asset serving introduces a new access path. Keep it constrained to assets referenced by the active published snapshot.
- Slug generation needs collision handling. Use a small retry loop with a uniqueness constraint instead of assuming random slugs never collide.
- Publishing text-only guides may feel less useful, but blocking them would create unnecessary product friction.

## Recommended Commit Shape

```text
test: cover guide publish schema
feat: add publish schema
test: cover guide publishing
feat: publish immutable guide snapshots
test: cover public publish resolution
feat: resolve public guide publish links
test: cover guide unpublish
feat: revoke guide publish links
docs: update publish foundation status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/032-public-guide-reader.md
```

That slice should build the public React route that renders the published guide snapshot and reuses the existing screenshot viewer behavior for published screenshots.
