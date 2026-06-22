# Alpha Hardening Master Plan

Date: 2026-06-22

Status: Active master plan.

Master plan number: 001.

## Purpose

This master plan turns the current alpha standing into the next eight phases of work.

It is not meant to be implemented directly. Each phase should be picked up by an agent or maintainer, expanded into a focused numbered plan under `docs/plan/`, reviewed against current code, and then implemented in small tested slices.

Current product shape:

```text
self-hosted first-run setup
  -> project
  -> capture session
  -> screenshots and capture events
  -> guide and interactive demo
  -> publishable public/restricted links
  -> teammate invite
```

Current priority:

```text
make the alpha trustworthy through green verification, real dogfood evidence,
editor hardening, extension reliability, and self-host operational polish
```

## Master Plan Series Rules

Master plans live under:

```text
docs/plan/master/
```

Use this naming pattern:

```text
001-alpha-hardening-master-plan.md
002-<future-theme>-master-plan.md
003-<future-theme>-master-plan.md
```

A master plan should describe a broad multi-phase direction. It should not contain direct implementation details that belong in a focused numbered plan under `docs/plan/`.

When a new master plan is added:

- use the next master-plan number
- include the date and status
- explain how it relates to active or completed master plans
- avoid duplicating already completed phases from older master plans
- update old master plans only if their status or phase tracking changed

## Source Documents

Future agents should read these before expanding any phase:

- `CONTEXT.md`
- `README.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`
- `docs/v1-dogfood-smoke-suite.md`
- `docs/backend-route-inventory.md`
- `docs/operations.md`
- `docs/production-readiness-checklist.md`
- `docs/system-design-pattern.md`
- relevant ADRs under `docs/adr/`
- relevant prior plans under `docs/plan/`

## Current Standing Snapshot

As of this master plan:

- The backend has a DB-backed smoke test proving the core setup-to-published-guide/demo-and-invite path.
- The portal has the core project, capture, guide, interactive demo, publish, and invite surfaces.
- The extension has automatic click capture MVP plus manual screenshot fallback.
- Manual portal dogfood completed with non-blocking limitations in `docs/plan/071-manual-portal-dogfood.md`.
- Manual extension dogfood completed as a failed/blocked smoke run in `docs/plan/072-manual-extension-dogfood.md`.
- Portal alpha screenshots are committed in `docs/assets/alpha/`; extension screenshots remain pending until extension capture is fixed or explicitly bounded.
- `apps/docs` is still starter content.
- shared packages are mostly placeholders until real cross-app reuse exists.
- server-local domain modules are acceptable for alpha but remain architecture debt compared with the original domain-package direction.

## Planning Rules For Future Agents

- Start from one phase only.
- Before implementing, create a numbered child plan in `docs/plan/` using the next available number.
- Keep the child plan narrow enough to verify in one PR-sized change.
- Update this master plan only when a phase changes materially or is completed.
- Update README, route inventory, smoke docs, operations docs, or roadmap whenever behavior changes.
- Use safe synthetic data for dogfood and screenshots.
- Do not add HTML replay, AI, analytics, lead capture, custom branding, or hosted SaaS behavior unless a later product decision explicitly changes scope.
- If a phase reveals several unrelated bugs, create separate child plans instead of mixing them into one large patch.
- Do not mark a manual smoke flow as passed unless it was actually run and recorded.

## Phase Overview

| Phase | Name | Primary Outcome |
| --- | --- | --- |
| 1 | Verification And Docs Sync | All non-DB, DB, smoke, build, type, lint, and docs status checks are truthful and green. |
| 2 | Manual Portal Dogfood | Manual portal workflow is run, recorded, and converted into explicit follow-up inputs. |
| 3 | Manual Extension Dogfood | Unpacked Chrome extension workflow is run, recorded, and converted into reliability follow-ups. |
| 4 | Alpha Visual Evidence | README/status docs get real product screenshots and smoke evidence without fake mockups. |
| 5 | Guide Editor V1 Hardening | Guide authoring becomes smoother for repeated real usage. |
| 6 | Interactive Demo V1 Hardening | Demo editing and public viewing become easier, clearer, and more reliable. |
| 7 | Extension Capture Reliability V2 | Automatic capture handles real browser conditions more gracefully. |
| 8 | Self-Host Production Hardening V2 | Operators get stronger storage, cleanup, packaging, and deployment guidance/tools. |

