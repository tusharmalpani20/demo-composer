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

It does not capture screenshots, DOM, clicks, inputs, navigation, or upload data yet.

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

The password is never stored. Changing the instance clears the stored token and selected project.
