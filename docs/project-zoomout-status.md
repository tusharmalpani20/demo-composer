# Project Zoom-Out Status

Date: 2026-06-22

## Product Intent

Demo Composer is an open-source product for capturing browser workflows and turning them into polished walkthrough artifacts.

The product has two output families:

- Scribe-style guides/docs: vertical process documentation with ordered steps, screenshots, instructions, tips, alerts, headers, paragraphs, dividers, and screenshot annotations.
- Storylane-style interactive demos: screen-by-screen walkthroughs with scenes, screenshots, hotspots, publishable links, and embeddable public viewers.

The current direction remains:

- internal documentation and enablement first
- screenshot-first capture before HTML replay
- Chrome extension capture before desktop capture
- capture sessions as reusable source material
- guides and interactive demos as separate authored outputs
- AI deferred from the day-one product path
- analytics and sales-heavy features deferred

## Current Alpha Status

Demo Composer can now complete the first usable alpha workflow:

```text
self-hosted first-run setup
  -> project
  -> capture session
  -> screenshots and capture events
  -> guide and interactive demo
  -> publishable public/restricted links
  -> teammate invite
```

The automated DB-backed smoke test for that workflow lives in `apps/server/src/smoke/v1-workflows.db.integration.test.ts` and runs with:

```bash
rtk pnpm --filter server test:smoke
```

Manual portal dogfood smoke completed with non-blocking limitations on 2026-06-22 and is recorded in `docs/v1-dogfood-smoke-suite.md`. Portal alpha screenshots from safe synthetic data are committed under `docs/assets/alpha/` and linked from `README.md`. Public guide/demo screenshots and the extension setup popup screenshot were refreshed on 2026-06-30 during the modern UI browser QA pass. Plan 101 browser validation on 2026-07-07 proved screenshot-backed automatic capture and direct extension-page manual capture can create server assets/events; true toolbar-popup manual validation and captured-workflow extension screenshots remain pending.

## Built So Far

### Documentation And Decisions

- Product concept in `docs/product-idea.md`.
- System writing pattern in `docs/system-design-pattern.md`.
- Grill sessions in `docs/grill/`.
- ADRs for major design decisions in `docs/adr/`.
- Compact `apps/docs` alpha docs hub plus development, self-hosting, operations, production readiness, route inventory, roadmap, contributor guide, OSS summary, and smoke suite docs.
- AGPL-3.0-only license, security policy, contribution guide, CI workflow, PR template, and GitHub issue templates.

### Backend

- Fastify REST API under `/api/v1`.
- PostgreSQL migrations as the source of truth.
- Cookie-backed auth sessions.
- Deployment-aware public instance status and first-run setup.
- Organization users, members, invites, invite lookup, and invite acceptance.
- Projects with create/list/get/update/archive behavior.
- Capture sessions with create/list/get/detail/update/finalize/archive behavior.
- Capture assets with metadata creation, local multipart screenshot upload, file streaming, and archive behavior.
- Capture events with create/list/get/edit/reorder/archive behavior and raw input-value protection.
- Guide creation from capture sessions, guide editing, guide blocks, guide steps, screenshot selection, direct step screenshot upload, annotations, Markdown export, HTML ZIP export, and guide detail read models.
- Interactive demo creation from capture sessions, demo metadata, scenes, ordering, hotspots, and archive behavior.
- Publishing for guides and interactive demos through immutable snapshots, stable slugs, public/restricted access, expiry, password protection, viewer sessions, embeds, and asset streaming constrained to referenced published assets.
- Health and readiness endpoints.
- Production config hardening around CORS, cookie secrets, body/upload limits, and sensitive route rate limits.
- Unit, route, app integration, DB integration, and v1 smoke coverage.

### Web Portal

- First-run setup page.
- Login and logout.
- Project list/home, project workspaces, and project settings/archive controls.
- Organization members and invite acceptance screens.
- Capture session list and detail screens.
- Manual screenshot upload, bulk upload status, event creation, event ordering, and safe event editing.
- Guide list, guide editor, guide preview, screenshot viewer, screenshot selection, direct screenshot upload, rectangle annotations, block insertion/editing/reorder/delete, Markdown export, HTML ZIP export, publish controls, password controls, embed-copy controls, and public-link status labels.
- Public guide reader and guide embed route.
- Interactive demo list, interactive demo editor, scene management, hotspot management, publish controls, password controls, public demo viewer, and demo embed route.
- Focused page, route, API, and app tests.

### Chrome Extension

- Vite/React extension popup.
- Instance URL configuration for hosted or self-hosted API origin.
- Login and local session persistence.
- Current auth verification.
- Project listing and selected project persistence.
- Capture session creation with active-tab metadata.
- Active capture restoration.
- Visible-tab screenshot upload.
- Automatic click capture MVP exists in code/tests and produced a screenshot-backed `click` event in plan 101 browser validation on 2026-07-07.
- Manual screenshot fallback exists in code/tests and produced a screenshot-backed `capture` event from direct extension-page automation in plan 101 browser validation on 2026-07-07; true toolbar-popup manual validation remains pending.
- Pause/resume and finish behavior; finish completed the backend session in dogfood.
- Finish-to-portal flow exists; plan 100 validated the configured portal origin in the tested split API/web path, with plan 102 owning formal closeout.
- Focused popup/content/background tests.

## Known Gaps

- Manual portal dogfood found non-blocking guide editor and local dev URL friction that should feed the next hardening phases.
- Chrome extension dogfood is no longer blocked at upload/event creation for the validated automatic click path; true toolbar-popup manual validation and final captured-workflow screenshots are still pending.
- Captured-workflow extension screenshots are pending until the final extension evidence pass records the full workflow from a validated browser path.
- HTML capture/replay is deferred.
- AI/BYO-key authoring is deferred.
- Analytics, lead capture, sales tracking, and custom branding are deferred.
- Chrome Web Store packaging is not done.
- One-command production deployment packaging is deferred.
- Local file storage is the only storage provider.
- Automated retention cleanup is not built.
- Rate limiting is in-memory and should be replaced before multi-instance production deployments.
- Advanced editor/demo polish remains a V1 hardening area.

## Recommended Next Direction

The next phase should finish public alpha readiness:

1. Finish the remaining extension validation follow-ups: split-origin portal closeout, true toolbar-popup manual capture evidence, and final captured-workflow screenshots.
2. Feed the manual portal dogfood findings into guide/editor hardening.
3. Keep alpha screenshots refreshed as portal/editor hardening changes the UI.
4. Continue usability hardening for guide editing, interactive demo editing, and extension capture reliability.
5. Keep public docs synchronized with recorded smoke evidence.
