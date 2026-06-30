# Docs Site V1 Plan

Date: 2026-06-23

Status: Planned; rechecked and narrowed for implementation.

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

- [ ] Replace starter content.
- [ ] Add alpha overview.
- [ ] Link to self-hosting and operations docs.
- [ ] Link to production readiness checklist.
- [ ] Add screenshot/evidence section using safe existing assets.
- [ ] Add roadmap and known limitations.
- [ ] Add contribution links.
- [ ] Keep claims aligned with README.

### 3. If Parking The Site

- [ ] Add clear parked/starter status in `apps/docs`.
- [ ] Ensure README does not direct users there as real docs.
- [ ] Record when a future docs-site plan should reopen it.

### 4. If Removing From Positioning

- [ ] Remove public references that imply `apps/docs` is ready.
- [ ] Keep package/workspace structure unchanged unless separately approved.
- [ ] Document why it remains in the repo.

### 5. Verify And Track

- [ ] Run docs app tests/build if touched.
- [ ] Run repo docs checks.
- [ ] Update project status docs.
- [ ] Add implementation notes to this plan.
- [ ] Update master plan phase tracking after completion.

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
