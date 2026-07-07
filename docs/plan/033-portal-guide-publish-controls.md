# Portal Guide Publish Controls Plan

Date: 2026-06-11

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Add authenticated portal controls so an internal user can publish, republish, open, copy, and revoke a guide's public link from the web UI.

Target flow:

```text
user edits or reviews a draft guide
  -> user opens guide editor
  -> portal reads current publish status
  -> user publishes the guide
  -> portal shows public /p/:slug URL
  -> user can open or copy the public link
  -> user can republish after edits
  -> user can revoke the active public link
```

This slice should make the guide publishing loop usable without manual API calls. It should not add passwords, expiry, analytics, embed, or public-demo publishing.

## Why This Comes Next

Current state:

- backend can publish and republish guides as immutable snapshots
- backend can return authenticated publish status and revoke active links
- backend can resolve active public links and stream snapshot-referenced asset files
- web has a public `/p/:slug` guide reader
- guide editor and private guide preview already exist

Remaining product gap:

- users cannot publish from the portal
- users cannot see whether a guide has an active public link
- users cannot copy/open the public URL from the editor
- users cannot republish after editing
- users cannot revoke a public link from the portal

This is the smallest slice that turns the publish foundation and public reader into an end-to-end usable workflow.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/031-guide-publish-foundation.md
docs/plan/032-public-guide-reader.md
```

Important implications:

- publish links resolve to immutable snapshots, not mutable draft guide rows
- republish creates a new snapshot version and keeps the same active slug
- publishing after revoke creates a new slug
- revoked public links should no longer resolve
- public URL should be `/p/:slug`
- authenticated portal APIs use cookie-backed auth
- public reader route already exists and should be opened by the portal controls
- keep access mode simple: public only

## Scope

Included:

- add web API client helpers for guide publish status, publish/republish, and revoke
- add authenticated publish/link types to web guide types
- add a publish panel to the guide editor page
- load guide detail and publish status for the guide editor
- show unpublished, published, revoked/error, and busy states
- support publish, republish, revoke, open public link, and copy public link
- disable publish/revoke controls while requests are running
- show stable success/error notices
- avoid exposing raw storage keys, org user ids, or snapshot JSON in the portal controls
- add focused API and guide editor tests
- update `docs/project-zoomout-status.md`

Excluded:

- public reader changes
- backend publish domain changes
- guide list publish controls unless implementation is very small after editor controls
- publish controls on private preview
- custom domains
- password protection
- expiry
- invite-only/internal-only access
- analytics/view counts
- embed flow
- SEO/social metadata
- interactive demo publishing
- export
- AI/BYO-key behavior

## API Contract

The backend already exposes these authenticated routes:

```text
GET    /api/v1/projects/:project_id/guides/:guide_id/publish
POST   /api/v1/projects/:project_id/guides/:guide_id/publish
DELETE /api/v1/projects/:project_id/guides/:guide_id/publish
```

Add web API helpers:

```text
getGuidePublishStatus(projectId, guideId)
publishGuide(projectId, guideId)
revokeGuidePublishLink(projectId, guideId)
```

Types:

```text
GuidePublishLink
GuidePublishedArtifact
GuidePublishStatusResponse
GuidePublishResult
GuideRevokePublishResult
```

Naming note:

- keep these authenticated portal DTOs separate from the existing public-reader DTOs from `docs/plan/032-public-guide-reader.md`
- do not reuse `PublicPublishLink`, `PublicPublishedArtifact`, or `PublicPublishLinkResponse` for editor publish controls, because the authenticated contract includes different fields such as `id`, `public_url`, and revoke metadata
- if shared fields become useful later, extract a small common type deliberately instead of widening public-reader types

Expected status response when unpublished or revoked:

```json
{
  "publish_link": null,
  "published_artifact": null
}
```

Expected status/publish response when active:

```json
{
  "publish_link": {
    "id": "publish_link_1",
    "artifact_type": "guide",
    "artifact_id": "guide_1",
    "published_artifact_id": "published_artifact_1",
    "slug": "abc123",
    "visibility": "public",
    "status": "active",
    "published_at": "2026-06-11T00:00:00.000Z",
    "revoked_at": null,
    "public_url": "/p/abc123"
  },
  "published_artifact": {
    "id": "published_artifact_1",
    "artifact_type": "guide",
    "artifact_id": "guide_1",
    "version_number": 1,
    "title": "Department guide",
    "published_at": "2026-06-11T00:00:00.000Z"
  }
}
```

Expected revoke response:

```json
{
  "publish_link": {
    "id": "publish_link_1",
    "status": "revoked",
    "revoked_at": "2026-06-11T00:00:00.000Z"
  }
}
```

Client rules:

- URL-encode `projectId` and `guideId`
- use existing `requestJson`
- send JSON accept headers through shared helper
- map `unauthenticated` to existing sign-in state where relevant
- map `guide_not_publishable` to a user-facing publish error
- map `guide_has_no_publishable_blocks` to a user-facing publish error
- do not add public snapshot fields to editor state

## Editor UI

Primary integration point:

```text
/projects/:project_id/guides/:guide_id
```

Add a "Publishing" panel near the top of the guide editor, preferably beside or below guide metadata so it is visible before the block list.

Recommended panel states:

### Loading

```text
Loading publishing status...
```

Controls disabled.

### Unpublished

```text
This guide is not published.
[Publish guide]
```

Show a short, factual note that publishing creates a public read-only snapshot.

### Published

```text
Published version 2
/p/abc123
[Copy link] [Open public guide] [Republish] [Revoke link]
```

Rules:

- `Open public guide` should link to `publish_link.public_url`
- `Copy link` should copy an absolute URL when possible using `window.location.origin + public_url`
- if Clipboard API is unavailable or copy fails, show/select the URL visibly and show a notice
- `Republish` calls the same `POST` endpoint and updates the panel with the returned version/date
- `Revoke link` calls `DELETE`, then clears active status

### Error

```text
Could not load publishing status.
[Retry]
```

Mutation errors should show concise messages:

- `Guide is not publishable.`
- `Guide has no publishable blocks.`
- `Could not publish guide.`
- `Could not revoke public link.`

## Placement And Behavior

Recommended implementation in `GuideEditorPage`:

- extend props with injectable publish helpers for tests:
  - `loadPublishStatus`
  - `publishCurrentGuide`
  - `revokePublishLink`
- inject or isolate copy behavior for tests:
  - `copyText`
  - default implementation can use `navigator.clipboard.writeText`
  - tests should not depend directly on browser clipboard availability
- add separate publish status state so guide detail can still render if publish status fails
- use a separate publish busy flag/action instead of sharing the current guide/step editing `busyAction`
- fetch guide detail and publish status in parallel or as independent effects
- publishing/revoking should not reload the entire guide detail unless needed
- after publish/republish, update publish status from response
- after revoke, set status to `{ publish_link: null, published_artifact: null }`
- do not block guide metadata/step editing while only publish status is loading
- do not block guide metadata/step editing while a publish/revoke request is running
- disable publish controls when guide status is not `draft`, because backend rejects archived guides
- show public URL only for active links

Recommended URL helper:

```text
publicGuideUrl(publish_link.public_url)
```

Rules:

- if `public_url` starts with `/`, display that path in compact UI
- copy/open should resolve against `window.location.origin`
- do not use `VITE_DEMO_COMPOSER_API_URL` or the API host when building the browser-facing public link
- preserve server-provided path instead of rebuilding from slug in multiple places
- if opening in a new tab, use `target="_blank"` with `rel="noreferrer"`

## Guide List

Do not make guide list controls required for this slice.

Reasoning:

- the editor has the necessary context and is already where users save/preview guides
- publishing from a list would need per-row status loading or a heavier list read model
- list controls can come later after the editor workflow is proven

Optional small addition:

- add no controls, but leave guide list unchanged
- keep this slice focused on editor publish controls

## Testing Plan

Use TDD.

API tests:

- `getGuidePublishStatus` calls `GET /api/v1/projects/:projectId/guides/:guideId/publish`
- `publishGuide` calls `POST /api/v1/projects/:projectId/guides/:guideId/publish`
- `revokeGuidePublishLink` calls `DELETE /api/v1/projects/:projectId/guides/:guideId/publish`
- helpers URL-encode ids
- unpublished status response with null link/artifact is preserved
- `guide_not_publishable` maps to validation error
- `guide_has_no_publishable_blocks` maps to validation error
- unauthenticated errors still map to `ApiClientError.kind === "unauthenticated"`

Guide editor tests:

- loads guide detail and publish status
- renders unpublished publishing panel
- publishes guide and shows public URL/version/date from response
- opens public guide link with correct `href`
- copies absolute public URL through an injectable copy helper
- shows fallback copy error when copy helper fails
- republishes and updates version/date while preserving public URL
- revokes active link and returns to unpublished state
- shows publish-status retry if status loading fails
- shows publish error for archived guide or no blocks
- disables publish controls for archived guides
- publish status load failures do not hide the guide editor
- publish/revoke busy states do not disable unrelated guide or step editing controls
- copied public URL is built from `window.location.origin`, not the API base URL
- does not render storage keys, snapshot JSON, org user ids, or raw internal ids in the publish panel
- existing metadata editing, block editing, preview link, and screenshot viewer tests remain green

No server tests should be needed unless the backend contract changes.

## Implementation Order

1. Add failing API tests for publish status, publish, and revoke helpers.
2. Add authenticated publish types to web guide types.
3. Implement API helpers.
4. Add failing `GuideEditorPage` tests for status loading and unpublished state.
5. Add publish status state/effect and render a basic publishing panel.
6. Add failing tests for publish success and public link rendering.
7. Implement publish/republish action.
8. Add failing tests for revoke.
9. Implement revoke action.
10. Add failing tests for copy/open public link.
11. Implement copy/open URL behavior.
12. Add failing tests for errors and archived guide disabled behavior.
13. Implement error and disabled states.
14. Update `docs/project-zoomout-status.md`.
15. Run focused web tests.
16. Run full verification.

## Verification Commands

```bash
rtk pnpm --filter web test -- api GuideEditorPage
rtk pnpm --filter web test
rtk pnpm --filter server test -- publish
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

