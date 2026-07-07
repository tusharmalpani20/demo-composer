# Guide Editor Screenshot Rendering Plan

Date: 2026-06-10

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Render source screenshots inside the guide editor so users can edit step copy while seeing the screenshot the step came from.

Target flow:

```text
user opens guide editor
  -> editor loads guide detail with source_capture_assets
  -> each screenshot-backed step renders its source screenshot inline
  -> user edits title/body with visual context
  -> user can open the screenshot in the existing viewer for inspection
```

This slice should improve the guide authoring workflow. It should not add screenshot attachment changes, annotations, public publishing, export, analytics, or new backend APIs.

## Why This Comes Next

Current state:

- guide detail includes safe active source screenshot asset display data
- guide preview renders source screenshots
- guide preview screenshots can open in `GuideScreenshotViewer`
- guide editor can edit guide metadata and step title/body

Remaining product gap:

- guide editor still shows raw text like `Screenshot source: asset_1`
- authors edit step copy without seeing the screenshot they are describing
- screenshot context is critical for Scribe-style doc preparation

This is the next best slice because it reuses the read model and viewer already built, while making the editor meaningfully more useful.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/plan/028-guide-preview-reader.md
docs/plan/029-guide-screenshot-viewer.md
```

Important implications:

- use existing `GuideDetail.source_capture_assets`
- use existing capture asset `file_url`
- do not add backend or schema changes
- do not expose raw storage keys
- do not expose raw source asset IDs as user-facing editor content
- reuse `GuideScreenshotViewer`
- keep guide blocks and first-class guide steps as the editable artifact model

## Scope

Included:

- render source screenshots inline in `GuideEditorPage` step blocks when an active source asset is available
- remove or hide the raw `Screenshot source: asset_id` text from normal editor UI
- make rendered editor screenshots keyboard/click accessible
- reuse `GuideScreenshotViewer` for opening screenshots from editor blocks
- support multiple editor screenshots, including duplicate references to the same source asset from different blocks
- keep the editor screenshot list derived from the current sorted block list after reload, reorder, or delete
- keep existing step title/body edit, save, reorder, and delete behavior unchanged
- keep archived/read-only guide behavior unchanged except screenshots remain viewable
- add focused web tests for screenshot rendering, viewer opening/navigation, missing assets, duplicate source asset references, and no raw asset IDs
- update `docs/project-zoomout-status.md`

Excluded:

- backend changes
- database changes
- changing guide detail response shape
- changing screenshot attachments
- deleting or replacing source screenshots from the editor
- upload UI
- annotations/highlights/callouts
- screenshot crop/edit/redaction
- public publishing
- export
- analytics

## UX Contract

Editor screenshot behavior:

- screenshot appears inside the relevant step editor block, below the editable text fields or in a stable adjacent media area
- screenshot should be visibly tied to the step number/title
- screenshot should be scaled to fit the editor column
- clicking the screenshot opens the existing `GuideScreenshotViewer`
- open control should have an accessible name such as `Open screenshot for step 1`
- raw source asset IDs should not be visible in normal editor content
- missing source assets should not render broken images or viewer triggers
- if an open viewer image disappears because the block was deleted or the detail reloads without that asset, close the viewer instead of leaving stale state

Layout direction:

- keep the current editor structure: metadata panel plus block editor column
- do not create nested cards inside block cards
- use the screenshot as media inside the existing block surface
- keep controls stable so editing fields do not jump when images load
- avoid crowding move/delete/save controls

Read-only archived guides:

- title/body fields remain disabled as today
- move/delete/save remains disabled as today
- screenshots remain visible
- screenshot viewer remains usable because viewing is not editing

## Component Reuse

Reuse:

```text
apps/web/src/features/guide/GuideScreenshotViewer.tsx
```

Do not fork a separate editor-only viewer.

Editor should create viewer image entries with the same display-instance ID rule used by preview:

```text
${block.id}:${asset.id}
```

Reason: multiple guide blocks can reference the same source asset. The viewer should treat displayed block screenshots as separate viewer images so previous/next order matches the editor block order.

## Asset Mapping

In `GuideEditorPage`:

- build `assetsById` from `detail.source_capture_assets`
- for each sorted guide block:
  - asset id = `block.source_capture_asset_id ?? block.step?.source_capture_asset_id`
  - asset = `assetsById.get(asset id)`
- derive viewer images from sorted editable blocks that have active assets
- image `src` = `resolveApiAssetUrl(asset.file_url)`
- image `alt` = `asset.page_title ?? asset.file.original_name ?? Step {number} screenshot`
- image `title` = current draft step title if present, otherwise saved step title, otherwise asset/page fallback
- viewer image order should always follow the current sorted guide block order

If an asset id is referenced by a block but absent from `source_capture_assets`, render no screenshot and no raw ID.

## Testing Plan

Use TDD.

Guide editor tests:

- renders source screenshots for screenshot-backed step blocks
- rendered screenshot uses `resolveApiAssetUrl`
- raw `source_capture_asset_id` values are not visible as editor content
- existing assertions for `Screenshot source: asset_1` are replaced with screenshot rendering assertions
- missing source assets do not render broken images or open controls
- screenshot open controls are keyboard/click accessible
- clicking an editor screenshot opens `GuideScreenshotViewer`
- viewer can navigate across multiple editor screenshots in block order
- duplicate source asset references from different blocks remain separate viewer images
- reorder/delete updates the editor screenshot viewer list and does not leave stale active viewer state
- archived/read-only guides still render screenshots and can open the viewer
- existing guide metadata/step save, reorder, delete, and read-only tests remain green

No server tests are expected because the guide detail read model already exists.

## Implementation Order

1. Add failing `GuideEditorPage` tests for inline screenshot rendering and no raw asset IDs.
2. Add failing `GuideEditorPage` tests for opening and navigating the screenshot viewer from editor screenshots.
3. Add editor-side asset mapping helpers using `detail.source_capture_assets`.
4. Pass resolved source assets and open handlers into `GuideBlockEditor`.
5. Render screenshot media buttons inside step blocks.
6. Render `GuideScreenshotViewer` from `GuideEditorPage`.
7. Close stale active viewer IDs when the active image is no longer present after delete/reload.
8. Update CSS for editor screenshot media.
9. Update `docs/project-zoomout-status.md`.
10. Run focused web tests.
11. Run full verification.

## Verification Commands

```bash
rtk pnpm --filter web test -- GuideEditorPage.test.tsx GuideScreenshotViewer.test.tsx
rtk pnpm --filter web test
rtk pnpm --filter server test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

