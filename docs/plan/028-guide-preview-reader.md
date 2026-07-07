# Guide Preview Reader Plan

Date: 2026-06-06

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Add an authenticated, read-only, Scribe-style guide preview page so internal users can review generated and edited guides as actual documentation, not only as editable form fields.

Target flow:

```text
user opens project guide list or guide editor
  -> user clicks Preview
  -> portal opens a read-only guide reader
  -> reader shows guide title, description, ordered steps, body text, and screenshots
  -> user can return to the editor for changes
```

This slice should make the guide artifact feel real after capture-to-guide generation. It should not add public sharing, publishing, export, analytics, AI rewriting, annotations, comments, or demo playback.

## Why This Comes Next

Current state:

- Extension can start captures, upload screenshots, record screenshot-backed capture events, finalize the session, and open the portal.
- Capture session detail can create a guide from a completed capture.
- Backend guide generation now creates deterministic screenshot-backed draft steps from ordered capture events.
- Guide editor can edit guide title, description, step title/body, reorder blocks, and delete blocks.
- Project guide list and project workspace give users access to guide artifacts.

Remaining product gap:

- There is no clean read-only guide view.
- The editor is useful for changing content, but it is not the experience internal docs and demo users need for review.
- Screenshot-backed guide blocks currently expose only `source_capture_asset_id` in the editor instead of rendering the actual screenshot.
- Before publishing or sharing, we need a private preview that proves the guide read model is good enough.

