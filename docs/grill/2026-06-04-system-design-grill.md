# System Design Grill Session

Date: 2026-06-04

## Scope

This grill session stress-tests the proposed Demo Composer v2 rebuild before implementation.

Starting documents:

- `docs/product-idea.md`
- `docs/system-design-pattern.md`

Working assumptions at session start:

- Demo Composer v2 can be mostly rebuilt from scratch.
- ORCA is the engineering-pattern reference, not a product-domain reference.
- The first product target is internal documentation.
- Chrome extension capture comes before desktop capture.
- Capture source data is reusable.
- Guide artifacts and interactive demo artifacts are separate.
- ADRs will be created only for hard-to-reverse, non-obvious tradeoff decisions.

## Questions

### Q1. Is Demo Composer one bounded context or multiple bounded contexts?

Recommended answer:

Start as one product context with separate domain packages, not multiple bounded contexts.

Reasoning:

- The product language is still young.
- Capture, guide, demo, project, and publishing are tightly related in the first version.
- A single root `CONTEXT.md` keeps terminology consistent while the domain stabilizes.
- Domain packages still provide implementation boundaries without prematurely declaring separate business contexts.

Risk:

- If publishing, analytics, or capture processing later becomes independently complex, we may split context docs later.

Status:

Accepted. Demo Composer v2 starts as one product context with separate domain packages.

Decision records:

- `CONTEXT.md`
- `docs/adr/0001-single-product-context-with-domain-packages.md`

### Q2. Must every capture, guide, and interactive demo belong to a project?

Recommended answer:

Yes. Every capture, guide, and interactive demo should belong to exactly one project from the start.

Reasoning:

- Projects give users a clear workspace for grouping related product workflows.
- Capture reuse needs a boundary; project is the simplest useful boundary.
- Publishing, permissions, branding, and analytics will eventually need a parent scope.
- Ad-hoc captures sound convenient, but they usually become orphaned assets that are hard to find, authorize, and clean up.

Suggested product behavior:

- If a user starts capture without selecting a project, create or ask for a project first.
- We can later add a lightweight "Inbox" project per organization if quick capture becomes important.

Risk:

- Requiring a project before capture adds one step to the Chrome extension flow.
- This can be softened with a default project, but the database model should still require `project_id`.

Status:

Accepted. Every capture, guide, and interactive demo belongs to exactly one project.

### Q3. Is a capture session a final artifact or source material only?

Recommended answer:

A capture session is source material only. It should never be the final guide or interactive demo.

Reasoning:

- The same capture session may produce multiple guides and demos.
- Capture events are raw observations; guide steps and demo scenes are edited product artifacts.
- Chrome extension capture should stay fast and low-friction.
- Guide/demo editors need freedom to reorder, delete, merge, rewrite, and annotate without mutating the source history.

Suggested model:

```text
capture_session
  capture_event
  capture_asset

guide
  guide_block / guide_step / guide_annotation

interactive_demo
  demo_scene / demo_hotspot / demo_transition
```

Rule:

- Guide and demo artifacts may reference capture assets/events.
- Editing a guide or demo should not mutate the original capture session.

Risk:

- This adds one extra conversion step from capture to artifact.
- The benefit is a clean separation between raw source and composed output.

Status:

Accepted. Capture sessions are source material only and are not final artifacts.

Decision records:

- `docs/adr/0002-capture-sessions-are-source-material.md`

### Q4. Are capture events and capture assets immutable after capture?

Recommended answer:

Mostly yes. Treat capture events and capture assets as immutable source records after they are created.

Allowed post-capture changes:

- soft delete / archive
- attach processing metadata
- add derived assets such as thumbnails
- redact sensitive regions by creating a new derived/redacted asset
- mark asset processing status

Not allowed:

- overwrite the original screenshot bytes
- rewrite the original HTML snapshot
- mutate the raw event target metadata as if it were the original capture
- edit raw source events when a guide/demo step changes

Reasoning:

- Source immutability protects reuse across multiple guides and demos.
- Redaction and processing can be modeled as derived data.
- It keeps "what was captured" separate from "what was composed."

Risk:

- Storage usage grows because edited/redacted variants create new derived assets.
- The tradeoff is worth it because destructive capture edits would make reuse and debugging unreliable.

Status:

Accepted. Capture events and original capture assets are immutable source records; edits create composed records or derived assets.

Decision records:

- `docs/adr/0003-immutable-capture-source-records.md`

### Q5. Should a guide step be separate from a guide block?

Recommended answer:

Yes. A guide should be an ordered list of guide blocks, and `step` should be one block type with a first-class detail shape.

Suggested model:

```text
guide
  guide_block
    block_type = step | tip | alert | capture | header | gif | paragraph | divider
    position

guide_step
  guide_block_id
  instruction
  capture_asset_id
  target_rect
  alt_text

guide_annotation
  guide_step_id or guide_block_id
```

Reasoning:

- The screenshots show the guide editor inserts different block types between steps.
- A guide is not only numbered steps; it also has headers, tips, alerts, captures, and GIFs.
- Keeping `guide_block` as the ordered sequence makes reordering and insertion consistent.
- Keeping `guide_step` first-class avoids hiding step behavior in untyped JSON.

Tradeoff:

- Two tables are more work than a single `guide_step` table.
- The extra structure pays off once non-step blocks exist, which they clearly do in the target product.

Status:

Accepted. A guide is an ordered list of `guide_block` records, and step blocks have first-class `guide_step` details.

Decision records:

- `docs/adr/0004-guide-blocks-with-first-class-steps.md`

### Q6. Should interactive demos use scenes and hotspots instead of blocks?

Recommended answer:

Yes. Interactive demos should use `demo_scene`, `demo_hotspot`, and `demo_transition`, not guide blocks.

Suggested model:

```text
interactive_demo
  demo_scene
    capture_asset_id
    position
    title

  demo_hotspot
    demo_scene_id
    target_rect
    trigger_type
    overlay_content
    action_type

  demo_transition
    from_scene_id
    hotspot_id
    to_scene_id
```

Reasoning:

- Demo scenes are interacted with; guide blocks are read.
- A hotspot needs behavior: click target, trigger, next scene, overlay, maybe branch later.
- Reusing guide blocks would mix document layout concerns with demo navigation concerns.
- The target product will eventually need demo preview, branching, analytics, and embed behavior.

MVP simplification:

- Keep demo navigation linear by default.
- Still store transitions explicitly so later branching does not require a schema rewrite.
- A scene can have one primary next hotspot at first.

Tradeoff:

- This creates a separate model from guides, but that is the point: guide and demo artifacts have different behavior.

Status:

Accepted. Interactive demos use scenes, hotspots, and transitions instead of guide blocks.

Decision records:

- `docs/adr/0005-interactive-demos-use-scenes-hotspots-transitions.md`

### Q7. Should publish links point to mutable drafts or immutable published snapshots?

Recommended answer:

Publish links should point to immutable published snapshots, not directly to mutable draft rows.

Suggested model:

```text
guide / interactive_demo
  draft editing tables

published_artifact
  artifact_type = guide | interactive_demo
  artifact_id
  version_number
  snapshot_json
  published_at

publish_link
  published_artifact_id
  visibility
  slug/token
```

Reasoning:

- Public viewers should not see half-edited drafts.
- Internal users need confidence that a shared link stays stable.
- Republish can create a new snapshot version.
- Analytics later should attach to the published version the viewer actually saw.
- Snapshot rendering can be optimized separately from editor data.

MVP simplification:

- Support only "latest published version" per link if needed.
- Still create a snapshot row on publish.

Tradeoff:

- Publishing requires a snapshot/materialization step.
- The benefit is stable links, safer editing, and cleaner future analytics.

Status:

Accepted. Publish links resolve to immutable published snapshots rather than mutable draft rows.

Decision records:

- `docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md`

### Q8. Which domain packages should exist on day one?

Recommended answer:

Start with platform foundation domains plus four product domain packages.

Platform foundation:

```text
packages/auth-domain
packages/user-domain
packages/organization-domain
```

Product domains:

```text
packages/project-domain
packages/capture-domain
packages/guide-domain
packages/demo-domain
```

Defer `publish-domain` until the first publish endpoint is implemented, or create it only when publishing is in the active sprint.

Reasoning:

- `auth-domain` owns auth sessions and auth persistence rules.
- `user-domain` owns login-capable users and user profile behavior.
- `organization-domain` owns organization membership, organization users, roles, and organization-scoped settings.
- `project-domain` is the ownership/workspace boundary.
- `capture-domain` owns immutable source material.
- `guide-domain` owns Scribe-style document artifacts.
- `demo-domain` owns Storylane-style interactive artifacts.
- Publishing is important, but it can be added after guide/demo draft behavior exists.

Avoid on day one:

- `asset-domain`: file/asset storage can start inside capture-domain until assets become cross-cutting beyond capture.
- `analytics-domain`: deferred until external/sales use cases.
- `export-domain`: deferred until PDF/GIF/video export is real.

Tradeoff:

- Starting with seven domain packages is more structure than a single server module.
- The three platform domains are reusable foundation; the four product domains align with the core product boundaries accepted in this grill.

Status:

Accepted with refinement. Organization, user, and auth are also day-one domains, separate from product domains.

### Q9. Should auth, user, and organization be copied from current v2 or rebuilt as domain packages?

Recommended answer:

Rebuild them into domain packages, using the current v2 implementation as reference material rather than copying it directly.

Suggested package split:

```text
packages/auth-domain
  auth session persistence
  OTP verification persistence
  auth-session-init persistence if needed

packages/user-domain
  user creation
  password persistence
  profile persistence
  user assets only if still needed

packages/organization-domain
  organization creation
  organization member creation
  role/membership behavior
  current/default organization selection later
```

Server still owns:

- cookies
- JWT issuing/verification wiring
- Fastify Passport config
- request context decoration
- password hashing transport details if we choose to keep that server-side
- HTTP response mapping

Reasoning:

- The current v2 auth/org/user code works as a starting reference, but it is still server-module-centered.
- Rebuilding now avoids having product domains depend on server-local models.
- The ORCA pattern proves auth/user/org can be split cleanly into packages.

Tradeoff:

- More upfront work than keeping existing server modules.
- Cleaner long-term boundaries for web app, extension, and future desktop app.

Status:

Accepted. Current implementation will be scrapped; auth, user, and organization will be rebuilt as domain packages.

Decision records:

- `docs/adr/0007-rebuild-foundation-domains-instead-of-reusing-server-modules.md`

### Q10. Should the repo be wiped in place or rebuilt beside the current code first?

Recommended answer:

Rebuild in place, but preserve documentation and avoid deleting old code until the new skeleton is ready in the same commit/working pass.

Suggested approach:

1. Keep `docs/`, `CONTEXT.md`, and ADRs.
2. Keep root monorepo tooling if still suitable: `pnpm-workspace.yaml`, `turbo.json`, base TypeScript/ESLint packages where useful.
3. Remove or replace starter apps/packages that do not match the new architecture.
4. Scaffold new `apps/server`, `apps/web`, and later `apps/extension`.
5. Scaffold foundation packages first.
6. Add product packages after foundation shape is stable.

Reasoning:

- Keeping docs prevents losing the decisions made in this grill.
- Rebuilding in place avoids dragging old implementation assumptions forward.
- Doing the cleanup and skeleton together prevents the repo from sitting in a half-deleted state.

Risk:

- Large diff.
- We need to be deliberate about not accidentally deleting the decision docs.

Status:

Accepted. Rebuild in place while preserving docs/context/ADRs and replacing the app/package skeleton deliberately.

Decision records:

- `docs/adr/0008-rebuild-in-place-preserve-decision-docs.md`

### Q11. What baseline database row pattern should every core table use?

Recommended answer:

Use ULIDs, organization scoping where relevant, soft-delete, optimistic `version`, and audit columns consistently.

Baseline for organization-owned tables:

```sql
id ULID PRIMARY KEY DEFAULT gen_ulid()
organization_id ULID NOT NULL REFERENCES organization_schema.organization(id)

is_deleted BOOLEAN NOT NULL DEFAULT FALSE
deleted_at timestamptz DEFAULT NULL
deleted_by_id ULID DEFAULT NULL

version INTEGER NOT NULL DEFAULT 1
created_by_id ULID DEFAULT NULL
updated_by_id ULID DEFAULT NULL
created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Reasoning:

- ULIDs are already used in v1/v2 and sort naturally by creation time.
- Organization scoping is central to every product artifact.
- Soft-delete is useful for user-facing artifacts and recovery.
- Optimistic versioning protects editors from stale updates.
- Audit fields matter because captures/guides/demos are collaborative team assets.

Exceptions:

- Low-level immutable event rows may not need `updated_by_id` if they are append-only.
- Publish snapshots may be immutable and should not need normal update behavior.
- Join tables may use simpler audit fields if they are not user-visible.

Status:

Accepted. Core organization-owned tables use ULIDs, organization scoping, soft-delete, optimistic versioning, and audit columns, with explicit exceptions for immutable/event/snapshot/join rows.

### Q12. Where should screenshot and HTML capture bytes be stored first?

Recommended answer:

Use a file metadata table plus local filesystem storage adapter for MVP, designed so storage can later move to S3/R2 without schema changes.

Suggested model:

```text
file
  id
  organization_id
  storage_provider = local
  storage_key
  mime_type
  size_bytes
  original_name
  checksum

