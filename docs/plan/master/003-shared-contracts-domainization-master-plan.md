# Master Plan 003: Shared Contracts And Domainization

Date: 2026-07-06

Last reviewed: 2026-07-07

## 1. Purpose

Demo Composer should pause feature expansion long enough to make its existing backend, shared packages, and frontend/extension contract usage more reusable and easier to maintain.

The target is an Orca-style architecture adapted to Demo Composer:

- Shared constants hold canonical enum values, limits, defaults, and product-level fixed values that are reused across active packages.
- Shared types hold Zod schemas and inferred TypeScript types for API requests, responses, query parameters, params, and shared DTOs.
- Domain packages own business rules, command/query flows, validation policies, domain errors, and repository interfaces.
- `apps/server` becomes a thinner HTTP, auth, persistence, and integration adapter.
- `apps/web` and `apps/extension` consume shared contracts/constants where useful without changing UI behavior or visual design.

Shared package extraction must be demand-driven. A value or contract should move into `@repo/constants` or `@repo/types` when it is used by more than one active app/package, when it defines a public API boundary, or when a child plan proves that centralizing it prevents real drift.

This is a refactor and architecture hardening track. It must not redesign the product, alter UI appearance, or introduce unrelated features.

## 2. Reference Repo

Use `/home/tm/Desktop/work/project_orca/orca_v2` as the architectural reference, not as a file-by-file template.

Important Orca patterns to follow:

- `packages/constants` is not a dumping ground. It exports stable product constants by domain.
- `packages/types` exports runtime Zod schemas plus inferred TypeScript types.
- Domain packages separate domain commands, policies, repositories, errors, and types.
- Server routes validate HTTP input/output and delegate product decisions to domain logic.
- Apps consume shared packages instead of re-declaring API shapes and fixed values.

Important difference:

- Demo Composer has capture sessions, guide generation, interactive demos, immutable publish snapshots, extension capture, public viewers, file metadata, and first-run setup. The domain split must reflect Demo Composer's product language and ADRs.
- The existing system-design doc names the Interactive Demo package `@repo/demo-domain`. This plan should use `@repo/demo-domain` for package naming while preserving the domain term **Interactive Demo** and the existing server/database names such as `interactive-demo` and `interactive_demo_schema`.

## 3. Current Architectural Problem

The shared packages are currently intentionally thin:

- `@repo/ui` has small Tailwind primitives.
- `@repo/types` is mostly a placeholder.
- `@repo/constants` is mostly a placeholder.

"Thin" means they do not yet carry the real reusable product contracts and constants. That was acceptable while the app was moving quickly, but it is now a scaling problem.

The problems this plan addresses:

- Product enums and fixed values can drift between server, web, extension, and tests.
- API request and response shapes are not centralized enough.
- Server services risk becoming the place where all domain behavior accumulates.
- Frontend and extension code can end up depending on implicit backend behavior instead of shared contracts.
- Future features will be slower and riskier if capture, guide, interactive demo, publish, file, organization, auth, and setup rules remain tangled.

## 4. Existing Decisions To Preserve

This plan must preserve the decisions already documented in the repo.

Relevant source docs:

- `CONTEXT.md`
- `docs/system-design-pattern.md`
- `docs/adr/0001-single-product-context-with-domain-packages.md`
- `docs/adr/0002-capture-sessions-are-source-material.md`
- `docs/adr/0003-immutable-capture-source-records.md`
- `docs/adr/0004-guide-blocks-with-first-class-steps.md`
- `docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md`
- `docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md`
- `docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md`
- `docs/adr/0008-rebuild-in-place-preserve-decision-docs.md`
- `docs/adr/0009-file-domain-owns-storage-metadata.md`
- `docs/adr/0010-screenshot-capture-first-html-replay-deferred.md`
- `docs/adr/0011-extension-uses-instance-first-login.md`
- `docs/adr/0012-privacy-preserving-capture-defaults.md`
- `docs/adr/0013-ai-deferred-from-day-one-mvp.md`
- `docs/adr/0014-rest-fastify-zod-openapi-api-style.md`
- `docs/adr/0015-user-organization-org-user-identity-model.md`
- `docs/adr/0016-explicit-owner-bootstrap-command.md`
- `docs/adr/0017-deployment-aware-onboarding-mode.md`
- `docs/adr/0018-web-first-run-setup-from-day-one.md`
- `docs/adr/0019-separate-web-and-server-apps.md`

