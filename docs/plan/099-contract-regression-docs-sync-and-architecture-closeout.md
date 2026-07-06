# Contract Regression, Docs Sync, And Architecture Closeout Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `099` of the shared contracts and domainization track.

## Objective

Close the shared-contracts and domainization track after child plans `087` through `098` by verifying the final architecture, recording the final package responsibilities, documenting remaining deferred work, and proving the repo still passes the strongest practical regression suite.

This is a closeout and regression plan. It is not a new refactor, not a new domain extraction, not a UI polish pass, and not a product feature plan.

The desired end state is:

- all child plans `087` through `098` are completed or explicitly marked deferred with reasons;
- the master plan reflects the final completed state;
- `@repo/constants`, `@repo/types`, and domain package responsibilities match the implemented code;
- server, web, and extension contract consumption remain behaviorally stable;
- any documentation drift is corrected;
- any known leftover work is explicitly carried forward instead of hidden in comments.

## Implemented Baseline From 098

Plan `098` was completed and post-implementation audited on 2026-07-07.

Relevant carry-forward from `098`:

- `apps/extension/src/lib/api.ts` now imports/re-exports shared `CaptureSession`, `CaptureSessionResponse`, `CompleteCaptureSessionResponse`, `CaptureAsset`, and `CaptureAssetResponse` DTOs directly from `@repo/types/capture`.
- Extension-local `CreateCaptureSessionInput`, `UploadCaptureAssetInput`, and `CreateCaptureEventInput` remain intentionally local and narrowed.
- No extension UI, runtime, manifest, route, storage, permission, or browser-visible behavior changed.
- No specific `098` implementation leftover needs to be resolved in this plan beyond normal regression and documentation closeout.

## Current Track Baseline

All track phases in the master plan are marked completed and post-implementation audited:

```text
087 Shared Constants Foundation
088 Shared Types And API Contract Foundation
089 Domain Package Conventions And Error Mapping
090 File Domain Extraction
091 Project, Identity, Setup, And Organization Contract Cleanup
092 Capture Domain Extraction
093 Guide Domain Extraction
094 Demo Domain Extraction
095 Publish Domain Extraction
096 Server Adapter Thinning
097 Web Shared Contract Consumption
098 Extension Shared Contract Consumption
```

Current shared/domain packages in this track:

```text
packages/constants
packages/types
packages/file-domain
packages/capture-domain
packages/guide-domain
packages/demo-domain
packages/publish-domain
```

Current consumer apps in this track:

```text
apps/server
apps/web
apps/extension
```

## Relevant Docs To Read Before Execution

```text
CONTEXT.md
docs/system-design-pattern.md
docs/project-zoomout-status.md
docs/roadmap.md
docs/backend-route-inventory.md
docs/development-setup.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md
docs/adr/0008-rebuild-in-place-preserve-decision-docs.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0015-user-organization-org-user-identity-model.md
docs/adr/0016-explicit-owner-bootstrap-command.md
docs/adr/0017-deployment-aware-onboarding-mode.md
docs/adr/0018-web-first-run-setup-from-day-one.md
docs/adr/0019-separate-web-and-server-apps.md
docs/adr/0020-domain-package-conventions-and-error-mapping.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/plan/089-domain-package-conventions-and-error-mapping.md
docs/plan/090-file-domain-extraction.md
docs/plan/091-project-identity-setup-organization-contract-cleanup.md
docs/plan/092-capture-domain-extraction.md
docs/plan/093-guide-domain-extraction.md
docs/plan/094-demo-domain-extraction.md
docs/plan/095-publish-domain-extraction.md
docs/plan/096-server-adapter-thinning.md
docs/plan/097-web-shared-contract-consumption.md
docs/plan/098-extension-shared-contract-consumption.md
```

## Exact Affected Files

Primary documentation files expected to be edited during this closeout:

```text
docs/plan/099-contract-regression-docs-sync-and-architecture-closeout.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

Documentation files to inspect and update only if they are stale:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/project-zoomout-status.md
docs/roadmap.md
docs/backend-route-inventory.md
docs/development-setup.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md
docs/adr/0008-rebuild-in-place-preserve-decision-docs.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0015-user-organization-org-user-identity-model.md
docs/adr/0016-explicit-owner-bootstrap-command.md
docs/adr/0017-deployment-aware-onboarding-mode.md
docs/adr/0018-web-first-run-setup-from-day-one.md
docs/adr/0019-separate-web-and-server-apps.md
docs/adr/0020-domain-package-conventions-and-error-mapping.md
```

Child plans to inspect and update only for final closeout status or stale carry-forward notes:

```text
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/plan/089-domain-package-conventions-and-error-mapping.md
docs/plan/090-file-domain-extraction.md
docs/plan/091-project-identity-setup-organization-contract-cleanup.md
docs/plan/092-capture-domain-extraction.md
docs/plan/093-guide-domain-extraction.md
docs/plan/094-demo-domain-extraction.md
docs/plan/095-publish-domain-extraction.md
docs/plan/096-server-adapter-thinning.md
docs/plan/097-web-shared-contract-consumption.md
docs/plan/098-extension-shared-contract-consumption.md
```

Code files/packages to inspect for boundary and contract verification. Do not edit them unless a concrete regression is found and documented first:

```text
packages/constants/src/**/*
packages/types/src/**/*
packages/file-domain/src/**/*
packages/capture-domain/src/**/*
packages/guide-domain/src/**/*
packages/demo-domain/src/**/*
packages/publish-domain/src/**/*
apps/server/src/modules/**/*
apps/server/src/app.ts
apps/server/src/db/**/*
apps/web/src/lib/api.ts
apps/web/src/features/**/*
apps/extension/src/lib/api.ts
apps/extension/src/App.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/**/*
```

Files that should not be changed in this closeout unless a separate approved regression fix is opened:

```text
apps/web/src/**/*.module.css
apps/web/src/index.css
apps/web/src/App.module.css
apps/extension/src/index.css
apps/extension/public/manifest.json
apps/server/src/db/migrations/*.sql
package.json
pnpm-lock.yaml
```

## Routes And API Contracts

No route URL, HTTP method, request body, response envelope, auth/cookie behavior, public link behavior, or extension header behavior should change in this plan.

Audit the final route/API contract surface through the route modules and client API modules. The route modules listed after this inventory are authoritative; if code changes before this plan is implemented and a path below no longer matches a route module, update this plan first rather than relying on stale route notes. Current route families:

```text
Public instance:
  GET    /api/v1/public/instance

Setup/auth:
  POST   /api/v1/setup/first-run
  GET    /api/v1/authentication/me
  POST   /api/v1/authentication/login
  POST   /api/v1/authentication/logout

Organization:
  GET    /api/v1/organization/members
  GET    /api/v1/organization/invites
  POST   /api/v1/organization/invites
  DELETE /api/v1/organization/invites/:invite_id
  GET    /api/v1/public/invites/:token
  POST   /api/v1/public/invites/:token/accept

Projects:
  GET    /api/v1/projects
  POST   /api/v1/projects
  GET    /api/v1/projects/:id
  PATCH  /api/v1/projects/:id
  DELETE /api/v1/projects/:id

Capture:
  GET    /api/v1/projects/:project_id/capture-sessions
  POST   /api/v1/projects/:project_id/capture-sessions
  GET    /api/v1/projects/:project_id/capture-sessions/:id
  GET    /api/v1/projects/:project_id/capture-sessions/:id/detail
  PATCH  /api/v1/projects/:project_id/capture-sessions/:id
  DELETE /api/v1/projects/:project_id/capture-sessions/:id
  POST   /api/v1/projects/:project_id/capture-sessions/:id/complete
  POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
  POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
  GET    /api/v1/projects/:project_id/capture-assets
  GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
  GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
  GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/file
  DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
  POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
  GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
  PUT    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/order
  GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
  PATCH  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
  DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id

Guides:
  GET    /api/v1/projects/:project_id/guides
  POST   /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
  GET    /api/v1/projects/:project_id/guides/:guide_id
  PATCH  /api/v1/projects/:project_id/guides/:guide_id
  GET    /api/v1/projects/:project_id/guides/:guide_id/export/markdown
  GET    /api/v1/projects/:project_id/guides/:guide_id/export/html.zip
  PATCH  /api/v1/projects/:project_id/guides/:guide_id/steps/:guide_step_id
  POST   /api/v1/projects/:project_id/guides/:guide_id/blocks
  PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id
  PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot
  PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/annotations
  POST   /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload
  PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/reorder
  DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id

Interactive demos:
  GET    /api/v1/projects/:project_id/interactive-demos
  POST   /api/v1/projects/:project_id/interactive-demos
  POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos
  GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
  PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
  DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
  GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes
  POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes
  PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
  PUT    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/order
  DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
  POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
  GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
  PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id
  PUT    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/order
  DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id

Publish and public viewers:
  POST   /api/v1/projects/:project_id/guides/:guide_id/publish
  GET    /api/v1/projects/:project_id/guides/:guide_id/publish
  DELETE /api/v1/projects/:project_id/guides/:guide_id/publish
  PATCH  /api/v1/projects/:project_id/guides/:guide_id/publish/access
  PATCH  /api/v1/projects/:project_id/guides/:guide_id/publish/password
  POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
  GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
  DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
  PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/access
  PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/password
  GET    /api/v1/public/publish-links/:slug
  POST   /api/v1/public/publish-links/:slug/viewer-sessions
  GET    /api/v1/public/publish-links/:slug/assets/:capture_asset_id/file
```

