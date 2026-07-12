# Child Plan 116: Project Version Foundation

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `115` and the Audit/Access foundation from `112` through `114`.

Next child:

- `117` Capture Source Version Scoping, only after every Project has a valid transactional Default Project Version.

## Planning Boundary

This file reserves the accepted child boundary and sequence from Master Plan
`005`. It is not yet an implementation-ready plan. Before runtime or product
changes begin, the active agent must re-read `CONTEXT.md`, the relevant accepted
ADRs, the parent master, preceding child closeouts, and current code/tests; then
expand this file with exact affected files, contracts, tests, verification,
ownership, migration/reset implications, browser evidence where applicable, and
a stable handoff.

Do not mark this child in progress or complete merely because this skeleton
exists. Preserve the master's ordering and stop at any unmet predecessor gate or
critical decision defined by `AGENTS.md`.

## Master-Defined Goal And Boundary

Goal:

- Implement Project Versions as an organization/project-scoped release context, following the decisions accepted in child plan `111`.

Expected scope:

- Follow the clean schema-transition and reset/reseed mechanism accepted by child plan `112`; no production-row backfill or legacy compatibility path is required.
- Add Project Version persistence, repository/domain behavior, shared constants/contracts, routes, service adapters, and tests.
- Create exactly one active default `Main` Project Version transactionally with every new Project.
- Enforce organization and project ownership in every query and mutation.
- Enforce the accepted name/slug/state/default uniqueness rules under concurrency.
- Support explicit canonical slug changes through permanent, case-insensitively unique, non-reusable Project Version aliases and canonical redirects.
- Add create/list/get/update/archive/restore/set-default operations only where accepted.
- Use `active | archived` for Project Version lifecycle; the Default Project Version must remain active, and archiving makes the version's content effectively read-only without rewriting every child status.
- Preserve Project archive as an effective read-only wrapper: keep child states/default assignment intact, block new authoring, restore exact prior behavior, and leave existing Publications accessible unless explicitly revoked.
- Add explicit Project Version selection to every in-repo client and keep the Project entry route as a deliberate redirect to the Default Project Version.
- Preserve existing project URLs or provide explicit redirects.
- Use explicit Project Version context in authenticated Artifact/Revision routes, redirect Project entry routes to the Default Project Version, preserve Project Version alias redirects, and do not add a `/latest` route.
- Preserve optimistic-concurrency Row Version behavior; do not repurpose existing `version` columns as authored Revisions.
- Keep teams on `Main` from facing unnecessary version-management UI.
- Keep archived Project Versions directly linkable and available as read-only Carry-Forward sources, separate them in selectors, exclude them from default library/search results, and preserve existing Publications.
- Store explicit Project Version order, show the Default Project Version first, separate archived versions, and never infer order from free-form names.
- Put version foreign keys on aggregate roots and relationship records that need them; do not denormalize `project_version_id` onto every child row unless a query, constraint, or tenant-safety requirement justifies it.

Expected affected areas:

- `apps/server/src/db/migrations/`
- project/version server modules and persistence adapters
- relevant domain package(s)
- `packages/constants`
- `packages/types`
- `apps/web/src/lib/api.ts` or its accepted replacement modules
- project workspace/version management UI
- route, unit, DB integration, migration, web, and smoke tests

Verification requirements:

- clean schema creation/reset/reseed from an empty development/test database;
- deterministic Project creation plus unique/default constraints;
- cross-organization and cross-project denial tests;
- concurrency tests for slug/default creation where practical;
- slug-change, alias-conflict, non-reuse, and canonical-redirect tests;
- API contract and route tests;
- web tests for selector, empty/error/loading, archive, and permission states;
- browser validation on desktop and mobile;
- accepted Project entry/version alias URL behavior;
- full DB-backed smoke and repository checks.

Acceptance:

- Every newly created Project has a usable default `Main` Project Version in the same transaction.
- Explicit version management works according to accepted roles and lifecycle rules.
- Existing users can continue the current workflow through `Main`.
- No new Capture or Artifact Edition can be created without explicit Project Version context.

## Expansion And Recheck Gate

Before implementation:

- [ ] Confirm every preceding child gate is complete and record the starting
      commit and working-tree ownership.
- [ ] Reinspect every current route, schema, migration, contract, package,
      component, test, and operational surface named or implied by this child.
- [ ] Replace plan-era assumptions with current runtime facts without changing
      accepted product semantics.
- [ ] List exact affected files and explicit out-of-scope files.
- [ ] Define authorization, tenant isolation, lifecycle, data, API, UI, error,
      concurrency, migration/reset/reseed, audit/access, compatibility, and
      rollback contracts as applicable.
- [ ] Apply the shared-package reuse gate before moving any app-local contract.
- [ ] Define the TDD order, focused tests, broad regression checks, DB/smoke
      coverage, and real-browser evidence required by this child.
- [ ] Classify unresolved decisions under the repository decision policy and stop
      only for a genuinely critical decision.
- [ ] Record an attributable planning checkpoint before runtime implementation
      when expansion materially changes durable plan content.

## Delivery Checklist

- [ ] Establish the smallest meaningful failing focused test for each behavior
      boundary.
- [ ] Implement the smallest coherent change that passes, then refactor only
      while tests remain green.
- [ ] Preserve Organization tenant isolation, explicit authorization, immutable
      Capture source, protected shared assets, immutable Publications, and public
      access rules.
- [ ] Run the focused and broad verification defined by the expanded plan.
- [ ] For browser-visible work, collect safe synthetic desktop, narrow-mobile,
      keyboard, zoom/reflow, console, network, loading, empty, error, permission,
      and destructive-state evidence as applicable.
- [ ] Update this child status, implementation log, evidence, leftovers, and
      handoff together with the parent checklist only after acceptance passes.

## Implementation Log

Not started.

## Verification Record

Not run. Verification commands and outcomes must be added during execution; this
reservation does not claim test, database, browser, accessibility, performance,
or extension evidence.

## Leftovers And Handoff

- Expansion/recheck remains required.
- Next executable child is determined by the parent sequence and verified
  predecessor closeouts; this reservation does not advance that sequence.
