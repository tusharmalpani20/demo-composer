# Rich HTML And ZIP Export Foundation Plan

Date: 2026-06-14

Status: Implemented.

## Goal

Add a richer guide export path that can produce a portable HTML package for a guide, including its screenshots and annotations.

Target flow:

```text
portal user
  -> opens a guide editor or private preview
  -> clicks Export HTML
  -> server builds a deterministic HTML document from the current draft guide
  -> server includes referenced screenshots in a ZIP package
  -> downloaded ZIP contains index.html plus image assets
  -> user can unzip and open index.html without Demo Composer running
```

This should build on the existing guide detail read model, screenshot file-serving rules, Markdown export behavior, and current Scribe-style reader layout. The result should be useful for internal documentation handoff, archive, review, and eventually PDF/DOCX export.

## Why This Comes Next

The product can now complete the first shareable capture-to-guide loop:

- create capture sessions from the portal or extension
- upload or capture screenshots
- record ordered capture events
- generate editable guides
- edit text blocks and step screenshots
- add screenshot rectangle annotations
- preview guides privately
- export Markdown
- publish public guide snapshots
- embed public guides
- protect public links with access mode, expiry, revocation, and password protection

The next practical gap is portability. Internal docs teams often need to move walkthroughs into other systems or keep offline/static copies. Markdown is useful, but it loses too much visual fidelity for screenshot-heavy guides. A ZIP containing HTML and images gives us a better export base while still staying simple and deterministic.

