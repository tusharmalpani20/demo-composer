# Project Version And Artifact Edition Grill Session

Date: 2026-07-10

Status: Complete.

## Scope

This grill session resolves the product language, lifecycle, ownership, authoring history, publication behavior, permissions, URLs, migration strategy, relational persistence, and comprehensive audit/access rules needed to add Project Versions and version-aware artifacts.

Starting documents:

- `CONTEXT.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
- `docs/adr/0002-capture-sessions-are-source-material.md`
- `docs/adr/0003-immutable-capture-source-records.md`
- `docs/adr/0006-publish-links-resolve-to-immutable-snapshots.md`
- current PostgreSQL migrations through `014_org_member_invites.sql`

Existing implementation facts that constrain this grill:

- Every current Capture Session, Guide, Interactive Demo, Published Artifact, and Publish Link belongs directly to one Project.
- Mutable Project, Capture, Guide, Guide Block, Guide Step, Interactive Demo, and Demo Scene rows use a `version` integer as an optimistic-concurrency counter.
- `publish_schema.published_artifact.version_number` is the current sequence number for immutable publication snapshots.
- Existing Publish Links resolve to immutable Published Artifacts and must not become live draft pointers.
- Capture Events and original Capture Assets remain immutable source material.

Delivery-stage assumption accepted during the session:

- The repository is pre-live: there are no production records, external API clients, or public links that require data-preserving migration compatibility.
- Development/test databases may be reset and reseeded for the clean Project Version/Artifact Edition model.
- All in-repo apps, contracts, tests, fixtures, and docs must move to the new model together.

Session rules:

- Resolve one consequential decision at a time.
- Inspect the repository instead of asking questions that code or existing docs can answer.
- Update `CONTEXT.md` immediately when domain language is accepted.
- Create ADRs only for hard-to-reverse, surprising tradeoff decisions.
- Do not write migrations or runtime implementation during the grill.

## Questions

### Q1. What does a Project Version represent?

Recommended answer:

A Project Version represents a meaningful release state or maintained release line of exactly one Project. It does not represent an audience, permission group, deployment environment, or arbitrary content folder.

Examples:

```text
Project: Acme ERP
Project Versions:
- Main
- 1.4
- 2.0
- 2.1 Beta
```

Boundary examples:

- `Internal employees`, `Customers`, `Administrators`, and `Sales team` are audiences or permission groups, not Project Versions.
- `Public` is an access mode, not a Project Version.
- `Staging` is a deployment environment, not a Project Version.
- Hosted/on-premises may use separate Project Versions only if they are genuinely independently maintained release lines. Otherwise, they require a later variant concept or separate Projects.
- `/api/v1` is an API version and is unrelated to Project Version.

Reasoning:

- A narrow definition makes version-aware Guides, Interactive Demos, Documentation, URLs, carry-forward, and search predictable.
- Mixing audiences or environments into the same axis would create ambiguous artifact ownership and permissions.
- Audience and access needs can evolve independently without multiplying release records.
- The definition matches the product goal of maintaining knowledge for different states of one Project.

Status:

Accepted. **Project Version** is a release context for one Project. It is not an audience, permission group, deployment environment, arbitrary content folder, API version, or authored artifact revision.

Decision records:

- `CONTEXT.md`
- This grill record

Resolved later in this session:

- Hosted/on-premises/environment variants do not overload Project Version; concrete variant modeling is a future phase under Q40.

### Q2. How is a Project Version identified?

Recommended answer:

Use three distinct identifiers:

```text
id:   internal immutable identifier
name: user-facing free-form display name
slug: stable URL-safe identifier scoped to one Project
```

Do not require semantic versioning.

Valid display names include:

```text
1.4
2.1 Beta
2026 Q3
July 2026
Main
Cloud 2026.07
```

Rules:

- The internal ID is immutable and used for reliable relationships.
- The name is required, trimmed, and intended for people.
- The slug is required and unique within one Project.
- The slug is generated from the name by default and can be reviewed before creation.
- Name and slug length limits must be explicit in the implementation plan.
- Project Version names do not have to follow semantic versioning.
- Optional semantic-version metadata may be added later without controlling the core model.
- Slug mutation and redirect behavior is resolved by Q13 through permanent, non-reusable Project Version Aliases.

Reasoning:

- Organizations use semantic releases, calendar releases, release trains, and named versions.
- A free-form name supports those real release practices without weakening database identity.
- A separate slug provides readable URLs without treating display text as a stable key.
- Project-scoped slug uniqueness is sufficient because the containing Project already provides ownership and route context.

Status:

Accepted. A **Project Version** has an immutable internal ID, a free-form user-facing name, and a stable URL-safe slug scoped to its Project. Semantic-version formatting is not mandatory.

Decision records:

- `CONTEXT.md`
- This grill record

### Q3. Should every Project always have a default Project Version?

Recommended answer:

Yes. Every Project must have exactly one active default Project Version.

Initial behavior:

```text
New Project
  -> Project Version: Main
     slug: main
     is_default: true
```

Rules:

- `Main` is a real Project Version, not a moving alias to the newest version and not a Git branch.
- Default status is an explicit property; it is not inferred by comparing the name with `Main`.
- `Main` is the initial display name, not a permanently reserved name.
- A team may later select another active Project Version as default.
- A default Project Version cannot be archived or removed until another active Project Version becomes default in the same transaction.
- All new API/client flows provide or deliberately resolve Default Project Version context.
- Changing the default never moves an existing Capture Session or artifact Edition to another Project Version.
- Once a Capture Session starts, its Project Version remains explicit and independent of later default changes.

Reasoning:

- Every newly created Project receives one deterministic initial version context.
- Teams that do not need named releases avoid unnecessary setup and version-management ceremony.
- Captures and artifacts never become versionless.
- APIs and navigation always have a safe initial context.
- An explicit default invariant avoids giving the `Main` label hidden pointer behavior.
- `Main` is familiar to software teams and more clearly describes the primary rolling release line than the temporal word `Current`.

Status:

Accepted, with the initial label revised after discussion. Every **Project** has exactly one active **Default Project Version**. New Projects initially use a real Project Version named `Main`; it is neither a moving alias nor a Git branch.

Decision records:

- `CONTEXT.md`
- This grill record

### Q4. How visible is Project Version context for teams using only Main?

Recommended answer:

Project Version context is always visible, but version-management controls remain quiet until a Project has multiple active versions.

With one active version:

```text
Acme ERP / Main
```

- Show `Main` as compact breadcrumb or header context.
- Select it automatically when entering the Project.
- Do not force the user through a version-selection screen.
- Keep create/manage/archive actions in Project settings or a compact version menu.
- Do not add a large version-management panel to every workspace page.

With multiple active versions:

```text
Acme ERP / 2.0 [selector]
```

- The same compact context becomes an interactive selector.
- Clearly identify the Default Project Version.
- Separate active and archived versions.
- Switching versions changes workspace context explicitly.
- Preserve the selected version while navigating within the Project.

Boundaries:

- Capture and artifact creation show which Project Version will own the result.
- The Chrome extension may auto-select the only active version, but it still displays `Main`.
- Editors always show their Edition's Project Version.
- Changing selected context never moves existing content.
- Archived versions never silently become creation targets.

Reasoning:

- Simple teams avoid version-management ceremony.
- Visible context prevents content from being created under an unexpected release.
- The same information architecture can grow from one to many versions without a later navigation rewrite.

Status:

Accepted. Project Version context is always visible but compact. Full selector and management behavior becomes prominent only when multiple Project Versions exist.

Decision records:

- `CONTEXT.md`
- This grill record

### Q5. Can one Artifact have multiple Editions for the same Project Version?

Recommended answer:

No. In V1, one Artifact may have at most one Edition for each Project Version.

```text
Guide Artifact: Configure SSO
  -> Main Edition
       -> Revision 1
       -> Revision 2
       -> Revision 3
  -> 2.0 Edition
       -> Revision 1
       -> Revision 2
