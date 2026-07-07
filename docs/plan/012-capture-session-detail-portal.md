# Capture Session Detail Portal Plan

Date: 2026-06-05

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Build the first useful portal screen for captured workflows:

```text
authenticated portal user
  -> project capture session URL
  -> web app fetches capture session detail
  -> renders session metadata
  -> renders ordered capture events
  -> renders screenshot asset previews from authenticated file URLs
```

This is the frontend companion to `docs/plan/011-capture-session-detail-read-model.md`.

## Why This Comes Next

Current state:

- backend first-run setup exists
- password login/session auth exists
- project API exists
- capture sessions can be created, updated, completed, and soft-deleted
- capture assets can be created/uploaded/read
- capture events can be created/listed/read/deleted
- capture session detail API now returns session + ordered events + asset metadata
- after capture completion the backend returns a portal redirect path

Missing piece:

- the portal has no real capture-session detail page yet
- the web app is still mostly the Vite starter screen
- there is no frontend proof that the backend read model is usable
- future Chrome extension completion would redirect to a page that does not exist

This slice should create the first practical portal read page. It should not build the editor, generated Scribe-like document, interactive demo builder, Chrome extension, analytics, publishing, sharing, AI, or workspace invite UI.

## Existing Decisions To Honor

Relevant docs:

```text
docs/plan/001-foundation-setup-auth-project.md
docs/plan/003-password-auth-session.md
docs/plan/004-project-foundation-api.md
docs/plan/006-capture-session-foundation.md
docs/plan/007-capture-asset-metadata.md
docs/plan/008-capture-event-foundation.md
docs/plan/009-capture-asset-upload-storage.md
docs/plan/010-capture-session-finalization.md
docs/plan/011-capture-session-detail-read-model.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
```

Important implications:

- capture sessions are raw source material, not the final guide/demo
- capture events are ordered facts from capture
- capture assets are source material records
- screenshots are the first-class visual source for now
- HTML replay remains deferred
- raw input values must not be shown
- file storage internals must never appear in the browser
- the web page should consume the backend read model instead of joining events/assets client-side through multiple endpoints

## Scope

Included:

- replace the Vite starter screen with the beginning of the actual portal shell
- add lightweight frontend routing based on the current browser path
- support `/projects/:project_id/capture-sessions/:capture_session_id`
- fetch `GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/detail`
- send cookies with API requests
- render capture session title, status, source type, timestamps, browser/viewport metadata
- render ordered capture event timeline
- render screenshot asset previews using `asset.file_url`
- correlate events to assets by `capture_asset_id` for display
- empty states for no events and no assets
- loading state
- unauthenticated state
- not-found/error state
- focused frontend tests for API parsing, routing, and render states
- keep the implementation small and compatible with the current Vite app

Excluded:

- full application navigation
- project list page
- login page
- setup page
- capture session creation UI
- capture session deletion UI
- event editing
- asset editing
- step/doc preparation model
- generated Scribe-like guide UI
- interactive demo player
- Chrome extension
- desktop app
- analytics
- publish/share links
- AI
- image annotation editor
- HTML replay
- thumbnails
- signed/public URLs

## Current Web App State

Current files:

```text
apps/web/src/App.tsx
apps/web/src/App.module.css
apps/web/src/index.css
apps/web/src/main.tsx
```

Current dependencies:

```text
react
react-dom
vite
typescript
@repo/ui
```

Important observation:

- `apps/web` does not currently have React Router, TanStack Query, MSW, Vitest, Testing Library, or an established app shell.
- `apps/web/vite.config.ts` currently serves the portal on port `3000` and has no API proxy.
- `turbo.json` currently does not list `VITE_DEMO_COMPOSER_API_URL` in `globalEnv`.
- Because this is the first real portal slice, we should keep dependencies conservative.
- Use plain React state/effects and a tiny local path parser for this slice.
- Add a proper router/data library only when the portal has multiple real screens and navigation pressure.

## UX Direction

The portal is an internal operational tool first. It should feel quiet, dense, and useful:

- no marketing hero
- no decorative illustration
- no large empty landing page
- no nested card layout
- no one-note purple/blue gradient look
- prioritize scanability, event order, screenshot inspection, and status clarity

Suggested first screen structure:

```text
top bar
  product name
  project/session context

main detail layout
  header band
    session name
    status
    source type
    completion/capture metadata

  two-column desktop layout
    left: event timeline
    right: asset gallery / selected asset preview

  single-column mobile layout
    header
    timeline
    assets
```

