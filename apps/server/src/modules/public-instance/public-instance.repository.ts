type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(sql: string, values?: unknown[]) => Promise<QueryResult<Row>>;
};

export const build_public_instance_repository = (db: Queryable) => ({
  async owner_exists() {
    const result = await db.query<{ exists: boolean }>(`
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
});
