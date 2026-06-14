-- 010_public_publish_password_access.sql
-- Created On: 2026-06-14

-- UP:

ALTER TABLE publish_schema.publish_link
  ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS password_salt TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE publish_schema.publish_link
  DROP CONSTRAINT IF EXISTS chk_publish_link_password_fields;

ALTER TABLE publish_schema.publish_link
  ADD CONSTRAINT chk_publish_link_password_fields
    CHECK (
      (
        password_hash IS NULL
        AND password_salt IS NULL
        AND password_set_at IS NULL
        AND password_updated_at IS NULL
      )
      OR (
        password_hash IS NOT NULL
        AND password_salt IS NOT NULL
        AND password_set_at IS NOT NULL
        AND password_updated_at IS NOT NULL
      )
    );

CREATE TABLE IF NOT EXISTS publish_schema.public_publish_viewer_session (
  id VARCHAR(26) PRIMARY KEY,
  publish_link_id VARCHAR(26) NOT NULL REFERENCES publish_schema.publish_link(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT uq_public_publish_viewer_session_token_hash UNIQUE (token_hash),
  CONSTRAINT chk_public_publish_viewer_session_expiry CHECK (expires_at > created_at)
);

COMMENT ON TABLE publish_schema.public_publish_viewer_session IS
  'Short-lived public viewer sessions for password-protected publish links.';

CREATE INDEX IF NOT EXISTS idx_public_publish_viewer_session_link_active
  ON publish_schema.public_publish_viewer_session (publish_link_id, expires_at)
  WHERE revoked_at IS NULL;

-- DOWN:

DROP INDEX IF EXISTS publish_schema.idx_public_publish_viewer_session_link_active;
DROP TABLE IF EXISTS publish_schema.public_publish_viewer_session;

ALTER TABLE publish_schema.publish_link
  DROP CONSTRAINT IF EXISTS chk_publish_link_password_fields;

ALTER TABLE publish_schema.publish_link
  DROP COLUMN IF EXISTS password_updated_at,
  DROP COLUMN IF EXISTS password_set_at,
  DROP COLUMN IF EXISTS password_salt,
  DROP COLUMN IF EXISTS password_hash;
