import { Readable } from "node:stream";
import cookie from "@fastify/cookie";
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it } from "vitest";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import {
  GuideHasNoPublishableBlocksError,
  GuideNotFoundError,
  GuideNotPublishableError,
  ProjectNotFoundError,
  PublishLinkNotFoundError,
  PublishedAssetNotFoundError,
  UnsupportedPublishedAssetStorageProviderError,
  type GuidePublishResult,
} from "./publish.service";
import { build_publish_routes } from "./publish.routes";

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

const publish_result: GuidePublishResult = {
  publish_link: {
    id: "publish_link_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    published_artifact_id: "published_artifact_1",
    slug: "abc123",
    visibility: "public",
    status: "active",
    published_at: "2026-06-10T00:00:00.000Z",
    revoked_at: null,
    public_url: "/p/abc123",
  },
  published_artifact: {
    id: "published_artifact_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    version_number: 1,
    title: "Department guide",
    published_at: "2026-06-10T00:00:00.000Z",
  },
};

const public_result = {
  publish_link: {
    slug: "abc123",
    artifact_type: "guide" as const,
    visibility: "public" as const,
    status: "active" as const,
  },
  published_artifact: {
    ...publish_result.published_artifact,
    snapshot: {
      artifact_type: "guide",
      guide: {
        id: "guide_1",
        title: "Department guide",
        description: null,
        source_capture_session_id: "capture_session_1",
        published_version: 1,
        published_at: "2026-06-10T00:00:00.000Z",
      },
      blocks: [],
    },
  },
};

const build_test_app = async (
  overrides: {
    auth_service?: {
      get_current_auth_context?: (session_token?: string) => Promise<typeof auth_context>;
    };
    publish_service?: Partial<Parameters<typeof build_publish_routes>[0]["publish_service"]>;
  } = {}
) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(build_publish_routes({
    auth_service: {
      get_current_auth_context: async () => auth_context,
      ...overrides.auth_service,
    },
    publish_service: {
      publish_guide: async () => publish_result,
      get_guide_publish_status: async () => publish_result,
      revoke_guide_publish_link: async () => ({
        publish_link: {
          ...publish_result.publish_link,
          status: "revoked",
          revoked_at: "2026-06-10T01:00:00.000Z",
        },
      }),
      resolve_public_publish_link: async () => public_result,
      get_public_published_asset_file: async () => ({
        stream: Readable.from(Buffer.from("file-bytes")),
        mime_type: "image/png",
        size_bytes: 10,
      }),
      ...overrides.publish_service,
    },
  }), { prefix: "/api/v1" });
  return app;
};

