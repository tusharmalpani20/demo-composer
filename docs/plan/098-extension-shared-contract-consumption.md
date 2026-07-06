# Extension Shared Contract Consumption Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `098` of the shared contracts and domainization track.

## Objective

Make `apps/extension` consume the shared API contracts and constants that now exist after plans `087` through `097`, without changing extension UI appearance, popup copy, browser capture behavior, privacy defaults, request routes, request bodies, response handling semantics, or instance-first login behavior.

This is a browser-extension contract cleanup plan. It is not a UI redesign, not a browser-permission change, not a capture behavior change, and not a backend route change.

The desired end state is:

- extension API response DTOs use `@repo/types` directly where the backend response is a true shared API contract;
- extension API literals are typed or validated with `@repo/constants` where they represent shared product/API vocabulary;
- browser-only inputs, runtime messages, storage state, `Blob`/`FormData` upload inputs, content-script payloads, and extension UI state remain local;
- privacy-preserving request narrowing remains intact even when shared server DTOs are broader than the extension should send.

## Implemented Baseline From 097

Plan `097` completed and was post-implementation audited on 2026-07-07.

Relevant carry-forward from `097`:

- Web now imports shared API DTOs directly from `@repo/types/*` in `apps/web/src/lib/api.ts`.
- Web consumes shared constants for stable domain option lists where they are true product/API values.
- Browser-only upload inputs and viewer defensive parsing remain local.
- The extension should follow the same rule: consume shared `@repo/types` and `@repo/constants` directly where they are true extension/API contracts, keep browser-extension runtime message or browser API shapes local, and do not add domain package dependencies to the extension.

## Current Extension Baseline

`apps/extension/package.json` already depends on:

```text
@repo/constants
@repo/types
@repo/ui
```

Do not add new dependencies unless implementation discovers a real missing package. `@repo/*-domain` packages must not be added to `apps/extension`; the extension consumes public contracts/constants, not domain policies.

Current `apps/extension/src/lib/api.ts` already imports these shared contracts:

```text
@repo/constants:
  CaptureAssetType
  CaptureEventType
  CaptureSessionSourceType
  CaptureSessionStatus

@repo/types/auth:
  AuthResponse
  ExtensionLoginResponse
  LoginRequest

@repo/types/project:
  Project
  ProjectListResponse

@repo/types/capture:
  CaptureEvent
  CaptureEventResponse
```

Current local API types that need review in this phase:

```text
CaptureSession
CreateCaptureSessionInput
CaptureSessionResponse
CompleteCaptureSessionResponse
CaptureAsset
CaptureAssetResponse
UploadCaptureAssetInput
CreateCaptureEventInput
```

Important baseline nuance:

- `CaptureSessionResponse` and `CompleteCaptureSessionResponse` have matching shared DTOs in `@repo/types/capture`.
- `CaptureAssetResponse` has a matching shared DTO in `@repo/types/capture`, but the current local `CaptureAsset` is a narrow extension subset. The shared `CaptureAsset` includes fields such as `organization_id`, `file`, audit fields, and timestamps. Replace only after fixtures and consumers are updated safely.
- `CreateCaptureSessionInput` is intentionally extension-oriented and currently forces `source_type: "extension"` at the API call boundary.
- `CreateCaptureEventInput` is intentionally narrower than the shared server request. It only allows `event_type: "capture" | "click"`, requires `capture_asset_id`, and keeps redaction explicit. Do not blindly replace it with the broader shared `CreateCaptureEventInput` if doing so broadens what extension callers can send.
- `UploadCaptureAssetInput` is browser-only multipart input with `Blob`, `fileName`, and camelCase metadata fields. It should remain local.

## Relevant Docs To Read Before Coding

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/plan/091-project-identity-setup-organization-contract-cleanup.md
docs/plan/092-capture-domain-extraction.md
docs/plan/097-web-shared-contract-consumption.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0019-separate-web-and-server-apps.md
```

## Exact Affected Files

Primary implementation files:

```text
apps/extension/src/lib/api.ts
apps/extension/src/lib/api.test.ts
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/automatic-capture.test.ts
```

Files to inspect and touch only if the implementation changes constants/types they currently own:

```text
apps/extension/src/lib/settings.ts
apps/extension/src/lib/settings.test.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/content-click-capture.test.ts
apps/extension/src/background.ts
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/screenshot.test.ts
```

Package metadata file to inspect, but no change is expected because shared dependencies already exist:

```text
apps/extension/package.json
```

Plan status files to update after implementation:

```text
docs/plan/098-extension-shared-contract-consumption.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

