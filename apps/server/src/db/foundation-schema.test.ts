import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrations_dir = new URL("./migrations", import.meta.url);

const read_migrations = () => {
  return readdirSync(migrations_dir)
    .filter((file_name) => file_name.endsWith(".sql"))
    .sort()
    .map((file_name) => readFileSync(join(migrations_dir.pathname, file_name), "utf8"))
    .join("\n");
};

const table_definition = (sql: string, table_name: string) => {
  const escaped_table_name = table_name.replaceAll(".", "\\.");
  const match = sql.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${escaped_table_name} \\(([\\s\\S]*?)\\n\\);`, "i"));
  return match?.[1] ?? "";
};

describe("foundation schema migrations", () => {
  it("define the accepted user organization auth session and project foundation", () => {
    const sql = read_migrations();

    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS user_schema");
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS organization_schema");
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS auth_schema");
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS project_schema");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS user_schema.user");
    expect(table_definition(sql, "user_schema.user")).not.toContain("organization_id");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS organization_schema.organization");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS organization_schema.org_user");
    expect(sql).toContain("role VARCHAR(50) NOT NULL");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS auth_schema.auth_session");
    expect(sql).toContain("org_user_id");
    expect(sql).toContain("token_hash TEXT NOT NULL");
    expect(sql).not.toContain("jwt_token");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS project_schema.project");
    expect(sql).toContain("created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id)");
  });
});
