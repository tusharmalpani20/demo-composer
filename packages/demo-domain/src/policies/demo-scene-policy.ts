import {
  EmptyDemoSceneOrderError,
  InvalidDemoSceneOrderError,
  InvalidDemoSceneReferenceError,
} from "../errors/demo-domain-error";

export {
  EmptyDemoSceneOrderError,
  InvalidDemoSceneOrderError,
  InvalidDemoSceneReferenceError,
};

export const normalize_demo_scene_ids = (scene_ids: string[]) => {
  const normalized = scene_ids.map((id) => id.trim());

  if (normalized.length === 0) {
    throw new EmptyDemoSceneOrderError();
  }

  if (new Set(normalized).size !== normalized.length) {
    throw new InvalidDemoSceneOrderError();
  }

  return normalized;
};

export const assert_demo_scene_order_result = (
  scene_ids: string[],
  scenes: Array<{ id: string }>
) => {
  if (scenes.length !== scene_ids.length) {
    throw new InvalidDemoSceneOrderError();
  }
};

export const assert_background_asset_exists = (
  capture_asset_id: string | null | undefined,
  exists: boolean
) => {
  if (capture_asset_id && !exists) {
    throw new InvalidDemoSceneReferenceError();
  }
};
