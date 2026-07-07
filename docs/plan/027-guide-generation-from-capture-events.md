# Guide Generation From Capture Events Plan

Date: 2026-06-06

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Improve guide creation so completed extension captures become useful Scribe-style draft guides, with screenshot-backed `capture` events producing ordered guide steps that carry the right source asset and better default text.

Target flow:

```text
user finishes extension capture
  -> portal opens capture session detail
  -> user clicks Create guide
  -> backend reads ordered capture events
  -> backend creates draft guide step blocks from meaningful events
  -> screenshot-backed capture events keep their linked screenshot asset
  -> guide editor opens with usable step titles/body and screenshots attached
```

This slice should improve the quality and reliability of generated guide content. It should not add a public guide viewer, publish links, export, AI text generation, annotations, or new extension capture behavior.

## Why This Comes Next

Current state:

- Extension can create a complete capture source loop.
- Capture sessions now contain ordered `capture` events linked to uploaded screenshot assets.
- Portal capture session detail can create a guide from a capture.
- Backend guide creation already:
  - reads non-deleted capture events in `event_index` order
  - validates selected event IDs
  - keeps active linked assets and drops soft-deleted asset references
  - creates draft guide blocks and first-class guide steps
  - keeps source capture event/asset IDs on blocks and steps
- Guide editor can display and edit generated guide steps.

Remaining product gap:

- generated `capture` event steps use a weak generic title: `Review this screen`
- screenshot-backed manual captures should feel like clean Scribe steps, not raw source events
- default generated body text is empty, so users get little context from page title/URL
- tests should explicitly lock down the extension capture scenario: `event_type = "capture"` + linked screenshot asset + ordered guide step

The goal is not to rebuild guide creation. The goal is to tune the existing generator for the capture source material we now produce from the Chrome extension.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/plan/013-create-guide-from-capture.md
docs/plan/016-create-guide-from-capture-portal.md
docs/plan/025-extension-capture-event-recording.md
docs/plan/026-extension-finalize-and-open-portal.md
```

Important implications:

- capture events remain immutable source facts
- guide blocks/steps are editable artifact records
- generated guide text must be deterministic
- AI remains deferred
- screenshot assets stay owned by the file/capture asset domain
- raw typed input values must never be generated into guide text
- selected event order must follow persisted `event_index`, not client input order

## Scope

Included:

- improve deterministic title/body generation for `capture` events
- ensure screenshot-backed `capture` events produce step blocks with `source_capture_asset_id`
- preserve the existing behavior for `navigation`, `click`, `input`, and `note` events unless tests expose a regression
- add service tests focused on extension-style screenshot capture events
- add DB integration coverage proving active screenshot assets are attached and soft-deleted assets are dropped
- add or adjust portal tests only if the create-guide-to-editor flow needs to assert screenshot-backed blocks
- update `docs/project-zoomout-status.md`

Excluded:

- schema changes
- new guide block types
- portal guide preview/reader
- public publishing
- guide export
- screenshot annotation/highlight editor
- changing extension capture behavior
- automatic event capture
- HTML replay/demo generation
- AI/BYO-key text generation
- analytics

## Current Generator Behavior

The guide service currently maps events like this:

```text
navigation -> Navigate to "page title or URL"
click      -> Click "target label/text/role/page title"
input      -> Enter the required value in "target label/text/role/page title"
note       -> note text or "Review this note"
capture    -> Review this screen
```

For extension screenshot captures, the event shape is normally:

```json
{
  "event_type": "capture",
  "event_index": 1,
  "capture_asset_id": "capture_asset_1",
  "page_url": "https://example.com/departments",
  "page_title": "Department List",
  "input_value_redacted": true,
  "metadata": {
    "extension_version": "0.1.0",
    "capture_source": "extension_popup",
    "asset_type": "screenshot"
  }
}
```

Generated guide output should use this source better.

## Proposed Generation Rules

### Capture Events

Title generation:

```text
capture + page_title:
  Capture "Department List"

capture + page_url only:
  Capture "https://example.com/departments"

capture + neither:
  Capture this screen
```

Body generation:

```text
capture + page_title + page_url:
  Captured from https://example.com/departments.

capture + page_url only:
  Captured from this page.

capture + neither:
  null
