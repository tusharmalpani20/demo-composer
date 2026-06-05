import { ulid } from "ulid";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";

const reset_foundation_tables = async () => {
  await pool.query(`
    TRUNCATE TABLE
      auth_schema.auth_session,
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

const create_project = async (session_token: string, name = "Onboarding Demo") => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: {
      demo_composer_session: session_token,
    },
    payload: {
      name,
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().project.id as string;
};

const insert_cross_org_project_and_capture_session = async () => {
  const user_id = ulid();
  const organization_id = ulid();
  const org_user_id = ulid();
  const project_id = ulid();
  const capture_session_id = ulid();

  await pool.query(`
    INSERT INTO user_schema.user (id, email, password_hash, display_name)
    VALUES ($1, 'other@example.com', 'hash.salt', 'Other User')
  `, [user_id]);
  await pool.query(`
    INSERT INTO organization_schema.organization (id, name)
    VALUES ($1, 'Other Org')
  `, [organization_id]);
  await pool.query(`
    INSERT INTO organization_schema.org_user (id, user_id, organization_id, role)
    VALUES ($1, $2, $3, 'owner')
  `, [org_user_id, user_id, organization_id]);
  await pool.query(`
    INSERT INTO project_schema.project (
      id,
      organization_id,
      name,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, 'Other Project', $3, $3)
  `, [project_id, organization_id, org_user_id]);
  await pool.query(`
    INSERT INTO capture_schema.capture_session (
      id,
      organization_id,
      project_id,
      name,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, $3, 'Other Capture', $4, $4)
  `, [capture_session_id, organization_id, project_id, org_user_id]);

  return {
    project_id,
    capture_session_id,
  };
};

describe("DB-backed capture session API", () => {
  beforeEach(async () => {
    await reset_foundation_tables();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates lists gets updates and soft deletes capture sessions under a project", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token);
    const owner_context = await get_owner_context();
    const app = build({ logger: false });

    const create_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions`,
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "Create department workflow",
        description: "Source capture for the department setup guide",
        source_type: "extension",
        start_url: "https://example.internal/app/department",
        browser_name: "Chrome",
        browser_version: "126",
        operating_system: "Linux",
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 1,
        user_agent: "Mozilla/5.0",
        status: "completed",
        started_at: "attacker timestamp",
        metadata: {
          capture_mode: "screenshot",
        },
      },
    });

    expect(create_response.statusCode).toBe(201);
    expect(create_response.json().capture_session).toMatchObject({
      organization_id: owner_context?.organization_id,
      project_id,
      name: "Create department workflow",
      description: "Source capture for the department setup guide",
      status: "draft",
      source_type: "extension",
      started_at: null,
      completed_at: null,
      canceled_at: null,
      viewport_width: 1440,
      viewport_height: 900,
      device_pixel_ratio: 1,
      created_by_id: owner_context?.org_user_id,
      updated_by_id: owner_context?.org_user_id,
      version: 1,
    });
    expect(JSON.stringify(create_response.json())).not.toContain("metadata");
    expect(JSON.stringify(create_response.json())).not.toContain("is_deleted");
    expect(JSON.stringify(create_response.json())).not.toContain("deleted_at");
    expect(JSON.stringify(create_response.json())).not.toContain("deleted_by_id");

    const capture_session_id = create_response.json().capture_session.id as string;

    const list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions`,
      cookies: {
        demo_composer_session: session_token,
      },
    });
    const get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
    });
    const capturing_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        status: "capturing",
      },
    });
    const completed_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        status: "completed",
      },
    });
    const canceled_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        status: "canceled",
      },
    });
    const archived_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        status: "archived",
      },
    });
    const completed_list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions?status=completed`,
      cookies: {
        demo_composer_session: session_token,
      },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json().capture_sessions).toHaveLength(1);
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json().capture_session.id).toBe(capture_session_id);
    expect(capturing_response.statusCode).toBe(200);
    expect(capturing_response.json().capture_session).toMatchObject({
      status: "capturing",
      version: 2,
    });
    expect(capturing_response.json().capture_session.started_at).toEqual(expect.any(String));
    expect(completed_response.statusCode).toBe(200);
    expect(completed_response.json().capture_session.completed_at).toEqual(expect.any(String));
    expect(canceled_response.statusCode).toBe(200);
    expect(canceled_response.json().capture_session.canceled_at).toEqual(expect.any(String));
    expect(archived_response.statusCode).toBe(200);
    expect(archived_response.json().capture_session.started_at).toEqual(expect.any(String));
    expect(archived_response.json().capture_session.completed_at).toEqual(expect.any(String));
    expect(archived_response.json().capture_session.canceled_at).toEqual(expect.any(String));
    expect(completed_list_response.statusCode).toBe(200);
    expect(completed_list_response.json().capture_sessions).toEqual([]);

    const persisted_before_delete = await pool.query<{
      metadata: unknown;
      started_at: Date | null;
      completed_at: Date | null;
      canceled_at: Date | null;
      version: number;
    }>(`
      SELECT metadata, started_at, completed_at, canceled_at, version
      FROM capture_schema.capture_session
      WHERE id = $1
    `, [capture_session_id]);

    expect(persisted_before_delete.rows[0]?.metadata).toEqual({
      capture_mode: "screenshot",
    });
    expect(persisted_before_delete.rows[0]?.started_at).toBeInstanceOf(Date);
    expect(persisted_before_delete.rows[0]?.completed_at).toBeInstanceOf(Date);
    expect(persisted_before_delete.rows[0]?.canceled_at).toBeInstanceOf(Date);
    expect(persisted_before_delete.rows[0]?.version).toBe(5);

    const delete_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
    });

    expect(delete_response.statusCode).toBe(204);
    expect(delete_response.body).toBe("");

    const persisted_after_delete = await pool.query<{
      is_deleted: boolean;
      deleted_at: Date | null;
      deleted_by_id: string | null;
      status: string;
      updated_by_id: string;
      version: number;
    }>(`
      SELECT is_deleted, deleted_at, deleted_by_id, status, updated_by_id, version
      FROM capture_schema.capture_session
      WHERE id = $1
    `, [capture_session_id]);

    expect(persisted_after_delete.rows[0]).toMatchObject({
      is_deleted: true,
      deleted_by_id: owner_context?.org_user_id,
      status: "archived",
      updated_by_id: owner_context?.org_user_id,
      version: 6,
    });
    expect(persisted_after_delete.rows[0]?.deleted_at).toBeInstanceOf(Date);

    const hidden_list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions`,
      cookies: {
        demo_composer_session: session_token,
      },
    });
    const hidden_get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
    });
    const hidden_update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "Should Not Update",
      },
    });
    const repeat_delete_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
    });

    expect(hidden_list_response.statusCode).toBe(200);
    expect(hidden_list_response.json().capture_sessions).toEqual([]);
    expect(hidden_get_response.statusCode).toBe(404);
    expect(hidden_get_response.json().error.type).toBe("capture_session_not_found");
    expect(hidden_update_response.statusCode).toBe(404);
    expect(hidden_update_response.json().error.type).toBe("capture_session_not_found");
    expect(repeat_delete_response.statusCode).toBe(404);
    expect(repeat_delete_response.json().error.type).toBe("capture_session_not_found");

    await app.close();
  });

  it("does not reveal cross-org or deleted project resources", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token, "Disposable Project");
    const visible_project_id = await create_project(session_token, "Visible Project");
    const app = build({ logger: false });

    const delete_project_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
    });
    expect(delete_project_response.statusCode).toBe(204);

    const create_under_deleted_project_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions`,
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "Should Not Create",
      },
    });
    expect(create_under_deleted_project_response.statusCode).toBe(404);
    expect(create_under_deleted_project_response.json().error.type).toBe("project_not_found");

    const cross_org = await insert_cross_org_project_and_capture_session();
    const cross_org_list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${cross_org.project_id}/capture-sessions`,
      cookies: {
        demo_composer_session: session_token,
      },
    });
    const cross_org_get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${visible_project_id}/capture-sessions/${cross_org.capture_session_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
    });

    expect(cross_org_list_response.statusCode).toBe(404);
    expect(cross_org_list_response.json().error.type).toBe("project_not_found");
    expect(cross_org_get_response.statusCode).toBe(404);
    expect(cross_org_get_response.json().error.type).toBe("capture_session_not_found");

    await app.close();
  });

  it("enforces capture session schema constraints in postgres", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token, "Constraint Project");
    const owner_context = await get_owner_context();

    const insert_invalid_capture_session = (overrides: {
      status?: string;
      source_type?: string;
      viewport_width?: number;
      viewport_height?: number;
      device_pixel_ratio?: number;
    }) => pool.query(`
      INSERT INTO capture_schema.capture_session (
        id,
        organization_id,
        project_id,
        name,
        status,
        source_type,
        viewport_width,
        viewport_height,
        device_pixel_ratio,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, 'Invalid Capture', $4, $5, $6, $7, $8, $9, $9)
    `, [
      ulid(),
      owner_context?.organization_id,
      project_id,
      overrides.status ?? "draft",
      overrides.source_type ?? "manual",
      overrides.viewport_width ?? 100,
      overrides.viewport_height ?? 100,
      overrides.device_pixel_ratio ?? 1,
      owner_context?.org_user_id,
    ]);

    await expect(insert_invalid_capture_session({
      status: "paused",
    })).rejects.toThrow();
    await expect(insert_invalid_capture_session({
      source_type: "screen_magic",
    })).rejects.toThrow();
    await expect(insert_invalid_capture_session({
      viewport_width: 0,
    })).rejects.toThrow();
    await expect(insert_invalid_capture_session({
      viewport_height: -1,
    })).rejects.toThrow();
    await expect(insert_invalid_capture_session({
      device_pixel_ratio: 0,
    })).rejects.toThrow();
  });
});
