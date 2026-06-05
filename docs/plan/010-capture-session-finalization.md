# Capture Session Finalization Plan

Date: 2026-06-05

## Goal

Add a dedicated backend command for finishing a capture session:

```text
authenticated user
  -> project
  -> capture session
  -> finalize capture
  -> session status = completed
  -> completed_at set by server
  -> response gives portal redirect target
```

This gives the Chrome extension a clean final step after it uploads screenshot assets and capture events. Once the extension is done recording, it can call one endpoint and then send the user to the portal view for that capture session.

## Why This Comes Next

Current state:

- projects exist
- capture sessions exist
- capture assets can store screenshot bytes
- capture events can reference capture assets
- generic capture session update already allows status changes
- there is no explicit "done recording" command for extension-driven capture
- there is no API response telling the client where to open the finished capture in the portal

Risk if skipped:

- extension code would need to know too much about generic session PATCH behavior
- finalization semantics would be spread across clients
- the portal redirect after capture would be ad hoc
- later doc/demo generation would not have a single lifecycle moment to hook into

This slice should close the capture lifecycle for the MVP. It should not build the Chrome extension, portal detail page, guide generation, demo generation, analytics, publish workflow, or background processing yet.

## Existing Decisions To Honor

Relevant docs:

```text
docs/plan/006-capture-session-foundation.md
docs/plan/007-capture-asset-metadata.md
docs/plan/008-capture-event-foundation.md
docs/plan/009-capture-asset-upload-storage.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
```

Important implications:

- capture sessions own lifecycle state
- lifecycle timestamps are server-managed
- uploaded assets and events stay immutable source records
- screenshot capture is the MVP source
- the extension should use authenticated backend APIs
- public responses must not expose storage keys or local paths

## Existing Implementation To Account For

Current capture session behavior:

- `CaptureSessionStatus = draft | capturing | completed | canceled | archived`
- `PATCH /api/v1/projects/:project_id/capture-sessions/:id` can already update status
- repository sets:
  - `started_at = COALESCE(started_at, CURRENT_TIMESTAMP)` when status becomes `capturing`
  - `completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)` when status becomes `completed`
  - `canceled_at = COALESCE(canceled_at, CURRENT_TIMESTAMP)` when status becomes `canceled`
- routes reject client-provided lifecycle timestamps
- the generic update endpoint currently allows broad valid status transitions

This plan should not remove the generic update behavior yet. It should add a dedicated finalization command with stricter semantics for capture clients.

## Scope

Included:

- service method for finalizing a capture session
- repository method for finalizing a capture session
- route endpoint for finalization
- server-managed `completed_at`
- updater audit fields and version increment
- idempotent handling for already completed sessions
- stable API error for sessions that cannot be finalized
- portal redirect target in the response
- service tests
- route tests
- DB-backed integration tests

Excluded:

- Chrome extension implementation
- frontend portal page implementation
- generated docs/demo output
- capture session detail API with embedded assets/events
- analytics
- notifications
- background jobs
- publish/share workflow
- migration, unless implementation discovers an unavoidable missing field

No new database migration should be needed for this slice.

## API Contract

### Complete Capture Session

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
```

Authentication:

```text
demo_composer_session cookie required
```

Request body:

```json
{}
```

The route should accept an empty JSON body or no body. It should reject any non-empty body with `invalid_capture_session_completion` so the endpoint remains command-like and clients cannot smuggle lifecycle fields into a finalization command.

Behavior:

- verifies auth
- verifies project belongs to current organization and is not deleted
- verifies capture session belongs to project/current organization and is not deleted
- allows finalization from:
  - `draft`
  - `capturing`
  - `completed`
- if status is `draft` or `capturing`:
  - set `status = completed`
  - set `completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)`
  - set `updated_by_id`
  - set `updated_at = CURRENT_TIMESTAMP`
  - increment `version`
- if status is already `completed`:
  - return the existing completed session
  - do not change `completed_at`
  - do not increment `version`
  - this makes repeated extension calls safe
- if status is `canceled` or `archived`:
  - reject with `capture_session_not_completable`

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
  "redirect": {
    "path": "/projects/project_id/capture-sessions/capture_session_id",
    "reason": "capture_session_completed"
  }
}
```

Notes:

- The backend should return a relative portal path, not a hardcoded full portal origin.
- The frontend/extension can combine this with the instance's portal base URL later.
- If the eventual web route name differs, update this plan before implementation.
- Build the path from the persisted `project_id` and capture session `id`, not from client-controlled body input.

## Error Contract

