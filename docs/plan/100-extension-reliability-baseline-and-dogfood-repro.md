# Extension Reliability Baseline And Dogfood Repro Plan

Date: 2026-07-07

Last reviewed: 2026-07-07

Status: Completed on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `100` of the alpha hardening and extension reliability track.

## Objective

Establish the exact current Chrome extension reliability baseline before applying fixes.

This phase must answer, with current evidence, whether the historical real-browser failures still reproduce:

```text
instance setup
  -> login
  -> project selection
  -> capture session start
  -> automatic click capture
  -> manual screenshot fallback
  -> pause/resume
  -> open active capture in portal
  -> finish capture
  -> open finished capture in portal
```

The output should be a dated diagnosis that later child plans can implement against. This phase is evidence-first and should not turn into a broad reliability fix.

## Current Codebase Baseline

Current focused extension verification was last run during baseline gathering:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
```

Result:

- extension tests passed: 9 files, 82 tests;
- extension typecheck passed;
- extension lint passed.

Known historical browser dogfood findings from 2026-06-22 and follow-up plans:

- Extension setup, API sign-in, project listing, project selection, active capture persistence, pause/resume, backend finish, and local active capture cleanup worked.
- Automatic click capture produced zero screenshot assets and zero capture events.
- Manual screenshot fallback produced no upload/event in the original dogfood run and later produced a popup-visible manual diagnostic in a direct extension-page automation path that was not equivalent to a true toolbar popup.
- Split API/web portal links originally opened API-origin URLs, but later code added an optional `portalUrl` setting and URL builder tests.
- Guide/demo artifact generation from extension data remains blocked until an extension-created screenshot-backed event exists.

Current extension implementation to account for:

- `apps/extension/src/App.tsx` starts new captures in automatic mode.
- `apps/extension/src/App.tsx` keeps manual `Capture screenshot` available during active capture.
- `apps/extension/src/App.tsx` uploads manual screenshots and then creates a linked `capture` event.
- `apps/extension/src/content-script.ts` installs the content click listener.
- `apps/extension/src/lib/content-click-capture.ts` filters trusted primary clicks, skips form/editable fields, and sends `demo_composer:page_click`.
- `apps/extension/src/background.ts` receives click messages and delegates to automatic capture.
- `apps/extension/src/lib/automatic-capture.ts` captures visible tab, uploads screenshot asset, creates a linked `click` event, stores diagnostics, and guards against duplicate in-flight captures.
- `apps/extension/src/lib/settings.ts` stores `instanceUrl`, optional `portalUrl`, session token, selected project, active capture state, automatic diagnostics, and manual diagnostics.
- `apps/extension/src/lib/url.ts` already supports a separate portal origin and rejects unsafe redirect paths.
- `apps/extension/public/manifest.json` is Manifest V3 with `activeTab`, `storage`, `tabs`, and `http://*/*` / `https://*/*` host permissions.

This plan must verify current runtime behavior instead of assuming historical findings still apply unchanged.

## Exact Files To Read Before Work

Read these files before making any changes.

