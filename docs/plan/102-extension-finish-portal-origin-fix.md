# Extension Finish Portal Origin Verification And Fix Plan

Date: 2026-07-07

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `102` of the alpha hardening and extension reliability track.

## Objective

Verify and, if still needed, fix Chrome extension finish/open portal behavior so split API/web deployments open the web portal origin instead of the API origin.

This phase should be verification-first. Current code already stores an optional `portalUrl`, unit tests already cover split-origin open/finish URL construction, and plan `100` browser evidence already showed one passing split-origin path. Do not blindly rewrite URL generation unless current evidence proves a real bug.

## Source Of Truth From Previous Phases

### Plan 100 Evidence

Plan `100` completed on 2026-07-07 and found:

- extension setup, login, project loading, project selection, capture session creation, active capture persistence, pause/resume, open active capture, finish capture, and local active capture cleanup worked in browser validation;
- split API/web portal behavior was tested with:
  - API origin `http://localhost:4021`;
  - portal origin `http://localhost:3000`;
  - direct extension-page automation;
- both `Open in portal` and `Finish capture` opened:

```text
http://localhost:3000/projects/<project_id>/capture-sessions/<capture_session_id>
```

- this used the configured portal origin rather than the API origin;
- plan `100` still left formal split-origin closeout to this child plan.

### Plan 101 Implemented Result

Plan `101` completed on 2026-07-07 and changed extension capture reliability:

- `apps/extension/public/manifest.json` now uses `host_permissions: ["<all_urls>"]` so background visible-tab screenshot capture works outside a fresh extension-action invocation;
- content script matches remain scoped to `http://*/*` and `https://*/*`;
- `apps/extension/src/lib/screenshot.ts` now times out unresolved screenshot capture after 10 seconds;
- browser validation proved screenshot-backed automatic `click` and direct extension-page manual `capture` events can be created;
- plan `101` did not change portal URL logic;
- carry-forward for this phase: plan `100` already validated configured split-origin portal URLs once, but formal finish/open portal closeout remains unstarted.

## Recheck Notes: 2026-07-07

This plan was rechecked against completed plan `101` and master plan `004` on 2026-07-07.

Planning gaps closed during recheck:

- The current URL helper normalizes a URL string and trims trailing slashes; it does not explicitly strip path segments down to `URL.origin`. Browser validation for this phase should use pure API and portal origins such as `http://localhost:4021` and `http://localhost:3000`. If implementers want to support or reject pathful portal base URLs, they must add focused tests before changing behavior.
- `apps/extension/README.md` and `docs/project-zoomout-status.md` contain historical dogfood status wording. This phase should update those docs only after current split-origin browser evidence proves the closeout status changed.
- Master plan `004` asks this phase to confirm how server/web expose API origin, web origin, and instance status. The current implementation uses explicit extension `portalUrl`; public instance/web-origin contracts should stay read-only investigation unless explicit `portalUrl` is proven insufficient.

## Current Code Baseline To Account For

Current extension URL and portal behavior:

- `apps/extension/src/lib/url.ts`
  - `normalizeInstanceUrl` accepts only `http://` and `https://`, trims trailing slashes, and returns a normalized URL string;
  - `buildPortalCaptureSessionUrl` uses `(portalUrl ?? instanceUrl)` as the origin;
  - it accepts only safe relative redirect paths beginning with a single `/`;
  - it rejects absolute redirects and protocol-relative redirects by falling back to an encoded local capture-session path.
- `apps/extension/src/App.tsx`
  - setup stores `instanceUrl` and optional `portalUrl`;
  - `Open in portal` calls `buildPortalCaptureSessionUrl(instanceUrl, portalUrl, null, projectId, captureSessionId)`;
  - `Finish capture` calls `completeCaptureSession`, then calls `buildPortalCaptureSessionUrl(instanceUrl, portalUrl, result.redirect.path, projectId, captureSessionId)`;
  - `Finish capture` clears local active capture state only after backend completion succeeds and before attempting portal navigation;
  - portal open errors surface as popup errors.
- `apps/extension/src/lib/settings.ts`
  - `portalUrl` is an optional stored setting;
  - changing the instance clears `portalUrl`, token, selected project, active capture state, and diagnostics;
  - saving `portalUrl` does not clear auth or active capture state.
