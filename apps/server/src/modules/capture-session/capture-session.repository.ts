import { ulid } from "ulid";
import {
  type CaptureSession,
  type CaptureSessionRepository,
  type CaptureSessionSourceType,
  type CaptureSessionStatus,
  type NormalizedUpdateCaptureSessionInput,
} from "./capture-session.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(sql: string, values?: unknown[]) => Promise<QueryResult<Row>>;
};

type CaptureSessionRow = {
  id: string;
  organization_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: CaptureSessionStatus;
  source_type: CaptureSessionSourceType;
  started_at: Date | null;
  completed_at: Date | null;
  canceled_at: Date | null;
  start_url: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  user_agent: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const map_capture_session = (row: CaptureSessionRow): CaptureSession => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  name: row.name,
  description: row.description,
  status: row.status,
  source_type: row.source_type,
  started_at: row.started_at?.toISOString() ?? null,
  completed_at: row.completed_at?.toISOString() ?? null,
  canceled_at: row.canceled_at?.toISOString() ?? null,
  start_url: row.start_url,
  browser_name: row.browser_name,
  browser_version: row.browser_version,
  operating_system: row.operating_system,
  viewport_width: row.viewport_width,
  viewport_height: row.viewport_height,
  device_pixel_ratio: row.device_pixel_ratio,
  user_agent: row.user_agent,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const capture_session_select = `
  id,
  organization_id,
  project_id,
  name,
  description,
  status,
  source_type,
  started_at,
  completed_at,
  canceled_at,
  start_url,
  browser_name,
  browser_version,
  operating_system,
  viewport_width,
  viewport_height,
  device_pixel_ratio,
  user_agent,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const update_assignments = (data: NormalizedUpdateCaptureSessionInput) => {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const add_assignment = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (data.name !== undefined) {
    add_assignment("name", data.name);
  }
  if (data.description !== undefined) {
    add_assignment("description", data.description);
  }
  if (data.status !== undefined) {
    add_assignment("status", data.status);
    if (data.status === "capturing") {
      assignments.push("started_at = COALESCE(started_at, CURRENT_TIMESTAMP)");
    }
    if (data.status === "completed") {
      assignments.push("completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)");
    }
    if (data.status === "canceled") {
      assignments.push("canceled_at = COALESCE(canceled_at, CURRENT_TIMESTAMP)");
    }
  }
  if (data.start_url !== undefined) {
    add_assignment("start_url", data.start_url);
  }
  if (data.browser_name !== undefined) {
    add_assignment("browser_name", data.browser_name);
  }
  if (data.browser_version !== undefined) {
    add_assignment("browser_version", data.browser_version);
  }
  if (data.operating_system !== undefined) {
    add_assignment("operating_system", data.operating_system);
  }
  if (data.viewport_width !== undefined) {
    add_assignment("viewport_width", data.viewport_width);
  }
  if (data.viewport_height !== undefined) {
    add_assignment("viewport_height", data.viewport_height);
  }
  if (data.device_pixel_ratio !== undefined) {
    add_assignment("device_pixel_ratio", data.device_pixel_ratio);
  }
  if (data.user_agent !== undefined) {
    add_assignment("user_agent", data.user_agent);
  }
  if (data.metadata !== undefined) {
    add_assignment("metadata", data.metadata);
  }

  return {
    assignments,
    values,
  };
};

export const build_capture_session_repository = (
  db: Queryable
): CaptureSessionRepository => ({
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

  async create_capture_session(input) {
    const result = await db.query<CaptureSessionRow>(`
      INSERT INTO capture_schema.capture_session (
        id,
        organization_id,
        project_id,
        name,
        description,
        source_type,
        start_url,
        browser_name,
        browser_version,
        operating_system,
        viewport_width,
        viewport_height,
        device_pixel_ratio,
        user_agent,
        metadata,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'manual'), $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
      RETURNING ${capture_session_select}
    `, [
      ulid(),
      input.organization_id,
      input.project_id,
      input.data.name,
      input.data.description ?? null,
      input.data.source_type ?? null,
      input.data.start_url ?? null,
      input.data.browser_name ?? null,
      input.data.browser_version ?? null,
      input.data.operating_system ?? null,
      input.data.viewport_width ?? null,
      input.data.viewport_height ?? null,
      input.data.device_pixel_ratio ?? null,
      input.data.user_agent ?? null,
      input.data.metadata ?? null,
      input.actor_org_user_id,
    ]);
    const row = first_row(result);

    if (!row) {
      throw new Error("Failed to create capture session");
    }

    return map_capture_session(row);
  },

  async list_capture_sessions(input) {
    const values: unknown[] = [
      input.project_id,
      input.organization_id,
    ];
    const status_filter = input.status ? "AND status = $3" : "";

    if (input.status) {
      values.push(input.status);
    }

    const result = await db.query<CaptureSessionRow>(`
      SELECT ${capture_session_select}
      FROM capture_schema.capture_session
      WHERE project_id = $1
      AND organization_id = $2
      AND is_deleted = FALSE
      ${status_filter}
      ORDER BY created_at DESC, id DESC
    `, values);

    return result.rows.map(map_capture_session);
  },

  async find_capture_session(input) {
    const result = await db.query<CaptureSessionRow>(`
      SELECT ${capture_session_select}
      FROM capture_schema.capture_session
      WHERE id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      LIMIT 1
    `, [
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ]);
    const row = first_row(result);

    return row ? map_capture_session(row) : null;
  },

  async update_capture_session(input) {
    const update = update_assignments(input.data);
    const values = [
      ...update.values,
      input.actor_org_user_id,
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ];
    const actor_index = update.values.length + 1;
    const capture_session_index = update.values.length + 2;
    const project_index = update.values.length + 3;
    const organization_index = update.values.length + 4;

    const result = await db.query<CaptureSessionRow>(`
      UPDATE capture_schema.capture_session
      SET ${[
        ...update.assignments,
        `updated_by_id = $${actor_index}`,
        "updated_at = CURRENT_TIMESTAMP",
        "version = version + 1",
      ].join(", ")}
      WHERE id = $${capture_session_index}
      AND project_id = $${project_index}
      AND organization_id = $${organization_index}
      AND is_deleted = FALSE
      RETURNING ${capture_session_select}
    `, values);
    const row = first_row(result);

    return row ? map_capture_session(row) : null;
  },

  async complete_capture_session(input) {
    const find_current = async () => {
      const current_result = await db.query<CaptureSessionRow>(`
        SELECT ${capture_session_select}
        FROM capture_schema.capture_session
        WHERE id = $1
        AND project_id = $2
        AND organization_id = $3
        AND is_deleted = FALSE
        LIMIT 1
      `, [
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ]);

      return first_row(current_result);
    };
    const current_row = await find_current();

    if (!current_row) {
      return {
        outcome: "not_found" as const,
        capture_session: null,
      };
    }

    if (current_row.status === "completed") {
      return {
        outcome: "already_completed" as const,
        capture_session: map_capture_session(current_row),
      };
    }

    if (current_row.status === "canceled" || current_row.status === "archived") {
      return {
        outcome: "not_completable" as const,
        capture_session: map_capture_session(current_row),
      };
    }

    const result = await db.query<CaptureSessionRow>(`
      UPDATE capture_schema.capture_session
      SET
        status = 'completed',
        completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND project_id = $3
      AND organization_id = $4
      AND is_deleted = FALSE
      AND status IN ('draft', 'capturing')
      RETURNING ${capture_session_select}
    `, [
      input.actor_org_user_id,
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ]);
    const row = first_row(result);

    if (!row) {
      const refreshed_row = await find_current();

      if (refreshed_row?.status === "completed") {
        return {
          outcome: "already_completed" as const,
          capture_session: map_capture_session(refreshed_row),
        };
      }

      if (refreshed_row?.status === "canceled" || refreshed_row?.status === "archived") {
        return {
          outcome: "not_completable" as const,
          capture_session: map_capture_session(refreshed_row),
        };
      }

      return {
        outcome: "not_found" as const,
        capture_session: null,
      };
    }

    return {
      outcome: "completed" as const,
      capture_session: map_capture_session(row),
    };
  },

  async delete_capture_session(input) {
    const result = await db.query<CaptureSessionRow>(`
      UPDATE capture_schema.capture_session
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND project_id = $3
      AND organization_id = $4
      AND is_deleted = FALSE
      RETURNING ${capture_session_select}
    `, [
      input.actor_org_user_id,
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ]);

    return result.rows.length > 0;
  },
});