## Phase Dependencies

| Phase | Should Start After | Why |
| --- | --- | --- |
| 1 | Immediately | Removes stale test/docs noise before other agents start work. |
| 2 | Phase 1 | Manual portal dogfood needs a trustworthy baseline. |
| 3 | Phase 1 | Manual extension dogfood needs a trustworthy baseline. |
| 4 | Phases 2 and 3 | Screenshots should come from real dogfood flows, not assumptions. |
| 5 | Phase 2 | Guide hardening should be driven by observed authoring friction. |
| 6 | Phases 2 and 3 | Demo hardening should be driven by portal and extension capture evidence. |
| 7 | Phase 3 | Extension reliability priorities should come from extension dogfood failures. |
| 8 | Phase 1, ideally after Phase 2 | Operational hardening can start once verification is stable, but dogfood findings may affect priorities. |

## Child Plan Template

When expanding a phase into a numbered plan under `docs/plan/`, use this minimum shape:

```text
# <Plan Title>

Date: YYYY-MM-DD

Status: Planned.

## Parent Master Plan

docs/plan/master/001-alpha-hardening-master-plan.md

## Goal

## Current Baseline

## Scope

## Explicit Non-Goals

## Implementation Plan

## Testing Plan

## Acceptance Criteria

## Documentation Updates
```

The child plan should name the exact files, routes, pages, or tests it expects to touch. If that cannot be known yet, the first task in the child plan should be a short codebase audit.

## Phase 1: Verification And Docs Sync

Suggested child plan:

```text
docs/plan/070-verification-and-docs-sync.md
```

Status: completed by `docs/plan/070-verification-and-docs-sync.md`.

### Completion Result

Completed on 2026-06-22.

Result:

- invite service tests no longer depend on wall-clock time
- expired invite lookup and acceptance behavior has explicit regression coverage
- DB integration tests have a server Vitest timeout budget suitable for current long workflows
- verification commands passed, including non-DB tests, DB integration, smoke, typecheck, build, lint, and whitespace checks
- plans `049` and `067` now have truthful statuses
- `apps/docs` is documented as parked starter content for alpha

Follow-up note:

- DB-backed suites currently share first-run setup state, so `test:db` and `test:smoke` should be run sequentially with a test database reset before each suite until future work improves isolation.

### Goal

Make the repository's stated alpha status match actual behavior and make the baseline checks green.

This phase should be completed before broader dogfooding so agents are not chasing stale test failures or stale docs.

### Original Baseline

Known issue before completion:

- `rtk pnpm --filter server test` has failing organization invite service tests because fixtures expired on `2026-06-20T00:00:00.000Z`.

Known docs drift before completion:

- `docs/plan/049-project-settings-archive-portal.md` still says `Status: Planned`, but project settings/archive UI exists.
- `docs/plan/067-docs-freshness-and-status-sync.md` still says `Status: Planned`, but much of the docs freshness work appears to have landed through later launch polish.

### Scope

- Fix time-sensitive invite service tests with injected/frozen time or future-relative fixtures.
- Confirm server non-DB tests pass.
- Confirm DB integration and smoke tests pass against the configured test database.
- Update stale plan status lines and implementation notes.
- Add a concise current verification note where useful, without claiming manual dogfood has passed.
- Check route inventory for drift after current implementation.
- Check README/status docs for stale "not built" statements.
- Decide whether `apps/docs` should be documented as parked starter content or replaced in a later docs-site child plan.
- Keep `packages/types`, `packages/constants`, and `packages/ui` placeholder status explicit if they remain intentionally thin.

### Todos

- [x] Read `apps/server/src/modules/organization/organization-invites.service.test.ts`.
- [x] Fix expired invite fixture behavior without weakening expiration coverage.
- [x] Add a regression test that proves expired invites are still rejected.
- [x] Run `rtk pnpm --filter server test`.
- [x] Run `rtk pnpm --filter web test`.
- [x] Run `rtk pnpm --filter extension test`.
- [x] Run `rtk pnpm --filter server test:db`.
- [x] Run `rtk pnpm --filter server test:smoke`.
- [x] Run `rtk pnpm check-types`.
- [x] Run `rtk pnpm build`.
- [x] Run `rtk pnpm lint`.
- [x] Run `rtk git diff --check`.
- [x] Update `docs/plan/049-project-settings-archive-portal.md` status and implementation notes.
- [x] Decide whether `067` should be marked implemented, superseded, or partially implemented.
- [x] Update `docs/project-zoomout-status.md` only if current state changed.
- [x] Record whether `apps/docs` is intentionally parked or should become a follow-up plan.
- [x] Record whether placeholder shared packages are intentional for now.