Route audit source files:

```text
apps/server/src/modules/public-instance/public-instance.routes.ts
apps/server/src/modules/setup/first-run-setup.routes.ts
apps/server/src/modules/authentication/session.routes.ts
apps/server/src/modules/organization/organization-invites.routes.ts
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
apps/server/src/modules/publish/publish.routes.ts
apps/web/src/lib/api.ts
apps/extension/src/lib/api.ts
```

## Schemas And Types

Audit ownership, not new schema design.

Shared schema/type packages that must remain public contract focused:

```text
packages/types/src/common.ts
packages/types/src/instance.ts
packages/types/src/setup.ts
packages/types/src/auth.ts
packages/types/src/organization.ts
packages/types/src/project.ts
packages/types/src/capture.ts
packages/types/src/guide.ts
packages/types/src/demo.ts
packages/types/src/publish.ts
```

Shared constants that must remain stable product/API vocabulary:

```text
packages/constants/src/setup.ts
packages/constants/src/organization.ts
packages/constants/src/project.ts
packages/constants/src/file.ts
packages/constants/src/capture.ts
packages/constants/src/guide.ts
packages/constants/src/demo.ts
packages/constants/src/publish.ts
```

Domain packages to verify as framework-agnostic product behavior:

```text
packages/file-domain/src/**/*
packages/capture-domain/src/**/*
packages/guide-domain/src/**/*
packages/demo-domain/src/**/*
packages/publish-domain/src/**/*
```

Type/schema rules:

- Shared Zod schemas remain the source of truth for shared API DTOs.
- Shared package exports must pass the reuse gate from the master plan.
- Server-only DB row types, Fastify types, repository SQL result shapes, storage adapters, cookies, and auth token internals remain out of `@repo/types`.
- React props, browser runtime message shapes, extension settings, upload `File`/`Blob` input types, and public-viewer defensive parsers remain app-local.
- Domain command/query inputs may remain domain-local when they differ from HTTP requests.
- Shared constants may expose arrays/unions for product values; do not require singular literal constants unless a future child plan proves a need.

## Behavior Rules To Preserve

- Existing API route URLs and methods remain stable.
- Existing response envelopes remain stable.
- Existing persisted enum/string values remain stable.
- First-run setup remains deployment-aware.
- Owner bootstrap continues to create the first User, Organization, and owner Org User safely.
- Web first-run setup remains a web flow; hosted signup remains out of this track.
- Web and server remain separate apps.
- Organization-owned records continue to audit by Org User where implemented.
- Capture source records remain immutable.
- Screenshot capture remains the MVP path; HTML replay remains deferred.
- Privacy-preserving capture defaults remain intact.
- Guide generation remains deterministic; AI remains deferred.
- Interactive demos remain scene/hotspot/transition based.
- Publish links resolve to immutable snapshots.
- Public viewer behavior must not change.
- Extension instance-first login and extension session token handling must not change.
- No visual UI changes should be introduced by this closeout.

