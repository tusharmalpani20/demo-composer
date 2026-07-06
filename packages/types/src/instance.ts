import { DEPLOYMENT_MODES, ONBOARDING_MODES } from "@repo/constants";
import { z } from "zod";

export const PublicInstanceStatusResponseSchema = z.object({
  deployment_mode: z.enum(DEPLOYMENT_MODES),
  onboarding_mode: z.enum(ONBOARDING_MODES),
  setup_required: z.boolean(),
  signup_enabled: z.boolean(),
});
export type PublicInstanceStatusResponse = z.infer<typeof PublicInstanceStatusResponseSchema>;
export type PublicInstanceStatus = PublicInstanceStatusResponse;
