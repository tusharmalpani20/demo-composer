# Public Guide Reader Plan

Date: 2026-06-10

## Goal

Build the public web reader for published guide links.

Target flow:

```text
authenticated user publishes a guide
  -> backend creates an immutable published snapshot and active public slug
  -> viewer opens /p/:slug
  -> web resolves the public publish link without portal authentication
  -> web renders the published guide snapshot as a Scribe-style read-only document
  -> viewer can inspect published screenshots with the existing screenshot viewer behavior
```

This slice should make a published guide actually shareable. It should not add portal publish buttons yet; the backend publish APIs already exist and portal controls should be the next small slice.

## Why This Comes Next

Current state:

- guide drafts can be generated from capture sessions
- guide editor can edit title, description, step title/body, block order, and screenshots
- private guide preview renders a Scribe-style internal reader
- backend publishing creates immutable guide snapshots
- backend public APIs can resolve active publish links and stream referenced published asset bytes

Remaining product gap:

- there is no public web route for the stable publish slug
- a published guide cannot yet be opened by a non-authenticated viewer
- the public snapshot shape is not represented in the web app types/API client
- published screenshot URLs are available from snapshots but not rendered by web

This is the smallest slice that completes the first shareable Scribe-style artifact loop.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/028-guide-preview-reader.md
docs/plan/029-guide-screenshot-viewer.md
docs/plan/031-guide-publish-foundation.md
```

Important implications:

- public readers must consume immutable published snapshots, not draft guide detail rows
- public reads must not require portal cookies or login redirects
- public snapshot rendering must not expose organization ids, org user ids, storage keys, capture metadata blobs, or soft-delete internals
- published screenshots must use the server-owned `file_url` from the snapshot
- private guide preview and public guide reader should share visual/interaction patterns where practical
- AI, analytics, lead capture, passwords, expiry, and embed behavior remain out of scope for this slice

## Scope

Included:

- add a public route parser case for `/p/:slug`
- add a public guide reader page in `apps/web`
- add web API client types and helper for `GET /api/v1/public/publish-links/:slug`
- render published guide title, description, published version/date, ordered steps, step body, and screenshots
- reuse `GuideScreenshotViewer` for public published screenshots
- support loading, not-found/revoked, malformed snapshot, and generic error states
- keep public reader outside the portal shell/topbar and outside auth flows
- ensure public reader does not display raw source asset ids or internal metadata
- add focused route, API, page, and app tests
- update `docs/project-zoomout-status.md`

Excluded:

- portal publish button or publish status UI
- authenticated publish/revoke UI
- public interactive demo reader
- embed script or iframe page
- custom domains
- password/expiry/invite-only access
- analytics/view events
- lead capture
- SEO metadata beyond normal document title work if already easy
- social sharing cards
- export to PDF/HTML/Markdown
- comments/reactions
- screenshot annotations/highlights
- AI rewriting/summarization

## Public Route Design

Add:

```text
/p/:slug
```

Reasoning:

- short and shareable
- matches the backend `public_url` shape already returned as `/p/{slug}`
- clearly separate from authenticated portal routes under `/projects/...`
- leaves room for future public demo routes using the same publish-link resolver

Route parser rules:

```text
/p/abc123       -> public_guide_reader with slug abc123
/p/abc%20123    -> public_guide_reader with slug "abc 123"
/p              -> unsupported
/p/abc/extra    -> unsupported
```

The root `App` should render this route before portal-only fallback states. It should not show the portal topbar and should not redirect unauthenticated users to `/login`.

### Routing Boundary

The current web route parser is named `parsePortalRoute`, but `/p/:slug` is not a portal route.

Recommended approach for this slice:

- extend the existing route parser with a `public_guide_reader` route type to keep the change small
- keep the public page outside portal shell/auth behavior in `App.tsx`
- consider renaming `PortalRoute`/`parsePortalRoute` to `AppRoute`/`parseAppRoute` only if the rename is mechanical and does not distract from the reader work

Expected route type:

```text
{
  type: "public_guide_reader";
  slug: string;
}
```

## API Client Contract

Add public API helper:

```text
getPublicPublishLink(slug)
```

Endpoint:

```text
GET /api/v1/public/publish-links/:slug
```

Expected response:

```json
{
  "publish_link": {
    "slug": "abc123",
    "artifact_type": "guide",
    "visibility": "public",
    "status": "active"
  },
  "published_artifact": {
    "id": "published_artifact_1",
    "artifact_type": "guide",
    "artifact_id": "guide_1",
    "version_number": 1,
    "title": "Department guide",
    "published_at": "2026-06-10T00:00:00.000Z",
    "snapshot": {
      "artifact_type": "guide",
      "guide": {},
      "blocks": []
    }
  }
}
```

Public API helper rules:

- use the existing `requestJson` path
- URL-encode the slug when constructing `/api/v1/public/publish-links/:slug`
- still send `credentials: "include"` because the shared helper does this, but the route must work without cookies
- map missing/revoked links to `ApiClientError.kind === "not_found"`
- do not add auth-specific handling to the public page
- keep API base URL handling through the existing `joinUrl`/`resolveApiAssetUrl` behavior

## Web Types

Add public publish-link and snapshot types in the guide feature or a small publish/public type area:

```text
PublishedGuideSnapshot
PublishedGuideSnapshotBlock
PublishedGuideSnapshotAsset
PublicPublishLink
PublicPublishedArtifact
PublicPublishLinkResponse
```

Recommended snapshot shape mirrors the backend:

```text
artifact_type = "guide"
guide.id
guide.title
guide.description
guide.source_capture_session_id
guide.published_version
guide.published_at
blocks[].id
blocks[].block_type
blocks[].block_index
blocks[].step.id/title/body
blocks[].source_asset.id/asset_type/width/height/page_title/page_url/file/file_url
```

Type safety rules:

- public rendering should defensively validate enough shape before rendering using small local type guards or parser helpers
- if `published_artifact.artifact_type !== "guide"` or `snapshot.artifact_type !== "guide"`, render a malformed/unsupported public artifact state
- do not reuse private `GuideDetail` types because the public snapshot intentionally excludes private draft fields
- do not add fields that the public reader does not need

Runtime guard expectations:

- confirm `snapshot` is an object
- confirm `snapshot.artifact_type === "guide"`
- confirm `snapshot.guide` has a string `title`
- treat missing/invalid `description`, `published_version`, and `published_at` as absent display metadata rather than crashing
- confirm `snapshot.blocks` is an array before rendering steps
- ignore invalid block entries instead of rendering raw JSON
- ignore invalid `source_asset.file_url` values instead of rendering broken image controls

## Reader UI

Create a public page such as:

```text
apps/web/src/features/public-guide/PublicGuideReaderPage.tsx
```

or keep it under guide if that better matches local patterns:

```text
apps/web/src/features/guide/PublicGuideReaderPage.tsx
```

Recommended UI:

- no portal topbar
- no login link for normal public not-found states
- document-first layout, similar to private `GuidePreviewPage`
- narrow readable content column with responsive screenshot media
- header:
  - guide title
  - guide description when present
  - small metadata row for published version/date
- body:
  - ordered blocks sorted by `block_index`
  - step number badge
  - step title
  - step body when present
  - screenshot image when `source_asset` exists
- screenshot viewer:
  - use `GuideScreenshotViewer`
  - images should use `resolveApiAssetUrl(source_asset.file_url)`
  - alt text should be `page_title ?? original_name ?? Step {number} screenshot`
  - title should be step title or screenshot title fallback
- missing asset inside a block should not render raw ids
- non-step/future blocks can render a restrained unsupported-block placeholder or be skipped if that matches private preview behavior
- empty guide snapshots should render a clear empty state

Visual constraints:

- do not make a marketing landing page
- do not use a portal shell
- no nested cards
- no decorative gradient/orb background
- keep screenshots inspectable, not darkened or cropped
- ensure long guide titles and long step titles wrap cleanly on mobile
- keep text sizes appropriate for a document reader

## Snapshot Rendering Rules

Sort blocks by `block_index`.

For each block:

```text
if block_type === "step" and step exists:
  render step
