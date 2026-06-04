import { z } from "zod";
import { date_doc } from "./common.schema";

export const response_message = z.enum(["success", "error", "warning", "info"]);

export type Response_Message_Type = z.infer<typeof response_message>;

export const api_response_doc = <T>(schema: z.ZodType<T>) => z.object({
  code: z.number().int().positive(),
  message: response_message,
  path: z.string().optional(),
  result: schema,
  timestamp: date_doc,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Api_Response_Type<T = unknown> = z.infer<ReturnType<typeof api_response_doc<T>>>;
export type TApiResponse<T = unknown> = Api_Response_Type<T>;

export const api_201_response_doc = <T>(schema: z.ZodType<T>) => z.object({
  code: z.literal(201),
  message: z.literal(response_message.enum.success),
  path: z.string().optional(),
  result: schema,
  timestamp: date_doc,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const api_200_response_doc = <T>(schema: z.ZodType<T>) => z.object({
  code: z.literal(200),
  message: z.literal(response_message.enum.success),
  path: z.string().optional(),
  result: schema,
  timestamp: date_doc,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const api_200_or_201_response_doc = <T>(schema: z.ZodType<T>) => z.object({
  code: z.union([z.literal(200), z.literal(201)]),
  message: z.literal(response_message.enum.success),
  path: z.string().optional(),
  result: schema,
  timestamp: date_doc,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const error_result_doc = z.object({
  message: z.string(),
  field: z.string(),
  type: z.string().optional(),
});

export const api_4xx_5XX_response_doc = <T>(schema: z.ZodType<T>) => z.object({
  //have a number between 400 and 599
  code: z.number().int().positive().lte(599).gte(400),
  message: z.literal(response_message.enum.error),
  path: z.string().optional(),
  result: schema,
  timestamp: date_doc,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const api_error_response_doc = api_4xx_5XX_response_doc(z.array(error_result_doc));


export type Api_Error_Response_Type = z.infer<
  typeof error_result_doc
>;
export type TApiErrorResponse = Api_Error_Response_Type;
