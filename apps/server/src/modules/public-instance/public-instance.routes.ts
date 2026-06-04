import type { FastifyInstance, FastifyPluginAsync } from "fastify";

export const public_instance_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/instance", async () => ({
    deployment_mode: process.env.DEMO_COMPOSER_DEPLOYMENT_MODE ?? "self_hosted",
    onboarding_mode: process.env.DEMO_COMPOSER_ONBOARDING_MODE ?? "first_run_setup",
    setup_required: true,
    signup_enabled: false,
  }));
};
