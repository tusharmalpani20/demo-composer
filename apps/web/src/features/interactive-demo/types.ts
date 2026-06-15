export type InteractiveDemo = {
  id: string;
  organization_id: string;
  project_id: string;
  source_capture_session_id: string | null;
  title: string;
  description: string | null;
  status: "draft" | "archived";
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type DemoScene = {
  id: string;
  organization_id: string;
  project_id: string;
  interactive_demo_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  scene_index: number;
  title: string | null;
  description: string | null;
  background_capture_asset_id: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type DemoHotspotType = "click" | "info" | "next";

export type DemoHotspot = {
  id: string;
  organization_id: string;
  project_id: string;
  interactive_demo_id: string;
  demo_scene_id: string;
  hotspot_type: DemoHotspotType;
  label: string | null;
  content: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  target_scene_id: string | null;
  hotspot_index: number;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type CreateInteractiveDemoFromCaptureResponse = {
  interactive_demo: InteractiveDemo;
  demo_scenes: DemoScene[];
  redirect_path: string;
};

export type UpdateInteractiveDemoInput = {
  title?: string;
  description?: string | null;
  status?: InteractiveDemo["status"];
};

export type UpdateDemoSceneInput = {
  title?: string | null;
  description?: string | null;
};

export type CreateDemoHotspotInput = {
  hotspot_type: DemoHotspotType;
  label?: string | null;
  content?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  target_scene_id?: string | null;
};

export type UpdateDemoHotspotInput = {
  hotspot_type?: DemoHotspotType;
  label?: string | null;
  content?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  target_scene_id?: string | null;
};

export type PublishedInteractiveDemoSnapshotAsset = {
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
  scenes: PublishedInteractiveDemoSnapshotScene[];
};
