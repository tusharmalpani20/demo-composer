# Guide Publish Controls Polish Plan

Date: 2026-06-11

Status: Implemented; legacy status normalized on 2026-07-07.

## Goal

Make the guide publishing workflow easier to understand and use after the basic portal controls from `033` are in place.

Target flow:

```text
user opens project guides
  -> user can see which guides are published
  -> user opens a guide editor
  -> editor clearly shows current public-link state
  -> editor makes republish/revoke/copy/open behavior obvious
  -> user can tell when the draft changed after the last publish
```

This slice should improve confidence around the existing public guide workflow. It should not add passwords, expiry, analytics, embed, viewer sessions, custom domains, or public interactive demos.

## Why This Comes Next

Current state after `033`:

- backend supports authenticated guide publish status, publish/republish, and revoke
- guide editor can publish, republish, open, copy, and revoke public guide links
- public `/p/:slug` guide reader is working
- project guide list exists, but does not show publish status
- editor publish panel is functional but basic

Remaining product gap:

- users must open each guide editor to know if a guide is already public
- users do not get a clear stale-draft cue after editing a published guide
- publish panel copy/actions can be clearer
- copy/open/revoke states are functional but not polished
- guide list does not give a fast "open public guide" path for already published guides

This is the smallest product-quality pass before moving into guide content editing or larger sharing/access features.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/project-zoomout-status.md
docs/system-design-pattern.md
docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md
docs/plan/031-guide-publish-foundation.md
docs/plan/032-public-guide-reader.md
docs/plan/033-portal-guide-publish-controls.md
```

Important implications:

- published guide links resolve to immutable snapshots
- draft guide edits do not change public output until republish
- republish keeps the active slug and creates a new snapshot version
- revoked links should not appear as active public links
- public guide URLs remain path-based as `/p/:slug`
- keep publishing public-only for now
- keep guide editor as the source of truth for publish mutations

## Scope

Included:

- show publish status in the project guide list
- show an `Open public guide` action in guide list for active links
- improve guide editor publish panel wording and layout
- add a stale-published cue when the draft guide was updated after the active published artifact
- make copy/open/revoke/republish busy states clearer
- improve fallback copy behavior so the visible URL is easy to select
- keep publish status load failures isolated from normal guide list/editor use
- update focused web tests
- update `docs/project-zoomout-status.md`

Excluded:

- backend publish domain changes unless a small read-model endpoint is required
- password-protected links
- expiry
- invite-only/internal-only links
- custom domains
- embed code generation
- analytics/view counts
- public demo publishing
- guide content block creation tools
- public reader visual redesign
- AI/BYO-key behavior

## Recommended Approach

Start with the lowest-risk route:

1. Add guide-list publish status using existing authenticated status endpoint calls per visible guide.
2. Keep publish mutations in the guide editor only.
3. Add stale-published detection in the editor by comparing `guide.updated_at` against `published_artifact.published_at`, plus a local dirty-after-publish marker for successful editor mutations that do not return a refreshed guide timestamp.
4. Improve panel copy and labels without changing backend contracts.

Do not add a new backend list read model unless per-guide status requests become clearly awkward in code or tests.

Reasoning:

- project guide lists are currently small enough for the MVP
- this avoids prematurely expanding backend contracts
- it keeps the polish slice mostly frontend-only
- if list performance becomes a real issue, a later backend read model can return guide rows with publish status in one response

## Guide List UI

Primary integration point:

```text
/projects/:project_id/guides
```

Add a publish-status column or compact status area per guide row/card.

Recommended states:

```text
Checking...
Not published
Published
Could not check
```

For active published guides:

```text
Published
[Open public guide]
```

Rules:

- use `getGuidePublishStatus(projectId, guide.id)` for each guide row
- expose this as an injectable `loadPublishStatus` prop on `ProjectGuideListPage` for focused tests
- keep status state in a map keyed by guide id
- do not block rendering the guide list while status requests are loading
- status failure for one guide should not hide or break the list
- ignore stale status responses after project id or guide list changes
- open links should use `publish_link.public_url`
- no publish/republish/revoke controls in the list for this slice
- do not show raw publish ids, artifact ids, slugs, org ids, or snapshot data
- render published status for any guide with an active publish link, even if the guide row itself is archived

Testing:

- list renders guides immediately while publish status loads
- published guides show `Published` and an `Open public guide` link
- unpublished guides show `Not published`
- failed status checks show `Could not check`
- publish status requests use the current project id and each guide id
- status responses from an old project/list do not overwrite the current list state
- no raw internal ids are exposed in the list status UI

## Editor Publish Panel Polish

Primary integration point:

```text
/projects/:project_id/guides/:guide_id
```

Improve the existing panel from `033`.

Recommended published state:

```text
Public guide is live
Published version 2 on Jun 11, 2026, 12:00 AM
/p/abc123
[Copy link] [Open public guide] [Republish] [Revoke link]
```

Recommended unpublished state:

```text
This guide is not published.
Publishing creates a public read-only snapshot.
[Publish guide]
```

Recommended stale state:

```text
Draft has changes not yet published.
[Republish]
```

Stale detection:

- if `detail.guide.updated_at` is newer than `published_artifact.published_at`, show a stale cue
- after successful guide metadata save, step save, block reorder, or block delete, show the stale cue when there is an active published artifact
- after successful publish/republish, clear the local stale cue because the returned artifact is the current public snapshot
- if timestamps are missing or invalid, do not show stale cue
- keep this as a simple hint, not a strict validation rule
- do not diff draft blocks against snapshot JSON in this slice

Busy states:

- while publishing: `Publishing...`
- while republishing: `Republishing...`
- while revoking: `Revoking...`
- while copying: `Copying...`
- only disable publish panel controls for publish-panel actions
- do not disable metadata or step editing while publish-panel actions are running

Copy fallback:

- keep the public URL visible in the panel
- if copy fails, show `Could not copy public link. Select the URL above.`
- tests should continue using injectable `copyText`

Testing:

- published panel shows clearer live-link copy and date/version details
- stale cue appears when guide `updated_at` is newer than published artifact `published_at`
- stale cue does not appear for older or equal draft timestamps
- stale cue appears after successful metadata, step, reorder, or delete mutations on an already published guide
- stale cue clears after successful republish
- publish/republish/revoke/copy buttons show action-specific busy labels
- copy failure tells the user to select the visible URL
- editor editing controls remain enabled during publish-panel actions

## API And Type Impact

Prefer no API shape changes.

Use existing helpers from `033`:

```text
getGuidePublishStatus(projectId, guideId)
publishGuide(projectId, guideId)
revokeGuidePublishLink(projectId, guideId)
```

If list code becomes too noisy, extract a small web-only helper:

```text
loadGuidePublishStatuses(projectId, guides)
```

This helper should live in the web feature layer, not the shared API client, unless it maps directly to a backend route.

Do not add backend route changes in this slice unless the frontend implementation proves too brittle.

## Testing Plan

Use TDD.

Guide list tests:

- renders list before publish statuses finish loading
- loads status for every guide
- renders active public-link status and open link
- renders unpublished status
- renders per-row status failure without breaking the page
- ignores stale status responses after the project id or guide rows change
- does not expose publish ids, artifact ids, snapshot JSON, or org user ids

Guide editor tests:

- renders improved unpublished copy
- renders improved published/live copy
- shows published version/date and public URL
- shows stale cue when draft was updated after publish
- hides stale cue when publish is current
- marks a published guide stale after successful metadata, step, reorder, and delete actions
- clears the local stale marker after successful republish
- shows action-specific busy labels
- keeps metadata and step editing enabled during publish-panel busy states
- shows selectable URL guidance when copy fails
- preserves existing publish, republish, revoke, copy, and retry behavior

Regression tests:

- `GuideEditorPage.test.tsx`
- `ProjectGuideListPage.test.tsx`
- `api.test.ts` only if API helper behavior changes

## Implementation Order

1. Add failing project guide list tests for publish status rendering.
2. Implement guide-list publish status loading and per-row states.
3. Add failing project guide list tests for stale response protection.
4. Implement stale response protection.
5. Add failing guide editor tests for improved copy and timestamp-based stale cue.
6. Implement editor panel wording, timestamp stale cue, and busy labels.
7. Add failing tests for local stale markers after editor mutations.
8. Implement local stale marker and clear it after republish.
9. Add failing tests for copy fallback wording and editing-not-blocked behavior.
10. Implement copy fallback and control-state refinements.
11. Update `docs/project-zoomout-status.md`.
12. Run focused tests.
13. Run full verification.

## Verification Commands

```bash
rtk pnpm --filter web test -- ProjectGuideListPage GuideEditorPage
rtk pnpm --filter web test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
```

Server tests are not required unless backend publish contracts change.

If backend route/read-model changes become necessary, also run:

```bash
rtk pnpm --filter server test -- publish guide
rtk pnpm --filter server test:db
```

## Acceptance Criteria

- Project guide list shows publish status for each guide.
- Published guides can be opened publicly from the guide list.
- Guide list still renders if publish status loading fails.
- Guide editor clearly distinguishes unpublished, live, stale, busy, and error states.
- Draft edits after publish show a republish-needed cue.
- Successful republish clears the republish-needed cue.
- Copy failure gives a useful fallback instruction.
- Publish-panel actions do not lock normal guide editing controls.
- No raw internal publish ids, storage keys, org user ids, or snapshot JSON are exposed.
- Existing guide editor, guide list, private preview, and public reader behavior remain green.
- Focused tests and full verification pass.

## Risks And Tradeoffs

- Per-guide publish status requests are simple but may become noisy for large guide lists. Accept this for the MVP and revisit with a backend read model only when needed.
- Timestamp-based stale detection is an approximation. It is good enough for a cue, but not a proof that public content differs from draft content.
- Keeping mutations out of the guide list adds one extra click for publishing, but avoids row-level destructive actions and keeps the list easy to scan.
- Improving copy and panel wording is useful now, but full sharing settings should wait until access modes are designed.

## Recommended Commit Shape

```text
test: cover guide list publish status
feat: show guide list publish status
test: cover guide publish polish states
feat: polish guide publish controls
docs: update publish polish status
```

## Next Slice After This

After this plan is implemented, the next recommended slice is:

```text
docs/plan/035-guide-editor-content-block-tools.md
```

That slice should start making the Scribe-like guide editor more complete by adding UI for non-step blocks such as headers, paragraphs, tips, alerts, dividers, and screenshot/capture blocks.