capture_asset
  id
  organization_id
  project_id
  capture_session_id
  file_id
  asset_type = screenshot | html_snapshot | thumbnail | redacted_screenshot
  width
  height
  metadata
```

Reasoning:

- Storing large bytes in Postgres is unnecessary for MVP.
- A storage adapter keeps local development simple.
- A `file` table avoids baking local paths directly into capture/domain tables.
- The same file model can later support guide GIFs, exported PDFs, thumbnails, and demo assets.

Important boundary:

- `file` owns physical storage facts.
- `capture_asset` owns product meaning.

Tradeoff:

- This introduces a `file-domain` foundation package earlier than the previous package split.
- The benefit is that product domains reference `file_id`, not raw paths or provider-specific storage details.

Status:

Accepted with refinement. File/storage metadata is a small foundation domain named `file-domain`; storage adapters are implementation details behind it.

Decision records:

- `docs/adr/0009-file-domain-owns-storage-metadata.md`

### Q13. Should HTML snapshot capture be MVP or deferred behind screenshot capture?

Recommended answer:

Make screenshot capture the MVP path. Design the schema to allow HTML snapshots, but do not build full HTML replay in the first implementation.

Reasoning:

- Screenshots are enough for the first internal guide workflow.
- Screenshot capture is easier to make reliable in a Chrome extension.
- HTML replay introduces serious complexity: CSS, fonts, external assets, iframes, auth-protected resources, scripts, sanitization, and security.
- We can still store `asset_type = html_snapshot` later without changing the artifact model.

MVP behavior:

- Capture screenshots.
- Capture element metadata and bounding boxes.
- Capture URL/title/viewport/device pixel ratio.
- Use screenshot plus target metadata for guide steps and demo scenes.

Schema allowance:

```text
capture_asset.asset_type = screenshot | html_snapshot | thumbnail | redacted_screenshot
capture_asset.metadata stores mode-specific facts
```

Deferred:

- DOM serialization.
- HTML sanitization pipeline.
- asset inlining.
- script stripping.
- replay iframe sandboxing.
- click simulation inside HTML snapshots.

Tradeoff:

- Interactive demos are less "real" at first because they are screenshot/hotspot based.
- The product becomes shippable sooner and avoids a large security/rendering project before the guide workflow is proven.

Status:

Accepted. Screenshot capture is the MVP path; HTML snapshot/replay support is schema-allowed but deferred.

Decision records:

- `docs/adr/0010-screenshot-capture-first-html-replay-deferred.md`

### Q14. How should the Chrome extension authenticate?

Recommended answer:

Use an instance-first extension login flow.

Because Demo Composer is intended to be open source/self-hostable, the extension must first know which Demo Composer server/web instance it should connect to. After the instance is configured, the user logs in or pairs the extension against that instance.

Suggested flow:

1. User installs the Chrome extension.
2. Extension asks for the Demo Composer instance URL.
3. Extension validates the instance by calling a public discovery endpoint.
4. User clicks login/connect.
5. Extension opens the configured web app login/pairing page.
6. User authenticates with that instance.
7. Backend issues an extension-scoped token/session.
8. Extension stores the instance URL and token locally.
9. Extension sends screenshots, capture events, and metadata to that configured instance.

Reasoning:

- Scribe/Storylane can assume one hosted SaaS backend; Demo Composer cannot.
- Open-source/self-hosted installs need the extension to know where the user's server is hosted.
- The instance pointer decides where screenshots and capture payloads are uploaded.
- Browser extension cookie behavior can be awkward across domains and environments.
- Extension permissions should be narrower than normal web app sessions.
- Tokens can be revoked independently from the web session.
- Capture APIs may need extension-specific rate limits and scopes.

MVP simplification:

- Token can initially be a normal JWT with an `audience = extension` or `session_type = extension`.
- Instance validation can start with a simple `GET /.well-known/demo-composer` or `GET /api/v1/public/instance` endpoint.
- Later we can add device/session management UI.

Tradeoff:

- More work than relying on browser cookies or a fixed SaaS URL.
- Cleaner security boundary for a capture tool that observes user screens.
- Supports both local development and self-hosted deployments.

Status:

Accepted. The Chrome extension uses an instance-first login flow for open-source/self-hosted deployments.

Decision records:

- `docs/adr/0011-extension-uses-instance-first-login.md`

### Q15. Should the extension require project selection before starting capture?

Recommended answer:

Yes, but make it low-friction by remembering the last project and supporting a default project inbox.

Suggested flow:

1. Extension is connected to an instance.
2. Extension loads organizations/projects available to the user.
3. User selects organization and project before capture.
4. Extension remembers the last selected organization/project per instance.
5. If no project exists, the web app or server can create a default project inbox.

Reasoning:

- We already decided every capture belongs to one project.
- Extension capture should not create ownerless assets.
- Remembering the last project keeps repeat captures fast.
- A project inbox avoids blocking first-time users.

Tradeoff:

- One more selection step before capture.
- The product gains clean ownership, retrieval, and permission boundaries.

Status:

Accepted. The extension requires organization/project context before capture, with remembered selection and optional project inbox to keep it low-friction.

### Q16. Should capture record every browser event or only meaningful workflow events?

Recommended answer:

Record meaningful workflow events, not every low-level browser event.

MVP capture event types:

```text
capture_started
page_view
click
input_change
navigation
manual_capture
capture_stopped
```

Do not record by default:

- mousemove
- scroll every pixel
- keydown for every character
- hover noise
- focus/blur noise unless it affects the workflow

Reasoning:

- Guide generation needs meaningful steps, not noisy telemetry.
- Storage stays manageable.
- Privacy risk is lower when we avoid raw keystroke logs.
- Manual capture lets users force a step when automatic capture misses context.

Special handling:

- For inputs, store a redacted/typed summary by default, not raw sensitive values.
- Capture element metadata: tag, role, label/text, selector candidates, bounding box.
- Screenshots should be captured around meaningful events, not every browser event.

Tradeoff:

- Some subtle interactions may be missed.
- Manual capture and later configurable capture rules can cover those cases.

Status:

Accepted. MVP capture records meaningful workflow events, not raw low-level telemetry.

### Q17. What should the default sensitive-data policy be during capture?

Recommended answer:

Default to privacy-preserving capture:

- Do not store raw typed input values by default.
- Redact password fields automatically.
- Redact common sensitive input types automatically: password, credit card, OTP, token, secret, API key.
- Store input event metadata such as `input_type`, `field_label`, and `value_present = true` rather than the actual value.
- Allow users to manually blur/redact screenshot regions in the editor by creating derived assets.

MVP behavior:

```text
input_change event:
  action_type = input_change
  input_kind = text | password | email | number | search | unknown
  value_policy = redacted | omitted | safe_summary
  value_length = optional
  raw_value = never by default
