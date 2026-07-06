import { describe, expect, it } from "vitest";
import {
  EmptyDemoSceneUpdateError,
  EmptyInteractiveDemoUpdateError,
  normalize_create_demo_input,
  normalize_create_scene_input,
  normalize_update_demo_input,
  normalize_update_scene_input,
} from "./demo-input-policy";

describe("demo input policy", () => {
  it("normalizes create and update demo input", () => {
    expect(normalize_create_demo_input({
      title: " Demo ",
      description: " ",
      source_capture_session_id: " session_1 ",
    })).toEqual({
      title: "Demo",
      description: null,
      source_capture_session_id: "session_1",
    });

    expect(normalize_update_demo_input({
      title: " Updated ",
      description: " ",
      status: "archived",
    })).toEqual({
      title: "Updated",
      description: null,
      status: "archived",
    });

    expect(() => normalize_update_demo_input({})).toThrow(EmptyInteractiveDemoUpdateError);
  });

  it("normalizes create and update scene input", () => {
    expect(normalize_create_scene_input({
      title: " ",
      description: " Details ",
      background_capture_asset_id: " asset_1 ",
      source_capture_session_id: " session_1 ",
      source_capture_event_id: " event_1 ",
      source_capture_asset_id: " asset_1 ",
    })).toEqual({
      title: null,
      description: "Details",
      background_capture_asset_id: "asset_1",
      source_capture_session_id: "session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
    });

    expect(normalize_update_scene_input({
      title: " ",
      background_capture_asset_id: " ",
    })).toEqual({
      title: null,
      background_capture_asset_id: null,
    });

    expect(() => normalize_update_scene_input({})).toThrow(EmptyDemoSceneUpdateError);
  });
});
