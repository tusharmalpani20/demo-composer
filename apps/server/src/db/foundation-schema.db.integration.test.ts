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

describe("foundation schema migrations on postgres", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("creates the accepted foundation schemas and tables", async () => {
    await expect(schema_exists("user_schema")).resolves.toBe(true);
    await expect(schema_exists("organization_schema")).resolves.toBe(true);
    await expect(schema_exists("auth_schema")).resolves.toBe(true);
    await expect(schema_exists("project_schema")).resolves.toBe(true);

    await expect(table_exists("user_schema", "user")).resolves.toBe(true);
    await expect(table_exists("organization_schema", "organization")).resolves.toBe(true);
    await expect(table_exists("organization_schema", "org_user")).resolves.toBe(true);
    await expect(table_exists("auth_schema", "auth_session")).resolves.toBe(true);
    await expect(table_exists("project_schema", "project")).resolves.toBe(true);
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
});
