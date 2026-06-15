# OSS Hardening Remove Legacy And AI Leftovers Plan

Date: 2026-06-15

Status: Planned.

## Goal

Remove unused AI dependencies and old unrelated shared-package leftovers so the public repository matches the current Demo Composer product: screenshot-first capture-to-guide, with AI deferred.

Target outcome:

```text
repo inspection
  -> no unused LangChain/OpenAI/Groq/Mistral dependencies
  -> no active ORCA branding
  -> no unrelated contact/OTP/user-asset shared schemas exported as product API
  -> package names and docs communicate Demo Composer clearly
```

This phase reduces confusion and dependency weight before opening the project.

## Why This Comes Next

The product decisions explicitly say:

- AI is deferred from the day-one MVP
- Demo Composer should not inherit ORCA product-domain complexity
- the old ORCA implementation is reference material only

Current public-readiness problems:

- `apps/server/package.json` includes LangChain/OpenAI/Groq/Mistral dependencies
- `pnpm-lock.yaml` carries large AI dependency trees
- shared packages still export contact, OTP, signup, user asset, and organization role schemas that are not part of the active Demo Composer runtime
- server API docs still had ORCA references before plan 054
- old constants/types create a confusing public surface

This cleanup should happen before CI/self-host docs so the docs and install footprint describe the real product.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/system-design-pattern.md
docs/backend-route-inventory.md
docs/project-zoomout-status.md
docs/plan/047-project-health-hardening.md
```

Important implications:

- no AI runtime code should exist in the MVP unless it is behind a documented future flag
- do not remove capture/guide/publish code
- do not remove useful generic helpers if active modules import them
- prefer deleting dead exports over leaving misleading public package APIs
- keep changes mechanical and well-tested

## Current State

Known AI dependencies in `apps/server/package.json`:

```text
@langchain/core
@langchain/google-genai
@langchain/groq
@langchain/langgraph
@langchain/mistralai
@langchain/openai
langchain
```

Potentially unused old shared package areas:

```text
packages/constants/src/authentication/otp_verification.constants.ts
packages/constants/src/contact/*
packages/constants/src/user/user_asset.constants.ts
packages/types/src/authentication/query_params/signup.query_params.schema.ts
packages/types/src/authentication/schema/otp_verification.schema.ts
packages/types/src/authentication/schema/signup.schema.ts
packages/types/src/contact/*
packages/types/src/user/schema/user_asset.schema.ts
packages/types/src/organization/schema/organization_role.schema.ts
```

Before deleting shared package files, verify active imports with `rg`.

Important current constraint:

Active server code still imports from `@repo/types` and `@repo/constants`, including older common/auth/user shapes. This plan must not delete those packages wholesale. The cleanup should either:

- narrow their exports to the currently used minimum, or
- remove active server imports from those packages first and then delete unused legacy files.

Observed active server imports at planning time:

```text
apps/server/src/config/fastify_decoder.config.ts -> Auth_Session_Type, Organization_Type
apps/server/src/common/helper_function/error_handler.helper.ts -> response_message
apps/server/src/common/constants/event.constant.ts -> User_Asset_Type
```

These imports are small enough to replace locally. After that, `apps/server` should no longer need runtime dependencies on `@repo/types` or `@repo/constants`.

## Scope

Included:

- remove unused AI dependencies from `apps/server/package.json`
- update `pnpm-lock.yaml`
- verify no source imports AI packages
- replace active server imports from legacy shared packages with local Demo Composer types/constants where practical
- remove `@repo/types` and `@repo/constants` from server dependencies if no active imports remain
- remove or stop exporting unused legacy shared schemas/constants
- preserve or replace any shared types/constants still imported by active runtime code
- remove stale ORCA references not covered by plan 054
- remove unrelated comments for OTP/WhatsApp/contact/profile-picture where they are not part of the product
- update docs that mention legacy leftovers if needed
- keep active runtime modules unchanged unless imports require cleanup
- run full tests/build/lint after cleanup

Excluded:

- adding AI flags or BYO-key settings
- implementing hosted signup
- implementing organization role management
- deleting database tables used by active migrations
- changing current auth/session/project/capture/guide/publish contracts
- redesigning shared packages from scratch

## Cleanup Strategy

### AI Dependencies

1. Confirm no imports:

```bash
rtk rg -n "@langchain|langchain|openai|groq|mistral|google-genai" apps packages --glob '!**/package.json' --glob '!**/dist/**'
```

2. Remove AI packages from `apps/server/package.json`.
3. Run install to update lockfile:

```bash
rtk pnpm install
```

4. Run server build/tests.

### Shared Package Leftovers

Do not blindly delete all shared packages. Use import checks first.

Suggested approach:

1. Identify active imports from `@repo/types` and `@repo/constants`.
2. Decide whether each active import should remain shared or be moved local to `apps/server`.
3. Remove or rewrite active imports that exist only because of old ORCA-era helpers.
4. Keep only currently used generic/common/auth/user/org types if active code still needs shared package support.
5. Remove dead contact package exports.
6. Remove dead OTP/signup schemas if they are not part of current auth.
7. Remove dead user asset/profile-picture schemas if not used.
8. Remove dead organization role schemas if not used.
9. Update package index exports.
10. Run package builds and lint.

If a shared package is almost entirely legacy and unused, consider replacing its exports with a minimal current set instead of carrying old domain names.

Do not remove `@repo/types` or `@repo/constants` dependencies from `apps/server/package.json` until `rg` proves no active server source imports them.

For this phase, the preferred implementation is:

1. Add local server-owned types/constants for the three active imports above.
2. Remove legacy event/comment surfaces from `apps/server/src/common/constants/event.constant.ts`.
3. Verify `apps/server/src` has no imports from `@repo/types` or `@repo/constants`.
4. Remove both workspace packages from `apps/server/package.json`.
5. Delete legacy shared files or narrow package exports so the workspace no longer presents contact/OTP/signup/user-asset/product leftovers as public API.
6. Keep `packages/types` and `packages/constants` packages only if needed by the workspace after the cleanup; otherwise remove them from workspace task scope in a later repo-hygiene slice if that is lower risk.

## Test Plan

Run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm --filter server test:db
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

Additional checks:

```bash
rtk rg -n "@repo/types|@repo/constants" apps/server/src
rtk rg -n "@langchain|langchain|openai|groq|mistral|google-genai" apps packages --glob '!**/package.json' --glob '!**/dist/**'
rtk rg -n "ORCA|otp|whatsapp|contact|profile picture|user_asset" apps packages docs --glob '!pnpm-lock.yaml'
```

The second command may still find historical docs. Decide whether each hit is acceptable context or a confusing active surface.

## Risks

- Shared packages may contain unused exports but still build as part of the monorepo. Removing files requires updating index exports carefully.
- Active server files currently import shared types/constants. Deleting shared files before removing those imports will break type checks.
- Lockfile churn can be large after AI dependency removal.
- Some old constants may be imported indirectly by active shared type files. Remove in small steps.

## Commit Strategy

Suggested commits:

1. `Remove unused AI dependencies`
2. `Remove legacy shared contact and OTP exports`
3. `Clean remaining legacy product references`

Keep each commit buildable if possible.

## Acceptance Criteria

- server package no longer depends on AI/LangChain/OpenAI provider libraries
- server package no longer depends on legacy `@repo/types` or `@repo/constants` packages if active imports have been replaced locally
- lockfile no longer includes those dependency trees unless another active package truly needs them
- active source no longer exposes unrelated contact/OTP/profile-picture shared schemas
- active server imports from shared packages are either still valid/current or removed deliberately
- no active API branding says ORCA
- full tests/build/lint/type checks pass
