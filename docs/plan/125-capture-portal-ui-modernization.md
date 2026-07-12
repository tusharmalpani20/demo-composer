# Child Plan 125: Capture Portal UI Modernization

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `124` and the Capture Project Version behavior established by child `117`.

Next child:

- `126` Extension UI Modernization, only after the portal Capture workflow passes desktop/mobile and scope-safety acceptance.

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

- Modernize the portal Capture workflow while preserving source immutability, ordering, privacy, and Project Version scope.

Scope:

- Capture Session list, creation, active/completed/archived states, detail, finalization, and archive behavior.
- Manual screenshot upload, bulk upload progress/failure/retry, Capture Event creation, ordering, safe editing, and asset inspection.
- Project Version context and the accepted rules for reassignment before source material exists.
- Generation entry points for Guide and Interactive Demo with explicit target Edition context.
- Stable loading dimensions, progress announcements, upload cancellation/failure recovery where supported, long URLs/titles, missing assets, and empty/error/permission states.

Rules:

- Original Capture Events and Assets remain immutable except for the already accepted safe metadata/edit behavior.
- Raw input values and page HTML remain excluded.
- A stale portal tab must fail safely instead of posting to a newly selected or archived Project Version.
- Browser evidence must use safe synthetic screenshots and data.

Acceptance:

- Manual Capture completes end to end in default and named Project Versions.
- Upload and ordering failures are recoverable without duplicate indexes or lost accepted files.
- Guide/Demo generation inherits the correct Project Version and rejects cross-scope IDs.
- Portal browser tests cover narrow mobile and desktop detail/list workflows.

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
