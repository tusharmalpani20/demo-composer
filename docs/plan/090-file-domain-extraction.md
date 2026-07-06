# File Domain Extraction Plan

Date: 2026-07-06

Last reviewed: 2026-07-07

Status: Planned.

## Parent Master Plan

```text
docs/plan/master/003-shared-contracts-domainization-master-plan.md
```

This is child plan `090` of the shared contracts and domainization track.

## Objective

Move file metadata and storage policy into a file domain boundary while keeping raw storage adapters inside `apps/server`.

The target package is:

```text
packages/file-domain
```

Package name:

```text
@repo/file-domain
```

## Current Baseline

Relevant current server modules and migrations:

```text
apps/server/src/modules/file-storage/
apps/server/src/modules/capture-asset/
apps/server/src/db/migrations/003_capture_asset_metadata_schema.sql
docs/adr/0009-file-domain-owns-storage-metadata.md
```

The current architecture distinguishes:

- **File**: physical storage metadata
- **Capture Asset**: product meaning for a stored file
- **Derived Asset**: processed variant of capture material

This distinction must stay intact.

## Relevant Docs

Read before implementation:

```text
CONTEXT.md
docs/system-design-pattern.md
docs/plan/master/003-shared-contracts-domainization-master-plan.md
docs/adr/0009-file-domain-owns-storage-metadata.md
docs/adr/0010-screenshot-capture-first-html-replay-deferred.md
docs/adr/0012-privacy-preserving-capture-defaults.md
```

## Scope

Included:

- create `@repo/file-domain` only if this plan moves real file behavior into it
- extract file metadata validation
- extract file kind, storage provider, MIME, size, checksum, and metadata policy where currently duplicated or domain-owned
- define file repository interfaces if domain commands need persistence
- keep local/external storage adapter implementation in `apps/server`
- keep capture asset product rules in capture domain unless they are strictly file metadata rules
- update server capture asset/file-storage services to call file-domain behavior

Explicitly excluded:

- replacing storage provider implementation
- changing file upload route URLs
- changing persisted file metadata shape
- moving raw storage provider SDK details into the domain package
- changing UI upload controls
- changing capture asset behavior beyond file metadata validation
- database migrations unless an existing bug requires one and is documented

## Expected File Touches

Likely files:

```text
packages/file-domain/package.json
packages/file-domain/tsconfig.json
packages/file-domain/src/index.ts
packages/file-domain/src/**/*
apps/server/package.json
apps/server/src/modules/file-storage/**/*
apps/server/src/modules/capture-asset/**/*
apps/server/src/db/**/*.test.ts
```

Conditional files:

```text
packages/constants/src/file.ts
packages/types/src/file.ts
```

Only touch shared constants/types if values/contracts pass their reuse gates.

## Execution Guardrails

Existing behavior to preserve:

- current file metadata shape;
- upload/create/read route behavior;
- storage provider behavior;
- File and Capture Asset separation.

Shared constants/types to add or reuse:

- file kind, storage provider, MIME, and upload-limit constants only when they pass the reuse gate;
- file DTO schemas only when server and another consumer need the same contract.

Domain logic to move or create:

- file metadata validation and product-level file policy.

Server adapter changes:

- server keeps raw storage adapters, SQL adapters, transactions, and HTTP route handling.

Web/extension consumer changes:

- none expected unless a shared file contract is already consumed.

Rollback or containment notes:

- keep the server module as the adapter boundary so file-domain policy can be reverted without changing route URLs.
- if storage-provider behavior becomes tangled with environment config, keep that part server-local and document the deferral.

## Discovery Checklist

- [ ] Inspect file storage and capture asset route/service/repository code.
- [ ] List all file metadata fields currently validated in routes/services.
- [ ] List storage provider and MIME values used by server, web, extension, and tests.
- [ ] Identify which values belong in `@repo/constants`.
- [ ] Identify which API request/response schemas belong in `@repo/types`.
- [ ] Identify behavior that is pure enough for domain unit tests.
- [ ] Identify route/database behavior that requires server tests.

Useful search commands:

```text
rtk rg "file_schema|file-storage|storage_provider|storage_key|mime_type|size_bytes|checksum|capture_asset" apps/server/src packages
rtk rg "image/png|image/jpeg|local|external|screenshot|html_snapshot" apps packages
```

## Implementation Plan

1. Create package only when behavior is ready to move.
   - Add package scripts matching domain-package conventions.
   - Export a small public API.

2. Extract pure file policy.
   - Validate storage provider.
   - Validate file metadata shape.
   - Validate upload size and MIME constraints if those are product rules.
   - Keep environment-specific byte limits in server config unless they are product defaults used elsewhere.

3. Add repository interfaces only if needed.
   - Keep concrete SQL adapters in `apps/server`.
   - Keep transaction handling in server adapters.

4. Wire server module.
   - Route/service code should delegate file decisions to `@repo/file-domain`.
   - Preserve response shape and status codes.

## Testing Plan

Domain tests:

- accepts valid local file metadata;
- rejects invalid storage provider;
- rejects invalid MIME/size according to current behavior;
- keeps File separate from Capture Asset.

Server tests:

- capture asset creation/upload still works;
- invalid file metadata still returns the same status/shape;
- existing file URL behavior remains unchanged.

DB tests:

- run only if persistence behavior is touched.

## Verification Commands

```text
rtk pnpm --filter @repo/file-domain lint
rtk pnpm --filter @repo/file-domain build
rtk pnpm --filter @repo/file-domain test
rtk pnpm --filter server test -- file-storage capture-asset
rtk pnpm check-types
```

If DB persistence is changed:

```text
rtk pnpm --filter server test:db
```

If shared constants/types are touched:

```text
rtk pnpm --filter @repo/constants build
rtk pnpm --filter @repo/types build
```

## Acceptance Criteria

- File metadata policy lives in `@repo/file-domain`.
- Storage adapters remain in `apps/server`.
- File and Capture Asset remain distinct concepts.
- Existing upload/create/read behavior remains stable.
- Existing persisted values remain compatible.
- No UI behavior or visual output changes.
- Tests cover moved behavior.

## Final Output Required

When executing this plan, report:

- file policies moved;
- server adapters changed;
- files changed;
- tests run and results;
- any file-domain follow-ups deferred to capture-domain work.
