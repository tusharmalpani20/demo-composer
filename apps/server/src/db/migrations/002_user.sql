-- 002_user.sql
-- Created On: 19-04-2026

-- UP:

CREATE SCHEMA IF NOT EXISTS user_schema;

CREATE TABLE IF NOT EXISTS user_schema.user (
    id ULID PRIMARY KEY DEFAULT gen_ulid(),

    organization_id ULID NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    username VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL,

    phone VARCHAR(255) DEFAULT NULL,
    phone_country_code VARCHAR(20) DEFAULT NULL,

    password VARCHAR(255) DEFAULT NULL,

    identity_provider VARCHAR(255) DEFAULT NULL,
    identity_provider_user_id VARCHAR(255) DEFAULT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at timestamptz DEFAULT NULL,

    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at timestamptz DEFAULT NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_schema.user ADD COLUMN IF NOT EXISTS deleted_by_id ULID DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL;

ALTER TABLE user_schema.user ADD COLUMN IF NOT EXISTS created_by_id ULID DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL;
ALTER TABLE user_schema.user ADD COLUMN IF NOT EXISTS updated_by_id ULID DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_organization_id ON user_schema.user(organization_id)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_identity ON user_schema.user(identity_provider, identity_provider_user_id)
WHERE identity_provider IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_phone ON user_schema.user(phone)
WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_email ON user_schema.user(email)
WHERE email IS NOT NULL;

-- DOWN:

DROP INDEX IF EXISTS idx_user_organization_id;
DROP INDEX IF EXISTS idx_user_identity;
DROP INDEX IF EXISTS idx_user_phone;
DROP INDEX IF EXISTS idx_user_email;

DROP TABLE IF EXISTS user_schema.user;

DROP SCHEMA IF EXISTS user_schema;
