import { ulid } from "ulid";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";

const reset_foundation_tables = async () => {
  await pool.query(`
    TRUNCATE TABLE
      auth_schema.auth_session,
      interactive_demo_schema.demo_scene,
      interactive_demo_schema.interactive_demo,
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
  const session_cookie = response.cookies.find((cookie) => cookie.name === "demo_composer_session");
  expect(session_cookie?.value).toEqual(expect.any(String));
  return session_cookie?.value ?? "";
};

const create_project = async (session_token: string) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: {
      demo_composer_session: session_token,
    },
    payload: {
      name: "Interactive Demo Project",
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().project.id as string;
};

const get_owner_context = async () => {
  const owner_context = await pool.query<{
    organization_id: string;
    org_user_id: string;
  }>(`
    SELECT org_user.organization_id, org_user.id AS org_user_id
    FROM organization_schema.org_user org_user
    INNER JOIN user_schema.user app_user ON app_user.id = org_user.user_id
    WHERE app_user.email = 'owner@example.com'
  `);

  const row = owner_context.rows[0];
  expect(row).toBeDefined();
  return row;
};

const insert_screenshot_asset = async (input: {
  organization_id: string;
  org_user_id: string;
  project_id: string;
}) => {
  const capture_session_id = ulid();
  const file_id = ulid();
  const capture_asset_id = ulid();

  await pool.query(`
    INSERT INTO capture_schema.capture_session (
      id,
      organization_id,
      project_id,
      name,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, $3, 'Demo source capture', $4, $4)
  `, [capture_session_id, input.organization_id, input.project_id, input.org_user_id]);
  await pool.query(`
    INSERT INTO file_schema.file (
      id,
      organization_id,
      storage_provider,
      storage_key,
      mime_type,
      size_bytes,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, 'local', $3, 'image/png', 100, $4, $4)
  `, [file_id, input.organization_id, `interactive-demo/${file_id}.png`, input.org_user_id]);
  await pool.query(`
    INSERT INTO capture_schema.capture_asset (
      id,
      organization_id,
      project_id,
      capture_session_id,
      file_id,
      asset_type,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, $3, $4, $5, 'screenshot', $6, $6)
  `, [capture_asset_id, input.organization_id, input.project_id, capture_session_id, file_id, input.org_user_id]);

  return capture_asset_id;
};

const insert_capture_source_material = async (input: {
  organization_id: string;
  org_user_id: string;
  project_id: string;
}) => {
  const capture_session_id = ulid();
  const first_file_id = ulid();
  const second_file_id = ulid();
  const first_asset_id = ulid();
  const second_asset_id = ulid();
  const note_event_id = ulid();
  const click_event_id = ulid();
  const capture_event_id = ulid();

  await pool.query(`
    INSERT INTO capture_schema.capture_session (
      id,
      organization_id,
      project_id,
      name,
      description,
      status,
      source_type,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, $3, 'Department setup', 'Create departments in ERP', 'completed', 'extension', $4, $4)
  `, [capture_session_id, input.organization_id, input.project_id, input.org_user_id]);
  await pool.query(`
    INSERT INTO file_schema.file (
      id,
      organization_id,
      storage_provider,
      storage_key,
      mime_type,
      size_bytes,
      created_by_id,
      updated_by_id
    )
    VALUES
      ($1, $3, 'local', $4, 'image/png', 100, $2, $2),
      ($5, $3, 'local', $6, 'image/png', 100, $2, $2)
  `, [
    first_file_id,
    input.org_user_id,
    input.organization_id,
    `interactive-demo/${first_file_id}.png`,
    second_file_id,
    `interactive-demo/${second_file_id}.png`,
  ]);
  await pool.query(`
    INSERT INTO capture_schema.capture_asset (
      id,
      organization_id,
      project_id,
      capture_session_id,
      file_id,
      asset_type,
      page_title,
      created_by_id,
      updated_by_id
    )
    VALUES
      ($1, $2, $3, $4, $5, 'screenshot', 'Department List', $7, $7),
      ($6, $2, $3, $4, $8, 'screenshot', 'New Department', $7, $7)
  `, [
    first_asset_id,
    input.organization_id,
    input.project_id,
    capture_session_id,
    first_file_id,
    second_asset_id,
    input.org_user_id,
    second_file_id,
  ]);
  await pool.query(`
    INSERT INTO capture_schema.capture_event (
      id,
      organization_id,
      project_id,
      capture_session_id,
      capture_asset_id,
      event_type,
      event_index,
      page_title,
      target_text,
      note,
      input_value_redacted,
      created_by_id,
      updated_by_id
    )
    VALUES
      ($1, $4, $5, $6, NULL, 'note', 1, NULL, NULL, 'Skipped note', TRUE, $7, $7),
      ($2, $4, $5, $6, $8, 'click', 2, 'Department List', 'Add Department', NULL, TRUE, $7, $7),
      ($3, $4, $5, $6, $9, 'capture', 3, 'New Department', NULL, NULL, TRUE, $7, $7)
  `, [
    note_event_id,
    click_event_id,
    capture_event_id,
    input.organization_id,
    input.project_id,
    capture_session_id,
    input.org_user_id,
    first_asset_id,
    second_asset_id,
  ]);

  return {
    capture_session_id,
    first_asset_id,
    second_asset_id,
    click_event_id,
    capture_event_id,
  };
};

describe("DB-backed interactive demo API", () => {
  beforeEach(async () => {
    await reset_foundation_tables();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates lists gets updates archives demos and manages ordered scenes", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token);
    const owner_context = await get_owner_context();
    const capture_asset_id = await insert_screenshot_asset({
      organization_id: owner_context?.organization_id ?? "",
      org_user_id: owner_context?.org_user_id ?? "",
      project_id,
    });
    const app = build({ logger: false });

    const create_demo_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Product Tour",
        description: "Internal walkthrough",
        organization_id: "attacker_org",
      },
    });

    expect(create_demo_response.statusCode).toBe(201);
    expect(create_demo_response.json().interactive_demo).toMatchObject({
      organization_id: owner_context?.organization_id,
      project_id,
      title: "Product Tour",
      description: "Internal walkthrough",
      status: "draft",
      version: 1,
    });
    expect(JSON.stringify(create_demo_response.json())).not.toContain("is_deleted");
    const interactive_demo_id = create_demo_response.json().interactive_demo.id as string;

    const first_scene_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/scenes`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Welcome",
        background_capture_asset_id: capture_asset_id,
      },
    });
    const second_scene_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/scenes`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Dashboard",
        background_capture_asset_id: capture_asset_id,
      },
    });

    expect(first_scene_response.statusCode).toBe(201);
    expect(first_scene_response.json().demo_scene).toMatchObject({
      scene_index: 1,
      title: "Welcome",
      background_capture_asset_id: capture_asset_id,
    });
    expect(second_scene_response.statusCode).toBe(201);
    expect(second_scene_response.json().demo_scene.scene_index).toBe(2);
    const first_scene_id = first_scene_response.json().demo_scene.id as string;
    const second_scene_id = second_scene_response.json().demo_scene.id as string;

    const partial_reorder_response = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/scenes/order`,
      cookies: { demo_composer_session: session_token },
      payload: {
        scene_ids: [second_scene_id],
      },
    });
    const reorder_response = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/scenes/order`,
      cookies: { demo_composer_session: session_token },
      payload: {
        scene_ids: [second_scene_id, first_scene_id],
      },
    });
    const update_demo_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Updated Tour",
        description: "",
        status: "archived",
      },
    });
    const list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/interactive-demos`,
      cookies: { demo_composer_session: session_token },
    });
    const scenes_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/scenes`,
      cookies: { demo_composer_session: session_token },
    });

    expect(partial_reorder_response.statusCode).toBe(400);
    expect(partial_reorder_response.json().error.type).toBe("invalid_demo_scene_order");
    expect(reorder_response.statusCode).toBe(200);
    expect(reorder_response.json().demo_scenes.map((scene: { id: string; scene_index: number }) => ({
      id: scene.id,
      scene_index: scene.scene_index,
    }))).toEqual([
      { id: second_scene_id, scene_index: 1 },
      { id: first_scene_id, scene_index: 2 },
    ]);
    expect(update_demo_response.statusCode).toBe(200);
    expect(update_demo_response.json().interactive_demo).toMatchObject({
      title: "Updated Tour",
      description: null,
      status: "archived",
      version: 2,
    });
    expect(list_response.json().interactive_demos).toHaveLength(1);
    expect(scenes_response.json().demo_scenes.map((scene: { id: string }) => scene.id)).toEqual([
      second_scene_id,
      first_scene_id,
    ]);

    const delete_scene_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/scenes/${first_scene_id}`,
      cookies: { demo_composer_session: session_token },
    });
    const delete_demo_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}`,
      cookies: { demo_composer_session: session_token },
    });
    const get_deleted_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}`,
      cookies: { demo_composer_session: session_token },
    });

    expect(delete_scene_response.statusCode).toBe(204);
    expect(delete_demo_response.statusCode).toBe(204);
    expect(get_deleted_response.statusCode).toBe(404);

    await app.close();
  });

  it("creates interactive demos from screenshot-backed capture events", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token);
    const owner_context = await get_owner_context();
    const source = await insert_capture_source_material({
      organization_id: owner_context?.organization_id ?? "",
      org_user_id: owner_context?.org_user_id ?? "",
      project_id,
    });
    const app = build({ logger: false });

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${source.capture_session_id}/interactive-demos`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Request title should be ignored",
        description: "",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().interactive_demo).toMatchObject({
      project_id,
      source_capture_session_id: source.capture_session_id,
      title: "Department setup",
      description: "Create departments in ERP",
      status: "draft",
    });
    expect(response.json().redirect_path).toBe(
      `/projects/${project_id}/interactive-demos/${response.json().interactive_demo.id}`
    );
    expect(response.json().demo_scenes.map((scene: {
      scene_index: number;
      source_capture_event_id: string | null;
      source_capture_asset_id: string | null;
      background_capture_asset_id: string | null;
      title: string | null;
    }) => ({
      scene_index: scene.scene_index,
      source_capture_event_id: scene.source_capture_event_id,
      source_capture_asset_id: scene.source_capture_asset_id,
      background_capture_asset_id: scene.background_capture_asset_id,
      title: scene.title,
    }))).toEqual([
      {
        scene_index: 1,
        source_capture_event_id: source.click_event_id,
        source_capture_asset_id: source.first_asset_id,
        background_capture_asset_id: source.first_asset_id,
        title: "Click Add Department",
      },
      {
        scene_index: 2,
        source_capture_event_id: source.capture_event_id,
        source_capture_asset_id: source.second_asset_id,
        background_capture_asset_id: source.second_asset_id,
        title: "New Department",
      },
    ]);

    const second_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${source.capture_session_id}/interactive-demos`,
      cookies: { demo_composer_session: session_token },
      payload: {},
    });
    expect(second_response.statusCode).toBe(201);
    expect(second_response.json().interactive_demo.id).not.toBe(response.json().interactive_demo.id);
    expect(second_response.json().demo_scenes.map((scene: {
      id: string;
      interactive_demo_id: string;
      source_capture_event_id: string | null;
      background_capture_asset_id: string | null;
    }) => ({
      id: scene.id,
      interactive_demo_id: scene.interactive_demo_id,
      source_capture_event_id: scene.source_capture_event_id,
      background_capture_asset_id: scene.background_capture_asset_id,
    }))).toEqual([
      {
        id: expect.any(String),
        interactive_demo_id: second_response.json().interactive_demo.id,
        source_capture_event_id: source.click_event_id,
        background_capture_asset_id: source.first_asset_id,
      },
      {
        id: expect.any(String),
        interactive_demo_id: second_response.json().interactive_demo.id,
        source_capture_event_id: source.capture_event_id,
        background_capture_asset_id: source.second_asset_id,
      },
    ]);
    expect(second_response.json().demo_scenes[0].id).not.toBe(response.json().demo_scenes[0].id);

    await app.close();
  });

  it("rejects scenes that reference capture assets outside the current project", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token);
    const app = build({ logger: false });
    const demo_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos`,
      cookies: { demo_composer_session: session_token },
      payload: { title: "Product Tour" },
    });
    const interactive_demo_id = demo_response.json().interactive_demo.id as string;

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/scenes`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Invalid asset",
        background_capture_asset_id: "missing_asset",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.type).toBe("invalid_demo_scene_reference");

    await app.close();
  });
});
