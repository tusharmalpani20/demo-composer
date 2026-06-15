# Interactive Demo Editor Portal Plan

Date: 2026-06-15

Status: Planned.

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
- create demo from capture is planned in plan 061
- project workspace currently links to capture sessions, guides, and settings

Missing:

- web routes for interactive demos
- API client helpers for interactive demo endpoints
- project demo list page
- demo editor page
- scene screenshot rendering
- scene reorder/delete UI

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

Demo list page:

- list demos for project
- show title, description, status, scene count if available
- open demo editor
- empty state points users to create a demo from a capture session

Demo editor page:

- edit demo title/description/status
- render ordered scene list
- render scene screenshot background using existing asset URL helpers
- edit scene title/description
- reorder scenes up/down
- delete scene
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

Page tests:

- project workspace links to demo list
- demo list loads and opens demos
- demo editor loads metadata and scenes
- editor updates demo metadata
- editor updates scene text
- editor reorders scenes
- editor deletes scenes
- auth failures route to login or show existing portal error pattern

## Acceptance Criteria

- user can open a project interactive demo list
- user can open an interactive demo editor
- user can see ordered screenshot scenes
- user can edit demo metadata
- user can edit scene text
- user can reorder and delete scenes
- user can navigate between project workspace, capture source, demo list, and editor

## Out Of Scope

- demo hotspots
- transitions
- public demo viewer
- demo publishing
- embed
- password protection
- lead capture
- analytics