```

Reasoning:

- The extension observes real software screens, potentially including customer data.
- Internal documentation still should not accidentally store secrets.
- Open-source/self-hosted deployments need safe defaults.

Future option:

- Organization admins may configure capture policies later, but strict defaults should ship first.

Tradeoff:

- Some generated instructions may be less specific.
- Users can manually edit guide text after capture.

Status:

Accepted. Capture is privacy-preserving by default and does not store raw typed values unless a future explicit policy allows it.

Decision records:

- `docs/adr/0012-privacy-preserving-capture-defaults.md`

### Q18. Should finishing a capture automatically create a guide or demo?

Recommended answer:

No. Finishing a capture should create only a completed capture session. The user then explicitly chooses "Create Guide" or "Create Interactive Demo".

Reasoning:

- We already decided capture is source material only.
- The same capture can produce multiple artifacts.
- Guides and demos have different editing models.
- Explicit choice prevents creating unwanted drafts.

Suggested flow:

```text
Finish capture
  -> redirect/open project workspace in portal
  -> show capture session summary inside that project
  -> user chooses:
      Create Guide
      Create Interactive Demo
      Save for later
```

MVP convenience:

- The extension can automatically open the project workspace after capture completion.
- The project workspace can focus the newly completed capture session.
- The web editor can prompt for guide vs demo.

Tradeoff:

- One extra step after capture.
- Clearer artifact intent and less cleanup of accidental drafts.

Status:

Accepted with refinement. Finishing capture completes the capture session and redirects/opens the selected project workspace in the portal; artifact creation remains explicit.

### Q19. What should the project workspace contain in the MVP?

Recommended answer:

The project workspace should be the main operational surface for captures and artifacts.

MVP sections:

```text
Project header
  name
  description
  recent activity summary

