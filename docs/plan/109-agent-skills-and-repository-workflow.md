# Child Plan 109: Agent Skills And Repository Workflow

Date: 2026-07-10

Last reviewed: 2026-07-10

Status: Complete on 2026-07-10.

## Parent Master Plan

```text
docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md
```

This is child plan `109` of the Knowledge Platform and UI Foundation track. Child `111` has already completed the Project Version and Artifact Edition grill, but `109` remains the first executable child because repository guidance and reusable skills must exist before the remaining implementation track relies on them.

## Objective

Establish a portable, reviewable agent workflow for this repository without coupling agent tooling to application build or runtime behavior.

This plan must:

- create concise root agent guidance;
- install only reviewed, pinned, repository-local external design/review skills;
- create four repository-local procedural skills;
- define instruction precedence and decision-escalation rules;
- validate that each local skill can be discovered and used for its intended workflow;
- record provenance, licensing, update, and removal instructions;
- leave the monorepo buildable if every agent skill is removed.

This plan does not build the overnight master-plan runner. It creates the stable instructions, decision policy, and child-plan workflow that the runner will consume after child `110` is complete.

## Expansion And Recheck Findings

This plan was expanded on 2026-07-10 against Master Plan `005`, the current repository, the installed `skill-creator`/`skill-installer` instructions, and the current design-skill source review recorded in the master plan.

Current findings:

- The repository has no committed root `AGENTS.md`.
- The repository has no committed `.agents/skills/` tree.
- Current agent instructions are being supplied from the user's environment and include an absolute machine path to `RTK.md`; committed repository guidance must not copy that absolute path.
- Existing contributor docs describe planning and verification but do not define skill discovery, instruction precedence, external skill provenance, or decision escalation.
- `apps/web` and `apps/extension` already use Tailwind CSS 4, Lucide is already used by the web/UI packages, and `packages/ui` already owns basic source primitives. External design skills must work with that foundation instead of proposing a fresh framework migration by default.
- The current machine runs Node 26 while the monorepo declares `node >=18`. Impeccable's current CLI requires Node 24; that requirement must remain isolated to optional agent tooling.
- `agent-browser`, `test-driven-development`, `grill-with-docs`, `skill-creator`, and `skill-installer` are available in the current agent environment, but they are not repository-owned runtime dependencies.
- The future overnight plan runner needs a machine-readable stop/continue policy, but implementing its SDK process, queue state, retry loop, or scheduler is explicitly deferred until after child `110`.

No runtime code, route, schema, migration, product UI, or product-name change is necessary for this plan.

## Dependency And Execution Order

Required order:

```text
recheck source revisions and licenses
  -> inspect installer/package behavior without accepting changes
    -> create root guidance and repository-local skills
      -> install one external source at a time
        -> review and record every generated file
          -> validate discovery and representative dry runs
            -> run repository regression checks
              -> close child 109 and hand off to child 110
```

Hard gates:

- Do not execute an unpinned `npx ...@latest` installer.
- Do not enable or commit design hooks in this plan.
- Do not accept an installer that changes global config, credentials, shell startup files, application dependencies, application lockfiles, Git hooks, or executable policy without a separate explicit user decision.
- Stop for user approval if a reviewed source has no acceptable license, cannot be pinned/reproduced, requires credential access, or conflicts with repository instructions.
- Install sources sequentially so each diff is attributable and reversible.
- Keep the worktree clean before the first install and inspect it after every install.

## Canonical Instruction Precedence

The committed guidance and local skills must define this precedence from strongest to weakest:

1. Platform/system/developer/user instructions for the active session.
2. The closest applicable repository `AGENTS.md`.
3. `CONTEXT.md` for canonical product/domain language.
4. Accepted ADRs in `docs/adr/`.
5. The active master plan and current child plan.
6. Current implementation and tests for discoverable runtime facts.
7. Repository-local procedural skills.
8. Reviewed external skills and general design/engineering advice.

External skill advice must never silently override domain terms, accepted permissions, migration boundaries, immutable-source/publication rules, or explicit master-plan scope.

