import { describe, expect, it } from "vitest";
import { build } from "../../app";
import type { InteractiveDemo } from "./interactive-demo.service";

const interactive_demo: InteractiveDemo = {
  id: "interactive_demo_1",
  organization_id: "organization_1",
  project_id: "project_1",
  source_capture_session_id: null,
  title: "Product Tour",
  description: null,
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

describe("interactive demo app routes", () => {
  it("mounts interactive demo routes under project API routes", async () => {
    const app = build({
      logger: false,
      authentication_session_service: {
        get_current_auth_context: async () => ({
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
        }),
        login: async () => {
          throw new Error("not used");
        },
        logout: async () => {
          throw new Error("not used");
        },
      },
      interactive_demo_service: {
        create_interactive_demo_from_capture: async () => ({
          interactive_demo,
          demo_scenes: [],
          redirect_path: "/projects/project_1/interactive-demos/interactive_demo_1",
        }),
        create_interactive_demo: async () => interactive_demo,
        list_interactive_demos: async () => [],
        get_interactive_demo: async () => {
          throw new Error("not used");
        },
        update_interactive_demo: async () => {
          throw new Error("not used");
        },
        delete_interactive_demo: async () => {
          throw new Error("not used");
        },
        create_demo_scene: async () => {
          throw new Error("not used");
        },
        list_demo_scenes: async () => [],
        update_demo_scene: async () => {
          throw new Error("not used");
        },
        reorder_demo_scenes: async () => [],
        delete_demo_scene: async () => {
          throw new Error("not used");
        },
        create_demo_hotspot: async () => {
          throw new Error("not used");
        },
        list_demo_hotspots: async () => [],
        update_demo_hotspot: async () => {
          throw new Error("not used");
        },
        reorder_demo_hotspots: async () => [],
        delete_demo_hotspot: async () => {
          throw new Error("not used");
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/interactive-demos",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        title: "Product Tour",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().interactive_demo.title).toBe("Product Tour");

    await app.close();
  });
});
