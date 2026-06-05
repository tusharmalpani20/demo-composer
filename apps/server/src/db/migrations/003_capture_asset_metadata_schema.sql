-- 003_capture_asset_metadata_schema.sql
-- Created On: 2026-06-05

-- UP:

CREATE SCHEMA IF NOT EXISTS file_schema;

CREATE TABLE IF NOT EXISTS file_schema.file (
    id VARCHAR(26) PRIMARY KEY,

    organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
    storage_key TEXT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    original_name TEXT DEFAULT NULL,
    checksum_sha256 VARCHAR(64) DEFAULT NULL,
    metadata JSONB DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_file_storage_provider
        CHECK (storage_provider IN ('local', 'external')),
    CONSTRAINT chk_file_size_bytes_non_negative
        CHECK (size_bytes >= 0)
);

COMMENT ON TABLE file_schema.file IS
    'Storage metadata for files. This table owns provider, logical key, MIME type, size, checksum, and storage-private metadata.';

COMMENT ON COLUMN file_schema.file.storage_key IS
    'Logical storage key. It must not expose local absolute filesystem paths through public APIs.';

COMMENT ON COLUMN file_schema.file.metadata IS
    'Optional storage-private JSON. It is not returned by public capture asset APIs.';

CREATE INDEX IF NOT EXISTS idx_file_org_created
ON file_schema.file (organization_id, created_at DESC)
WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_file_storage_key_active_per_org
ON file_schema.file (organization_id, lower(storage_key))
WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS capture_schema.capture_asset (
    id VARCHAR(26) PRIMARY KEY,

    organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
    project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
    capture_session_id VARCHAR(26) NOT NULL REFERENCES capture_schema.capture_session(id) ON DELETE CASCADE,
    file_id VARCHAR(26) NOT NULL REFERENCES file_schema.file(id) ON DELETE RESTRICT,
    asset_type VARCHAR(50) NOT NULL,

    width INTEGER DEFAULT NULL,
    height INTEGER DEFAULT NULL,
    device_pixel_ratio DOUBLE PRECISION DEFAULT NULL,
    page_url TEXT DEFAULT NULL,
    page_title TEXT DEFAULT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_capture_asset_type
        CHECK (asset_type IN ('screenshot', 'html_snapshot', 'thumbnail', 'redacted_screenshot')),
    CONSTRAINT chk_capture_asset_width_positive
        CHECK (width IS NULL OR width > 0),
    CONSTRAINT chk_capture_asset_height_positive
        CHECK (height IS NULL OR height > 0),
    CONSTRAINT chk_capture_asset_device_pixel_ratio_positive
        CHECK (device_pixel_ratio IS NULL OR device_pixel_ratio > 0)
);

COMMENT ON TABLE capture_schema.capture_asset IS
    'Capture asset product meaning. It connects a capture session to a file and describes what that file means for guide/demo source material.';

COMMENT ON COLUMN capture_schema.capture_asset.file_id IS
    'Reference to file storage metadata. Capture assets must not duplicate storage keys or provider paths.';

COMMENT ON COLUMN capture_schema.capture_asset.metadata IS
    'Optional product-private capture asset JSON. It is not returned by public APIs in this slice.';

CREATE INDEX IF NOT EXISTS idx_capture_asset_session_created
ON capture_schema.capture_asset (capture_session_id, created_at DESC)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_capture_asset_project_type
ON capture_schema.capture_asset (project_id, asset_type, created_at DESC)
WHERE is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS capture_schema.idx_capture_asset_project_type;
DROP INDEX IF EXISTS capture_schema.idx_capture_asset_session_created;
DROP TABLE IF EXISTS capture_schema.capture_asset;

DROP INDEX IF EXISTS file_schema.uq_file_storage_key_active_per_org;
DROP INDEX IF EXISTS file_schema.idx_file_org_created;
DROP TABLE IF EXISTS file_schema.file;
DROP SCHEMA IF EXISTS file_schema;
