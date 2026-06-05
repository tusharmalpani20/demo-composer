import { ulid } from "ulid";
import {
  type CaptureEvent,
  CaptureEventIndexConflictError,
  type CaptureEventRepository,
  type CaptureEventType,
} from "./capture-event.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(sql: string, values?: unknown[]) => Promise<QueryResult<Row>>;
};

type CaptureEventRow = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  capture_asset_id: string | null;
  event_type: CaptureEventType;
  event_index: number;
  occurred_at: Date;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_selector: string | null;
  target_role: string | null;
  target_test_id: string | null;
  target_text: string | null;
  client_x: number | null;
  client_y: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  input_intent: string | null;
  input_value_redacted: true;
  note: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const map_capture_event = (row: CaptureEventRow): CaptureEvent => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  capture_session_id: row.capture_session_id,
  capture_asset_id: row.capture_asset_id,
  event_type: row.event_type,
  event_index: row.event_index,
  occurred_at: row.occurred_at.toISOString(),
  page_url: row.page_url,
  page_title: row.page_title,
  target_label: row.target_label,
  target_selector: row.target_selector,
  target_role: row.target_role,
  target_test_id: row.target_test_id,
  target_text: row.target_text,
  client_x: row.client_x,
  client_y: row.client_y,
  viewport_width: row.viewport_width,
  viewport_height: row.viewport_height,
  device_pixel_ratio: row.device_pixel_ratio,
  input_intent: row.input_intent,
  input_value_redacted: row.input_value_redacted,
  note: row.note,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const capture_event_select = `
  id,
  organization_id,
  project_id,
  capture_session_id,
  capture_asset_id,
  event_type,
  event_index,
  occurred_at,
  page_url,
  page_title,
  target_label,
  target_selector,
  target_role,
  target_test_id,
  target_text,
  client_x,
  client_y,
  viewport_width,
  viewport_height,
  device_pixel_ratio,
  input_intent,
  input_value_redacted,
  note,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const is_event_index_conflict = (error: unknown) => {
  const pg_error = error as { code?: string; constraint?: string };
  return pg_error.code === "23505"
    && pg_error.constraint === "uq_capture_event_session_index_active";
};

export const build_capture_event_repository = (db: Queryable): CaptureEventRepository => ({
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

  async capture_session_exists(input) {
    const result = await db.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM capture_schema.capture_session
        WHERE id = $1
        AND project_id = $2
        AND organization_id = $3
        AND is_deleted = FALSE
      ) AS exists
    `, [
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ]);

    return Boolean(result.rows[0]?.exists);
  },

  async capture_asset_exists(input) {
    const result = await db.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM capture_schema.capture_asset
        WHERE id = $1
        AND capture_session_id = $2
        AND project_id = $3
        AND organization_id = $4
        AND is_deleted = FALSE
      ) AS exists
    `, [
      input.capture_asset_id,
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ]);

    return Boolean(result.rows[0]?.exists);
  },

  async create_capture_event(input) {
    try {
      const result = await db.query<CaptureEventRow>(`
        INSERT INTO capture_schema.capture_event (
          id,
          organization_id,
          project_id,
          capture_session_id,
          capture_asset_id,
          event_type,
          event_index,
          occurred_at,
          page_url,
          page_title,
          target_label,
          target_selector,
          target_role,
          target_test_id,
          target_text,
          client_x,
          client_y,
          viewport_width,
          viewport_height,
          device_pixel_ratio,
          input_intent,
          input_value_redacted,
          note,
          metadata,
          created_by_id,
          updated_by_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, CURRENT_TIMESTAMP),
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, TRUE, $22, $23, $24, $24
        )
        RETURNING ${capture_event_select}
      `, [
        ulid(),
        input.organization_id,
        input.project_id,
        input.capture_session_id,
        input.data.capture_asset_id ?? null,
        input.data.event_type,
        input.data.event_index,
        input.data.occurred_at ?? null,
        input.data.page_url ?? null,
        input.data.page_title ?? null,
        input.data.target_label ?? null,
        input.data.target_selector ?? null,
        input.data.target_role ?? null,
        input.data.target_test_id ?? null,
        input.data.target_text ?? null,
        input.data.client_x ?? null,
        input.data.client_y ?? null,
        input.data.viewport_width ?? null,
        input.data.viewport_height ?? null,
        input.data.device_pixel_ratio ?? null,
        input.data.input_intent ?? null,
        input.data.note ?? null,
        input.data.metadata ?? null,
        input.actor_org_user_id,
      ]);
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to create capture event");
      }

      return map_capture_event(row);
    } catch (error) {
      if (is_event_index_conflict(error)) {
        throw new CaptureEventIndexConflictError();
      }

      throw error;
    }
  },

  async list_capture_events(input) {
    const values: unknown[] = [
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ];
    const event_type_filter = input.event_type ? "AND event_type = $4" : "";

    if (input.event_type) {
      values.push(input.event_type);
    }

    const result = await db.query<CaptureEventRow>(`
      SELECT ${capture_event_select}
      FROM capture_schema.capture_event
      WHERE capture_session_id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      ${event_type_filter}
      ORDER BY event_index ASC, created_at ASC, id ASC
    `, values);

    return result.rows.map(map_capture_event);
  },

  async find_capture_event(input) {
    const result = await db.query<CaptureEventRow>(`
      SELECT ${capture_event_select}
      FROM capture_schema.capture_event
      WHERE id = $1
      AND capture_session_id = $2
      AND project_id = $3
      AND organization_id = $4
      AND is_deleted = FALSE
      LIMIT 1
    `, [
      input.capture_event_id,
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ]);
    const row = first_row(result);

    return row ? map_capture_event(row) : null;
  },

  async delete_capture_event(input) {
    const result = await db.query<CaptureEventRow>(`
      UPDATE capture_schema.capture_event
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND capture_session_id = $3
      AND project_id = $4
      AND organization_id = $5
      AND is_deleted = FALSE
      RETURNING ${capture_event_select}
    `, [
      input.actor_org_user_id,
      input.capture_event_id,
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ]);

    return result.rows.length > 0;
  },
});
