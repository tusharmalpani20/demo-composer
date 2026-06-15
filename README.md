# Demo Composer

Demo Composer is an open-source, alpha-stage product for capturing browser workflows and turning them into polished walkthrough guides.

Current focus:

```text
screenshots
  -> capture sessions
  -> editable Scribe-style guides
  -> private preview
  -> published guide links
```

Not built yet: Storylane-style interactive demos, AI, analytics, lead capture, and sales-demo tracking.

## Apps

```text
apps/server     Fastify REST API
apps/web        React/Vite portal and public guide reader
apps/extension  React/Vite Chrome extension popup
apps/docs       Next.js docs app scaffold
```

Shared packages live under `packages/`. `@repo/types` and `@repo/constants` are currently placeholder packages after OSS hardening; product contracts live near their owning app/module until real cross-app reuse is needed.

## Quick Start

Install dependencies:

```bash
pnpm install
```

Development setup:

```text
docs/development-setup.md
```

Self-hosting quickstart:

```text
docs/self-hosting.md
```

Production checklist:

```text
docs/production-readiness-checklist.md
```

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
```

DB tests require a real PostgreSQL testing database configured through `apps/server/.env-cmdrc`.

## Extension

Build and load the Chrome extension from:

```text
apps/extension/dist
```

More details:

```text
apps/extension/README.md
```

## Project Docs

Current product status:

```text
docs/project-zoomout-status.md
```

Backend route inventory:

```text
docs/backend-route-inventory.md
```

System design guidance:

```text
docs/system-design-pattern.md
```

## Contributing And Security

```text
CONTRIBUTING.md
SECURITY.md
```

## License

License selection is pending. Do not assume a license until the project owner chooses one.
