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
  GuideBlockNotFoundError,
  GuideNotFoundError,
  GuideNotEditableError,
  GuideStepNotFoundError,
  InvalidGuideBlockOrderError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
  ProjectNotFoundError,
  type CreateGuideFromCaptureInput,
  type Guide,
  type GuideAuthContext,
  type GuideBlock,
  type GuideDetail,
  type GuideStep,
  type UpdateGuideInput,
  type UpdateGuideStepInput,
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
    update_guide: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      data: UpdateGuideInput;
    }) => Promise<Guide>;
    update_guide_step: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      guide_step_id: string;
      data: UpdateGuideStepInput;
    }) => Promise<GuideStep>;
    reorder_guide_blocks: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      block_ids: string[];
    }) => Promise<GuideBlock[]>;
    delete_guide_block: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      guide_block_id: string;
    }) => Promise<void>;
  };
};

const create_guide_body_schema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  selected_capture_event_ids: z.array(z.string().trim().min(1)).optional(),
}).passthrough();

const update_guide_body_schema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["archived"]).optional(),
}).passthrough();

const update_guide_step_body_schema = z.object({
  title: z.string().optional(),
  body: z.string().nullable().optional(),
}).passthrough();

const reorder_guide_blocks_body_schema = z.object({
  block_ids: z.array(z.string().trim().min(1)).min(1),
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

const pick_update_guide_data = (body: UpdateGuideInput): UpdateGuideInput => {
  const data: UpdateGuideInput = {};

  if (body.title !== undefined) {
    data.title = body.title;
  }
  if (body.description !== undefined) {
    data.description = body.description;
  }
  if (body.status !== undefined) {
    data.status = body.status;
  }

  return data;
};

const pick_update_guide_step_data = (
  body: UpdateGuideStepInput
): UpdateGuideStepInput => {
  const data: UpdateGuideStepInput = {};

  if (body.title !== undefined) {
    data.title = body.title;
  }
  if (body.body !== undefined) {
    data.body = body.body;
  }

  return data;
};

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

      if (error instanceof GuideStepNotFoundError) {
        return reply.status(404).send(error_response("guide_step_not_found", "Guide step was not found"));
      }

      if (error instanceof GuideBlockNotFoundError) {
        return reply.status(404).send(error_response("guide_block_not_found", "Guide block was not found"));
      }

      if (error instanceof GuideNotEditableError) {
        return reply.status(409).send(error_response("guide_not_editable", "Guide is not editable"));
      }

      if (error instanceof InvalidGuideInputError) {
        return reply.status(400).send(error_response("invalid_guide", "Guide input is invalid"));
      }

      if (error instanceof InvalidGuideStepInputError) {
        return reply.status(400).send(error_response("invalid_guide_step", "Guide step input is invalid"));
      }

      if (error instanceof InvalidGuideBlockOrderError) {
        return reply.status(400).send(error_response("invalid_guide_block_order", "Guide block order is invalid"));
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

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Body: UpdateGuideInput;
    }>("/:project_id/guides/:guide_id", {
      schema: {
        body: update_guide_body_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const guide = await dependencies.guide_service.update_guide({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
          data: pick_update_guide_data(request.body),
        });

        return reply.status(200).send({ guide });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
        guide_step_id: string;
      };
      Body: UpdateGuideStepInput;
    }>("/:project_id/guides/:guide_id/steps/:guide_step_id", {
      schema: {
        body: update_guide_step_body_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const guide_step = await dependencies.guide_service.update_guide_step({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
          guide_step_id: request.params.guide_step_id,
          data: pick_update_guide_step_data(request.body),
        });

        return reply.status(200).send({ guide_step });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Body: {
        block_ids: string[];
      };
    }>("/:project_id/guides/:guide_id/blocks/reorder", {
      schema: {
        body: reorder_guide_blocks_body_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const guide_blocks = await dependencies.guide_service.reorder_guide_blocks({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
          block_ids: request.body.block_ids,
        });

        return reply.status(200).send({ guide_blocks });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: {
        project_id: string;
        guide_id: string;
        guide_block_id: string;
      };
    }>("/:project_id/guides/:guide_id/blocks/:guide_block_id", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        await dependencies.guide_service.delete_guide_block({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
          guide_block_id: request.params.guide_block_id,
        });

        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
