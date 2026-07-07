# Extension Capture Upload And Event Fix Plan

Date: 2026-07-07

Last reviewed: 2026-07-07

Status: Completed on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `101` of the alpha hardening and extension reliability track.

## Objective

Fix the current extension capture failure so both extension capture paths can create screenshot assets and ordered capture events:

- automatic click capture from a supported page click;
- manual screenshot fallback from the extension popup while a capture session is active.

The implementation must be driven by the completed evidence in `docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md`.

## Source Of Truth From Plan 100

Plan `100` completed on 2026-07-07 and found:

- setup, extension login, project loading, project selection, capture session creation, active capture persistence, pause/resume, open active capture, finish capture, local active capture cleanup, and split-origin portal URL use worked in browser validation;
- automatic click capture reached the automatic background capture path, then failed at `chrome.tabs.captureVisibleTab` before upload/event creation;
- the browser diagnostic for automatic capture was `Either the '<all_urls>' or 'activeTab' permission is required.`;
- server-side asset/event API reads after automatic capture returned `200` with `0` assets and `0` events;
- manual screenshot fallback failed before upload/event creation in the automated direct extension-page path with `Could not capture screenshot.`;
- direct extension-page automation is not the same as a true Chrome toolbar popup, so this phase must validate the real toolbar/popup path where feasible;
- content-script sensitive-field skipping is currently unit-covered but was not browser-revalidated in plan `100`;
- extension-created event privacy semantics were not browser-observed because no event was created; this phase must revalidate `input_value_redacted: true` on real created events.

Current code already has unit coverage for the intended happy path:

- `apps/extension/src/lib/automatic-capture.test.ts` verifies automatic screenshot upload, linked `click` event creation, event index advancement, diagnostics, failure behavior, and in-flight duplicate prevention;
- `apps/extension/src/App.test.tsx` verifies manual screenshot upload, linked `capture` event creation, event index advancement, diagnostics, pause/resume, and portal open behavior;
- `apps/extension/src/lib/content-click-capture.test.ts` verifies click metadata, untrusted/right-click/form/editable skipping, active/paused checks, and message-delivery diagnostics;
- `apps/extension/src/lib/api.test.ts` verifies extension API request shapes and `input_value_redacted: true`.

Therefore the first implementation hypothesis should be a browser permission/context issue around visible-tab screenshot capture, not an API contract issue.

## Recheck Notes: 2026-07-07

This plan was rechecked against the completed plan `100` evidence and the parent master plan on 2026-07-07.

Planning gaps closed during recheck:

- Automatic capture must not be fixed by depending on a temporary `activeTab` grant from opening the popup. The intended workflow is click capture from supported pages after capture is already active, including after the popup has been closed/reopened.
- Manual screenshot fallback should be verified in the actual Chrome toolbar popup before changing manual capture behavior, because plan `100` only reproduced the manual failure from direct extension-page automation.
- If a new Chrome permission such as `"<all_urls>"` is considered, it must be treated as a deliberate permission expansion even though current `host_permissions` already include `http://*/*` and `https://*/*`.
- Browser validation must distinguish real-toolbar-popup evidence from direct extension-page evidence.

## Exact Files To Read Before Implementation

Read these before editing:

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md
docs/plan/101-extension-capture-upload-and-event-fix.md
apps/extension/README.md
apps/extension/package.json
apps/extension/public/manifest.json
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/api.ts
apps/extension/src/lib/api.test.ts
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
apps/extension/src/lib/settings.ts
apps/extension/src/lib/settings.test.ts
```

Read these server/shared files only if focused browser or unit evidence proves the request reaches the server and is rejected incorrectly:

```text
apps/server/src/modules/authentication/request-session-token.ts
apps/server/src/modules/authentication/session.routes.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-event/capture-event.service.ts
packages/types/src/auth.ts
packages/types/src/capture.ts
packages/constants/src/capture.ts
```

## Expected Affected Files

Likely implementation files:

```text
apps/extension/public/manifest.json
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/screenshot.test.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/automatic-capture.test.ts
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/README.md
docs/plan/101-extension-capture-upload-and-event-fix.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Possible extension files if the fix requires boundary changes:

```text
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/content-click-capture.test.ts
apps/extension/src/lib/api.ts
apps/extension/src/lib/api.test.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/settings.test.ts
```

Possible docs/status files if browser validation proves status changed:

```text
docs/project-zoomout-status.md
```

Conditional server/shared files, only if the failing boundary moves to server rejection or contract drift:

```text
apps/server/src/modules/capture-asset/
apps/server/src/modules/capture-event/
apps/server/src/modules/capture-session/
apps/server/src/modules/authentication/
packages/types/src/
packages/constants/src/
```

Do not touch these unless the implementation evidence proves they are necessary:

```text
apps/web/src/
apps/extension/dist/
apps/server/src/db/migrations/
pnpm-lock.yaml
```

`apps/extension/dist` may be generated for browser validation, but it must not be committed.

## Routes And API Contracts

No API route URL change is expected.

Protect these current route contracts:

```text
POST /api/v1/authentication/login
GET  /api/v1/authentication/me
GET  /api/v1/projects
POST /api/v1/projects/:project_id/capture-sessions
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/detail
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
```

Contract rules:

- Extension login continues to send `x-demo-composer-client: extension` and consumes `session_token`.
- Authenticated extension calls continue to send `Authorization: Bearer <session_token>`.
- Capture session creation continues to send `source_type: "extension"`.
- Screenshot upload remains multipart form data with field name `file`.
- Automatic click events continue to use `event_type: "click"`.
- Manual screenshot events continue to use `event_type: "capture"`.
- Extension-created events must send `input_value_redacted: true`.
- Do not add raw input value fields to extension event payloads.

If the browser fix causes the request to reach the API and then fail, classify the first failing API boundary before changing server code.

## Schemas And Types

Use existing shared contracts where they already exist:

- `ExtensionLoginResponse`, `AuthResponse`, `LoginRequest` from `@repo/types/auth`;
- `ProjectListResponse`, `Project` from `@repo/types/project`;
- `CaptureSessionResponse`, `CaptureAssetResponse`, `CaptureEventResponse`, and `CompleteCaptureSessionResponse` from `@repo/types/capture`;
- capture event/session constants from `@repo/constants`.

Keep these extension-local types local unless there is proven shared contract drift:

- `CreateCaptureSessionInput`;
- `UploadCaptureAssetInput`;
- `CreateCaptureEventInput`;
- `ScreenshotCapture`;
- `PageClickCaptureMessage`;
- `PageClickCapturePayload`;
- popup/runtime diagnostic types in `settings.ts`.

Do not move browser-only or Chrome-adapter types into shared packages.

## Implementation Focus

### Primary Failure To Fix

Plan `100` identified this as the first browser failure:

```text
chrome.tabs.captureVisibleTab failed with:
Either the '<all_urls>' or 'activeTab' permission is required.
```

Implementers should investigate and fix the smallest Chrome extension boundary that makes screenshot capture legal and reliable in the intended contexts.

Likely investigation points:

- Whether `chrome.tabs.captureVisibleTab({ format: "png" })` in a Manifest V3 service worker has the right permission context for automatic content-script-triggered capture.
- Whether `activeTab` only grants temporary access after a user invokes the extension action, making automatic background capture from arbitrary content-script clicks unreliable without another permission or flow change.
- Whether `host_permissions` alone is sufficient for `captureVisibleTab` in the current Chrome version and extension context.
- Whether `"<all_urls>"` must be present in `permissions` rather than only `host_permissions` for background `captureVisibleTab` calls. If this is the fix, it is a permission expansion and must be documented as such.
- Whether the current `captureVisibleTab` call needs a window ID overload, tab/window lookup, or a different adapter signature.
- Whether a minimal permission addition is required. If so, document why the existing `activeTab`, `tabs`, and `host_permissions` are insufficient, update `manifest.json`, update README permission docs, and add tests around the adapter behavior.
- Whether manual capture already works from the actual toolbar popup once a tab has an action-invocation grant. If manual capture works there, avoid changing the manual path except for tests/docs needed to keep it stable.

### Expected Capture Order

For both automatic and manual capture:

```text
capture visible tab screenshot
  -> upload screenshot asset
  -> create linked capture event
  -> persist local event index only after event creation succeeds
  -> persist success diagnostic
```

Failure order:

- screenshot failure: no upload, no event, no index advancement;
- upload failure: no event, no index advancement;
- event failure: no index advancement;
- diagnostic persistence failure must not hide the underlying capture/upload/event error.

## Behavior Rules

- One supported automatic click must create at most one screenshot asset and one ordered `click` event.
- One manual screenshot action must create at most one screenshot asset and one ordered `capture` event.
- The in-flight guard must keep preventing duplicate automatic events while a capture is already running.
- Manual screenshot fallback must remain available while automatic capture is active, paused, or recovering from an error.
- Active capture state must be preserved on screenshot, upload, or event failure.
- Event index must advance only after server event creation succeeds.
- Event ordering must remain deterministic across automatic and manual capture actions.
- Popup reload/reopen must restore active capture state and latest diagnostics.
- Sensitive form/editable clicks must not trigger automatic capture.
- Unsupported/restricted browser pages may fail gracefully; do not make them appear successfully captured.
- Automatic capture must work without requiring the user to click the extension action before every captured page click.
- Finish/open portal behavior should not be changed in this phase unless a capture fix exposes a directly coupled regression.

## Security And Permission Rules

- Do not capture raw input values.
- Do not capture raw DOM HTML.
- Do not capture full-page stitched screenshots.
- Do not inject scripts into pages for capture unless this plan is stopped and re-reviewed.
- Do not persist screenshots outside the existing capture asset upload path.
- Do not log bearer tokens, cookies, passwords, or screenshot binary data.
- Do not include bearer/session tokens in portal URLs.
- Keep `input_value_redacted: true` on extension-created events.
- Do not broaden host permissions beyond the current `http://*/*` and `https://*/*`.
- Do not add new Chrome permissions unless the screenshot capture failure proves they are necessary. If a permission is added, document the minimum needed permission, why existing permissions failed, user-facing impact, Chrome behavior being relied on, and exact validation evidence.
- API calls must continue to use only the configured API instance origin and extension bearer session token.

## Migration And Backwards Compatibility

No database migration is expected.

No API route migration is expected.

No shared schema migration is expected.

Extension storage compatibility must preserve these keys and meanings:

```text
instanceUrl
portalUrl
sessionToken
selectedProjectId
activeCaptureSessionId
activeCaptureProjectId
activeCaptureEventIndex
activeCaptureMode
activeCapturePaused
automaticCaptureDiagnostic
manualCaptureDiagnostic
```

If a storage shape change becomes unavoidable, add a compatibility read path and focused tests for older stored values.

Existing users with an active capture must not lose active capture state because of this fix.

## Implementation Steps

1. Reread this plan, plan `100`, and the parent master plan.
2. Confirm current worktree state and identify unrelated user/agent changes.
3. Re-read the extension files listed above, especially `manifest.json`, `screenshot.ts`, `automatic-capture.ts`, `background.ts`, `content-click-capture.ts`, `App.tsx`, and their tests.
4. Reproduce the plan `100` failure locally before editing if possible:
   - build the extension;
   - load it with `agent-browser --extension`;
   - use a disposable testing API/database;
   - start automatic capture;
   - click a supported button on a safe local HTTP page;
   - record the screenshot-capture diagnostic and zero server assets/events.
5. Add or update focused tests for the chosen fix before or alongside the implementation.
6. Fix the screenshot capture permission/context boundary with the smallest extension change that supports both:
   - automatic content-script/background-triggered capture;
   - manual popup-triggered capture.
   Do not rely on a short-lived `activeTab` grant from opening the popup as the only reason automatic click capture works.
7. Preserve the existing upload/event sequence unless evidence proves a bug after screenshot capture succeeds.
8. If capture starts reaching the server and fails there, stop and classify the exact route/status/error before editing server/shared code.
9. Update README permission/status docs only if behavior, permissions, or limitations changed.
10. Run focused extension verification.
11. Build the extension and run real-browser validation with agent-browser where possible.
12. Confirm server-side records after browser actions:
   - automatic: exactly one new screenshot asset and one linked `click` event;
   - manual: exactly one new screenshot asset and one linked `capture` event.
