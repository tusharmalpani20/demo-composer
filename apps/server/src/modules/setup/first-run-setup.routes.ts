import type { FastifyInstance, FastifyPluginAsync } from "fastify";

export const web_session_cookie_name = "demo_composer_session";

type FirstRunSetupRouteService = {
  complete_first_run_setup: (input: {
    owner: {
      email: string;
      password: string;
      first_name?: string | null;
      last_name?: string | null;
    };
    organization: {
      name: string;
    };
  }) => Promise<{
    session_token: string;
    auth: unknown;
  }>;
};

export const build_first_run_setup_routes = (
  service: FirstRunSetupRouteService
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    fastify.post<{
      Body: {
        owner: {
          email: string;
          password: string;
          first_name?: string | null;
          last_name?: string | null;
        };
        organization: {
          name: string;
        };
      };
    }>("/first-run", async (request, reply) => {
      const result = await service.complete_first_run_setup(request.body);

      reply.setCookie(web_session_cookie_name, result.session_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });

      return reply.status(201).send({
        auth: result.auth,
      });
    });
  };
};