- `apps/extension/src/lib/navigation.ts`
  - uses `chrome.tabs.create({ url })` when available;
  - falls back to `window.open(..., "noopener,noreferrer")`;
  - rejects when browser tab opening fails.
- Existing tests already cover important behavior:
  - `apps/extension/src/lib/url.test.ts` covers split-origin URL construction and unsafe redirect fallback;
  - `apps/extension/src/App.test.tsx` covers open-active and finish using configured `portalUrl`;
  - `apps/extension/src/lib/settings.test.ts` covers saving portal URL without clearing state;
  - `apps/extension/src/lib/api.test.ts` covers complete-session API request shape.

## Exact Files To Read Before Implementation

Read these before editing:

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md
docs/plan/101-extension-capture-upload-and-event-fix.md
docs/plan/102-extension-finish-portal-origin-fix.md
docs/project-zoomout-status.md
apps/extension/README.md
apps/extension/package.json
apps/extension/public/manifest.json
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/src/lib/api.ts
apps/extension/src/lib/api.test.ts
apps/extension/src/lib/navigation.ts
apps/extension/src/lib/navigation.test.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/settings.test.ts
apps/extension/src/lib/url.ts
apps/extension/src/lib/url.test.ts
```

Read capture code only as needed to set up browser validation:

```text
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/screenshot.ts
```

Read these server/shared files if validating or diagnosing the complete route:

```text
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-session/capture-session.service.test.ts
apps/server/src/modules/capture-session/capture-session.routes.test.ts
apps/server/src/modules/capture-session/capture-session.db.integration.test.ts
packages/types/src/capture.ts
packages/types/src/capture.test.ts
```

Read public instance/web files to confirm there is no required origin-discovery contract already being ignored. Keep this read-only unless the current explicit `portalUrl` setup proves insufficient:

```text
apps/server/src/modules/public-instance/public-instance.routes.ts
apps/server/src/modules/public-instance/public-instance.service.ts
packages/types/src/instance.ts
packages/types/src/instance.test.ts
apps/web/src/lib/api.ts
```

## Expected Affected Files

Most likely, this phase should be verification/docs only or a narrow test/doc closeout.

Likely files:

```text
docs/plan/102-extension-finish-portal-origin-fix.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
apps/extension/README.md
docs/project-zoomout-status.md
```

Likely test-only files if coverage gaps are found:

```text
apps/extension/src/lib/url.test.ts
apps/extension/src/lib/settings.test.ts
apps/extension/src/lib/navigation.test.ts
apps/extension/src/App.test.tsx
apps/extension/src/lib/api.test.ts
```

Conditional implementation files, only if current tests or browser evidence fail:

```text
apps/extension/src/lib/url.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/navigation.ts
apps/extension/src/App.tsx
apps/extension/src/lib/api.ts
```

Conditional server/shared files, only if the complete-session redirect contract is actually missing, unsafe, or incompatible:

```text
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-session/capture-session.service.ts
packages/types/src/capture.ts
packages/types/src/capture.test.ts
```

Do not touch these unless direct evidence proves they are required:

```text
apps/web/src/
apps/server/src/db/migrations/
apps/extension/public/manifest.json
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/content-click-capture.ts
packages/constants/
pnpm-lock.yaml
```

`apps/extension/dist` may be generated for browser validation, but it must not be committed.

## Routes And API Contracts

No route URL change is expected.

Protect these route contracts:

```text
POST /api/v1/authentication/login
GET  /api/v1/projects
POST /api/v1/projects/:project_id/capture-sessions
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/detail
```

The complete route response contract is:

```ts
{
  capture_session: CaptureSession;
  redirect: {
    path: string;
    reason: "capture_session_completed";
  };
}
```

Contract rules:

- Extension login continues to send `x-demo-composer-client: extension` and consumes `session_token`.
- Authenticated extension calls continue to send `Authorization: Bearer <session_token>`.
- Capture session creation continues to send `source_type: "extension"`.
- Complete capture session calls continue to use `POST` with bearer auth and no request body.
- Complete capture session response must keep `redirect.path` as a relative portal path.
- Extension must treat `redirect.path` as untrusted and must never navigate to an absolute external URL from that field.
- Extension must not include bearer/session tokens in portal URLs.
- `Open in portal` must not call the complete route and must not clear local active capture state.
- `Finish capture` must call the complete route, clear local active capture state after backend completion succeeds, and then attempt portal navigation.

If browser validation shows the backend complete route succeeds but navigation opens the API origin, fix extension URL composition first. Do not change server contracts unless the backend returns an unsafe or incompatible redirect shape.

## Schemas And Types

Relevant shared schemas/types:

- `CompleteCaptureSessionResponse` and `CompleteCaptureSessionResponseSchema` from `packages/types/src/capture.ts`;
- `CaptureSessionResponse` and capture session status types from `packages/types/src/capture.ts`;
- public instance status types from `packages/types/src/instance.ts`, only if this phase expands origin discovery.

Relevant extension-local types:

- `ExtensionSettings` in `apps/extension/src/lib/settings.ts`;
- `NormalizedInstanceUrlResult` in `apps/extension/src/lib/url.ts`;
- dependency signatures in `apps/extension/src/App.tsx`;
- `completeCaptureSession` input/output in `apps/extension/src/lib/api.ts`.

Do not move browser-only URL/settings types into shared packages.

Do not add server-provided web-origin fields unless current code cannot safely support split-origin behavior with explicit `portalUrl`. If a new public instance contract becomes necessary, stop and document why explicit extension configuration is insufficient before editing server/shared contracts.

## Behavior Rules

### Setup And Storage

- The extension must continue to ask for an API instance URL first.
- The optional portal URL remains optional.
- Both `instanceUrl` and `portalUrl` must be normalized to `http://` or `https://` URL strings without trailing slashes.
- Browser validation should use pure origins. Do not introduce, remove, or reinterpret pathful base URL behavior without focused tests.
- Invalid portal URL input must be rejected before storage with a user-facing validation message.
- Saving a portal URL must not clear auth, selected project, active capture state, or diagnostics.
- Changing the instance must continue clearing `portalUrl`, token, selected project, active capture state, and diagnostics.
- Existing settings with no `portalUrl` must keep working.

