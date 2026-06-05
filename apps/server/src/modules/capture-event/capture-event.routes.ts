import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { web_session_cookie_name } from "../authentication/session-cookie";
import {
  CaptureAssetNotFoundError,
  CaptureEventIndexConflictError,
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  InvalidCaptureEventInputError,
  ProjectNotFoundError,
  type CaptureEvent,
  type CaptureEventAuthContext,
  type CaptureEventType,
  type CreateCaptureEventInput,
} from "./capture-event.service";

export type CaptureEventRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  capture_event_service: {
    create_capture_event: (input: {
      auth: CaptureEventAuthContext;
      project_id: string;
      capture_session_id: string;
      data: CreateCaptureEventInput;
    }) => Promise<CaptureEvent>;
    list_capture_events: (input: {
      auth: CaptureEventAuthContext;
      project_id: string;
      capture_session_id: string;
      event_type?: CaptureEventType;
    }) => Promise<CaptureEvent[]>;
    get_capture_event: (input: {
      auth: CaptureEventAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_event_id: string;
    }) => Promise<CaptureEvent>;
    delete_capture_event: (input: {
      auth: CaptureEventAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_event_id: string;
    }) => Promise<void>;
  };
};

const event_type_schema = z.enum(["navigation", "click", "input", "capture", "note"]);
const non_negative_number_schema = z.number().nonnegative();
const positive_int_schema = z.number().int().positive();
const positive_number_schema = z.number().positive();
const raw_input_field_names = new Set([
  "input_value",
  "value",
  "typed_value",
  "password",
  "secret",
]);

const create_capture_event_body_schema = z.object({
  event_type: event_type_schema,
  event_index: positive_int_schema,
  capture_asset_id: z.string().trim().min(1).nullable().optional(),
  occurred_at: z.string().datetime().nullable().optional(),
  page_url: z.string().nullable().optional(),
  page_title: z.string().nullable().optional(),
  target_label: z.string().nullable().optional(),
  target_selector: z.string().nullable().optional(),
  target_role: z.string().nullable().optional(),
  target_test_id: z.string().nullable().optional(),
  target_text: z.string().nullable().optional(),
  client_x: non_negative_number_schema.nullable().optional(),
  client_y: non_negative_number_schema.nullable().optional(),
  viewport_width: positive_int_schema.nullable().optional(),
  viewport_height: positive_int_schema.nullable().optional(),
  device_pixel_ratio: positive_number_schema.nullable().optional(),
  input_intent: z.string().nullable().optional(),
  input_value_redacted: z.boolean().optional(),
  note: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
}).passthrough();

const list_query_schema = z.object({
  event_type: event_type_schema.optional(),
});

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

const capture_event_auth_context = (auth: AuthContext) => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const pick_create_capture_event_data = (
  body: CreateCaptureEventInput
): CreateCaptureEventInput => {
  const data: CreateCaptureEventInput = {
    event_type: body.event_type,
    event_index: body.event_index,
  };

  for (const key of [
    "capture_asset_id",
    "occurred_at",
    "page_url",
    "page_title",
    "target_label",
    "target_selector",
    "target_role",
    "target_test_id",
    "target_text",
    "client_x",
    "client_y",
    "viewport_width",
    "viewport_height",
    "device_pixel_ratio",
    "input_intent",
    "input_value_redacted",
    "note",
    "metadata",
  ] as const) {
    if (body[key] !== undefined) {
      data[key] = body[key] as never;
    }
  }

  for (const key of raw_input_field_names) {
    if (body[key] !== undefined) {
      data[key] = body[key];
    }
  }

  return data;
};

const assert_no_raw_input_values = (body: CreateCaptureEventInput) => {
  if (body.input_value_redacted === false) {
    throw new InvalidCaptureEventInputError();
  }

  for (const key of raw_input_field_names) {
    if (body[key] !== undefined) {
      throw new InvalidCaptureEventInputError();
    }
  }
};

export const build_capture_event_routes = (
  dependencies: CaptureEventRouteDependencies
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) => (
      capture_event_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token)
      )
    );

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(unauthorized_response());
      }

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send(
          error_response("project_not_found", "Project was not found")
        );
      }

      if (error instanceof CaptureSessionNotFoundError) {
        return reply.status(404).send(
          error_response("capture_session_not_found", "Capture session was not found")
        );
      }

      if (error instanceof CaptureAssetNotFoundError) {
        return reply.status(404).send(
          error_response("capture_asset_not_found", "Capture asset was not found")
        );
      }

      if (error instanceof CaptureEventNotFoundError) {
        return reply.status(404).send(
          error_response("capture_event_not_found", "Capture event was not found")
        );
      }

      if (error instanceof InvalidCaptureEventInputError) {
        return reply.status(400).send(
          error_response("invalid_capture_event", "Capture event input is invalid")
        );
      }

      if (error instanceof CaptureEventIndexConflictError) {
        return reply.status(409).send(
          error_response(
            "capture_event_index_conflict",
            "A capture event with this index already exists"
          )
        );
      }

      throw error;
    };

    fastify.post<{
      Params: {
        project_id: string;
        capture_session_id: string;
      };
      Body: CreateCaptureEventInput;
    }>("/:project_id/capture-sessions/:capture_session_id/events", {
      schema: {
        body: create_capture_event_body_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        assert_no_raw_input_values(request.body);
        const capture_event = await dependencies.capture_event_service.create_capture_event({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          data: pick_create_capture_event_data(request.body),
        });
        return reply.status(201).send({ capture_event });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
        capture_session_id: string;
      };
      Querystring: {
        event_type?: CaptureEventType;
      };
    }>("/:project_id/capture-sessions/:capture_session_id/events", {
      schema: {
        querystring: list_query_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const capture_events = await dependencies.capture_event_service.list_capture_events({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          event_type: request.query.event_type,
        });
        return reply.status(200).send({ capture_events });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
        capture_session_id: string;
        id: string;
      };
    }>("/:project_id/capture-sessions/:capture_session_id/events/:id", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const capture_event = await dependencies.capture_event_service.get_capture_event({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          capture_event_id: request.params.id,
        });
        return reply.status(200).send({ capture_event });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: {
        project_id: string;
        capture_session_id: string;
        id: string;
      };
    }>("/:project_id/capture-sessions/:capture_session_id/events/:id", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        await dependencies.capture_event_service.delete_capture_event({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          capture_event_id: request.params.id,
        });
        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
