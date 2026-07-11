import {
  DEPLOYMENT_MODES,
  ONBOARDING_MODES,
  type DeploymentMode,
  type OnboardingMode,
} from "@repo/constants";

const deployment_modes = new Set<DeploymentMode>(DEPLOYMENT_MODES);
const onboarding_modes = new Set<OnboardingMode>(ONBOARDING_MODES);

export type {
  DeploymentMode,
  OnboardingMode,
};

const read_enum = <Value extends string>(
  value: string | undefined,
  allowed: Set<Value>,
  fallback: Value
): Value => {
  if (value && allowed.has(value as Value)) return value as Value;
  return fallback;
};

export const get_public_instance_config = () => {
  const deployment_mode = read_enum(
    process.env.OSSIE_DEPLOYMENT_MODE,
    deployment_modes,
    "self_hosted"
  );
  const default_onboarding_mode = deployment_mode === "hosted" ? "signup" : "first_run_setup";
  const onboarding_mode = read_enum(
    process.env.OSSIE_ONBOARDING_MODE,
    onboarding_modes,
    default_onboarding_mode
  );

  return {
    deployment_mode,
    onboarding_mode,
  };
};
