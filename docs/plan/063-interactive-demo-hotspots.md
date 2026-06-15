# Interactive Demo Hotspots Plan

Date: 2026-06-15

Status: Planned.

## Goal

Add the minimum hotspot model and editor behavior needed for screenshot-first interactive demos.

Target model:

```text
demo scene
  -> one or more hotspots
  -> hotspot can show info or move to another scene
```

This is the point where the demo product starts to become Storylane-like instead of just a slideshow.

## Current Baseline

Already built or planned:

- interactive demo and scene backend foundation
- create demo from capture
- portal demo editor with scene screenshot rendering

Missing:

- hotspot table
- hotspot APIs
- hotspot editor UI
- normalized positioning rules
- transition behavior

## Scope

Database:

Create:

```text
interactive_demo_schema.demo_hotspot
```

Recommended fields:

```text
id
organization_id
project_id
interactive_demo_id
demo_scene_id
hotspot_type click | info | next
label nullable
content nullable
x numeric between 0 and 1
y numeric between 0 and 1
width numeric between 0 and 1
height numeric between 0 and 1
target_scene_id nullable
hotspot_index
is_deleted
deleted_at
deleted_by_id
version
created_by_id
updated_by_id
created_at
updated_at
```

Backend APIs:

```http
POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots
PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id
PUT /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/order
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id
```

Portal editor:

- display hotspot overlays on scene screenshot
- add hotspot by drawing/selecting a rectangle
- edit hotspot label/content/type
- choose target scene for click/next hotspots
- move/resize hotspot with simple controls if drag handles are too large for first slice
- delete hotspot
- keep coordinates normalized relative to displayed screenshot

## Domain Rules

- hotspots belong to scenes
- hotspot coordinates are normalized numbers from `0` to `1`
- hotspot target scene must belong to the same interactive demo
- `info` hotspots can have content without a target scene
- `click` or `next` hotspots should have a target scene unless the public viewer defaults to next ordered scene
- deleting a scene should soft-delete or invalidate its hotspots through query scoping

## Tests

DB tests:

- creates hotspot table and constraints
- rejects out-of-range coordinates
- rejects target scenes from another demo/project

Service/repository tests:

- create/list/update/reorder/delete hotspots
- validate scene/demo/project ownership
- validate target scene ownership
- reject invalid empty order/duplicate order

Route tests:

- auth and domain error mapping
- stable payload shapes

Web tests:

- renders hotspot overlays on scene screenshot
- creates hotspot from editor
- edits label/content/type/target
- deletes hotspot
- rejects invalid local coordinates before submit when possible

## Acceptance Criteria

- user can add hotspots to demo scenes
- hotspots render over screenshots in the editor
- hotspots can point to another scene
- hotspot data is org/project/demo scoped
- normalized coordinates survive responsive rendering

## Out Of Scope

- public demo viewer behavior beyond data shape preparation
- analytics
- advanced animations
- branching map visualization
- auto-generated hotspots
- HTML element replay
