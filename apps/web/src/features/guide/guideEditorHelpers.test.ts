import { describe, expect, it } from "vitest";
import {
  annotationPercent,
  defaultBlockInput,
  formatCapturedAt,
  sortBlocks,
} from "./guideEditorHelpers";
import type { GuideBlock } from "./types";

const block = (id: string, blockIndex: number): GuideBlock => ({
  id,
  organization_id: "org_1",
  project_id: "project_1",
  guide_id: "guide_1",
  source_capture_session_id: null,
  source_capture_event_id: null,
  source_capture_asset_id: null,
  selected_capture_asset_id: null,
  screenshot_hidden: false,
  display_capture_asset_id: null,
  block_type: "divider",
  content: null,
  block_index: blockIndex,
  created_by_id: "user_1",
  updated_by_id: "user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
  step: null,
});

describe("guide editor helpers", () => {
  it("sorts guide blocks by block index without mutating the input", () => {
    const blocks = [block("second", 2), block("first", 1)];

    expect(sortBlocks(blocks).map((candidate) => candidate.id)).toEqual([
      "first",
      "second",
    ]);
    expect(blocks.map((candidate) => candidate.id)).toEqual([
      "second",
      "first",
    ]);
  });

  it("formats captured timestamps in UTC and rejects invalid values", () => {
    expect(formatCapturedAt("2026-06-16T10:00:00.000Z")).toBe(
      "Jun 16, 2026, 10:00 AM UTC",
    );
    expect(formatCapturedAt("not-a-date")).toBeNull();
  });

  it("builds default block inputs for inserted step and non-step blocks", () => {
    expect(defaultBlockInput("step", {
      placement: "after",
      guide_block_id: "block_1",
    })).toEqual({
      block_type: "step",
      position: {
        placement: "after",
        guide_block_id: "block_1",
      },
      step: {
        title: "New step",
        body: null,
      },
    });

    expect(defaultBlockInput("alert")).toEqual({
      block_type: "alert",
      content: {
        body: "Add an important note.",
      },
    });
  });

  it("formats annotation values as stable percentages", () => {
    expect(annotationPercent(0.123456)).toBe("12.3456%");
    expect(annotationPercent(0.1)).toBe("10%");
  });
});
