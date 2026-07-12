# Child Plan 117: Capture Source Version Scoping

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `116`, including Project Version ownership, lifecycle, aliases, and authorization.

Next child:

- `118` Guide And Demo Edition And Working Draft Relational Foundation, only after Capture scoping and immutability rules pass.

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

- Make every Capture Session belong to exactly one Project Version while preserving immutable capture-source rules and extension compatibility.

Expected scope:

- Require `project_version_id` on every new Capture Session.
- Decide whether direct `project_id` remains for indexing/constraint clarity or becomes derivable; do not duplicate ownership accidentally.
- Update portal capture creation, manual capture, extension project/version selection, active capture restoration, and capture listing/filtering.
- Define behavior when an extension's remembered Project Version is archived, deleted, unauthorized, or no longer the Project default; never silently submit to a different version after capture has begun.
- Preserve ordered Capture Events and Capture Assets.
- Permit Project Version reassignment only for empty, unstarted Capture Session drafts in the same Project; lock version provenance at capture start or the first Event/Asset.
- Ensure Guide/Demo creation from Capture inherits the correct Project Version context.
- Update portal and extension contracts together; no old-client fallback is required in the pre-live repository.

Verification requirements:

- clean-schema tests for Capture creation in active/default/named Project Versions;
- tenant, project, and version mismatch denial tests;
- coordinated extension API contract tests;
- portal/manual/extension creation tests;
- active-capture restoration tests;
- Guide/Demo generation context tests;
- automatic-click and manual-capture browser dogfood where technically available;
- full smoke path through a non-default named Project Version.

Acceptance:

- No Capture Session exists without a valid Project Version.
- Original capture records remain immutable.
- Portal and extension flows select or safely default the version context.
- Artifact generation cannot cross project/version ownership accidentally.

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
