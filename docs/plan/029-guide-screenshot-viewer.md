# Guide Screenshot Viewer Plan

Date: 2026-06-10

## Goal

Add a private screenshot viewer/lightbox for guide screenshots so users can inspect captured screens at a larger size from the guide preview experience.

Target flow:

```text
user opens guide preview
  -> user clicks a screenshot
  -> portal opens a focused viewer overlay
  -> user can zoom in/out/reset and inspect the screenshot
  -> user closes the viewer and returns to the same guide step
```

This slice should improve screenshot inspection for Scribe-style docs. It should not add annotations, hotspots, publishing, public access, export, analytics, or image editing.

## Why This Comes Next

Current state:

- Guide detail read model includes safe active source screenshot display data.
- Guide preview renders ordered guide steps and screenshot images.
- Missing or soft-deleted source assets do not render broken images.
- Guide list and editor link to the private preview route.

Remaining product gap:

- screenshots are often dense, especially ERP/admin screens
- the preview page scales screenshots down to fit the document column
- users need a clean way to inspect full screenshots without opening browser image tabs or leaving the guide

This is the smallest useful improvement after the guide preview reader. It makes the current reader more usable before public publishing or annotation work.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/plan/028-guide-preview-reader.md
```

Important implications:

- use the existing guide detail read model and `file_url`
- do not expose storage keys or new backend file details
- keep the viewer private/authenticated through the existing portal route
- no AI, annotations, or replay behavior in this slice
- no schema or API contract changes should be required

## Scope

Included:

- make screenshots in `GuidePreviewPage` open a viewer overlay
- add a reusable guide screenshot viewer component under the guide feature
- show the selected screenshot at a larger size
- support close button
- support `Escape` to close
- support zoom in, zoom out, and reset controls
- support previous/next screenshot navigation when a guide has multiple screenshots
- preserve useful alt/title text for accessibility
- prevent raw source asset IDs from becoming visible reader content
- handle multiple guide steps that reference the same source screenshot asset
- add focused web tests for opening, closing, keyboard close, zoom controls, reset, and previous/next navigation
- update `docs/project-zoomout-status.md`

Excluded:

- backend changes
- database changes
- public guide viewer
- publishing/share links
- annotations/highlights/callouts
- screenshot crop/edit/redaction
- comments/review workflow
- export
- analytics
- guided demo playback
- rendering screenshots inside the guide editor

## UX Contract

Screenshot presentation in the guide preview:

- screenshot media remains visible inline as it is today
- image area should communicate that it can be opened without visible instructional text
- clicking the screenshot or an accessible open button opens the viewer
- keyboard users must be able to open the viewer from the screenshot block
- the open control should have an accessible name such as `Open screenshot for step 1`
- raw source asset IDs should not be used as visible labels or accessible names

Viewer overlay:

- full viewport fixed overlay
- dark neutral backdrop
- centered image canvas area
- header/title with screenshot label
- close button
- zoom controls:
  - zoom out
  - reset zoom
  - zoom in
- previous/next controls when more than one screenshot is available
- show a compact counter such as `1 / 3`
- preserve image aspect ratio
- image should not overflow incoherently on mobile or desktop
- body scroll should not be required while the viewer is open
- clicking the backdrop may close the viewer only if it does not interfere with screenshot interaction

Recommended zoom behavior:

```text
initial zoom: fit
zoom levels: 0.75, 1, 1.25, 1.5, 2, 3
reset: fit
```

Implementation may represent `fit` separately from numeric zoom, but the user-facing control should stay simple.

## Component Design

Create:

```text
apps/web/src/features/guide/GuideScreenshotViewer.tsx
apps/web/src/features/guide/GuideScreenshotViewer.module.css
apps/web/src/features/guide/GuideScreenshotViewer.test.tsx
```

Suggested component props:

```ts
type GuideScreenshotViewerImage = {
  id: string;
  sourceAssetId: string;
  src: string;
  alt: string;
  title: string;
};