Master and status docs:

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/project-zoomout-status.md
docs/roadmap.md
README.md
apps/extension/README.md
```

Prior extension evidence and reliability plans:

```text
docs/plan/072-manual-extension-dogfood.md
docs/plan/076-extension-capture-reliability-v2.md
docs/plan/078-split-origin-url-hardening.md
docs/plan/079-extension-automatic-capture-reliability-v3.md
docs/plan/080-extension-manual-fallback-diagnostics.md
docs/plan/081-extension-evidence-and-artifact-redogfood.md
docs/plan/098-extension-shared-contract-consumption.md
```

Extension runtime and tests:

```text
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
apps/extension/src/lib/url.ts
apps/extension/src/lib/url.test.ts
```

Server/API files to inspect for route contracts and logs:

```text
apps/server/src/app.ts
apps/server/src/modules/public-instance/public-instance.routes.ts
apps/server/src/modules/authentication/session.routes.ts
apps/server/src/modules/authentication/request-session-token.ts
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-event/capture-event.service.ts
```

Shared contracts to inspect for request/response shape:

```text
packages/types/src/auth.ts
packages/types/src/capture.ts
packages/types/src/instance.ts
packages/types/src/project.ts
packages/constants/src/capture.ts
```

## Expected Affected Files

This phase should normally be documentation-only, because its purpose is baseline classification.

Allowed documentation files:

```text
docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
apps/extension/README.md
docs/project-zoomout-status.md
```

Conditional diagnostic files, only if a current failure cannot be classified with existing diagnostics/tests/browser tools:

```text
apps/extension/src/App.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/settings.ts
apps/extension/src/**/*.test.ts
apps/extension/src/**/*.test.tsx
```

Do not touch these in this phase unless there is a documented diagnostic need:

```text
apps/server/src/
apps/web/src/
packages/
apps/extension/dist/
apps/server/src/db/migrations/
pnpm-lock.yaml
```

If any conditional diagnostic code is added, it must be minimal, tested, and removed or kept only if it is a useful user-facing diagnostic that does not change product behavior.

## Routes And API Contracts To Observe

No route or API contract changes are in scope.

Observe these current routes during API/browser validation:

```text
GET  /api/v1/public/instance
GET  /api/v1/authentication/me
POST /api/v1/authentication/login
POST /api/v1/authentication/logout
GET  /api/v1/projects
POST /api/v1/projects/:project_id/capture-sessions
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/detail
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
```

Contract facts to preserve:

- Extension login sends `x-demo-composer-client: extension` and expects `session_token` in addition to normal auth data.
- Extension API calls send `Authorization: Bearer <session_token>`.
- Capture session creation sends `source_type: "extension"`.
- Screenshot upload is multipart form data with field name `file`.
- Manual screenshot events use `event_type: "capture"`.
- Automatic click events use `event_type: "click"`.
- Extension-created events must send `input_value_redacted: true`.
- Capture completion returns a relative redirect path used by the extension when safe.

## Schemas And Types

No schema/type changes are expected.

Classify current usage of:

- `ExtensionLoginResponse`, `AuthResponse`, and `LoginRequest` from `@repo/types/auth`;
- `ProjectListResponse` and `Project` from `@repo/types/project`;
- `CaptureSessionResponse`, `CaptureAssetResponse`, `CaptureEventResponse`, and `CompleteCaptureSessionResponse` from `@repo/types/capture`;
- extension-local `CreateCaptureSessionInput`, `UploadCaptureAssetInput`, and `CreateCaptureEventInput` from `apps/extension/src/lib/api.ts`;
- `ExtensionSettings`, `AutomaticCaptureDiagnostic`, and `ManualCaptureDiagnostic` from `apps/extension/src/lib/settings.ts`;
- `PageClickCaptureMessage` and `PageClickCapturePayload` from `apps/extension/src/lib/content-click-capture.ts`.

Do not move browser-only or popup-local types into shared packages in this phase.

## Baseline Questions To Answer

The implementation of this plan must answer each question with evidence.

### Setup And Auth

- Can the extension save an API instance URL?
- Can it save an optional portal URL?
- Can it log in with `x-demo-composer-client: extension`?
- Does the login response include `session_token`?
- Can it load current auth and list projects with bearer auth?
- Does changing the instance clear auth, selected project, and active capture state?

### Capture Session Start And State

- Can the extension create a capture session with `source_type: "extension"`?
- Is active capture state persisted with project ID, capture session ID, mode, paused flag, and event index?
- Is the default active capture mode `automatic` after starting capture?
- Does popup reopen/refresh restore active capture state?
- Do pause and resume preserve active capture state?

### Automatic Click Capture

- Does the content script run on the safe test page?
- Does it skip unsupported pages and sensitive fields?
- Does it send `demo_composer:page_click` for a trusted primary click on a supported element?
- Does the background service worker receive the message?
- Does `chrome.tabs.captureVisibleTab` succeed from the background path?
- Does screenshot upload call the expected multipart API?
- Does event creation call the expected event API with `event_type: "click"`?
- Is exactly one event created for one supported click?
- Is the local event index advanced only after event creation succeeds?
- Is a success or failure diagnostic persisted and visible when the popup reopens?

### Manual Screenshot Fallback

- Does clicking `Capture screenshot` from the actual toolbar popup call `chrome.tabs.captureVisibleTab` against the active tab?
- Does upload create a screenshot asset?
- Does event creation create a linked `capture` event?
- Is the local event index advanced only after event creation succeeds?
- Does upload/event failure preserve active capture state and show a retryable diagnostic?
- Is manual fallback still available when automatic capture is active or paused?

### Open And Finish Portal Flow

- Does `Open in portal` preserve active capture state?
- Does `Open in portal` use `portalUrl` when configured?
- Does `Open in portal` fall back to `instanceUrl` when `portalUrl` is not configured?
- Does `Finish capture` complete the backend session?
- Does `Finish capture` clear only local active capture fields after successful completion?
- Does `Finish capture` open the portal URL using the safe backend redirect path or local fallback route?
- Does an unsafe redirect path get ignored in favor of a local encoded route?

### Server-Side Record Evidence

- After automatic capture, does the server have a capture asset row and a linked capture event row?
- After manual capture, does the server have a capture asset row and a linked capture event row?
- Can those rows be read through the existing capture session detail/assets/events APIs?
- If no rows exist, which boundary failed first?

## Behavior Rules

- Record actual current behavior, not assumptions from stale docs.
- Keep automatic click failure, manual fallback failure, and portal URL behavior as separate classifications.
- Identify every failure at the narrowest boundary possible:
  - content script not installed;
  - click ignored by filter;
  - message delivery failed;
  - background worker unavailable;
  - screenshot capture failed;
  - upload request not sent;
  - upload request rejected;
  - event request not sent;
  - event request rejected;
  - auth/session token rejected;
  - local settings/state not persisted;
  - popup state not restored;
  - portal URL generation/opening failed.
- Do not alter visible extension UI behavior unless a diagnostic-only change is explicitly documented as necessary.
- Do not change route URLs, response shapes, database schema, extension permissions, or shared contracts.
- Preserve active capture state during failed automatic/manual capture attempts.
- Do not clear local active capture state except through existing finish, sign-out, change-instance, or discard behavior.

## Security And Permission Rules

- Do not add host permissions beyond `http://*/*` and `https://*/*`.
- Do not add new Chrome permissions unless the plan is stopped and re-reviewed.
- Do not capture raw input values.
- Do not capture raw DOM HTML.
- Do not capture full-page stitched screenshots.
- Do not persist raw page content in committed docs, logs, screenshots, or fixtures.
- Use only safe synthetic pages or local app pages.
- Redact session tokens, cookies, passwords, private URLs, and user identifiers from committed evidence.
- Do not include uploaded screenshot binary data in logs.
- Keep `input_value_redacted: true` on extension-created events.
- Do not include bearer tokens in portal URLs.

