-- 006_authentication.sql
-- Created On: 19-04-2026

-- UP:

CREATE SCHEMA IF NOT EXISTS "auth_schema";

CREATE TABLE IF NOT EXISTS "auth_schema"."auth_session" (
    id ULID PRIMARY KEY DEFAULT gen_ulid(),

    user_id ULID NOT NULL REFERENCES "user_schema"."user"(id) ON DELETE CASCADE,
    organization_id ULID DEFAULT NULL REFERENCES "organization_schema"."organization"(id) ON DELETE SET NULL,

    identity_provider VARCHAR(255) NOT NULL,
    identity_provider_session_id TEXT DEFAULT NULL,
    jwt_token TEXT NOT NULL,

    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,

    expires_at timestamptz NOT NULL,
    is_session_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_active_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_session_user_id ON "auth_schema"."auth_session"(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_session_active ON "auth_schema"."auth_session"(is_session_active);
CREATE INDEX IF NOT EXISTS idx_auth_session_expires ON "auth_schema"."auth_session"(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_session_user_active
    ON "auth_schema"."auth_session"(user_id, is_session_active)
    WHERE is_session_active = true;

CREATE INDEX IF NOT EXISTS idx_auth_session_provider
    ON "auth_schema"."auth_session"(identity_provider_session_id)
    WHERE is_session_active = true;

CREATE TABLE IF NOT EXISTS "auth_schema"."auth_session_init_data" (
    id ULID PRIMARY KEY DEFAULT gen_ulid(),

    ip_address TEXT NOT NULL,
    user_agent TEXT DEFAULT NULL,

    expires_at timestamptz NOT NULL DEFAULT (CURRENT_TIMESTAMP + interval '1 hour'),

    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "auth_schema"."auth_session_init_data" IS
'Temporarily stores client information during OAuth flow.';

CREATE INDEX IF NOT EXISTS idx_auth_session_init_data_expires ON "auth_schema"."auth_session_init_data"(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_session_init_ip
    ON "auth_schema"."auth_session_init_data"(ip_address, created_at DESC);

-- DOWN:

DROP INDEX IF EXISTS idx_auth_session_init_data_expires;
DROP INDEX IF EXISTS idx_auth_session_init_ip;
DROP TABLE IF EXISTS "auth_schema"."auth_session_init_data";

DROP INDEX IF EXISTS idx_auth_session_user_id;
DROP INDEX IF EXISTS idx_auth_session_active;
DROP INDEX IF EXISTS idx_auth_session_expires;
DROP INDEX IF EXISTS idx_auth_session_user_active;
DROP INDEX IF EXISTS idx_auth_session_provider;

DROP TABLE IF EXISTS "auth_schema"."auth_session";

DROP SCHEMA IF EXISTS "auth_schema";
