import { describe, expect, it } from "vitest";
import { build } from "../../app";

describe("public instance status", () => {
  it("reports self-hosted first-run setup status without exposing secrets", async () => {
    const app = build({ logger: false });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/public/instance",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      deployment_mode: "self_hosted",
      onboarding_mode: "first_run_setup",
      setup_required: true,
      signup_enabled: false,
    });
  });
});
