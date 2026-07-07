# Extension Finish Portal Origin Verification And Fix Plan

Date: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `102` of the alpha hardening and extension reliability track.

## Objective

Verify and, if still needed, fix extension finish/open portal behavior so split API/web deployments open the web portal origin instead of the API origin.

This plan must account for current code that already stores a separate portal URL. The implementation should not blindly re-fix an issue that may already be resolved.

## Inputs From Previous Phases

Required:

- completed child plan `100`;
- current evidence for finish/open portal behavior;
- whether a separate portal URL is configured during validation;
- whether single-origin and split-origin setups behave differently.

Preferred before implementation:

- child plan `101` completed if capture success is required to reach the finish/open portal path in browser validation.

## Exact Files To Read Before Work

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md
apps/extension/README.md
apps/extension/src/App.tsx
apps/extension/src/lib/navigation.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/api.ts
apps/extension/src/lib/settings.test.ts
```

Server/web files to inspect only if needed:

```text
apps/server/src/modules/public-instance/public-instance.routes.ts
apps/server/src/modules/public-instance/public-instance.service.ts
apps/server/src/config/cors.config.ts
apps/web/src/lib/api.ts
apps/web/src/App.tsx
```

Shared contracts to inspect only if public instance/web origin contracts are involved:

```text
packages/types/src/instance.ts
packages/constants/src/
```

## Expected Affected Files

Likely extension files:

```text
apps/extension/src/App.tsx
apps/extension/src/lib/navigation.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/*.test.ts
apps/extension/src/*.test.tsx
apps/extension/README.md
```

Conditional files:

```text
apps/server/src/modules/public-instance/
packages/types/src/instance.ts
README.md
docs/project-zoomout-status.md
docs/operations.md
```

Do not touch capture upload/event behavior except where needed to reach portal validation.

## Routes And API Contracts

Protect these existing contracts:

```text
GET  /api/v1/public/instance
POST /api/v1/projects/:project_id/capture-sessions/:id/complete
```

The complete capture response currently drives extension navigation through a redirect/path value consumed by the extension. The path may be combined with a configured portal URL. Any change must preserve existing API response compatibility.

## Schemas And Types

Relevant schemas/types:

- public instance status response from `@repo/types/instance`;
- capture session completion response from `@repo/types/capture`;
- extension settings shape in `apps/extension/src/lib/settings.ts`;
- navigation URL builder input/output in `apps/extension/src/lib/navigation.ts`.

Do not add server-provided web origin fields unless the current contract cannot support split-origin behavior safely.

## Behavior Rules

- API requests must continue to use the configured instance API URL.
- Portal navigation must use the configured portal URL when present.
- If portal URL is absent, single-origin setups may continue deriving portal paths from the instance URL if that is current behavior.
- URL joining must avoid duplicate slashes and must preserve route path/query fragments.
- Invalid portal URL input must be rejected before storage.
- Finish capture and open capture actions must use the same origin rules.
- Popup-visible errors should remain actionable if browser tab opening fails.

## Security And Permission Rules

- Do not trust a browser page origin for privileged API requests.
- Do not allow arbitrary unvalidated schemes for portal URLs. Only `http://` and `https://` should be accepted if that is the existing validation rule.
- Do not expose session tokens in portal URLs.
- Preserve CORS/cookie behavior.
- Do not expand extension permissions unless a specific browser API requirement is proven.

## Migration And Backwards Compatibility

- Existing extension settings without `portalUrl` must keep working.
- Existing users with only `instanceUrl` configured must not be forced through setup again unless the current UI already requires it.
- Existing `portalUrl` values must remain readable.
- No database migration is expected.

## Implementation Steps

1. Reread this plan, the parent master plan, and completed plan `100`.
2. Confirm current worktree state and protect unrelated changes.
3. Audit current portal URL storage and navigation builder behavior.
4. Write tests proving current expected behavior for:
   - single-origin instance-only setup;
   - split-origin setup with explicit portal URL;
   - invalid portal URL input;
   - capture completion redirect/path joining.
5. If tests pass and browser validation passes, keep code changes minimal and update docs/status only.
6. If tests fail, fix the narrow URL derivation or settings persistence bug.
7. Update extension README and status docs only where evidence changes.
8. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
9. Update the master plan only for completed phase status.

## Test And Verification Plan

Required:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk git diff --check
```

Required if extension build/runtime code changes:

```bash
rtk pnpm --filter extension build
```

Required if server public instance contracts change:

```bash
rtk pnpm --filter server test -- public-instance
rtk pnpm --filter @repo/types test
rtk pnpm check-types
```

## Browser Validation Requirements

Browser validation is required.

Validate at least:

- API origin: server local/dev origin.
- Portal origin: web local/dev origin different from API origin.
- Configure extension with both origins.
- Start or use an existing capture session.
- Use `Open in portal` and confirm the opened tab is the web origin.
- Use `Finish capture` and confirm the opened tab is the web origin.
- Repeat or reason through a single-origin setup and document compatibility.

If child plan `101` is not yet completed and full capture cannot finish, validate URL generation through controlled test fixtures and document the blocked browser step.

## Explicit Non-Scope

- Automatic click capture fixes.
- Manual screenshot upload/event fixes.
- New server route URLs unless required by a proven current bug.
- Web UI redesign.
- Extension UI redesign.
- Hosted deployment automation.
- Chrome Web Store packaging.

## Completion Checklist

- [ ] Current portal URL support audited.
- [ ] Split-origin behavior verified or fixed.
- [ ] Single-origin compatibility preserved.
- [ ] Tests cover navigation URL building and settings persistence.
- [ ] Browser validation completed or precise blocker documented.
- [ ] Docs updated only where status changed.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

Child plan `103` should use this plan's browser evidence when refreshing extension screenshots and status docs.
