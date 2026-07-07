# Extension Finalize And Open Portal Plan

Date: 2026-06-06

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Let a user finish an active Chrome extension capture session and land directly on the portal capture session detail page.

Target flow:

```text
user opens extension popup
  -> extension is connected and signed in
  -> active capture session exists
  -> user captures one or more screenshots
  -> each screenshot has a linked ordered capture event
  -> user clicks Finish capture
  -> extension completes the backend capture session
  -> extension clears local active capture state
  -> extension opens the portal capture session detail page
  -> user reviews source material and can create a guide
```

This slice should close the first real extension-to-portal workflow. It should not add automatic event capture, guide-generation changes, public publishing, analytics, AI, or portal editor changes.

## Why This Comes Next

Current state:

- Extension can configure an instance URL and sign in.
- Extension can list projects and start an active capture session.
- Extension can restore active capture state.
- Extension can capture visible-tab screenshots.
- Extension can upload screenshot assets.
- Extension can create ordered `capture` events linked to uploaded screenshot assets.
- Backend capture session completion already exists:
  - `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete`
  - accepts bearer-or-cookie auth through `session_token_from_request`
  - returns the completed capture session and a portal redirect path.
- Portal capture session detail already shows the ordered source material and can create a guide.

Missing product behavior:

- after capture, the user has no extension action to finish the session
- active capture remains stored locally until manually discarded
- user must manually navigate back to the portal
- the extension workflow feels incomplete even though the backend and portal are ready

This plan adds the smallest useful completion behavior: finish the current active capture session and open the portal detail page.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/plan/010-capture-session-finalization.md
docs/plan/023-extension-start-capture-session.md
docs/plan/024-extension-screenshot-upload.md
docs/plan/025-extension-capture-event-recording.md
```

Important implications:

- capture sessions are reusable source material
- completion means the source capture is finished, not that a guide has been created
- extension requests should use bearer auth
- portal navigation should use the existing portal route:
  - `/projects/:project_id/capture-sessions/:capture_session_id`
- the backend should remain the source of truth for completion state
- local active capture state should only be cleared after backend completion succeeds
- AI remains deferred

## Scope

Included:

- add extension API helper for completing capture sessions
- add extension URL helper for opening the portal capture session detail route
- add a `Finish capture` action in the active capture popup state
- call backend completion with bearer auth
- clear local active capture state only after successful completion
- open a new browser tab, or update the current active tab if that is a better extension API fit, to the portal capture session detail page
- keep active capture state if completion fails
- disable active capture actions while finish is in flight
- show a completion error if backend completion fails or portal navigation fails
- do not add any new Chrome extension permissions unless implementation proves `tabs` is insufficient
- update extension README and `docs/project-zoomout-status.md`

Excluded:

- backend repository or schema changes
- new backend completion semantics
- portal UI changes
- guide creation changes
- automatic redirect after each screenshot
- automatic click/input/navigation capture
- DOM/HTML capture
- public guide/demo viewer
- publish links
- analytics
- AI/BYO-key

## Backend Contract

Existing route:

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
```

Request requirements from extension:

- URL-encode `project_id` and `capture_session_id`
- send `Authorization: Bearer <session_token>`
- send `accept: application/json`
- send `content-type: application/json` only if a body is sent
- send `x-demo-composer-client: extension`
- send no meaningful body; the route accepts an empty body
- map backend errors through the existing `ApiClientError`
- keep using `credentials: "include"` through the shared request helper for consistency, while bearer auth remains the extension auth mechanism

Expected response shape:

```ts
export type CompleteCaptureSessionResponse = {
  capture_session: CaptureSession;
  redirect: {
    path: string;
    reason: "capture_session_completed";
  };
};
```

The existing extension `CaptureSession` type is intentionally minimal. Extend it only if popup behavior needs fields beyond `id`, `project_id`, `source_type`, and `status`.

Expected success:

```json
{
  "capture_session": {
    "id": "capture_session_1",
    "project_id": "project_1",
    "source_type": "extension",
    "status": "completed"
  },
  "redirect": {
    "path": "/projects/project_1/capture-sessions/capture_session_1",
    "reason": "capture_session_completed"
  }
}
```

