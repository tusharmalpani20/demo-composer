export const DEPLOYMENT_MODES = [
  "self_hosted",
  "hosted",
] as const;
export type DeploymentMode = (typeof DEPLOYMENT_MODES)[number];

export const ONBOARDING_MODES = [
  "first_run_setup",
  "signup",
] as const;
export type OnboardingMode = (typeof ONBOARDING_MODES)[number];
