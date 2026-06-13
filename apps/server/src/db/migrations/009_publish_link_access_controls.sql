-- 009_publish_link_access_controls.sql
-- Created On: 2026-06-13

-- UP:

ALTER TABLE publish_schema.publish_link
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE publish_schema.publish_link
  DROP CONSTRAINT IF EXISTS chk_publish_link_visibility;

ALTER TABLE publish_schema.publish_link
  ADD CONSTRAINT chk_publish_link_visibility
    CHECK (visibility IN ('public', 'restricted'));

CREATE INDEX IF NOT EXISTS idx_publish_link_public_access
  ON publish_schema.publish_link (slug, expires_at)
  WHERE status = 'active' AND visibility = 'public';

-- DOWN:

DROP INDEX IF EXISTS publish_schema.idx_publish_link_public_access;

UPDATE publish_schema.publish_link
SET visibility = 'public'
WHERE visibility = 'restricted';

ALTER TABLE publish_schema.publish_link
  DROP CONSTRAINT IF EXISTS chk_publish_link_visibility;

ALTER TABLE publish_schema.publish_link
  ADD CONSTRAINT chk_publish_link_visibility
    CHECK (visibility IN ('public'));

ALTER TABLE publish_schema.publish_link
  DROP COLUMN IF EXISTS expires_at;
