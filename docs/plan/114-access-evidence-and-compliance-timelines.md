# Child Plan 114: Access Evidence And Compliance Timelines

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed children `112` and `113`, with comprehensive mutation evidence active before Access Evidence is added.

Next child:

- `115` Project Membership Foundation, only after Access Evidence and the Owner compliance boundary pass.

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

- Record meaningful access separately from mutation evidence and provide the first authorized compliance timeline.

Expected scope:

- Add explicit relational Access Event persistence with typed actor/source, organization/Project/root-resource, request, outcome, and safe context columns; do not store JSON/JSONB, content, credentials, secret-bearing URLs, or raw search text.
- Record meaningful authenticated protected reads, public Publish Link views, downloads, authentication outcomes, authorization denials, and extension API access.
- Exclude health/readiness probes, frontend static assets, CORS preflight, internal queries, range chunks, and non-domain heartbeats.
- Persist protected-resource Access Events before returning content and define fail-closed behavior when evidence cannot be written.
- Add Organization Owner organization-wide cursor-pageable compliance queries; do not expose raw evidence to non-owners before Project Membership exists.
- Record access to the compliance timeline itself and use current authorization at query time.
- Retain Audit and Access Evidence for the Organization lifetime, block destructive cascades, include it in backups, measure growth, and keep future partitioning possible without weakening retention.
- Keep export, automatic expiry, selective deletion, legal purge, cryptographic anchoring, WORM, and compliance-certification claims out of V1.
- Define the authorization/read-model extension points that child `115` will use for Project Admin, Editor, and Viewer timeline scope.

Verification requirements:

- clean-schema, typed-context, constraint, index, grant, and runtime append-only tests;
- protected-read fail-closed and public/restricted/password/embed access tests;
- authentication, denial, download, extension, timeline-view, and transport-noise exclusion tests;
- Owner/non-owner/anonymous authorization and tenant-isolation tests;
- cursor pagination, retention, storage-metric, and backup-documentation checks.

Acceptance:

- Every accepted meaningful access path produces an Access Event without leaking protected data.
- Organization Owners can inspect complete organization-scoped evidence, while other roles receive no premature raw-evidence access.
- Child `115` has an explicit, tested boundary for adding Project-role timeline visibility.

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