## Exact Files To Read Before Implementation

Repository guidance and planning:

```text
CONTEXT.md
CONTRIBUTING.md
README.md
docs/contributor-guide.md
docs/system-design-pattern.md
docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md
docs/plan/109-agent-skills-and-repository-workflow.md
docs/plan/111-project-version-and-artifact-edition-grill.md
docs/grill/2026-07-10-project-version-and-artifact-edition-grill.md
```

Accepted decisions used by the local skills:

```text
docs/adr/0021-project-versions-are-release-contexts.md
docs/adr/0022-artifacts-use-editions-revisions-and-publications.md
docs/adr/0023-comprehensive-audit-and-access-evidence-from-day-one.md
docs/adr/0024-project-membership-governs-project-access.md
docs/adr/0025-core-domain-persistence-is-explicitly-relational.md
docs/adr/0026-publish-links-are-multi-version-artifact-manifests.md
```

Current workflow/evidence docs referenced by the local skills:

```text
docs/development-setup.md
docs/v1-dogfood-smoke-suite.md
docs/backend-route-inventory.md
docs/production-readiness-checklist.md
docs/operations.md
apps/extension/README.md
package.json
turbo.json
pnpm-workspace.yaml
```

Installed skill-authoring instructions, located through the active Codex environment rather than copied into repository files:

```text
skill-creator/SKILL.md
skill-installer/SKILL.md
agent-browser/SKILL.md
test-driven-development/SKILL.md
grill-with-docs/SKILL.md
```

Rules:

- Locate environment-provided skills through Codex discovery or `$CODEX_HOME`; do not encode `/home/tm/...` paths in committed output.
- Read the complete upstream `SKILL.md`, license, manifest/package metadata, installer scripts, and generated-file logic for every external source before installation.
- Re-resolve all remote source revisions during implementation because the master-plan snapshot is dated evidence, not a permanent unverified pin.

## Expected Affected Files

Required repository guidance:

```text
AGENTS.md
docs/agent-workflow.md
docs/contributor-guide.md
```

Required repository-local skills:

```text
.agents/skills/model-demo-composer-domain/SKILL.md
.agents/skills/model-demo-composer-domain/agents/openai.yaml
.agents/skills/build-demo-composer-slice/SKILL.md
.agents/skills/build-demo-composer-slice/agents/openai.yaml
.agents/skills/design-demo-composer-ui/SKILL.md
.agents/skills/design-demo-composer-ui/agents/openai.yaml
.agents/skills/dogfood-demo-composer/SKILL.md
.agents/skills/dogfood-demo-composer/agents/openai.yaml
```

Expected reviewed external skill destinations, subject to exact installer/source inspection:

```text
.agents/skills/impeccable/
.agents/skills/emil-design-eng/
.agents/skills/review-animations/
.agents/skills/animation-vocabulary/
.agents/skills/apple-design/
.agents/skills/react-best-practices/
.agents/skills/web-design-guidelines/
.agents/skills/accessibility/
```

Plan/status files:

```text
docs/plan/109-agent-skills-and-repository-workflow.md
docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md
```

Conditional files only when required by a reviewed installer or attribution obligation:

```text
.gitignore
THIRD_PARTY_NOTICES.md
```

Application package/lock changes are not expected. If an installer attempts to change any of the following, reject that path and prefer pinned repository-local vendoring unless the user explicitly accepts the change:

```text
package.json
pnpm-lock.yaml
apps/*/package.json
packages/*/package.json
```

## Files And Surfaces Out Of Scope

Do not change:

```text
apps/server/**/*
apps/web/**/*
apps/extension/**/*
apps/docs/**/*
packages/**/*
docs/adr/**/*
docs/grill/**/*
docs/assets/**/*
.github/workflows/**/*
database migrations
runtime environment variables
runtime package names
```

Do not create in this child:

- the overnight SDK/CLI master-plan runner;
- queue state files, scheduler services, or automatic retry processes;
- `PRODUCT.md` or `DESIGN.md` (owned by child `121`);
- a new product name or brand migration;
- hooks that run on every tool call, commit, or file edit;
- MCP servers, plugins, or application dependencies merely to distribute skills;
- copies of `CONTEXT.md`, ADRs, or the master plan inside skill reference folders.