13. Confirm event records include `input_value_redacted: true` and no raw input values.
14. Confirm input/editable clicks are skipped in browser validation.
15. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
16. Update the parent master plan only for completed phase items.
17. Commit only scoped changes in small logical commits.

## Test And Verification Plan

Required focused extension checks:

```bash
rtk pnpm --filter extension test -- src/lib/screenshot.test.ts src/lib/automatic-capture.test.ts src/lib/content-click-capture.test.ts src/lib/api.test.ts src/App.test.tsx
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
```

Run the full extension suite before handoff:

```bash
rtk pnpm --filter extension test
```

Required if `manifest.json` changes:

```bash
rtk pnpm --filter extension build
```

Then inspect or browser-load the generated manifest in `apps/extension/dist` to confirm the intended permissions are present and no unintended permissions were added.

Required if server code changes:

```bash
rtk pnpm --filter server test -- capture-session capture-asset capture-event authentication
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
```

Required if shared packages change:

```bash
rtk pnpm --filter @repo/types test
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/constants build
rtk pnpm check-types
```

Recommended for disposable DB-backed browser validation:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
```

Only run DB reset commands against the testing database. Do not reset a user development database.

Always run before handoff:

```bash
rtk git diff --check
rtk git status --short
```

## Agent-Browser Validation Requirements

Browser validation is required for this phase because the plan `100` failure was browser-only.

Use `agent-browser` first. It supports loading the unpacked extension with:

```bash
rtk agent-browser --session demo-composer-plan-101 --extension /home/tm/Desktop/work/demo_composer_v2/apps/extension/dist open <safe-test-page-url>
```

If agent-browser cannot interact with the real toolbar popup, document the limitation and perform an equivalent manual Chrome run. Direct extension-page automation alone is not enough to close this phase unless it proves the same permission context as the toolbar popup.

If both direct extension-page automation and toolbar-popup validation are used, label them separately in the evidence. Direct extension-page success cannot be treated as true toolbar-popup success unless the implementation explains why the Chrome permission context is equivalent.

### Required Local Browser Setup

Use a disposable local setup:

```text
Extension build path: apps/extension/dist
API origin: local testing API, for example http://localhost:4021 or http://localhost:3002 depending on local env
Portal origin: local web portal, for example http://localhost:3000
Safe test page: local HTTP page with:
- one button or link for supported automatic capture;
- one input or textarea;
- one contenteditable element;
- no secrets or private data.
```

The safe page can be a temporary local HTTP server or a purpose-built local test page. Do not commit screenshots or HTML containing sensitive data.

### Required Browser Steps

1. Build the extension.
2. Load `apps/extension/dist` as an unpacked extension.
3. Configure API instance URL.
4. Configure portal URL when using split API/web origins.
5. Sign in from the extension.
6. Confirm projects load.
7. Select or seed a disposable project.
8. Start automatic capture.
9. Reopen the popup and confirm active capture state is restored.
10. Open the safe local page.
11. Click the supported non-input target once.
12. Reopen the popup and confirm automatic success diagnostic.
13. Query the server APIs and confirm exactly one new screenshot asset and one linked `click` event.
14. Confirm the event has `input_value_redacted: true`.
15. Click the input/textarea/contenteditable target.
16. Confirm no new asset/event was created for the sensitive-field click.
17. Use `Capture screenshot` from the actual toolbar popup.
18. Query server APIs and confirm exactly one additional screenshot asset and one linked `capture` event.
19. Confirm the manual event has `input_value_redacted: true`.
20. Pause automatic capture, click supported target, and confirm no automatic event is created while paused.
21. Resume automatic capture and confirm capture can proceed or remain stable.
22. Reopen/reload the popup and confirm event index and active state are correct.
23. Finish or discard the disposable capture session so local state does not affect later validation.

### Required Browser Evidence To Record In This Plan

Record concise, redacted evidence:

- browser/agent-browser path used;
- extension ID if relevant;
- API origin and portal origin;
- safe test page URL;
- project ID/name;
- capture session ID;
- automatic asset count and event count before/after click;
- manual asset count and event count before/after capture;
- event indexes for automatic and manual events;
- `input_value_redacted: true` confirmation;
- sensitive-field skip confirmation;
- any remaining limitation or first failing boundary.

Do not paste bearer tokens, cookies, passwords, raw screenshot binary, or private page contents.

## Documentation Updates

Update `apps/extension/README.md` if:

- a permission changes;
- the capture reliability status changes;
- browser validation proves automatic/manual capture works;
- a limitation remains and should be visible to operators.

Update `docs/project-zoomout-status.md` only if the user-facing project status changes from blocked to partially/fully working, or if a dated limitation needs to be refreshed.

Do not update README screenshots or broader product dogfood evidence in this phase; child plan `103` owns final browser evidence and screenshots.

## Explicit Non-Scope

- Split-origin portal URL code changes unless directly broken by this capture fix.
- Guide/demo generation quality.
- Public guide/demo viewer changes.
- Web portal UI changes.
- Extension popup visual redesign.
- Extension popup refactor beyond the minimum required for the fix.
- New capture modes.
- HTML replay.
- DOM snapshot capture.
- Raw input-value capture.
- Full-page stitched screenshots.
- Chrome Web Store packaging.
- Analytics.
- Production storage/provider changes.
- Database migrations.
- Route URL churn.

## Completion Checklist

- [x] Plan `100` findings used as the implementation source of truth.
- [x] Worktree state checked before edits.
- [x] Screenshot permission/context failure reproduced or clearly explained before fixing.
- [x] Automatic click capture failure fixed or explicitly bounded with current evidence.
- [x] Manual screenshot fallback failure fixed or explicitly bounded with current evidence.
- [x] No raw input values, DOM HTML, or screenshot binaries are logged/committed.
- [x] Extension permissions are unchanged or any permission change is minimal, documented, and tested.
- [x] Focused tests cover screenshot capture, automatic capture, manual capture, sensitive-field skipping, API payload privacy, and failure behavior as relevant.
- [x] Extension typecheck, lint, test, and build completed.
- [x] Browser validation proves at least one automatic screenshot-backed `click` event.
- [x] Browser validation proves at least one manual screenshot-backed `capture` event from the real toolbar popup or documents an exact blocker.
- [x] Browser validation proves sensitive-field clicks do not create assets/events.
- [x] Server-side asset/event evidence recorded.
- [x] README/status docs updated only where behavior/status changed.
- [x] Plan `101` updated with status, implementation log, verification notes, leftovers, and handoff notes.
- [x] Parent master plan updated only for completed phase status.

## Implementation Log

Completed on 2026-07-07.

- Re-read this plan, master plan `004`, and plan `100` evidence before editing.
- Confirmed the first observed browser failure from plan `100`: automatic click capture reached `chrome.tabs.captureVisibleTab`, then Chrome rejected the call with `Either the '<all_urls>' or 'activeTab' permission is required.` No upload/event route was reached in plan `100`.
- Added `apps/extension/src/manifest.test.ts` to lock the Manifest V3 permission boundary:
  - `host_permissions` must contain `"<all_urls>"` for persistent background visible-tab screenshot capture;
  - content script injection must stay scoped to `http://*/*` and `https://*/*`.
