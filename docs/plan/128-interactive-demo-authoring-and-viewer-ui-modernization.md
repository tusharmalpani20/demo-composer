# Child Plan 128: Interactive Demo Authoring And Viewer UI Modernization

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `127` and the Demo Edition/Revision/Publication foundation from children `118` through `120`.

Next child:

- `129` Accessibility, Motion, Performance, And Browser Dogfood, only after the complete Interactive Demo editor/viewer regression matrix passes.

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

- Modernize the complete Interactive Demo workflow without changing its Scene/Hotspot/Transition domain model.

Scope:

- Interactive Demo list, generation, Edition context, carry-forward, accepted Revision behavior, and archive states.
- Scene creation/order, source/background asset selection, Hotspot creation/editing, target validation, transitions, preview, publication, password, link, and embed controls.
- Replace ambiguous publication-version copy and contracts with the accepted Publication Sequence language.
- Public, restricted, password, expired/revoked, and embed viewer states.
- Stable editor rails/toolbars/canvas dimensions and correct scaled Hotspot geometry across supported viewports.
- Missing assets/targets, stale Row Version conflicts, unsaved changes, failed saves, and permission changes.

Rules:

- Interactive Demo content remains separate from Guide and future Documentation content.
- Primary captured screens must remain clearly inspectable.
- Viewer motion must explain transition and focus, remain interruptible, and have a reduced-motion equivalent.
- Existing immutable Publications and public URLs retain their content/access behavior.

Acceptance:

- Scene, Hotspot, transition, preview, publish, password, link, embed, and public-view behavior passes focused and browser regression coverage.
- Carry-forward cannot mutate the source Edition.
- Stale-write conflicts are recoverable without silently discarding work.
- Hotspot geometry remains correct across tested viewport and media aspect ratios.

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
