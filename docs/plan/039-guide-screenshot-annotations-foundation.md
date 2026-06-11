# Guide Screenshot Annotations Foundation Plan

Date: 2026-06-11

## Goal

Let users add simple visual callouts to guide step screenshots so Scribe-style docs can clearly point readers to the important area of a screen.

Target flow:

```text
user opens guide editor
  -> user finds a step with a screenshot
  -> user adds one or more rectangle highlights on top of that screenshot
  -> editor renders those highlights immediately
  -> private preview renders the same highlights
  -> publishing snapshots the highlight data immutably
  -> public reader renders the published screenshot with the same highlights
```

This is the first annotation slice. It should prove the data model, render path, and publish behavior without turning the guide editor into a full design tool.

## Why This Comes Next

Current state after `038-guide-paragraph-divider-blocks`:

- extension capture can create screenshot-backed capture sessions
- capture sessions can generate editable draft guides
- guide editor can edit guide metadata and step text
- guide editor can insert step/header/paragraph/tip/alert/divider blocks
- guide editor can attach/change/remove step screenshots from project screenshots
- guide editor can upload a brand-new replacement screenshot directly from a step
- guide editor, private preview, and public reader render effective screenshots
- focused screenshot viewer exists in editor, preview, and public reader
- public guide publishing uses immutable snapshots

Remaining Scribe-like doc gap:

- screenshots are visible, but users cannot mark the exact UI element or region that matters
- written step text has to carry all pointing/context
- public readers cannot see what the author intended to highlight after a screenshot replacement

The smallest useful next move is rectangle highlights on step screenshots. This gives internal docs a major clarity improvement while keeping the implementation deterministic and non-AI.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/plan/030-guide-editor-screenshot-rendering.md
docs/plan/036-guide-step-screenshot-management.md
docs/plan/037-guide-editor-direct-screenshot-upload.md
docs/plan/038-guide-paragraph-divider-blocks.md
```

Important implications:

- capture assets stay immutable source material
- annotations belong to the editable guide/block layer, not the capture asset
- selected/replacement screenshots should not mutate source capture records
- public published guides must render immutable snapshot annotation data
- draft annotation changes must not affect public output until republish
- step numbering remains based only on step blocks
- this slice should not introduce AI, analytics, export, redaction, or interactive demo behavior

## Scope

Included:

- store rectangle highlight annotations for guide step blocks
- backend API for replacing a step block's annotation list
- validation that annotations can only be saved for `step` blocks
- validation that annotation coordinates are normalized numbers from `0` to `1`
- validation that annotation width/height are positive and stay inside the image bounds
- validation that annotation count per block is bounded
- editor UI to add, view, update, and remove rectangle highlights for a step screenshot
- editor rendering of annotation overlays on effective step screenshots
- private preview rendering of annotation overlays
- public reader rendering of snapshotted annotation overlays
- publish snapshot support for annotation data
- focused backend, web, publish, and DB integration tests
- update `docs/project-zoomout-status.md`

Excluded:

- arrows
- numbered pins
- freehand drawing
- text labels inside annotations
- blur/redaction/masking
- cropping/resizing screenshots
- screenshot editing at the asset/file level
- annotations on paragraph/divider/header/tip/alert blocks
- annotations on screenshots that are only open in the focused viewer
- multi-user collaborative editing
- annotation analytics
- AI/BYO-key annotation suggestions
- interactive demo hotspots/transitions

## Recommended Approach

Store annotation data on `guide_blocks.content` for `step` blocks.

Recommended content shape:

```json
{
  "annotations": [
    {
      "id": "ann_01",
      "type": "highlight",
      "x": 0.64,
      "y": 0.12,
      "width": 0.18,
      "height": 0.08
    }
  ]
}
```

Coordinates should be normalized against the displayed screenshot's natural coordinate space:

```text
x      = left edge as a fraction of image width
y      = top edge as a fraction of image height
width  = highlight width as a fraction of image width
height = highlight height as a fraction of image height
```

Reasoning:

- normalized coordinates survive responsive rendering and thumbnail sizing
- annotations remain tied to the guide step's effective screenshot choice
- storing on `guide_blocks.content` avoids changing immutable capture assets
- existing publish snapshots already include block content
- no schema migration is required if `guide_blocks.content` already exists

Important tradeoff:

- if a user changes a step screenshot, existing annotations may no longer align with the new image

Recommended behavior for this slice:

```text
when the effective screenshot changes or screenshot is hidden:
  clear the block's annotations
