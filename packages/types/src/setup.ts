import { z } from "zod";

export const FirstRunSetupRequestSchema = z.object({
  owner: z.object({
    email: z.string().min(1),
    password: z.string().min(1),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
  }),
  organization: z.object({
    name: z.string().min(1),
  }),
});
export type FirstRunSetupRequest = z.infer<typeof FirstRunSetupRequestSchema>;
export type FirstRunSetupInput = FirstRunSetupRequest;

export const FirstRunSetupResponseSchema = z.object({
  auth: z.unknown(),
});
export type FirstRunSetupResponse = z.infer<typeof FirstRunSetupResponseSchema>;
