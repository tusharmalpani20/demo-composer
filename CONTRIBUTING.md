# Contributing

Demo Composer is an alpha-stage open-source project for screenshot-first browser workflow capture and Scribe-style guide publishing.

## Workflow

- Start with a plan in `docs/plan/` for meaningful feature, architecture, or hardening work.
- Use focused commits that keep the repository buildable.
- Keep docs updated when behavior, setup, security posture, or product scope changes.
- Use ADRs in `docs/adr/` for durable architecture decisions.

## Development

Install dependencies:

```bash
pnpm install
```

Use the setup guide for database, environment, and storage details:

```text
docs/development-setup.md
```

## Testing

Feature work should follow a TDD loop where practical: add a failing behavior test, implement the smallest change, then refactor while green.

Before opening a pull request, run:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

For backend persistence changes, also run:

```bash
rtk pnpm --filter server test:db
```

## Pull Requests

Include:

- what changed
- why it changed
- tests/checks run
- docs updated, if applicable

Avoid unrelated refactors in feature PRs.

## Scope Notes

AI, analytics, sales tracking, and Storylane-style interactive demos are deferred from the current MVP. The current product path is capture sessions to editable guides to published guide links.
