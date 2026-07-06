import type {
  CaptureAssetType,
  CaptureEventType,
  CaptureSessionSourceType,
  CaptureSessionStatus,
} from "@repo/constants";
import type {
  CaptureAssetWithFileUrl,
  CaptureEvent,
  CaptureSession,
  CaptureSessionDetail,
  CreateCaptureEventInput,
  CreateCaptureEventResponse,
  CreateCaptureSessionInput,
  ReorderCaptureEventsInput,
  ReorderCaptureEventsResponse,
  UpdateCaptureEventInput,
  UpdateCaptureEventResponse,
} from "@repo/types/capture";

export type {
  CaptureAssetType,
  CaptureEventType,
  CaptureSessionSourceType,
  CaptureSessionStatus,
  CaptureEvent,
  CaptureSession,
  CaptureSessionDetail,
  CreateCaptureEventInput,
  CreateCaptureEventResponse,
  CreateCaptureSessionInput,
  ReorderCaptureEventsInput,
  ReorderCaptureEventsResponse,
  UpdateCaptureEventInput,
  UpdateCaptureEventResponse,
};

export type UploadCaptureAssetInput = {
  file: File;
  page_url?: string | null;
  page_title?: string | null;
  captured_at?: string;
};

export type CaptureAsset = CaptureAssetWithFileUrl;

export type UploadCaptureAssetResponse = {
  capture_asset: CaptureAsset;
};