## Security And Permission Rules

- Do not loosen auth, session, cookie, CORS, public-link, password, invite-token, or publish access behavior.
- Do not expose password hashes, token hashes, session token generation details, request auth context, or server-only infrastructure through shared packages.
- Do not move DB table/schema names into shared constants unless a future plan proves cross-package need.
- Do not add extension permissions or modify `apps/extension/public/manifest.json`.
- Do not weaken extension sensitive-field filtering or redaction behavior.
- Do not add raw input capture, DOM capture, cookie capture, localStorage capture, network capture, or HTML replay.
- Do not add public signup or hosted onboarding behavior in this closeout.
- Do not add new AI behavior.
- Keep public publish password/access checks covered by existing server/domain tests.

## Migration And Backwards Compatibility

- No database migration is expected.
- No API migration is expected.
- No route rename is expected.
- No package dependency migration is expected.
- No browser storage migration is expected.
- No extension manifest migration is expected.
- No public URL migration is expected.
- No persisted enum/string value migration is expected.
- If a closeout audit finds stale docs only, fix docs only.
- If a closeout audit finds a code regression, stop and document the owning child plan before changing behavior. Keep any fix minimal, tested, and scoped to that owning phase.

## Execution Plan

1. Confirm clean baseline.
   - Run `rtk git status --short`.
   - Inspect recent commits for `087` through `098` closeout status if needed.
   - Do not proceed over unrelated user/agent changes without accounting for them.

2. Audit child plan completion.
   - Confirm `docs/plan/087...098` have completed or audited statuses.
   - Confirm each child plan has implementation log, verification notes, browser-validation note where relevant, and leftovers/carry-forward notes.
   - Record unresolved leftovers in this plan instead of silently ignoring them.

3. Audit package boundaries.
   - Verify shared packages and domain packages do not import from `apps/*`.
   - Verify app code imports shared/domain packages in the intended direction.
   - Verify domain packages do not import Fastify, browser APIs, React, or app code unless the import is in an expected test/tooling file and documented.
   - Verify no accidental `@repo/interactive-demo-domain` naming exists; the package name should remain `@repo/demo-domain`.

4. Audit shared exports and reuse gate.
   - Review `packages/constants/src/index.ts` and domain constant files.
   - Review `packages/types/src/index.ts` and schema files.
   - Confirm exported constants/types are used by active apps/packages or define public API boundaries.
   - Document any intentionally exported-but-low-use value rather than deleting it in this closeout.

5. Audit server adapter direction.
   - Inspect route modules for shared schema usage and HTTP/domain error mapping.
   - Inspect services for expected domain package usage in file, capture, guide, demo, and publish flows.
   - Confirm SQL/repositories/storage remain server-owned.
   - Confirm no route URLs or response envelopes changed during the track.

6. Audit web and extension contract consumption.
   - Confirm `apps/web/src/lib/api.ts` consumes shared DTOs directly where expected after `097`.
   - Confirm browser-only web upload inputs and public snapshot parsing remain local.
   - Confirm `apps/extension/src/lib/api.ts` consumes shared capture response DTOs after `098`.
   - Confirm extension request inputs/runtime message/settings/screenshot types remain local.
   - Confirm no UI/CSS/manifest changes are needed.

7. Run verification.
   - Run focused package/app checks first if closeout changes any specific doc/code area.
   - Run the full verification suite listed below.
   - For DB-backed tests, first inspect `apps/server/src/db/README.md`, `docs/development-setup.md`, and environment configuration. Record setup/reset commands used or blockers.

8. Sync documentation.
   - Update this `099` plan with completion status, checklist, implementation log, verification results, browser validation results or rationale, and leftovers.
   - Update the master plan only for completed closeout items.
   - Update durable docs only when actual implementation differs from current docs.
   - Create ADRs only for hard-to-reverse, surprising decisions with real trade-offs.