```

Invariant:

```text
unique(artifact_id, project_version_id)
```

Rules:

- An Artifact may have no Edition for a particular Project Version.
- An Artifact may have exactly one Edition when it has content for that Project Version.
- An Edition may have many immutable authoring Revisions.
- Carry-forward creates the missing Edition for the target Project Version.
- Repeated carry-forward cannot create duplicate target Editions.
- Archiving an Edition does not permit a replacement Edition for the same Artifact/Project Version pair; restore the existing Edition instead.
- Alternative audience-specific content becomes a separate Artifact in V1 rather than a parallel Edition under the same Artifact and Project Version.

Reasoning:

- One Edition per pair makes ownership, URLs, carry-forward, search, and publication deterministic.
- Multiple Revisions still preserve authoring history within the release context.
- Separate Artifacts remain available for independently maintained content.
- A later variant dimension can be added if real use cases prove that separate Artifacts are insufficient.

Status:

Accepted. An **Artifact** has at most one **Artifact Edition** for each **Project Version**. An Artifact Edition may have many immutable **Artifact Revisions**.

Decision records:

- `CONTEXT.md`
- This grill record

### Q6. Can multiple independent Artifact Editions have the same title?

Current implementation fact:

The current Guide and Interactive Demo schemas do not enforce title uniqueness. Existing behavior already permits duplicate titles.

Recommended answer:

Yes. Artifact Edition titles remain mutable, non-unique display text. Immutable Artifact IDs provide cross-version identity.

Examples:

```text
Guide: Getting Started
Guide: Getting Started
Interactive Demo: Getting Started
```

Rules:

- Artifact identity never owns or depends on title.
- Changing an Edition title does not change Artifact identity.
- Carry-forward creates an Edition under the same Artifact; a matching title does not create or identify an Artifact.
- Future URL slugs have separate uniqueness and redirect rules.
- Lists and search results disambiguate with Artifact type, description, Project Version coverage, update time, and ownership information where useful.
- The UI may warn about an exact duplicate title but does not block creation solely because of the title.
- No case-insensitive unique-title database constraint is introduced.

Reasoning:

- Common names such as `Overview`, `Installation`, and `Getting Started` naturally repeat.
- Title uniqueness would encourage awkward names containing internal disambiguators.
- Non-unique labels keep identity and user-facing wording independent.
- Stable identity, URLs, and Publications must not depend on mutable labels.

Status:

Accepted and clarified by Question 21. Independent Artifact Editions may share a title. Titles are mutable Edition-owned display labels; immutable Artifact IDs provide cross-version identity.

Decision records:

- `CONTEXT.md`
- This grill record

### Q7. How are shared Capture Assets protected from deletion?

Current implementation fact:

The current Capture Asset delete path soft-deletes both `capture_schema.capture_asset` and its `file_schema.file`. Guide/editor/export queries exclude deleted assets or files, and public Publication streaming excludes a deleted File. An asset deletion can therefore break existing authored or published content today.

Recommended answer:

Use protected shared assets. Archiving controls future selection and normal library visibility; it does not invalidate existing references. Physical file purge is blocked while any authored working state, Artifact Revision, or Published Artifact references the asset.

Rules:

- Archiving a Capture Asset hides it from new selection and ordinary asset-library results.
- Existing Artifact Editions, Artifact Revisions, exports, and Publications continue resolving an archived referenced asset.
- A referenced File cannot be physically purged.
- Purge performs a reference check across mutable authored state, immutable Revisions, and immutable Publications.
- A failed purge returns actionable dependency information rather than silently breaking references.
- Storage cleanup may purge bytes only after no protected reference remains and the accepted retention policy permits it.
- Sensitive-data removal uses an explicit destructive workflow: replace/remove authored references, revoke or replace affected Publications, and only then purge the asset/file.
- Carry-forward may reuse a protected immutable Capture Asset within the same Project without duplicating its stored bytes.
- The implementation must correct current Guide/Demo/export/public-stream resolution behavior; a carry-forward-only guard is insufficient.

Reasoning:

- Duplicating every screenshot for every Edition wastes storage and still leaves deletion semantics unclear.
- Immutable Publications must not lose media because a source-library item was archived later.
- Archive and purge are different product actions and require different safety rules.
- Reference protection makes shared immutable assets safe for Guides, Interactive Demos, Revisions, Publications, and future Documentation.

Status:

Accepted. Referenced Capture Assets are protected shared assets. Archiving hides them from new selection, while physical purge is blocked as long as any authored working state, Artifact Revision, or Published Artifact references them.

Decision records:

- `CONTEXT.md`
- This grill record

ADR note:

- This is an ADR candidate because the retention rule is hard to reverse, affects storage and public-link correctness, and chooses reference protection over per-Edition binary duplication. Final ADR scope and numbering will be decided after the related carry-forward decisions settle.

### Q8. How many source Project Versions can one carry-forward operation use?

Recommended answer:

Use one source Project Version and one target Project Version per carry-forward operation. Let the user select multiple Artifacts from that source.

```text
Target Project Version: 2.0
Source Project Version: Main

Selected Artifacts:
[x] Guide: Getting Started
[x] Guide: Configure SSO
[ ] Guide: Legacy Installation
[x] Interactive Demo: User Onboarding
```

Rules:

- One carry-forward operation has exactly one source Project Version and one target Project Version.
- The source and target belong to the same Project and cannot be the same Project Version.
- The user may select multiple Artifacts and artifact types from the source.
- Each selected Artifact contributes its Edition from the selected source Project Version.
- Each resulting target Edition records exactly one immediate source Edition as lineage.
- The operation does not combine Editions from multiple source Project Versions.
- The product offers one carry-forward behavior, not copy/link/inherit/synchronize modes.
- Existing target Editions are never overwritten.
- An archived source Project Version may be used when the user has permission to read it.
- A later separate operation may carry a different Artifact from another source Project Version, but every resulting Edition still has one unambiguous immediate source Edition.

Reasoning:

- Users can migrate many related Artifacts efficiently without learning storage semantics.
- One source per operation avoids merge ordering and conflict-resolution behavior.
- Per-Edition lineage remains precise even when a target Project Version eventually contains Editions carried from different historical versions.
- Disallowing overwrite protects already-authored target content.

Status:

Accepted. One **Carry-Forward** operation uses one source Project Version and one target Project Version, permits multiple selected Artifacts, and gives each resulting Artifact Edition exactly one immediate source Edition.

Decision records:

- `CONTEXT.md`
- This grill record

### Q9. What data does Carry-Forward copy?

Recommended answer:

Create an independent copy of Edition-owned editable content while sharing protected immutable assets.

Copied into new records:

- Edition-owned title and description where applicable.
- Guide Blocks, Guide Steps, and Guide Annotations.
- Demo Scenes, Demo Hotspots, and Demo Transitions.
- Other editable settings owned by the source Edition.

Copied records receive:

- New IDs.
- Reset optimistic Row Versions.
- New creation and audit timestamps attributed to the actor performing Carry-Forward.
- Draft lifecycle state.
- Lineage to the source Edition and source Artifact Revision when one exists.

Shared without binary duplication:

- Protected Capture Assets.
- Screenshot Files.
- Other immutable media.

Not copied:

- The stable Artifact identity; the target Edition remains under the same Artifact.
- Original Capture Sessions and Capture Events.
- Published Artifacts and Publish Links.
- Password or access configuration.
- Viewer sessions or analytics.
- Archive/deletion state.

Independence rule:

```text
Editing Main does not change 2.0
Editing 2.0 does not change Main
```

There is no later synchronization, live inheritance, or merge.

Reasoning:

- Independent records make editing, authorization, revision history, and publishing predictable.
- Protected shared assets avoid expensive binary duplication without allowing archive/purge to break content.
- Reset draft and audit state makes the new Edition's lifecycle explicit.
- Lineage preserves provenance without coupling later edits.

Status:

Accepted. **Carry-Forward** copies Edition-owned editable structures into independent draft records, reuses protected immutable media, resets identity/audit/concurrency state, records source lineage, and never synchronizes later changes automatically.

Decision records:

- `CONTEXT.md`
- This grill record

ADR note:

- Carry-Forward and protected shared-asset retention should likely be recorded together or in coordinated ADRs after the remaining lifecycle and Revision decisions settle.

### Q10. Does creating a newer Project Version make older versions read-only?

Recommended answer:

No. Creating or releasing another Project Version never freezes an existing Project Version automatically. Any non-archived Project Version remains editable.

Example:

```text
Default Project Version: 2.0

Maintained Project Versions:
- 1.4
- 1.8 LTS
- 2.0
```

Rules:

- A non-archived Project Version may receive edits according to normal permissions.
- Editing an older Artifact Edition does not update newer Editions.
- Editing an older Artifact Edition does not mutate an existing immutable Publication.
- Republishing is explicit and creates another immutable Publication.
- The UI clearly identifies when a user is editing a non-default Project Version.
- An archived Project Version is read-only and cannot receive new Captures, Artifact Editions, or authoring changes.
- Restoring an archived Project Version makes it editable again, subject to permissions.
- Corrections made after Carry-Forward never propagate automatically.
- Relative age is not inferred from free-form names or semantic-version parsing; explicit lifecycle state controls editability.

Reasoning:

- Teams often maintain older or LTS releases after a newer release exists.
- Explicit archive state is predictable for free-form version names.
- Immutable Publications remain stable while allowing deliberate corrections and republishing.
- Automatic freezing or propagation would surprise users and require ordering/merge semantics.

Status:

Accepted. Older non-archived Project Versions remain editable until explicitly archived. Creating or releasing another Project Version does not change their editability.

Decision records:

- `CONTEXT.md`
- This grill record

### Q11. Which lifecycle states do Project Versions and Artifact Editions have?

Recommended answer:

Keep V1 lifecycle states minimal and keep Publication separate from authoring lifecycle.

Project Version:

```text
active
archived
```

- `active`: may receive Captures, Artifact Editions, edits, and Publications.
- `archived`: read-only and unavailable as a creation target.
- The Default Project Version must be active.
- Archiving does not rewrite each child Edition's own lifecycle state.
- Existing Publications remain accessible.
- Restoring makes the Project Version active again and exposes its prior child states.

Artifact Edition:

```text
draft
archived
```

- `draft`: mutable authored working state, including when immutable Publications already exist.
- `archived`: read-only and cannot create new Revisions or Publications.
- Existing Publications remain accessible.
- Restoring returns the Edition to `draft`.

Not V1 lifecycle states:

```text
released
published
superseded
deprecated
scheduled
```

Reasoning:

- Existing Guide and Interactive Demo schemas already use `draft | archived`.
- Publication is an immutable record and must not be collapsed into Edition lifecycle.
- `released` and `superseded` would require ordering and release-management rules that free-form Project Version names do not provide.
- Optional release labels and dates may remain metadata without controlling editability.

Status:

Accepted. **Project Version** uses `active | archived`. **Artifact Edition** uses `draft | archived`. Publication remains a separate immutable concept rather than an Edition lifecycle state.

Decision records:

- `CONTEXT.md`
- This grill record

### Q12. What happens to child content when an entire Project is archived?

Recommended answer:

Project archive creates an effective read-only boundary without rewriting child lifecycle states.

Rules:

- Project Versions keep their existing `active | archived` states.
- Artifact Editions keep their existing `draft | archived` states.
- The Default Project Version remains assigned.
- Captures, Editions, Revisions, Project settings, and version settings become read-only.
- The extension cannot start a Capture in the archived Project.
- New Editions, Carry-Forward operations, Revisions, and Publications are blocked.
- Archived Projects leave normal active lists but remain available through an archived-project view.
- Restoring the Project restores the exact previous child behavior because child states were preserved.
- Existing immutable Publications and Publish Links remain accessible.
- Revoking Publish Links is a separate explicit action; Project archive never silently breaks shared links.
- Permanent Project deletion/purge is deferred from V1.
- Any future purge must account for Publications, Protected Shared Assets, exports, and retention requirements.

Example:

```text
Before Project archive:
Main: active
1.4: archived
Guide A / Main: draft
Guide B / Main: archived