```

Reasoning:

- stale annotations pointing at the wrong UI are worse than losing them
- it keeps the first annotation slice safe and understandable
- later we can add a confirmation dialog or annotation migration workflow

## Data Model

Use a typed JSON content shape on step blocks:

```ts
type GuideBlockContent = {
  title?: string | null;
  body?: string | null;
  annotations?: GuideScreenshotAnnotation[] | null;
};

type GuideScreenshotAnnotation = {
  id: string;
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
};
```

Validation rules:

- `annotations` is optional and defaults to an empty array in render code
- maximum annotations per block: `10`
- `id` must be a non-empty stable string generated by the backend for new annotations
- `type` must be `highlight`
- `x`, `y`, `width`, and `height` must be finite numbers
- `x >= 0`
- `y >= 0`
- `width > 0`
- `height > 0`
- `x + width <= 1`
- `y + height <= 1`
- preserve client-provided `id` only when it matches an existing annotation id on the same block
- assign a new backend id when `id` is omitted
- reject malformed or unknown client-provided ids

Recommended update input:

```json
{
  "annotations": [
    {
      "id": "ann_existing_optional",
      "type": "highlight",
      "x": 0.64,
      "y": 0.12,
      "width": 0.18,
      "height": 0.08
    }
  ]
}
```

Recommended stored output:

```json
{
  "annotations": [
    {
      "id": "ann_01HXYZ...",
      "type": "highlight",
      "x": 0.64,
      "y": 0.12,
      "width": 0.18,
      "height": 0.08
    }
  ]
}
```

## Backend Plan

Primary files:

```text
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.repository.ts
apps/server/src/modules/guide/guide.service.test.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
apps/server/src/modules/publish/publish.service.test.ts
```

### 1. Add Annotation Types

Add service-level types for:

```text
GuideScreenshotAnnotation
UpdateGuideBlockAnnotationsInput
NormalizedUpdateGuideBlockAnnotationsInput
```

Keep this inside the guide module for now. Do not create a separate annotation domain until annotations become broader than guide screenshot overlays.

### 2. Add Service Method

Recommended method:

```ts
update_guide_block_annotations(input: {
  auth: GuideAuthContext;
  project_id: string;
  guide_id: string;
  guide_block_id: string;
  data: UpdateGuideBlockAnnotationsInput;
}): Promise<GuideBlock>;
```

Service behavior:

- verify project exists in the actor organization
- verify guide exists and is editable
- find the guide block
- reject missing block
- reject non-step block
- reject step block without an effective screenshot
- normalize/validate annotations
- preserve existing annotation ids when the input includes a valid id from the same block
- assign stable annotation ids to new annotations that omit `id`
- preserve existing block content fields if needed
- update the block content annotations
- update parent guide timestamp/version through the existing repository mutation path
- return the updated block

Do not widen the existing generic block-content update route to accept `step` content. Step text should continue to use the step endpoint, and non-step block content should continue to use the existing block endpoint. Annotations need a dedicated service/route so step annotation edits do not accidentally become arbitrary step-block content writes.

Recommended repository shape:

```ts
update_guide_block_annotations(input): Promise<GuideBlock>
```

It can internally update `guide_blocks.content`, `updated_by_id`, `updated_at`, `version`, and the parent guide version/timestamp using the same transaction style as other guide block mutations.

### 3. Add Route

Recommended endpoint:

```http
PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/annotations
Content-Type: application/json
```

Request:

```json
{
  "annotations": [
    {
      "type": "highlight",
      "x": 0.64,
      "y": 0.12,
      "width": 0.18,
      "height": 0.08
    }
  ]
}
```

Response:

```json
{
  "guide_block": {}
}
```

Route validation should reject:

- unauthenticated requests
- malformed annotation list
- unsupported annotation type
- coordinates outside bounds
- too many annotations
- client-managed fields such as organization/project ids

### 4. Clear Annotations On Screenshot Changes

Update screenshot selection/removal/upload flows so annotation content is cleared when the effective screenshot changes.

Affected backend behavior:

- `update_guide_block_screenshot`
- guide block screenshot upload orchestration

Rule:

```text
if the effective screenshot changes or screenshot_hidden changes:
  set content.annotations = []
