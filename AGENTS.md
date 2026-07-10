# Repository Agent Guide

These instructions apply to the entire repository. More specific `AGENTS.md`
files, if added later, may narrow them for their subtree.

## Read First

Before consequential work, read the smallest relevant set in this order:

1. `CONTEXT.md` for canonical product and domain language.
2. Accepted decisions under `docs/adr/`.
3. The active master plan and child plan under `docs/plan/`.
4. Current code and tests for discoverable runtime facts.

Do not describe accepted future direction as behavior that is already shipped.

## Working Rules

- Preserve user and agent changes. Never destructively reset or discard work
  you did not create.
- Prefix shell commands with `rtk`. Prefer `rg` and `rg --files` for search.
- Use `apply_patch` for deliberate manual file edits.
- Follow existing package, module, contract, and test patterns before adding an
  abstraction or dependency.
- Use test-driven development for behavior changes: establish a failing test,
  make the smallest implementation pass, then refactor with tests green.
- Keep changes inside the active child-plan boundary. Surface unrelated defects
  without folding them into the same implementation.
- Agent skills are optional development guidance. They must never become an
  application build, runtime, deployment, or contributor prerequisite.

## Product Invariants

- Preserve Organization tenant isolation and explicit authorization.
- Keep Capture source material immutable except where an accepted plan says
  otherwise.
- Protect shared assets while drafts, Revisions, or Publications reference them.
- Keep published material immutable and do not weaken public-link access rules.
- Use accepted version-domain terms from `CONTEXT.md` and ADRs instead of the
  ambiguous word `version` by itself.
- Do not claim future Audit, Access, Project Version, Edition, Revision,
  Publication, Documentation, or Video behavior exists before it is implemented.

## Plans And Decisions

- Expand and recheck the active child against current code before implementation.
- Treat reversible, locally testable details inside accepted boundaries as
  agent-decidable. Choose, document, and continue.
- Stop for a critical decision that changes product semantics, permissions,
  tenant isolation, security, privacy, retention, deletion, immutable behavior,
  public URLs, major dependencies/licenses, child ordering, naming, or accepted
  design direction.
- When stopping, provide a recommendation, alternatives, evidence, reversibility,
  and affected scope. Do not ask the user to decide routine implementation
  details.
- Mark a child complete only after its acceptance criteria and verification pass.
  Update its status, implementation log, evidence, leftovers, handoff, and the
  parent master checklist in the same closeout.

## Repository-Local Skills

Prefer these procedural skills when their trigger matches:

- `model-demo-composer-domain` for domain terminology and durable decisions.
- `build-demo-composer-slice` for expanding, implementing, verifying, and
  closing a child plan.
- `design-demo-composer-ui` for product UI architecture, design, interaction,
  motion, and review.
- `dogfood-demo-composer` for browser-visible workflow validation and evidence.

Reviewed external skills under `.agents/skills/` provide supporting design,
React, motion, and accessibility guidance. They are subordinate to this file,
`CONTEXT.md`, accepted ADRs, and active plans. See `docs/agent-workflow.md` for
provenance, restrictions, updates, and removal.

## Verification

- Run focused tests while developing, then the broad checks required by the
  active plan.
- Use a real browser for browser-visible changes. Cover desktop, narrow mobile,
  keyboard operation, zoom/reflow, console errors, failed requests, loading,
  empty, error, permission, and destructive states as applicable.
- Use only synthetic fixtures and safe local URLs. Never commit customer data,
  private URLs, cookies, tokens, credentials, raw captured input, or private
  screenshots.
- Record a capability as blocked when the required browser, extension, database,
  or environment tool is unavailable. Do not manufacture evidence.
