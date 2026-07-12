# Child Plan 120: Publication And Multi-Version Publish Link Integration

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `119` and the Publication/Publish Link decisions accepted in ADRs `0022` and `0026`.

Next child:

- `121` Design-System Foundation, only after immutable Publication compatibility and multi-version link behavior pass.

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

- Complete revision-backed immutable publishing and independently configured multi-version Publish Link manifests for Guides and Interactive Demos.

Expected scope:

- Make each Published Artifact identify one exact immutable Artifact Revision, Edition, and Project Version without duplicating content into `snapshot_json`.
- Replace ambiguous `published_artifact.version_number`/`published_version` target language with Edition-scoped `publication_sequence` across database, domain, contracts, API, UI, fixtures, and tests.
- Create or reuse the correct immutable Revision when publishing; keep Revision Number, Publication Sequence, and Row Version independent.
- Model each Publish Link as one stable Artifact's ordered selection of one or more Edition/Published Artifact entries, with exactly one default, one link-wide access policy, and no Working Draft exposure.
- Allow many independently configured Publish Links per Artifact with separate version selections, defaults, access policies, expiry, and revocation.
- Preserve `/p/*`, `/d/*`, and embed route families; add canonical version-specific paths and a viewer selector containing only entries allowed by that link.
- Make version selection update the directly shareable URL and render the exact immutable Publication.
- Present explicit per-link add/update choices during publish; update selected entries atomically and leave unselected links pinned for later manual update.
- Allow audited atomic entry rollback to an older Published Artifact from the same Edition without creating a Revision or Publication.
- Retain Published Artifacts as immutable, non-deletable V1 history; unlink/revoke controls access, while permanent/legal purge remains deferred.
- Complete protected-asset streaming authorization across draft, Revision, Publication, restricted/password, embed, and revoked-link paths.

Non-goals:

- live-draft public pointers;
- automatic rollout to every Publish Link;
- Publication deletion, custom domains, scheduled publishing, or approval workflows;
- Documentation routes or content.

Verification requirements:

- clean-schema and contract tests for Published Artifact, `publication_sequence`, and Publish Link manifests;
- publish transaction, explicit link-update, unselected-link pinning, rollback, expiry, revoke, password, and authorization tests;
- public/restricted/password/embed and canonical-version URL browser tests;
- viewer selector ordering/default/deep-link tests;
- immutable Publication and protected-asset regression tests;
- smoke coverage for create, checkpoint, carry forward, publish, select, update, rollback, and read across two Project Versions.

Acceptance:

- Existing Guide and Interactive Demo publishing is revision-backed, relational, immutable, and version-aware.
- One link can safely expose an explicit selected set of Project Versions, while multiple links for the same Artifact remain independently configurable.
- Public URLs and embeds preserve accepted behavior without exposing Working Drafts or unauthorized assets.

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
