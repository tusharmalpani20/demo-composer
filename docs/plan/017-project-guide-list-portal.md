# Project Guide List Portal Plan

Date: 2026-06-05

## Goal

Make created guides discoverable inside the portal:

```text
authenticated portal user
  -> opens /projects/:project_id/guides
  -> sees project guides
  -> clicks a guide
  -> opens the guide editor
```

This builds on the first end-to-end workflow:

```text
capture session detail
  -> create guide
  -> guide editor
```

The goal is not a full project dashboard. The goal is a practical internal list page so users can find draft and archived guides without saving direct URLs.

## Why This Comes Next

Current state:

- backend can list project guides with `GET /api/v1/projects/:project_id/guides`
- portal can create a guide from a capture session
- portal redirects to the guide editor after creation
- portal can edit a guide when opened by direct URL

Missing product behavior:

- users cannot rediscover guides from the portal
- created guide URLs are the only navigation path
- archived/draft guide visibility is not represented in the UI
- there is no project-level guide index

This slice should add the smallest useful list surface without adding new backend behavior.

## Existing Decisions To Honor

Relevant docs:

```text
docs/adr/0002-capture-sessions-are-source-material.md
docs/adr/0004-guide-blocks-with-first-class-steps.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/adr/0013-ai-deferred-from-day-one-mvp.md
docs/adr/0014-rest-fastify-zod-openapi-api-style.md
docs/plan/013-create-guide-from-capture.md
docs/plan/015-guide-editor-portal.md
docs/plan/016-create-guide-from-capture-portal.md
```

Important implications:

- guide rows are editable document artifacts
- capture sessions remain source material
- no AI layer in this slice
- no public sharing/publishing in this slice
- file storage internals must not appear in the browser
- raw typed input values must not appear in the browser
- keep the current lightweight route parser instead of adding React Router
- use cookie-backed requests with `credentials: "include"`

## Scope

Included:

- portal route `/projects/:project_id/guides`
- API client helper for listing project guides
- project guide list page under `apps/web/src/features/guide`
- loading state
- unauthenticated state
- not-found state for missing/inaccessible project
- generic error state with retry
- empty-state message when no guides exist
- list rows/cards for draft and archived guides
- title, description, status, source capture session, created time, updated time
- link/open action to `/projects/:project_id/guides/:guide_id`
- frontend tests for route parsing, API helper, page states, rendering, and App routing

Excluded:

- backend changes
- project dashboard
- project selector
- project settings
- guide creation form
- create guide button on the list page
- capture-session list page
- manual blank guide creation
- bulk actions
- guide archive/delete actions
- filtering/search/sorting controls
- pagination
- public guide viewer
- publishing/share links
- analytics
- comments/collaboration
- Chrome extension changes
- desktop app
- AI layer

## Backend Contract

Backend route already exists:

```text
GET /api/v1/projects/:project_id/guides
```

Success:

```json
{
  "guides": [
    {
      "id": "guide_id",
      "organization_id": "organization_id",
      "project_id": "project_id",
      "source_capture_session_id": "capture_session_id",
      "title": "Create department workflow",
      "description": null,
      "status": "draft",
      "created_by_id": "org_user_id",
      "updated_by_id": "org_user_id",
      "version": 1,
      "created_at": "2026-06-05T10:00:00.000Z",
      "updated_at": "2026-06-05T10:00:00.000Z"
    }
  ]
}
```

Ordering is backend-owned:

```text
created_at DESC, id DESC
```

Frontend must render the response order as-is. Do not reorder client-side in this slice.

Error mapping:

```text
401 unauthenticated
404 project_not_found
```

## Route Contract

Add route:

```text
/projects/:project_id/guides
```

Existing guide editor route remains:

```text
/projects/:project_id/guides/:guide_id
```

Route parsing:

```ts
{ type: "project_guide_list", projectId: string }
```

Routing requirements:

- parse the list route as `segments.length === 3`
- keep the existing detail route as `segments.length === 4`
- treat `/projects/:project_id/guides/` as the list route because the current parser removes empty path segments
- keep route parsing in `apps/web/src/lib/routes.ts`
- add tests in `apps/web/src/lib/routes.test.ts`
- wire route in `apps/web/src/App.tsx`
- add App route test in `apps/web/src/App.test.tsx`
- update unsupported-route copy so it mentions capture sessions, guide lists, and guide links

## API Client Work

Add to:

```text
apps/web/src/lib/api.ts
apps/web/src/lib/api.test.ts
```

Function:

```ts
export type ProjectGuideListResponse = {
  guides: Guide[];
};

export const listProjectGuides = async (
  projectId: string
): Promise<ProjectGuideListResponse>
```

Request:

```text
GET /api/v1/projects/:project_id/guides
```

Requirements:

- use shared `requestJson`
- use `credentials: "include"`
- send `accept: application/json`
- encode project ID
- preserve backend `error.type` through `ApiClientError`
- no ad hoc fetch/error parsing in React components

API tests:

- sends correct URL, credentials, and headers
- returns guide list response
- maps `project_not_found` to `kind: "not_found"`

## Page Work

Create:

```text
apps/web/src/features/guide/ProjectGuideListPage.tsx
apps/web/src/features/guide/ProjectGuideListPage.test.tsx
apps/web/src/features/guide/ProjectGuideListPage.module.css
```

Props:

```ts
type ProjectGuideListPageProps = {
  projectId: string;
  loadGuides?: (projectId: string) => Promise<ProjectGuideListResponse>;
};
```

Default:

```ts
loadGuides = listProjectGuides
```

State model:

```ts
loading
loaded
unauthenticated
not_found
error
```

State behavior:

- loading: `Loading guides...`
- unauthenticated: `Sign in to view guides.`
- not found: `Project was not found.`
- generic error: `Could not load guides.` plus retry button
- empty loaded state: `No guides yet.`

## List UI

This is an internal operational list, not a marketing page.

Layout:

```text
top app bar
  Demo Composer
  project / guides context

main
  header
    Guides
    project id context

  list
    guide row
      title
      description if present
      status badge
      source capture session if present
      updated time
      created time
      Open action/link
```

Rendering requirements:

- show guide title
- show description only when non-empty
- show status badge for `draft` and `archived`
- show `Source capture: <source_capture_session_id>` when present
- show `No source capture` when `source_capture_session_id` is null
- show created and updated timestamps with the same local date formatting style used by current portal pages
- each guide should link to `/projects/:project_id/guides/:guide_id`
- use normal anchor links for open actions so browser behavior is predictable
- link text should be `Open guide <title>` for accessible navigation
- encode project and guide IDs in generated URLs
- do not show organization IDs, creator IDs, updater IDs, versions, or storage internals

## UX Direction

Keep it quiet and dense:

- no hero
- no marketing copy
- no decorative graphics
- no nested cards
- no filters/search until the list is large enough to need them
- no create button until manual guide creation or capture listing exists

The page should feel like an index in an internal tool: scannable, direct, and predictable.

## Edge Cases

Handle:

- empty list
- archived guide in list
- guide without description
- guide without source capture session
- project not found
- unauthenticated request
- generic network/server failure with retry

Do not handle yet:

- pagination
- large-list virtualization
- search
- status filtering
- sorting controls
- deleting or archiving from the list
- showing guide block counts
- showing source capture names instead of IDs

## Testing Plan

Follow test-driven development.

1. Route tests:
   - add red test for `/projects/project_1/guides`
   - keep existing guide detail route test green

2. API helper tests:
   - add red test for `listProjectGuides`
   - implement helper

3. Page tests:
   - renders loaded guides in backend response order
   - renders empty state
   - renders unauthenticated and not-found states
   - renders generic error and retry
   - guide rows link to encoded editor route
   - private/internal fields are not rendered
   - guides without description/source capture render clean fallback text

4. App test:
   - `/projects/project_1/guides` renders the list page
   - unsupported route fallback mentions guide lists

Suggested commands:

```text
pnpm --filter web test -- src/lib/routes.test.ts src/lib/api.test.ts src/features/guide/ProjectGuideListPage.test.tsx src/App.test.tsx
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

## Implementation Order

1. Add route parser red test.
2. Implement `project_guide_list` route parsing.
3. Add API helper red test.
4. Implement `listProjectGuides`.
5. Add project guide list page red test for loaded list.
6. Implement minimal page.
7. Add page tests for empty/error/auth/not-found/retry/private-field behavior.
8. Wire route in `App`.
9. Add App route test.
10. Run focused tests.
11. Run full web verification.
12. Commit as a small feature slice.

## Acceptance Criteria

- `/projects/:project_id/guides` opens a portal guide list page
- page fetches `GET /api/v1/projects/:project_id/guides`
- guide list renders in backend response order
- each guide can be opened in the existing guide editor route
- generated guide editor links URL-encode IDs
- empty projects show `No guides yet.`
- unauthenticated, not-found, and generic error states are clear
- generic error state supports retry
- private org/user/version/storage fields are not rendered
- no backend behavior changes are required
- all web tests, typecheck, lint, and build pass