9. Commit docs and any approved fixes in small logical commits.
   - Prefer a docs-only commit for closeout notes.
   - If a code regression fix is required, commit it separately with focused tests and a clear message.

## Boundary Audit Commands

Use these as starting points and adapt based on findings:

```text
rtk rg "@repo/" apps packages
rtk rg "from ['\"]apps/|from ['\"]\\.\\./\\.\\./\\.\\./apps" packages
rtk rg "fastify|Fastify|@fastify|react|React|window|document|chrome\\." packages
rtk rg "interactive-demo-domain|@repo/interactive-demo-domain" .
rtk rg "TODO|FIXME|deferred|follow-up|carry-forward|Leftovers" docs/plan packages apps
rtk rg "Status:" docs/plan/087-shared-constants-foundation.md docs/plan/088-shared-types-contract-foundation.md docs/plan/089-domain-package-conventions-and-error-mapping.md docs/plan/090-file-domain-extraction.md docs/plan/091-project-identity-setup-organization-contract-cleanup.md docs/plan/092-capture-domain-extraction.md docs/plan/093-guide-domain-extraction.md docs/plan/094-demo-domain-extraction.md docs/plan/095-publish-domain-extraction.md docs/plan/096-server-adapter-thinning.md docs/plan/097-web-shared-contract-consumption.md docs/plan/098-extension-shared-contract-consumption.md
```

Expected caveats:

- `packages/ui` intentionally imports React.
- App tests and UI packages intentionally mention browser APIs.
- Domain package test files may import shared package types/constants.
- `apps/server` intentionally imports Fastify and DB/storage infrastructure.

## Test And Verification Plan

Run the strongest practical verification. Record every command, result, and any blocker.

Shared packages:

```text
rtk pnpm --filter @repo/constants lint
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/constants build
rtk pnpm --filter @repo/types lint
rtk pnpm --filter @repo/types test
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter @repo/types build
```

Domain packages:

```text
rtk pnpm --filter @repo/file-domain lint
rtk pnpm --filter @repo/file-domain test
rtk pnpm --filter @repo/file-domain check-types
rtk pnpm --filter @repo/file-domain build
rtk pnpm --filter @repo/capture-domain lint
rtk pnpm --filter @repo/capture-domain test
rtk pnpm --filter @repo/capture-domain check-types
rtk pnpm --filter @repo/capture-domain build
rtk pnpm --filter @repo/guide-domain lint
rtk pnpm --filter @repo/guide-domain test
rtk pnpm --filter @repo/guide-domain check-types
rtk pnpm --filter @repo/guide-domain build
rtk pnpm --filter @repo/demo-domain lint
rtk pnpm --filter @repo/demo-domain test
rtk pnpm --filter @repo/demo-domain check-types
rtk pnpm --filter @repo/demo-domain build
rtk pnpm --filter @repo/publish-domain lint
rtk pnpm --filter @repo/publish-domain test
rtk pnpm --filter @repo/publish-domain check-types
rtk pnpm --filter @repo/publish-domain build
```

Server:

```text
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter server test
rtk pnpm --filter server build
```

DB-backed server checks, only after database setup/reset is confirmed and recorded:

```text
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

Web:

```text
rtk pnpm --filter web check-types
rtk pnpm --filter web lint
rtk pnpm --filter web test
rtk pnpm --filter web build
```

Extension:

```text
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension test
rtk pnpm --filter extension build
```

Docs app, if closeout updates durable docs or workspace build requires it:

```text
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
rtk pnpm --filter docs test
rtk pnpm --filter docs build
```

Workspace:

```text
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

Known command notes:

- The root package has no `test` script; do not run `rtk pnpm test` unless a script is added in a future plan.
- `@repo/constants` currently has `lint`, `test`, and `build`, but no `check-types` script.
- `packages/ui` has `lint`, `check-types`, and `test`, but no `build` script.
- `turbo run build` only runs packages/apps with a `build` script.

## Agent-Browser Validation Requirements

