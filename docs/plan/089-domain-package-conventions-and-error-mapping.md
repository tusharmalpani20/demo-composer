# Domain Package Conventions And Error Mapping Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned. Expanded for implementation on 2026-07-07.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `089` of the shared contracts and domainization track.

## Objective

Define the conventions future domain package extraction plans must follow before moving business logic out of `apps/server`.

This phase should create clear, practical documentation and decision records. It should not extract a full domain, create empty package scaffolds, or introduce a broad framework before a real domain extraction needs it.

## Baseline From Completed Plans 087 And 088

Plan `087` completed and audited `@repo/constants`.

Plan `088` completed and audited `@repo/types`:

- `@repo/types` now exports runtime Zod schemas and inferred types for selected shared API contracts.
- Server routes for setup, project, capture session, and capture event use shared request/query schemas where behavior was low risk.
- Web and extension consume selected shared API types or compatibility aliases.
- Multipart upload request construction, capture asset JSON create validation, capture privacy/redaction checks, and extension-local narrowed capture request DTOs remain local.
- Closeout fixed exported capture params schemas to match current HTTP route names that use `:id`.

Carryover from `088` that this phase must explicitly address:

- HTTP adapter params may use route-local names such as `id`, while domain command/query inputs should use semantic names such as `capture_session_id`.
- `@repo/types` owns public/shared API DTOs; domain packages should not duplicate those DTOs unless they need domain-local command/input shapes.
- Response envelopes and API error shapes must remain unchanged.
- Auth/session plumbing remains server-owned until a later auth-domain plan explicitly extracts it.

Master plan section 11 still contains historical notes that `@repo/types` lacked `test`/`check-types` scripts and `@repo/constants` had a placeholder failing `test` script. Those notes are stale after the implemented `087` and `088` work. When executing this plan, trust the current package manifests and the completed child-plan closeouts over those stale baseline notes.

## Current Codebase Baseline

Runnable apps and shared packages:

```text
apps/server
apps/web
apps/extension
packages/constants
packages/types
packages/ui
packages/typescript-config
packages/eslint-config
```

No domain packages currently exist:

```text
packages/project-domain
packages/file-domain
packages/capture-domain
packages/guide-domain
packages/demo-domain
packages/publish-domain
packages/organization-domain
packages/auth-domain
packages/user-domain
packages/instance-domain
```

Current server module shape:

```text
apps/server/src/modules/<module>/<module>.routes.ts
apps/server/src/modules/<module>/<module>.service.ts
apps/server/src/modules/<module>/<module>.repository.ts
apps/server/src/modules/<module>/**/*.test.ts
```

Observed current patterns:

- Services define plain `Error` subclasses near the business logic.
- Routes define local `error_response(type, message)` helpers and `handle_domain_error` functions.
- Domain-like API errors are currently sent as:

```ts
{
  error: {
    type: string,
    message: string,
  },
}
```

- Global validation/client errors in `apps/server/src/common/helper_function/error_handler.helper.ts` use the existing legacy envelope:

```ts
{
  code: number,
  message: "error",
  path: string,
  result: Array<{ field: string; message: string; type: string }>,
  timestamp: string,
}
```

- This phase must not unify those envelopes or change existing response shapes.
- Repository adapters sometimes throw generic `Error` for persistence invariants; those should remain internal failures unless a later domain plan maps them intentionally.

