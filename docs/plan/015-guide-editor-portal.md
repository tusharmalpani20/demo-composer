# Guide Editor Portal Plan

Date: 2026-06-05

## Goal

Build the first usable portal editor for generated guide drafts:

```text
authenticated portal user
  -> project guide URL
  -> web app fetches guide detail
  -> renders ordered guide blocks
  -> edits guide title/description
  -> edits step title/body
  -> reorders blocks
  -> deletes noisy generated blocks
```

This is the frontend companion to:

```text
docs/plan/013-create-guide-from-capture.md
docs/plan/014-guide-edit-foundation.md
```

The goal is not a polished final editor. The goal is a practical internal Scribe-like document preparation screen that proves the backend guide artifact is usable.

## Why This Comes Next

Current state:

- portal can render raw capture session detail
- backend can create a draft guide from capture events
- backend can read guide detail
- backend can update guide metadata
- backend can update guide step title/body
- backend can reorder blocks
- backend can soft-delete blocks

Missing product behavior:

- internal users cannot open a guide in the portal
- generated guide steps cannot be corrected from the UI
- noisy generated blocks cannot be removed from the UI
- block order cannot be changed from the UI
- there is no real Scribe-like document preparation experience yet

This slice should connect the portal to the guide artifact APIs. It should not add new backend domain behavior.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/012-capture-session-detail-portal.md
docs/plan/013-create-guide-from-capture.md
docs/plan/014-guide-edit-foundation.md
```

Important implications:

- guide editing happens on guide artifact rows, not capture source rows
- capture source references are shown only as context
- raw typed input values must not be displayed
- file storage internals must never appear in the browser
- no AI editing/suggestion layer in this slice
- archived guides are read-only
- publishing/sharing remains deferred
- portal should stay an internal operational tool, not a marketing page

## Scope

Included:

- portal route for guide detail/edit
- fetch guide detail
- render guide metadata
- render ordered guide blocks
- render step title/body
- show source screenshot reference where a block/step has `source_capture_asset_id`
- edit guide title and description
- edit step title and body
- reorder blocks with simple up/down controls
- delete a block
- archived guide read-only state
- loading state
- unauthenticated state
- not-found/error state
- empty-block state
- frontend tests for routing, rendering, edit calls, reorder calls, delete calls, and archived read-only behavior

Excluded:

- guide creation UI
- project guide list page
- capture-to-guide creation button
- creating new blocks manually
- changing block type
- rich text editor
- drag-and-drop
- annotations/drawing tools
- image cropping/zoom editor
- GIF generation
- public guide viewer
- publishing snapshots
- share links
- analytics
- comments/collaboration
- AI rewrite/suggestion UI
- Chrome extension changes
- desktop app

## Current Web App State

Current files:

```text
apps/web/src/App.tsx
apps/web/src/App.module.css
apps/web/src/index.css
apps/web/src/main.tsx
apps/web/src/App.test.tsx
apps/web/src/lib/routes.ts
apps/web/src/lib/api.ts
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
```

Important observations:

- `apps/web` is a Vite React app.
- The portal already has a capture-session detail slice from plan 012.
- There is no full router dependency yet.
- Vitest, Testing Library, and jsdom are already available.
- `pnpm --filter web lint` runs with `--max-warnings 0`, so new frontend code must not add warnings.
- Route parsing already lives in `apps/web/src/lib/routes.ts`.
- API helpers already live in `apps/web/src/lib/api.ts`.
- Capture-session UI already uses a feature folder under `apps/web/src/features/capture-session`.
- Add guide UI under `apps/web/src/features/guide`.
- Keep the same lightweight path parsing approach instead of adding React Router.
- Use relative `/api/...` calls by default and `credentials: "include"`.
- Preserve the existing Vite proxy/API base approach from the capture detail portal.

## UX Direction

This is an internal document preparation interface. It should be quiet, dense, and efficient:

- no landing page
- no marketing hero
- no decorative art
- no nested cards
- no one-note gradient-heavy palette
- prioritize readable steps, screenshot context, and fast editing

Suggested layout:

```text
top app bar
  Demo Composer
  project / guide context

