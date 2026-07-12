# Child Plan 121: Design-System Foundation

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `120`, stable product/naming truth from `110`, and the current workflow baselines required by the master.

Next child:

- `122` Portal Architecture And Application Shell, only after explicit user acceptance of `PRODUCT.md`, `DESIGN.md`, and the representative UI directions.

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

- Establish the product brief, design principles, tokens, accessible primitives, and motion rules required for a coherent operational UI.

Scope:

- Run the reviewed Impeccable initialization/documentation workflow after product and naming truth is stable, with optional hooks disabled unless child `109` separately reviewed and accepted them.
- Create repository-root `PRODUCT.md` as a concise design-facing brief that references canonical product/domain docs rather than duplicating or overriding them.
- Create repository-root `DESIGN.md` as the source of truth for visual language, Quiet Versioned Workbench archetypes, interaction rules, tokens, components, motion, responsive behavior, and accessibility expectations.
- Audit and evolve the existing Tailwind CSS 4, Lucide, CVA/class utility, and `packages/ui` foundation; do not reinstall Tailwind, replace Lucide, or regenerate source-owned primitives blindly.
- Capture deterministic, safe baseline screenshots and browser-flow notes for every workflow that child plans `122` through `128` will change before the first visual rewrite.
- Inventory all current colors, type styles, spacing, radii, shadows, icons, form controls, overlays, tables/lists, editors, readers, loading states, and responsive breakpoints.
- Map every current and planned UI to the five accepted surface archetypes: library/operations, authoring workbench, reader/viewer, settings/admin, and activity/compliance.
- Define semantic tokens for background, surface, border, text, accent, success, warning, danger, focus, overlay, and selected states.
- Define typography roles appropriate for dense operational software; do not use viewport-scaled text.
- Define stable dimensions for navigation, toolbars, controls, asset thumbnails, editor rails, and fixed-format interactive surfaces.
- Select or confirm accessible primitives for dialog, menu, tooltip, tabs, select/combobox, toast, popover, and disclosure behavior. Add a headless primitive dependency only for a specific missing behavior, not as a bulk component rewrite.
- Retain Lucide unless evidence establishes a concrete accessibility or product gap.
- Define motion tokens, reduced-motion fallbacks, focus behavior, and performance limits.
- Define the supported browser/viewport/zoom matrix and measurable bundle, navigation, editor-interaction, image-loading, and layout-shift budgets from current baselines.
- Define an incremental token/component migration strategy so old and new styling do not create an uncontrolled permanent dual design system.
- Build a development-only component/state review surface if it materially improves repeatable QA.
- Produce representative, behaviorally real designs for one library, one authoring workbench, and one reader/viewer surface and obtain explicit user acceptance of the direction before child `122` begins broad shell/workflow modernization.

Design constraints:

- Operational, quiet, scan-friendly, and efficient rather than marketing-like.
- No nested cards or every-section-as-card composition.
- No decorative gradient/orb backgrounds.
- Cards use restrained radii of 8px or less unless an accepted primitive requires otherwise.
- Familiar commands use icons with accessible names/tooltips where appropriate.
- Color must communicate state without producing a one-hue interface.
- Dark mode is not automatic scope; support it only if explicitly accepted and complete.
- Motion explains continuity, hierarchy, feedback, and spatial change; it is not decoration.

Acceptance:

- `PRODUCT.md` and `DESIGN.md` are accepted and defer to `CONTEXT.md`/ADRs for domain truth.
- The Quiet Versioned Workbench and its five surface archetypes are concrete enough to compose real screens consistently.
- Tokens and primitives cover real current workflows, not a disconnected showcase.
- Keyboard, focus, contrast, error, disabled, loading, and reduced-motion states are defined.
- Safe behavioral/visual baselines, browser support, viewport coverage, zoom/reflow expectations, and performance budgets are recorded.
- The chosen product display name and brand direction are reflected without forcing technical identifier churn.
- Later screens can be modernized mostly by composition rather than inventing new one-off styling.

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
