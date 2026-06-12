# Project Zoom-Out Status

Date: 2026-06-12

## Product Intent

Demo Composer is being built as an open-source product for capturing real browser workflows and turning them into polished walkthrough artifacts.

The product has two intended output families:

- Scribe-style guides/docs: vertical process documentation made from ordered steps, screenshots, instructions, tips, alerts, headers, captures, and other guide blocks.
- Storylane-style interactive demos: screen-by-screen walkthroughs made from scenes, screenshots or HTML captures, hotspots, overlays, navigation, and publishable demo links.

The agreed product direction is:

- Start with internal documentation workflows.
- Build screenshot-first capture before HTML replay.
- Use Chrome extension capture first; desktop capture can come later.
- Keep capture sessions as reusable source material.
- Keep guide artifacts and interactive demo artifacts separate.
- Defer AI from the day-one MVP.
- Defer analytics-heavy sales features until the internal guide flow is solid.

## Architecture Intent

The agreed implementation style is:

- Monorepo with separate `apps/server` and `apps/web`.
- Fastify REST backend.
- Cookie-backed portal authentication.
- DB migrations as the source of truth.
- TDD for feature slices.
- Domain-oriented modules with routes, services, repositories, and focused tests.
- Lightweight custom portal routing in `apps/web` for now; no React Router yet.
- Web portal first, then Chrome extension.

## Built So Far

### Documentation And Decisions

- Product concept captured in `docs/product-idea.md`.
- System writing pattern captured in `docs/system-design-pattern.md`.
- Grill sessions recorded in `docs/grill/`.
- ADRs recorded for the major design decisions:
  - single product context with domain packages
  - capture sessions as source material
  - immutable capture source records
  - guide blocks with first-class steps
  - interactive demos as scenes/hotspots/transitions
  - publish links resolving to immutable snapshots
  - rebuild foundation domains
  - file domain owns storage metadata
  - screenshot capture first, HTML replay deferred
  - extension instance-first login
  - privacy-preserving capture defaults
  - AI deferred
  - REST/Fastify/Zod API style
  - user/organization/org-user identity model
  - deployment-aware onboarding
  - web first-run setup
  - separate web and server apps
- Plans `001` through `039` exist and have been implemented through guide screenshot annotation highlights.

### Backend Foundation

- Fastify app wired under `/api/v1`.
- CORS, cookies, multipart upload, Swagger/Scalar setup, and shared error handling are present.
- Database migrations currently cover:
  - users
  - organizations
  - org users
  - auth sessions
  - projects
  - capture sessions
  - file metadata
  - capture assets
  - capture events
  - guides
  - guide blocks
  - guide steps
  - published artifacts
  - publish links
- Public instance/setup modules exist for deployment-aware first-run setup.
- Authentication module supports cookie-backed login, current session lookup, and logout.
- Project module supports create, list, get, update, and soft delete/archive behavior.
- Capture session module supports create, list, get, detail read model, update, complete/finalize, and delete/archive behavior.
- Capture asset module supports metadata creation, multipart screenshot upload to local storage, guide-editor screenshot upload reuse, list, get metadata, read file bytes, and delete/archive behavior.
- Capture event module supports create, list, get, and delete/archive behavior, with raw input-value protection.
- Guide module supports creating a guide from a capture session, listing guides, reading guide detail with safe effective screenshot asset display data, updating guide metadata, updating guide steps, inserting/editing basic guide blocks, changing/removing step screenshots, preparing direct guide-step screenshot uploads, reordering guide blocks, and deleting guide blocks.
- Guide generation uses ordered capture events as source material and creates better deterministic steps for screenshot-backed `capture` events.
- Publish module supports authenticated guide publish/republish, immutable guide snapshot creation using selected or hidden step screenshot state, stable active public slugs, publish status reads, revoke/unpublish, public publish-link resolution, and public asset file streaming constrained to assets referenced by the active snapshot.
- Server has unit, route, app integration, and DB integration coverage across the implemented modules.

### Web Portal

- Portal routes currently implemented:
  - `/login`
  - `/` as project list home
  - `/projects`
  - `/projects/:project_id`
  - `/projects/:project_id/capture-sessions`
  - `/projects/:project_id/capture-sessions/:capture_session_id`
  - `/projects/:project_id/guides`
  - `/projects/:project_id/guides/:guide_id`
  - `/projects/:project_id/guides/:guide_id/preview`
- API client helpers currently cover:
  - current auth
  - login
  - logout
  - project list/detail
  - capture session list/detail
  - guide list/detail
  - create guide from capture
  - update guide
  - update guide step
  - reorder guide blocks
  - delete guide block
  - authenticated guide publish status
  - authenticated guide publish/republish
  - authenticated guide publish-link revoke
  - public publish-link resolution
  - asset URL resolution
