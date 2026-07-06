import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { PublicInstanceStatusResponse } from "@repo/types/instance";

export type PublicInstanceRouteService = {
  get_public_instance_status: () => Promise<PublicInstanceStatusResponse>;
};

export const build_public_instance_routes = (
  service: PublicInstanceRouteService
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    fastify.get("/instance", async () => service.get_public_instance_status());
  };
};