## Required Source Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/087-shared-constants-foundation.md
docs/plan/088-shared-types-contract-foundation.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/adr/0019-separate-web-and-server-apps.md
```

Before implementation, run:

```text
rtk git status --short
rtk rg "@repo/types|@repo/constants" packages apps/server/src/modules
rtk rg "class .*Error|error_response|handle_domain_error|reply\\.status|throw new" apps/server/src/modules apps/server/src/common
rtk rg "export type .*Repository|export type .*AuthContext|Normalized|build_.*service" apps/server/src/modules
```

Record any uncommitted work from other agents that touches docs or server/shared package files. Do not overwrite or revert unrelated work.

## Implementation Scope

Included:

- Document domain package structure conventions.
- Document command/query naming conventions.
- Document repository interface conventions.
- Document actor/context conventions.
- Document test fixture conventions for future domain packages.
- Document domain-local type and schema ownership rules.
- Document domain error shape and error-code conventions.
- Document how server adapters map domain errors to existing API responses.
- Document HTTP adapter versus domain command/query boundaries, including route param naming.
- Update stale architecture docs that still describe `@repo/types` as a placeholder.
- Add an ADR for domain package and error mapping conventions if implementation confirms the convention is durable enough to record as an architectural decision.

Explicit non-scope:

- No domain package extraction.
- No creation of all candidate domain packages.
- No empty package or folder scaffolding.
- No package runtime helper unless implementation proves immediate reuse and tests it.
- No route URL changes.
- No request/response shape changes.
- No auth/session behavior changes.
- No permission behavior changes.
- No database schema or migration changes.
- No frontend, extension, UI, browser, or public viewer behavior changes.
- No conversion of all existing service `Error` classes in one pass.
- No replacement of global Fastify/Zod error handling.
- No movement of `@repo/types` public API DTOs into domain packages.

## Exact Affected Files

Expected docs-only implementation files:

```text
docs/plan/089-domain-package-conventions-and-error-mapping.md
docs/system-design-pattern.md
docs/adr/0020-domain-package-conventions-and-error-mapping.md
```

Only touch these if implementation adds a minimal helper after proving documentation is insufficient:

```text
packages/domain-errors/package.json
packages/domain-errors/tsconfig.json
packages/domain-errors/src/index.ts
packages/domain-errors/src/domain-error.ts
packages/domain-errors/src/domain-error.test.ts
pnpm-lock.yaml
apps/server/package.json
apps/server/src/common/domain-error-mapping.ts
apps/server/src/common/domain-error-mapping.test.ts
```

Do not touch route files, service files, repository files, web files, or extension files in this phase unless the plan is amended first with a specific reason and targeted verification.

## Planned Implementation Mode

Default implementation mode: documentation-only.

Reason:

- Current routes have working explicit `instanceof` mappings.
- No domain packages exist yet.
- A generic helper would be premature before the first real domain extraction proves the call sites.

If an implementer believes a helper is necessary, they must first document:

- the duplicated code it removes;
- the exact routes it will not change;
- the tests proving identical response status and body;
- why waiting until the first domain extraction would be riskier.

## Implementation Steps

1. Re-read the required source docs and run the baseline search commands above.
2. Confirm the worktree state and record any unrelated uncommitted changes that could affect docs, shared packages, or server error handling.
3. Update `docs/system-design-pattern.md` so it reflects that `@repo/constants` and `@repo/types` are now active shared foundation packages after plans `087` and `088`.
4. Add or update an ADR for durable domain package and domain error mapping conventions if the convention is stable enough to record. Use `docs/adr/0020-domain-package-conventions-and-error-mapping.md` unless that number has already been used by the time implementation starts.
5. Keep this plan updated during implementation with checklist status, implementation log, verification notes, and leftovers.
6. Do not create runtime package files unless the optional-helper criteria above are satisfied first.
7. Run the verification commands that match the actual implementation path.
8. Update the parent master plan only for completed phase items; do not mark later domain extraction phases complete.

## Domain Package Naming Rules

Use package names from the master plan:

```text
@repo/project-domain
@repo/file-domain
@repo/capture-domain
@repo/guide-domain
@repo/demo-domain
@repo/publish-domain
@repo/organization-domain
@repo/user-domain
@repo/auth-domain
@repo/instance-domain
```

Rules:

- Use `@repo/demo-domain` as the package name for Interactive Demo behavior.
- Preserve product terms in code and docs: `Interactive Demo`, `Demo Scene`, `Demo Hotspot`, `Demo Transition`.
- Do not create a package until a child plan moves real behavior into it.
- Do not create placeholder folders.
- Domain packages should depend on `@repo/constants` and `@repo/types` only when they genuinely need shared constants or public API contracts.
- Domain packages must not depend on `apps/server`, `apps/web`, `apps/extension`, Fastify, React, database clients, or storage SDKs.

## Domain Package Folder Rules

Use folders only when the package has behavior that belongs there:

```text
packages/<domain>-domain/
  package.json
  tsconfig.json
  README.md
  src/
    index.ts
    commands/
    queries/
    repositories/
    policies/
    errors/
    schemas/
    types/
    __tests__/
