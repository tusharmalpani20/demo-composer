# Demo Composer Product Idea

## Current Status Pointer

This document is the product thesis. For current implementation status, see `docs/project-zoomout-status.md`.

As of the alpha hardening planning pass on 2026-06-22, the screenshot-first guide and interactive demo paths are implemented at MVP level. HTML replay, AI/BYO-key authoring, analytics, lead capture, custom branding, and hosted SaaS behavior remain deferred.

## Purpose

Demo Composer is a product for capturing real software workflows and turning those captures into useful, shareable walkthrough artifacts.

The core idea is intentionally simple:

- Capture a workflow from a browser.
- Save the visual state and user actions from each important moment.
- Let the user compose those captures into either a step-by-step guide or an interactive product demo.
- Publish or share the result with internal teams first, and later with sales, customer success, and external prospects.

This is not intended to be an AI-first product. AI can be added later if it becomes useful, but the main product value should come from reliable capture, clean editing, reusable assets, and polished publishing.

The closest references are:

- Scribe: step-by-step process documentation built from screenshots and actions.
- Storylane: interactive product demos built from captured screens and guided hotspots.

Demo Composer should support both product directions, but it should not force them into the same editing model. The capture source can be shared, but the final artifacts should be modeled separately.

## Product Summary

Demo Composer helps teams document and demonstrate software workflows.

There are two primary output types:

1. Guide / Doc
   A Scribe-style document made of ordered steps, screenshots, text instructions, annotations, tips, alerts, headers, and other documentation blocks.

2. Interactive Demo
   A Storylane-style walkthrough made of scenes, screenshots or HTML captures, hotspots, click targets, overlays, guided navigation, and publishable demo links.

Both outputs can reuse the same captured source material, but each output has different editing rules, presentation needs, and analytics needs.

## Target Users

The first target audience should be internal teams.

Internal teams need to:

- Document internal workflows.
- Train other team members.
- Create repeatable process documentation.
- Prepare demos without rebuilding the same screenshots and steps repeatedly.
- Share how-to guides across operations, support, onboarding, and implementation teams.

Later target audiences can include:

- Sales teams that need product demos for prospects.
- Customer success teams that need onboarding walkthroughs.
- Support teams that need reusable how-to documentation.
- Product marketing teams that need embedded interactive demos.

Sales-focused use cases will likely need more analytics, tracking, lead capture, custom branding, and embed controls. Those can come later after the internal documentation workflow is solid.

## Capture Strategy

The first capture surface should be a Chrome extension.

A Chrome extension is a natural first step because:

- Most product workflows happen inside the browser.
- It can capture screenshots.
- It can inspect DOM structure when needed.
- It can listen to clicks, inputs, URL changes, and navigation events.
- It can send capture events directly to the backend.

A desktop application can come later for workflows outside the browser, but it should not be the first implementation path unless there is a strong need.

## Capture Modes

The product should eventually support both screenshot and HTML capture modes.

### Screenshot Capture

Screenshot capture stores an image of the screen at a point in time.

This is useful for:

- Scribe-style documentation.
- Stable visual guides.
- Product areas where exact interactivity is not required.
- Fast capture and rendering.
- Avoiding complicated DOM replay problems.

Screenshot capture should support:

- Full viewport screenshots.
- Possibly full-page screenshots later.
- Element bounding boxes for clicked targets.
- Image dimensions and aspect ratio.
- Highlight/annotation positioning.
- Zoom controls in the editor and viewer.

### HTML Capture

HTML capture stores enough page structure to replay or inspect a screen state.

This is useful for:

- More interactive Storylane-style demos.
- Clickable captured screens.
- Simulated product flows.
- Better target tracking when screenshots alone are not enough.

HTML capture is more complicated than screenshots because it can involve:

- CSS dependencies.
- Fonts.
- Images.
- Dynamic DOM state.
- Iframes.
- Shadow DOM.
- Authenticated resources.
- Network-loaded assets.
- Sanitization and security concerns.

Because of that, HTML capture should be supported as a mode, but the first stable product path can still be screenshot-first.

## Reusable Capture Source

The captured source material should be reusable, but the composed outputs should be separate.

A user may record a workflow once, then later choose to create:

- A guide from the captures.
- An interactive demo from the captures.
- A second guide with different wording.
- A second demo with different hotspots.

However, a single artifact should have one clear type at a time.

That means a guide is edited like a guide, and a demo is edited like a demo. They should not share one vague widget model that tries to do everything.

## Main Product Model

The high-level model should look like this:

```text
Organization
  Users
  Projects
    Capture Sessions
      Capture Assets
      Capture Events

    Guides
      Guide Steps
      Guide Blocks
      Guide Annotations

    Interactive Demos
      Demo Scenes
      Demo Hotspots
      Demo Navigation
      Demo Publish Links
```

