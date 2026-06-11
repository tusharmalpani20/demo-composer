-- 007_guide_block_content.sql
-- Created On: 2026-06-11

-- UP:

ALTER TABLE guide_schema.guide_block
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT NULL;

-- DOWN:

ALTER TABLE guide_schema.guide_block
DROP COLUMN IF EXISTS content;
