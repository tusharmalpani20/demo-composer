# Child Plan 110: Product Umbrella, Naming, And Documentation Truth

Date: 2026-07-10

Last reviewed: 2026-07-10

Status: Not started.

## Parent Master Plan

```text
docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md
```

This is child plan `110` of the Knowledge Platform and UI Foundation track. It follows child `109` and uses the Project Version/Artifact language already accepted by completed child `111`.

## Objective

Make repository product documentation tell one truthful story about:

- what the alpha application implements today;
- what Master Plan `005` has accepted as the next platform foundation;
- what remains deliberately deferred;
- why Product Documentation is different from the repository's `apps/docs` application;
- whether the product keeps the **Demo Composer** display name or adopts a broader name before brand-level UI work.

This plan includes research and an explicit naming decision gate. It must not silently choose or apply a new product name without user acceptance.

## Dependency And Entry Gate

Child `110` may begin only when:

- child `109` is complete;
- root `AGENTS.md`, `docs/agent-workflow.md`, and the four local repository skills are available;
- external skill installation/provenance has no unresolved critical issue;
- the worktree is clean;
- completed child `111`, its grill record, `CONTEXT.md`, and ADRs `0021` through `0026` remain the accepted version-domain source.

Child `111` is already complete and must not be expanded or implemented again between `109` and `110`.

## Expansion And Recheck Findings

This plan was expanded on 2026-07-10 against Master Plan `005`, the current docs/app metadata, current alpha evidence, completed child `111`, and the repository's visible/technical naming surfaces.

Current documentation facts:

- `README.md` already has `What Works Today` and `Intentionally Deferred`, but its product model still ends at Capture -> Guide/Interactive Demo -> Publish Link and does not explain the accepted broader platform direction.
- `docs/product-idea.md` still frames the product primarily as two outputs, uses the ambiguous heading `Guide / Doc`, and does not include Project Version, Documentation as a distinct future artifact family, or later Video.
- `docs/system-design-pattern.md` accurately describes the current domain-package style but its main model predates Project Versions, Editions, Revisions, Publications, Audit/Access Evidence, and Project Membership.
- `docs/roadmap.md` and `docs/project-zoomout-status.md` still recommend alpha hardening as the next phase and do not point to Master Plan `005` as the accepted next track.
- `docs/oss-alpha-summary.md`, `CONTRIBUTING.md`, and `docs/contributor-guide.md` describe the current two-artifact alpha but not the broader accepted direction.
- `apps/docs` correctly presents itself as a compact repository documentation hub, but its content has at least one stale extension limitation and no explicit `Next Platform Direction` band.
- `CONTEXT.md` already contains the accepted Project Version, Artifact Edition, Revision, Publication, Carry-Forward, membership, audit, access, and protected-asset terms, while its opening product summary still names only guides and interactive demos.
- Current alpha screenshots remain valid current-product evidence. They must not be relabeled as screenshots of unimplemented Project Version or Documentation workflows.

Current naming facts:

- `Demo Composer` appears in human-facing docs, portal/extension/docs-app UI, metadata, tests, OpenAPI display metadata, GitHub issue templates, and package READMEs.
- Technical identifiers include the repository slug, package name, Docker/database names, `DEMO_COMPOSER_*` environment variables, cookie names, service identifiers, extension message/header strings, file paths, and migration history.
- The current GitHub source URL is `tusharmalpani20/demo-composer`; a display-name change does not make that URL invalid or require an immediate repository rename.
- Master Plan `005` recommends moving away from `Demo Composer`, but it deliberately leaves the final keep/rename decision to this child and separates display, repository, package, configuration, and persistent identifier layers.

No Project Version, Project Membership, Audit/Access Evidence, Artifact Edition, Revision, multi-version Publish Link, Product Documentation, or Video runtime implementation exists yet. Documentation must use future/accepted-target language for those concepts.

## Execution Shape And Mandatory Decision Gate

The plan has two stages:

```text
Stage A: truth audit and naming research
  -> write/update evidence-backed naming brief
    -> recommend keep/rename and exact rename layers
      -> STOP for explicit user acceptance

Stage B: apply accepted documentation and display-name outcome
  -> verify every truth band and affected display surface
    -> close plan and hand off to overnight-runner work
```

Rules:

- Stage A may update `docs/product-naming.md` with research and a recommendation before the final decision.
- Stage A must not replace `Demo Composer` across the repository.
- If the user has not accepted a naming outcome and exact rename layers, set this plan to `Awaiting naming decision`; do not mark it complete.
- If the decision is to keep `Demo Composer`, record that as intentional and do not perform speculative rename churn.
- If a new display name is accepted, change only the accepted display surfaces in this child.
- If repository/package/config/persistent identifier changes are requested, record a separate compatibility checklist and staged follow-up; do not mix a broad technical rename into this documentation-truth child.

## Truth-Band Model

Use these exact concepts where a document benefits from an explicit split:

### Available Today

Only behavior implemented and evidenced in the current alpha:

- self-hosted first-run setup and authentication;
- organization member/invite basics;
- Projects without Project Version runtime records;
- screenshot-first portal and extension Capture Sessions;
- Guide and Interactive Demo authoring as currently implemented;
- immutable current snapshot publishing and current public/restricted/password/embed behavior;
- current local storage, PostgreSQL, operations, and alpha limitations.

### Next Platform Direction

Accepted direction that is not current runtime behavior:

- Organization -> Project -> Project Version context;
- Project Membership and inherited Project Version permissions;
- comprehensive relational Audit and Access Evidence;
- Project Version-scoped Captures;
- stable Guide/Interactive Demo Artifact identities with Editions, Working Drafts, Revisions, and Publications;
- Carry-Forward and protected shared assets;
- independently configured multi-version Publish Links;
- Quiet Versioned Workbench and workflow-by-workflow UI modernization;
- Documentation as the next artifact family to grill and plan after the foundation closes.

### Intentionally Deferred

- Product Documentation runtime until child `131` accepts its domain and plans `132+` are created;
- Loom-style Video recording/library implementation;
- desktop recording;
- HTML replay;
- required AI authoring/search;
- hosted billing and sales-heavy analytics;
- other explicit Master Plan `005` non-goals.

Do not describe Documentation as merely another name for Guides. Do not describe Video as committed to the current master-plan implementation.

## Qualified Product Terms

Use these distinctions consistently:

- **Guide**: current Scribe-style ordered authored artifact.
- **Interactive Demo**: current scene/hotspot/transition authored artifact.
- **Product Documentation** or **Documentation artifact family**: future customer-authored documentation sites/knowledge bases whose exact model is deferred to child `131`.
- **Repository documentation**: Markdown files under the repository root and `docs/`.
- **Docs App**: `apps/docs`, the compact repository/open-source documentation hub.
- **Video**: future recorded-media artifact family; Loom-style implementation is deferred.

Avoid:

- `Guide / Doc` as one artifact term;
- calling `apps/docs` the Product Documentation implementation;
- saying Project Versions or Editions are available today;
- describing current `published_artifact.version_number` as Project Version;
- implying that Video tables, uploads, playback, comments, or transcripts are planned in this master.

## Exact Files To Read Before Implementation

Canonical plan and decisions:

```text
CONTEXT.md
docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md
docs/plan/109-agent-skills-and-repository-workflow.md
docs/plan/110-product-umbrella-naming-and-documentation-truth.md
docs/plan/111-project-version-and-artifact-edition-grill.md
docs/grill/2026-07-10-project-version-and-artifact-edition-grill.md
docs/adr/0021-project-versions-are-release-contexts.md
docs/adr/0022-artifacts-use-editions-revisions-and-publications.md
docs/adr/0023-comprehensive-audit-and-access-evidence-from-day-one.md
docs/adr/0024-project-membership-governs-project-access.md
docs/adr/0025-core-domain-persistence-is-explicitly-relational.md
docs/adr/0026-publish-links-are-multi-version-artifact-manifests.md
```

Primary product/current/future documentation:

```text
README.md
docs/product-idea.md
docs/system-design-pattern.md
docs/roadmap.md
docs/project-zoomout-status.md
docs/oss-alpha-summary.md
docs/contributor-guide.md
CONTRIBUTING.md
```

Current operations/evidence used to keep claims honest:

```text
docs/v1-dogfood-smoke-suite.md
docs/backend-route-inventory.md
docs/development-setup.md
docs/self-hosting.md
docs/operations.md
docs/production-readiness-checklist.md
apps/extension/README.md
```

