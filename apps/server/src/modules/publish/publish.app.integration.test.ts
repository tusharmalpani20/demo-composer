import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { build } from "../../app";
import type { PublishResult } from "@repo/types/publish";

const publish_result: PublishResult = {
  publish_link: {
    id: "publish_link_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    published_artifact_id: "published_artifact_1",
    slug: "abc123",
    visibility: "public",
    expires_at: null,
    status: "active",
    published_at: "2026-06-10T00:00:00.000Z",
    revoked_at: null,
    password_protected: false,
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

describe("publish app integration", () => {
  it("mounts authenticated and public publish routes", async () => {
    const app = build({
      logger: false,
      authentication_session_service: {
        login: async () => {
          throw new Error("not needed");
        },
        get_current_auth_context: async () => ({
          user: { id: "user_1", email: "owner@example.com", display_name: "Owner User" },
          organization: { id: "organization_1", name: "Acme" },
          org_user: { id: "org_user_1", role: "owner" },
          session: { id: "session_1", session_type: "web", expires_at: "2026-07-05T00:00:00.000Z" },
        }),
        logout: async () => undefined,
      },
      publish_service: {
        publish_guide: async () => publish_result,
        publish_interactive_demo: async () => ({
          publish_link: {
            ...publish_result.publish_link,
            artifact_type: "interactive_demo",
            artifact_id: "interactive_demo_1",
            public_url: "/d/abc123",
          },
          published_artifact: {
            ...publish_result.published_artifact,
            artifact_type: "interactive_demo",
            artifact_id: "interactive_demo_1",
            title: "Department demo",
          },
        }),
        get_guide_publish_status: async () => publish_result,
        get_interactive_demo_publish_status: async () => ({
          publish_link: {
            ...publish_result.publish_link,
            artifact_type: "interactive_demo",
            artifact_id: "interactive_demo_1",
            public_url: "/d/abc123",
          },
          published_artifact: {
            ...publish_result.published_artifact,
            artifact_type: "interactive_demo",
            artifact_id: "interactive_demo_1",
            title: "Department demo",
          },
        }),
        revoke_guide_publish_link: async () => ({ publish_link: { ...publish_result.publish_link, status: "revoked" } }),
        revoke_interactive_demo_publish_link: async () => ({
          publish_link: {
            ...publish_result.publish_link,
            artifact_type: "interactive_demo",
            artifact_id: "interactive_demo_1",
            status: "revoked",
            public_url: "/d/abc123",
          },
        }),
        update_guide_publish_access: async () => publish_result,
        update_interactive_demo_publish_access: async () => ({
          publish_link: {
            ...publish_result.publish_link,
            artifact_type: "interactive_demo",
            artifact_id: "interactive_demo_1",
            public_url: "/d/abc123",
          },
          published_artifact: {
            ...publish_result.published_artifact,
            artifact_type: "interactive_demo",
            artifact_id: "interactive_demo_1",
            title: "Department demo",
          },
        }),
        update_guide_publish_password: async () => publish_result,
        update_interactive_demo_publish_password: async () => ({
          publish_link: {
            ...publish_result.publish_link,
            artifact_type: "interactive_demo",
            artifact_id: "interactive_demo_1",
            public_url: "/d/abc123",
          },
          published_artifact: {
            ...publish_result.published_artifact,
            artifact_type: "interactive_demo",
            artifact_id: "interactive_demo_1",
            title: "Department demo",
          },
        }),
        resolve_public_publish_link: async () => ({
          publish_link: {
            slug: "abc123",
            artifact_type: "guide",
            visibility: "public",
            expires_at: null,
            status: "active",
            password_protected: false,
          },
          published_artifact: {
            ...publish_result.published_artifact,
            snapshot: { artifact_type: "guide", blocks: [] },
          },
        }),
        create_public_publish_viewer_session: async () => ({
          token: "viewer-token",
          expires_at: "2026-06-10T12:00:00.000Z",
        }),
        get_public_published_asset_file: async () => ({
          stream: Readable.from(Buffer.from("file")),
          mime_type: "image/png",
          size_bytes: 4,
        }),
      },
    });

    const publish_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/publish",
      cookies: { ossie_session: "session-token" },
    });
    const public_response = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/abc123",
    });

    expect(publish_response.statusCode).toBe(201);
    expect(publish_response.json()).toEqual(publish_result);
    expect(public_response.statusCode).toBe(200);
    expect(public_response.json().publish_link.slug).toBe("abc123");
    await app.close();
  });
});