Capture Sessions
  completed/in-progress/failed captures
  source URL
  step/event count
  created by
  captured at
  actions: Create Guide, Create Interactive Demo, View Capture

Guides
  draft/published guides
  updated at
  publish status

Interactive Demos
  draft/published demos
  updated at
  publish status
```

Reasoning:

- The project is the ownership boundary.
- After extension capture, the user needs to land somewhere useful.
- This page gives a clear path from source capture to artifact creation.
- It avoids building separate disconnected capture, guide, and demo dashboards too early.

Tradeoff:

- Project workspace does more than a simple project detail page.
- That is acceptable because project is the central workspace concept.

Status:

Accepted. The project workspace is the central MVP surface for capture sessions, guides, and interactive demos.

### Q20. Should Guide and Interactive Demo share one editor or have separate editors?

Recommended answer:

Use separate editors with a small shared capture-picker/asset-preview layer.

Recommended split:

```text
Guide Editor
  vertical document canvas
  guide blocks
  numbered steps
  tips/alerts/headers/GIFs
  screenshot annotations

Interactive Demo Editor
  scene canvas
  hotspots
  transition controls
  preview/play mode
  scene list

Shared Components
  capture session picker
  capture asset browser
  screenshot viewer
  annotation geometry utilities
```

Reasoning:

- Guides and demos have different mental models.
- A guide editor optimizes reading order and document structure.
- A demo editor optimizes interaction, navigation, and preview.
- Shared low-level components prevent duplication without forcing one universal editor.

Tradeoff:

- More UI work than one generic editor.
- Much clearer product experience and data model.

Status:

Accepted. Guide and interactive demo use separate editors with shared capture/asset preview components.

### Q21. What should "Create Guide from Capture" do in the MVP?

Recommended answer:

Create a draft guide with one step block per selected meaningful capture event, using the event's screenshot/capture asset and generated placeholder instruction text.

MVP behavior:

```text
create_guide_from_capture_session
  input:
    project_id
    capture_session_id
    title
    selected_capture_event_ids optional

  output:
    guide
    guide_blocks
    guide_steps
```

Step generation:

- `click` event -> `Click "<element label>"`
- `navigation` or `page_view` -> `Navigate to "<page title or URL>"`
- `manual_capture` -> `Review this screen`
- `input_change` -> `Enter the required value in "<field label>"`, without storing raw value

Reasoning:

- The user gets an editable draft immediately.
- Placeholder text is deterministic and non-AI.
- The editor remains the place where the user polishes instructions.

Tradeoff:

- Initial instructions may be plain.
- This is acceptable because the product is explicitly not AI-first and users can edit text.

Status:

Accepted. Create Guide from Capture creates a draft guide with deterministic step blocks from selected meaningful capture events.

### Q22. What should "Create Interactive Demo from Capture" do in the MVP?

Recommended answer:

Create a draft interactive demo with one scene per selected meaningful capture event that has a screenshot asset, and create linear transitions between scenes.

MVP behavior:

```text
create_interactive_demo_from_capture_session
  input:
    project_id
    capture_session_id
    title
    selected_capture_event_ids optional

  output:
    interactive_demo
    demo_scenes
    demo_hotspots
    demo_transitions