If any backend publish behavior changes, also run:

```bash
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- Guide editor shows publish status for the current guide.
- Unpublished guides can be published from the editor.
- Published guides show public URL, published version, and published date.
- Users can open the public guide link.
- Users can copy the public guide link.
- Users can republish an active guide and see the version update.
- Users can revoke the active public link and the UI returns to unpublished state.
- Publish controls failing to load does not prevent the user from editing the guide.
- Publish/revoke requests do not lock unrelated editor controls.
- Archived guides cannot be published from the UI.
- Publish errors are visible and stable.
- Existing guide editing and private preview behavior remains unchanged.
- Focused tests and full verification pass.

## Risks And Tradeoffs

- Fetching publish status separately can show the editor even if publish status fails. That is better than blocking editing on publishing metadata.
- Copy-to-clipboard behavior varies by browser and test environment. Keep fallback behavior explicit.
- The public link points to the web app origin, while API calls may point to a separate backend origin. Keep URL construction explicit so copied links do not accidentally use the API host.
- Published snapshots are immutable, so editor changes after publishing should still require an explicit republish. This slice should make that clear without trying to diff draft content against the snapshot.
- Publishing from the editor only is less convenient than list-level controls, but avoids heavier list read-model changes.
- Public URLs are path-based for now. Custom domains and branded URLs should wait until the access/sharing model is more mature.

## Recommended Commit Shape

```text
test: cover portal publish api client
feat: add portal publish api client
test: cover guide editor publish controls
feat: add guide editor publish controls
docs: update portal publishing status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/034-guide-publish-controls-polish.md
```

That slice can improve the UX around publish controls, add guide-list status/read-model support if needed, and start preparing for access modes or analytics only after the basic workflow is proven.
