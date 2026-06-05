-- 002_capture_session_schema.sql
-- Created On: 2026-06-05

-- UP:

CREATE SCHEMA IF NOT EXISTS capture_schema;

CREATE TABLE IF NOT EXISTS capture_schema.capture_session (
    id VARCHAR(26) PRIMARY KEY,

    organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
    project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    source_type VARCHAR(50) NOT NULL DEFAULT 'manual',

    started_at TIMESTAMPTZ DEFAULT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    canceled_at TIMESTAMPTZ DEFAULT NULL,

    start_url TEXT DEFAULT NULL,
    browser_name VARCHAR(100) DEFAULT NULL,
    browser_version VARCHAR(100) DEFAULT NULL,
    operating_system VARCHAR(100) DEFAULT NULL,
    viewport_width INTEGER DEFAULT NULL,
    viewport_height INTEGER DEFAULT NULL,
    device_pixel_ratio DOUBLE PRECISION DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    metadata JSONB DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_capture_session_status
        CHECK (status IN ('draft', 'capturing', 'completed', 'canceled', 'archived')),
    CONSTRAINT chk_capture_session_source_type
        CHECK (source_type IN ('manual', 'extension', 'import')),
    CONSTRAINT chk_capture_session_viewport_width_positive
        CHECK (viewport_width IS NULL OR viewport_width > 0),
    CONSTRAINT chk_capture_session_viewport_height_positive
        CHECK (viewport_height IS NULL OR viewport_height > 0),
    CONSTRAINT chk_capture_session_device_pixel_ratio_positive
        CHECK (device_pixel_ratio IS NULL OR device_pixel_ratio > 0)
);

COMMENT ON TABLE capture_schema.capture_session IS
    'Source material for guides and interactive demos. A capture session owns capture lifecycle and environment metadata, but not screenshots, files, guide blocks, demo scenes, or publish state.';

COMMENT ON COLUMN capture_schema.capture_session.metadata IS
    'Optional capture-environment JSON. It must not store raw typed values or storage provider paths.';

COMMENT ON COLUMN capture_schema.capture_session.status IS
    'Lifecycle state for the source capture session. Completing a session does not create a guide or demo artifact.';

CREATE INDEX IF NOT EXISTS idx_capture_session_project_status
ON capture_schema.capture_session (project_id, status, created_at DESC)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_capture_session_org_created
ON capture_schema.capture_session (organization_id, created_at DESC)
WHERE is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS capture_schema.idx_capture_session_org_created;
DROP INDEX IF EXISTS capture_schema.idx_capture_session_project_status;
DROP TABLE IF EXISTS capture_schema.capture_session;
DROP SCHEMA IF EXISTS capture_schema;