This is the smallest product slice that moves the guide side closer to the original Scribe-like goal.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/plan/014-guide-edit-foundation.md
docs/plan/015-guide-editor-portal.md
docs/plan/017-project-guide-list-portal.md
docs/plan/027-guide-generation-from-capture-events.md
```

Important implications:

- guides are editable artifacts, capture sessions/events/assets remain source material
- the reader should consume guide detail, not raw capture session detail
- active screenshot asset references may be rendered, but raw storage keys must not leak to the portal
- file URLs should come from server-owned read models, not portal-side URL guessing from IDs
- AI remains deferred
- preview is authenticated and internal only in this slice
- publish/share links need their own future ADR/plan because they will introduce access-control and snapshot decisions

## Scope

Included:

- add a private guide preview route in the web portal
- render guide title, description, status, ordered blocks, step numbers, step titles, step bodies, and screenshot images when available
- add editor and/or guide list navigation to the preview route
- add a back-to-editor action from preview
- enrich the guide detail read model with active source capture asset display data needed by the reader
- keep soft-deleted/missing asset references from rendering broken screenshots
- add focused server tests for guide detail asset enrichment
- add focused web tests for route parsing, preview loading, screenshot rendering, empty states, and unauthenticated handling
- update `docs/project-zoomout-status.md`

Excluded:

- public guide links
- publishing workflow
- immutable published guide snapshots
- export to PDF/HTML/Markdown
- comments/review workflow
- screenshot zoom modal
- annotations/highlights/callouts
- guided demo playback
- analytics
- AI/BYO-key generation
- new guide block creation UI
- changing capture or extension behavior

## Route Design

Use a sibling preview route:

```text
/projects/:project_id/guides/:guide_id/preview
```

Reasoning:

- `/projects/:project_id/guides/:guide_id` already means editor in the current portal.
- Keeping the editor route stable avoids breaking links produced by the create-guide flow.
- The preview route is explicit and easy to link from the editor/list.
- Public sharing can later use a different route family, such as `/share/guides/:slug`, without mixing authenticated preview with anonymous access.

The route parser should distinguish:

```text
/projects/project_1/guides/guide_1         -> guide_detail/editor
/projects/project_1/guides/guide_1/preview -> guide_preview
```

## Backend Read Model

The current guide detail shape is:

```json
{
  "guide": {},
  "guide_blocks": []
}
```

For preview screenshots, the portal also needs safe source asset display data. Add this to the guide detail response:

```json
{
  "guide": {},
  "guide_blocks": [],
  "source_capture_assets": [
    {
      "id": "asset_1",
      "capture_session_id": "capture_session_1",
      "asset_type": "screenshot",
      "width": 1440,
      "height": 900,
      "device_pixel_ratio": 1,
      "page_url": "https://example.test/departments",
      "page_title": "Department List",
      "captured_at": "2026-06-06T00:00:00.000Z",
      "file_url": "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
      "file": {
        "id": "file_1",
        "original_name": "departments.png",
        "mime_type": "image/png",
        "size_bytes": 12345
      }
    }
  ]
}
```

Recommended server/web type name:

```text
GuideSourceCaptureAsset
```

It should be a display/read-model type, not a reused persistence row type. Keep only fields the portal needs to render the reader. Do not include `storage_provider`, `storage_key`, `checksum_sha256`, file metadata blobs, capture asset metadata blobs, or deleted flags in the API response.

Rules:

- include only active, non-deleted capture assets referenced by active guide blocks or guide steps
- scope by same organization and project
- do not include raw storage keys
- include `file_url` generated by the server using the existing capture asset file route
- keep existing `guide` and `guide_blocks` response fields unchanged
- missing or deleted source assets should simply be absent from `source_capture_assets`
- de-duplicate assets when multiple blocks reference the same screenshot
- order `source_capture_assets` by first appearance in ordered guide blocks so tests and UI behavior stay deterministic
- update all guide detail fixtures in server and web tests to include `source_capture_assets: []` when no screenshots are expected

This is a read-model enrichment, not a new storage relationship.

## Portal Reader Design

Create a `GuidePreviewPage` under the guide feature.

Reader layout:

- normal authenticated portal shell/topbar
- header with guide title, description, status, and actions
- actions:
  - `Edit guide`
  - `Back to guides`
- centered document column for ordered guide content
- each step uses a stable step number badge and clear title
- body text renders below title when present
- screenshot renders below step text when the block has an active source asset
- missing screenshot should not show raw IDs by default in the reader
- empty guide state should say the guide has no blocks yet
- step numbering should follow rendered block order after sorting by `block_index`
- non-step/future block types should render a simple unsupported-block placeholder only if they appear, without breaking the page

Visual direction:

- quiet, document-first, internal-tool UI
- closer to Scribe doc layout than a form editor
- no marketing hero
- no nested cards
- screenshots can be framed as individual repeated step media cards
- keep responsive constraints so large screenshots scale down on mobile and desktop
- use existing app typography/colors where practical

## Asset Mapping

Portal should build:

```text
source_capture_assets by id
```

Then for each guide block:

```text
asset id = block.source_capture_asset_id ?? block.step.source_capture_asset_id
asset = source asset map[asset id]
image src = resolveApiAssetUrl(asset.file_url)
```

The reader should prefer block-level `source_capture_asset_id` because the block owns display ordering, with step-level as fallback only for defensive compatibility.

If the API returns a block source asset ID that is absent from `source_capture_assets`, the reader should render the step without an image and without displaying the raw asset ID.

Alt text:

```text
asset.page_title ?? asset.file.original_name ?? "Step {number} screenshot"
```

## Backend Testing Plan

Use TDD.

Service/repository tests:

- guide detail includes `source_capture_assets` for active screenshot assets referenced by guide blocks/steps
- duplicate references to the same screenshot produce one source asset entry
- source assets are scoped to organization and project
- soft-deleted capture assets are excluded
- deleted guide blocks do not cause assets to appear
- response does not include file storage keys
- existing guide detail response still includes guide and ordered guide blocks

Route tests:

- `GET /api/v1/projects/:project_id/guides/:guide_id` returns `source_capture_assets`
- unauthenticated requests still return 401
- missing guide/project still returns the existing not-found response
- route response does not expose storage keys

DB integration tests:

- create a screenshot-backed guide
- fetch guide detail
- assert `source_capture_assets` includes the active screenshot asset with `file_url`
- soft-delete one source asset and assert it is excluded
- assert existing block/step source IDs remain in the response

## Web Testing Plan

Use TDD.

Route tests:

- parse `/projects/project_1/guides/guide_1/preview` as `guide_preview`
- keep `/projects/project_1/guides/guide_1` as editor
- preserve URL decoding for project and guide IDs

Preview page tests:

- loads guide detail and renders guide title/description/status
- renders ordered step numbers by `block_index`
- renders step title and body text
- renders screenshots from `source_capture_assets` using `resolveApiAssetUrl`
- does not render raw `source_capture_asset_id` as reader content
- renders a step without an image when a referenced asset is absent from `source_capture_assets`
- renders empty state when there are no blocks
- renders an unsupported-block placeholder without crashing if a non-step block appears
- shows sign-in message or redirects consistently with existing portal auth handling
- shows load failure state for not-found/unknown API errors
- `Edit guide` links to `/projects/:project_id/guides/:guide_id`
- `Back to guides` links to `/projects/:project_id/guides`

App tests:

- preview route renders `GuidePreviewPage`
- project guide list or editor includes a Preview link

## Implementation Order

1. Add failing server tests for guide detail `source_capture_assets`.
2. Enrich guide service/repository types and repository query to return active source asset display data.
3. Update route tests and DB integration tests for the enriched guide detail response.
4. Update web guide types and all existing guide detail fixtures for `source_capture_assets`.
5. Add failing web route parser test for `/preview`.
6. Add `guide_preview` route type and App branch.
7. Add `GuidePreviewPage` tests for loading, ordered rendering, screenshots, missing screenshots, unsupported blocks, empty state, and actions.
8. Implement `GuidePreviewPage`, CSS, and guide types.
9. Add Preview links from guide editor and project guide list.
10. Update `docs/project-zoomout-status.md`.
11. Run full verification.

## Verification Commands

```bash
rtk pnpm --filter server test -- guide.service.test.ts
rtk pnpm --filter server test -- guide.routes.test.ts
rtk pnpm --filter server test -- guide.db.integration.test.ts
rtk pnpm --filter web test -- routes.test.ts App.test.tsx GuidePreviewPage.test.tsx GuideEditorPage.test.tsx ProjectGuideListPage.test.tsx
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

