# Child Plan 129: Accessibility, Motion, Performance, And Browser Dogfood

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed children `121` through `128`, with all modernized surfaces available for connected auditing.

Next child:

- `130` Pre-Documentation Closeout, only after scoped severity-one/high-impact findings are fixed and the required dogfood evidence is current.

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

- Audit the modernized product as a connected experience and close cross-screen accessibility, motion, responsive, performance, and browser defects.

Scope:

- Run Impeccable critique/audit/polish/harden/adapt passes as applicable.
- Audit against an explicit WCAG 2.2 AA target for scoped web and extension workflows, documenting any technically justified exception.
- Review semantic landmarks, heading structure, labels, descriptions, focus order/visibility, modal focus, keyboard operation, contrast, status announcements, touch targets, zoom/reflow, and reduced motion.
- Run `review-animations` on every added transition and interaction.
- Execute the browser-support matrix accepted in child plan `121`; use the primary Chromium path for complete journeys and representative secondary-engine checks for public/authenticated web surfaces where supported.
- Use deterministic safe fixtures to compare accepted pre-redesign behavior with the modernized product.
- Check console errors, failed requests, broken images, layout shift, overflow, text clipping, dead controls, memory leaks from long editor sessions, and duplicate submissions.
- Measure representative bundle/page/render performance against the budgets accepted in `121`/`122` and investigate material regressions.
- Validate public readers and embeds separately from authenticated portal routes.
- Run the documented extension path and preserve the distinction between automated extension-page evidence and true toolbar-popup validation.
- Refresh committed product screenshots only after acceptance and only with safe synthetic data.

Minimum browser journeys:

- first-run setup/login/logout/session expiry;
- organization invite and member access;
- create Project and default/named Project Versions;
- create Capture manually and through the supported extension path;
- generate, carry forward, edit, preview, and publish a Guide;
- generate, carry forward, edit, preview, and publish an Interactive Demo;
- open public, restricted, password, expired/revoked, and embed routes;
- archive/restore and permission-denied behavior;
- narrow mobile navigation, 200% zoom/reflow, and wide editor layouts.

Acceptance:

- No critical accessibility violation remains in scoped flows, and all high-impact findings are fixed or explicitly block closeout.
- All functionality is keyboard-operable where the underlying interaction permits it.
- Reduced motion preserves comprehension and functionality.
- No incoherent overlap, clipping, blank media/canvas, dead navigation, or material uninvestigated performance regression remains at tested viewports.
- Known browser/extension limitations are dated and documented instead of being silently treated as passing.

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
