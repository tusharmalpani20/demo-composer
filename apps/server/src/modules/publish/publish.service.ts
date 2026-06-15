import { createHash, randomBytes } from "node:crypto";
import type {
  GuideDetail,
  GuideScreenshotAnnotation,
  GuideSourceCaptureAsset,
} from "../guide/guide.service";
import type {
  DemoHotspot,
  DemoScene,
  InteractiveDemo,
} from "../interactive-demo/interactive-demo.service";
import {
  hash_public_link_password,
  verify_public_link_password,
} from "./public-link-password";

export type PublishAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type PublishArtifactType = "guide" | "interactive_demo";
export type PublishVisibility = "public" | "restricted";
export type PublishLinkStatus = "active" | "revoked";

export type PublishLink = {
  id: string;
  artifact_type: PublishArtifactType;
  artifact_id: string;
  published_artifact_id: string;
  slug: string;
  visibility: PublishVisibility;
  status: PublishLinkStatus;
  published_at: string;
  revoked_at: string | null;
  expires_at: string | null;
  password_protected: boolean;
  public_url: string;
};

export type PublishedArtifact = {
  id: string;
  artifact_type: PublishArtifactType;
  artifact_id: string;
  version_number: number;
  title: string;
  published_at: string;
};

export type GuidePublishResult = {
  publish_link: PublishLink;
  published_artifact: PublishedArtifact;
};

export type PublishStatus = {
  publish_link: PublishLink | null;
  published_artifact: PublishedArtifact | null;
};

export type GuidePublishStatus = PublishStatus;
export type InteractiveDemoPublishStatus = PublishStatus;
export type InteractiveDemoPublishResult = GuidePublishResult;
export type RevokedInteractiveDemoPublishResult = RevokedGuidePublishResult;

export type RevokedGuidePublishResult = {
  publish_link: PublishLink;
};

export type PublicPublishedArtifact = PublishedArtifact & {
  snapshot: unknown;
};

export type PublicPublishLink = Pick<
  PublishLink,
  "slug" | "artifact_type" | "visibility" | "status" | "expires_at" | "password_protected"
>;

export type PublicPublishResult = {
  publish_link: PublicPublishLink;
  published_artifact: PublicPublishedArtifact;
  publish_link_id?: string;
  password?: {
    hash: string;
    salt: string;
  } | null;
};

export type PublicViewerSession = {
  token: string;
  expires_at: string;
};

export type PublishedAssetFileRead = {
  stream: NodeJS.ReadableStream;
  mime_type: string;
  size_bytes: number;
};

export type PublishedGuideSnapshot = {
  artifact_type: "guide";
  guide: {
    id: string;
    title: string;
    description: string | null;
    source_capture_session_id: string | null;
    published_version: number;
    published_at: string;
  };
  blocks: Array<{
    id: string;
    block_type: string;
    block_index: number;
    content: {
      title?: string | null;
      body?: string | null;
      annotations?: GuideScreenshotAnnotation[] | null;
    } | null;
    step: {
      id: string;
      title: string;
      body: string | null;
    } | null;
    source_asset: {
      id: string;
      asset_type: string;
      width: number | null;
      height: number | null;
      page_title: string | null;
      page_url: string | null;
      file: {
        id: string;
        original_name: string | null;
        mime_type: string;
        size_bytes: number;
      };
      file_url: string;
    } | null;
  }>;
};

export type InteractiveDemoPublishDetail = {
  interactive_demo: InteractiveDemo;
  demo_scenes: DemoScene[];
  demo_hotspots: DemoHotspot[];
  source_capture_assets: GuideSourceCaptureAsset[];
};

