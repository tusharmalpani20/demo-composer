# Modern UI Migration Plan

Date: 2026-06-30

Status: In progress.

Branch:

```text
feature/modern-ui-migration
```

## Objective

Modernize the full Demo Composer UI into a cohesive, modern SaaS-style product interface while preserving current behavior.

The migration covers:

- `apps/web` portal UI
- auth, setup, project, organization, capture, guide, and interactive demo workflows
- public guide and public interactive demo reader/embed surfaces
- loading, empty, success, error, disabled, and pending states
- `apps/extension` Chrome extension popup UI
- README and documentation screenshot references after visual QA produces current product evidence
- shared components in `packages/ui`
- removal of repeated manually styled button/input/card/dialog/form patterns where practical

The agreed UI stack is:

- Tailwind CSS
- shadcn/ui-style source-owned shared components
- Radix UI primitives for accessible interactive behavior
- Lucide icons
- supporting libraries as needed: `class-variance-authority`, `clsx`, `tailwind-merge`, `sonner`, `react-hook-form`, `@hookform/resolvers`, existing `zod`, and optionally `@tanstack/react-table` / `recharts` only where they clearly fit

## Current UI Audit

Current frontend structure:

- `apps/web`: React 19 + Vite 7 + TypeScript + CSS Modules
- `apps/extension`: React 19 + Vite 7 + TypeScript + global popup CSS
- `apps/docs`: Next 16 docs hub, not the primary product UI in this migration
- `packages/ui`: small shared package with minimal `Button` and `Card` examples, not a mature design system

Current UI implementation observations:

- The app does not use shadcn/ui, Radix, Tailwind, MUI, Mantine, Chakra, Ant Design, or Headless UI.
- Most UI controls are native elements styled locally by CSS modules.
- Repeated local classes include `primaryButton`, `secondaryButton`, `dangerButton`, `retryButton`, `field`, `panel`, `page`, and `topbar`.
- Feature CSS is duplicated across project, capture, guide, demo, organization, setup, and auth screens.
- `apps/extension/src/index.css` owns a separate compact visual system.

## Libraries And Installation Decisions

Official-doc research completed before implementation:

- shadcn/ui supports Vite projects and provides source-owned components rather than a runtime package-only design system.
- Tailwind CSS current Vite setup uses the Vite integration path and will become the shared styling foundation.
- Radix UI primitives are appropriate for accessible dialogs, menus, tabs, tooltips, popovers, switches, and similar behavior.
- Lucide React is appropriate for modern SVG icons in action buttons and navigation.

Installation direction:

- Add Tailwind config and global base styles for web and extension surfaces.
- Add shared utilities such as `cn` in `packages/ui`.
- Build shadcn-style shared primitives directly in `packages/ui/src`.
- Add Radix packages only when a primitive is actually implemented.
- Avoid adding table/chart/form libraries until the slice that needs them.

## Shared UI Foundation

Initial shared primitives:

- `cn`
- `Button`
- `Input`
- `Textarea`
- `Label`
- `Badge`
- `Card`
- `Alert`
- `Separator`

Next shared primitives when migration reaches interactive surfaces:

- `Dialog`
- `DropdownMenu`
- `Tabs`
- `Tooltip`
- `Select`
- `Checkbox`
- `Switch`
- `Toast`
- `Table`

Design-system constraints:

- Keep shared components source-owned in `packages/ui`.
- Keep visual variants explicit and limited.
- Keep page-specific CSS only for layout and complex editor/viewer surfaces.
- Avoid nested cards and decorative gradient/orb backgrounds.
- Use Lucide icons where icons improve scanability.

## Screen Migration Plan

### 1. Foundation

- [x] Install/configure Tailwind and supporting utilities.
- [x] Add shared UI primitives in `packages/ui`.
- [x] Replace placeholder shared `Button` behavior with a real reusable component.
- [x] Add tests for shared UI behavior and accessibility where meaningful.
- [x] Commit foundation slice.

### 2. App Shell And Portal Navigation

- [x] Modernize global tokens and base styles.
- [x] Modernize `App` loading/error shells.
- [x] Modernize `PortalTopbar`.
- [ ] Introduce reusable page shell/page header patterns if they reduce duplication.
- [x] Preserve route behavior and setup/auth gating.
- [x] Commit app-shell slice.

### 3. Auth, Setup, Projects, Organization

- [x] Modernize `LoginPage`.
- [x] Modernize `FirstRunSetupPage`.
- [x] Modernize `ProjectListPage`.
- [x] Modernize `ProjectWorkspacePage`.
- [x] Modernize `ProjectSettingsPage`.
- [x] Modernize `OrganizationMembersPage`.
- [x] Modernize `InviteAcceptPage`.
- [x] Replace local repeated buttons/fields/panels with shared primitives where practical.
- [x] Commit portal-foundation screen slice.

### 4. Capture Session Screens

- [x] Modernize `ProjectCaptureSessionListPage`.
- [x] Modernize `CaptureSessionDetailPage`.
- [x] Preserve upload, event ordering, event editing, create guide, and create demo behavior.
- [x] Keep complex screenshot/event layout CSS where it is still useful.
- [x] Commit capture-session slice.

