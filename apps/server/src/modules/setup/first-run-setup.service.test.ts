import { afterEach, describe, expect, it } from "vitest";
import {
  build_first_run_setup_service,
  type FirstRunSetupRepository,
} from "./first-run-setup.service";

const build_repository = (): FirstRunSetupRepository & {
  users: Array<{ id: string; email: string; password_hash: string }>;
  organizations: Array<{ id: string; name: string }>;
  org_users: Array<{ id: string; user_id: string; organization_id: string; role: string }>;
  sessions: Array<{ id: string; user_id: string; organization_id: string; org_user_id: string; token_hash: string }>;
} => {
  const users: Array<{ id: string; email: string; password_hash: string }> = [];
  const organizations: Array<{ id: string; name: string }> = [];
  const org_users: Array<{ id: string; user_id: string; organization_id: string; role: string }> = [];
  const sessions: Array<{ id: string; user_id: string; organization_id: string; org_user_id: string; token_hash: string }> = [];

  return {
    users,
    organizations,
    org_users,
    sessions,
    async owner_exists() {
      return org_users.some((org_user) => org_user.role === "owner");
    },
    async create_user(input) {
      const user = { id: `user_${users.length + 1}`, email: input.email, password_hash: input.password_hash };
      users.push(user);
      return user;
    },
    async create_organization(input) {
      const organization = { id: `organization_${organizations.length + 1}`, name: input.name };
      organizations.push(organization);
      return organization;
    },
    async create_org_user(input) {
      const org_user = {
        id: `org_user_${org_users.length + 1}`,
        user_id: input.user_id,
        organization_id: input.organization_id,
        role: input.role,
      };
      org_users.push(org_user);
      return org_user;
    },
    async create_session(input) {
      const session = {
        id: `session_${sessions.length + 1}`,
        user_id: input.user_id,
        organization_id: input.organization_id,
        org_user_id: input.org_user_id,
        token_hash: input.token_hash,
      };
      sessions.push(session);
      return session;
    },
    async transaction(callback) {
      return callback(this);
    },
  };
};

describe("first-run setup service", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("creates the first owner organization and web session", async () => {
    const repository = build_repository();
    const service = build_first_run_setup_service(repository);

    const result = await service.complete_first_run_setup({
      owner: {
        email: "owner@example.com",
        password: "safe local password",
        first_name: "Owner",
        last_name: "User",
      },
      organization: {
        name: "Acme",
      },
    });

    expect(repository.users).toHaveLength(1);
    expect(repository.users[0]).toMatchObject({ email: "owner@example.com" });
    expect(repository.users[0]?.password_hash).not.toBe("safe local password");
    expect(repository.organizations).toEqual([{ id: "organization_1", name: "Acme" }]);
    expect(repository.org_users).toEqual([
      {
        id: "org_user_1",
        user_id: "user_1",
        organization_id: "organization_1",
        role: "owner",
      },
    ]);
    expect(repository.sessions).toHaveLength(1);
    expect(repository.sessions[0]).toMatchObject({
      id: "session_1",
      user_id: "user_1",
      organization_id: "organization_1",
      org_user_id: "org_user_1",
    });
    expect(result.session_token).toEqual(expect.any(String));
    expect(repository.sessions[0]).toMatchObject({
      token_hash: expect.any(String),
    });
    expect(repository.sessions[0]?.token_hash).not.toBe(result.session_token);
    expect(result.auth.user.email).toBe("owner@example.com");
    expect(result.auth.organization.name).toBe("Acme");
    expect(result.auth.org_user.role).toBe("owner");
  });

  it("rejects first-run setup when onboarding mode is signup", async () => {
    process.env.OSSIE_DEPLOYMENT_MODE = "hosted";
    process.env.OSSIE_ONBOARDING_MODE = "signup";
    const repository = build_repository();
    const service = build_first_run_setup_service(repository);

    await expect(service.complete_first_run_setup({
      owner: {
        email: "owner@example.com",
        password: "safe local password",
      },
      organization: {
        name: "Acme",
      },
    })).rejects.toThrow("First-run setup is not available for this instance");

    expect(repository.users).toHaveLength(0);
    expect(repository.organizations).toHaveLength(0);
    expect(repository.org_users).toHaveLength(0);
    expect(repository.sessions).toHaveLength(0);
  });

  it("rejects unsafe owner passwords before creating setup records", async () => {
    const repository = build_repository();
    const service = build_first_run_setup_service(repository);

    await expect(service.complete_first_run_setup({
      owner: {
        email: "owner@example.com",
        password: "password",
      },
      organization: {
        name: "Acme",
      },
    })).rejects.toThrow("Owner password is too weak");

    expect(repository.users).toHaveLength(0);
    expect(repository.organizations).toHaveLength(0);
    expect(repository.org_users).toHaveLength(0);
    expect(repository.sessions).toHaveLength(0);
  });

  it("rechecks owner existence inside the setup transaction", async () => {
    const repository = build_repository();
    const service = build_first_run_setup_service({
      ...repository,
      async owner_exists() {
        return false;
      },
      async transaction(callback) {
        repository.org_users.push({
          id: "existing_owner",
          user_id: "existing_user",
          organization_id: "existing_organization",
          role: "owner",
        });
        return callback(repository);
      },
    });

    await expect(service.complete_first_run_setup({
      owner: {
        email: "owner@example.com",
        password: "safe local password",
      },
      organization: {
        name: "Acme",
      },
    })).rejects.toThrow("First-run setup has already been completed");

    expect(repository.users).toHaveLength(0);
    expect(repository.organizations).toHaveLength(0);
    expect(repository.sessions).toHaveLength(0);
  });
});
