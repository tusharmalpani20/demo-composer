-- 004_capture_event_foundation_schema.sql
-- Created On: 2026-06-05

-- UP:

CREATE TABLE IF NOT EXISTS capture_schema.capture_event (
    id VARCHAR(26) PRIMARY KEY,

    organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
    project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
    capture_session_id VARCHAR(26) NOT NULL REFERENCES capture_schema.capture_session(id) ON DELETE CASCADE,
    capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_index INTEGER NOT NULL,

    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    page_url TEXT DEFAULT NULL,
    page_title TEXT DEFAULT NULL,
    target_label TEXT DEFAULT NULL,
    target_selector TEXT DEFAULT NULL,
    target_role TEXT DEFAULT NULL,
    target_test_id TEXT DEFAULT NULL,
    target_text TEXT DEFAULT NULL,
    client_x DOUBLE PRECISION DEFAULT NULL,
    client_y DOUBLE PRECISION DEFAULT NULL,
    viewport_width INTEGER DEFAULT NULL,
    viewport_height INTEGER DEFAULT NULL,
    device_pixel_ratio DOUBLE PRECISION DEFAULT NULL,
    input_intent TEXT DEFAULT NULL,
    input_value_redacted BOOLEAN NOT NULL DEFAULT TRUE,
    note TEXT DEFAULT NULL,
    metadata JSONB DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_capture_event_type
        CHECK (event_type IN ('navigation', 'click', 'input', 'capture', 'note')),
    CONSTRAINT chk_capture_event_index_positive
        CHECK (event_index >= 1),
    CONSTRAINT chk_capture_event_input_value_redacted_true
        CHECK (input_value_redacted = TRUE),
    CONSTRAINT chk_capture_event_client_x_non_negative
        CHECK (client_x IS NULL OR client_x >= 0),
    CONSTRAINT chk_capture_event_client_y_non_negative
        CHECK (client_y IS NULL OR client_y >= 0),
    CONSTRAINT chk_capture_event_viewport_width_positive
        CHECK (viewport_width IS NULL OR viewport_width > 0),
    CONSTRAINT chk_capture_event_viewport_height_positive
        CHECK (viewport_height IS NULL OR viewport_height > 0),
    CONSTRAINT chk_capture_event_device_pixel_ratio_positive
        CHECK (device_pixel_ratio IS NULL OR device_pixel_ratio > 0)
);

COMMENT ON TABLE capture_schema.capture_event IS
    'Source event ledger for capture sessions. Events describe what happened during capture and are not guide steps, demo scenes, file storage metadata, or generated output.';

COMMENT ON COLUMN capture_schema.capture_event.capture_asset_id IS
    'Optional screenshot/source asset reference. The service must verify same organization, project, and capture session scope when set.';

COMMENT ON COLUMN capture_schema.capture_event.metadata IS
    'Optional capture-event-private JSON. It is not returned by public APIs in this slice.';

COMMENT ON COLUMN capture_schema.capture_event.input_value_redacted IS
    'Privacy guard for input events. Raw typed values are not accepted in this slice, so this must remain true.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_capture_event_session_index_active
ON capture_schema.capture_event (capture_session_id, event_index)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_capture_event_session_order
ON capture_schema.capture_event (capture_session_id, event_index ASC)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_capture_event_asset
ON capture_schema.capture_event (capture_asset_id)
WHERE is_deleted = FALSE AND capture_asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_capture_event_project_created
ON capture_schema.capture_event (project_id, created_at DESC)
WHERE is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS capture_schema.idx_capture_event_project_created;
DROP INDEX IF EXISTS capture_schema.idx_capture_event_asset;
DROP INDEX IF EXISTS capture_schema.idx_capture_event_session_order;
DROP INDEX IF EXISTS capture_schema.uq_capture_event_session_index_active;
DROP TABLE IF EXISTS capture_schema.capture_event;
