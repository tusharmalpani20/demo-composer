import { describe, expect, it } from "vitest";
import { build } from "../../app";

describe("first-run setup app route", () => {
  it("mounts first-run setup under the versioned API", async () => {
    const app = build({
      logger: false,
      first_run_setup_service: {
        complete_first_run_setup: async () => ({
          session_token: "session-token",
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
        }),
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "owner@example.com",
          password: "safe local password",
        },
        organization: {
          name: "Acme",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().auth.organization.name).toBe("Acme");
    expect(response.cookies).toContainEqual(expect.objectContaining({
      name: "demo_composer_session",
      value: "session-token",
    }));
  });
});