export type PublishedInteractiveDemoSnapshot = {
  artifact_type: "interactive_demo";
  schema_version: 1;
  interactive_demo: {
    id: string;
    title: string;
    description: string | null;
    source_capture_session_id: string | null;
    published_version: number;
    published_at: string;
  };
  scenes: Array<{
    id: string;
    scene_index: number;
    title: string | null;
    description: string | null;
    background_asset: {
      id: string;
      asset_type: string;
      width: number | null;
      height: number | null;
      page_title: string | null;
      page_url: string | null;
      file: {
        id: string;
        original_name: string | null;
        mime_type: string;
        size_bytes: number;
      };
      file_url: string;
    };
    hotspots: Array<{
      id: string;
      hotspot_type: DemoHotspot["hotspot_type"];
      label: string | null;
      content: string | null;
      x: number;
      y: number;
      width: number;
      height: number;
      target_scene_id: string | null;
      hotspot_index: number;
    }>;
  }>;
};

export class PublishSlugConflictError extends Error {
  constructor() {
    super("Publish slug already exists");
  }
}

export type PublicAssetFile = {
  file: {
    storage_provider: "local" | "external";
    storage_key: string;
    mime_type: string;
  };
};

export type PublishRepository = {
  transaction: <Result>(work: (repository: PublishRepository) => Promise<Result>) => Promise<Result>;
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  find_guide_detail: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
  }) => Promise<GuideDetail | null>;
  find_interactive_demo_detail: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
  }) => Promise<InteractiveDemoPublishDetail | null>;
  find_active_publish_link: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
  }) => Promise<PublishLink | null>;
  next_published_artifact_version: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
  }) => Promise<number>;
  create_published_artifact: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    version_number: number;
    title: string;
    snapshot_json: PublishedGuideSnapshot | PublishedInteractiveDemoSnapshot;
    actor_org_user_id: string;
  }) => Promise<PublishedArtifact>;
  create_publish_link: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    published_artifact_id: string;
    slug: string;
    actor_org_user_id: string;
  }) => Promise<PublishLink>;
  update_publish_link_target: (input: {
    organization_id: string;
    project_id: string;
    publish_link_id: string;
    published_artifact_id: string;
  }) => Promise<PublishLink>;
  find_publish_status: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
  }) => Promise<PublishStatus | null>;
  revoke_active_publish_link: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    actor_org_user_id: string;
  }) => Promise<PublishLink | null>;
  update_publish_link_access: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    visibility: PublishVisibility;
    expires_at: string | null;
  }) => Promise<PublishStatus | null>;
  update_publish_link_password: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    password_hash: string | null;
    password_salt: string | null;
  }) => Promise<PublishStatus | null>;
  create_public_viewer_session: (input: {
    publish_link_id: string;
    token_hash: string;
    token: string;
    expires_at: string;
  }) => Promise<PublicViewerSession>;
  find_public_viewer_session_by_token_hash: (input: {
    token_hash: string;
    publish_link_slug: string;
  }) => Promise<{
    publish_link_id: string;
    expires_at: string;
    revoked_at: string | null;
  } | null>;
  touch_public_viewer_session: (input: {
    token_hash: string;
  }) => Promise<void>;
  revoke_public_viewer_sessions_for_publish_link: (input: {
    publish_link_id: string;
  }) => Promise<void>;
  find_active_publish_link_by_slug: (input: {
    slug: string;
  }) => Promise<PublicPublishResult | null>;
  find_public_asset_file: (input: {
    slug: string;
    capture_asset_id: string;
  }) => Promise<PublicAssetFile | null>;
};

export type PublishFileStorage = {
  get: (input: { storage_key: string }) => Promise<{
    stream: NodeJS.ReadableStream;
    size_bytes: number;
  }>;
};

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project was not found");
  }
}

export class GuideNotFoundError extends Error {
  constructor() {
    super("Guide was not found");
  }
}

export class InteractiveDemoNotFoundError extends Error {
  constructor() {
    super("Interactive demo was not found");
  }
}

export class InteractiveDemoHasNoPublishableScenesError extends Error {
  constructor() {
    super("Interactive demo has no publishable scenes");
  }
}

export class GuideNotPublishableError extends Error {
  constructor() {
    super("Guide is not publishable");
  }
}

export class GuideHasNoPublishableBlocksError extends Error {
  constructor() {
    super("Guide has no publishable blocks");
  }
}