else:
  render simple unsupported state or skip safely
```

For screenshots:

```text
asset = block.source_asset
image src = resolveApiAssetUrl(asset.file_url)
```

Public snapshot screenshots are already denormalized per block, so the public reader should not build a private source-asset map from draft guide data.

Security/safety expectations:

- never display `source_asset.id` as user-facing text
- never display raw `file.id`
- never display storage keys because they should not exist in the response
- do not inspect or render arbitrary unknown snapshot keys
- malformed snapshots should not crash the page

## Testing Plan

Use TDD.

Route tests:

- parses `/p/:slug` as `public_guide_reader`
- decodes URL-encoded slugs
- rejects `/p` and nested public paths as unsupported
- existing portal routes remain unchanged

API tests:

- `getPublicPublishLink` calls `/api/v1/public/publish-links/:slug`
- helper does not require a project id or guide id
- not-found/revoked server response maps to `ApiClientError.kind === "not_found"`
- `resolveApiAssetUrl` resolves public asset file URLs correctly with and without API base URL

Page tests:

- shows loading state while resolving
- renders guide title, description, version, published date, ordered steps, body copy, and screenshot image
- tolerates optional/missing public metadata such as description or published date
- uses public snapshot `source_asset.file_url` for screenshot `src`
- opens `GuideScreenshotViewer` from a public screenshot and supports close/previous/next behavior through existing component integration
- renders not-found state for missing or revoked links without login redirect
- renders malformed/unsupported state when the artifact or snapshot is not a guide
- ignores invalid block or asset entries without crashing
- renders empty guide state for zero blocks
- does not render raw asset ids, file ids, organization ids, org user ids, or storage keys

App tests:

- root app renders `/p/:slug` with the public reader
- public route does not render portal navigation
- unsupported routes still show the existing unsupported state

No server tests should be needed unless the public API contract needs adjustment; plan `031` already covered backend publish resolution and asset streaming.

## Implementation Order

1. Add failing route parser tests for `/p/:slug`.
2. Implement public route parsing.
3. Add failing API client tests for public publish-link resolution.
4. Add public publish-link response and snapshot types.
5. Implement `getPublicPublishLink`.
6. Add failing public reader page tests for loading, rendering, not-found, malformed, screenshots, and safety.
7. Implement `PublicGuideReaderPage` using the published snapshot shape.
8. Wire the public route in `App.tsx`.
9. Add/adjust CSS for public document layout.
10. Update `docs/project-zoomout-status.md`.
11. Run focused web tests.
12. Run full verification.

## Verification Commands

```bash
rtk pnpm --filter web test -- routes api PublicGuideReader
rtk pnpm --filter web test
rtk pnpm --filter server test -- publish
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

