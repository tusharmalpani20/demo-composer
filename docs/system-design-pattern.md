# Demo Composer System Design Pattern

## Purpose

This document records how Demo Composer v2 should be written if we restart the implementation.

The agreed direction is to use the engineering style from ORCA as a reference, but not copy ORCA's procurement, AP, approval, communication, or agent complexity.

The goal is to build Demo Composer as a clean, domain-driven monorepo where the core product concepts are explicit:

- Captures are reusable source material.
- Guides are Scribe-style document artifacts.
- Interactive demos are Storylane-style walkthrough artifacts.
- Publishing is a shared concern.
- The Chrome extension, web app, future desktop app, and public viewers all speak to the same backend contracts.

## Decision

We should be willing to scrap most of the current Demo Composer v2 implementation and rebuild the project structure deliberately.

The current repo is still early enough that a clean architecture pass is cheaper than slowly bending the starter code and old backend ideas into the correct shape.

The old v1 backend proved the rough product flow:

```text
Project -> Demo -> Flow -> Page -> Widget
```

That was useful for learning, but v2 should not keep `page` and `widget` as vague universal concepts.

V2 should split the product into:

```text
Project
  Capture Sessions
    Capture Events
    Capture Assets

  Guides
    Guide Blocks
    Guide Steps
    Guide Annotations

  Interactive Demos
    Demo Scenes
    Demo Hotspots
    Demo Navigation
```

## What We Should Copy From ORCA

We should copy the engineering discipline, not the product domain.

Good ORCA patterns to use:

- pnpm/Turborepo monorepo.
- `apps/*` for runnable applications.
- `packages/*` for shared contracts, domain logic, UI, and tooling.
- Fastify backend.
- Zod schemas as shared API contracts.
- Constants/enums/table names in a dedicated package.
- Domain packages for business behavior.
- Thin server modules that adapt HTTP to domain commands/queries.
- SQL migrations as the database source of truth.
- Migration comments that explain domain boundaries.
- Integration tests through public APIs.
- Feature-based frontend structure.
- Shared UI primitives.
- Clear separation between source capture data and composed artifacts.

## What We Should Not Copy From ORCA

ORCA is much bigger than Demo Composer needs to be at the start.

Do not copy these into the first version:

- Agent runtime.
- Agent worker.
- Communication channel worker.
- Gmail/Outlook/WhatsApp sync.
- AP approval workflow complexity.
- AP control exception model.
- Procurement-specific document matching.
- Too many lifecycle states.
- Too many domain packages before the product model stabilizes.

Demo Composer may eventually need background workers for thumbnails, HTML snapshot processing, video/GIF export, or analytics aggregation. Those should be added only when the main capture and editor flows need them.

## Initial Monorepo Shape

Current core structure:

```text
apps/
  server/
  web/
  extension/

packages/
  constants/
  types/
  ui/
  typescript-config/
  eslint-config/

  file-domain/
  capture-domain/
  guide-domain/
  demo-domain/
  publish-domain/
```

Possible later additions:

```text
apps/
  asset-worker/
  desktop/

packages/
  project-domain/
  organization-domain/
  auth-domain/
  instance-domain/
  asset-domain/
  analytics-domain/
  export-domain/
```

Do not create the later packages until the need is concrete.

## Core Rule

Business behavior belongs in domain packages.

The backend should follow this call flow:

```text
HTTP route/controller
  -> server service adapter
  -> domain command/query
  -> repository/SQL
```

The server should not directly own core product rules.

For example:

- The server should not manually decide how a guide is created from capture events.
- The server should not manually reorder guide blocks with raw SQL.
- The server should not manually decide whether a published link is accessible.
- The Chrome extension should not write final guide/demo structures directly.

Those rules belong in domain packages.

## Package Responsibilities

### `apps/server`

Owns:

- Fastify application setup.
- Auth middleware and request context.
- CORS/cookies/multipart setup.
- OpenAPI/Scalar documentation.
- Route registration.
- HTTP request validation through shared Zod schemas.
- Mapping domain errors to API responses.
- Calling domain commands and queries.

Does not own:

- Core capture rules.
- Guide composition rules.
- Demo navigation rules.
- Publish access rules.
- Direct SQL for aggregates that have a domain package.

### `apps/web`

Owns:

- Product dashboard.
- Project workspace.
- Capture session viewer.
- Guide editor.
- Interactive demo editor.
- Published guide preview.
- Published demo preview.
- Account/project settings.

Frontend structure should be feature-based:

```text
src/features/<feature>/
  api/
  components/
  hooks/
  stores/
  types/
  utils/
```

API modules should export:

- query key factories
- plain request functions
- React Query hooks
- feature-facing request/response types

### `apps/extension`

Owns:

- Chrome extension UI.
- Start/stop capture controls.
- Screenshot capture.
- Optional HTML snapshot capture.
- Click/input/navigation event capture.
- Element metadata capture.
- Sending capture data to the backend.

Does not own:

- Full guide editor.
- Full interactive demo editor.
- Publishing.
- Final artifact business rules.

### `packages/types`

Owns shared runtime API contracts that pass the reuse gate.

Current role:

- Export Zod schemas plus inferred TypeScript types for selected public/shared API contracts.
- Keep server-only route schemas local until another active app/package needs them or the contract defines public API behavior.
- Keep domain command/query inputs in domain packages when they differ from HTTP requests.
- Keep DB-shaped row types inside the backend module or adapter that owns the table/query.
- Avoid recreating the old broad shared package surface with contact, OTP, signup, user-asset, or unrelated product-domain schemas.

Active contract areas include common API primitives, public instance status, first-run setup, auth, organization, project, capture session/event/asset DTOs, guide DTOs, interactive demo DTOs, and publish/public snapshot DTOs.

Do not put React component props, Fastify request types, database row types, storage adapter inputs, or auth/session internals in this package.

### `packages/constants`

Owns shared product constants that pass the reuse gate.

Current role:

- Export stable domain-grouped arrays/objects for values reused by active apps/packages or public contracts.
- Keep module-specific constants inside the owning app/module.
- Prefer product-current names such as capture, guide, publish, and interactive demo.
- Do not put backend table names, old validation messages, broad product-domain enums, or behavior functions here by default.
- Avoid legacy constants for OTP, contacts, profile pictures, user assets, and unrelated organization role surfaces.

Active constant areas include project status, capture session status/source type, capture event type, capture asset/file storage values, guide values, interactive demo values, publish values, organization values, and setup/instance mode values.

### `packages/ui`

Owns low-level reusable UI primitives.

Examples:

- buttons
- inputs
- dialogs
- sheets
- menus
- tabs
- tooltips
- tables
- badges

Product-specific editor components should stay in `apps/web/src/features/*` until they are genuinely reusable.

### `packages/file-domain`

Owns reusable file and storage metadata decisions that are safe outside the server adapter.

Current responsibilities:

- file metadata validation
- storage provider validation
- non-negative file size policy
- screenshot upload policy inputs shared by capture asset handling

Does not own raw storage adapters, SQL repositories, multipart parsing, or API response DTOs.

### Future `packages/project-domain`

Project behavior is not currently extracted into a package. If it becomes complex enough to justify a domain package, it should own project-level behavior.

Likely responsibilities:

- create project
- update project
- archive/delete project
- list project workspaces
- enforce organization ownership
- project-level settings

### `packages/capture-domain`

Owns reusable captured source material.

Likely responsibilities:

- create capture session
- finish/cancel capture session
- append capture event
- store capture asset metadata
- validate capture ownership
- query capture timelines
- preserve screenshot/HTML metadata

Capture source data should be reusable and mostly immutable once recorded.

### `packages/guide-domain`

Owns Scribe-style guide behavior.

Likely responsibilities:

- create guide from capture session
- create guide from scratch
- add/update/delete/reorder guide blocks
- manage guide steps
- manage guide annotations
- duplicate guide
- validate guide ownership
- prepare published guide snapshot

Guide concepts should be first-class:

- `guide`
- `guide_block`
- `guide_step`
- `guide_annotation`

Do not model these as generic widgets.

### `packages/demo-domain`

Owns Storylane-style interactive demo behavior.

Likely responsibilities:

- create interactive demo from capture session
- create scenes from capture assets
- add/update/delete/reorder scenes
- add/update/delete hotspots
- define next-scene navigation
- validate demo ownership
- prepare published demo snapshot

Interactive demo concepts should be first-class:

- `interactive_demo`
- `demo_scene`
- `demo_hotspot`
- `demo_transition`

Do not reuse guide steps for interactive demo scenes.

### `packages/publish-domain`

