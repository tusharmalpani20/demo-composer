import { ulid } from "ulid";
import type { FirstRunSetupRepository } from "./first-run-setup.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(sql: string, values?: unknown[]) => Promise<QueryResult<Row>>;
};

type SetupUser = {
  id: string;
  email: string;
  password_hash: string;
};

type SetupOrganization = {
  id: string;
  name: string;
};

type SetupOrgUser = {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
};

type SetupSession = {
  id: string;
  user_id: string;
  organization_id: string;
  org_user_id: string;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] as Row;

const build_transactional_repository = (db: Queryable) => ({
  async create_user(input: {
    email: string;
    password_hash: string;
    first_name?: string | null;
    last_name?: string | null;
    display_name: string;
  }) {
    return first_row(await db.query<SetupUser>(`
      INSERT INTO user_schema.user (
        id,
        email,
        password_hash,
        first_name,
        last_name,
        display_name
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, password_hash
    `, [
      ulid(),
      input.email,
      input.password_hash,
      input.first_name ?? null,
      input.last_name ?? null,
      input.display_name,
    ]));
  },

  async create_organization(input: { name: string }) {
    return first_row(await db.query<SetupOrganization>(`
      INSERT INTO organization_schema.organization (
        id,
        name
      )
      VALUES ($1, $2)
      RETURNING id, name
    `, [ulid(), input.name]));
  },

  async create_org_user(input: {
    user_id: string;
    organization_id: string;
    role: "owner";
  }) {
    return first_row(await db.query<SetupOrgUser>(`
      INSERT INTO organization_schema.org_user (
        id,
        user_id,
        organization_id,
        role
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, organization_id, role
    `, [ulid(), input.user_id, input.organization_id, input.role]));
  },

  async create_session(input: {
    user_id: string;
    organization_id: string;
    org_user_id: string;
    token_hash: string;
  }) {
    return first_row(await db.query<SetupSession>(`
      INSERT INTO auth_schema.auth_session (
        id,
        user_id,
        organization_id,
        org_user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP + interval '30 days')
      RETURNING id, user_id, organization_id, org_user_id
    `, [
      ulid(),
      input.user_id,
      input.organization_id,
      input.org_user_id,
      input.token_hash,
    ]));
  },
});

export const build_first_run_setup_repository = (
  pool: Queryable & {
    connect: () => Promise<Queryable & { release: () => void }>;
  }
): FirstRunSetupRepository => ({
  ...build_transactional_repository(pool),

  async owner_exists() {
    const result = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM organization_schema.org_user
        WHERE role = 'owner'
        AND status = 'active'
        AND is_deleted = FALSE
      ) AS exists
    `);

    return Boolean(result.rows[0]?.exists);
  },

  async transaction(callback) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(build_transactional_repository(client));
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
