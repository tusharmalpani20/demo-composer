-- 012_interactive_demo_hotspots.sql
-- Created On: 2026-06-15

-- UP:

CREATE TABLE IF NOT EXISTS interactive_demo_schema.demo_hotspot (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  interactive_demo_id VARCHAR(26) NOT NULL REFERENCES interactive_demo_schema.interactive_demo(id) ON DELETE CASCADE,
  demo_scene_id VARCHAR(26) NOT NULL REFERENCES interactive_demo_schema.demo_scene(id) ON DELETE CASCADE,
  hotspot_type VARCHAR(50) NOT NULL,
  label VARCHAR(255) DEFAULT NULL,
  content TEXT DEFAULT NULL,
  x NUMERIC(8, 6) NOT NULL,
  y NUMERIC(8, 6) NOT NULL,
  width NUMERIC(8, 6) NOT NULL,
  height NUMERIC(8, 6) NOT NULL,
  target_scene_id VARCHAR(26) DEFAULT NULL REFERENCES interactive_demo_schema.demo_scene(id) ON DELETE SET NULL,
  hotspot_index INTEGER NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_demo_hotspot_type CHECK (hotspot_type IN ('click', 'info', 'next')),
  CONSTRAINT chk_demo_hotspot_label_not_empty CHECK (label IS NULL OR length(trim(label)) > 0),
  CONSTRAINT chk_demo_hotspot_normalized_box CHECK (
    x >= 0 AND x <= 1
    AND y >= 0 AND y <= 1
    AND width > 0 AND width <= 1
    AND height > 0 AND height <= 1
    AND x + width <= 1
    AND y + height <= 1
  ),
  CONSTRAINT chk_demo_hotspot_index_positive CHECK (hotspot_index >= 1)
);

COMMENT ON TABLE interactive_demo_schema.demo_hotspot IS 'Draft hotspot overlays for screenshot-first interactive demo scenes.';

CREATE INDEX IF NOT EXISTS idx_demo_hotspot_scene_active_order
  ON interactive_demo_schema.demo_hotspot (demo_scene_id, hotspot_index ASC)
  WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_demo_hotspot_scene_index_active
  ON interactive_demo_schema.demo_hotspot (demo_scene_id, hotspot_index)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_demo_hotspot_target_scene_active
  ON interactive_demo_schema.demo_hotspot (target_scene_id)
  WHERE is_deleted = FALSE AND target_scene_id IS NOT NULL;

-- DOWN:

DROP INDEX IF EXISTS interactive_demo_schema.idx_demo_hotspot_target_scene_active;
DROP INDEX IF EXISTS interactive_demo_schema.uq_demo_hotspot_scene_index_active;
DROP INDEX IF EXISTS interactive_demo_schema.idx_demo_hotspot_scene_active_order;
DROP TABLE IF EXISTS interactive_demo_schema.demo_hotspot;
