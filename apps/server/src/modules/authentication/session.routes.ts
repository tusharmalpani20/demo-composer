import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  clear_web_session_cookie,
  set_web_session_cookie,
  web_session_cookie_name,
} from "./session-cookie";
import {
  InvalidCredentialsError,
  UnauthenticatedSessionError,
  type AuthContext,
} from "./session.service";

export {
  InvalidCredentialsError,
  UnauthenticatedSessionError,
} from "./session.service";

export type AuthenticationSessionRouteService = {
  get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  login: (input: {
    email: string;
    password: string;
  }) => Promise<{
    session_token: string;
    auth: AuthContext;
  }>;
  logout: (session_token?: string) => Promise<void>;
};

const login_body_schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const unauthorized_response = (type: "unauthenticated" | "invalid_credentials", message: string) => ({
  error: {
    type,
    message,
  },
});

export const build_authentication_session_routes = (
  service: AuthenticationSessionRouteService
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    fastify.get("/me", async (request, reply) => {
      try {
        const auth = await service.get_current_auth_context(
          request.cookies[web_session_cookie_name]
        );

        return reply.status(200).send({ auth });
      } catch (error) {
        if (error instanceof UnauthenticatedSessionError) {
          return reply.status(401).send(
            unauthorized_response("unauthenticated", "Authentication is required")
          );
        }

        throw error;
      }
    });

    fastify.post<{
      Body: {
        email: string;
        password: string;
      };
    }>("/login", {
      schema: {
        body: login_body_schema,
      },
    }, async (request, reply) => {
      try {
        const result = await service.login(request.body);
        set_web_session_cookie(reply, result.session_token);
        return reply.status(200).send({ auth: result.auth });
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return reply.status(401).send(
            unauthorized_response("invalid_credentials", "Email or password is incorrect")
          );
        }

        throw error;
      }
    });

    fastify.post("/logout", async (request, reply) => {
      await service.logout(request.cookies[web_session_cookie_name]);
      clear_web_session_cookie(reply);
      return reply.status(204).send();
    });
  };
};
