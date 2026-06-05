# Capture Session Detail Read Model Plan

Date: 2026-06-05

## Goal

Add a backend read model that loads a capture session with the source material needed by the portal after capture completion:

```text
authenticated user
  -> project
  -> capture session
  -> detail endpoint
  -> session metadata
  -> ordered events
  -> asset metadata
  -> authenticated asset file URLs
```

This gives the portal one stable API call to render a captured workflow after the extension calls capture session completion.

## Why This Comes Next

Current state:

- projects exist
- capture sessions exist and can be completed
- screenshot assets can be uploaded and read
- capture events can be created and listed
- the extension can eventually redirect users after completion
- the portal does not yet have one endpoint for the raw captured workflow

Risk if skipped:

- portal code would need to call multiple endpoints and join records client-side
- ordering and missing/deleted child behavior would drift across clients
- extension redirect would land on a page that needs ad hoc loading logic
- later doc/demo preparation would lack a single source read contract

This slice should build a backend read model only. It should not build portal UI, Chrome extension capture, guide generation, demo generation, analytics, AI, thumbnails, redaction, or publish/share behavior.

## Existing Decisions To Honor

Relevant docs:

```text
docs/plan/006-capture-session-foundation.md
docs/plan/007-capture-asset-metadata.md
docs/plan/008-capture-event-foundation.md
docs/plan/009-capture-asset-upload-storage.md
docs/plan/010-capture-session-finalization.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
```

Important implications:

- capture sessions own workflow lifecycle
- capture events are ordered source facts
- capture assets are immutable source material records
- file storage details remain private
- API responses must not expose `storage_key`, local filesystem paths, file metadata JSON, or soft-delete internals
- raw input values must remain redacted

## Scope

Included:

- new detail read-model service method
- new detail read-model repository query
- new route endpoint
- response includes capture session, ordered events, and asset metadata
- response includes authenticated file read URLs for assets
- project/session/org scope checks
- soft-deleted sessions/assets/events excluded
- capture events ordered by `event_index ASC`
- capture assets ordered predictably
- no pagination for this MVP read model
- service tests
- route tests
- DB-backed integration tests

Excluded:

- portal UI
- Chrome extension implementation
- upload changes
- event creation changes
- image byte streaming changes
- signed/public URLs
- object storage adapters
- thumbnails
- redaction
- guide/doc generation
- interactive demo generation
- analytics
- AI
- database migration unless implementation discovers an unavoidable missing persistence field
- pagination/windowing

No database migration should be needed.

## API Contract

### Get Capture Session Detail

```text
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/detail
```

Authentication:

```text
demo_composer_session cookie required
```

Behavior:

- verifies auth
- verifies project belongs to current organization and is not deleted
- verifies capture session belongs to project/current organization and is not deleted
- returns one capture session
- returns non-deleted capture events for that session ordered by `event_index ASC`
- returns non-deleted capture assets for that session ordered by `created_at ASC, id ASC`
- includes a relative authenticated file URL for each asset:

```text
/api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:asset_id/file
```

Success:

```text
200 OK
```

Response:

```json
{
  "capture_session": {
    "id": "capture_session_id",
    "organization_id": "organization_id",
    "project_id": "project_id",
    "name": "Create department workflow",
    "description": null,
    "status": "completed",
    "source_type": "extension",
    "started_at": "2026-06-05T10:00:00.000Z",
    "completed_at": "2026-06-05T10:05:00.000Z",
    "canceled_at": null,
    "start_url": "https://example.internal/app",
    "browser_name": "Chrome",
    "browser_version": "125.0.0",
    "operating_system": "Linux",
    "viewport_width": 1440,
    "viewport_height": 900,
    "device_pixel_ratio": 1,
    "user_agent": "Mozilla/5.0 ...",
    "created_by_id": "org_user_id",
    "updated_by_id": "org_user_id",
    "version": 2,
    "created_at": "2026-06-05T10:00:00.000Z",
    "updated_at": "2026-06-05T10:05:00.000Z"
  },
  "capture_events": [
    {
      "id": "event_id",
      "organization_id": "organization_id",
      "project_id": "project_id",
      "capture_session_id": "capture_session_id",
      "capture_asset_id": "asset_id",
      "event_type": "capture",
      "event_index": 1,
      "occurred_at": "2026-06-05T10:01:00.000Z",
      "page_url": "https://example.internal/app",
      "page_title": "Department",
      "target_label": null,
      "target_selector": null,
      "target_role": null,
      "target_test_id": null,
      "target_text": null,
      "client_x": null,
      "client_y": null,
      "viewport_width": 1440,
      "viewport_height": 900,
      "device_pixel_ratio": 1,
      "input_intent": null,
      "input_value_redacted": true,
      "note": null,
      "created_by_id": "org_user_id",
      "updated_by_id": "org_user_id",
      "version": 1,
      "created_at": "2026-06-05T10:01:00.000Z",
      "updated_at": "2026-06-05T10:01:00.000Z"
    }
  ],
  "capture_assets": [
    {
      "id": "asset_id",
      "organization_id": "organization_id",
      "project_id": "project_id",
      "capture_session_id": "capture_session_id",
      "file": {
        "id": "file_id",
        "storage_provider": "local",
        "mime_type": "image/png",
        "size_bytes": 123456,
        "original_name": "screenshot.png",
        "checksum_sha256": "hex"
      },
      "asset_type": "screenshot",
      "width": 1440,
      "height": 900,
      "device_pixel_ratio": 1,
      "page_url": "https://example.internal/app",
      "page_title": "Department",
      "captured_at": "2026-06-05T10:01:00.000Z",
      "created_by_id": "org_user_id",
      "updated_by_id": "org_user_id",
      "version": 1,
      "created_at": "2026-06-05T10:01:00.000Z",
      "updated_at": "2026-06-05T10:01:00.000Z",
      "file_url": "/api/v1/projects/project_id/capture-sessions/capture_session_id/assets/asset_id/file"
    }
  ]
}
```

Notes:

- Keep `capture_asset.file.storage_provider`, `mime_type`, `size_bytes`, `original_name`, and `checksum_sha256` because those are already public capture asset response fields.
- Do not include `storage_key`.
- Do not include absolute local paths.
- Do not include metadata JSON unless a later endpoint intentionally exposes a curated metadata view.
- `file_url` should be relative so deployment origin remains a client concern.
- `file_url` should be built from persisted IDs, not client body input.
- No pagination is included in this slice. If a capture session becomes too large, add pagination or sectioned read models in a later plan.

## Error Contract

Use the same stable error response shape:

```json
{
  "error": {
    "type": "error_type",
    "message": "Human readable message"
  }
}
```

Errors:

```text
401 unauthenticated
404 project_not_found
404 capture_session_not_found
```

Messages:

```text
Authentication is required
Project was not found
Capture session was not found
```

## Domain Rules

### Backend Owns The Join

The backend should return the read model already joined by capture session scope.

Reasoning:

- clients should not have to know child endpoint ordering rules
- the portal should render from one backend contract
- later doc/demo preparation can reuse the same source shape

### Event Ordering

Events must be ordered by:

```text
event_index ASC
```

Tie-breaker, if needed:

```text
created_at ASC, id ASC
```

Reasoning:

- `event_index` is the workflow order chosen by capture clients
- UI and guide/doc preparation need stable sequence

### Asset Ordering

Assets should be ordered predictably:

```text
created_at ASC, id ASC
```

Reasoning:

- assets may not have an event reference yet
- deterministic ordering makes tests and UI stable
- the existing asset list endpoint currently orders newest first; detail intentionally uses oldest first because it is a workflow read model

### Asset File URL

For every returned capture asset, add:

```text
file_url = /api/v1/projects/{project_id}/capture-sessions/{capture_session_id}/assets/{asset_id}/file
```

Reasoning:

- file bytes already have an authenticated read endpoint
- portal can render screenshots without knowing storage internals
- URLs remain private and cookie-authenticated

### Soft Delete Behavior

If the capture session is soft-deleted:

```text
404 capture_session_not_found
```

If child assets or events are soft-deleted:

```text
omit them from arrays
```

If a non-deleted event references a soft-deleted asset:

```text
keep the event, omit the asset
```

Reasoning:

- this matches existing resource visibility behavior
- detail should not expose deleted source material
- non-deleted events remain source facts even if a referenced asset is later deleted

## Module Shape

Recommended implementation location:

```text
apps/server/src/modules/capture-session/
```

