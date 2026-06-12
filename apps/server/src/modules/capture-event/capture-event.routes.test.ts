import cookie from "@fastify/cookie";
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it } from "vitest";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import {
  CaptureAssetNotFoundError,
  CaptureEventIndexConflictError,
  CaptureEventNotFoundError,
  CaptureEventReorderNotAllowedError,
  CaptureSessionNotFoundError,
  InvalidCaptureEventOrderError,
  InvalidCaptureEventInputError,
  ProjectNotFoundError,
  type CaptureEvent,
} from "./capture-event.service";
import { build_capture_event_routes } from "./capture-event.routes";

const auth_context = {
  user: {
    id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_1",
    role: "owner",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-05T00:00:00.000Z",
  },
};

const capture_event: CaptureEvent = {
  id: "capture_event_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: "capture_asset_1",
  event_type: "click",
  event_index: 2,
  occurred_at: "2026-06-05T00:00:00.000Z",
  page_url: "https://example.internal/app/department",
  page_title: "Department",
  target_label: "Add Department",
  target_selector: "button[data-testid='add-department']",
  target_role: "button",
  target_test_id: "add-department",
  target_text: "Add Department",
  client_x: 1200,
  client_y: 84,
  viewport_width: 1440,
  viewport_height: 900,
  device_pixel_ratio: 1,
  input_intent: null,
  input_value_redacted: true,
  note: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const build_test_app = async (
  overrides: {
    auth_service?: Partial<Parameters<typeof build_capture_event_routes>[0]["auth_service"]>;
    capture_event_service?: Partial<Parameters<typeof build_capture_event_routes>[0]["capture_event_service"]>;
  } = {}
) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(build_capture_event_routes({
    auth_service: {
      get_current_auth_context: async () => auth_context,
      ...overrides.auth_service,
    },
    capture_event_service: {
      create_capture_event: async () => capture_event,
      list_capture_events: async () => [capture_event],
      get_capture_event: async () => capture_event,
      delete_capture_event: async () => undefined,
      reorder_capture_events: async () => [capture_event],
      ...overrides.capture_event_service,
    },
  }), { prefix: "/api/v1/projects" });
  return app;
};

