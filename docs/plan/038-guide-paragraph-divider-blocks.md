# Guide Paragraph And Divider Blocks Plan

Date: 2026-06-11

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Let users add simple explanatory paragraphs and visual section dividers while authoring Scribe-style guides.

Target flow:

```text
user opens guide editor
  -> user adds a Paragraph block between existing steps
  -> user writes supporting explanation or context
  -> user adds a Divider block to separate guide sections
  -> private preview renders the same document structure
  -> publishing snapshots the paragraph/divider blocks immutably
  -> public reader renders the published guide without unsupported placeholders
```

This is the next small authoring-depth slice after direct guide screenshot upload. The editor already supports step/header/tip/alert blocks, screenshot selection, screenshot removal, and direct replacement screenshot upload. Paragraphs and dividers make the guide feel like a real internal doc instead of only a linear screenshot checklist.

## Why This Comes Next

Current state after `037-guide-editor-direct-screenshot-upload`:

- guide generation from capture events creates screenshot-backed step blocks
- guide editor can edit guide title/description/status
- guide editor can edit step title/body
- guide editor can insert step/header/tip/alert blocks
- guide editor can edit header/tip/alert content
- guide editor can attach/change/remove screenshots for step blocks
- guide editor can upload a brand-new screenshot directly from a step
- private preview and public reader render steps plus header/tip/alert blocks
- publish snapshots preserve supported block content and selected screenshot state

Remaining Scribe-like doc gap:

- users cannot add normal explanatory text that is not a step body
- users cannot visually separate sections without using a fake header or empty callout
- paragraph/divider block types exist in the domain type/check constraints, but they are not yet supported by create/update routes or the portal UI
- preview/public reader still treat paragraph/divider as unsupported content

This should happen before screenshot annotations or export because paragraphs and dividers are basic document structure. They also keep the implementation close to the existing block-authoring path from plan `035`.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/plan/014-guide-edit-foundation.md
docs/plan/015-guide-editor-portal.md
docs/plan/028-guide-preview-reader.md
docs/plan/031-guide-publish-foundation.md
docs/plan/035-guide-block-authoring-foundation.md
docs/plan/036-guide-step-screenshot-management.md
docs/plan/037-guide-editor-direct-screenshot-upload.md
```

Important implications:

- guide blocks are the ordered document structure
- steps stay first-class records attached to `step` blocks
- paragraph text should live in `guide_blocks.content`, not in `guide_steps`
- divider blocks should not create `guide_steps`
- published guide links resolve to immutable snapshots
- draft edits do not affect public output until republish
- stale publish cues should appear after successful paragraph/divider mutations when a guide is already published
- screenshots remain attached to step blocks in this slice
- no rich text, markdown parser, annotations, HTML embeds, AI, analytics, or interactive demo behavior should be introduced here

## Scope

Included:

- backend support for creating `paragraph` guide blocks
- backend support for creating `divider` guide blocks
- backend support for updating paragraph content
- validation that divider blocks do not accept user-editable text content in this slice
- editor insertion controls for Paragraph and Divider
- editor rendering/editing for paragraph blocks
- editor rendering for divider blocks
- preview rendering for paragraph/divider blocks
- public reader rendering for paragraph/divider blocks from immutable snapshots
- publish snapshot support for paragraph content and divider structure
- step numbering remains based only on `step` blocks
- focused backend, web, preview, public reader, and publish tests
- update `docs/project-zoomout-status.md`

Excluded:

- rich text editing
- markdown parsing
- lists/tables/code blocks
- block templates
- capture blocks from the UI
- GIF blocks from the UI
- screenshot annotations/highlights
- attaching screenshots to paragraph/divider blocks
- divider style variants
- export
- advanced public access rules
- analytics
- AI/BYO-key authoring assistance

## Recommended Approach

Extend the existing guide block authoring implementation from `035`.

Current types already include:

```text
step | header | paragraph | tip | alert | capture | divider | gif
```

Current manual creation support is intentionally narrower:

```text
step | header | tip | alert
```

Recommended new supported manual creation set:

```text
step | header | paragraph | tip | alert | divider
```

Use the existing `guide_blocks.content` JSON shape for paragraph text:

```json
{
  "body": "Explain why this step matters before continuing."
}
```

For divider blocks, keep content null:

```json
null
```

Reasoning:

- paragraph content is a block-level document concern, not a guide step
- divider is structural and should stay minimal until there is a concrete need for styles
- this avoids new schema churn because `guide_blocks.content` already exists
- publishing can snapshot the same block shape used by header/tip/alert support
- the editor can reuse much of the non-step block update path

## Backend Plan

Primary files:

```text
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.repository.ts
apps/server/src/modules/guide/guide.service.test.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
```

### 1. Extend Create-Block Input

Update create-block validation to allow:

```text
paragraph
divider
```

Rules:

- `paragraph` requires non-empty `content.body`
- `paragraph.content.title` should be rejected or ignored consistently; recommended: reject to keep the block shape clear
- `divider` should not require `content`
- `divider` should reject meaningful `content.title` or `content.body`
- neither block type creates a `guide_steps` row
- both block types use the existing insert-position behavior
- both block types update the parent guide timestamp/version
- archived guides remain non-editable

Default editor paragraph content:

```json
{
  "body": "Add supporting context."
}
```

Only the web client should provide that default when inserting a new paragraph. The backend should not silently invent paragraph text; it should validate the actual submitted body and reject empty paragraph content.

Route validation should update the current create-block enum from:

```text
step | header | tip | alert
```

to:

```text
step | header | paragraph | tip | alert | divider
```

### 2. Extend Update-Block Input

Update block content editing to support:

```text
paragraph
```

Rules:

- updating a paragraph requires non-empty `content.body`
- updating a divider through the content endpoint should be rejected with the same domain error pattern used for unsupported block content updates
- step text editing must continue to use the step endpoint
- header/tip/alert behavior must remain unchanged

### 3. Preserve Publish-Stale Semantics

Ensure create/update operations for paragraph/divider blocks call the same parent guide update/version behavior as the existing step/header/tip/alert mutations.

Expected result:

```text
published guide + paragraph inserted
  -> guide draft becomes newer than active public snapshot
  -> portal shows stale draft cue
