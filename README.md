# Demo Composer

Demo Composer is an alpha-stage, self-hosted open-source tool for turning browser workflows into two reusable outputs: Scribe-style step-by-step guides and Storylane-style interactive demos. It is built for internal documentation, onboarding, support, and sales enablement teams that want screenshot-first workflow capture without depending on a closed SaaS product.

> Alpha status: the core capture-to-guide and capture-to-demo paths exist, but the project still needs more dogfooding, packaging, editor polish, and extension reliability work before it should be treated as production-ready.

## What Works Today

| Area              | Current alpha capability                                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Setup and auth    | Web first-run setup, password login, cookie-backed portal sessions, and organization-scoped users.                                                                                       |
| Projects          | Project creation, project workspace, settings, archive/unarchive, and project-scoped artifacts.                                                                                          |
| Capture           | Manual portal capture sessions, screenshot upload, ordered capture events, event editing, and Chrome extension capture.                                                                  |
| Extension         | Instance URL setup, login, project selection, manual screenshot fallback, automatic click capture MVP, finish-and-open portal flow.                                                      |
| Guides            | Generate guides from capture sessions, edit blocks and steps, manage screenshots, annotate screenshots, preview, publish, password-protect, embed, export Markdown, and export HTML ZIP. |
| Interactive demos | Generate demos from capture sessions, edit scenes, add hotspots, publish, password-protect, embed, and view public demos.                                                                |
| Sharing           | Immutable publish snapshots for guides and demos with public/restricted access controls.                                                                                                 |
| Team basics       | Organization invite creation, invite acceptance, and member access to shared projects.                                                                                                   |
| Operations        | Local PostgreSQL, local file storage, health/readiness endpoints, CORS/cookie hardening, rate limits, and documented backup/restore expectations.                                        |

The DB-backed v1 smoke workflow now proves the main backend path from first-run setup to published guide/demo and accepted teammate invite. See [V1 dogfood smoke suite](docs/v1-dogfood-smoke-suite.md).

## Product Shape

```text
browser workflow
  -> screenshots and capture events
  -> reusable capture session
  -> editable guide
  -> editable interactive demo
  -> public/private published links
```

The product intentionally keeps guides and interactive demos separate. A capture session is source material; guides and demos are authored outputs created from that source.

## Intentionally Deferred

- HTML capture/replay is not built; v1 is screenshot-first.
- AI/BYO-key authoring is deferred.
- Analytics, lead capture, sales tracking, and custom branding are not built.
- Hosted SaaS signup is not built; the current path is self-hosted first-run setup.
- Chrome Web Store packaging is not done; the extension is loaded unpacked.
- One-command production deployment packaging is deferred.
- Automated retention cleanup is not built.
- Local file storage is the only storage provider.
- Rate limiting is in-memory and should be replaced before multi-instance production deployments.
- Operators are responsible for database and local file storage backup/restore.
- Product screenshots are still pending; do not treat the README as visual proof yet.

## Quick Local Path

Install dependencies:

```bash
pnpm install
```

Start local PostgreSQL if you want the provided development database:

```bash
docker compose up -d postgres
```

Configure `apps/server/.env-cmdrc` from `apps/server/.env-cmdrc.example`, then create and migrate the database:

```bash
rtk pnpm --filter server db:create
rtk pnpm --filter server migrate:up
```

Run the API and web portal:

```bash
rtk pnpm --filter server dev
rtk pnpm --filter web dev
```

Open the portal, complete first-run setup, create a project, then create a capture session.

More detail: [development setup](docs/development-setup.md) and [self-hosting quickstart](docs/self-hosting.md).

## Chrome Extension

Build and load the extension:

```bash
rtk pnpm --filter extension build
```

Load `apps/extension/dist` as an unpacked extension from `chrome://extensions`.

Extension details: [apps/extension/README.md](apps/extension/README.md).

## Verification

Common checks:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

DB-backed checks:

```bash
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

DB checks require a real PostgreSQL testing database configured through `apps/server/.env-cmdrc`.

## Architecture At A Glance

```text
apps/server     Fastify REST API, PostgreSQL, local file storage
apps/web        React/Vite portal plus public guide/demo readers
apps/extension  React/Vite Chrome extension popup and capture worker
packages/*      Shared repo tooling placeholders; product contracts stay near owners for now
```

The backend is organized as domain modules under `apps/server/src/modules/*` with routes, services, repositories, and focused tests. The portal uses a lightweight custom route parser for now.

## Documentation

- [Project status](docs/project-zoomout-status.md)
- [Roadmap](docs/roadmap.md)
- [Self-hosting](docs/self-hosting.md)
- [Operations](docs/operations.md)
- [Production readiness checklist](docs/production-readiness-checklist.md)
- [Backend route inventory](docs/backend-route-inventory.md)
- [V1 dogfood smoke suite](docs/v1-dogfood-smoke-suite.md)
- [Contributor guide](docs/contributor-guide.md)
- [Security policy](SECURITY.md)
- [OSS alpha summary](docs/oss-alpha-summary.md)

## Contributing And Security

Start with [CONTRIBUTING.md](CONTRIBUTING.md), then use [docs/contributor-guide.md](docs/contributor-guide.md) for repo layout, test commands, planning flow, and good first areas.

Security reports should follow [SECURITY.md](SECURITY.md).

## License

Demo Composer is licensed under the GNU Affero General Public License v3.0 only. See [LICENSE](LICENSE).
