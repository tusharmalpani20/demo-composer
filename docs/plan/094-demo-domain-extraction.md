# Demo Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `094` of the shared contracts and domainization track.

## Objective

Create `@repo/demo-domain` and move pure Interactive Demo, Demo Scene, Demo Hotspot, and demo generation rules out of `apps/server` while preserving every existing route, payload, auth, database, publish integration, editor behavior, and public viewer behavior.

The package name must be `@repo/demo-domain` to match `docs/system-design-pattern.md` and ADR terminology. The product term remains **Interactive Demo**. Demo Scene, Demo Hotspot, and Demo Transition concepts must remain distinct from Guide Block, Guide Step, and Guide Annotation.

This phase should extract reusable pure policies and shared route contracts. The server remains the application adapter that owns Fastify routes, auth/session context, SQL repositories, transactions, database migrations, row mapping, response envelopes, and error-to-HTTP mapping.

Current implementation note: there is no persisted `demo_transition` table, route, DTO, or standalone transition type today. The current MVP transition behavior is represented by `DemoHotspot.target_scene_id`. This plan must preserve that representation and extract target-scene transition validation as hotspot policy. Do not introduce a new transition entity, table, route, or response shape in this phase.

## Baseline From Completed 093

Plan `093` completed and post-implementation audited `@repo/guide-domain`.

Rules carried into this phase:

- Use the same adapter-first extraction shape: pure policies in a domain package; server keeps routes, SQL, transactions, auth, and integration wiring.
- Capture remains source material only. Creating or mutating capture records must not automatically create or mutate interactive demos.
- Interactive Demo generation must happen only through the existing explicit user action that calls the current create-from-capture route.
- Keep route-level web response types aligned with shared `@repo/types` contracts even when component state consumes a narrower subset.
- Do not move publish-specific snapshot/access/password types or policy in this phase. That is reserved for `095-publish-domain-and-public-contract-cleanup.md`.
- Do not add browser-visible behavior changes unless a discovered bug is explicitly documented and accepted.

Existing shared/package state after `093`:

- `@repo/constants` already exports `INTERACTIVE_DEMO_STATUSES`, `InteractiveDemoStatus`, `DEMO_HOTSPOT_TYPES`, and `DemoHotspotType` from `packages/constants/src/demo.ts`.
- `@repo/types` does not yet contain interactive demo schemas.
- `@repo/guide-domain` depends only on `@repo/constants` and `@repo/types`; `@repo/demo-domain` should follow this dependency style.
- `apps/server/package.json` does not yet depend on `@repo/demo-domain`.
- `apps/web/package.json` should not gain a dependency on `@repo/demo-domain` in this phase. Web should consume `@repo/types/demo` and existing constants only.
- `apps/web/src/features/interactive-demo/types.ts` duplicates server DTO/request types and also owns publish/public snapshot types that must remain local for now.

## Current Codebase Baseline

Relevant shared package files:

```text
packages/constants/src/demo.ts
packages/constants/src/constants.test.ts
packages/constants/src/index.ts
packages/types/src/index.ts
packages/types/src/common.ts
packages/types/src/capture.ts
packages/guide-domain/package.json
packages/guide-domain/tsconfig.json
packages/guide-domain/src/**/*
```

Relevant server files:

```text
apps/server/package.json
apps/server/src/app.ts
apps/server/src/modules/interactive-demo/interactive-demo.service.ts
apps/server/src/modules/interactive-demo/interactive-demo.service.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.repository.ts
apps/server/src/modules/interactive-demo/interactive-demo.db.integration.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.app.integration.test.ts
apps/server/src/modules/publish/publish.service.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/publish/publish.routes.test.ts
apps/server/src/smoke/v1-workflows.db.integration.test.ts
```

Relevant web files:

```text
apps/web/package.json
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/interactive-demo/types.ts
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx
```

Relevant migrations:

```text
apps/server/src/db/migrations/011_interactive_demo_foundation_schema.sql
apps/server/src/db/migrations/012_interactive_demo_hotspots.sql
apps/server/src/db/migrations/013_demo_hotspot_target_scope.sql
```