Backend changes are not expected because the route already uses `session_token_from_request`. Add backend tests only if a gap appears while implementing extension behavior.

## Portal URL Contract

The backend returns a portal-relative path:

```text
/projects/:project_id/capture-sessions/:capture_session_id
```

The extension should combine the configured instance URL with that path:

```text
{instance_url}/projects/:project_id/capture-sessions/:capture_session_id
```

Rules:

- trim trailing slashes from `instance_url`
- preserve the backend returned redirect path if available
- ensure the final URL is same-origin with the configured instance URL
- if the backend redirect path is absent or invalid, fall back to a locally constructed path using encoded project/session ids
- do not trust an absolute redirect URL returned by the backend in this slice
- do not include session tokens in the URL

Recommended helper:

```ts
buildPortalCaptureSessionUrl(instanceUrl, redirectPath, projectId, captureSessionId)
```

This helper should:

- return an absolute URL string
- accept only relative redirect paths starting with `/`
- reject or ignore protocol-relative paths such as `//evil.example`
- reject or ignore absolute URLs such as `https://evil.example/path`
- fall back to:

```text
/projects/{encodeURIComponent(projectId)}/capture-sessions/{encodeURIComponent(captureSessionId)}
```

## Extension Browser Navigation Contract

Add a small extension navigation abstraction so tests do not depend directly on global Chrome APIs.

Recommended dependency:

```ts
openPortalUrl(url: string): Promise<void>
```

Default behavior:

- use `chrome.tabs.create({ url })` when available
- if `chrome.tabs.create` is not available, use `globalThis.open(url, "_blank", "noopener,noreferrer")` as a development fallback
- if neither is available, reject with a clear error
- no manifest permission change is expected because the extension already requests `tabs`

Testing should inject this dependency and assert the URL.

Reason:

- popup tests can stay deterministic
- the app does not need to know the details of Chrome's tab API
- future desktop or browser variants can replace navigation without changing the popup flow

## Popup Behavior

Active capture state should show:

- project name
- capture session id
- latest recorded event success, when applicable
- `Capture screenshot`
- `Finish capture`
- `Discard local capture state`

Button semantics:

- `Capture screenshot` keeps current behavior.
- `Finish capture` completes the backend capture session and opens the portal detail page.
- `Discard local capture state` remains a local-only escape hatch and does not complete the backend session.

On `Finish capture`:

1. require `instanceUrl`, `sessionToken`, `activeCaptureProjectId`, and `activeCaptureSessionId`
2. disable active capture actions
3. clear previous finish error
4. call `completeCaptureSession(instanceUrl, sessionToken, projectId, captureSessionId)`
5. build portal URL from `instanceUrl` plus response `redirect.path`
6. clear local active capture state
7. update local app state so `activeCaptureSessionId`, `activeCaptureProjectId`, and `activeCaptureEventIndex` are `null`
8. open the portal capture session detail URL
9. if the popup remains open, render the signed-in project picker without active capture state

Failure rules:

- if completion fails, do not clear active capture state
- if completion fails, do not open portal
- if local active state clearing fails after completion, show an error and do not open portal because reopening the popup could still show stale active capture state
- if portal opening fails after completion and local clearing, show an error; active state may already be cleared because the backend session is completed
- if the backend returns `capture_session_not_completable`, show the backend message
- while finishing, disable screenshot capture, finish, discard, sign out, and change instance
- successful finish should not clear the selected project; it should only clear active capture fields

Open-after-clear note:

- clear local active capture state before opening the portal tab so reopening the popup does not show a stale active capture
- if opening fails, the user can still navigate manually to the portal path shown by the error copy if the popup remains open

## Extension API Contract

Add response type:

```ts
export type CompleteCaptureSessionResponse = {
  capture_session: CaptureSession;
  redirect: {
    path: string;
    reason: "capture_session_completed";
  };
};
```

Add helper:

```ts
completeCaptureSession(instanceUrl, sessionToken, projectId, captureSessionId)
```

Request:

```text
POST {instance_url}/api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
```

