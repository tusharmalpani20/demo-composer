# Split-Origin URL Hardening Plan

Date: 2026-06-23

Status: Planned.

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

### 1. Audit Current URL Builders

- [ ] Search for full URL construction in server, web, and extension code.
- [ ] Classify each URL as API-facing or browser-facing.
- [ ] Record same-origin behavior that should stay unchanged.
- [ ] Record split-origin behavior that is wrong or unverified.
- [ ] Identify any public docs that conflate API origin and portal origin.

### 2. Design Portal-Origin Config

- [ ] Decide final env var name.
- [ ] Define development fallback behavior.
- [ ] Define production validation behavior.
- [ ] Decide whether trailing slashes are normalized.
- [ ] Reject non-HTTP(S), relative, or malformed origins in production.
- [ ] Keep secret values out of logs and error output.

### 3. Implement Invite URL Fix

- [ ] Add failing tests for split API/web invite URLs.
- [ ] Add tests for same-origin/default behavior.
- [ ] Add tests for invalid configured portal origin if config is introduced.
- [ ] Update invite URL construction.
- [ ] Keep token encoding behavior unchanged.
- [ ] Verify invite acceptance route still works in the portal.

### 4. Audit Other URL Surfaces

- [ ] Check public guide and demo copy links.
- [ ] Check embed links.
- [ ] Check auth redirect behavior.
- [ ] Check Markdown/HTML export asset URL behavior.
- [ ] Check extension portal URL behavior after plan `076`.
- [ ] Record surfaces intentionally left unchanged.

### 5. Update Docs

- [ ] Update self-hosting docs with API origin vs portal origin.
- [ ] Update operations docs.
- [ ] Update production readiness checklist.
- [ ] Update extension docs only if setup wording changes.
- [ ] Add implementation notes to this plan.
- [ ] Update master plan phase tracking after implementation.

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

If the audit finds several unrelated browser-facing URL bugs, fix invite URL construction first and create separate child plans for the rest.
