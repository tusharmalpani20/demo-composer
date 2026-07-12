# Child Plan 118: Guide And Demo Edition And Working Draft Relational Foundation

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `117` and the accepted relational/version foundation from `112` through `116`.

Next child:

- `119` Guide And Demo Revision, Carry-Forward, And Protected Assets, only after relational Working Draft behavior and Row Version concurrency pass.

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

- Establish clean type-specific Artifact identity, Project Version-scoped Editions, and relational Working Drafts for existing Guides and Interactive Demos.

Expected scope:

- Implement clean type-specific stable Guide and Interactive Demo identity tables/aggregates.
- Keep stable Artifact identities free of user-facing title/description; store mutable non-unique metadata on Project Version-scoped Editions and create each new Artifact with its first Edition transactionally.
- Give stable Artifact identity no lifecycle state; keep `draft | archived` exclusively on Editions and defer permanent/global Artifact purge behavior.
- Add Project Version-scoped Editions using the exact model accepted in child plan `111`.
- Preserve `draft | archived` as Artifact Edition lifecycle and keep immutable Publication state separate.
- Maintain exactly one mutable Working Draft per Edition and preserve optimistic-concurrency Row Version semantics.
- Preserve Guide Blocks/Steps/Annotations and Demo Scenes/Hotspots/Transitions as separate aggregates.
- Replace JSONB-backed working content with explicit Guide/Demo typed columns and relational child records, including relational Guide Annotations.
- Remove generic domain `metadata` JSONB columns from the clean target unless a later separately accepted decision defines a narrow non-authoritative boundary.
- Replace current dual-purpose Guide/Demo rows with the clean identity/Edition ownership model; no production-row backfill or legacy dual-write is required.
- Update Guide/Demo create, list, read, edit, archive/restore, generation-from-Capture, shared contracts, fixtures, and tests together.
- Preserve the current publish/read paths until child `120` replaces their persistence atomically; the expanded plan must define the temporary boundary and may combine schema deployment with `119`/`120` if the database cannot remain valid between children.

Non-goals:

- universal artifact content tables;
- cross-type conversion between Guide and Interactive Demo;
- branching or merging unless explicitly accepted for V1;
- Documentation tables or routes;
- Revision, Carry-Forward, Publication, Publish Link, or viewer redesign beyond the compatibility boundary required for the relational authoring transition;
- persistent JSON/JSONB content, generic metadata, or entity-attribute-value substitutes for explicit domain records.

Verification requirements:

- clean-schema tests for Artifact identity, Edition ownership, Working Drafts, relational content, and reset/reseed behavior;
- contract tests proving `version` remains Row Version where used;
- Guide and Demo domain tests;
- authorization and cross-version mismatch tests;
- create/edit/archive/generate-from-Capture regression tests;
- temporary publish/read compatibility tests;
- smoke coverage for creating and editing both artifact types in two Project Versions.

Acceptance:

- Existing Guides and Interactive Demos use explicit Artifact identity, Edition, and Working Draft ownership and remain behaviorally distinct.
- Core authored content no longer depends on generic JSON/JSONB persistence.
- Child `119` can checkpoint and carry forward the relational content without another ownership rewrite.

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