### 5. Guide Screens

- [ ] Modernize `ProjectGuideListPage`.
- [ ] Modernize `GuideEditorPage`.
- [ ] Modernize `GuidePreviewPage`.
- [ ] Modernize `GuideScreenshotViewer`.
- [ ] Modernize `PublicGuideReaderPage` and embed mode.
- [ ] Preserve authoring, upload, screenshot picker, publish controls, export controls, and reader behavior.
- [ ] Commit guide slice.

### 6. Interactive Demo Screens

- [ ] Modernize `ProjectInteractiveDemoListPage`.
- [ ] Modernize `InteractiveDemoEditorPage`.
- [ ] Modernize `PublicInteractiveDemoViewerPage` and embed mode.
- [ ] Preserve scene editing, hotspot editing, publish controls, password access, and viewer navigation.
- [ ] Commit interactive-demo slice.

### 7. Chrome Extension Popup

- [ ] Modernize `apps/extension` popup visual system.
- [ ] Reuse compatible shared UI primitives or mirror shared tokens where extension constraints require local CSS.
- [ ] Preserve configuration, login, project selection, capture start, manual capture, automatic capture controls, diagnostics, finalize, and logout behavior.
- [ ] Commit extension slice.

### 8. Cleanup And Consolidation

- [ ] Remove obsolete CSS module classes and unused shared placeholders.
- [ ] Re-run `rg` for repeated local button/control classes.
- [ ] Document intentional remaining local styles.
- [ ] Commit cleanup slice.

## Chrome Extension Migration Plan

The extension is visually part of the product but has different constraints:

- fixed popup width around `360px`
- compact layout
- Chrome extension permissions and capture APIs
- no broad portal app shell

Migration strategy:

- modernize typography, panel surfaces, buttons, form controls, status messages, project selectors, capture state, diagnostics, and toolbar actions
- keep the popup compact and scannable
- keep capture state obvious and action hierarchy clear
- use browser QA at `360x420`

## TDD/Test Plan

Use `$tdd`.

Testing approach:

- Do not create one large horizontal test batch.
- For each behavior-affecting slice, add or update one focused behavior test first.
- Watch the test fail for the expected reason.
- Implement the smallest behavior-preserving change.
- Watch it pass.
- Refactor while green.

Visual-only refactors:

- Keep existing behavior tests green.
- Add characterization tests before risky migrations when existing coverage is weak.
- Prefer tests against roles, labels, visible text, and user-facing flows.

Priority test surfaces:

- shared UI component role/variant behavior
- auth/setup form submission and disabled states
- project/capture create forms
- guide editor publish/export/screenshot flows
- interactive demo editor publish/hotspot/scene flows
- extension configuration/login/project/capture flows

## Browser/Visual QA Plan

Use `$agent-browser`.

Before browser commands:

```bash
rtk agent-browser skills get core
```

Viewports:

- desktop: `1440x900`
- tablet: `1024x768`
- mobile: `390x844`
- extension popup: `360x420`

Minimum visual checks:

- layout is not broken
- text does not overlap
- controls are usable
- focus and keyboard behavior are acceptable for key controls
- dialogs/dropdowns/popovers render correctly
- loading/error/empty states look intentional
- public guide/demo views are polished
- editor surfaces remain usable
- extension popup is compact and visually consistent

If backend/auth/fixture setup blocks browser inspection of a route, record the blocker and use isolated tests, fixture states, or mock-backed page routes where practical.

README and screenshot refresh:

- capture fresh screenshots after the modernized UI is browser-verified
- update `README.md` screenshot references and surrounding copy so they describe the current UI truthfully
- update related status/docs files if they reference old visual evidence, current limitations, or pending extension screenshots
- keep screenshot evidence safe and synthetic, matching the existing `docs/assets/alpha/` convention unless a better docs path is chosen during final QA

## Leftovers Carried Forward

From recent plans and master closeout notes:

- [ ] Manual browser smoke of guide screenshot picker remains a candidate from plan `083`.
- [ ] Guide annotation editing affordances remain future authoring polish from plan `083`.
- [ ] Guide publish stale-state clarity remains future authoring polish from plan `083`.
- [ ] Guide export error messaging remains future authoring polish from plan `083`.
- [ ] Guide metadata and step save/error/retry behavior remain future authoring polish from plan `083`.
- [ ] Empty and partial-data guide editor states remain future authoring polish from plan `083`.
- [ ] Demo scene list and reorder feedback remain future authoring polish from plan `083`.
- [ ] Demo hotspot editor affordances remain future authoring polish from plan `083`.
- [ ] Demo embed and narrow viewport QA remain future authoring polish from plan `083`.
- [ ] Public demo final-scene stale-target behavior remains future authoring polish from plan `083`.
- [ ] Extension-generated guide/demo quality remains blocked until extension-created screenshot-backed events exist.
- [ ] Extension visual evidence after capture reliability remains a candidate from earlier extension dogfood plans.
- [ ] Self-host ops leftovers from plan `084` are not part of this UI migration unless surfaced as current limitations in UI/docs.
- [ ] Docs-site IA/search/versioning leftovers from plan `085` are not part of this product UI migration unless the UI work touches docs navigation.

