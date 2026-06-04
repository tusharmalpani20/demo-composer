import cookie from "@fastify/cookie";
import fastify from "fastify";
import { describe, expect, it } from "vitest";
import { build_first_run_setup_routes } from "./first-run-setup.routes";

describe("first-run setup routes", () => {
  it("creates setup through the service and sets the web session cookie", async () => {
    const app = fastify();
    await app.register(cookie);
    await app.register(build_first_run_setup_routes({
      complete_first_run_setup: async (input) => ({
        session_token: "session-token",
        auth: {
          user: {
            id: "user_1",
            email: input.owner.email,
          },
          organization: {
            id: "organization_1",
            name: input.organization.name,
          },
          org_user: {
            id: "org_user_1",
            role: "owner",
          },
          session: {
            id: "session_1",
          },
        },
      }),
    }), { prefix: "/api/v1/setup" });

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

    expect(response.statusCode).toBe(201);
    expect(response.cookies).toContainEqual(expect.objectContaining({
      name: "demo_composer_session",
      value: "session-token",
      httpOnly: true,
      path: "/",
    }));
    expect(response.json()).toEqual({
      auth: {
        user: {
          id: "user_1",
          email: "owner@example.com",
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
        },
      },
    });
  });
});