Do not build a landing page. When a valid detail URL is opened, the detail view should be the first screen.

## Route Contract

Portal route:

```text
/projects/:project_id/capture-sessions/:capture_session_id
```

Backend request:

```text
GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/detail
```

Request behavior:

- call the same origin by default
- allow an API origin override through a Vite env variable if needed later
- use `credentials: "include"` so `demo_composer_session` is sent
- do not place auth tokens in local storage
- if `VITE_DEMO_COMPOSER_API_URL` is introduced, add it to `turbo.json` `globalEnv`

Recommended helper:

```text
api_base_url = import.meta.env.VITE_DEMO_COMPOSER_API_URL ?? ""
```

If `VITE_DEMO_COMPOSER_API_URL` is empty, requests are relative to the portal origin.

Local development choice:

- prefer a Vite dev proxy for `/api` to the server during this slice if the backend is on a different port
- keep frontend code using relative `/api/...` URLs so deployed same-origin behavior remains simple
- only set `VITE_DEMO_COMPOSER_API_URL` when a proxy is not practical
- if a separate API origin is used, confirm cookie `SameSite`, `Secure`, and CORS behavior before relying on browser auth

## Data Contract

Frontend type should mirror the backend public response:

```ts
type CaptureSessionDetail = {
  capture_session: CaptureSession;
  capture_events: CaptureEvent[];
  capture_assets: CaptureAssetWithFileUrl[];
};
```

Important frontend assumptions:

- `capture_events` is already ordered by the backend
- `capture_assets` is already ordered by the backend
- `file_url` is relative and should be resolved against the API base URL
- `capture_asset.file.storage_provider`, `mime_type`, `size_bytes`, `original_name`, and `checksum_sha256` are safe to display
- `storage_key`, metadata JSON, soft-delete fields, and raw input values should not exist in the API response and should not be represented in UI types
- do not duplicate backend Zod validation in the frontend during this slice; TypeScript response types plus defensive render fallbacks are enough

## Render Behavior

### Loading

Show a stable portal shell with loading placeholders:

```text
Loading capture session...
```

Keep layout dimensions stable enough that the page does not jump heavily when data arrives.

### Success

Show:

- session name
- description if present
- status badge
- source type
- start URL if present
- started/completed/canceled timestamps where present
- browser name/version where present
- operating system where present
- viewport width/height and device pixel ratio where present
- total event count
- total asset count

Timeline row should show:

- step/event number based on order
- event type
- event title derived from available fields:
  - `note` for note events
  - `target_label` for click/input events
  - `page_title` for navigation/capture events
  - fallback to event type
- page URL/domain if present
- timestamp
- small indication if linked asset exists

Asset panel should show:

- screenshot preview image
- asset type
- dimensions and device pixel ratio
- original file name if present
- file size
- captured timestamp
- page title or URL if present

### Empty Events

If no events:

```text
No capture events yet.
```

This is valid for draft/capturing sessions.

### Empty Assets

If no assets:

```text
No capture assets yet.
```

This is valid for draft/capturing sessions.

### Unauthenticated

If backend returns `401` with `unauthenticated`:

- show an unauthenticated state
- do not fake a login page in this slice
- include a simple action placeholder that can later route to login

Recommended text:

```text
Sign in to view this capture session.
```

### Not Found

If backend returns `404`:

```text
Capture session was not found.
```

Do not reveal whether project, org, or session was the failing scope.

### Other Errors

For unexpected errors:

```text
Could not load capture session.
```

Include a retry button.

## Implementation Plan

### 1. Add Frontend Test Setup

Add minimal frontend test tooling:

```text
vitest
@testing-library/react
@testing-library/jest-dom
jsdom
```

Add scripts to `apps/web/package.json`:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Add a small test setup file if needed.

Update `apps/web/tsconfig.json` if needed so test globals and jest-dom matchers typecheck cleanly.

If `apps/web/vite.config.ts` needs test configuration, keep it minimal:

```text
environment: jsdom
setupFiles: ./src/test/setup.ts
```

Rationale:

- this project is being built with TDD
- the portal detail screen has enough behavior to justify render tests
- tests will protect auth/error/loading states before the UI grows

### 2. Add API Client

Create:

```text
apps/web/src/lib/api.ts
```

Responsibilities:

- build API URLs
- call fetch with `credentials: "include"`
- parse success JSON
- normalize known API errors into typed client errors
- expose `getCaptureSessionDetail(projectId, captureSessionId)`
- expose `resolveApiAssetUrl(fileUrl)` for image `src` construction

