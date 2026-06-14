import { ulid } from "ulid";
import type {
  GuidePublishStatus,
  PublishedArtifact,
  PublishLink,
  PublishRepository,
  PublishVisibility,
  PublicAssetFile,
} from "./publish.service";
import { PublishSlugConflictError } from "./publish.service";
import { build_guide_repository } from "../guide/guide.repository";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(sql: string, values?: unknown[]) => Promise<QueryResult<Row>>;
};

type TransactionClient = Queryable & {
  release: () => void;
};

type TransactionCapable = Queryable & {
  connect: () => Promise<TransactionClient>;
};

type PublishedArtifactRow = {
  id: string;
  artifact_type: "guide" | "interactive_demo";
  artifact_id: string;
  version_number: number;
  title: string;
  snapshot_json: unknown;
  published_at: Date;
};

type PublishLinkRow = {
  id: string;
  artifact_type: "guide" | "interactive_demo";
  artifact_id: string;
  published_artifact_id: string;
  slug: string;
  visibility: PublishVisibility;
  expires_at: Date | null;
  status: "active" | "revoked";
  published_at: Date;
  revoked_at: Date | null;
  password_hash: string | null;
  password_salt: string | null;
  password_set_at: Date | null;
  password_updated_at: Date | null;
};

type PublicResolveRow = PublishLinkRow & {
  artifact_id: string;
  published_artifact_version_number: number;
  published_artifact_title: string;
  published_artifact_published_at: Date;
  published_artifact_snapshot_json: unknown;
};

type PublicAssetFileRow = {
  storage_provider: "local" | "external";
  storage_key: string;
  mime_type: string;
};