Key decisions to protect:

- Demo Composer is one product context with domain packages, not multiple bounded contexts.
- Capture sessions are source material.
- Capture source records are immutable.
- Guides use blocks with first-class steps.
- Interactive demos use scenes, hotspots, and transitions.
- Publish links resolve to immutable snapshots.
- File metadata belongs to the file domain.
- Screenshot capture is first; HTML replay remains deferred.
- The extension connects to an Instance before login.
- Privacy-preserving capture defaults stay intact.
- AI remains deferred from the day-one MVP.
- REST, Fastify, Zod, and OpenAPI remain the API style.
- User, Organization, and Org User are separate identity concepts.
- Owner Bootstrap and Web First-Run Setup must create the first User, Organization, and owner Org User safely.
- Onboarding mode is deployment-aware.
- Web and server remain separate apps.

## 5. Hard Scope Boundaries

In scope:

- Shared constants and shared types.
- Shared package activation, including package scripts and dependency wiring needed before imports are introduced.
- Domain package extraction and cleanup.
- Server route/service thinning.
- API contract reuse in server, web, and extension.
- Test coverage around behavior that is moved or centralized.
- Documentation updates for architecture, domain boundaries, and verification.

Out of scope:

- UI redesign.
- Visual styling changes.
- UX flow changes.
- New product features.
- New AI behavior.
- HTML replay implementation.
- Storage provider replacement.
- Route URL churn unless a child plan explicitly proves it is necessary.
- Database schema changes unless a child plan explicitly proves they are necessary.
- Moving backend-only database table/schema names into shared constants by default.
- Public viewer behavior changes.

Frontend and extension edits are allowed only when they replace duplicated constants/types/contracts with shared package imports or adjust compile-time usage. They must not change the rendered UI.

## 6. Target Package Responsibilities

### 6.1 `@repo/constants`

Own canonical fixed values when they are reused across active packages or represent public product/API vocabulary:

- Domain enum values.
- API route tags and stable operation names only when shared by API docs, server, and clients.
- Status values.
- Role values.
- Capture event names.
- Guide block types.
- Interactive demo scene, hotspot, and transition values.
- Publish visibility, snapshot, and access values.
- File kind, storage provider, and MIME allow-list constants.
- Validation limits, pagination defaults, and upload limits.
- Privacy defaults and redaction-related constants.

Rules:

- Constants must be grouped by domain.
- Constants must pass a reuse gate before extraction: at least two active apps/packages consume the value, the value defines a public API boundary, or the child plan documents a concrete drift risk.
- Avoid exporting app-specific display labels unless they are truly product constants.
- Avoid exporting database table names and schema names by default. Keep those in migrations and persistence adapters unless a child plan proves a cross-package need.
- Avoid putting large behavior functions in `@repo/constants`.
- Export stable arrays and readonly objects that can feed Zod enums and UI option lists.

### 6.2 `@repo/types`

Own shared runtime contracts that are consumed across package/app boundaries or define public API behavior:

- Zod schemas for route params.
- Zod schemas for query strings.
- Zod schemas for request bodies.
- Zod schemas for response bodies.
- Common pagination, IDs, timestamps, slugs, and error envelopes.
- Shared DTOs for capture, guides, interactive demos, publish, files, organizations, auth, and setup.
- Inferred TypeScript types from those schemas.

Rules:

- Runtime schemas are the source of truth.
- Export inferred types from schemas instead of manually duplicating shapes.
- Route schemas that are used only by `apps/server` can remain route-local until web, extension, public viewers, generated docs, or another package actively needs them.
- Shared schemas must pass a reuse gate before extraction: active cross-app consumption, public API contract stability, or a documented drift risk.
- Keep database-only types out unless they are explicitly shared persistence contracts.
- Keep React component props out of `@repo/types`.
- Keep server-only infrastructure types out of `@repo/types`.
- Add required package dependencies and scripts before relying on shared schema tests. `@repo/types` currently exports an empty module and does not yet declare `zod` directly.

### 6.3 Domain Packages

Domain packages should own product decisions.

Candidate domains:

- `@repo/file-domain`
- `@repo/project-domain`
- `@repo/capture-domain`
- `@repo/guide-domain`
- `@repo/demo-domain` for Interactive Demo behavior
- `@repo/publish-domain`
- `@repo/user-domain` if user identity behavior is extracted separately
- `@repo/organization-domain`
- `@repo/auth-domain`
- `@repo/instance-domain` only if public instance status, deployment mode, and onboarding mode need their own behavior boundary

