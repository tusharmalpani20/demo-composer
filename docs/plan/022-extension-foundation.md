# Extension Foundation Plan

Date: 2026-06-05

## Goal

Create the first Chrome extension app shell so a self-hosted or hosted Demo Composer instance can be connected from the browser.

Target flow:

```text
user opens extension popup
  -> enters Demo Composer instance URL
  -> signs in with portal credentials
  -> extension verifies current auth
  -> extension lists accessible projects
  -> user can choose which project future captures will belong to
```

This slice should prove the extension can talk to the configured backend and can see the same projects as the portal. It should not record screenshots or create capture sessions yet.

## Why This Comes Next

Current state:

- backend can receive project, capture session, capture asset, capture event, and guide data
- portal can list projects, open workspaces, view captures, and edit generated guides
- users still cannot create real source capture data from browser workflows
- Chrome extension is the agreed first capture surface

The next product gap is not more portal viewing. The next gap is connecting a browser extension to the backend so capture work can begin.

This plan creates the extension foundation before implementing capture recording. That keeps the risky parts separate:

- extension packaging and build setup
- instance URL configuration
- extension auth transport behavior across browser extension requests
- login/current-auth flow
- project selection state

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0019-separate-web-and-server-apps.md
docs/plan/020-portal-auth-entry.md
docs/plan/021-project-list-portal-home.md
```

Important implications:

- extension must ask for the instance URL before trying to authenticate
- extension should use the configured instance URL for API calls
- extension auth should reuse backend login/session endpoints
- extension auth must align with ADR `0011`: the extension should receive and store an extension-scoped session token, not depend only on the portal web cookie
- extension should not assume Demo Composer is hosted at a fixed SaaS domain
- extension should not capture screenshots, DOM, input values, or events in this slice
- extension should not add AI
- extension should not add analytics
- extension should not create default projects

## Scope

Included:

- create `apps/extension`
- add extension package to the existing pnpm workspace automatically through `apps/*`
- add Vite/React/TypeScript extension build setup
- add Manifest V3 manifest generation or static manifest copied into `dist`
- add popup entrypoint
- add basic popup UI states:
  - unconfigured
  - signed out
  - loading current auth
  - signed in
  - API/error state
- persist extension settings in Chrome extension storage:
  - instance base URL
  - selected project id
- normalize and validate instance URL in the extension
- add extension API client using the configured instance URL
- add or confirm backend support for extension-scoped auth transport
- support login from popup against:

```text
POST {instance_url}/api/v1/authentication/login
```

- support current-auth check from popup against:

```text
GET {instance_url}/api/v1/authentication/me
```

- support project listing from popup against:

```text
GET {instance_url}/api/v1/projects
```

- include credentials/cookies in extension fetch calls
- include token auth when extension-scoped token support is added
- show accessible projects in response order
- let the user select a project for future capture work
- let the user clear/change the configured instance URL
- unit test URL normalization, storage helpers, API client behavior, and popup state rendering
- add extension lint/typecheck/build scripts
- make root `turbo` build/lint/check-types include the extension
- document local development and manual Chrome load steps in `apps/extension/README.md`

Excluded:

- capture session creation
- screenshot capture
- HTML capture
- content scripts
- background service worker capture orchestration
- click/input/navigation event recording
- upload flow
- capture finalization
- post-capture redirect to portal
- project creation from extension
- organization switching
- signup
- first-run setup from extension
- published guide/demo viewer
- interactive demo work
- analytics
- AI/BYO-key

## UX Contract

The popup should be small and task-focused.

### Unconfigured State

Show:

- instance URL input
- save/connect action
- validation error for invalid URL

Behavior:

- trim whitespace
- require `http://` or `https://`
- remove trailing slashes before storing
- reject non-URL text
- do not call backend until a valid instance URL is saved

### Signed-Out State

Show:

- configured instance URL
- email input
- password input
- sign-in action
- change instance action

Behavior:

- call login endpoint with email and password
- keep password in component state only
- never persist password
- after successful login, call current auth and project list

### Signed-In State

Show:

- current user/email if backend provides it
- organization name if backend provides it
- project selector/list
- selected project state
- change instance action

Behavior:

- list projects in backend response order
- persist selected project id
- if persisted selected project no longer exists, clear it and ask user to select again
- do not create a capture session yet

### Error States

Show:

- clear connection/auth/API error messages
- retry action where useful
- change instance action

Common cases:

- instance unreachable
- invalid credentials
- unauthenticated/current session missing
- projects failed to load

## Extension Storage Contract

Use a small wrapper around Chrome storage so it can be unit-tested without Chrome.

Suggested stored shape:

```ts
export type ExtensionSettings = {
  instanceUrl: string | null;
  sessionToken: string | null;
  selectedProjectId: string | null;
};
```

Rules:

- default `instanceUrl` is `null`
- default `sessionToken` is `null`
- default `selectedProjectId` is `null`
- saving a new instance URL clears `sessionToken` and `selectedProjectId`
- clearing the instance URL clears all settings
- password is never persisted
- extension auth should remain backend-owned, but the extension may persist the issued extension-scoped token
- token storage should be treated as sensitive and cleared on sign out or instance change

## Auth Transport Contract

The backend currently supports web portal auth with an HTTP-only `demo_composer_session` cookie. That is correct for the portal, but it is not enough to assume reliable extension auth across all hosted/self-hosted origins.

This slice must explicitly settle the extension auth transport before building capture features.

Preferred foundation:

```text
POST /api/v1/authentication/login
  -> returns auth context
  -> sets portal cookie
  -> also returns an extension-scoped session token only when called by the extension contract
```

The extension contract should be explicit. Acceptable options:

- a dedicated extension login endpoint, such as `POST /api/v1/authentication/extension/login`
- or a clear request marker on the existing login endpoint, such as `x-demo-composer-client: extension`

Prefer the smallest implementation that keeps normal portal login responses unchanged.

Then extension API calls use:

```text
Authorization: Bearer <extension_session_token>
```

Fallback only if verified manually and in tests:

```text
credentials: "include"
```

Rules:

- do not store email/password
- do not store raw cookies manually
- support clearing the extension token on sign out/change instance
- keep portal cookie behavior unchanged
- keep token validation server-side through the existing auth session table if possible
- document the chosen behavior in the extension README

If token support requires too much backend work, stop after a short proof and create a separate backend auth plan before continuing extension capture work.

## API Client Contract

Add extension-local API client helpers rather than importing the web API client directly. The extension needs instance-aware URLs and Chrome-specific behavior.

Suggested helpers:

```ts
login(instanceUrl, { email, password })
getCurrentAuth(instanceUrl)
listProjects(instanceUrl)
```

Fetch requirements:

- build URLs as `{normalized_instance_url}/api/v1/...`
- include `credentials: "include"`
- include `Authorization: Bearer <token>` after extension token login is available
- send `accept: application/json`
- send `content-type: application/json` for login
- map backend error bodies into typed client errors

Expected backend error body:

```json
{
  "error": {
    "type": "invalid_credentials",
    "message": "Email or password is incorrect"
  }
}
```

## Manifest Contract

Use Manifest V3.

Minimum expected manifest shape:

```json
{
  "manifest_version": 3,
  "name": "Demo Composer",
  "version": "0.1.0",
  "action": {
    "default_popup": "index.html"
  },
  "permissions": [
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

Notes:

- `storage` is required for instance URL and selected project.
- broad host permissions are acceptable for this foundation because the extension must support self-hosted instance URLs.
- capture permissions such as `activeTab`, `tabs`, `scripting`, or content scripts should be added only when capture starts.
- if bearer-token auth is implemented, no extra Chrome permission should be needed beyond storage and host permissions.

## Suggested File Shape

```text
apps/extension/
  README.md
  eslint.config.js
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  public/
    manifest.json
  src/
    App.tsx
    App.test.tsx
    main.tsx
    index.css
    vite-env.d.ts
    lib/
      api.ts
      api.test.ts
      settings.ts
      settings.test.ts
      url.ts
      url.test.ts
    test/
      setup.ts
```

Keep it intentionally small. Do not create content-script or background folders in this slice unless the extension build setup requires placeholders.

## Testing Plan

Follow TDD.

Start with red tests for:

- URL normalization:
  - trims input
  - removes trailing slash
  - accepts `http://localhost:4000`
  - accepts `https://example.com`
  - rejects missing protocol
  - rejects invalid URL strings
- settings helper:
  - returns default null settings
  - saves instance URL
  - saving a new instance clears session token and selected project
  - saves session token
  - clears session token on sign out
  - saves selected project
  - clearing settings clears all values
- API client:
  - login calls configured instance `/api/v1/authentication/login`
  - current auth calls configured instance `/api/v1/authentication/me`
  - project list calls configured instance `/api/v1/projects`
  - all calls include credentials
  - token-backed calls include bearer auth when a token is present
  - backend errors map to client errors
- popup UI:
  - starts in unconfigured state
  - saves valid instance and checks auth
  - renders signed-out form when current auth is unauthenticated
  - signs in and loads projects
  - renders projects in response order
  - persists selected project
  - clears stale selected project when missing from returned projects
  - renders retry/change-instance controls on API errors

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
rtk pnpm build
rtk pnpm check-types
rtk pnpm lint
```

The server commands are required only if this slice adds or changes backend extension-token auth support. If the implementation proves the existing cookie flow is sufficient and no backend files change, document that proof in the extension README.

## Implementation Steps

1. Scaffold `apps/extension` with Vite, React, TypeScript, Vitest, and ESLint config consistent with `apps/web`.
2. Add Manifest V3 static manifest and ensure build output includes it.
3. Confirm extension auth transport:
   - first test the existing cookie-backed flow from an extension context
   - if unreliable, add minimal backend support for extension-scoped bearer token auth
   - keep portal cookie auth unchanged
4. Add URL normalization helper and tests.
5. Add Chrome storage adapter/settings helper and tests.
6. Add instance-aware API client and tests.
7. Add popup UI tests for the planned states.
8. Implement popup state machine:
   - load settings
   - validate/save instance URL
   - check current auth
   - login
   - persist extension session token when issued
   - load projects
   - persist selected project
   - change instance
9. Add extension README with local dev/build/load instructions and auth transport notes.
10. Run focused extension checks.
11. Run root checks to confirm workspace integration.

## Acceptance Criteria

- `apps/extension` exists and is part of the workspace.
- Extension build produces a loadable Chrome extension in `apps/extension/dist`.
- Popup can store a valid Demo Composer instance URL.
- Popup can reject invalid instance URLs.
- Popup can log in against the configured instance.
- Popup can check current auth against the configured instance.
- Popup can list projects from the configured instance.
- Popup can use the agreed extension auth transport without depending on manual cookie copying.
- Popup can persist selected project id.
- Popup clears selected project when changing instances.
- Popup clears session token when signing out or changing instances.
- Password is never persisted.
- No capture/session/upload/event behavior is added yet.
- Extension tests cover URL, settings, API client, and popup state.
- Extension lint/typecheck/build pass.
- Root lint/typecheck/build still pass.

## Follow-Up Slice

After this plan, the next likely plan should be:

```text
023-extension-start-capture-session
```

That next slice should let the user select a project and create a capture session from the popup, but should still avoid screenshot/event capture until the session lifecycle is proven from the extension.