### Acceptance Criteria

- All standard non-DB tests are green.
- DB integration and smoke tests are green in a documented local/test environment.
- Plan `049` no longer incorrectly says planned.
- Plan `067` has an accurate status.
- Docs still clearly mark manual portal and extension dogfood as pending unless Phase 2 or Phase 3 has passed.

## Phase 2: Manual Portal Dogfood

Suggested child plan:

```text
docs/plan/071-manual-portal-dogfood.md
```

### Goal

Run the portal manually from a clean self-host-style setup and record whether the product can complete the full guide/demo/invite workflow through the browser UI.

This is evidence-gathering first, implementation second. Do not hide failures. Record them and turn them into follow-up plans.

### Scope

- Use `docs/v1-dogfood-smoke-suite.md` as the required checklist.
- Use safe synthetic screenshots only.
- Exercise first-run setup, login, project creation, manual capture, guide creation, guide editing, publishing, public guide viewing, password protection, embed, interactive demo creation, demo hotspot, public demo viewing, invite creation, and invite acceptance.
- Record exact environment, commit, commands, flows passed, flows failed, limitations, and follow-up plan links.

### Todos

- [x] Prepare a clean testing database.
- [x] Run migrations.
- [x] Start API and web portal.
- [x] Complete first-run setup in the browser.
- [x] Log out and log back in.
- [x] Create a project.
- [x] Create a manual capture session.
- [x] Upload synthetic screenshots.
- [x] Create screenshot-backed capture events.
- [x] Reorder capture events.
- [x] Edit a manual capture event.
- [x] Generate a guide from the capture session.
- [x] Edit guide title/body for at least one step.
- [x] Add or edit screenshot annotations.
- [x] Open guide preview.
- [x] Export Markdown.
- [x] Export HTML ZIP.
- [x] Publish the guide.
- [x] Open the public guide.
- [x] Enable password protection and verify unlock flow.
- [x] Open guide embed route.
- [x] Create an interactive demo from the same capture.
- [x] Edit scene title.
- [x] Create and edit at least one hotspot.
- [x] Publish the interactive demo.
- [x] Open public demo viewer.
- [x] Open demo embed route.
- [x] Invite a teammate.
- [x] Accept invite as teammate.
- [x] Confirm teammate project access.
- [x] Check `/healthz`.
- [x] Check `/readyz`.
- [x] Record results in `docs/v1-dogfood-smoke-suite.md`.
- [x] Record explicit follow-up inputs for non-blocking friction.

### Result

Completed with non-blocking limitations on 2026-06-22. See:

```text
docs/plan/071-manual-portal-dogfood.md
docs/v1-dogfood-smoke-suite.md
```

Missed work to carry forward:

- Guide structural add-block controls were visible but inert during the dogfood run; carry this into Phase 5 guide editor hardening.
- Several portal controls were more reliable with keyboard activation than pointer click in automation; investigate during portal/editor hardening.
- Invite URL construction in split API/web local development omitted the Vite port; clarify or make it portal-origin aware.
- Manual extension dogfood remains pending and must be handled by Phase 3 with separate extension evidence.

### Acceptance Criteria

- Manual portal smoke has a dated result entry.
- Every failed item has either a follow-up plan or an explicit limitation.
- No private screenshots, cookies, tokens, or local storage files are committed.
- README/status docs are updated only with truthful evidence.

## Phase 3: Manual Extension Dogfood

Suggested child plan:

```text
docs/plan/072-manual-extension-dogfood.md
```

Status: completed as a failed/blocked evidence run by `docs/plan/072-manual-extension-dogfood.md`.

### Goal

Run the unpacked Chrome extension against a safe test page and prove the automatic click capture MVP works outside unit tests.

### Scope