If implementation touches backend public publish contracts, also run:

```bash
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- `/p/:slug` opens a public guide reader without requiring login.
- Active published guide links render from immutable snapshot data.
- Missing or revoked slugs show a public not-found state.
- Public screenshots render from snapshot `file_url` values.
- Screenshot viewer works from public guide screenshots.
- Public page does not expose raw storage keys, private ids, org/user ids, or capture metadata blobs.
- Malformed/unsupported snapshots fail gracefully instead of crashing.
- Existing authenticated portal guide editor and private preview keep working.
- Focused web tests and full verification pass.

## Risks And Tradeoffs

- Reusing private preview code directly may accidentally pull portal/auth assumptions into the public page. Prefer shared pure helpers/components only where the boundary stays clear.
- Public snapshot types duplicate some guide display shape. That is intentional because public snapshots are immutable and privacy-filtered, while private guide detail remains editable and broader.
- A plain `/p/:slug` route is simple now but may later need artifact-specific routing if demos and guides diverge heavily. The backend response includes `artifact_type`, so the web route can branch later.
- This slice will make links viewable, but users still need API/manual publish until portal publish controls are built.

## Recommended Commit Shape

```text
test: cover public guide route parsing
feat: add public guide route contract
test: cover public publish api client
feat: add public publish api client
test: cover public guide reader
feat: render public guide snapshots
docs: update public reader status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/033-portal-guide-publish-controls.md
```

That slice should add authenticated portal controls to publish, show current public link status, copy/open the public URL, republish after edits, and revoke the active link.