## External Skill Evaluation Matrix

The following set is approved for evaluation, not blind installation:

| Skill(s)                                                                       | Source                          | Reviewed master-plan HEAD on 2026-07-10    | Intended role                                                                 | Expected disposition                                             |
| ------------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `impeccable`                                                                   | `pbakaus/impeccable`            | `da99645a58400ed7acb201e6904f9413efd89c6e` | Primary product-design workflow and later `PRODUCT.md`/`DESIGN.md` generation | Install one pinned repository-local build; hooks disabled        |
| `emil-design-eng`, `review-animations`, `animation-vocabulary`, `apple-design` | `emilkowalski/skills`           | `f76beceb7d3fc8c43309cefad5a095a206103a4e` | Interaction, design restraint, motion review, and shared animation language   | Vendor/install only the four named skills from one pinned commit |
| `react-best-practices`, `web-design-guidelines`                                | `vercel-labs/agent-skills`      | `f8a72b9603728bb92a217a879b7e62e43ad76c81` | React performance/component review and web-interface review                   | Vendor/install only the two named skills from one pinned commit  |
| `accessibility`                                                                | `addyosmani/web-quality-skills` | `95d6e255afe1596b557d7a8498517884438f5b3a` | Dedicated WCAG 2.2 accessibility review                                       | Vendor/install only the named skill from one pinned commit       |

For each source, record in `docs/agent-workflow.md`:

- repository URL;
- exact commit, package version, and integrity value where applicable;
- retrieval date;
- upstream skill path(s);
- license and required attribution;
- installed destination(s);
- installer command or vendoring method;
- files created or modified;
- executable scripts and network behavior;
- hook behavior and whether it was disabled;
- Node/tool prerequisites;
- update procedure;
- removal procedure;
- known conflicts or precedence notes.

### Pinning And Installation Rules

- Prefer the repository `skill-installer` helper with `--ref <exact-commit>` and a repository-local destination when the upstream content can be installed directly.
- For Impeccable, resolve the exact npm package version and integrity, inspect the package tarball/installer, and invoke an exact version rather than `@latest` if the harness-specific installer is retained.
- If the Impeccable installer cannot target the repository cleanly without hooks or unrelated config changes, install the reviewed skill content through the generic pinned skill path instead.
- Never mix content from a newer default branch with a recorded older commit.
- Preserve upstream license/copyright notices required by the source license.
- Do not modify vendored external skill instructions to encode repository-specific truth. Put repository-specific procedure in the four local skills.
- Do not install overlapping generic design bundles without a documented gap and master-plan update.

## Root `AGENTS.md` Requirements

The root file must be concise and use only repository-relative paths. It must tell an agent to:

- read `CONTEXT.md`, the applicable ADRs, the active master plan, and the active child plan before consequential work;
- preserve current user/agent changes and never destructively reset the worktree;
- use `rtk` for shell commands in this repository and prefer `rg`/`rg --files` for search;
- use `apply_patch` for manual edits;
- use test-driven development for behavior changes;
- keep tenant isolation, immutable Capture sources, protected assets, and immutable Publications intact;
- distinguish current behavior from accepted future direction;
- use real browser validation for browser-visible workflows;
- update child-plan status, implementation log, verification, leftovers, and master checklist only when work is genuinely complete;
- stop for critical product/security/destructive decisions and use best engineering judgment for reversible implementation details;
- prefer the four repository-local skills for domain modeling, slice delivery, UI work, and dogfood;
- treat external skill advice as subordinate to repository truth.

It must not:

- contain a personal home-directory include;
- duplicate the glossary or ADR contents;
- claim unavailable commands or skills are guaranteed on every contributor machine;
- embed secrets, tokens, local database credentials, or absolute browser/profile paths;
- make agent tooling a prerequisite for building or running the product.

## `docs/agent-workflow.md` Requirements

This document is the human-facing registry and operating guide. It must include:

1. Instruction precedence.
2. Skill availability classes:
   - repository-installed;
   - agent-environment provided;
   - repository-local.
3. External skill provenance and license table.
4. Installation/update/removal procedures.
5. Child-plan lifecycle.
6. Critical versus agent-decidable decision policy.
7. Verification and browser-evidence expectations.
8. Troubleshooting when a skill or browser capability is unavailable.
9. The explicit boundary that the overnight plan runner will be designed after child `110`.

The document should link to canonical sources instead of restating domain rules.

## Decision Escalation Policy

The root guidance and `build-demo-composer-slice` skill must encode the following behavior for future manual and automated execution.

### Agent-Decidable

The agent should reason, choose, document, and continue when the choice:

- stays inside accepted master-plan/ADR boundaries;
- follows an existing repository pattern;
- is reversible and locally testable;
- does not change user-facing product semantics;
- does not weaken security, privacy, tenant isolation, retention, or immutability;
- does not introduce a major dependency, external service, incompatible license, or destructive operation.

Examples include internal file placement, helper boundaries, test organization, fixtures, indexes justified by accepted queries, and small in-scope refactors.

### Critical Decision Required

The agent must stop and recommend an answer when a choice:

- contradicts `CONTEXT.md`, an accepted ADR, or the master plan;
- changes Project Version, Artifact, Edition, Revision, Publication, permission, audit, or access semantics;
- affects tenant isolation, authentication, secrets, privacy, physical deletion, or protected assets;
- changes accepted public URL or immutable Publication behavior;
- introduces major framework/service/license lock-in;
- changes child scope, order, dependencies, or completion meaning materially;
- performs destructive Git, deployment, credential, or infrastructure operations;
- requires product-name or design-direction acceptance.

The skill must require a concise question, recommendation, alternatives, evidence, reversibility assessment, and affected scope. It must not ask the user to decide routine implementation details.

## Repository-Local Skill Specifications

Every local skill must:

- use a lowercase hyphenated directory/name under 64 characters;
- contain valid YAML frontmatter with exactly the required discovery metadata;
- contain `agents/openai.yaml` generated from the final `SKILL.md`;
- keep `SKILL.md` concise and below 500 lines;
- use progressive disclosure and only add `references/` or `scripts/` when they remove real repeated work;
- avoid README/changelog/install-guide files inside the skill;
- use repository-relative links;
- contain no copied canonical domain truth;
- fail clearly when a required environment capability is unavailable.

### `model-demo-composer-domain`

Trigger when work changes or questions product/domain language, ownership, lifecycle, relationships, persistence meaning, or a durable decision.

Required workflow:

1. Read `CONTEXT.md` and relevant ADRs.
2. Inspect current schema/code/tests for discoverable facts.
3. Identify overloaded terms such as version, page, demo, publication, recording, member, and deletion.
4. Separate current runtime facts from accepted target direction.
5. Surface contradictions before implementation.
6. Update `CONTEXT.md` only for accepted domain language.
7. Offer an ADR only when the decision is durable, surprising, hard to reverse, and based on a real tradeoff.

It must not embed the current glossary as a reference copy.

### `build-demo-composer-slice`

Trigger for expanding, rechecking, implementing, verifying, or closing a master-plan child.

Required workflow:

```text
preflight
  -> expand/recheck current child
    -> classify unresolved decisions
      -> plan/docs commit when accepted
        -> red/green/refactor implementation
          -> focused then broad verification
            -> same-child closeout and handoff
```

It must require:

- clean-worktree/ownership inspection without reverting unrelated changes;
- exact file and contract boundaries;
- shared-contract reuse gates;
- migration/reset/reseed discipline;
- tenant-isolation and audit integration;
- browser validation when applicable;
- critical-decision stop behavior from this plan;
- status, implementation log, verification evidence, leftovers, and next-plan handoff;
- a final summary with plan number, outcome, commits, verification, unresolved decisions, and next executable child so a later runner can consume stable fields.

It must not implement the future queue runner itself.

### `design-demo-composer-ui`

Trigger for product UI architecture, screen composition, design-system work, interaction/motion, or UI review.