Docs App content and tests:

```text
apps/docs/README.md
apps/docs/app/docs-content.ts
apps/docs/app/docs-content.test.ts
apps/docs/app/page.tsx
apps/docs/app/page.test.ts
apps/docs/app/page-style.test.ts
apps/docs/app/page.module.css
apps/docs/app/layout.tsx
apps/docs/package.json
```

Conditional display-name surfaces, read only after a new display name/layer is accepted:

```text
apps/web/src/App.tsx
apps/web/src/App.test.tsx
apps/web/src/features/auth/LoginPage.tsx
apps/web/src/features/setup/FirstRunSetupPage.tsx
apps/web/src/features/setup/FirstRunSetupPage.test.tsx
apps/web/src/features/organization/InviteAcceptPage.tsx
apps/web/src/features/portal/PortalTopbar.tsx
apps/web/src/features/portal/PortalTopbar.test.tsx
apps/extension/public/manifest.json
apps/extension/index.html
apps/extension/src/App.tsx
apps/server/src/app.ts
apps/server/src/app.test.ts
.github/ISSUE_TEMPLATE/bug_report.md
```

Technical-identifier inventory, inspect but do not change by default:

```text
package.json
pnpm-lock.yaml
docker-compose.yml
.github/workflows/ci.yml
apps/server/src/config/**/*
apps/server/src/modules/authentication/session-cookie.ts
apps/server/src/modules/authentication/request-session-token.ts
apps/extension/src/lib/api.ts
apps/extension/src/lib/content-click-capture.ts
apps/docs/next.config.js
apps/docs/app/docs-content.ts
```

## Required Affected Files

Documentation truth and naming decision:

```text
README.md
CONTEXT.md
CONTRIBUTING.md
docs/product-idea.md
docs/system-design-pattern.md
docs/roadmap.md
docs/project-zoomout-status.md
docs/oss-alpha-summary.md
docs/contributor-guide.md
docs/product-naming.md
apps/docs/README.md
apps/docs/app/docs-content.ts
apps/docs/app/docs-content.test.ts
apps/docs/app/page.tsx
apps/docs/app/page.test.ts
docs/plan/110-product-umbrella-naming-and-documentation-truth.md
docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md
```

Conditional Docs App presentation files if rendering the direction band requires composition changes:

```text
apps/docs/app/page.module.css
apps/docs/app/page-style.test.ts
```

Conditional accepted display-name files:

```text
apps/docs/app/layout.tsx
apps/web/src/App.tsx
apps/web/src/App.test.tsx
apps/web/src/features/auth/LoginPage.tsx
apps/web/src/features/setup/FirstRunSetupPage.tsx
apps/web/src/features/setup/FirstRunSetupPage.test.tsx
apps/web/src/features/organization/InviteAcceptPage.tsx
apps/web/src/features/portal/PortalTopbar.tsx
apps/web/src/features/portal/PortalTopbar.test.tsx
apps/extension/README.md
apps/extension/public/manifest.json
apps/extension/index.html
apps/extension/src/App.tsx
apps/server/src/app.ts
apps/server/src/app.test.ts
.github/ISSUE_TEMPLATE/bug_report.md
packages/*/README.md
```

Conditional compatibility artifact if the accepted decision includes any later technical layer:

```text
docs/rename-compatibility-checklist.md
```

Do not create a compatibility checklist when the decision is simply to keep the current name.

## Files And Surfaces Out Of Scope

Do not change merely to describe future direction:

```text
docs/backend-route-inventory.md
docs/development-setup.md
docs/self-hosting.md
docs/operations.md
docs/production-readiness-checklist.md
docs/v1-dogfood-smoke-suite.md
apps/server/src/db/**/*
packages/types/**/*
packages/constants/**/*
packages/*-domain/**/*
apps/web route structure
apps/extension capture contracts
```

Do not change in this child unless the user explicitly accepts a separate technical rename layer:

- repository directory or GitHub repository slug;
- root/app/package `name` fields;
- npm package scopes/imports;
- Docker container, database, or volume names;
- `DEMO_COMPOSER_*` environment variables;
- `demo_composer_session` or public viewer cookie names;
- `x-demo-composer-client`;
- `demo_composer:page_click`;
- API route paths;
- service identifiers such as `demo-composer-api`;
- storage paths/keys;
- migration filenames, schema names, table names, or migration history;
- deployed domains or secrets.