### Open Active Capture

- Uses the current active project ID and capture session ID.
- Must open:

```text
{portalUrl}/projects/{project_id}/capture-sessions/{capture_session_id}
```

when `portalUrl` is configured.
- Must open the same path on `instanceUrl` when `portalUrl` is absent.
- Must not call `completeCaptureSession`.
- Must not clear local active capture state.
- Must surface `Could not open capture in portal.` if navigation fails.

### Finish Capture

- Must call:

```text
POST {instanceUrl}/api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
```

using the API instance URL, not the portal URL.
- Must use `portalUrl` for final browser navigation when configured.
- Must use the backend `redirect.path` only if it is a safe relative path.
- Must fall back to an encoded local capture-session detail route when `redirect.path` is missing or unsafe.
- Must clear local active capture state only after backend completion succeeds.
- Must preserve selected project after finishing.
- Must surface `Could not open portal after finishing capture.` if navigation fails.

### URL Safety

- Avoid duplicate slashes between origin and path.
- Preserve safe relative redirect paths including query/hash if current helper behavior supports them; if tests reveal query/hash are lost or unsafe, document before changing.
- Reject these redirect path forms for navigation purposes:
  - absolute URLs such as `https://evil.example/path`;
  - protocol-relative URLs such as `//evil.example/path`;
  - non-leading-slash paths such as `projects/project_1`;
  - scheme-like path strings that could escape origin.
- Encode fallback project/session IDs with `encodeURIComponent`.

## Security And Permission Rules

- Do not trust browser page origins for privileged API calls.
- API calls must use only the configured `instanceUrl`.
- Portal navigation may use only a validated `portalUrl` or the validated `instanceUrl` fallback.
- Only `http://` and `https://` portal URLs are accepted.
- Do not expose session tokens, cookies, passwords, or bearer tokens in portal URLs, logs, docs, or query strings.
- Do not weaken safe redirect path handling.
- Do not add extension permissions in this phase.
- Do not alter the plan `101` screenshot permission boundary.
- Preserve current CORS/session behavior.
- Do not capture raw input values, page HTML, or new browser data as part of portal validation.