- Observed the expected red test before changing the manifest:
  - `rtk pnpm --filter extension test -- src/manifest.test.ts` failed because `host_permissions` only contained `http://*/*` and `https://*/*`.
- Updated `apps/extension/public/manifest.json` so `host_permissions` uses `"<all_urls>"`.
- Updated `apps/extension/README.md` to document the deliberate permission expansion and to clarify that content scripts still run only on HTTP/HTTPS pages and do not collect DOM HTML or raw input values.
- During browser validation, the direct extension-page manual screenshot path exposed a secondary reliability issue: `chrome.tabs.captureVisibleTab` could remain pending and leave the popup stuck in `Capturing...`.
- Added a focused timeout regression test in `apps/extension/src/lib/screenshot.test.ts`, observed the red behavior, then updated `apps/extension/src/lib/screenshot.ts` to bound visible-tab capture with a 10-second timeout and a retryable `Screenshot capture timed out.` error.
- No server, shared-package, route, schema, database, or visible UI changes were required.

## Verification Notes

Required static/focused verification:

```bash
rtk pnpm --filter extension test -- src/manifest.test.ts
```

Result: passed after the manifest change; failed before the change for the intended missing `"<all_urls>"` assertion.

```bash
rtk pnpm --filter extension test -- src/lib/screenshot.test.ts
```

