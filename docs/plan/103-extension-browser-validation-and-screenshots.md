# Extension Browser Validation And Screenshots Plan

Date: 2026-07-07

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
```

This is child plan `103` of the alpha hardening and extension reliability track.

## Objective

Run the fixed Chrome extension workflow in a real browser, record trustworthy evidence, and refresh only the extension-related public screenshots/docs that were blocked by earlier extension dogfood failures.

This is an evidence, documentation, and screenshot phase. It should not add product behavior, change extension permissions, redesign UI, or broaden capture capabilities.

## Implemented Baseline From Previous Phases

### Plan 101 Capture Reliability Result

Plan `101` completed on 2026-07-07 and proved the current capture foundations:

- `apps/extension/public/manifest.json` uses `host_permissions: ["<all_urls>"]` so background visible-tab screenshot capture works outside a fresh extension-action invocation.
- Content scripts remain scoped to `http://*/*` and `https://*/*`.
- `apps/extension/src/lib/screenshot.ts` times out unresolved screenshot capture after 10 seconds.
- Browser validation proved screenshot-backed automatic `click` events can be created.
- Direct extension-page browser validation proved manual screenshot fallback can create screenshot-backed `capture` events.
- True Chrome toolbar-popup manual capture evidence remained pending and carries into this plan.

### Plan 102 Portal Origin Result

Plan `102` completed on 2026-07-07 and formally closed split-origin portal navigation:

- API origin used in browser validation: `http://localhost:4021`.
- Portal origin used in browser validation: `http://localhost:3000`.
- Extension page used in browser validation: `chrome-extension://cohepadogfeidambknedbdflmcjepaam/index.html`.
- `Open in portal` opened the portal origin, kept the backend capture session in `draft`, and kept local active capture state.
- `Finish capture` opened the portal origin, completed the backend capture session, and cleared local active capture state while preserving the selected project.
- No production extension code, API contract, schema, permission, or manifest changes were needed.
- Current docs now say split-origin portal link handling is closed, while true toolbar-popup manual capture evidence and captured-workflow extension screenshots remain pending.

## Current Evidence Gap

The repo now has code/tests and direct extension-page browser evidence for extension capture, but public/docs status still intentionally withholds captured-workflow extension screenshots because the final evidence pass has not been recorded.

This phase must answer:

- Can the extension workflow be validated from a real loaded extension at desktop size with safe synthetic data?
- Can automatic click capture create screenshot-backed server assets/events in a current browser run?
- Can the manual screenshot fallback be validated from the true toolbar-popup path, or is the toolbar path blocked by automation/environment constraints?
- Can extension-created capture source material be shown as visible/usable in the portal capture session detail, and, if practical, as source material for guide/demo creation?
- Which extension screenshots are now honest enough to commit under `docs/assets/alpha/`?

## Exact Files To Read Before Implementation

Read these before making edits:

```text
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/plan/100-extension-reliability-baseline-and-dogfood-repro.md
docs/plan/101-extension-capture-upload-and-event-fix.md
docs/plan/102-extension-finish-portal-origin-fix.md
docs/plan/103-extension-browser-validation-and-screenshots.md
docs/project-zoomout-status.md
docs/v1-dogfood-smoke-suite.md
README.md
docs/roadmap.md
docs/oss-alpha-summary.md
apps/extension/README.md
apps/extension/package.json
apps/extension/public/manifest.json
apps/extension/src/App.tsx
apps/extension/src/background.ts
apps/extension/src/content-script.ts
apps/extension/src/lib/automatic-capture.ts
apps/extension/src/lib/content-click-capture.ts
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/api.ts
apps/extension/src/lib/navigation.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/url.ts
```

Read these portal/backend files as needed for validation and screenshot capture:

```text
apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx
apps/web/src/lib/api.ts
apps/web/src/lib/routes.ts
apps/server/src/modules/capture-session/capture-session.routes.ts
apps/server/src/modules/capture-session/capture-session.service.ts
apps/server/src/modules/capture-asset/capture-asset.routes.ts
apps/server/src/modules/capture-event/capture-event.routes.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/interactive-demo/interactive-demo.routes.ts
packages/types/src/capture.ts
packages/types/src/guide.ts
packages/types/src/demo.ts
```

## Expected Affected Files

Likely docs and evidence files:

```text
docs/plan/103-extension-browser-validation-and-screenshots.md
docs/plan/master/004-alpha-hardening-and-extension-reliability-master-plan.md
docs/v1-dogfood-smoke-suite.md
apps/extension/README.md
docs/project-zoomout-status.md
README.md
docs/roadmap.md
docs/oss-alpha-summary.md
docs/assets/alpha/
```

Likely screenshot assets to add or refresh, only when backed by real validation:

```text
docs/assets/alpha/alpha-extension-active-capture.png
docs/assets/alpha/alpha-extension-capture-session-detail.png
docs/assets/alpha/alpha-extension-guide-source.png
docs/assets/alpha/alpha-extension-demo-source.png
```

It is acceptable to choose fewer screenshots if the workflow evidence supports fewer public claims. Do not replace existing portal/editor screenshots unless the current run intentionally refreshes those same views with safe synthetic extension-created source material.

Conditional test-only files, only if validation exposes a narrow automation or assertion gap:

```text
apps/extension/src/App.test.tsx
apps/extension/src/lib/automatic-capture.test.ts
apps/extension/src/lib/content-click-capture.test.ts
apps/extension/src/lib/screenshot.test.ts
apps/extension/src/lib/api.test.ts
```

Do not touch runtime implementation files in this phase. If validation proves the workflow needs a code change, stop, document the issue, and route it into the next appropriate implementation plan instead of widening this evidence/screenshot phase.

Do not touch these unless direct evidence proves a new scoped follow-up plan is required:

```text
apps/extension/src/
apps/extension/public/manifest.json
apps/server/src/db/migrations/
packages/types/
packages/constants/
apps/web/src/
pnpm-lock.yaml
```

Generated files that must not be committed:

```text
apps/extension/dist/
apps/server/storage/
node_modules/
coverage/
playwright-report/
```

## Routes And API Contracts

No route URL or API contract change is in scope.

Validation should exercise these current contracts:

```text
GET  /api/v1/public/instance
POST /api/v1/setup/first-run
POST /api/v1/authentication/login
GET  /api/v1/projects
POST /api/v1/projects
POST /api/v1/projects/:project_id/capture-sessions
GET  /api/v1/projects/:project_id/capture-sessions/:capture_session_id/detail
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos
```

Route behavior to preserve:

- Extension login must continue to send `x-demo-composer-client: extension` and consume the returned `session_token`.
- Extension API calls must continue to send `Authorization: Bearer <session_token>`.
- Capture session creation must continue to send `source_type: "extension"`.
- Asset upload must remain multipart PNG screenshot upload.
- Event creation must link the uploaded screenshot asset and use ordered event indices.
- Finish must call the complete route against `instanceUrl`, then open the portal detail path against `portalUrl` when configured.
- Guide/demo generation from capture session should use the existing routes without route churn.

If an API mismatch is found, stop and document the mismatch. Do not silently change shared or server contracts in this screenshot/evidence phase.

## Schemas And Types

No schema/type changes are expected.

Relevant shared contracts to understand:

- `CaptureSession`, `CaptureSessionDetailResponse`, `CaptureSessionCreateInput`, and `CompleteCaptureSessionResponse` in `packages/types/src/capture.ts`.
- Capture asset and capture event request/response shapes in `packages/types/src/capture.ts`.
- Guide generation response types in `packages/types/src/guide.ts`.
- Interactive demo generation response types in `packages/types/src/demo.ts`.
- Extension-local settings and API types in `apps/extension/src/lib/settings.ts` and `apps/extension/src/lib/api.ts`.

If validation reveals a schema/type mismatch, create or update a follow-up implementation plan. Do not fold a schema migration into this plan.

## Behavior Rules

### Browser Validation Behavior

- Use safe synthetic local data only.
- Validate the extension from a built unpacked Chrome extension.
- Prefer true toolbar-popup validation for manual screenshot fallback because this is the remaining evidence gap.
- If agent-browser cannot drive the true toolbar popup, document the exact blocker and complete a direct extension-page fallback validation only as bounded evidence.
- Validate automatic click capture on a safe local `http://` test page with non-private content.
- Validate pause/resume state if the controls are reachable in the chosen extension surface.
- Validate open-active portal navigation and finish portal navigation use the configured portal origin. This may reuse plan `102` evidence if the current browser run already checks it.
- Validate backend records after each capture action:
  - asset count and file metadata;
  - event count and ordered indices;
  - `click` event for automatic capture;
  - `capture` event for manual fallback;
  - capture session status before and after finish.