type GuidePublishStatusRow = {
  link_id: string;
  link_artifact_type: "guide" | "interactive_demo";
  link_artifact_id: string;
  link_published_artifact_id: string;
  link_slug: string;
  link_visibility: PublishVisibility;
  link_expires_at: Date | null;
  link_status: "active" | "revoked";
  link_published_at: Date;
  link_revoked_at: Date | null;
  link_password_hash: string | null;
  link_password_salt: string | null;
  link_password_set_at: Date | null;
  link_password_updated_at: Date | null;
  artifact_id: string;
  artifact_artifact_type: "guide" | "interactive_demo";
  artifact_artifact_id: string;
  artifact_version_number: number;
  artifact_title: string;
  artifact_snapshot_json: unknown;
  artifact_published_at: Date;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const public_url_for_slug = (slug: string) => `/p/${slug}`;

const map_publish_link = (row: PublishLinkRow): PublishLink => ({
  id: row.id,
  artifact_type: row.artifact_type,
  artifact_id: row.artifact_id,
  published_artifact_id: row.published_artifact_id,
  slug: row.slug,
  visibility: row.visibility,
  expires_at: row.expires_at?.toISOString() ?? null,
  password_protected: Boolean(row.password_hash),
  status: row.status,
  published_at: row.published_at.toISOString(),
  revoked_at: row.revoked_at?.toISOString() ?? null,
  public_url: public_url_for_slug(row.slug),
});

const map_published_artifact = (row: PublishedArtifactRow): PublishedArtifact => ({
  id: row.id,
  artifact_type: row.artifact_type,
  artifact_id: row.artifact_id,
  version_number: Number(row.version_number),
  title: row.title,
  published_at: row.published_at.toISOString(),
});

const publish_link_select = `
  id,
  artifact_type,
  artifact_id,
  published_artifact_id,
  slug,
  visibility,
  expires_at,
  status,
  published_at,
  revoked_at,
  password_hash,
  password_salt,
  password_set_at,
  password_updated_at
`;

const published_artifact_select = `
  id,
  artifact_type,
  artifact_id,
  version_number,
  title,
  snapshot_json,
  published_at
`;

const is_slug_conflict = (error: unknown) => {
  const pg_error = error as { code?: string; constraint?: string };
  return pg_error.code === "23505" && pg_error.constraint === "uq_publish_link_slug";
};

const map_guide_publish_status = (row: GuidePublishStatusRow): GuidePublishStatus => ({
  publish_link: map_publish_link({
    id: row.link_id,
    artifact_type: row.link_artifact_type,
    artifact_id: row.link_artifact_id,
    published_artifact_id: row.link_published_artifact_id,
    slug: row.link_slug,
    visibility: row.link_visibility,
    expires_at: row.link_expires_at,
    status: row.link_status,
    published_at: row.link_published_at,
    revoked_at: row.link_revoked_at,
    password_hash: row.link_password_hash,
    password_salt: row.link_password_salt,
    password_set_at: row.link_password_set_at,
    password_updated_at: row.link_password_updated_at,
  }),
  published_artifact: map_published_artifact({
    id: row.artifact_id,
    artifact_type: row.artifact_artifact_type,
    artifact_id: row.artifact_artifact_id,
    version_number: row.artifact_version_number,
    title: row.artifact_title,
    snapshot_json: row.artifact_snapshot_json,
    published_at: row.artifact_published_at,
  }),
});

const asset_referenced_by_snapshot = (snapshot: unknown, capture_asset_id: string) => {
  if (!snapshot || typeof snapshot !== "object") {
    return false;
  }

  const blocks = (snapshot as { blocks?: unknown }).blocks;

  if (!Array.isArray(blocks)) {
    return false;
  }

  return blocks.some((block) => (
    block
    && typeof block === "object"
    && (block as { source_asset?: { id?: unknown } | null }).source_asset?.id === capture_asset_id
  ));
};

const build_transactional_repository = (db: Queryable): PublishRepository => {
  const guide_repository = build_guide_repository(db as Parameters<typeof build_guide_repository>[0]);

  return {
    async transaction(work) {
      return work(build_transactional_repository(db));
    },

    async project_exists(input) {
      const result = await db.query<{ exists: boolean }>(`
        SELECT EXISTS (
          SELECT 1
          FROM project_schema.project
          WHERE id = $1
          AND organization_id = $2
          AND is_deleted = FALSE
        ) AS exists
      `, [input.project_id, input.organization_id]);

      return Boolean(result.rows[0]?.exists);
    },

    async find_guide_detail(input) {
      return guide_repository.find_guide_detail(input);
    },

    async find_active_publish_link(input) {
      const result = await db.query<PublishLinkRow>(`
        SELECT ${publish_link_select}
        FROM publish_schema.publish_link
        WHERE organization_id = $1
        AND project_id = $2
        AND artifact_type = $3
        AND artifact_id = $4
        AND status = 'active'
        LIMIT 1
      `, [
        input.organization_id,
        input.project_id,
        input.artifact_type,
        input.artifact_id,
      ]);
      const row = first_row(result);

      return row ? map_publish_link(row) : null;
    },

    async next_published_artifact_version(input) {
      const result = await db.query<{ next_version: number }>(`
        SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
        FROM publish_schema.published_artifact
        WHERE organization_id = $1
        AND project_id = $2
        AND artifact_type = $3
        AND artifact_id = $4
      `, [
        input.organization_id,
        input.project_id,
        input.artifact_type,
        input.artifact_id,
      ]);

      return Number(result.rows[0]?.next_version ?? 1);
    },

    async create_published_artifact(input) {
      const result = await db.query<PublishedArtifactRow>(`
        INSERT INTO publish_schema.published_artifact (
          id,
          organization_id,
          project_id,
          artifact_type,
          artifact_id,
          version_number,
          title,
          snapshot_json,
          created_by_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING ${published_artifact_select}
      `, [
        ulid(),
        input.organization_id,
        input.project_id,
        input.artifact_type,
        input.artifact_id,
        input.version_number,
        input.title,
        JSON.stringify(input.snapshot_json),
        input.actor_org_user_id,
      ]);
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to create published artifact");
      }

      return map_published_artifact(row);
    },

    async create_publish_link(input) {
      try {
        const result = await db.query<PublishLinkRow>(`
          INSERT INTO publish_schema.publish_link (
            id,
            organization_id,
            project_id,
            artifact_type,
            artifact_id,
            published_artifact_id,
            slug,
            created_by_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING ${publish_link_select}
        `, [
          ulid(),
          input.organization_id,
          input.project_id,
          input.artifact_type,
          input.artifact_id,
          input.published_artifact_id,
          input.slug,
          input.actor_org_user_id,
        ]);
        const row = first_row(result);

        if (!row) {
          throw new Error("Failed to create publish link");
        }

        return map_publish_link(row);
      } catch (error) {
        if (is_slug_conflict(error)) {
          throw new PublishSlugConflictError();
        }

        throw error;
      }
    },

    async update_publish_link_target(input) {
      const result = await db.query<PublishLinkRow>(`
        UPDATE publish_schema.publish_link
        SET
          published_artifact_id = $1,
          published_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        AND organization_id = $3
        AND project_id = $4
        AND status = 'active'
        RETURNING ${publish_link_select}
      `, [
        input.published_artifact_id,
        input.publish_link_id,
        input.organization_id,
        input.project_id,
      ]);
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to update publish link");
      }

      return map_publish_link(row);
    },

    async find_guide_publish_status(input) {
      const result = await db.query<GuidePublishStatusRow>(`
        SELECT
          publish_link.id AS link_id,
          publish_link.artifact_type AS link_artifact_type,
          publish_link.artifact_id AS link_artifact_id,
          publish_link.published_artifact_id AS link_published_artifact_id,
          publish_link.slug AS link_slug,
          publish_link.visibility AS link_visibility,
          publish_link.expires_at AS link_expires_at,
          publish_link.status AS link_status,
          publish_link.published_at AS link_published_at,
          publish_link.revoked_at AS link_revoked_at,
          publish_link.password_hash AS link_password_hash,
          publish_link.password_salt AS link_password_salt,
          publish_link.password_set_at AS link_password_set_at,
          publish_link.password_updated_at AS link_password_updated_at,
          published_artifact.id AS artifact_id,
          published_artifact.artifact_type AS artifact_artifact_type,
          published_artifact.artifact_id AS artifact_artifact_id,
          published_artifact.version_number AS artifact_version_number,
          published_artifact.title AS artifact_title,
          published_artifact.snapshot_json AS artifact_snapshot_json,
          published_artifact.published_at AS artifact_published_at
        FROM publish_schema.publish_link publish_link
        INNER JOIN publish_schema.published_artifact published_artifact
          ON published_artifact.id = publish_link.published_artifact_id
        WHERE publish_link.organization_id = $1
        AND publish_link.project_id = $2
        AND publish_link.artifact_type = 'guide'
        AND publish_link.artifact_id = $3
        AND publish_link.status = 'active'
        LIMIT 1
      `, [
        input.organization_id,
        input.project_id,
        input.guide_id,
      ]);
      const row = first_row(result);

      if (!row) {
        return null;
      }

      return map_guide_publish_status(row);
    },

    async revoke_active_publish_link(input) {
      const result = await db.query<PublishLinkRow>(`
        UPDATE publish_schema.publish_link
        SET
          status = 'revoked',
          revoked_at = CURRENT_TIMESTAMP,
          revoked_by_id = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE organization_id = $2
        AND project_id = $3
        AND artifact_type = 'guide'
        AND artifact_id = $4
        AND status = 'active'
        RETURNING ${publish_link_select}
      `, [
        input.actor_org_user_id,
        input.organization_id,
        input.project_id,
        input.guide_id,
      ]);
      const row = first_row(result);

      return row ? map_publish_link(row) : null;
    },

    async update_publish_link_access(input) {
      const result = await db.query<GuidePublishStatusRow>(`
        WITH updated_link AS (
          UPDATE publish_schema.publish_link
          SET
            visibility = $1,
            expires_at = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE organization_id = $3
          AND project_id = $4
          AND artifact_type = 'guide'
          AND artifact_id = $5
          AND status = 'active'
          RETURNING *
        )
        SELECT
          updated_link.id AS link_id,
          updated_link.artifact_type AS link_artifact_type,
          updated_link.artifact_id AS link_artifact_id,
          updated_link.published_artifact_id AS link_published_artifact_id,
          updated_link.slug AS link_slug,
          updated_link.visibility AS link_visibility,
          updated_link.expires_at AS link_expires_at,
          updated_link.status AS link_status,
          updated_link.published_at AS link_published_at,
          updated_link.revoked_at AS link_revoked_at,
          updated_link.password_hash AS link_password_hash,
          updated_link.password_salt AS link_password_salt,
          updated_link.password_set_at AS link_password_set_at,
          updated_link.password_updated_at AS link_password_updated_at,
          published_artifact.id AS artifact_id,
          published_artifact.artifact_type AS artifact_artifact_type,
          published_artifact.artifact_id AS artifact_artifact_id,
          published_artifact.version_number AS artifact_version_number,
          published_artifact.title AS artifact_title,
          published_artifact.snapshot_json AS artifact_snapshot_json,
          published_artifact.published_at AS artifact_published_at
        FROM updated_link
        INNER JOIN publish_schema.published_artifact published_artifact
          ON published_artifact.id = updated_link.published_artifact_id
        LIMIT 1
      `, [
        input.visibility,
        input.expires_at,
        input.organization_id,
        input.project_id,
        input.guide_id,
      ]);
      const row = first_row(result);

      return row ? map_guide_publish_status(row) : null;
    },

    async update_publish_link_password(input) {
      const result = await db.query<GuidePublishStatusRow>(`
        WITH updated_link AS (
          UPDATE publish_schema.publish_link
          SET
            password_hash = $1::text,
            password_salt = $2::text,
            password_set_at = CASE WHEN $1::text IS NULL THEN NULL ELSE COALESCE(password_set_at, CURRENT_TIMESTAMP) END,
            password_updated_at = CASE WHEN $1::text IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
            updated_at = CURRENT_TIMESTAMP
          WHERE organization_id = $3
          AND project_id = $4
          AND artifact_type = 'guide'
          AND artifact_id = $5
          AND status = 'active'
          RETURNING *
        )
        SELECT
          updated_link.id AS link_id,
          updated_link.artifact_type AS link_artifact_type,
          updated_link.artifact_id AS link_artifact_id,
          updated_link.published_artifact_id AS link_published_artifact_id,
          updated_link.slug AS link_slug,
          updated_link.visibility AS link_visibility,
          updated_link.expires_at AS link_expires_at,
          updated_link.status AS link_status,
          updated_link.published_at AS link_published_at,
          updated_link.revoked_at AS link_revoked_at,
          updated_link.password_hash AS link_password_hash,
          updated_link.password_salt AS link_password_salt,
          updated_link.password_set_at AS link_password_set_at,
          updated_link.password_updated_at AS link_password_updated_at,
          published_artifact.id AS artifact_id,
          published_artifact.artifact_type AS artifact_artifact_type,
          published_artifact.artifact_id AS artifact_artifact_id,
          published_artifact.version_number AS artifact_version_number,
          published_artifact.title AS artifact_title,
          published_artifact.snapshot_json AS artifact_snapshot_json,
          published_artifact.published_at AS artifact_published_at
        FROM updated_link
        INNER JOIN publish_schema.published_artifact published_artifact
          ON published_artifact.id = updated_link.published_artifact_id
        LIMIT 1
      `, [
        input.password_hash,
        input.password_salt,
        input.organization_id,
        input.project_id,
        input.guide_id,
      ]);
      const row = first_row(result);

      return row ? map_guide_publish_status(row) : null;
    },

    async create_public_viewer_session(input) {
      await db.query(`
        INSERT INTO publish_schema.public_publish_viewer_session (
          id,
          publish_link_id,
          token_hash,
          expires_at
        )
        VALUES ($1, $2, $3, $4)
      `, [
        ulid(),
        input.publish_link_id,
        input.token_hash,
        input.expires_at,
      ]);

      return {
        token: input.token,
        expires_at: input.expires_at,
      };
    },

    async find_public_viewer_session_by_token_hash(input) {
      const result = await db.query<{
        publish_link_id: string;
        expires_at: Date;
        revoked_at: Date | null;
      }>(`
        SELECT
          viewer_session.publish_link_id,
          viewer_session.expires_at,
          viewer_session.revoked_at
        FROM publish_schema.public_publish_viewer_session viewer_session
        INNER JOIN publish_schema.publish_link publish_link
          ON publish_link.id = viewer_session.publish_link_id
        WHERE viewer_session.token_hash = $1
        AND publish_link.slug = $2
        LIMIT 1
      `, [
        input.token_hash,
        input.publish_link_slug,
      ]);
      const row = first_row(result);

      return row
        ? {
          publish_link_id: row.publish_link_id,
          expires_at: row.expires_at.toISOString(),
          revoked_at: row.revoked_at?.toISOString() ?? null,
        }
        : null;
    },

    async touch_public_viewer_session(input) {
      await db.query(`
        UPDATE publish_schema.public_publish_viewer_session
        SET last_used_at = CURRENT_TIMESTAMP
        WHERE token_hash = $1
      `, [input.token_hash]);
    },

    async revoke_public_viewer_sessions_for_publish_link(input) {
      await db.query(`
        UPDATE publish_schema.public_publish_viewer_session
        SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
        WHERE publish_link_id = $1
        AND revoked_at IS NULL
      `, [input.publish_link_id]);
    },

    async find_active_publish_link_by_slug(input) {
      const result = await db.query<PublicResolveRow>(`
        SELECT
          publish_link.id,
          publish_link.artifact_type,
          publish_link.artifact_id,
          publish_link.published_artifact_id,
          publish_link.slug,
          publish_link.visibility,
          publish_link.expires_at,
          publish_link.status,
          publish_link.published_at,
          publish_link.revoked_at,
          publish_link.password_hash,
          publish_link.password_salt,
          publish_link.password_set_at,
          publish_link.password_updated_at,
          published_artifact.version_number AS published_artifact_version_number,
          published_artifact.title AS published_artifact_title,
          published_artifact.published_at AS published_artifact_published_at,
          published_artifact.snapshot_json AS published_artifact_snapshot_json
        FROM publish_schema.publish_link publish_link
        INNER JOIN publish_schema.published_artifact published_artifact
          ON published_artifact.id = publish_link.published_artifact_id
        WHERE publish_link.slug = $1
        AND publish_link.status = 'active'
        LIMIT 1
      `, [input.slug]);
      const row = first_row(result);

      if (!row) {
        return null;
      }

      return {
        publish_link: {
          slug: row.slug,
          artifact_type: row.artifact_type,
          visibility: row.visibility,
          expires_at: row.expires_at?.toISOString() ?? null,
          status: row.status,
          password_protected: Boolean(row.password_hash),
        },
        published_artifact: {
          id: row.published_artifact_id,
          artifact_type: row.artifact_type,
          artifact_id: row.artifact_id,
          version_number: Number(row.published_artifact_version_number),
          title: row.published_artifact_title,
          published_at: row.published_artifact_published_at.toISOString(),
          snapshot: row.published_artifact_snapshot_json,
        },
        publish_link_id: row.id,
        password: row.password_hash && row.password_salt
          ? {
            hash: row.password_hash,
            salt: row.password_salt,
          }
          : null,
      };
    },

    async find_public_asset_file(input) {
      const link_result = await db.query<{
        organization_id: string;
        project_id: string;
        snapshot_json: unknown;
      }>(`
        SELECT
          publish_link.organization_id,
          publish_link.project_id,
          published_artifact.snapshot_json
        FROM publish_schema.publish_link publish_link
        INNER JOIN publish_schema.published_artifact published_artifact
          ON published_artifact.id = publish_link.published_artifact_id
        WHERE publish_link.slug = $1
        AND publish_link.status = 'active'
        AND publish_link.visibility = 'public'
        AND (
          publish_link.expires_at IS NULL
          OR publish_link.expires_at > CURRENT_TIMESTAMP
        )
        LIMIT 1
      `, [input.slug]);
      const link = first_row(link_result);

      if (!link || !asset_referenced_by_snapshot(link.snapshot_json, input.capture_asset_id)) {
        return null;
      }

      const result = await db.query<PublicAssetFileRow>(`
        SELECT
          app_file.storage_provider,
          app_file.storage_key,
          app_file.mime_type
        FROM capture_schema.capture_asset capture_asset
        INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
        WHERE capture_asset.id = $1
        AND capture_asset.organization_id = $2
        AND capture_asset.project_id = $3
        AND app_file.organization_id = $2
        AND app_file.is_deleted = FALSE
        LIMIT 1
      `, [
        input.capture_asset_id,
        link.organization_id,
        link.project_id,
      ]);
      const row = first_row(result);

      if (!row) {
        return null;
      }

      return {
        file: {
          storage_provider: row.storage_provider,
          storage_key: row.storage_key,
          mime_type: row.mime_type,
        },
      } satisfies PublicAssetFile;
    },
  };
};

export const build_publish_repository = (pool: TransactionCapable): PublishRepository => ({
  ...build_transactional_repository(pool),

  async transaction(work) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await work(build_transactional_repository(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
});
