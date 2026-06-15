import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { session_token_from_request } from "../authentication/request-session-token";
import {
  CaptureSessionNotFoundError,
  DemoSceneNotFoundError,
  EmptyDemoSceneOrderError,
  EmptyDemoSceneUpdateError,
  EmptyInteractiveDemoUpdateError,
  InteractiveDemoNotFoundError,
  InvalidDemoSceneOrderError,
  InvalidDemoSceneReferenceError,
  NoUsableCaptureEventsError,
  ProjectNotFoundError,
  type CreateDemoSceneInput,
  type CreateInteractiveDemoInput,
  type CreateInteractiveDemoFromCaptureInput,
  type DemoScene,
  type InteractiveDemo,
  type InteractiveDemoAuthContext,
  type UpdateDemoSceneInput,
  type UpdateInteractiveDemoInput,
} from "./interactive-demo.service";

export type InteractiveDemoRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  interactive_demo_service: {
    create_interactive_demo_from_capture: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      capture_session_id: string;
      data: CreateInteractiveDemoFromCaptureInput;
    }) => Promise<{
      interactive_demo: InteractiveDemo;
      demo_scenes: DemoScene[];
      redirect_path: string;
    }>;
    create_interactive_demo: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      data: CreateInteractiveDemoInput;
    }) => Promise<InteractiveDemo>;
    list_interactive_demos: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
    }) => Promise<InteractiveDemo[]>;
    get_interactive_demo: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
    }) => Promise<InteractiveDemo>;
    update_interactive_demo: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      data: UpdateInteractiveDemoInput;
    }) => Promise<InteractiveDemo>;
    delete_interactive_demo: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
    }) => Promise<void>;
    create_demo_scene: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      data: CreateDemoSceneInput;
    }) => Promise<DemoScene>;
    list_demo_scenes: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
    }) => Promise<DemoScene[]>;
    update_demo_scene: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      demo_scene_id: string;
      data: UpdateDemoSceneInput;
    }) => Promise<DemoScene>;
    reorder_demo_scenes: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      scene_ids: string[];
    }) => Promise<DemoScene[]>;
    delete_demo_scene: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      demo_scene_id: string;
    }) => Promise<void>;
  };
};

const create_demo_body_schema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
}).passthrough();

const create_demo_from_capture_body_schema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
}).passthrough();

const update_demo_body_schema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "archived"]).optional(),
}).passthrough();

const create_scene_body_schema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  background_capture_asset_id: z.string().trim().min(1).nullable().optional(),
}).passthrough();

const update_scene_body_schema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  background_capture_asset_id: z.string().trim().min(1).nullable().optional(),
}).passthrough();

