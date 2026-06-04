-- 004_user_org_role.sql
-- Created On: 19-04-2026

-- UP:

ALTER TABLE user_schema.user ADD COLUMN IF NOT EXISTS role_id ULID NOT NULL REFERENCES organization_schema.org_role(id) ON DELETE RESTRICT;

ALTER TABLE user_schema.user ADD COLUMN IF NOT EXISTS role_name VARCHAR(255) NOT NULL;

ALTER TABLE user_schema.user ADD COLUMN IF NOT EXISTS is_primary_user BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_role_id ON user_schema.user(organization_id, role_id)
WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_primary_per_org
ON user_schema.user(organization_id)
WHERE is_primary_user = TRUE AND is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS uq_user_primary_per_org;
DROP INDEX IF EXISTS idx_user_role_id;

ALTER TABLE user_schema.user DROP COLUMN IF EXISTS is_primary_user;
ALTER TABLE user_schema.user DROP COLUMN IF EXISTS role_name;
ALTER TABLE user_schema.user DROP COLUMN IF EXISTS role_id;
