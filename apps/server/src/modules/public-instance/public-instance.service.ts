import { ONBOARDING_MODES } from "@repo/constants";
import { get_public_instance_config } from "./public-instance.config";

export type PublicInstanceStatusRepository = {
  owner_exists: () => Promise<boolean>;
};

export const build_public_instance_service = (repository: PublicInstanceStatusRepository) => {
  const get_public_instance_status = async () => {
    const config = get_public_instance_config();
    const owner_exists = config.onboarding_mode === ONBOARDING_MODES[0]
      ? await repository.owner_exists()
      : false;

    return {
      ...config,
      setup_required: config.onboarding_mode === ONBOARDING_MODES[0] && !owner_exists,
      signup_enabled: config.onboarding_mode === ONBOARDING_MODES[1],
    };
  };

  return {
    get_public_instance_status,
  };
};