describe("publish routes", () => {
  it("publishes reads status and revokes a guide with authenticated scope", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("session-token");
          return auth_context;
        },
      },
      publish_service: {
        publish_guide: async (input) => {
          seen_inputs.push(input);
          return publish_result;
        },
        get_guide_publish_status: async (input) => {
          seen_inputs.push(input);
          return publish_result;
        },
        revoke_guide_publish_link: async (input) => {
          seen_inputs.push(input);
          return {
            publish_link: {
              ...publish_result.publish_link,
              status: "revoked",
              revoked_at: "2026-06-10T01:00:00.000Z",
            },
          };
        },
      },
    });

    const publish_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/publish",
      cookies: { demo_composer_session: "session-token" },
    });
    const status_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides/guide_1/publish",
      cookies: { demo_composer_session: "session-token" },
    });
    const revoke_response = await app.inject({
      method: "DELETE",
      url: "/api/v1/projects/project_1/guides/guide_1/publish",
      cookies: { demo_composer_session: "session-token" },
    });

    expect(publish_response.statusCode).toBe(201);
    expect(publish_response.json()).toEqual(publish_result);
    expect(status_response.statusCode).toBe(200);
    expect(status_response.json()).toEqual(publish_result);
    expect(revoke_response.statusCode).toBe(200);
    expect(revoke_response.json().publish_link.status).toBe("revoked");
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
      },
    ]);
    expect(JSON.stringify(publish_response.json())).not.toContain("storage_key");
    await app.close();
  });

  it("resolves public publish links and referenced asset bytes without authentication", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new Error("auth should not be used");
        },
      },
      publish_service: {
        resolve_public_publish_link: async (input) => {
          seen_inputs.push(input);
          return public_result;
        },
        get_public_published_asset_file: async (input) => {
          seen_inputs.push(input);
          return {
            stream: Readable.from(Buffer.from("file-bytes")),
            mime_type: "image/png",
            size_bytes: 10,
          };
        },
      },
    });

    const resolve_response = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/abc123",
    });
    const asset_response = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/abc123/assets/asset_1/file",
    });

    expect(resolve_response.statusCode).toBe(200);
    expect(resolve_response.json()).toEqual(public_result);
    expect(asset_response.statusCode).toBe(200);
    expect(asset_response.headers["content-type"]).toBe("image/png");
    expect(asset_response.headers["content-length"]).toBe("10");
    expect(asset_response.body).toBe("file-bytes");
    expect(seen_inputs).toEqual([
      { slug: "abc123" },
      { slug: "abc123", capture_asset_id: "asset_1" },
    ]);
    expect(JSON.stringify(resolve_response.json())).not.toContain("organization_id");
    expect(JSON.stringify(resolve_response.json())).not.toContain("storage_key");
    await app.close();
  });

  it("returns null publish status when a guide has no active publish link", async () => {
    const app = await build_test_app({
      publish_service: {
        get_guide_publish_status: async () => ({
          publish_link: null,
          published_artifact: null,
        }),
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides/guide_1/publish",
      cookies: { demo_composer_session: "session-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      publish_link: null,
      published_artifact: null,
    });
    await app.close();
  });

  it("maps auth and publish domain errors to stable responses", async () => {
    const unauthenticated_app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
      },
    });
    const unauthenticated_response = await unauthenticated_app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/publish",
    });
    expect(unauthenticated_response.statusCode).toBe(401);
    expect(unauthenticated_response.json().error.type).toBe("unauthenticated");
    await unauthenticated_app.close();

    const cases = [
      { error: new ProjectNotFoundError(), status: 404, type: "project_not_found" },
      { error: new GuideNotFoundError(), status: 404, type: "guide_not_found" },
      { error: new GuideNotPublishableError(), status: 409, type: "guide_not_publishable" },
      { error: new GuideHasNoPublishableBlocksError(), status: 400, type: "guide_has_no_publishable_blocks" },
      { error: new PublishLinkNotFoundError(), status: 404, type: "publish_link_not_found" },
      { error: new PublishedAssetNotFoundError(), status: 404, type: "published_asset_not_found" },
    ];

    for (const test_case of cases) {
      const app = await build_test_app({
        publish_service: {
          publish_guide: async () => {
            throw test_case.error;
          },
          resolve_public_publish_link: async () => {
            throw test_case.error;
          },
        },
      });
      const authenticated_response = await app.inject({
        method: "POST",
        url: "/api/v1/projects/project_1/guides/guide_1/publish",
        cookies: { demo_composer_session: "session-token" },
      });
      const public_response = await app.inject({
        method: "GET",
        url: "/api/v1/public/publish-links/missing",
      });

      expect(authenticated_response.statusCode).toBe(test_case.status);
      expect(authenticated_response.json().error.type).toBe(test_case.type);
      expect(public_response.statusCode).toBe(test_case.status);
      expect(public_response.json().error.type).toBe(test_case.type);
      await app.close();
    }
  });

  it("maps unsupported public asset storage to a stable response", async () => {
    const app = await build_test_app({
      publish_service: {
        get_public_published_asset_file: async () => {
          throw new UnsupportedPublishedAssetStorageProviderError();
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/abc123/assets/asset_1/file",
    });

    expect(response.statusCode).toBe(501);
    expect(response.json().error.type).toBe("unsupported_published_asset_storage_provider");
    await app.close();
  });
});
