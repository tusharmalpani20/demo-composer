# Create Interactive Demo From Capture Plan

Date: 2026-06-15

Status: Implemented.

## Goal

Create the first usable bridge from capture source material into the Storylane-style interactive demo product:

```text
capture session
  -> create interactive demo
  -> create ordered demo scenes from screenshot-backed capture events
  -> user opens demo editor
```

The backend already has draft interactive demos and ordered scenes. This plan adds the conversion workflow from capture sessions.

## Current Baseline

Already built:

- capture sessions
- capture assets
- capture events
- guide creation from capture
- interactive demo draft metadata APIs
- demo scene create/list/update/reorder/delete APIs

Missing:

- create demo from capture API
- conversion service from capture events to demo scenes
- web API client and route parsing support for the created demo destination
- portal action to create a demo from a capture session, once the portal has a valid interactive demo route
- project-level demo list/editor entry point

## Scope

Backend:

- add authenticated endpoint:

```http
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos
```

- validate capture session belongs to current organization/project
- validate capture session is not deleted
- read ordered capture events
- include only screenshot-backed events for the first slice
- create an interactive demo with:
  - `source_capture_session_id`
  - title derived from capture session name
  - description derived from capture session description when present
- create ordered demo scenes from capture events:
  - `source_capture_session_id`
  - `source_capture_event_id`
  - `source_capture_asset_id`
  - `background_capture_asset_id`
  - `scene_index`
  - title from event text/page title/fallback
  - description nullable
- return created demo and scenes or a route path to the editor

Web/portal foundation:

- add web API client helper for the create-from-capture endpoint
- add route parser support for `/projects/:project_id/interactive-demos/:interactive_demo_id`
- do not expose the capture-session detail button until the portal can render a real interactive demo destination
- plan 062 should add the project-level demo list/editor route and then wire the visible capture-detail action

## Sequencing Note

This plan is implemented before plan 062 as a backend/API-client foundation slice. It must not ship a portal button that redirects to a route the portal cannot render. The implementation order is:

```text
061 backend conversion endpoint
  -> 061 web API client + route parser support
  -> 062 demo list/editor route
  -> 062 capture-detail action enabled
```

## Recommended API Response

```json
{
  "interactive_demo": {},
  "demo_scenes": [],
  "redirect_path": "/projects/:project_id/interactive-demos/:interactive_demo_id"
}
```

## Domain Rules

- capture source material remains immutable
- demo scenes copy references to capture source rows but do not mutate them
- scene order follows capture event order
- events without screenshot assets are skipped in this first slice
- creating multiple demos from one capture session is allowed
- generated demo remains editable independently from the capture session
- demo scene source references must point to rows in the same organization/project/capture session
- generated scene background assets must be screenshot capture assets
- conversion should be transactional: either the demo and all generated scenes are created, or none are
- repeated conversion creates a new independent demo and scenes

## Tests

Backend service tests:

- creates a demo from screenshot-backed capture events in order
- skips events without screenshot assets
- rejects missing/deleted capture session
- rejects capture session from another project/org
- rejects capture session with no usable screenshot-backed events
- rolls back demo creation if scene generation fails
- validates source capture assets belong to the same capture session

Backend route tests:

- authenticated create route maps successful response
- unauthenticated request returns 401
- domain errors map to stable API errors

DB integration tests:

- creates demo and scenes from real capture session/event/asset rows
- verifies scene source references and background screenshot references
- verifies repeated conversion creates a new independent demo

Web tests:

- API client posts to the create-from-capture endpoint and encodes IDs
- route parser recognizes interactive demo detail routes
- capture session detail does not expose the create demo action until plan 062 adds a renderable destination route

## Acceptance Criteria

- [x] a completed or manual capture session can become an interactive demo draft
- [x] demo scenes are ordered and screenshot-backed
- [x] no capture source rows are mutated
- [x] API returns a route-safe `redirect_path` for the future editor/detail destination
- [x] conversion is covered by service, route, DB, and portal tests
- [x] no partially-created demo remains after conversion failure

## Implementation Notes

- Added `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos`.
- The conversion derives demo title/description from the source capture session.
- The conversion skips capture events without active screenshot assets.
- Demo + scene creation is repository-transactional.
- Added web API client support and route parsing for future interactive demo detail routes.
- The capture-session detail page intentionally does not expose the visible create-demo action until plan 062 adds a renderable destination page.

## Out Of Scope

- hotspots
- transitions
- public demo viewer
- interactive demo publishing
- visible portal create-demo button
- interactive demo list/editor UI
- selected capture event filtering
- HTML replay
- branching flows
- analytics
