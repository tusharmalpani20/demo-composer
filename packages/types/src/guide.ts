import {
  GUIDE_ANNOTATION_TYPES,
  GUIDE_BLOCK_PLACEMENTS,
  GUIDE_BLOCK_TYPES,
  GUIDE_CREATABLE_BLOCK_TYPES,
  GUIDE_STATUSES,
  type GuideAnnotationType,
  type GuideBlockType,
  type GuideCreatableBlockType,
  type GuideStatus,
} from "@repo/constants";
import { z } from "zod";
import { CaptureAssetWithFileUrlSchema } from "./capture";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  PositiveIntSchema,
  PositiveNumberSchema,
  TrimmedIdParamSchema,
} from "./common";

export type {
  GuideAnnotationType,
  GuideBlockType,
  GuideCreatableBlockType,
  GuideStatus,
};

export const GuideProjectParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
});
export type GuideProjectParams = z.infer<typeof GuideProjectParamsSchema>;

export const GuideFromCaptureSessionParamsSchema = GuideProjectParamsSchema.extend({
  capture_session_id: TrimmedIdParamSchema,
});
export type GuideFromCaptureSessionParams = z.infer<
  typeof GuideFromCaptureSessionParamsSchema
>;

export const GuideDetailParamsSchema = GuideProjectParamsSchema.extend({
  guide_id: TrimmedIdParamSchema,
});
export type GuideDetailParams = z.infer<typeof GuideDetailParamsSchema>;

export const GuideStepParamsSchema = GuideDetailParamsSchema.extend({
  guide_step_id: TrimmedIdParamSchema,
});
export type GuideStepParams = z.infer<typeof GuideStepParamsSchema>;

export const GuideBlockParamsSchema = GuideDetailParamsSchema.extend({
  guide_block_id: TrimmedIdParamSchema,
});
export type GuideBlockParams = z.infer<typeof GuideBlockParamsSchema>;

export const GuideScreenshotAnnotationSchema = z.object({
  id: IdSchema,
  type: z.enum(GUIDE_ANNOTATION_TYPES),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type GuideScreenshotAnnotation = z.infer<typeof GuideScreenshotAnnotationSchema>;

export const GuideBlockContentSchema = z.object({
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  annotations: z.array(GuideScreenshotAnnotationSchema).nullable().optional(),
}).passthrough();
export type GuideBlockContent = z.infer<typeof GuideBlockContentSchema>;

export const GuideSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  source_capture_session_id: IdSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(GUIDE_STATUSES),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
});
export type Guide = z.infer<typeof GuideSchema>;

export const GuideStepSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  guide_id: IdSchema,
  guide_block_id: IdSchema,
  source_capture_session_id: IdSchema.nullable(),
  source_capture_event_id: IdSchema.nullable(),
  source_capture_asset_id: IdSchema.nullable(),
  title: z.string(),
  body: z.string().nullable(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
});
export type GuideStep = z.infer<typeof GuideStepSchema>;

export const GuideBlockSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  guide_id: IdSchema,
  source_capture_session_id: IdSchema.nullable(),
  source_capture_event_id: IdSchema.nullable(),
  source_capture_asset_id: IdSchema.nullable(),
  selected_capture_asset_id: IdSchema.nullable(),
  screenshot_hidden: z.boolean(),
  display_capture_asset_id: IdSchema.nullable(),
  block_type: z.enum(GUIDE_BLOCK_TYPES),
  content: GuideBlockContentSchema.nullable(),
  block_index: z.number().int(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
  step: GuideStepSchema.nullable(),
});
export type GuideBlock = z.infer<typeof GuideBlockSchema>;

export const GuideSourceCaptureAssetSchema = z.object({
  id: IdSchema,
  capture_session_id: IdSchema,
  asset_type: CaptureAssetWithFileUrlSchema.shape.asset_type,
  width: PositiveIntSchema.nullable(),
  height: PositiveIntSchema.nullable(),
  device_pixel_ratio: PositiveNumberSchema.nullable(),
  page_url: z.string().nullable(),
  page_title: z.string().nullable(),
  captured_at: IsoDateTimeStringSchema,
  file_url: z.string(),
  file: z.object({
    id: IdSchema,
    original_name: z.string().nullable(),
    mime_type: z.string(),
    size_bytes: z.number().int().nonnegative(),
  }),
});
export type GuideSourceCaptureAsset = z.infer<typeof GuideSourceCaptureAssetSchema>;

