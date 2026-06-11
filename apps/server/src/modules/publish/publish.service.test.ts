import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import type { GuideDetail } from "../guide/guide.service";
import {
  build_publish_service,
  GuideHasNoPublishableBlocksError,
  GuideNotFoundError,
  GuideNotPublishableError,
  ProjectNotFoundError,
  PublishLinkNotFoundError,
  PublishedAssetNotFoundError,
  type PublishRepository,
} from "./publish.service";

const guide_detail: GuideDetail = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: "Set up departments.",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:00:00.000Z",
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  guide_blocks: [
    {
      id: "block_2",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_2",
      source_capture_asset_id: null,
      block_type: "step",
      content: null,
      block_index: 2,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:02:00.000Z",
      updated_at: "2026-06-05T00:02:00.000Z",
      step: {
        id: "step_2",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_2",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_2",
        source_capture_asset_id: null,
        title: "Click Add Department",
        body: null,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:02:00.000Z",
        updated_at: "2026-06-05T00:02:00.000Z",
      },
    },
    {
      id: "block_1",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      block_type: "step",
      content: null,
      block_index: 1,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:01:00.000Z",
      updated_at: "2026-06-05T00:01:00.000Z",
      step: {
        id: "step_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        title: "Navigate to Department List",
        body: "Open the Department module.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:01:00.000Z",
        updated_at: "2026-06-05T00:01:00.000Z",
      },
    },
    {
      id: "block_3",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      block_type: "header",
      content: {
        title: "Department fields",
      },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:03:00.000Z",
      updated_at: "2026-06-05T00:03:00.000Z",
      step: null,
    },
  ],
  source_capture_assets: [{
    id: "asset_1",
    capture_session_id: "capture_session_1",
    asset_type: "screenshot",
    width: 1440,
    height: 900,
    device_pixel_ratio: 1,
    page_url: "https://example.test/departments",
    page_title: "Department List",
    captured_at: "2026-06-05T00:01:00.000Z",
    file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
    file: {
      id: "file_1",
      original_name: "departments.png",
      mime_type: "image/png",
      size_bytes: 123456,
    },
  }],
};

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const create_repository = (overrides: Partial<PublishRepository> = {}): PublishRepository => {
  const repository: PublishRepository = {
    transaction: async (work) => work(repository),
    project_exists: vi.fn(async () => true),
    find_guide_detail: vi.fn(async () => guide_detail),
    find_active_publish_link: vi.fn(async () => null),
    next_published_artifact_version: vi.fn(async () => 1),
    create_published_artifact: vi.fn(async (input) => ({
      id: "published_artifact_1",
      artifact_type: input.artifact_type,
      artifact_id: input.artifact_id,
      version_number: input.version_number,
      title: input.title,
      published_at: "2026-06-10T00:00:00.000Z",
    })),
    create_publish_link: vi.fn(async (input) => ({
      id: "publish_link_1",
      artifact_type: input.artifact_type,
      artifact_id: input.artifact_id,
      published_artifact_id: input.published_artifact_id,
      slug: input.slug,
      visibility: "public" as const,
      status: "active" as const,
      published_at: "2026-06-10T00:00:00.000Z",
      revoked_at: null,
      public_url: `/p/${input.slug}`,
    })),
    update_publish_link_target: vi.fn(async (input) => ({
      id: input.publish_link_id,
      artifact_type: "guide" as const,
      artifact_id: "guide_1",
      published_artifact_id: input.published_artifact_id,
      slug: "existing-slug",
      visibility: "public" as const,
      status: "active" as const,
      published_at: "2026-06-10T00:00:00.000Z",
      revoked_at: null,
      public_url: "/p/existing-slug",
    })),
    find_guide_publish_status: vi.fn(async () => null),
    revoke_active_publish_link: vi.fn(async () => null),
    find_active_publish_link_by_slug: vi.fn(async () => null),
    find_public_asset_file: vi.fn(async () => null),
    ...overrides,
  };

  return repository;
};