Use the existing stable error response shape:

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
400 invalid_capture_session_completion
400 capture_session_not_completable
404 project_not_found
404 capture_session_not_found
```

Messages:

```text
Authentication is required
Capture session completion input is invalid
Capture session cannot be completed from its current status
Project was not found
Capture session was not found
```

## Domain Rules

### Completion Is A Command

Use a dedicated method:

```text
complete_capture_session
```

Reasoning:

- the extension needs one obvious final API call
- the backend owns lifecycle side effects
- later hooks can attach to this command without changing generic update behavior

### Idempotency

Completion should be idempotent for `completed` sessions.

Reasoning:

- browser extensions may retry after network uncertainty
- double-click or popup reload should not corrupt timestamps
- `completed_at` is the source timestamp for when capture was first finished

### Non-Completable States

Reject:

```text
canceled
archived
```

Reasoning:

- `canceled` means the capture was intentionally abandoned
- `archived` is no longer active workflow material
- clients should create or restore a different session rather than mutate these states

### Draft Completion

Allow `draft -> completed`.

Reasoning:

- early extension versions may create a session and upload everything without explicitly moving to `capturing`
- the finalization command should close that session cleanly
- `started_at` can remain null if the session was never marked as capturing

## Repository Shape

Add:

```ts
complete_capture_session(input: {
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  actor_org_user_id: string;
}) => Promise<{
  capture_session: CaptureSession | null;
  outcome: "completed" | "already_completed" | "not_completable" | "not_found";
}>
```

Alternative acceptable implementation:

- return a discriminated union
- or return `CaptureSession | null` and let service inspect prior state

Recommended SQL shape:

1. Find session by org/project/session where not deleted.
2. If missing, return `not_found`.
3. If status is `completed`, return current row as `already_completed`.
4. If status is `canceled` or `archived`, return `not_completable`.
5. If status is `draft` or `capturing`, update to completed.

Keep the idempotent already-completed branch read-only.

Recommended race-safe implementation:

- Prefer a single repository method backed by a short transaction, or one `UPDATE ... WHERE status IN ('draft', 'capturing') RETURNING ...` followed by a read to distinguish `completed`, `not_completable`, and `not_found`.
- Do not implement completion as a blind generic `update_capture_session({ status: "completed" })`, because that would allow canceled/archived sessions to complete and would increment already completed sessions.
- Repeated completion calls must preserve `completed_at` and `version`.

## Service Shape

Add:

```text
complete_capture_session
```

Service responsibilities:

- verify project exists before touching session state
- call repository completion command
- map missing session to `CaptureSessionNotFoundError`
- map non-completable session to `CaptureSessionNotCompletableError`
- return capture session plus redirect descriptor

Suggested service return type:

```ts
type CompletedCaptureSessionResult = {
  capture_session: CaptureSession;
  redirect: {
    path: string;
    reason: "capture_session_completed";
  };
};
```

Redirect path builder:

```text
/projects/{project_id}/capture-sessions/{capture_session_id}
```

Keep this as a small pure helper so future portal route changes are centralized.

## Route Shape

Extend:

```text
apps/server/src/modules/capture-session/capture-session.routes.ts
```

Add to route dependencies:

```text
complete_capture_session
```

Route:

```text
POST /:project_id/capture-sessions/:id/complete
```

Implementation notes:

- register this route before the generic `/:project_id/capture-sessions/:id` routes if the router requires it
- authenticate through existing cookie auth helper
- pass auth-derived org and actor IDs
- do not accept client-managed lifecycle timestamps
- reject non-empty body if present
- return `{ capture_session, redirect }`
- update capture-session app integration test mocks because the route dependency contract will gain `complete_capture_session`

## TDD Plan

Use red-green-refactor.

### Service Tests

Add tests for:

- completes a `draft` session after project scope check
- completes a `capturing` session
- returns already completed sessions without asking repository to mutate if repository exposes that distinction
- rejects missing project before session mutation
- maps missing capture session to `CaptureSessionNotFoundError`
- maps canceled/archived to `CaptureSessionNotCompletableError`
- returns redirect path and reason

### Route Tests

Add tests for:

- unauthenticated complete request returns `401 unauthenticated`
- successful complete request passes auth/project/session IDs to service
- successful response includes `capture_session` and `redirect`
- empty body and omitted body are accepted
- non-empty body returns `400 invalid_capture_session_completion`
- `ProjectNotFoundError` maps to `404 project_not_found`
- `CaptureSessionNotFoundError` maps to `404 capture_session_not_found`
- `CaptureSessionNotCompletableError` maps to `400 capture_session_not_completable`

### DB Integration Tests

Add DB-backed tests for:

- complete draft session sets status `completed`, sets `completed_at`, updates actor, increments version
- complete capturing session preserves `started_at` and sets `completed_at`
- repeat complete on already completed session returns `200`, preserves `completed_at`, does not increment version
- canceled session returns `400 capture_session_not_completable`
- archived session returns `400 capture_session_not_completable`
- deleted session returns `404 capture_session_not_found`
- deleted project returns `404 project_not_found`
- cross-org project/session is hidden through the existing project scope behavior, so expect `404 project_not_found` when the project is not in the current organization
- route is mounted in the app and works through `/api/v1/projects/:project_id/capture-sessions/:id/complete`

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
test: add capture session completion coverage
feat: add capture session completion api
fix: harden capture session completion edges
```

If implementation stays compact, the first two can be combined into:

```text
feat: add capture session completion api
```

## Open Questions For Implementation

- Should the portal route eventually be `/projects/:project_id/capture-sessions/:id` or a more user-facing `/projects/:project_id/captures/:id`?
- Should generic PATCH continue allowing arbitrary status transitions after this dedicated command exists?
- Should completion require at least one uploaded asset or event?

Recommended answers for this slice:

- Use `/projects/:project_id/capture-sessions/:id` for now because it matches current backend language.
- Keep generic PATCH unchanged to avoid mixing lifecycle policy cleanup into this slice.
- Do not require assets/events yet; the extension and early internal workflows need flexible testing.
