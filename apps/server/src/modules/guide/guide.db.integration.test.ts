import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";

const reset_foundation_tables = async () => {
  await pool.query(`
    TRUNCATE TABLE
      auth_schema.auth_session,
      guide_schema.guide_step,
      guide_schema.guide_block,
      guide_schema.guide,
      capture_schema.capture_event,
      capture_schema.capture_asset,
      file_schema.file,
      capture_schema.capture_session,
      project_schema.project,
      organization_schema.org_user,
      organization_schema.organization,
      user_schema.user
    RESTART IDENTITY CASCADE
  `);
};

const setup_owner = async () => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/setup/first-run",
    payload: {
      owner: {
        email: "owner@example.com",
        password: "safe local password",
        first_name: "Owner",
        last_name: "User",
      },
      organization: {
        name: "Acme",
      },
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.cookies.find((cookie) => cookie.name === "demo_composer_session")?.value ?? "";
};

const create_project = async (session_token: string) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: { demo_composer_session: session_token },
    payload: { name: "Onboarding Demo" },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().project.id as string;
};

const create_capture_session = async (session_token: string, project_id: string) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions`,
    cookies: { demo_composer_session: session_token },
    payload: {
      name: "Create department workflow",
      source_type: "extension",
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().capture_session.id as string;
};

const create_capture_asset = async (
  session_token: string,
  project_id: string,
  capture_session_id: string
) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets`,
    cookies: { demo_composer_session: session_token },
    payload: {
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      file: {
        storage_key: `captures/${capture_session_id}/screenshot-${Date.now()}.png`,
        mime_type: "image/png",
        size_bytes: 123456,
      },
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().capture_asset.id as string;
};

const create_capture_event = async (
  session_token: string,
  project_id: string,
  capture_session_id: string,
  payload: Record<string, unknown>
) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
    cookies: { demo_composer_session: session_token },
    payload,
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().capture_event.id as string;
};

describe("DB-backed guide API", () => {
  beforeEach(async () => {
    await reset_foundation_tables();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates lists and reads an editable draft guide from selected capture events", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token);
    const capture_session_id = await create_capture_session(session_token, project_id);
    const active_asset_id = await create_capture_asset(session_token, project_id, capture_session_id);
    const deleted_asset_id = await create_capture_asset(session_token, project_id, capture_session_id);

    const note_event_id = await create_capture_event(session_token, project_id, capture_session_id, {
      event_type: "note",
      event_index: 1,
      note: "Start from department list",
    });
    const click_event_id = await create_capture_event(session_token, project_id, capture_session_id, {
      event_type: "click",
      event_index: 2,
      capture_asset_id: deleted_asset_id,
      page_title: "Department",
      target_label: "Add Department",
      target_selector: "button[data-testid='add-department']",
    });
    const input_event_id = await create_capture_event(session_token, project_id, capture_session_id, {
      event_type: "input",
      event_index: 3,
      capture_asset_id: active_asset_id,
      page_title: "New Department",
      target_label: "Department Name",
      input_intent: "typed a redacted department name",
    });

    await pool.query(`
      UPDATE capture_schema.capture_asset
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [deleted_asset_id]);

    const app = build({ logger: false });
    const create_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Department setup guide",
        selected_capture_event_ids: [input_event_id, note_event_id, click_event_id],
      },
    });

    expect(create_response.statusCode).toBe(201);
    const created_body = create_response.json();
    expect(created_body.guide).toMatchObject({
      project_id,
      source_capture_session_id: capture_session_id,
      title: "Department setup guide",
      status: "draft",
    });
    expect(created_body.guide_blocks.map((block: { block_index: number }) => block.block_index)).toEqual([1, 2, 3]);
    expect(created_body.guide_blocks.map((block: { step: { title: string } }) => block.step.title)).toEqual([
      "Start from department list",
      "Click \"Add Department\"",
      "Enter the required value in \"Department Name\"",
    ]);
    expect(created_body.guide_blocks[0].source_capture_event_id).toBe(note_event_id);
    expect(created_body.guide_blocks[1].source_capture_asset_id).toBeNull();
    expect(created_body.guide_blocks[2].source_capture_asset_id).toBe(active_asset_id);
    expect(JSON.stringify(created_body)).not.toContain("target_selector");
    expect(JSON.stringify(created_body)).not.toContain("input_intent");
    expect(JSON.stringify(created_body)).not.toContain("storage_key");
    expect(JSON.stringify(created_body)).not.toContain("is_deleted");

    const guide_id = created_body.guide.id as string;
    const list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides`,
      cookies: { demo_composer_session: session_token },
    });
    const get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}`,
      cookies: { demo_composer_session: session_token },
    });
    const missing_event_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Missing event guide",
        selected_capture_event_ids: ["missing_event"],
      },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json().guides).toHaveLength(1);
    expect(list_response.json().guides[0].id).toBe(guide_id);
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json().guide.id).toBe(guide_id);
    expect(get_response.json().guide_blocks).toHaveLength(3);
    expect(missing_event_response.statusCode).toBe(404);
    expect(missing_event_response.json().error.type).toBe("capture_event_not_found");

    const capture_counts = await pool.query<{ count: string }>(`
      SELECT COUNT(*) AS count
      FROM capture_schema.capture_event
      WHERE capture_session_id = $1
      AND is_deleted = FALSE
    `, [capture_session_id]);
    expect(capture_counts.rows[0]?.count).toBe("3");

    await app.close();
  });
});
