# Extension Popup Refactor Plan

Date: 2026-07-07

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `107` of the alpha hardening and extension reliability track.

## Objective

Reduce `apps/extension/src/App.tsx` complexity after the extension reliability fixes and browser evidence from child plans `100` through `103`, without changing popup UI appearance, extension permissions, browser-visible behavior, capture ordering, API contracts, storage compatibility, or the documented limitations from plan `103`.

This phase is a refactor-only maintainability phase. It should follow the small-slice pattern proven in child plan `106`: extract pure helpers and narrow local modules first, prove behavior with focused tests, and only move JSX or capture orchestration if the implementation can validate the moved behavior in browser.

## Source Of Truth From Completed Plan 106

Plan `106` completed on 2026-07-07 and is the pattern for this phase.

Relevant carry-forward:

- A coherent low-risk refactor slice is acceptable even if not every large-file target is fully split.
- Pure helper extraction can skip browser validation only when rendered JSX, event handlers, CSS, routes, API calls, and orchestration remain unchanged and focused tests cover the moved behavior.
- Leftover large-file work must be documented instead of hidden as completed.
- Shared API DTOs/constants remain in `@repo/types` and `@repo/constants`; browser/page-local drafts, React props, and extension runtime message shapes remain local.
- The 106 post-implementation recheck explicitly carries into this plan: prefer extracting pure helpers/adapters first, keep extension browser/runtime message shapes app-local, preserve popup UI wording/layout, and require browser validation if popup JSX, events, capture lifecycle orchestration, or extension API boundaries move.

## Source Of Truth From Completed Extension Plans

Plans `100` through `103` are complete and must be preserved.

Current extension behavior to protect:

- The extension uses instance-first setup.
- Login calls the API origin and stores an extension session token.
- Project selection persists locally.
- Starting capture creates a backend capture session and stores local active capture state.
- New capture sessions start in automatic mode.
- Automatic click capture creates screenshot-backed `click` events when active and unpaused.
- Manual screenshot capture remains available during active capture and creates screenshot-backed `capture` events.
- Pause/resume preserves active capture state and event index.
- `Open in portal` opens the configured portal origin without completing the backend capture session or clearing local active capture state.
- `Finish capture` completes the backend capture session, clears local active capture state, and opens the configured portal origin.
- Automatic and manual capture failures preserve active capture state and surface diagnostics.
- The extension must not capture raw input values or page HTML.

Known limitations and follow-ups to preserve:

- True Chrome toolbar-popup manual capture remains unvalidated because prior automation could not reliably operate the extension action popup.
- Direct extension-page manual fallback has bounded evidence, but plan `103` found a direct extension-page duplicate event-index follow-up after automatic clicks.
- If implementation uncovers a real behavior bug, do not silently fix it inside this refactor. Pause and create/update a focused reliability bugfix plan unless the user explicitly expands this phase.

## Recheck Notes

Rechecked on 2026-07-07 against master plan `004`, completed child plan `106`, and the current extension codebase.

Findings:

- The plan is aligned with master plan `004`: it is refactor-only, preserves the extension reliability fixes, requires focused verification, and requires browser validation when extension popup behavior or browser boundaries move.
- The plan is aligned with completed plan `106`: it uses small low-risk slices, allows pure helper extraction without browser validation only when behavior boundaries do not move, and requires leftovers to be documented instead of hidden as completed.
- The plan explicitly preserves the completed extension reliability evidence from plans `100` through `103`, including split-origin portal behavior and the known true-toolbar-popup manual validation limitation.
- No contradictions, stale assumptions, unclear ownership, missing API/security/storage compatibility rules, or unsafe implementation gaps were found after this recheck.

## Current Codebase Baseline

Current worktree expectation before implementation:

```bash
rtk git status --short
```

The implementation agent must stop and inspect any uncommitted changes before editing. Do not overwrite user or other-agent changes.

Current extension file sizes checked on 2026-07-07:

```text
apps/extension/src/App.tsx                  1083 lines
apps/extension/src/App.test.tsx             1297 lines
apps/extension/src/lib/api.ts                308 lines
apps/extension/src/lib/settings.ts           303 lines
apps/extension/src/lib/content-click-capture.ts 307 lines
apps/extension/src/lib/automatic-capture.ts  208 lines
```

Current extension scripts:

```text
apps/extension/package.json

test        -> vitest run
check-types -> tsc --noEmit
lint        -> eslint --max-warnings 0
build       -> vite build
dev         -> vite --host 0.0.0.0
```

Current extension manifest:

```text
apps/extension/public/manifest.json

manifest_version: 3
action.default_popup: index.html
background.service_worker: assets/background.js
content_scripts.matches: http://*/*, https://*/*
permissions: activeTab, storage, tabs
host_permissions: <all_urls>
```

Do not add manifest permissions or host permissions in this phase.

## Exact Files To Read Before Implementation

Required:

```text
docs/plan/107-extension-popup-refactor-plan.md
docs/plan/106-web-large-file-refactor-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md
docs/plan/101-extension-capture-upload-and-event-fix.md
docs/plan/102-extension-finish-portal-origin-fix.md
docs/plan/103-extension-browser-validation-and-screenshots.md
apps/extension/package.json
apps/extension/README.md
apps/extension/public/manifest.json
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/main.tsx
apps/extension/src/index.css
apps/extension/src/lib/api.ts
apps/extension/src/lib/api.test.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/settings.test.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/automatic-capture.test.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/content-click-capture.test.ts
apps/extension/src/lib/current-tab.ts
apps/extension/src/lib/current-tab.test.ts
apps/extension/src/lib/navigation.ts
apps/extension/src/lib/navigation.test.ts
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/screenshot.test.ts
apps/extension/src/lib/url.ts
apps/extension/src/lib/url.test.ts
apps/extension/src/manifest.test.ts
```

Read only if the implementation slice touches adjacent behavior:

```text
apps/server/src/modules/authentication/**/*
apps/server/src/modules/capture/**/*
apps/web/src/features/capture-session/**/*
packages/types/src/auth.ts
packages/types/src/capture.ts
packages/types/src/project.ts
packages/constants/src/**/*
docs/project-zoomout-status.md
docs/assets/**/*
```

## Exact Affected Files

Expected implementation files:

```text
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
docs/plan/107-extension-popup-refactor-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Likely new local modules if the matching slice is implemented:

```text
apps/extension/src/popup/dependencies.ts
apps/extension/src/popup/helpers.ts
apps/extension/src/popup/capture-session.ts
apps/extension/src/popup/manual-capture.ts
apps/extension/src/popup/ConnectInstance.tsx
apps/extension/src/popup/SignIn.tsx
apps/extension/src/popup/ProjectPicker.tsx
apps/extension/src/popup/types.ts
apps/extension/src/popup/*.test.ts
apps/extension/src/popup/*.test.tsx
```

The exact filenames may differ, but new React/popup files must remain local to `apps/extension/src/popup/` or another clearly local extension folder. Browser adapter code may remain under `apps/extension/src/lib/`.

Conditional files:

```text
apps/extension/src/lib/api.ts
apps/extension/src/lib/api.test.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/settings.test.ts
apps/extension/src/index.css
apps/extension/README.md
apps/extension/public/manifest.json
```

Rules for conditional files:

- Touch `lib/api.ts` only if extracting popup orchestration requires a narrower local API adapter or type import. Do not change paths, headers, credentials, response parsing, or DTO shapes.
- Touch `lib/settings.ts` only if extracting storage helpers without changing keys or value parsing.
- Touch `index.css` only if JSX extraction requires moving class usage. Do not change CSS declarations, class names, layout, spacing, colors, or visual styling.
- Touch `README.md` only if the refactor changes developer instructions or if validation notes must clarify the same known toolbar-popup limitation. Do not use docs to hide behavior changes.
- Do not touch `public/manifest.json` unless a refactor accidentally requires build entry corrections; adding permissions is out of scope.

Files out of scope unless this plan is revised first:

```text
apps/server/**/*
apps/web/**/*
apps/docs/**/*
packages/**/*
pnpm-lock.yaml
package.json
turbo.json
.github/workflows/**/*
docs/assets/**/*
```

## Routes And API Contracts

No server route, HTTP method, request body, response envelope, public URL, error response, cookie behavior, or portal route change is in scope.

Extension API calls must remain compatible with the current client behavior in `apps/extension/src/lib/api.ts`:

```text
POST /api/v1/authentication/login
GET  /api/v1/authentication/me
POST /api/v1/authentication/logout
GET  /api/v1/projects
POST /api/v1/projects/:project_id/capture-sessions
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
```

Request rules to preserve:

- Login must include `x-demo-composer-client: extension`.
- Authenticated requests must send `Authorization: Bearer <session_token>`.
- JSON capture/session/event requests must include `content-type: application/json` where current code sends it.
- Capture session creation must force `source_type: "extension"`.
- Capture event creation must force `input_value_redacted: true`.
- Upload must remain multipart with field names:
  - `file`
  - `width`
  - `height`
  - `device_pixel_ratio`
  - `page_url`
  - `page_title`
  - `captured_at`
  - `metadata`
- Project IDs and capture session IDs must remain URL-encoded.
- Fetch behavior must preserve `credentials: "include"`.

Portal URL behavior to preserve:

- API calls use `instanceUrl`.
- `Open in portal` and `Finish capture` use `portalUrl` when configured.
- When `portalUrl` is absent, portal navigation falls back to `instanceUrl`.
- Unsafe absolute backend redirect paths must not be trusted; fallback route building must encode project/capture IDs.
- Session tokens must never be placed in portal URLs.

## Schemas And Types

No shared schema, Zod contract, domain package, or API DTO change is expected.

Current shared DTO imports to preserve:

```text
@repo/types/auth
@repo/types/capture
@repo/types/project
@repo/constants
```

Current local extension/browser types to keep local:

```text
Dependencies
AppProps
ViewState
ExtensionSettings
ExtensionStorageArea
AutomaticCaptureDiagnostic
ManualCaptureDiagnostic
CurrentTabSnapshot
ScreenshotCapture
UploadCaptureAssetInput
CreateCaptureSessionInput
CreateCaptureEventInput
PageClickCaptureMessage
PageClickCapturePayload
ClickCaptureState
RuntimeMessage
RuntimeApi
```

Rules:

- Do not move React component props into `@repo/types`.
- Do not move Chrome runtime/storage/tab adapter types into `@repo/types`.
- Do not create a shared package for popup state.
- Keep extension runtime message shapes local to `apps/extension`.
- Avoid `any` and broad casts. If browser globals require casts, keep them narrow and covered by existing local patterns/tests.
- Preserve existing storage key names and parsing semantics:
  - `instanceUrl`
  - `portalUrl`
  - `sessionToken`
  - `selectedProjectId`
  - `activeCaptureSessionId`
  - `activeCaptureProjectId`
  - `activeCaptureEventIndex`
  - `activeCaptureMode`
  - `activeCapturePaused`
  - `automaticCaptureDiagnostic`
  - `manualCaptureDiagnostic`

## Behavior Rules

Preserve all visible and workflow behavior:

- No popup UI redesign.
- No visible copy, label, placeholder, button text, button order, heading, CSS class, color, spacing, layout, keyboard behavior, disabled state, loading text, success text, or error text changes.
- Preserve setup screen behavior:
  - instance URL input placeholder `http://localhost:3002`;
  - portal URL input placeholder `http://localhost:3000`;
  - invalid URL messages;
  - `Connect`/`Connecting...` text.
- Preserve signed-out behavior:
  - `Sign in` form;
  - displayed instance URL;
  - local token save;
  - `Change instance` clearing settings.
- Preserve signed-in/project behavior:
  - project list in API response order;
  - selected project persistence;
  - stale selected project cleanup while active capture state is preserved;
  - no project empty state.
