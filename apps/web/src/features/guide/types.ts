import type {
  CaptureAssetType,
  GuideBlockType,
  PublishArtifactType,
  PublishLinkStatus,
  PublishVisibility,
} from "@repo/constants";
import type { ProjectCaptureAssetListResponse } from "@repo/types/capture";
import type {
  CreateGuideBlockInput,
  Guide,
  GuideBlock,
  GuideBlockContent,
  GuideDetail,
  GuideMarkdownExport,
  GuideScreenshotAnnotation,
  GuideSourceCaptureAsset,
  GuideStatus,
  GuideStep,
  UpdateGuideBlockAnnotationsInput,
  UpdateGuideBlockInput,
  UpdateGuideBlockScreenshotInput,
  UploadGuideBlockScreenshotResponse,
} from "@repo/types/guide";

export type {
  CreateGuideBlockInput,
  Guide,
  GuideBlock,
  GuideBlockContent,
  GuideBlockType,
  GuideDetail,
  GuideMarkdownExport,
  GuideScreenshotAnnotation,
  GuideSourceCaptureAsset,
  GuideStatus,
  GuideStep,
  UpdateGuideBlockAnnotationsInput,
  UpdateGuideBlockInput,
  UpdateGuideBlockScreenshotInput,
  UploadGuideBlockScreenshotResponse,
};

export type PublishedGuideSnapshotAsset = {
  id: string;
  asset_type: CaptureAssetType;
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

export type PublishedGuideSnapshotBlock = {
  id: string;
  block_type: GuideBlockType;
  block_index: number;
  content?: GuideBlockContent | null;
  step: {
    id: string;
    title: string;
    body: string | null;
  } | null;
  source_asset: PublishedGuideSnapshotAsset | null;
};

export type ProjectScreenshotAssetListResponse = ProjectCaptureAssetListResponse;

export type UploadGuideBlockScreenshotInput = {
  file: File;
  width?: number;
  height?: number;
  devicePixelRatio?: number;
  pageUrl?: string;
  pageTitle?: string;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
};

export type PublishedGuideSnapshot = {
  artifact_type: Extract<PublishArtifactType, "guide">;
  guide: {
    id: string;
    title: string;
    description: string | null;
    source_capture_session_id: string | null;
    published_version: number;
    published_at: string;
  };
  blocks: PublishedGuideSnapshotBlock[];
};

export type GuidePublishVisibility = PublishVisibility;

export type PublicPublishLink = {
  slug: string;
  artifact_type: PublishArtifactType;
  visibility: GuidePublishVisibility;
  expires_at: string | null;
  status: PublishLinkStatus;
  password_protected: boolean;
};

export type PublicPublishedArtifact = {
  id: string;
  artifact_type: PublishArtifactType;
  artifact_id: string;
  version_number: number;
  title: string;
  published_at: string;
  snapshot: unknown;
};

export type PublicPublishLinkResponse = {
  publish_link: PublicPublishLink;
  published_artifact: PublicPublishedArtifact;
};

export type GuidePublishLink = {
  id: string;
  artifact_type: PublishArtifactType;
  artifact_id: string;
  published_artifact_id: string;
  slug: string;
  visibility: GuidePublishVisibility;
  expires_at: string | null;
  status: PublishLinkStatus;
  published_at: string;
  revoked_at: string | null;
  public_url: string;
  password_protected: boolean;
};

export type GuidePublishedArtifact = {
  id: string;
  artifact_type: PublishArtifactType;
  artifact_id: string;
  version_number: number;
  title: string;
  published_at: string;
};

export type GuidePublishStatusResponse = {
  publish_link: GuidePublishLink | null;
  published_artifact: GuidePublishedArtifact | null;
};

export type GuidePublishResult = GuidePublishStatusResponse;

export type UpdateGuidePublishAccessInput = {
  visibility: GuidePublishVisibility;
  expires_at: string | null;
};

export type UpdateGuidePublishPasswordInput = {
  password: string | null;
};

export type GuideRevokePublishResult = {
  publish_link: {
    id: string;
    status: Extract<PublishLinkStatus, "revoked">;
    revoked_at: string;
  };
};
