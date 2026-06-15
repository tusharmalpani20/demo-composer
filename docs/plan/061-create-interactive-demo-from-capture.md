# Create Interactive Demo From Capture Plan

Date: 2026-06-15

Status: Planned.

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
- portal action to create a demo from a capture session
- project-level demo list entry point

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

Portal:

- add "Create interactive demo" action on capture session detail
- disable action when no screenshot-backed capture events exist
- after creation, navigate to the new interactive demo editor route from plan 062
- if plan 062 is not implemented yet, navigate to a temporary demo detail/read page or project demo list once available

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

## Tests

Backend service tests:

- creates a demo from screenshot-backed capture events in order
- skips events without screenshot assets
- rejects missing/deleted capture session
- rejects capture session from another project/org
- rejects capture session with no usable screenshot-backed events

Backend route tests:

- authenticated create route maps successful response
- unauthenticated request returns 401
- domain errors map to stable API errors

DB integration tests:

- creates demo and scenes from real capture session/event/asset rows
- verifies scene source references and background screenshot references
- verifies repeated conversion creates a new independent demo

Web tests:

- capture session detail shows create demo action
- action handles loading/success/failure states
- action navigates to the resulting demo route

## Acceptance Criteria

- a completed or manual capture session can become an interactive demo draft
- demo scenes are ordered and screenshot-backed
- no capture source rows are mutated
- user can reach the created demo from the portal
- conversion is covered by service, route, DB, and portal tests

## Out Of Scope

- hotspots
- transitions
- public demo viewer
- interactive demo publishing
- HTML replay
- branching flows
- analytics