```

Reasoning:

- `Capture "Department List"` is closer to a Scribe-style step than `Review this screen`
- body text can carry URL context without bloating the title
- no raw input values are introduced
- generated text stays deterministic and editable

### Navigation, Click, Input, Note

Keep existing title behavior for this slice:

```text
navigation -> Navigate to "Department List"
click      -> Click "Add Department"
input      -> Enter the required value in "Department Name"
note       -> note text
```

Body may remain `null` for these event types unless a test shows an existing portal/editor gap.

### Asset Attachment

For every generated block/step:

- if event has `capture_asset_id`
- and that asset belongs to the same org/project/session
- and that asset is not soft-deleted
- then set `source_capture_asset_id` on both `guide_block` and `guide_step`

If the linked asset is missing or soft-deleted:

- still generate the step from the event
- set `source_capture_asset_id` to `null`

This preserves source truth while avoiding broken image references in the guide editor.

## Backend Contract

No route contract changes are expected.

Existing route:

```text
POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
```

Expected behavior after this slice:

- ordered capture events create ordered guide blocks
- `capture` events with active screenshot assets keep their asset references
- generated titles/bodies for capture events are deterministic
- selected event IDs still scope and sort correctly
- existing response shape remains unchanged

No migration should be required.

## Portal Contract

The portal capture session detail page already calls guide creation and redirects to:

```text
/projects/:project_id/guides/:guide_id
```

Portal changes are expected only if current tests do not verify the generated guide detail shape enough.

If portal tests are updated, focus on:

- clicking `Create guide`
- API receives the project id and capture session id for the existing `guides/from-capture-session` route
- redirected guide detail has blocks with screenshot asset references available to the editor

Do not add a new preview UI in this slice.

## Testing Plan

Use TDD.

Service tests:

- `capture` events with `page_title`, `page_url`, and active `capture_asset_id` generate:
  - step title `Capture "Department List"`
  - body `Captured from https://example.com/departments.`
  - block and step `source_capture_asset_id`
- `capture` events with only `page_url` generate a deterministic title and body
- `capture` events with no page metadata generate `Capture this screen` and `body: null`
- soft-deleted/missing assets are not attached
- selected event IDs remain sorted by persisted `event_index`
- no raw input values are used in generated text

Repository/DB integration tests:

- create an extension-like capture session with two screenshot assets/events
- create a guide from the capture
- assert guide blocks are ordered by event index
- assert active screenshot assets are attached to generated blocks/steps
- assert soft-deleted screenshot assets are dropped from generated block/step references
- assert generated title/body values persist in `guide_step`

Route tests:

- only adjust if the service output expectations need a route-level fixture update
- keep the existing route shape: `/api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id`
- response shape should stay unchanged

Portal tests:

- only adjust if guide detail/editor fixtures need to represent screenshot-backed capture steps
- no new route is expected

Verification commands:

```bash
rtk pnpm --filter server test -- guide.service.test.ts
rtk pnpm --filter server test -- guide.db.integration.test.ts
rtk pnpm --filter server test -- guide.routes.test.ts
rtk pnpm --filter web test -- CaptureSessionDetailPage.test.tsx GuideEditorPage.test.tsx
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

DB integration tests are appropriate here because this slice is about persisted guide/source references and generated step details.

## Implementation Order

1. Add focused service tests for screenshot-backed `capture` event guide generation.
2. Watch the service tests fail on current `Review this screen` behavior.
3. Update guide generation helpers for `capture` title/body.
4. Add DB integration tests for persisted screenshot-backed guide blocks/steps.
5. Update repository/service only if DB tests reveal an asset-reference gap.
6. Adjust route/web fixtures only if response expectations need to include the improved generated text.
7. Update `docs/project-zoomout-status.md`.
8. Run full verification.

## Acceptance Criteria

- Screenshot-backed `capture` events generate useful deterministic step titles.
- Generated capture step body includes safe page URL context when available.
- Active linked screenshot assets remain attached to generated guide blocks and guide steps.
- Soft-deleted/missing screenshot assets are not attached.
- Generated guide block order follows persisted `event_index`.
- Selected event IDs still validate and sort correctly.
- No raw input values are introduced into generated guide text.
- Existing guide editor/update/reorder/delete behavior remains green.
- Full tests, type checks, build, and lint pass.

## Risks And Tradeoffs

- The generated capture title still describes a screen, not a user action. That is honest for manual screenshot capture and better than pretending it was a click.
- Body text with URLs can be noisy, but it gives internal users enough context and remains editable.
- We are not adding screenshot annotations yet, so generated guides may still need manual polish.
- This keeps AI deferred; quality comes from deterministic source metadata for now.

## Recommended Commit Shape

```text
test: cover screenshot-backed guide generation
feat: improve capture event guide steps
docs: update guide generation status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/028-guide-preview-reader.md
```

That slice should add a read-only Scribe-style guide view so edited guide drafts can be reviewed outside the editor before publishing exists.
