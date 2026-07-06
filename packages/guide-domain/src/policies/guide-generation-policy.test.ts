import { describe, expect, it } from "vitest";
import {
  InvalidGuideInputError,
  build_guide_from_capture_source,
  generate_guide_step_from_source_event,
  normalize_create_guide_from_capture_input,
} from "./guide-generation-policy";

describe("guide generation policy", () => {
  it("normalizes guide creation input and rejects duplicate selected events", () => {
    expect(normalize_create_guide_from_capture_input({
      title: ` ${"A".repeat(200)} `,
      description: "  ",
      selected_capture_event_ids: [" event_1 ", ""],
    })).toEqual({
      title: "A".repeat(180),
      description: null,
      selected_capture_event_ids: ["event_1"],
    });

    expect(() => normalize_create_guide_from_capture_input({
      title: "Guide",
      selected_capture_event_ids: ["event_1", " event_1 "],
    })).toThrow(InvalidGuideInputError);
  });

  it("generates deterministic guide steps from capture source events", () => {
    expect(generate_guide_step_from_source_event({
      id: "event_1",
      event_type: "click",
      event_index: 1,
      capture_asset_id: "asset_1",
      page_url: "https://example.test",
      page_title: "Settings",
      target_label: "Save",
      target_role: null,
      target_text: null,
      note: null,
    })).toEqual({
      title: "Click \"Save\"",
      body: null,
    });

    expect(generate_guide_step_from_source_event({
      id: "event_2",
      event_type: "capture",
      event_index: 2,
      capture_asset_id: "asset_2",
      page_url: "https://example.test/settings",
      page_title: "Settings",
      target_label: null,
      target_role: null,
      target_text: null,
      note: null,
    })).toEqual({
      title: "Capture \"Settings\"",
      body: "Captured from https://example.test/settings.",
    });
  });

  it("builds normalized guide blocks without mutating inactive source assets", () => {
    const built = build_guide_from_capture_source({
      title: " Guide ",
      description: "Setup",
      source_events: [{
        id: "event_1",
        event_type: "capture",
        event_index: 1,
        capture_asset_id: "asset_inactive",
        page_url: null,
        page_title: null,
        target_label: null,
        target_role: null,
        target_text: null,
        note: null,
      }],
      active_capture_asset_ids: new Set(["asset_other"]),
    });

    expect(built).toEqual({
      title: "Guide",
      description: "Setup",
      blocks: [{
        block_type: "step",
        block_index: 1,
        source_capture_event_id: "event_1",
        source_capture_asset_id: null,
        step: {
          title: "Capture this screen",
          body: null,
        },
      }],
    });
  });
});
