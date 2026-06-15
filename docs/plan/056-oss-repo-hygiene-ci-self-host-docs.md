# OSS Repo Hygiene CI And Self-Host Docs Plan

Date: 2026-06-15

Status: Planned.

## Goal

Make the repository ready for public open-source consumption by adding licensing, contribution/security docs, CI, and a clear self-host/development path.

Target outcome:

```text
new contributor
  -> opens repository
  -> sees what Demo Composer is
  -> sees license and contribution policy
  -> can start local dev with documented env/database/storage setup
  -> CI proves tests/build/lint pass
  -> self-host user has a clear setup path
```

This is repo hardening, not product feature work.

## Why This Comes Next

After plans 053-055:

- first-run setup is usable from the browser
- backend config is safer
- AI/legacy leftovers are removed

The next OSS blocker is trust and operability. A public repo needs:

- license
- contribution guidance
- security policy
- CI
- clear env docs
- self-host quickstart
- release/build notes for server, web, and extension

Without those, the application may work technically but still feel private and unfinished.

## Existing Docs To Reuse

Relevant files:

```text
README.md
CONTEXT.md
docs/development-setup.md
docs/production-readiness-checklist.md
docs/project-zoomout-status.md
docs/backend-route-inventory.md
apps/server/.env-cmdrc.example
```

Do not duplicate all docs into README. README should be the entry point and link deeper docs.

## Scope

Included:

- add `LICENSE`
- add `CONTRIBUTING.md`
- add `SECURITY.md`
- add basic `.github/workflows/ci.yml`
- add or update `.github/pull_request_template.md` if useful
- improve README OSS positioning
- update development setup with one clean local path
- add self-host quickstart doc
- add Docker Compose if we decide it is low-risk
- document extension loading from build output
- document required env variables and safe defaults
- update production readiness checklist with first-run setup and CORS/cookie checks from plan 054

Excluded:

- cloud deployment guides for specific providers
- Helm/Kubernetes
- Terraform
- release automation
- package publishing
- Chrome Web Store publishing
- hosted SaaS signup
- analytics
- interactive demo implementation

## License Decision

Recommended license: `AGPL-3.0` or `Apache-2.0`, depending on intended product strategy.

Decision needed before implementation:

- `AGPL-3.0` if we want network-use source sharing and stronger open-source reciprocity
- `Apache-2.0` if we want broad commercial adoption and fewer restrictions
- `MIT` if we want maximum permissiveness

If no explicit decision is made during implementation, ask before adding `LICENSE`.

## CI Design

Add:

```text
.github/workflows/ci.yml
```

Recommended jobs:

```text
install
  -> pnpm install --frozen-lockfile

static
  -> pnpm check-types
  -> pnpm lint
  -> pnpm build

tests
  -> pnpm --filter server test
  -> pnpm --filter web test
  -> pnpm --filter extension test
```

Recommended GitHub Actions setup:

- `actions/checkout`
- `actions/setup-node` with Node 22 or the repo-supported LTS
- enable `corepack`
- activate pnpm 9
- cache pnpm store if straightforward
- run commands from the repo root

DB tests are valuable but need PostgreSQL service setup. Two options:

1. Add DB integration tests to CI immediately with a Postgres service.
2. Keep DB tests documented/manual in this phase and add CI DB tests in a later hardening plan.

Recommendation: add Postgres service now if `.env-cmdrc` testing can be generated safely in CI without secrets.

If DB tests are added in CI, the workflow should create a CI-only `.env-cmdrc` or set equivalent env values with:

```text
DEV_TYPE=testing
NODE_ENV=test
TZ=UTC
COOKIE_SECRET=ci-cookie-secret-at-least-20-chars
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=demo_composer_test
DB_MAX_POOL=10
```

Then run:

```bash
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
rtk pnpm --filter server run test:db
```

## Self-Host Docs

Add:

```text
docs/self-hosting.md
```

Cover:

- prerequisites
- clone/install
- configure `.env-cmdrc`
- create DB
- run migrations
- start server
- build/start web
- open portal
- complete first-run setup
- create first project
- load extension build
- configure extension instance URL
- capture screenshots
- publish guide
- storage path warning/backups
- reverse proxy/CORS/cookie notes

If Docker Compose is included:

```text
docker-compose.yml
```

Keep it simple:

- Postgres service
- optional server/web commands if reliable
- named volume for Postgres
- local volume for storage

Do not over-engineer production Docker in this phase.

## README Update

README should clearly say:

- current status: alpha
- current focus: screenshot-first capture-to-guide
- not built yet: Storylane-style interactive demos, AI, analytics
- apps:
  - `apps/server`
  - `apps/web`
  - `apps/extension`
  - `apps/docs`
- quick start points to `docs/development-setup.md` and `docs/self-hosting.md`
- verification commands
- license

## CONTRIBUTING

`CONTRIBUTING.md` should include:

- project status
- branch/commit expectations
- TDD expectation for feature work
- plan-doc workflow
- verification commands
- coding style notes
- where to add docs/ADRs/plans

## SECURITY

`SECURITY.md` should include:

- supported versions: alpha/unreleased
- how to report vulnerabilities
- do not open public issues with secrets/vulnerability details
- security-sensitive areas:
  - auth/session cookies
  - public guide access
  - file storage and asset streaming
  - extension capture
  - first-run setup

## Test Plan

Run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

If CI DB tests are added, verify workflow commands locally as much as possible:

```bash
rtk pnpm --filter server test:db
```

## Risks

- Adding Docker Compose can create maintenance load if it is not exercised.
- License choice is a product/business decision; do not guess silently.
- CI DB setup can be fragile if `.env-cmdrc` expects local-only values.
- Adding CI before config hardening can accidentally rely on unsafe defaults. Implement after plan 054.

## Commit Strategy

Suggested commits:

1. `Add OSS contribution and security docs`
2. `Add CI verification workflow`
3. `Document self-hosting setup`
4. `Refresh README for alpha OSS release`

## Acceptance Criteria

- repo has license, contribution, and security docs
- README describes the actual alpha product
- CI runs non-DB tests, type checks, build, and lint
- self-host docs explain first-run setup and extension setup
- production checklist reflects hardened config
- working tree has no generated build/storage artifacts