- Build the extension.
- Load `apps/extension/dist` unpacked in Chrome or Chromium.
- Use a safe `http` or `https` synthetic workflow page.
- Exercise instance configuration, login, project selection, automatic click capture, pause/resume, manual screenshot fallback, finish-to-portal, guide generation, demo generation, and click-position metadata.
- Record failures as reliability follow-ups.

### Todos

- [x] Build extension with `rtk pnpm --filter extension build`.
- [x] Load unpacked extension from `apps/extension/dist`.
- [x] Configure local or test instance URL.
- [x] Sign in from extension.
- [x] Select the smoke project.
- [x] Start automatic capture.
- [x] Click through a safe test workflow page.
- [ ] Confirm ordered screenshot-backed `click` events arrive in portal capture detail. Failed: no click events or files were created.
- [ ] Confirm target text, role, selector, coordinates, viewport, and bounding box metadata look safe and useful. Blocked: no click events were available to inspect.
- [x] Pause capture.
- [x] Confirm clicks are not captured while paused.
- [x] Resume capture.
- [x] Use manual screenshot fallback.
- [x] Finish capture.
- [ ] Confirm portal opens the completed capture session. Failed in split API/web setup: extension opened the API origin.
- [ ] Generate a guide from automatic events. Blocked: no extension events were captured.
- [ ] Generate an interactive demo from automatic events. Blocked: no extension events were captured.
- [ ] Verify click positions create usable guide annotations or demo hotspots. Blocked: no click metadata was captured.
- [x] Test unsupported page behavior, such as browser-restricted pages, and record recovery behavior.
- [x] Record results in `docs/v1-dogfood-smoke-suite.md`.
- [x] Create child plans for reliability gaps.

### Result

Completed as a failed/blocked smoke run on 2026-06-22. See:

```text
docs/plan/072-manual-extension-dogfood.md
docs/v1-dogfood-smoke-suite.md
```

Reliability inputs for Phase 7:

- Automatic click capture created a backend session but no events/files.
- Manual screenshot fallback produced no upload/event request and no popup error.
- Extension-opened portal URLs used the API origin in a split API/web local setup and returned 404 JSON.
- Guide/demo generation from extension events was blocked because no events/assets were captured.

Missed work to carry into the next implementation plan:

- Identify whether automatic click loss happens in content-script injection, message passing, background handling, screenshot capture/upload, or event creation.
- Add user-visible extension diagnostics for failed automatic and manual capture attempts.
- Add a browser-facing portal origin setting or equivalent URL builder so API-origin and web-origin local setups are both supported.
- Re-run extension guide/demo generation only after at least one extension-created event and asset exists.

### Acceptance Criteria

- Manual extension smoke has a dated result entry.
- Automatic click capture is either passed or has specific limitations recorded.
- Manual screenshot fallback is either verified or has specific limitations recorded.
- Finish-to-portal flow is either verified or has specific limitations recorded.
- No private sites or private screenshots are used.

## Phase 4: Alpha Visual Evidence

Suggested child plan:

```text
docs/plan/073-alpha-product-screenshots.md
```

Status: completed with portal-only visual evidence by `docs/plan/073-alpha-product-screenshots.md`.

### Completion Result

Completed on 2026-06-23 local time, using the 2026-06-22 portal dogfood evidence as the baseline.

Result:

- six real portal/public screenshots were captured from a safe synthetic local alpha run
- screenshots live under `docs/assets/alpha/`
- README now includes the screenshot set and links it to the 2026-06-22 dogfood evidence
- project status, OSS summary, and roadmap no longer say portal screenshots are pending
- extension screenshots remain pending because Phase 3 extension dogfood failed/blocked

Follow-up note:

- add extension visual evidence only after Phase 7 fixes or explicitly bounds extension capture reliability
- consider a screenshot refresh cadence after guide/editor and demo hardening changes the UI
- consider moving visual evidence into a lighter gallery or docs-site page if README image tables become too heavy
- keep `apps/docs` as starter content until a separate docs-site plan is created

### Goal

Add real, safe visual evidence to the public alpha docs after dogfooding has produced trustworthy screens.

### Scope

- Capture portal product screenshots from safe synthetic data only.
- Add images under `docs/assets/`.
- Update README and status docs with a small number of real screenshots.
- Decide whether `apps/docs` should stay starter-only, be removed from public positioning, or become a minimal docs landing site.
- Avoid fake mockups, generated screenshots that do not match the app, or private workflow captures.

### Suggested Assets

