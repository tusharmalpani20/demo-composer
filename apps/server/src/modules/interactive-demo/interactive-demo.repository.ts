import { ulid } from "ulid";
import {
  type DemoScene,
  type InteractiveDemo,
  type InteractiveDemoRepository,
  type InteractiveDemoStatus,
  type NormalizedUpdateDemoSceneInput,
  type NormalizedUpdateInteractiveDemoInput,
} from "./interactive-demo.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(sql: string, values?: unknown[]) => Promise<QueryResult<Row>>;
};

type InteractiveDemoRow = {
  id: string;
  organization_id: string;
  project_id: string;
  source_capture_session_id: string | null;
  title: string;
  description: string | null;
  status: InteractiveDemoStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type DemoSceneRow = {
  id: string;
  organization_id: string;
  project_id: string;
  interactive_demo_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  scene_index: number;
  title: string | null;
  description: string | null;
  background_capture_asset_id: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const map_interactive_demo = (row: InteractiveDemoRow): InteractiveDemo => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  source_capture_session_id: row.source_capture_session_id,
  title: row.title,
  description: row.description,
  status: row.status,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_demo_scene = (row: DemoSceneRow): DemoScene => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  interactive_demo_id: row.interactive_demo_id,
  source_capture_session_id: row.source_capture_session_id,
  source_capture_event_id: row.source_capture_event_id,
  source_capture_asset_id: row.source_capture_asset_id,
  scene_index: row.scene_index,
  title: row.title,
  description: row.description,
  background_capture_asset_id: row.background_capture_asset_id,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const interactive_demo_select = `
  id,
  organization_id,
  project_id,
  source_capture_session_id,
  title,
  description,
  status,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const demo_scene_select = `
  id,
  organization_id,
  project_id,
  interactive_demo_id,
  source_capture_session_id,
  source_capture_event_id,
  source_capture_asset_id,
  scene_index,
  title,
  description,
  background_capture_asset_id,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const update_demo_assignments = (data: NormalizedUpdateInteractiveDemoInput) => {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const add_assignment = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (data.title !== undefined) {
    add_assignment("title", data.title);
  }
  if (data.description !== undefined) {
    add_assignment("description", data.description);
  }
  if (data.status !== undefined) {
    add_assignment("status", data.status);
  }

  return { assignments, values };
};

const update_scene_assignments = (data: NormalizedUpdateDemoSceneInput) => {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const add_assignment = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (data.title !== undefined) {
    add_assignment("title", data.title);
  }
  if (data.description !== undefined) {
    add_assignment("description", data.description);
  }
  if (data.background_capture_asset_id !== undefined) {
    add_assignment("background_capture_asset_id", data.background_capture_asset_id);
  }

  return { assignments, values };
};

export const build_interactive_demo_repository = (db: Queryable): InteractiveDemoRepository => ({
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

  async create_demo(input) {
    const result = await db.query<InteractiveDemoRow>(`
      INSERT INTO interactive_demo_schema.interactive_demo (
        id,
        organization_id,
        project_id,
        source_capture_session_id,
        title,
        description,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING ${interactive_demo_select}
    `, [
      ulid(),
      input.organization_id,
      input.project_id,
      input.data.source_capture_session_id,
      input.data.title,
      input.data.description,
      input.actor_org_user_id,
    ]);
    const row = first_row(result);

    if (!row) {
      throw new Error("Failed to create interactive demo");
    }

    return map_interactive_demo(row);
  },

  async list_demos(input) {
    const result = await db.query<InteractiveDemoRow>(`
      SELECT ${interactive_demo_select}
      FROM interactive_demo_schema.interactive_demo
      WHERE organization_id = $1
      AND project_id = $2
      AND is_deleted = FALSE
      ORDER BY created_at DESC, id DESC
    `, [input.organization_id, input.project_id]);

    return result.rows.map(map_interactive_demo);
  },

  async find_demo(input) {
    const result = await db.query<InteractiveDemoRow>(`
      SELECT ${interactive_demo_select}
      FROM interactive_demo_schema.interactive_demo
      WHERE id = $1
      AND organization_id = $2
      AND project_id = $3
      AND is_deleted = FALSE
      LIMIT 1
    `, [input.interactive_demo_id, input.organization_id, input.project_id]);
    const row = first_row(result);

    return row ? map_interactive_demo(row) : null;
  },

  async update_demo(input) {
    const update = update_demo_assignments(input.data);
    const values = [
      ...update.values,
      input.actor_org_user_id,
      input.interactive_demo_id,
      input.organization_id,
      input.project_id,
    ];
    const actor_index = update.values.length + 1;
    const demo_index = update.values.length + 2;
    const organization_index = update.values.length + 3;
    const project_index = update.values.length + 4;
    const result = await db.query<InteractiveDemoRow>(`
      UPDATE interactive_demo_schema.interactive_demo
      SET ${[
        ...update.assignments,
        `updated_by_id = $${actor_index}`,
        "updated_at = CURRENT_TIMESTAMP",
        "version = version + 1",
      ].join(", ")}
      WHERE id = $${demo_index}
      AND organization_id = $${organization_index}
      AND project_id = $${project_index}
      AND is_deleted = FALSE
      RETURNING ${interactive_demo_select}
    `, values);
    const row = first_row(result);

    return row ? map_interactive_demo(row) : null;
  },

  async delete_demo(input) {
    const result = await db.query<InteractiveDemoRow>(`
      UPDATE interactive_demo_schema.interactive_demo
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND organization_id = $3
      AND project_id = $4
      AND is_deleted = FALSE
      RETURNING ${interactive_demo_select}
    `, [
      input.actor_org_user_id,
      input.interactive_demo_id,
      input.organization_id,
      input.project_id,
    ]);

    return result.rows.length > 0;
  },

  async background_asset_exists(input) {
    const result = await db.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM capture_schema.capture_asset
        WHERE id = $1
        AND organization_id = $2
        AND project_id = $3
        AND asset_type = 'screenshot'
        AND is_deleted = FALSE
      ) AS exists
    `, [input.capture_asset_id, input.organization_id, input.project_id]);

    return Boolean(result.rows[0]?.exists);
  },

  async create_scene(input) {
    const index_result = await db.query<{ next_index: number }>(`
      SELECT COALESCE(MAX(scene_index), 0) + 1 AS next_index
      FROM interactive_demo_schema.demo_scene
      WHERE organization_id = $1
      AND project_id = $2
      AND interactive_demo_id = $3
      AND is_deleted = FALSE
    `, [input.organization_id, input.project_id, input.interactive_demo_id]);
    const next_index = Number(index_result.rows[0]?.next_index ?? 1);
    const result = await db.query<DemoSceneRow>(`
      INSERT INTO interactive_demo_schema.demo_scene (
        id,
        organization_id,
        project_id,
        interactive_demo_id,
        source_capture_session_id,
        source_capture_event_id,
        source_capture_asset_id,
        scene_index,
        title,
        description,
        background_capture_asset_id,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      RETURNING ${demo_scene_select}
    `, [
      ulid(),
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
      input.data.source_capture_session_id,
      input.data.source_capture_event_id,
      input.data.source_capture_asset_id,
      next_index,
      input.data.title,
      input.data.description,
      input.data.background_capture_asset_id,
      input.actor_org_user_id,
    ]);
    const row = first_row(result);

    if (!row) {
      throw new Error("Failed to create demo scene");
    }

    return map_demo_scene(row);
  },

  async list_scenes(input) {
    const result = await db.query<DemoSceneRow>(`
      SELECT ${demo_scene_select}
      FROM interactive_demo_schema.demo_scene
      WHERE organization_id = $1
      AND project_id = $2
      AND interactive_demo_id = $3
      AND is_deleted = FALSE
      ORDER BY scene_index ASC, id ASC
    `, [input.organization_id, input.project_id, input.interactive_demo_id]);

    return result.rows.map(map_demo_scene);
  },

  async update_scene(input) {
    const update = update_scene_assignments(input.data);
    const values = [
      ...update.values,
      input.actor_org_user_id,
      input.demo_scene_id,
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
    ];
    const actor_index = update.values.length + 1;
    const scene_index = update.values.length + 2;
    const organization_index = update.values.length + 3;
    const project_index = update.values.length + 4;
    const demo_index = update.values.length + 5;
    const result = await db.query<DemoSceneRow>(`
      UPDATE interactive_demo_schema.demo_scene
      SET ${[
        ...update.assignments,
        `updated_by_id = $${actor_index}`,
        "updated_at = CURRENT_TIMESTAMP",
        "version = version + 1",
      ].join(", ")}
      WHERE id = $${scene_index}
      AND organization_id = $${organization_index}
      AND project_id = $${project_index}
      AND interactive_demo_id = $${demo_index}
      AND is_deleted = FALSE
      RETURNING ${demo_scene_select}
    `, values);
    const row = first_row(result);

    return row ? map_demo_scene(row) : null;
  },

  async reorder_scenes(input) {
    const rows: DemoScene[] = [];

    await db.query("BEGIN");
    try {
      const scene_count = await db.query<{
        active_scene_count: string;
        matching_scene_count: string;
      }>(`
        SELECT
          COUNT(*)::text AS active_scene_count,
          COUNT(*) FILTER (WHERE id = ANY($4::varchar[]))::text AS matching_scene_count
        FROM interactive_demo_schema.demo_scene
        WHERE organization_id = $1
        AND project_id = $2
        AND interactive_demo_id = $3
        AND is_deleted = FALSE
      `, [
        input.organization_id,
        input.project_id,
        input.interactive_demo_id,
        input.scene_ids,
      ]);
      const active_scene_count = Number(scene_count.rows[0]?.active_scene_count ?? 0);
      const matching_scene_count = Number(scene_count.rows[0]?.matching_scene_count ?? 0);

      if (
        active_scene_count !== input.scene_ids.length ||
        matching_scene_count !== input.scene_ids.length
      ) {
        await db.query("ROLLBACK");
        return [];
      }

      await db.query(`
        UPDATE interactive_demo_schema.demo_scene
        SET scene_index = scene_index + 1000000
        WHERE organization_id = $1
        AND project_id = $2
        AND interactive_demo_id = $3
        AND is_deleted = FALSE
      `, [
        input.organization_id,
        input.project_id,
        input.interactive_demo_id,
      ]);

      for (const [index, scene_id] of input.scene_ids.entries()) {
        const result = await db.query<DemoSceneRow>(`
          UPDATE interactive_demo_schema.demo_scene
          SET
            scene_index = $1,
            updated_by_id = $2,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
          WHERE id = $3
          AND organization_id = $4
          AND project_id = $5
          AND interactive_demo_id = $6
          AND is_deleted = FALSE
          RETURNING ${demo_scene_select}
        `, [
          index + 1,
          input.actor_org_user_id,
          scene_id,
          input.organization_id,
          input.project_id,
          input.interactive_demo_id,
        ]);
        const row = first_row(result);

        if (!row) {
          await db.query("ROLLBACK");
          return [];
        }

        rows.push(map_demo_scene(row));
      }

      await db.query("COMMIT");
      return rows;
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  },

  async delete_scene(input) {
    const result = await db.query<DemoSceneRow>(`
      UPDATE interactive_demo_schema.demo_scene
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND organization_id = $3
      AND project_id = $4
      AND interactive_demo_id = $5
      AND is_deleted = FALSE
      RETURNING ${demo_scene_select}
    `, [
      input.actor_org_user_id,
      input.demo_scene_id,
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
    ]);

    return result.rows.length > 0;
  },
});