## Migration And Backwards Compatibility

No database migration is expected.

No API route migration is expected.

No shared schema migration is expected unless explicit portal URL discovery becomes necessary and is separately justified.

Extension storage compatibility:

- Existing settings without `portalUrl` must continue to open single-origin portal paths against `instanceUrl`.
- Existing settings with `portalUrl` must remain readable.
- Existing active capture state must not be cleared by any verification-only change.
- If a storage shape change becomes unavoidable, add compatibility reads for old values and tests for both old and new shapes.

Browser/install compatibility:

- Do not change `apps/extension/public/manifest.json`.
- Do not require users to reconnect their instance if they already have valid stored `instanceUrl` and optional `portalUrl`.

## Implementation Steps

1. Reread this plan, plan `100`, completed plan `101`, and the parent master plan.
2. Confirm current worktree state and identify unrelated changes.
3. Re-read the exact extension URL/settings/navigation/API files listed above.
4. Confirm how the current server/web setup exposes API origin, web origin, and public instance status. Treat this as read-only investigation unless explicit extension `portalUrl` cannot safely support split-origin behavior.
5. Confirm current tests already cover:
   - split-origin `buildPortalCaptureSessionUrl`;
   - unsafe completion redirects;
   - portal URL storage persistence;
   - open-active using `portalUrl`;
   - finish using `portalUrl`;
   - complete-route request shape.
6. Add focused tests only for any real coverage gap discovered in step 5. Likely examples:
   - portal URL normalization rejects invalid optional portal input in `ConnectInstance`;
   - current pathful portal base URL behavior is either intentionally preserved or intentionally rejected;
   - safe relative redirect with query/hash if not covered and considered required;
   - `Open in portal` navigation failure leaves active capture state intact;
   - `Finish capture` navigation failure clears local active capture only after backend completion, if that is intended and not already covered.
7. Run focused extension tests before editing implementation code.
8. If focused tests and browser validation pass, keep implementation code unchanged and update only docs/status/plan closeout.
9. If focused tests fail, fix the narrowest extension-local URL/settings/navigation bug.
10. If browser validation proves the request reaches the API and the backend redirect contract is wrong, stop and classify the server/shared issue before editing.
11. Run required focused verification.
12. Build the extension for browser validation.
13. Run split-origin browser validation with agent-browser where feasible.
14. Record redacted evidence in this plan.
15. Update `apps/extension/README.md` and `docs/project-zoomout-status.md` only if status or operator-facing instructions change.
16. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
17. Update the parent master plan only for completed phase status.
18. Commit only scoped changes.

## Test And Verification Plan

Required focused extension tests:

```bash
rtk pnpm --filter extension test -- src/lib/url.test.ts src/lib/settings.test.ts src/lib/navigation.test.ts src/lib/api.test.ts src/App.test.tsx
```

Required extension checks:

```bash
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
```

Required if extension runtime code changes or browser validation is run:

```bash
rtk pnpm --filter extension build
```

Run full extension suite before handoff:

```bash
rtk pnpm --filter extension test
```

Required if server capture-session complete route changes:

