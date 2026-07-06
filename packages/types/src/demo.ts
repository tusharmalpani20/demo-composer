import { z } from "zod";
import {
  DEMO_HOTSPOT_TYPES,
  INTERACTIVE_DEMO_STATUSES,
} from "@repo/constants";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  TrimmedIdParamSchema,
  TrimmedNonEmptyStringSchema,
} from "./common";

const nullable_trimmed_string = z.string().transform((value) => value.trim()).nullable();
const semantic_number_schema = z.union([
  z.number(),
  z.literal(Number.POSITIVE_INFINITY),
  z.literal(Number.NEGATIVE_INFINITY),
]);

export const InteractiveDemoSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  source_capture_session_id: IdSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(INTERACTIVE_DEMO_STATUSES),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
});
export type InteractiveDemo = z.infer<typeof InteractiveDemoSchema>;

export const DemoSceneSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  interactive_demo_id: IdSchema,
  source_capture_session_id: IdSchema.nullable(),
  source_capture_event_id: IdSchema.nullable(),
  source_capture_asset_id: IdSchema.nullable(),
  scene_index: z.number().int().positive(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  background_capture_asset_id: IdSchema.nullable(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
});
export type DemoScene = z.infer<typeof DemoSceneSchema>;

export const DemoHotspotSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  interactive_demo_id: IdSchema,
  demo_scene_id: IdSchema,
  hotspot_type: z.enum(DEMO_HOTSPOT_TYPES),
  label: z.string().nullable(),
  content: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  target_scene_id: IdSchema.nullable(),
  hotspot_index: z.number().int().positive(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
});
export type DemoHotspot = z.infer<typeof DemoHotspotSchema>;

export const CreateInteractiveDemoRequestSchema = z.object({
  title: TrimmedNonEmptyStringSchema,
  description: z.string().nullable().optional(),
}).passthrough();
export type CreateInteractiveDemoInput = z.infer<typeof CreateInteractiveDemoRequestSchema> & {
  source_capture_session_id?: string | null;
};

export const CreateInteractiveDemoFromCaptureRequestSchema = z.object({
  title: TrimmedNonEmptyStringSchema.optional(),
  description: z.string().nullable().optional(),
}).passthrough();
export type CreateInteractiveDemoFromCaptureInput = z.infer<
  typeof CreateInteractiveDemoFromCaptureRequestSchema
>;

export const UpdateInteractiveDemoRequestSchema = z.object({
  title: TrimmedNonEmptyStringSchema.optional(),
  description: z.string().nullable().optional(),
  status: z.enum(INTERACTIVE_DEMO_STATUSES).optional(),
}).passthrough();
export type UpdateInteractiveDemoInput = z.infer<typeof UpdateInteractiveDemoRequestSchema>;

export const CreateDemoSceneRequestSchema = z.object({
  title: nullable_trimmed_string.optional(),
  description: nullable_trimmed_string.optional(),
  background_capture_asset_id: TrimmedIdParamSchema.nullable().optional(),
}).passthrough();
export type CreateDemoSceneInput = z.infer<typeof CreateDemoSceneRequestSchema> & {
  source_capture_session_id?: string | null;
  source_capture_event_id?: string | null;
  source_capture_asset_id?: string | null;
};

export const UpdateDemoSceneRequestSchema = z.object({
  title: nullable_trimmed_string.optional(),
  description: nullable_trimmed_string.optional(),
  background_capture_asset_id: TrimmedIdParamSchema.nullable().optional(),
}).passthrough();
export type UpdateDemoSceneInput = z.infer<typeof UpdateDemoSceneRequestSchema>;

export const ReorderDemoScenesRequestSchema = z.object({
  scene_ids: z.array(TrimmedIdParamSchema).min(1),
}).passthrough();
export type ReorderDemoScenesInput = z.infer<typeof ReorderDemoScenesRequestSchema>;

export const CreateDemoHotspotRequestSchema = z.object({
  hotspot_type: z.enum(DEMO_HOTSPOT_TYPES),
  label: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  x: semantic_number_schema,
  y: semantic_number_schema,
  width: semantic_number_schema,
  height: semantic_number_schema,
  target_scene_id: TrimmedIdParamSchema.nullable().optional(),
}).passthrough();
export type CreateDemoHotspotRequest = z.infer<typeof CreateDemoHotspotRequestSchema>;
export type CreateDemoHotspotInput = {
  hotspot_type: string;
  label?: string | null;
  content?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  target_scene_id?: string | null;
};

