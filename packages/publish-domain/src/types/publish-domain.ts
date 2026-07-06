import type { PublishArtifactType } from "@repo/constants";
import type {
  DemoHotspot,
  DemoScene,
  InteractiveDemo,
} from "@repo/types/demo";
import type {
  Guide,
  GuideBlock,
  GuideSourceCaptureAsset,
} from "@repo/types/guide";

export type PublishTargetType = PublishArtifactType;

export type PublishAuthScope = {
  organization_id: string;
  project_id: string;
  actor_org_user_id: string;
};

export type PublishClock = {
  now: Date;
};

export type PublishSlugCandidate = {
  existing_link: { slug: string } | null;
  generated_slug: string;
};

export type GuidePublishSourceDetail = {
  guide: Guide;
  guide_blocks: GuideBlock[];
  source_capture_assets: GuideSourceCaptureAsset[];
};

export type InteractiveDemoPublishSourceDetail = {
  interactive_demo: InteractiveDemo;
  demo_scenes: DemoScene[];
  demo_hotspots: DemoHotspot[];
  source_capture_assets: GuideSourceCaptureAsset[];
};

export type PublishViewerSessionRecord = {
  publish_link_id: string;
  expires_at: string;
  revoked_at: string | null;
};