- Preserve capture start behavior:
  - start from selected project only;
  - current tab metadata in capture session input;
  - capture name fallback order: tab title, project name, `Extension capture`;
  - active capture starts as automatic mode with event index `0`.
- Preserve active capture behavior:
  - active capture restoration on popup reopen;
  - prevent starting another capture while one is active;
  - automatic/manual mode display;
  - manual screenshot button remains available during automatic capture;
  - pause/resume does not clear active state or event index;
  - in-flight busy guards disable actions.
- Preserve manual screenshot behavior:
  - capture visible tab and current tab snapshot in parallel;
  - upload screenshot asset first;
  - create linked `capture` event second;
  - next event index is `(activeCaptureEventIndex ?? 0) + 1`;
  - update stored event index only after event creation succeeds;
  - persist manual diagnostics but do not hide capture errors if diagnostic persistence fails.
- Preserve finish/open behavior:
  - `Open in portal` does not complete backend session and does not clear active capture state;
  - `Finish capture` completes backend session before clearing active state;
  - if clearing active capture fails, do not open portal;
  - portal open failure after completion surfaces an error while local active state has already cleared.
- Preserve sign-out behavior:
  - server logout is best effort;
  - local token clearing must still happen when server logout fails.
- Preserve diagnostics:
  - automatic capture failure/success messages;
  - manual capture failure/success messages;
  - active capture state preservation on upload/event/portal failures.

## Security And Permission Rules

Do not weaken:

- Chrome manifest permissions or host permissions.
- Instance-first login.
- Extension session token storage and local clearing behavior.
- Bearer token transport.
- API origin vs portal origin separation.
- URL normalization and unsafe redirect rejection.
- `input_value_redacted: true` semantics for automatic and manual capture events.
- Sensitive-field click skipping in `content-click-capture.ts`.
- No raw input value capture.
- No page HTML capture.
- No token/cookie/password logging.
- No screenshot binary logging.
- No API response-body logging during validation.
- No placing tokens in portal URLs or metadata.

Do not introduce analytics, telemetry, external network calls, or additional browser APIs.

## Migration And Backwards Compatibility Notes

No database migration is expected.

No backend migration is expected.

No package dependency or lockfile change is expected.

No manifest permission migration is expected.

Backwards compatibility requirements:

- Existing extension storage must remain readable.
- Existing active capture state must remain compatible.
- Existing active capture diagnostics must remain compatible.
- Existing configured `portalUrl` split-origin behavior must remain compatible.
- Existing no-portal same-origin fallback must remain compatible.
- Existing extension API functions must remain available unless every call site is updated in the same slice and tests cover it.
- Existing component test assertions should continue to assert the same user-facing behavior.

## Implementation Strategy

Use small logical slices. Stop after a coherent maintainability improvement if the next extraction would move too much behavior or require browser validation that cannot be completed in the same phase.

Recommended order:

1. Pure helper extraction from `App.tsx`:
   - `errorMessage`
   - `persistManualCaptureDiagnostic`
   - `buildCaptureName`
   - `browserNameFromUserAgent`
   - `buildCaptureSessionInput`
   - `screenshotFileName`
   - active capture state patch helpers if they can be expressed without React state closures
   - diagnostic message formatting if tests cover exact strings
2. Dependency construction extraction:
   - move `Dependencies`, `AppProps`, and `buildDefaultDependencies` to a local popup dependency module only if imports stay clear and tests can still inject `dependencies`.
   - preserve `App` public prop shape.
3. Manual capture orchestration extraction:
   - move the pure request-building part first, such as asset upload input and capture event input builders.
   - move async orchestration only if tests cover success, upload failure, event failure, diagnostic persistence failure, and event-index updates.
4. Portal/open/finish helper extraction:
   - keep URL construction in `lib/url.ts`.
   - move only popup-side orchestration helpers if tests preserve clear/open ordering and failure behavior.
5. JSX component extraction:
   - extract `ConnectInstance`, `SignIn`, and `ProjectPicker` only after helper extraction is green.
   - keep rendered markup, class names, text, labels, form structure, and button order unchanged.
   - extracting `ProjectPicker` is higher risk because it owns busy/error state and active-capture handlers; require browser validation if it moves.

