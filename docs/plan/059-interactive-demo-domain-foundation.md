# Interactive Demo Domain Foundation Plan

Date: 2026-06-15

Status: Implemented.

Plan number note: this plan was renamed from `058-interactive-demo-domain-foundation.md` to `059-interactive-demo-domain-foundation.md` because `058-extension-automatic-event-capture-roadmap.md` already exists.

## Goal

Start the Storylane-style product path by adding the backend domain foundation for interactive demos, separate from guides.

Target long-term flow:

```text
capture session
  -> create interactive demo
  -> scenes reference screenshot or HTML capture assets
  -> hotspots guide viewer interactions
  -> transitions move between scenes
  -> publish immutable interactive demo snapshot
  -> public viewer plays a guided demo
```

This plan is the first interactive-demo slice after OSS hardening. It should establish the domain model and API foundation, not a full editor/viewer yet.

## Why This Comes After OSS Hardening

The guide product is already usable enough to prove the capture-to-doc path. Before opening a second product family, the repo should be:

- safe for self-host first-run setup
- config hardened
- cleaned of AI/legacy leftovers
- documented for OSS use
- honest about extension capture behavior

Interactive demos add a new artifact type with different editing and publishing rules. Starting it before hardening would make cleanup harder and blur product scope.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/system-design-pattern.md
docs/adr/0001-single-product-context-with-domain-packages.md
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
```

Important implications:

- interactive demos are not guides
- do not reuse guide blocks as demo scenes
- capture sessions remain source material
- original capture assets are immutable
- screenshot-first is acceptable for the first demo foundation
- HTML replay remains deferred
- AI remains deferred
- published interactive demos should eventually use immutable snapshots

## Current State

Already available:

- `project`
- `capture_session`
- `capture_asset`
- `capture_event`
- `file`
- `published_artifact.artifact_type` already allows `interactive_demo`
- `publish_link.artifact_type` already allows `interactive_demo`

Missing:

- interactive demo tables
- interactive demo routes
- interactive demo service/repository
- create demo from capture session
- scene model
- hotspot model
- transition model
- portal demo list/editor
- public demo viewer
- demo publish snapshot generation

## Scope

Included in this first foundation slice:

- add DB migration for interactive demo draft tables
- add backend module skeleton under `apps/server/src/modules/interactive-demo`
- add create/list/get/update/delete APIs for interactive demo draft metadata
- add scene foundation schema and APIs:
  - create scene
  - list scenes
  - update scene
  - reorder scenes
  - delete scene
- add service/repository tests
- add route tests
- add DB integration tests
- add route inventory docs
- update project zoom-out status

Recommended first slice should stop before portal UI unless the backend foundation is unusually small.

Excluded:

- portal interactive demo editor
- public interactive demo viewer
- publishing interactive demos
- hotspot implementation
- transition implementation
- analytics
- lead capture
- HTML replay
- branching editor UI
- AI scene generation
- extension automatic click capture
- demo theming/branding

## Proposed Domain Model

Recommended tables:

```text
interactive_demo_schema.interactive_demo
interactive_demo_schema.demo_scene
```

Reserve the domain language for future tables:

```text
interactive_demo_schema.demo_hotspot
interactive_demo_schema.demo_transition
```

Do not create hotspot or transition tables in this first implementation unless we deliberately expand the plan before coding. The first foundation should produce draft demos and ordered scenes only.

### Interactive Demo

Fields:

```text
id
organization_id
project_id
source_capture_session_id nullable
title
description nullable
status draft | archived
is_deleted
deleted_at
deleted_by_id
version
created_by_id
updated_by_id
created_at
updated_at
```

### Demo Scene

Fields:

```text
id
organization_id
project_id
interactive_demo_id
source_capture_session_id nullable
source_capture_event_id nullable
source_capture_asset_id nullable
scene_index
title nullable
description nullable
background_capture_asset_id nullable
is_deleted
version
created_by_id
updated_by_id
created_at
updated_at
```

For screenshot-first demos, each scene can reference a screenshot capture asset as its background.

### Demo Hotspot

Deferred from this first implementation, but the likely model is:

Fields:

```text
id
organization_id
project_id
interactive_demo_id
demo_scene_id
label nullable
hotspot_type click | info | next
x
y
width
height
content JSONB nullable
hotspot_index
is_deleted
version
created_by_id
updated_by_id
created_at
updated_at
```

Coordinates should be normalized percentages or image-relative pixels. Recommendation: normalized percentages for responsive display:

```text
x, y, width, height numeric between 0 and 1
```

### Demo Transition

Deferred from this first implementation, but the likely model is:

Fields:

```text
id
organization_id
project_id
interactive_demo_id
from_scene_id
hotspot_id nullable
to_scene_id
transition_type click | auto | next
is_deleted
created_by_id
updated_by_id
created_at
updated_at
```

For the first foundation, transitions are deferred and scenes are ordered linearly.

## API Foundation

Recommended authenticated endpoints:

```http
POST /api/v1/projects/:project_id/interactive-demos
GET /api/v1/projects/:project_id/interactive-demos
GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id
```

Scene endpoints for this slice:

```http
POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes
GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes
PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
PUT /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/order
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id
```

Scene endpoints are part of this plan, not optional, unless the implementation pass explicitly splits them into a follow-up plan before coding.

All routes must:

- require authenticated portal session
- scope by current organization
- return 404 for cross-org access
- ignore client-supplied organization/audit fields
- not mutate capture source rows
- follow current module patterns

## Create From Capture Session

This may be a separate follow-up plan, but the foundation should not block it.

Future endpoint:

```http
POST /api/v1/projects/:project_id/interactive-demos/from-capture-session/:capture_session_id
```

Suggested behavior:

- create draft interactive demo
- create one scene per screenshot-backed capture event
- scene background asset comes from capture asset
- linear scene order follows capture event order
- hotspots can be generated later from click metadata

If included in this slice, keep it deterministic and screenshot-only.

## Test Plan

Backend tests:

```text
apps/server/src/modules/interactive-demo/interactive-demo.service.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.app.integration.test.ts
apps/server/src/modules/interactive-demo/interactive-demo.db.integration.test.ts
```

Migration tests:

```text
apps/server/src/db/foundation-schema.db.integration.test.ts
```

Test cases:

- migration creates demo tables and constraints
- authenticated user creates demo under current organization/project
- list returns only current org/project demos
- get returns demo detail
- update changes title/description/status and increments version
- delete soft-deletes demo
- cross-org access returns 404
- deleted project access returns 404
- scene creation validates screenshot asset belongs to same project/org
- scene ordering remains contiguous if scene endpoints are included
- no hotspot or transition APIs are exposed yet

Run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server test:db
rtk pnpm check-types
rtk pnpm lint
```

