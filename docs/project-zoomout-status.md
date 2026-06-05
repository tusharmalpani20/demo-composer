# Project Zoom-Out Status

Date: 2026-06-06

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
  - publish links as immutable snapshots later
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
- Plans `001` through `021` exist and have been implemented through the project list portal home.

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
- Public instance/setup modules exist for deployment-aware first-run setup.
- Authentication module supports cookie-backed login, current session lookup, and logout.
- Project module supports create, list, get, update, and soft delete/archive behavior.
- Capture session module supports create, list, get, detail read model, update, complete/finalize, and delete/archive behavior.
- Capture asset module supports metadata creation, multipart screenshot upload to local storage, list, get metadata, read file bytes, and delete/archive behavior.
- Capture event module supports create, list, get, and delete/archive behavior, with raw input-value protection.
- Guide module supports creating a guide from a capture session, listing guides, reading guide detail, updating guide metadata, updating guide steps, reordering guide blocks, and deleting guide blocks.
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
  - asset URL resolution
- Shared portal topbar supports sign out.
- Login defaults to `/projects`.
- Project list/home page shows accessible projects and opens project workspaces.
- Project workspace links to capture sessions and guides.
- Capture session list page shows project capture sessions.
- Capture session detail page shows source capture detail and supports creating a guide from that capture.
- Guide list page shows project guides.
- Guide editor page supports editing guide title/description/status, updating step title/body, reordering blocks, and deleting blocks.
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

- Guide editor does not yet insert non-step blocks from the UI.
- Guide editor does not yet attach/change screenshots per step.
- Guide annotations/highlights are not implemented.
- Guide preview/published reader is not implemented.
- Guide export is not implemented.
- Guide publish links are not implemented.

### Interactive Demo Product

- Interactive demo tables, APIs, portal editor, viewer, publish links, scenes, hotspots, and transitions are not implemented yet.

### Publishing And Viewing

- No publish-link domain implementation yet.
- No immutable published snapshots yet.
- No public guide/demo viewer yet.
- No embed flow.
- No access rules, passwords, expiry, or viewer sessions.

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

The current backend, portal, and extension can now create the first real browser-sourced capture asset: a visible-tab screenshot uploaded into an active capture session.

The next major milestone should make those screenshots useful as ordered source material instead of isolated assets. The next slice should add extension capture event recording:

- record a step/event around each manual screenshot capture
- link the event to the uploaded screenshot asset
- keep raw input values out of captured metadata
- preserve enough target/page metadata for guide generation
- render the resulting event/asset relationship in the capture session detail read model

After that, the following slices can add:

- stop/finalize capture session from the extension
- redirect to the portal capture session detail after capture
- guide generation improvements that use screenshot-backed events as ordered steps
