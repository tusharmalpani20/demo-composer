# Child Plan 127: Guide Authoring And Reader UI Modernization

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `126` and the Guide Edition/Revision/Publication foundation from children `118` through `120`.

Next child:

- `128` Interactive Demo Authoring And Viewer UI Modernization, only after the complete Guide authoring/public-reader regression matrix passes.

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

- Modernize the complete Guide workflow without changing its Block/Step/Annotation domain model.

Scope:

- Guide list, creation/generation, Edition context, carry-forward, accepted Revision checkpoint behavior, and archive states.
- Guide Block/Step authoring, screenshot selection/upload, annotations, ordering, preview, Markdown export, HTML ZIP export, publication, password, link, and embed controls.
- Replace ambiguous “Published version” UI language and contracts with the accepted Publication Sequence terminology.
- Public, restricted, password, expired/revoked, and embed reader states.
- Responsive authoring with stable rails/toolbars/media dimensions and correct annotation coordinates.
- Long content, missing/stale assets, stale Row Version conflicts, unsaved changes, failed saves, and permission changes.

Rules:

- Guide content remains separate from Interactive Demo and future Documentation content.
- Captured media remains inspectable and is not hidden by decorative treatments.
- Existing immutable Publications and public URLs retain their exact content/access behavior.
- Keyboard shortcuts are added only with complete conflict, focus, and discoverability behavior.

Acceptance:

- Edit, preview, annotate, reorder, export, publish, password, link, embed, and public-read behavior passes focused and browser regression coverage.
- Carry-forward cannot mutate the source Edition.
- Stale-write conflicts are recoverable without silently discarding work.
- Annotation coordinates remain correct at tested viewport sizes.

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