Do not:

- create Project Version, Documentation, or Video packages/routes/tables;
- add dead Product Documentation or Video navigation;
- recapture all alpha screenshots as a naming exercise;
- rewrite existing ADRs to make the naming choice appear architectural;
- claim legal trademark clearance;
- implement the overnight runner or create later child-plan skeletons.

## Document-By-Document Change Contract

### `README.md`

- Preserve the opening alpha/current capability summary.
- Keep and update `What Works Today` using only current evidence.
- Split the current `Product Shape` into clearly labeled current flow and `Next Platform Direction` umbrella.
- Add the accepted Organization -> Project -> Project Version -> Captures/Guides/Interactive Demos/Documentation/Video-later model as future direction, not current navigation/schema.
- Explain Editions/Revisions/Publications briefly only by linking to `CONTEXT.md`/Master Plan `005`; do not turn README into the full glossary.
- Keep `Intentionally Deferred` and add explicit Loom-style Video deferral.
- Clarify that Documentation is next to grill/build after the foundation, while `apps/docs` remains repository documentation.
- Keep installation/runtime commands accurate and unchanged.

### `CONTEXT.md`

- Update only the opening product-context description and accepted naming references needed for a display-name decision.
- Preserve the accepted glossary/relationships/ambiguity resolutions from child `111`.
- Do not add a Documentation content model or Video domain terms beyond the already accepted artifact-family direction.
- If a display name changes, update human product references consistently while retaining technical identifier language where technically qualified.

### `docs/product-idea.md`

- Add explicit truth bands near the top.
- Update the purpose/summary from two-output creator to project-organized knowledge platform direction while preserving the current alpha as two implemented authored outputs.
- Replace `Guide / Doc` with `Guide`.
- Add separate future sections for Product Documentation and later Video without specifying ungrilled schemas.
- Add Project Version/Edition/Revision/Publication relationships from accepted decisions.
- Preserve Capture Session as reusable source and Guide/Demo distinct content models.
- Mark HTML capture, AI, analytics, and Video as deferred accurately.
- Reconcile or remove stale open questions already resolved by child `111`; do not invent answers to child `131` questions.

### `docs/system-design-pattern.md`

- Preserve the implemented Fastify/REST/Zod/SQL/domain-package architecture.
- Label current package/runtime structure separately from accepted target domain direction.
- Add a target ownership diagram for Project Version, membership, Audit/Access Evidence, type-specific Artifact Editions/Revisions/Publications, and protected assets.
- Do not list nonexistent Project Version/Documentation/Video packages as current folders.
- Keep Documentation renderer/tooling and Video architecture undecided.
- Keep explicit relational persistence and no generic core-domain JSON/JSONB target visible.

### `docs/roadmap.md`

- Refresh the review date.
- Preserve `Alpha Now` as current capability.
- Replace stale `V1 Hardening` next-step framing with the ordered Master Plan `005` foundation at an appropriate level.
- Show Documentation as the next artifact family after the foundation and child `131` grill.
- Show Video/Loom-style implementation as later.
- Keep deferred production/extension limitations visible without making them the sole next direction.
- Do not promise dates.

### `docs/project-zoomout-status.md`

- Refresh the date/current evidence only where verified.
- Keep the current alpha workflow and known gaps intact.
- Replace `Recommended Next Direction` with the accepted Master Plan `005` sequence.
- Distinguish accepted future terms in `CONTEXT.md` from unimplemented runtime.
- Link Master Plan `005` and completed child `111`.

### `docs/oss-alpha-summary.md`

- Keep the short current-alpha description truthful.
- Add a compact next-direction paragraph without making future features sound shipped.
- Preserve self-hosting/privacy rationale and known limits.
- Separate Product Documentation from Guides and `apps/docs`.

### `CONTRIBUTING.md` And `docs/contributor-guide.md`

- Keep application contribution possible without agent tooling.
- Link to `AGENTS.md` and `docs/agent-workflow.md` after child `109`.
- Explain current capability versus accepted platform direction.
- Point domain terminology changes to `CONTEXT.md` and durable decisions to ADRs.
- Clarify that new Documentation/Video runtime work is blocked by the master-plan gates.

### `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