describe("publish service", () => {
  it("publishes a draft guide as an immutable safe snapshot", async () => {
    const repository = create_repository();
    const service = build_publish_service(repository, {
      generate_slug: () => "abc123",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await service.publish_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    });

    expect(result.publish_link.slug).toBe("abc123");
    expect(result.published_artifact.version_number).toBe(1);
    expect(repository.create_published_artifact).toHaveBeenCalledWith(expect.objectContaining({
      organization_id: "organization_1",
      project_id: "project_1",
      artifact_type: "guide",
      artifact_id: "guide_1",
      version_number: 1,
      title: "Department guide",
      actor_org_user_id: "org_user_1",
    }));
    const snapshot = vi.mocked(repository.create_published_artifact).mock.calls[0]?.[0].snapshot_json;
    expect(snapshot).toEqual({
      artifact_type: "guide",
      guide: {
        id: "guide_1",
        title: "Department guide",
        description: "Set up departments.",
        source_capture_session_id: "capture_session_1",
        published_version: 1,
        published_at: "2026-06-10T00:00:00.000Z",
      },
      blocks: [
        {
          id: "block_1",
          block_type: "step",
          block_index: 1,
          content: null,
          step: {
            id: "step_1",
            title: "Navigate to Department List",
            body: "Open the Department module.",
          },
          source_asset: {
            id: "asset_1",
            asset_type: "screenshot",
            width: 1440,
            height: 900,
            page_title: "Department List",
            page_url: "https://example.test/departments",
            file: {
              id: "file_1",
              original_name: "departments.png",
              mime_type: "image/png",
              size_bytes: 123456,
            },
            file_url: "/api/v1/public/publish-links/abc123/assets/asset_1/file",
          },
        },
        {
          id: "block_2",
          block_type: "step",
          block_index: 2,
          content: null,
          step: {
            id: "step_2",
            title: "Click Add Department",
            body: null,
          },
          source_asset: null,
        },
        {
          id: "block_3",
          block_type: "header",
          block_index: 3,
          content: {
            title: "Department fields",
          },
          step: null,
          source_asset: null,
        },
      ],
    });
    expect(JSON.stringify(snapshot)).not.toContain("organization_id");
    expect(JSON.stringify(snapshot)).not.toContain("source_capture_event_id");
    expect(JSON.stringify(snapshot)).not.toContain("storage_key");
  });

  it("republishes with the same active slug but uses a new slug after revoke", async () => {
    const active_repository = create_repository({
      find_active_publish_link: vi.fn(async () => ({
        id: "publish_link_existing",
        artifact_type: "guide" as const,
        artifact_id: "guide_1",
        published_artifact_id: "published_artifact_1",
        slug: "existing-slug",
        visibility: "public" as const,
        status: "active" as const,
        published_at: "2026-06-10T00:00:00.000Z",
        revoked_at: null,
        public_url: "/p/existing-slug",
      })),
      next_published_artifact_version: vi.fn(async () => 2),
    });
    const service = build_publish_service(active_repository, {
      generate_slug: () => "new-slug",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await service.publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" });

    expect(result.publish_link.slug).toBe("existing-slug");
    expect(active_repository.create_publish_link).not.toHaveBeenCalled();
    expect(active_repository.update_publish_link_target).toHaveBeenCalledWith(expect.objectContaining({
      publish_link_id: "publish_link_existing",
      published_artifact_id: "published_artifact_1",
    }));

    const revoked_repository = create_repository();
    const revoked_service = build_publish_service(revoked_repository, {
      generate_slug: () => "after-revoke",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });
    const revoked_result = await revoked_service.publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" });

    expect(revoked_result.publish_link.slug).toBe("after-revoke");
    expect(revoked_repository.create_publish_link).toHaveBeenCalledWith(expect.objectContaining({
      slug: "after-revoke",
    }));
  });

  it("uses the same generated slug for the new link and snapshot asset URLs", async () => {
    const repository = create_repository();
    const slugs = ["snapshot-slug", "link-slug"];
    const service = build_publish_service(repository, {
      generate_slug: () => slugs.shift() ?? "unexpected-slug",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await service.publish_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    });
    const snapshot = vi.mocked(repository.create_published_artifact).mock.calls[0]?.[0].snapshot_json;

    expect(result.publish_link.slug).toBe("snapshot-slug");
    if (!snapshot) {
      throw new Error("Expected snapshot to be created");
    }
    expect(snapshot.blocks[0]?.source_asset?.file_url)
      .toBe(`/api/v1/public/publish-links/${result.publish_link.slug}/assets/asset_1/file`);
  });

  it("rejects missing archived and empty guides", async () => {
    await expect(build_publish_service(create_repository({
      project_exists: vi.fn(async () => false),
    })).publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" })).rejects.toBeInstanceOf(ProjectNotFoundError);

    await expect(build_publish_service(create_repository({
      find_guide_detail: vi.fn(async () => null),
    })).publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" })).rejects.toBeInstanceOf(GuideNotFoundError);

    await expect(build_publish_service(create_repository({
      find_guide_detail: vi.fn(async () => ({
        ...guide_detail,
        guide: { ...guide_detail.guide, status: "archived" as const },
      })),
    })).publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" })).rejects.toBeInstanceOf(GuideNotPublishableError);

    await expect(build_publish_service(create_repository({
      find_guide_detail: vi.fn(async () => ({
        ...guide_detail,
        guide_blocks: [],
      })),
    })).publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" })).rejects.toBeInstanceOf(GuideHasNoPublishableBlocksError);
  });

  it("reads status revokes active links and resolves public snapshots", async () => {
    const repository = create_repository({
      find_guide_publish_status: vi.fn(async () => ({
        publish_link: {
          id: "publish_link_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          published_artifact_id: "published_artifact_1",
          slug: "abc123",
          visibility: "public" as const,
          status: "active" as const,
          published_at: "2026-06-10T00:00:00.000Z",
          revoked_at: null,
          public_url: "/p/abc123",
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
        },
      })),
      revoke_active_publish_link: vi.fn(async () => ({
        id: "publish_link_1",
        artifact_type: "guide" as const,
        artifact_id: "guide_1",
        published_artifact_id: "published_artifact_1",
        slug: "abc123",
        visibility: "public" as const,
        status: "revoked" as const,
        published_at: "2026-06-10T00:00:00.000Z",
        revoked_at: "2026-06-10T01:00:00.000Z",
        public_url: "/p/abc123",
      })),
      find_active_publish_link_by_slug: vi.fn(async () => ({
        publish_link: {
          slug: "abc123",
          artifact_type: "guide" as const,
          visibility: "public" as const,
          status: "active" as const,
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
          snapshot: { artifact_type: "guide", blocks: [] },
        },
      })),
    });
    const service = build_publish_service(repository);

    await expect(service.get_guide_publish_status({ auth, project_id: "project_1", guide_id: "guide_1" }))
      .resolves.toMatchObject({ publish_link: { slug: "abc123" } });
    await expect(service.revoke_guide_publish_link({ auth, project_id: "project_1", guide_id: "guide_1" }))
      .resolves.toMatchObject({ publish_link: { status: "revoked" } });
    await expect(service.resolve_public_publish_link({ slug: "abc123" }))
      .resolves.toMatchObject({ publish_link: { slug: "abc123" } });
  });

  it("streams only assets referenced by the active snapshot", async () => {
    const repository = create_repository({
      find_public_asset_file: vi.fn(async () => ({
        file: {
          storage_provider: "local" as const,
          storage_key: "organizations/org/projects/project/capture-sessions/session/file.png",
          mime_type: "image/png",
        },
      })),
    });
    const file_storage = {
      get: vi.fn(async () => ({
        stream: Readable.from(Buffer.from("file")),
        size_bytes: 4,
      })),
    };
    const service = build_publish_service(repository, { file_storage });

    const file = await service.get_public_published_asset_file({
      slug: "abc123",
      capture_asset_id: "asset_1",
    });

    expect(file.mime_type).toBe("image/png");
    expect(file.size_bytes).toBe(4);
    expect(file_storage.get).toHaveBeenCalledWith({
      storage_key: "organizations/org/projects/project/capture-sessions/session/file.png",
    });

    await expect(build_publish_service(create_repository()).get_public_published_asset_file({
      slug: "abc123",
      capture_asset_id: "missing",
    })).rejects.toBeInstanceOf(PublishedAssetNotFoundError);
    await expect(build_publish_service(create_repository()).resolve_public_publish_link({
      slug: "missing",
    })).rejects.toBeInstanceOf(PublishLinkNotFoundError);
  });
});
