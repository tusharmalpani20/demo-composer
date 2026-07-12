# Child Plan 124: Project, Version, And Library UI Modernization

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `123` and the shipped Project Version/Edition behavior from children `115` through `120`.

Next child:

- `125` Capture Portal UI Modernization, only after Project, version-selector, library, lifecycle, and deep-link acceptance pass.

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

- Modernize Project and Project Version management and provide a coherent library for the artifact families that actually exist.

Scope:

- Project list, creation, workspace, settings, archive, and restore.
- Project Version selection, creation, lifecycle actions, default behavior, archive/restore, and accepted carry-forward entry points.
- Project workspace/library views for Captures, Guides, and Interactive Demos.
- Edition/Revision/Publication status language accepted in child plan `111`.
- Long organization/project/version names, dense lists, filters that operate on real data, empty states, pagination where already needed, and permission states.
- Stable URLs, breadcrumbs, deep links, back/forward behavior, and quiet `Main` behavior for teams with one Project Version.

Rules:

- Do not add Documentation or Video cards, creation commands, filters, or navigation before implementation.
- Do not label optimistic Row Versions or Publication Sequences as Project Versions.
- Do not replace useful operational density with oversized headings or decorative cards.
- Destructive and lifecycle actions must state their effect on drafts and Publications accurately.

Acceptance:

- Project and Project Version workflows complete end to end on desktop and mobile.
- Switching version context cannot show or mutate an artifact from another Project or Project Version.
- `Main` remains low-friction while other named versions remain discoverable.
- Existing Project deep links remain compatible or redirect according to the accepted URL decision.

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