export class InvalidPublishAccessSettingsError extends Error {
  constructor() {
    super("Invalid publish access settings");
  }
}

export class InvalidPublishPasswordSettingsError extends Error {
  constructor() {
    super("Invalid publish password settings");
  }
}

export class PublishLinkNotFoundError extends Error {
  constructor() {
    super("Publish link was not found");
  }
}

export class PublishLinkNotPublicError extends Error {
  constructor() {
    super("Publish link is not public");
  }
}

export class PublishLinkExpiredError extends Error {
  constructor() {
    super("Publish link has expired");
  }
}

export class PublishLinkPasswordRequiredError extends Error {
  constructor() {
    super("Publish link password is required");
  }
}

export class InvalidPublicViewerPasswordError extends Error {
  constructor() {
    super("Invalid public viewer password");
  }
}

export class PublishedAssetNotFoundError extends Error {
  constructor() {
    super("Published asset was not found");
  }
}

export class UnsupportedPublishedAssetStorageProviderError extends Error {
  constructor() {
    super("Published asset storage provider is not supported");
  }
}

const default_generate_slug = () => randomBytes(9).toString("base64url");
const default_generate_viewer_token = () => randomBytes(32).toString("base64url");
const hash_viewer_token = (token: string) => (
  createHash("sha256").update(token).digest("hex")
);

const assets_by_id = (assets: GuideSourceCaptureAsset[]) => new Map(
  assets.map((asset) => [asset.id, asset])
);

const source_asset_for_block = (
  block: GuideDetail["guide_blocks"][number],
  assets: Map<string, GuideSourceCaptureAsset>
) => {
  const source_capture_asset_id = block.display_capture_asset_id;

  return source_capture_asset_id ? assets.get(source_capture_asset_id) ?? null : null;
};

const public_publish_response = (result: PublicPublishResult): PublicPublishResult => ({
  publish_link: result.publish_link,
  published_artifact: result.published_artifact,
});

const build_snapshot = (input: {
  guide_detail: GuideDetail;
  version_number: number;
  published_at: string;
  slug: string;
}): PublishedGuideSnapshot => {
  const assets = assets_by_id(input.guide_detail.source_capture_assets);
  const sorted_blocks = [...input.guide_detail.guide_blocks]
    .sort((left, right) => left.block_index - right.block_index);

  return {
    artifact_type: "guide",
    guide: {
      id: input.guide_detail.guide.id,
      title: input.guide_detail.guide.title,
      description: input.guide_detail.guide.description,
      source_capture_session_id: input.guide_detail.guide.source_capture_session_id,
      published_version: input.version_number,
      published_at: input.published_at,
    },
    blocks: sorted_blocks.map((block) => {
      const source_asset = source_asset_for_block(block, assets);

      return {
        id: block.id,
        block_type: block.block_type,
        block_index: block.block_index,
        content: block.content,
        step: block.step
          ? {
            id: block.step.id,
            title: block.step.title,
            body: block.step.body,
          }
          : null,
        source_asset: source_asset
          ? {
            id: source_asset.id,
            asset_type: source_asset.asset_type,
            width: source_asset.width,
            height: source_asset.height,
            page_title: source_asset.page_title,
            page_url: source_asset.page_url,
            file: {
              id: source_asset.file.id,
              original_name: source_asset.file.original_name,
              mime_type: source_asset.file.mime_type,
              size_bytes: source_asset.file.size_bytes,
            },
            file_url: `/api/v1/public/publish-links/${input.slug}/assets/${source_asset.id}/file`,
          }
          : null,
      };
    }),
  };
};

const background_asset_for_scene = (
  scene: DemoScene,
  assets: Map<string, GuideSourceCaptureAsset>
) => (
  scene.background_capture_asset_id ? assets.get(scene.background_capture_asset_id) ?? null : null
);