This should come before PDF/DOCX because those formats can later be generated from the same HTML export pipeline. It should come before analytics and interactive demos because it deepens the existing guide product without opening a new domain.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0011-privacy-preserving-capture-defaults.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/028-guide-preview-reader.md
docs/plan/029-guide-screenshot-viewer.md
docs/plan/039-guide-screenshot-annotations-foundation.md
docs/plan/040-guide-markdown-export.md
docs/plan/046-public-guide-access-controls.md
docs/plan/051-public-guide-password-access.md
```

Important implications:

- export the authenticated draft guide, not the public published snapshot, for this first slice
- keep exports scoped to the authenticated user's organization/project
- do not expose storage keys, organization IDs, project IDs, or deleted assets in exported HTML
- preserve the ordered guide block structure
- render supported guide block types consistently with the portal reader
- use effective screenshot display state, including selected/replacement screenshots and hidden screenshot state
- preserve rectangle screenshot annotations as visual overlays
- do not invent a new guide model for export
- do not add AI-generated copy, analytics, lead capture, branding systems, or interactive demo export in this slice

## Product Behavior

### User-Facing Behavior

Add an authenticated HTML export action for a draft guide.

The user should be able to:

- open a project guide
- click an export action named `Export HTML`
- receive a `.zip` download
- unzip the package
- open `index.html` locally
- see the guide title, description, blocks, screenshots, and annotation overlays
- see images load from local relative paths inside the ZIP

The export should include:

- `index.html`
- an `assets/` folder
- referenced screenshot image files under `assets/`

The export should render:

- guide title
- guide description if present
- step blocks
- header blocks
- paragraph blocks
- tip blocks
- alert blocks
- divider blocks
- step screenshot images when not hidden and available
- rectangle screenshot annotations over screenshots

The export should avoid:

- live API URLs for screenshots
- portal chrome
- editor-only controls
- public link controls
- auth/session information
- internal IDs unless they are needed as stable HTML anchors and are safe

### File Naming

ZIP name:

```text
{guide-title}-html-export.zip
```

Derive a safe filename from the guide title and fall back to:

```text
guide-html-export.zip
```

Inside the ZIP:

```text
index.html
assets/{block_index}-{capture_asset_id-or-file_id}.{extension}
```

The exact filename does not need to expose internal database IDs if an easy sanitized alternative exists. The important part is deterministic naming and correct relative references from `index.html`.

## Backend Design

### Route

Add an authenticated route:

```text
GET /api/v1/projects/:project_id/guides/:guide_id/export/html.zip
```

Response:

```text
200 application/zip
content-disposition: attachment; filename="{safe-name}-html-export.zip"
```

Errors should follow existing route conventions:

- `401 unauthenticated`
- `404 project_not_found`
- `404 guide_not_found`
- `500` only for unexpected export failures

Do not add a public export endpoint in this slice.

### Service Shape

Extend the guide domain rather than the publish domain for draft export.

Suggested service method:

```ts
export_guide_html_zip(input: {
  auth: GuideAuthContext;
  project_id: string;
  guide_id: string;
}): Promise<{
  filename: string;
  mime_type: "application/zip";
  stream: NodeJS.ReadableStream;
  size_bytes?: number;
}>
```

The service should:

1. verify project/guide access through existing guide repository patterns
2. load guide detail using the existing guide detail read path
3. collect effective screenshot assets from guide blocks
4. fetch private export-only file metadata for those effective assets
5. read screenshot files through the file/storage abstraction, not direct path string construction
6. build static HTML with escaped text content
7. build ZIP entries for `index.html` and referenced images
8. return a stream or buffer depending on what the existing stack supports cleanly

Important current-code constraint:

The normal `GuideDetail` DTO intentionally does not expose `storage_key`. Keep that behavior. The export service should use a private repository method for export file reads, for example:

```ts
find_guide_export_asset_files(input: {
  organization_id: string;
  project_id: string;
  guide_id: string;
  capture_asset_ids: string[];
}): Promise<Array<{
  capture_asset_id: string;
  storage_provider: "local" | "external";
  storage_key: string;
  mime_type: string;
  original_name: string | null;
  size_bytes: number;
}>>
```

That repository method must:

- scope by organization, project, and guide
- only return files for active, non-deleted capture assets referenced by that guide
- join through `file_schema.file`
- never expose its result through JSON API responses

The guide service currently only accepts `{ public_base_url }` options. This slice should add a `file_storage` option to `build_guide_service`, matching the local storage provider pattern already used by capture assets and public published assets.

```ts
type GuideFileStorage = {
  get: (input: { storage_key: string }) => Promise<{
    stream: NodeJS.ReadableStream;
    size_bytes: number;
  }>;
};
```

`apps/server/src/app.ts` should pass the existing local file storage provider into `build_guide_service`.

### HTML Renderer

Create a focused renderer module, likely under:

```text
apps/server/src/modules/guide/guide-html-export.ts
```

Responsibilities:

- transform `GuideDetail` into a standalone HTML document
- escape all text and attribute content
- render supported blocks
- render screenshot wrappers with annotation overlay elements
- produce a list of image references needed by the ZIP builder

The renderer should not:

- query the database
- read files
- know about Fastify
- know about auth/session cookies

### ZIP Builder

There is no ZIP package in the repo today. Add a small maintained ZIP package only for this server feature, and keep its use behind a small adapter so future PDF/DOCX/export work does not couple directly to a package API.

Recommended shape:

```text
apps/server/src/modules/guide/guide-zip-export.ts
```

The ZIP builder should:

- add `index.html`
- add image files under `assets/`
- preserve image MIME extensions when possible
- skip missing optional screenshots only if the guide detail marks them unavailable
- fail clearly if a referenced required screenshot file cannot be read

### Screenshot Handling

For each step block:

- if `screenshot_hidden` is true, do not export an image
- if no effective display asset exists, render the step without an image
- if an effective display asset exists, export the file into `assets/`
- update the HTML image `src` to the relative exported asset path
- render annotations based on the block's snapshotted/draft annotation content

Annotation overlay behavior:

- use percentage-based positioning from stored annotation coordinates
- keep overlays visible in local HTML
- do not require JavaScript for basic rendering

### Security

The HTML renderer must escape:

- guide title
- guide description
- block titles
- block bodies
- page titles
- page URLs
- image alt text
- any string placed in HTML attributes

The export must not include:

- raw storage keys
- password hashes or salts
- viewer sessions
- auth/session tokens
- organization/user metadata unrelated to the guide
- hidden screenshots
- deleted files

## Web Portal Design

### API Client

Add:

```ts
exportGuideHtmlZip(projectId: string, guideId: string): Promise<{
  filename: string;
  blob: Blob;
}>
```

It should:

- call `/api/v1/projects/:project_id/guides/:guide_id/export/html.zip`
- include credentials
- map API errors with existing `ApiClientError` behavior when possible
- preserve the filename from `content-disposition`
- fall back to `guide-html-export.zip` if the header is unavailable or malformed

Add or reuse a small browser download helper that downloads a `Blob` using an object URL and revokes that URL after triggering the download.

### Guide Editor UI

Add an `Export HTML` action near the existing Markdown export actions.

Expected states:

- idle
- exporting
- success notice
- failure notice

The action should:

- request the ZIP
- trigger browser download
- not navigate away
- not dirty guide state
- work regardless of publish status

### Guide Preview UI

Optionally add the same `Export HTML` action to private preview if it fits the current preview toolbar. If this increases scope too much, editor-only is acceptable for this first slice.

Recommendation: implement editor first, preview second only if the API/client helper makes it trivial.

## Testing Plan

Follow TDD.

### Backend Unit Tests

Add renderer tests for:

1. escapes guide/block text in HTML
2. renders step/header/paragraph/tip/alert/divider blocks in block order
3. uses relative image paths, not API URLs
4. omits hidden screenshots
5. renders annotation overlay styles from stored rectangle annotations
6. returns required image references for ZIP packaging

### Backend Service Tests

Add service tests for:

1. rejects missing project/guide with existing domain errors
2. exports a ZIP with `index.html`
3. includes referenced screenshot files under `assets/`
4. does not include hidden screenshots
5. fails clearly if a referenced screenshot file cannot be read
6. does not include raw storage keys in HTML
7. requests private export file metadata only for visible effective screenshot assets
8. throws the existing unsupported-storage error style for non-local/export-unsupported files

### Backend Route Tests

Add route tests for:

1. unauthenticated export returns `401 unauthenticated`
2. authenticated export returns `application/zip`
3. response includes attachment content disposition
4. route passes authenticated organization/project/guide scope to service
5. domain errors map to existing error response shapes

### DB Integration Tests

Add at least one integration test that:

1. creates/uploads a screenshot-backed guide
2. exports HTML ZIP
3. confirms `index.html` exists
4. confirms at least one image asset exists
5. confirms exported HTML references the local asset path
6. confirms annotations are represented if the fixture includes them

If ZIP inspection is awkward, use the selected ZIP library's read API or a small test helper.

### Web Tests

Add API tests for:

1. calls the correct export endpoint with credentials
2. returns `{ filename, blob }`
3. handles an API error response
4. parses `content-disposition` filename safely

Add page tests for:

1. guide editor renders `Export HTML`
2. click enters exporting state
3. successful export triggers a download helper
4. failed export shows a clear error notice

## Implementation Steps

1. Add backend renderer tests for HTML escaping and block rendering.
2. Implement `guide-html-export` renderer.
3. Add ZIP package and a small ZIP adapter behind `guide-zip-export`.
4. Add repository/service tests for export-only asset file metadata and storage reads.
5. Implement guide repository export asset file lookup.
6. Implement guide service export method and inject `file_storage` from `app.ts`.
7. Add authenticated route tests.
8. Implement route and response headers.
9. Add DB integration coverage.
10. Add web API client tests.
11. Implement web API helper and download helper.
12. Add guide editor UI tests.
13. Implement guide editor export action.
14. Update `docs/project-zoomout-status.md` to mark HTML ZIP export foundation as built after implementation.
15. Clean up the stale status line that still implies password-protected public guide links are not implemented.

## Out Of Scope

Do not build in this slice:

- PDF export
- DOCX export
- Confluence/Notion/GitHub publishing
- public published snapshot ZIP export
- public reader export button
- branded export themes
- custom CSS editor
- analytics tracking
- lead capture
- interactive demo export
- AI-generated summaries or cleanup
- HTML replay capture

## Acceptance Criteria

This plan is done when:

- authenticated users can download a ZIP export for a draft guide
- ZIP contains `index.html`
- ZIP contains local image assets for visible referenced screenshots
- `index.html` renders supported guide blocks in order
- screenshot annotations appear in the exported HTML
- exported HTML uses escaped text and safe relative image references
- hidden screenshots are not exported
- route/service/client/page tests pass
- DB integration export path passes
- full test/type/lint/build verification passes

## Open Questions

1. Should the first export action live only in the guide editor, or also in private preview?
2. Should exported HTML include minimal Demo Composer branding, or stay neutral/unbranded for internal docs?
3. Should exported HTML include the source page URL under screenshots when available?
4. Should the first ZIP preserve original image filenames, or always generate deterministic sanitized names?

Recommended answers for this slice:

- editor first; preview only if trivial
- neutral/unbranded
- include source page URL only as escaped optional metadata if already present and useful
- generate deterministic sanitized names