After Project restore:
Main: active
1.4: archived
Guide A / Main: draft
Guide B / Main: archived
```

Reasoning:

- Cascading status updates would destroy the distinction between child records archived before and during Project archive.
- Effective read-only behavior is reversible without a status-reconstruction migration.
- Publication access is a sharing/security decision and must remain explicit.
- The rule matches the existing separation between mutable authoring and immutable publication snapshots.

Status:

Accepted. An **Archived Project** is an effective read-only wrapper. It preserves child lifecycle states, blocks new authoring, restores exact prior states, and does not automatically revoke existing Publications or Publish Links.

Decision records:

- `CONTEXT.md`
- This grill record

### Q13. Can a Project Version slug change after creation?

Recommended answer:

Yes, but every previous slug remains a permanent redirect alias.

Example:

```text
Original:
name: 2.0 Beta
slug: 2-0-beta

Renamed:
name: 2.0
slug: 2-0

Permanent alias:
2-0-beta -> 2-0
```

Rules:

- The display name can be edited normally.
- Slug changes use an explicit version-settings action with a redirect warning.
- Every former slug is stored as a permanent alias scoped to the Project.
- Canonical slugs and aliases are case-insensitively unique within one Project.
- An old alias can never be reassigned to another Project Version.
- Requests using an alias redirect to the current canonical slug.
- Immutable Project Version IDs remain the API/database relationship keys.
- Existing Published Artifacts and Publish Links are unaffected because their identities are independent.
- Archived Project Versions retain their canonical slug and aliases.
- Alias deletion is not supported in V1.

Reasoning:

- Release names often change from beta/preview labels to final names.
- Permanent aliases preserve browser bookmarks and internal links.
- Future versioned Documentation routing needs rename-safe links.
- Immutable IDs keep relationships stable while human-facing routing evolves.

Status:

Accepted. A Project Version's canonical slug may change, but every former slug becomes a permanent, non-reusable Project Version Alias that redirects to the canonical slug.

Decision records:

- `CONTEXT.md`
- This grill record

### Q14. When is an immutable Artifact Revision created?

Recommended answer:

Keep one mutable Working Draft per Artifact Edition and create immutable Artifact Revisions only at meaningful checkpoints.

Revision triggers:

1. The user explicitly selects `Create checkpoint`.
2. The Artifact Edition is published.
3. The Artifact Edition is used as a Carry-Forward source.

Not Revision triggers:

- Every keystroke.
- Every autosave.
- Normal draft metadata edits.
- Opening or previewing an Edition.

Model:

```text
Artifact Edition
  -> mutable Working Draft
  -> Revision 1: manual checkpoint
  -> Revision 2: publication source
  -> Revision 3: carry-forward source
```

Rules:

- Autosave updates mutable draft records using optimistic Row Version conflict protection.
- Every Artifact Revision is immutable.
- Revision numbers increase sequentially within one Artifact Edition.
- A Revision records creator, timestamp, trigger, and a complete authoring snapshot.
- A Published Artifact points to the exact Artifact Revision it published.
- Carry-Forward records the exact source Artifact Revision it copied.
- If the Working Draft is identical to the latest Revision, publish or Carry-Forward may reuse that Revision instead of creating a duplicate.
- Restoring an older Revision copies its content into the Working Draft and never mutates history.
- Publication Sequence remains separate from Artifact Revision number.

Reasoning:

- Per-keystroke immutable snapshots would create noisy, unbounded history.
- Mutable autosave provides normal editor ergonomics.
- Publication and Carry-Forward need an exact immutable source for reproducibility.
- Manual checkpoints provide deliberate recovery points without forcing a review workflow.

Status:

Accepted. Each **Artifact Edition** has one mutable **Working Draft**. Immutable **Artifact Revisions** are created only by manual checkpoint, Publication, and Carry-Forward, with identical latest Revisions reusable to avoid duplicate snapshots.

Decision records:

- `CONTEXT.md`
- This grill record

### Q15. How do Row Version, Artifact Revision number, and Publication Sequence differ?

Current implementation facts:

- Mutable Project, Capture, Guide, Guide Block, Guide Step, Interactive Demo, and Demo Scene rows already use `version` as an optimistic-concurrency counter.
- `publish_schema.published_artifact.version_number` and API v1 currently represent successive immutable publication snapshots for one source artifact.

Recommended answer:

Treat them as three separate counters with separate scopes and language.

```text
Guide Artifact: Configure SSO

Main Edition:
- Row Version: 47
- Artifact Revision: 3
- Publication Sequence: 2

2.0 Edition:
- Row Version: 8
- Artifact Revision: 1
- Publication Sequence: 1
```

Row Version:

- Internal optimistic-concurrency counter.
- Increments when mutable rows change.
- Not user-facing.
- Existing `version` columns retain this meaning.

Artifact Revision number:

- User-visible immutable authoring-history number.
- Sequential within one Artifact Edition.
- Created or reused by checkpoint, Publication, or Carry-Forward.

Publication Sequence:

- User-visible immutable publishing-history number.
- Sequential within one Artifact Edition.
- Increments whenever a new Published Artifact snapshot is created.
- UI uses `Publication 2`, not `Published version 2`.

Greenfield transition rules:

- The clean target database column and API field use `publication_sequence`.
- Existing development/test databases are reset rather than backfilled.
- In-repo web, server, extension, shared contracts, fixtures, and tests move together.
- No deprecated `version_number` or `published_version` alias is carried into the new target model solely for compatibility.

Status:

Accepted and later simplified by the greenfield delivery decision. **Row Version** is internal concurrency state. **Artifact Revision Number** is Edition-scoped authoring history. **Publication Sequence** is Edition-scoped publishing history, and the clean target contracts use `publication_sequence` directly.

Decision records:

- `CONTEXT.md`
- This grill record

### Q16. How do Working Draft, Artifact Revision, and Publication URLs differ?

Recommended answer:

Use explicit Project Version context for authenticated authoring and preserve existing public Publish Link routes.

Authenticated Working Draft:

```text
/projects/{projectId}/versions/{versionSlug}/guides/{artifactId}
/projects/{projectId}/versions/{versionSlug}/interactive-demos/{artifactId}
```

Immutable Artifact Revision preview:

```text
/projects/{projectId}/versions/{versionSlug}/guides/{artifactId}/revisions/{revisionNumber}
```

Existing public/restricted Publish Links:

```text
/p/{publishLinkSlug}
/p/{publishLinkSlug}/embed

