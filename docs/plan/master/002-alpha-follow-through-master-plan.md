# Alpha Follow-Through Master Plan

Date: 2026-06-23

Status: Active master plan.

Master plan number: 002.

## Relationship To Prior Master Plan

This master plan follows:

```text
docs/plan/master/001-alpha-hardening-master-plan.md
```

Master plan `001` is completed with follow-up notes. This plan should not reopen those phases. It turns the closeout leftovers from `001` into a new eight-phase queue.

## Purpose

This master plan moves the project from alpha hardening into alpha follow-through.

The previous master plan made verification truthful, gathered portal and extension dogfood evidence, added portal screenshots, hardened selected guide/demo/editor paths, fixed one extension split-origin slice, and improved self-host startup validation. The remaining work is now concentrated around split-origin browser URLs, extension capture reliability, authoring polish, operational tooling, and docs-site readiness.

Current priority:

```text
turn the alpha from "proved in narrow slices" into "repeatable for internal self-host usage"
```

## Source Inputs

Future child-plan authors should read:

- `docs/plan/master/001-alpha-hardening-master-plan.md`
- `docs/plan/071-manual-portal-dogfood.md`
- `docs/plan/072-manual-extension-dogfood.md`
- `docs/plan/073-alpha-product-screenshots.md`
- `docs/plan/074-guide-editor-v1-hardening.md`
- `docs/plan/075-interactive-demo-v1-hardening.md`
- `docs/plan/076-extension-capture-reliability-v2.md`
- `docs/plan/077-self-host-production-hardening-v2.md`
- `docs/v1-dogfood-smoke-suite.md`
- `README.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`
- `docs/backend-route-inventory.md`
- `docs/operations.md`
- `docs/production-readiness-checklist.md`
- `apps/extension/README.md`
- relevant implementation files for the selected phase

## Current Standing Snapshot

At the start of this master plan:

- Master plan `001` is complete, with follow-up notes.
- Portal dogfood passed the main self-host workflow with non-blocking limitations.
- Extension dogfood is still blocked for usable real-browser capture evidence.
- Extension split API/web portal links have a code-tested settings slice, but still need manual unpacked-extension verification.
- Portal screenshots exist; extension screenshots are still pending.
- Production startup validation is stronger, but self-host operations still lack cleanup tooling, packaging, object storage, shared rate limiting, and a recorded backup/restore rehearsal.
- `apps/docs` remains starter content.

## Planning Rules

- Expand one phase at a time into the next numbered child plan under `docs/plan/`.
- Keep child plans narrow enough for small logical commits.
- Start implementation plans with a code/docs audit.
- Preserve alpha honesty; do not claim production readiness unless the workflow has been run and recorded.
- Do not mix extension reliability, portal editor polish, and self-host operations in one implementation slice.
- Use safe synthetic data for dogfood, screenshots, and docs.
- Record anything deferred in the child plan and update this master plan when a phase is completed.

## Phase Overview

| Phase | Name | Primary Outcome |
| --- | --- | --- |
| 1 | Split-Origin URL Hardening | Browser-facing links work in split API/web deployments. |
| 2 | Extension Automatic Capture Reliability V3 | Automatic click capture is diagnosed and made reliable enough for real browser dogfood, or bounded with clear diagnostics. |
| 3 | Extension Manual Fallback And Diagnostics | Manual screenshot fallback visibly succeeds or fails with actionable messages. |
| 4 | Extension Evidence And Artifact Re-Dogfood | Extension-created events can drive guide/demo generation, and extension visual evidence is added only if proven. |
| 5 | Portal Interaction Accessibility Pass | Pointer-click and keyboard activation behavior is verified and fixed where product bugs exist. |
| 6 | Authoring Polish V2 | Remaining guide editor and demo editor friction is reduced in focused slices. |
| 7 | Self-Host Ops Tooling V3 | Operators get concrete maintenance tooling or tightly bounded operational plans. |
| 8 | Docs Site V1 | `apps/docs` becomes a real docs surface or is explicitly removed from the active product surface. |

## Closeout Leftover Coverage