Relevant docs and ADRs:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/plan/092-capture-domain-extraction.md
docs/plan/093-guide-domain-extraction.md
```

## Existing Route And API Contracts To Preserve

Do not change route URLs, methods, status codes, response envelopes, error `type` strings, cookie auth behavior, or body field names.

Interactive demo routes currently registered under the project API prefix include:

```text
POST   /:project_id/capture-sessions/:capture_session_id/interactive-demos
POST   /:project_id/interactive-demos
GET    /:project_id/interactive-demos
GET    /:project_id/interactive-demos/:interactive_demo_id
PATCH  /:project_id/interactive-demos/:interactive_demo_id
DELETE /:project_id/interactive-demos/:interactive_demo_id
POST   /:project_id/interactive-demos/:interactive_demo_id/scenes
GET    /:project_id/interactive-demos/:interactive_demo_id/scenes
PATCH  /:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
PUT    /:project_id/interactive-demos/:interactive_demo_id/scenes/order
DELETE /:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
POST   /:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
GET    /:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
PATCH  /:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id
PUT    /:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/order
DELETE /:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id
```

Request body shapes to preserve:

- Create interactive demo from capture:
  - `title?: string`
  - `description?: string | null`
  - Route schema currently accepts `title` but service currently derives the title from the capture session name. Preserve this behavior unless a separate bug plan changes it.
  - Unknown keys are ignored by route pickers after validation allows passthrough.
- Create interactive demo:
  - `title: string`
  - `description?: string | null`
  - Unknown keys ignored by route picker.
- Update interactive demo:
  - `title?: string`
  - `description?: string | null`
  - `status?: "draft" | "archived"`
  - Empty picked update maps to `empty_interactive_demo_update`.
- Create demo scene:
  - `title?: string | null`
  - `description?: string | null`
  - `background_capture_asset_id?: string | null`
  - Route picker currently does not accept source capture fields from clients even though service input type includes them.
- Update demo scene:
  - `title?: string | null`
  - `description?: string | null`
  - `background_capture_asset_id?: string | null`
  - Empty picked update maps to `empty_demo_scene_update`.
- Reorder demo scenes:
  - `scene_ids: string[]`
  - Empty array is rejected by route schema and domain policy.
  - Duplicate IDs map to `invalid_demo_scene_order`.
- Create demo hotspot:
  - `hotspot_type: "click" | "info" | "next"`
  - `label?: string | null`
  - `content?: string | null`
  - `x: number`
  - `y: number`
  - `width: number`
  - `height: number`
  - `target_scene_id?: string | null`
- Update demo hotspot:
  - Optional versions of create-hotspot fields.
  - Empty picked update maps to `empty_demo_hotspot_update`.
- Reorder demo hotspots:
  - `hotspot_ids: string[]`
  - Empty array is rejected by route schema and domain policy.
  - Duplicate IDs map to `invalid_demo_hotspot_order`.

Response shapes to preserve:

- Create from capture returns status `201` with:
  - `interactive_demo: InteractiveDemo`
  - `demo_scenes: DemoScene[]`
  - `redirect_path: string`
- Create interactive demo returns status `201` with `{ interactive_demo: InteractiveDemo }`.
- List interactive demos returns `{ interactive_demos: InteractiveDemo[] }`.
- Get/update interactive demo returns `{ interactive_demo: InteractiveDemo }`.
- Delete interactive demo returns `204`.
- Create/update scene returns `{ demo_scene: DemoScene }`.
- List/reorder scenes returns `{ demo_scenes: DemoScene[] }`.
- Delete scene returns `204`.
- Create/update hotspot returns `{ demo_hotspot: DemoHotspot }`.
- List/reorder hotspots returns `{ demo_hotspots: DemoHotspot[] }`.
- Delete hotspot returns `204`.

Stable error mapping to preserve:

```text
UnauthenticatedSessionError -> 401 unauthenticated
ProjectNotFoundError -> 404 project_not_found
InteractiveDemoNotFoundError -> 404 interactive_demo_not_found
CaptureSessionNotFoundError -> 404 capture_session_not_found
NoUsableCaptureEventsError -> 400 no_usable_capture_events
DemoSceneNotFoundError -> 404 demo_scene_not_found
DemoHotspotNotFoundError -> 404 demo_hotspot_not_found
EmptyInteractiveDemoUpdateError -> 400 empty_interactive_demo_update
EmptyDemoSceneUpdateError -> 400 empty_demo_scene_update
EmptyDemoSceneOrderError -> 400 empty_demo_scene_order
InvalidDemoSceneOrderError -> 400 invalid_demo_scene_order
InvalidDemoSceneReferenceError -> 400 invalid_demo_scene_reference
EmptyDemoHotspotUpdateError -> 400 empty_demo_hotspot_update
EmptyDemoHotspotOrderError -> 400 empty_demo_hotspot_order
InvalidDemoHotspotOrderError -> 400 invalid_demo_hotspot_order
InvalidDemoHotspotCoordinatesError -> 400 invalid_demo_hotspot_coordinates
InvalidDemoHotspotTargetError -> 400 invalid_demo_hotspot_target
```

## Shared Schemas And Types To Add

Add `packages/types/src/demo.ts` and export it from `packages/types/src/index.ts`.

Use Zod schemas consistent with existing `@repo/types` style:

- Import constants from `@repo/constants`.
- Reuse `IdSchema`, `IsoDateTimeStringSchema`, positive numeric helpers, and nullable helpers from `packages/types/src/common.ts` where appropriate.
- Use `.passthrough()` for request schemas where current route schemas allow unknown keys.
- Preserve current trimming/null behavior in route validation and domain normalization.
- Do not add semantic validation to request schemas when the current service maps that validation to a domain error type. In particular, create/update hotspot request schemas must keep coordinates as plain `z.number()` fields so invalid boxes still reach domain policy and map to `invalid_demo_hotspot_coordinates`.
- DTO/response schemas should be compatible with existing persisted rows and API responses; do not reject historical data by adding stricter refinements than the current database and service guarantee.

Required DTO schemas/types:

- `InteractiveDemoSchema`
- `DemoSceneSchema`
- `DemoHotspotSchema`
- `CreateInteractiveDemoRequestSchema`
- `CreateInteractiveDemoInput`
- `CreateInteractiveDemoFromCaptureRequestSchema`
- `CreateInteractiveDemoFromCaptureInput`
- `UpdateInteractiveDemoRequestSchema`
- `UpdateInteractiveDemoInput`
- `CreateDemoSceneRequestSchema`
- `CreateDemoSceneInput`
- `UpdateDemoSceneRequestSchema`
- `UpdateDemoSceneInput`
- `ReorderDemoScenesRequestSchema`
- `ReorderDemoScenesInput`
- `CreateDemoHotspotRequestSchema`
- `CreateDemoHotspotInput`
- `UpdateDemoHotspotRequestSchema`
- `UpdateDemoHotspotInput`
- `ReorderDemoHotspotsRequestSchema`
- `ReorderDemoHotspotsInput`

Required response schemas/types:

- `CreateInteractiveDemoFromCaptureResponseSchema`
- `CreateInteractiveDemoResponseSchema`
- `ProjectInteractiveDemoListResponseSchema`
- `InteractiveDemoDetailResponseSchema`
- `InteractiveDemoSceneResponseSchema`
- `InteractiveDemoSceneListResponseSchema`
- `InteractiveDemoSceneReorderResponseSchema`
- `InteractiveDemoHotspotResponseSchema`
- `InteractiveDemoHotspotListResponseSchema`
- `InteractiveDemoHotspotReorderResponseSchema`

Notes:

- Do not move publish/public snapshot types in this phase. Keep `PublishedInteractiveDemoSnapshot*` in `apps/web/src/features/interactive-demo/types.ts` and the corresponding server publish snapshot types in `apps/server/src/modules/publish/publish.service.ts` until `095`.
- If type names differ from web API helper names, prefer the web/server response names already in use to minimize churn.
- Align route-level web response types with shared `@repo/types/demo` schemas, following the 093 post-audit correction.

## Domain Package To Add

Create package:

```text
packages/demo-domain/package.json
packages/demo-domain/tsconfig.json
packages/demo-domain/src/index.ts
packages/demo-domain/src/errors.ts
packages/demo-domain/src/types.ts
packages/demo-domain/src/policies/demo-input-policy.ts
packages/demo-domain/src/policies/demo-generation-policy.ts
packages/demo-domain/src/policies/demo-scene-policy.ts
packages/demo-domain/src/policies/demo-hotspot-policy.ts
packages/demo-domain/src/policies/*.test.ts
```

Package conventions:

- Package name: `@repo/demo-domain`.
- Dependencies: `@repo/constants` and `@repo/types` only.
- No Fastify, pg, filesystem, auth/session, transaction, UI, React, or browser dependencies.
- Export errors, policy functions, and normalized type aliases from `src/index.ts`.
- Match `@repo/guide-domain` script/export conventions.

Pure domain behavior to move:

- String compaction and normalization for interactive demo, scene, and hotspot input.
- Empty update validation.
- Scene order validation.
- Hotspot order validation.
- Hotspot coordinate box validation.
- Hotspot type normalization.
- Demo scene title derivation from capture source events.
- Capture-event-to-demo-scene generation rules.
- Redirect path construction, if kept as a pure helper, must preserve URL encoding exactly. It may also remain in the server service because it is response orchestration rather than business state.
- Target-scene transition validation as represented by `DemoHotspot.target_scene_id`. Do not create a separate transition model.

Domain behavior that requires server-supplied facts:

- `ensure_project` remains service orchestration, or becomes a server adapter precondition because it requires repository access.
- `ensure_background_asset` should stay service orchestration; pure domain only decides when a non-null background asset requires validation and which error to throw.
- `ensure_target_scene` should stay service orchestration; pure domain only decides when a non-null target scene requires validation and which error to throw.
- No domain package function should query repositories directly.

Error classes to move or re-export:

- Move pure domain error classes to `@repo/demo-domain`.
- Server route `instanceof` mapping must keep working. Import moved errors from `@repo/demo-domain` in service/routes or re-export them from `apps/server/src/modules/interactive-demo/interactive-demo.service.ts` as a compatibility layer.
- Keep server-only adapter errors in server only if any are introduced later.

## Server Implementation Requirements

Update:

```text
apps/server/package.json
apps/server/src/modules/interactive-demo/interactive-demo.service.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.service.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.app.integration.test.ts
```

Do not change:

```text
apps/server/src/modules/interactive-demo/interactive-demo.repository.ts
apps/server/src/db/migrations/011_interactive_demo_foundation_schema.sql
apps/server/src/db/migrations/012_interactive_demo_hotspots.sql
apps/server/src/db/migrations/013_demo_hotspot_target_scope.sql
```

unless implementation discovers a documented bug that cannot be fixed without DB changes. This phase is expected to require no migration.

Server ownership rules:

- `interactive-demo.routes.ts` keeps Fastify route registration, auth extraction, request pickers, response envelopes, and error-to-HTTP mapping.
- `interactive-demo.service.ts` keeps repository orchestration, auth scope propagation, project existence checks, demo/scene/hotspot existence checks, and transaction boundary delegation through repository methods.
- `interactive-demo.repository.ts` keeps SQL, row mapping, ULID generation, soft delete behavior, ordering updates, and DB transaction logic.
- `publish.service.ts` keeps interactive demo snapshot generation and public publish policy for `095`.

Server route schema changes:

- Replace route-local JSON body schemas in `interactive-demo.routes.ts` with schemas from `@repo/types/demo`.
- Preserve route pickers exactly so unknown/client-managed fields remain ignored.
- Preserve `.passthrough()` semantics.
- Preserve `z.enum(INTERACTIVE_DEMO_STATUSES)` and `z.enum(DEMO_HOTSPOT_TYPES)` behavior through shared schemas.

Service behavior rules to preserve:

- Create-from-capture checks project scope first.
- Missing capture session throws `CaptureSessionNotFoundError`.
- Source events are fetched in repository order and filtered to events with screenshot-backed capture assets.
- `list_screenshot_capture_asset_ids` determines which referenced assets are usable screenshots.
- Generated scenes are 1-based contiguous by filtered event order.
- Generated scene fields:
  - `source_capture_event_id = event.id`
  - `source_capture_asset_id = event.capture_asset_id`
  - `background_capture_asset_id = event.capture_asset_id`
  - `description = null`
  - `title` is derived as:
    - click + non-empty `target_text` -> `Click ${target_text}`
    - click + non-empty `target_label` -> `Click ${target_label}`
    - non-empty `page_title` -> page title
    - non-empty `note` -> note
    - fallback -> `Step ${event.event_index}`
- No usable generated scenes throws `NoUsableCaptureEventsError`.
- Create-from-capture currently ignores optional request title/description and uses capture session name/description. Preserve this unless the plan is amended.
- Create demo trims title, compacts blank description to `null`, and compacts source capture session id to `null`.
- Update demo trims title, compacts blank description to `null`, preserves status when provided, and rejects empty update.
- Scene create/update compacts blank title/description/background asset id to `null`.
- Non-null scene background assets must exist in the same organization/project through `background_asset_exists`; otherwise `InvalidDemoSceneReferenceError`.
- Scene reorder rejects empty and duplicate IDs before repository calls; repository result length must equal requested ID length.
- Hotspot type accepts only `click`, `info`, `next`; trimmed values are accepted in service normalization.
- Hotspot label/content/target are compacted to `null`.
- Hotspot coordinates must be finite and normalized:
  - `x` and `y` between `0` and `1`, inclusive.
  - `width` and `height` greater than `0` and at most `1`.
  - `x + width <= 1`.
  - `y + height <= 1`.
- Hotspot create/update checks the owning demo and scene before repository mutation.
- Non-null target scenes must belong to the same organization/project/interactive demo through `find_scene`; otherwise `InvalidDemoHotspotTargetError`.
- Hotspot reorder rejects empty and duplicate IDs before repository calls; repository result length must equal requested ID length.

Security and permission rules:

- Every route must continue requiring the existing session cookie.
- Server must continue deriving `organization_id` and `actor_org_user_id` from the authenticated session only.
- Clients must not be able to set `organization_id`, `project_id`, `created_by_id`, `updated_by_id`, source IDs, indexes, `version`, timestamps, soft-delete fields, or ownership fields through request bodies.
- All repository calls must remain scoped by `organization_id` and `project_id`.
- Demo hotspot target validation must remain both application-level and database-level:
  - application-level via service/domain validation before mutation;
  - database-level via `013_demo_hotspot_target_scope.sql`.
- The domain package must not accept auth/session objects or make permission decisions.

## Web Implementation Requirements

Update:

```text
apps/web/src/features/interactive-demo/types.ts
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx
```

Potentially update only for type imports if type checking requires it:

```text
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx
apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx
```

Web rules:

- Replace duplicated draft interactive demo DTO/request/response types with imports/re-exports from `@repo/types/demo` where route shape matches.
- Keep `PublishedInteractiveDemoSnapshot*` types local for `095`.
- Do not change JSX, CSS modules, visible copy, navigation paths, fetch paths, asset URL construction, or public viewer behavior.
- Keep local editor validation behavior stable. Do not import `@repo/demo-domain` into the web app in this phase; the domain package is for shared backend/domain policy extraction, while the web should only adopt shared route contracts from `@repo/types/demo`.
- API helpers should continue URL-encoding project, demo, scene, and hotspot IDs exactly as today.

Browser validation requirements:

- If implementation only changes shared type imports, route schemas, and backend/domain wiring with no JSX/CSS/rendered copy/navigation/fetch path changes, agent-browser validation is not required.
- If any frontend runtime logic changes beyond type imports or test fixture shape, use agent-browser to validate:
  - Interactive Demo Editor loads scenes and hotspots.
  - Creating/editing/deleting/reordering hotspots still works.
  - Scene reorder/delete controls still work.
  - Public Interactive Demo viewer hotspot navigation still works, including fallback to the next scene when a target is missing.
  - Capture screenshots/background assets still render without broken image URLs.

## Migration And Backwards Compatibility Notes

Expected migration requirement: none.

Backwards compatibility rules:

- No route URL, method, status code, response envelope, or error `type` changes.
- No database schema, table, index, trigger, or constraint changes.
- No change to persisted row values except values already produced by existing service/repository behavior.
- No change to soft-delete behavior for demos, scenes, or hotspots.
- No change to scene/hotspot index semantics.
- No change to publish snapshot behavior; publishing remains tested but not extracted here.
- Existing demo rows and published demo snapshots must remain readable.

DB verification:

- Not required if implementation only moves pure logic/types and leaves repository/migrations unchanged.
- Required if any repository SQL, migration, trigger, transaction behavior, or row mapping changes:

```text
rtk pnpm --filter server test:db
```

## Explicit Non-Scope

Do not do any of the following in this phase:

- Do not create package `@repo/interactive-demo-domain`.
- Do not redesign the Interactive Demo Editor or Public Interactive Demo Viewer.
- Do not change CSS, layout, copy, button labels, accessibility names, or navigation behavior.
- Do not implement new branching flow capabilities beyond current `target_scene_id`.
- Do not add a standalone Demo Transition table, route, DTO, or editor concept.
- Do not add analytics, forms, lead capture, custom branding, or AI suggestions.
- Do not merge Demo Scene with Guide Step.
- Do not merge Demo Hotspot with Guide Annotation.
- Do not move publish link/access/password/public snapshot policy; carry that into `095`.
- Do not modify Chrome extension behavior.
- Do not make capture completion auto-create demos.
- Do not add new migrations unless a documented blocking bug is found.

## Implementation Steps

1. Add shared demo schemas.
   - Create `packages/types/src/demo.ts`.
   - Export from `packages/types/src/index.ts`.
   - Add `packages/types/src/demo.test.ts`.
   - Cover successful parsing, trimming/nullability, passthrough request behavior, response envelopes, and the fact that semantically invalid hotspot boxes are still accepted by request schemas for domain-level validation.

2. Create `@repo/demo-domain`.
   - Mirror `@repo/guide-domain` package conventions.
   - Add pure domain errors.
   - Add normalized input types and source-event types.
   - Add tests before moving behavior.

3. Move pure input policies.
   - Move string compaction and input normalization for demo, scene, and hotspot.
   - Move empty update checks.
   - Preserve current error classes and messages.

4. Move generation policy.
   - Move source-event filtering/scene derivation into a pure function that accepts source events and a set of screenshot capture asset IDs.
   - Preserve 1-based indexes, title fallback order, background/source asset IDs, and `NoUsableCaptureEventsError`.
   - Keep repository fetching in server service.

5. Move scene and hotspot policies.
   - Move scene order uniqueness validation.
   - Move hotspot order uniqueness validation.
   - Move hotspot box validation.
   - Move target-scene transition validation decision helpers if useful, but keep repository existence checks in server service.
   - Keep background-asset existence checks in server service; a pure helper may only normalize/decide whether validation is required.

6. Wire server service.
   - Import policies/errors/types from `@repo/demo-domain` and route contracts from `@repo/types/demo`.
   - Remove duplicated pure helper implementations from `interactive-demo.service.ts`.
   - Preserve service method signatures used by routes and publish service.
   - Keep repository interface local to server unless a pure type is shared by the domain package without introducing repository ownership.

7. Wire server routes.
   - Import request schemas and DTO/input types from `@repo/types/demo`.
   - Keep picker functions and response envelopes.
   - Keep error-to-HTTP mapping stable with moved/re-exported errors.

8. Wire web contracts.
   - Replace duplicate route DTO/request/response types in `apps/web/src/features/interactive-demo/types.ts` with shared imports/re-exports from `@repo/types/demo`.
   - Keep publish snapshot types local.
   - Keep `apps/web/src/lib/api.ts` helper signatures and paths unchanged.
   - Update tests/fixtures only where shared types are stricter than local duplicates.

9. Update docs after implementation.
   - Update this plan with status, checklist, implementation log, verification notes, browser/DB validation notes, and leftovers.
   - Update the master plan only for completed phase items.
   - Add carry-forward notes for `095`, especially publish-specific demo snapshot/access types that remain local.

## Test Plan

Shared type tests:

- `InteractiveDemoSchema`, `DemoSceneSchema`, and `DemoHotspotSchema` parse existing representative DTOs.
- Request schemas preserve passthrough behavior.
- Request schemas trim IDs where current route schemas trim IDs.
- Create/update hotspot request schemas do not reject out-of-range coordinate boxes before domain policy runs.
- Response envelope schemas match current API helpers.

Domain tests:

- Normalizes create/update demo input exactly like current service.
- Rejects empty demo updates.
- Normalizes create/update scene input and rejects empty scene updates.
- Builds demo scenes from ordered screenshot-backed capture events only.
- Uses title fallback order: target text, target label, page title, note, `Step ${event_index}`.
- Throws `NoUsableCaptureEventsError` when no screenshot-backed events remain.
- Rejects empty and duplicate scene orders.
- Normalizes hotspot type/label/content/target.
- Rejects invalid hotspot type with the same error currently used.
- Rejects non-finite, negative, oversized, zero-size, and overflowing hotspot boxes.
- Validates target-scene transition rules through `target_scene_id` without introducing a separate transition entity.
- Rejects empty hotspot updates.
- Rejects empty and duplicate hotspot orders.

Server tests:

- Existing `interactive-demo.service.test.ts` remains green after service delegates to domain policies.
- Existing `interactive-demo.routes.test.ts` remains green with shared schemas.
- Existing `interactive-demo.app.integration.test.ts` remains green.
- Add or preserve route tests proving unknown fields are ignored and client-managed fields are not passed through.
- Preserve error mapping tests for every moved error class.
- Preserve create-from-capture tests proving screenshot filtering and redirect path behavior.
- Preserve target-scene scope behavior tests.

Web tests:

- `apps/web/src/lib/api.test.ts` interactive demo cases remain green.
- `InteractiveDemoEditorPage.test.tsx` remains green.
- `ProjectInteractiveDemoListPage.test.tsx` remains green.
- `PublicInteractiveDemoViewerPage.test.tsx` remains green.
- Typecheck catches route response contract drift.

Publish regression tests:

- Run publish tests that include interactive demo behavior because publish service imports demo DTOs from the server module today:

```text
rtk pnpm --filter server test -- publish.service publish.routes
```

## Verification Commands

Minimum focused verification:

```text
rtk pnpm --filter @repo/types test -- demo
rtk pnpm --filter @repo/types check-types
rtk pnpm --filter @repo/types lint
rtk pnpm --filter @repo/types build
rtk pnpm --filter @repo/demo-domain test
rtk pnpm --filter @repo/demo-domain check-types
rtk pnpm --filter @repo/demo-domain lint
rtk pnpm --filter @repo/demo-domain build
rtk pnpm --filter server test -- interactive-demo
rtk pnpm --filter server test -- publish.service publish.routes
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter web check-types
rtk pnpm --filter web test -- InteractiveDemoEditorPage ProjectInteractiveDemoListPage PublicInteractiveDemoViewerPage
rtk pnpm --filter web test -- api
rtk pnpm check-types
rtk git diff --check
```

Conditional verification:

```text
rtk pnpm --filter server test:db
```

Run the DB command only if repository SQL, migrations, target-scope trigger behavior, transaction behavior, or row mapping changes.

Agent-browser verification is conditional as described in the web section.

## Acceptance Criteria

- `@repo/demo-domain` exists and contains pure demo policies with focused tests.
- `@repo/types/demo` exists and owns shared interactive demo route contracts.
- Existing route shapes, status codes, response envelopes, and error `type` strings are unchanged.
- Server routes, auth/session, SQL repositories, transactions, and HTTP error mapping remain server-owned.
- Interactive Demo generation from capture source material is deterministic and behavior-compatible.
- Capture source records remain immutable and no auto-demo generation occurs on capture completion.
- Demo Scene, Demo Hotspot, and target-scene behavior remain distinct from guide concepts.
- Existing DB target-scene scope protection remains intact.
- Web editor/viewer behavior is unchanged.
- Publish-specific demo snapshot/access behavior remains deferred to `095`.

## Handoff Notes

- Start by writing domain and type tests that encode current behavior before moving service helpers.
- Keep commits small:
  - shared schemas/tests;
  - demo-domain package/policies/tests;
  - server wiring/tests;
  - web type wiring/tests;
  - docs/status updates.
- If implementation uncovers a behavioral bug, document it in this plan and stop before changing behavior unless the bug fix is clearly necessary to preserve safety.
- If route-level shared contracts force stricter web fixtures, update fixtures to the real route response shape rather than narrowing shared types locally.
- Carry into `095-publish-domain-and-public-contract-cleanup.md`:
  - `apps/server/src/modules/publish/publish.service.ts` still owns `PublishedInteractiveDemoSnapshot` and public demo snapshot preparation.
  - `apps/web/src/features/interactive-demo/types.ts` still owns `PublishedInteractiveDemoSnapshot*` public viewer types.
  - Publish/access/password types are still shared through guide-named compatibility types in parts of the web UI and should be cleaned up in the publish phase.

## Final Output Required When Implemented

When executing this plan, report:

- Files changed by package/app area.
- Domain rules moved into `@repo/demo-domain`.
- Shared schemas/types added to `@repo/types/demo`.
- Server route/service behavior preserved.
- Web type wiring changes and whether browser validation was required.
- Verification commands run with pass/fail results.
- DB verification decision and rationale.
- Leftovers for `095`.