```

Folder ownership:

- `commands/`: write workflows, state changes, lifecycle transitions.
- `queries/`: read assembly that contains domain decisions.
- `repositories/`: interfaces consumed by commands/queries, not SQL implementations.
- `policies/`: deterministic business decisions and validation policies.
- `errors/`: typed domain failures.
- `schemas/`: domain-local validation schemas that are not public API contracts.
- `types/`: domain-local types that are not public API DTOs.
- `__tests__/`: domain behavior tests.

Do not add folders such as `commands/` or `policies/` until at least one real file belongs in them.

## Command And Query Conventions

Commands:

- Own write workflows and domain mutations.
- Use verb phrases:
  - `create_capture_session`
  - `complete_capture_session`
  - `reorder_capture_events`
  - `publish_guide`
- Accept one input object.
- Include actor/context explicitly.
- Return domain results, not Fastify replies.
- Throw typed domain errors or return a typed result pattern chosen by the implementing child plan.

Queries:

- Own read workflows only when read assembly includes domain decisions.
- Use read phrases:
  - `get_capture_session_detail`
  - `list_project_guides`
  - `get_publish_link_snapshot`
- Accept one input object.
- Include actor/context explicitly when authorization or organization scoping matters.
- Return domain records or DTO-like domain read models, not HTTP envelopes.

Adapter boundary:

- HTTP route params can keep existing names such as `id`.
- Server adapters translate HTTP params into semantic domain input names:

```ts
// HTTP adapter
request.params.id -> capture_session_id