Owns publishing behavior shared by guides and demos.

Likely responsibilities:

- create publish link
- revoke publish link
- resolve publish link
- enforce visibility/access rules
- track published version target
- support internal/public/password/expiring links later

Publishing should be generic enough to attach to either:

- guide
- interactive demo

## Domain Package Structure

Each domain package should follow a small version of the ORCA pattern:

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

Add folders only when the domain has real behavior for them.

Examples:

- publish access policy
- guide block reorder policy
- demo navigation validation policy
- capture data sensitivity policy

Do not add folders because the pattern says so. Add them when they carry real behavior.

## Command And Query Rules

Commands own writes.

Commands should:

- open transactions when multiple rows must change together
- enforce business rules
- call repository mutation helpers
- return domain results
- throw typed domain errors

Queries own reads.

Queries should:

- assemble read models
- apply organization/project scoping
- return DTO-ready data
- avoid mutating state

Repositories own SQL.

Repositories should:

- be boring
- use parameterized SQL
- avoid business decisions
- accept a transaction client for mutation helpers when needed

## Server Module Pattern

Server modules should look like:

```text
apps/server/src/modules/<domain>/
  <domain>.routes.ts
  <domain>.service.ts
  <domain>.repository.ts
  <domain>.*.test.ts
```

Do not add new code under the removed legacy `apps/server/src/module/*` tree. Use `model/` only if the domain has not been moved into a package yet.

For new core domains, prefer no server `model/` folder. Persistence should live in the domain repository or a package repository when the domain is extracted.

The server service should:

- convert request context into a domain actor
- call domain commands/queries
- normalize dates or response details if needed
- map typed domain errors into the existing API response shape for that route

The controller should stay thin:

- read request params/body/query
- call service
- pass response through the shared response handler

The router should:

- declare method/path
- attach tags/descriptions
- attach Zod request schemas
- attach Zod response schemas

## Database Migration Pattern

SQL migrations should be treated as architecture documents.

Each important table should include comments explaining:

- what the table owns
- what the table does not own
- why the table exists
- how it relates to nearby concepts
- which future features are intentionally deferred

Example topics that need clear comments:

- `capture_session` is source material, not a guide or demo.
- `capture_asset` stores screenshot/HTML facts, not annotation behavior.
- `guide_step` is document reading structure.
- `demo_scene` is interactive navigation structure.
- `publish_link` is access/publishing state, not the artifact itself.

## Testing Pattern

Tests should verify behavior through public interfaces.

Preferred tests:

- server integration tests through Fastify routes
- domain command/query tests when the behavior is pure or transaction-heavy
- frontend API wiring tests with fetch stubs
- frontend page/component tests through Testing Library
- extension capture tests around message/event contracts

Avoid tests that:

- mock internal collaborators unnecessarily
- assert private implementation details
- duplicate implementation logic
- only test that a function was called

For backend behavior, the strongest tests should read like:

- "creates a capture session for an authenticated organization user"
- "creates guide steps from selected capture events"
- "prevents guide access across organizations"
- "publishes a guide link and resolves it without auth when public"
- "creates demo scenes from capture assets"
- "rejects hotspot navigation to a scene in another demo"

## Initial MVP Build Order

Recommended initial implementation order:

1. Workspace reset and package scaffolding.
2. Auth/organization/user foundation.
3. Project domain.
4. Capture domain with screenshot asset upload.
5. Chrome extension minimum capture flow.
6. Guide domain.
7. Guide editor and viewer.
8. Publish links for guides.
9. Interactive demo domain.
10. Demo editor and viewer.
11. Publish links for demos.

This order prioritizes internal documentation first, which matches the current product direction.

## Deferred Work

Do not build these until the core guide/demo flow is real:

- analytics
- lead capture
- desktop app
- HTML replay engine
- GIF/video export
- PDF export
- custom domains
- advanced permissions
- team comments
- branching demo flows
- background asset worker

## Short Version

Demo Composer v2 should be rebuilt as a domain-driven monorepo.

Use ORCA as the engineering blueprint:

- clear app/package boundaries
- domain packages for business behavior
- shared Zod contracts
- thin Fastify adapters
- documented SQL migrations
- integration-first tests
- feature-based frontend

But keep the first version much smaller than ORCA.

The most important product boundary is:

```text
capture source data is shared
guide artifacts and interactive demo artifacts are separate
```
