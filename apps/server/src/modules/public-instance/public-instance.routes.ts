import type { FastifyInstance, FastifyPluginAsync } from "fastify";

export type PublicInstanceRouteService = {
  get_public_instance_status: () => Promise<{
    deployment_mode: "self_hosted" | "hosted";
    onboarding_mode: "first_run_setup" | "signup";
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
