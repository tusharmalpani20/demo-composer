export type GuideStatus = "draft" | "archived";
export type GuideBlockType = "step" | "header" | "paragraph" | "tip" | "alert" | "capture" | "divider" | "gif";

export type GuideBlockContent = {
  title?: string | null;
  body?: string | null;
  annotations?: GuideScreenshotAnnotation[] | null;
};

export type GuideScreenshotAnnotation = {
  id: string;
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Guide = {
  id: string;
  organization_id: string;
  project_id: string;
  source_capture_session_id: string | null;
  title: string;
  description: string | null;
  status: GuideStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type GuideStep = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_id: string;
  guide_block_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  title: string;
  body: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type GuideBlock = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  selected_capture_asset_id: string | null;
  screenshot_hidden: boolean;
  display_capture_asset_id: string | null;
  block_type: GuideBlockType;
  content: GuideBlockContent | null;
  block_index: number;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  step: GuideStep | null;
};

export type GuideSourceCaptureAsset = {
  id: string;
  capture_session_id: string;
  asset_type: "screenshot" | "html_snapshot" | "thumbnail" | "redacted_screenshot";
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: string;
  file_url: string;
  file: {
    id: string;
    original_name: string | null;
    mime_type: string;
    size_bytes: number;
  };
};

export type GuideDetail = {
  guide: Guide;
  guide_blocks: GuideBlock[];
  source_capture_assets: GuideSourceCaptureAsset[];
};

export type GuideMarkdownExport = {
  filename: string;
  markdown: string;
};

export type PublishedGuideSnapshotAsset = {
  id: string;
  asset_type: "screenshot" | "html_snapshot" | "thumbnail" | "redacted_screenshot";
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

export type CreateGuideBlockInput = {
  block_type: "step" | "header" | "paragraph" | "tip" | "alert" | "divider";
  position?: {
    placement: "before" | "after";
    guide_block_id: string;
  } | null;
  step?: {
    title?: string;
    body?: string | null;
  } | null;
  content?: GuideBlockContent | null;
};

export type UpdateGuideBlockInput = {
  content?: GuideBlockContent | null;
};

export type UpdateGuideBlockScreenshotInput = {
  capture_asset_id: string | null;
};

export type UpdateGuideBlockAnnotationsInput = {
  annotations: Array<{
    id?: string;
    type: "highlight";
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

export type ProjectScreenshotAssetListResponse = {
  capture_assets: GuideSourceCaptureAsset[];
};

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

export type UploadGuideBlockScreenshotResponse = {
  guide_block: GuideBlock;
  capture_asset: GuideSourceCaptureAsset;
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
  blocks: PublishedGuideSnapshotBlock[];
};

export type GuidePublishVisibility = "public" | "restricted";

export type PublicPublishLink = {
  slug: string;
  artifact_type: "guide" | "interactive_demo";
  visibility: GuidePublishVisibility;
  expires_at: string | null;
  status: "active" | "revoked";
  password_protected: boolean;
};

export type PublicPublishedArtifact = {
  id: string;
  artifact_type: "guide" | "interactive_demo";
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
  artifact_type: "guide" | "interactive_demo";
  artifact_id: string;
  published_artifact_id: string;
  slug: string;
  visibility: GuidePublishVisibility;
  expires_at: string | null;
  status: "active" | "revoked";
  published_at: string;
  revoked_at: string | null;
  public_url: string;
  password_protected: boolean;
};

export type GuidePublishedArtifact = {
  id: string;
  artifact_type: "guide" | "interactive_demo";
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
    status: "revoked";
    revoked_at: string;
  };
};
