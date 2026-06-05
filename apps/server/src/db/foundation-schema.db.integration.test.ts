import { afterAll, describe, expect, it } from "vitest";
import { pool } from "../config/database.config";

const schema_exists = async (schema_name: string) => {
  const result = await pool.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.schemata
      WHERE schema_name = $1
    ) AS exists
  `, [schema_name]);

  return Boolean(result.rows[0]?.exists);
};

const table_exists = async (schema_name: string, table_name: string) => {
  const result = await pool.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_name = $2
    ) AS exists
  `, [schema_name, table_name]);

  return Boolean(result.rows[0]?.exists);
};

const column_exists = async (schema_name: string, table_name: string, column_name: string) => {
  const result = await pool.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
      AND column_name = $3
    ) AS exists
  `, [schema_name, table_name, column_name]);

  return Boolean(result.rows[0]?.exists);
};

const index_exists = async (schema_name: string, index_name: string) => {
  const result = await pool.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = $1
      AND indexname = $2
    ) AS exists
  `, [schema_name, index_name]);

  return Boolean(result.rows[0]?.exists);
};

const table_comment = async (schema_name: string, table_name: string) => {
  const result = await pool.query<{ comment: string | null }>(`
    SELECT obj_description(($1 || '.' || $2)::regclass, 'pg_class') AS comment
  `, [schema_name, table_name]);

  return result.rows[0]?.comment ?? null;
};

describe("foundation schema migrations on postgres", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("creates the accepted foundation schemas and tables", async () => {
    await expect(schema_exists("user_schema")).resolves.toBe(true);
    await expect(schema_exists("organization_schema")).resolves.toBe(true);
    await expect(schema_exists("auth_schema")).resolves.toBe(true);
    await expect(schema_exists("project_schema")).resolves.toBe(true);
    await expect(schema_exists("capture_schema")).resolves.toBe(true);

    await expect(table_exists("user_schema", "user")).resolves.toBe(true);
    await expect(table_exists("organization_schema", "organization")).resolves.toBe(true);
    await expect(table_exists("organization_schema", "org_user")).resolves.toBe(true);
    await expect(table_exists("auth_schema", "auth_session")).resolves.toBe(true);
    await expect(table_exists("project_schema", "project")).resolves.toBe(true);
    await expect(table_exists("capture_schema", "capture_session")).resolves.toBe(true);
  });

  it("keeps user identity separate from organization membership", async () => {
    await expect(column_exists("user_schema", "user", "organization_id")).resolves.toBe(false);
    await expect(column_exists("organization_schema", "org_user", "organization_id")).resolves.toBe(true);
    await expect(column_exists("organization_schema", "org_user", "user_id")).resolves.toBe(true);
    await expect(column_exists("organization_schema", "org_user", "role")).resolves.toBe(true);
  });

  it("stores DB-backed sessions and project audit fields with org user context", async () => {
    await expect(column_exists("auth_schema", "auth_session", "token_hash")).resolves.toBe(true);
    await expect(column_exists("auth_schema", "auth_session", "org_user_id")).resolves.toBe(true);
    await expect(column_exists("auth_schema", "auth_session", "jwt_token")).resolves.toBe(false);

    await expect(column_exists("project_schema", "project", "created_by_id")).resolves.toBe(true);
    await expect(column_exists("project_schema", "project", "updated_by_id")).resolves.toBe(true);
    await expect(column_exists("project_schema", "project", "deleted_by_id")).resolves.toBe(true);
  });

  it("creates capture session source material schema", async () => {
    for (const column_name of [
      "organization_id",
      "project_id",
      "name",
      "status",
      "source_type",
      "started_at",
      "completed_at",
      "canceled_at",
      "metadata",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(column_exists("capture_schema", "capture_session", column_name)).resolves.toBe(true);
    }

    await expect(index_exists("capture_schema", "idx_capture_session_project_status")).resolves.toBe(true);
    await expect(index_exists("capture_schema", "idx_capture_session_org_created")).resolves.toBe(true);
    await expect(table_comment("capture_schema", "capture_session")).resolves.toMatch(/source material/i);
  });
});