type GuideScreenshotViewerProps = {
  images: GuideScreenshotViewerImage[];
  activeImageId: string | null;
  onActiveImageChange: (imageId: string) => void;
  onClose: () => void;
};
```

Reasons:

- keeps the viewer independent of guide blocks/assets
- lets `GuidePreviewPage` own asset mapping
- makes the component reusable for editor screenshots later
- keeps tests focused on viewer behavior

Viewer image IDs should be display-instance IDs, not raw source asset IDs. Use a block-scoped value such as:

```text
${block.id}:${asset.id}
```

Reason: two guide steps can reference the same source screenshot asset. If the viewer used only `asset.id`, previous/next navigation and active image selection would collapse those two displayed screenshots into one.

## Guide Preview Integration

In `GuidePreviewPage`:

- derive screenshot viewer images from rendered blocks with active assets
- each image entry should include:
  - block-scoped viewer image id
  - source asset id as internal metadata only
  - resolved image URL from `resolveApiAssetUrl(asset.file_url)`
  - alt text from existing `assetAltText`
  - title from step title or asset title
- maintain `activeScreenshotId` state
- clicking a rendered screenshot sets `activeScreenshotId`
- render `GuideScreenshotViewer` only when `activeScreenshotId` is not null
- if a selected screenshot disappears after data reload, close the viewer rather than showing a stale image
- if the same source asset appears in two different guide steps, both step screenshots should be independently openable and navigable in order

The inline screenshot should remain an image, but wrap it in a button or add a nearby icon button so it is keyboard accessible. Prefer a button wrapping the image if it can be styled without layout shift.

## Accessibility

Minimum requirements:

- viewer should use `role="dialog"` and `aria-modal="true"`
- close button has accessible name `Close screenshot viewer`
- zoom buttons have accessible names
- previous/next buttons have accessible names
- screenshot image keeps meaningful alt text
- `Escape` closes the viewer
- left/right arrow keys may move to previous/next screenshots if implemented locally without complexity
- focus should move to the viewer close button when opened
- when closed, focus should return to the screenshot open control if practical

Focus trapping is desirable but not required for this slice if the dialog remains simple and tests cover open/close keyboard behavior. If implementing focus trap is cheap and local, include it.

## Testing Plan

Use TDD.

Viewer component tests:

- renders nothing when `activeImageId` is null
- renders nothing when `activeImageId` does not match any image
- opens with selected image title, image, and counter
- calls `onClose` when close button is clicked
- calls `onClose` on `Escape`
- zoom in/out changes the rendered zoom state
- reset returns to fit state
- previous/next call `onActiveImageChange` with the expected image id
- previous/next buttons are disabled or absent when there is only one image
- raw source asset IDs are not visible in the dialog

Guide preview tests:

- screenshot is keyboard/click accessible
- clicking a screenshot opens the viewer with the correct image
- viewer can navigate between multiple screenshots
- duplicate source asset references remain separate viewer images when they belong to different blocks
- closing viewer returns to the preview
- raw source asset IDs remain hidden
- missing assets still render steps without viewer triggers

No server tests are expected because this slice should not change the API.

## Implementation Order

1. Add failing `GuideScreenshotViewer` tests for render/close/keyboard/zoom/navigation.
2. Implement `GuideScreenshotViewer` and CSS.
3. Add failing `GuidePreviewPage` tests for opening screenshots and multi-image navigation.
4. Wire `GuidePreviewPage` screenshot buttons and active viewer state.
5. Update `docs/project-zoomout-status.md`.
6. Run focused web tests.
7. Run full verification.

## Verification Commands

```bash
rtk pnpm --filter web test -- GuideScreenshotViewer.test.tsx GuidePreviewPage.test.tsx
rtk pnpm --filter web test
rtk pnpm --filter server test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

DB integration tests are not required for this slice unless implementation accidentally changes guide detail API behavior.

## Acceptance Criteria

- Users can open guide preview screenshots in a focused viewer.
- Viewer supports close button and `Escape`.
- Viewer supports zoom in, zoom out, and reset.
- Viewer supports previous/next navigation across screenshots in the same guide.
- Inline guide screenshots remain visible and accessible.
- Missing source assets do not produce viewer triggers or broken images.
- No backend/schema/API changes are introduced.
- Web tests cover viewer behavior and guide preview integration.
- Full tests, type checks, build, and lint pass.

## Risks And Tradeoffs

- Zoom without pan may be limiting for very large screenshots, but it is enough for the first inspection slice. Pan can come later if needed.
- Focus trapping can add complexity. Keep the dialog accessible, and only add a full trap if it stays small and reliable.
- Rendering full-size screenshots in an overlay may use more memory on very large captures. The image is already loaded by the browser from the same authenticated file URL, so this is acceptable for the MVP.
- This does not solve annotation or highlight needs. It only makes screenshots inspectable.

## Recommended Commit Shape

```text
test: cover guide screenshot viewer
feat: add guide screenshot viewer
test: cover preview screenshot viewer integration
feat: open guide preview screenshots in viewer
docs: update screenshot viewer status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/030-guide-editor-screenshot-rendering.md
```

That slice should render source screenshots inside the guide editor so users can edit step copy while seeing the related screenshot, reusing the viewer component from this plan.