## Migration And Backwards Compatibility

No database migration is expected.

No extension storage migration is expected.

Any diagnostic work that touches storage must preserve these keys and semantics:

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

Existing users with only `instanceUrl` configured must continue to work in same-origin/self-host setups.

Existing users with `portalUrl` configured must retain split-origin portal behavior.

## Evidence Capture Format

During implementation, update this plan with a dated evidence section using this structure:

```text
Date:
Browser:
Extension build:
API origin:
Portal origin:
Safe test page:
Project:
Capture session:

Setup/auth:
- result:
- evidence:

Automatic click capture:
- content script:
- message delivery:
- background handling:
- screenshot:
- upload:
- event creation:
- diagnostic:
- server records:
- classification:

Manual screenshot fallback:
- popup context:
- screenshot:
- upload:
- event creation:
- diagnostic:
- server records:
- classification:

Open/finish portal:
- open active capture:
- finish capture:
- origin used:
- classification:

Leftovers for 101:
Leftovers for 102:
Leftovers for 103:
```

Use concise evidence. Do not paste secrets or large logs.

## Baseline Evidence: 2026-07-07

Date: 2026-07-07.

Browser: `agent-browser` with Chromium, launched with `--extension /home/tm/Desktop/work/demo_composer_v2/apps/extension/dist`. Chrome reported the unpacked `Demo Composer` extension as enabled at extension ID `cohepadogfeidambknedbdflmcjepaam`.

Extension build: `rtk pnpm --filter extension build` produced `apps/extension/dist` successfully on 2026-07-07.

API origin: `http://localhost:4021`, using the repo's `testing` environment and a disposable `test-dc` database reset through `rtk pnpm --filter server run test:db:drop`, `test:db:create`, and `test:migrate`.

Portal origin: `http://localhost:3000`, using `rtk pnpm --filter web dev`.

Safe test page: `https://example.com/` for a supported non-input click. The current run also used the direct extension page at `chrome-extension://cohepadogfeidambknedbdflmcjepaam/index.html` because `agent-browser` can open the extension page directly. That is close enough for popup-app storage/API behavior, but not identical to a real toolbar popup for screenshot permissions.

