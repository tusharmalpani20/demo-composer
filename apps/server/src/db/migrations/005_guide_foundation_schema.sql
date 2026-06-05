-- 005_guide_foundation_schema.sql
-- Created On: 2026-06-05

-- UP:

CREATE SCHEMA IF NOT EXISTS guide_schema;

CREATE TABLE IF NOT EXISTS guide_schema.guide (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_session(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_guide_status CHECK (status IN ('draft', 'archived')),
  CONSTRAINT chk_guide_title_not_empty CHECK (length(trim(title)) > 0)
);

COMMENT ON TABLE guide_schema.guide IS 'Editable guide artifact generated from capture source material without mutating the capture rows.';

CREATE INDEX IF NOT EXISTS idx_guide_project_active_created
  ON guide_schema.guide (project_id, created_at DESC)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_guide_source_capture_session_active
  ON guide_schema.guide (source_capture_session_id, created_at DESC)
  WHERE is_deleted = FALSE AND source_capture_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS guide_schema.guide_block (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  guide_id VARCHAR(26) NOT NULL REFERENCES guide_schema.guide(id) ON DELETE CASCADE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_session(id) ON DELETE SET NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_event(id) ON DELETE SET NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL,
  block_type VARCHAR(50) NOT NULL,
  block_index INTEGER NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_guide_block_type CHECK (block_type IN ('step')),
  CONSTRAINT chk_guide_block_index_positive CHECK (block_index >= 1)
);

CREATE INDEX IF NOT EXISTS idx_guide_block_guide_active_order
  ON guide_schema.guide_block (guide_id, block_index ASC)
  WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_guide_block_guide_index_active
  ON guide_schema.guide_block (guide_id, block_index)
  WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS guide_schema.guide_step (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  guide_id VARCHAR(26) NOT NULL REFERENCES guide_schema.guide(id) ON DELETE CASCADE,
  guide_block_id VARCHAR(26) NOT NULL REFERENCES guide_schema.guide_block(id) ON DELETE CASCADE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_session(id) ON DELETE SET NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_event(id) ON DELETE SET NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT DEFAULT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_guide_step_title_not_empty CHECK (length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_guide_step_block_active
  ON guide_schema.guide_step (guide_block_id)
  WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_guide_step_block_active
  ON guide_schema.guide_step (guide_block_id)
  WHERE is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS guide_schema.uq_guide_step_block_active;
DROP INDEX IF EXISTS guide_schema.idx_guide_step_block_active;
DROP TABLE IF EXISTS guide_schema.guide_step;

DROP INDEX IF EXISTS guide_schema.uq_guide_block_guide_index_active;
DROP INDEX IF EXISTS guide_schema.idx_guide_block_guide_active_order;
DROP TABLE IF EXISTS guide_schema.guide_block;

DROP INDEX IF EXISTS guide_schema.idx_guide_source_capture_session_active;
DROP INDEX IF EXISTS guide_schema.idx_guide_project_active_created;
DROP TABLE IF EXISTS guide_schema.guide;

DROP SCHEMA IF EXISTS guide_schema;
