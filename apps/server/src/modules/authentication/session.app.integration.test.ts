import { describe, expect, it } from "vitest";
import { build } from "../../app";

describe("authentication session app routes", () => {
  it("mounts authentication session routes under the versioned API", async () => {
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
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        demo_composer_session: "session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().auth.user.email).toBe("owner@example.com");

    await app.close();
  });
});
