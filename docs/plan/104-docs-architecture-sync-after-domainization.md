# Docs Architecture Sync After Domainization Plan

Date: 2026-07-07

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `104` of the alpha hardening and extension reliability track.

## Objective

Update stale architecture documentation that still describes shared packages as placeholders after the completed shared-contracts and domainization track.

This is a documentation-only sync phase. It must not change product behavior, shared package exports, API routes, schemas, UI, screenshots, extension code, package dependencies, or lockfiles.

## Source Of Truth From Previous Phases

### Master Plan 003 And Plan 099 Result

The shared contracts and domainization track completed on 2026-07-07.

Current active shared/domain packages are:

```text
packages/constants
packages/types
packages/file-domain
packages/capture-domain
packages/guide-domain
packages/demo-domain
packages/publish-domain
packages/ui
packages/eslint-config
packages/typescript-config
```

Current architecture facts to preserve:

- `@repo/constants` owns stable product/API constants that pass the reuse gate.
- `@repo/types` owns Zod-backed shared API contracts plus inferred TypeScript DTOs for active shared/public API surfaces.
- `@repo/file-domain`, `@repo/capture-domain`, `@repo/guide-domain`, `@repo/demo-domain`, and `@repo/publish-domain` own framework-agnostic reusable product rules and domain errors for their active domains.
- `@repo/ui` owns low-level React/Tailwind UI primitives used by apps.
- `@repo/eslint-config` and `@repo/typescript-config` remain tooling packages.
- `apps/server` adapts HTTP/Fastify/PostgreSQL/storage/auth context to shared schemas and domain packages.
- `apps/web` and `apps/extension` consume shared constants/types where useful, but keep UI state, browser runtime details, extension settings, and feature-specific request shaping local.
- The package name is `@repo/demo-domain`; do not introduce `@repo/interactive-demo-domain`.
- Project/setup/organization/auth/instance domain packages do not currently exist. Docs may mention them only as possible future packages, not current packages.

### Plan 103 Result To Carry Forward

Plan `103` completed on 2026-07-07 and refreshed extension captured-workflow evidence.

Docs in this phase may say:

- automatic-click extension capture has current screenshot-backed browser evidence from 2026-07-07;
- captured-workflow extension screenshots are current for the automatic-click path;
- split API/web portal navigation was closed by plan `102`;
- true Chrome toolbar-popup manual screenshot validation remains unvalidated;
- direct extension-page manual capture after automatic clicks has a duplicate event-index follow-up.

Docs in this phase must not say:

- extension reliability is fully fixed;
- true toolbar-popup manual capture passed;
- direct extension-page manual fallback after automatic clicks is fully closed;
- extension behavior changed in this phase.

## Current Codebase Baseline

Current stale documentation found during planning:

```text
README.md: packages/*      Shared repo tooling placeholders; product contracts stay near owners for now
docs/contributor-guide.md: packages/       shared tooling placeholders
```

Current aligned architecture documentation:

```text
docs/system-design-pattern.md
docs/plan/099-contract-regression-docs-sync-and-architecture-closeout.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

`docs/system-design-pattern.md` already describes the active package shape, including `packages/constants`, `packages/types`, `packages/ui`, `packages/file-domain`, `packages/capture-domain`, `packages/guide-domain`, `packages/demo-domain`, and `packages/publish-domain`. Treat it as a reference and edit it only if implementation finds a concrete contradiction.

The current worktree was clean when this plan was expanded.

## Recheck Notes: 2026-07-07

This plan was rechecked against master plan `004`, completed plan `103`, and the current repo state on 2026-07-07.

Issues fixed during recheck:

- The placeholder-wording verification command originally scanned all of `docs/`, which would include historical plans and this plan's own stale-line inventory. It is now scoped to current user-facing architecture/status docs.
- The accidental interactive-demo package-name verification originally scanned all historical plans for the broad term `interactive-demo-domain`. It is now scoped to the concrete package import/name `@repo/interactive-demo-domain` across active code/package paths and current user-facing docs.

These changes avoid false verification failures while still catching active stale architecture claims.

## Exact Files To Read Before Implementation

Read these before editing:

```text
docs/plan/104-docs-architecture-sync-after-domainization.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/099-contract-regression-docs-sync-and-architecture-closeout.md
docs/plan/103-extension-browser-validation-and-screenshots.md
README.md
docs/contributor-guide.md
docs/system-design-pattern.md
docs/project-zoomout-status.md
docs/roadmap.md
docs/oss-alpha-summary.md
CONTEXT.md
```

Read these package files to confirm current package names/scripts/exports:

```text
packages/constants/package.json
packages/types/package.json
packages/ui/package.json
packages/file-domain/package.json
packages/capture-domain/package.json
packages/guide-domain/package.json
packages/demo-domain/package.json
packages/publish-domain/package.json
packages/eslint-config/package.json
packages/typescript-config/package.json
```

Read package source indexes only as needed to verify docs wording:

```text
packages/constants/src/index.ts
packages/types/src/index.ts
packages/file-domain/src/index.ts
packages/capture-domain/src/index.ts
packages/guide-domain/src/index.ts
packages/demo-domain/src/index.ts
packages/publish-domain/src/index.ts
```

## Expected Affected Files

Planned docs changes:

```text
README.md
docs/contributor-guide.md
docs/plan/104-docs-architecture-sync-after-domainization.md
```

Planned master-plan status change after implementation only:

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Conditional docs changes, only if a contradiction is found while implementing:

```text
docs/system-design-pattern.md
docs/project-zoomout-status.md
docs/roadmap.md
docs/oss-alpha-summary.md
CONTEXT.md
```

Files that must not be touched in this phase:

```text
apps/server/src/
apps/web/src/
apps/extension/src/
apps/extension/public/manifest.json
apps/docs/
packages/*/src/
packages/*/package.json
pnpm-lock.yaml
package.json
turbo.json
.github/workflows/
docs/assets/
apps/server/storage/
apps/extension/dist/
node_modules/
coverage/
playwright-report/
```

If implementation discovers a genuine package/code mismatch, do not fix code in this phase. Document it as a leftover and route it to the appropriate later child plan.

## Routes And API Contracts

No route URL, method, request body, response body, auth behavior, cookie behavior, or public viewer contract changes are in scope.

This phase may mention route/API architecture only at a high level:

- server routes are REST/Fastify adapters;
- shared Zod schemas in `@repo/types` are used for selected shared API contracts;
- route inventory ownership remains in `docs/backend-route-inventory.md`.

Do not update `docs/backend-route-inventory.md` unless a stale route statement is found and verified against current server route files. If that happens, keep the update factual and docs-only.

## Schemas And Types

No schema, type, Zod contract, package export, TypeScript config, or dependency change is in scope.

Docs should describe current ownership accurately:

- `@repo/types` includes shared Zod schemas/inferred DTOs for common API primitives, public instance status, first-run setup, auth, organization, project, capture, guide, interactive demo, and publish/public snapshot contracts.
- Server-only DB row types, SQL result shapes, repository internals, Fastify request/reply types, storage adapters, cookies, password hashes, session-token internals, and request auth context remain outside `@repo/types`.
- Domain command/query inputs may stay domain-local when they differ from HTTP contracts.
- React component props, browser/extension runtime message shapes, extension settings, `File`/`Blob` upload inputs, and defensive public-viewer parser state remain app-local unless a future plan proves shared reuse.
- `@repo/constants` includes domain-grouped constants for setup/instance mode, organization roles, project statuses, file/storage values, capture values, guide values, interactive demo values, and publish values.
- Domain packages should be documented as framework-agnostic behavior/policy packages, not as Fastify modules, React packages, browser packages, or database repository replacements.

Do not add, remove, rename, or re-export schemas/types/constants in this phase.

## Behavior Rules

- Keep edits factual, narrow, and dated only where status changed.
- Preserve the README's alpha-stage framing.
- Preserve existing local setup, extension setup, verification, and screenshot sections unless a line directly conflicts with the post-domainization architecture.
- Keep `docs/contributor-guide.md` concise; it should orient contributors, not duplicate the full system design document.
- Use `docs/system-design-pattern.md` as the detailed architecture source and link/reference it where useful.
- Do not overstate package maturity. Shared/domain packages are active, but not every domain is extracted.
- Do not say all product contracts live in shared packages. Some app-local contracts remain intentionally local.
- Do not say `packages/*` are only placeholders.
- Do not claim the extension is fully reliable; preserve the plan `103` limitations.
- Do not change screenshots, generated assets, UI copy in app source, or rendered frontend behavior.

## Security And Permission Rules

- Do not add secrets, tokens, cookies, bearer tokens, invite tokens, local storage contents, private URLs, private filesystem paths, or customer data to docs.
- Do not weaken privacy-preserving capture statements.
- Do not remove warnings about no raw DOM HTML, no raw input-value capture, no HTML replay, no Chrome Web Store packaging, local-file-storage-only operation, in-memory rate limiting, or production-readiness limits unless a separate implemented plan proves the status changed.
- Do not document internal auth/session/password hash details as shared-package contracts.
- Do not introduce new extension permissions or imply that permissions changed.
- Keep docs safe for public OSS readers.

## Migration And Backwards Compatibility

No database migration is expected.

No API migration is expected.

No package migration is expected.

No extension storage migration is expected.

Docs compatibility requirements:

- Existing README anchors and section names should remain stable where practical.
- Existing setup commands should remain unchanged.
- Existing screenshot links should remain unchanged.
- Contributor guide should remain short enough to be useful for new contributors.
- `docs/system-design-pattern.md` remains the deeper architecture reference.

## Implementation Steps

1. Reread this plan, master plan `004`, completed plan `103`, master plan `003`, and plan `099`.
2. Confirm `rtk git status --short` and identify any unrelated user/agent changes before editing.
3. Search for stale shared-package placeholder wording:

   ```bash
   rtk rg -n "shared tooling placeholders|product contracts stay near owners|mostly a placeholder|packages/\\*.*placeholder|packages/.*placeholder" README.md docs/contributor-guide.md docs/system-design-pattern.md docs/project-zoomout-status.md docs/roadmap.md docs/oss-alpha-summary.md CONTEXT.md
   ```

4. Confirm package names and current package responsibilities from `packages/*/package.json` and `packages/*/src/index.ts`.
5. Update `README.md` `Architecture At A Glance`:
   - replace the stale `packages/*` placeholder row;
   - include active app rows unchanged unless a small wording improvement is needed;
   - list shared packages by responsibility, not every source file;
   - mention shared contracts/domain packages are active and app-local ownership still applies where contracts do not pass the reuse gate.
6. Update `README.md` architecture paragraph after the layout block:
   - state that backend modules now adapt HTTP/persistence to shared schemas and domain policies;
   - preserve that the portal uses a lightweight custom route parser for now if still true;
   - avoid claiming all server behavior has moved to packages.
7. Update `docs/contributor-guide.md` repo layout:
   - replace `packages/ shared tooling placeholders`;
   - describe `packages/` as shared constants, API contracts, domain policies, UI primitives, and tooling/config packages;
   - optionally add one short bullet in planning/testing guidance to keep shared package changes behind focused plans and tests.
8. Recheck `docs/system-design-pattern.md`, `docs/project-zoomout-status.md`, `docs/roadmap.md`, `docs/oss-alpha-summary.md`, and `CONTEXT.md` for contradictions introduced by the README/contributor edits.
9. Do not edit conditional docs unless a concrete contradiction remains.
10. Run focused verification.
11. Update this plan with:
    - `Status: Completed on 2026-07-07`;
    - completed checklist;
    - implementation log;
    - verification notes;
    - leftovers;
    - handoff notes.
12. Update `docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md` only by marking child plan `104` implementation complete and adding a concise completed result if useful.
13. Commit only scoped docs changes with a clear message.

## Test And Verification Plan

Required after edits:

```bash
rtk rg -n "shared tooling placeholders|product contracts stay near owners|mostly a placeholder|packages/\\*.*placeholder|packages/.*placeholder" README.md docs/contributor-guide.md docs/system-design-pattern.md docs/project-zoomout-status.md docs/roadmap.md docs/oss-alpha-summary.md CONTEXT.md
rtk rg -n "@repo/interactive-demo-domain" apps packages README.md docs/contributor-guide.md docs/system-design-pattern.md docs/project-zoomout-status.md docs/roadmap.md docs/oss-alpha-summary.md CONTEXT.md
rtk git diff --check
rtk git status --short
```

The stale-placeholder search should return no active stale claims in current user-facing docs. Historical plan text may still mention earlier placeholder status; do not rewrite historical plans only to satisfy a broad search.

Required if implementation edits `apps/docs/` source, which is not expected:

```bash
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
rtk pnpm --filter docs build
```

Optional only if a package/doc mismatch raises concern:

```bash
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/types test
rtk pnpm --filter @repo/file-domain test
rtk pnpm --filter @repo/capture-domain test
rtk pnpm --filter @repo/guide-domain test
rtk pnpm --filter @repo/demo-domain test
rtk pnpm --filter @repo/publish-domain test
rtk pnpm check-types
```

Do not run browser validation for README/contributor Markdown-only edits.

## Agent-Browser Validation Requirements

No agent-browser validation is required for the planned implementation because this phase should only edit repository Markdown docs and should not change rendered app code, browser behavior, screenshots, CSS, app copy, or `apps/docs`.

If implementation unexpectedly changes `apps/docs` pages or rendered screenshot references, use `agent-browser` to validate the affected docs page in a desktop viewport and record:

- local docs app URL;
- page path checked;
- screenshot/link rendering result;
- any layout/text-overflow issue found.

If only Markdown files outside `apps/docs` are changed, explicitly record that browser validation was not required.

## Explicit Non-Scope

- Runtime product implementation.
- Shared package refactors.
- New package creation.
- Package export changes.
- Dependency or lockfile changes.
- API route or schema changes.
- Backend route inventory rewrite unless a verified stale route statement is found.
- Extension reliability fixes.
- True toolbar-popup manual capture validation.
- Direct extension-page manual event-index bugfix.
- CI smoke workflow changes; child plan `105` owns that.
- Large-file web refactors; child plan `106` owns that.
- Extension popup refactors; child plan `107` owns that.
- Production readiness hardening; child plan `108` owns that.
- UI redesign.
- Screenshot refreshes.
- Docs app page additions.

## Completion Checklist

- [ ] Worktree checked before edits.
- [ ] Completed plan `103`, master plan `004`, master plan `003`, and plan `099` reread.
- [ ] Current package names/responsibilities verified from package files.
- [ ] Stale shared-package placeholder wording removed or corrected from current docs.
- [ ] `README.md` reflects active shared constants, shared types, UI primitives, tooling packages, and domain packages.
- [ ] `README.md` does not overstate package extraction or production readiness.
- [ ] `docs/contributor-guide.md` reflects the current monorepo layout.
- [ ] Related architecture/status docs checked for contradictions.
- [ ] Extension status from plan `103` preserved accurately.
- [ ] No runtime code, package exports, dependencies, lockfiles, migrations, screenshots, or generated assets touched.
- [ ] Focused verification commands run and recorded.
- [ ] Browser validation marked not required, or completed only if rendered docs app pages changed.
- [ ] Plan `104` updated with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

Carry forward from plan `103`:

- Extension automatic-click captured-workflow screenshots are current as of 2026-07-07.
- True Chrome toolbar-popup manual capture remains unvalidated.
- Direct extension-page manual capture after automatic clicks can hit a duplicate event-index failure and should not be fixed in this docs sync phase.

Carry into child plan `105`:

- This docs sync does not address CI smoke workflow coverage. Child plan `105` should still inspect `.github/workflows/ci.yml`, DB setup ordering, and `apps/server` smoke execution.

If implementation finds stale architecture docs outside README/contributor guide, update them only when the statement is current-user-facing and objectively stale. Historical plan documents may retain old wording when they are clearly recording past state.
