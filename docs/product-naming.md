# Product Naming Decision

Decision status: **Accepted**

Research date: 2026-07-10 (Asia/Calcutta)

Accepted on: 2026-07-10

## Decision

The product display name is **Ossie**.

- Exact spelling and capitalization: `Ossie`
- Spoken form: `OSS-ee`
- Short form: `Ossie`; no alternate short form is approved
- Possessive: `Ossie's` only in natural prose
- Product-family examples: `Ossie Guides`, `Ossie Demos`, `Ossie Docs`, and
  `Ossie Workspace`; these examples do not create runtime artifact families
- Immediate rename boundary: Layer 1 display brand only
- Deferred boundaries: repository, package, runtime configuration, and
  persistent identifiers

The accepted character direction is an original octopus with all eight arms
visible. On 2026-07-11, the user selected the GPT-generated Calm & Premium
purple octopus raster set as the working identity and instructed repository and
runtime integration. The renamed source exports and usage constraints are
recorded in `docs/brand/README.md`.

This working raster identity is not final visual-system acceptance. Child plan
`121` still owns review, refinement or replacement of the mark, palette,
typography, accessibility, small-size behavior, and the broader visual system.
In particular, the current raster artwork does not unambiguously demonstrate
all eight arms at every size. It must not be represented as an editable vector
master or as trademark/logo clearance.

The user selected Ossie after being shown the collision risks below. Selection
does not convert preliminary research into trademark, domain, or legal
clearance.

## Product Scope And Audience

Ossie is intended to become a project-organized internal knowledge platform.
The current alpha captures browser workflows and authors Guides and Interactive
Demos. The accepted next foundation adds Project Membership, Project Versions,
Audit and Access Evidence, and version-aware Guide/Demo Editions, Revisions,
and Publications. Product Documentation is the next artifact family to grill;
Loom-style Video is later.

The primary audience is organizations maintaining internal workflows,
onboarding, support knowledge, and repeatable product demonstrations. The name
must remain useful if the balance between Guides, Demos, Documentation, and
Video changes.

## Naming Criteria

Candidates were evaluated for:

- umbrella fit across current and future artifact families;
- internal knowledge and version-maintenance fit;
- pronunciation and spelling;
- memorability and personality;
- search and software-product collision risk;
- repository, domain, and package practicality;
- international and accessibility concerns;
- long-term flexibility; and
- cost of changing the existing alpha display brand.

## Territories Explored

1. Captured workflows becoming maintained knowledge: Threadleaf, Trace, Loom,
   and related composition/path language.
2. Project/version-aware sources of truth: Atlas, Codex, Archive, and related
   knowledge/workspace language.
3. Paths, manuals, and connected flows: Trail, Thread, Waymark, and related
   navigation language.
4. Direction-independent natural names: Gynura, Celosia, Wunderpus, and other
   plants, flowers, and animals.
5. Warm character names: Oswald, Orson, Otto, Barnaby, Tavio, and Ossie.

Candidates were reduced when they were too literal, difficult to spell,
strongly occupied, tied to one artifact family, or likely to be confused with
an existing character. The final user preference prioritized a warm character
name and an original octopus identity over a scientific or descriptive name.

## Finalist Matrix

Scores are 1 (weak/high risk) through 5 (strong/low risk). They are a consistent
comparison aid, not a legal conclusion.

| Criterion                       | Keep Demo Composer |  Ossie | Gynura | Wunderpus |
| ------------------------------- | -----------------: | -----: | -----: | --------: |
| Umbrella fit                    |                  2 |      4 |      5 |         4 |
| Internal knowledge fit          |                  3 |      3 |      3 |         3 |
| Pronunciation/spelling          |                  5 |      3 |      2 |         3 |
| Memorability                    |                  3 |      5 |      4 |         5 |
| Search/collision risk           |                  3 |      1 |      4 |         3 |
| Repository/package practicality |                  2 |      2 |      4 |         3 |
| International/accessibility     |                  5 |      3 |      2 |         2 |
| Future flexibility              |                  2 |      5 |      5 |         5 |
| Rename cost                     |                  5 |      4 |      4 |         4 |
| **Total / 45**                  |             **30** | **30** | **33** |    **32** |

