# Child Plan 112: Audit Evidence Core

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `111` and the separate overnight-runner tooling checkpoint required by the master.

Next child:

- `113` Existing Mutation Audit Coverage, only after this child's acceptance and closeout pass.

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

- Establish the typed relational, transactional, and database-protected Audit Evidence contract that every mutable workflow must use.

Expected scope:

- Choose and document the clean schema-transition mechanism after inspecting migration/test tooling; development/test database reset/reseed is allowed, no production-row backfill is required, and later schema children must follow the same mechanism.
- Add explicit relational Audit Event and Audit Change Item persistence without JSON/JSONB values or metadata.
- Add typed actor/source, request/idempotency, organization/Project/root-resource, Row Version, outcome, optional reason, and safe actor-label columns.
- Implement one repository/service writer that records one Audit Event per successfully committed logical mutation and typed change items for changed aggregates, child records, and fields.
- Implement allowlisted scalar value types, child-record diff helpers, and explicit sensitive-field denial/redaction rules; never retain credentials, tokens, raw typed capture values, raw search text, or content payloads.
- Commit business mutation and evidence in the same transaction; failed, rolled-back, and no-op operations must not produce misleading success evidence.
- Add a mutation-context database guard and a schema/command coverage registry interface that child `113` can exhaustively populate. During this foundation child, enforce the guard only for explicitly converted/registered write paths; child `113` must activate repository-wide coverage before the audit foundation is described as comprehensive.
- Enforce append-only runtime grants/guards, restrictive foreign keys, separate runtime versus maintenance credentials, and backup inclusion.
- Have the foundation record its own initialization only after its tables and guard exist; do not fabricate pre-foundation history for the empty/pre-live database.
- Integrate one representative current aggregate end to end to prove the contract without attempting the repository-wide rollout in this child.
- Keep the partial rollout explicit in runtime/docs and avoid any state where an enabled global guard breaks an unconverted current workflow.

Verification requirements:

- clean-schema, constraint, index, grant, restrictive-foreign-key, and reset/reseed tests;
- runtime-role tests proving update/delete/truncate/cascade attempts fail;
- atomic commit/rollback, no-op, idempotency-context, and Row Version tests;
- typed before/after scalar and relational child-record diff tests;
- forbidden-field, secret, redaction, and oversized-value tests;
- one DB-backed representative mutation smoke path.

Acceptance:

- The repository has one tested Audit Event/Change Item model and write contract with no audit JSON/JSONB.
- Runtime application credentials can append authorized evidence but cannot rewrite or delete it.
- Later mutable commands cannot ship without using the same transaction context and registering coverage.

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
