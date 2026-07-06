import { describe, expect, it } from "vitest";
import {
  InvalidGuideBlockContentError,
  InvalidGuideBlockOrderError,
  InvalidGuideBlockScreenshotError,
  assert_guide_block_order_covers_active_blocks,
  normalize_create_guide_block_input,
  normalize_guide_block_ids,
  normalize_update_guide_block_annotations_input,
  normalize_update_guide_block_screenshot_input,
} from "./guide-block-policy";
import type { GuideBlock } from "@repo/types/guide";

const step_block: GuideBlock = {
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
    title: "kept",
    annotations: [{ id: "ann_1", type: "highlight", x: 0, y: 0, width: 0.1, height: 0.1 }],
  },
  block_index: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
  step: null,
};

describe("guide block policy", () => {
  it("normalizes create block content by block type", () => {
    expect(normalize_create_guide_block_input({
      block_type: "step",
      position: { placement: "after", guide_block_id: " block_1 " },
      step: { title: " New step ", body: " " },
    })).toEqual({
      block_type: "step",
      position: { placement: "after", guide_block_id: "block_1" },
      step: { title: "New step", body: null },
    });

    expect(normalize_create_guide_block_input({
      block_type: "paragraph",
      content: { body: " Body " },
    })).toEqual({
      block_type: "paragraph",
      content: { body: "Body" },
    });

    expect(() => normalize_create_guide_block_input({
      block_type: "paragraph",
      content: { title: "No", body: "Body" },
    })).toThrow(InvalidGuideBlockContentError);
  });

  it("validates full block reorder sets", () => {
    expect(normalize_guide_block_ids([" block_2 ", "block_1"])).toEqual(["block_2", "block_1"]);
    expect(() => normalize_guide_block_ids(["block_1", " block_1 "])).toThrow(InvalidGuideBlockOrderError);

    expect(() => assert_guide_block_order_covers_active_blocks(["block_1"], [
      { id: "block_1" },
      { id: "block_2" },
    ])).toThrow(InvalidGuideBlockOrderError);
  });

  it("normalizes screenshot selection and validates annotations with injected ids", () => {
    expect(normalize_update_guide_block_screenshot_input({
      capture_asset_id: " ",
    })).toEqual({
      selected_capture_asset_id: null,
      screenshot_hidden: true,
    });

    expect(normalize_update_guide_block_screenshot_input({
      capture_asset_id: " asset_2 ",
    })).toEqual({
      selected_capture_asset_id: "asset_2",
      screenshot_hidden: false,
    });

    expect(normalize_update_guide_block_annotations_input(step_block, {
      annotations: [
        { id: "ann_1", type: "highlight", x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
        { type: "highlight", x: 0, y: 0, width: 1, height: 1 },
      ],
    }, () => "ann_new")).toEqual({
      content: {
        title: "kept",
        annotations: [
          { id: "ann_1", type: "highlight", x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          { id: "ann_new", type: "highlight", x: 0, y: 0, width: 1, height: 1 },
        ],
      },
    });

    expect(() => normalize_update_guide_block_annotations_input({
      ...step_block,
      screenshot_hidden: true,
    }, { annotations: [] }, () => "ann_new")).toThrow(InvalidGuideBlockContentError);

    expect(() => normalize_update_guide_block_annotations_input(step_block, {
      annotations: [{ type: "highlight", x: 0.9, y: 0, width: 0.2, height: 0.1 }],
    }, () => "ann_new")).toThrow(InvalidGuideBlockContentError);

    expect(() => {
      if (step_block.block_type !== "header") {
        throw new InvalidGuideBlockScreenshotError();
      }
    }).toThrow(InvalidGuideBlockScreenshotError);
  });
});
