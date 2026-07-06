# Server Adapter Thinning Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Completed and post-implementation audited on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `096` of the shared contracts and domainization track.

## Objective

Thin `apps/server` now that the shared constants, shared API contracts, and domain packages from plans `087` through `095` exist.

The goal is not to rewrite the server. The goal is to remove remaining compatibility glue and duplicated product decisions where prior phases already created stable shared homes, while preserving every route URL, method, status code, response envelope, error `type`, auth/session behavior, SQL query, transaction boundary, storage adapter behavior, cookie behavior, public viewer behavior, and UI behavior.

After this phase, server modules should read as adapters:

- Fastify routes parse transport inputs, build auth context, call services, and map known errors to HTTP responses.
- Services orchestrate repository/storage/auth transactions and call domain policies for product decisions.
- Repositories keep SQL, row mapping, unique-constraint mapping, transaction implementation, and database-specific behavior.
- Domain packages keep pure product validation, ordering, lifecycle, snapshot, access, password, and generation rules.
- `@repo/types` keeps shared request/response schemas where there is an active cross-package consumer or a documented public API contract reason.

## Completion Summary

Completed on 2026-07-07. Post-implementation audit completed on 2026-07-07.

Implemented changes:

- Added `apps/server/src/modules/shared/http-errors.ts` as a server-only helper for the standard unauthenticated and typed error response envelopes.
- Added `apps/server/src/modules/shared/http-errors.test.ts` to lock the shared helper output against the existing route response shape.
- Replaced duplicated `unauthorized_response` and `error_response` builders in project, organization invites, capture session, capture event, capture asset, guide, interactive demo, and publish routes.
- Left `apps/server/src/modules/authentication/session.routes.ts` local because it has authentication-specific `unauthenticated` and `invalid_credentials` response construction.
- Updated publish routes/tests to import publish policy errors directly from `@repo/publish-domain`.
- Updated publish routes/tests/app integration fixtures to use shared `@repo/types/publish` DTOs directly instead of server service compatibility aliases.
- Removed publish-domain error re-exports and the `GuidePublishResult`, `InteractiveDemoPublishResult`, `RevokedGuidePublishResult`, and `RevokedInteractiveDemoPublishResult` compatibility aliases from `apps/server/src/modules/publish/publish.service.ts`.
- Kept server-owned publish errors, repository interfaces, hashing/token/cookie behavior, storage reads, SQL, transaction boundaries, and route error-to-HTTP mapping server-owned.

No route URL, method, route registration prefix, route parameter name, Fastify schema metadata, response envelope, status code, error `type`, SQL query, row mapping, transaction boundary, migration, cookie behavior, password/token hashing behavior, public URL, public viewer behavior, JSX, CSS, rendered text, web fetch path, or browser-visible behavior changed.

Actual affected implementation files:

```text
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
apps/server/src/modules/organization/organization-invites.routes.ts
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/publish/publish.app.integration.test.ts
apps/server/src/modules/publish/publish.routes.test.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/publish/publish.service.test.ts
apps/server/src/modules/publish/publish.service.ts
apps/server/src/modules/shared/http-errors.test.ts
apps/server/src/modules/shared/http-errors.ts
```

Actual affected documentation files:

```text
docs/plan/096-server-adapter-thinning.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

Verification passed:

- `rtk pnpm --filter server test -- http-errors`
- `rtk pnpm --filter server test -- publish.routes publish.service publish.app http-errors`
- `rtk pnpm --filter server test -- project.routes organization-invites.routes capture-session.routes capture-event.routes capture-asset.routes guide.routes interactive-demo.routes`
- `rtk pnpm --filter server check-types`
- `rtk pnpm --filter server test`
- `rtk pnpm check-types`
- `rtk pnpm --filter server lint`
- `rtk git diff --check`

Post-implementation audit findings:

- No behavior, API, schema, UI, security, permission, migration, or backwards-compatibility mismatch was found in the implemented code.
- No unrelated implementation files were included; the implementation touched only server route adapters, publish service/test type imports, the server-only shared error helper, and the plan docs.
- The old server publish aliases `GuidePublishResult`, `InteractiveDemoPublishResult`, `RevokedGuidePublishResult`, and `RevokedInteractiveDemoPublishResult` no longer have server consumers.
- The only remaining local `unauthorized_response` helper is intentionally kept in `apps/server/src/modules/authentication/session.routes.ts` because that route constructs both `unauthenticated` and `invalid_credentials` responses.

Browser validation was not required because this phase was backend adapter cleanup only and did not change JSX, CSS, rendered copy, route paths used by the browser, fetch paths, form behavior, public viewer parsing behavior, or published link behavior.

Database verification was not required because this phase did not change repositories, SQL, migrations, row mapping, transaction boundaries, persisted values, persisted snapshot JSON shape, cookie/session tables, or storage access SQL.

Leftovers for later phases:

- Some service modules still intentionally expose server-owned not-found/storage/integration errors and DTOs used by route dependency interfaces.
- Route-local multipart parsers in capture asset and guide routes remain server-owned because they handle file streams, multipart metadata JSON, timestamp parsing, and upload validation.
- `apps/web/src/features/guide/types.ts` guide-named publish compatibility aliases remain for plan `097` or later web contract cleanup.

Carry into `097-web-shared-contract-consumption.md`:

- Web should consume shared publish DTOs directly where practical, but it should preserve the guide UI compatibility aliases until each import site is migrated safely.
- No server route, fetch path, or browser-visible behavior changed in `096`; `097` should not assume any API behavior shift from this phase.

## Dependencies And Implemented Baseline

This plan must start after these child plans have landed and been audited:

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
```

