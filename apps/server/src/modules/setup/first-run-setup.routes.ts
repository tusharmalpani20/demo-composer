import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import {
  FirstRunSetupRequestSchema,
  type FirstRunSetupRequest,
} from "@repo/types/setup";
import {
  FirstRunSetupAlreadyCompletedError,
  FirstRunSetupUnavailableError,
  UnsafeOwnerPasswordError,
} from "./first-run-setup.service";
import {
  set_web_session_cookie,
  web_session_cookie_name,
} from "../authentication/session-cookie";

export { web_session_cookie_name };

export type FirstRunSetupRouteService = {
  complete_first_run_setup: (input: FirstRunSetupRequest) => Promise<{
    session_token: string;
    auth: unknown;
  }>;
};

export const build_first_run_setup_routes = (
  service: FirstRunSetupRouteService
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    fastify.post<{
      Body: FirstRunSetupRequest;
    }>("/first-run", {
      schema: {
        body: FirstRunSetupRequestSchema,
      },
    }, async (request, reply) => {
      let result: Awaited<ReturnType<FirstRunSetupRouteService["complete_first_run_setup"]>>;
      try {
        result = await service.complete_first_run_setup(request.body);
      } catch (error) {
        if (error instanceof FirstRunSetupAlreadyCompletedError) {
          return reply.status(409).send({
            error: {
              type: "first_run_setup_completed",
              message: "First-run setup has already been completed",
            },
          });
        }

        if (error instanceof FirstRunSetupUnavailableError) {
          return reply.status(409).send({
            error: {
              type: "first_run_setup_unavailable",
              message: "First-run setup is not available for this instance",
            },
          });
        }

        if (error instanceof UnsafeOwnerPasswordError) {
          return reply.status(400).send({
            error: {
              type: "unsafe_owner_password",
              message: error.message,
            },
          });
        }

        throw error;
      }

      set_web_session_cookie(reply, result.session_token);

      return reply.status(201).send({
        auth: result.auth,
      });
    });
  };
};