Do not create a generic API framework yet.

Known client error kinds:

```text
unauthenticated
not_found
validation
unknown
```

The page should not need to know every backend error type. It only needs enough distinction for user-facing states.

### 3. Add Capture Session Types

Create:

```text
apps/web/src/features/capture-session/types.ts
```

Types:

- `CaptureSession`
- `CaptureEvent`
- `CaptureAsset`
- `CaptureSessionDetail`

Keep fields aligned with the public backend response.

### 4. Add Path Parsing

Create:

```text
apps/web/src/lib/routes.ts
```

Support only:

```text
/projects/:project_id/capture-sessions/:capture_session_id
```

Fallback:

- show a simple portal home/unsupported route state
- do not build a full router yet

### 5. Add Detail Page Component

Create:

```text
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css
```

Responsibilities:

- fetch detail on mount and when route params change
- cancel or ignore stale fetch responses when route params change quickly
- render loading/success/error states
- build event-to-asset lookup
- resolve image URLs using API base URL + `file_url`
- avoid rendering broken layout when there are no assets
- avoid rendering raw selectors or raw input-like fields as primary visible content
- use alt text based on page title, event title, or original file name
- use `loading="lazy"` for gallery images below the first visible preview

Keep helper functions local unless they are reused.

### 6. Replace Starter App

Update:

```text
apps/web/src/App.tsx
apps/web/src/App.module.css
apps/web/src/index.css
```

Remove starter Turborepo/Vercel content.

Render:

- portal shell
- detail page for supported route
- unsupported route state otherwise

### 7. Add Tests

Suggested tests:

```text
apps/web/src/lib/routes.test.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx
```

Test cases:

- parses valid capture session detail route
- rejects unsupported route
- API client sends credentials and calls correct detail URL
- API client maps `401 unauthenticated`
- API client maps `404` to not found
- API client resolves relative asset URLs correctly
- detail page renders loading then session metadata
- detail page renders events in API order
- detail page renders asset preview with resolved file URL
- detail page renders empty events/assets states
- detail page renders not-found state
- detail page renders unauthenticated state
- detail page renders retry for generic errors
- detail page does not render storage keys or metadata fields from fixture-like unexpected data

### 8. Verification

Run:

```text
pnpm --filter web check-types
pnpm --filter web test
pnpm --filter web build
pnpm --filter web lint
pnpm --filter server check-types
pnpm --filter server test
```

Server DB tests are not required for this frontend-only slice unless backend code changes.

When implementing, also run the web app locally and inspect the page in at least one desktop width and one mobile width. Use a mocked/dev backend response if a real captured session is not available yet.

## TDD Sequence

Follow red-green-refactor:

1. Write route parser tests.
2. Implement route parser.
3. Write API client tests.
4. Implement API client.
5. Write detail page render tests with mocked API function.
6. Implement detail page states.
7. Replace starter app and add app-level route test if useful.
8. Run full web verification.

## Acceptance Criteria

- visiting `/projects/:project_id/capture-sessions/:capture_session_id` renders the capture session detail page
- page fetches the backend detail endpoint with cookies included
- local dev can reach the backend through either Vite proxy or explicit API base URL
- loading, success, unauthenticated, not-found, and generic error states are handled
- events render in the order returned by the backend
- assets render in the order returned by the backend
- screenshot image `src` uses each asset `file_url`
- screenshot image URL resolution works for relative API URLs and explicit API base URLs
- UI does not expose `storage_key`, metadata JSON, soft-delete internals, or raw input values
- UI remains usable on mobile without text/image overlap
- Vite starter content is removed
- frontend tests cover route parsing, API client behavior, and detail page render states
- `pnpm --filter web check-types` passes
- `pnpm --filter web test` passes
- `pnpm --filter web build` passes
- `pnpm --filter web lint` passes

## Open Decisions Deferred

- whether to add React Router
- whether to add TanStack Query
- final app navigation model
- login/setup portal pages
- project list page
- capture session list page
- guide/doc preparation data model
- step editor UI
- screenshot annotation model
- interactive demo player
- Chrome extension redirect implementation

These should be decided when the portal has more than one or two real screens.

## Recommended Next Slice After This

After this portal detail screen is working, the next backend/domain slice should be:

```text
013-capture-session-step-preparation-model.md
```

That plan should define how raw capture events/assets become editable Scribe-like steps without mutating the raw capture source material.
