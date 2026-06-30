# Split-Origin URL Hardening Plan

Date: 2026-06-23

Status: Completed with follow-up notes.

## Parent Master Plan

```text
docs/plan/master/002-alpha-follow-through-master-plan.md
```

This is Phase 1 of the alpha follow-through master plan.

## Goal

Make browser-facing links and redirects correct when the API and web portal run on different origins.

Target outcome:

```text
self-host operator configures API origin and portal origin
  -> invite links open the portal, not the API host
  -> public guide/demo links remain browser-facing
  -> API/export asset URLs keep using the API origin where required
  -> extension portal links keep using the portal origin when configured
```

## Current Baseline

Known issue from portal dogfood:

- copied invite URL used `http://localhost/invites/<token>`
- web portal was running on `http://localhost:3000`
- opening the equivalent portal route worked

Likely source:

```text
apps/server/src/modules/organization/organization-invites.routes.ts
```

The route currently builds invite URLs from the API request protocol and hostname.

Related docs and config:

```text
docs/v1-dogfood-smoke-suite.md
docs/operations.md
docs/self-hosting.md
docs/production-readiness-checklist.md
apps/server/src/config/startup.config.ts
apps/web/src/features/organization/OrganizationMembersPage.tsx
apps/extension/README.md
```

## Scope

Included:

- audit all browser-facing URL builders
- fix invite URL construction for split API/web deployments
- decide whether to add a portal-origin env var, such as `DEMO_COMPOSER_PUBLIC_WEB_URL`
- preserve `API_URL` for API-facing URLs and exports that intentionally need API asset routes
- validate any new production URL config
- update docs to explain API origin vs portal origin
- add focused tests for same-origin, split-origin, and invalid-origin behavior

URL surfaces to audit:

- organization invite links
- public guide copy links
- public demo copy links
- embed links
- auth redirects
- exported Markdown/HTML asset links
- extension `Open in portal` and `Finish capture` links

## Explicit Non-Goals

- email invite delivery
- custom domain management
- extension capture reliability
- hosted SaaS routing
- broad reverse-proxy documentation rewrite

## Expected File Touches

Likely:

```text
apps/server/src/modules/organization/organization-invites.routes.ts
apps/server/src/modules/organization/organization-invites.routes.test.ts
apps/server/src/config/startup.config.ts
apps/server/src/config/startup.config.test.ts
docs/operations.md
docs/self-hosting.md
docs/production-readiness-checklist.md
docs/plan/078-split-origin-url-hardening.md
docs/plan/master/002-alpha-follow-through-master-plan.md
```

Conditional:

```text
apps/web/src/features/guide/
apps/web/src/features/interactive-demo/
apps/server/src/modules/guide/
apps/extension/
README.md
docs/project-zoomout-status.md
docs/backend-route-inventory.md
```

## Implementation Plan

## Implementation Result: 2026-06-30

Completed slice:

- Added `DEMO_COMPOSER_PUBLIC_WEB_URL` as the optional browser-facing portal origin for server-generated portal links.
- Organization invite URLs now use `DEMO_COMPOSER_PUBLIC_WEB_URL` when configured and fall back to the request host for same-origin deployments.
- Startup validation now rejects malformed or path-bearing `DEMO_COMPOSER_PUBLIC_WEB_URL` values when set.
- `.env-cmdrc.example` and `turbo.json` include the new env var.
- Self-hosting, development setup, operations, and production readiness docs now distinguish API origin, public web origin, portal build API target, and extension portal URL.

Audited URL surfaces:

- organization invite links: changed to use `DEMO_COMPOSER_PUBLIC_WEB_URL`
- public guide copy/embed links: unchanged; web UI builds these from `window.location.origin`, so they are already browser-facing
- public demo copy/embed links: unchanged; web UI builds these from `window.location.origin`, so they are already browser-facing
- auth redirects: unchanged; existing `AUTH_REDIRECT_URL` remains the redirect config
- Markdown/HTML export asset links: unchanged; guide export uses `API_URL` for API-served asset URLs by design
- extension `Open in portal` and `Finish capture` links: unchanged; plan `076` already added the optional extension portal URL

Verification run:

```bash
rtk pnpm --filter server test -- src/modules/organization/organization-invites.routes.test.ts
rtk pnpm --filter server test -- src/config/startup.config.test.ts
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter server build
rtk git diff --check
```

Results:

- Organization invite route suite passed with 6 tests.
- Startup config suite passed with 13 tests.
- Server test suite passed with 41 files and 250 tests.
- Server typecheck passed.
- Server lint passed.
- Server build passed.
- Whitespace check passed.

Missed or deferred work to keep as follow-up candidates:

- Manual browser verification of copied invite links in a split API/web deployment.
- Decide later whether `AUTH_REDIRECT_URL` should be renamed or documented as part of a broader public-web-origin cleanup.
- If future server-generated browser links are added, they should use `DEMO_COMPOSER_PUBLIC_WEB_URL` rather than `API_URL`.
- Portal deployments under a subpath are still intentionally unsupported by this env var; `DEMO_COMPOSER_PUBLIC_WEB_URL` is an origin-only setting.

### 1. Audit Current URL Builders

- [x] Search for full URL construction in server, web, and extension code.
- [x] Classify each URL as API-facing or browser-facing.
- [x] Record same-origin behavior that should stay unchanged.
- [x] Record split-origin behavior that is wrong or unverified.
- [x] Identify any public docs that conflate API origin and portal origin.

### 2. Design Portal-Origin Config

- [x] Decide final env var name: `DEMO_COMPOSER_PUBLIC_WEB_URL`.
- [x] Define development fallback behavior.
- [x] Define production validation behavior.
- [x] Decide whether trailing slashes are normalized.
- [x] Reject non-HTTP(S), relative, malformed, or path-bearing origins at startup.
- [x] Keep secret values out of logs and error output.

### 3. Implement Invite URL Fix

- [x] Add failing tests for split API/web invite URLs.
- [x] Add tests for same-origin/default behavior.
- [x] Add tests for invalid configured portal origin if config is introduced.
- [x] Update invite URL construction.
- [x] Keep token encoding behavior unchanged.
- [x] Verify invite acceptance route still works in the portal. Covered by existing public invite route tests; manual browser verification is deferred.

### 4. Audit Other URL Surfaces

- [x] Check public guide and demo copy links.
- [x] Check embed links.
- [x] Check auth redirect behavior.
- [x] Check Markdown/HTML export asset URL behavior.
- [x] Check extension portal URL behavior after plan `076`.
- [x] Record surfaces intentionally left unchanged.

### 5. Update Docs

- [x] Update self-hosting docs with API origin vs portal origin.
- [x] Update operations docs.
- [x] Update production readiness checklist.
- [x] Update extension docs only if setup wording changes. Not needed; extension portal URL docs were already current.
- [x] Add implementation notes to this plan.
- [x] Update master plan phase tracking after implementation.

## Testing Plan

Minimum expected checks:

```bash
rtk pnpm --filter server test -- src/modules/organization/organization-invites.routes.test.ts
rtk pnpm --filter server test -- src/config/startup.config.test.ts
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk git diff --check
```

Run web or extension tests if their URL builders change:

```bash
rtk pnpm --filter web test
rtk pnpm --filter extension test
```

## Acceptance Criteria

- Invite links copied from the portal open the browser-facing portal origin in split API/web deployments.
- Same-origin deployments remain supported.
- API-facing URLs continue to use API origin where required.
- Unsafe configured origins fail clearly.
- Docs clearly explain the API origin, portal origin, and extension portal URL.
- Any URL surface not changed is listed with a reason.

## Follow-Up Notes

Carry these notes into the next relevant plan:

- Run a manual split API/web browser dogfood pass that creates an organization invite from the portal and opens the copied link in a clean browser context.
- Keep `DEMO_COMPOSER_PUBLIC_WEB_URL` origin-only unless the product explicitly decides to support portal subpath deployments.
- If `AUTH_REDIRECT_URL` starts overlapping with public portal origin terminology, rename or document that boundary in a dedicated auth configuration cleanup.
- Keep future server-generated browser links on the `DEMO_COMPOSER_PUBLIC_WEB_URL` helper instead of deriving them from request host or `API_URL`.
