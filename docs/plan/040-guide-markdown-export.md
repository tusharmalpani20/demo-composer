# Guide Markdown Export Plan

Date: 2026-06-12

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Let users export a Scribe-style guide as portable Markdown so internal docs can move outside Demo Composer into tools like GitHub, Notion, Confluence, Slack, or a plain `.md` file.

Target flow:

```text
user opens a guide
  -> user clicks export markdown
  -> backend renders the current guide draft into deterministic markdown
  -> portal shows a preview/copy/download action
  -> user can paste or save the markdown elsewhere
```

This is the first export slice. It should prove the export contract and content mapping without committing to PDF generation, Confluence APIs, Notion APIs, or image bundling yet.

## Why This Comes Next

Current state after `039-guide-screenshot-annotations-foundation`:

- extension capture can create ordered screenshot-backed capture sessions
- capture sessions can generate editable draft guides
- guide editor supports step text, guide metadata, supported guide blocks, screenshot replacement/upload, and screenshot highlights
- private preview and public reader render the current Scribe-style guide shape
- publishing snapshots public guide content immutably
- public links can be copied, opened, republished, and revoked

Remaining internal-docs gap:

- users can view and publish guides, but cannot easily move guide content into their existing documentation system
- public links are useful, but many internal teams still need copyable static docs
- export will force us to formalize guide-to-document rendering rules before adding richer output formats

Markdown is the right first export format because:

- it is simple and deterministic
- it works in many downstream tools
- it is easy to test as plain text
- it avoids browser/PDF rendering complexity
- it can reuse the guide detail read model and effective screenshot asset URLs

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0003-immutable-capture-source-records.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/plan/031-guide-publish-foundation.md
docs/plan/032-public-guide-reader.md
docs/plan/035-guide-block-authoring-foundation.md
docs/plan/036-guide-step-screenshot-management.md
docs/plan/038-guide-paragraph-divider-blocks.md
docs/plan/039-guide-screenshot-annotations-foundation.md
```

Important implications:

- export should render from the editable guide draft for authenticated portal users
- public published snapshots remain separate from draft export
- capture assets remain immutable source material
- selected/hidden screenshot state must be honored through `display_capture_asset_id`
- step numbering must be based only on step blocks
- export must not leak organization ids, storage keys, internal file ids, or deleted data
- annotations belong to the guide block content layer and should be represented clearly
- export is read-only and should work for both draft and archived guides
- this slice should not introduce AI, analytics, public access controls, PDF generation, or interactive demo export

## Scope

Included:

- backend service method to export a guide draft as Markdown
- authenticated route for guide Markdown export
- Markdown renderer for supported guide block types:
  - guide title
  - guide description
  - step
  - header
  - paragraph
  - tip
  - alert
  - divider
- effective screenshot asset links for step screenshots
- deterministic representation of screenshot highlights
- API client helper for guide Markdown export
- portal action to copy exported Markdown
- portal action to download exported Markdown as a `.md` file
- focused backend service/route tests
- focused web API and portal tests
- update `docs/project-zoomout-status.md`

Excluded:

- PDF export
- DOCX export
- ZIP export with bundled images
- Confluence/Notion/GitHub API publishing
- public export endpoint
- export from published snapshots
- export analytics
- background export jobs
- branding/theme controls
- rich HTML export
- image rasterization with annotation overlays burned into screenshots
- interactive demo export
- AI-generated summaries or cleanup

## Recommended Approach

Add a backend Markdown export read path under the guide module.

Recommended endpoint:

```http
GET /api/v1/projects/:project_id/guides/:guide_id/export/markdown
```

Recommended response:

```json
{
  "filename": "department-guide.md",
  "markdown": "# Department guide\n\nSet up departments...\n"
}
```

Reasoning:

- returning JSON makes the first portal implementation simple for copy/download actions
- the API can later add `Accept: text/markdown` or a direct file response without replacing the core renderer
- the export remains authenticated and scoped to the current organization/project
- the renderer can be tested without HTTP concerns

## Markdown Rendering Rules

### Guide Metadata

Render the guide title as the document H1:

```md
# Department guide
```

Render guide description as plain paragraph text when present:

```md
Set up departments from the list view.
```

### Step Blocks

Render step blocks as numbered H2 sections using computed step number:

```md
## 1. Navigate to Department List