## Risks

- It is easy to overbuild the demo editor too early. Keep this phase backend/domain-first.
- Hotspot coordinate design matters. Pick normalized coordinates unless there is a strong reason to use pixels.
- Publishing already accepts `interactive_demo` as an artifact type, but snapshot generation should not be wired until a real demo read model exists.
- HTML replay should stay deferred; use screenshot scenes first.
- Creating hotspot/transition tables too early may lock in the wrong interaction model. Defer them until the scene API and first portal viewer/editor plans clarify behavior.

## Commit Strategy

Suggested commits:

1. `Add interactive demo schema foundation`
2. `Add interactive demo backend API`
3. `Add interactive demo scene foundation`
4. `Document interactive demo foundation status`

Scene foundation remains in this plan because scenes are the minimum useful interactive-demo domain object. Hotspots, transitions, publishing, and portal UI remain deferred.

## Acceptance Criteria

- interactive demo draft records exist in the DB
- authenticated API can create/list/get/update/archive demos and ordered scenes
- all demo records are organization/project scoped
- capture source rows remain immutable
- tests cover service, routes, app mounting, and DB behavior
- no hotspot/transition API is required in this phase
- no portal UI is required for this first foundation unless explicitly added during implementation

## Implementation Notes

Implemented:

- `interactive_demo_schema.interactive_demo`
- `interactive_demo_schema.demo_scene`
- `apps/server/src/modules/interactive-demo`
- authenticated demo create/list/get/update/archive APIs
- authenticated scene create/list/update/reorder/archive APIs
- screenshot-background validation against capture assets in the same organization/project
- route inventory and project zoom-out updates

Intentionally deferred:

- create demo from capture session
- hotspots
- transitions
- demo publishing
- portal editor/viewer
- public demo reader

Verification run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server test:db
rtk pnpm check-types
rtk pnpm lint
```