Bootstrap source order before child `121`:

```text
CONTEXT.md
Master Plan 005 section 10 and child 121 scope
current packages/ui and application UI
current product/status docs
reviewed external design skills
```

After child `121`, the skill must be updated and revalidated to read accepted root `PRODUCT.md` and `DESIGN.md` before implementation.

It must require complete loading/empty/error/permission/destructive/responsive states, existing primitive reuse, accessibility, stable dimensions, restrained motion, and real-browser evidence. It must prohibit dead navigation, nested cards, decorative gradients/orbs, marketing-page composition in the portal, and blind framework replacement.

### `dogfood-demo-composer`

Trigger for real-browser portal, docs-app, reader/viewer, embed, or Chrome extension verification.

It must point to existing setup/evidence docs and define:

- safe synthetic fixture requirements;
- server/web/docs/extension startup discovery;
- `agent-browser` session naming and cleanup;
- desktop, mobile, zoom/reflow, keyboard, console, network, and screenshot checks;
- public versus authenticated route isolation;
- extension automation versus true toolbar-popup evidence distinctions;
- no private URLs, customer screenshots, tokens, cookies, or raw captured input values in evidence;
- a clear blocked result when the required browser/extension capability is unavailable.

It must not hard-code the current user's absolute workspace path, Chrome profile, extension ID, or local secrets.

## Skill Initialization And Validation

Use the installed `skill-creator` initialization and validation helpers rather than hand-building inconsistent directory scaffolds.

For each local skill:

1. Define representative trigger prompts and non-trigger prompts.
2. Initialize the skill under `.agents/skills/` with deterministic interface metadata.
3. Replace all template placeholders.
4. Remove unused example/resource directories.
5. Run the skill creator's structural validator.
6. Inspect `SKILL.md` for size, duplicate truth, absolute paths, and unsafe commands.
7. Regenerate `agents/openai.yaml` after the final body is stable.
8. Run one fresh read-only dry run and record the prompt, expected behavior, actual behavior, and result in this child plan's implementation log.

Representative dry runs:

| Skill                        | Safe dry-run prompt                                                                                | Required evidence                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model-demo-composer-domain` | Explain how a proposed "artifact version" should be named without editing files                    | Reads canonical glossary/ADRs and distinguishes Edition, Revision, Row Version, and Publication Sequence           |
| `build-demo-composer-slice`  | Produce a preflight checklist for a fixture child plan without implementing it                     | Follows plan lifecycle, decision classification, TDD, verification, and closeout rules                             |
| `design-demo-composer-ui`    | Critique one existing operational screen without changing code                                     | Uses current foundation and Quiet Versioned Workbench constraints; does not assume `PRODUCT.md`/`DESIGN.md` exists |
| `dogfood-demo-composer`      | Produce a safe browser-validation matrix for one current public reader without launching a browser | Includes fixtures, viewports, keyboard/console/network checks, and evidence privacy                                |

External skill validation:

- Confirm each expected skill is discoverable by name in a fresh agent session.
- Confirm Impeccable does not report an installed hook when hooks were declined.
- Confirm no external skill has generated `PRODUCT.md` or `DESIGN.md` prematurely.
- Confirm an external UI recommendation is explicitly subordinate to repository instructions in one dry-run review.

## Security, Privacy, And Supply-Chain Rules

- Never expose or copy `$CODEX_HOME` credentials, `auth.json`, API keys, npm tokens, GitHub tokens, cookies, browser vaults, or environment files.
- Do not run lifecycle scripts from an unreviewed npm tarball.
- Record checksums/integrity where available.
- Do not use global install flags for repository-local design skills.
- Do not enable Git/tool-call hooks in this child.
- Do not add scripts with network or shell execution to a local skill unless deterministic execution is necessary, the script is reviewed, and its inputs/outputs are bounded.
- Do not allow dry runs to edit runtime code, start destructive services, or use production/customer data.
- Keep agent tooling outside application dependency graphs and production containers.

## Compatibility And Removal

There is no application migration or API compatibility work in this child.

Compatibility requirements:

- Existing Node `>=18`, pnpm, Turbo, application builds, and deployment behavior remain unchanged.
- A contributor without the optional external design skills can still build, test, run, and contribute to the application.
- Environment-provided capabilities may be unavailable; guidance must explain the fallback or mark the affected verification blocked honestly.
- Display-brand changes in child `110` do not automatically rename local skill directories, package names, or technical identifiers.

Removal test:

- Removing `.agents/skills/` and `AGENTS.md` from a temporary copy/worktree must not change application dependency resolution or build inputs.
- Do not actually remove accepted files from the implementation branch merely to run this check; inspect dependency graphs or use a disposable worktree/copy.

## Implementation Sequence

### Phase 1: Baseline And Source Lock

1. Confirm a clean worktree and record the starting commit.
2. Re-run the repository baseline commands from Master Plan `005` or record pre-existing failures.
3. Resolve current remote HEADs, package versions, integrity values, licenses, and upstream skill paths.
4. Compare them with the dated master snapshot.
5. Inspect installer scripts, executable resources, network behavior, output paths, and hooks.
6. Stop if source/license/install behavior is materially unsafe or ambiguous.

### Phase 2: Repository Guidance And Local Skills

1. Create root `AGENTS.md`.
2. Create `docs/agent-workflow.md` with a provisional provenance registry and workflow policy.
3. Update `docs/contributor-guide.md` to link the agent workflow without making agent tooling mandatory for contributors.
4. Initialize and write the four local skills.
5. Validate structure and interface metadata.

### Phase 3: External Skills

For one source at a time:

1. Record pre-install status.
2. Install/vend only the approved pinned skill paths.
3. Inspect all changed files.
4. Reject unrelated/global/hook/runtime changes.
5. Preserve required attribution.
6. Update the provenance registry.
7. Run focused structural/discovery validation before moving to the next source.

### Phase 4: Dry Runs And Regression Verification

1. Run all four local-skill dry runs.
2. Run external discovery and precedence checks.
3. Scan committed skill/guidance content for personal absolute paths and secret-like values.
4. Run repository formatting/whitespace checks.
5. Run the non-DB application regression suite because skill installation must not affect build inputs.
6. Record unavailable optional checks honestly.

### Phase 5: Closeout

1. Update this plan with implementation log, installed revisions, validation evidence, and leftovers.
2. Mark only child `109` complete in Master Plan `005` after all acceptance criteria pass.
3. Record the exact child `110` handoff.
4. Do not start child `110` implementation inside this plan.

## Verification Commands

Baseline and worktree:

```bash
rtk git status --short
rtk git diff --check
```

Skill structure, with the installed `skill-creator` helper resolved through the active environment. If `CODEX_HOME` uses a nonstandard layout, record the equivalent resolved command in the implementation log:

```bash
rtk python "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" .agents/skills/model-demo-composer-domain
rtk python "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" .agents/skills/build-demo-composer-slice
rtk python "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" .agents/skills/design-demo-composer-ui
rtk python "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" .agents/skills/dogfood-demo-composer
```

Repository-content safety checks:

```bash
rtk rg -n '/home/|/Users/|auth\.json|API_KEY|TOKEN|PASSWORD' AGENTS.md docs/agent-workflow.md .agents/skills
rtk rg -n 'CONTEXT.md|docs/adr|docs/plan/master/005' AGENTS.md .agents/skills
rtk git diff --check
```

Application regression checks:

```bash
rtk pnpm turbo run test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
```

DB-backed tests are not required because this plan does not change persistence or runtime behavior. If package/lock/runtime files change despite the expected boundary, the plan must be rechecked before accepting those changes and broader verification must be added.

Browser validation is not required because no product screen changes. Fresh-agent dry runs are required for skill discovery and behavior.

## Commit Strategy

Keep implementation commits attributable:

1. Repository guidance and local skills.
2. Reviewed external skills and provenance, split further by upstream source when the diffs are substantial.
3. Validation/closeout documentation only if evidence changes after the skill commits.

Do not mix child `110` product-documentation or naming changes into these commits.

## Acceptance Criteria

- Root `AGENTS.md` is concise, repository-relative, and points to canonical truth.
- `docs/agent-workflow.md` records the complete workflow, availability classes, decision policy, provenance, licenses, update, and removal steps.
- The four repository-local skills exist, validate structurally, and pass representative dry runs.
- The design skill works before `PRODUCT.md`/`DESIGN.md` exist and has an explicit child `121` update handoff.
- The build skill uses the accepted child lifecycle and distinguishes critical decisions from agent-decidable details.
- Only the approved named external skills are installed from recorded pinned sources.
- Impeccable hooks are not enabled.
- No committed file contains personal absolute paths, credentials, secrets, or copied canonical domain truth.
- Agent tooling does not modify application dependency/runtime behavior or raise the monorepo Node requirement.
- Application tests, type checks, lint, build, formatting, and whitespace checks pass or pre-existing failures are explicitly recorded and shown unrelated.
- A contributor can remove/ignore agent tooling without breaking the product build.
- Master Plan `005` marks only child `109` complete.

## Non-Goals

- Implementing or configuring the overnight master-plan runner.
- Executing child `110` or later plans.
- Renaming Demo Composer.
- Creating `PRODUCT.md` or `DESIGN.md`.
- Redesigning product UI.
- Adding runtime hooks, MCP servers, plugins, or CI jobs.
- Changing application packages, contracts, routes, schemas, migrations, or tests except to prove an unexpected installer regression after rechecking scope.
- Making globally installed agent tooling part of the product's supported runtime.

## Completion Checklist

- [x] Baseline and starting commit recorded.
- [x] External revisions, package versions, integrity, licenses, and installer behavior re-resolved.
- [x] Root `AGENTS.md` created.
- [x] `docs/agent-workflow.md` created.
- [x] Contributor guide linked to the workflow.
- [x] Four local skills initialized and completed.
- [x] Local skill structural validation passed.
- [x] Local skill dry runs passed.
- [x] Approved external skills installed one source at a time.
- [x] External provenance and attribution recorded.
- [x] Hook/global/runtime/package changes absent or rejected.
- [x] Secret and absolute-path scans passed.
- [x] Application regression checks passed.
- [x] Implementation log and verification evidence recorded.
- [x] Master Plan `005` updated only for completed child `109` items.
- [x] Child `110` handoff recorded.

## Implementation Log

Completed on 2026-07-10.

### Baseline And Commits

- Planning checkpoint and clean implementation start: `2334e32` (`docs: add knowledge platform child plans`).
- Repository guidance and local skills: `fd80c44`.
- Emil skills: `2f0532e`.
- Vercel React guidance: `6d1ada3`.
- Accessibility skill: `241e455`.
- Impeccable Codex build and notices: `ce3b674`.
- Forward-test and supply-chain hardening: `b70d7b6`.
- Implementation end before this closeout: `b70d7b6`; the following documentation commit records completion.

The initial clean baseline passed `check-types`, lint, build, and whitespace. The
master's `rtk pnpm turbo run test` command failed before implementation because
the root Turbo configuration has no `test` task. The actual non-DB workspace test
scripts were therefore used for final regression evidence.

### Reviewed Sources And Dispositions

| Source                          | Exact reviewed source                                                                                                                                                                                                                  | Result                                                                                                                                                                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pbakaus/impeccable`            | commit `da99645a58400ed7acb201e6904f9413efd89c6e`; generated skill `3.9.1`; npm CLI `3.2.1`; integrity `sha512-Lnh8BeLNj493iYuKRijVLP5nvdeKvReYtqGeov6tfsqECiKDSHBY5JfkxzfsC912AASMreCwzha0ZY3PC2pw+g==`; Node `>=22.12.0`; Apache-2.0 | Built from the pinned checkout with lifecycle scripts disabled. Installed only the generated Codex repository skill plus its license. No hook manifest. The context command forces `IMPECCABLE_NO_UPDATE_CHECK=1`; `impeccable update` remains prohibited. |
| `emilkowalski/skills`           | commit `f76beceb7d3fc8c43309cefad5a095a206103a4e`; MIT                                                                                                                                                                                 | Installed the four named skills with the generic skill installer. Removed only the unsupported `disable-model-invocation` key from `review-animations`.                                                                                                    |
| `vercel-labs/agent-skills`      | commit `f8a72b9603728bb92a217a879b7e62e43ad76c81`; upstream declares MIT                                                                                                                                                               | Installed the static React skill, whose discovery name is `vercel-react-best-practices`, and corrected three broken compiled rule links. Rejected `web-design-guidelines` because it fetches mutable `main` rules at runtime.                              |
| `addyosmani/web-quality-skills` | commit `95d6e255afe1596b557d7a8498517884438f5b3a`; MIT                                                                                                                                                                                 | Installed only `accessibility` and replaced one missing sibling-skill link with an exact-commit upstream link.                                                                                                                                             |