| Master Plan 001 Leftover | Covered Here |
| --- | --- |
| Split API/web invite URL construction | Phase 1 |
| Extension automatic capture reliability | Phase 2 |
| Extension manual screenshot fallback diagnostics/upload behavior | Phase 3 |
| Extension visual evidence | Phase 4 |
| Portal pointer-click/accessibility investigation | Phase 5 |
| Remaining guide editor polish | Phase 6 |
| Remaining demo editor/viewer polish | Phase 6 |
| Self-host storage cleanup, packaging, shared rate limiting, object storage, env reporting, backup/restore rehearsal | Phase 7 |
| Real docs-site work for `apps/docs` | Phase 8 |

## Phase Dependencies

| Phase | Should Start After | Why |
| --- | --- | --- |
| 1 | Immediately | Split-origin URL bugs affect invites, extension links, and self-host confidence. |
| 2 | Phase 1 when possible | Extension links should not obscure capture diagnostics. |
| 3 | Phase 2, or in parallel if clearly separated | Manual fallback should share capture diagnostics without blocking automatic-capture investigation. |
| 4 | Phases 2 and 3 | Extension evidence should only be added after extension capture/fallback behavior is proven or explicitly bounded. |
| 5 | Immediately after a child-plan audit | Portal dogfood already produced pointer/keyboard activation evidence. |
| 6 | Phase 5 when relevant | Some authoring friction may be accessibility/event related. |
| 7 | Phase 1 when relevant | Self-host docs and tooling need correct browser-facing URL assumptions. |
| 8 | Any time after scope is agreed | Docs-site work is mostly independent but should reflect current alpha truth. |

## Phase 1: Split-Origin URL Hardening

Suggested child plan:

```text
docs/plan/078-split-origin-url-hardening.md
```

Status: completed with follow-up notes by `docs/plan/078-split-origin-url-hardening.md`.

### Progress Update

Updated on 2026-06-30 local time.

Completion result:

- server-generated organization invite URLs now use optional `DEMO_COMPOSER_PUBLIC_WEB_URL` for browser-facing portal links
- same-origin deployments keep request-host fallback behavior
- startup validation rejects malformed or path-bearing `DEMO_COMPOSER_PUBLIC_WEB_URL` values when set
- `.env-cmdrc.example`, Turbo env configuration, self-hosting docs, development setup, operations docs, and production readiness docs now describe the public web origin
- public guide/demo copy links, embed links, auth redirects, guide exports, and extension portal links were audited and left unchanged for documented reasons

Carry-forward split-origin candidates:

- manual browser verification of copied invite links in a split API/web deployment
- decide later whether `AUTH_REDIRECT_URL` should be renamed or folded into broader public-web-origin terminology
- make future server-generated browser links use `DEMO_COMPOSER_PUBLIC_WEB_URL` rather than `API_URL`
- keep `DEMO_COMPOSER_PUBLIC_WEB_URL` origin-only unless portal subpath deployments become an explicit product requirement

### Goal

Make browser-facing links and redirects correct when the API and web portal run on different origins.

### Baseline

Portal dogfood found copied invite URLs like:

```text
http://localhost/invites/<token>
```

while the web portal was running on:

```text
http://localhost:3000
```

The server invite route currently builds invite URLs from the API request protocol and hostname, which is not sufficient for split API/web deployments. Other browser-facing URL builders should be audited before changing config so the project does not grow several competing public-origin concepts.

### Scope

- Audit browser-facing URL construction for organization invites, public guide/demo copy links, embed links, auth redirects, exports that embed URLs, and extension portal links.
- Decide whether the server needs a `PUBLIC_WEB_URL` or equivalent portal-origin config.
- Preserve API `API_URL` semantics for API asset/export URLs.
- Keep API-facing URLs and browser-facing portal URLs explicitly separate in naming and docs.
- Update startup validation if a new production web-origin env var is introduced.
- Update self-hosting and production readiness docs.
- Add focused tests for same-origin and split-origin invite URL construction.
- Record any URL builder intentionally left unchanged and why.

### Non-Goals

- Email invite delivery.
- Custom domains beyond a configurable portal origin.
- Extension capture reliability beyond verifying portal link construction.

### Acceptance Criteria

- Invite links copied from the portal open the browser-facing portal route in split API/web deployments.
- Same-origin deployments keep working.
- Unsafe or malformed configured origins fail clearly.
- Docs explain API origin vs portal origin.
- Remaining browser-facing URL builders are either verified correct or explicitly listed as follow-up work.

## Phase 2: Extension Automatic Capture Reliability V3

Suggested child plan:

```text
docs/plan/079-extension-automatic-capture-reliability-v3.md
```