const build_interactive_demo_snapshot = (input: {
  demo_detail: InteractiveDemoPublishDetail;
  version_number: number;
  published_at: string;
  slug: string;
}): PublishedInteractiveDemoSnapshot => {
  const assets = assets_by_id(input.demo_detail.source_capture_assets);
  const scene_ids = new Set(input.demo_detail.demo_scenes.map((scene) => scene.id));
  const hotspots_by_scene = input.demo_detail.demo_hotspots.reduce<Record<string, DemoHotspot[]>>((groups, hotspot) => {
    groups[hotspot.demo_scene_id] = [...(groups[hotspot.demo_scene_id] ?? []), hotspot];
    return groups;
  }, {});
  const scenes = [...input.demo_detail.demo_scenes]
    .sort((left, right) => left.scene_index - right.scene_index)
    .map((scene) => {
      const background_asset = background_asset_for_scene(scene, assets);

      if (!background_asset) {
        return null;
      }

      return {
        id: scene.id,
        scene_index: scene.scene_index,
        title: scene.title,
        description: scene.description,
        background_asset: {
          id: background_asset.id,
          asset_type: background_asset.asset_type,
          width: background_asset.width,
          height: background_asset.height,
          page_title: background_asset.page_title,
          page_url: background_asset.page_url,
          file: {
            id: background_asset.file.id,
            original_name: background_asset.file.original_name,
            mime_type: background_asset.file.mime_type,
            size_bytes: background_asset.file.size_bytes,
          },
          file_url: `/api/v1/public/publish-links/${input.slug}/assets/${background_asset.id}/file`,
        },
        hotspots: [...(hotspots_by_scene[scene.id] ?? [])]
          .sort((left, right) => left.hotspot_index - right.hotspot_index)
          .map((hotspot) => ({
            id: hotspot.id,
            hotspot_type: hotspot.hotspot_type,
            label: hotspot.label,
            content: hotspot.content,
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            target_scene_id: hotspot.target_scene_id && scene_ids.has(hotspot.target_scene_id)
              ? hotspot.target_scene_id
              : null,
            hotspot_index: hotspot.hotspot_index,
          })),
      };
    })
    .filter((scene): scene is NonNullable<typeof scene> => Boolean(scene));

  if (scenes.length === 0) {
    throw new InteractiveDemoHasNoPublishableScenesError();
  }

  return {
    artifact_type: "interactive_demo",
    schema_version: 1,
    interactive_demo: {
      id: input.demo_detail.interactive_demo.id,
      title: input.demo_detail.interactive_demo.title,
      description: input.demo_detail.interactive_demo.description,
      source_capture_session_id: input.demo_detail.interactive_demo.source_capture_session_id,
      published_version: input.version_number,
      published_at: input.published_at,
    },
    scenes,
  };
};

