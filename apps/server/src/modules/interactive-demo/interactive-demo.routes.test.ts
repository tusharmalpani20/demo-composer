import cookie from "@fastify/cookie";
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it } from "vitest";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import {
  DemoSceneNotFoundError,
  EmptyInteractiveDemoUpdateError,
  InteractiveDemoNotFoundError,
  InvalidDemoSceneReferenceError,
  ProjectNotFoundError,
  type DemoScene,
  type InteractiveDemo,
} from "./interactive-demo.service";
import { build_interactive_demo_routes } from "./interactive-demo.routes";

const auth_context = {
  user: {
    id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_1",
    role: "owner",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-05T00:00:00.000Z",
  },
};

const demo: InteractiveDemo = {
  id: "interactive_demo_1",
  organization_id: "organization_1",
  project_id: "project_1",
  source_capture_session_id: null,
  title: "Product Tour",
  description: "Internal walkthrough",
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const scene: DemoScene = {
  id: "demo_scene_1",
  organization_id: "organization_1",
  project_id: "project_1",
  interactive_demo_id: "interactive_demo_1",
  source_capture_session_id: null,
  source_capture_event_id: null,
  source_capture_asset_id: null,
  scene_index: 1,
  title: "Welcome",
  description: null,
  background_capture_asset_id: "capture_asset_1",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const build_test_app = async (
  overrides: {
    auth_service?: Partial<Parameters<typeof build_interactive_demo_routes>[0]["auth_service"]>;
    interactive_demo_service?: Partial<Parameters<typeof build_interactive_demo_routes>[0]["interactive_demo_service"]>;
  } = {}
) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(build_interactive_demo_routes({
    auth_service: {
      get_current_auth_context: async () => auth_context,
      ...overrides.auth_service,
    },
    interactive_demo_service: {
      create_interactive_demo: async () => demo,
      list_interactive_demos: async () => [demo],
      get_interactive_demo: async () => demo,
      update_interactive_demo: async () => ({ ...demo, title: "Updated Tour", version: 2 }),
      delete_interactive_demo: async () => undefined,
      create_demo_scene: async () => scene,
      list_demo_scenes: async () => [scene],
      update_demo_scene: async () => ({ ...scene, title: "Updated Scene", version: 2 }),
      reorder_demo_scenes: async () => [scene],
      delete_demo_scene: async () => undefined,
      ...overrides.interactive_demo_service,
    },
  }), { prefix: "/api/v1/projects" });
  return app;
};

describe("interactive demo routes", () => {
  it("rejects unauthenticated requests", async () => {
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/interactive-demos",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    });

    await app.close();
  });

  it("creates lists gets updates and archives interactive demos", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      interactive_demo_service: {
        create_interactive_demo: async (input) => {
          seen_inputs.push(input);
          return demo;
        },
      },
    });

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/interactive-demos",
      cookies: { demo_composer_session: "session-token" },
      payload: {
        title: "Product Tour",
        description: "Internal walkthrough",
        organization_id: "attacker_org",
        source_capture_session_id: "attacker_capture_session",
      },
    });
    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/interactive-demos",
      cookies: { demo_composer_session: "session-token" },
    });
    const get_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1",
      cookies: { demo_composer_session: "session-token" },
    });
    const update_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1",
      cookies: { demo_composer_session: "session-token" },
      payload: { title: "Updated Tour" },
    });
    const delete_response = await app.inject({
      method: "DELETE",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1",
      cookies: { demo_composer_session: "session-token" },
    });

    expect(create_response.statusCode).toBe(201);
    expect(list_response.json()).toEqual({ interactive_demos: [demo] });
    expect(get_response.json()).toEqual({ interactive_demo: demo });
    expect(update_response.json().interactive_demo).toMatchObject({ title: "Updated Tour", version: 2 });
    expect(delete_response.statusCode).toBe(204);
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      data: {
        title: "Product Tour",
        description: "Internal walkthrough",
      },
    }]);

    await app.close();
  });

  it("creates lists updates reorders and deletes demo scenes", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      interactive_demo_service: {
        create_demo_scene: async (input) => {
          seen_inputs.push(input);
          return scene;
        },
      },
    });

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1/scenes",
      cookies: { demo_composer_session: "session-token" },
      payload: {
        title: "Welcome",
        background_capture_asset_id: "capture_asset_1",
        source_capture_session_id: "attacker_capture_session",
        source_capture_event_id: "attacker_capture_event",
        source_capture_asset_id: "attacker_capture_asset",
      },
    });
    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1/scenes",
      cookies: { demo_composer_session: "session-token" },
    });
    const update_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1/scenes/demo_scene_1",
      cookies: { demo_composer_session: "session-token" },
      payload: { title: "Updated Scene" },
    });
    const reorder_response = await app.inject({
      method: "PUT",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1/scenes/order",
      cookies: { demo_composer_session: "session-token" },
      payload: { scene_ids: ["demo_scene_1"] },
    });
    const delete_response = await app.inject({
      method: "DELETE",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1/scenes/demo_scene_1",
      cookies: { demo_composer_session: "session-token" },
    });

    expect(create_response.statusCode).toBe(201);
    expect(create_response.json()).toEqual({ demo_scene: scene });
    expect(list_response.json()).toEqual({ demo_scenes: [scene] });
    expect(update_response.json().demo_scene).toMatchObject({ title: "Updated Scene", version: 2 });
    expect(reorder_response.json()).toEqual({ demo_scenes: [scene] });
    expect(delete_response.statusCode).toBe(204);
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      data: {
        title: "Welcome",
        background_capture_asset_id: "capture_asset_1",
      },
    }]);

    await app.close();
  });

  it("maps domain errors to stable responses", async () => {
    const app = await build_test_app({
      interactive_demo_service: {
        create_interactive_demo: async () => {
          throw new ProjectNotFoundError();
        },
        update_interactive_demo: async () => {
          throw new EmptyInteractiveDemoUpdateError();
        },
        get_interactive_demo: async () => {
          throw new InteractiveDemoNotFoundError();
        },
        update_demo_scene: async () => {
          throw new InvalidDemoSceneReferenceError();
        },
        delete_demo_scene: async () => {
          throw new DemoSceneNotFoundError();
        },
      },
    });

    const missing_project = await app.inject({
      method: "POST",
      url: "/api/v1/projects/missing_project/interactive-demos",
      cookies: { demo_composer_session: "session-token" },
      payload: { title: "Demo" },
    });
    const empty_update = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1",
      cookies: { demo_composer_session: "session-token" },
      payload: {},
    });
    const missing_demo = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1",
      cookies: { demo_composer_session: "session-token" },
    });
    const invalid_scene = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1/scenes/demo_scene_1",
      cookies: { demo_composer_session: "session-token" },
      payload: { background_capture_asset_id: "missing_asset" },
    });
    const missing_scene = await app.inject({
      method: "DELETE",
      url: "/api/v1/projects/project_1/interactive-demos/interactive_demo_1/scenes/demo_scene_1",
      cookies: { demo_composer_session: "session-token" },
    });

    expect(missing_project.statusCode).toBe(404);
    expect(missing_project.json().error.type).toBe("project_not_found");
    expect(empty_update.statusCode).toBe(400);
    expect(empty_update.json().error.type).toBe("empty_interactive_demo_update");
    expect(missing_demo.statusCode).toBe(404);
    expect(missing_demo.json().error.type).toBe("interactive_demo_not_found");
    expect(invalid_scene.statusCode).toBe(400);
    expect(invalid_scene.json().error.type).toBe("invalid_demo_scene_reference");
    expect(missing_scene.statusCode).toBe(404);
    expect(missing_scene.json().error.type).toBe("demo_scene_not_found");

    await app.close();
  });
});