main editor shell
  guide header band
    title input
    description textarea
    status badge
    save state

  editor body
    left / main column
      ordered guide blocks
      step title input
      step body textarea
      up/down/delete actions

    right / secondary column on desktop
      selected/source screenshot context
      guide metadata

mobile
  single column
  block actions stay compact and icon/text based
```

Interaction style:

- save on explicit user action for this slice, not autosave
- use small inline Save buttons for guide metadata and step edits
- use up/down buttons for reorder, not drag-and-drop yet
- use a delete button with a confirmation prompt or confirm state
- after successful reorder/delete, refresh guide detail or update local state from API response
- archived guide disables all inputs and mutation controls

## Route Contract

Portal route:

```text
/projects/:project_id/guides/:guide_id
```

Backend requests:

```text
GET    /api/v1/projects/:project_id/guides/:guide_id
PATCH  /api/v1/projects/:project_id/guides/:guide_id
PATCH  /api/v1/projects/:project_id/guides/:guide_id/steps/:step_id
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/reorder
DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:block_id
```

Request behavior:

- use `credentials: "include"` for every request
- do not store auth tokens in local storage
- use relative `/api/...` URLs unless the existing portal API helper says otherwise
- handle `401` as unauthenticated
- handle `404` as not found
- handle `409 guide_not_editable` as read-only conflict and refetch guide detail
- show stable error text for failed mutations

API helper note:

- current `ApiClientError` exposes `kind` and `status`
- if the editor needs to distinguish `guide_not_editable` from other validation conflicts, extend `ApiClientError` to preserve backend `error.type`
- do not parse backend error shapes ad hoc inside React components

## Data Contract

The page should consume the guide detail response:

```json
{
  "guide": {
    "id": "guide_id",
    "organization_id": "organization_id",
    "project_id": "project_id",
    "source_capture_session_id": "capture_session_id",
    "title": "Create department workflow",
    "description": null,
    "status": "draft",
    "created_by_id": "org_user_id",
    "updated_by_id": "org_user_id",
    "version": 1,
    "created_at": "2026-06-05T10:00:00.000Z",
    "updated_at": "2026-06-05T10:10:00.000Z"
  },
  "guide_blocks": [
    {
      "id": "block_id",
      "organization_id": "organization_id",
      "project_id": "project_id",
      "guide_id": "guide_id",
      "source_capture_session_id": "capture_session_id",
      "source_capture_event_id": "event_id",
      "source_capture_asset_id": "asset_id",
      "block_type": "step",
      "block_index": 1,
      "created_by_id": "org_user_id",
      "updated_by_id": "org_user_id",
      "version": 1,
      "created_at": "2026-06-05T10:00:00.000Z",
      "updated_at": "2026-06-05T10:10:00.000Z",
      "step": {
        "id": "step_id",
        "organization_id": "organization_id",
        "project_id": "project_id",
        "guide_id": "guide_id",
        "guide_block_id": "block_id",
        "source_capture_session_id": "capture_session_id",
        "source_capture_event_id": "event_id",
        "source_capture_asset_id": "asset_id",
        "title": "Click \"Add Department\"",
        "body": null,
        "created_by_id": "org_user_id",
        "updated_by_id": "org_user_id",
        "version": 1,
        "created_at": "2026-06-05T10:00:00.000Z",
        "updated_at": "2026-06-05T10:10:00.000Z"
      }
    }
  ]
}
```

The frontend should explicitly ignore and never render:

- `metadata`
- `is_deleted`
- `deleted_at`
- `deleted_by_id`
- `storage_key`
- `target_selector`
- `input_intent`

These fields should not be present, but the UI should not depend on them.

## Screenshot Context

Current guide detail only exposes `source_capture_asset_id`, not full asset file URLs.

MVP options:

1. Show a source asset reference placeholder:

```text
Screenshot source: asset_id
```

2. If an existing authenticated file/asset URL is already available through another frontend helper, render the image.

Recommendation for this slice:

- do not add new backend read model fields just for screenshots
- render source asset reference placeholders for now
- add a follow-up plan for guide detail including lightweight source asset preview data if the editor needs real screenshot previews

Reason:

- this slice should wire guide editing first
- adding asset preview joins to guide detail is backend read-model work and should be planned separately if needed

## State Model

Keep local state simple:

```text
route params
guide detail load state
guide metadata draft
per-step drafts keyed by step id
mutation state per action
error banner
selected block id optional
```

Avoid introducing global state or a query library in this slice unless the current portal already has one.

After successful mutations:

- update guide metadata response directly for guide patch
- update step response directly in local guide detail for step patch
- replace ordered block list from reorder response
- remove block locally after successful delete, or refetch detail if simpler

Conservative choice:

- refetch guide detail after delete
- replace local block list from reorder response
- local patch after metadata/step update

## Component Plan

Follow the existing capture-session feature structure.

Add:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/guide/types.ts
```