const reorder_scenes_body_schema = z.object({
  scene_ids: z.array(z.string().trim().min(1)).min(1),
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

const interactive_demo_auth_context = (auth: AuthContext): InteractiveDemoAuthContext => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const pick_create_demo_data = (body: CreateInteractiveDemoInput): CreateInteractiveDemoInput => {
  const data: CreateInteractiveDemoInput = {
    title: body.title,
  };

  if (body.description !== undefined) {
    data.description = body.description;
  }

  return data;
};

const pick_create_demo_from_capture_data = (
  body: CreateInteractiveDemoFromCaptureInput
): CreateInteractiveDemoFromCaptureInput => {
  const data: CreateInteractiveDemoFromCaptureInput = {};

  if (body.title !== undefined) {
    data.title = body.title;
  }
  if (body.description !== undefined) {
    data.description = body.description;
  }

  return data;
};

const pick_update_demo_data = (body: UpdateInteractiveDemoInput): UpdateInteractiveDemoInput => ({
  title: body.title,
  description: body.description,
  status: body.status,
});

const pick_create_scene_data = (body: CreateDemoSceneInput): CreateDemoSceneInput => ({
  title: body.title,
  description: body.description,
  background_capture_asset_id: body.background_capture_asset_id,
});

const pick_update_scene_data = (body: UpdateDemoSceneInput): UpdateDemoSceneInput => ({
  title: body.title,
  description: body.description,
  background_capture_asset_id: body.background_capture_asset_id,
});

export const build_interactive_demo_routes = (
  dependencies: InteractiveDemoRouteDependencies
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) => (
      interactive_demo_auth_context(
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

      if (error instanceof InteractiveDemoNotFoundError) {
        return reply.status(404).send(error_response("interactive_demo_not_found", "Interactive demo was not found"));
      }

      if (error instanceof CaptureSessionNotFoundError) {
        return reply.status(404).send(error_response("capture_session_not_found", "Capture session was not found"));
      }

      if (error instanceof NoUsableCaptureEventsError) {
        return reply.status(400).send(error_response("no_usable_capture_events", "Capture session has no screenshot-backed events"));
      }

      if (error instanceof DemoSceneNotFoundError) {
        return reply.status(404).send(error_response("demo_scene_not_found", "Demo scene was not found"));
      }

      if (error instanceof EmptyInteractiveDemoUpdateError) {
        return reply.status(400).send(error_response("empty_interactive_demo_update", "At least one interactive demo field must be provided"));
      }

      if (error instanceof EmptyDemoSceneUpdateError) {
        return reply.status(400).send(error_response("empty_demo_scene_update", "At least one demo scene field must be provided"));
      }

      if (error instanceof EmptyDemoSceneOrderError) {
        return reply.status(400).send(error_response("empty_demo_scene_order", "At least one demo scene id must be provided"));
      }

      if (error instanceof InvalidDemoSceneOrderError) {
        return reply.status(400).send(error_response("invalid_demo_scene_order", "Demo scene order is invalid"));
      }

      if (error instanceof InvalidDemoSceneReferenceError) {
        return reply.status(400).send(error_response("invalid_demo_scene_reference", "Demo scene references are invalid"));
      }

      throw error;
    };

    fastify.post<{
      Params: { project_id: string; capture_session_id: string };
      Body: CreateInteractiveDemoFromCaptureInput;
    }>("/:project_id/capture-sessions/:capture_session_id/interactive-demos", {
      schema: { body: create_demo_from_capture_body_schema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const result = await dependencies.interactive_demo_service.create_interactive_demo_from_capture({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          data: pick_create_demo_from_capture_data(request.body),
        });
        return reply.status(201).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.post<{
      Params: { project_id: string };
      Body: CreateInteractiveDemoInput;
    }>("/:project_id/interactive-demos", {
      schema: { body: create_demo_body_schema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const interactive_demo = await dependencies.interactive_demo_service.create_interactive_demo({
          auth,
          project_id: request.params.project_id,
          data: pick_create_demo_data(request.body),
        });
        return reply.status(201).send({ interactive_demo });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: { project_id: string };
    }>("/:project_id/interactive-demos", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const interactive_demos = await dependencies.interactive_demo_service.list_interactive_demos({
          auth,
          project_id: request.params.project_id,
        });
        return reply.status(200).send({ interactive_demos });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: { project_id: string; interactive_demo_id: string };
    }>("/:project_id/interactive-demos/:interactive_demo_id", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const interactive_demo = await dependencies.interactive_demo_service.get_interactive_demo({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
        });
        return reply.status(200).send({ interactive_demo });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: { project_id: string; interactive_demo_id: string };
      Body: UpdateInteractiveDemoInput;
    }>("/:project_id/interactive-demos/:interactive_demo_id", {
      schema: { body: update_demo_body_schema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const interactive_demo = await dependencies.interactive_demo_service.update_interactive_demo({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          data: pick_update_demo_data(request.body),
        });
        return reply.status(200).send({ interactive_demo });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: { project_id: string; interactive_demo_id: string };
    }>("/:project_id/interactive-demos/:interactive_demo_id", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        await dependencies.interactive_demo_service.delete_interactive_demo({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
        });
        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.post<{
      Params: { project_id: string; interactive_demo_id: string };
      Body: CreateDemoSceneInput;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes", {
      schema: { body: create_scene_body_schema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_scene = await dependencies.interactive_demo_service.create_demo_scene({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          data: pick_create_scene_data(request.body),
        });
        return reply.status(201).send({ demo_scene });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: { project_id: string; interactive_demo_id: string };
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_scenes = await dependencies.interactive_demo_service.list_demo_scenes({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
        });
        return reply.status(200).send({ demo_scenes });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: { project_id: string; interactive_demo_id: string; scene_id: string };
      Body: UpdateDemoSceneInput;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id", {
      schema: { body: update_scene_body_schema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_scene = await dependencies.interactive_demo_service.update_demo_scene({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          demo_scene_id: request.params.scene_id,
          data: pick_update_scene_data(request.body),
        });
        return reply.status(200).send({ demo_scene });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.put<{
      Params: { project_id: string; interactive_demo_id: string };
      Body: { scene_ids: string[] };
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/order", {
      schema: { body: reorder_scenes_body_schema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_scenes = await dependencies.interactive_demo_service.reorder_demo_scenes({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          scene_ids: request.body.scene_ids,
        });
        return reply.status(200).send({ demo_scenes });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: { project_id: string; interactive_demo_id: string; scene_id: string };
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        await dependencies.interactive_demo_service.delete_demo_scene({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          demo_scene_id: request.params.scene_id,
        });
        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
