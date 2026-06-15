# Extension Capture Positioning And Next Events Plan

Date: 2026-06-15

Status: Planned.

## Goal

Clarify and lightly harden the Chrome extension as a manual screenshot capture MVP, while planning the next event-capture steps without overpromising automatic Scribe-style recording.

Target outcome:

```text
extension user
  -> understands this is manual screenshot capture
  -> can configure instance, sign in, select project
  -> starts capture
  -> clicks Capture screenshot once per step-worthy moment
  -> finishes capture
  -> lands in portal capture detail
```

This phase should make the current extension honest, stable, and well documented before we start interactive demos.

## Why This Comes Next

The extension currently works as a popup-driven manual capture tool:

- configure instance URL
- sign in
- list/select projects
- start capture session
- capture visible tab screenshot
- upload screenshot
- create ordered `capture` event
- finish capture
- open portal capture detail

But it is not yet an automatic event recorder:

- no content script
- no click listener
- no DOM target metadata capture
- no input/change/navigation event capture
- no overlay
- no full-page screenshot capture

For OSS, that is fine if we position it accurately. It is not fine if the docs imply Scribe-level automatic recording already exists.

## Existing Decisions To Honor

Relevant docs:

```text
docs/product-idea.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0011-extension-uses-instance-first-login.md
docs/adr/0012-privacy-preserving-capture-defaults.md
docs/plan/022-extension-foundation.md
docs/plan/023-extension-start-capture-session.md
docs/plan/024-extension-screenshot-upload.md
docs/plan/025-extension-capture-event-recording.md
docs/plan/026-extension-finalize-and-open-portal.md
```

Important implications:

- extension asks for instance URL before login
- screenshots go to the configured instance
- raw input values are not stored
- capture source remains reusable source material
- finishing capture should open the portal capture session
- automatic capture can come later

## Current State

Relevant files:

```text
apps/extension/public/manifest.json
apps/extension/src/App.tsx
apps/extension/src/App.test.tsx
apps/extension/src/lib/api.ts
apps/extension/src/lib/current-tab.ts
apps/extension/src/lib/navigation.ts
apps/extension/src/lib/screenshot.ts
apps/extension/src/lib/settings.ts
apps/extension/src/lib/url.ts
```

Current manifest permissions:

```json
[
  "activeTab",
  "storage",
  "tabs"
]
```

Known gaps:

- README exists, but it needs clearer alpha/manual capture positioning and usage copy
- popup UI has capture controls, but does not explain that one screenshot equals one capture event/step source
- no active capture portal-open shortcut except after finish
- no content script or background worker
- no automatic click/DOM metadata capture
- no roadmap doc for next extension capture event work

## Scope

Included:

- update extension UI copy to say manual screenshot capture clearly
- add extension usage section to docs or README
- document current permissions and why they are needed
- document current limitation: visible-tab screenshots only
- add an `Open in portal` action for the active capture session using the existing safe portal URL builder
- add tests for any UI copy/behavior changes
- create a concrete follow-up plan outline for automatic event capture in `docs/plan/058-extension-automatic-event-capture-roadmap.md`
- update `docs/project-zoomout-status.md`

Excluded:

- implementing content scripts
- implementing automatic click/input/navigation recording
- implementing full-page screenshot capture
- implementing DOM selector capture
- changing backend capture event schema
- adding analytics
- publishing to Chrome Web Store
- desktop app capture

## Product Behavior

Recommended extension copy:

```text
Manual screenshot capture
Capture one screenshot for each step you want in the guide.
```

Active capture state should communicate:

```text
Capture active
Project name
Session ...
[Capture screenshot] [Finish capture]
```

If adding an active portal link:

```text
[Open in portal]
```

should open:

```text
/projects/:project_id/capture-sessions/:capture_session_id
```

using the configured instance URL and safe URL builder.

This should be implemented in this phase. If implementation reveals a blocker, document the blocker and leave the UX copy/docs changes in place.

Opening the portal during an active capture must not call capture-session completion and must not clear local active capture state.

## Next Automatic Capture Roadmap

Do not implement in this phase, but document the next real extension milestone:

```text
content script
  -> listens for clicks
  -> captures safe target metadata
  -> asks background/popup to capture screenshot
  -> uploads screenshot
  -> records click/capture event pair or enriched capture event
```

Open design questions for later:

- should click events and screenshot events be separate rows or one enriched capture event?
- should the popup remain open during recording, or should a background worker own capture state?
- how do we handle navigation after clicks?
- how do we avoid recording sensitive inputs?
- how do we show pause/resume/stop state?
- do we need a content overlay?

## Test Plan

Run:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension build
rtk pnpm check-types
rtk pnpm lint
```

If web/docs copy is updated:

```bash
rtk pnpm build
```

Test cases:

- extension still configures instance URL
- sign-in flow still works
- selected project persists
- active capture state restores
- screenshot capture still records ordered event
- finish still clears local state and opens portal
- any new "Open in portal" action uses safe URL builder
- active capture portal-open action does not clear active capture state
- active capture portal-open action reports a local error if browser navigation fails

## Risks

- Adding too much UI copy can make the popup cramped. Keep wording short.
- Over-documenting future automatic capture can make it sound already implemented. Use clear "not built yet" language.
- Any new portal URL action must avoid unsafe redirects.
- Opening the portal during an active capture should not imply the capture has been finished.

## Commit Strategy

Suggested commits:

1. `Clarify extension manual capture UX`
2. `Document extension alpha capture behavior`
3. `Record automatic extension capture follow-up`

## Acceptance Criteria

- extension is clearly positioned as manual screenshot capture
- current capture flow remains tested and working
- active capture sessions can be opened in the portal without finishing
- docs explain how to load/use the extension
- docs state automatic click/DOM capture is not implemented yet
- next extension event-capture work is described in `docs/plan/058-extension-automatic-event-capture-roadmap.md` without being implemented
