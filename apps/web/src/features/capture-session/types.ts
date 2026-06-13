export type CaptureSessionStatus = "draft" | "capturing" | "completed" | "canceled" | "archived";
export type CaptureSessionSourceType = "manual" | "extension" | "import";

export type CaptureSession = {
  id: string;
  organization_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: CaptureSessionStatus;
  source_type: CaptureSessionSourceType;
  started_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  start_url: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  user_agent: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type CreateCaptureSessionInput = {
  name: string;
  description?: string | null;
  source_type?: CaptureSessionSourceType;
  start_url?: string | null;
};

export type CaptureEventType = "navigation" | "click" | "input" | "capture" | "note";

export type UploadCaptureAssetInput = {
  file: File;
  page_url?: string | null;
  page_title?: string | null;
  captured_at?: string;
};

export type CreateCaptureEventInput = {
  event_type: CaptureEventType;
  event_index: number;
  capture_asset_id?: string | null;
  occurred_at?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  note?: string | null;
};

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
};

export type CaptureEvent = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  capture_asset_id: string | null;
  event_type: CaptureEventType;
  event_index: number;
  occurred_at: string;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_selector: string | null;
  target_role: string | null;
  target_test_id: string | null;
  target_text: string | null;
  client_x: number | null;
  client_y: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  input_intent: string | null;
  input_value_redacted: true;
  note: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type CaptureAssetType = "screenshot" | "html_snapshot" | "thumbnail" | "redacted_screenshot";

export type CaptureAsset = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  file: {
    id: string;
    storage_provider: "local" | "external";
    mime_type: string;
    size_bytes: number;
    original_name: string | null;
    checksum_sha256: string | null;
  };
  asset_type: CaptureAssetType;
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: string;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  file_url: string;
};

export type CaptureSessionDetail = {
  capture_session: CaptureSession;
  capture_events: CaptureEvent[];
  capture_assets: CaptureAsset[];
};

export type UploadCaptureAssetResponse = {
  capture_asset: CaptureAsset;
};

export type CreateCaptureEventResponse = {
  capture_event: CaptureEvent;
};

export type ReorderCaptureEventsResponse = {
  capture_events: CaptureEvent[];
};

export type UpdateCaptureEventResponse = {
  capture_event: CaptureEvent;
};
