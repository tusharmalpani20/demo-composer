# Child Plan 122: Portal Architecture And Application Shell

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed and explicitly accepted child `121` design direction.

Next child:

- `123` Authentication, Setup, And Organization UI Modernization, only after shell navigation, accessibility, responsive, and browser acceptance pass.

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

- Create a scalable, responsive application shell and routing/data architecture around Organization, Project, and Project Version context.

Scope:

- Inventory the custom route parser, API client, authentication/session state, page-local fetching, error handling, and navigation behavior.
- Decide with evidence whether to adopt React Router, TanStack Query, accessible headless primitives, or smaller existing-compatible alternatives.
- Record dependency licenses, security/update posture, bundle impact, migration boundaries, and exit cost; do not introduce a library merely because it is common.
- Define query ownership, cache keys, invalidation, cancellation, optimistic-update rollback, duplicate-submission prevention, and stale-response behavior before replacing page-local fetching.
- Define navigation blocking/recovery for unsaved editor work before route infrastructure changes.
- Establish persistent desktop navigation and an ergonomic mobile adaptation.
- Provide organization, project, and project-version context with breadcrumbs or equivalent wayfinding.
- Provide clear primary creation actions, current library access, search entry point placeholder only if it performs a real current action, and account/settings access.
- Preserve deep links, browser back/forward behavior, public routes, auth redirects, and split API/web origins.
- Keep authenticated portal state and public reader/embed state isolated so cache or auth assumptions cannot leak across route families.
- Add route-level loading, not-found, unauthorized, and recoverable error states.
- Keep Documentation and Video out of active navigation until their routes exist. A clearly labeled roadmap surface may mention them outside the operational nav.

Expected outcome:

- The first viewport is the usable product workspace, not a landing page.
- Project Version context is visible without consuming excessive space.
- Navigation remains usable with long organization/project/version names.
- No mobile/desktop overlap or layout shift occurs as content loads.
- The shell provides a stable frame for all existing and future artifact families.

Acceptance:

- Current authenticated and public routes remain reachable and tested.
- Refresh, deep link, back/forward, expired session, and permission-denied behavior are correct.
- Desktop and mobile browser screenshots show no clipping, overlap, dead controls, or misleading nav.
- Architectural dependencies are justified and covered by a migration/test plan.

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