```

This should preserve non-annotation content fields if any exist on the block, though step blocks should normally only use annotation content.

The clearing should happen in the backend mutation that changes screenshot selection so stale annotations cannot survive through alternate clients or extension/API callers.

### 5. Backend Tests

Service tests:

- saves normalized highlight annotations on a step block
- backend assigns annotation ids
- rejects annotations on non-step blocks
- rejects annotations on step blocks without an effective screenshot
- rejects out-of-bounds coordinates
- rejects zero/negative width or height
- rejects more than 10 annotations
- clears annotations when step screenshot is changed
- clears annotations when step screenshot is removed
- rejects archived guide mutations

Route tests:

- authenticated user can update step block annotations
- route ignores/rejects client-managed ids consistently
- malformed coordinates return validation/domain error
- non-step target returns domain error
- unauthenticated request is rejected

DB integration tests:

- annotations persist in `guide_blocks.content`
- guide detail read model returns annotations
- updating annotations preserves contiguous block order
- changing/removing screenshots clears annotations

Publish service tests:

- publishing stores step block annotations in snapshot JSON
- public resolve returns snapshotted annotations
- editing draft annotations after publish does not mutate the active public snapshot until republish

## API Client Plan

Primary files:

```text
apps/web/src/features/guide/types.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Add frontend types:

```ts
export type GuideScreenshotAnnotation = {
  id: string;
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type UpdateGuideBlockAnnotationsInput = {
  annotations: Array<{
    id?: string;
    type: "highlight";
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};
```

Extend `GuideBlockContent`:

```ts
annotations?: GuideScreenshotAnnotation[] | null;
```

Add API method:

```ts
updateGuideBlockAnnotations(projectId, guideId, blockId, input)
```

Tests:

- uses `PATCH`
- URL-encodes project, guide, and block ids
- sends JSON body
- returns typed `guide_block`
- maps validation errors through existing API error handling

## Editor UI Plan

Primary files:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/guide/GuideEditorPage.test.tsx
```

### 1. Render Existing Annotations

Wrap step screenshot images in a stable overlay container:

```text
screenshot image
  + absolute highlight rectangles using normalized percentages