- Mark child `110` complete only after the naming decision, documentation updates, and verification are accepted.
- Record the accepted keep/rename outcome and the exact rename layers applied or deferred.
- Insert the post-`110` overnight-runner checkpoint before child `112` execution so the operational sequence matches the accepted overnight workflow.
- Keep the product delivery dependency graph unchanged: the runner is workflow tooling, not a new numbered product child or a substitute for any child acceptance gate.
- Preserve child `131` as the mandatory interactive Documentation-domain grill and preserve Documentation implementation as `132+` work.

### `apps/docs`

- Keep the site a compact repository documentation hub.
- Fix stale current-alpha limitations, especially extension evidence that was superseded by plans `101` through `103`.
- Add a clearly labeled `Next Platform Direction` section using a small data structure exported by `docs-content.ts` and rendered by `page.tsx`.
- State that Product Documentation runtime is not `apps/docs`.
- Keep current alpha screenshots under `What Works Today`/evidence, never under future direction.
- Keep deep-dive Markdown docs as source of truth.
- Add or update content/component/style tests for the new band.
- Do not redesign the docs site in this plan.

## Product Direction Content Requirements

Every direction summary must preserve these accepted boundaries:

- Projects organize knowledge by real Project Versions, beginning with `Main` after runtime implementation.
- Captures belong to one Project Version after version-scoping implementation.
- Guides and Interactive Demos remain separate artifact families.
- Stable Artifact identity spans Project Versions through type-specific Editions.
- Normal saves affect a Working Draft; Revisions are immutable checkpoints; Publications identify immutable Revisions.
- Carry-Forward creates independent target working content and reuses protected immutable assets.
- Publish Links can expose explicitly selected versions after the publication integration ships.
- Audit/Access and Project Membership precede new version-domain mutations.
- Documentation reuses shared vocabulary only after its own grill; it does not inherit Guide/Demo content structures automatically.
- Video remains later and has no model in this track.

Use wording such as `accepted target`, `next platform direction`, `planned foundation`, and `will be implemented by Master Plan 005`. Avoid present-tense claims for unimplemented behavior.

## Naming Research Plan

### Naming Brief

Create `docs/product-naming.md` with:

1. Current-name assessment.
2. Accepted product scope and audience.
3. Naming criteria from Master Plan `005`.
4. Naming territories explored.
5. Candidate-generation method.
6. Evidence matrix.
7. Rejected candidates with concise reasons.
8. Shortlist and recommendation.
9. User decision and date.
10. Accepted rename layers.
11. Risks, legal caveat, and staged follow-up.

### Candidate Process

1. Keep `Demo Composer` as a scored baseline candidate.
2. Generate candidates across at least three territories:
   - captured workflow becoming maintained knowledge;
   - project/version-aware knowledge source of truth;
   - paths/traces/flows/manuals/knowledge workspace.
3. Remove names that are hard to pronounce/spell, overly narrow, or imply AI/video/sales as the whole product.
4. Perform collision research on the reduced set.
5. Present no more than three serious new-name finalists plus the keep-current option.
6. Recommend one outcome with evidence and tradeoffs.

### Evidence Sources

Use current internet research during implementation. For each serious finalist, check:

- general search collisions and software-product usage;
- GitHub organizations and repositories;
- npm package and scope collisions;
- obvious domain availability/ownership signals across reasonable domain choices;
- relevant app/product directories where practical;
- preliminary trademark databases appropriate to likely markets, including a broad international source and major target jurisdictions;
- pronunciation, spelling, and search ambiguity;
- likely repository/package/config forms.

Rules:

- Link the dated primary evidence used.
- Distinguish `no obvious collision found` from `available` or `legally clear`.
- Domain/handle availability is transient and must be timestamped.
- Do not purchase domains, create accounts, reserve handles, file trademarks, or contact owners.
- Preliminary research is risk reduction, not legal advice or trademark clearance.

### Scoring

Score the keep-current option and finalists consistently across:

- umbrella fit for Guides, Interactive Demos, Documentation, and later Video;
- internal/external knowledge fit;
- pronounceability and spelling;
- memorability without novelty-for-novelty's-sake;
- search/collision risk;
- domain/repository/package practicality;
- international and accessibility concerns;
- future flexibility;
- rename cost.

Do not let an available domain outweigh product clarity or collision risk.

## Naming Decision Gate