```

Scene generation:

- Each selected event with a screenshot becomes a `demo_scene`.
- Scene references the screenshot capture asset.
- Scene order follows capture event order.

Hotspot generation:

- For `click` events, create a hotspot from the captured element bounding box.
- Hotspot action defaults to `go_to_next_scene`.
- Overlay text can default to `Click "<element label>"`.

Transition generation:

- Create a transition from each scene to the next scene.
- MVP is linear.

Reasoning:

- The user gets a playable draft immediately.
- This uses existing capture metadata without needing HTML replay.
- Linear demos are enough for the first Storylane-like experience.

Tradeoff:

- Some scenes may need manual hotspot adjustment.
- Branching and advanced interactions are deferred.

Status:

Accepted. Create Interactive Demo from Capture creates a draft linear demo with scenes, hotspots, and transitions derived from selected meaningful capture events.

### Q23. Should AI be part of day-one MVP?

Recommended answer:

No. Do not make AI part of the day-one MVP. Keep the product deterministic first, and design the system so AI can be added later as an optional assistive layer.

Potential later AI features:

- suggest cleaner guide step wording
- summarize a capture session
- infer better step titles
- suggest hotspot copy
- detect likely sensitive regions
- generate alt text
- translate guide copy
- convert a guide into a different tone

Recommended future model:

```text
packages/assistant-domain or packages/automation-domain
  optional AI suggestions
  BYOK provider configuration
  suggestion records
  accepted/rejected suggestion tracking
```

Important boundary:

- AI should suggest content.
- Deterministic domain commands should persist accepted guide/demo changes.
- AI should not own capture, guide, demo, or publish state.

Reasoning:

- The product idea is intentionally no-AI-first.
- Scribe/Storylane-like value can be proven with capture, editing, and publishing.
- BYOK adds provider config, secret storage, rate limits, model errors, and support complexity.
- Adding AI later is easier if the core artifacts are clean and deterministic.

MVP allowance:

- Keep placeholder instruction generation deterministic.
- Do not build agent runtime or BYOK provider plumbing in the initial rebuild.
- Leave an architectural seam for future suggestions.

Tradeoff:

- Initial generated text will be basic.
- The benefit is faster product validation and a simpler open-source install.

Status:

Accepted. AI/BYOK is deferred; MVP stays deterministic and leaves room for a future optional suggestion layer.

Decision records:

- `docs/adr/0013-ai-deferred-from-day-one-mvp.md`

### Q24. Should the Chrome extension be built from day one or after the portal/server MVP?

Recommended answer:

Backend first, then Chrome extension. `apps/extension` can be scaffolded early if useful, but real extension implementation should wait until backend capture APIs are stable.

Recommended build order:

```text
1. server foundation
2. auth/user/organization/project domains
3. capture-domain APIs
4. project workspace in web portal
5. extension instance/login shell
6. extension screenshot capture flow
7. guide creation/editor
8. demo creation/editor
```

Reasoning:

- Extension is central to the product, so its app boundary should exist early.
- But extension implementation depends on stable instance auth, project selection, and capture APIs.
- Building web/server first allows manual/API capture fixtures for testing before browser-extension complexity.

MVP shortcut:

- Before extension capture works, server tests and a small web upload/debug tool can create capture sessions/assets.

Tradeoff:

- Users do not get the full capture workflow until the extension lands.
- The backend and portal model will be much more stable when extension work starts.

Status:

Accepted. Build backend and capture APIs first; implement the Chrome extension after those contracts are stable.

### Q25. When should the web portal be built relative to the backend?

Recommended answer:

Build a minimal portal alongside the backend once the first foundation APIs exist, but keep it contract-driven and workflow-focused.

Recommended sequence:

```text
Backend:
  auth/user/organization
  project
  capture

Portal MVP:
  login
  project list
  project workspace
  capture session list/detail
  create guide from capture

Then:
  guide editor
  extension
  interactive demo editor