export const GuideDetailSchema = z.object({
  guide: GuideSchema,
  guide_blocks: z.array(GuideBlockSchema),
  source_capture_assets: z.array(GuideSourceCaptureAssetSchema),
});
export type GuideDetail = z.infer<typeof GuideDetailSchema>;

export const GuideMarkdownExportSchema = z.object({
  filename: z.string(),
  markdown: z.string(),
});
export type GuideMarkdownExport = z.infer<typeof GuideMarkdownExportSchema>;

export const CreateGuideFromCaptureRequestSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  selected_capture_event_ids: z.array(z.string().trim().min(1)).optional(),
}).passthrough();
export type CreateGuideFromCaptureInput = z.infer<
  typeof CreateGuideFromCaptureRequestSchema
>;

export const UpdateGuideRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.literal("archived").optional(),
}).passthrough();
export type UpdateGuideInput = z.infer<typeof UpdateGuideRequestSchema>;

export const UpdateGuideStepRequestSchema = z.object({
  title: z.string().optional(),
  body: z.string().nullable().optional(),
}).passthrough();
export type UpdateGuideStepInput = z.infer<typeof UpdateGuideStepRequestSchema>;

export const ReorderGuideBlocksRequestSchema = z.object({
  block_ids: z.array(z.string().trim().min(1)).min(1),
}).passthrough();
export type ReorderGuideBlocksInput = z.infer<typeof ReorderGuideBlocksRequestSchema>;

const GuideBlockPositionSchema = z.object({
  placement: z.enum(GUIDE_BLOCK_PLACEMENTS),
  guide_block_id: z.string().trim().min(1),
});

export const CreateGuideBlockRequestSchema = z.object({
  block_type: z.enum(GUIDE_CREATABLE_BLOCK_TYPES),
  position: GuideBlockPositionSchema.nullable().optional(),
  step: z.object({
    title: z.string().optional(),
    body: z.string().nullable().optional(),
  }).nullable().optional(),
  content: GuideBlockContentSchema.nullable().optional(),
}).passthrough();
export type CreateGuideBlockInput = z.infer<typeof CreateGuideBlockRequestSchema>;

export const UpdateGuideBlockRequestSchema = z.object({
  content: GuideBlockContentSchema.nullable().optional(),
}).passthrough();
export type UpdateGuideBlockInput = z.infer<typeof UpdateGuideBlockRequestSchema>;

export const UpdateGuideBlockScreenshotRequestSchema = z.object({
  capture_asset_id: z.string().trim().min(1).nullable(),
}).passthrough();
export type UpdateGuideBlockScreenshotInput = z.infer<
  typeof UpdateGuideBlockScreenshotRequestSchema
>;

const UpdateGuideScreenshotAnnotationSchema = z.object({
  id: z.string().trim().min(1).optional(),
  type: z.enum(GUIDE_ANNOTATION_TYPES),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
}).passthrough();

export const UpdateGuideBlockAnnotationsRequestSchema = z.object({
  annotations: z.array(UpdateGuideScreenshotAnnotationSchema).max(10),
}).passthrough();
export type UpdateGuideBlockAnnotationsInput = z.infer<
  typeof UpdateGuideBlockAnnotationsRequestSchema
>;

export const ProjectGuideListResponseSchema = z.object({
  guides: z.array(GuideSchema),
});
export type ProjectGuideListResponse = z.infer<typeof ProjectGuideListResponseSchema>;

export const UpdateGuideResponseSchema = z.object({
  guide: GuideSchema,
});
export type UpdateGuideResponse = z.infer<typeof UpdateGuideResponseSchema>;

export const UpdateGuideStepResponseSchema = z.object({
  guide_step: GuideStepSchema,
});
export type UpdateGuideStepResponse = z.infer<typeof UpdateGuideStepResponseSchema>;

export const GuideBlocksResponseSchema = z.object({
  guide_blocks: z.array(GuideBlockSchema),
});
export type GuideBlocksResponse = z.infer<typeof GuideBlocksResponseSchema>;

export const GuideBlockResponseSchema = z.object({
  guide_block: GuideBlockSchema,
});
export type GuideBlockResponse = z.infer<typeof GuideBlockResponseSchema>;

export const UploadGuideBlockScreenshotResponseSchema = z.object({
  guide_block: GuideBlockSchema,
  capture_asset: CaptureAssetWithFileUrlSchema,
});
export type UploadGuideBlockScreenshotResponse = z.infer<
  typeof UploadGuideBlockScreenshotResponseSchema
>;