Implemented baseline as of 2026-07-07:

- `@repo/constants` owns shared enum values for setup, organization, project, file, capture, guide, demo, and publish.
- `@repo/types` owns shared route contracts for auth, setup, instance, organization, project, capture, guide, demo, and publish.
- `@repo/file-domain` owns storage-key and file-policy helpers.
- `@repo/capture-domain` owns capture session/event/asset policies and domain errors.
- `@repo/guide-domain` owns guide generation, guide update, guide block, export naming/rendering policy, and guide domain errors.
- `@repo/demo-domain` owns interactive demo generation, input, scene, hotspot, coordinate, order, and target-scene policies.
- `@repo/publish-domain` owns publish snapshot, access, password, viewer-session, slug retry-limit, and publish-link helper policies.
- Plan `095` post-implementation audit fixed shared publish contracts so publish actions return non-null `PublishResult`, and revoke responses preserve the full `PublishLink`.

## Current Codebase Baseline

The server already imports the new domain packages in the core workflow modules:

```text
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/interactive-demo/interactive-demo.service.ts
apps/server/src/modules/publish/publish.service.ts
```

The server already imports shared schemas in the main route modules:

```text
apps/server/src/modules/authentication/session.routes.ts
apps/server/src/modules/setup/first-run-setup.routes.ts
apps/server/src/modules/public-instance/public-instance.routes.ts
apps/server/src/modules/organization/organization-invites.routes.ts
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
apps/server/src/modules/publish/publish.routes.ts
```

Pre-implementation adapter-thinning opportunities that drove this phase:

- Service modules still re-exported many domain errors and shared DTO types for route/test compatibility.
- Several routes imported domain errors through service modules instead of directly from domain packages.
- Route modules each defined local `unauthorized_response`, `error_response`, auth-context builders, and large `handle_domain_error` functions.
- Capture asset and guide multipart upload routes still need route-local JSON/form parsing because multipart parsing is transport-specific.
- Publish route parsing already uses shared publish schemas and must keep the stricter non-null publish result/revoke result contracts from the `095` audit.
- Repositories still own SQL, row mapping, transaction helpers, and DB conflict mapping; this is intentional and should remain server-owned.

## Relevant Docs To Read Before Coding

```text
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/095-publish-domain-extraction.md
docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0019-separate-web-and-server-apps.md
```

## Exact Affected Files

Primary implementation files:

```text
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/interactive-demo/interactive-demo.service.ts
apps/server/src/modules/publish/publish.service.ts
```

Create only if it removes real duplication and keeps tests clearer:

```text
apps/server/src/modules/shared/http-errors.ts
apps/server/src/modules/shared/auth-context.ts
apps/server/src/modules/shared/route-parse.ts
apps/server/src/modules/shared/route-errors.test.ts
```

The exact shared helper file names can change during implementation if the existing server style suggests better names, but helper ownership must stay under `apps/server/src/modules/shared/` or an equivalent server-only location. Do not put HTTP helpers into domain packages.

Likely test files to update:

```text
apps/server/src/modules/capture-session/capture-session.routes.test.ts
apps/server/src/modules/capture-event/capture-event.routes.test.ts
apps/server/src/modules/capture-asset/capture-asset.routes.test.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.test.ts
apps/server/src/modules/publish/publish.routes.test.ts
apps/server/src/modules/capture-session/capture-session.service.test.ts
apps/server/src/modules/capture-event/capture-event.service.test.ts
apps/server/src/modules/capture-asset/capture-asset.service.test.ts
apps/server/src/modules/guide/guide.service.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.service.test.ts
apps/server/src/modules/publish/publish.service.test.ts
```

Plan status files to update after implementation:

```text
docs/plan/096-server-adapter-thinning.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

Do not modify unless implementation finds a real compatibility need:

```text
packages/constants/src/**/*
packages/types/src/**/*
packages/file-domain/src/**/*
packages/capture-domain/src/**/*
packages/guide-domain/src/**/*
packages/demo-domain/src/**/*
packages/publish-domain/src/**/*
apps/server/src/db/migrations/**/*
apps/server/src/app.ts
apps/server/src/modules/*/*.repository.ts
apps/web/**/*
apps/extension/**/*
```

If implementation discovers a missing domain policy or shared schema, stop and update this plan first or split that work into a smaller child follow-up. This phase should mostly consume existing packages, not expand product behavior.

## Routes And API Contracts

All existing routes must remain stable:

```text
POST   /api/v1/setup/first-run
GET    /api/v1/public/instance
GET    /api/v1/authentication/me
POST   /api/v1/authentication/login
POST   /api/v1/authentication/logout
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id
GET    /api/v1/organization/members
GET    /api/v1/organization/invites
POST   /api/v1/organization/invites
DELETE /api/v1/organization/invites/:invite_id
GET    /api/v1/public/invites/:token
POST   /api/v1/public/invites/:token/accept
GET    /api/v1/projects/:project_id/capture-sessions
POST   /api/v1/projects/:project_id/capture-sessions
GET    /api/v1/projects/:project_id/capture-sessions/:id
GET    /api/v1/projects/:project_id/capture-sessions/:id/detail
PATCH  /api/v1/projects/:project_id/capture-sessions/:id
POST   /api/v1/projects/:project_id/capture-sessions/:id/complete
DELETE /api/v1/projects/:project_id/capture-sessions/:id
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
PUT    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/order
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
PATCH  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/file
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
GET    /api/v1/projects/:project_id/capture-assets
GET    /api/v1/projects/:project_id/guides
POST   /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
GET    /api/v1/projects/:project_id/guides/:guide_id
PATCH  /api/v1/projects/:project_id/guides/:guide_id
GET    /api/v1/projects/:project_id/guides/:guide_id/export/markdown
GET    /api/v1/projects/:project_id/guides/:guide_id/export/html.zip
PATCH  /api/v1/projects/:project_id/guides/:guide_id/steps/:guide_step_id
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/reorder
POST   /api/v1/projects/:project_id/guides/:guide_id/blocks
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot
POST   /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/annotations
DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id
GET    /api/v1/projects/:project_id/interactive-demos
POST   /api/v1/projects/:project_id/interactive-demos
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos
GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes
POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes
PUT    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/order
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
GET    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
POST   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
PUT    /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/order
PATCH  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id
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

The route strings above intentionally mirror the current Fastify route parameter names where those names are present in code. Do not rename route parameters, route registration prefixes in `apps/server/src/app.ts`, or Fastify schema metadata as part of this phase.

API response envelopes must not change. Examples that must remain intact:

- Auth failures: `{ error: { type: "unauthenticated", message: "Authentication is required" } }`
- Domain failures: same `error.type`, `message`, and status code as current route tests.
- Publish status responses: `{ publish_link: PublishLink | null, published_artifact: PublishedArtifact | null }`
- Publish action responses: `{ publish_link: PublishLink, published_artifact: PublishedArtifact }`
- Revoke responses: `{ publish_link: PublishLink }`
- Public publish responses: `{ publish_link: PublicPublishLink, published_artifact: PublicPublishedArtifact }`, with route-local stripping of password internals preserved.

## Schemas And Types

Use existing shared schemas and types from:

```text
@repo/types/auth
@repo/types/setup
@repo/types/instance
@repo/types/organization
@repo/types/project
@repo/types/capture
@repo/types/guide
@repo/types/demo
@repo/types/publish
```

Rules:

- Do not create new schemas in `@repo/types` in this phase unless a route already has a duplicated schema that is consumed by server plus web/extension or is documented as a public API contract.
- Do not weaken schemas to make route code easier. Preserve the current parse/validation semantics exactly.
- Keep multipart upload parsing server-route-owned. Shared JSON request schemas cannot fully model file stream handling.
- Keep the `095` publish contract correction: `GuidePublishResult` and `InteractiveDemoPublishResult` must remain `PublishResult`, not nullable `PublishStatusResponse`; `RevokePublishResult` must include a full `PublishLink`.
- Prefer importing DTO types directly from `@repo/types/*` in routes/services/tests when this removes service-level compatibility aliases.
- Prefer importing domain errors directly from `@repo/*-domain` in routes/tests when this removes service-level compatibility re-exports and does not create a cycle.

## Behavior Rules

Preserve these behavior rules exactly:

- Project and organization scoping remains enforced through auth context and repository queries.
- Route handlers still obtain auth through `auth_service.get_current_auth_context`.
- `session_token_from_request`, web session cookies, and public viewer cookies remain server-owned.
- Capture session lifecycle validation stays in `@repo/capture-domain`; project existence checks and repository calls stay in server services.
- Capture event order validation stays in `@repo/capture-domain`; index conflict handling stays repository/server-owned.
- Capture asset upload storage-key validation and file policy stay in `@repo/file-domain`/`@repo/capture-domain`; multipart stream handling and storage provider calls stay server-owned.
- Guide generation, guide block order, screenshot-selection, annotation, export naming, and markdown/html rendering policy stay in `@repo/guide-domain`; file reads and zip streaming stay server-owned.
- Demo generation, scene/hotspot order, coordinates, and target-scene validation stay in `@repo/demo-domain`; repository and trigger behavior stay server-owned.
- Publish snapshots, access, password, viewer-session expiry, and slug retry-limit policy stay in `@repo/publish-domain`; random token generation, hashing, SQL transactions, public viewer cookies, and storage reads stay server-owned.
- Public viewers must never read guide or demo draft rows directly; they resolve only immutable published artifact snapshots.

## Security And Permission Rules

Do not change:

- session cookie names, attributes, clearing behavior, or authentication error status;
- public viewer cookie name or options;
- password hashing, salt generation, timing-safe comparison, viewer token generation, or viewer token hashing;
- organization/project scoping for all repository calls;
- public publish access decisions for private, expired, password-protected, revoked, or missing links;
- invite token hashing and invite accept permission behavior;
- upload content-type, file-size, storage-key, and safe path behavior;
- route-level auth requirements for every private endpoint.

If a helper is extracted for error mapping, it must preserve the same status codes and error strings for every mapped error class.

## Migration And Backwards Compatibility

No database migration is expected or allowed in this phase.

Backwards compatibility requirements:

- Keep all SQL and row mapping behavior stable.
- Keep repository interfaces functionally equivalent. Type names may be imported from shared packages, but method names and input/output shapes should not change unless all callers and tests remain behavior-compatible.
- Keep public URL shapes stable:
  - Guides: `/p/:slug`
  - Interactive Demos: `/d/:slug`
- Keep persisted publish snapshot JSON shape stable.
- Keep response compatibility aliases only while needed by server routes/tests or web imports. Removing aliases is allowed only when `rg` proves no consumers remain.
- Do not remove guide-named publish compatibility aliases in `apps/web/src/features/guide/types.ts`; that is carried separately and is outside this server-only phase.

## Implementation Plan

### Step 1: Baseline Audit And Characterization

Before editing code:

1. Run `rtk git status --short` and identify uncommitted user/agent changes.
2. Reread this plan, plan `095`, and the master plan.
3. Run targeted searches:

```text
rtk rg -n "export \\{|export type|export class|from \"@repo/|unauthorized_response|error_response|handle_domain_error|safeParse|JSON\\.parse|z\\.string\\(\\)\\.datetime|PublishStatus|RevokedGuidePublishResult|RevokedInteractiveDemoPublishResult" apps/server/src/modules
rtk rg -n "GuidePublishResult|InteractiveDemoPublishResult|RevokePublishResult|RevokedGuidePublishResult|RevokedInteractiveDemoPublishResult|PublishStatus" apps/server/src packages/types/src packages/publish-domain/src
```

4. Record the chosen implementation slices in this plan before code changes if the final slice list differs from the plan below.
5. Run focused baseline tests for the first touched module if there is any doubt about existing behavior.

### Step 2: Add Server-Only HTTP Error Mapping Helper If Worth It

Create `apps/server/src/modules/shared/http-errors.ts` only if it reduces duplicated route mapping without hiding module-specific behavior.

Allowed helper responsibilities:

- `unauthorized_response()`
- `error_response(type, message)`
- small typed mapping tables or `map_known_error(error)` utilities
- preserving exact route error status/message/type triples

