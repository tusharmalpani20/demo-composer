# Extension Start Capture Session Plan

Date: 2026-06-05

## Goal

Let the Chrome extension start a capture session for the selected project and persist that active session locally.

Target flow:

```text
user opens extension popup
  -> extension is connected and signed in
  -> user has selected a project
  -> user clicks Start capture
  -> extension creates a capture session in that project
  -> extension stores active capture session id
  -> popup shows active capture state
```

This slice should create the first real source-material record from the extension. It should not capture screenshots, DOM, clicks, inputs, navigation, or finalize the session yet.

## Why This Comes Next

Current state:

- `apps/extension` exists
- extension can configure an instance URL
- extension can sign in and store an extension session token
- extension can list projects
- extension can persist selected project id
- backend already supports `POST /api/v1/projects/:project_id/capture-sessions`

Missing product behavior:

- selected project does not yet lead to source capture work
- extension has no active capture session state
- next screenshot/event slices need a persisted session id to attach data to

This plan creates the session lifecycle anchor without increasing capture complexity.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/plan/006-capture-session-foundation.md
docs/plan/022-extension-foundation.md
```

Important implications:

- capture session is source material, not a final guide/demo artifact
- every capture session belongs to exactly one project
- extension requests should use the stored bearer token
- no raw typed input values are captured in this slice
- no screenshots are captured in this slice
- no content scripts or background capture orchestration yet
- no AI or analytics

## Scope

Included:

- add extension API helper for capture session creation
- add active capture session fields to extension settings
- add a small current-tab helper owned by the extension
- add popup UI for selected project ready-to-capture state
- add `Start capture` action
- create capture session through:

```text
POST {instance_url}/api/v1/projects/:project_id/capture-sessions
```

- send `Authorization: Bearer <session_token>`
- use `source_type: "extension"`
- use current tab URL/title when available
- include safe browser metadata when available
- persist active capture session id after successful creation
- persist active capture project id
- show active capture state in popup
- allow the user to discard local active capture state if the backend/session becomes unreachable
- add focused tests for API helper, settings helper, popup state, and backend bearer auth for capture-session creation
- update extension README with active capture session behavior

Excluded:

- screenshot capture
- HTML capture
- capture asset upload
- capture event recording
- content scripts
- background service worker capture orchestration
- capture session finalization/completion
- stop capture
- redirect to portal after capture
- portal changes
- guide creation changes
- project creation from extension
- multiple simultaneous capture sessions
- browser tab tracking across navigation
- analytics
- AI/BYO-key

## Backend Contract

Backend route already exists:

```text
POST /api/v1/projects/:project_id/capture-sessions
```

Request body:

```json
{
  "name": "Capture from Example Page",
  "source_type": "extension",
  "start_url": "https://example.com/path",
  "browser_name": "Chrome",
  "browser_version": null,
  "operating_system": null,
  "viewport_width": null,
  "viewport_height": null,
  "device_pixel_ratio": null,
  "user_agent": "Mozilla/5.0...",
  "metadata": {
    "extension_version": "0.1.0",
    "tab_title": "Example Page"
  }
}
```

Response:

```json
{
  "capture_session": {
    "id": "capture_session_id",
    "project_id": "project_id",
    "source_type": "extension",
    "status": "draft"
  }
}
```

Backend gap to fix:

- capture-session routes currently use only the web session cookie
- extension capture-session creation must accept bearer tokens through the shared `session_token_from_request` helper

Backend requirements:

- update capture-session routes to use bearer-or-cookie auth
- add route test proving bearer token can create a capture session
- add one lightweight route test proving a capture-session read route still accepts bearer auth after the shared helper change
- keep existing cookie behavior unchanged
- do not add new DB columns

Implementation detail:

- import `session_token_from_request` from authentication and use it inside the route-local `require_auth`
- remove the direct `web_session_cookie_name` dependency from capture-session routes
- keep existing unauthenticated error response shape unchanged

## Extension Settings Contract

Extend current settings from:

```ts
export type ExtensionSettings = {
  instanceUrl: string | null;
  sessionToken: string | null;
  selectedProjectId: string | null;
};
```

to:

```ts
export type ExtensionSettings = {
  instanceUrl: string | null;
  sessionToken: string | null;
  selectedProjectId: string | null;
  activeCaptureSessionId: string | null;
  activeCaptureProjectId: string | null;
};
```

Rules:

- default active capture fields are `null`
- changing instance clears active capture fields
- signing out clears active capture fields
- selecting a different project while active capture exists should not silently move the active session
- if the active capture project is missing from the latest project list, keep the active capture ids and show the project as unresolved instead of clearing active capture state
- starting a new capture requires no active capture session
- discarding local active capture clears only active capture fields

## Extension API Contract

Add helper:

```ts
createCaptureSession(instanceUrl, sessionToken, projectId, data)
```

Request requirements:

- URL-encode `projectId`
- send `Authorization: Bearer <sessionToken>`
- send `accept: application/json`
- send `content-type: application/json`
- send `x-demo-composer-client: extension` for source attribution consistency
- send `credentials: "include"` for consistency with existing API helpers
- map backend errors through existing `ApiClientError`

Request data type:

```ts
export type CreateCaptureSessionInput = {
  name: string;
  description?: string | null;
  source_type: "extension";
  start_url?: string | null;
  browser_name?: string | null;
  browser_version?: string | null;
  operating_system?: string | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
};
```

## Current Tab Metadata Contract

Add a small extension-local helper for reading current tab metadata.

Suggested type:

```ts
export type CurrentTabSnapshot = {
  url: string | null;
  title: string | null;
};
```

Rules:

- if Chrome `tabs` API is unavailable, return `{ url: null, title: null }`
- query the current active tab in the current window only
- if tab URL is unavailable or non-web extension/internal URL, store `null`
- allow only `http://` and `https://` URLs as `start_url`
- title can be used for session name and metadata
- do not inject scripts
- do not inspect DOM
- do not read form fields