- Validate portal capture session detail renders the extension-created source material.
- If practical, generate a guide and interactive demo from the extension-created capture session and confirm the initial editor/source pages render non-empty screenshot-backed material.

### Screenshot Behavior

- Screenshots must represent real behavior from this validation run.
- Screenshots must use safe synthetic data and local/demo URLs only.
- Avoid screenshots that show bearer tokens, cookies, extension storage, browser profile paths, private filesystem paths, or private account data.
- Prefer these screenshot categories:
  - extension active capture or success diagnostic state;
  - portal capture session detail showing extension-created events/assets;
  - generated guide source/editor page from extension-created capture;
  - generated interactive demo source/editor page from extension-created capture.
- Do not add screenshots that overstate the evidence. If true toolbar manual capture remains blocked but direct extension-page manual capture works, docs must say exactly that.
- Keep existing screenshot dimensions consistent where practical:
  - portal/editor screenshots: desktop `1440x900`;
  - extension popup screenshots: popup-sized `360x420` or current extension viewport equivalent;
  - direct extension-page screenshots may be larger, but must be labeled as direct extension-page evidence if committed.

### Documentation Behavior

- Update docs only with evidence from the current run or already-completed plans `101` and `102`.
- Distinguish:
  - automatic click capture validated in browser;
  - direct extension-page manual fallback validated in browser;
  - true toolbar-popup manual fallback validated or still blocked;
  - split-origin portal navigation closed by plan `102`;
  - final screenshots added or explicitly deferred.
- If screenshots are added to `README.md`, include a short note that they use safe synthetic extension-created data.
- Update `docs/v1-dogfood-smoke-suite.md` with a dated evidence entry, commands/environment, result, and leftovers.

## Security And Permission Rules

- Do not use production accounts, customer sites, private URLs, private browser profiles, or private screenshots.
- Do not commit cookies, bearer tokens, session tokens, local storage dumps, invite tokens, generated storage files, or `.env` files.
- Do not print or paste session tokens into docs.
- Redact or avoid user emails in committed screenshots. If an email is visible, use an obviously synthetic local account.
- The extension must continue to avoid raw DOM HTML, raw input values, navigation events, full-page stitched screenshots, and HTML snapshots.
- Do not add extension permissions or broaden content script matches.
- Do not weaken plan `101` privacy rules around `input_value_redacted`.
- Do not weaken plan `102` portal URL safety.
- Do not commit raw uploaded screenshot binaries from server storage unless they are deliberately selected sanitized docs screenshots under `docs/assets/alpha/`.

## Migration And Backwards Compatibility

No database migration is expected.

No API migration is expected.

No extension storage migration is expected.

Browser/install compatibility:

- Continue using an unpacked extension build from `apps/extension/dist`.
- Do not require existing users to reconnect their instance.
- Do not change `manifest.json`.
- Do not change extension ID assumptions except documenting the ID observed in the browser run.

Docs compatibility:

- Existing README screenshot references must keep working.
- New screenshots should be committed under `docs/assets/alpha/` with stable names.
- If a planned screenshot cannot be captured honestly, leave the existing pending note in place with a dated blocker.

## Implementation Steps

1. Reread this plan, completed plans `100`, `101`, and `102`, and the parent master plan.
2. Confirm the worktree state and identify any unrelated user/agent changes.
3. Inspect current extension, server, web, README, status, and asset files listed above.
4. Decide whether the validation run will use:
   - true Chrome toolbar popup path;
   - direct extension page fallback;
   - both, with toolbar-popup evidence taking precedence for the manual fallback gap.
