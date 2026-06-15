# Docs Freshness And Status Sync Plan

Date: 2026-06-16

Status: Planned.

## Goal

Bring the project documentation back in sync with the implementation after plans `060` through `066`.

The codebase has moved faster than the repo-wide docs. Several public-facing and internal status documents still describe interactive demos, organization invites, automatic extension capture, and production hardening as missing or deferred even though those slices have landed.

Target outcome:

```text
new reader opens repo
  -> README describes the real current product
  -> status docs match implemented guide/demo/extension/org/hardening features
  -> route inventory matches current backend
  -> old "not built yet" claims are removed or narrowed
  -> future plans are easier to choose from factual status
```

This is a documentation correctness pass, not a new feature pass.

## Why This Comes Next

Plans `060-066` completed major product and OSS-readiness work:

- automatic click capture MVP
- interactive demo generation from capture
- interactive demo editor
- demo hotspots
- public interactive demo viewer and publish controls
- organization member invites
- production hardening

The current docs still contain stale statements, especially:

- `README.md` says Storylane-style interactive demos are not built.
- `CONTRIBUTING.md` says Storylane-style interactive demos are deferred from the MVP.
- `docs/project-zoomout-status.md` lists organization invites, public interactive demos, and interactive demo editor pieces as missing.
- `docs/backend-route-inventory.md` does not reflect newer health/readiness, org invite, and interactive demo publishing routes.
- `docs/plan/049-project-settings-archive-portal.md` still says `Planned` even though project settings/archive UI exists.

Leaving those stale makes the project look less complete than it is and weakens OSS launch readiness.

## Current Baseline

Already current enough:

- `apps/extension/README.md` correctly describes automatic click capture plus manual screenshot fallback.
- `docs/operations.md` reflects production hardening from plan `066`.
- `docs/production-readiness-checklist.md` includes health/readiness, rate limits, and operations expectations.
- Plans `060-066` have accurate implementation notes and completed statuses.

Stale or incomplete:

- root `README.md`
- `CONTRIBUTING.md`
- `docs/project-zoomout-status.md`
- `docs/backend-route-inventory.md`
- `docs/product-idea.md` may need a small "current implementation status" pointer, while preserving the original product concept.
- `docs/plan/049-project-settings-archive-portal.md` status and implementation notes

## Scope

### README

Update root `README.md` to describe the real alpha product:

- screenshot-first browser workflow capture
- automatic click capture in Chrome extension
- manual screenshot capture fallback
- Scribe-style guides
- Storylane-style interactive demos
- public guide/demo publishing
- self-hosted alpha positioning
- AI, analytics, lead capture, custom branding, HTML replay, and hosted SaaS remain deferred

Add a concise "What works today" section:

- first-run setup
- auth/session
- projects
- capture sessions
- extension automatic click capture
- manual portal upload
- guide editor/preview/publish/export
- interactive demo editor/hotspots/publish/viewer
- org invites
- production hardening basics

Add a concise "Known limitations" section:

- no one-command production packaging yet
- no Chrome Web Store packaging
- no HTML capture/replay
- no analytics/lead capture
- no drag handles/advanced demo branching
- no automated retention cleanup
- self-host focused, alpha quality

### CONTRIBUTING

Update `CONTRIBUTING.md` scope notes:

- remove the claim that Storylane-style interactive demos are deferred from the current MVP
- clarify that AI, analytics, sales tracking, lead capture, HTML replay, and advanced demo polish remain deferred
- clarify that new work should generally start from a `docs/plan/` entry
- mention docs freshness as part of PR expectations when behavior changes

### Project Zoom-Out Status

Update `docs/project-zoomout-status.md` to reflect current reality:

- mark automatic extension click capture as built at MVP level
- mark interactive demo generation/editor/hotspots/publish/public viewer as built at MVP level
- mark organization member invites as built
- mark production hardening as built
- remove stale "not built yet" entries that now exist
- keep remaining gaps clear:
  - dogfood smoke suite
  - docs polish
  - alpha launch polish
  - extension reliability polish
  - guide/editor usability polish
  - interactive demo usability polish
  - HTML replay deferred
  - analytics/lead capture deferred
  - one-command self-host packaging deferred

### Backend Route Inventory

Update `docs/backend-route-inventory.md`:

- add `/healthz`
- add `/readyz`
- add organization member/invite route group
- add interactive demo scene/hotspot route group if missing
- add interactive demo publish routes
- add public publish resolver as shared guide/demo route
- note rate-limited route groups from plan `066`
- keep legacy-route removal notes but avoid making the inventory look frozen at plan `047`

### Product Idea

Do not rewrite the original product thesis. Add a short status note or pointer near the top:

- current alpha has implemented screenshot-first guide and interactive demo paths
- HTML replay, AI, analytics, and sales-oriented features remain future work
- canonical current status lives in `docs/project-zoomout-status.md`

### Plan 049 Status

Update `docs/plan/049-project-settings-archive-portal.md`:

- change status from `Planned` to implemented/completed
- add implementation notes that project settings/archive portal behavior landed
- add verification notes only if recoverable from current tests/docs without inventing commands
- avoid broad rewriting of the long original plan

## Explicit Non-Goals

- Do not implement product behavior.
- Do not add screenshots or marketing assets in this plan; that belongs to plan `069`.
- Do not write the end-to-end dogfood suite; that belongs to plan `068`.
- Do not claim flows have been manually dogfooded unless plan `068` has produced that evidence.
- Do not add Docker app packaging or one-command self-hosting.
- Do not change architecture decisions unless docs currently contradict implemented decisions.

## Relationship To Plans 068 And 069

This plan makes docs truthful.

Plan `068` should then prove the important v1 flows against a real local/self-host-style setup and record any limitations found.

Plan `069` should use both this factual docs refresh and the smoke evidence from plan `068` to make the public alpha launch materials credible.

## Implementation Order

1. Update root README to describe current alpha capabilities and limitations.
2. Update `CONTRIBUTING.md` scope notes.
3. Update `docs/backend-route-inventory.md` from current `apps/server/src/app.ts` route registration and module route files.
4. Update `docs/project-zoomout-status.md` from current plans `060-066` and current app/module surfaces.
5. Add a small current-status pointer to `docs/product-idea.md` if it reads as outdated.
6. Update `docs/plan/049-project-settings-archive-portal.md` status and implementation notes.
7. Run markdown/text checks available in the repo and at least `rtk git diff --check`.

## Acceptance Criteria

- README no longer says interactive demos are not built.
- CONTRIBUTING no longer says Storylane-style interactive demos are deferred from the current MVP.
- README and status docs avoid claiming "v1-ready" or "production-ready" without pointing to alpha limitations and smoke-suite follow-up.
- project zoom-out status correctly lists:
  - automatic extension click capture as implemented
  - interactive demo generation/editor/hotspots/public publish as implemented
  - organization invites as implemented
  - production hardening as implemented
- backend route inventory includes health/readiness, org invites, and interactive demo publish/public routes.
- plan `049` no longer incorrectly says `Planned`.
- docs still clearly label the project as alpha.
- docs clearly state deferred areas:
  - AI
  - analytics
  - lead capture
  - HTML replay
  - one-command self-host packaging
  - advanced demo/editor polish
- no source code behavior changes are made.
- working tree passes `rtk git diff --check`.

## Suggested Commit Shape

Recommended commits:

1. `Update README and contribution scope`
2. `Refresh project status and route docs`
3. `Mark project settings plan implemented`

If the changes are small enough, commits 2 and 3 can be combined.

## Out Of Scope

- screenshots/GIFs
- issue templates
- launch roadmap polish
- public demo assets for README
- browser-based smoke automation
- CI changes
- release tagging