```

The overlay should:

- maintain the screenshot's aspect ratio
- not shift layout
- scale with the image
- not block screenshot viewer open button unless in annotation edit mode

### 2. Add A Minimal Annotation Control

Recommended MVP UI:

```text
[Add highlight]
```

On click:

- add one default highlight rectangle centered on the screenshot
- save through `updateGuideBlockAnnotations`
- update local block state
- mark published guide as stale

Default highlight:

```json
{
  "type": "highlight",
  "x": 0.65,
  "y": 0.12,
  "width": 0.18,
  "height": 0.08
}
```

This is intentionally basic. It proves storage/rendering without building drag handles yet.

### 3. Let Users Remove Highlights

For each highlight, show a compact remove control in the step media actions:

```text
Remove highlight 1
```

On click:

- remove that annotation from the list
- save the remaining annotations
- update local block state
- mark published guide as stale

### 4. Optional Position Controls

If implementation effort stays small, add simple numeric percentage inputs for each highlight:

```text
X, Y, W, H
```

Recommended for this first slice:

- add/remove + render is required
- numeric adjustment is optional
- drag/resize handles are explicitly out of scope

### 5. Editor Tests

Tests:

- existing annotations render on a step screenshot
- user can add a highlight to a step with a screenshot
- add highlight calls `updateGuideBlockAnnotations`
- user can remove a highlight
- remove highlight calls `updateGuideBlockAnnotations`
- no annotation controls appear for step blocks without screenshots
- no annotation controls appear for non-step blocks
- adding/removing annotations on a published guide shows stale draft cue
- screenshot change/removal clears displayed annotations after response

## Preview And Public Reader Plan

Primary files:

```text
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/GuidePreviewPage.test.tsx
apps/web/src/features/guide/PublicGuideReaderPage.test.tsx
```

Render rules:

- render annotation rectangles over step screenshots
- only render annotations for blocks with source/effective screenshot assets
- ignore malformed/missing annotation arrays defensively
- annotations do not affect step numbering
- annotations should appear in normal guide view, not necessarily in focused screenshot viewer for this slice
- update public snapshot runtime parsing so `content.annotations` survives defensive parse/normalization

Tests:

- private preview renders highlight overlays
- public reader renders snapshotted highlight overlays
- highlights scale using percentage positioning
- malformed/missing annotations do not crash the reader
- step numbering remains unchanged

Testing note:

- annotation rectangles may be decorative `div`s rather than semantic controls in reader mode
- use stable test ids or query by accessible remove/add controls in editor tests
- avoid making the rectangle itself keyboard-focusable unless it has an actual interaction

## Publish Snapshot Plan

Primary files:

```text
apps/server/src/modules/publish/publish.service.ts
apps/server/src/modules/publish/publish.service.test.ts
apps/web/src/features/guide/types.ts
```

Expected snapshot block:

```json
{
  "id": "block_1",
  "block_type": "step",
  "block_index": 1,
  "content": {
    "annotations": [
      {
        "id": "ann_01HXYZ",
        "type": "highlight",
        "x": 0.64,
        "y": 0.12,
        "width": 0.18,
        "height": 0.08
      }
    ]
  },
  "step": {
    "id": "step_1",
    "title": "Click Add Department",
    "body": null
  },
  "source_asset": {}
}
```

Rules:

- snapshot stores annotation data as it exists at publish time
- public reader uses snapshot data, not draft database rows
- republish creates a new snapshot with updated annotations
- changing draft annotations after publish should make the published guide stale in the portal

## Styling Notes

Highlight style should be visible but not noisy:

```text
border: 2px solid orange/amber
background: translucent amber
box-shadow: subtle outer ring
border-radius: 6px or less
```

Avoid:

- one-note purple/blue palette
- large decorative callout cards
- text labels that can overlap the screenshot
- handles or controls that resize the screenshot container

## Documentation Updates

Update:

```text
docs/project-zoomout-status.md
```

Expected status changes:

- move guide annotations/highlights from "not built" to built guide product depth
- keep export, advanced sharing, analytics, AI, and interactive demos in "not built"
- update recommended next direction toward export/share polish or public embed/access settings

No ADR is expected unless implementation chooses a separate annotation table/domain. If annotation state stays on `guide_blocks.content`, it follows existing guide-block and immutable-publish decisions.

## Verification

Run at minimum:

```bash
pnpm --filter server test
pnpm --filter web test
pnpm check-types
pnpm build
pnpm lint
git diff --check
```

Because this touches guide read models and published snapshots, also run:

```bash
pnpm --filter server test:migrate
pnpm --filter server exec env-cmd -f .env-cmdrc -e testing -- vitest run --testTimeout=20000 --no-file-parallelism src/db/foundation-schema.db.integration.test.ts src/modules/setup/first-run-setup.db.integration.test.ts src/modules/authentication/session.db.integration.test.ts src/modules/project/project.db.integration.test.ts src/modules/capture-session/capture-session.db.integration.test.ts src/modules/capture-asset/capture-asset.db.integration.test.ts src/modules/capture-event/capture-event.db.integration.test.ts src/modules/guide/guide.db.integration.test.ts src/modules/publish/publish.db.integration.test.ts
```

## Suggested Commit Shape

Keep implementation in small logical commits:

```text
1. Add backend guide screenshot annotation support
2. Add editor annotation controls and API client
3. Render annotations in preview and public reader
4. Update guide annotation status docs
```

If the preview/public rendering is very small, it can be committed with the editor work, but backend and docs should stay separate.