/d/{publishLinkSlug}
/d/{publishLinkSlug}/embed
```

Rules:

- Authenticated Artifact routes include explicit Project Version context.
- Immutable Artifact IDs provide route identity because titles are non-unique.
- Project Version Aliases redirect to the canonical Project Version slug.
- Artifact Revision URLs are immutable authenticated previews.
- A Publish Link remains a stable access pointer to one immutable Published Artifact at a time.
- Explicit republishing may repoint the stable Publish Link to a newer immutable Published Artifact.
- Public readers display the Published Artifact's Project Version.
- `/projects/{projectId}` remains a convenient entry route and redirects to the Default Project Version.
- V1 does not add an ambiguous `/latest` route.
- Public Guide/Demo Publish Links retain the chosen `/p/*`, `/d/*`, and embed route shapes as product design, not legacy-data compatibility.

Meaning:

```text
Working Draft URL  -> mutable Artifact Edition
Revision URL       -> immutable authoring checkpoint
Publish Link       -> stable sharing/access pointer
Published Artifact -> immutable shared snapshot
```

Status:

Accepted. Authenticated authoring and Revision routes include explicit Project Version context. Existing public Publish Link routes remain stable, and the Default Project entry route redirects without adding a `/latest` alias.

Decision records:

- `CONTEXT.md`
- This grill record

### Q17. How do archived Project Versions behave in navigation, direct links, search, and Publications?

Recommended answer:

Archived Project Versions remain accessible as read-only history but are excluded from normal active workflows.

Rules:

- Normal Project Version selectors show active versions first.
- Archived versions appear in a separate `Archived` section.
- The Default Project Version can never be archived.
- Direct authenticated links continue working in read-only mode.
- Project Version Aliases continue redirecting after archive.
- Working Draft and Revision pages show an archived/read-only banner.
- New Captures, Editions, Revisions, Carry-Forward targets, and Publications are blocked.
- Archived Project Versions remain valid Carry-Forward sources.
- Default library views and future search exclude archived versions.
- Authorized users may explicitly enable `Include archived versions`.
- Existing Publish Links and embeds continue working.
- Public readers display the Published Artifact's Project Version without exposing internal archive controls.
- Protected Shared Assets referenced by archived Editions or Publications remain resolvable.
- Restore returns the Project Version to active selectors/search without changing its slug or aliases.

Reasoning:

- Historical release knowledge remains available for support and audit.
- Active creation workflows remain uncluttered.
- Stable links and immutable Publications do not depend on mutable archive state.
- Explicit inclusion prevents archived content from appearing as current by accident.

Status:

Accepted. Archived **Project Versions** are read-only, explicitly discoverable history. They remain directly linkable and Publication-compatible but are excluded from default navigation, libraries, and search.

Decision records:

- `CONTEXT.md`
- This grill record

### Q18. Is authorization Organization-wide or Project-scoped?

Current implementation fact:

The current Organization role model contains only `owner | member`. Most Project, Capture, Guide, Interactive Demo, and Publish operations verify Organization scope but do not enforce Project-specific membership, so an Organization Member can currently work across the Organization's Projects.

Recommended answer:

Introduce Project-scoped membership before Project Version implementation.

Project roles:

```text
project_admin
editor
viewer
```

Boundary rules:

- Organization Owner has implicit `project_admin` access to every Project.
- Other Organization Members access only Projects where they have active Project Membership.
- Creating a Project makes the creator its `project_admin`.
- Project roles control Captures, Artifact Editions, Revisions, Carry-Forward, Publications, Project Versions, and Project settings.
- Project Version permissions inherit from the Project; V1 does not create separate membership for every Project Version.
- New Organization Members receive no automatic Project access.
- Public Publish Links remain independent of Project Membership.

Reasoning:

- Organizations commonly restrict teams to particular Projects.
- Future internal Documentation needs a private Project-level access boundary.
- Adding access separately to each future artifact family would create inconsistent security.
- Organization-wide authoring access becomes unsafe as broader internal knowledge is stored.

Status:

Accepted. Authorization becomes Project-scoped through **Project Membership** with `project_admin | editor | viewer`. Organization Owners retain implicit Project Admin access to every Project, and Project Versions inherit Project permissions.

Decision records:

- `CONTEXT.md`
- This grill record

Plan impact:

- Project Membership is a prerequisite foundation and must receive a separate child plan before Project Version routes ship. Master Plan 005 child-plan numbering will be reconciled after this grill closes.

### Q19. What can each Project Role do?

Recommended answer:

Use a structural-management versus content-authoring boundary.

| Capability                                | Project Admin | Editor | Viewer |
| ----------------------------------------- | ------------: | -----: | -----: |
| View Project content                      |           Yes |    Yes |    Yes |
| View archived versions/content            |           Yes |    Yes |    Yes |
| Create Captures                           |           Yes |    Yes |     No |
| Manage allowed Capture metadata/archive   |           Yes |    Yes |     No |
| Create/edit/archive/restore Editions      |           Yes |    Yes |     No |
| Create checkpoints                        |           Yes |    Yes |     No |
| Restore a Revision into the Working Draft |           Yes |    Yes |     No |
| Carry Forward Artifacts                   |           Yes |    Yes |     No |
| Publish/republish/revoke links            |           Yes |    Yes |     No |
| Create Project Versions                   |           Yes |     No |     No |
| Rename versions/change slugs              |           Yes |     No |     No |
| Set Default Project Version               |           Yes |     No |     No |
| Archive/restore Project Versions          |           Yes |     No |     No |
| Manage Project Membership                 |           Yes |     No |     No |
| Change/archive/restore Project settings   |           Yes |     No |     No |
| Purge unreferenced assets                 |           Yes |     No |     No |

Additional rules:

- Organization Owner has implicit Project Admin capability everywhere.
- Project Admin may assign Project Roles only to existing Organization Members.
- Organization invitations remain Owner-only.
- Members without Project Membership cannot discover the Project.
- Project Viewers may read Working Drafts, Revisions, and archived content but cannot mutate them.
- Project Editors may publish because Publication is part of content ownership; approval workflows are deferred.
- Project Version permissions are inherited and never configured independently in V1.

Greenfield creation rules:

- Creating a Project makes its creator an explicit Project Admin unless the creator is relying on implicit Organization Owner access.
- Organization Owners require no explicit Project Membership row for their implicit access.
- Other Organization Members receive no Project Membership automatically.

Reasoning:

- Structural changes and permanent purge have a larger blast radius than content authoring.
- Editors need an end-to-end authoring workflow without waiting for an Organization Owner to publish.
- Viewer access is useful for internal knowledge consumers and remains unambiguously read-only.
- The role split tightens destructive authority without blocking normal content work.

Status:

Accepted and simplified by the greenfield delivery decision. **Project Admin**, **Project Editor**, and **Project Viewer** use the capability matrix above. Project creators receive Project Admin access, other Organization Members receive no automatic access, and Organization Owners retain implicit Project Admin access.

Decision records:

- `CONTEXT.md`
- This grill record

### Q20. Can a Capture Session move between Project Versions?

Recommended answer:

Only an empty, unstarted Capture Session draft may be reassigned.

Eligibility:

```text
status = draft
started_at = null
capture_events = 0
capture_assets = 0
target Project Version = active
target belongs to the same Project
```

The Project Version becomes permanently locked when any of these occurs:

- Capture begins.
- Status becomes `capturing`.
- `started_at` is recorded.
- The first Capture Event is created.
- The first Capture Asset is uploaded.
- The extension creates/starts its active Capture Session.
- The Capture Session is completed, canceled, or archived.

Additional rules:

- Capture Sessions never move between Projects.
- Project Admins and Project Editors may reassign eligible empty drafts.
- Changing the Default Project Version never moves existing Capture Sessions.
- A completed Capture recorded under the wrong Project Version remains immutable source history.
- Users may reuse its Protected Shared Assets or Carry Forward resulting Artifacts, but may not rewrite its original Project Version context.
- New Capture Sessions always receive explicit Project Version context; no persisted production Capture backfill is required.

Reasoning:

- Users can correct a selection error before capturing anything.
- Once source events/assets exist, Project Version is part of capture provenance.
- The rule prevents later reassignment from making existing artifacts appear to originate from another release.

Status:

Accepted. A **Capture Session** may change Project Version only while it is an empty, unstarted draft. Starting capture or creating the first Capture Event/Asset permanently locks its Project Version.

Decision records:

- `CONTEXT.md`
- This grill record

### Q21. Does title and description belong to the Artifact or Artifact Edition?

Recommended answer:

Title and description belong to each Artifact Edition. The stable Artifact is identity-only in V1.

```text
Stable Guide Artifact: guide_123

Main Edition:
title: Configure single sign-on

1.4 Edition:
title: Configure legacy SSO

2.0 Edition:
title: Configure SAML and OIDC
```

Stable Artifact owns:

- Immutable ID.
- Organization and Project ownership.
- Artifact type through its type-specific aggregate.
- Creation/audit identity.

Artifact Edition owns:

- Title and description.
- Project Version.
- Source Capture reference.
- `draft | archived` lifecycle.
- Working Draft and Artifact Revisions.

Rules:

- Carry-Forward copies title and description into the target Edition.
- Later title/description edits remain independent between Editions.
- Published Artifacts snapshot the source Edition's title and description.
- Search and Project Version libraries use Edition-owned metadata.
- Duplicate Edition titles remain allowed.
- V1 does not add a global canonical Artifact title.
- Creating an Artifact and its first Edition is one transaction, so users never see an empty identity without an Edition.

Reasoning:

- Release-specific terminology changes independently.
- Global metadata would make a title edit in `Main` unexpectedly affect `1.4` and `2.0`.
- Edition ownership matches independent-copy Carry-Forward.
- Normal portal navigation already has selected Project Version context.

Status:

Accepted. The stable **Artifact** is identity-only. User-facing title and description belong to each **Artifact Edition** and may diverge independently across Project Versions.

Decision records:

- `CONTEXT.md`
- This grill record

### Q22. How do existing Guide and Interactive Demo rows map to the new model?

Initial recommendation:

Preserve current Guide/Demo IDs as stable Artifact IDs and backfill separate `Main` Editions.

User correction:

The repository is still in the building phase and has no live production records to preserve. A legacy-row mapping and compatibility backfill would solve a problem that does not exist.

Status:

Withdrawn as not applicable. Treat Project Version, Artifact identity, Artifact Edition, Revision, Publication Sequence, Project Membership, and protected-asset retention as one clean target implementation. Development/test databases may be reset and reseeded. Update all in-repo applications, contracts, fixtures, tests, and docs together rather than carrying legacy schema/API aliases.

Still required:

- Design clean type-specific Guide and Interactive Demo Artifact/Edition tables.
- Keep Guides and Interactive Demos as separate aggregates; do not introduce a universal artifact-content table.
- Preserve the accepted product route shapes and domain decisions because they are deliberate design, not migration compatibility.
- Decide migration-file/rebaseline mechanics during the implementation child plan after inspecting repository tooling.

Decision records:

- This grill record
- Master Plan 005 delivery and verification rules

### Q23. Is a multi-Artifact Carry-Forward operation atomic?

Recommended answer:

Yes. The complete selected batch succeeds or makes no changes.

Example:

```text
Carry Forward from Main to 2.0:

[x] Guide A
[x] Guide B
[x] Demo C
```

If `Guide B / 2.0` already exists:

```text
Result:
- Guide A: not created
- Guide B: conflict
- Demo C: not created
```

Rules:

- Carry-Forward runs in one database transaction.
- Source and target Project Version state is locked or equivalently protected during validation/write.
- Validate Project Membership capability, lifecycle, source Editions, target absence, and Protected Shared Assets before copying.
- Enforce unique `(artifact_id, project_version_id)` constraints.
- Require an idempotency key so a network retry returns the original completed result.
- Never return uncertain partial success.
- Return actionable conflict details identifying each blocking Artifact.
- Apply a documented maximum batch size to bound transaction duration.
- Default Project Version changes, Revision numbering, and Publication sequencing use transaction/uniqueness protection.
- Working Draft saves use Row Version checks and return a conflict instead of silently overwriting another editor.

Reasoning:

- Users can retry safely after network failure.
- Atomic batches prevent target Project Versions from receiving an unexplained subset.
- Database constraints remain the final defense against concurrent requests.
- Explicit stale-write conflicts are required before merge or real-time collaboration exists.

Status:

Accepted. **Carry-Forward** batches are atomic and idempotent, database constraints enforce Edition uniqueness, and concurrency conflicts never produce silent partial copies or overwritten Working Drafts.

Decision records:

- `CONTEXT.md`
- This grill record

### Q24. Does stable Artifact identity have its own lifecycle state?

Recommended answer:

No. V1 lifecycle belongs exclusively to Artifact Editions.

```text
Guide Artifact: guide_123

Main Edition: archived
1.4 Edition: archived
2.0 Edition: draft
```

Rules:

- Stable Artifact identity has no `draft`, `active`, or `archived` status.
- Each Artifact Edition independently uses `draft | archived`.
- If all Editions are archived, the Artifact is effectively absent from default libraries.
- Stable identity remains so Revisions, Publications, Publish Links, and lineage remain valid.
- A new Edition may later be created for another active Project Version without restoring old Editions.
- Artifact identity and its first Edition are created transactionally.
- Artifact identity cannot be physically purged while an Edition, Revision, Publication, Publish Link, or protected asset relationship exists.
- Permanent Artifact purge is deferred from V1.
- A future `archive across all versions` command would be a bulk Edition operation, not a new Artifact lifecycle state.

Reasoning:

- An Artifact may be obsolete in one Project Version and current in another.
- A global lifecycle would conflict with independent Edition states.
- Identity exists to connect release-specific Editions and immutable history.
- One lifecycle layer makes authorization and restoration predictable.

Status:

Accepted. Stable **Artifact** records are identity-only and have no user-facing lifecycle. All authoring lifecycle belongs to individual **Artifact Editions**.

Decision records:

- `CONTEXT.md`
- This grill record

### Q25. Does a Publish Link expose one Edition or selected versions of one Artifact?

Initial recommendation:

Give each Artifact Edition its own independent Publish Link.

User correction:

A consumer should be able to receive one link and switch between explicitly allowed versions such as `1.5` and `2.0`.

Accepted model:

```text
Publish Link: /p/configure-sso

Allowed versions:
- 1.5 -> immutable Published Artifact, Publication 4
- 2.0 -> immutable Published Artifact, Publication 2

Default version:
- 2.0
```

Rules:

- A Publish Link belongs to exactly one stable Artifact.
- A Publish Link exposes one or more selected Artifact Editions from that Artifact.
- Each selected Edition entry points to one exact immutable Published Artifact.
- The link has exactly one default version among its selected entries.
- The public reader shows a version selector only when more than one entry exists.
- Only explicitly selected versions are exposed.
- One password/access/expiry policy applies to the entire Publish Link.
- Updating an entry to a newer Publication is explicit.
- Removing an entry does not delete its Edition, Revisions, or Published Artifacts.
- Archived Project Versions may remain available when explicitly included.
- A Publish Link cannot combine unrelated Artifacts or artifact types.
- Working Drafts are never exposed.
- V1 has no automatic `latest` selection; the link's default is explicit.

Reasoning:

- One URL can serve consumers who need multiple supported software versions.
- Edition-specific immutable snapshots remain precise.
- Explicit inclusion prevents accidental exposure of every Project Version.
- Link-wide access policy keeps the consumer experience and authorization understandable.

Status:

Accepted, replacing the initial one-link-per-Edition recommendation. A **Publish Link** is a selected multi-version manifest for one stable **Artifact**, with one default entry and immutable Published Artifact entries.

Decision records:

- `CONTEXT.md`
- This grill record

### Q26. Can one Artifact have multiple Publish Links for different audiences?

Recommended answer:

Yes. One stable Artifact may have multiple independently configured Publish Links.

Example:

```text
Guide Artifact: Configure SSO

Link: Internal support
- Versions: Main, 1.5, 2.0
- Access: organization-only

Link: Customer A
- Versions: 1.5, 2.0
- Access: password-protected

Link: Public documentation
- Versions: 2.0
- Access: public
```

Rules:

- One Artifact may have multiple active Publish Links.
- Every link has an internal management name, globally unique slug, selected version entries, explicit default version, access/password/expiry policy, and active/revoked state.
- Different links may include the same Published Artifact.
- Revoking one link does not affect another.
- Updating one link's version entries does not affect another.
- A link may include only Artifact Editions belonging to its stable Artifact.
- Project Editors and Project Admins may create and manage links.
- Carry-Forward never copies Publish Links.
- Viewer sessions and future analytics remain scoped to the specific Publish Link.
- V1 does not add Organization-wide links that combine unrelated Artifacts.

Reasoning:

- Different customers and internal audiences may need different allowed Project Versions and access policies.
- Published Artifact snapshots can be reused without duplicating content.
- Independent revocation and expiry avoids coupling unrelated audiences.

Status:

Accepted. One **Artifact** may have multiple independently configured **Publish Links**, each with its own selected versions, default version, access policy, slug, lifecycle, and future viewer/analytics scope.

Decision records:

- `CONTEXT.md`
- This grill record

### Q27. How does a consumer open and switch versions inside a multi-version Publish Link?

Recommended answer:

Provide one stable base URL, canonical version-specific URLs, and an in-viewer version selector.

Guide routes:

```text
/p/configure-sso
  -> opens the link's configured default version

/p/configure-sso/versions/1-5
  -> opens version 1.5 directly

/p/configure-sso/versions/2-0
  -> opens version 2.0 directly
```

Interactive Demo routes:

```text
/d/onboarding-demo
/d/onboarding-demo/versions/1-5
/d/onboarding-demo/versions/2-0
```

Viewer behavior:

- Show a version dropdown when the Publish Link contains more than one version entry.
- Show the user-facing Project Version name, not its slug or internal ID.
- List only versions explicitly included in that Publish Link.
- Selecting a version renders the exact immutable Published Artifact configured for that entry.
- Selection updates the browser URL to the canonical version-specific path without losing access state.
- The resulting version-specific URL is independently shareable.
- When only one version is included, show its version label without an unnecessary dropdown.

Routing and access rules:

- The base URL opens the Publish Link's explicit default entry.
- Project Version Aliases redirect to the canonical version slug.
- A version path works only if that version is included in the Publish Link.
- Missing or unauthorized version entries return a non-revealing `404`.
- Password/access verification applies to the whole Publish Link.
- Embed routes support the same explicit version selection.
- V1 has no automatic `/latest` route.

Status:

Accepted. Multi-version public Guide and Interactive Demo viewers include a version dropdown and canonical shareable version paths. The base Publish Link opens its explicit default version.

Decision records:

- `CONTEXT.md`
- This grill record

### Q28. How are Project Versions ordered in internal selectors and public viewer dropdowns?

Recommended answer:

Use explicit manual ordering because Project Version names are free-form and cannot be safely parsed as semantic versions, dates, or numbers.

Internal Project selector:

```text
Main       Default
2.0
1.5
1.0
Archived
  0.9
```

Publish Link viewer:

```text
2.0        Default
1.5
```

Rules:

- Store an explicit position for Project Versions.
- Show the Default Project Version first.
- Show remaining active Project Versions in manually configured order.
- Show archived Project Versions in a separate section while retaining their relative order.
- New Project Versions initially appear immediately after the Default Project Version.
- Project Admins may reorder Project Versions.
- Never infer order from semantic-version, date, numeric, or lexical parsing.
- Each Publish Link stores its own selected-entry order.
- The Publish Link's default entry appears first.
- Remaining entries follow the link-specific configured order.
- Reordering Project Versions does not silently reorder existing Publish Links.
- Reordering never changes URLs, identities, Publications, or default selection.
- Concurrent reorder operations use transaction and Row Version protection.

Reasoning:

- Free-form version names support semantic, calendar, named, and rolling releases.
- Link-specific ordering lets an audience see the most relevant versions without changing internal navigation.
- Explicit position is predictable and avoids fragile parsing rules.

Status:

Accepted. Project Version selectors and Publish Link version selectors use explicit manual ordering, show their explicit default first, and separate archived Project Versions without inferring order from names.

Decision records:

- `CONTEXT.md`
- This grill record

### Q29. Does republishing an Edition automatically update every Publish Link containing it?

Recommended answer:

No. The publish workflow gives the user an explicit option for each Publish Link.

```text
Publishing: Configure SSO / 2.0 / Revision 4

Update Publish Links:
[x] Internal support
[ ] Customer A
[ ] Public documentation
```

Result:

- Create immutable `2.0 Publication 3`.
- Update the `2.0` entry in `Internal support`.
- Keep `Customer A` pinned to its current Publication.
- Leave `Public documentation` unchanged.

Rules:

- Publishing creates or reuses an Artifact Revision and creates a new immutable Published Artifact.
- The publish dialog lists Publish Links belonging to the Artifact and shows which already include the Edition.
- No Publish Link is selected automatically by default.
- The Project Editor/Admin explicitly selects links to add/update.
- Publication creation and all selected link-entry changes are one atomic transaction.
- Unselected links remain pinned to their existing Published Artifact.
- Link default version, ordering, access policy, password, and expiry do not change during an entry update.
- A Published Artifact may remain unlinked.
- The user can later add/update the Publication through Publish Link management.

Reasoning:

- Different audiences may need controlled rollout timing.
- Explicit selection prevents a routine publish from changing every customer link.
- Later manual update preserves flexibility without requiring another Publication.

Status:

Accepted. Publishing offers explicit per-link update options. Selected Publish Link entries update atomically with Publication; unselected links remain pinned and can be updated manually later.

Decision records:

- `CONTEXT.md`
- This grill record

### Q30. Can an immutable Published Artifact be deleted?

Recommended answer:

Not in V1. Published Artifacts are retained as immutable publishing history.

Rules:

- A Published Artifact cannot be edited, overwritten, or individually deleted.
- A Publish Link entry may move to another Published Artifact.
- A version entry may be removed from a Publish Link.
- A Publish Link may be revoked.
- An unlinked Published Artifact remains visible to authorized Project Members through Publication history.
- Public consumers cannot access an unlinked Published Artifact unless an active Publish Link entry references it.
- Protected Shared Assets remain retained while any Published Artifact references them.
- Publication Sequence numbers are never reused.
- Project, Project Version, and Artifact Edition archive do not delete Publication history.
- Organization deletion, legal erasure, and retention-policy purge require a future explicit administrative workflow.
- Future purge must revoke references, record audit evidence, and remove protected assets only when no remaining dependency needs them.

Reasoning:

- Published Artifacts are audit records of exactly what was shared.
- Link rollback may require an older Publication.
- Shared protected media makes snapshot retention cheaper than per-Publication binary duplication.
- Deletion would create sequence gaps and weaken incident investigation.

Status:

Accepted. **Published Artifacts** are immutable and non-deletable in V1. Access is controlled by Publish Link entries and revocation; future administrative/legal purge is a separate deferred workflow.

Decision records:

- `CONTEXT.md`
- This grill record

### Q31. Can a Publish Link version entry roll back to an older Published Artifact?

Recommended answer:

Yes, through an explicit audited action.

```text
Publish Link: Customer A
Version entry: 2.0

Current: Publication 3
Rollback target: Publication 1
```

Rules:

- Project Editors and Project Admins may roll back.
- The target Published Artifact must belong to the same Artifact Edition as the link's version entry.
- Rollback creates no new Artifact Revision or Published Artifact.
- Only the Publish Link entry pointer changes.
- Confirmation shows current/target Publication Sequences, timestamps, and publishers.
- Audit records actor, timestamp, previous Published Artifact, target Published Artifact, and optional reason.
- Slug, access policy, password, expiry, default version, and ordering remain unchanged.
- The canonical public version path remains unchanged and immediately renders the selected older snapshot.
- A later explicit publish/update may move the entry forward again.
- Pointer change and audit recording commit atomically.
- Protected Shared Assets keep the older snapshot renderable.

Reasoning:

- Incident recovery should not mutate immutable history.
- Reusing the original Published Artifact keeps Revision and Publication numbers truthful.
- Same-Edition restriction prevents a `2.0` selector entry from silently serving another Project Version.

Status:

Accepted. A Publish Link version entry may be explicitly and atomically rolled back to an older Published Artifact from the same Artifact Edition, with complete audit evidence and no new Publication.

Decision records:

- `CONTEXT.md`
- This grill record

### Q32. What metadata does a Project Version contain in V1?

Recommended answer:

Use an explicit minimal schema.

Required:

```text
id
organization_id
project_id
name
slug
status              active | archived
is_default
position
row_version
created_by_id
updated_by_id
created_at
updated_at
```

Optional:

```text
description
release_date
```

Separate related records:

```text
project_version_alias
```

Not V1 fields:

```text
semantic_version
major
minor
patch
prerelease
environment
audience
channel
based_on_project_version_id
released_status
end_of_life_status
custom_metadata_json
```

Reasoning:

- Project Version names are intentionally free-form.
- `release_date` is information and does not control lifecycle.
- Carry-Forward lineage belongs to Artifact Editions, not an entire Project Version.
- Audience and environment were explicitly excluded from Project Version semantics.
- Generic metadata JSON would hide unsettled core domain concepts.
- Additional typed fields can be introduced through deliberate breaking schema changes while the repository is pre-live.

Status:

Accepted. Project Version V1 uses the explicit required/optional fields above, stores aliases separately, and does not add semantic-version decomposition, audience/environment/channel fields, global lineage, release states, or custom metadata JSON.

Decision records:

- `CONTEXT.md`
- This grill record

Session-wide delivery principle:

- Breaking schema, API, and in-repo client changes are acceptable before the first live release when they produce a cleaner model.
- Development/test databases may reset and reseed.
- Do not preserve ambiguous legacy columns, duplicate sources of truth, or compatibility aliases without an active external consumer.
- Core mutable domain state must use explicit typed columns and relationships rather than generic JSON storage.
- The relational-storage decision below also applies to immutable Revision and Publication content.

### Q33. May core product state, Revisions, or Publications be persisted as JSON?

Recommended answer:

No. Use explicit relational persistence for the clean target model.

Rules:

- PostgreSQL product/domain state uses typed columns, foreign keys, constraints, and type-specific child tables.
- Working Draft content is relational. Guide Blocks, Guide Steps, Guide Annotations, Demo Scenes, Demo Hotspots, and Demo Transitions remain explicit records rather than generic JSON payloads.
- Artifact Revisions are immutable relational graphs with type-specific revision records and children.
- A Published Artifact identifies one exact immutable Artifact Revision and adds Publication Sequence and audit/access history; it does not duplicate content into `snapshot_json`.
- Replace the current `guide_block.content` JSONB with explicit typed fields or type-specific child records.
- Replace JSON-backed annotation collections with relational annotation rows.
- Remove generic `metadata` JSONB columns from the clean schema unless a later concrete, reviewed requirement defines an explicit non-domain boundary.
- Do not introduce entity-attribute-value or generic key/value tables as disguised JSON storage.
- Protected Shared Assets remain referenced relationally from Working Drafts, Revisions, and Publications.
- JSON remains valid for HTTP transport, extension messages, package manifests, configuration files, and other non-persistence boundaries.
- Binary media remains in the configured file store; relational records own its identity, metadata, and protected references.
- Any future persistent JSON exception requires a narrow, non-authoritative use case and a separate accepted architecture decision. It cannot control authorization, lifecycle, ownership, ordering, lineage, asset protection, or other core behavior.

Current alpha impact:

- `guide_schema.guide_block.content JSONB` is not retained as the target authoring model.
- `publish_schema.published_artifact.snapshot_json JSONB` is replaced by the exact immutable Artifact Revision relationship and relational revision content.
- Generic JSONB metadata columns currently present on identity, organization, project, capture, event, asset, and file records are not automatically carried into the clean schema.
- API JSON response shapes may still compose relational records for clients; transport representation does not define persistence shape.

Reasoning:

- The repository is pre-live, so the schema and every in-repo consumer can change together without compatibility debt.
- Relational constraints make ownership, ordering, references, tenant scope, asset protection, and immutable history enforceable and queryable.
- Type-specific revision tables preserve Guide and Interactive Demo differences without a vague universal content model.
- Publication can remain immutable by referencing an immutable Revision graph; JSON duplication is not required for exact rendering or rollback.
- More explicit tables and joins are acceptable in exchange for eliminating hidden schema drift and duplicate sources of truth.

Status:

Accepted. The clean target persists core product state, Working Drafts, Artifact Revisions, and Published Artifacts relationally. It removes generic domain JSONB storage and does not use `snapshot_json` for publication content. JSON remains a transport/configuration format, not the persistent domain source of truth.

Decision records:

- `CONTEXT.md`
- This grill record
- Master plan `005`

### Q34. How comprehensive must the audit trail be from day one?

Initial recommendation:

Audit only consequential versioning, membership, publishing, and destructive actions through domain-specific relational history.

User correction:

The audit trail should capture every change from day one and provide a complete explanation of what happened. The implementation in `/home/tm/Desktop/work/project_orca/orca_v2/apps/server` should be used as a reference.

Reference inspection:

Orca uses:

- an append-only `audit_schema.change_event` envelope for one logical business operation;
- append-only `audit_schema.change_item` records for entity, child-row, and field changes;
- actor/source, request, agent, Row Version, summary, and root-entity context;
- before/after aggregate diffing with explicit field allowlists;
- sensitive-value redaction;
- one transaction for business changes and audit evidence;
- organization-scoped, cursor-paginated audit timelines;
- explicit command-level audit integration rather than automatic coverage for every table.

Relevant reference files:

- `/home/tm/Desktop/work/project_orca/orca_v2/apps/server/src/db/migrations/139_generic_audit_trail.sql`
- `/home/tm/Desktop/work/project_orca/orca_v2/packages/audit-domain/src/repository/audit.repository.ts`
- `/home/tm/Desktop/work/project_orca/orca_v2/packages/audit-domain/src/diff/audit-diff.ts`
- `/home/tm/Desktop/work/project_orca/orca_v2/packages/audit-domain/src/redaction/audit-redaction.ts`
- `/home/tm/Desktop/work/project_orca/orca_v2/packages/audit-domain/src/query/audit.query.ts`
- `/home/tm/Desktop/work/project_orca/orca_v2/packages/invoice-domain/src/audit/invoice-audit.ts`

Accepted adapted model:

- Use an Orca-style Audit Event plus Audit Change Item timeline.
- Audit every successfully committed state-changing transaction, not only high-risk actions.
- Coverage includes organization/user changes, authentication/session mutations, Projects, Project Memberships, Project Versions, captures, events, assets, Artifacts, Editions, Working Drafts, every committed autosave batch, Revisions, Carry-Forward, Publications, Publish Links, archive/restore/purge, extension operations, imports, migrations, and system jobs.
- One logical transaction creates one Audit Event containing every affected Audit Change Item.
- The business mutation and Audit Event/Change Items commit or roll back together.
- Failed and rolled-back operations do not create successful mutation events.
- No-op commands do not create misleading change evidence.
- Preserve actor/source categories appropriate to this product, including Org User, extension, system, API client, import, and migration.
- Record explicit organization/project scope, root entity, action, request/correlation context, idempotency context, actor/source, before/after Row Version where applicable, optional reason, and timestamp.
- Use explicit entity/parent identity, operation, field name, value type, and typed before/after scalar columns for change items.
- Do not copy Orca's JSONB `before_value`, `after_value`, or generic metadata storage.
- Relational child records such as Guide Annotations and Demo Hotspots produce their own Audit Change Items rather than nested values.
- Enforce value-type/column consistency with database checks.
- Use field allowlists, explicit sensitive-field denylists, and redacted markers; never retain passwords, session tokens, invite tokens, raw typed capture values, secrets, or protected credentials.
- Audit rows are append-only and have no update/delete product API.
- Provide tenant/project/root-entity scoped cursor pagination suitable for Project and Artifact activity timelines.
- Add a mutation-coverage guard and schema/architecture tests so a mutable domain table or command cannot silently bypass audit context.
- Consecutive autosaves may be visually collapsed, but their committed underlying audit evidence remains.
- Audit Foundation is an implementation prerequisite for Project Membership, Project Version, Edition, Revision, and Publication work.
- Read/access events, failed authorization attempts, public-link views, downloads, retention, and export are resolved by subsequent grill questions rather than silently included here.

Difference from Orca:

- Orca is an architectural reference, not a code-copy target.
- Orca currently depends on explicit domain-command integration and uses JSONB for heterogeneous values.
- This product requires coverage enforcement and typed relational audit values to remain consistent with Q33.

Status:

Accepted. The platform will establish a comprehensive append-only Audit Event/Audit Change Item foundation before version implementation. Every successfully committed mutation, including committed autosaves and system/extension changes, is recorded atomically with typed relational diffs and enforced coverage. Read/access auditing remains the next boundary decision.

Decision records:

- `CONTEXT.md`
- This grill record
- Master plan `005`
- A dedicated ADR at grill close

### Q35. Are reads and access attempts part of the comprehensive audit trail?

Recommended answer:

Yes, through a separate append-only Access Event ledger rather than mutation Audit Change Items.

Meaningful Access Event coverage:

- authenticated Project, Capture, Artifact, Edition, Revision, Publication, history, list, and search reads;
- public Publish Link opens and selected-version requests;
- embeds, logical asset downloads, previews, and exports;
- login success and failure, logout, and session revocation;
- invite acceptance and other authentication/security outcomes;
- authorization denials;
- invalid, expired, revoked, or password-protected Publish Link attempts;
- rate-limited and security-relevant rejected requests;
- extension API resource access.

Explicit relational context where applicable:

```text
organization_id
project_id
actor_type
actor_org_user_id
extension_session_id
publish_link_id
published_artifact_id
resource_type
resource_id
action
route_template
request_id
outcome
status_code
occurred_at
```

Rules:

- Access Event persistence does not use JSON/JSONB.
- Never retain passwords, tokens, cookies, authorization headers, raw access credentials, raw search text, or document content.
- Store route templates and explicit resource identity rather than raw URLs that may contain secrets.
- Public-link access identifies the Publish Link and Published Artifact without retaining its password/token.
- Record one logical asset/download/export access rather than HTTP range/chunk implementation details.
- Underlying repeated logical polling access remains evidence but may be collapsed in the UI.
- Persist a protected-resource Access Event before returning its content; if evidence cannot be persisted, return a service-unavailable response rather than disclose content without evidence.
- Access Events remain separate from mutation Audit Events but may be combined in an authorized activity view.
- Login failures or anonymous public attempts may lack Organization, Project, or Org User identity; record only safely established context.

Excluded transport/operational noise:

- health and readiness probes;
- frontend JavaScript, CSS, font, and favicon requests;
- CORS preflight;
- internal database queries;
- browser-local interactions with no server request;
- video/static range chunks when Video arrives;
- extension heartbeat traffic with no domain-resource access.

Terminology boundary:

- Audit Event answers what changed.
- Access Event answers who accessed or attempted to access what.
- Application Log explains internal operational behavior and failures.

Status:

Accepted. Meaningful resource reads, public access, downloads/exports, authentication outcomes, denials, and extension access produce append-only relational Access Events. Transport noise remains in operational telemetry rather than the product audit trail.

Decision records:

- `CONTEXT.md`
- This grill record
- Master plan `005`
- The comprehensive audit ADR created at grill close

### Q36. Who may view Audit Events, Audit Change Items, and Access Events?

Recommended answer:

Separate raw compliance evidence from curated product history.

Organization Owner:

- may view all organization-level and Project-level Audit Events, Audit Change Items, and Access Events;
- may inspect authentication/security outcomes and system, extension, import, migration, and API-client activity;
- may filter by actor, action, resource, outcome, Project, and date.

Project Admin:

- may view all mutation and access evidence scoped to Projects where they currently have Project Admin access;
- may inspect Project Membership, Project Version, Capture, Artifact, Edition, Revision, Publication, Publish Link, asset, and Project-scoped denied-access activity;
- may not access unrelated Projects or Owner-only organization/authentication history.

Project Editor:

- receives a curated Project Activity Timeline;
- may see Capture/Artifact creation and editing, visually grouped autosaves, checkpoints, restore, Carry-Forward, Publication, Publish Link, archive, and restore activity relevant to Projects they can edit;
- does not receive the raw compliance explorer, complete Access Event ledger, authentication history, denied-access/security details, or infrastructure context.

Project Viewer:

- sees only ordinary product history needed to understand content, including Revision number/creator, Publication Sequence/publisher, timestamps, and current archived/published state;
- cannot query Audit Change Items or Access Events.

Public consumer:

- cannot access internal audit/access evidence, actor identities, or internal history.

Rules:

- Evaluate authorization at query time against current Organization and Project Membership.
- Removing a member immediately removes their audit/access-history visibility for that Project.
- Every audit/access view is itself recorded as an Access Event.
- Sensitive/forbidden values are never stored, so higher privilege cannot reveal them.
- The curated Activity Timeline is a read model over immutable evidence and does not duplicate or mutate its source.
- Current Project Admin scope is sufficient for Project compliance evidence; only the Organization Owner receives cross-Project organization/security access in V1.

Status:

Accepted. Organization Owners receive organization-wide compliance visibility; Project Admins receive complete Project-scoped visibility; Project Editors receive a curated activity timeline; Project Viewers see only ordinary Revision/Publication history; public consumers receive none. All audit-history views are themselves Access Events. Export is resolved separately by Q38.

Decision records:

- `CONTEXT.md`
- This grill record
- Master plan `005`
- The comprehensive audit ADR created at grill close

### Q37. How long are Audit Events, Audit Change Items, and Access Events retained?

Recommended answer:

Retain both mutation and access evidence for the Organization's lifetime in V1.

User refinement:

Keep the evidence for as long as possible.

Accepted precise meaning:

- Retain Audit Events, Audit Change Items, and Access Events indefinitely while the owning Organization exists.
- Do not automatically expire, sample, truncate, compact away, or silently delete evidence.
- Project archive/restore, Project Version archive/restore, Artifact Edition archive/restore, member removal/disablement, session revocation, Publish Link revocation, and Published Artifact unlinking never remove evidence.
- Owners and Project Admins have no selective event-delete capability.
- Preserve historical actor relationships when an Org User is disabled or removed from active membership.
- Record an explicit safe actor label at event time so later profile changes do not rewrite historical presentation.
- Database relationships must prevent accidental cascade deletion of retained evidence.
- Storage pressure produces warnings, metrics, and operator guidance rather than automatic history loss.
- Backups include audit/access evidence.
- Index for tenant, Project, root resource, actor, outcome, and occurrence time.
- Keep a future time-partitioning path available and measure event volume from the first implementation; partitioning must not change retention semantics.
- UI grouping or autosave collapsing never deletes underlying events.
- Permanent Organization deletion, legal erasure, governed retention schedules, and cold-storage archival require a future explicit administrative design.
- Until that workflow exists, Organization/data deletion that would cascade through retained evidence is blocked.
- A future governed purge must offer an export opportunity, validate scope/dependencies, require Owner confirmation, and record final evidence before removal where legally/technically possible.

Reasoning:

- Deletion is irreversible while additional storage can be managed and optimized later.
- Complete evidence is part of the intended internal-company value, not disposable telemetry.
- An undefined cascade or storage-pressure cleanup would contradict the append-only guarantee.
- “Forever” cannot be promised beyond deliberate tenant/legal deletion, so Organization lifetime is the enforceable boundary.

Status:

Accepted. Audit and Access evidence is retained indefinitely for the Organization's lifetime with no automatic expiry, sampling, truncation, or selective product deletion. Future legal/Organization purge and cold-storage policies require a separately governed workflow; until then, destructive cascade is blocked.

Decision records:

- `CONTEXT.md`
- This grill record
- Master plan `005`
- The comprehensive audit ADR created at grill close

### Q38. Does V1 provide Audit or Access timeline export?

Initial recommendation:

Provide an asynchronous, scoped ZIP export containing relational CSV files with a fixed watermark, checksums, temporary protected storage, and complete audit/access evidence for request/generation/download lifecycle.

User decision:

Do not provide timeline export options now.

Accepted rules:

- V1 provides authorized interactive Audit, Access, and curated Activity Timeline views only.
- Do not add an export button, API route, background export job, generated archive, temporary export File, CSV/JSON/PDF format, or download flow.
- Organization Owners and Project Admins retain the accepted query visibility but cannot export through the product.
- Project Editors and Project Viewers retain only their accepted curated/product-history views.
- Database backups and operator-managed database administration remain operational concerns, not a user-facing product export.
- Indefinite retention remains unchanged.
- Permanent Organization deletion and legal/governed purge remain blocked until a future design explicitly settles export opportunity, authorization, generation, delivery, retention, and deletion evidence.
- Documentation and UI must not imply that compliance export is currently available.

Status:

Accepted. Audit and Access timeline export is explicitly deferred. V1 exposes only authorized interactive timelines and does not implement export formats, jobs, files, endpoints, or controls.

Decision records:

- `CONTEXT.md`
- This grill record
- Master plan `005`
- The comprehensive audit ADR created at grill close

### Q39. How resistant to tampering must Audit and Access evidence be in V1?

Recommended answer:

Enforce append-only behavior at the product and database-runtime boundaries without claiming cryptographic tamper-proofing.

Accepted controls:

- The application runtime database role may insert evidence and perform authorized reads.
- The runtime role cannot update, delete, or truncate Audit Events, Audit Change Items, or Access Events.
- Database append-only guards reject record modification/deletion even if application code attempts it.
- Foreign keys use restrictive deletion behavior rather than cascades that silently destroy evidence.
- Evidence insertion uses a validated repository/function that enforces tenant/Project scope, actor/source rules, typed-value consistency, and sensitive-field policy.
- Audit Event/Change Items finalize in the same transaction as their business mutation and cannot be amended after commit.
- Access Events are finalized before protected content is disclosed and cannot be amended after commit.
- Runtime and migration/maintenance database credentials are separate.
- Any future production maintenance touching audit/access schemas requires an explicit operator procedure and operational evidence.
- Startup/schema verification checks required roles, grants, append-only guards, indexes, and restrictive deletion behavior.
- Integration tests use runtime-equivalent credentials to prove update/delete/truncate and cascade attempts fail.
- Backups include complete audit/access evidence.
- Viewing audit/access evidence remains an Access Event.

Trust boundary:

- A PostgreSQL superuser or infrastructure owner can ultimately alter the database.
- A hash chain stored only in the same database does not prevent that actor from rewriting events and hashes.
- V1 must not claim “tamper-proof,” WORM, or compliance certification.
- Externally keyed cryptographic signatures, independently retained checkpoints, WORM storage, and formal compliance controls require a future security/compliance design.
- Do not add an internally stored hash chain that creates misleading assurance without an external trust anchor.

Status:

Accepted. V1 audit/access evidence is append-only through application and database-runtime enforcement, restrictive foreign keys, separate credentials, and verification tests. Cryptographic tamper-proof/WORM claims and external anchoring are explicitly deferred.

Decision records:

- `CONTEXT.md`
- This grill record
- Master plan `005`
- The comprehensive audit ADR created at grill close

### Q40. Which work belongs to Master Plan 005, and which capabilities are later phases?

Initial recommendation:

Record semantic version automation, branching/merging, advanced collaboration, approval workflows, localization, cross-Project reuse, scheduled publishing, compliance export/purge, Documentation runtime, and Video as explicit deferrals.

User clarification:

Master Plan 005 must deliver these nine tracks:

1. Repository guidance and skills.
2. Audit and Access foundation.
3. Project Membership.
4. Project Versions.
5. Capture version scoping.
6. Guide/Demo Editions, Working Drafts, Revisions, and Publications.
7. Modernized UI workflows.
8. Cross-workflow verification and closeout.
9. Documentation-domain grill.

Accepted scope boundary:

- The nine tracks above are implementation/planning deliverables of Master Plan 005.
- Documentation runtime implementation begins only after the Documentation-domain grill and a subsequent accepted plan.
- Loom-style Video is a later product phase.
- Semantic-version automation, environment/audience/channel versioning, branching/merging, multi-source/multi-target Carry-Forward, automatic synchronization, and cross-Project Artifact reuse are later phases.
- Real-time/offline collaboration, review/approval workflows, comments/mentions, localization, and dedicated side-by-side content-diff UI are later phases.
- Scheduled/approval-gated publishing, automatic link rollout, custom domains, and Publication deletion are later phases.
- Audit export, automatic retention expiry, legal erasure/purge, Organization deletion, cold storage, external cryptographic anchoring, WORM, and compliance certification are later security/compliance phases.
- Universal artifact/content tables, generic JSON metadata, AI-owned source-of-truth content, per-Project-Version memberships, and cross-Organization sharing are not introduced by this master.
- These later capabilities remain documented as future candidates or explicit non-goals; recording them does not promise implementation.
- Any child plan that requires one must return to a dedicated grill/master-plan decision rather than silently expanding scope.

Status:

Accepted. Master Plan 005 owns the nine tracks listed by the user and stops after the Documentation-domain grill. Every other capability above is a documented future phase or non-goal, not hidden implementation work in this master.

Decision records:

- This grill record
- Master plan `005`

## Closure

The session is decision-complete. Questions 1 through 21 and 23 through 40 are accepted. Q22 was withdrawn because no production records or external compatibility consumers require a legacy-row mapping.

Durable decisions are recorded in:

- `CONTEXT.md`
- `docs/adr/0021-project-versions-are-release-contexts.md`
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`
- `docs/adr/0023-comprehensive-audit-and-access-evidence-from-day-one.md`
- `docs/adr/0024-project-membership-governs-project-access.md`
- `docs/adr/0025-core-domain-persistence-is-explicitly-relational.md`
- `docs/adr/0026-publish-links-are-multi-version-artifact-manifests.md`
- `docs/plan/111-project-version-and-artifact-edition-grill.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

The accepted implementation dependency order is Audit/Access Foundation, Project Membership, Project Version, Capture version scoping, Guide/Demo Edition/Revision/Publication integration, UI modernization, cross-workflow closeout, and then the Documentation-domain grill. No runtime code, migration, route, or UI was changed during this session.
