# Docs Architecture Sync After Domainization Plan

Date: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `104` of the alpha hardening and extension reliability track.

## Objective

Update stale documentation that still describes shared packages as placeholders after the completed shared-contracts and domainization track.

This is a documentation sync phase. It should not change product behavior.

## Current Known Stale Lines

Known stale docs from the master plan recheck:

```text
README.md
docs/contributor-guide.md
```

The stale claim is that `packages/*` or `packages/` are only shared tooling placeholders. That is no longer accurate because the repo now has active shared constants, shared types, and domain packages.

## Exact Files To Read Before Work

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/099-contract-regression-docs-sync-and-architecture-closeout.md
README.md
docs/contributor-guide.md
docs/system-design-pattern.md
docs/project-zoomout-status.md
docs/roadmap.md
CONTEXT.md
```

## Expected Affected Files

Likely:

```text
README.md
docs/contributor-guide.md
docs/plan/104-docs-architecture-sync-after-domainization.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

Conditional, only if contradictions are found:

```text
docs/system-design-pattern.md
docs/project-zoomout-status.md
docs/roadmap.md
CONTEXT.md
```

Do not touch app code, package code, lockfiles, migrations, or UI assets.

## Routes And API Contracts

No route/API contract changes are in scope.

Docs may mention route families only at a high level. Do not update route inventories unless a stale route statement is found and verified against current code.

## Schemas And Types

No schema/type changes are in scope.

Docs should accurately describe that:

- `@repo/constants` owns canonical product constants that passed the reuse gate;
- `@repo/types` owns shared Zod schemas and inferred DTO types;
- domain packages own reusable business rules and policies for active domains;
- app-specific React props and server-only persistence details do not belong in shared packages by default.

## Behavior Rules

- Keep the documentation factual and current.
- Do not overstate production readiness.
- Do not claim extension dogfood is fixed unless plans `100` through `103` have produced evidence.
- Preserve the alpha-stage framing from the README.
- Preserve the Orca-style architecture wording only where it matches actual packages in this repo.

## Security And Permission Rules

- Do not publish secrets, tokens, local credentials, or private paths beyond existing repo paths.
- Do not remove privacy-preserving capture caveats.
- Do not weaken warnings about extension reliability or production readiness.

## Migration And Backwards Compatibility

No migration is expected.

Docs should remain compatible with current contributor workflow and local setup instructions.

## Implementation Steps

1. Reread this plan and the parent master plan.
2. Confirm worktree state and protect unrelated changes.
3. Search for stale placeholder/shared-package wording.
4. Update `README.md` architecture sections to describe current packages.
5. Update `docs/contributor-guide.md` package descriptions.
6. Recheck architecture/status docs for contradictions introduced by edits.
7. Run docs sanity checks.
8. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
9. Update the master plan only for completed phase status.

## Test And Verification Plan

Required:

```bash
rtk rg -n "shared tooling placeholders|product contracts stay near owners|mostly a placeholder" README.md docs || true
rtk git diff --check
```

Required if docs app files are touched:

```bash
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
rtk pnpm --filter docs build
```

Optional repo sanity:

```bash
rtk pnpm check-types
```

## Browser Validation Requirements

No browser validation is required unless this phase changes rendered docs app pages or screenshot references.

If rendered docs app pages change, validate the affected page in a browser and confirm no layout-breaking text overflow or broken image link was introduced.

## Explicit Non-Scope

- Product implementation changes.
- Package restructuring.
- Extension reliability fixes.
- CI changes.
- UI redesign.
- New docs site pages unless needed to correct stale architecture references.

## Completion Checklist

- [ ] Stale shared-package placeholder wording removed or corrected.
- [ ] README reflects active shared/domain packages.
- [ ] Contributor guide reflects current monorepo layout.
- [ ] Related architecture docs checked for contradictions.
- [ ] Verification commands run and recorded.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

Do not use this phase to mark extension reliability as fixed. Extension status belongs to child plans `100` through `103`.