export const build_publish_service = (
  repository: PublishRepository,
  options: {
    generate_slug?: () => string;
    generate_viewer_token?: () => string;
    now?: () => Date;
    file_storage?: PublishFileStorage;
  } = {}
) => {
  const generate_slug = options.generate_slug ?? default_generate_slug;
  const generate_viewer_token = options.generate_viewer_token ?? default_generate_viewer_token;
  const now = options.now ?? (() => new Date());

  const ensure_project_exists = async (input: {
    organization_id: string;
    project_id: string;
  }) => {
    if (!await repository.project_exists(input)) {
      throw new ProjectNotFoundError();
    }
  };

  const publish_guide = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
  }) => {
    let last_error: unknown;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await repository.transaction(async (transactional_repository) => {
          const scope = {
            organization_id: input.auth.organization_id,
            project_id: input.project_id,
          };

          await ensure_project_exists(scope);

          const guide_detail = await transactional_repository.find_guide_detail({
            ...scope,
            guide_id: input.guide_id,
          });

          if (!guide_detail) {
            throw new GuideNotFoundError();
          }

          if (guide_detail.guide.status !== "draft") {
            throw new GuideNotPublishableError();
          }

          if (guide_detail.guide_blocks.length === 0) {
            throw new GuideHasNoPublishableBlocksError();
          }

          const existing_link = await transactional_repository.find_active_publish_link({
            ...scope,
            artifact_type: "guide",
            artifact_id: input.guide_id,
          });
          const version_number = await transactional_repository.next_published_artifact_version({
            ...scope,
            artifact_type: "guide",
            artifact_id: input.guide_id,
          });
          const slug = existing_link?.slug ?? generate_slug();
          const published_at = now().toISOString();
          const snapshot_json = build_snapshot({
            guide_detail,
            version_number,
            published_at,
            slug,
          });
          const published_artifact = await transactional_repository.create_published_artifact({
            ...scope,
            artifact_type: "guide",
            artifact_id: input.guide_id,
            version_number,
            title: guide_detail.guide.title,
            snapshot_json,
            actor_org_user_id: input.auth.actor_org_user_id,
          });
          const publish_link = existing_link
            ? await transactional_repository.update_publish_link_target({
              ...scope,
              publish_link_id: existing_link.id,
              published_artifact_id: published_artifact.id,
            })
            : await transactional_repository.create_publish_link({
              ...scope,
              artifact_type: "guide",
              artifact_id: input.guide_id,
              published_artifact_id: published_artifact.id,
              slug,
              actor_org_user_id: input.auth.actor_org_user_id,
            });

          return {
            publish_link,
            published_artifact,
          };
        });
      } catch (error) {
        if (!(error instanceof PublishSlugConflictError)) {
          throw error;
        }

        last_error = error;
      }
    }

    throw last_error;
  };

  const publish_interactive_demo = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }): Promise<InteractiveDemoPublishResult> => {
    let last_error: unknown;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await repository.transaction(async (transactional_repository) => {
          const scope = {
            organization_id: input.auth.organization_id,
            project_id: input.project_id,
          };

          await ensure_project_exists(scope);

          const demo_detail = await transactional_repository.find_interactive_demo_detail({
            ...scope,
            interactive_demo_id: input.interactive_demo_id,
          });

          if (!demo_detail) {
            throw new InteractiveDemoNotFoundError();
          }

          const existing_link = await transactional_repository.find_active_publish_link({
            ...scope,
            artifact_type: "interactive_demo",
            artifact_id: input.interactive_demo_id,
          });
          const version_number = await transactional_repository.next_published_artifact_version({
            ...scope,
            artifact_type: "interactive_demo",
            artifact_id: input.interactive_demo_id,
          });
          const slug = existing_link?.slug ?? generate_slug();
          const published_at = now().toISOString();
          const snapshot_json = build_interactive_demo_snapshot({
            demo_detail,
            version_number,
            published_at,
            slug,
          });
          const published_artifact = await transactional_repository.create_published_artifact({
            ...scope,
            artifact_type: "interactive_demo",
            artifact_id: input.interactive_demo_id,
            version_number,
            title: demo_detail.interactive_demo.title,
            snapshot_json,
            actor_org_user_id: input.auth.actor_org_user_id,
          });
          const publish_link = existing_link
            ? await transactional_repository.update_publish_link_target({
              ...scope,
              publish_link_id: existing_link.id,
              published_artifact_id: published_artifact.id,
            })
            : await transactional_repository.create_publish_link({
              ...scope,
              artifact_type: "interactive_demo",
              artifact_id: input.interactive_demo_id,
              published_artifact_id: published_artifact.id,
              slug,
              actor_org_user_id: input.auth.actor_org_user_id,
            });

          return {
            publish_link,
            published_artifact,
          };
        });
      } catch (error) {
        if (!(error instanceof PublishSlugConflictError)) {
          throw error;
        }

        last_error = error;
      }
    }

    throw last_error;
  };

  const get_guide_publish_status = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    return await repository.find_publish_status({
      ...scope,
      artifact_type: "guide",
      artifact_id: input.guide_id,
    }) ?? {
      publish_link: null,
      published_artifact: null,
    };
  };

  const get_interactive_demo_publish_status = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }): Promise<InteractiveDemoPublishStatus> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    return await repository.find_publish_status({
      ...scope,
      artifact_type: "interactive_demo",
      artifact_id: input.interactive_demo_id,
    }) ?? {
      publish_link: null,
      published_artifact: null,
    };
  };

  const revoke_guide_publish_link = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const publish_link = await repository.revoke_active_publish_link({
      ...scope,
      artifact_type: "guide",
      artifact_id: input.guide_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!publish_link) {
      throw new PublishLinkNotFoundError();
    }

    await repository.revoke_public_viewer_sessions_for_publish_link({
      publish_link_id: publish_link.id,
    });

    return { publish_link };
  };

  const revoke_interactive_demo_publish_link = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }): Promise<RevokedInteractiveDemoPublishResult> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const publish_link = await repository.revoke_active_publish_link({
      ...scope,
      artifact_type: "interactive_demo",
      artifact_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!publish_link) {
      throw new PublishLinkNotFoundError();
    }

    await repository.revoke_public_viewer_sessions_for_publish_link({
      publish_link_id: publish_link.id,
    });

    return { publish_link };
  };

  const update_guide_publish_access = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
    visibility: PublishVisibility;
    expires_at: string | null;
  }) => {
    if (!["public", "restricted"].includes(input.visibility)) {
      throw new InvalidPublishAccessSettingsError();
    }

    if (input.expires_at !== null && !Number.isFinite(new Date(input.expires_at).getTime())) {
      throw new InvalidPublishAccessSettingsError();
    }

    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const result = await repository.update_publish_link_access({
      ...scope,
      artifact_type: "guide",
      artifact_id: input.guide_id,
      visibility: input.visibility,
      expires_at: input.expires_at,
    });

    if (!result) {
      throw new PublishLinkNotFoundError();
    }

    return result;
  };

  const update_interactive_demo_publish_access = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
    visibility: PublishVisibility;
    expires_at: string | null;
  }): Promise<InteractiveDemoPublishStatus> => {
    if (!["public", "restricted"].includes(input.visibility)) {
      throw new InvalidPublishAccessSettingsError();
    }

    if (input.expires_at !== null && !Number.isFinite(new Date(input.expires_at).getTime())) {
      throw new InvalidPublishAccessSettingsError();
    }

    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const result = await repository.update_publish_link_access({
      ...scope,
      artifact_type: "interactive_demo",
      artifact_id: input.interactive_demo_id,
      visibility: input.visibility,
      expires_at: input.expires_at,
    });

    if (!result) {
      throw new PublishLinkNotFoundError();
    }

    return result;
  };

  const validate_publish_password = (password: string | null) => {
    if (password === null) {
      return;
    }

    if (
      typeof password !== "string"
      || password.trim().length < 8
      || password.length > 128
    ) {
      throw new InvalidPublishPasswordSettingsError();
    }
  };

  const update_guide_publish_password = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
    password: string | null;
  }) => {
    validate_publish_password(input.password);

    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const password_hash = input.password === null
      ? null
      : await hash_public_link_password(input.password);

    const result = await repository.update_publish_link_password({
      ...scope,
      artifact_type: "guide",
      artifact_id: input.guide_id,
      password_hash: password_hash?.hash ?? null,
      password_salt: password_hash?.salt ?? null,
    });

    if (!result?.publish_link) {
      throw new PublishLinkNotFoundError();
    }

    await repository.revoke_public_viewer_sessions_for_publish_link({
      publish_link_id: result.publish_link.id,
    });

    return result;
  };

  const update_interactive_demo_publish_password = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
    password: string | null;
  }): Promise<InteractiveDemoPublishStatus> => {
    validate_publish_password(input.password);

    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const password_hash = input.password === null
      ? null
      : await hash_public_link_password(input.password);

    const result = await repository.update_publish_link_password({
      ...scope,
      artifact_type: "interactive_demo",
      artifact_id: input.interactive_demo_id,
      password_hash: password_hash?.hash ?? null,
      password_salt: password_hash?.salt ?? null,
    });

    if (!result?.publish_link) {
      throw new PublishLinkNotFoundError();
    }

    await repository.revoke_public_viewer_sessions_for_publish_link({
      publish_link_id: result.publish_link.id,
    });

    return result;
  };

  const assert_public_access = (publish_link: PublicPublishLink) => {
    if (publish_link.visibility !== "public") {
      throw new PublishLinkNotPublicError();
    }

    if (publish_link.expires_at && new Date(publish_link.expires_at).getTime() <= now().getTime()) {
      throw new PublishLinkExpiredError();
    }
  };

  const assert_viewer_access = async (input: {
    result: PublicPublishResult;
    viewer_token?: string;
  }) => {
    if (!input.result.publish_link.password_protected) {
      return;
    }

    if (!input.viewer_token) {
      throw new PublishLinkPasswordRequiredError();
    }

    const token_hash = hash_viewer_token(input.viewer_token);
    const session = await repository.find_public_viewer_session_by_token_hash({
      token_hash,
      publish_link_slug: input.result.publish_link.slug,
    });

    if (
      !session
      || session.revoked_at
      || new Date(session.expires_at).getTime() <= now().getTime()
    ) {
      throw new PublishLinkPasswordRequiredError();
    }

    await repository.touch_public_viewer_session({ token_hash });
  };

  const resolve_public_publish_link = async (input: {
    slug: string;
    viewer_token?: string;
  }) => {
    const result = await repository.find_active_publish_link_by_slug(input);

    if (!result) {
      throw new PublishLinkNotFoundError();
    }

    assert_public_access(result.publish_link);
    await assert_viewer_access({ result, viewer_token: input.viewer_token });

    return public_publish_response(result);
  };

  const create_public_publish_viewer_session = async (input: {
    slug: string;
    password: string;
  }): Promise<PublicViewerSession> => {
    const result = await repository.find_active_publish_link_by_slug({ slug: input.slug });

    if (!result) {
      throw new PublishLinkNotFoundError();
    }

    assert_public_access(result.publish_link);

    if (!result.publish_link.password_protected) {
      return {
        token: "",
        expires_at: now().toISOString(),
      };
    }

    if (!result.password || !result.publish_link_id) {
      throw new PublishLinkPasswordRequiredError();
    }

    const valid_password = await verify_public_link_password(
      input.password,
      result.password.hash,
      result.password.salt
    );

    if (!valid_password) {
      throw new InvalidPublicViewerPasswordError();
    }

    const token = generate_viewer_token();
    const expires_at = new Date(now().getTime() + (12 * 60 * 60 * 1000)).toISOString();

    return await repository.create_public_viewer_session({
      publish_link_id: result.publish_link_id,
      token_hash: hash_viewer_token(token),
      token,
      expires_at,
    });
  };

  const get_public_published_asset_file = async (input: {
    slug: string;
    capture_asset_id: string;
    viewer_token?: string;
  }): Promise<PublishedAssetFileRead> => {
    if (!options.file_storage) {
      throw new PublishedAssetNotFoundError();
    }

    const public_result = await repository.find_active_publish_link_by_slug({ slug: input.slug });

    if (!public_result) {
      throw new PublishedAssetNotFoundError();
    }

    assert_public_access(public_result.publish_link);
    await assert_viewer_access({ result: public_result, viewer_token: input.viewer_token });

    const asset_file = await repository.find_public_asset_file(input);

    if (!asset_file) {
      throw new PublishedAssetNotFoundError();
    }

    if (asset_file.file.storage_provider !== "local") {
      throw new UnsupportedPublishedAssetStorageProviderError();
    }

    const stored_file = await options.file_storage.get({
      storage_key: asset_file.file.storage_key,
    });

    return {
      stream: stored_file.stream,
      size_bytes: stored_file.size_bytes,
      mime_type: asset_file.file.mime_type,
    };
  };

  return {
    publish_guide,
    publish_interactive_demo,
    get_guide_publish_status,
    get_interactive_demo_publish_status,
    revoke_guide_publish_link,
    revoke_interactive_demo_publish_link,
    update_guide_publish_access,
    update_interactive_demo_publish_access,
    update_guide_publish_password,
    update_interactive_demo_publish_password,
    resolve_public_publish_link,
    create_public_publish_viewer_session,
    get_public_published_asset_file,
  };
};
