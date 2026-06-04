-- 008_contact.sql
-- Created On: 19-04-2026

-- UP:

CREATE SCHEMA IF NOT EXISTS contact_schema;

CREATE TABLE IF NOT EXISTS contact_schema.contact (
    id ULID PRIMARY KEY DEFAULT gen_ulid(),

    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(255) DEFAULT NULL,
    phone_country_code VARCHAR(20) DEFAULT NULL,
    company_name VARCHAR(255) DEFAULT NULL,

    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('lead', 'customer', 'partner', 'other')),

    metadata JSONB DEFAULT NULL,

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

CREATE INDEX IF NOT EXISTS idx_contact_org_active
ON contact_schema.contact(organization_id)
WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_contact_email_per_org
ON contact_schema.contact(organization_id, lower(email))
WHERE email IS NOT NULL AND is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS uq_contact_email_per_org;
DROP INDEX IF EXISTS idx_contact_org_active;

DROP TABLE IF EXISTS contact_schema.contact;

DROP SCHEMA IF EXISTS contact_schema;
