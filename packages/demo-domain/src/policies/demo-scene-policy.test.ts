import { describe, expect, it } from "vitest";
import {
  EmptyDemoSceneOrderError,
  InvalidDemoSceneOrderError,
  InvalidDemoSceneReferenceError,
  assert_background_asset_exists,
  assert_demo_scene_order_result,
  normalize_demo_scene_ids,
} from "./demo-scene-policy";

describe("demo scene policy", () => {
  it("normalizes scene order and rejects empty or duplicate ids", () => {
    expect(normalize_demo_scene_ids([" scene_2 ", "scene_1"])).toEqual(["scene_2", "scene_1"]);
    expect(() => normalize_demo_scene_ids([])).toThrow(EmptyDemoSceneOrderError);
    expect(() => normalize_demo_scene_ids(["scene_1", " scene_1 "])).toThrow(InvalidDemoSceneOrderError);
  });

  it("validates repository reorder result coverage", () => {
    expect(() => assert_demo_scene_order_result(["scene_1"], [{ id: "scene_1" }])).not.toThrow();
    expect(() => assert_demo_scene_order_result(["scene_1", "scene_2"], [{ id: "scene_1" }]))
      .toThrow(InvalidDemoSceneOrderError);
  });

  it("validates background asset reference decisions without owning repository access", () => {
    expect(() => assert_background_asset_exists(null, false)).not.toThrow();
    expect(() => assert_background_asset_exists("asset_1", true)).not.toThrow();
    expect(() => assert_background_asset_exists("missing_asset", false))
      .toThrow(InvalidDemoSceneReferenceError);
  });
});
