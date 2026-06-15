# Contributor Guide

Demo Composer is organized as a product monorepo. The project is alpha, so clear plans, focused tests, and truthful docs matter more than broad rewrites.

## Repo Layout

```text
apps/server     Fastify REST API, PostgreSQL migrations, domain modules
apps/web        React/Vite portal and public readers
apps/extension  Chrome extension popup and capture behavior
docs/           product decisions, plans, ADRs, operations, and roadmap
packages/       shared tooling placeholders
```

## Planning Flow

- Meaningful work starts in `docs/plan/`.
- Durable architecture decisions go in `docs/adr/`.
- Product/domain stress tests go in `docs/grill/`.
- Update docs when code behavior, setup, security posture, or product scope changes.

## Test Commands

Use the narrowest relevant checks while developing:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

DB tests require a real testing database configured through `apps/server/.env-cmdrc`.

## Backend Pattern

New backend domains should follow the current module style:

```text
apps/server/src/modules/<domain>/<domain>.routes.ts
apps/server/src/modules/<domain>/<domain>.service.ts
apps/server/src/modules/<domain>/<domain>.repository.ts
apps/server/src/modules/<domain>/<domain>.*.test.ts
```

Avoid reintroducing removed legacy ORCA-style routing.

## Good First Areas

- Documentation freshness.
- Missing or clearer tests around existing behavior.
- UI copy and empty/error states.
- Guide editor usability polish.
- Interactive demo editor usability polish.
- Extension error handling and reliability polish.
- Small route inventory or operations doc updates.

Avoid starting with deep auth, publish access, password security, storage, or migration rewrites unless there is a specific plan and test strategy.

## Privacy And Safety

- Do not commit customer screenshots, private URLs, invite tokens, cookies, bearer tokens, or local storage files.
- Use synthetic screenshots and example domains in docs/tests.
- Public snapshots should not expose internal storage keys or private source metadata.
