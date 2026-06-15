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

Already built:

- interactive demo and scene backend foundation
- create demo from capture
- portal demo editor with scene screenshot rendering

Missing:

- hotspot table
- hotspot APIs
- hotspot editor UI
- normalized positioning rules
- draft transition metadata for later public viewer behavior

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
- add hotspot with a default rectangle and numeric normalized controls
- edit hotspot label/content/type
- choose target scene for click/next hotspots
- move/resize hotspot with simple numeric controls; drag handles remain out of scope for this first slice
- delete hotspot
- keep coordinates normalized relative to displayed screenshot
- expose scene-level hotspot lists that plan 064 can snapshot without querying multiple draft tables directly from public routes

## Domain Rules

- hotspots belong to scenes
- hotspot coordinates are normalized numbers from `0` to `1`
- hotspot target scene must belong to the same interactive demo
- `info` hotspots can have content without a target scene
- `click` and `next` hotspots may have a target scene; if omitted, later viewer work can default to the next ordered scene
- deleting a scene should soft-delete or invalidate its hotspots through query scoping
- hotspots are draft data until plan 064 snapshots them into published demos
- hotspot order is stable per scene
- overlapping hotspots are allowed for v1 unless testing shows bad UX

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
- returns hotspots in stable scene order for read models

Route tests:

- auth and domain error mapping
- stable payload shapes

Web tests:

- renders hotspot overlays on scene screenshot
- creates hotspot from editor
- edits label/content/type/target
- deletes hotspot
- rejects invalid local coordinates before submit when possible
- uses normalized percentage styles so overlay position is independent of displayed screenshot size

## Acceptance Criteria

- user can add hotspots to demo scenes
- hotspots render over screenshots in the editor
- hotspots can point to another scene
- hotspot data is org/project/demo scoped
- normalized coordinates survive responsive rendering
- the demo editor can fetch scenes with their hotspots for later preview/publish work

## Out Of Scope

- public demo viewer behavior beyond data shape preparation
- analytics
- advanced animations
- branching map visualization
- auto-generated hotspots
- HTML element replay
- keyboard-only hotspot drawing polish