5. Prepare a safe synthetic local target page for automatic click capture and manual screenshot capture.
6. Reset only the testing database if using DB-backed validation. Never reset a user development database.
7. Start the testing API and local web portal on separate origins when possible.
8. Seed first-run setup and a disposable project through real APIs or the portal.
9. Build the extension.
10. Load `apps/extension/dist` in agent-browser or Chrome.
11. Configure instance URL as the API origin.
12. Configure portal URL as the web origin.
13. Sign in through the extension and select the disposable project.
14. Start automatic capture.
15. Navigate to the safe test page and perform at least one supported click.
16. Verify backend asset/event records for the automatic `click` event.
17. Validate pause/resume if reachable.
18. Validate manual screenshot fallback from the true toolbar popup if possible.
19. If true toolbar popup cannot be driven, document the blocker and run the direct extension-page manual fallback path only as bounded evidence.
20. Verify backend asset/event records for the manual `capture` event.
21. Open the active capture in the portal and confirm it uses the portal origin and does not complete/clear active state.
22. Finish the capture and confirm completion, portal-origin navigation, selected project preservation, and local active state clearing.
23. In the portal, confirm extension-created events/assets render on capture session detail.
24. If practical, generate a guide and an interactive demo from the capture session and confirm the source screenshots render.
25. Capture only screenshots that are truthful, sanitized, and useful for public docs.
26. Update docs/status/screenshot references to match the evidence.
27. Run focused verification.
28. Update this plan with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
29. Update the parent master plan only for completed phase status.
30. Commit only scoped changes in small logical commits.

## Test And Verification Plan

Required before browser validation:

```bash
rtk pnpm --filter extension build
```

Required extension verification:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
```

Required if docs/status/assets are touched:

```bash
rtk git diff --check
```

Required if docs app source files are touched. README/status Markdown-only edits do not require docs app checks unless they are surfaced through the docs app or the implementation changes `apps/docs/`:

```bash
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
rtk pnpm --filter docs build
```

Required if backend/server code is touched, which should be avoided in this phase:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm check-types
```

