---
name: build-ossie-slice
description: Expand, recheck, implement, verify, and close one Ossie master-plan child from end to end. Use when creating or executing a child plan, resuming a partial child, checking whether a child is implementation-ready, closing its records, or preparing a stable handoff for later sequential or overnight execution.
---

# Build Ossie Slice

Deliver one child-plan boundary completely. Do not implement the queue or
overnight runner from this skill.

## Select The Requested Mode

- For an implementation-readiness, expansion, recheck, or planning-only request,
  complete preflight, expansion, and decision classification, then return a
  readiness report. Do not edit runtime code or continue into TDD.
- For an explicit implementation request, continue through implementation,
  verification, and same-child closeout.
- For a closeout-only request, verify the existing result before updating status;
  do not assume earlier implementation is complete.

When the prompt does not identify a concrete child plan, provide the reusable
checklist and state that plan-specific readiness remains unverified.

## 1. Preflight

1. Read `AGENTS.md`, `CONTEXT.md`, relevant ADRs, the parent master plan, and the
   complete active child plan.
2. Inspect `git status` and recent history. Preserve unrelated user/agent work and
   never destructively reset it.
3. Reinspect every current file, route, contract, schema, migration, test, and UI
   surface named by the child. Discover facts instead of relying on plan-era
   assumptions.
4. Record the starting commit, baseline commands, failures, environment limits,
   and ownership boundaries.
5. Confirm preceding child gates are genuinely complete.

## 2. Expand And Recheck

Make the child implementation-ready before runtime changes:

- list exact affected and explicitly out-of-scope files;
- define behavior, authorization, data, API, UI, error, migration/reset/reseed,
  audit/access, and compatibility contracts as applicable;
- identify shared packages and apply the repository reuse gate before moving an
  app-local contract;
- define focused tests, broad regression checks, browser evidence, acceptance,
  commit boundaries, leftovers, and next handoff;
- update plan/docs first when current inspection materially changes the accepted
  implementation path.

Do not reopen an accepted grill merely because implementation begins.

## 3. Classify Decisions

### Continue Without User Input

Choose, document, and continue when the option:

- stays inside accepted plans, `CONTEXT.md`, and ADRs;
- follows an existing repository pattern;
- is reversible and locally testable;
- preserves user-facing semantics, security, privacy, retention, tenant
  isolation, and immutability;
- adds no major dependency, service, license issue, or destructive operation.

Examples include helper placement, test organization, synthetic fixtures, small
refactors, and indexes justified by accepted queries.

### Stop For A Critical Decision

Stop when a choice:

- contradicts canonical decisions or materially changes child scope/order;
- changes Project Version, Artifact, Edition, Revision, Publication, permission,
  audit, access, protected-asset, deletion, retention, or public URL semantics;
- affects tenant isolation, authentication, credentials, privacy, deployment, or
  destructive infrastructure/Git behavior;
- introduces major framework/service/license lock-in;
- requires product-name or design-direction acceptance.

Ask one concise question. Include the recommendation, alternatives, repository
evidence, reversibility, and exact affected scope. Do not escalate routine details.

## 4. Record The Planning Checkpoint

When the expansion changes durable plan content, format and verify it, then keep
that checkpoint attributable before implementation. Do not mix unrelated child
work into the same commit.

## 5. Implement With TDD

1. Establish the smallest meaningful failing focused test.
2. Implement the smallest coherent behavior that passes it.
3. Refactor only with tests green.
4. Repeat across each contract boundary.
5. Prefer existing domain packages, typed contracts, repository/service patterns,
   UI primitives, and transaction helpers.
6. Keep tenant checks explicit. For mutable workflows, integrate the accepted
   audit/access mechanism when its foundation exists; do not invent a competing
   event store.
7. Follow the accepted schema transition strategy. Never hide core domain state
   in JSON when the active plan requires explicit relational persistence.

## 6. Verify

- Run focused tests during development.
- Run type checks, lint, build, and the broad non-database test set required by
  the child.
- Run configured DB and smoke suites when persistence or server workflows change.
- Use `dogfood-ossie` and a real browser for visible workflows.
- Verify loading, empty, error, permission, destructive, responsive, keyboard,
  zoom/reflow, console, and network states as applicable.
- Record exact commands, outcomes, pre-existing failures, and unavailable
  capabilities. Never infer a pass.

## 7. Close The Same Child

Close only when acceptance is genuinely met:

1. Update status and last-reviewed date.
2. Complete the implementation log with commits, files, migrations, commands,
   browser evidence, decisions, and failures.
3. Mark checklist items individually.
4. Record leftovers without hiding required incomplete work.
5. Update the parent master status/checklist and exact next handoff.
6. Re-run formatting and whitespace checks after documentation closeout.
7. Commit closeout separately when that keeps implementation history clear.

## Stable Final Summary

Return fields a future operator can consume:

```text
Plan: <child number and title>
Outcome: complete | blocked | incomplete
Commits: <ordered hashes and subjects>
Verification: <commands and outcomes>
Critical decisions: <none or unresolved items>
Leftovers: <explicit list>
Next executable child: <number/title or gated activity>
```

Do not call a partial implementation complete, and do not advance the queue past
an unmet acceptance or critical-decision gate.
