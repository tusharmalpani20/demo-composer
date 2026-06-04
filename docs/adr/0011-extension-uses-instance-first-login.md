# Extension Uses Instance First Login

The Chrome extension asks for a Demo Composer instance URL before login, then authenticates against that instance and stores an extension-scoped session token. This supports open-source and self-hosted deployments where the extension cannot assume a single SaaS API endpoint, and it makes the configured instance the destination for screenshots, capture events, and metadata.