```

Reasoning:

- The portal is needed to exercise product workflows end-to-end.
- Project workspace is where users land after capture.
- Building minimal UI early exposes missing API contracts.
- Heavy visual/editor polish should wait until core flows work.

Tradeoff:

- Some UI may be thrown away as the editor matures.
- Keeping early UI simple and contract-driven reduces waste.

Status:

Accepted. Build a minimal contract-driven portal alongside backend foundation APIs; defer heavy editor polish until core flows work.

### Q26. Should the backend API be REST/Fastify with Zod/OpenAPI, or should we consider GraphQL/tRPC?

Recommended answer:

Use REST with Fastify, Zod contracts, and OpenAPI/Scalar docs.

Reasoning:

- ORCA already proves this stack works well with domain packages.
- REST is straightforward for web app, Chrome extension, public viewers, and future desktop.
- File uploads and capture asset APIs are natural REST endpoints.
- Zod contracts give shared validation without coupling clients to a specific RPC framework.
- OpenAPI/Scalar docs are useful for open-source/self-hosted users.

Avoid for MVP:

- GraphQL: unnecessary complexity for this workflow-heavy app.
- tRPC: nice for TypeScript web clients, but less ideal for browser extension/public API/self-hosted integration docs.

Tradeoff:

- REST requires more explicit endpoint design.
- The explicitness is useful for this product and for open-source users.

Status:

Accepted. Backend API uses REST with Fastify, Zod contracts, and OpenAPI/Scalar documentation.

Decision records:

- `docs/adr/0014-rest-fastify-zod-openapi-api-style.md`

### Q27. What test strategy should the rebuild use from the start?

Recommended answer:

Use behavior-focused tests through public interfaces, matching the ORCA philosophy, and implement features with a TDD red-green-refactor loop.

Backend test layers:

```text
domain package tests
  pure policies
  command/query behavior when isolated enough

server integration tests
  Fastify routes
  real test database
  org/user sandbox fixtures
  auth headers
```

Frontend test layers:

```text
API wiring tests
  fetch stubs
  endpoint URLs
  query params
  request body validation

UI behavior tests
  Testing Library
  user-visible behavior
```

Extension test layers:

```text
unit tests
  instance URL validation
  event normalization
  sensitive input redaction

integration/manual harness later
  screenshot capture
  browser permissions
```

MVP required test coverage:

- auth sign-in/session context
- project CRUD and org isolation
- capture session creation/completion
- capture asset upload metadata
- create guide from capture
- create interactive demo from capture
- publish snapshot creation when publishing is implemented

Implementation rule:

- Use the test-driven-development skill for feature and bugfix implementation.
- Write one failing behavior test first.
- Verify RED.
- Write minimal implementation.
- Verify GREEN.
- Refactor only after GREEN.
- Avoid horizontal slicing where all tests are written before all implementation.

Avoid:

- testing private functions
- mocking internal domain collaborators by default
- tests coupled to SQL shape unless testing repository behavior directly

Status:

Accepted. Use TDD for implementation and behavior-focused public-interface tests as the project testing standard.

### Q28. What should the first vertical implementation slice be?

Recommended answer:

Build the smallest backend-first vertical slice that proves the new architecture:

```text
auth/user/organization foundation
  -> project creation/list/detail
  -> authenticated server integration test
  -> minimal portal project list/workspace
```

First behavior tests:

- user can sign in and receive organization context
- authenticated organization member can create a project
- project list only shows projects from the current organization
- project detail returns capture/guide/demo empty sections

Reasoning:

- This proves foundation domains, server adapter pattern, shared Zod contracts, database migration pattern, and frontend API wiring.
- It avoids capture/editor complexity before the skeleton is proven.
- It gives the project workspace a real backend contract early.

What not to include in slice one:

- Chrome extension
- screenshot upload
- guide editor
- demo editor
- publishing

Status:

Accepted. First vertical slice is auth/user/organization foundation plus project create/list/detail and minimal project workspace.

### Q29. Should this grill session stop here and consolidate, or continue into detailed schema/API design?

Recommended answer:

Stop this first grill session here and consolidate the decisions into the planning docs before implementation.

Reasoning:

- We resolved the major architectural boundaries.
- We have enough to start the rebuild safely.
- Detailed schema/API design should happen as the next grill session, scoped to slice one.
- Continuing too far now risks designing speculative capture/editor details before the foundation work starts.

Recommended next session:

`slice-one-schema-api-grill`

Scope:

- auth-domain tables and commands
- user-domain tables and commands
- organization-domain tables and commands
- project-domain tables and commands
- server routes and response contracts
- first TDD test plan

Status:

Accepted with refinement. Stop the architecture grill here, then start a separate detailed schema/API grill for the first implementation slice.

## Session Outcome

This session established the system-level boundaries for the Demo Composer v2 rebuild. The next grill session should move from architecture to implementation planning for the first vertical slice.

Next grill:

- `docs/grill/2026-06-05-slice-one-schema-api-grill.md`