Status: completed with follow-up notes by `docs/plan/079-extension-automatic-capture-reliability-v3.md`.

### Progress Update

Updated on 2026-06-30 local time.

Completion result:

- extension settings now persist the latest automatic capture diagnostic
- background automatic click capture records success and failure outcomes after screenshot, upload, and event-recording attempts
- content-script message-delivery failures are recorded when the background worker cannot receive a click message
- active-capture popup shows automatic capture failures while preserving manual screenshot fallback
- split API/web portal URL behavior from plan `076` remains unchanged
- diagnostics avoid raw input values, page URLs, screenshot bytes, tokens, cookies, and page HTML
- follow-up recheck minimized diagnostics to status, optional message, optional event index, and timestamp only

Carry-forward automatic capture candidates:

- run a headed browser extension dogfood pass and record whether supported clicks now create screenshot-backed events or show a diagnostic
- collect service-worker and content-script evidence during that headed run
- verify unsupported/restricted page behavior in a real browser
- keep manual screenshot fallback diagnostics in plan `080`
- if headed dogfood still produces no diagnostic, focus the next automatic-capture slice on content-script injection permissions and service-worker lifecycle evidence

### Goal

Diagnose and improve automatic click capture in a headed/manual browser.

### Scope

- Trace content script activation, background message delivery, screenshot capture, upload, and event creation.
- Add popup-visible diagnostics for automatic capture failures.
- Inspect extension service-worker logs and content-script injection behavior during a headed/manual run.
- Keep raw input values and page HTML uncaptured.
- Add tests around any changed message/state behavior.
- Re-run a narrow headed/manual browser scenario and record results.

### Non-Goals

- Manual screenshot fallback implementation.
- Guide/demo generation from extension events.
- Extension screenshots for public docs.

### Acceptance Criteria

- The plan identifies where the previous zero-event capture failed.
- Supported clicks either create ordered screenshot-backed events or produce actionable user-visible diagnostics.
- Unsupported/restricted pages fail clearly.
- Privacy constraints remain covered by tests or explicit verification.

## Phase 3: Extension Manual Fallback And Diagnostics

Suggested child plan:

```text
docs/plan/080-extension-manual-fallback-diagnostics.md
```

Status: completed with follow-up notes by `docs/plan/080-extension-manual-fallback-diagnostics.md`.

### Progress Update

Updated on 2026-06-30 local time.

Completion result:

- manual screenshot diagnostics are now persisted separately from automatic capture diagnostics
- manual screenshot success records event index and timestamp
- screenshot capture, upload, and event-recording failures record retryable diagnostics while preserving active capture state
- manual diagnostic persistence is best-effort and does not hide the original screenshot/upload/event error
- active-capture popup shows the latest manual screenshot failure after reopening
- diagnostics avoid raw input values, page URLs, screenshot bytes, tokens, cookies, and page HTML

Carry-forward manual fallback candidates:

- run a headed browser manual screenshot fallback happy path and verify the portal capture detail
- run one practical headed-browser failure path and record the popup diagnostic
- if no manual diagnostic appears in a headed run, investigate popup lifecycle and browser screenshot permissions
- plan `081` should record the exact API origin, portal origin, extension build/version, browser, and capture session used for the run
- tie manual fallback evidence to artifact evidence by confirming the screenshot-backed capture can feed guide/demo work

### Goal

Make manual screenshot fallback reliable and observable.

### Scope

- Verify current manual fallback behavior in a browser.
- Make fallback upload and capture-event creation either succeed or fail with a clear popup error.
- Add diagnostics for upload, auth, project/session, and file-storage failures.
- Preserve local capture state recovery.
- Add focused extension tests.

### Non-Goals

- Automatic click capture reliability.
- Public extension screenshots.

### Acceptance Criteria

- Manual fallback creates a screenshot-backed capture event in the happy path, or the product explicitly documents why the fallback is unavailable.
- Failure cases show actionable messages.
- Event ordering remains stable.

## Phase 4: Extension Evidence And Artifact Re-Dogfood

Suggested child plan:

```text
docs/plan/081-extension-evidence-and-artifact-redogfood.md
```

Status: completed with follow-up notes by `docs/plan/081-extension-evidence-and-artifact-redogfood.md`.

### Progress Update

Updated on 2026-06-30 local time.

Completion result:

- a fresh headed extension evidence run loaded the unpacked extension, configured split API/portal origins, signed in, selected a synthetic project, started capture, opened the portal, finished capture, and completed the backend extension-sourced capture session
- extension split-origin portal links worked in this run: `Open in portal` and `Finish capture` opened `http://localhost:3000/...`
- automatic click capture no longer failed silently; supported safe-page clicks persisted the diagnostic `Either the '<all_urls>' or 'activeTab' permission is required.`
- direct extension-page manual fallback no longer failed silently; it persisted `Could not capture screenshot.` while preserving active capture state
- no extension events or assets were created, so guide/demo generation from extension data remains blocked
- no extension screenshots were added because they would overstate the evidence

Carry-forward extension evidence candidates:

- fix or redesign MV3 screenshot permission behavior for background automatic capture
- verify whether explicit `<all_urls>` permission, browser-action active-tab grant behavior, or a user-gesture screenshot path is the right product tradeoff
- run a true toolbar-popup manual fallback happy path after the permission model is fixed
- add a browser-run assertion that manual fallback uploads a screenshot-backed event
- add a clearer portal guard or empty state for creating artifacts from captures with zero events/assets
- keep extension visual evidence pending until extension-created screenshot-backed events can produce non-empty guide/demo artifacts

Recommended next-plan handling:

- do not fold this extension permission work into Phase 5 portal accessibility unless the user explicitly changes scope
- create a focused extension permission/manual-popup reliability plan before attempting extension visual evidence again
- include the empty-capture artifact guard either in that focused extension follow-up or the next authoring/product polish slice

### Goal

Prove extension-created capture data can produce guide/demo artifacts and add extension visual evidence only if truthful.

### Scope

- Re-run extension dogfood after Phases 2 and 3.
- Confirm at least one extension-created event and asset exists.
- Generate a guide from extension events.
- Generate an interactive demo from extension events.
- Inspect click metadata for safe usefulness.
- Add extension screenshots only if they reflect working or explicitly bounded behavior.

### Non-Goals

- Fixing automatic/manual capture bugs discovered during this run; create follow-up plans if failures are broad.
- Marketing screenshots or extension claims that imply reliability not proven by the run.

### Acceptance Criteria

- Extension dogfood has a fresh dated result.
- Guide/demo generation from extension data is either proven or explicitly blocked with cause.
- Extension screenshots, if added, use safe synthetic data and do not overstate reliability.

## Phase 5: Portal Interaction Accessibility Pass

Suggested child plan:

```text
docs/plan/082-portal-interaction-accessibility-pass.md
```

Status: completed with follow-up notes by `docs/plan/082-portal-interaction-accessibility-pass.md`.

### Progress Update

Updated on 2026-06-30 local time.

Completion result:

- audited the plan `071` pointer/keyboard activation concerns against current portal components
- confirmed the affected controls use native button/link semantics and have focused click/route coverage in existing tests
- kept extension screenshot permission/manual-popup reliability from plan `081` out of this portal accessibility phase
- folded in the portal-facing carry-forward from plan `081` by disabling guide/demo artifact creation when captures have zero events
- added accessible explanatory copy for disabled artifact actions when captures have zero events or no usable name
- verified the focused capture detail behavior plus full web test, typecheck, lint, and build
- post-completion recheck found no additional portal accessibility gaps in this slice

Carry-forward portal accessibility candidates:

- reproduce pointer-vs-keyboard automation issues in a headed browser only if they reappear in manual QA
- keep deeper guide/demo authoring workflow polish in Phase 6
- keep extension capture permission work in a separate extension reliability plan

### Goal

Determine whether pointer-click vs keyboard activation issues from dogfood automation are product bugs, test-tool limitations, or accessibility gaps.

### Scope

- Review controls called out by portal dogfood: setup submit, settings save/archive, event edit, preview link, and workspace/settings navigation.
- Add focused tests for accessible names, button/link semantics, pointer activation, and keyboard activation where practical.
- Fix real product issues without redesigning the portal.
- Document any automation-only limitations.

### Non-Goals

- Broad design-system rewrite.
- Guide/demo editor feature polish unless directly tied to activation semantics.

### Acceptance Criteria

- Affected controls have clear accessible semantics.
- Pointer and keyboard activation work for product-relevant paths.
- Any remaining automation limitation is documented with evidence.

## Phase 6: Authoring Polish V2

Suggested child plan:

```text
docs/plan/083-authoring-polish-v2.md
```

### Goal

Reduce remaining guide and demo authoring friction after the first hardening slices.

### Scope

Choose one or split into multiple child plans if needed:

- guide screenshot picker clarity and upload recovery
- guide annotation affordances
- guide publish stale-state clarity
- guide export error messaging
- guide metadata and step save/error/retry behavior
- demo scene list and reorder feedback
- demo hotspot editor affordances
- demo embed and narrow viewport QA
- public demo final-scene stale-target behavior

### Non-Goals

- Extension-generated artifact quality unless Phase 4 has produced extension capture data.
- HTML replay.
- AI generation.

### Acceptance Criteria

- Selected authoring slice has focused tests.
- The UI remains consistent with the existing portal design.
- Public snapshots remain safe and immutable.

## Phase 7: Self-Host Ops Tooling V3

Suggested child plan:

```text
docs/plan/084-self-host-ops-tooling-v3.md
```

### Goal

Move self-host operations beyond documentation-only guidance where a conservative tool is justified.

### Scope

Choose a focused slice:

- storage reference inventory and dry-run cleanup reporting
- production env report that summarizes validated settings without secrets
- real backup/restore rehearsal against a disposable environment
- Docker image or one-command packaging plan/prototype
- shared rate-limit backend plan or implementation
- object storage provider plan or implementation
- dependency audit process and accepted-risk recording

### Guardrails

- Cleanup tooling must default to dry-run.
- Destructive actions need explicit confirmation and tests.
- Do not introduce object storage or Redis/Postgres rate limiting casually; use a focused child plan.
- Do not combine cleanup tooling, packaging, object storage, and shared rate limiting into one child implementation.

### Acceptance Criteria

- Operators get either a tested tool or a precise implementation plan for the selected operational risk.
- Docs stay alpha-honest.
- Backup, storage, and rate-limit limitations remain explicit unless implemented.

## Phase 8: Docs Site V1

Suggested child plan:

```text
docs/plan/085-docs-site-v1.md
```

### Goal

Resolve the `apps/docs` starter-content gap.

### Scope

Decide whether to:

- turn `apps/docs` into a real docs/product site
- keep it parked but make that status explicit everywhere
- remove it from active app positioning

If building the docs site:

- start with alpha overview, self-hosting, operations, screenshots, roadmap, and contribution links
- do not duplicate every markdown doc manually
- keep public claims aligned with current alpha limitations

### Non-Goals

- Marketing site for hosted SaaS.
- Full documentation IA rewrite unless separately planned.

### Acceptance Criteria

- `apps/docs` no longer looks accidentally unfinished to contributors.
- README and status docs point to the correct docs surface.
- Alpha limitations remain visible.

## Cross-Phase Guardrails

### Privacy

- Do not commit customer screenshots, private URLs, cookies, bearer tokens, invite tokens, local storage files, or extension storage dumps.
- Use safe synthetic projects and screenshots for all dogfood and visual evidence.
- Raw typed input values and page HTML must remain uncaptured.

### Architecture

- Keep capture sessions/events/assets as source material.
- Keep guides and interactive demos as authored outputs.
- Keep guide annotations separate from demo hotspots.
- Keep publish links backed by immutable snapshots.
- Keep HTML replay deferred.
- Avoid new shared packages until there is real cross-app reuse.

### Verification

Use the narrowest checks while developing, then broaden before closing a child plan:

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
| 1. Split-Origin URL Hardening | Completed with follow-up notes | `docs/plan/078-split-origin-url-hardening.md` |
| 2. Extension Automatic Capture Reliability V3 | Completed with follow-up notes | `docs/plan/079-extension-automatic-capture-reliability-v3.md` |
| 3. Extension Manual Fallback And Diagnostics | Completed with follow-up notes | `docs/plan/080-extension-manual-fallback-diagnostics.md` |
| 4. Extension Evidence And Artifact Re-Dogfood | Completed with follow-up notes | `docs/plan/081-extension-evidence-and-artifact-redogfood.md` |
| 5. Portal Interaction Accessibility Pass | Completed with follow-up notes | `docs/plan/082-portal-interaction-accessibility-pass.md` |
| 6. Authoring Polish V2 | Planned | TBD |
| 7. Self-Host Ops Tooling V3 | Planned | TBD |
| 8. Docs Site V1 | Planned | TBD |
