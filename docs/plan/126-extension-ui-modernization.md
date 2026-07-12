# Child Plan 126: Extension UI Modernization

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `125`, including stable Capture behavior and Project Version recovery semantics.

Next child:

- `127` Guide Authoring And Reader UI Modernization, only after extension capture reliability, privacy, recovery, and popup evidence pass or are explicitly blocked.

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

- Modernize the constrained Chrome extension experience without weakening capture reliability, instance separation, or privacy.

Scope:

- Instance connection, login, current-session verification, Project and Project Version selection, and stored-selection recovery.
- Start, active, paused, uploading, failure, retry, finish, and open-portal states within stable popup dimensions.
- Explicit handling for stale, archived, deleted, unauthorized, or changed default Project Versions.
- Split API/web origin behavior and current portal-link settings.
- Automatic-click status, manual screenshot fallback, actionable errors, and active-capture restoration.
- Keyboard/focus behavior, concise labels, readable truncation, and controls appropriate to the popup's narrow viewport.

Rules:

- Preserve instance-first login and extension-only token handling.
- Preserve privacy defaults: no raw input values and no page HTML.
- Never silently switch Project Version after a Capture Session starts.
- Keep browser automation evidence distinct from true installed toolbar-popup validation.
- Do not introduce recording/video permissions for future Loom-style work.

Acceptance:

- Setup/login/select/start/pause/resume/capture/finish/open-portal flows remain covered by focused tests.
- Stale version context fails safely and offers an explicit recovery path.
- Automatic and manual capture evidence is dated, and any true toolbar-popup limitation remains explicit.
- Popup content does not resize incoherently, clip controls, or hide critical capture status.

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
