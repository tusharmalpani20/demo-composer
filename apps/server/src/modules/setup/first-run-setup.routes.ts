import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  FirstRunSetupAlreadyCompletedError,
  UnsafeOwnerPasswordError,
} from "./first-run-setup.service";

export const web_session_cookie_name = "demo_composer_session";

const first_run_setup_body_schema = z.object({
  owner: z.object({
    email: z.string().min(1),
    password: z.string().min(1),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
  }),
  organization: z.object({
    name: z.string().min(1),
  }),
});

export type FirstRunSetupRouteService = {
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
    }>("/first-run", {
      schema: {
        body: first_run_setup_body_schema,
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