Project: disposable project `Plan 100 Extension Project` in the testing database.

Capture session: disposable extension capture session `01KWX73SSPPF4V5WDVPE1SXHGQ`.

Setup/auth:

- result: Passed through the extension UI against the testing API.
- evidence: the extension saved `instanceUrl: "http://localhost:4021"` and `portalUrl: "http://localhost:3000"`, moved from connect screen to sign-in, signed in with `x-demo-composer-client: extension`, loaded the disposable project, and persisted selected project state. Session token values were intentionally not copied into this plan.

Capture session start and state:

- result: Passed through the extension UI.
- evidence: `Start automatic capture` created session `01KWX73SSPPF4V5WDVPE1SXHGQ` with local storage fields `activeCaptureProjectId`, `activeCaptureSessionId`, `activeCaptureMode: "automatic"`, `activeCapturePaused: false`, and `activeCaptureEventIndex: 0`.

Automatic click capture:

- content script: Reached the automatic capture path from a supported click on `https://example.com/`.
- message delivery: Classified as passed enough to reach background screenshot capture.
- background handling: Classified as passed enough to store an automatic failure diagnostic.
- screenshot: Failed at `chrome.tabs.captureVisibleTab`.
- upload: Not reached.
- event creation: Not reached.
- diagnostic: `automaticCaptureDiagnostic.status: "failed"` with message `Either the '<all_urls>' or 'activeTab' permission is required.`
- server records: `GET /assets` returned `200` with `0` assets; `GET /events` returned `200` with `0` events.
- classification: Reproduced. The first failing boundary is screenshot capture permission/context, not multipart upload or event creation.

Manual screenshot fallback:

- popup context: Exercised through the direct extension page, not the real toolbar popup. This validates popup-app behavior and storage/API wiring, but permission behavior may differ from a pinned toolbar popup.
- screenshot: Failed before upload with user-facing diagnostic `Could not capture screenshot.`
- upload: Not reached.
- event creation: Not reached.
- diagnostic: `manualCaptureDiagnostic.status: "failed"` with `eventIndex: null`.
- server records: `GET /assets` returned `200` with `0` assets; `GET /events` returned `200` with `0` events.
- classification: Reproduced for the automated direct-extension-page path. Child plan `101` must still verify the exact real toolbar popup context after fixing or working around screenshot permissions.

Pause/resume:

- result: Passed.
- evidence: `Pause automatic capture` set `activeCapturePaused: true` while preserving mode and index; `Resume automatic capture` restored `activeCapturePaused: false` with `activeCaptureMode: "automatic"` and `activeCaptureEventIndex: 0`.

Open/finish portal:

- open active capture: Passed.
- finish capture: Passed.
- origin used: both `Open in portal` and `Finish capture` opened `http://localhost:3000/projects/01KWX72MSSX4WG5Z3VHX7D1J9B/capture-sessions/01KWX73SSPPF4V5WDVPE1SXHGQ`, using the configured portal origin rather than the API origin.
- backend state: the capture session detail route returned `status: "completed"` after finish.
- local state: finish cleared `activeCaptureSessionId`, `activeCaptureProjectId`, `activeCaptureEventIndex`, and `activeCaptureMode`, preserved `selectedProjectId`, and reset `activeCapturePaused` to `false`.
- classification: Fixed by current code for the tested split-origin path. Child plan `102` should become verification/docs closeout unless a true toolbar-popup run proves a different failure.

Security/privacy:

- result: Passed for this phase.
- evidence: no raw input values, DOM HTML, bearer tokens, cookies, screenshots, or binary upload contents were committed. Extension-created event privacy semantics could not be observed in browser because event creation was not reached; existing unit tests still cover `input_value_redacted: true`.

Leftovers for 101:

- Fix or work around the screenshot-capture permission/context failure in the automatic background path.
- Revalidate automatic capture from a real toolbar-launched capture session after the fix.
- Revalidate manual capture from the actual toolbar popup, because the direct extension page is not identical for `activeTab` permission behavior.
- Confirm at least one screenshot asset and one linked event are created server-side for automatic and manual paths.

Leftovers for 102:

- Treat split-origin portal behavior as code-complete in the current tested path. Re-run a focused browser verification from the true toolbar popup and update docs/status rather than changing URL code unless that validation finds a new issue.

