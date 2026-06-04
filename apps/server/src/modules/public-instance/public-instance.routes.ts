import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { get_public_instance_status } from "./public-instance.config";

export const public_instance_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/instance", async () => get_public_instance_status());
};
