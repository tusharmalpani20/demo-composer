# Public Guide Embed Foundation Plan

Date: 2026-06-14

Status: Implemented.

## Goal

Let portal users copy an iframe embed snippet for an already published public guide, and let public readers open that guide in an embed-friendly layout.

Target flow:

```text
authenticated portal user
  -> opens /projects/:project_id/guides/:guide_id
  -> publishes or opens an already published guide
  -> sees the public guide URL and embed action in the publishing panel
  -> copies an iframe snippet
  -> pastes the iframe into an internal docs site, website, or help-center page
  -> iframe loads /p/:slug/embed
  -> embedded public guide follows the same access, expiry, revoke, and snapshot rules as /p/:slug
```

This extends the already working publish/public-reader loop without adding analytics, password sessions, or the interactive demo product.

## Why This Comes Next

The current product can already create, edit, publish, restrict, expire, revoke, and publicly read Scribe-style guide snapshots.

The next sharing gap is delivery:

- portal users can copy/open a public guide URL
- public guide reader route `/p/:slug` renders the immutable published snapshot
- publish links enforce visibility and expiry
- public assets are constrained to the active accessible snapshot
- users cannot yet embed a published guide into another page

Embed foundation should come before analytics or sales tracking because embed creates the surface that those later features may observe. It should also come before password/member sessions unless the product decision is to make embeds authenticated; for now, embeds should only work for publicly accessible links.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/031-guide-publish-foundation.md
docs/plan/032-public-guide-reader.md
docs/plan/033-portal-guide-publish-controls.md
docs/plan/034-guide-publish-controls-polish.md
docs/plan/046-public-guide-access-controls.md
```

Important implications:

- public guides resolve immutable published snapshots, not mutable guide drafts
- embed output must read the same active published artifact as `/p/:slug`
- restricted, expired, revoked, missing, and malformed public links must not become accessible through embed routes
- public asset URLs must remain constrained to the active accessible snapshot
- publish link access belongs to the publish/link domain
- keep the portal and public reader in the existing `apps/web` app
- use the existing public publish API unless tests reveal a backend contract gap
- use TDD for implementation
- do not add analytics, lead capture, password protection, member-only sessions, or interactive demo behavior in this slice

## Current State

Already implemented:

- authenticated guide publish/republish/revoke
- authenticated guide publish status read
- authenticated publish-link access updates:
  - `visibility: public | restricted`
  - optional `expires_at`
- immutable published guide snapshots
- public publish-link API:

```http
GET /api/v1/public/publish-links/:slug
```

- public published asset file streaming:

```http
GET /api/v1/public/publish-links/:slug/assets/:asset_id/file
```

- public portal route:

```text
/p/:slug
```

- public guide reader page renders:
  - ordered step blocks
  - header/paragraph/tip/alert/divider blocks
  - snapshotted screenshots
  - screenshot highlight overlays
  - focused screenshot viewer
  - restricted/expired/not-found/malformed/error states
- guide editor publishing panel can:
  - publish
  - republish
  - copy public link
  - open public guide
  - revoke link
  - set visibility
  - set/clear expiry
  - show stale draft cues

Known gaps:

- no embed route in the portal router
- public reader has no embed layout mode
- guide editor publish panel has no copy-embed-code action
- no canonical embed snippet helper
- current public URL helper behavior lives inside `GuideEditorPage.tsx`, so embed URL/code generation should either be extracted into a small tested helper or kept local with focused tests
- no tests proving embed routes share public access behavior
- no docs/status note for public guide embed capability

## Scope

Included:

- add public route:

```text
/p/:slug/embed
```

- update route parser and app routing for public guide embeds
- extend `PublicGuideReaderPage` with an embed mode or create a thin wrapper around it
- embed layout should:
  - remove normal page chrome and large outer spacing
  - keep the published guide document readable inside an iframe
  - keep screenshot rendering and highlight overlays
  - keep focused screenshot viewer only if it behaves correctly inside an iframe
  - keep all public access error states
- add a helper to build a public embed URL from a public URL
- add a helper to build an iframe embed code
- add a “Copy embed code” action to the guide editor publish panel for active public links
- copy embed code through the existing injectable `copyText` path
- show copy success/failure messages distinct from normal link copy
- hide or disable embed copy for restricted, expired, revoked, or missing links
- add focused tests for API-independent helper behavior, route parsing, app routing, public reader embed mode, and guide editor publish controls
- update `docs/project-zoomout-status.md`

Excluded:

- backend schema changes
- new publish-link database columns
- new public publish-link API route unless an implementation gap requires it
- embed-specific publish tokens
- password-protected embeds
- member-only embeds
- signed embed URLs
- iframe auto-resize script
- postMessage integration
- analytics or view tracking
- lead capture
- custom domains
- brand/theme controls
- interactive demo embed support
- public guide SEO/meta work
- changing existing `/p/:slug` page layout
- cross-origin iframe allowlist/admin settings
- custom frame-ancestor policy management

## Product Behavior

### Embed Route

Add:

```text
/p/:slug/embed
```

Examples:

```text
/p/abc123
/p/abc123/embed
```

Both routes should resolve the same publish link through:

```http
GET /api/v1/public/publish-links/:slug
```

The embed route should not expose draft guide data, project IDs, organization IDs, publish IDs, artifact IDs, storage keys, or snapshot JSON.

### Embed Layout

The regular public page can stay as the full reader:

```text
Published guide
Title
Description
Published version/date
Document
```

The embed layout should be more compact:

```text
Title
Description
Document
```

Recommended differences:

- no wide page max-width if iframe is narrow
- smaller outer padding
- no large “Published guide” eyebrow unless it still fits cleanly
- no marketing or portal navigation
- no new cards around the whole document
- keep step numbers and media layout stable
- keep state messages concise:
  - `Published guide was not found.`
  - `This guide is not publicly accessible.`
  - `This guide link has expired.`
  - `Published artifact cannot be displayed.`
  - `Could not load published guide.`

### Embed Code

For a public URL:

```text
http://localhost:3000/p/abc123
```

Build embed URL:

```text
http://localhost:3000/p/abc123/embed
```

Build iframe snippet:

```html
<iframe src="http://localhost:3000/p/abc123/embed" title="Department guide" width="100%" height="720" loading="lazy" style="border:0;"></iframe>
```

Recommended helper:

```ts
const publicGuideEmbedUrl = (publicUrl: string) => {
  const absoluteUrl = publicGuideUrl(publicUrl);
  const url = new URL(absoluteUrl);

  if (!url.pathname.endsWith("/embed")) {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/embed`;
  }

  url.search = "";
  url.hash = "";

  return url.toString();
};

const publicGuideEmbedCode = (input: {
  publicUrl: string;
  title: string;
}) => {
  const escapedSrc = escapeHtmlAttribute(publicGuideEmbedUrl(input.publicUrl));
  const escapedTitle = escapeHtmlAttribute(input.title);

  return `<iframe src="${escapedSrc}" title="${escapedTitle}" width="100%" height="720" loading="lazy" style="border:0;"></iframe>`;
};
```

Use a small escaping helper for iframe attribute values. Do not use unsafe title or URL interpolation.

The embed URL helper should be deterministic:

- `/p/abc123` -> `/p/abc123/embed`
- `/p/abc123/` -> `/p/abc123/embed`
- `/p/abc123/embed` -> `/p/abc123/embed`
- query strings and hashes should be stripped from the generated iframe URL

### Publish Panel UX

For active public links:

```text
Public URL
/p/abc123

[Copy link] [Copy embed code] [Open public guide] [Republish] [Revoke link]
```

Copy behavior:

- `Copy link` keeps current behavior
- `Copy embed code` copies iframe snippet
- success message:

```text
Embed code copied.
```

- failure message:

```text
Could not copy embed code. Select the embed code below.
```

If copy fails, show the generated iframe snippet as selectable text, similar to the current public link copy fallback.

For restricted or expired active links:

- keep public URL/access controls visible as today
- do not show `Copy embed code`, or show it disabled with a clear label
- recommended: hide the copy-embed action until visibility is `public` and not expired

For unpublished guides:

- no embed controls

For revoked/no active link:

- no embed controls

## Routing

Add route type:

```ts
{
  type: "public_guide_embed";
  slug: string;
}
```

Route parser behavior:

```text
/p/abc123/embed
  -> { type: "public_guide_embed", slug: "abc123" }

/p/abc%20123/embed
  -> { type: "public_guide_embed", slug: "abc 123" }
```

Keep current behavior:

```text
/p/abc123
  -> { type: "public_guide_reader", slug: "abc123" }
```

Unsupported:

```text
/p
/p/abc123/extra
/p/abc123/embed/extra
```

Update `App` to render public guide reader in embed mode for `public_guide_embed`.

## Web Components

Likely touched files:

```text
apps/web/src/lib/routes.ts
apps/web/src/lib/routes.test.ts
apps/web/src/App.tsx
apps/web/src/App.test.tsx
apps/web/src/features/guide/PublicGuideReaderPage.tsx
apps/web/src/features/guide/PublicGuideReaderPage.test.tsx
apps/web/src/features/guide/PublicGuideReaderPage.module.css
apps/web/src/features/guide/GuideEditorPage.tsx
apps/web/src/features/guide/GuideEditorPage.test.tsx
docs/project-zoomout-status.md
```

Optional helper extraction if useful:

```text
apps/web/src/features/guide/publishLinks.ts
apps/web/src/features/guide/publishLinks.test.ts
```

Only extract helpers if it keeps `GuideEditorPage.tsx` simpler and testable. Do not create a broad sharing abstraction yet.

## Access Rules

Embed route must follow the same access behavior as `/p/:slug`:

| Link state | `/p/:slug` | `/p/:slug/embed` |
| --- | --- | --- |
| active public | renders snapshot | renders snapshot in embed layout |
| restricted | inaccessible | inaccessible |
| expired | inaccessible | inaccessible |
| revoked | not found | not found |
| missing | not found | not found |
| malformed artifact | malformed state | malformed state |

The implementation should use the same `getPublicPublishLink(slug)` API call and same error mapping. Do not duplicate access logic.

## Tests

Use TDD.

### Route Tests

Add tests in `apps/web/src/lib/routes.test.ts`:

1. parses `/p/abc123/embed`
2. decodes encoded slugs for embed route
3. keeps `/p/abc123` as public guide reader
4. rejects `/p/abc123/embed/extra`

### App Tests

Add tests in `apps/web/src/App.test.tsx`:

1. renders public guide embed route without portal navigation
2. passes decoded slug into `PublicGuideReaderPage`
3. keeps existing public guide reader route behavior unchanged

### Public Reader Tests

Add or extend `PublicGuideReaderPage.test.tsx`:

1. regular mode still renders current published guide layout
2. embed mode renders the same ordered snapshot blocks
3. embed mode uses compact/embed-specific layout marker or accessible state
4. embed mode keeps screenshot images and annotations
5. embed mode maps restricted links to `This guide is not publicly accessible.`
6. embed mode maps expired links to `This guide link has expired.`
7. embed mode maps missing links to `Published guide was not found.`
8. embed mode maps malformed snapshots to `Published artifact cannot be displayed.`

### Publish Helper Tests

If helper file is extracted, add tests:

1. converts `/p/abc123` into absolute `/p/abc123/embed` using current origin
2. preserves already absolute public URLs
3. does not append duplicate `/embed` when given an embed URL
4. strips query strings and hashes from embed URL output
5. escapes iframe title and source attribute values
6. returns deterministic iframe snippet

### Guide Editor Publish Panel Tests

Add tests in `GuideEditorPage.test.tsx`:

1. active public link shows `Copy embed code`
2. clicking `Copy embed code` calls `copyText` with iframe snippet for `/p/:slug/embed`
3. embed snippet title uses guide title and escapes unsafe characters
4. success shows `Embed code copied.`
5. copy failure shows selectable embed snippet guidance
6. restricted active link does not show copy embed action
7. expired active link does not show copy embed action
8. unpublished guide does not show copy embed action
9. existing copy link/open/republish/revoke behavior remains green

### Backend Tests

Backend tests are not expected for the first embed foundation slice because the existing public publish-link API should be reused.

Only add backend tests if implementation requires a server contract change.

If backend changes are needed, add focused tests proving:

1. embed resolution uses the same public access checks as public reader resolution
2. restricted/expired links are not exposed through embed-specific endpoints
3. asset streaming remains constrained to active accessible snapshots

## Implementation Steps

1. Add route tests for `/p/:slug/embed`.
2. Implement `public_guide_embed` route parsing.
3. Add App route test for public embed.
4. Route App to `PublicGuideReaderPage` with embed mode.
5. Add public reader embed-mode tests.
6. Extend `PublicGuideReaderPage` props with `mode?: "page" | "embed"` or `embedded?: boolean`.
7. Add compact embed layout styling while preserving existing page mode.
8. Add publish helper tests for embed URL/code generation.
9. Implement helper functions.
10. Add guide editor publish panel tests for copy embed code.
11. Add copy embed button/action for active public non-expired links.
12. Add copy fallback messaging and selectable embed snippet.
13. Update `docs/project-zoomout-status.md`.
14. Run focused tests.
15. Run full web tests, typecheck, lint, build, and `git diff --check`.

## Suggested Commit Slices

Keep commits small:

1. `docs: plan public guide embed foundation`
2. `feat: route public guide embeds`
3. `feat: add public guide embed layout`
4. `feat: add guide embed copy controls`
5. `docs: update public guide embed status`

Depending on diff size, route and layout may be combined.

## Acceptance Criteria

- `/p/:slug/embed` opens a public guide embed route
- embed route renders the same immutable published guide snapshot as `/p/:slug`
- embed route enforces restricted, expired, revoked, missing, and malformed states like the regular public reader
- public guide reader regular mode remains unchanged
- guide editor publish panel shows `Copy embed code` only for active public non-expired links
- copied embed code points to `/p/:slug/embed`
- iframe snippet uses escaped guide title
- copy failures leave visible/selectable embed code
- no analytics, password sessions, member sessions, or interactive demo behavior are added
- deployment/server headers do not accidentally block iframe embedding for the served web app
- `docs/project-zoomout-status.md` reflects embed foundation

## Verification Commands

Focused:

```bash
rtk pnpm --filter web test -- src/lib/routes.test.ts src/App.test.tsx src/features/guide/PublicGuideReaderPage.test.tsx src/features/guide/GuideEditorPage.test.tsx
```

If helper extraction is used:

```bash
rtk pnpm --filter web test -- src/features/guide/publishLinks.test.ts
```

Broader:

```bash
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

If backend behavior changes:

```bash
rtk pnpm --filter server test
rtk pnpm --filter server run test:db
```

## Risks And Guardrails

- Do not make restricted links embeddable.
- Do not add a second public access path that bypasses publish-link checks.
- Do not expose internal IDs or raw snapshot JSON in embed HTML.
- Do not add tracking scripts or analytics in this slice.
- Do not introduce iframe resizing protocol until there is a real host integration need.
- Do not change regular public reader layout while building embed mode.
- Ensure iframe attribute values are escaped to avoid malformed embed snippets.
- Keep embed code deterministic so docs/tests are stable.
- Recheck deployment headers before calling embed production-ready. If a future server adds `X-Frame-Options: DENY` or restrictive `Content-Security-Policy: frame-ancestors`, the embed route will not work even if the React route does.

## Recommended Next Slice After This

After embed foundation, the strongest next candidates are:

1. password-protected public links or viewer sessions
2. richer export package such as HTML/ZIP-with-images
3. guide capture/GIF block support
4. interactive demo foundation

Recommended next slice after this:

```text
051-public-guide-password-viewer-session.md
```
