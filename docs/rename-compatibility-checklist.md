# Ossie Rename Compatibility Checklist

Date: 2026-07-10

Last reviewed: 2026-07-11

Status: Complete. Layer 1, the active Layer 2 through Layer 4 clean-break
migration, and the external local-directory move are complete. Reopened child
plan `110` is closed.

## Purpose

Ossie is the product display brand. Child plan `110` initially left repository,
package, runtime configuration, and persistent identifiers stable. On 2026-07-11,
the user renamed the GitHub repository and authorized its remote/link update.
Other identifiers were initially retained to avoid breaking local scripts,
deployments, browser-extension protocols, sessions, storage, public links, or
migration history. On 2026-07-11 the user confirmed that the early-stage
repository has no production compatibility requirement and selected reopened
child plan `110` as the owner of the active technical migration.

This checklist preserves the pre-implementation inventory and records its final
outcome. The Reopened Scope Amendment and Phase 6 in child plan `110` authorized
active Layer 2 through Layer 4 changes, while historical evidence and migration
history retained their explicit protections.

## Reopened Execution Boundary

- Active package, environment, cookie, header, extension protocol/storage,
  Docker, database default, volume, service, storage, fixture, CI, and
  repository-local skill identities migrate to Ossie using a clean break.
- No compatibility aliases, customer-data backfill, or production rollout is
  required.
- Existing Docker volumes and storage are not deleted automatically.
- Database migration history and historically accurate plans/evidence are not
  rewritten solely for branding.
- `LICENSE` attribution changes only after the exact replacement line receives
  explicit user acceptance.
- The local workspace moved to `/home/tm/Desktop/work/ossie` only after the
  implementation and closeout commits and shutdown of active tools.

## Layer 1: Display Brand

- [x] Active product and contributor documentation says Ossie.
- [x] Portal login, setup, shell, invite, and fallback labels say Ossie.
- [x] Extension manifest name, page title, and popup label say Ossie.
- [x] Docs App name and metadata say Ossie.
- [x] Human-facing OpenAPI title and description say Ossie.
- [x] Tests asserting affected visible strings use Ossie.
- [x] Historical screenshots remain unedited and are labeled as pre-rename
      alpha evidence where shown in active documentation.
- [x] Logo implementation is deferred to child `121`; the accepted direction
      is an original octopus with all eight arms visible.

## Layer 2: Repository Identity

Completed on 2026-07-11:

- [x] GitHub repository slug is `tusharmalpani20/ossie`.
- [x] Git `origin` fetch/push URL is `git@github.com:tusharmalpani20/ossie.git`.
- [x] Active Docs App GitHub source and raw alpha-asset URLs use `ossie`.

- [x] Local workspace moved to `/home/tm/Desktop/work/ossie` after all commits
      and tool shutdown.

Preserved:

- historical file paths and commit references.

Any further repository-identity plan must verify CI checkout, badges, deployment
integrations, contributor clones, local workspace moves, and external links.

## Layer 3: Package Identity

Completed:

- [x] Root package name is `ossie`.

Retained because they are generic workspace roles rather than former-brand
identifiers:

- app package names `server`, `web`, `extension`, and `docs`;
- `@repo/*` workspace package names and imports;
- lockfile importer/package references; and
- any future image or registry names derived from current package metadata.

## Layer 4: Runtime Configuration

Completed using a clean break:

- [x] `OSSIE_*` and `VITE_OSSIE_*` environment variables.
- [x] `ossie_session` and `ossie_public_viewer` cookies.
- [x] `x-ossie-client` extension attribution header.
- [x] `ossie:page_click` extension message contract.
- [x] `ossie-api` service identifier and Ossie API documentation metadata.
- [x] Ossie Docker container, database default, volume key, storage-root,
      temporary-path, and test-fixture names.
- [x] CORS, public URL, cookie, deployment, CI, examples, and operator docs.

No compatibility aliases or deprecation window were added. Existing local web
sessions and extension capture state are intentionally reset by the clean
break. Existing Docker volumes and storage are not deleted automatically.

## Layer 5: Persistent Identifiers

Retained:

- all database schemas, tables, columns, constraints, indexes, and comments;
- migration filenames, checksums, ordering, and historical SQL;
- API route paths, request/response field names, and error types;
- public slugs, published URLs, embeds, and external references;
- storage object paths and keys; and
- persisted extension/browser storage keys that never contained the former
  product name.

Existing migration history must never be rewritten for branding. A future plan
may add a forward migration or compatibility behavior only when there is a
concrete product or operational reason.

## Legal And Historical Material

Completed:

- [x] User accepted the Ossie contributor attribution in `LICENSE`;
      AGPL-3.0-only terms remain unchanged.
- [x] Repository-local skills are renamed to `model-ossie-domain`,
      `build-ossie-slice`, `design-ossie-ui`, and `dogfood-ossie`.

Preserved:

- accepted ADRs, completed plans, grill records, smoke evidence, and historical
  screenshots that accurately record the old display name;
- pinned external-skill provenance and quoted upstream material.

Historical records are not rewritten to imply that Ossie was the name when
those decisions or screenshots were created.

## Required Gate For A Technical Rename

The reopened execution satisfied these gates:

1. [x] Reopen child plan `110` and accept the exact clean-break boundary.
2. [x] Re-run name, path, package, environment, cookie, header, extension-message,
       storage, route, database, and external-link inventories.
3. [x] Define backward compatibility, redirects, aliases, rollout, rollback, and
       operator communication.
4. [x] Add tests before changing behavior.
5. [x] Prove portal, API, extension, docs, CI, database, and deployment workflows.
6. [x] Keep migrations append-only and public URLs compatible.
