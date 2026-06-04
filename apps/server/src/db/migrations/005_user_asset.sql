-- 005_user_asset.sql
-- Created On: 19-04-2026

-- UP:

CREATE TABLE IF NOT EXISTS user_schema.user_asset (
    user_id ULID NOT NULL PRIMARY KEY REFERENCES user_schema.user(id) ON DELETE CASCADE,
    organization_id ULID NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,

    profile_picture_provider VARCHAR(255) DEFAULT NULL,
    profile_picture_path VARCHAR(255) DEFAULT NULL,
    profile_picture_url VARCHAR(255) DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at timestamptz DEFAULT NULL,
    deleted_by_id ULID DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_by_id ULID DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL,
    updated_by_id ULID DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_asset_org_active
ON user_schema.user_asset(organization_id)
WHERE is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS idx_user_asset_org_active;

DROP TABLE IF EXISTS user_schema.user_asset;