```bash
rtk pnpm --filter server test -- capture-session
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter @repo/types test
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

Browser validation is required because this phase closes a split-origin browser workflow.

Use agent-browser first. Build the extension before launching browser validation:

```bash
rtk pnpm --filter extension build
rtk agent-browser --session demo-composer-plan-102 --extension /home/tm/Desktop/work/demo_composer_v2/apps/extension/dist open <safe-page-or-extension-url>
```

Use a disposable local setup:

```text
API origin: http://localhost:4021 or the current local testing API origin
Portal origin: http://localhost:3000 or the current local web origin
Extension build path: apps/extension/dist
Project: disposable test project
Capture session: disposable extension-created session
```

Browser steps:

1. Reset only the testing DB if a DB-backed run is used.
2. Start the testing API.
3. Start the local web portal on a different origin from the API.
4. Build and load the extension.
5. Configure extension instance URL as the API origin.
6. Configure extension portal URL as the web origin.
7. Sign in through the extension.
8. Select or seed a disposable project.
9. Start automatic capture.
10. Confirm active capture state is visible after reopening/reloading the extension page/popup.
11. Click `Open in portal`.
12. Confirm the opened tab URL begins with the portal origin, not the API origin.
13. Confirm `Open in portal` did not complete the backend session and did not clear local active capture state.
14. Return to the extension active capture state.
15. Click `Finish capture`.
16. Confirm the complete route returns success and backend session status becomes `completed`.
17. Confirm the opened tab URL begins with the portal origin, not the API origin.
18. Confirm local active capture state is cleared and selected project remains.
19. Repeat or document single-origin compatibility:
    - either run a second extension setup with only `instanceUrl`;
    - or document existing unit coverage plus code path if browser time is constrained.

Evidence to record:

- browser/agent-browser path used;
- extension ID if relevant;
- API origin;
- portal origin;
- project ID/name;
- capture session ID;
- `Open in portal` opened URL;
- backend session status before and after open-active;
- `Finish capture` opened URL;
- backend session status after finish;
- local state outcome after open-active and finish;
- single-origin compatibility evidence;
- exact blocker if toolbar-popup or multi-tab navigation cannot be driven by agent-browser.

Do not record bearer tokens, cookies, passwords, screenshots containing private data, or raw uploaded screenshot binary.

## Documentation Updates

Update `apps/extension/README.md` only if current instructions are stale. Current README already says:

- API calls use the instance URL;
- `Open in portal` and `Finish capture` use the configured portal URL;
- finish uses backend relative redirect path when safe and never includes session tokens in the portal URL.

The README also still has historical product-positioning text from 2026-06-22 saying portal links opened the API origin. If this phase's browser validation confirms the current split-origin path, update that historical status wording with a dated note rather than deleting useful context.

Update `docs/project-zoomout-status.md` only if browser validation changes current status:

- split-origin portal closeout passes;
- split-origin remains limited;
- browser validation is blocked by an environment limitation.

Do not refresh product screenshots in this phase. Child plan `103` owns final extension evidence/screenshots.

## Explicit Non-Scope

- Automatic click capture fixes.
- Manual screenshot upload/event fixes.
- True Chrome toolbar-popup manual screenshot validation except as incidental setup; plan `101` carries that limitation.
- New capture modes.
- HTML replay.
- DOM snapshot capture.
- Raw input-value capture.
- Full-page stitched screenshots.
- Extension visual redesign.
- Web portal visual redesign.
- Guide/demo generation quality.
- Public guide/demo viewer changes.
- Chrome Web Store packaging.
- New hosted deployment automation.
- Database migrations.
- Route URL churn.
- New public instance/web-origin contract unless explicit `portalUrl` is proven insufficient.
- Changes to extension permissions or manifest.

## Completion Checklist

- [ ] Plan `100` and completed plan `101` evidence used as source of truth.
- [ ] Current worktree state checked before edits.
- [ ] Current portal URL storage and URL builder behavior audited.
- [ ] Current server/web origin exposure and public instance status behavior reviewed.
- [ ] Existing tests inventoried for split-origin open/finish coverage.
- [ ] Coverage gaps filled with focused tests or explicitly documented as already covered.
- [ ] Split-origin `Open in portal` verified or fixed.
- [ ] Split-origin `Finish capture` verified or fixed.
- [ ] Single-origin compatibility preserved.
- [ ] Unsafe redirect handling preserved.
- [ ] No session tokens are included in portal URLs.
- [ ] No extension permissions changed.
- [ ] Focused extension tests run.
- [ ] Extension typecheck and lint run.
- [ ] Extension build run if browser validation or runtime changes are involved.
- [ ] Browser validation completed or precise blocker documented.
- [ ] Docs/status updated only where evidence changed.
- [ ] Plan `102` updated with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

Child plan `103` owns final extension browser evidence and screenshots. It should consume this phase's split-origin evidence before refreshing captured-workflow screenshots or declaring extension dogfood no longer blocked.

Child plan `103` should also inherit plan `101`'s remaining true-toolbar-popup manual capture limitation unless this phase happens to close it with a real toolbar-popup validation path.

Child plan `107` owns broad extension popup refactoring. Do not split or redesign popup internals in this phase unless required for a narrowly proven portal-origin bug.
