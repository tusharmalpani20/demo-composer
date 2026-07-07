# Guide Block Authoring Foundation Plan

Date: 2026-06-11

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Let users manually shape a generated guide by inserting basic guide blocks in the editor.

Target flow:

```text
user opens guide editor
  -> user inserts a block before/after an existing block
  -> user chooses Step, Header, Tip, or Alert
  -> new block appears in the correct order
  -> user edits the new block text
  -> private preview and public published snapshot render the block clearly
```

This is the first slice that turns the guide editor from a generated-step editor into a real Scribe-style doc composer. It should stay focused on block creation and basic text editing, not rich text, annotations, screenshots, embeds, analytics, or AI.

## Why This Comes Next

Current state after `034`:

- extension capture can create screenshot-backed capture sessions
- capture sessions can generate draft guides
- guide editor can edit generated step title/body
- guide editor can reorder and delete blocks
- guide editor can show source screenshots inline
- guide preview and public reader can render step blocks
- publishing workflow is now usable and polished enough for the MVP loop

Remaining product gap:

- users cannot add missing steps after generation
- users cannot add section headers to structure a guide
- users cannot add callouts like tips or warnings
- non-step blocks exist in the schema/type model, but the editor treats them as unsupported content
- preview/public reader show unsupported placeholders for non-step blocks