Open the Department module.
```

If a step has no body, omit the body paragraph.

If a step has an effective screenshot, render the screenshot as a Markdown image:

```md
![Department List](http://localhost:3000/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file)
```

Use screenshot alt text fallback order:

```text
asset.page_title
asset.file.original_name
step.title
Step {stepNumber} screenshot
```

Screenshot URLs should be absolute URLs in exported Markdown, not relative API paths. Use the configured public API/base URL if one already exists in server config; otherwise add a small server-side base URL helper with an environment-backed default. This matters because exported Markdown is meant to leave the portal, and relative `/api/v1/...` links will break in most external docs tools.

### Screenshot Highlights

Markdown cannot visually overlay highlight rectangles on screenshots without HTML or image processing.

For this slice, render highlight metadata below the screenshot when annotations exist:

```md
Highlights:

- Highlight 1: x 64%, y 12%, width 18%, height 8%
```

Reasoning:

- no annotation data is silently lost
- tests remain deterministic
- users can still understand that the exported screenshot had callouts in the portal
- later HTML/PDF export can render visual overlays properly

Do not use raw JSON for annotations in the main Markdown body.

### Header Blocks

Render header blocks as H2 sections:

```md
## Department fields
```

This may produce H2 headings next to numbered step H2 headings. That is acceptable for the first slice and mirrors the vertical guide structure.

### Paragraph Blocks

Render paragraph body as plain paragraph text:

```md
Choose the right department settings before saving.
```

### Tip Blocks

Render tips as Markdown blockquotes:

```md
> **Tip:** Use this when the department should be reused.
```

If the tip has a title, include it:

```md
> **Tip: Parent departments**
> Use this when the department should be reused.
```

### Alert Blocks

Render alerts as Markdown blockquotes:

```md
> **Alert:** This changes reporting structure.
```

If the alert has a title, include it:

```md
> **Alert: Reporting impact**
> This changes reporting structure.
```

### Divider Blocks

Render dividers as:

```md
---
```

### Unsupported Blocks

For unsupported block types like `capture`, `gif`, or future block types, render a small placeholder instead of throwing:

```md
<!-- Unsupported guide block: gif -->
```

Reasoning:

- export should be resilient to future block data
- unsupported blocks should not break the entire export
- comments keep unsupported placeholders from becoming noisy visible content in most Markdown renderers

## Markdown Escaping

Add a small Markdown escaping helper for:

- headings
- image alt text
- image URLs
- inline labels
- blockquote text

Rules:

- preserve normal prose readability
- escape characters that can accidentally change Markdown structure when used in headings, labels, alt text, and blockquotes
- wrap or encode image URLs safely when they contain spaces or parentheses
- treat `\r\n` and `\r` as `\n`
- normalize excessive blank lines to a deterministic output
- trim trailing whitespace
- ensure output ends with exactly one newline

Do not over-engineer a full Markdown AST dependency in this slice unless existing project tooling already provides one.

## Backend Plan

Primary files:

```text
apps/server/src/modules/guide/guide.service.ts
apps/server/src/modules/guide/guide.routes.ts
apps/server/src/modules/guide/guide.service.test.ts
apps/server/src/modules/guide/guide.routes.test.ts
apps/server/src/modules/guide/guide.db.integration.test.ts
```

### 1. Add Export Types

Recommended service result:

```ts
type GuideMarkdownExport = {
  filename: string;
  markdown: string;
};
```

Recommended service method:

```ts
export_guide_markdown(input: {
  auth: GuideAuthContext;
  project_id: string;
  guide_id: string;
}): Promise<GuideMarkdownExport>;
```

### 2. Add Service Renderer

Service behavior:

- verify project exists in the actor organization
- load guide detail through existing repository method
- reject missing guide
- do not require the guide to be editable
- render sorted guide blocks by `block_index`
- compute step numbers from step blocks only
- use `source_capture_assets` to resolve effective screenshot assets
- include only safe asset `file_url` values already exposed by the guide detail read model, converted to absolute URLs
- return deterministic Markdown and filename

Filename behavior:

- slugify guide title to lowercase kebab case
- remove unsafe filesystem characters
- collapse repeated hyphens
- fallback to `guide-{guide_id}.md` when title has no usable characters

### 3. Add Route

Add authenticated route:

```http
GET /api/v1/projects/:project_id/guides/:guide_id/export/markdown
```

Response:

```json
{
  "filename": "department-guide.md",
  "markdown": "# Department guide\n"
}
```

Route should:

- require a valid web session cookie
- set JSON response headers through the normal Fastify response path
- use the existing auth guard style
- return domain errors consistently
- not accept client-managed organization or user fields

### 4. Backend Tests

Service tests:

- exports guide title and description
- renders step blocks in block order with computed step numbers
- renders header/paragraph/tip/alert/divider blocks
- renders effective screenshot image Markdown
- renders absolute screenshot URLs, not relative API paths
- renders highlight metadata when annotations exist
- omits screenshots when `display_capture_asset_id` is null
- does not leak organization ids, internal file ids, storage keys, or deleted asset data
- produces deterministic filename
- exports archived guides because export is read-only
- handles unsupported block types with a Markdown comment
- rejects missing project/guide consistently

Route tests:

- authenticated user can export Markdown
- unauthenticated request is rejected
- route calls service with scoped params
- response includes filename and markdown
- route does not pass client-managed fields

DB integration tests:

- export a real generated guide with screenshot and annotations
- verify Markdown contains safe absolute asset URLs
- verify hidden screenshot is omitted
- verify block order and step numbering are stable

## API Client Plan

Primary files:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
apps/web/src/features/guide/types.ts
```

Add type:

```ts
export type GuideMarkdownExport = {
  filename: string;
  markdown: string;
};
```

Add API helper:

```ts
export const exportGuideMarkdown = async (
  projectId: string,
  guideId: string
): Promise<GuideMarkdownExport>
```

Tests:

- uses `GET`
- URL-encodes project and guide ids
- returns filename and markdown
- maps auth/not-found errors through existing API error handling

## Portal UI Plan

Primary files:

```text
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.module.css
apps/web/src/features/guide/GuideEditorPage.test.tsx
apps/web/src/features/guide/GuidePreviewPage.tsx
apps/web/src/features/guide/GuidePreviewPage.module.css
apps/web/src/features/guide/GuidePreviewPage.test.tsx
```

Recommended first UI:

- add export actions to the guide editor header or publishing/utility area
- add export actions to private preview actions
- support:
  - `Copy Markdown`
  - `Download Markdown`

Copy behavior:

- call export endpoint
- copy `markdown` to clipboard
- show success/failure notice

Download behavior:

- call export endpoint
- create a `Blob` with `text/markdown;charset=utf-8`
- use exported filename
- revoke object URL after triggering download

Test seam:

- inject `exportMarkdown`
- inject `copyText`
- create a small browser download adapter, for example `downloadTextFile(filename, contents, mimeType)`
- inject `downloadTextFile` to avoid depending on browser object URL behavior directly in component tests

Editor tests:

- copy Markdown calls export and clipboard helpers
- download Markdown calls export and download helper with filename/content
- failures show a useful notice
- archived guide can still export because export is read-only
- export action does not mark published draft stale
- copy/download buttons expose busy states while export is in flight

Preview tests:

- private preview copy/download actions use the same export helper
- unauthenticated preview state remains unchanged
- export failures show a useful notice without leaving preview

## UX Notes

Keep controls modest and utility-oriented:

- use text buttons for `Copy Markdown` and `Download Markdown`
- place them near existing guide actions rather than inside every block
- avoid a large export modal in the first slice
- show concise notice text:
  - `Markdown copied.`
  - `Markdown downloaded.`
  - `Could not export Markdown.`

Do not add visible explanatory text about Markdown limitations inside the app for this slice. The exported document itself can include highlight metadata.

## Documentation Updates

Update:

```text
docs/project-zoomout-status.md
```

Expected status changes:

- move Markdown export from not built to built guide product depth
- keep PDF, DOCX, ZIP, embed, advanced access rules, analytics, AI, and interactive demos in not built
- update recommended next direction toward public/share polish, export formats, access controls, or embed support

No ADR is expected. This plan uses the existing guide read model and does not introduce a new export domain or persisted export artifact.

## Verification

Run at minimum:

```bash
pnpm --filter server test -- guide.service.test.ts guide.routes.test.ts
pnpm --filter web test -- api.test.ts GuideEditorPage.test.tsx GuidePreviewPage.test.tsx
pnpm check-types
pnpm build
pnpm lint
git diff --check
```

Because export depends on guide detail and safe asset read models, also run:

```bash
pnpm --filter server exec env-cmd -f .env-cmdrc -e testing -- vitest run --testTimeout=20000 --no-file-parallelism src/modules/guide/guide.db.integration.test.ts
```

## Suggested Commit Shape

Keep implementation in small logical commits:

```text
1. Add backend guide Markdown export
2. Add portal Markdown export actions
3. Update guide export status docs
```

If preview and editor UI changes are small, they can share the same portal commit.
