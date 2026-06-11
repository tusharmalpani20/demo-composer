-- 008_guide_block_screenshot_selection.sql
-- Created On: 2026-06-11

-- UP:

ALTER TABLE guide_schema.guide_block
ADD COLUMN IF NOT EXISTS selected_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id),
ADD COLUMN IF NOT EXISTS screenshot_hidden BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_guide_block_selected_capture_asset
ON guide_schema.guide_block(selected_capture_asset_id)
WHERE selected_capture_asset_id IS NOT NULL
AND is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS guide_schema.idx_guide_block_selected_capture_asset;

ALTER TABLE guide_schema.guide_block
DROP COLUMN IF EXISTS screenshot_hidden,
DROP COLUMN IF EXISTS selected_capture_asset_id;