The smallest useful next move is not a full rich editor. It is a simple block insertion and text-editing foundation that future slices can extend.

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
docs/plan/027-guide-generation-from-capture-events.md
docs/plan/028-guide-preview-reader.md
docs/plan/031-guide-publish-foundation.md
docs/plan/034-guide-publish-controls-polish.md
```

Important implications:

- guide blocks are the ordered document structure
- steps are first-class records attached to `step` blocks
- published guide links resolve to immutable snapshots
- draft edits do not affect public output until republish
- stale publish cues should appear after successful draft mutations when a guide is already published
- keep guide artifacts separate from interactive demos
- keep this MVP deterministic and non-AI

## Scope

Included:

- backend API for inserting a guide block into an existing guide
- backend API for updating text content on non-step guide blocks
- support for creating these block types:
  - `step`
  - `header`
  - `tip`
  - `alert`
- basic text payloads for each type
- stable insertion position handling
- editor UI controls for adding blocks before/after existing blocks
- editor rendering/editing for the new text-only block types
- preview rendering for `header`, `tip`, and `alert`
- public reader rendering for `header`, `tip`, and `alert`
- publish snapshot support for the new rendered block types
- focused backend, web API, editor, preview, and public reader tests
- update `docs/project-zoomout-status.md`

Excluded:

- paragraph blocks
- divider blocks
- capture blocks as manually inserted blocks
- GIF blocks
- screenshot attach/change UI
- screenshot annotations or hotspots
- rich text editor
- markdown parsing
- drag-and-drop reordering
- block templates
- keyboard shortcuts
- public sharing settings
- analytics
- AI/BYO-key content generation

## Recommended Approach

Add a small backend create-block capability first, then wire the editor UI.

Recommended API shape:

```http
POST /api/v1/projects/:project_id/guides/:guide_id/blocks
```

Request body:

```json
{
  "block_type": "step",
  "position": {
    "placement": "after",
    "guide_block_id": "block_123"
  },
  "step": {
    "title": "New step",
    "body": null
  }
}
```

For text callouts:

```json
{
  "block_type": "tip",
  "position": {
    "placement": "before",
    "guide_block_id": "block_123"
  },
  "content": {
    "title": "Optional title",
    "body": "Useful note for the reader."
  }
}
```

Response:

```json
{
  "guide_blocks": []
}
```

Recommended block-content update API shape:

```http
PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id
```

Request body:

```json
{
  "content": {
    "title": "Updated title",
    "body": "Updated body"
  }
}
```

Response:

```json
{
  "guide_block": {}
}
```

Reasoning:

- returning the full ordered block list matches the existing reorder endpoint
- the editor can update local state without doing a separate detail reload
- insert-before/after is easier for the UI than asking users to choose numeric indexes
- backend remains the authority for block indexes
- non-step content editing should use a block endpoint, while `step` text editing should stay on the existing step endpoint

## Data Model Notes

Current schema already supports `guide_blocks.block_type` values:

```text
step
header
paragraph
tip
alert
capture
divider
gif
```

Current `guide_blocks` rows do not have text columns. Step text lives in `guide_steps`.

Recommended for this slice:

- use `guide_steps` for `step` blocks as already designed
- add text support for simple non-step blocks without overbuilding a CMS model
- prefer adding a small `content` JSON column to `guide_blocks` if it does not already exist
- keep `content` shape restricted by service validation, not arbitrary frontend writes

Recommended non-step content shape:

```json
{
  "title": "Optional heading",
  "body": "Text shown in the guide"
}
```

Validation rules:

- `header` requires `content.title`
- `tip` requires at least one of `content.title` or `content.body`
- `alert` requires at least one of `content.title` or `content.body`
- `step` requires `step.title`
- inserted manual blocks should not require source capture event or source capture asset ids
- inserted manual blocks should inherit organization, project, guide, actor, and timestamps from the guide scope

If adding `guide_blocks.content` feels too wide during implementation, an alternative is a dedicated `guide_block_contents` table. Do not choose that unless the current repository code makes JSON content awkward. For this slice, a typed JSON content column is acceptable because only a few known shapes are allowed.

## Backend Work

Primary module:

```text
apps/server/src/modules/guide
```

Add service behavior:

- validate project and guide exist under the authenticated organization
- reject archived guides with existing `GuideNotEditableError`
- validate block type is supported for manual insert
- validate block-specific payload
- validate insert position
- create the block at the requested position
- shift following block indexes
- create a `guide_steps` row for inserted `step` blocks
- store content for `header`, `tip`, and `alert`
- return the full active ordered block list

Insertion rules:

- if guide has no blocks, allow position to be omitted and insert at index `1`
- if guide has blocks, allow:
  - `before` an existing block
  - `after` an existing block
  - omitted position to append at the end
- reject positions referencing blocks outside the guide
- keep block indexes contiguous starting at `1`
- handle the existing active unique index on `(guide_id, block_index)` safely inside one transaction
- when shifting block indexes, avoid transient unique conflicts by using a two-phase update or another proven local pattern from the reorder implementation
- update the parent guide `updated_at`, `updated_by_id`, and `version` after successful insert/update so stale publish detection can rely on the guide timestamp after reloads

Suggested service method:

```text
create_guide_block(input)
update_guide_block(input)
```

Suggested repository method:

```text
create_guide_block(input)
update_guide_block(input)
```

Suggested errors:

- `UnsupportedGuideBlockTypeError`
- `InvalidGuideBlockContentError`
- reuse `GuideNotFoundError`
- reuse `GuideBlockNotFoundError`
- reuse `GuideNotEditableError`

Route tests:

- authenticated user can insert a step block
- authenticated user can insert a header block
- authenticated user can update header/tip/alert content
- step block content updates are rejected on the block endpoint and continue to use the step endpoint
- unsupported block type returns validation/domain error
- missing/invalid content returns validation/domain error
- unauthenticated request is rejected
- not-found project/guide behavior matches existing route conventions

Service tests:

- inserts after an existing block and shifts later block indexes
- inserts before an existing block and shifts that block plus later blocks
- appends when position is omitted
- inserts into an empty guide
- creates a `guide_steps` row only for `step` blocks
- rejects archived guides
- rejects invalid position block ids
- rejects invalid content
- updates non-step block content
- rejects content update for step blocks
- updates parent guide timestamps/version on successful insert/update

DB integration tests:

- inserted block persists with correct `block_index`
- indexes remain contiguous after insert
- inserted step block includes a step row
- inserted header/tip/alert blocks preserve typed content
- guide detail read model returns inserted content
- updated header/tip/alert content persists and is returned in the guide detail read model
- inserting before/after middle blocks does not violate the active block-index unique constraint

## API Client Work

Primary file:

```text
apps/web/src/lib/api.ts
```

Add:

```text
createGuideBlock(projectId, guideId, input)
updateGuideBlock(projectId, guideId, blockId, input)
```

Expected returns:

```text
createGuideBlock -> Promise<{ guide_blocks: GuideBlock[] }>
updateGuideBlock -> Promise<{ guide_block: GuideBlock }>
```

Update shared guide frontend types:

- add `content` to `GuideBlock`
- add create-block input types
- add update-block input types
- keep `content` nullable for generated/existing rows

Tests:

- create method uses `POST`
- create method URL-encodes project and guide ids
- create method sends JSON body
- create method returns typed block-list response
- update method uses `PATCH`
- update method sends JSON body
- update method returns typed block response
- update method URL-encodes project, guide, and block ids

## Editor UI Work

Primary files:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/guide/GuideEditorPage.test.tsx
```

Add block insertion controls:

- show compact add controls between blocks and at the end of the document
- options for:
  - Step
  - Header
  - Tip
  - Alert
- keep controls utilitarian and compact
- do not use a large marketing-style block picker
- use existing editor styling patterns

Recommended UI behavior:

```text
[+ Step] [+ Header] [+ Tip] [+ Alert]
```

or one add button that opens a small inline option row.

For this slice, a visible compact option row is acceptable because it is easier to test and keeps the editor simple.

Default inserted content:

- Step title: `New step`
- Header title: `New section`
- Tip body: `Add a helpful tip.`
- Alert body: `Add an important note.`

After successful insertion:

- update `detail.guide_blocks` from response
- initialize step draft state for new steps
- show a short notice such as `Block added.`
- mark published guide as stale using the existing local stale marker

Editing non-step blocks:

- allow editing `header.content.title`
- allow editing `tip.content.title` and `tip.content.body`
- allow editing `alert.content.title` and `alert.content.body`
- use the new block update endpoint for non-step content
- keep `step` editing on the existing step endpoint
- after successful block content update, update the block in local `detail.guide_blocks`
- mark published guide as stale using the existing local stale marker

Editor tests:

- user can insert a step after an existing block
- user can insert a header before an existing block
- user can insert a tip/alert and see it rendered in the editor
- create call receives correct project id, guide id, block type, and position
- successful insert updates block order without full page reload
- inserting into a published guide shows stale draft cue
- create failure shows an error and preserves the current editor state
- non-step block editing calls the correct update endpoint
- archived guides do not show insert controls

## Preview And Public Reader Work

Primary files:

```text
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/types.ts
```

Render support:

- `header`: section heading
- `tip`: callout with neutral helpful styling
- `alert`: callout with warning/important styling

Rules:

- do not show unsupported placeholders for these supported block types
- do not expose internal ids
- keep step numbering based only on step blocks
- non-step blocks should not increment step numbers
- screenshots remain attached only to step/capture-backed blocks in this slice

Preview/public tests:

- header renders as a section heading
- tip renders body and optional title
- alert renders body and optional title
- step numbering ignores header/tip/alert blocks
- unsupported block fallback remains for block types not yet implemented
- public snapshot renders the same supported block types

## Publish Snapshot Work

Primary files:

```text
apps/server/src/modules/publish
```

Ensure published guide snapshots include non-step block content for:

- `header`
- `tip`
- `alert`

Rules:

- snapshot should store immutable block content at publish time
- public reader should render from snapshot content, not draft database rows
- republish creates a new snapshot containing the latest block content
- old public snapshots should not change after draft edits until republish
- update `PublishedGuideSnapshotBlock` and related runtime parsing so snapshot blocks expose `content`
- keep `step` data and non-step `content` as separate fields in the snapshot to preserve the first-class step model

Tests:

- publishing a guide with header/tip/alert stores their content in snapshot JSON
- public resolve returns that content
- republishing after content changes creates a newer snapshot with updated content
- revoked/old behavior remains unchanged

## Migration

Likely migration:

```text
007_guide_block_content.sql
```

Potential SQL:

```sql
ALTER TABLE guide_blocks
ADD COLUMN content JSONB NULL;
```

Add a conservative check only if the existing migration style makes JSON shape validation maintainable in SQL. Otherwise, enforce shape in service validation so later block types can evolve without repeated SQL constraint churn.

Migration tests:

- `guide_blocks.content` exists
- existing rows can have null content
- JSON content can be stored for supported block types

## UX Details

Keep the editor practical:

- insert controls should be near the content they affect
- labels should use product language: `Step`, `Header`, `Tip`, `Alert`
- avoid showing raw block ids, source event ids, or content JSON
- keep callouts visually distinct but restrained
- use stable dimensions so controls do not shift the editor when loading
- disable only the block insertion controls while an insert is in progress
- do not disable metadata editing during block insertion

Expected editor rendering examples:

```text
Header
New section

Tip
Optional title
Add a helpful tip.

Alert
Optional title
Add an important note.
```

## Testing Strategy

Follow TDD.

Recommended order:

1. Backend service tests for insert semantics.
2. Repository/DB integration tests for persistence and indexing.
3. Route tests for API contract and errors.
4. Web API client tests.
5. Editor tests for inserting blocks.
6. Editor tests for editing non-step content if endpoint is added.
7. Preview/public reader tests for rendering.
8. Publish snapshot tests for immutable content.

Minimum verification before commit:

```bash
rtk pnpm --filter server test -- guide
rtk pnpm --filter web test -- GuideEditorPage GuidePreviewPage PublicGuideReaderPage
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

If DB migration is added, also run the relevant DB integration tests against `.env-cmdrc` as established in earlier slices.

## Acceptance Criteria

- a user can insert `step`, `header`, `tip`, and `alert` blocks from the guide editor
- inserted blocks appear in the requested order
- block indexes remain contiguous
- inserted step blocks can be edited with existing step editing behavior
- inserted header/tip/alert blocks can be edited with basic text fields
- preview renders header/tip/alert as supported guide content
- public reader renders header/tip/alert from published snapshots
- publishing remains immutable: draft edits require republish to affect public output
- stale publish cue appears after successful insert/update when the guide has an active public link
- archived guides cannot be mutated
- tests cover backend service, route/API, editor, preview/public render, and publish snapshot behavior
- `docs/project-zoomout-status.md` is updated after implementation

## Follow-Up Plans

Recommended next slices after this:

1. `036-guide-step-screenshot-attachment`
   - attach/change/remove screenshots on guide steps
   - choose from capture session assets
2. `037-guide-block-rich-text-polish`
   - better text editing, formatting, and callout polish
3. `038-guide-export-foundation`
   - copy/export guide as markdown or HTML
4. Interactive demo foundation
   - only after the Scribe-style guide composer has enough authoring depth
