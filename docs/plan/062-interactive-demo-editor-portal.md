# Interactive Demo Editor Portal Plan

Date: 2026-06-15

Status: Completed.

## Goal

Make interactive demos visible and editable in the portal so the Storylane-style product has a real user surface.

Target first editor loop:

```text
project workspace
  -> interactive demos list
  -> demo editor
  -> ordered screenshot scenes
  -> edit title/description
  -> reorder/delete scenes
```

This phase should make demos inspectable and editable, but not yet interactive for public viewers.

## Current Baseline

Already built:

- backend interactive demo metadata APIs
- backend demo scene APIs
- create demo from capture via `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos`
- web API helper and route parsing for interactive demo detail routes from plan 061
- project workspace currently links to capture sessions, guides, and settings

Missing:

- web route parsing and rendering for project interactive demo list routes
- API client helpers for list/get/update/archive demo and scene edit endpoints
- project demo list page
- demo editor page
- scene screenshot rendering
- scene reorder/delete UI
- visible capture-session action to create an interactive demo and open the editor

## Dependency On Plan 061

Plan `061-create-interactive-demo-from-capture` is implemented. This phase should therefore expose the capture-session "Create interactive demo" action and redirect to the new editor route returned by the API.

## Scope

Routes:

```text
/projects/:project_id/interactive-demos
/projects/:project_id/interactive-demos/:interactive_demo_id
```

API client helpers:

- list interactive demos
- get interactive demo
- update interactive demo
- archive interactive demo
- list scenes
- update scene
- reorder scenes
- delete scene
- create demo from capture if plan 061 is already implemented

Project workspace:

- add an "Interactive demos" workspace action

Capture session detail:

- replace the current hidden/non-exposed create interactive demo state with a real action
- show a pending state while the conversion runs
- navigate to the returned editor route on success
- show validation/API errors without losing the capture detail view

Demo list page:

- list demos for project
- show title, description, status, scene count if available
- open demo editor
- empty state points users to create a demo from a capture session

Demo editor page:

- edit demo title/description/status
- render ordered scene list
- render scene screenshot background using existing asset URL helpers
- handle scenes without a background screenshot with a stable placeholder
- edit scene title/description
- reorder scenes up/down
- delete scene
- show empty state when a demo has no scenes
- show source capture metadata when present
- link back to source capture session when available

## UX Boundaries

Keep this editor utilitarian. It should feel like an operational editor, not a landing page.

Do not build:

- hotspot authoring
- public preview
- publishing controls
- analytics panels
- decorative hero sections

## Tests

API tests:

- interactive demo API helpers call expected endpoints
- asset URL helper works for scene screenshots

Route tests:

- route parser handles demo list and editor routes
- App renders demo list and editor routes

Page tests:

- project workspace links to demo list
- demo list loads and opens demos
- demo editor loads metadata and scenes
- editor updates demo metadata
- editor updates scene text
- editor reorders scenes
- editor deletes scenes
- editor handles no-scene and no-screenshot states
- auth failures route to login or show existing portal error pattern
- capture session detail creates an interactive demo and navigates to the editor

## Acceptance Criteria

- [x] user can open a project interactive demo list
- [x] user can open an interactive demo editor
- [x] user can create an interactive demo from a capture session and land in the editor
- [x] user can see ordered screenshot scenes
- [x] user can edit demo metadata
- [x] user can edit scene text
- [x] user can reorder and delete scenes
- [x] user can navigate between project workspace, capture source, demo list, and editor
- [x] empty and missing-screenshot states are clear and do not break layout

## Implementation Notes

- Added project interactive demo list and interactive demo editor portal routes.
- Added web API helpers for interactive demo list/get/update/archive and scene list/update/reorder/delete.
- Added project workspace navigation and capture-session create-demo action.
- Added App route wiring for demo list and editor routes.
- Added web tests for API helpers, route parsing, App routing, workspace links, capture conversion, list page, and editor page.

## Out Of Scope

- demo hotspots
- transitions
- public demo viewer
- demo publishing
- embed
- password protection
- lead capture
- analytics
