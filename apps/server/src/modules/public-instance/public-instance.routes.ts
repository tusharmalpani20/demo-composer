import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type {
  DeploymentMode,
  OnboardingMode,
} from "@repo/constants";

export type PublicInstanceRouteService = {
  get_public_instance_status: () => Promise<{
    deployment_mode: DeploymentMode;
    onboarding_mode: OnboardingMode;
    setup_required: boolean;
    signup_enabled: boolean;
  }>;
};

export const build_public_instance_routes = (
  service: PublicInstanceRouteService
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    fastify.get("/instance", async () => service.get_public_instance_status());
  };
};