Each domain package should converge on this structure where useful:

- `commands/` for write workflows.
- `queries/` for read workflows.
- `policies/` for domain decisions and permission-adjacent checks.
- `repositories/` for interfaces used by the domain.
- `errors/` for typed domain failures.
- `schemas/` or `types/` for domain-local schemas that are not public API contracts.
- `__tests__/` for focused domain tests.

Do not create all folders mechanically. Add them when the child plan has a real use for them.

Do not create all candidate packages mechanically. A child plan may keep closely related identity/setup behavior together until there is enough behavior to justify another package.

### 6.4 `apps/server`

Server responsibilities after this track:

- Fastify route registration.
- Auth/session integration.
- Request validation using shared schemas.
- Response shaping using shared schemas.
- Database adapter implementations.
- File storage adapter implementations.
- Transaction boundaries.
- Calling domain commands/queries.
- Translating domain errors to HTTP responses.

Server should avoid owning:

- Capture event policy.
- Guide block conversion rules.
- Interactive demo scene/hotspot business rules.
- Publish snapshot access decisions.
- File metadata policy.
- Product enum definitions.
- API DTO duplication.

### 6.5 `apps/web`

Web responsibilities after this track:

- UI rendering.
- User interaction.
- Client-side route/data orchestration.
- Consuming shared API response/request types.
- Consuming shared constants for stable product values.

Web changes must not alter:

- Layout.
- Visual appearance.
- Copy.
- Component behavior visible to users.
- Navigation behavior.

### 6.6 `apps/extension`

Extension responsibilities after this track:

- Browser capture lifecycle.
- Calling backend APIs with shared request/response types.
- Using shared capture and privacy constants.
- Keeping capture payload shapes aligned with the backend.

Extension changes must not alter:

- User-visible extension UI.
- Capture defaults.
- Privacy behavior.
- Event semantics.

### 6.7 `apps/docs`

The docs app is not a primary product-domain consumer for this track.

It should be touched only when:

- workspace typecheck/build changes require dependency alignment;
- documentation imports shared package metadata intentionally;
- a child plan explicitly includes docs build verification.

## 7. Proposed Domain Boundaries

### 7.1 Identity, Auth, Setup, And Instance Status

Own:

- User identity rules that are not persistence-only.
- Session-facing domain contracts where they are product rules.
- Extension Session rules that depend on a configured Instance.
- Public instance status contracts.
- Deployment Mode and onboarding mode decisions.
- First-run setup state and validation.
- Initial Owner creation rules.
- Owner Bootstrap and Web First-Run Setup rules.
- Account bootstrap decisions.

Do not own:

- Fastify cookie/session plumbing.
- Password hashing implementation details unless wrapped as an adapter.
- Raw environment variable parsing.

### 7.2 Organization Domain

Own:

- Organization membership rules.
- Role constants and role validation.
- Invite lifecycle rules.
- Member acceptance/removal decisions.
- Org User identity as the implementation record for an Organization Member.
- Organization-owned audit rules that point to `org_user.id`.

Do not own:

- HTTP auth middleware.
- UI member tables.
- User login identity by itself.

### 7.3 Project Domain

Own:

- Project lifecycle.
- Project status values.
- Project ownership/member access rules that are product decisions.
- Project-level soft delete or archive policy if present.

Do not own:

- Capture internals.
- Publish snapshot internals.

### 7.4 File Domain

Own:

- File metadata rules.
- Storage provider constants.
- Stored file lifecycle.
- MIME and size validation.
- Asset/file associations at the domain level.

Do not own:

- Raw provider SDK details.
- UI upload controls.

### 7.5 Capture Domain

Own:

- Capture session lifecycle.
- Capture event contracts.
- Source asset references.
- Privacy-preserving capture defaults.
- Manual ordering and completion rules.
- Screenshot-first capture assumptions.

Do not own:

- Guide generation output rules.
- Interactive demo scene rendering.
- Browser extension UI.

### 7.6 Guide Domain

Own:

- Guide generation from capture source material.
- Guide block and step structures.
- Screenshot reference handling within guides.
- Markdown/HTML export domain decisions if already present.
- Guide update rules.

Do not own:

- Capture source mutation.
- UI editor layout.

