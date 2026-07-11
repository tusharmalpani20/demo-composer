---
name: dogfood-ossie
description: Validate Ossie browser-visible workflows with safe, reproducible evidence. Use for portal, public reader, embed, extension, authoring, setup, responsive, accessibility, console, network, or end-to-end dogfood work, and whenever an implementation plan requires browser screenshots or explicit evidence of real UI behavior.
---

# Dogfood Ossie

Validate the real workflow without exposing private data or overstating the
available browser capability.

## Prepare Safely

1. Read the active child plan and its exact browser acceptance requirements.
2. Read `docs/development-setup.md`, `docs/v1-dogfood-smoke-suite.md`,
   `docs/operations.md`, and `apps/extension/README.md` as applicable.
3. Discover current startup commands, ports, and running-service expectations for
   `apps/server`, `apps/web`, `apps/docs`, and `apps/extension` from their current
   package/config/docs surfaces. Do not assume every workflow needs every app.
4. Use synthetic organizations, users, projects, captures, images, passwords, and
   public links. Never use production or customer data.
5. Keep authenticated and public browser contexts isolated.
6. Name the browser session for the plan/workflow and arrange cleanup before
   starting.

Do not hard-code a workspace path, browser profile, extension ID, password,
cookie, bearer token, or local secret into evidence or repository files.

## Select The Evidence Level

- Use the environment-provided `agent-browser` capability when available for web
  navigation, interactions, screenshots, console, and network checks.
- Treat a normal browser tab that loads an extension page as extension-page
  evidence only.
- Claim installed toolbar-popup behavior only after validating a genuinely loaded
  unpacked extension and toolbar popup in the required browser environment.
- If the required capability is unavailable, complete the remaining safe checks
  and mark that evidence `blocked`. Never substitute an assertion or screenshot
  from a different surface.

## Run The Workflow

For each accepted path:

1. Start from the real entry point and complete the user goal, not just the final
   route.
2. Verify visible state after each consequential action and reload/deep-link
   behavior where relevant.
3. Exercise loading, empty, validation, error, denied, read-only, archived,
   destructive, success, retry, expiry, revoked, and slow/failing-network states
   required by the plan.
4. Verify desktop and narrow mobile layouts with stable viewport dimensions.
5. Test keyboard-only operation, visible focus, logical order, accessible names,
   dialogs/menus, and escape behavior.
6. Verify 200% zoom/reflow, long text, overflow, clipping, overlap, and layout
   shifts.
7. Check console errors, uncaught exceptions, failed requests, unexpected
   redirects, and authorization leaks.
8. Verify reduced motion when motion changed.
9. Keep public/restricted/password/embed contexts separate and confirm private
   source metadata or storage keys do not leak.

## Capture Evidence

Record:

- child plan, commit, date, environment, app, route class, and fixture identity;
- session name, viewport, zoom, input mode, and authentication/public context;
- exact steps, expected result, actual result, and pass/fail/blocked status;
- console/network findings and screenshot paths when required;
- whether extension evidence is page automation or a real toolbar popup.

Screenshots must not contain private URLs, customer material, cookies, tokens,
credentials, raw captured typing, browser vaults, or unrelated personal tabs.
Use temporary evidence unless the active plan deliberately accepts a repository
asset.

## Clean Up

1. Close named browser sessions.
2. Stop local services started for the validation unless the user asked to keep
   them running.
3. Remove temporary synthetic artifacts through supported product behavior where
   safe, while preserving evidence required by the active plan.
4. Confirm no secret, profile, session, or ephemeral screenshot state is staged.

## Report

Lead with failed or blocked workflows. Then list passed paths, evidence locations,
console/network status, browser/extension distinctions, and residual risk. Do not
call the browser portion complete when a required capability was unavailable.