Do not combine unrelated slices in one commit. Examples of acceptable commits:

- pure popup helper extraction plus focused helper tests;
- dependency construction extraction plus existing App tests;
- one presentational component extraction plus App tests and browser validation.

## Required Implementation Steps

1. Reread this plan, completed plans `100` through `106`, and master plan `004`.
2. Run `rtk git status --short` and inspect unrelated work before editing.
3. Run baseline focused checks before editing if practical:

   ```bash
   rtk pnpm --filter extension test -- src/App.test.tsx src/lib/settings.test.ts src/lib/url.test.ts src/lib/screenshot.test.ts src/lib/automatic-capture.test.ts src/lib/content-click-capture.test.ts
   rtk pnpm --filter extension check-types
   ```

4. Choose one small refactor slice.
5. If the slice creates a helper/module contract, write or adjust focused tests before moving behavior.
6. Move code without changing popup markup/copy/CSS classes or API/storage behavior.
7. Preserve `App` dependency injection so tests can keep stubbing browser/API behavior.
8. Run focused tests for the touched slice.
9. Repeat only if the next slice remains low risk.
10. If JSX, event handlers, capture lifecycle orchestration, extension API boundaries, or browser adapter boundaries move, run agent-browser validation.
11. Update this plan with status, checklist, implementation log, verification notes, browser validation notes, leftovers, and handoff notes.
12. Update master plan `004` only for completed phase status and concise completed result.
13. Commit only scoped work in small logical commits.

## Test And Verification Plan

Required after any implementation:

```bash
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk git diff --check
```

Required if `App.tsx`, popup modules, or component boundaries are touched:

```bash
rtk pnpm --filter extension test -- src/App.test.tsx
```

Required if storage helpers/types are touched:

```bash
rtk pnpm --filter extension test -- src/lib/settings.test.ts
```

Required if URL/portal logic or finish/open orchestration is touched:

```bash
rtk pnpm --filter extension test -- src/lib/url.test.ts src/App.test.tsx
```

Required if screenshot/manual capture helpers are touched:

```bash
rtk pnpm --filter extension test -- src/lib/screenshot.test.ts src/App.test.tsx
```

Required if automatic capture, content script, or background message boundaries are touched:

```bash
rtk pnpm --filter extension test -- src/lib/automatic-capture.test.ts src/lib/content-click-capture.test.ts src/App.test.tsx
```

Required if API client request construction is touched:

```bash
rtk pnpm --filter extension test -- src/lib/api.test.ts src/App.test.tsx
```

Required if manifest/build entries/import boundaries change:

```bash
rtk pnpm --filter extension test -- src/manifest.test.ts
rtk pnpm --filter extension build
```