```

### 4. Backend Tests

Service tests:

- inserts a paragraph after an existing block
- inserts a divider before an existing block
- paragraph insert shifts later block indexes correctly
- divider insert shifts later block indexes correctly
- inserted paragraph has `content.body`
- inserted divider has null content
- inserted paragraph/divider does not create a guide step
- rejects paragraph without a non-empty body
- rejects divider with text content
- updates paragraph body
- rejects updating divider content
- rejects paragraph/divider mutation on archived guides
- keeps block indexes contiguous
- updates parent guide version/timestamps after successful insert/update

Route tests:

- `POST /api/v1/projects/:project_id/guides/:guide_id/blocks` accepts `paragraph`
- `POST /api/v1/projects/:project_id/guides/:guide_id/blocks` accepts `divider`
- invalid paragraph body returns route/domain validation error
- invalid divider content returns route/domain validation error
- `PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id` updates paragraph body
- divider content update returns the unsupported-content error
- unauthenticated requests are rejected

DB integration tests:

- paragraph persists with correct content and index
- divider persists with null content and correct index
- guide detail read model returns paragraph/divider blocks in order
- insert before/after middle blocks does not violate the active block-index unique constraint
- active block indexes remain contiguous after paragraph/divider inserts

## API Client Plan

Primary files:

```text
apps/web/src/features/guide/types.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Updates:

- extend `CreateGuideBlockInput["block_type"]` to include `paragraph` and `divider`
- keep `UpdateGuideBlockInput` unchanged if it already accepts `content`
- ensure API tests cover paragraph/divider create payloads if current tests only cover tip/header

Expected create inputs:

```json
{
  "block_type": "paragraph",
  "position": {
    "placement": "after",
    "guide_block_id": "block_123"
  },
  "content": {
    "body": "Add supporting context."
  }
}
```

```json
{
  "block_type": "divider",
  "position": {
    "placement": "after",
    "guide_block_id": "block_123"
  }
}
```