Carry-forward handling in this plan:

- Authoring and narrow-viewport items directly touched by UI modernization should be improved where they overlap the relevant screen migration.
- Extension capture reliability itself is not a goal of this UI migration, but extension UI must make current capture states and diagnostics clearer.
- Ops/docs infrastructure leftovers are documented only and not implemented in this UI slice.

## Risks / Open Questions

- A full UI migration touches many files and can create visual regressions even when tests pass.
- Tailwind plus existing CSS Modules may temporarily coexist; cleanup must be intentional.
- Some UI surfaces depend on authenticated/server state and may need fixtures or isolated visual states for browser QA.
- `packages/ui` currently exports source `.tsx` files directly; dependency placement and TypeScript resolution must preserve workspace builds.
- Adding too many libraries up front would increase churn; add optional libraries only when a screen needs them.
- Existing tests may assert exact styles in a few places; update only when the user-visible behavior remains correct.

## Completion Checklist

- [ ] Plan created in `docs/plan` with the next correct number.
- [ ] Plan rechecked before implementation.
- [ ] Official docs researched for install/config choices.
- [ ] Tailwind/shadcn-style shared UI foundation implemented.
- [ ] Web portal UI modernized.
- [ ] Public guide/demo UI modernized.
- [ ] Chrome extension popup UI modernized.
- [ ] README and related screenshot/status docs updated with current visual evidence after browser QA.
- [ ] Repeated manual control classes removed or documented if intentionally retained.
- [ ] `$tdd` workflow followed for behavior-affecting slices.
- [ ] `$agent-browser` visual QA performed and recorded.
- [ ] Relevant tests, typechecks, lint, and builds pass or are documented with blockers.
- [ ] Small logical commits created for coherent slices.
- [ ] Final gap review completed.

## Implementation Log

- 2026-06-30: Created plan `086` after checking branch, repo root, `docs`, `docs/plan`, existing plan numbers, and previous follow-up notes.
- 2026-06-30: Completed the foundation slice with Tailwind Vite integration for `apps/web` and `apps/extension`, shared `cn`, `Button`, form/content primitives, and UI package tests.
- 2026-06-30: Foundation verification passed: `rtk pnpm --filter @repo/ui test`, `check-types`, `lint`, `rtk pnpm --filter web build`, and `rtk pnpm --filter extension build`.
- 2026-06-30: Modernized the App fallback shell and `PortalTopbar`, added focused topbar coverage, and preserved route/setup behavior under focused App tests.
- 2026-06-30: App-shell verification passed: `rtk pnpm --filter web test -- App`, `rtk pnpm --filter web test -- PortalTopbar`, `check-types`, `lint`, `build`, and `rtk git diff --check`.
- 2026-06-30: Modernized `LoginPage`, `FirstRunSetupPage`, and `ProjectListPage` with shared card/form/button/alert primitives while preserving existing behavior.
- 2026-06-30: Portal foundation verification passed: `rtk pnpm --filter web test -- LoginPage`, `FirstRunSetupPage`, `ProjectListPage`, `check-types`, `lint`, `build`, and `rtk git diff --check`.
- 2026-06-30: Modernized `ProjectWorkspacePage`, `ProjectSettingsPage`, `OrganizationMembersPage`, and `InviteAcceptPage` with shared primitives while preserving project and organization workflows.
- 2026-06-30: Remaining portal foundation verification passed: `rtk pnpm --filter web test -- ProjectWorkspacePage`, `ProjectSettingsPage`, `OrganizationMembersPage`, `InviteAcceptPage`, `check-types`, `lint`, `build`, and `rtk git diff --check`.
- 2026-06-30: Modernized `ProjectCaptureSessionListPage` with shared create-form, button, badge, card, alert, and field primitives. `CaptureSessionDetailPage` remains pending as its own safer slice because it owns upload, event editing, asset display, and artifact creation controls.
- 2026-06-30: Capture list verification passed: `rtk pnpm --filter web test -- ProjectCaptureSessionListPage`, `check-types`, `lint`, `build`, and `rtk git diff --check`.
- 2026-06-30: Added README and screenshot refresh as an explicit final deliverable after the user's follow-up request.
- 2026-06-30: Modernized `CaptureSessionDetailPage` header actions, upload panel, reorder/edit controls, badges, alerts, and form fields with shared primitives while keeping native file input and complex event/asset layout CSS.
- 2026-06-30: Capture detail verification passed: `rtk pnpm --filter web test -- CaptureSessionDetailPage`, `check-types`, `lint`, `build`, `rtk git diff --check`, and `rg` found no remaining `primaryButton`, `secondaryButton`, `eventMoveButton`, `formError`, raw `<button>`, or raw `<textarea>` in the detail page.

## Final Gap Review

Not started.
