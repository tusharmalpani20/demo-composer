# OSS Alpha Launch Polish Plan

Date: 2026-06-16

Status: Implemented.

## Goal

Make Demo Composer present well as a public alpha open-source repository.

Plan `067` makes the docs factually correct. This plan makes the repo easier to understand, evaluate, and contribute to when someone lands on it from GitHub, a social link, or an OSS application form.

Target outcome:

```text
external reader opens public repo
  -> understands what Demo Composer is in under one minute
  -> sees what is usable today
  -> sees alpha limitations clearly
  -> sees how to run/check the project
  -> sees a credible roadmap
  -> can open useful issues or contribute safely
```

## Dependencies

Implement this after:

- `067-docs-freshness-and-status-sync.md`
- `068-end-to-end-dogfood-smoke-suite.md`

Plan `069` should not fight stale docs or unproven flow claims. It should build on synchronized docs from plan `067` and smoke evidence/known limitations from plan `068`.

## Current Baseline

Already present:

- AGPL license
- `CONTRIBUTING.md`
- `SECURITY.md`
- `.github/workflows/ci.yml`
- `.github/pull_request_template.md`
- Docker Compose for local PostgreSQL
- self-hosting docs
- production readiness checklist
- operations guide
- extension README

Still weak for public alpha launch:

- README has no product screenshots, diagrams, or concrete visual evidence.
- README does not yet sell the two-output product clearly.
- README does not have a crisp alpha roadmap.
- issue templates are missing.
- known limitations are not grouped for external readers.
- contributor entry points are not obvious.
- no clear "good first areas" document exists.
- no public launch checklist exists.
- no Codex-for-OSS/application-ready repo summary exists.
- no concise public summary of dogfooded v1 flows exists yet; plan `068` should produce that input.

## Scope

### README Launch Polish

After plans `067` and `068`, improve README as the public front door.

Add or improve:

- one-paragraph product pitch
- current alpha status badge/text
- short feature matrix:
  - capture
  - guide authoring
  - interactive demos
  - publishing
  - extension
  - self-hosting
- "What works today"
- "What is intentionally deferred"
- "Quick local path"
- "Self-hosting path"
- "Architecture at a glance"
- "Roadmap"
- links to deeper docs
- link to the v1 dogfood smoke suite/result notes from plan `068`

Keep README honest. Do not oversell:

- HTML replay is not built.
- analytics and lead capture are not built.
- one-command production deployment is deferred.
- extension is alpha and requires unpacked loading.

### Visual Assets

Add lightweight visual proof if available or practical:

- screenshots of guide editor
- screenshot of public guide reader
- screenshot of interactive demo editor
- screenshot of public demo viewer
- screenshot of extension popup

Recommended location:

```text
docs/assets/
```

If real screenshots are not available in this slice, add text-only TODO notes and do not add fake product screenshots or placeholder images.

Do not block the launch docs on polished marketing design.

### Roadmap

Add a concise roadmap section or `docs/roadmap.md`.

Recommended buckets:

- Alpha now:
  - screenshot-first capture
  - guides
  - interactive demos
  - self-hosted setup
- V1 hardening:
  - follow-ups discovered by the dogfood smoke suite
  - editor usability
  - extension reliability
  - docs polish
- Later:
  - HTML capture/replay
  - analytics
  - lead capture
  - branding
  - AI/BYO-key optional layer
  - one-command deployment packaging

The roadmap should reflect decisions already made in ADRs and grill notes.

### Smoke Evidence Summary

Use the result of plan `068` to add a short, honest alpha confidence note:

- which flows were smoke-tested
- which flows are covered by automated DB smoke
- which browser/extension flows require manual verification
- which known limitations remain

This should be brief in README and more detailed in `docs/v1-dogfood-smoke-suite.md`.

### Known Limitations

Add a public-facing limitations section or doc.

Must include:

- alpha quality
- no hosted SaaS signup flow yet
- no Chrome Web Store distribution
- no HTML replay
- screenshot-first capture
- no analytics or lead capture
- no automated local storage cleanup
- in-memory rate limiting only
- local file storage provider only
- manual operational backup/restore responsibility

### GitHub Issue Templates

Add `.github/ISSUE_TEMPLATE/` with simple templates:

- `bug_report.md`
- `feature_request.md`
- `documentation.md`

Keep templates short and practical.

Bug report should ask for:

- component: server/web/extension/docs
- environment
- steps to reproduce
- expected/actual behavior
- logs/screenshots if safe
- whether secrets/tokens were removed

Feature request should ask for:

- workflow
- target user
- expected value
- whether it belongs to guides, interactive demos, capture, publishing, or ops

Documentation request should ask for:

- stale/missing doc
- expected correction
- related feature/plan if known

### Contributor Entry Points

Add a short `docs/contributor-guide.md` or expand `CONTRIBUTING.md` with:

- repo layout
- test commands
- how plans work
- how to pick work
- current good first areas
- how to avoid touching unrelated legacy/stale docs

Good first areas should be docs/tests/UI polish, not deep auth/publish/security rewrites.

### OSS Application/Launch Summary

Add a short `docs/oss-alpha-summary.md` that can be reused for:

- GitHub repo description
- OpenAI Codex for OSS application
- launch posts
- maintainer notes

It should explain:

- what Demo Composer does
- why self-hosted/open-source matters
- what is implemented today
- why it is useful to internal teams
- what help is needed from contributors

Do not include private goals, credentials, or unsupported claims.

## Explicit Non-Goals

- Do not implement product features.
- Do not add analytics, lead capture, or branding features.
- Do not add one-command production packaging.
- Do not add fake screenshots or generated UI mockups that do not match the app.
- Do not rewrite ADRs or historical grill docs.
- Do not apply for Codex for OSS from this repo; this plan only prepares the repo.

## Recommended Implementation Order

1. Confirm plan `067` has landed and README/status docs are factually current.
2. Confirm plan `068` has landed. If manual smoke could not be fully run, keep that limitation explicit in README and `docs/v1-dogfood-smoke-suite.md`.
3. Add public-facing README polish:
   - pitch
   - feature matrix
   - current capabilities
   - limitations
   - roadmap links
   - smoke evidence link
4. Add `docs/roadmap.md` if README would become too long.
5. Add `docs/oss-alpha-summary.md`.
6. Add GitHub issue templates.
7. Add or update contributor entry-point guidance.
8. Add real screenshots under `docs/assets/` only if quickly available and truthful.
9. Run repo text/format checks and `rtk git diff --check`.

## Acceptance Criteria

- README makes Demo Composer understandable to a first-time OSS reader.
- README clearly says the project is alpha.
- README clearly presents both:
  - Scribe-style guide flow
  - Storylane-style interactive demo flow
- README links to self-hosting, operations, project status, roadmap, contribution, and security docs.
- README links to the v1 dogfood smoke suite and clearly notes pending manual smoke items if plan `068` could not fully run them.
- known limitations are explicit and honest.
- roadmap exists and matches current product decisions.
- GitHub issue templates exist for bugs, features, and docs.
- contributor entry points are easy to find.
- no product code behavior changes are made.
- no false marketing claims are added.
- no private URLs/secrets/tokens are introduced.
- `rtk git diff --check` passes.

## Implementation Notes

- Rewrote `README.md` as an OSS alpha front door with product pitch, feature matrix, current capabilities, deferred scope, quick local path, extension instructions, verification commands, architecture summary, and links to key docs.
- Updated `CONTRIBUTING.md` to reflect that interactive demos are now built at alpha level and to point contributors to the contributor guide and smoke command.
- Added `docs/roadmap.md` with alpha-now, V1-hardening, later, and not-planned-for-v1 sections.
- Added `docs/contributor-guide.md` with repo layout, planning flow, test commands, backend pattern, good first areas, and privacy notes.
- Added `docs/oss-alpha-summary.md` for public repo/application/launch reuse.
- Added GitHub issue templates for bug reports, feature requests, and documentation issues.
- Refreshed `docs/project-zoomout-status.md` and `docs/backend-route-inventory.md` so README-linked status docs do not contradict current guide/demo/org/publish behavior.
- Did not add screenshots because no fresh truthful product screenshots were produced in this slice.

## Suggested Commit Shape

Recommended commits:

1. `Polish README for OSS alpha`
2. `Add OSS roadmap and launch summary`
3. `Add GitHub issue templates`
4. `Document contributor entry points`

If screenshots are added:

5. `Add alpha product screenshots`

## Out Of Scope

- end-to-end smoke suite
- Playwright/browser automation for screenshots
- production Docker packaging
- release automation
- hosted landing page
- telemetry
- analytics
- lead capture
- Chrome Web Store submission
