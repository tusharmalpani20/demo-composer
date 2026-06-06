# Demo Composer Extension

Chrome extension popup for connecting a browser to a hosted or self-hosted Demo Composer instance.

## Current Scope

This app currently supports:

- configuring a Demo Composer instance URL
- signing in against that instance
- storing the extension session token in extension storage
- checking current auth
- listing accessible projects
- selecting the project that future captures should use
- starting a capture session for the selected project
- storing the active capture session id locally
- restoring active capture state when the popup is reopened
- capturing the visible active tab as a PNG screenshot
- uploading that screenshot to the active capture session with safe tab metadata
- recording a linked `capture` event after each successful screenshot upload
- persisting the local event index for the active capture session
- discarding local active capture state if needed

It does not capture DOM, clicks, inputs, navigation events, full-page stitched screenshots, or HTML snapshots yet.
Discarding local active capture state does not cancel or complete the backend capture session.

## Development

From the repo root:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
```

For local browser development:

```bash
rtk pnpm --filter extension dev
```

For a loadable Chrome extension build:

```bash
rtk pnpm --filter extension build
```

Then load `apps/extension/dist` in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `apps/extension/dist`.

## Auth Transport

The extension asks for an instance URL first. Login calls:

```text
POST {instance_url}/api/v1/authentication/login
```

with:

```text
x-demo-composer-client: extension
```

The server keeps normal portal cookie behavior unchanged and additionally returns `session_token` for extension-marked login requests. Extension API calls then send:

```text
Authorization: Bearer <session_token>
```

The password is never stored. Changing the instance clears the stored token, selected project, and active capture state.

## Capture Session Start

Starting capture calls:

```text
POST {instance_url}/api/v1/projects/:project_id/capture-sessions
```

with:

```text
Authorization: Bearer <session_token>
x-demo-composer-client: extension
```

The extension sends `source_type: "extension"` and safe current-tab metadata when available. Current-tab metadata is limited to the active tab URL/title and only stores `http://` or `https://` URLs. The extension does not inject scripts or inspect page DOM for this slice.

## Screenshot Upload

When an active capture session exists, the popup can capture the visible active tab:

```text
chrome.tabs.captureVisibleTab({ format: "png" })
```

The returned PNG data URL is converted to a `Blob`, decoded for width/height when available, and uploaded as multipart form data:

```text
POST {instance_url}/api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
```

with:

```text
Authorization: Bearer <session_token>
x-demo-composer-client: extension
```

The upload includes the screenshot file, captured timestamp, visible image dimensions when available, device pixel ratio when available, and safe current-tab URL/title metadata. The extension does not inspect page DOM or read form field values.

After upload succeeds, the extension creates a linked capture event:

```text
POST {instance_url}/api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
```

with:

```text
Authorization: Bearer <session_token>
x-demo-composer-client: extension
```

The event uses `event_type: "capture"`, links to the uploaded screenshot asset, and uses the next locally stored event index for the active capture session. The extension sends `input_value_redacted: true` and does not send raw input fields. Screenshot pixel dimensions remain on the asset record; the event does not pretend those pixels are CSS viewport dimensions.

## Permissions

The extension currently requests:

- `storage` for instance, session, selected project, and active capture state
- `tabs` for active tab URL/title metadata
- `activeTab` for visible tab screenshot capture

It does not request broad host permissions, `scripting`, or content scripts yet.
