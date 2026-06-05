import { afterEach, describe, expect, it } from "vitest";
import { build } from "../../app";

const build_app = (owner_exists = false) => build({
  logger: false,
  public_instance_service: {
    get_public_instance_status: async () => ({
      deployment_mode: process.env.DEMO_COMPOSER_DEPLOYMENT_MODE === "hosted" ? "hosted" : "self_hosted",
      onboarding_mode: process.env.DEMO_COMPOSER_ONBOARDING_MODE === "signup" ? "signup" : "first_run_setup",
      setup_required: process.env.DEMO_COMPOSER_ONBOARDING_MODE === "signup" ? false : !owner_exists,
      signup_enabled: process.env.DEMO_COMPOSER_ONBOARDING_MODE === "signup",
    }),
  },
});

describe("public instance status", () => {
  afterEach(() => {
    delete process.env.DEMO_COMPOSER_DEPLOYMENT_MODE;
    delete process.env.DEMO_COMPOSER_ONBOARDING_MODE;
  });

  it("reports self-hosted first-run setup status without exposing secrets", async () => {
    const app = build_app();

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
    const app = build_app();

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
