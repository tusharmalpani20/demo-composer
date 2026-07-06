import type {
  CaptureEventType,
  CaptureSessionSourceType,
  CaptureSessionStatus,
} from "@repo/constants";

export type CreateCaptureEventInput = {
  event_type: CaptureEventType;
  event_index: number;
  capture_asset_id?: string | null;
  occurred_at?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_selector?: string | null;
  target_role?: string | null;
  target_test_id?: string | null;
  target_text?: string | null;
  client_x?: number | null;
  client_y?: number | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  input_intent?: string | null;
  input_value_redacted?: boolean;
  note?: string | null;
  metadata?: unknown;
} & Record<string, unknown>;

export type ReorderCaptureEventsInput = {
  event_ids: string[];
};

export type UpdateCaptureEventInput = {
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_text?: string | null;
  input_intent?: string | null;
  note?: string | null;
} & Record<string, unknown>;

export type NormalizedCreateCaptureEventInput = {
  event_type: CaptureEventType;
  event_index: number;
  capture_asset_id?: string | null;
  occurred_at?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_selector?: string | null;
  target_role?: string | null;
  target_test_id?: string | null;
  target_text?: string | null;
  client_x?: number | null;
  client_y?: number | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  input_intent?: string | null;
  input_value_redacted: true;
  note?: string | null;
  metadata?: unknown;
};

export type NormalizedUpdateCaptureEventInput = {
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_text?: string | null;
  input_intent?: string | null;
  note?: string | null;
};

export type CaptureEventListItem = {
  id: string;
};

export type CaptureSessionEditability = {
  source_type: CaptureSessionSourceType;
  status: CaptureSessionStatus;
};