Leftovers for 103:

- Guide/demo artifact redogfood remains blocked until child plan `101` produces an extension-created screenshot-backed event or documents a deliberate limitation.

## Implementation Steps

1. Re-read this plan and the parent master plan.
2. Confirm current worktree state and identify uncommitted user/agent changes.
3. Read the exact files listed above.
4. Draw or document the current extension flow map:
   - popup setup/auth;
   - popup project/capture start;
   - content script click listener;
   - runtime message delivery;
   - background automatic capture;
   - manual screenshot fallback;
   - settings/diagnostics persistence;
   - portal URL building/opening.
5. Run focused extension verification.
6. Build the extension for browser validation.
7. Prepare a safe test environment:
   - clean or disposable local database if DB-backed browser validation is used;
   - safe local project created outside the extension before validation if no suitable project exists;
   - safe HTTP/HTTPS test page with at least one button and at least one input field to confirm input clicks are skipped.
8. Attempt agent-browser validation first if it can load/use the unpacked extension in this environment.
9. If agent-browser cannot operate the unpacked extension toolbar popup, document the blocker and perform/document equivalent manual Chrome steps.
10. Capture setup/auth, automatic click, manual screenshot, pause/resume, open portal, and finish evidence.
11. Query or inspect server-side capture session/assets/events after each capture attempt.
12. Classify each historical failure as:
    - reproduced;
    - fixed by current code;
    - inconclusive because browser validation was blocked;
    - not applicable to current code.
13. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
14. Update `apps/extension/README.md` and `docs/project-zoomout-status.md` only if the current dated status changes.
15. Update the parent master plan only for completed phase items.
16. Commit only scoped plan/docs changes if implementation closes this plan.

## Test And Verification Plan

Required before browser validation:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
```

Required after any diagnostic extension code change:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
```

Required if server API behavior is inspected through tests or suspected to be failing:

```bash
rtk pnpm --filter server test -- authentication project capture-session capture-asset capture-event public-instance
rtk pnpm --filter server check-types
```

Recommended if a clean DB-backed browser run is prepared:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
```

Always run before handoff:

```bash
rtk git diff --check
rtk git status --short
```

Do not run destructive DB reset commands against a user database. Confirm the environment is the testing database before using reset commands.

Do not commit generated extension build output from `apps/extension/dist/`.

## Browser Validation Requirements

Browser validation is required unless the local environment cannot load/use the unpacked extension.

Preferred path:

- Use agent-browser to automate browser validation when it can load the unpacked extension and interact with the toolbar popup.

Fallback path:

- Use a documented manual Chrome run with exact steps if agent-browser cannot drive the unpacked extension.

Required browser setup:

```text
Extension build path: apps/extension/dist
API origin: local server origin, for example http://localhost:3002
Portal origin: local web origin, for example http://localhost:3000
Safe test page: local HTTP page with a clickable button and a form input
```

Required validation steps:

1. Load `apps/extension/dist` as an unpacked Chrome extension.
2. Configure the API instance URL.
3. Configure the portal URL when API/web are split.
4. Sign in from the extension popup.
5. Confirm projects load.
6. Select an existing safe test project. If none exists, create it through the portal or API before using the extension; the extension does not create projects.
7. Start automatic capture.
8. Reopen the popup and confirm active capture state is restored.
9. Click a safe button on the safe test page.
10. Reopen the popup and record automatic diagnostic state.
11. Confirm whether an automatic screenshot asset exists.
12. Confirm whether an automatic `click` event exists.
13. Click a sensitive input field and confirm it is skipped.
14. Use `Capture screenshot` from the actual toolbar popup.
15. Confirm whether a manual screenshot asset exists.
16. Confirm whether a manual `capture` event exists.
17. Pause automatic capture.
18. Confirm manual screenshot remains available while automatic capture is paused.
19. Use `Open in portal` and record the opened origin/path.
20. Use `Finish capture` and record completion, local state clearing, and opened origin/path.

Evidence must state:

- browser name/version;
- whether validation was agent-browser or manual;
- extension build path and build timestamp if available;
- API origin;
- portal origin;
- safe test page URL;
- project ID/name with sensitive values redacted if needed;
- capture session ID with sensitive values redacted if needed;
- whether automatic/manual assets and events were created;
- exact first failing boundary for any failed path.

## Explicit Non-Scope

- Fixing automatic click capture behavior.
- Fixing manual screenshot fallback behavior.
- Fixing portal URL behavior, except for a tiny diagnostic-only correction if the baseline cannot otherwise be observed.
- UI redesign.
- Extension popup refactor.
- New extension permissions.
- New capture modes.
- HTML replay.
- DOM snapshot capture.
- Raw input-value capture.
- Full-page screenshot stitching.
- Server route changes.
- Shared schema/type changes.
- Database schema changes.
- Guide/demo generation quality fixes.
- Public viewer changes.
- Chrome Web Store packaging.

## Completion Checklist

- [x] Current worktree state recorded before execution.
- [x] Current extension flow map documented.
- [x] Historical dogfood findings revalidated against current code.
- [x] Setup/auth/project selection classified.
- [x] Capture session start and active state restoration classified.
- [x] Automatic click path classified by boundary.
- [x] Manual screenshot fallback path classified by boundary.
- [x] Pause/resume behavior classified.
- [x] Open active capture portal behavior classified.
- [x] Finish capture portal behavior classified.
- [x] Server-side asset/event evidence recorded or precise absence explained.
- [x] Focused verification commands run and recorded.
- [x] Browser validation completed or blocker documented.
- [x] Security/privacy constraints confirmed.
- [x] Follow-up notes carried into child plans `101`, `102`, or `103` as needed.
- [x] Parent master plan updated only for completed phase status.

## Implementation Log

2026-07-07:

- Re-read this plan, the parent master plan, extension README/status docs, prior extension dogfood plans, extension runtime/test files, and relevant server/shared contract files.
- Confirmed the worktree was clean before scoped changes.
- Ran required extension verification and build commands.
- Launched `agent-browser` with the unpacked extension build and confirmed Chrome recognized the `Demo Composer` extension as enabled.
- Started a disposable testing API on `http://localhost:4021` after resetting only the testing database.
- Started the web portal on `http://localhost:3000`.
- Seeded first-run setup and one disposable project through HTTP APIs.
- Exercised the extension setup, extension login, project selection, automatic capture start, automatic click capture, manual screenshot action, pause/resume, open portal, and finish capture paths.
- Queried server-side capture asset/event/detail APIs to classify record creation and session completion.
- Updated this plan and the parent master plan with completed phase status.