- Portal project workspace.
- Capture session detail with safe events.
- Guide editor with screenshot and annotation.
- Public guide reader.
- Interactive demo editor with scene/hotspot.
- Public interactive demo viewer.

### Todos

- [x] Decide screenshot naming convention under `docs/assets/`.
- [x] Create or reuse safe synthetic dogfood project.
- [x] Capture screenshots at consistent viewport sizes.
- [x] Redact any local URLs, emails, invite tokens, or paths if visible.
- [x] Optimize images enough that README remains practical.
- [x] Add screenshots to README.
- [x] Add a short note that screenshots use synthetic data.
- [x] Link to dogfood result log.
- [x] If `apps/docs` remains starter content, make sure public docs do not point users there as product documentation.
- [x] If `apps/docs` should become real, create a separate child plan rather than mixing that implementation with screenshot capture.
- [x] Run `rtk git diff --check`.

### Acceptance Criteria

- README has real product visuals.
- Screenshots do not expose secrets, customer data, private URLs, tokens, or cookies.
- Screenshots match the current app, not design aspirations.
- Docs still label the project alpha.
- Extension screenshots remain pending until extension capture has a passing or explicitly bounded path.

## Phase 5: Guide Editor V1 Hardening

Suggested child plan:

```text
docs/plan/074-guide-editor-v1-hardening.md
```

Status: completed with follow-up notes by `docs/plan/074-guide-editor-v1-hardening.md`.

### Progress Update

Updated on 2026-06-23 local time.

Completion result:

- guide editor dogfood findings were narrowed to the observed add-block friction
- focused tests now cover step, header, paragraph, tip, alert, and divider insertion paths
- header insertion is covered together with post-insert block reordering
- non-step block actions now use type-specific labels for clearer movement and delete controls
- no backend guide contract changes were required
- no README screenshot refresh was required because the visible editor layout did not materially change

Carry-forward guide editor candidates:

- manual browser smoke for the affected add-block workflow
- screenshot picker clarity and upload recovery
- annotation editing affordances
- publish stale-state clarity
- export error messaging
- save/error/retry behavior for metadata and step edits
- empty and partial-data guide editor states

### Goal

Improve the guide editor so repeated real authoring feels reliable and efficient.

### Current Pain Areas To Investigate

- Editing several steps in sequence.
- Reordering blocks after adding custom content.
- Screenshot picker clarity.
- Direct screenshot upload recovery.
- Annotation creation/editing accuracy.
- Publish status clarity after draft edits.
- Export error handling.
- Empty and partial-data states.

### Scope

- Start from Phase 2 dogfood findings.
- Keep source capture immutable.
- Keep guide steps and guide blocks first-class.
- Improve focused UX and reliability without broad redesign.
- Strengthen tests around any bug fixed or workflow changed.

### Todos

- [x] Review guide editor dogfood notes.
- [x] Prioritize top 3-5 guide authoring friction points.
- [x] Create focused implementation subplans if needed.
- [ ] Improve save/error/retry behavior for guide metadata and step edits.
- [ ] Improve screenshot picker copy, state, and failure handling.
- [ ] Improve annotation controls or visual positioning if dogfood shows confusion.
- [ ] Confirm publish panel clearly shows stale draft vs published snapshot.
- [ ] Confirm Markdown and HTML ZIP export failures produce actionable messages.
- [x] Add or update focused web tests.
- [x] Add backend tests only when behavior changes server contracts.
- [x] Run relevant tests and full verification as appropriate.

### Acceptance Criteria

- A user can edit a multi-step guide repeatedly without losing orientation.
- Screenshot and annotation workflows are understandable from the UI.
- Draft-vs-published state is clear.
- Export failures are recoverable or clearly explained.
- New behavior is covered by focused tests.

## Phase 6: Interactive Demo V1 Hardening

Suggested child plan:

```text
docs/plan/075-interactive-demo-v1-hardening.md
```

Status: completed with follow-up notes by `docs/plan/075-interactive-demo-v1-hardening.md`.

### Progress Update

Updated on 2026-06-23 local time.

Completion result:

- demo dogfood findings were narrowed to public viewer navigation resilience rather than broad redesign
- public viewer now falls back to the next linear scene when a click hotspot references a missing or stale target scene
- focused tests cover the stale target-scene fallback
- no backend snapshot shape or API contract changes were required
- no README screenshot refresh was required because the visible demo editor/viewer layout did not materially change