### 7.7 Demo Domain For Interactive Demo Behavior

Own:

- Demo generation from capture source material.
- Scenes.
- Hotspots.
- Transitions.
- Ordering and geometry validation.
- Demo update rules.

Do not own:

- Visual editor styling.
- Runtime viewer styling.

Package name:

- Use `@repo/demo-domain`, matching `docs/system-design-pattern.md`.
- Preserve `Interactive Demo`, `Demo Scene`, `Demo Hotspot`, and `Demo Transition` as the domain terms.

### 7.8 Publish Domain

Own:

- Immutable publish snapshots.
- Publish link state.
- Public access rules.
- Password and expiry policy if present.
- Snapshot metadata contracts.
- Viewer session domain rules if present.

Do not own:

- Public route rendering.
- CDN/storage provider details.

## 8. Execution Strategy

This must be split into child plans and executed one at a time.

Rules:

- Each child plan must be independently reviewable.
- Each child plan must include tests and exact verification commands.
- Each child plan must preserve current behavior unless it explicitly documents a bug fix.
- Each child plan must avoid UI changes.
- Each child plan must document files touched and domains affected.
- Each child plan must leave the repo in a working state.

Recommended order:

1. Activate shared package scripts/dependencies and establish shared constants.
2. Establish shared types/contracts only where reuse is real.
3. Establish domain error/result/repository conventions.
4. Extract low-risk domains first.
5. Extract capture, guide, demo, and publish domains in dependency order.
6. Thin server adapters.
7. Update web and extension contract consumption.
8. Run full regression and update docs.

## 9. Child Plan Index

Existing child plans currently run through `docs/plan/086-modern-ui-migration.md`.

New child plans should start at `087`.

### 087: Shared Constants Foundation

Status: Completed on 2026-07-07.

File:

- `docs/plan/087-shared-constants-foundation.md`

Goal:

- Turn `@repo/constants` into the canonical home for stable product constants that pass the reuse gate.

Scope:

- Inventory duplicated enum values and fixed values across server, web, extension, tests, and docs.
- Confirm which values pass the shared-constant reuse gate.
- Add or fix package scripts needed for constants verification. `@repo/constants` currently has a placeholder failing `test` script.
- Add `@repo/constants` dependencies to apps/packages only when imports are introduced.
- Add domain-grouped constants only for selected values that pass the reuse gate, such as project, file, capture, guide, interactive demo, publish, organization, auth/setup, pagination, upload limits, or privacy defaults.
- Keep database table names and schema names out of shared constants unless this child plan proves a cross-package need.
- Replace the lowest-risk duplicate imports in backend/shared code first.

Tests:

- Add package tests for exported constants where useful, or remove/replace the placeholder failing test script if no runtime tests are warranted yet.
- Run typecheck for all packages that import changed constants.
- Run targeted server tests for any backend code switched to shared constants.

Acceptance:

- Constants are grouped by domain.
- No UI output changes.
- Existing string values remain compatible with current persisted data and API responses.

### 088: Shared Types And API Contract Foundation

File:

- `docs/plan/088-shared-types-contract-foundation.md`

Goal:

- Turn `@repo/types` into the canonical home for shared Zod API contracts that pass the reuse gate.

Scope:

- Add direct `zod` dependency and package scripts to `@repo/types` before adding runtime schemas.
- Add common schemas for IDs, timestamps, pagination, error envelopes, route params, and response wrappers.
- Add request/response schemas only for stable APIs that are actively consumed across server, web, extension, public viewers, or generated API docs.
- Leave server-only schemas route-local until reuse is real.
- Use constants from `@repo/constants` to build enum schemas.
- Choose naming conventions for `Schema`, inferred type, request DTO, response DTO, list response, and params/query schemas.

Tests:

- Add schema parse tests.
- Add type-level or compile-time usage checks where useful.
- Run targeted server route tests for routes that switch to shared schemas.

Acceptance:

- Shared schemas are runtime-usable by server and compile-time-usable by clients.
- Inferred types are exported from schemas.
- No API response shape changes.

### 089: Domain Package Conventions And Error Mapping

File:

- `docs/plan/089-domain-package-conventions-and-error-mapping.md`

Goal:

- Establish common conventions before extracting multiple domains.

Scope:

- Define domain error shape and error codes.
- Define how domain errors map to HTTP responses.
- Define repository interface conventions.
- Define command/query naming conventions.
- Define test fixture conventions.
- Add small shared helpers only if they reduce real duplication.

