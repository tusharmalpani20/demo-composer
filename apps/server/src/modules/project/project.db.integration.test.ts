import { ulid } from "ulid";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";

const reset_foundation_tables = async () => {
  await pool.query(`
    TRUNCATE TABLE
      auth_schema.auth_session,
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

const insert_cross_org_project = async () => {
  const user_id = ulid();
  const organization_id = ulid();
  const org_user_id = ulid();
  const project_id = ulid();

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

  return project_id;
};

describe("DB-backed project foundation API", () => {
  beforeEach(async () => {
    await reset_foundation_tables();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates lists gets and updates projects with auth-scoped audit fields", async () => {
    const session_token = await setup_owner();
    const app = build({ logger: false });

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "Onboarding Demo",
        description: "Internal onboarding demo flow",
        slug: "onboarding-demo",
        color: "#2563eb",
        icon: "presentation",
        organization_id: "attacker_org",
        created_by_id: "attacker_org_user",
      },
    });

    expect(create_response.statusCode).toBe(201);
    expect(create_response.json().project).toMatchObject({
      name: "Onboarding Demo",
      description: "Internal onboarding demo flow",
      slug: "onboarding-demo",
      color: "#2563eb",
      icon: "presentation",
      status: "active",
      version: 1,
    });
    expect(JSON.stringify(create_response.json())).not.toContain("is_deleted");
    expect(JSON.stringify(create_response.json())).not.toContain("deleted_at");

    const project_id = create_response.json().project.id as string;

    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects",
      cookies: {
        demo_composer_session: session_token,
      },
    });
    const get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
    });
    const update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "Updated Demo",
        description: "",
        status: "archived",
      },
    });
    const archived_list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects?status=archived",
      cookies: {
        demo_composer_session: session_token,
      },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json().projects).toHaveLength(1);
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json().project.id).toBe(project_id);
    expect(update_response.statusCode).toBe(200);
    expect(update_response.json().project).toMatchObject({
      id: project_id,
      name: "Updated Demo",
      description: null,
      status: "archived",
      version: 2,
    });
    expect(archived_list_response.statusCode).toBe(200);
    expect(archived_list_response.json().projects).toHaveLength(1);

    const persisted = await pool.query<{
      organization_id: string;
      created_by_id: string;
      updated_by_id: string;
      version: number;
    }>(`
      SELECT organization_id, created_by_id, updated_by_id, version
      FROM project_schema.project
      WHERE id = $1
    `, [project_id]);
    const owner_context = await pool.query<{
      organization_id: string;
      org_user_id: string;
    }>(`
      SELECT organization_id, id AS org_user_id
      FROM organization_schema.org_user
      WHERE role = 'owner'
    `);

    expect(persisted.rows[0]).toMatchObject({
      organization_id: owner_context.rows[0]?.organization_id,
      created_by_id: owner_context.rows[0]?.org_user_id,
      updated_by_id: owner_context.rows[0]?.org_user_id,
      version: 2,
    });

    await app.close();
  });

  it("maps duplicate constraints and cross-org access correctly", async () => {
    const session_token = await setup_owner();
    const app = build({ logger: false });

    await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "Onboarding Demo",
        slug: "onboarding-demo",
      },
    });

    const duplicate_name_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "onboarding demo",
      },
    });
    const duplicate_slug_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "Second Demo",
        slug: "ONBOARDING-DEMO",
      },
    });

    expect(duplicate_name_response.statusCode).toBe(409);
    expect(duplicate_name_response.json().error.type).toBe("project_name_conflict");
    expect(duplicate_slug_response.statusCode).toBe(409);
    expect(duplicate_slug_response.json().error.type).toBe("project_slug_conflict");

    const archived_duplicate_name_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "Onboarding Demo",
        slug: "archived-name-demo",
        status: "archived",
      },
    });
    expect(archived_duplicate_name_response.statusCode).toBe(201);

    const cross_org_project_id = await insert_cross_org_project();
    const cross_org_get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${cross_org_project_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
    });
    const cross_org_update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${cross_org_project_id}`,
      cookies: {
        demo_composer_session: session_token,
      },
      payload: {
        name: "Should Not Update",
      },
    });

    expect(cross_org_get_response.statusCode).toBe(404);
    expect(cross_org_update_response.statusCode).toBe(404);

    await app.close();
  });
});