Headers:

```text
Authorization: Bearer <session_token>
accept: application/json
x-demo-composer-client: extension
```

Body:

- omit the body or send `{}` only if the fetch helper requires it
- prefer omitting body because the backend accepts an empty body and this route is command-like
- do not send `content-type: application/json` when omitting the body

## Testing Plan

Use TDD.

Extension API tests:

- `completeCaptureSession` posts to the encoded complete route
- request includes bearer auth and extension client header
- request omits sensitive values and does not include session token in the URL
- backend errors map through `ApiClientError`

Portal URL/navigation tests:

- builds an absolute portal URL from instance URL and relative redirect path
- trims trailing slashes from instance URL
- handles `null` or empty redirect paths by falling back to the encoded local path
- ignores unsafe absolute redirect URLs and falls back to encoded local path
- ignores protocol-relative redirect paths and falls back to encoded local path
- `openPortalUrl` uses `chrome.tabs.create` when available
- `openPortalUrl` falls back to `window.open` in development/test environments
- `openPortalUrl` rejects when no navigation mechanism exists

Popup tests:

- active capture renders `Finish capture`
- finishing calls `completeCaptureSession` with instance URL, token, project id, and capture session id
- successful finish clears active capture state
- successful finish preserves the selected project
- successful finish opens the portal detail URL returned by backend redirect
- successful finish falls back to the encoded portal route if backend redirect is missing or unsafe
- successful finish removes active capture UI from the popup
- while finishing, active capture actions are disabled
- completion failure keeps active capture state and does not open portal
- local clear failure does not open portal
- portal open failure shows an error after completion
- discard still clears local state without calling complete

Backend tests:

- not required unless implementation reveals a bearer auth gap on the existing completion route
- existing capture session completion tests should continue passing

Verification commands:

```bash
rtk pnpm --filter extension test -- src/lib/api.test.ts src/App.test.tsx
rtk pnpm --filter extension test
rtk pnpm --filter server test -- capture-session.routes.test.ts
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

DB integration tests are not expected unless backend behavior changes. This slice should reuse the existing capture session completion route and persistence.

## Implementation Order

1. Add extension API tests for `completeCaptureSession`.
2. Implement the extension API helper and response type.
3. Add URL/navigation helper tests.
4. Implement portal URL builder and `openPortalUrl`.
5. Add popup tests for `Finish capture` success and failure paths.
6. Wire completion, local state clearing, and portal opening into the popup.
7. Add backend route tests only if bearer completion behavior is not already covered or fails during implementation.
8. Update extension README and `docs/project-zoomout-status.md`.
9. Run full verification.

## Acceptance Criteria

- Active capture popup shows a `Finish capture` action.
- `Finish capture` calls the backend completion route with bearer auth.
- Backend completion response is mapped through a typed extension API helper.
- Local active capture state is cleared only after backend completion succeeds.
- Extension opens the portal capture session detail page after clearing local active state.
- The opened URL is built from the configured instance URL and a safe relative portal path.
- Unsafe redirect paths are not trusted.
- Selected project state is preserved after finish.
- Completion failures keep active capture state and do not open the portal.
- Discard remains local-only and does not call backend completion.
- Focused extension tests cover API, URL/navigation helpers, and popup behavior.
- Full tests, type checks, build, and lint pass.

## Risks And Tradeoffs

- If opening a new tab fails after backend completion succeeds, the local active capture may already be cleared. This is acceptable because the backend source session is complete and the user can navigate to the portal manually.
- The backend redirect path is same-app relative today. Keeping extension-side URL validation prevents future mistakes from becoming open redirects.
- This does not enforce that at least one event exists before completion. Empty captures can already be completed by the backend and should remain allowed for now.
- Finalizing before guide generation keeps the product flow honest: capture source first, guide artifact second.

## Recommended Commit Shape

```text
feat: add extension capture completion API
feat: finish extension captures in portal
docs: update extension finalize workflow status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/027-guide-generation-from-capture-events.md
```

That slice should improve guide generation so screenshot-backed `capture` events become clean ordered Scribe-style guide steps with the right screenshot attached.
