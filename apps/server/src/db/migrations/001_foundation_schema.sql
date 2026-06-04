-- 001_foundation_schema.sql
-- Created On: 2026-06-05

-- UP:

CREATE SCHEMA IF NOT EXISTS user_schema;
CREATE SCHEMA IF NOT EXISTS organization_schema;
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS project_schema;

CREATE TABLE IF NOT EXISTS user_schema.user (
    id VARCHAR(26) PRIMARY KEY,

    email VARCHAR(320) NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    display_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_status
        CHECK (status IN ('active', 'disabled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_email_active
ON user_schema.user (lower(email))
WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS organization_schema.organization (
    id VARCHAR(26) PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_organization_status
        CHECK (status IN ('active', 'disabled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_organization_slug_active
ON organization_schema.organization (lower(slug))
WHERE slug IS NOT NULL AND is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS organization_schema.org_user (
    id VARCHAR(26) PRIMARY KEY,

    organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
    user_id VARCHAR(26) NOT NULL REFERENCES user_schema.user(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_org_user_role
        CHECK (role IN ('owner', 'admin', 'member')),
    CONSTRAINT chk_org_user_status
        CHECK (status IN ('active', 'disabled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_user_membership_active
ON organization_schema.org_user (organization_id, user_id)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_org_user_user_active
ON organization_schema.org_user (user_id)
WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS auth_schema.auth_session (
    id VARCHAR(26) PRIMARY KEY,

    user_id VARCHAR(26) NOT NULL REFERENCES user_schema.user(id) ON DELETE CASCADE,
    organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
    org_user_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    session_type VARCHAR(50) NOT NULL DEFAULT 'web',

    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ DEFAULT NULL,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_auth_session_type
        CHECK (session_type IN ('web')),
    CONSTRAINT chk_auth_session_status
        CHECK (status IN ('active', 'revoked', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_auth_session_token_hash
ON auth_schema.auth_session (token_hash);

CREATE INDEX IF NOT EXISTS idx_auth_session_user_active
ON auth_schema.auth_session (user_id, status)
WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_session_org_user_active
ON auth_schema.auth_session (organization_id, org_user_id, status)
WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS project_schema.project (
    id VARCHAR(26) PRIMARY KEY,

    organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    slug VARCHAR(255) DEFAULT NULL,
    color VARCHAR(50) DEFAULT NULL,
    icon VARCHAR(100) DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,

    version INTEGER NOT NULL DEFAULT 1,
    created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_project_status
        CHECK (status IN ('active', 'archived'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_name_active_per_org
ON project_schema.project (organization_id, lower(name))
WHERE is_deleted = FALSE AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_slug_active_per_org
ON project_schema.project (organization_id, lower(slug))
WHERE slug IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_project_org_status
ON project_schema.project (organization_id, status, created_at DESC)
WHERE is_deleted = FALSE;

-- DOWN:

DROP INDEX IF EXISTS project_schema.idx_project_org_status;
DROP INDEX IF EXISTS project_schema.uq_project_slug_active_per_org;
DROP INDEX IF EXISTS project_schema.uq_project_name_active_per_org;
DROP TABLE IF EXISTS project_schema.project;

DROP INDEX IF EXISTS auth_schema.idx_auth_session_org_user_active;
DROP INDEX IF EXISTS auth_schema.idx_auth_session_user_active;
DROP INDEX IF EXISTS auth_schema.uq_auth_session_token_hash;
DROP TABLE IF EXISTS auth_schema.auth_session;

DROP INDEX IF EXISTS organization_schema.idx_org_user_user_active;
DROP INDEX IF EXISTS organization_schema.uq_org_user_membership_active;
DROP TABLE IF EXISTS organization_schema.org_user;

DROP INDEX IF EXISTS organization_schema.uq_organization_slug_active;
DROP TABLE IF EXISTS organization_schema.organization;

DROP INDEX IF EXISTS user_schema.uq_user_email_active;
DROP TABLE IF EXISTS user_schema.user;

DROP SCHEMA IF EXISTS project_schema;
DROP SCHEMA IF EXISTS auth_schema;
DROP SCHEMA IF EXISTS organization_schema;
DROP SCHEMA IF EXISTS user_schema;