- Shared portal topbar supports sign out.
- Login defaults to `/projects`.
- Project list/home page shows accessible projects and opens project workspaces.
- Project workspace links to capture sessions and guides.
- Capture session list page shows project capture sessions.
- Capture session detail page shows source capture detail and supports creating a guide from that capture.
- Guide list page shows project guides with per-guide publish status, isolated status-load failures, and direct public-link open actions for active published guides.
- Guide editor page supports editing guide title/description/status, updating step title/body, inserting step/header/paragraph/tip/alert/divider blocks, editing basic text content on header/paragraph/tip/alert blocks, attaching/changing/removing step screenshots from project screenshots, uploading a brand-new replacement screenshot directly from a step, adding/removing rectangle highlights on step screenshots, reordering blocks, deleting blocks, rendering effective screenshots inline, and opening editor screenshots in the focused screenshot viewer.
- Guide editor page supports publishing, republishing, opening, copying, and revoking public guide links from an authenticated portal publishing panel, including clearer busy states, copy fallback messaging, and stale-draft cues when a published guide has unpublished draft changes.
- Guide preview page renders a private Scribe-style read-only guide with ordered steps, supported header/paragraph/tip/alert/divider blocks, effective selected screenshots, screenshot highlight overlays, and a focused screenshot viewer with zoom and previous/next navigation.
- Public guide reader route `/p/:slug` resolves active published guide snapshots without portal authentication, renders ordered published steps, supported header/paragraph/tip/alert/divider blocks, snapshotted selected screenshots, and snapshotted screenshot highlight overlays, handles missing/revoked/malformed links, and reuses the focused screenshot viewer.
- Web has focused page, route, API, and app tests for the implemented screens.

## Not Built Yet

### Chrome Extension

- `apps/extension` exists as a Vite/React Chrome extension popup.
- Extension can configure a hosted or self-hosted instance URL.
- Extension can sign in using the backend login route and store the returned extension bearer token locally.
- Extension can verify current auth, list accessible projects, and persist the selected project.
- Extension can create a backend capture session for the selected project with safe active-tab metadata.
- Extension can restore active capture state when the popup is reopened.
- Extension can capture the visible active tab as a PNG screenshot and upload it to the active capture session as a capture asset.
- Extension can record a linked `capture` event after each successful screenshot upload.
- Extension persists the local active capture event index so manual screenshots become ordered source material.
- Extension can finish the active capture session, clear local active capture state, and open the portal capture session detail page.
- Extension can show screenshot upload loading, success, and error states without clearing the active capture state.
- Extension can discard local active capture state if needed.

### Portal Creation Flows

- No project creation UI.
- No capture session creation UI in the portal.
- No upload UI in the portal.
- No manual capture event creation UI.
- No project settings/edit/archive UI.
- No organization/user/member invitation UI.

### Guide Product Depth

- Guide editor does not yet support capture/GIF blocks from the UI.
- Guide export is not implemented.
- Advanced guide sharing settings are not implemented yet.

### Interactive Demo Product

- Interactive demo tables, APIs, portal editor, viewer, publish links, scenes, hotspots, and transitions are not implemented yet.

### Publishing And Viewing

- No public interactive demo viewer yet.
- No embed flow.
- No advanced access rules, passwords, expiry, or viewer sessions.

### Analytics And Sales Layer

- No analytics.
- No lead capture.
- No sales demo tracking.
- No branding controls.

### AI

- AI remains intentionally deferred.
- No BYO-key AI layer exists yet.
- No agent workflow exists yet.

## Recommended Next Direction

The current backend, portal, extension, and public web reader can now complete the first shareable capture-to-guide loop: start an extension capture session, upload visible-tab screenshots, record ordered screenshot-backed `capture` events, finish the capture session, open the portal capture detail page, generate an editable draft guide with screenshot-backed capture steps, edit those steps while seeing their effective screenshots, attach/change/remove step screenshots from project screenshots, upload a brand-new replacement screenshot directly from the editor, add rectangle highlights to clarify important screenshot regions, review that draft in a private read-only guide preview, inspect screenshots in a focused viewer, publish or republish that guide from the portal as an immutable backend snapshot behind a stable public link, see guide-list publish status, copy/open the public URL, revoke the active link, and open that public `/p/:slug` guide outside portal authentication.

The next major milestone should continue guide delivery depth with export/share polish, access modes, or embed support, then move toward analytics and the interactive demo product.
