# Extension Browser Validation And Screenshots Plan

Date: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `103` of the alpha hardening and extension reliability track.

## Objective

Prove the extension workflow in a real browser after reliability fixes are completed or explicitly bounded, then update extension evidence and screenshots.

This is a validation and documentation phase. It should not introduce new extension behavior.

## Required Inputs

Before implementation, read:

```text
docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md
docs/plan/101-extension-capture-upload-and-event-fix.md
docs/plan/102-extension-finish-portal-origin-fix.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
apps/extension/README.md
docs/project-zoomout-status.md
README.md
docs/roadmap.md
```

This plan should start only after:

- the extension capture path works; or
- the remaining limitation is intentionally bounded and documented.

## Exact Files To Inspect

```text
apps/extension/README.md
apps/extension/public/manifest.json
apps/extension/src/App.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/
README.md
docs/project-zoomout-status.md
docs/roadmap.md
docs/assets/
```

## Expected Affected Files

Likely docs/evidence files:

```text
docs/plan/103-extension-browser-validation-and-screenshots.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
apps/extension/README.md
docs/project-zoomout-status.md
README.md
docs/roadmap.md
docs/assets/
```

Conditional app files:

```text
apps/extension/src/
```

Only touch extension code if validation reveals a tiny evidence-only issue such as a broken test helper or a missing non-behavioral label needed for automation. Do not make reliability fixes in this phase; those belong in `101` or `102`.

## Routes And API Contracts

No API contract changes are in scope.

Validation should exercise:

```text
GET  /api/v1/public/instance
POST /api/v1/authentication/login
GET  /api/v1/projects/
POST /api/v1/projects/:project_id/capture-sessions
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
POST /api/v1/projects/:project_id/capture-sessions/:id/complete
```

## Schemas And Types

No schema/type changes are expected.

If a schema/type mismatch is discovered during validation, stop and route the fix back to the relevant implementation child plan instead of silently changing contracts here.

## Behavior Rules

- Validate the intended extension flow end to end.
- Use safe synthetic data only.
- Confirm extension-created capture sessions can produce source material usable by guide/demo generation if that is practical in the current app.
- Preserve UI appearance.
- Preserve extension popup copy unless existing docs are demonstrably wrong.
- Preserve current screenshot-first and privacy-preserving capture defaults.

## Security And Permission Rules

- Do not capture real credentials, customer data, private pages, or raw browser content in committed screenshots.
- Redact tokens, cookies, project IDs, URLs, and user identifiers if they appear in logs/screenshots.
- Do not capture raw input values or page HTML.
- Do not add extension permissions.
- Do not commit local `.env` files or generated build output.

## Migration And Backwards Compatibility

No migration is expected.

Docs should clearly distinguish:

- behavior that is verified in a current browser run;
- behavior that remains in code/tests only;
- behavior that remains deferred.

## Implementation Steps

1. Reread this plan and completed plans `100`, `101`, and `102`.
2. Confirm worktree state and protect unrelated changes.
3. Build the extension if needed for local browser loading.
4. Start the required local server/web apps if browser validation needs them.
5. Load the extension in a browser using the documented local path.
6. Execute the full extension workflow.
7. Capture evidence and screenshots from safe synthetic data.
8. Update docs and screenshot references.
9. Run focused verification.
10. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
11. Update the master plan only for completed phase status.

## Test And Verification Plan

Required:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
rtk git diff --check
```

Required if README/assets/docs app pages are touched:

```bash
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
```

Optional if validating backend-generated artifacts:

```bash
rtk pnpm --filter server run test:smoke
```

## Browser Validation Requirements

Browser validation is the main deliverable.

Required validation path:

```text
configure instance URL
configure portal URL when API/web are split
login
select project
start capture
automatic click capture
manual screenshot capture
pause/resume
finish capture
open portal
confirm captured assets/events are visible or usable downstream
```

Evidence must record:

- date;
- browser;
- extension build/loading method;
- API origin;
- web/portal origin;
- test data used;
- screenshots added or refreshed;
- known limitations remaining.

If browser automation cannot load the extension, document the exact manual Chrome steps and evidence instead.

## Explicit Non-Scope

- Fixing automatic/manual capture implementation bugs.
- Fixing portal URL implementation bugs.
- UI redesign.
- New capture features.
- Raw DOM capture.
- HTML replay.
- Full-page screenshots.
- Production deployment automation.

## Completion Checklist

- [ ] Extension browser workflow validated or precise blocker documented.
- [ ] Automatic click capture evidence recorded.
- [ ] Manual screenshot fallback evidence recorded.
- [ ] Portal open/finish evidence recorded.
- [ ] Screenshots refreshed or explicitly deferred with reason.
- [ ] Docs updated with dated status.
- [ ] Verification commands run and recorded.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

If validation uncovers a new functional bug, create or update a follow-up plan instead of folding a broad fix into this evidence phase.

If validation succeeds, downstream planning can treat extension capture as dogfood-proven for the documented environment.
