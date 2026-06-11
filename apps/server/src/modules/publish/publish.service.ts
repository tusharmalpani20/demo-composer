import { randomBytes } from "node:crypto";
import type { GuideDetail, GuideSourceCaptureAsset } from "../guide/guide.service";

export type PublishAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type PublishArtifactType = "guide" | "interactive_demo";
export type PublishVisibility = "public";
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

export type GuidePublishStatus = {
  publish_link: PublishLink | null;
  published_artifact: PublishedArtifact | null;
};

export type RevokedGuidePublishResult = {
  publish_link: PublishLink;
};

export type PublicPublishedArtifact = PublishedArtifact & {
  snapshot: unknown;
};

export type PublicPublishLink = Pick<PublishLink, "slug" | "artifact_type" | "visibility" | "status">;

export type PublicPublishResult = {
  publish_link: PublicPublishLink;
  published_artifact: PublicPublishedArtifact;
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
  find_active_publish_link: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: "guide";
    artifact_id: string;
  }) => Promise<PublishLink | null>;
  next_published_artifact_version: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: "guide";
    artifact_id: string;
  }) => Promise<number>;
  create_published_artifact: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: "guide";
    artifact_id: string;
    version_number: number;
    title: string;
    snapshot_json: PublishedGuideSnapshot;
    actor_org_user_id: string;
  }) => Promise<PublishedArtifact>;
  create_publish_link: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: "guide";
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
  find_guide_publish_status: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
  }) => Promise<GuidePublishStatus | null>;
  revoke_active_publish_link: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    actor_org_user_id: string;
  }) => Promise<PublishLink | null>;
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

export class PublishLinkNotFoundError extends Error {
  constructor() {
    super("Publish link was not found");
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

const assets_by_id = (assets: GuideSourceCaptureAsset[]) => new Map(
  assets.map((asset) => [asset.id, asset])
);

const source_asset_for_block = (
  block: GuideDetail["guide_blocks"][number],
  assets: Map<string, GuideSourceCaptureAsset>
) => {
  const source_capture_asset_id = block.source_capture_asset_id ?? block.step?.source_capture_asset_id ?? null;

  return source_capture_asset_id ? assets.get(source_capture_asset_id) ?? null : null;
};

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

export const build_publish_service = (
  repository: PublishRepository,
  options: {
    generate_slug?: () => string;
    now?: () => Date;
    file_storage?: PublishFileStorage;
  } = {}
) => {
  const generate_slug = options.generate_slug ?? default_generate_slug;
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

    return await repository.find_guide_publish_status({
      ...scope,
      guide_id: input.guide_id,
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
      guide_id: input.guide_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!publish_link) {
      throw new PublishLinkNotFoundError();
    }

    return { publish_link };
  };

  const resolve_public_publish_link = async (input: {
    slug: string;
  }) => {
    const result = await repository.find_active_publish_link_by_slug(input);

    if (!result) {
      throw new PublishLinkNotFoundError();
    }

    return result;
  };

  const get_public_published_asset_file = async (input: {
    slug: string;
    capture_asset_id: string;
  }): Promise<PublishedAssetFileRead> => {
    if (!options.file_storage) {
      throw new PublishedAssetNotFoundError();
    }

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
    get_guide_publish_status,
    revoke_guide_publish_link,
    resolve_public_publish_link,
    get_public_published_asset_file,
  };
};