Add service method:

```text
get_capture_session_detail
```

Add repository method:

```text
get_capture_session_detail
```

Suggested service type:

```ts
type CaptureSessionDetail = {
  capture_session: CaptureSession;
  capture_events: CaptureEvent[];
  capture_assets: Array<CaptureAsset & {
    file_url: string;
  }>;
};
```

Repository can either:

- perform three scoped queries and compose the result, or
- use JSON aggregation if the code remains clear

Recommendation:

- use three explicit queries inside one repository method
- reuse local mapping logic or duplicate small mappers if cross-module imports create cycles
- avoid reaching through route/service modules from the repository
- repository should return only safe public fields, never `storage_key` or metadata JSON
- service can add `file_url` if keeping URL construction out of SQL is cleaner
- if importing `CaptureEvent` or `CaptureAsset` types, use type-only imports to avoid runtime module cycles

## Route Shape

Extend:

```text
apps/server/src/modules/capture-session/capture-session.routes.ts
```

Route:

```text
GET /:project_id/capture-sessions/:id/detail
```

Important:

- register before generic `GET /:project_id/capture-sessions/:id`
- authenticate through existing cookie auth helper
- pass auth-derived organization ID and actor ID to service
- return `200 { capture_session, capture_events, capture_assets }`
- update capture-session app integration test mocks because the route dependency contract will gain `get_capture_session_detail`

## TDD Plan

Use red-green-refactor.

### Service Tests

Add tests for:

- gets detail after project scope check
- maps missing project to `ProjectNotFoundError`
- maps missing capture session detail to `CaptureSessionNotFoundError`
- adds relative `file_url` to every returned capture asset
- preserves event ordering returned by repository
- does not mutate asset/event payloads beyond adding `file_url`
- returns an empty events/assets array when the session has no children

### Route Tests

Add tests for:

- unauthenticated detail request returns `401 unauthenticated`
- successful detail request passes auth/project/session IDs to service
- successful response includes session, ordered events, assets, and file URLs
- `ProjectNotFoundError` maps to `404 project_not_found`
- `CaptureSessionNotFoundError` maps to `404 capture_session_not_found`
- detail route is matched before generic `/:id` route
- app integration confirms the mounted route works through `/api/v1/projects/:project_id/capture-sessions/:id/detail`

### DB Integration Tests

Add DB-backed tests for:

- detail returns capture session with assets and events under the project/session scope
- events are ordered by `event_index ASC`
- assets are ordered by `created_at ASC, id ASC`
- asset `file_url` points to existing authenticated file read route
- response does not include `storage_key`, metadata JSON, `is_deleted`, `deleted_at`, or `deleted_by_id`
- soft-deleted child asset is omitted
- soft-deleted child event is omitted
- non-deleted event that references a soft-deleted asset remains in `capture_events`, while the asset is omitted from `capture_assets`
- soft-deleted capture session returns `404 capture_session_not_found`
- deleted project returns `404 project_not_found`
- cross-org project/session remains hidden through existing scope behavior
- detail works for draft/capturing/completed sessions, not only completed sessions

## Verification Commands

Focused:

```bash
pnpm --filter server exec vitest run src/modules/capture-session/capture-session.service.test.ts
pnpm --filter server exec vitest run src/modules/capture-session/capture-session.routes.test.ts
pnpm --filter server exec env-cmd -f .env-cmdrc -e testing -- vitest run --no-file-parallelism src/modules/capture-session/capture-session.db.integration.test.ts
```

Full:

```bash
pnpm --filter server check-types
pnpm --filter server test
pnpm --filter server test:db
pnpm --filter server lint
```

## Commit Plan

Recommended small commits:

```text
test: add capture session detail coverage
feat: add capture session detail read model
fix: harden capture session detail edges
```

If implementation stays compact:

```text
feat: add capture session detail read model
```

## Open Questions For Implementation

- Should detail include `capture_events_by_asset_id` as a convenience map?
- Should detail include only completed sessions?
- Should detail include byte URLs for derived assets later?

Recommended answers for this slice:

- Do not include a convenience map yet; arrays are enough and easier to keep stable.
- Do not require completed sessions; internal users may inspect in-progress captures.
- Include `file_url` for every returned asset regardless of source/derived status, as long as the existing asset file read route can serve it.
