# Child Plan 111: Project Version And Artifact Edition Grill

Date: 2026-07-10

Status: Complete.

## Goal

Resolve Project Version, Project Membership, Artifact/Edition/Revision/Publication, Carry-Forward, Publish Link, persistence, and audit/access foundations before runtime implementation.

## Session Record

- `docs/grill/2026-07-10-project-version-and-artifact-edition-grill.md`

The session accepted questions 1 through 21 and 23 through 40. Question 22, which asked for a legacy-row migration mapping, was withdrawn because the repository is pre-live and development/test databases may reset and reseed for one clean coordinated schema/client transition.

## Accepted Outcomes

- Project Versions are explicit Project release contexts with a real initial default `Main` record.
- Project Membership provides Project Admin, Editor, and Viewer authorization; Organization Owners retain implicit Project Admin access.
- Stable Artifacts span Project Versions through one Edition per Project Version, one mutable Working Draft per Edition, immutable Revisions, and immutable Published Artifacts.
- Carry-Forward creates independent relational working content, reuses protected immutable media, preserves lineage, and is atomic/idempotent.
- Publish Links are independently configured multi-version manifests for one Artifact.
- Core product, Revision, Publication, audit, and access persistence is explicit and relational rather than generic JSON/JSONB.
- Every committed mutation and meaningful access receives append-only evidence with accepted visibility, retention, and database-runtime protection.
- Breaking schema/API/client changes and development/test reset/reseed are accepted before the first live release.
- Master Plan 005 owns Audit/Access, Project Membership, Project Version, current artifact integration, UI modernization, closeout, and the Documentation grill; Documentation runtime and Video remain later phases.

## Decision Records

- `CONTEXT.md`
- `docs/adr/0021-project-versions-are-release-contexts.md`
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`
- `docs/adr/0023-comprehensive-audit-and-access-evidence-from-day-one.md`
- `docs/adr/0024-project-membership-governs-project-access.md`
- `docs/adr/0025-core-domain-persistence-is-explicitly-relational.md`
- `docs/adr/0026-publish-links-are-multi-version-artifact-manifests.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Implementation Handoff

The accepted dependency order after repository workflow/documentation truth work is:

1. Child `112`: Audit Evidence Core.
2. Child `113`: Existing Mutation Audit Coverage.
3. Child `114`: Access Evidence and Compliance Timelines.
4. Child `115`: Project Membership Foundation.
5. Child `116`: Project Version Foundation.
6. Child `117`: Capture Source Version Scoping.
7. Child `118`: Guide/Demo Edition and Working Draft Relational Foundation.
8. Child `119`: Guide/Demo Revision, Carry-Forward, and Protected Assets.
9. Child `120`: Publication and Multi-Version Publish Link Integration.
10. Children `121` through `130`: design/UI modernization and pre-Documentation closeout.
11. Child `131`: Documentation Domain Grill; Documentation implementation planning begins at `132`.

No migration, runtime feature, route, or UI implementation was performed during this grill.

## Verification

- Grill questions are sequential and contain explicit accepted/withdrawn status.
- `CONTEXT.md` reflects accepted canonical terms and relationships.
- Master Plan 005 contains the accepted child-plan dependency order and scope boundary.
- ADRs record only hard-to-reverse accepted architectural tradeoffs.
- Prettier and `git diff --check` pass for the changed planning/domain documents.
