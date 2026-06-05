import { ulid } from "ulid";
import type {
  Guide,
  GuideBlock,
  GuideDetail,
  GuideRepository,
  GuideSourceEvent,
  GuideSourceEventType,
  GuideStatus,
  GuideStep,
} from "./guide.service";

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
  connect?: () => Promise<TransactionClient>;
};

type GuideRow = {
  id: string;
  organization_id: string;
  project_id: string;
  source_capture_session_id: string | null;
  title: string;
  description: string | null;
  status: GuideStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type GuideBlockRow = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  block_type: GuideBlock["block_type"];
  block_index: number;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type GuideStepRow = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_id: string;
  guide_block_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  title: string;
  body: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type GuideSourceEventRow = {
  id: string;
  event_type: GuideSourceEventType;
  event_index: number;
  capture_asset_id: string | null;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_role: string | null;
  target_text: string | null;
  note: string | null;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const map_guide = (row: GuideRow): Guide => ({
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

const map_step = (row: GuideStepRow): GuideStep => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  guide_id: row.guide_id,
  guide_block_id: row.guide_block_id,
  source_capture_session_id: row.source_capture_session_id,
  source_capture_event_id: row.source_capture_event_id,
  source_capture_asset_id: row.source_capture_asset_id,
  title: row.title,
  body: row.body,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_block = (row: GuideBlockRow, step: GuideStep | null): GuideBlock => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  guide_id: row.guide_id,
  source_capture_session_id: row.source_capture_session_id,
  source_capture_event_id: row.source_capture_event_id,
  source_capture_asset_id: row.source_capture_asset_id,
  block_type: row.block_type,
  block_index: row.block_index,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
  step,
});

const map_source_event = (row: GuideSourceEventRow): GuideSourceEvent => ({
  id: row.id,
  event_type: row.event_type,
  event_index: row.event_index,
  capture_asset_id: row.capture_asset_id,
  page_url: row.page_url,
  page_title: row.page_title,
  target_label: row.target_label,
  target_role: row.target_role,
  target_text: row.target_text,
  note: row.note,
});

const guide_select = `
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

const guide_block_select = `
  id,
  organization_id,
  project_id,
  guide_id,
  source_capture_session_id,
  source_capture_event_id,
  source_capture_asset_id,
  block_type,
  block_index,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const guide_step_select = `
  id,
  organization_id,
  project_id,
  guide_id,
  guide_block_id,
  source_capture_session_id,
  source_capture_event_id,
  source_capture_asset_id,
  title,
  body,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const build_detail_from_rows = (
  guide_row: GuideRow,
  block_rows: GuideBlockRow[],
  step_rows: GuideStepRow[]
): GuideDetail => {
  const steps_by_block_id = new Map(
    step_rows.map((row) => [row.guide_block_id, map_step(row)])
  );

  return {
    guide: map_guide(guide_row),
    guide_blocks: block_rows.map((row) => map_block(row, steps_by_block_id.get(row.id) ?? null)),
  };
};

const with_transaction = async <Result>(
  db: TransactionCapable,
  work: (client: Queryable) => Promise<Result>
) => {
  if (!db.connect) {
    return work(db);
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const build_guide_repository = (db: TransactionCapable): GuideRepository => ({
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
        FROM capture_schema.capture_session capture_session
        INNER JOIN project_schema.project project ON project.id = capture_session.project_id
        WHERE capture_session.id = $1
        AND capture_session.project_id = $2
        AND capture_session.organization_id = $3
        AND capture_session.is_deleted = FALSE
        AND project.is_deleted = FALSE
      ) AS exists
    `, [
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ]);

    return Boolean(result.rows[0]?.exists);
  },

  async list_source_capture_events(input) {
    const values: unknown[] = [
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ];
    const selected_filter = input.selected_capture_event_ids
      ? "AND id = ANY($4::varchar[])"
      : "";

    if (input.selected_capture_event_ids) {
      values.push(input.selected_capture_event_ids);
    }

    const result = await db.query<GuideSourceEventRow>(`
      SELECT
        id,
        event_type,
        event_index,
        capture_asset_id,
        page_url,
        page_title,
        target_label,
        target_role,
        target_text,
        note
      FROM capture_schema.capture_event
      WHERE capture_session_id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      ${selected_filter}
      ORDER BY event_index ASC, created_at ASC, id ASC
    `, values);

    return result.rows.map(map_source_event);
  },

  async list_active_capture_asset_ids(input) {
    if (input.capture_asset_ids.length === 0) {
      return [];
    }

    const result = await db.query<{ id: string }>(`
      SELECT id
      FROM capture_schema.capture_asset
      WHERE id = ANY($1::varchar[])
      AND capture_session_id = $2
      AND project_id = $3
      AND organization_id = $4
      AND is_deleted = FALSE
    `, [
      input.capture_asset_ids,
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ]);

    return result.rows.map((row) => row.id);
  },

  async create_guide_from_capture(input) {
    return with_transaction(db, async (client) => {
      const guide_result = await client.query<GuideRow>(`
        INSERT INTO guide_schema.guide (
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
        RETURNING ${guide_select}
      `, [
        ulid(),
        input.organization_id,
        input.project_id,
        input.capture_session_id,
        input.data.title,
        input.data.description,
        input.actor_org_user_id,
      ]);
      const guide_row = first_row(guide_result);

      if (!guide_row) {
        throw new Error("Failed to create guide");
      }

      const block_rows: GuideBlockRow[] = [];
      const step_rows: GuideStepRow[] = [];

      for (const block of input.data.blocks) {
        const block_result = await client.query<GuideBlockRow>(`
          INSERT INTO guide_schema.guide_block (
            id,
            organization_id,
            project_id,
            guide_id,
            source_capture_session_id,
            source_capture_event_id,
            source_capture_asset_id,
            block_type,
            block_index,
            created_by_id,
            updated_by_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
          RETURNING ${guide_block_select}
        `, [
          ulid(),
          input.organization_id,
          input.project_id,
          guide_row.id,
          input.capture_session_id,
          block.source_capture_event_id,
          block.source_capture_asset_id,
          block.block_type,
          block.block_index,
          input.actor_org_user_id,
        ]);
        const block_row = first_row(block_result);

        if (!block_row) {
          throw new Error("Failed to create guide block");
        }

        const step_result = await client.query<GuideStepRow>(`
          INSERT INTO guide_schema.guide_step (
            id,
            organization_id,
            project_id,
            guide_id,
            guide_block_id,
            source_capture_session_id,
            source_capture_event_id,
            source_capture_asset_id,
            title,
            body,
            created_by_id,
            updated_by_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
          RETURNING ${guide_step_select}
        `, [
          ulid(),
          input.organization_id,
          input.project_id,
          guide_row.id,
          block_row.id,
          input.capture_session_id,
          block.source_capture_event_id,
          block.source_capture_asset_id,
          block.step.title,
          block.step.body,
          input.actor_org_user_id,
        ]);
        const step_row = first_row(step_result);

        if (!step_row) {
          throw new Error("Failed to create guide step");
        }

        block_rows.push(block_row);
        step_rows.push(step_row);
      }

      return build_detail_from_rows(guide_row, block_rows, step_rows);
    });
  },

  async list_guides(input) {
    const result = await db.query<GuideRow>(`
      SELECT ${guide_select}
      FROM guide_schema.guide
      WHERE project_id = $1
      AND organization_id = $2
      AND is_deleted = FALSE
      ORDER BY created_at DESC, id DESC
    `, [
      input.project_id,
      input.organization_id,
    ]);

    return result.rows.map(map_guide);
  },

  async find_guide_detail(input) {
    const guide_result = await db.query<GuideRow>(`
      SELECT ${guide_select}
      FROM guide_schema.guide
      WHERE id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      LIMIT 1
    `, [
      input.guide_id,
      input.project_id,
      input.organization_id,
    ]);
    const guide_row = first_row(guide_result);

    if (!guide_row) {
      return null;
    }

    const blocks_result = await db.query<GuideBlockRow>(`
      SELECT ${guide_block_select}
      FROM guide_schema.guide_block
      WHERE guide_id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      ORDER BY block_index ASC, created_at ASC, id ASC
    `, [
      input.guide_id,
      input.project_id,
      input.organization_id,
    ]);

    const steps_result = await db.query<GuideStepRow>(`
      SELECT ${guide_step_select}
      FROM guide_schema.guide_step
      WHERE guide_id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      ORDER BY created_at ASC, id ASC
    `, [
      input.guide_id,
      input.project_id,
      input.organization_id,
    ]);

    return build_detail_from_rows(guide_row, blocks_result.rows, steps_result.rows);
  },
});