This closeout should not change frontend/browser runtime behavior. Browser validation is not required for docs-only closeout changes.

If execution changes any web UI, extension UI, content script, background script, browser capture code, public viewer runtime, or route/navigation behavior, stop and either:

- reopen the owning child plan with explicit browser validation requirements; or
- update this plan before implementing the change.

If browser validation becomes necessary, use agent-browser and validate only the affected behavior:

- Web API contract/UI option-list changes: start the web dev server and validate the affected route with mocked or seeded API responses.
- Public guide/demo viewer changes: validate public viewer routes and snapshot rendering with representative published artifacts.
- Extension popup UI changes: validate the extension Vite page or available extension harness for configured/signed-out/signed-in/active-capture states.
- Extension runtime/content script changes: prefer a loaded-extension browser harness; if unavailable, document the limitation and rely on focused unit tests plus typecheck.

Do not claim full browser coverage unless the exact browser surface was actually exercised.

## Documentation Sync Rules

Update docs only when the implementation proves they are stale.

Required closeout updates:

- `docs/plan/099-contract-regression-docs-sync-and-architecture-closeout.md`: completion status, checklist, verification log, browser validation note, leftovers.
- `docs/plan/master/003-shared-contracts-domainization-master-plan.md`: mark `099` complete after verification and record final definition-of-done evidence.

Conditional updates:

- `CONTEXT.md`: only if final implemented product language differs from current terms.
- `docs/system-design-pattern.md`: if final package responsibilities differ from the current system design.
- `docs/project-zoomout-status.md`: if it tracks architecture status and is stale after this closeout.
- `docs/roadmap.md`: if deferred work should be made visible as roadmap work.
- `docs/backend-route-inventory.md`: if route inventory no longer matches server routes.
- ADRs: only if a new hard-to-reverse, surprising decision with real trade-offs was made.
- Child plans `087` through `098`: only if a closeout audit finds stale status, missing verification notes, or incorrect leftovers.

Do not rewrite docs stylistically. Keep changes factual and traceable to implementation.

## Explicit Non-Scope

- New product features.
- New domain packages.
- Broad refactors.
- UI redesign or visual styling changes.
- Public viewer behavior changes.
- Route URL churn.
- Database schema changes.
- New migrations.
- Extension manifest or permission changes.
- HTML replay implementation.
- AI behavior.
- Storage provider replacement.
- Public signup implementation.
- Moving DB identifiers into shared constants.
- Adding app dependencies on domain packages outside the established architecture.
- Deleting shared exports solely because they are low-use without first proving they are wrong or harmful.

## Acceptance Criteria

- Child plans `087` through `098` have completed/audited or explicitly deferred statuses.
- The master plan is marked complete for `099` only after verification passes or blockers are documented.
- Shared constants/types exports are documented as intentional and aligned with the reuse gate.
- Domain packages remain framework-agnostic product behavior packages.
- Server modules remain HTTP/auth/persistence/storage adapters around shared/domain logic.
- Web and extension consume shared contracts/constants where appropriate.
- Browser-only/client-only types remain local.
- No UI, route, persistence, public viewer, extension permission, privacy, or auth behavior changes are introduced by closeout.
- Verification commands and results are recorded.
- Browser validation is either not required with rationale, or completed and documented for any affected browser behavior.
- Deferred work is explicit and assigned to future work instead of hidden.

## Handoff Notes

- Treat this plan as an audit checklist and regression harness, not a mandate to refactor.
- If a child plan has stale wording but the code is correct, prefer a doc correction.
- If code is wrong, identify the owning child plan and keep the fix small, tested, and separately committed.
- Do not spend this closeout expanding shared packages just to improve symmetry.
- Use the master plan’s reuse gate when evaluating constants/types.
- Prefer exact command output summaries in the implementation log over vague “tests passed” language.
- Preserve a clean final worktree.

## Final Output Required

When executing this plan, report:

- docs updated;
- audits performed;
- route/API contract changes, if any;
- schema/type/shared export findings;
- security/permission/migration findings;
- tests and verification commands run with results;
- browser validation run or why it was not required;
- deferred work carried forward;
- commits made.
