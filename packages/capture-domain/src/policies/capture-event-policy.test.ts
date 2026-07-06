import { describe, expect, it } from "vitest";
import {
  CaptureEventReorderNotAllowedError,
  CaptureEventUpdateNotAllowedError,
  InvalidCaptureEventInputError,
  InvalidCaptureEventOrderError,
  assert_capture_event_update_allowed,
  assert_reorder_allowed_for_source_type,
  assert_reorder_covers_all_events,
  normalize_create_capture_event,
  normalize_reorder_capture_events,
  normalize_update_capture_event,
} from "./capture-event-policy";

const active_events = [
  { id: "event_1" },
  { id: "event_2" },
  { id: "event_3" },
];

describe("capture event policy", () => {
  it("normalizes safe capture events and preserves redacted input defaults", () => {
    expect(normalize_create_capture_event({
      event_type: "click",
      event_index: 1,
      capture_asset_id: "  capture_asset_1  ",
      occurred_at: "  2026-07-07T00:00:00.000Z  ",
      page_url: "  https://example.com  ",
      target_text: "  Open  ",
      input_intent: "  typed a search  ",
      input_value_redacted: true,
      note: "  note  ",
      metadata: { mode: "automatic" },
    })).toEqual({
      event_type: "click",
      event_index: 1,
      capture_asset_id: "capture_asset_1",
      occurred_at: "2026-07-07T00:00:00.000Z",
      page_url: "https://example.com",
      page_title: undefined,
      target_label: undefined,
      target_selector: undefined,
      target_role: undefined,
      target_test_id: undefined,
      target_text: "Open",
      client_x: undefined,
      client_y: undefined,
      viewport_width: undefined,
      viewport_height: undefined,
      device_pixel_ratio: undefined,
      input_intent: "typed a search",
      input_value_redacted: true,
      note: "note",
      metadata: { mode: "automatic" },
    });
  });

  it("rejects raw input values and event-type-specific invalid payloads", () => {
    expect(() => normalize_create_capture_event({
      event_type: "input",
      event_index: 1,
      input_value_redacted: false,
    })).toThrow(InvalidCaptureEventInputError);

    expect(() => normalize_create_capture_event({
      event_type: "input",
      event_index: 1,
      input_value: "secret",
    })).toThrow(InvalidCaptureEventInputError);

    expect(() => normalize_create_capture_event({
      event_type: "navigation",
      event_index: 1,
    })).toThrow(InvalidCaptureEventInputError);
    expect(() => normalize_create_capture_event({
      event_type: "click",
      event_index: 1,
    })).toThrow(InvalidCaptureEventInputError);
    expect(() => normalize_create_capture_event({
      event_type: "capture",
      event_index: 1,
    })).toThrow(InvalidCaptureEventInputError);
    expect(() => normalize_create_capture_event({
      event_type: "note",
      event_index: 1,
      note: " ",
    })).toThrow(InvalidCaptureEventInputError);
  });

  it("normalizes and validates full manual event reorder lists", () => {
    expect(normalize_reorder_capture_events({
      event_ids: [" event_3 ", " event_1 ", " event_2 "],
    })).toEqual(["event_3", "event_1", "event_2"]);

    expect(() => normalize_reorder_capture_events({ event_ids: [] })).toThrow(InvalidCaptureEventOrderError);
    expect(() => normalize_reorder_capture_events({ event_ids: ["event_1", " event_1 "] })).toThrow(InvalidCaptureEventOrderError);
    expect(() => normalize_reorder_capture_events({ event_ids: [" "] })).toThrow(InvalidCaptureEventOrderError);
    expect(() => assert_reorder_allowed_for_source_type("extension")).toThrow(CaptureEventReorderNotAllowedError);
    expect(() => assert_reorder_allowed_for_source_type("manual")).not.toThrow();
    expect(() => assert_reorder_covers_all_events(["event_3", "event_1", "event_2"], active_events)).not.toThrow();
    expect(() => assert_reorder_covers_all_events(["event_1", "event_2"], active_events)).toThrow(InvalidCaptureEventOrderError);
    expect(() => assert_reorder_covers_all_events(["event_1", "event_2", "missing"], active_events)).toThrow(InvalidCaptureEventOrderError);
  });

  it("normalizes safe manual event updates and rejects unsafe edits", () => {
    expect(normalize_update_capture_event({
      page_url: "  https://example.com  ",
      target_label: "  Button  ",
      target_text: "  ",
      note: null,
    })).toEqual({
      page_url: "https://example.com",
      target_label: "Button",
      target_text: null,
      note: null,
    });

    expect(() => normalize_update_capture_event({})).toThrow(InvalidCaptureEventInputError);
    expect(() => normalize_update_capture_event({ target_selector: ".private" })).toThrow(InvalidCaptureEventInputError);
    expect(() => normalize_update_capture_event({ input_value: "secret" })).toThrow(InvalidCaptureEventInputError);
    expect(() => assert_capture_event_update_allowed({ source_type: "extension", status: "capturing" })).toThrow(CaptureEventUpdateNotAllowedError);
    expect(() => assert_capture_event_update_allowed({ source_type: "manual", status: "archived" })).toThrow(CaptureEventUpdateNotAllowedError);
    expect(() => assert_capture_event_update_allowed({ source_type: "manual", status: "canceled" })).toThrow(CaptureEventUpdateNotAllowedError);
    expect(() => assert_capture_event_update_allowed({ source_type: "manual", status: "capturing" })).not.toThrow();
  });
});