Carry-forward demo candidates:

- manual browser smoke for target-scene fallback
- scene list/reorder feedback improvements
- hotspot editor affordance improvements
- narrow viewport and embed visual QA
- portal pointer-click/accessibility investigation from Phase 2 dogfood
- extension-generated demo quality after Phase 7 restores capture evidence
- public viewer behavior when a missing target occurs on the final scene

### Goal

Improve interactive demo authoring and viewing so screenshot-first demos are credible for alpha users.

### Current Pain Areas To Investigate

- Scene list navigation and orientation.
- Hotspot placement precision.
- Hotspot target-scene behavior.
- Scene reorder behavior.
- Public viewer controls and navigation.
- Embed rendering.
- Mobile or narrow viewport behavior.
- Empty scene or missing asset recovery.

### Scope

- Start from Phase 2 and Phase 3 dogfood findings.
- Keep interactive demos separate from guides.
- Keep screenshot-first demos; do not add HTML replay.
- Improve linear navigation and hotspot behavior before branching.

### Todos

- [x] Review demo editor and public viewer dogfood notes.
- [x] Prioritize top 3-5 demo authoring/viewing issues.
- [x] Verify hotspot coordinates remain normalized and safe.
- [ ] Improve hotspot creation/editing affordances.
- [ ] Improve target-scene selection if current flow is unclear.
- [ ] Improve scene list/reorder feedback.
- [x] Improve public viewer next/back/click behavior if needed.
- [ ] Test embed mode for guide/demo parity.
- [x] Add focused web tests around updated interactions.
- [x] Add backend tests if scene/hotspot validation changes.
- [x] Run relevant verification.

### Acceptance Criteria

- A user can create a multi-scene demo and understand how hotspots move viewers.
- Public demo viewer behaves predictably with linear and target-scene navigation.
- Embed route remains usable.
- Hotspot coordinate validation remains strict.
- New behavior is covered by focused tests.

## Phase 7: Extension Capture Reliability V2

Suggested child plan:

```text
docs/plan/076-extension-capture-reliability-v2.md
```

Status: in progress; first split API/web portal URL slice implemented by `docs/plan/076-extension-capture-reliability-v2.md`.

### Progress Update

Updated on 2026-06-23 local time.

Completed first slice:

- extension dogfood findings were narrowed to split API/web portal URL handling
- extension settings now support an optional browser-facing portal URL separate from the API instance URL
- `Open in portal` and `Finish capture` use the portal URL when configured
- API calls continue to use the instance URL
- plan `058` now reflects the current automatic click capture MVP baseline

Carry-forward extension candidates:

- reproduce automatic click capture in a headed/manual browser
- add popup-visible diagnostics for automatic click capture failures
- make manual screenshot fallback upload/record an event or surface an actionable error
- diagnose content-script to background-worker message delivery
- rerun guide/demo generation from extension events after capture produces events and assets

### Goal

Move the extension from a working automatic click capture MVP toward reliable real-browser capture.

### Scope

- Refresh `docs/plan/058-extension-automatic-event-capture-roadmap.md` because automatic click capture MVP now exists.
- Prioritize reliability around popup lifecycle, background state, navigation, restricted pages, upload failures, and user recovery.
- Keep raw input values and page HTML out of capture.
- Keep manual screenshot fallback.

### Candidate Work Items

- Background-owned active capture state so capture can continue when popup closes.
- Stronger content-script to background message recovery.
- Better handling for navigation immediately after clicks.
- Better unsupported-page messages.
- Domain/page exclusion controls.
- Visible capture status indicator or lightweight page overlay.
- Retry/recovery for screenshot upload or event creation failure.
- Event ordering guarantees across background restarts.
- Better selector/target metadata ranking without collecting sensitive data.

### Todos

- [x] Review extension dogfood findings.
- [x] Update plan `058` with current baseline and next milestone.
- [ ] Trace automatic capture through content script, background worker, screenshot upload, and event creation.
- [ ] Make manual screenshot fallback produce a capture event or a visible actionable error.
- [x] Fix split API/web portal URL handling for `Open in portal` and `Finish capture`.
- [ ] Decide whether background-owned capture state is the next slice.
- [ ] Decide how to persist in-flight or failed automatic captures.
- [ ] Define privacy rules for any new metadata.
- [ ] Add tests for popup closed/background capture behavior if implemented.
- [ ] Add tests for navigation and unsupported page handling.
- [ ] Add user-visible error/recovery states.
- [ ] Verify manual screenshot fallback still works.
- [x] Run extension tests and build.