The evidence-led recommendation was not to select Ossie without professional
clearance because its collision score is materially worse than the other
finalists. The user's accepted decision is nevertheless Ossie, with the risk
preserved rather than hidden.

## Dated Evidence

Jurisdiction assumptions for preliminary trademark research were India, the
United States, the European Union, and international registrations relevant to
a globally distributed open-source software product. Official trademark search
interfaces did not produce a conclusive record-level clearance in this pass.
Professional word-mark and logo clearance remains required before commercial
launch.

| Candidate     | Product/search evidence as of 2026-07-10                                                                                                                                                                                                                                             | GitHub/npm evidence                                                                                                                                                 | Domain signal                                                                                                                         | Assessment                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Demo Composer | Descriptive of the alpha but too narrow for Documentation and Video                                                                                                                                                                                                                  | The GitHub repository was renamed to `tusharmalpani20/ossie` on 2026-07-11; the unowned npm name `demo-composer` currently resolves to an unrelated `0.1.1` package | GitHub source links now use the accepted Ossie slug                                                                                   | Low migration cost, weak umbrella                                        |
| Ossie         | [Apache Ossie](https://incubator.apache.org/clutch/ossie.html) entered incubation in June 2026 for semantic metadata interchange; an older [OSSIE software-defined radio framework](https://www.machinedesign.com/archive/article/21817123/software-radio-free-virginia) also exists | [`apache/ossie`](https://github.com/apache/ossie) is active; `npm view ossie` reported a package unpublished in 2023, which is not availability                     | `ossie.com` responded to HTTP; `.dev`, `.app`, and `.io` did not resolve from this environment, which does not establish availability | High adjacent-software and search risk; user accepted knowingly          |
| Gynura        | A real purple-velvet plant name supported by [UF/IFAS](https://ask.ifas.ufl.edu/publication/EP346); no obvious major exact-name software product found in the preliminary scan                                                                                                       | Exact npm package returned 404; GitHub exact-name results were small personal projects and an existing user handle                                                  | Not treated as available                                                                                                              | Better collision profile; pronunciation is difficult                     |
| Wunderpus     | A real octopus genus confirmed by [OBIS](https://obis.org/taxon/457573); no dominant exact-name commercial software product found                                                                                                                                                    | Exact npm package returned 404; exact GitHub organization and small repository uses exist                                                                           | Not treated as available                                                                                                              | Memorable, but spelling and the final syllable create usability concerns |

Package 404/unpublished responses, missing DNS, and empty search results never
mean that a name is available. Domains and handles were not purchased or
reserved.

Official preliminary search starting points were the
[USPTO trademark system](https://tsdr.uspto.gov/),
[EUIPO search tools](https://www.euipo.europa.eu/search-ip), and WIPO/global
registries. A qualified professional must search exact and confusingly similar
marks in the relevant software, hosted-service, education, media, and
merchandising classes before launch.

## Rejected Or Superseded Candidates

| Candidate              | Reason                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Oswald                 | Direct association with an existing animated octopus plus active Oswald software platforms |
| Otto                   | Elegant eight-arm association but heavily occupied commercially                            |
| Orson                  | Warm and flexible, but less connected to the accepted octopus identity                     |
| Threadleaf             | Strong knowledge metaphor, but the user preferred a character name                         |
| Celosia                | Memorable flower name, but less personable                                                 |
| Tremo, Eledone, Cyanea | Active software/product collisions                                                         |
| Loom                   | Existing dominant product and too directly tied to Video                                   |

## Literal Display Occurrence Inventory

This inventory was built before Layer 1 application. Historical plans, ADRs,
grills, screenshots, and dated evidence retain the name used at the time.

| Path/surface                                                                                                                                                                                  | Previous display text                      | Audience                   | Layer/action                                               | Affected verification                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| `README.md`, `CONTEXT.md`, `CONTRIBUTING.md`                                                                                                                                                  | Demo Composer                              | users/contributors         | Layer 1: rename active prose to Ossie                      | formatting and truth scans               |
| `SECURITY.md`, `THIRD_PARTY_NOTICES.md`                                                                                                                                                       | Demo Composer                              | operators/legal readers    | Layer 1 active prose only; preserve legal source text      | formatting and residual scan             |
| `docs/product-idea.md`, `docs/system-design-pattern.md`, `docs/roadmap.md`, `docs/project-zoomout-status.md`, `docs/oss-alpha-summary.md`, `docs/contributor-guide.md`                        | Demo Composer                              | product/contributors       | Layer 1 plus truth-band repair                             | formatting and terminology scans         |
| `docs/agent-workflow.md`                                                                                                                                                                      | Demo Composer application                  | agents/contributors        | Layer 1 narrative only; local skill names remain technical | skill validation and residual scan       |
| `docs/backend-route-inventory.md`, `docs/self-hosting.md`, `docs/operations.md`, `docs/production-readiness-checklist.md`                                                                     | Demo Composer                              | operators                  | Layer 1 prose only; commands/config names retained         | formatting and residual scan             |
| `apps/docs/README.md`, `apps/docs/app/docs-content.ts`, `apps/docs/app/layout.tsx`                                                                                                            | Demo Composer Docs                         | docs readers               | Layer 1 rename; source repository URLs retained            | Docs App tests/build/browser             |
| `apps/web/index.html`, `src/App.tsx`, `features/auth/LoginPage.tsx`, `features/setup/FirstRunSetupPage.tsx`, `features/organization/InviteAcceptPage.tsx`, `features/portal/PortalTopbar.tsx` | generic Web title and Demo Composer labels | application users          | Layer 1 rename                                             | web metadata/component tests and browser |
| corresponding web tests                                                                                                                                                                       | Demo Composer assertions                   | maintainers                | update only visible-string expectations                    | web tests                                |
| `apps/extension/public/manifest.json`, `index.html`, `src/App.tsx`, `README.md`                                                                                                               | Demo Composer                              | extension users/developers | Layer 1 name/title/copy; protocols/storage retained        | extension tests/build                    |
| `apps/server/src/app.ts` and `app.test.ts`                                                                                                                                                    | Demo Composer API                          | API consumers              | Layer 1 OpenAPI metadata only; service ID retained         | server tests                             |
| `.github/ISSUE_TEMPLATE/bug_report.md`                                                                                                                                                        | Demo Composer                              | issue reporters            | Layer 1 display copy                                       | residual scan                            |
| `packages/file-domain/README.md`                                                                                                                                                              | Demo Composer                              | package contributors       | Layer 1 narrative only; package identity retained          | formatting scan                          |
| `LICENSE`                                                                                                                                                                                     | Demo Composer contributors                 | legal attribution          | legal layer: preserve pending explicit legal review        | residual classification                  |

## Accepted Rename Layers

Layer 1 was applied by child plan `110`. On 2026-07-11, the user renamed the
GitHub repository to `tusharmalpani20/ossie` and explicitly authorized updating
the Git remote and active GitHub source/raw links. That narrow repository-identity
part of Layer 2 was applied first. Later on 2026-07-11, the user reopened child
plan `110` and authorized a clean-break migration of active Layer 2 through
Layer 4 technical identifiers because no production deployment or customer data
requires backward compatibility.

The root package, environment variables, cookies, headers, extension messages,
service identifiers, Docker/database defaults, storage/fixture names, CI, and
repository-local skills now use Ossie. Public routes, domain schema, and applied
migration history remain unchanged. The final external local-directory move to
`/home/tm/Desktop/work/ossie` occurs only after implementation commits and
shutdown of active tools. Exact outcomes are recorded in
`docs/rename-compatibility-checklist.md`.

## Remaining Risk And Follow-Up

- Obtain professional trademark clearance before a public commercial launch.
- Resolve the Apache Ossie collision deliberately; do not assume different
  implementation scope removes confusion risk.
- Decide domain and social-handle strategy only after clearance.
- Child `121` must review, refine, or replace the integrated working octopus
  raster identity and verify recognizability, eight-arm visibility,
  accessibility, small-size behavior, and independence from existing character
  art before final design acceptance.
- Complete the final external local-directory move after Plan `110` closeout and
  restart tooling from `/home/tm/Desktop/work/ossie`.