## Organization

An organization represents a team or company using Demo Composer.

It owns:

- Users.
- Projects.
- Captures.
- Guides.
- Interactive demos.
- Published links.
- Branding and permissions later.

The current v2 backend already has an organization model, which is a good foundation.

## User

A user belongs to an organization and creates or edits captures and artifacts.

Users should eventually have permissions around:

- Creating projects.
- Recording captures.
- Editing guides.
- Editing demos.
- Publishing artifacts.
- Managing organization branding.
- Viewing analytics.

The current v2 backend already has user, auth, organization role, and session concepts.

## Project

A project represents the product, software, module, or workflow area being documented or demoed.

Examples:

- ERP setup.
- CRM onboarding.
- Internal admin portal.
- Billing workflow.
- Customer onboarding flow.

A project groups related captures, guides, and demos.

In the old backend, `project` represented the software/product. That concept should be preserved in v2.

## Capture Session

A capture session represents one recording run.

For example:

> "Record the process of creating a department."

A capture session can contain:

- Start URL.
- Browser metadata.
- Viewport size.
- Device pixel ratio.
- User agent.
- Created by user.
- Organization and project ownership.
- Ordered capture events.
- Generated screenshot or HTML assets.

Capture sessions are source material. They are not the final user-facing artifact.

## Capture Event

A capture event is one meaningful action or moment during recording.

Examples:

- Page loaded.
- User clicked a button.
- User typed into an input.
- User changed route.
- User submitted a form.
- User manually captured a screen.

Capture events may include:

- Event type.
- URL.
- Page title.
- Timestamp.
- CSS selector.
- Element text.
- Element role.
- Element bounding box.
- Screenshot asset id.
- HTML asset id.
- Input value metadata, with sensitive data handling.

Capture events are useful for generating initial guide steps or demo scenes.

## Capture Asset

A capture asset is the stored visual or structural material from a capture.

Types can include:

- Screenshot image.
- HTML snapshot.
- DOM metadata.
- Element snapshot.
- GIF or short video later.

Capture assets should be reusable across guides and demos.

For example, the same screenshot can be used in:

- A guide step.
- A demo scene.
- A later cloned artifact.

## Guide / Doc

A guide is a Scribe-style document artifact.

It is meant to read like a clean process document.

The guide experience should look similar to the provided screenshots:

- A title and short description.
- Author and metadata.
- Step count and estimated completion time.
- A vertical sequence of large cards.
- Each step has a numbered badge.
- Each step has a clear instruction.
- Each step can show a screenshot.
- Screenshots can have highlights, zoom controls, and annotations.
- The editor can insert blocks between steps.

Guide output is optimized for reading, training, and documentation.

## Guide Step

A guide step is the main unit of a guide.

It should usually contain:

- Step number or sequence.
- Instruction text.
- Optional screenshot/capture asset.
- Optional highlighted target.
- Optional annotation.
- Optional alt text.
- Optional timing metadata.

Example:

```text
1. Navigate to "Department List"
2. Click "Add Department"
3. The "Is Group" checkbox is used to mark a department as a parent department.
```

The guide step should be first-class. It should not be hidden inside a generic widget table.

## Guide Block

A guide block is content that can appear inside the guide sequence.

Block types can include:

- Step.
- Tip.
- Alert.
- Capture.
- Header.
- GIF.
- Paragraph.
- Divider.

This maps directly to the editor control shown in the screenshot, where the user can insert:

- Step
- Tip
- Alert
- Capture
- Header
- GIF

Guide blocks let the guide become more than just a list of screenshots. They make it possible to build polished internal documentation.

## Guide Annotation

A guide annotation is a visual mark on a screenshot inside a guide.

Examples:

- Circle highlight.
- Rectangle highlight.
- Arrow.
- Blur region.
- Callout.
- Number marker.
- Text label.

Annotations should be positioned relative to the capture asset dimensions so they continue to work across responsive display sizes.

## Interactive Demo

An interactive demo is a Storylane-style artifact.

It is meant to feel like a guided product experience.

The viewer should move through scenes by:

- Clicking hotspots.
- Following callouts.
- Pressing next/back controls.
- Completing guided interactions.

Interactive demos are optimized for sales, onboarding, product tours, and embedded experiences.

They will eventually need:

- Publish links.
- Embed links.
- Lead capture.
- Completion tracking.
- Viewer analytics.
- Custom branding.
- Demo-specific permissions.

Those analytics-heavy features can come later, especially since the first target is internal documentation.

## Demo Scene

A demo scene is one screen or state in an interactive demo.

It usually references:

- A screenshot asset or HTML snapshot.
- Scene title.
- Scene sequence.
- Viewport metadata.
- Background/capture asset.
- Hotspots and overlays.

Scenes are similar to guide steps because both use captured screens, but they behave differently.

A guide step is read.

A demo scene is interacted with.

## Demo Hotspot

A demo hotspot is an interactive target on a scene.

It can represent:

- Click here to continue.
- Open this tooltip.
- Navigate to another scene.
- Show a modal.
- Simulate an input.
- Branch to another path later.

Hotspots need interaction behavior, not just visual annotation data.

They should support:

- Target position.
- Target size.
- Shape.
- Tooltip/callout content.
- Click action.
- Next scene id.
- Optional validation or branching rules later.

## Demo Navigation

Demo navigation controls how a viewer moves through an interactive demo.

The simplest version is linear:

```text
Scene 1 -> Scene 2 -> Scene 3
```

Later versions can support:

- Branching.
- Optional scenes.
- Checkpoints.
- Restart.
- Skip.
- Completion state.

The first implementation should stay linear unless branching is clearly needed.

## Publishing

Both guides and interactive demos should eventually be publishable.

Publishing can support:

- Private internal links.
- Public links.
- Password-protected links.
- Organization-only links.
- Embed links.
- Expiring links.
- Viewer access logs.

In v1, the backend had public/specific URL sharing tables for projects and demos. That idea is still useful, but v2 should probably use a more generic publish-link model that can attach to either a guide or a demo.

## Lessons From V1 Backend

The previous backend in `/home/tm/Desktop/work/demo_composer/demo_composer_backend` already implemented a large part of the original Demo Composer concept.

Important v1 concepts:

- `company`
- `project`
- `demo`
- `flow`
- `page`
- `widget`
- `guest`
- `static_files`
- share tables for users, companies, and URLs

The most important v1 model was:

```text
Project -> Demo -> Flow -> Page -> Widget
```

This mapped to:

- Project: the software/product being documented.
- Demo: the artifact.
- Flow: the ordered walkthrough.
- Page: a captured screen, either image or HTML.
- Widget: marker, beacon, overlay, or step data on top of the page.

That model was good for a prototype, but v2 should improve the naming and separation.

## What To Preserve From V1

V2 should preserve these ideas from v1:

- A project groups the work.
- A demo/guide belongs to a project.
- A flow-like ordering concept is needed.
- Captured pages/assets are stored separately from overlay data.
- Screenshots need stored dimensions and aspect ratio.
- Uploading a capture can create a default editable item.
- Public/guest viewing is important.
- File storage paths need to be organized by owner/project/artifact.
- Share/publish links are core to the product.

## What To Change From V1

V2 should change these areas:

- Do not use one generic `widget` concept for both guide docs and interactive demos.
- Make guide steps first-class.
- Make demo scenes and hotspots first-class.
- Separate reusable capture source from final artifact editing.
- Use organization instead of the older company-first model.
- Use clearer artifact types.
- Improve permissions before adding external/sales use cases.
- Avoid guest editing as a primary workflow unless there is a deliberate unauthenticated capture mode.
- Add versioning/conflict handling for collaborative editing.

## Proposed V2 Domain Split

The most important domain decision is to split guide and demo editing models.

### Shared Capture Domain

Shared capture tables/concepts:

- `project`
- `capture_session`
- `capture_event`
- `capture_asset`
- `asset_file`

These are reusable source materials.

### Guide Domain

Guide-specific tables/concepts:

- `guide`
- `guide_block`
- `guide_step`
- `guide_annotation`
- `guide_publish_link`

These support Scribe-style documents.

### Interactive Demo Domain

Demo-specific tables/concepts:

- `interactive_demo`
- `demo_scene`
- `demo_hotspot`
- `demo_transition`
- `demo_publish_link`

These support Storylane-style walkthroughs.

### Shared Publishing Domain

Publishing may be generic:

- `publish_link`
- `publish_access_rule`
- `viewer_session`

This would avoid duplicating publish logic for guides and demos.

## Suggested Naming

Avoid overly generic names where possible.

Recommended names:

- `capture_session` instead of `recording` if the focus is reusable captured data.
- `capture_asset` instead of `page` if it can hold screenshot, HTML, or later video/GIF.
- `guide` instead of `how_to` for the Scribe-style artifact.
- `guide_step` for numbered process steps.
- `guide_block` for tips, alerts, headers, captures, GIFs, and other document blocks.
- `interactive_demo` or `demo` for the Storylane-style artifact.
- `demo_scene` instead of `page` for interactive demo screens.
- `demo_hotspot` instead of `widget` for interactive click targets.

## Why Guide And Demo Should Be Split

Guide docs and interactive demos share source material, but they are not the same product object.