Do not modify unless implementation discovers a real contract bug and the plan is updated first:

```text
packages/constants/src/**/*
packages/types/src/**/*
packages/*-domain/src/**/*
apps/server/**/*
apps/web/**/*
apps/extension/public/manifest.json
apps/extension/src/index.css
apps/extension/src/**/*.css
```

Do not modify browser-visible JSX, rendered copy, class names, CSS, extension permissions, host permissions, popup layout, or navigation behavior. If JSX edits become necessary because of type imports, keep them mechanical and run the browser validation listed below.

## Routes And API Contracts

No route URL, method, header behavior, request body shape, response envelope, or error response behavior should change.

The extension API client must continue using these paths and request rules:

```text
POST /api/v1/authentication/login
  Body: LoginRequest
  Headers: accept application/json, content-type application/json, x-demo-composer-client extension
  Response: ExtensionLoginResponse
  Behavior: use configured Instance URL; expose extension session_token from response; credentials include

GET /api/v1/authentication/me
  Headers: accept application/json, authorization Bearer <sessionToken>
  Response: AuthResponse
  Behavior: session token must stay in Authorization header only

GET /api/v1/projects
  Headers: accept application/json, authorization Bearer <sessionToken>
  Response: ProjectListResponse

POST /api/v1/authentication/logout
  Headers: accept application/json, authorization Bearer <sessionToken>
  Response: 204/no body mapped to void

POST /api/v1/projects/:projectId/capture-sessions
  Body: extension capture-session create input; source_type must be extension
  Headers: accept application/json, authorization Bearer <sessionToken>, content-type application/json, x-demo-composer-client extension
  Response: CaptureSessionResponse

POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/assets/upload
  Body: multipart FormData with file, width, height, device_pixel_ratio, page_url, page_title, captured_at, metadata
  Headers: accept application/json, authorization Bearer <sessionToken>, x-demo-composer-client extension
  Forbidden: do not set content-type manually; browser must set multipart boundary
  Response: CaptureAssetResponse

POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/events
  Body: extension capture-event create input; input_value_redacted must be forced to true
  Headers: accept application/json, authorization Bearer <sessionToken>, content-type application/json, x-demo-composer-client extension
  Response: CaptureEventResponse

POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/complete
  Body: none
  Headers: accept application/json, authorization Bearer <sessionToken>, x-demo-composer-client extension
  Forbidden: no content-type header and no token in URL
  Response: CompleteCaptureSessionResponse
```

All `projectId` and `captureSessionId` path segments must remain `encodeURIComponent` encoded.

## Schemas And Types

Shared contracts to consume directly where safe:

```text
@repo/types/auth:
  LoginRequest
  AuthResponse
  ExtensionLoginResponse

@repo/types/project:
  Project
  ProjectListResponse

@repo/types/capture:
  CaptureSession
  CaptureSessionResponse
  CompleteCaptureSessionResponse
  CaptureAsset
  CaptureAssetResponse
  CaptureEvent
  CaptureEventResponse

@repo/constants:
  CAPTURE_SESSION_SOURCE_TYPES / CaptureSessionSourceType
  CAPTURE_SESSION_STATUSES / CaptureSessionStatus
  CAPTURE_EVENT_TYPES / CaptureEventType
  CAPTURE_ASSET_TYPES / CaptureAssetType
```

Current shared constants mostly expose enum arrays and inferred union types, not singular named literal constants such as `CAPTURE_SOURCE_EXTENSION` or `CAPTURE_EVENT_CLICK`. Do not introduce array-index-based literals such as `CAPTURE_SESSION_SOURCE_TYPES[1]`; that would be more brittle than the current explicit API literals. Adding new singular constants is outside this phase unless implementation first discovers a real mismatch and this plan is revised.

Required cleanup targets:

- Replace local `CaptureSession` with shared `CaptureSession` if all current extension consumers and fixtures accept the full shared shape.
- Replace local `CaptureSessionResponse` with shared `CaptureSessionResponse`.
- Replace local `CompleteCaptureSessionResponse` with shared `CompleteCaptureSessionResponse`.
- Evaluate local `CaptureAsset` and `CaptureAssetResponse` together. Prefer shared `CaptureAssetResponse` if tests and call sites can safely model the full server response. If extension code intentionally needs a minimal subset, derive that subset with `Pick` from shared `CaptureAsset` and document why it remains local.
- Keep exported type names from `apps/extension/src/lib/api.ts` stable for current extension consumers. If an exported name changes internally, keep a compatibility export unless all import sites are updated in the same commit.

Request input rules:

- `UploadCaptureAssetInput` must remain local because it contains browser `Blob`, file naming, camelCase form metadata, and multipart behavior that are not server JSON DTOs.
- `CreateCaptureSessionInput` may be derived from shared `CreateCaptureSessionInput` only if the exported extension type still forces or effectively narrows `source_type` to `"extension"` and does not let callers create manual/import capture sessions from the extension.
- `CreateCaptureEventInput` must remain extension-narrowed or be derived from the shared type with a stricter extension alias. It must continue to:
  - allow only `"capture"` and `"click"` event types;
  - require `capture_asset_id`;
  - preserve `input_value_redacted?: true`;
  - avoid permitting raw input values or other sensitive typed values;
  - keep screenshot/click metadata behavior unchanged.
- `ApiClientError`, `ApiErrorBody`, `joinApiUrl`, `requestJson`, `authHeaders`, and multipart helpers remain extension-local implementation details.

Types that must remain local:

```text
ExtensionSettings
AutomaticCaptureDiagnostic
ManualCaptureDiagnostic
PageClickCapturePayload
PageClickCaptureMessage
ClickCaptureState
AutomaticClickMessage
AutomaticCaptureResult
ScreenshotCapture
background runtime message unions
storage area adapter types
popup component dependency prop types
```

These model browser extension storage, runtime messaging, screenshot APIs, UI state, or test seams. They are not shared API contracts.

## Constants And Literal Cleanup

Audit extension literals before editing:

```text
rtk rg "\"(extension|capture|click|screenshot|manual|automatic|success|failed|draft|completed|canceled)\"" apps/extension/src
```

Use shared constants/types only for shared API vocabulary:

- capture session `source_type: "extension"`;
- capture event `event_type: "capture" | "click"`;
- capture asset `asset_type: "screenshot"`;
- capture session statuses in API fixtures or shared DTO assertions.

Because the current constants package exposes arrays/types for these values, valid implementations include:

- using shared union types such as `CaptureSessionSourceType`, `CaptureEventType`, and `CaptureAssetType` to type extension request aliases;
- importing enum arrays for validation, option derivation, or tests only when the code needs the complete set;
- keeping clear string literals such as `"extension"`, `"capture"`, `"click"`, and `"screenshot"` where they are the actual API payload values and shared union types already guard drift.

Invalid implementations:

- selecting values from shared arrays by numeric index;
- adding singular literal constants to `@repo/constants` as a drive-by cleanup;
- replacing extension-local mode literals with capture source constants.

Keep local literals local when they are extension runtime/UI state:

- `activeCaptureMode: "manual" | "automatic" | null` in settings and popup state;
- diagnostic status `"success" | "failed"`;
- runtime message type `"demo_composer:page_click"`;
- storage key strings;
- content-script event listener type `"click"`;
- automatic capture result reasons.

Do not conflate extension local mode `"manual" | "automatic"` with shared capture session source type `"manual" | "extension" | "import"`.

## Behavior Rules To Preserve

- Instance-first login remains required; all API calls use the configured Instance URL.
- Login continues to send `x-demo-composer-client: extension`.
- Authenticated calls continue to send the extension session token only as `Authorization: Bearer <token>`.
- Tokens must never be interpolated into URLs, form fields, metadata, console output, or error messages.
- `credentials: "include"` remains on API requests.
- Multipart upload must not set `content-type` manually.
- The capture session create body must still send or force `source_type: "extension"`.
- Capture event create must still force `input_value_redacted: true`.
- Screenshot capture remains the MVP path.
- HTML replay remains out of scope.
- Automatic click capture still skips inactive, paused, busy, and unavailable-browser states exactly as before.
- Content-script click capture must still skip untrusted events, non-left-click events, and sensitive fields (`input`, `textarea`, `select`, `[contenteditable]`).
- Existing manual capture and automatic capture event-index behavior must not change.
- Existing error mapping through `ApiClientError` must not change.