describe("capture event routes", () => {
  it("rejects requests without a valid auth session", async () => {
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
      },
    });

    for (const request of [
      {
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events",
        payload: { event_type: "note", event_index: 1, note: "Hello" },
      },
      { method: "GET", url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events" },
      {
        method: "PUT",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events/order",
        payload: { event_ids: ["capture_event_1"] },
      },
      { method: "GET", url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events/capture_event_1" },
      { method: "DELETE", url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events/capture_event_1" },
    ] as const) {
      const response = await app.inject(request);
      expect(response.statusCode).toBe(401);
      expect(response.json().error.type).toBe("unauthenticated");
    }

    await app.close();
  });

  it("creates an event with auth context and URL scope while ignoring client ownership fields", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("session-token");
          return auth_context;
        },
      },
      capture_event_service: {
        create_capture_event: async (input) => {
          seen_inputs.push(input);
          return capture_event;
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events",
      cookies: { demo_composer_session: "session-token" },
      payload: {
        organization_id: "attacker_org",
        project_id: "attacker_project",
        capture_session_id: "attacker_session",
        created_by_id: "attacker_user",
        event_type: "click",
        event_index: 2,
        capture_asset_id: "capture_asset_1",
        target_label: "Add Department",
        client_x: 1200,
        client_y: 84,
        metadata: { source: "manual" },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        event_type: "click",
        event_index: 2,
        capture_asset_id: "capture_asset_1",
        target_label: "Add Department",
        client_x: 1200,
        client_y: 84,
        metadata: { source: "manual" },
      },
    }]);
    expect(response.json()).toEqual({ capture_event });
    expect(JSON.stringify(response.json())).not.toContain("metadata");
    expect(JSON.stringify(response.json())).not.toContain("is_deleted");
    expect(JSON.stringify(response.json())).not.toContain("deleted_at");
    expect(JSON.stringify(response.json())).not.toContain("deleted_by_id");
    await app.close();
  });

  it("creates capture events with bearer auth", async () => {
    const seen_tokens: Array<string | undefined> = [];
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          seen_tokens.push(session_token);
          return auth_context;
        },
      },
      capture_event_service: {
        create_capture_event: async (input) => {
          seen_inputs.push(input);
          return {
            ...capture_event,
            event_type: "capture",
            event_index: 1,
            target_label: null,
            target_selector: null,
            target_role: null,
            target_test_id: null,
            target_text: null,
            client_x: null,
            client_y: null,
            viewport_width: null,
            viewport_height: null,
            device_pixel_ratio: null,
          };
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events",
      headers: {
        authorization: "Bearer extension-session-token",
      },
      payload: {
        event_type: "capture",
        event_index: 1,
        capture_asset_id: "capture_asset_1",
        occurred_at: "2026-06-05T10:00:00.000Z",
        page_url: "https://example.com/path",
        page_title: "Example Page",
        input_value_redacted: true,
        metadata: {
          extension_version: "0.1.0",
          capture_source: "extension_popup",
          asset_type: "screenshot",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(seen_tokens).toEqual(["extension-session-token"]);
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        event_type: "capture",
        event_index: 1,
        capture_asset_id: "capture_asset_1",
        occurred_at: "2026-06-05T10:00:00.000Z",
        page_url: "https://example.com/path",
        page_title: "Example Page",
        input_value_redacted: true,
        metadata: {
          extension_version: "0.1.0",
          capture_source: "extension_popup",
          asset_type: "screenshot",
        },
      },
    }]);
    await app.close();
  });

  it("lists capture events with bearer auth", async () => {
    const seen_tokens: Array<string | undefined> = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          seen_tokens.push(session_token);
          return auth_context;
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events?event_type=capture",
      headers: {
        authorization: "Bearer extension-session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ capture_events: [capture_event] });
    expect(seen_tokens).toEqual(["extension-session-token"]);
    await app.close();
  });

  it("lists gets and deletes capture events through the service", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      capture_event_service: {
        list_capture_events: async (input) => {
          seen_inputs.push(input);
          return [capture_event];
        },
        get_capture_event: async (input) => {
          seen_inputs.push(input);
          return capture_event;
        },
        delete_capture_event: async (input) => {
          seen_inputs.push(input);
        },
      },
    });

    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events?event_type=click",
      cookies: { demo_composer_session: "session-token" },
    });
    const get_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events/capture_event_1",
      cookies: { demo_composer_session: "session-token" },
    });
    const delete_response = await app.inject({
      method: "DELETE",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events/capture_event_1",
      cookies: { demo_composer_session: "session-token" },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json()).toEqual({ capture_events: [capture_event] });
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json()).toEqual({ capture_event });
    expect(delete_response.statusCode).toBe(204);
    expect(delete_response.body).toBe("");
    expect(seen_inputs).toHaveLength(3);
    await app.close();
  });

  it("reorders capture events through the service with auth context and URL scope", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      capture_event_service: {
        reorder_capture_events: async (input) => {
          seen_inputs.push(input);
          return [
            { ...capture_event, id: "capture_event_2", event_index: 1 },
            { ...capture_event, id: "capture_event_1", event_index: 2 },
          ];
        },
      },
    });

    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events/order",
      cookies: { demo_composer_session: "session-token" },
      payload: {
        organization_id: "attacker_org",
        event_ids: ["capture_event_2", "capture_event_1"],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        event_ids: ["capture_event_2", "capture_event_1"],
      },
    }]);
    expect(response.json()).toEqual({
      capture_events: [
        { ...capture_event, id: "capture_event_2", event_index: 1 },
        { ...capture_event, id: "capture_event_1", event_index: 2 },
      ],
    });
    await app.close();
  });

  it("maps capture event domain errors to stable responses", async () => {
    const cases = [
      { error: new ProjectNotFoundError(), status: 404, type: "project_not_found" },
      { error: new CaptureSessionNotFoundError(), status: 404, type: "capture_session_not_found" },
      { error: new CaptureAssetNotFoundError(), status: 404, type: "capture_asset_not_found" },
      { error: new CaptureEventNotFoundError(), status: 404, type: "capture_event_not_found" },
      { error: new InvalidCaptureEventInputError(), status: 400, type: "invalid_capture_event" },
      { error: new InvalidCaptureEventOrderError(), status: 400, type: "invalid_capture_event_order" },
      { error: new CaptureEventReorderNotAllowedError(), status: 409, type: "capture_event_reorder_not_allowed" },
      { error: new CaptureEventIndexConflictError(), status: 409, type: "capture_event_index_conflict" },
    ];

    for (const test_case of cases) {
      const app = await build_test_app({
        capture_event_service: {
          create_capture_event: async () => {
            throw test_case.error;
          },
          reorder_capture_events: async () => {
            throw test_case.error;
          },
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events",
        cookies: { demo_composer_session: "session-token" },
        payload: { event_type: "note", event_index: 1, note: "Hello" },
      });

      expect(response.statusCode).toBe(test_case.status);
      expect(response.json().error.type).toBe(test_case.type);

      const reorder_response = await app.inject({
        method: "PUT",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events/order",
        cookies: { demo_composer_session: "session-token" },
        payload: { event_ids: ["capture_event_1"] },
      });

      expect(reorder_response.statusCode).toBe(test_case.status);
      expect(reorder_response.json().error.type).toBe(test_case.type);
      await app.close();
    }
  });

  it("rejects invalid route payloads and raw value fields", async () => {
    const app = await build_test_app();

    for (const payload of [
      { event_type: "click", event_index: 0 },
      { event_type: "input", event_index: 1, input_value_redacted: false },
      { event_type: "input", event_index: 1, input_value: "secret" },
    ]) {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events",
        cookies: { demo_composer_session: "session-token" },
        payload,
      });

      expect(response.statusCode).toBe(400);
    }

    for (const payload of [
      {},
      { event_ids: [] },
      { event_ids: [" "] },
      { event_ids: [123] },
    ]) {
      const response = await app.inject({
        method: "PUT",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events/order",
        cookies: { demo_composer_session: "session-token" },
        payload,
      });

      expect(response.statusCode).toBe(400);
    }

    await app.close();
  });
});
