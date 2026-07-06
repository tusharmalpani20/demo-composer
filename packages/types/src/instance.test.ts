import { describe, expect, it } from "vitest";
import { PublicInstanceStatusResponseSchema } from "./instance";

describe("public instance contract", () => {
  it("accepts the public instance status response", () => {
    expect(PublicInstanceStatusResponseSchema.parse({
      deployment_mode: "self_hosted",
      onboarding_mode: "first_run_setup",
      setup_required: true,
      signup_enabled: false,
    })).toEqual({
      deployment_mode: "self_hosted",
      onboarding_mode: "first_run_setup",
      setup_required: true,
      signup_enabled: false,
    });
  });

  it("rejects unknown deployment and onboarding modes", () => {
    expect(PublicInstanceStatusResponseSchema.safeParse({
      deployment_mode: "local",
      onboarding_mode: "first_run_setup",
      setup_required: true,
      signup_enabled: false,
    }).success).toBe(false);
  });
});