export const UpdateDemoHotspotRequestSchema = z.object({
  hotspot_type: z.enum(DEMO_HOTSPOT_TYPES).optional(),
  label: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  x: semantic_number_schema.optional(),
  y: semantic_number_schema.optional(),
  width: semantic_number_schema.optional(),
  height: semantic_number_schema.optional(),
  target_scene_id: TrimmedIdParamSchema.nullable().optional(),
}).passthrough();
export type UpdateDemoHotspotRequest = z.infer<typeof UpdateDemoHotspotRequestSchema>;
export type UpdateDemoHotspotInput = {
  hotspot_type?: string;
  label?: string | null;
  content?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  target_scene_id?: string | null;
};

export const ReorderDemoHotspotsRequestSchema = z.object({
  hotspot_ids: z.array(TrimmedIdParamSchema).min(1),
}).passthrough();
export type ReorderDemoHotspotsInput = z.infer<typeof ReorderDemoHotspotsRequestSchema>;

export const CreateInteractiveDemoFromCaptureResponseSchema = z.object({
  interactive_demo: InteractiveDemoSchema,
  demo_scenes: z.array(DemoSceneSchema),
  redirect_path: z.string(),
});
export type CreateInteractiveDemoFromCaptureResponse = z.infer<
  typeof CreateInteractiveDemoFromCaptureResponseSchema
>;

export const CreateInteractiveDemoResponseSchema = z.object({
  interactive_demo: InteractiveDemoSchema,
});
export type CreateInteractiveDemoResponse = z.infer<typeof CreateInteractiveDemoResponseSchema>;

export const ProjectInteractiveDemoListResponseSchema = z.object({
  interactive_demos: z.array(InteractiveDemoSchema),
});
export type ProjectInteractiveDemoListResponse = z.infer<
  typeof ProjectInteractiveDemoListResponseSchema
>;

export const InteractiveDemoDetailResponseSchema = z.object({
  interactive_demo: InteractiveDemoSchema,
});
export type InteractiveDemoDetailResponse = z.infer<typeof InteractiveDemoDetailResponseSchema>;

export const InteractiveDemoSceneResponseSchema = z.object({
  demo_scene: DemoSceneSchema,
});
export type InteractiveDemoSceneResponse = z.infer<typeof InteractiveDemoSceneResponseSchema>;
export type InteractiveDemoSceneUpdateResponse = InteractiveDemoSceneResponse;

export const InteractiveDemoSceneListResponseSchema = z.object({
  demo_scenes: z.array(DemoSceneSchema),
});
export type InteractiveDemoSceneListResponse = z.infer<
  typeof InteractiveDemoSceneListResponseSchema
>;

export const InteractiveDemoSceneReorderResponseSchema = z.object({
  demo_scenes: z.array(DemoSceneSchema),
});
export type InteractiveDemoSceneReorderResponse = z.infer<
  typeof InteractiveDemoSceneReorderResponseSchema
>;

export const InteractiveDemoHotspotResponseSchema = z.object({
  demo_hotspot: DemoHotspotSchema,
});
export type InteractiveDemoHotspotResponse = z.infer<typeof InteractiveDemoHotspotResponseSchema>;
export type InteractiveDemoHotspotCreateResponse = InteractiveDemoHotspotResponse;
export type InteractiveDemoHotspotUpdateResponse = InteractiveDemoHotspotResponse;

export const InteractiveDemoHotspotListResponseSchema = z.object({
  demo_hotspots: z.array(DemoHotspotSchema),
});
export type InteractiveDemoHotspotListResponse = z.infer<
  typeof InteractiveDemoHotspotListResponseSchema
>;

export const InteractiveDemoHotspotReorderResponseSchema = z.object({
  demo_hotspots: z.array(DemoHotspotSchema),
});
export type InteractiveDemoHotspotReorderResponse = z.infer<
  typeof InteractiveDemoHotspotReorderResponseSchema
>;