Recommended final extension verification:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension build
```

Recommended repo sanity:

```bash
rtk pnpm check-types
```

Do not run server DB/smoke tests for extension-only refactor changes unless a bugfix changes server API behavior, which is out of scope.

## Agent-Browser Validation Requirements

Agent-browser validation is required if implementation moves or changes any of:

- popup rendered JSX;
- popup child component boundaries;
- popup event handlers;
- dependency construction used by runtime `App`;
- capture lifecycle orchestration;
- manual screenshot upload/event orchestration;
- finish/open portal orchestration;
- extension API client request construction;
- Chrome storage/tab/screenshot/navigation adapter boundaries;
- content script or background message boundaries.

Browser validation may be skipped only if the implementation is limited to pure helper extraction with no rendered JSX, event handler, Chrome API boundary, API request construction, storage behavior, route/portal URL behavior, or capture orchestration changes, and focused tests cover the extracted helpers.

If browser validation is required, use the `agent-browser` skill and record:

- extension build command;
- unpacked extension path;
- API origin;
- portal origin;
- target safe local page URL;
- browser profile/isolation notes;
- exact popup path used: true toolbar-popup, direct extension page, or documented fallback;
- setup result;
- login result;
- project selection result;
- start capture result;
- automatic click capture result and backend asset/event evidence when touched;
- manual screenshot result and backend asset/event evidence when touched;
- pause/resume result when touched;
- open-active portal result when touched;
- finish capture result when touched;
- active-capture restoration after popup reload when touched;
- screenshots or notes for layout/text-overflow regressions if JSX moved.

Minimum validation flow when popup JSX or capture orchestration moves:

1. Build the extension:

   ```bash
   rtk pnpm --filter extension build
   ```

2. Load `apps/extension/dist` as an unpacked extension in a clean browser profile.
3. Configure instance URL and portal URL.
4. Sign in with safe local credentials.
5. Select a safe local test project.
6. Start automatic capture.
7. Reopen/reload the popup and confirm active capture restoration.
8. Click a supported non-input element on a safe local target page.
9. Confirm a screenshot-backed automatic `click` asset/event exists if automatic capture boundaries moved.
10. Pause and resume automatic capture if capture controls moved.
11. Trigger `Capture screenshot` from the true toolbar popup if possible.
12. If true toolbar popup cannot be operated, document the blocker and run direct extension-page validation only as bounded evidence.
13. Confirm screenshot-backed manual `capture` asset/event exists if manual capture boundaries moved.
14. Click `Open in portal` and confirm the configured portal origin opens without completing the backend session or clearing local active state if portal controls moved.
15. Click `Finish capture` and confirm the backend session completes, local active state clears, and the configured portal origin opens if finish controls moved.

Do not claim true toolbar-popup manual validation succeeded unless the actual toolbar popup or an equivalent extension-action popup path was operated.

## Explicit Non-Scope

- UI redesign.
- New extension capture features.
- Fixing true toolbar-popup manual validation unless this plan is revised.
- Fixing the direct extension-page duplicate event-index follow-up unless this plan is revised.
- New Chrome permissions or host permissions.
- New manifest capabilities.
- Server route or API changes.
- Web portal route/UI changes.
- Shared package expansion.
- Moving popup React props, Chrome runtime messages, or extension storage shapes into shared packages.
- Changing stored key names.
- Changing public docs/screenshots/assets.
- Chrome Web Store packaging.
- Full-page screenshots.
- HTML replay.
- DOM capture.
- Raw input value capture.
- Analytics or telemetry.

## Completion Checklist

- [ ] Worktree checked before edits.
- [ ] Completed plans `100` through `106` and master `004` reread.
- [ ] Refactor slices selected and documented.
- [ ] `App.tsx` responsibilities reduced by at least one coherent slice.
- [ ] Existing popup UI appearance, copy, labels, disabled states, and class names preserved.
- [ ] Existing extension storage compatibility preserved.
- [ ] Existing extension API contracts preserved.
- [ ] Automatic capture behavior preserved if touched.
- [ ] Manual screenshot behavior preserved if touched.
- [ ] Portal open/finish behavior preserved if touched.
- [ ] Existing known limitations preserved and not overstated.
- [ ] Focused tests run for every touched slice.
- [ ] Extension typecheck, lint, and whitespace verification run.
- [ ] Extension build run if imports/build/runtime boundaries changed.
- [ ] Browser validation completed or explicitly skipped with a valid reason.
- [ ] Parent master plan updated only for completed phase status.
- [ ] Leftovers and next-phase handoff documented.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Browser Validation Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

- Keep this phase behavior-preserving. The goal is smaller local popup responsibilities, not new extension UX.
- Start with pure helpers or dependency construction before moving rendered popup sections.
- If the first implementation pass cannot safely cover every target area, stop after the coherent slice and document remaining `App.tsx` or `App.test.tsx` size work as leftovers.
- If a real toolbar-popup/manual-capture or event-index bug appears during validation, do not hide it in this refactor. Record it as a leftover or open a focused reliability plan.
- Preserve the plan `103` limitation wording: true Chrome toolbar-popup manual capture remains unvalidated unless this phase actually validates it through the real popup path.