### Acceptance Criteria

- Extension reliability plan reflects current automatic click MVP.
- The selected reliability slice improves a dogfood-proven failure mode.
- Raw input values and HTML remain uncaptured.
- Manual fallback remains available.
- Extension tests cover new message/state behavior.

## Phase 8: Self-Host Production Hardening V2

Suggested child plan:

```text
docs/plan/077-self-host-production-hardening-v2.md
```

### Goal

Make self-hosted operation safer and easier after the alpha product path is proven.

### Scope

- Strengthen operator workflows without pretending the project is fully production-ready.
- Keep local file storage as current provider unless a separate object-storage plan is approved.
- Improve cleanup, backup/restore rehearsal, deployment packaging, and rate-limit strategy.

### Candidate Work Items

- Storage retention and cleanup policy.
- Admin/operator command for identifying unreferenced files.
- Backup/restore rehearsal checklist with expected verification.
- Better local storage permissions docs.
- Docker image or Compose app packaging beyond PostgreSQL-only compose.
- Shared rate-limit state plan for multi-instance deployments.
- Dependency audit process with documented accepted risks.
- Health/readiness deployment examples.
- Production env validation report on startup.

### Todos

- [ ] Review `docs/operations.md`.
- [ ] Review `docs/production-readiness-checklist.md`.
- [ ] Identify which operational risks block real internal usage.
- [ ] Decide whether to implement cleanup tooling or only document manual cleanup first.
- [ ] Add storage reference inventory queries if cleanup tooling is selected.
- [ ] Add backup/restore rehearsal instructions and verification steps.
- [ ] Decide Docker/Compose packaging scope.
- [ ] Decide in-memory rate-limit replacement strategy.
- [ ] Add tests for any operator command that touches storage or DB state.
- [ ] Update operations, self-hosting, and production readiness docs.

### Acceptance Criteria

- Operators have a clearer path to run, back up, restore, and upgrade a self-hosted instance.
- Storage cleanup expectations are explicit.
- Multi-instance rate limiting remains clearly marked as unresolved unless implemented.
- Any destructive cleanup tooling is conservative and tested.
- Docs do not overstate production readiness.

## Cross-Phase Guardrails

### Privacy

- Never commit customer screenshots, private URLs, cookies, bearer tokens, invite tokens, or local storage files.
- Use safe synthetic screenshots for docs and dogfood.
- Raw typed input values must remain redacted.
- Public snapshots must not expose storage keys or private metadata.

### Architecture

- Capture sessions, capture events, and capture assets are source material.
- Guides and interactive demos are authored outputs.
- Publish links resolve immutable snapshots.
- Keep guide annotations separate from demo hotspots.
- Keep HTML replay deferred.
- Avoid new shared packages until there is real cross-app reuse.

### Verification

Use the narrowest relevant checks while developing, then broaden before closing a phase:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

DB-backed checks require the configured PostgreSQL testing database.

## Completion Tracking

| Phase | Status | Result Link |
| --- | --- | --- |
| 1. Verification And Docs Sync | Completed | `docs/plan/070-verification-and-docs-sync.md` |
| 2. Manual Portal Dogfood | Completed with limitations | `docs/plan/071-manual-portal-dogfood.md` |
| 3. Manual Extension Dogfood | Completed with blocking failures | `docs/plan/072-manual-extension-dogfood.md` |
| 4. Alpha Visual Evidence | Completed with portal-only visual evidence | `docs/plan/073-alpha-product-screenshots.md` |
| 5. Guide Editor V1 Hardening | Completed with follow-up notes | `docs/plan/074-guide-editor-v1-hardening.md` |
| 6. Interactive Demo V1 Hardening | Completed with follow-up notes | `docs/plan/075-interactive-demo-v1-hardening.md` |
| 7. Extension Capture Reliability V2 | In progress; first slice completed | `docs/plan/076-extension-capture-reliability-v2.md` |
| 8. Self-Host Production Hardening V2 | Planned | TBD |
