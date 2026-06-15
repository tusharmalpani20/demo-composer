import { afterEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { build_public_instance_service } from "../public-instance/public-instance.service";
import {
  build_first_run_setup_service,
  type FirstRunSetupRepository,
} from "./first-run-setup.service";

const build_repository = (): FirstRunSetupRepository & {
  owners: Array<{ id: string; role: string }>;
} => {
  const owners: Array<{ id: string; role: string }> = [];

  return {
    owners,
    async owner_exists() {
      return owners.some((owner) => owner.role === "owner");
    },
    async create_user(input) {
      return {
        id: "user_1",
        email: input.email,
        password_hash: input.password_hash,
      };
    },
    async create_organization(input) {
      return {
        id: "organization_1",
        name: input.name,
      };
    },
    async create_org_user(input) {
      const org_user = {
        id: "org_user_1",
        user_id: input.user_id,
        organization_id: input.organization_id,
        role: input.role,
      };
      owners.push(org_user);
      return org_user;
    },
    async create_session(input) {
      return {
        id: "session_1",
        user_id: input.user_id,
        organization_id: input.organization_id,
        org_user_id: input.org_user_id,
        token_hash: input.token_hash,
      };
    },
    async transaction(callback) {
      return callback(this);
    },
  };
};

describe("first-run setup app route", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("mounts first-run setup in the default app build", async () => {
    const app = build({ logger: false });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {},
    });

    expect(response.statusCode).not.toBe(404);

    await app.close();
  });

  it("mounts first-run setup under the versioned API", async () => {
    const app = build({
      logger: false,
      first_run_setup_service: {
        complete_first_run_setup: async () => ({
          session_token: "session-token",
          auth: {
            user: {
              id: "user_1",
              email: "owner@example.com",
            },
            organization: {
              id: "organization_1",
              name: "Acme",
            },
            org_user: {
              id: "org_user_1",
              role: "owner",
            },
            session: {
              id: "session_1",
            },
          },
        }),
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "owner@example.com",
          password: "safe local password",
        },
        organization: {
          name: "Acme",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().auth.organization.name).toBe("Acme");
    expect(response.cookies).toContainEqual(expect.objectContaining({
      name: "demo_composer_session",
      value: "session-token",
    }));

    await app.close();
  });

  it("keeps public instance status and first-run setup route aligned in signup mode", async () => {
    process.env.DEMO_COMPOSER_DEPLOYMENT_MODE = "hosted";
    process.env.DEMO_COMPOSER_ONBOARDING_MODE = "signup";
    const repository = build_repository();
    const app = build({
      logger: false,
      public_instance_service: build_public_instance_service(repository),
      first_run_setup_service: build_first_run_setup_service(repository),
    });

    const instance_response = await app.inject({
      method: "GET",
      url: "/api/v1/public/instance",
    });
    const setup_response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "owner@example.com",
          password: "safe local password",
        },
        organization: {
          name: "Acme",
        },
      },
    });

    expect(instance_response.statusCode).toBe(200);
    expect(instance_response.json()).toMatchObject({
      deployment_mode: "hosted",
      onboarding_mode: "signup",
      setup_required: false,
      signup_enabled: true,
    });
    expect(setup_response.statusCode).toBe(409);
    expect(setup_response.json()).toEqual({
      error: {
        type: "first_run_setup_unavailable",
        message: "First-run setup is not available for this instance",
      },
    });
    expect(repository.owners).toHaveLength(0);

    await app.close();
  });
});
