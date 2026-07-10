# OSS Alpha Summary

Ossie is a self-hosted open-source tool for creating product walkthrough artifacts from browser workflows.

## Short Description

Self-hosted screenshot-first workflow capture for Scribe-style guides and Storylane-style interactive demos.

## What It Does

Ossie lets a team capture browser workflow source material, reuse that source as a Capture Session, and create two separate outputs:

- step-by-step guides for internal documentation, onboarding, support, and enablement
- interactive demos with scenes and hotspots for walkthrough-style sharing

Both guides and demos can be published as immutable snapshots behind public/restricted links, password gates, and embeds.

## Next Platform Direction

Master Plan `005` will add relational Audit and Access Evidence, Project Membership, Project Versions, version-scoped Capture source, and Guide/Demo Editions, Working Drafts, Revisions, Publications, protected assets, and multi-version Publish Links. These are accepted targets, not alpha capabilities.

Product Documentation is the next artifact family to grill after the foundation. It is distinct from Guides and from `apps/docs`, the repository documentation hub. Loom-style Video is later and does not yet have an accepted runtime model.

## Why Open Source Matters

Workflow captures often contain internal product screens, operational processes, or customer-adjacent context. A self-hosted OSS option lets teams own their storage, review the capture/publish code paths, and avoid forcing sensitive internal documentation into a closed SaaS product.

## Implemented In Alpha

- first-run setup, auth, projects, and org membership basics
- screenshot-first capture sessions
- Chrome extension capture with automatic click capture MVP in code/tests; automatic click capture now has screenshot-backed 2026-07-07 browser evidence through generated guide/demo source material, split-origin portal navigation is closed, and true toolbar-popup manual validation remains pending
- manual portal capture and screenshot upload
- guide generation, editing, preview, publishing, password access, embeds, Markdown export, and HTML ZIP export
- interactive demo generation, editing, hotspots, publishing, password access, embeds, and public viewer
- README screenshots from safe synthetic dogfood and modern UI browser-fixture data
- compact `apps/docs` alpha docs hub linking to source markdown docs and safe screenshot evidence
- organization invites
- production config hardening basics
- DB-backed v1 smoke workflow

## Known Limits

- alpha quality
- true toolbar-popup manual Chrome extension dogfood evidence remains pending
- direct extension-page manual fallback after automatic clicks needs duplicate event-index follow-up
- no HTML replay
- no analytics or lead capture
- no custom branding
- no hosted SaaS signup flow
- no Chrome Web Store distribution
- no one-command production deployment packaging
- local file storage only
- in-memory rate limiting only
- manual storage cleanup and backup responsibility
- no Product Documentation authoring or Loom-style Video implementation

## Help Wanted

- extension reliability dogfooding
- guide/editor usability polish
- interactive demo editor polish
- docs and setup clarity
- tests around important user workflows
- security review of auth, uploads, storage, public links, embeds, and extension flows
