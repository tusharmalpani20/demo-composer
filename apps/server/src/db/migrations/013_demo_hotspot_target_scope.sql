-- 013_demo_hotspot_target_scope.sql
-- Created On: 2026-06-15

-- UP:

CREATE OR REPLACE FUNCTION interactive_demo_schema.enforce_demo_hotspot_target_scene_scope()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_scene_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM interactive_demo_schema.demo_scene target_scene
    WHERE target_scene.id = NEW.target_scene_id
    AND target_scene.organization_id = NEW.organization_id
    AND target_scene.project_id = NEW.project_id
    AND target_scene.interactive_demo_id = NEW.interactive_demo_id
    AND target_scene.is_deleted = FALSE
  ) THEN
    RAISE EXCEPTION 'Demo hotspot target scene must belong to the same interactive demo'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_demo_hotspot_target_scene_scope
  ON interactive_demo_schema.demo_hotspot;

CREATE TRIGGER trg_demo_hotspot_target_scene_scope
  BEFORE INSERT OR UPDATE OF organization_id, project_id, interactive_demo_id, target_scene_id
  ON interactive_demo_schema.demo_hotspot
  FOR EACH ROW
  EXECUTE FUNCTION interactive_demo_schema.enforce_demo_hotspot_target_scene_scope();

-- DOWN:

DROP TRIGGER IF EXISTS trg_demo_hotspot_target_scene_scope
  ON interactive_demo_schema.demo_hotspot;
DROP FUNCTION IF EXISTS interactive_demo_schema.enforce_demo_hotspot_target_scene_scope();
