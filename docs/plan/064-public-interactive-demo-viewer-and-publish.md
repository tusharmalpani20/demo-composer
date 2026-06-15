# Public Interactive Demo Viewer And Publish Plan

Date: 2026-06-15

Status: Planned.

## Goal

Make interactive demos publishable and viewable outside the authenticated portal.

Target flow:

```text
interactive demo draft
  -> publish immutable demo snapshot
  -> stable public link
  -> public viewer renders scenes and hotspots
  -> viewer can move through the demo
```

This is the minimum Storylane-style external artifact loop.

## Current Baseline

Already built:

- guide publishing with immutable snapshots
- publish links
- public guide reader
- public embed reader
- password-protected public guide links
- `published_artifact.artifact_type` and `publish_link.artifact_type` support `interactive_demo`
- interactive demo draft/schema foundation
- planned hotspots

Missing:

- interactive demo snapshot generation
- public interactive demo read model
- public viewer route
- public embed route
- authenticated publish controls for demos
- demo asset access through publish snapshot

## Scope

Backend:

- extend publish module for `interactive_demo`
- build immutable demo snapshot JSON from:
  - demo metadata
  - ordered scenes
  - scene background screenshot assets
  - hotspots
  - target scene references
- ensure published demo assets are only readable if referenced by accessible active snapshot
- reuse publish link access controls:
  - public/restricted
  - expiry
  - password protection
  - revoke
- add authenticated demo publish status and publish/republish endpoints
- add public demo resolve endpoint

Recommended routes:

```http
POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish-status
PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish-link
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish-link
GET /api/v1/public/interactive-demos/:slug
POST /api/v1/public/interactive-demos/:slug/password
```

Portal:

- add publish controls to interactive demo editor
- open/copy public demo URL
- copy embed iframe snippet
- show stale-draft cue after changes
- reuse existing publish access controls where practical

Public web:

Routes:

```text
/d/:slug
/d/:slug/embed
```

Viewer behavior:

- render current scene screenshot
- render hotspots
- clicking hotspot moves to target scene
- support next/back navigation for linear fallback
- show scene title/description
- handle missing/revoked/restricted/expired/password-required states
- compact embed mode

## Snapshot Rules

- published snapshots are immutable
- draft edits do not change public output until republished
- snapshot stores enough scene/hotspot/image reference data to render without querying mutable draft tables
- public asset reads are constrained to snapshot-referenced files

## Tests

Backend tests:

- snapshot generation includes scenes/hotspots/assets
- publish/republish creates immutable snapshots
- public resolver returns accessible snapshots
- revoked/restricted/expired/password-protected links behave like guide links
- public asset reads are denied when asset is not in snapshot

Web tests:

- demo viewer renders first scene and hotspots
- hotspot click navigates to target scene
- next/back navigation works
- password gate works
- embed mode renders compact chrome-free layout
- editor publish controls show status and copy/open URLs

## Acceptance Criteria

- authenticated user can publish an interactive demo
- public user can view a published demo
- public user can click hotspots to move between scenes
- demo snapshots are immutable
- password/expiry/revoke behavior matches guide publishing semantics
- embed route exists

## Out Of Scope

- analytics
- lead capture
- custom branding
- animations beyond basic transitions
- advanced branching map editor
- HTML replay
