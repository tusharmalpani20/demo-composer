import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { web_session_cookie_name } from "../authentication/session-cookie";
import {
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  GuideNotFoundError,
  InvalidGuideInputError,
  ProjectNotFoundError,
  type CreateGuideFromCaptureInput,
  type Guide,
  type GuideAuthContext,
  type GuideDetail,
} from "./guide.service";

export type GuideRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  guide_service: {
    create_guide_from_capture: (input: {
      auth: GuideAuthContext;
      project_id: string;
      capture_session_id: string;
      data: CreateGuideFromCaptureInput;
    }) => Promise<GuideDetail>;
    list_guides: (input: {
      auth: GuideAuthContext;
      project_id: string;
    }) => Promise<Guide[]>;
    get_guide_detail: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
    }) => Promise<GuideDetail>;
  };
};

const create_guide_body_schema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  selected_capture_event_ids: z.array(z.string().trim().min(1)).optional(),
}).passthrough();

const unauthorized_response = () => ({
  error: {
    type: "unauthenticated",
    message: "Authentication is required",
  },
});

const error_response = (type: string, message: string) => ({
  error: {
    type,
    message,
  },
});

const guide_auth_context = (auth: AuthContext): GuideAuthContext => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const pick_create_guide_data = (
  body: CreateGuideFromCaptureInput
): CreateGuideFromCaptureInput => ({
  title: body.title,
  description: body.description ?? null,
  selected_capture_event_ids: body.selected_capture_event_ids,
});

export const build_guide_routes = (
  dependencies: GuideRouteDependencies
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) => (
      guide_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token)
      )
    );

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(unauthorized_response());
      }

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send(error_response("project_not_found", "Project was not found"));
      }

      if (error instanceof CaptureSessionNotFoundError) {
        return reply.status(404).send(error_response("capture_session_not_found", "Capture session was not found"));
      }

      if (error instanceof CaptureEventNotFoundError) {
        return reply.status(404).send(error_response("capture_event_not_found", "Capture event was not found"));
      }

      if (error instanceof GuideNotFoundError) {
        return reply.status(404).send(error_response("guide_not_found", "Guide was not found"));
      }

      if (error instanceof InvalidGuideInputError) {
        return reply.status(400).send(error_response("invalid_guide", "Guide input is invalid"));
      }

      throw error;
    };

    fastify.post<{
      Params: {
        project_id: string;
        capture_session_id: string;
      };
      Body: CreateGuideFromCaptureInput;
    }>("/:project_id/guides/from-capture-session/:capture_session_id", {
      schema: {
        body: create_guide_body_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const guide_detail = await dependencies.guide_service.create_guide_from_capture({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          data: pick_create_guide_data(request.body),
        });

        return reply.status(201).send(guide_detail);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
      };
    }>("/:project_id/guides", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const guides = await dependencies.guide_service.list_guides({
          auth,
          project_id: request.params.project_id,
        });

        return reply.status(200).send({ guides });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
        guide_id: string;
      };
    }>("/:project_id/guides/:guide_id", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const guide_detail = await dependencies.guide_service.get_guide_detail({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
        });

        return reply.status(200).send(guide_detail);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
