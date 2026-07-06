# Domain Package Conventions And Error Mapping

Demo Composer domain packages should be created only when a child plan moves real behavior into them. They should use domain-focused `commands/`, `queries/`, `repositories/`, `policies/`, `errors/`, `schemas/`, `types/`, and `__tests__/` folders as needed, without placeholder scaffolding.

Domain packages own business rules, domain-local schemas/types, repository interfaces, and typed domain errors. They must stay framework-agnostic and must not import Fastify, React, app code, database clients, storage SDKs, cookies, sessions, or raw HTTP request objects.

`@repo/types` remains the owner of shared public API DTO schemas and inferred types. Domain packages should not duplicate those DTOs unless they need separate command/query inputs or domain read models.

Domain errors should use stable product error codes and status hints. Server adapters translate those errors to the existing route response shape, currently `{ error: { type, message } }` for domain-like API failures. Global Fastify/Zod validation errors keep their existing legacy envelope.

Authentication/session lookup remains server-owned until an auth-domain plan explicitly extracts it. Route-local error handling remains valid until a domain extraction replaces it with focused tests proving unchanged status codes and response bodies.
