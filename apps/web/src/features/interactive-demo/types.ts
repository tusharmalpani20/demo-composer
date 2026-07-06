import type {
  CaptureAssetType,
  DemoHotspotType,
  PublishArtifactType,
} from "@repo/constants";
import type {
  CreateDemoHotspotInput,
  CreateInteractiveDemoFromCaptureResponse,
  DemoHotspot,
  DemoScene,
  InteractiveDemoDetailResponse,
  InteractiveDemoHotspotCreateResponse,
  InteractiveDemoHotspotListResponse,
  InteractiveDemoHotspotReorderResponse,
  InteractiveDemoHotspotUpdateResponse,
  InteractiveDemo,
  InteractiveDemoSceneListResponse,
  InteractiveDemoSceneReorderResponse,
  InteractiveDemoSceneUpdateResponse,
  ProjectInteractiveDemoListResponse,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
} from "@repo/types/demo";

export type {
  CreateDemoHotspotInput,
  CreateInteractiveDemoFromCaptureResponse,
  DemoHotspot,
  DemoHotspotType,
  DemoScene,
  InteractiveDemo,
  InteractiveDemoDetailResponse,
  InteractiveDemoHotspotCreateResponse,
  InteractiveDemoHotspotListResponse,
  InteractiveDemoHotspotReorderResponse,
  InteractiveDemoHotspotUpdateResponse,
  InteractiveDemoSceneListResponse,
  InteractiveDemoSceneReorderResponse,
  InteractiveDemoSceneUpdateResponse,
  ProjectInteractiveDemoListResponse,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
};

export type PublishedInteractiveDemoSnapshotAsset = {
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

export type PublishedInteractiveDemoSnapshotHotspot = {
  id: string;
  hotspot_type: DemoHotspotType;
  label: string | null;
  content: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  target_scene_id: string | null;
  hotspot_index: number;
};

export type PublishedInteractiveDemoSnapshotScene = {
  id: string;
  scene_index: number;
  title: string | null;
  description: string | null;
  background_asset: PublishedInteractiveDemoSnapshotAsset;
  hotspots: PublishedInteractiveDemoSnapshotHotspot[];
};

export type PublishedInteractiveDemoSnapshot = {
  artifact_type: Extract<PublishArtifactType, "interactive_demo">;
  schema_version: 1;
  interactive_demo: {
    id: string;
    title: string;
    description: string | null;
    source_capture_session_id: string | null;
    published_version: number;
    published_at: string;
  };
  scenes: PublishedInteractiveDemoSnapshotScene[];
};
