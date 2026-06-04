-- 001_organization.sql
-- Created On: 19-04-2026

-- UP:

CREATE EXTENSION IF NOT EXISTS "ulid";

CREATE SCHEMA IF NOT EXISTS organization_schema;

CREATE TABLE IF NOT EXISTS organization_schema.organization (
    id ULID PRIMARY KEY DEFAULT gen_ulid(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    website VARCHAR(255) DEFAULT NULL,
    logo VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(255) DEFAULT NULL,
    phone_country_code VARCHAR(20) DEFAULT NULL,

    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at timestamptz DEFAULT NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organization_name ON organization_schema.organization(name)
WHERE name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_timezone ON organization_schema.organization(timezone)
WHERE timezone IS NOT NULL;

-- DOWN:

DROP INDEX IF EXISTS idx_organization_name;
DROP INDEX IF EXISTS idx_organization_timezone;

DROP TABLE IF EXISTS organization_schema.organization;

DROP SCHEMA IF EXISTS organization_schema;

DROP EXTENSION IF EXISTS "ulid";
