# Child Plan 119: Guide And Demo Revision, Carry-Forward, And Protected Assets

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `118`, with relational Guide/Demo Working Draft content available for immutable Revision snapshots.

Next child:

- `120` Publication And Multi-Version Publish Link Integration, only after Revision, Carry-Forward, lineage, and protected-asset acceptance pass.

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

- Add immutable type-specific Revisions, restore/checkpoint behavior, accepted Carry-Forward semantics, and reference-safe shared asset retention.

Expected scope:

- Store immutable Guide and Interactive Demo Revision roots and type-specific relational child records rather than JSON/JSONB snapshots.
- Create or reuse immutable Revisions only for manual checkpoints, Publication, and Carry-Forward; scope Revision numbers to one Edition and keep Row Versions concurrency-only.
- Implement checkpoint and audited restore-to-Working-Draft behavior without mutating historical Revisions.
- Implement one-source/one-target Project Version Carry-Forward for a selected bounded set of Artifacts as one atomic, idempotent transaction with database uniqueness and explicit conflict details.
- Preserve one immediate source Edition per result, never overwrite an existing target Edition, and never synchronize later source/target edits.
- Copy editable relational structures with new IDs, reset Row Versions, and new audit state while reusing protected immutable media and preserving lineage.
- Keep archived referenced assets resolvable and block physical purge while any Working Draft, Revision, or current Published Artifact reference remains.
- Preserve Guide and Demo content-model boundaries throughout.

Verification requirements:

- relational Revision immutability and numbering tests;
- manual checkpoint, restore, no-op, and concurrency tests;
- multi-Artifact Carry-Forward atomicity, idempotency, conflict, authorization, and lineage tests;
- cross-Organization/Project/Version mismatch tests;
- archive-versus-purge and shared-asset reference-graph tests;
- portal/browser and DB-backed smoke coverage across two Project Versions.

Acceptance:

- Revisions are immutable relational checkpoints and Working Draft restore never rewrites history.
- Carry-Forward creates independent target Editions without duplicating immutable media or mutating sources.
- Referenced assets cannot be physically removed while authored or historical state depends on them.

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