Disallowed helper responsibilities:

- importing Fastify routes from domain packages;
- moving domain error classes into server shared code;
- changing response envelopes;
- converting every route to a generic framework if it obscures module-specific behavior.

Tests:

- Add `apps/server/src/modules/shared/route-errors.test.ts` only if the helper contains logic beyond trivial object construction.
- Existing route tests remain the source of truth for full behavior.

### Step 3: Remove Service-Level Compatibility Re-Exports Where Safe

For each service module, inspect exports and imports.

Candidate files:

```text
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-event/capture-event.service.ts
apps/server/src/modules/capture-asset/capture-asset.service.ts
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/interactive-demo/interactive-demo.service.ts
apps/server/src/modules/publish/publish.service.ts
```

Safe changes:

- Routes/tests import domain errors directly from `@repo/capture-domain`, `@repo/guide-domain`, `@repo/demo-domain`, or `@repo/publish-domain` instead of through service re-exports.
- Routes/tests import shared DTO types directly from `@repo/types/*` instead of through service aliases where the same type already exists.
- Keep server-owned errors in service modules:
  - `ProjectNotFoundError` where still module-local and not provided by a domain package.
  - resource not-found errors that are adapter/repository lookup failures if no domain package owns them.
  - storage/provider errors that depend on server adapters.

Do not remove an export until:

```text
rtk rg -n "<ExportName>" apps/server apps/web packages
```

shows no remaining consumer beyond the declaration itself.

Publish-specific cleanup:

- Consider replacing `RevokedGuidePublishResult` and `RevokedInteractiveDemoPublishResult` with `RevokePublishResult` from `@repo/types/publish` if all server route/test imports can be updated safely.
- Keep `GuidePublishResult` and `InteractiveDemoPublishResult` as non-null `PublishResult` if compatibility aliases remain.
- Keep `PublicPublishResult` server-owned if it includes internal `publish_link_id` and `password` fields returned by the repository for server-only access checks. Route-level public responses must continue stripping those internal fields.

### Step 4: Consolidate Route Parse Helpers Only Where Shared Schemas Already Exist

Candidate files:

```text
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
apps/server/src/modules/publish/publish.routes.ts
```

Allowed:

- Replace local pick/parse helpers with tiny server-only helpers when they simply select fields already represented by `@repo/types` schemas.
- Keep route-specific body parse wrappers that map Zod failures to the existing domain/server error class.
- Keep custom date semantic checks when current behavior requires JavaScript `Date` finite-time validation after schema parsing.

Must stay route-local:

- Multipart upload parsing in capture asset and guide screenshot upload routes.
- JSON parsing of multipart metadata.
- `z.string().datetime()` checks for uploaded file metadata timestamps.
- file presence and upload stream checks.
- response streaming headers for assets and exports.

Publish parsing requirements:

- `apps/server/src/modules/publish/publish.routes.ts` already parses:
  - `UpdatePublishAccessRequestSchema`
  - `UpdatePublishPasswordRequestSchema`
  - `CreatePublicViewerSessionRequestSchema`
- Preserve the current error mapping:
  - invalid access body -> `InvalidPublishAccessSettingsError` -> `400 invalid_publish_access_settings`
  - invalid publish password body -> `InvalidPublishPasswordSettingsError` -> `400 invalid_publish_password_settings`
  - invalid public viewer password body -> `InvalidPublicViewerPasswordError` -> `400 invalid_public_viewer_password`

### Step 5: Thin Route Error Handlers In Small Slices

Do this module by module. Recommended order:

1. `publish` because 095 just audited it and its error mapping is well characterized.
2. `interactive-demo` because it already imports domain errors from `@repo/demo-domain`.
3. `guide` because it has more endpoints and upload/export behavior.
4. `capture-session` and `capture-event`.
5. `capture-asset`, only after upload tests are green.
6. `project`, `organization`, `setup`, `auth`, and `public-instance` only if there is obvious duplicated adapter glue to remove.

For each module:

- Keep route dependency interfaces stable unless a type-only import cleanup is required.
- Keep `require_auth` behavior stable.
- Keep module-specific response shaping local when it is clearer than a generic helper.
- Update route tests if imports move, but do not rewrite test behavior wholesale.

### Step 6: Keep Repository Boundaries Explicit

Repository files should generally be left untouched:

```text
apps/server/src/modules/*/*.repository.ts
```

Allowed repository changes:

- type-only import cleanup from `@repo/types/*` or `@repo/constants` if service aliases are removed and typecheck requires it;
- no-op naming cleanup only if directly required by route/service thinning.

Disallowed repository changes:

- SQL rewrites;
- transaction boundary changes;
- DB constraint behavior changes;
- row mapping changes;
- migrations;
- public URL shape changes;
- snapshot persistence shape changes.

### Step 7: Update Documentation And Status

After implementation:

- Update this plan with status, checklist, implementation log, verification notes, and leftovers.
- Update the master plan only for completed 096 phase items.
- Carry remaining server adapter cleanup into `097` or a later server cleanup plan only if it is outside the backend-only scope here.

## Test And Verification Plan

Run focused tests for every touched module. Minimum expected commands if publish, guide, demo, and capture route/service imports are touched:

```text
rtk pnpm --filter server test -- publish.routes publish.service
rtk pnpm --filter server test -- interactive-demo.routes interactive-demo.service
rtk pnpm --filter server test -- guide.routes guide.service
rtk pnpm --filter server test -- capture-session.routes capture-session.service capture-event.routes capture-event.service capture-asset.routes capture-asset.service
rtk pnpm --filter server check-types
rtk pnpm check-types
rtk git diff --check
```

If shared helpers are added:

```text
rtk pnpm --filter server test -- route-errors
```

If any repository file is touched, also run the relevant integration/DB tests and document database setup requirements before running:

```text
rtk pnpm --filter server test:db
```

Before closing the phase, run the broader server suite unless there is a documented environment blocker:

```text
rtk pnpm --filter server test
```

Optional but preferred if time allows:

```text
rtk pnpm --filter server lint
rtk pnpm lint
rtk pnpm build
```

Browser validation:

- Not expected for this phase because the scope is backend adapter thinning only.
- If implementation changes any JSX, CSS, rendered text, route path used by the browser, fetch path, browser-visible form behavior, public viewer parsing behavior, or published link behavior, stop and update this plan before continuing.
- If such frontend/browser behavior is intentionally added after plan update, use agent-browser to validate the affected web flows before close-out.

## Completion Checklist

- [x] Audited current imports/exports and uncommitted work before editing.
- [x] Chose small module slices and kept changes scoped.
- [x] Removed only compatibility exports with no remaining consumers.
- [x] Preserved route URLs, methods, response envelopes, status codes, and error `type` strings.
- [x] Preserved auth/session, cookie, password, token, public viewer, and upload security behavior.
- [x] Kept SQL, migrations, transactions, row mapping, and storage adapters server-owned.
- [x] Avoided frontend/UI changes.
- [x] Ran focused route/service verification for every touched module.
- [x] Ran server typecheck and workspace typecheck.
- [x] Updated this plan and master plan after implementation.

## Handoff Notes

- Start with `publish` because the latest audit gives the clearest baseline and `095` left explicit carry-forward notes.
- Do not undo the stricter shared publish result contract introduced after the `095` audit.
- Treat route tests as compatibility tests. If a route test starts failing because an error type/message/status changed, fix the implementation, not the test expectation, unless the current test is plainly wrong and this plan is updated with the rationale.
- Prefer direct imports from domain packages and `@repo/types` over service-module re-export chains when it removes indirection without changing behavior.
- Keep server-owned not-found and integration errors where they describe repository/storage/auth failures rather than pure domain-policy failures.
- If the implementation starts needing domain package changes, split that into a separate plan or update this one before coding.

## Explicit Non-Scope

- No UI, CSS, copy, layout, browser route, or visual behavior changes.
- No web or extension contract consumption work; that belongs to plan `097`.
- No database migrations or SQL behavior changes.
- No moving repositories, Fastify routes, auth/session code, cookies, password hashing, token hashing, or storage adapters into domain packages.
- No route URL, HTTP method, status code, response envelope, error `type`, public URL, persisted snapshot, or cookie behavior changes.
- No broad server rewrite or framework abstraction.
- No removal of `apps/web/src/features/guide/types.ts` guide-named publish compatibility aliases.
- No changing public viewer behavior or public published snapshot semantics.

## Final Output Required When Implemented

The implementing agent must report:

- files changed;
- server modules thinned;
- compatibility exports removed and any intentionally kept;
- route-local schemas/parsers intentionally kept and why;
- error mappings changed internally, with proof that HTTP output stayed compatible;
- verification commands run and results;
- whether browser validation was required;
- leftovers for `097-web-shared-contract-consumption.md` or later cleanup.
