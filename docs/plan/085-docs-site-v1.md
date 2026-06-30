# Docs Site V1 Plan

Date: 2026-06-23

Status: Completed with follow-up notes.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 8 of the alpha follow-through master plan.

## Goal

Resolve the `apps/docs` starter-content gap.

Target outcome:

```text
new contributor or self-host evaluator opens docs surface
  -> sees current alpha positioning
  -> finds setup, operations, screenshots, roadmap, and contribution links
  -> does not mistake starter content for product documentation
```

## Current Baseline

`apps/docs` remains starter content. Master plan `001` intentionally left it parked while README and markdown docs carried the real alpha documentation.

Plan `084` completed a production environment report and left broader self-host operations work open. Those ops leftovers should appear here only as current alpha limitations or links back to operations docs; they should not become new tooling in this docs-site phase.

## Scope

Decide and implement one path:

1. Turn `apps/docs` into a real docs/product site.
2. Keep `apps/docs` parked and make that status explicit everywhere.
3. Remove `apps/docs` from active app positioning.

If building the docs site, initial content should cover:

- alpha overview
- self-hosting quickstart
- operations and production readiness
- screenshots and dogfood evidence
- roadmap and known limitations
- contributing links

Selected path:

- build a real, small docs/product hub in `apps/docs`
- keep markdown files such as `README.md`, `docs/self-hosting.md`, `docs/operations.md`, and `docs/production-readiness-checklist.md` as source-of-truth deep dives
- surface current alpha limitations, including the self-host ops carry-forward from plan `084`
- avoid inventing hosted SaaS positioning or broad documentation IA

Carry-forward from plan `084`:

- storage inventory/cleanup, backup rehearsal, packaging, shared rate limiting, object storage, and dependency audit accepted-risk workflow remain future ops work
- this docs-site pass may describe those limitations but must not implement ops tooling

## Implementation Result

Completed on 2026-06-30 local time.

This phase was implemented as the selected real docs/product hub path.

Implementation result:

- replaced the default Turborepo/Next starter page in `apps/docs`
- added a compact alpha docs hub with current positioning, capabilities, source-doc links, safe screenshot evidence, and visible alpha limitations
- kept markdown docs as source-of-truth deep dives by linking to repository source docs instead of duplicating every document in the app
- surfaced the plan `084` self-host operations leftovers as limitations only
- updated docs app metadata, docs app README, root README, contributor guide, project status, and roadmap to stop describing `apps/docs` as parked starter content
- added focused docs content tests

Verification run:

```bash
rtk pnpm --filter docs test
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
rtk pnpm --filter docs build
rtk git diff --check
```

Results:

- docs content suite passed with 4 tests
- docs typecheck passed
- docs lint passed
- docs production build passed
- whitespace check passed

Missed or deferred work to keep as follow-up candidates:

- richer docs navigation structure
- search
- docs versioning
- deployment and canonical URL decision for `apps/docs`
- automatic ingestion of markdown docs instead of curated links
- deeper docs IA and content ownership model

## Explicit Non-Goals

- hosted SaaS marketing site
- full documentation information architecture rewrite
- duplicating every markdown doc manually
- hiding alpha limitations
- custom branding work

## Expected File Touches

Likely:

```text
apps/docs/
README.md
docs/project-zoomout-status.md
docs/roadmap.md
docs/oss-alpha-summary.md
docs/plan/085-docs-site-v1.md
docs/plan/master/002-alpha-follow-through-master-plan.md
```

Conditional:

```text
package.json
turbo.json
docs/assets/alpha/
```

## Implementation Plan

### 1. Decide Docs Site Direction

- [x] Audit `apps/docs`.
- [x] Check README and status docs for references to docs surfaces.
- [x] Decide build, park, or remove from positioning: build a small docs/product hub.
- [x] Record rationale in this plan before implementation.

### 2. If Building A Real Site

- [x] Replace starter content.
- [x] Add alpha overview.
- [x] Link to self-hosting and operations docs.
- [x] Link to production readiness checklist.
- [x] Add screenshot/evidence section using safe existing assets.
- [x] Add roadmap and known limitations.
- [x] Add contribution links.
- [x] Keep claims aligned with README.

### 3. If Parking The Site

- [x] Add clear parked/starter status in `apps/docs`. Not applicable; selected path built the docs hub.
- [x] Ensure README does not direct users there as real docs. README now points to the docs app overview and source docs.
- [x] Record when a future docs-site plan should reopen it. Not applicable; selected path built the docs hub.

### 4. If Removing From Positioning

- [x] Remove public references that imply `apps/docs` is ready. Not applicable; selected path built the docs hub.
- [x] Keep package/workspace structure unchanged unless separately approved.
- [x] Document why it remains in the repo.

### 5. Verify And Track

- [x] Run docs app tests/build if touched.
- [x] Run repo docs checks.
- [x] Update project status docs.
- [x] Add implementation notes to this plan.
- [x] Update master plan phase tracking after completion.

## Testing Plan

Likely commands if `apps/docs` changes:

```bash
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
rtk pnpm --filter docs build
rtk git diff --check
```

If package scripts differ, inspect `apps/docs/package.json` and use the available commands.

## Acceptance Criteria

- `apps/docs` no longer looks accidentally unfinished to contributors.
- README and status docs point to the correct docs surface.
- Alpha limitations remain visible.
- Existing markdown docs remain the source of truth unless a deliberate docs-site content path is implemented.

## Follow-Up Notes

If a real docs site is built, consider a later plan for navigation structure, search, versioning, and deployment. Do not mix that into this first docs-site cleanup.
