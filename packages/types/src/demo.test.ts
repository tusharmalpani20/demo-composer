import { describe, expect, it } from "vitest";
import {
  CreateDemoHotspotRequestSchema,
  CreateInteractiveDemoFromCaptureRequestSchema,
  CreateInteractiveDemoFromCaptureResponseSchema,
  DemoHotspotSchema,
  DemoSceneSchema,
  InteractiveDemoSchema,
  ReorderDemoHotspotsRequestSchema,
  ReorderDemoScenesRequestSchema,
  UpdateDemoHotspotRequestSchema,
  UpdateDemoSceneRequestSchema,
} from "./demo";

const interactive_demo = {
  id: "interactive_demo_1",
  organization_id: "org_1",
  project_id: "project_1",
  source_capture_session_id: "capture_session_1",
  title: "Department setup",
  description: null,
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const demo_scene = {
  id: "demo_scene_1",
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_id: "interactive_demo_1",
  source_capture_session_id: "capture_session_1",
  source_capture_event_id: "event_1",
  source_capture_asset_id: "asset_1",
  scene_index: 1,
  title: "Click Add Department",
  description: null,
  background_capture_asset_id: "asset_1",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const demo_hotspot = {
  id: "demo_hotspot_1",
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_id: "interactive_demo_1",
  demo_scene_id: "demo_scene_1",
  hotspot_type: "click",
  label: "Continue",
  content: null,
  x: 0.1,
  y: 0.2,
  width: 0.3,
  height: 0.1,
  target_scene_id: "demo_scene_2",
  hotspot_index: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

describe("interactive demo shared contracts", () => {
  it("parses interactive demo, scene and hotspot DTOs", () => {
    expect(InteractiveDemoSchema.parse(interactive_demo)).toMatchObject({
      id: "interactive_demo_1",
      status: "draft",
    });
    expect(DemoSceneSchema.parse(demo_scene)).toMatchObject({
      id: "demo_scene_1",
      background_capture_asset_id: "asset_1",
    });
    expect(DemoHotspotSchema.parse(demo_hotspot)).toMatchObject({
      id: "demo_hotspot_1",
      hotspot_type: "click",
      target_scene_id: "demo_scene_2",
    });
  });

  it("preserves route passthrough and trimming behavior", () => {
    expect(CreateInteractiveDemoFromCaptureRequestSchema.parse({
      title: " Demo ",
      description: null,
      ignored_client_field: true,
    })).toMatchObject({
      title: "Demo",
      description: null,
      ignored_client_field: true,
    });

    expect(UpdateDemoSceneRequestSchema.parse({
      title: "Scene",
      background_capture_asset_id: " asset_1 ",
      ignored_client_field: true,
    })).toMatchObject({
      title: "Scene",
      background_capture_asset_id: "asset_1",
      ignored_client_field: true,
    });

    expect(ReorderDemoScenesRequestSchema.parse({
      scene_ids: [" scene_1 "],
      ignored_client_field: true,
    })).toMatchObject({
      scene_ids: ["scene_1"],
      ignored_client_field: true,
    });

    expect(ReorderDemoHotspotsRequestSchema.parse({
      hotspot_ids: [" hotspot_1 "],
    })).toEqual({ hotspot_ids: ["hotspot_1"] });
  });

  it("keeps semantic hotspot box validation in the domain layer", () => {
    expect(CreateDemoHotspotRequestSchema.parse({
      hotspot_type: "click",
      x: 2,
      y: 0.2,
      width: 0,
      height: 0.1,
      target_scene_id: " scene_2 ",
    })).toMatchObject({
      hotspot_type: "click",
      x: 2,
      width: 0,
      target_scene_id: "scene_2",
    });

    expect(UpdateDemoHotspotRequestSchema.parse({
      x: Number.POSITIVE_INFINITY,
    })).toEqual({ x: Number.POSITIVE_INFINITY });
  });

  it("parses create-from-capture response envelopes", () => {
    expect(CreateInteractiveDemoFromCaptureResponseSchema.parse({
      interactive_demo,
      demo_scenes: [demo_scene],
      redirect_path: "/projects/project_1/interactive-demos/interactive_demo_1",
    })).toMatchObject({
      interactive_demo: { id: "interactive_demo_1" },
      demo_scenes: [{ id: "demo_scene_1" }],
      redirect_path: "/projects/project_1/interactive-demos/interactive_demo_1",
    });
  });
});