Manifest implication:

- add `tabs` permission only if needed for `chrome.tabs.query`
- remove broad host permissions if they are not needed by this slice
- do not add `activeTab`, `scripting`, content scripts, or host capture permissions yet

## Naming Rules

Default capture session name:

```text
Capture from {tab title}
```

Fallbacks:

```text
Capture from selected project
```

or:

```text
Extension capture
```

The name should be trimmed and non-empty.

## UX Contract

### Selected Project, No Active Capture

Show:

- selected project name
- `Start capture` button
- change project controls remain available

Behavior:

- clicking `Start capture` creates capture session
- show loading state while creating
- disable project switching while the start request is in flight
- on success, store active capture session id and project id
- transition to active capture state

### No Selected Project

Show:

- project list as today
- no `Start capture` action

### Active Capture

Show:

- active capture session id or short identifier
- active project name when it can be resolved
- unresolved active project copy when the project cannot be resolved from the latest project list
- clear statement that capture is active
- `Discard local capture state` action

Behavior:

- do not create another capture while one is active
- discard action only clears extension local active state
- do not call backend completion/cancel in this slice

### Error State

Show:

- clear error when capture session cannot be created
- retry action
- keep selected project state

Common errors:

- missing selected project
- unauthenticated token
- project not found
- network/server failure

## Testing Plan

Follow TDD.

Start with red tests for:

### Backend

- capture-session route accepts bearer token for `POST /:project_id/capture-sessions`
- capture-session route accepts bearer token for at least one read endpoint
- existing cookie-auth tests still pass

### Extension Settings

- default active capture fields are `null`
- saving instance URL clears active capture fields
- saving session token as `null` clears active capture fields
- clearing settings clears active capture fields
- saving active capture stores session id and project id
- clearing active capture preserves instance/session/selected project
- selected project cleanup does not clear unresolved active capture state

### Extension API

- `createCaptureSession` posts to the configured instance and selected project
- project id is URL-encoded
- bearer token is sent
- client header is sent
- body includes `source_type: "extension"`
- backend errors map through `ApiClientError`

### Current Tab Helper

- returns nulls when Chrome tabs API is unavailable
- returns active tab URL/title when available
- ignores `chrome://`, `about:`, extension, file, and other non-HTTP(S) URLs
- queries only active tab in current window

### Popup

- selected project renders `Start capture`
- start capture calls API with selected project
- start capture uses current tab title/URL in the request payload
- created capture session is persisted
- active capture state is shown after success
- active capture state is restored from settings
- no second start action is shown while active
- discard local active capture clears active fields
- start failure renders retry/error without clearing selected project
- sign out and change instance clear active capture through settings helpers

Verification commands:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter server build
rtk pnpm --filter web test
rtk pnpm build
rtk pnpm check-types
rtk pnpm lint
```

DB integration tests are not required for this slice unless backend persistence behavior changes. This slice should only reuse the existing capture-session create behavior.

## Implementation Steps

1. Add backend capture-session bearer auth route test.
2. Update capture-session routes to use `session_token_from_request`.
3. Extend extension settings type and tests for active capture fields.
4. Add `createCaptureSession` API helper and tests.
5. Add current tab metadata helper and tests.
6. Update manifest only if the chosen tab helper needs `tabs`.
7. Add popup tests for start/active/discard/error states.
8. Implement popup changes.
9. Update extension README.
10. Run focused checks.
11. Run root checks.

## Acceptance Criteria

- Extension can start a capture session for the selected project.
- Created session uses `source_type: "extension"`.
- Created session carries safe current-tab metadata when available.
- Extension persists active capture session id and project id.
- Popup restores active capture state after reopening.
- Popup does not allow starting a second session while one is active.
- User can discard local active capture state.
- No screenshot, DOM, click, input, navigation, upload, or finalization behavior is added.
- Capture-session backend route accepts extension bearer auth.
- Extension manifest does not include broad host/capture permissions for this slice.
- Extension tests cover settings/API/tab/popup behavior.
- Server tests cover bearer-auth capture session creation and one read path.
- Required checks pass.

## Follow-Up Slice

After this plan, the next likely plan should be:

```text
024-extension-screenshot-upload
```

That slice should use the active capture session id to capture the visible tab screenshot and upload it as a capture asset. It should still avoid generalized click/input event recording until screenshot upload is proven.
