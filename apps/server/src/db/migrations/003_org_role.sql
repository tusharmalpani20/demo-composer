-- 003_org_role.sql
-- Created On: 19-04-2026

-- UP:

CREATE TABLE IF NOT EXISTS organization_schema.org_role (
    id ULID PRIMARY KEY DEFAULT gen_ulid(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    is_system_defined BOOLEAN NOT NULL DEFAULT FALSE,
    organization_id ULID NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at timestamptz DEFAULT NULL,
    deleted_by_id ULID DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_by_id ULID DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL,
    updated_by_id ULID DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_org_role_name ON organization_schema.org_role(organization_id, name)
WHERE name IS NOT NULL AND is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS idx_org_role_name;

DROP TABLE IF EXISTS organization_schema.org_role;