// Domain input
{
  project_id: string;
  capture_session_id: string;
}
```

- Do not force public route param names into domain package naming.
- Do not rename current routes just to match domain terminology.

## Actor And Context Conventions

Use explicit actor/context objects rather than passing raw sessions through domain packages.

Current server examples:

```text
ProjectAuthContext
CaptureSessionAuthContext
CaptureEventAuthContext
GuideAuthContext
PublishAuthContext
```

Future domain convention:

```ts
export type DomainActor = {
  organization_id: string;
  actor_org_user_id: string;
};
```

Rules:

- Use `organization_id` for tenant scope.
- Use `actor_org_user_id` when an Organization Member/Org User performs the action.
- Keep User, Organization, and Org User concepts distinct.
- Do not pass cookies, JWTs, Fastify requests, or session tokens into domain packages.
- Auth/session lookup remains in `apps/server` until auth-domain work explicitly extracts it.
- Permission decisions may become domain policies only when they are product rules; HTTP authentication remains server adapter work.

## Repository Interface Conventions

Repository interfaces inside domain packages should:

- use domain language;
- hide SQL, table names, schema names, and joins;
- expose methods needed by commands/queries;
- return domain-ready records or nullable/domain result values;
- accept one input object per method;
- keep transaction boundaries explicit;
- avoid importing `pg`, `pg-promise`, Fastify, storage SDKs, web, or extension code.

Server repository adapters should:

- live in `apps/server` until a child plan proves shared persistence adapter code is useful;
- implement domain repository interfaces;
- own SQL and database client details;
- translate database rows into domain records;
- keep internal persistence failures as unhandled/internal errors unless a domain-specific recovery path exists.

Transaction convention:

```ts
export type ExampleRepository = ExampleTransactionalRepository & {
  transaction: <Result>(
    work: (repository: ExampleTransactionalRepository) => Promise<Result>
  ) => Promise<Result>;
};
```

This mirrors existing server service patterns in setup, capture asset, publish, and organization invite modules.

## Test Fixture Conventions

Future domain packages should keep fixtures close to the domain tests that need them.

Rules:

- Put reusable domain test builders under `packages/<domain>-domain/src/__tests__/fixtures/` only after at least two tests need the same setup.
- Prefer small builder functions over large static object dumps.
- Use domain language in fixture names, such as `build_capture_session`, `build_publish_link`, or `build_demo_scene`.
- Keep HTTP request fixtures in server route tests, not domain packages.
- Keep database row fixtures in server repository/adapter tests, not domain packages.
- Keep browser, extension, and React component fixtures out of domain packages.
- Fixture defaults must use exported constants from `@repo/constants` when the values are shared product constants.
- Fixture types may use `@repo/types` API DTOs only when the fixture is intentionally modeling an API boundary. Domain behavior tests should prefer domain-local command/query input and read-model types.
- Do not use fixtures to hide required actor/context setup. Actor and tenant scope should remain explicit in each test or builder call.

## Type And Schema Ownership Rules

`@repo/types` owns:

- shared public API request schemas;
- shared public API response schemas;
- shared route params/query schemas when they cross app/package boundaries or define public API behavior;
- inferred API DTO types from those schemas.

Domain packages own:

- domain command inputs when they differ from HTTP requests;
- domain read models when they differ from API responses;
- repository interfaces;
- policy inputs/results;
- domain-local schemas not consumed directly by clients.

`apps/server` owns:

- HTTP adapter types that include Fastify specifics;
- auth/session request context;
- multipart parsing;
- storage adapter inputs;
- database row types and SQL mapping details.

Rules:

- Do not duplicate `@repo/types` public API DTOs in domain packages.
- Do not import React component props into shared or domain packages.
- Do not export database row shapes from domain packages.
- Keep extension-only narrowed request types local unless a later child plan creates a shared contract for them.

## Domain Error Convention

Future domain packages should use typed domain errors with stable codes.

Recommended shape:

```ts
export type DomainErrorStatusHint =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "gone"
  | "payload_too_large"
  | "not_implemented"
  | "internal";

