-- 014_org_member_invites.sql
-- Created On: 2026-06-15

-- UP:

CREATE TABLE IF NOT EXISTS organization_schema.org_invite (
  id VARCHAR(26) PRIMARY KEY,

  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  token_hash TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  accepted_user_id VARCHAR(26) DEFAULT NULL REFERENCES user_schema.user(id) ON DELETE SET NULL,

  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_org_invite_role
    CHECK (role IN ('owner', 'member')),
  CONSTRAINT chk_org_invite_status
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_invite_token_hash
ON organization_schema.org_invite (token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_invite_pending_email
ON organization_schema.org_invite (organization_id, lower(email))
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_org_invite_organization_status
ON organization_schema.org_invite (organization_id, status, created_at DESC);

-- DOWN:

DROP INDEX IF EXISTS organization_schema.idx_org_invite_organization_status;
DROP INDEX IF EXISTS organization_schema.uq_org_invite_pending_email;
DROP INDEX IF EXISTS organization_schema.uq_org_invite_token_hash;
DROP TABLE IF EXISTS organization_schema.org_invite;