## Security And Permission Rules

- Do not edit `apps/extension/public/manifest.json`.
- Do not add Chrome permissions, host permissions, content script matches, externally connectable settings, or background capabilities.
- Do not relax sensitive-field filtering.
- Do not collect raw input values, typed values, passwords, secrets, or full form contents.
- Do not add HTML replay capture, DOM serialization, network request capture, cookie capture, localStorage capture, or page source capture.
- Do not persist additional sensitive values in `chrome.storage.local`.
- Keep diagnostics free of captured input values and auth tokens.
- If a shared DTO is broader than the extension privacy contract, keep the extension-local narrowed input type.

## Migration And Backwards Compatibility

- No database migration is expected.
- No server implementation change is expected.
- No API route change is expected.
- No extension manifest migration is expected.
- No storage key migration is expected. Existing extension settings keys and values must continue to parse.
- No package dependency migration is expected because `@repo/types` and `@repo/constants` already exist in `apps/extension/package.json`.
- The extension API module should keep existing exported type names where current app files import them.
- Test fixtures may need to include full shared response DTO fields if local narrow response types are replaced with shared types. This is a compile-time fixture alignment, not a runtime contract change.

## Implementation Plan

1. Baseline audit.
   - Run the literal/type searches in this plan.
   - Confirm the worktree has no unrelated uncommitted changes before editing.
   - Re-read `apps/extension/src/lib/api.ts`, `App.tsx`, `automatic-capture.ts`, `settings.ts`, `content-click-capture.ts`, and their focused tests.

2. Migrate safe API response DTOs first.
   - Import `CaptureSession`, `CaptureSessionResponse`, and `CompleteCaptureSessionResponse` from `@repo/types/capture`.
   - Remove local duplicate response type definitions only after all import sites compile.
   - Keep API client function signatures and exported names stable.

3. Evaluate capture asset response shape.
   - Try replacing local `CaptureAssetResponse` with shared `CaptureAssetResponse`.
   - Update test fixtures with the full shared server response shape if needed.
   - If this creates unnecessary churn or exposes that extension intentionally relies on a subset, keep a local subset derived from shared `CaptureAsset` and document it in the implementation log.

4. Keep or derive narrowed request input types.
   - Do not replace `UploadCaptureAssetInput` with a shared server DTO.
   - For `CreateCaptureSessionInput`, either keep the local type or derive a narrowed extension alias from shared `CreateCaptureSessionInput` while preserving `"extension"` source enforcement.
   - For `CreateCaptureEventInput`, either keep the local type or derive a narrowed extension alias from shared `CreateCaptureEventInput` while preserving privacy and event-type restrictions.

5. Audit constants.
   - Replace or type API vocabulary literals with shared constants/types only when it improves drift resistance without reducing readability or changing behavior.
   - Do not use numeric indexes into shared enum arrays to avoid string literals.
   - Do not add new singular constants in `@repo/constants` during this phase unless a real contract mismatch is found and the plan is updated first.
   - Leave extension runtime/UI state literals local.
   - Avoid introducing broad constant imports only for test-only assertions unless it clearly prevents drift.

6. Update focused tests.
   - Adjust compile-time fixtures for full shared DTO shapes.
   - Add or preserve assertions that prove redaction, headers, multipart behavior, no-token-in-URL behavior, and source/event literals remain unchanged.
   - If using TDD for a behavioral bug found during implementation, first add the failing focused test, verify it fails for the expected reason, then make the minimal code change.

7. Update plan docs after implementation.
   - Mark this plan completed only after focused verification passes.
   - Update the master plan only for completed phase status and any carry-forward notes into `099`.

## Test And Verification Plan

Run focused verification for every touched area.

Minimum verification for API-only contract cleanup:

```text
rtk pnpm --filter extension test -- api
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm check-types
rtk git diff --check
```

If `App.tsx` or popup capture orchestration imports/types are touched:

```text
rtk pnpm --filter extension test -- App
rtk pnpm --filter extension test -- api App
```

If automatic capture or content-script files are touched:

```text
rtk pnpm --filter extension test -- automatic-capture content-click-capture
```

If settings/storage parsing is touched:

```text
rtk pnpm --filter extension test -- settings
```

If screenshot/browser capture code is touched:

```text
rtk pnpm --filter extension test -- screenshot
```

Recommended full extension verification before commit:

```text
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
```

Server verification is not expected. If implementation changes shared contracts or server-facing schemas, stop, update this plan first, then run focused server route tests for the affected extension-facing capture/auth routes, such as:

```text
rtk pnpm --filter server test -- authentication project capture-session capture-event capture-asset
```

## Browser Validation Requirements

If implementation only changes TypeScript imports/types in `apps/extension/src/lib/api.ts` and focused unit/typecheck verification passes, browser validation is not required because there is no frontend/browser runtime behavior change.

If implementation touches any of these files, browser validation is required:

```text
apps/extension/src/App.tsx
apps/extension/src/background.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/screenshot.ts
apps/extension/public/manifest.json
```

Required browser validation when popup UI behavior is touched:

- Use agent-browser against the extension Vite page or available extension test harness.
- Validate the configured/signed-out state still renders without layout or copy changes.
- Validate signed-in project selection/capture controls still render with mocked API/state.
- Validate active capture controls still expose manual/automatic/pause/finish behavior as before.
- Capture screenshots for changed visible states only if visual behavior was touched.

Required browser/extension validation when content-script, background, screenshot, or automatic-capture runtime behavior is touched:

- Prefer an existing loaded-extension or browser automation harness if one exists.
- If no harness exists, document the limitation in the implementation log and rely on focused unit tests plus typecheck.
- Do not claim full extension end-to-end browser coverage unless the extension was actually loaded and exercised in a browser context.

## Acceptance Criteria

- Extension consumes shared capture/auth/project response DTOs where they are true API contracts.
- Local extension request types remain narrowed where shared server DTOs are broader than extension-safe behavior.
- Browser-only `Blob`, `FormData`, runtime message, settings, screenshot, and UI state types remain local.
- Shared constants are used only for API/product vocabulary that benefits from centralization.
- Shared enum arrays are not used through numeric indexes, and no out-of-scope singular constants are added.
- No extension UI copy, styling, layout, manifest permissions, host permissions, or browser-visible workflow changes.
- Instance-first login behavior remains intact.
- Extension session tokens remain protected and are never placed in URLs or payload metadata.
- Capture event semantics, redaction defaults, and sensitive-field suppression remain unchanged.
- Focused extension tests, typecheck, lint, and repo typecheck pass.

## Explicit Non-Scope

- UI redesign or popup copy changes.
- CSS/class/layout changes.
- Extension permission or manifest changes.
- New capture behavior.
- HTML replay or DOM capture.
- Server route/controller/service changes.
- Shared package schema/constant additions unless a real mismatch is discovered and this plan is revised first.
- Domain package dependencies in the extension.
- Web app changes.
- Storage key migrations.
- Database migrations.

## Handoff Notes

- Start with `apps/extension/src/lib/api.ts`; it is the contract boundary for this phase.
- Treat `apps/extension/src/App.tsx` and `automatic-capture.ts` as consumers that should compile with stable exported API type names.
- The highest-risk mistake is replacing a local narrowed extension request input with a broad shared server request type and silently allowing unsafe event/source values.
- The second highest-risk mistake is replacing the local narrow asset response fixture with the shared asset DTO without updating tests to include the full `file` and audit fields expected by `@repo/types/capture`.
- Keep the implementation mechanical. If a behavior bug is discovered, add a failing focused test first and either fix it in this plan only if it is directly caused by contract cleanup, or document it as a follow-up.

## Final Output Required

When executing this plan, report:

- shared contracts migrated;
- local extension types intentionally kept and why;
- constants migrated or intentionally kept local;
- files changed;
- tests and browser validation run, with results;
- any deferred cleanup or carry-forward notes for `099`.
