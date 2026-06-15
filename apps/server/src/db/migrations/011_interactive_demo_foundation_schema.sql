-- 011_interactive_demo_foundation_schema.sql
-- Created On: 2026-06-15

-- UP:

CREATE SCHEMA IF NOT EXISTS interactive_demo_schema;

CREATE TABLE IF NOT EXISTS interactive_demo_schema.interactive_demo (
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
  CONSTRAINT chk_interactive_demo_status CHECK (status IN ('draft', 'archived')),
  CONSTRAINT chk_interactive_demo_title_not_empty CHECK (length(trim(title)) > 0)
);

COMMENT ON TABLE interactive_demo_schema.interactive_demo IS 'Editable interactive demo artifact kept separate from guide artifacts and capture source material.';

CREATE INDEX IF NOT EXISTS idx_interactive_demo_project_active_created
  ON interactive_demo_schema.interactive_demo (project_id, created_at DESC)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_interactive_demo_source_capture_session_active
  ON interactive_demo_schema.interactive_demo (source_capture_session_id, created_at DESC)
  WHERE is_deleted = FALSE AND source_capture_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS interactive_demo_schema.demo_scene (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  interactive_demo_id VARCHAR(26) NOT NULL REFERENCES interactive_demo_schema.interactive_demo(id) ON DELETE CASCADE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_session(id) ON DELETE SET NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_event(id) ON DELETE SET NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL,
  scene_index INTEGER NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  background_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_demo_scene_index_positive CHECK (scene_index >= 1),
  CONSTRAINT chk_demo_scene_title_not_empty CHECK (title IS NULL OR length(trim(title)) > 0)
);

COMMENT ON TABLE interactive_demo_schema.demo_scene IS 'Ordered scene foundation for screenshot-first interactive demos.';

CREATE INDEX IF NOT EXISTS idx_demo_scene_demo_active_order
  ON interactive_demo_schema.demo_scene (interactive_demo_id, scene_index ASC)
  WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_demo_scene_demo_index_active
  ON interactive_demo_schema.demo_scene (interactive_demo_id, scene_index)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_demo_scene_background_asset_active
  ON interactive_demo_schema.demo_scene (background_capture_asset_id)
  WHERE is_deleted = FALSE AND background_capture_asset_id IS NOT NULL;

-- DOWN:

DROP INDEX IF EXISTS interactive_demo_schema.idx_demo_scene_background_asset_active;
DROP INDEX IF EXISTS interactive_demo_schema.uq_demo_scene_demo_index_active;
DROP INDEX IF EXISTS interactive_demo_schema.idx_demo_scene_demo_active_order;
DROP TABLE IF EXISTS interactive_demo_schema.demo_scene;

DROP INDEX IF EXISTS interactive_demo_schema.idx_interactive_demo_source_capture_session_active;
DROP INDEX IF EXISTS interactive_demo_schema.idx_interactive_demo_project_active_created;
DROP TABLE IF EXISTS interactive_demo_schema.interactive_demo;

DROP SCHEMA IF EXISTS interactive_demo_schema;