A guide needs:

- Reading order.
- Step numbers.
- Instruction text.
- Documentation blocks.
- Export-friendly structure.
- Clean vertical layout.
- Internal training use cases.

An interactive demo needs:

- Scene transitions.
- Clickable hotspots.
- Guided navigation.
- Simulated interactivity.
- Embeds.
- Viewer analytics later.
- Sales/demo use cases.

If both are forced into one `widget` model, the model will become vague and hard to reason about.

Splitting them makes the system easier to build, easier to test, and easier to evolve.

## Initial Product Workflow

The first useful workflow can be:

1. User signs in.
2. User creates or selects a project.
3. User starts a Chrome extension capture session.
4. Extension records screenshots and action metadata.
5. Backend stores capture assets and capture events.
6. User opens the web app editor.
7. User chooses to create a guide or an interactive demo from the capture session.
8. User edits the artifact.
9. User publishes or shares the artifact internally.

## Guide Creation Workflow

For a guide:

1. Select capture session.
2. Generate initial guide steps from capture events.
3. Show vertical editor with cards.
4. Allow editing step text.
5. Allow adding/removing/reordering steps.
6. Allow inserting guide blocks.
7. Allow annotating screenshots.
8. Allow publishing the guide.

The guide editor should match the feel shown in the screenshots:

- Light background.
- Centered document column.
- Large rounded step cards.
- Number badges.
- Screenshot preview inside each card.
- Inline insert controls between sections.
- Simple edit and alt text actions near captures.
- Zoom controls for screenshots.

## Interactive Demo Creation Workflow

For an interactive demo:

1. Select capture session.
2. Create scenes from selected captures.
3. Add hotspots to scenes.
4. Define next-scene behavior.
5. Preview the demo as a viewer.
6. Publish or embed the demo.

The first version should be linear and simple.

Later versions can add:

- Branching.
- Forms.
- Lead capture.
- Analytics.
- Custom domains.
- Account-level branding.

## Chrome Extension Responsibilities

The Chrome extension should be responsible for capture, not heavy editing.

It should handle:

- Start/stop capture session.
- Capture screenshot.
- Capture current URL and page title.
- Capture click events.
- Capture element metadata.
- Capture viewport metadata.
- Optionally capture HTML snapshots.
- Send captured data to the backend.

It should not initially handle the full guide or demo editor. The web app should own editing.

## Backend Responsibilities

The backend should handle:

- Authentication.
- Organization and user ownership.
- Project management.
- Capture session creation.
- Capture asset upload and storage metadata.
- Guide CRUD.
- Guide step/block/annotation CRUD.
- Interactive demo CRUD.
- Scene/hotspot CRUD.
- Publish links.
- Asset serving.
- Permission checks.

The current v2 backend already has a stronger foundation than v1 for auth, organizations, shared types, and Fastify route schemas.

## Frontend Responsibilities

The frontend should eventually include:

- Dashboard.
- Project list.
- Capture session list.
- Guide editor.
- Interactive demo editor.
- Published guide viewer.
- Published demo viewer.
- Asset/capture library.

The current v2 frontend is still the default starter UI, so the product-facing interface has not really started yet.

## MVP Recommendation

The best MVP path is likely:

1. Organization/user auth.
2. Project CRUD.
3. Capture session CRUD.
4. Screenshot capture upload from Chrome extension.
5. Capture event storage.
6. Guide creation from a capture session.
7. Guide step editor.
8. Guide viewer/publish link.

This prioritizes the internal documentation use case first.

After that:

1. Interactive demo artifact.
2. Demo scenes.
3. Hotspots.
4. Linear scene navigation.
5. Demo publish link.

Analytics and sales-specific features should come after the core artifact creation and publishing flows are good.

## Open Questions For Implementation Planning

These questions should be answered during the detailed implementation grill-down:

1. Should capture assets be immutable once uploaded?
2. Should guide steps reference capture events, capture assets, or both?
3. Should guide blocks be one table with JSON data, or separate typed tables?
4. Should demo hotspots support only linear navigation in v1?
5. How should HTML snapshots be sanitized and stored?
6. How should sensitive input data be handled by the Chrome extension?
7. Should published guides and demos be versioned?
8. Should publish links point to a draft, latest version, or immutable published version?
9. Should internal users need explicit project permissions beyond organization membership?
10. What file storage backend should be used first: local disk, S3-compatible storage, or something else?

## Short Product Definition

Demo Composer is a no-AI capture and composition platform for turning real software workflows into reusable internal guides and interactive product demos.

It captures screenshots and action metadata through a Chrome extension, stores those captures as reusable source material, and lets users compose them into either Scribe-style process docs or Storylane-style interactive walkthroughs.
