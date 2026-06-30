# Roadmap

Date: 2026-06-22

Demo Composer is alpha software. This roadmap describes product direction, not a guarantee of dates.

## Alpha Now

- Web first-run setup for self-hosted instances.
- Password auth and organization-scoped portal users.
- Projects and project workspaces.
- Screenshot-first capture sessions.
- Manual portal screenshot upload and capture event ordering/editing.
- Chrome extension capture with instance URL setup, login, project selection, automatic click capture MVP, manual screenshot fallback, and finish-to-portal flow in code/tests; manual dogfood found capture and split-origin link failures.
- Scribe-style guide generation from capture sessions.
- Guide editor, preview, screenshot management, rectangle annotations, Markdown export, HTML ZIP export, publish controls, password access, and embeds.
- Storylane-style interactive demo generation from capture sessions.
- Interactive demo editor, scenes, hotspots, publish controls, password access, public viewer, and embeds.
- README portal screenshots from safe synthetic dogfood data.
- Compact `apps/docs` alpha docs hub linking to source markdown docs and safe screenshot evidence.
- Organization invite and member basics.
- Health/readiness endpoints, production config hardening, and DB-backed v1 smoke coverage.

## V1 Hardening

- Address manual portal dogfood findings from the 2026-06-22 smoke run.
- Address manual Chrome extension dogfood failures from the 2026-06-22 smoke run.
- Keep alpha screenshots current as portal/editor hardening changes the UI.
- Improve guide editor ergonomics for repeated authoring.
- Improve interactive demo editor usability and hotspot positioning polish.
- Improve extension reliability around tab permissions, page changes, and capture failures.
- Add clearer failure recovery for upload/storage edge cases.
- Keep README, project status, route inventory, and smoke docs synchronized with behavior.
- Strengthen storage cleanup and operational maintenance guidance.

## Later

- HTML capture/replay.
- Analytics and view tracking.
- Lead capture and sales-demo workflows.
- Custom branding controls.
- Optional AI/BYO-key authoring assistance.
- Additional export destinations such as PDF, DOCX, Confluence, Notion, or GitHub.
- Object storage provider support beyond local files.
- Multi-instance production rate limiting.
- One-command production deployment packaging.
- Chrome Web Store distribution.

## Not Planned For V1

- Hosted SaaS billing.
- Heavy analytics-first sales platform behavior.
- AI as a required product dependency.
- Automatic access to private/customer systems for examples or screenshots.
