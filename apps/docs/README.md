# Demo Composer Docs App

`apps/docs` is the compact alpha documentation hub for Demo Composer.

It is intentionally not a full documentation system yet. The markdown files under the repo root and `docs/` remain the source of truth for setup, operations, roadmap, dogfood evidence, and contribution flow.

## Run Locally

```bash
rtk pnpm --filter docs dev
```

The app runs on port `3001`.

## Checks

```bash
rtk pnpm --filter docs test
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
rtk pnpm --filter docs build
```

## Content Rules

- Keep alpha limitations visible.
- Link to source markdown docs instead of copying every doc into the app.
- Use only safe synthetic screenshots from `docs/assets/alpha/`.
- Do not position Demo Composer as hosted SaaS.
