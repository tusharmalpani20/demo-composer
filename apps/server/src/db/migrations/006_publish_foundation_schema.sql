-- 006_publish_foundation_schema.sql
-- Created On: 2026-06-10

-- UP:

CREATE SCHEMA IF NOT EXISTS publish_schema;

CREATE TABLE IF NOT EXISTS publish_schema.published_artifact (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  artifact_type VARCHAR(50) NOT NULL,
  artifact_id VARCHAR(26) NOT NULL,
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  snapshot_json JSONB NOT NULL,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_published_artifact_type CHECK (artifact_type IN ('guide', 'interactive_demo')),
  CONSTRAINT chk_published_artifact_version_positive CHECK (version_number >= 1),
  CONSTRAINT chk_published_artifact_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT uq_published_artifact_source_version UNIQUE (
    organization_id,
    artifact_type,
    artifact_id,
    version_number
  )
);

COMMENT ON TABLE publish_schema.published_artifact IS
  'Immutable materialized published artifact snapshot. Public links resolve to these rows instead of mutable draft guide or demo rows.';

COMMENT ON COLUMN publish_schema.published_artifact.snapshot_json IS
  'Public-reader-safe immutable snapshot JSON. It must not include storage keys, private metadata, or mutable draft internals.';

CREATE INDEX IF NOT EXISTS idx_published_artifact_source_created
  ON publish_schema.published_artifact (organization_id, artifact_type, artifact_id, published_at DESC);

CREATE TABLE IF NOT EXISTS publish_schema.publish_link (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  artifact_type VARCHAR(50) NOT NULL,
  artifact_id VARCHAR(26) NOT NULL,
  published_artifact_id VARCHAR(26) NOT NULL REFERENCES publish_schema.published_artifact(id) ON DELETE RESTRICT,
  slug VARCHAR(80) NOT NULL,
  visibility VARCHAR(50) NOT NULL DEFAULT 'public',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  revoked_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_publish_link_artifact_type CHECK (artifact_type IN ('guide', 'interactive_demo')),
  CONSTRAINT chk_publish_link_visibility CHECK (visibility IN ('public')),
  CONSTRAINT chk_publish_link_status CHECK (status IN ('active', 'revoked')),
  CONSTRAINT chk_publish_link_slug_not_empty CHECK (length(trim(slug)) > 0),
  CONSTRAINT uq_publish_link_slug UNIQUE (slug)
);

COMMENT ON TABLE publish_schema.publish_link IS
  'Stable publish/access state. It points to the current published artifact snapshot and can be revoked without deleting snapshots.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_publish_link_active_source
  ON publish_schema.publish_link (organization_id, artifact_type, artifact_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_publish_link_slug_active
  ON publish_schema.publish_link (slug)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_publish_link_project_created
  ON publish_schema.publish_link (project_id, created_at DESC);

-- DOWN:

DROP INDEX IF EXISTS publish_schema.idx_publish_link_project_created;
DROP INDEX IF EXISTS publish_schema.idx_publish_link_slug_active;
DROP INDEX IF EXISTS publish_schema.uq_publish_link_active_source;
DROP TABLE IF EXISTS publish_schema.publish_link;

DROP INDEX IF EXISTS publish_schema.idx_published_artifact_source_created;
DROP TABLE IF EXISTS publish_schema.published_artifact;
DROP SCHEMA IF EXISTS publish_schema;
