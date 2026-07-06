import { ORGANIZATION_ROLES } from "@repo/constants";
import { z } from "zod";
import { IdSchema } from "./common";

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

export const FirstRunSetupAuthContextSchema = z.object({
  user: z.object({
    id: IdSchema,
    email: z.string(),
  }),
  organization: z.object({
    id: IdSchema,
    name: z.string(),
  }),
  org_user: z.object({
    id: IdSchema,
    role: z.literal(ORGANIZATION_ROLES[0]),
  }),
  session: z.object({
    id: IdSchema,
  }),
});
export type FirstRunSetupAuthContext = z.infer<typeof FirstRunSetupAuthContextSchema>;

export const FirstRunSetupResponseSchema = z.object({
  auth: FirstRunSetupAuthContextSchema,
});
export type FirstRunSetupResponse = z.infer<typeof FirstRunSetupResponseSchema>;
