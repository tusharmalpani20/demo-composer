import { Password } from "../../common/services/password.common.service";
import { get_public_instance_config } from "../public-instance/public-instance.config";
import {
  generate_session_token,
  hash_session_token,
} from "../authentication/session-token";

type SetupUser = {
  id: string;
  email: string;
  password_hash: string;
};

type SetupOrganization = {
  id: string;
  name: string;
};

type SetupOrgUser = {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
};

type SetupSession = {
  id: string;
  user_id: string;
  organization_id: string;
  org_user_id: string;
  token_hash?: string;
};

type FirstRunSetupTransactionalRepository = {
  owner_exists: () => Promise<boolean>;
  create_user: (input: {
    email: string;
    password_hash: string;
    first_name?: string | null;
    last_name?: string | null;
    display_name: string;
  }) => Promise<SetupUser>;
  create_organization: (input: {
    name: string;
  }) => Promise<SetupOrganization>;
  create_org_user: (input: {
    user_id: string;
    organization_id: string;
    role: "owner";
  }) => Promise<SetupOrgUser>;
  create_session: (input: {
    user_id: string;
    organization_id: string;
    org_user_id: string;
    token_hash: string;
  }) => Promise<SetupSession>;
};

export type FirstRunSetupRepository = FirstRunSetupTransactionalRepository & {
  owner_exists: () => Promise<boolean>;
  transaction: <Result>(
    callback: (repository: FirstRunSetupTransactionalRepository) => Promise<Result>
  ) => Promise<Result>;
};

export class FirstRunSetupAlreadyCompletedError extends Error {
  constructor() {
    super("First-run setup has already been completed");
  }
}

export class FirstRunSetupUnavailableError extends Error {
  constructor() {
    super("First-run setup is not available for this instance");
  }
}

export class UnsafeOwnerPasswordError extends Error {
  constructor(message = "Owner password is too weak") {
    super(message);
  }
}

const unsafe_passwords = new Set([
  "admin",
  "changeme",
  "demo",
  "democomposer",
  "password",
]);

const assert_safe_owner_password = (password: string) => {
  const normalized = password.toLowerCase().replaceAll(/\s/g, "");
  if (unsafe_passwords.has(normalized)) {
    throw new UnsafeOwnerPasswordError();
  }

  if (password.length < 12) {
    throw new UnsafeOwnerPasswordError("Owner password must be at least 12 characters");
  }
};

const build_display_name = (input: {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}) => {
  const name = [input.first_name, input.last_name].filter(Boolean).join(" ").trim();
  return name || input.email;
};

export const build_first_run_setup_service = (repository: FirstRunSetupRepository) => {
  const complete_first_run_setup = async (input: {
    owner: {
      email: string;
      password: string;
      first_name?: string | null;
      last_name?: string | null;
    };
    organization: {
      name: string;
    };
  }) => {
    if (get_public_instance_config().onboarding_mode !== "first_run_setup") {
      throw new FirstRunSetupUnavailableError();
    }

    assert_safe_owner_password(input.owner.password);

    if (await repository.owner_exists()) {
      throw new FirstRunSetupAlreadyCompletedError();
    }

    return repository.transaction(async (transaction_repository) => {
      if (await transaction_repository.owner_exists()) {
        throw new FirstRunSetupAlreadyCompletedError();
      }

      const user = await transaction_repository.create_user({
        email: input.owner.email,
        password_hash: await Password.to_hash(input.owner.password),
        first_name: input.owner.first_name,
        last_name: input.owner.last_name,
        display_name: build_display_name({
          ...input.owner,
          email: input.owner.email,
        }),
      });
      const organization = await transaction_repository.create_organization({
        name: input.organization.name,
      });
      const org_user = await transaction_repository.create_org_user({
        user_id: user.id,
        organization_id: organization.id,
        role: "owner",
      });
      const session_token = generate_session_token();
      const session = await transaction_repository.create_session({
        user_id: user.id,
        organization_id: organization.id,
        org_user_id: org_user.id,
        token_hash: hash_session_token(session_token),
      });

      return {
        session_token,
        auth: {
          user: {
            id: user.id,
            email: user.email,
          },
          organization,
          org_user,
          session,
        },
      };
    });
  };

  return {
    complete_first_run_setup,
  };
};