## Editor UI Plan

Primary files:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/guide/GuideEditorPage.test.tsx
```

### 1. Insert Controls

Extend the existing block insertion control options:

```text
Step
Header
Paragraph
Tip
Alert
Divider
```

Keep the UI compact and consistent with the existing editor control surface. This should not become a large block marketplace or rich document toolbar.

Default inserted content:

```text
Paragraph: Add supporting context.
Divider: no content
```

### 2. Paragraph Editing

Render paragraph blocks as an editable textarea using the existing non-step block save pattern.

Recommended behavior:

- show a textarea labeled for the paragraph body
- save through the existing `updateGuideBlock` API
- update local block state after success
- mark published guides stale after success
- show existing success/error messaging patterns
- preserve current editor state on failure

### 3. Divider Rendering

Render divider blocks as a simple horizontal separator inside the editor block list.

Recommended behavior:

- no editable inputs
- no screenshot controls
- can still be reordered/deleted through existing block-level controls if those controls support all blocks
- insertion after/before a divider should work the same as other blocks

### 4. Editor Tests

Add or update tests for:

- user can insert a paragraph after an existing block
- user can insert a divider after an existing block
- create call sends correct `block_type` and position for paragraph
- create call sends correct `block_type` and position for divider
- paragraph appears in the editor after successful insert
- divider appears in the editor after successful insert
- user can edit and save paragraph body
- divider does not show body/title edit fields
- paragraph/divider insert on a published guide shows stale draft cue
- archived guides do not show paragraph/divider insert controls

## Preview And Public Reader Plan

Primary files:

```text
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/GuidePreviewPage.test.tsx
apps/web/src/features/guide/PublicGuideReaderPage.test.tsx
```

Render rules:

- `paragraph`: render `content.body` as normal document text
- `divider`: render a quiet horizontal separator
- neither block type increments step numbering
- neither block type requires a screenshot
- unsupported fallback remains for `capture` and `gif` until those are implemented

Tests:

- private preview renders paragraph body
- private preview renders divider
- public reader renders paragraph body from snapshot
- public reader renders divider from snapshot
- step numbering ignores paragraph/divider blocks
- unsupported fallback still appears for unsupported block types

## Publish Snapshot Plan

Primary files:

```text
apps/server/src/modules/publish/publish.service.ts
apps/server/src/modules/publish/publish.service.test.ts
```

Ensure published snapshots include:

```json
{
  "id": "block_123",
  "block_type": "paragraph",
  "block_index": 2,
  "content": {
    "body": "Published context."
  },
  "step": null,
  "source_asset": null
}
```

```json
{
  "id": "block_456",
  "block_type": "divider",
  "block_index": 3,
  "content": null,
  "step": null,
  "source_asset": null
}
```

Tests:

- publishing a guide with paragraph/divider stores them in snapshot JSON
- resolving public artifact returns the snapshotted paragraph/divider
- editing a paragraph after publish does not mutate the currently active snapshot until republish
- republish creates a newer snapshot with updated paragraph content

## Documentation Updates

Update:

```text
docs/project-zoomout-status.md
```

Expected status changes:

- move paragraph/divider guide blocks from "not built" to built guide authoring depth
- keep capture/GIF blocks, annotations, export, analytics, AI, and interactive demos in "not built"
- update recommended next direction after this slice, likely toward screenshot annotations or export foundation

No ADR is expected unless implementation discovers a new architectural decision. This plan follows the existing guide-block and immutable-publish decisions.

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

If database-facing behavior changes require migration/read-model confidence, also run:

```bash
pnpm --filter server test:migrate
```

and the DB integration tests with the configured `.env-cmdrc` PostgreSQL environment.

## Suggested Commit Shape

Keep this implementation in small logical commits:

```text
1. Add backend paragraph/divider block support
2. Render paragraph/divider blocks in guide readers
3. Add editor paragraph/divider authoring controls
4. Update docs and verification notes
```

If backend and frontend changes are very small, commits 2 and 3 can be combined, but avoid mixing docs-only status updates with unverified implementation changes.