Update:

```text
apps/web/src/App.tsx
apps/web/src/App.test.tsx
apps/web/src/lib/routes.ts
apps/web/src/lib/routes.test.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Possible extracted helpers/components:

```text
GuideEditorPage
GuideHeaderEditor
GuideBlockList
GuideStepEditor
GuideSourcePanel
```

Use extraction only when it improves readability.

## Error And Empty States

Loading:

```text
Loading guide...
```

Unauthenticated:

```text
Sign in to continue.
```

Not found:

```text
Guide not found.
```

No blocks:

```text
This guide does not have any blocks yet.
```

Archived:

```text
Archived guides are read-only.
```

Mutation error:

```text
Could not save changes.
Could not reorder blocks.
Could not delete block.
```

Keep error text concise and stable for tests.

## Test Plan

Extend or replace:

```text
apps/web/src/App.test.tsx
```

Cover:

- route parser recognizes `/projects/:project_id/guides/:guide_id`
- App renders `GuideEditorPage` for guide routes
- API helper calls `GET /api/v1/projects/:project_id/guides/:guide_id`
- guide detail page fetches `GET /api/v1/projects/:project_id/guides/:guide_id`
- request uses `credentials: "include"`
- loading state renders
- guide title/description/status render
- ordered guide blocks render by `block_index`
- empty guide block state renders
- archived guide disables edit controls
- guide metadata save sends `PATCH /api/v1/projects/:project_id/guides/:guide_id`
- step save sends `PATCH /api/v1/projects/:project_id/guides/:guide_id/steps/:step_id`
- up/down reorder sends the complete ordered block ID list to `blocks/reorder`
- delete sends `DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:block_id`
- unauthenticated response renders sign-in state
- not-found response renders not-found state
- mutation failure renders stable error text
- UI does not render internal/private field names if accidentally present in fixture payload

Testing approach:

- keep tests at the React public UI level
- mock `fetch`
- use the existing Vitest and Testing Library setup
- test exported route/API helpers in their existing focused test files
- assert visible text and request URLs/methods/bodies

## Styling Plan

Update:

```text
apps/web/src/App.module.css
apps/web/src/index.css
```

Design requirements:

- responsive layout
- compact controls
- no nested cards
- no decorative gradients/orbs
- professional internal-tool feel
- text must not overflow buttons or panels
- use stable dimensions for block action controls
- ensure mobile single-column layout works

Suggested visual language:

- neutral background
- white or near-white editor surface
- subtle borders
- restrained blue/green/amber accents for status and actions
- clear focus states

## Implementation Order

Use TDD:

1. Add red tests for guide route parsing and guide detail fetch/render.
2. Implement minimal route parser and guide detail load state.
3. Add red tests for guide metadata edit/save.
4. Implement metadata edit/save.
5. Add red tests for step edit/save.
6. Implement step edit/save.
7. Add red tests for reorder up/down.
8. Implement reorder controls and API call.
9. Add red tests for delete block.
10. Implement delete action.
11. Add red tests for archived read-only and error states.
12. Implement read-only/error states.
13. Refine responsive styling.
14. Run full web verification.
15. Commit the slice.

## Verification Commands

Run:

```text
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

If the root workspace has an established command for all apps, run that too if practical.

## Acceptance Criteria

- opening `/projects/:project_id/guides/:guide_id` loads guide detail
- guide title and description are editable for draft guides
- step title and body are editable for draft guides
- blocks display in persisted order
- blocks can be moved up/down
- blocks can be deleted
- archived guides render read-only
- auth/not-found/error states are handled
- API calls send cookies
- private/internal fields are not rendered
- web tests/typecheck/lint/build pass