Tests:

- Unit tests for error creation and HTTP mapping.
- Compile checks across packages.

Acceptance:

- Future domain child plans have a consistent template.
- Server can translate domain errors without each route inventing its own shape.

### 090: File Domain Extraction

File:

- `docs/plan/090-file-domain-extraction.md`

Goal:

- Move file metadata and storage policy into `@repo/file-domain`.

Scope:

- Extract file metadata validation.
- Extract file kind/storage provider/MIME/size policy.
- Define file repository interfaces.
- Keep raw storage adapters in `apps/server`.

Tests:

- Domain tests for valid and invalid file metadata.
- Server tests for upload/create-file flows that use the extracted domain.
- Typecheck server and consumers.

Acceptance:

- File business rules are outside route handlers/server services.
- Storage behavior and existing file records remain compatible.

### 091: Project, Identity, Setup, And Organization Contract Cleanup

File:

- `docs/plan/091-project-identity-setup-organization-contract-cleanup.md`

Goal:

- Centralize lower-level app shell domains before capture/content domains.

Scope:

- Extract project status and lifecycle constants/contracts.
- Preserve the User, Organization, and Org User identity split.
- Extract first-run setup request/response schemas.
- Extract auth-facing DTOs that are safe to share.
- Extract public instance status, Deployment Mode, and onboarding mode contracts where reused.
- Preserve Extension Session and Instance-first login behavior.
- Extract organization role/member/invite constants and schemas.
- Move product decisions into domain packages where useful.

Tests:

- Server route tests for public instance, setup, auth, project, and organization flows.
- Schema tests for shared contracts.
- Typecheck web/server.

Acceptance:

- Core app shell contracts are shared.
- Auth-sensitive implementation details remain server-only.
- No login/setup/project UI behavior changes.
- Owner Bootstrap and Web First-Run Setup rules remain intact.

### 092: Capture Domain Extraction

File:

- `docs/plan/092-capture-domain-extraction.md`

Goal:

- Move capture session and capture event business rules into `@repo/capture-domain`.

Scope:

- Extract capture session lifecycle rules.
- Extract capture event schemas and constants.
- Extract source asset reference validation.
- Preserve immutable capture source records.
- Preserve screenshot-first capture behavior.
- Preserve privacy defaults.

Tests:

- Domain tests for session lifecycle, event validation, ordering, completion, and privacy defaults.
- Server route tests for capture session creation/update/completion.
- Extension compile/tests for shared capture payload contracts.

Acceptance:

- Capture source records remain immutable.
- Existing extension payloads remain accepted.
- No visible extension behavior changes.

### 093: Guide Domain Extraction

File:

- `docs/plan/093-guide-domain-extraction.md`

Goal:

- Move guide generation and guide content rules into `@repo/guide-domain`.

Scope:

- Extract guide block and step contracts.
- Extract conversion from capture source material into guide structures.
- Extract validation for guide updates.
- Keep UI editor rendering unchanged.

Tests:

- Domain tests for guide generation from representative capture sessions.
- Server tests for guide creation/update/export routes where applicable.
- Web typecheck for shared guide contracts.

Acceptance:

- Existing guide output shapes remain stable.
- Guide UI renders the same data as before.

### 094: Demo Domain Extraction

File:

- `docs/plan/094-demo-domain-extraction.md`

Goal:

- Move Interactive Demo generation and validation into `@repo/demo-domain`.

Scope:

- Extract scene, hotspot, and transition constants/contracts.
- Extract generation from capture source material into demo structures.
- Extract geometry and ordering validation.
- Keep viewer/editor UI behavior unchanged.

Tests:

- Domain tests for demo generation and validation.
- Server tests for demo create/update routes.
- Web typecheck for shared demo contracts.

Acceptance:

- Existing demo response shapes remain stable.
- Hotspot and scene behavior remains unchanged.
- Package naming follows `@repo/demo-domain` while preserving Interactive Demo domain language.

### 095: Publish Domain Extraction

File:

- `docs/plan/095-publish-domain-extraction.md`

Goal:

- Move publish link and immutable snapshot rules into `@repo/publish-domain`.

Scope:

- Extract publish status/visibility/access constants.
- Extract snapshot creation policy.
- Extract public access validation.
- Extract password/expiry policy if currently implemented.
- Keep route rendering and public viewer UI unchanged.

Tests:

- Domain tests for snapshot immutability, access checks, password/expiry behavior, and public link state.
- Server tests for publish, unpublish, public resolve, and viewer access routes.
- Contract tests for public response schemas.

Acceptance:

- Published links continue resolving to immutable snapshots.
- Public API behavior remains compatible.

### 096: Server Adapter Thinning

File:

- `docs/plan/096-server-adapter-thinning.md`

Goal:

- Remove remaining domain decisions from `apps/server` after domain packages exist.

Scope:

- Move duplicated validation into shared schemas or domain policies.
- Retire route-local schemas only when the shared schema is used by the server plus another active consumer, or when the child plan documents a public API contract reason.
- Convert route handlers to orchestration/adapters.
- Standardize domain error to HTTP response mapping.
- Remove dead server-local types/constants made obsolete by shared packages.

Tests:

- Full server test suite.
- Targeted route regression tests for all touched endpoints.
- Typecheck across workspace.

Acceptance:

- Routes are thin and readable.
- Domain behavior lives in domain packages.
- API behavior remains stable.

### 097: Web Shared Contract Consumption

File:

- `docs/plan/097-web-shared-contract-consumption.md`

Goal:

- Make `apps/web` consume shared contracts/constants without changing UI.

Scope:

- Add `@repo/types` and/or `@repo/constants` dependencies to `apps/web` only when imports are introduced.
- Replace duplicated API response/request types with `@repo/types`.
- Replace duplicated fixed values with `@repo/constants`.
- Keep component props local when they are UI-only.
- Keep visual output unchanged.

Tests:

- Web typecheck.
- Existing web tests.
- Focused tests for API client or data adapters if present.

Acceptance:

- Web compiles against shared contracts.
- No markup, copy, styling, layout, or user flow changes are introduced.

### 098: Extension Shared Contract Consumption

File:

- `docs/plan/098-extension-shared-contract-consumption.md`

Goal:

- Make `apps/extension` consume shared capture/API contracts without changing extension behavior.

Scope:

- Add `@repo/types` and/or `@repo/constants` dependencies to `apps/extension` only when imports are introduced.
- Replace duplicated capture payload types with `@repo/types`.
- Replace duplicated capture/privacy constants with `@repo/constants`.
- Keep extension UI and capture semantics unchanged.

Tests:

- Extension typecheck/tests.
- Focused tests for payload builders and API calls if present.
- Server capture contract tests remain green.

Acceptance:

- Extension and server agree on capture payload contracts through shared packages.
- Existing capture behavior remains unchanged.

### 099: Contract Regression, Docs Sync, And Architecture Closeout

File:

- `docs/plan/099-contract-regression-docs-sync-and-architecture-closeout.md`

Goal:

- Verify the whole architecture track and update durable documentation.

Scope:

- Run full workspace verification.
- Review package boundaries for accidental cycles.
- Review shared exports for stability and naming consistency.
- Update `CONTEXT.md`, architecture docs, and ADR follow-ups if needed.
- Record any intentionally deferred cleanup.

Tests:

- Full workspace typecheck.
- Full backend tests.
- Web tests/typecheck.
- Extension tests/typecheck.
- Build checks where configured.

Acceptance:

- The repo has a documented shared-contract and domain-package architecture.
- No known regressions remain from this track.
- Deferred work is explicitly listed instead of being hidden in code comments.

## 10. Required Child Plan Template

Every child plan must include:

1. Goal.
2. Current state.
3. Scope.
4. Non-goals.
5. Files and packages expected to change.
6. Existing behavior to preserve.
7. Shared constants/types to add or reuse.
8. Domain logic to move or create.
9. Server adapter changes.
10. Web/extension consumer changes, if any.
11. Test plan.
12. Exact verification commands.
13. Acceptance criteria.
14. Rollback or containment notes.
15. Final output format.

Equivalent headings are acceptable, but the child plan must make each required item explicit. For example, `Objective` can cover `Goal`, `Current Baseline` can cover `Current state`, and `Expected File Touches` can cover `Files and packages expected to change`. Rollback or containment notes must be stated explicitly.

The final output for every child execution must state:

- Files changed.
- Behavior preserved.
- Tests run.
- Test results.
- Known gaps or follow-up plans.

## 11. Testing Standard

Every implementation child plan must be tested at the smallest useful level first, then at the integration level affected by the change.

Expected testing layers:

- Shared package schema tests for `@repo/types`.
- Shared package export/type tests for `@repo/constants`.
- Domain unit tests for policies, commands, queries, and errors.
- Server route tests for HTTP behavior and persistence integration.
- Web typecheck/tests for contract consumption.
- Extension typecheck/tests for capture payload contract consumption.
- Full workspace verification at major milestones.

Verification commands must use the repo's package scripts and be recorded in the child plan before implementation starts. If a package lacks a needed script, the child plan must either add one or explicitly document the alternative command used.

Known repo-level commands:

- `rtk pnpm check-types`
- `rtk pnpm lint`
- `rtk pnpm build`

Known focused app commands:

- `rtk pnpm --filter server test`
- `rtk pnpm --filter server test -- <pattern-or-file>`
- `rtk pnpm --filter server test:db`
- `rtk pnpm --filter server test:smoke`
- `rtk pnpm --filter web check-types`
- `rtk pnpm --filter web test`
- `rtk pnpm --filter extension check-types`
- `rtk pnpm --filter extension test`

Database-backed server suites must be treated carefully. When a child plan uses DB integration or smoke tests, it must document the reset/setup sequence and whether the suite needs an isolated test database state.

Current shared-package script gaps to account for:

- `@repo/types` has `build`, `lint`, and `clean`, but no `check-types` or `test` script yet.
- `@repo/constants` has `build`, `lint`, and `clean`, but its current `test` script is a placeholder that exits with failure.
- Child plans `087` and `088` must fix or explicitly route around those gaps before claiming shared-package tests as verification.

## 12. Behavior Preservation Rules

For this master track, a change is acceptable only if one of these is true:

- It preserves existing runtime behavior.
- It fixes a documented bug called out by the child plan.
- It only changes compile-time types/imports with no runtime behavior impact.
- It only updates documentation.

Required preservation checks:

- Existing route URLs remain stable.
- Existing response body shapes remain stable.
- Existing persisted enum/string values remain stable.
- Existing capture payloads remain accepted.
- Existing publish links and snapshot resolution semantics remain stable.
- Existing UI appearance remains stable.

## 13. Dependency Order

Recommended dependencies:

- `087` must land before broad constant reuse.
- `088` should land before domain packages expose public API contracts.
- `089` should land before major domain extraction.
- `090` can land before capture because capture references files/assets.
- `091` can land before or near `090` because project, identity, setup, public instance, and organization behavior are cross-cutting.
- `092` must land before guide and demo extraction.
- `093` and `094` both depend on capture contracts.
- `095` depends on guide and demo output contracts.
- `096` depends on most domain packages being in place.
- `097` and `098` should happen after the relevant shared contracts exist.
- `099` must be last.

## 14. Risk Controls

Use these controls throughout:

- No big-bang refactor.
- One domain-focused child plan at a time.
- Keep adapters in place until tests prove extracted logic is equivalent.
- Preserve route behavior before improving internals.
- Prefer moving existing logic over rewriting it.
- Extract shared constants/types only after the reuse gate is met.
- Avoid circular dependencies between packages.
- Avoid exporting server infrastructure from shared packages.
- Avoid shared packages importing app code.
- Avoid moving database identifiers into shared constants by default.
- Avoid creating candidate domain packages mechanically.
- Add package dependencies and scripts before introducing imports that rely on them.
- Keep domain packages framework-agnostic where practical.
- Leave unrelated files and user changes untouched.

## 15. Definition Of Done

This master plan is complete when:

- `@repo/constants` contains meaningful domain-grouped constants that pass the reuse gate and are used by backend and consumers.
- `@repo/types` contains meaningful Zod-backed contracts that pass the reuse gate and are used by backend and consumers.
- Major product domains have clear package boundaries.
- `apps/server` is mostly HTTP, auth, persistence, storage, and integration glue.
- `apps/web` consumes shared contracts/constants where appropriate with no UI changes.
- `apps/extension` consumes shared capture/API contracts where appropriate with no behavior changes.
- Contract and domain tests cover moved behavior.
- Full verification has been run and documented.
- Architecture docs reflect the final package responsibilities.

## 16. Immediate Next Step

Create and execute `docs/plan/087-shared-constants-foundation.md`.

That child plan should start with a repo-wide inventory of duplicated constants and enum values, confirm which values pass the reuse gate, fix the `@repo/constants` package-script gap, then make the smallest useful constants package improvement before any domain extraction begins.