export type DomainErrorInput = {
  code: string;
  message: string;
  status_hint: DomainErrorStatusHint;
  cause?: unknown;
  details?: unknown;
};
```

Rules:

- Error `code` should match existing API `error.type` strings when replacing a current route mapping.
- Error `message` must be safe for API clients if the server adapter sends it.
- Error details should not be sent to clients by default.
- Domain packages must not know HTTP numeric status codes.
- Domain packages must not import Fastify.
- Server adapters map `status_hint` to HTTP status and existing response body shape.
- Do not expose database errors, stack traces, storage keys, raw input values, passwords, tokens, or secrets.

Current API error body to preserve for domain errors:

```ts
{
  error: {
    type: error.code,
    message: safe_message,
  },
}
```

Status hint mapping convention:

```text
bad_request       -> 400
unauthorized     -> 401
forbidden        -> 403
not_found        -> 404
conflict         -> 409
gone             -> 410
payload_too_large -> 413
not_implemented  -> 501
internal         -> 500
```

Do not apply this mapping to global Fastify/Zod validation errors in this phase.

## Existing Error Code Inventory To Preserve

This plan does not require moving these errors yet, but future domain plans should preserve their public `error.type` and status unless they explicitly document a bug fix.

Common authenticated route error:

- `unauthenticated`: 401

This remains server-owned for now. Domain packages should not require session objects or produce this error unless a later auth-domain plan explicitly moves authentication behavior.

Project:

- `project_name_conflict`: 409
- `project_slug_conflict`: 409
- `project_not_found`: 404
- `empty_project_update`: 400

Capture session:

- `project_not_found`: 404
- `capture_session_not_found`: 404
- `capture_session_not_completable`: 400
- `invalid_capture_session_completion`: 400
- `empty_capture_session_update`: 400
- `invalid_capture_session`: 400

Capture event:

- `project_not_found`: 404
- `capture_session_not_found`: 404
- `capture_asset_not_found`: 404
- `capture_event_not_found`: 404
- `invalid_capture_event`: 400
- `invalid_capture_event_order`: 400
- `capture_event_reorder_not_allowed`: 409
- `capture_event_update_not_allowed`: 409
- `capture_event_index_conflict`: 409

Capture asset/file upload:

- `capture_session_not_found`: 404
- `project_not_found`: 404
- `capture_asset_not_found`: 404
- `unsupported_capture_asset_type`: 400
- `invalid_capture_asset`: 400
- `invalid_capture_asset_upload`: 400
- `unsupported_capture_asset_upload_type`: 400
- `upload_file_required`: 400
- `upload_too_large`: 413
- `file_bytes_not_found`: 404
- `unsupported_file_storage_provider`: 400
- `file_storage_write_failed`: 500
- `file_storage_key_conflict`: 409

Organization invite:

- `unauthenticated`: 401
- `invite_permission_denied`: 403
- `duplicate_active_invite`: 409
- `invite_not_found`: 404
- `invite_existing_user_login_required`: 401
- `invite_email_mismatch`: 403
- `invite_already_accepted`: 409
- `invite_revoked`: 410
- `invite_expired`: 410

Publish:

- `project_not_found`: 404
- `guide_not_found`: 404
- `interactive_demo_not_found`: 404
- `guide_not_publishable`: 409
- `guide_has_no_publishable_blocks`: 400
- `interactive_demo_has_no_publishable_scenes`: 400
- `invalid_publish_access_settings`: 400
- `invalid_publish_password_settings`: 400
- `publish_link_not_found`: 404
- `publish_link_not_public`: 403
- `publish_link_expired`: 410
- `publish_link_password_required`: 401
- `invalid_public_viewer_password`: 400
- `published_asset_not_found`: 404
- unsupported published asset storage provider errors currently map to 501.

Guide and interactive demo have larger error inventories. The implementation of this plan should document the convention and require later guide/demo child plans to inventory their full mapping before extraction.

## Server Error Mapping Rules

Server adapters should:

- catch domain errors at the route or server service adapter boundary;
- map them to the existing `{ error: { type, message } }` body;
- preserve current status codes;
- throw unknown errors so the global error handler logs and returns the existing internal error envelope;
- keep auth/session errors server-owned until auth-domain work says otherwise;
- keep permission-sensitive messages stable and user-safe.

Do not:

- convert global validation errors to the domain error body;
- convert all existing routes mechanically;
- change public viewer access behavior;
- change password/session/invite security behavior;
- move file storage adapter failures into domain packages unless file-domain work owns that mapping.

## Routes And API Contracts

No route URLs, methods, request bodies, response bodies, or error envelopes should change in this phase.

Routes to use as reference examples only:

```text
apps/server/src/modules/project/project.routes.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/organization/organization-invites.routes.ts
apps/server/src/modules/publish/publish.routes.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
```

The implementation should not edit these route files unless it adds a tested helper under the optional-helper path.

## Security And Permission Rules

- Preserve all current auth requirements.
- Preserve organization/project scoping.
- Preserve owner-only invite management behavior.
- Preserve publish access, password, expiration, and viewer-session behavior.
- Preserve first-run setup and owner bootstrap safety.
- Do not expose raw domain error `details` or `cause` to clients.
- Do not log secrets, passwords, session tokens, storage keys, or raw captured input values.
- Capture privacy/redaction rules stay with capture-domain/privacy plans, not this convention phase.

## Migration And Backwards Compatibility

- No database migration is required.
- No API migration is required.
- No frontend, extension, or browser migration is required.
- Existing server route tests should continue to pass if no code helper is added.
- Existing shared API contracts from `@repo/types` remain the source of truth for selected public DTOs.
- Existing route-local error mapping remains valid until each domain extraction replaces it intentionally with tests.
- If an ADR is added, it records conventions only; it does not supersede previous ADRs unless explicitly stated.

## Rollback And Containment Notes

- Documentation-only changes can be reverted independently of runtime code because they do not alter package exports, route behavior, database schema, or app behavior.
- If an optional helper is added and verification fails, revert the helper package/server adapter changes first and keep the docs/ADR convention updates only if they still describe the intended future direction.
- Do not partially migrate a route to a helper without route tests proving unchanged status codes and response bodies.
- Do not mark the parent master plan phase complete until this child plan has implementation status, verification notes, and any deferred follow-up captured.
- If implementation uncovers a convention that conflicts with existing ADRs, stop and amend the plan or ADR before touching runtime code.

## Test And Verification Plan

Documentation-only implementation:

```text
rtk pnpm check-types
```

If `docs/system-design-pattern.md` or an ADR is updated only, no runtime tests are required.

If a helper package or server mapping helper is added:

```text
rtk pnpm --filter <new-helper-package> lint
rtk pnpm --filter <new-helper-package> test
rtk pnpm --filter <new-helper-package> check-types
rtk pnpm --filter <new-helper-package> build
rtk pnpm --filter server test -- project capture-session capture-event
rtk pnpm --filter server check-types
rtk pnpm check-types
```

Helper tests must prove:

- domain error creation preserves code/message/status hint;
- server mapping returns the same status and body as the replaced route-local mapping;
- unknown errors are not swallowed;
- `details` and `cause` are not included in client responses.

## Agent-Browser Validation

Browser validation is not required for the intended documentation-only implementation.

If implementation unexpectedly changes frontend, extension, public viewer, route behavior, or runtime API behavior, stop and amend this plan first. Any amended browser validation must specify exact flows and should cover the affected app route or extension workflow.

## Acceptance Criteria

- `docs/plan/089-domain-package-conventions-and-error-mapping.md` is updated with implementation status, checklist, implementation log, verification notes, and leftovers when executed.
- `docs/system-design-pattern.md` no longer states that `@repo/types` is only a placeholder; it reflects the post-088 shared contracts package role.
- A durable convention is recorded in `docs/adr/0020-domain-package-conventions-and-error-mapping.md` if implementation confirms an ADR is appropriate.
- Future domain child plans have concrete package structure, command/query, repository, actor/context, schema/type ownership, and error mapping rules.
- The route-param boundary from 088 is documented: HTTP adapters may use route names such as `id`, while domain inputs use semantic names.
- Existing API error response shapes and status codes are preserved.
- No domain packages are created without real behavior.
- No UI, frontend, extension, browser, database, route, auth, permission, or public viewer behavior changes.

## Handoff Notes For Implementer

- Treat this as a convention-setting phase, not a refactor phase.
- Prefer docs and ADR updates over code helpers.
- If a helper seems useful, prove it with tests before applying it to any route.
- Do not update every route's error handling in this phase.
- Carry the route-param naming boundary into every later domain extraction plan.
- Carry the current error-code inventory into domain-specific child plans before moving behavior.
- Keep `@repo/types` public API DTOs separate from domain command/query input types.

## Final Output Required

When executing this plan, report:

- docs and ADR files changed;
- whether any runtime helper was intentionally skipped or added;
- exact conventions added;
- verification commands run and results;
- any domain-specific error inventories deferred to later plans;
- anything that should carry into `090-file-domain-extraction.md`.