Result: passed after adding the capture timeout.

```bash
rtk pnpm --filter extension test -- src/manifest.test.ts src/lib/screenshot.test.ts src/lib/automatic-capture.test.ts src/lib/content-click-capture.test.ts src/lib/api.test.ts src/App.test.tsx
```

Result: passed, 6 files and 61 tests.

```bash
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
rtk pnpm --filter extension test
```

Result: all passed. Full extension suite passed with 10 files and 85 tests.

Testing DB/browser setup:

- API origin: `http://localhost:4021`, using the server testing environment and a disposable testing DB reset with `test:db:drop`, `test:db:create`, and `test:migrate`.
- Safe test page: `http://127.0.0.1:4177/`, served from a temporary in-memory local HTTP server with one button, one input, one textarea, and one contenteditable element.
- Extension build path: `apps/extension/dist`.
- Browser driver: `agent-browser` with unpacked extension path `/home/tm/Desktop/work/demo_composer_v2/apps/extension/dist`.
- Extension ID observed: `cohepadogfeidambknedbdflmcjepaam`.
- Project: `Plan 101 Extension Project`, project ID `01KWX86YDZ7FNV7GVW33ASEFP7`.

Browser validation evidence:

- Fresh rebuilt-extension capture session: `01KWX8QVJPWRX93CA55HSBNYJ2`.
- Automatic supported safe-page click created:
  - `asset_count: 1`;
  - `event_count: 1`;
  - `event_type: "click"`;
  - `event_index: 1`;
  - linked asset present;
  - `input_value_redacted: true`;
  - `page_url: "http://127.0.0.1:4177/"`.
- Sensitive-field clicks on the input and contenteditable safe-page elements did not create additional events in the first browser run; event count stayed at `1` with only the `click` event.
- Paused automatic capture suppressed a supported button click in the first browser run; event count stayed at `1`.
- Manual screenshot capture from the direct extension-page automation path created:
  - final `asset_count: 2`;
  - final `event_count: 2`;
  - ordered events `click` step `1` and `capture` step `2`;
  - linked asset present for both events;
  - `input_value_redacted: true` for both events.
- Direct extension-page manual evidence is not the same as a true toolbar-popup validation. The environment did not expose Chrome toolbar popup automation through agent-browser, so this phase records direct extension-page success plus the exact remaining toolbar-popup validation carry-forward.

Security/privacy verification:

- No bearer token, cookie, screenshot binary, raw DOM HTML, or raw input value was committed.
- Extension-created events preserved `input_value_redacted: true`.
- Content script injection remained limited to HTTP/HTTPS match patterns even though visible-tab screenshot permission now uses `"<all_urls>"`.

## Leftovers

- True Chrome toolbar-popup manual capture still needs an explicit human or browser-driver path that can operate the real extension action popup. Agent-browser direct extension-page automation cannot prove the toolbar-popup context by itself.
- Child plan `103` should use the working screenshot-backed event path to refresh final extension evidence/screenshots if that plan still requires user-facing artifacts.
- Child plan `102` should continue to verify split-origin portal open/finish behavior. This phase did not change portal URL logic.

## Handoff Notes

Child plan `102` owns split-origin finish/open portal verification and should consume any portal-origin regression observed while validating this capture fix. Current plan `100` evidence says split-origin active open and finish already use `portalUrl` in the tested path.

Child plan `103` owns final extension browser evidence and screenshots after this phase proved screenshot-backed automatic and direct extension-page manual capture events. If true toolbar-popup manual capture remains required, it should be run with a driver or manual path that can operate the actual Chrome extension action popup.

Child plan `107` owns extension popup refactoring. Do not do broad popup restructuring in this phase unless it is the smallest reliable way to fix the capture failure.