Recommended for DB-backed dogfood validation:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
```

Optional if validating the whole backend smoke after evidence capture:

```bash
rtk pnpm --filter server run test:smoke
```

Always run before handoff:

```bash
rtk git status --short
```

## Agent-Browser Validation Requirements

This phase requires browser validation. Use the `agent-browser` skill/CLI first.

Build and load the extension:

```bash
rtk pnpm --filter extension build
rtk agent-browser --session demo-composer-plan-103 --extension /home/tm/Desktop/work/demo_composer_v2/apps/extension/dist open chrome-extension://cohepadogfeidambknedbdflmcjepaam/index.html
```

Use a split-origin local setup when possible:

```text
API origin: http://localhost:4021 or the current testing API origin
Portal origin: http://localhost:3000 or the current local web origin
Extension build path: apps/extension/dist
Extension id: record the observed unpacked extension id
Target page: safe local http page with synthetic buttons/content
Project: disposable test project
Capture session: disposable extension-created session
```

Minimum agent-browser path:

1. Open the extension page or toolbar popup.
2. Configure instance URL and portal URL.
3. Sign in with a synthetic user.
4. Select a disposable project.
5. Start automatic capture.
6. Open a safe local target page.
7. Click a supported non-input element and wait for automatic capture success.
8. Verify server-side screenshot asset and `click` event.
9. Pause and resume automatic capture if the controls are reachable.
10. Trigger manual `Capture screenshot` from the true toolbar popup if possible.
11. If toolbar popup cannot be driven, record the exact agent-browser limitation and validate manual capture from the direct extension page as bounded evidence.
12. Verify server-side screenshot asset and `capture` event.
13. Click `Open in portal` and verify portal-origin URL, backend status still not completed, and local active state still active.
14. Click `Finish capture` and verify portal-origin URL, backend status completed, and local active state cleared.
15. Open the portal capture session detail page and verify extension-created events/assets render.
16. Generate guide and interactive demo from the capture session if practical; verify source screenshots render.
17. Capture sanitized screenshots for docs only after the behavior is proven.

Required evidence to record in this plan and/or `docs/v1-dogfood-smoke-suite.md`:

- date and local timezone;
- browser and agent-browser path used;
- extension build path and extension id;
- API origin and portal origin;
- target page URL;
- project id/name;
- capture session id;
- automatic capture result and backend asset/event evidence;
- manual capture result and backend asset/event evidence;
- toolbar-popup validation status;
- open-active URL and backend/local state result;
- finish URL and backend/local state result;
- portal capture detail rendering result;
- guide/demo generation result if performed;
- screenshots added/refreshed;
- leftovers or blockers.

If agent-browser cannot load or operate the extension toolbar popup, use one of these fallback paths and document the exact limitation:

- direct extension-page automation for extension UI;
- manual Chrome validation with explicit steps and resulting evidence;
- no screenshot refresh if evidence would overstate current reliability.

Direct extension-page validation can prove extension React app and API behavior, but it cannot close the true toolbar-popup manual capture gap by itself. Only mark toolbar-popup manual capture as validated if the toolbar popup or an equivalent real Chrome extension-action popup path is actually exercised.

Do not fabricate screenshots or use generated mockups.

## Screenshot Asset Requirements

Save screenshots under:

```text
docs/assets/alpha/
```

Use stable, descriptive filenames. Preferred names:

```text
alpha-extension-active-capture.png
alpha-extension-capture-session-detail.png
alpha-extension-guide-source.png
alpha-extension-demo-source.png
```

Screenshot acceptance rules:

- Images must come from a real local browser run.
- Images must use safe synthetic data.
- Images must not show private browser chrome, token-bearing URLs, devtools secrets, local filesystem paths, or production/customer content.
- Images must not imply true toolbar-popup manual validation succeeded unless it actually did.
- If only direct extension-page validation is possible, label docs and dogfood notes accordingly.
- Keep image dimensions stable and reasonable. Existing portal screenshots are `1440x900`; existing extension setup screenshot is `360x420`.

## Documentation Updates

Update `docs/v1-dogfood-smoke-suite.md` with a dated entry for this validation run.

Update `apps/extension/README.md` if and only if status changes:

- true toolbar-popup manual capture validated;
- direct extension-page manual capture remains the only validation path;
- screenshots are added;
- limitations remain.

Update `docs/project-zoomout-status.md`, `README.md`, `docs/roadmap.md`, and `docs/oss-alpha-summary.md` only to reflect evidence-backed status changes.

README screenshot updates should be conservative:

- Add extension captured-workflow screenshots only if the captured workflow is validated.
- Keep the existing setup screenshot if it remains accurate.
- Remove the "captured-workflow screenshots pending" note only if screenshots are actually added and the docs state any remaining toolbar limitation accurately.

## Explicit Non-Scope

- Fixing automatic click capture bugs.
- Fixing manual screenshot fallback bugs.
- Fixing portal URL generation bugs.
- Adding extension permissions or changing `manifest.json`.
- UI redesign.
- New capture modes.
- DOM snapshot capture.
- Raw input-value capture.
- HTML replay.
- Full-page stitched screenshots.
- Production deployment automation.
- Chrome Web Store packaging.
- Database migrations.
- API route churn.
- Shared package/domain refactors.
- Broad extension popup refactor; child plan `107` owns that.

## Completion Checklist

- [ ] Completed plans `101` and `102` reread and used as source of truth.
- [ ] Current worktree state checked before edits.
- [ ] Extension browser workflow validated or precise blocker documented.
- [ ] Automatic click capture evidence recorded.
- [ ] Manual screenshot fallback evidence recorded.
- [ ] True toolbar-popup manual capture validated or exact blocker documented.
- [ ] Pause/resume checked or explicitly documented as not reachable in the chosen validation surface.
- [ ] Open-active portal evidence recorded.
- [ ] Finish portal evidence recorded.
- [ ] Backend asset/event/status evidence recorded.
- [ ] Portal capture session detail rendering checked.
- [ ] Guide/demo source generation checked or explicitly deferred with reason.
- [ ] Screenshots refreshed or explicitly deferred with reason.
- [ ] Screenshots use safe synthetic data and do not expose secrets/private data.
- [ ] Docs updated with dated status only where evidence changed.
- [ ] Focused verification commands run and recorded.
- [ ] `docs/v1-dogfood-smoke-suite.md` updated with validation evidence.
- [ ] Plan `103` updated with status, checklist, implementation log, verification notes, leftovers, and handoff notes.
- [ ] Parent master plan updated only for completed phase status.

## Implementation Log

To be completed during implementation.

## Verification Notes

To be completed during implementation.

## Leftovers

To be completed during implementation.

## Handoff Notes

If validation uncovers a new functional bug, do not fold a broad fix into this evidence phase. Create or update the next appropriate child plan with:

- exact reproduction steps;
- browser/session/environment details;
- expected vs actual behavior;
- affected files/contracts;
- security and compatibility notes.

If validation succeeds and screenshots are refreshed, child plan `104` can treat extension public docs as current for the purpose of architecture documentation sync.

If true toolbar-popup manual capture remains blocked by automation while direct extension-page manual capture remains valid, carry that exact limitation forward and avoid claiming full toolbar-popup validation in public docs.
