# Child Plan 131: Documentation Domain Grill

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed and accepted child `130` plus every Documentation Implementation Entry Gate in the master.

Next child:

- A newly accepted implementation-ready sequence beginning at `132`; no `132` child may be invented before this grill resolves its required decisions.

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

- Produce an accepted, implementation-ready Documentation-domain model and phased scope without writing Documentation runtime code.

Method:

- Use `grill-with-docs` one question at a time.
- Compare decisions against the actual Audit/Access, Project Membership, Project Version, Edition, Revision, Publication, permission, file, and portal models built in `112` through `130`.
- Use Mintlify as a product/workflow benchmark and Fumadocs as a possible rendering/tooling boundary, not as an unquestioned product data model.
- Verify the current Mintlify/Fumadocs behavior, licensing, extension points, and security assumptions from primary sources during this child plan rather than relying on stale research.
- Update `CONTEXT.md` inline only as decisions settle.
- Add ADRs only for accepted durable decisions.
- End with an implementation-ready child-plan sequence beginning at `132`.

Questions that must be resolved:

1. Is the primary artifact a Documentation Site, Knowledge Base, Manual, or another term?
2. Is a Documentation Page independently versioned, or only versioned through its containing Site Edition?
3. Can a Project Version have multiple Documentation Sites?
4. What is the relationship among Site, Page, Navigation Tree, Edition, Revision, and Publication?
5. Is a Publication an atomic snapshot of the entire Site, a set of page snapshots, or another manifest model?
6. Can Pages or reusable snippets be shared across Sites/Project Versions without creating hidden live coupling?
7. Is authoring Markdown, MDX, structured blocks, rich text, or a deliberately constrained combination?
8. Is the source of truth database-first, Git-first, or bidirectional? What is deferred?
9. If Git synchronization exists, how are repository credentials, webhooks, branches/PRs, conflicts, deletions, and force-pushes handled?
10. If Fumadocs is used, which rendering/search/OpenAPI concerns may it own and which product-domain concerns must remain ours?
11. How are unsafe MDX, embedded HTML, script execution, remote media, URL protocols, code samples, and user-authored components handled?
12. How are navigation, ordering, folders/groups, cycles, slugs, aliases, redirects, and broken internal links modeled and validated?
13. How does carry-forward work across Project Versions at Site, navigation, Page, and reusable-content granularity?
14. What creates a Documentation Revision, and how are preview/review/publication snapshots produced?
15. How do autosave, optimistic locking, concurrent edits, conflict recovery, and unsaved local changes work before real-time collaboration exists?
16. Which access modes exist: organization-only, project members, selected groups, link-restricted, password, preview token, or public?
17. How do stable latest URLs, project-version URLs, edition URLs, revision previews, and immutable publication URLs behave?
18. What happens to redirects, search, links, previews, and Publications when a Project Version, Site, or Page is archived/deleted?
19. Is search Site-scoped, Project-scoped, Organization-scoped, version-aware, or cross-artifact in the first release?
20. How are title, description, headings, body, keywords, breadcrumbs, locale, and version labels indexed and permission-filtered?
21. Can Documentation reuse Capture Assets and Derived/Redacted Assets directly, and how are deletion/retention/reference rules enforced?
22. What import/export formats are in V1: Markdown folder, Git repository, ZIP, OpenAPI, or none?
23. Are comments, review, approvals, feedback, analytics, page ownership, and change history required now or deferred?
24. Are API reference, OpenAPI playground, generated SDK content, and interactive components in the first slice or later?
25. Are localization and locale fallback part of the model now or explicitly deferred?
26. What public-site SEO, canonical URL, sitemap, robots, social metadata, and custom-domain behavior is required or deferred?
27. What caching, rendering, invalidation, publication-build, failure-recovery, and rollback model is viable for self-hosting?
28. What operational limits are needed for page size, site size, build duration, asset size, and concurrent publication?
29. How are audit history, soft deletion, retention, export, and organization/project deletion applied to Documentation content?
30. What accessibility and performance targets apply to the authoring and published-reader surfaces?
31. What are the strict MVP exclusions?
32. Which vertical slice proves the model with the least irreversible complexity?

Required outputs:

- accepted Documentation terms and relationships in `CONTEXT.md`;
- a feature matrix split into first slice, V1, later, and rejected/non-goals;
- data ownership and source-of-truth decision;
- security/threat model for authored content, Git integration if any, previews, and public rendering;
- Fumadocs adoption/boundary decision with version/license evidence;
- URL, versioning, concurrency, access, search, publication, rollback, retention, and migration decisions;
- authoring and public-reader accessibility/performance targets;
- justified Documentation ADRs;
- an ordered child-plan sequence beginning at `132` with the first vertical slice fully bounded.

Acceptance:

- No foundational Documentation question is hidden behind “decide during implementation.”
- The model fits existing Project Version and publication semantics without forcing all artifact types into one content schema.
- Publication atomicity, authoring concurrency, security, and failure recovery are explicit.
- The first Documentation slice is small enough to implement and complete, but structurally valid for the accepted V1 direction.
- No Documentation runtime code, tables, routes, packages, or navigation are added during the grill.

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

## Grill Checklist

- [ ] Use `grill-with-docs` and resolve one consequential question at a time
      against the implementation that actually shipped through child `130`.
- [ ] For each question, record the recommendation, alternatives, evidence,
      tradeoffs, reversibility, affected scope, and explicit accepted/rejected or
      deferred outcome.
- [ ] Verify time-sensitive Mintlify and Fumadocs behavior, versions, licenses,
      extension points, and security assumptions from primary sources during the
      grill.
- [ ] Update `CONTEXT.md` only as terminology settles and add ADRs only for
      accepted durable decisions.
- [ ] Produce every required output, including the threat model, feature matrix,
      ownership boundary, and ordered child sequence beginning at `132`.
- [ ] Verify documentation formatting, links, terminology, decision coverage,
      and the explicit absence of Documentation runtime changes.
- [ ] Update this child status, grill record, evidence, leftovers, handoff, and
      the parent checklist only after all 32 questions and acceptance criteria
      are resolved.

## Grill Log

Not started.

## Verification Record

Not run. Verification commands and outcomes must be added during execution; this
reservation does not claim test, database, browser, accessibility, performance,
or extension evidence.

## Leftovers And Handoff

- Grill expansion/recheck remains required.
- Next executable child is determined by the parent sequence and verified
  predecessor closeouts; this reservation does not advance that sequence.