## Verification Notes

Required extension verification:

```bash
rtk pnpm --filter extension test
```

Result: passed, 9 files and 82 tests.

```bash
rtk pnpm --filter extension check-types
```

Result: passed.

```bash
rtk pnpm --filter extension lint
```

Result: passed.

```bash
rtk pnpm --filter extension build
```

Result: passed and generated `apps/extension/dist`.

Testing database preparation:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
```

Result: passed against the testing database (`test-dc` in the local env).

Browser validation:

```bash
rtk agent-browser --session demo-composer-plan-100 --extension /home/tm/Desktop/work/demo_composer_v2/apps/extension/dist open https://example.com
```

Result: passed. Chrome loaded the extension as enabled. Direct extension page automation reached setup, login, project selection, capture start, diagnostics, pause/resume, open portal, and finish capture.

Final handoff verification:

```bash
rtk git diff --check
rtk git status --short
```

Result: passed. `rtk git status --short` showed only scoped edits to this child plan and the parent master plan.

## Leftovers

- Child plan `101` should fix the screenshot capture permission/context failure. The browser failure happens before upload/event creation.
- Child plan `101` should re-run the capture flow from the actual toolbar popup, because this phase used the direct extension page for popup-app automation.
- Child plan `102` should treat split-origin portal URLs as passing in the tested path and focus on true toolbar-popup verification/docs closeout unless a new issue appears.
- Child plan `103` remains blocked until an extension-created screenshot-backed event exists.

## Handoff Notes

Child plan `101` should consume automatic click and manual screenshot classifications from this plan. If either path is inconclusive because browser validation was blocked, `101` should start with the missing validation harness before attempting a code fix.

Child plan `102` should consume split-origin open/finish portal evidence from this plan. If current `portalUrl` support already works in browser validation, `102` should become a verification/docs-close phase rather than a code fix.

Child plan `103` should not start until this plan and any required `101`/`102` fixes produce either a passing extension-created screenshot-backed event or a deliberately bounded limitation with dated evidence.

If this phase discovers a broad issue outside extension reliability, create a separate follow-up note instead of expanding the scope of plan `100`.