Present the user with:

- the recommendation;
- up to three finalists plus `Keep Demo Composer`;
- the scoring/evidence matrix;
- the proposed rename layers;
- exact files/surfaces affected now;
- exact technical identifiers intentionally retained;
- risks and follow-up needs.

The accepted decision must be one of:

1. Keep `Demo Composer` intentionally.
2. Adopt a new display brand while retaining repository/package/config/persistent identifiers temporarily.
3. Adopt a new name and approve a separate staged technical rename plan.

Default plan recommendation if a broader name is accepted:

- apply the display brand only;
- keep repository URL/slug and package/import/config/persistent identifiers stable;
- create a compatibility checklist for later layers;
- update visual identity/tokens later in child `121`.

Record the exact accepted spelling, capitalization, short form, and whether possessive/plural variants are allowed. Do not infer those details later.

## Rename-Layer Contract

### Layer 1: Display Brand

Eligible for this child after explicit acceptance:

- documentation titles and narrative product references;
- portal-visible brand labels and setup headings;
- extension-visible name/title/brand label;
- Docs App name and metadata;
- human-facing OpenAPI title/description only if explicitly included;
- issue-template display copy;
- tests asserting those visible strings.

Technical values embedded in the same files remain unchanged unless separately accepted.

### Layer 2: Repository Identity

Not changed automatically:

- GitHub repository name/URL;
- clone instructions;
- badges/source links;
- project directory name.

If later approved, document redirects/link updates and deployment implications in `docs/rename-compatibility-checklist.md`.

### Layer 3: Package Identity

Deferred by default:

- root/app package names;
- workspace package scopes;
- imports;
- image/package publishing names.

### Layer 4: Runtime Configuration

Deferred by default:

- environment-variable prefixes;
- cookies;
- service identifiers;
- Docker/database/storage names;
- extension header/message strings.

### Layer 5: Persistent Identifiers

Do not change in this child:

- schema/table/column names;
- migration history;
- API route shapes;
- persisted public slugs/URLs;
- storage keys and external references.

## Screenshot And Historical Evidence Rules

- Current screenshots remain evidence of the current alpha and must not be edited solely to replace a visible name.
- If an accepted display rename makes a screenshot visibly historical, label it as pre-rename alpha evidence with its capture date until UI children refresh it.
- Do not alter image pixels in this documentation/naming plan.
- Do not change historical plan, grill, ADR, commit, or evidence text merely to replace the old name. Historical documents may legitimately retain the name used at the time.
- Update active docs and product surfaces; preserve historical accuracy.

## Routes, APIs, Schemas, And Persistence

No route, request/response contract, shared Zod schema, database schema, migration, or product-domain behavior change is expected.

If a display rename includes OpenAPI metadata:

- only change the human-facing title/description;
- preserve `service: "demo-composer-api"` and all route behavior by default;
- update `apps/server/src/app.test.ts` assertions;
- do not rename response fields, headers, cookies, error types, or identifiers.

If any implementation step appears to require a route/schema/persistence change, stop and move it to a staged technical rename follow-up.

## Accessibility And UI Rules

The Docs App direction band is content work, not the modern UI redesign.

- Reuse the existing page structure and styles.
- Keep semantic section headings and meaningful labels.
- Do not add dead Documentation/Video navigation or commands.
- Keep future direction visually distinct from current capability and limitations without relying on color alone.
- Preserve responsive layout, neutral letter spacing, and non-viewport-scaled typography tests.
- If `page.tsx` or CSS changes, validate desktop and narrow mobile rendering with `agent-browser` using safe public content.
- Do not apply Impeccable redesign commands; child `121` owns the design-system foundation.

## Implementation Sequence

### Phase 1: Baseline And Truth Inventory

1. Confirm child `109` is complete and the worktree is clean.
2. Record starting commit and baseline verification.
3. Build a current/future/deferred claim matrix for every required document.
4. Cross-check current claims against route inventory, smoke evidence, current app code, and completed plans.
5. Identify stale statements without changing excluded current-runtime source documents unnecessarily.

### Phase 2: Naming Research And Recommendation

1. Create the naming brief structure.
2. Generate and reduce candidates using the accepted criteria.
3. Perform dated collision/domain/package/trademark research.
4. Score finalists and the keep-current baseline.
5. Record recommendation, risks, proposed rename layers, and exact affected surfaces.
6. Commit the research/brief separately if useful before waiting.