## Acceptance Criteria

- Authenticated users can open `/projects/:project_id/guides/:guide_id/preview`.
- Preview renders guide title, description, status, ordered steps, and step body text.
- Screenshot-backed guide steps render actual screenshot images.
- Soft-deleted or missing source assets do not render broken screenshots.
- Guide detail response includes safe source asset display data and no storage keys.
- Duplicate screenshot references are de-duplicated in `source_capture_assets`.
- Existing guide editor route still works unchanged.
- Users can navigate from editor/list to preview and from preview back to editor/list.
- Empty guide preview has a clear empty state.
- Server and web tests cover the new read model and preview route.
- Full tests, type checks, build, and lint pass.

## Risks And Tradeoffs

- Enriching guide detail increases response size, but this is acceptable for internal preview and keeps the portal from making one request per screenshot.
- The reader will still be private/authenticated, so this does not solve sharing with external users yet.
- Large screenshots may need a zoom modal later. This slice should only render responsive images.
- The preview may expose draft guide content to any authenticated org user with project access. That matches current guide editor access and can be tightened later if roles are introduced.
- This plan intentionally does not create a publish model. Publishing requires decisions about immutable snapshots, anonymous access, revocation, and URL shape.

## Recommended Commit Shape

```text
test: cover guide detail source assets
feat: enrich guide detail with source assets
test: cover guide preview portal route
feat: add guide preview reader
docs: update guide preview status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/029-guide-screenshot-viewer.md
```

That slice should add a focused screenshot zoom/lightbox experience for guide preview and editor screens, so users can inspect full-size captured screens without leaving the guide.