DB integration tests are not required unless implementation changes the guide detail API.

## Acceptance Criteria

- Guide editor renders source screenshots for active screenshot-backed steps.
- Editor no longer exposes raw screenshot asset IDs as normal user-facing content.
- Missing/deleted source assets do not render broken images.
- Editor screenshots open in the existing screenshot viewer.
- Viewer previous/next order follows editor block order.
- Viewer state remains valid after block reorder, delete, or guide detail reload.
- Duplicate source asset references remain separate viewer entries when they appear in different blocks.
- Archived/read-only guides still show screenshots and allow viewer inspection.
- Existing editing, reorder, delete, and read-only behavior remains green.
- No backend/schema/API changes are introduced.
- Full tests, type checks, build, and lint pass.

## Risks And Tradeoffs

- Editor blocks may become visually taller with screenshots. This is acceptable because editing without visual context is currently the larger usability problem.
- The editor may feel dense when many steps have screenshots. Keep screenshots constrained and allow the viewer for full inspection.
- We are still not supporting attachment changes. Users can edit text but cannot replace screenshots yet.
- This duplicates some asset mapping logic from preview. If duplication grows, extract shared guide screenshot helpers after this slice, not before.

## Recommended Commit Shape

```text
test: cover editor screenshot rendering
feat: render guide editor screenshots
test: cover editor screenshot viewer integration
feat: open editor screenshots in viewer
docs: update editor screenshot status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/031-guide-publish-foundation.md
```

That slice should define the private-to-public transition: publish model, snapshot decision, public/private route shape, and access rules.