`docs/agent-workflow.md` records file locations, invocation restrictions,
installation/update/removal procedures, network/executable behavior, and
precedence. `THIRD_PARTY_NOTICES.md` preserves attribution and license text.
Pinned external directories are excluded from repository formatting to prevent
silent vendor rewrites.

### Validation Evidence

- All 11 repository-local and installed external skills passed the current
  `skill-creator` structural validator through an ephemeral PyYAML environment.
- Four independent, fresh-agent read-only dry runs passed: domain terminology,
  child-plan preflight, operational UI critique, and public-reader browser matrix.
- Follow-up dry runs confirmed the preflight-only mode, no-dead-navigation and
  operational-composition rules, read-only Impeccable fallback, and app startup
  discovery fixes.
- External-skill review passed provenance, discovery-name, precedence, missing
  link, hook-manifest, package-reference, and conflict-scenario checks.
- Every local Markdown link under `.agents/skills/` resolves; the one intentional
  external accessibility link is pinned to an exact commit.
- `IMPECCABLE_NO_UPDATE_CHECK=1 node .../context.mjs` ran successfully, and no
  user-home update-cache file was created.
- No tracked hook manifest, executable Git hook, application package/lock change,
  app/shared-package change, personal absolute path, credential, or secret value
  was introduced. Upstream Impeccable code contains expected token/API-key
  identifier names and placeholders but no credential value.
