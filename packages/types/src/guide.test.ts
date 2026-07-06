import { describe, expect, it } from "vitest";
import {
  CreateGuideBlockRequestSchema,
  CreateGuideFromCaptureRequestSchema,
  GuideBlockParamsSchema,
  GuideDetailSchema,
  ReorderGuideBlocksRequestSchema,
  UpdateGuideBlockAnnotationsRequestSchema,
  UploadGuideBlockScreenshotResponseSchema,
} from "./guide";

const guide = {
  id: "guide_1",
  organization_id: "org_1",
  project_id: "project_1",
  source_capture_session_id: "session_1",
  title: "Guide",
  description: null,
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const step = {
  id: "step_1",
  organization_id: "org_1",
  project_id: "project_1",
  guide_id: "guide_1",
  guide_block_id: "block_1",
  source_capture_session_id: "session_1",
  source_capture_event_id: "event_1",
  source_capture_asset_id: "asset_1",
  title: "Click Save",
  body: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const block = {
  id: "block_1",
  organization_id: "org_1",
  project_id: "project_1",
  guide_id: "guide_1",
  source_capture_session_id: "session_1",
  source_capture_event_id: "event_1",
  source_capture_asset_id: "asset_1",
  selected_capture_asset_id: null,
  screenshot_hidden: false,
  display_capture_asset_id: "asset_1",
  block_type: "step",
  content: {
    annotations: [{
      id: "ann_1",
      type: "highlight",
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    }],
  },
  block_index: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
  step,
};

const source_asset = {
  id: "asset_1",
  capture_session_id: "session_1",
  asset_type: "screenshot",
  width: 1280,
  height: 720,
  device_pixel_ratio: 1,
  page_url: "https://example.test",
  page_title: "Example",
  captured_at: "2026-07-07T00:00:00.000Z",
  file_url: "/api/v1/projects/project_1/capture-sessions/session_1/assets/asset_1/file",
  file: {
    id: "file_1",
    original_name: "screen.png",
    mime_type: "image/png",
    size_bytes: 100,
  },
};

describe("guide shared contracts", () => {
  it("parses guide detail DTOs with block, step, screenshot and annotation data", () => {
    expect(GuideDetailSchema.parse({
      guide,
      guide_blocks: [block],
      source_capture_assets: [source_asset],
    })).toMatchObject({
      guide: { id: "guide_1" },
      guide_blocks: [{ id: "block_1", step: { id: "step_1" } }],
      source_capture_assets: [{ id: "asset_1" }],
    });
  });

  it("preserves passthrough request behavior while validating guide literals", () => {
    expect(CreateGuideFromCaptureRequestSchema.parse({
      title: " Guide ",
      description: null,
      selected_capture_event_ids: [" event_1 "],
      ignored_client_field: true,
    })).toMatchObject({
      title: "Guide",
      selected_capture_event_ids: ["event_1"],
      ignored_client_field: true,
    });

    expect(CreateGuideBlockRequestSchema.parse({
      block_type: "header",
      content: { title: "Intro" },
      extra: "kept",
    })).toMatchObject({ block_type: "header", extra: "kept" });

    expect(() => CreateGuideBlockRequestSchema.parse({ block_type: "capture" }))
      .toThrow();
  });

  it("validates params, reorder input, annotations, and upload response composition", () => {
    expect(GuideBlockParamsSchema.parse({
      project_id: " project_1 ",
      guide_id: " guide_1 ",
      guide_block_id: " block_1 ",
    })).toEqual({
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
    });

    expect(ReorderGuideBlocksRequestSchema.parse({
      block_ids: [" block_1 "],
    })).toEqual({ block_ids: ["block_1"] });

    expect(() => UpdateGuideBlockAnnotationsRequestSchema.parse({
      annotations: Array.from({ length: 11 }, (_, index) => ({
        id: `ann_${index}`,
        type: "highlight",
        x: 0,
        y: 0,
        width: 0.1,
        height: 0.1,
      })),
    })).toThrow();

    expect(UploadGuideBlockScreenshotResponseSchema.parse({
      guide_block: block,
      capture_asset: {
        ...source_asset,
        organization_id: "org_1",
        project_id: "project_1",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-07-07T00:00:00.000Z",
        updated_at: "2026-07-07T00:00:00.000Z",
        file: {
          ...source_asset.file,
          storage_provider: "local",
          storage_key: "captures/org/project/session/asset_1.png",
          checksum_sha256: null,
          metadata: null,
        },
      },
    }).capture_asset.file_url).toContain("/assets/asset_1/file");
  });
});
