# Ossie Rename Compatibility Checklist

Date: 2026-07-10

Last reviewed: 2026-07-11

Status: Layer 1 display rename and the GitHub repository slug/remote portion of
Layer 2 are complete. Reopened child plan `110` now approves a clean-break
migration of active Layer 2 through Layer 4 identifiers; implementation is
pending.

## Purpose

Ossie is the product display brand. Child plan `110` initially left repository,
package, runtime configuration, and persistent identifiers stable. On 2026-07-11,
the user renamed the GitHub repository and authorized its remote/link update.
Other identifiers were initially retained to avoid breaking local scripts,
deployments, browser-extension protocols, sessions, storage, public links, or
migration history. On 2026-07-11 the user confirmed that the early-stage
repository has no production compatibility requirement and selected reopened
child plan `110` as the owner of the active technical migration.

This checklist remains the pre-implementation inventory. The Reopened Scope
Amendment and Phase 6 in child plan `110` authorize active Layer 2 through Layer
4 changes, while historical evidence, migration history, legal attribution, and
the external local-directory operation retain their explicit protections.

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
- The final local path target is `/home/tm/Desktop/work/ossie`; that move occurs
  only after implementation commits and shutdown of active tools.

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

Retained:

- local directory `/home/tm/Desktop/work/demo_composer_v2`;
- root Git repository working-tree identity;
- historical file paths and commit references.

Any further repository-identity plan must verify CI checkout, badges, deployment
integrations, contributor clones, local workspace moves, and external links.
Moving the local directory while tools are running is explicitly prohibited.

## Layer 3: Package Identity

Retained:

- root package name `demo_composer_v2`;
- app package names `server`, `web`, `extension`, and `docs`;
- `@repo/*` workspace package names and imports;
- lockfile importer/package references; and
- any future image or registry names derived from current package metadata.

A future package plan must decide whether any change creates user value. The
display brand does not require package churn by itself.

## Layer 4: Runtime Configuration

Retained:

- every `DEMO_COMPOSER_*` environment variable;
- `demo_composer_session` and public-viewer cookie names;
- `x-demo-composer-client`;
- `demo_composer:page_click` and other extension message/storage strings;
- `demo-composer-api` and other service identifiers;
- Docker container, database, volume, network, storage-root, and test-fixture
  names;
- CORS, public URL, cookie, and deployment configuration contracts; and
- deployed secrets and operator configuration.

A future runtime-configuration plan must use compatibility aliases and a
documented deprecation window where operators could already depend on a name.
It must not silently invalidate sessions, extension connections, storage, or
deployment secrets.

## Layer 5: Persistent Identifiers

Retained:

- all database schemas, tables, columns, constraints, indexes, and comments;
- migration filenames, checksums, ordering, and historical SQL;
- API route paths, request/response field names, and error types;
- public slugs, published URLs, embeds, and external references;
- storage object paths and keys; and
- persisted extension/browser storage keys.

Existing migration history must never be rewritten for branding. A future plan
may add a forward migration or compatibility behavior only when there is a
concrete product or operational reason.

## Legal And Historical Material

Retained:

- the `LICENSE` attribution naming Demo Composer contributors;
- accepted ADRs, completed plans, grill records, smoke evidence, and historical
  screenshots that accurately record the old display name;
- repository-local skill directory names such as
  `build-demo-composer-slice`; and
- pinned external-skill provenance and quoted upstream material.

Changing legal attribution requires an explicit legal decision. Historical
records must not be rewritten to imply that Ossie was the name when those
decisions or screenshots were created.

## Required Gate For A Technical Rename

Before any unchecked layer changes:

1. Accept a dedicated technical-rename plan and exact layer boundary.
2. Re-run name, path, package, environment, cookie, header, extension-message,
   storage, route, database, and external-link inventories.
3. Define backward compatibility, redirects, aliases, rollout, rollback, and
   operator communication.
4. Add tests before changing behavior.
5. Prove portal, API, extension, docs, CI, database, and deployment workflows.
6. Keep migrations append-only and public URLs compatible.
