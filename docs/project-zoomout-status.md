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

Manual portal dogfood smoke completed with non-blocking limitations on 2026-06-22 and is recorded in `docs/v1-dogfood-smoke-suite.md`. Chrome extension dogfood smoke ran on 2026-06-22 and is currently blocked by capture failures.

## Built So Far

### Documentation And Decisions

- Product concept in `docs/product-idea.md`.
- System writing pattern in `docs/system-design-pattern.md`.
- Grill sessions in `docs/grill/`.
- ADRs for major design decisions in `docs/adr/`.
- Development, self-hosting, operations, production readiness, route inventory, roadmap, contributor guide, OSS summary, and smoke suite docs.
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
- Automatic click capture MVP that records screenshot-backed click events.
- Manual screenshot fallback.
- Pause/resume and finish behavior.
- Finish-to-portal flow that opens the completed capture session.
- Focused popup/content/background tests.

## Known Gaps

- Manual portal dogfood found non-blocking guide editor and local dev URL friction that should feed the next hardening phases.
- Manual Chrome extension dogfood smoke is blocked by automatic capture and manual fallback failures.
- No real product screenshots are committed yet.
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

1. Fix or bound the extension capture failures from manual dogfood.
2. Feed the manual portal dogfood findings into guide/editor hardening.
3. Add real alpha screenshots after dogfooding has trustworthy capture screens.
4. Continue usability hardening for guide editing, interactive demo editing, and extension capture reliability.
5. Keep public docs synchronized with recorded smoke evidence.
