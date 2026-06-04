import { describe, expect, it } from "vitest";
import {
  build_first_run_setup_service,
  type FirstRunSetupRepository,
} from "./first-run-setup.service";

const build_repository = (): FirstRunSetupRepository & {
  users: Array<{ id: string; email: string; password_hash: string }>;
  organizations: Array<{ id: string; name: string }>;
  org_users: Array<{ id: string; user_id: string; organization_id: string; role: string }>;
  sessions: Array<{ id: string; user_id: string; organization_id: string; org_user_id: string }>;
} => {
  const users: Array<{ id: string; email: string; password_hash: string }> = [];
  const organizations: Array<{ id: string; name: string }> = [];
  const org_users: Array<{ id: string; user_id: string; organization_id: string; role: string }> = [];
  const sessions: Array<{ id: string; user_id: string; organization_id: string; org_user_id: string }> = [];

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
      session: {
        raw_token: "session-token",
        token_hash: "hashed-session-token",
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
    expect(repository.sessions).toEqual([
      {
        id: "session_1",
        user_id: "user_1",
        organization_id: "organization_1",
        org_user_id: "org_user_1",
      },
    ]);
    expect(result.session_token).toBe("session-token");
    expect(result.auth.user.email).toBe("owner@example.com");
    expect(result.auth.organization.name).toBe("Acme");
    expect(result.auth.org_user.role).toBe("owner");
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
      session: {
        raw_token: "session-token",
        token_hash: "hashed-session-token",
      },
    })).rejects.toThrow("Owner password is too weak");

    expect(repository.users).toHaveLength(0);
    expect(repository.organizations).toHaveLength(0);
    expect(repository.org_users).toHaveLength(0);
    expect(repository.sessions).toHaveLength(0);
  });
});