### Phase 3: Mandatory User Decision

1. Present the decision packet.
2. Stop without applying a new name.
3. Record the accepted outcome, spelling, and rename layers.
4. Recheck the affected-file matrix against that exact decision.

### Phase 4: Documentation Truth Update

1. Update current/future/deferred bands across required docs.
2. Align product/model/architecture/roadmap/status language with child `111` without claiming runtime implementation.
3. Update the Docs App content and tests.
4. Keep Product Documentation, repository docs, Docs App, and Video distinct.
5. Apply accepted display-name changes only if approved.
6. Create a compatibility checklist only if later rename layers were accepted for separate execution.

### Phase 5: Verification And Closeout

1. Run doc/reference/name scans.
2. Run focused Docs App tests/build and browser checks when page composition changed.
3. Run conditional web/extension/server checks when accepted display surfaces changed.
4. Run repository-wide non-DB regression checks.
5. Recheck active docs against current behavior and the master.
6. Update this plan's status, implementation log, decision record, verification, and leftovers.
7. Mark only child `110` complete in Master Plan `005`.
8. Hand off to the separate overnight-runner tooling checkpoint before child `112` skeleton creation/execution.

## Verification Commands

Baseline and formatting:

```bash
rtk git status --short
rtk git diff --check
rtk pnpm exec prettier --check README.md CONTEXT.md CONTRIBUTING.md docs/product-idea.md docs/system-design-pattern.md docs/roadmap.md docs/project-zoomout-status.md docs/oss-alpha-summary.md docs/contributor-guide.md docs/product-naming.md docs/plan/110-product-umbrella-naming-and-documentation-truth.md docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md
```

Truth and terminology scans:

```bash
rtk rg -n 'Guide / Doc|Guide/Doc|latest version|artifact version|published version' README.md CONTEXT.md CONTRIBUTING.md docs apps/docs
rtk rg -n 'Project Version|Artifact Edition|Working Draft|Artifact Revision|Publication Sequence|Product Documentation|Docs App|Video' README.md CONTEXT.md docs/product-idea.md docs/system-design-pattern.md docs/roadmap.md docs/project-zoomout-status.md docs/oss-alpha-summary.md apps/docs
rtk rg -n 'Documentation.*implemented|Video.*implemented|Loom.*implemented' README.md docs apps/docs
```

Interpret scan results; historical grill/ADR/plan text and explicitly qualified current database terminology may legitimately contain otherwise ambiguous phrases.

Docs App focused checks:

```bash
rtk pnpm --filter docs test
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
rtk pnpm --filter docs build
```

Conditional accepted display-name checks:

```bash
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm --filter server test
rtk pnpm --filter web check-types
rtk pnpm --filter extension check-types
```

Repository-wide checks:

```bash
rtk pnpm turbo run test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

No DB-backed test is required for documentation-only changes. Run focused DB/smoke tests only if the accepted display-name work unexpectedly touches server behavior; such a change should normally be rejected as out of scope.

Browser validation when `apps/docs/app/page.tsx` or layout styles change:

- start the Docs App on an available local port;
- validate at one desktop and one narrow mobile viewport;
- verify current and future sections cannot be confused;
- check headings, keyboard links, overflow, text clipping, console errors, failed requests, and image loading;
- use only existing safe synthetic evidence;
- record screenshots as temporary verification evidence unless an active docs screenshot is deliberately refreshed.

## Commit Strategy

Keep the decision boundary visible:

1. Naming research/decision brief before user acceptance, if a durable checkpoint is useful.
2. Product documentation truth updates and Docs App content.
3. Accepted display-brand changes and their focused tests, only when a new display name is approved.
4. Final closeout docs only if verification produces later corrections.

Do not mix the post-`110` overnight-runner program, child `112+` skeletons, or runtime versioning implementation into these commits.

## Acceptance Criteria

- Every primary product document distinguishes Available Today, Next Platform Direction, and Intentionally Deferred where appropriate.
- Current alpha capability and limitations remain accurate.
- The umbrella direction is Organization -> Project -> Project Version -> distinct artifact families.
- Guides, Interactive Demos, Product Documentation, repository docs, Docs App, and later Video cannot be confused.
- Accepted Project Version/Edition/Revision/Publication language is used without claiming it is implemented.
- `docs/product-idea.md` no longer treats `Guide / Doc` as one ambiguous artifact.
- Architecture docs do not invent runtime packages, routes, tables, or renderers.
- Roadmap/status docs point to Master Plan `005` as the next track.
- The Docs App fixes stale current evidence and displays a clearly qualified next-direction band.
- `docs/product-naming.md` records dated evidence, shortlist, recommendation, accepted outcome, risks, and rename layers.
- The user explicitly accepts the keep/rename decision and exact layers.
- Any display-name change updates only accepted human-facing surfaces and tests.
- Technical identifiers and migration history remain unchanged unless deferred in a separate compatibility checklist.
- Historical plans/ADRs/evidence remain historically accurate.
- Focused and broad verification passes or unrelated pre-existing failures are recorded.
- Master Plan `005` marks only child `110` complete.

## Non-Goals

- Implementing Project Versions, Project Membership, Audit/Access Evidence, Editions, Revisions, Publications, Carry-Forward, or multi-version Publish Links.
- Implementing Product Documentation or Video.
- Conducting the Product Documentation grill early.
- Building the overnight runner.
- Creating child `112-131` files.
- Redesigning the portal, editors, readers, extension, or Docs App.
- Renaming technical identifiers, packages, schemas, migrations, routes, cookies, headers, service IDs, or environment variables without a separate accepted plan.
- Purchasing domains, reserving accounts/handles, filing trademarks, or claiming legal clearance.
- Rewriting historical decision/evidence documents solely for branding.

## Completion Checklist

- [ ] Child `109` dependency verified complete.
- [ ] Starting commit and clean worktree recorded.
- [ ] Current/future/deferred claim matrix completed.
- [ ] Naming criteria and territories confirmed from Master Plan `005`.
- [ ] Candidate collision/domain/package/trademark research completed and dated.
- [ ] Naming brief and recommendation written.
- [ ] User naming decision and exact rename layers accepted.
- [ ] README truth bands updated.
- [ ] Product idea umbrella and qualified artifact families updated.
- [ ] System design current/target boundary updated.
- [ ] Roadmap and project status next direction updated.
- [ ] OSS/contributor docs synchronized.
- [ ] `CONTEXT.md` opening/name references updated without speculative terms.
- [ ] Docs App current evidence corrected and direction band added.
- [ ] Accepted display-name surfaces updated, or intentional keep decision recorded.
- [ ] Technical identifiers confirmed unchanged or deferred explicitly.
- [ ] Focused docs/app tests passed.
- [ ] Conditional browser/display-name checks passed.
- [ ] Repository-wide non-DB checks passed.
- [ ] Implementation log, decision, verification, and leftovers recorded.
- [ ] Master Plan `005` updated only for completed child `110` items.
- [ ] Post-`110` overnight-runner handoff recorded.

## Implementation Log

Not started.

Implementation must record:

- starting and ending commits;
- claim-audit findings and stale statements corrected;
- naming candidates researched and evidence dates;
- user decision, exact spelling, and accepted layers;
- files changed under each layer;
- technical identifiers deliberately retained;
- verification commands and outcomes;
- browser evidence when applicable;
- leftovers for child `121`, the technical rename checklist, and the overnight runner.

## Handoff After Child 110

After `110` is complete:

1. Do not begin child `112` implementation immediately.
2. Design and implement the reusable overnight master-plan runner in the shared prompt-generator tooling, using the accepted critical-versus-agent-decidable policy from child `109`.
3. Version-control and test that tooling before trusting it with repository commits.
4. Create reserved skeletons for children `112` through `131`; child `111` remains completed and excluded from the queue.
5. Expand each implementation child just in time against the actual preceding result.
6. Queue `112` through `130` sequentially with stop-on-critical-decision behavior.
7. Keep child `131` as the next mandatory interactive, one-question-at-a-time Documentation grill.

This is an operational workflow checkpoint, not a new numbered product child and not a change to the Master Plan's product dependency graph. The Master Plan must record it so a future operator does not skip it.

Child `121` must consume the accepted display name and later create/accept `PRODUCT.md` and `DESIGN.md`. A display-name decision in this child does not predetermine child `121` typography, palette, logo, tokens, or visual system.