- `rtk pnpm -r --if-present test`: 112 test files and 760 tests passed across all
  actual non-DB workspace test scripts.
- `rtk pnpm check-types`, `rtk pnpm lint`, and `rtk pnpm build`: passed.
- Focused Prettier checks for child-owned files and `rtk git diff --check`: passed.
- Repository-wide Prettier check: pre-existing failure in 325 unrelated application
  and historical documentation files. No unrelated formatting rewrite was made.
- DB-backed tests and browser automation were not required because this child
  changes no persistence, runtime behavior, or product screen. Browser-oriented
  skill behavior was validated through the required read-only forward test.

### Removal And Boundaries

No package, Turbo, workspace, Docker, application, shared package, or workflow
configuration references `AGENTS.md`, `.agents/skills/`, or
`docs/agent-workflow.md`. Removing or ignoring agent tooling therefore leaves
dependency resolution and application build inputs unchanged.

### Leftovers

- Child `110` owns product/current/future documentation truth and the explicit
  keep/rename naming decision.
- Child `121` must create accepted `PRODUCT.md` and `DESIGN.md`, then update and
  revalidate `design-demo-composer-ui`.
- The overnight runner remains unimplemented and is designed only after child
  `110` closes.
- Impeccable hooks remain disabled. A later explicit plan is required before any
  hook or self-update behavior can be accepted.

## Handoff To Child 110

Child `110` may begin only after:

- root guidance and local skills are discoverable;
- the external skill provenance registry is accepted;
- no installer-created hook or runtime dependency remains;
- the worktree is clean and child `109` is marked complete.

Child `110` must then:

- use the new repository guidance;
- update product/current/future documentation truth;
- conduct naming research;
- stop for explicit user acceptance of the keep/rename decision and rename layers;
- avoid implementing the overnight runner, which remains the next workflow-tooling activity after child `110` closes.
