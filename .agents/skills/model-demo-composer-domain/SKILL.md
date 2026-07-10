---
name: model-demo-composer-domain
description: Resolve Demo Composer product and domain language, ownership, lifecycle, relationships, persistence meaning, and durable decision boundaries. Use when a task introduces or questions terms such as version, Project Version, Artifact, Edition, Working Draft, Revision, Publication, access, membership, audit, capture ownership, deletion, or when code and documentation appear to disagree about the domain model.
---

# Model Demo Composer Domain

Resolve domain questions from repository truth before proposing a new model.

## Gather Evidence

1. Read `CONTEXT.md` for canonical terms and ambiguity resolutions.
2. Find the relevant accepted ADRs under `docs/adr/`.
3. Read the active master and child plans when the question belongs to planned
   rather than shipped behavior.
4. Inspect current schema, contracts, code, routes, and tests for discoverable
   runtime facts. Do not ask the user to recall facts available in the repository.
5. Search for overloaded words including `version`, `page`, `demo`, `publication`,
   `recording`, `member`, `archive`, and `delete`.

Do not treat a plan, aspiration, or accepted future decision as current runtime
behavior. Do not treat an old implementation name as canonical when
`CONTEXT.md` or an accepted ADR deliberately replaced it.

## Analyze The Question

Separate findings into:

- **Current runtime:** behavior demonstrably implemented and tested now.
- **Accepted target:** behavior settled by canonical docs but not yet shipped.
- **Unresolved:** a real contradiction or product choice not settled by evidence.
- **Terminology repair:** ambiguous wording that can be corrected without
  changing behavior.

For each important noun, identify its identity, owner, scope, lifecycle,
mutability, authorization boundary, retention/deletion behavior, and relation to
neighboring concepts. Use qualified terms such as `Row Version`, `Project
Version`, `Artifact Edition`, `Artifact Revision`, and `Publication Sequence`
instead of `version` alone.

## Handle Contradictions

1. State the conflicting sources precisely with repository-relative paths.
2. Apply instruction and decision precedence from `AGENTS.md`.
3. Determine whether the difference is stale documentation, unimplemented target
   direction, or a genuinely new decision.
4. Stop implementation only for a genuine critical decision. Recommend an
   answer, alternatives, evidence, reversibility, and affected scope.
5. Continue with best engineering judgment for reversible wording or structure
   inside accepted boundaries.

Never silently resolve a contradiction by weakening tenant isolation,
authorization, protected assets, immutable source material, immutable
Publications, audit/access evidence, or accepted retention behavior.

## Update Canonical Material

- Update `CONTEXT.md` only when language is accepted and should become canonical.
- Update active direction docs when wording is stale but not a durable tradeoff.
- Propose an ADR only when the decision is consequential, surprising, difficult
  to reverse, and based on a real alternative.
- Never rewrite an accepted ADR to manufacture a different historical decision.
- Link to canonical sources instead of copying the glossary into plans, skills,
  or new reference files.

## Output Contract

Return:

1. The recommended term or model.
2. Current runtime facts.
3. Accepted target facts.
4. Any contradiction or unresolved decision.
5. Affected files/contracts and whether an ADR or grill is justified.

Keep uncertainty explicit. If no decision is needed, say so and continue.
