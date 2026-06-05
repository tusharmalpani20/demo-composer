type DeploymentMode = "self_hosted" | "hosted";
type OnboardingMode = "first_run_setup" | "signup";

const deployment_modes = new Set<DeploymentMode>(["self_hosted", "hosted"]);
const onboarding_modes = new Set<OnboardingMode>(["first_run_setup", "signup"]);

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
    process.env.DEMO_COMPOSER_DEPLOYMENT_MODE,
    deployment_modes,
    "self_hosted"
  );
  const default_onboarding_mode = deployment_mode === "hosted" ? "signup" : "first_run_setup";
  const onboarding_mode = read_enum(
    process.env.DEMO_COMPOSER_ONBOARDING_MODE,
    onboarding_modes,
    default_onboarding_mode
  );

  return {
    deployment_mode,
    onboarding_mode,
  };
};
