import { describe, expect, it } from "vitest";
import {
  CreatePublicViewerSessionRequestSchema,
  PublishedGuideSnapshotSchema,
  PublishedInteractiveDemoSnapshotSchema,
  PublicPublishLinkResponseSchema,
  PublishResultSchema,
  PublishStatusResponseSchema,
  RevokePublishResultSchema,
  UpdatePublishAccessRequestSchema,
  UpdatePublishPasswordRequestSchema,
} from "./publish";

const publish_link = {
  id: "publish_link_1",
  artifact_type: "guide",
  artifact_id: "guide_1",
  published_artifact_id: "published_artifact_1",
  slug: "abc123",
  visibility: "public",
  status: "active",
  published_at: "2026-07-07T00:00:00.000Z",
  revoked_at: null,
  expires_at: null,
  password_protected: false,
  public_url: "/p/abc123",
};

const published_artifact = {
  id: "published_artifact_1",
  artifact_type: "guide",
  artifact_id: "guide_1",
  version_number: 1,
  title: "Publish guide",
  published_at: "2026-07-07T00:00:00.000Z",
};

const snapshot_asset = {
  id: "asset_1",
  asset_type: "screenshot",
  width: 1440,
  height: 900,
  page_title: "Dashboard",
  page_url: "https://example.test/dashboard",
  file: {
    id: "file_1",
    original_name: "dashboard.png",
    mime_type: "image/png",
    size_bytes: 1234,
  },
  file_url: "/api/v1/public/publish-links/abc123/assets/asset_1/file",
};

describe("publish contracts", () => {
  it("parses publish status responses", () => {
    expect(PublishStatusResponseSchema.parse({
      publish_link,
      published_artifact,
    })).toEqual({
      publish_link,
      published_artifact,
    });

    expect(PublishStatusResponseSchema.parse({
      publish_link: null,
      published_artifact: null,
    })).toEqual({
      publish_link: null,
      published_artifact: null,
    });
  });

  it("parses publish and revoke result responses with full publish links", () => {
    expect(PublishResultSchema.parse({
      publish_link,
      published_artifact,
    })).toEqual({
      publish_link,
      published_artifact,
    });

    const revoked_link = {
      ...publish_link,
      status: "revoked",
      revoked_at: "2026-07-07T01:00:00.000Z",
    };

    expect(RevokePublishResultSchema.parse({
      publish_link: revoked_link,
    })).toEqual({
      publish_link: revoked_link,
    });
  });

  it("parses public publish link responses with unknown snapshots", () => {
    const response = {
      publish_link: {
        slug: "abc123",
        artifact_type: "guide",
        visibility: "public",
        status: "active",
        expires_at: null,
        password_protected: false,
      },
      published_artifact: {
        ...published_artifact,
        snapshot: { any: "snapshot" },
      },
    };

    expect(PublicPublishLinkResponseSchema.parse(response)).toEqual(response);
  });

  it("parses published guide snapshots", () => {
    const snapshot = {
      artifact_type: "guide",
      guide: {
        id: "guide_1",
        title: "Publish guide",
        description: null,
        source_capture_session_id: "capture_session_1",
        published_version: 1,
        published_at: "2026-07-07T00:00:00.000Z",
      },
      blocks: [{
        id: "block_1",
        block_type: "step",
        block_index: 1,
        content: {
          annotations: [{
            id: "annotation_1",
            type: "highlight",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.4,
          }],
        },
        step: {
          id: "step_1",
          title: "Open dashboard",
          body: null,
        },
        source_asset: snapshot_asset,
      }],
    };

    expect(PublishedGuideSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it("parses published interactive demo snapshots", () => {
    const snapshot = {
      artifact_type: "interactive_demo",
      schema_version: 1,
      interactive_demo: {
        id: "interactive_demo_1",
        title: "Demo",
        description: null,
        source_capture_session_id: "capture_session_1",
        published_version: 1,
        published_at: "2026-07-07T00:00:00.000Z",
      },
      scenes: [{
        id: "scene_1",
        scene_index: 1,
        title: "Scene",
        description: null,
        background_asset: snapshot_asset,
        hotspots: [{
          id: "hotspot_1",
          hotspot_type: "click",
          label: "Continue",
          content: null,
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
          target_scene_id: null,
          hotspot_index: 1,
        }],
      }],
    };

    expect(PublishedInteractiveDemoSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it("validates publish request bodies", () => {
    expect(UpdatePublishAccessRequestSchema.parse({
      visibility: "restricted",
      expires_at: "2026-07-08T00:00:00.000Z",
    })).toEqual({
      visibility: "restricted",
      expires_at: "2026-07-08T00:00:00.000Z",
    });
    expect(UpdatePublishPasswordRequestSchema.parse({ password: null })).toEqual({ password: null });
    expect(CreatePublicViewerSessionRequestSchema.parse({ password: "password123" })).toEqual({
      password: "password123",
    });
  });

  it("rejects invalid publish enum values", () => {
    expect(() => PublishStatusResponseSchema.parse({
      publish_link: {
        ...publish_link,
        visibility: "private",
      },
      published_artifact,
    })).toThrow();
    expect(() => PublicPublishLinkResponseSchema.parse({
      publish_link: {
        slug: "abc123",
        artifact_type: "unknown",
        visibility: "public",
        status: "active",
        expires_at: null,
        password_protected: false,
      },
      published_artifact: {
        ...published_artifact,
        snapshot: {},
      },
    })).toThrow();
  });
});
