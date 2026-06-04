# Separate Web And Server Apps

Demo Composer will follow the `orca_v2` pattern of keeping the React portal and Fastify API as separate applications. The web app will call the API through a configured base URL and include credentials; the server will expose the API, configure trusted CORS origins, and set HTTP-only auth cookies. Fastify will not serve the built portal by default. Self-hosted deployments can still use a reverse proxy to present web and API under one origin or sibling domains.
