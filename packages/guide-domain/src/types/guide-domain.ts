import type { CaptureEventType, GuideBlockType, GuideStatus } from "@repo/constants";
import type {
  GuideBlockContent,
  UpdateGuideBlockAnnotationsInput,
} from "@repo/types/guide";

export type GuideSourceEventType = CaptureEventType;

export type GuideSourceEvent = {
  id: string;
  event_type: GuideSourceEventType;
  event_index: number;
  capture_asset_id: string | null;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_role: string | null;
  target_text: string | null;
  note: string | null;
};

export type NormalizedCreateGuideFromCaptureInput = {
  title: string;
  description: string | null;
  blocks: Array<{
    block_type: GuideBlockType;
    block_index: number;
    source_capture_event_id: string;
    source_capture_asset_id: string | null;
    step: {
      title: string;
      body: string | null;
    };
  }>;
};

export type NormalizedUpdateGuideInput = {
  title?: string;
  description?: string | null;
  status?: GuideStatus;
};

export type NormalizedUpdateGuideStepInput = {
  title?: string;
  body?: string | null;
};

export type NormalizedCreateGuideBlockInput = {
  block_type: "step" | "header" | "paragraph" | "tip" | "alert" | "divider";
  position?: {
    placement: "before" | "after";
    guide_block_id: string;
  };
  step?: {
    title: string;
    body: string | null;
  };
  content?: GuideBlockContent | null;
};

export type NormalizedUpdateGuideBlockInput = {
  content: GuideBlockContent;
};

export type NormalizedUpdateGuideBlockScreenshotInput = {
  selected_capture_asset_id: string | null;
  screenshot_hidden: boolean;
};

export type NormalizedUpdateGuideBlockAnnotationsInput = {
  content: GuideBlockContent;
};

export type GuideAnnotationIdFactory = () => string;

export type GuideAnnotationInput = UpdateGuideBlockAnnotationsInput;

export type GuideHtmlExportImageReference = {
  capture_asset_id: string;
  asset_path: string;
  mime_type: string;
};

export type GuideHtmlExport = {
  html: string;
  image_references: GuideHtmlExportImageReference[];
};
