import type { CaptureSessionSourceType } from "@repo/constants";
import {
  CaptureEventReorderNotAllowedError,
  CaptureEventUpdateNotAllowedError,
  InvalidCaptureEventInputError,
  InvalidCaptureEventOrderError,
} from "../errors/capture-domain-error";
import type {
  CaptureEventListItem,
  CaptureSessionEditability,
  CreateCaptureEventInput,
  NormalizedCreateCaptureEventInput,
  NormalizedUpdateCaptureEventInput,
  ReorderCaptureEventsInput,
  UpdateCaptureEventInput,
} from "../types/capture-event";
import { compact_optional_string } from "./capture-session-policy";

export {
  CaptureEventReorderNotAllowedError,
  CaptureEventUpdateNotAllowedError,
  InvalidCaptureEventInputError,
  InvalidCaptureEventOrderError,
};

export const raw_input_field_names = new Set([
  "input_value",
  "value",
  "typed_value",
  "password",
  "secret",
]);

export const editable_update_field_names = new Set([
  "page_url",
  "page_title",
  "target_label",
  "target_text",
  "input_intent",
  "note",
]);

export const has_raw_input_field = (input: Record<string, unknown>) => (
  Object.keys(input).some((key) => raw_input_field_names.has(key))
);

const has_forbidden_update_field = (input: UpdateCaptureEventInput) => (
  Object.keys(input).some((key) => (
    raw_input_field_names.has(key)
    || !editable_update_field_names.has(key)
  ))
);

const has_click_target = (input: NormalizedCreateCaptureEventInput) => (
  Boolean(input.target_label)
  || Boolean(input.target_selector)
  || Boolean(input.target_role)
  || Boolean(input.target_text)
  || input.client_x !== undefined
  || input.client_y !== undefined
);

export const assert_capture_event_payload_safe = (
  input: CreateCaptureEventInput
) => {
  if (has_raw_input_field(input) || input.input_value_redacted === false) {
    throw new InvalidCaptureEventInputError();
  }
};

export const assert_capture_event_matches_type_requirements = (
  input: NormalizedCreateCaptureEventInput
) => {
  if (input.event_type === "navigation" && !input.page_url) {
    throw new InvalidCaptureEventInputError();
  }
  if (input.event_type === "click" && !has_click_target(input)) {
    throw new InvalidCaptureEventInputError();
  }
  if (input.event_type === "capture" && !input.capture_asset_id) {
    throw new InvalidCaptureEventInputError();
  }
  if (input.event_type === "note" && !input.note) {
    throw new InvalidCaptureEventInputError();
  }
};

export const normalize_create_capture_event = (
  input: CreateCaptureEventInput
): NormalizedCreateCaptureEventInput => {
  assert_capture_event_payload_safe(input);

  const normalized: NormalizedCreateCaptureEventInput = {
    event_type: input.event_type,
    event_index: input.event_index,
    capture_asset_id: compact_optional_string(input.capture_asset_id),
    occurred_at: compact_optional_string(input.occurred_at),
    page_url: compact_optional_string(input.page_url),
    page_title: compact_optional_string(input.page_title),
    target_label: compact_optional_string(input.target_label),
    target_selector: compact_optional_string(input.target_selector),
    target_role: compact_optional_string(input.target_role),
    target_test_id: compact_optional_string(input.target_test_id),
    target_text: compact_optional_string(input.target_text),
    client_x: input.client_x,
    client_y: input.client_y,
    viewport_width: input.viewport_width,
    viewport_height: input.viewport_height,
    device_pixel_ratio: input.device_pixel_ratio,
    input_intent: compact_optional_string(input.input_intent),
    input_value_redacted: true,
    note: compact_optional_string(input.note),
    metadata: input.metadata,
  };

  assert_capture_event_matches_type_requirements(normalized);

  return normalized;
};

export const normalize_reorder_capture_events = (
  input: ReorderCaptureEventsInput
) => {
  if (!Array.isArray(input.event_ids) || input.event_ids.length === 0) {
    throw new InvalidCaptureEventOrderError();
  }

  const event_ids = input.event_ids.map((id) => id.trim());

  if (event_ids.some((id) => id.length === 0)) {
    throw new InvalidCaptureEventOrderError();
  }

  if (new Set(event_ids).size !== event_ids.length) {
    throw new InvalidCaptureEventOrderError();
  }

  return event_ids;
};

export const assert_reorder_allowed_for_source_type = (
  source_type: CaptureSessionSourceType
) => {
  if (source_type !== "manual") {
    throw new CaptureEventReorderNotAllowedError();
  }
};

export const assert_reorder_covers_all_events = (
  event_ids: string[],
  active_events: CaptureEventListItem[]
) => {
  const active_ids = new Set(active_events.map((event) => event.id));

  if (active_events.length !== event_ids.length) {
    throw new InvalidCaptureEventOrderError();
  }

  if (event_ids.some((event_id) => !active_ids.has(event_id))) {
    throw new InvalidCaptureEventOrderError();
  }
};

export const normalize_update_capture_event = (
  input: UpdateCaptureEventInput
): NormalizedUpdateCaptureEventInput => {
  const keys = Object.keys(input);

  if (keys.length === 0 || has_forbidden_update_field(input)) {
    throw new InvalidCaptureEventInputError();
  }

  const normalized: NormalizedUpdateCaptureEventInput = {};

  for (const key of editable_update_field_names) {
    if (input[key] !== undefined) {
      normalized[key as keyof NormalizedUpdateCaptureEventInput] =
        compact_optional_string(input[key] as string | null | undefined);
    }
  }

  return normalized;
};

export const assert_capture_event_update_allowed = (
  editability: CaptureSessionEditability
) => {
  if (
    editability.source_type !== "manual"
    || editability.status === "archived"
    || editability.status === "canceled"
  ) {
    throw new CaptureEventUpdateNotAllowedError();
  }
};
