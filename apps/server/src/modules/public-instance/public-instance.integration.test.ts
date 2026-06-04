import { afterEach, describe, expect, it } from "vitest";
import { build } from "../../app";

describe("public instance status", () => {
  afterEach(() => {
    delete process.env.DEMO_COMPOSER_DEPLOYMENT_MODE;
    delete process.env.DEMO_COMPOSER_ONBOARDING_MODE;
  });

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

  it("reports hosted signup mode when configured for hosted deployment", async () => {
    process.env.DEMO_COMPOSER_DEPLOYMENT_MODE = "hosted";
    process.env.DEMO_COMPOSER_ONBOARDING_MODE = "signup";
    const app = build({ logger: false });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/public/instance",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      deployment_mode: "hosted",
      onboarding_mode: "signup",
      setup_required: false,
      signup_enabled: true,
    });
  });
});
