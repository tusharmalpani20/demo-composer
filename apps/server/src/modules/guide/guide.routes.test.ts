import cookie from "@fastify/cookie";
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it } from "vitest";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import {
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  GuideNotFoundError,
  InvalidGuideInputError,
  ProjectNotFoundError,
  type GuideDetail,
} from "./guide.service";
import { build_guide_routes } from "./guide.routes";

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

const guide_detail: GuideDetail = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: null,
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:00:00.000Z",
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  guide_blocks: [{
    id: "block_1",
    organization_id: "organization_1",
    project_id: "project_1",
    guide_id: "guide_1",
    source_capture_session_id: "capture_session_1",
    source_capture_event_id: "event_1",
    source_capture_asset_id: "asset_1",
    block_type: "step",
    block_index: 1,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:00:00.000Z",
    updated_at: "2026-06-05T00:00:00.000Z",
    step: {
      id: "step_1",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      title: "Navigate to \"Department List\"",
      body: null,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
    },
  }],
};

const build_test_app = async (
  overrides: {
    auth_service?: Partial<Parameters<typeof build_guide_routes>[0]["auth_service"]>;
    guide_service?: Partial<Parameters<typeof build_guide_routes>[0]["guide_service"]>;
  } = {}
) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(build_guide_routes({
    auth_service: {
      get_current_auth_context: async () => auth_context,
      ...overrides.auth_service,
    },
    guide_service: {
      create_guide_from_capture: async () => guide_detail,
      list_guides: async () => [guide_detail.guide],
      get_guide_detail: async () => guide_detail,
      ...overrides.guide_service,
    },
  }), { prefix: "/api/v1/projects" });
  return app;
};

describe("guide routes", () => {
  it("creates a guide from a capture session using auth and URL scope", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("session-token");
          return auth_context;
        },
      },
      guide_service: {
        create_guide_from_capture: async (input) => {
          seen_inputs.push(input);
          return guide_detail;
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/from-capture-session/capture_session_1",
      cookies: { demo_composer_session: "session-token" },
      payload: {
        title: "Department guide",
        description: null,
        selected_capture_event_ids: ["event_2", "event_1"],
        organization_id: "attacker_org",
        target_selector: "button.secret",
        input_intent: "typed real value",
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
        title: "Department guide",
        description: null,
        selected_capture_event_ids: ["event_2", "event_1"],
      },
    }]);
    expect(response.json()).toEqual(guide_detail);
    expect(JSON.stringify(response.json())).not.toContain("target_selector");
    expect(JSON.stringify(response.json())).not.toContain("input_intent");
    expect(JSON.stringify(response.json())).not.toContain("storage_key");
    await app.close();
  });

  it("lists and gets guide details", async () => {
    const app = await build_test_app();

    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides",
      cookies: { demo_composer_session: "session-token" },
    });
    const get_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides/guide_1",
      cookies: { demo_composer_session: "session-token" },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json()).toEqual({ guides: [guide_detail.guide] });
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json()).toEqual(guide_detail);
    await app.close();
  });

  it("maps auth and domain errors to stable responses", async () => {
    const unauthenticated_app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
      },
    });
    const unauthenticated_response = await unauthenticated_app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides",
    });
    expect(unauthenticated_response.statusCode).toBe(401);
    expect(unauthenticated_response.json().error.type).toBe("unauthenticated");
    await unauthenticated_app.close();

    const cases = [
      { error: new ProjectNotFoundError(), status: 404, type: "project_not_found" },
      { error: new CaptureSessionNotFoundError(), status: 404, type: "capture_session_not_found" },
      { error: new CaptureEventNotFoundError(), status: 404, type: "capture_event_not_found" },
      { error: new GuideNotFoundError(), status: 404, type: "guide_not_found" },
      { error: new InvalidGuideInputError(), status: 400, type: "invalid_guide" },
    ];

    for (const test_case of cases) {
      const app = await build_test_app({
        guide_service: {
          create_guide_from_capture: async () => {
            throw test_case.error;
          },
        },
      });
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/projects/project_1/guides/from-capture-session/capture_session_1",
        cookies: { demo_composer_session: "session-token" },
        payload: { title: "Guide" },
      });

      expect(response.statusCode).toBe(test_case.status);
      expect(response.json().error.type).toBe(test_case.type);
      await app.close();
    }
  });
});
