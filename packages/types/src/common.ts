import { z } from "zod";

export const IdSchema = z.string().min(1);
export type Id = z.infer<typeof IdSchema>;

export const TrimmedIdParamSchema = z.string().trim().min(1);
export type TrimmedIdParam = z.infer<typeof TrimmedIdParamSchema>;

export const NonEmptyStringSchema = z.string().min(1);
export type NonEmptyString = z.infer<typeof NonEmptyStringSchema>;

export const TrimmedNonEmptyStringSchema = z.string().trim().min(1);
export type TrimmedNonEmptyString = z.infer<typeof TrimmedNonEmptyStringSchema>;

export const NullableStringSchema = z.string().nullable();
export type NullableString = z.infer<typeof NullableStringSchema>;

export const IsoDateTimeStringSchema = z.string().datetime();
export type IsoDateTimeString = z.infer<typeof IsoDateTimeStringSchema>;

export const NullableIsoDateTimeStringSchema = IsoDateTimeStringSchema.nullable();
export type NullableIsoDateTimeString = z.infer<typeof NullableIsoDateTimeStringSchema>;

export const PositiveIntSchema = z.number().int().positive();
export type PositiveInt = z.infer<typeof PositiveIntSchema>;

export const PositiveNumberSchema = z.number().positive();
export type PositiveNumber = z.infer<typeof PositiveNumberSchema>;

export const NonNegativeNumberSchema = z.number().nonnegative();
export type NonNegativeNumber = z.infer<typeof NonNegativeNumberSchema>;

export const UnknownMetadataSchema = z.unknown();
export type UnknownMetadata = z.infer<typeof UnknownMetadataSchema>;

export const ApiErrorBodySchema = z.object({
  error: z.object({
    type: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

export const ApiErrorResponseSchema = ApiErrorBodySchema;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
