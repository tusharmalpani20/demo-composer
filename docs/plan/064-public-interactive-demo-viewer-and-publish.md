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
- interactive demo hotspots

Missing:

- interactive demo snapshot generation
- public interactive demo read model
- public viewer route
- public embed route
- authenticated publish controls for demos
- demo asset access through publish snapshot

## Dependencies

This plan depends on:

- plan 062 for a portal demo editor surface
- plan 063 for hotspot data if the first public viewer must be interactive

If plan 063 has not landed, this plan should be reduced to a linear slideshow publish/viewer and explicitly defer hotspots. The preferred v1 path is to implement plan 063 first.

## Scope

Backend:

- extend publish module for `interactive_demo`
- build immutable demo snapshot JSON from:
  - demo metadata
  - ordered scenes
  - scene background screenshot assets
  - hotspots
  - target scene references
- include a snapshot schema version for future migration
- ensure published demo assets are only readable if referenced by accessible active snapshot
- reuse publish link access controls:
  - public/restricted
  - expiry
  - password protection
  - revoke
- add authenticated demo publish status and publish/republish endpoints
- add public demo resolve endpoint
- add public asset authorization for interactive demo snapshots without weakening guide asset checks

Recommended routes:

```http
POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/access
PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/password
DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish
GET /api/v1/public/publish-links/:slug
POST /api/v1/public/publish-links/:slug/viewer-sessions
GET /api/v1/public/publish-links/:slug/assets/:asset_id/file
```

Public interactive demo routes should reuse the existing generic public publish-link resolver rather than add a second public backend namespace. The web app owns the artifact-specific route shape (`/d/:slug`, `/d/:slug/embed`) and renders only when the resolved `artifact_type` is `interactive_demo`.

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
- clicking an info hotspot opens inline content without changing scene
- support next/back navigation for linear fallback
- show scene title/description
- handle missing/revoked/restricted/expired/password-required states
- compact embed mode
- preserve existing guide public routes and guide publish behavior while extending the shared publish surface

## Snapshot Rules

- published snapshots are immutable
- draft edits do not change public output until republished
- snapshot stores enough scene/hotspot/image reference data to render without querying mutable draft tables
- public asset reads are constrained to snapshot-referenced files
- snapshot includes only non-deleted scenes and hotspots
- snapshot should fail validation if it has no scenes
- target scene IDs in hotspots should be rewritten or validated against snapshot scene IDs
- snapshot scene and hotspot IDs may remain draft IDs in v1, but public viewer logic must only use the immutable snapshot payload and never query draft tables
- asset URLs in the snapshot should use `/api/v1/public/publish-links/:slug/assets/:asset_id/file`, matching guide snapshots

## Tests

Backend tests:

- snapshot generation includes scenes/hotspots/assets
- snapshot generation rejects demos with no scenes
- snapshot generation rejects demos whose scenes have no screenshot assets
- publish/republish creates immutable snapshots
- public resolver returns accessible snapshots
- revoked/restricted/expired/password-protected links behave like guide links
- public asset reads are denied when asset is not in snapshot
- guide public asset authorization remains unchanged
- authenticated publish status/access/password/revoke routes work for interactive demos

Web tests:

- demo viewer renders first scene and hotspots
- hotspot click navigates to target scene
- info hotspot content renders without navigation
- next/back navigation works
- password gate works
- embed mode renders compact chrome-free layout
- editor publish controls show status and copy/open URLs

## Acceptance Criteria

- authenticated user can publish an interactive demo
- authenticated user can republish, revoke, and configure public/restricted/password/expiry settings for an interactive demo link
- public user can view a published demo
- public user can click hotspots to move between scenes
- demo snapshots are immutable
- password/expiry/revoke behavior matches guide publishing semantics
- embed route exists
- publishing does not expose draft-only or unrelated project assets

## Out Of Scope

- analytics
- lead capture
- custom branding
- animations beyond basic transitions
- advanced branching map editor
- HTML replay
