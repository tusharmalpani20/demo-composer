import cookie from "@fastify/cookie";
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { afterEach, describe, expect, it } from "vitest";
import { UnauthenticatedSessionError, type AuthContext } from "../authentication/session.service";
import {
  DuplicateActiveInviteError,
  ExistingUserLoginRequiredError,
  InvitePermissionError,
  type OrgInvite,
  type OrgMember,
} from "./organization-invites.service";
import { build_organization_invites_routes } from "./organization-invites.routes";

const auth_context: AuthContext = {
  user: {
    id: "user_owner",
    email: "owner@example.com",
    display_name: "Owner User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_owner",
    role: "owner",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-10T00:00:00.000Z",
  },
};

const member: OrgMember = {
  id: "org_user_owner",
  organization_id: "organization_1",
  user_id: "user_owner",
  email: "owner@example.com",
  display_name: "Owner User",
  role: "owner",
  status: "active",
  created_at: "2026-06-10T00:00:00.000Z",
};

const invite: OrgInvite = {
  id: "invite_1",
  organization_id: "organization_1",
  email: "teammate@example.com",
  role: "member",
  status: "pending",
  expires_at: "2026-06-20T00:00:00.000Z",
  accepted_at: null,
  accepted_user_id: null,
  created_by_id: "org_user_owner",
  updated_by_id: "org_user_owner",
  created_at: "2026-06-10T00:00:00.000Z",
  updated_at: "2026-06-10T00:00:00.000Z",
};

const build_test_app = async (
  overrides: {
    auth_service?: Partial<Parameters<typeof build_organization_invites_routes>[0]["auth_service"]>;
    organization_invites_service?: Partial<Parameters<typeof build_organization_invites_routes>[0]["organization_invites_service"]>;
  } = {}
) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(build_organization_invites_routes({
    auth_service: {
      get_current_auth_context: async () => auth_context,
      ...overrides.auth_service,
    },
    organization_invites_service: {
      list_members: async () => ({ members: [member] }),
      list_invites: async () => ({ invites: [invite] }),
      create_invite: async () => ({
        invite,
        invite_token: "plain-token",
      }),
      revoke_invite: async () => ({ invite: { ...invite, status: "revoked" } }),
      get_public_invite: async () => ({
        invite: {
          id: "invite_1",
          organization_name: "Acme",
          email: "teammate@example.com",
          role: "member",
          status: "pending",
          expires_at: "2026-06-20T00:00:00.000Z",
          requires_login: false,
        },
      }),
      accept_invite: async () => ({
        session_token: "accepted-session-token",
        auth: auth_context,
      }),
      ...overrides.organization_invites_service,
    },
  }), { prefix: "/api/v1" });
  return app;
};

describe("organization invites routes", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("lists members and pending invites with auth-derived organization scope", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("session-token");
          return auth_context;
        },
      },
      organization_invites_service: {
        list_members: async (input) => {
          seen_inputs.push(input);
          return { members: [member] };
        },
        list_invites: async (input) => {
          seen_inputs.push(input);
          return { invites: [invite] };
        },
      },
    });

    const members_response = await app.inject({
      method: "GET",
      url: "/api/v1/organization/members",
      cookies: { ossie_session: "session-token" },
    });
    const invites_response = await app.inject({
      method: "GET",
      url: "/api/v1/organization/invites",
      cookies: { ossie_session: "session-token" },
    });

    expect(members_response.statusCode).toBe(200);
    expect(members_response.json()).toEqual({ members: [member] });
    expect(invites_response.statusCode).toBe(200);
    expect(invites_response.json()).toEqual({ invites: [invite] });
    expect(seen_inputs).toEqual([
      { auth: { organization_id: "organization_1", actor_org_user_id: "org_user_owner", actor_role: "owner" } },
      { auth: { organization_id: "organization_1", actor_org_user_id: "org_user_owner", actor_role: "owner" } },
    ]);

    await app.close();
  });

  it("creates and revokes invites", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      organization_invites_service: {
        create_invite: async (input) => {
          seen_inputs.push(input);
          return { invite, invite_token: "plain-token" };
        },
        revoke_invite: async (input) => {
          seen_inputs.push(input);
          return { invite: { ...invite, status: "revoked" } };
        },
      },
    });

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/organization/invites",
      payload: {
        email: "teammate@example.com",
        role: "member",
      },
    });
    const revoke_response = await app.inject({
      method: "DELETE",
      url: "/api/v1/organization/invites/invite_1",
    });

    expect(create_response.statusCode).toBe(201);
    expect(create_response.json()).toMatchObject({
      invite,
      invite_token: "plain-token",
      invite_url: expect.stringContaining("/invites/plain-token"),
    });
    expect(JSON.stringify(create_response.json())).not.toContain("token_hash");
    expect(revoke_response.statusCode).toBe(200);
    expect(revoke_response.json().invite.status).toBe("revoked");
    expect(seen_inputs).toEqual([
      {
        auth: { organization_id: "organization_1", actor_org_user_id: "org_user_owner", actor_role: "owner" },
        data: { email: "teammate@example.com", role: "member" },
      },
      {
        auth: { organization_id: "organization_1", actor_org_user_id: "org_user_owner", actor_role: "owner" },
        invite_id: "invite_1",
      },
    ]);

    await app.close();
  });

  it("builds invite URLs from the configured browser-facing portal origin", async () => {
    process.env.OSSIE_PUBLIC_WEB_URL = "https://portal.example.com/";
    const app = await build_test_app({
      organization_invites_service: {
        create_invite: async () => ({
          invite,
          invite_token: "token with spaces/and/slashes",
        }),
      },
    });

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/organization/invites",
      headers: {
        host: "api.example.com",
      },
      payload: {
        email: "teammate@example.com",
        role: "member",
      },
    });

    expect(create_response.statusCode).toBe(201);
    expect(create_response.json().invite_url).toBe(
      "https://portal.example.com/invites/token%20with%20spaces%2Fand%2Fslashes"
    );

    await app.close();
  });

  it("maps auth and validation domain errors", async () => {
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
      },
      organization_invites_service: {
        create_invite: async () => {
          throw new InvitePermissionError();
        },
      },
    });
    const duplicate_app = await build_test_app({
      organization_invites_service: {
        create_invite: async () => {
          throw new DuplicateActiveInviteError();
        },
      },
    });

    const unauthenticated_response = await app.inject({
      method: "GET",
      url: "/api/v1/organization/members",
    });
    const duplicate_response = await duplicate_app.inject({
      method: "POST",
      url: "/api/v1/organization/invites",
      payload: { email: "teammate@example.com" },
    });

    expect(unauthenticated_response.statusCode).toBe(401);
    expect(duplicate_response.statusCode).toBe(409);
    expect(duplicate_response.json().error.type).toBe("duplicate_active_invite");

    await app.close();
    await duplicate_app.close();
  });

  it("looks up and accepts public invites", async () => {
    const seen_accept_inputs: unknown[] = [];
    const app = await build_test_app({
      organization_invites_service: {
        accept_invite: async (input) => {
          seen_accept_inputs.push(input);
          return {
            session_token: "accepted-session-token",
            auth: auth_context,
          };
        },
      },
    });

    const lookup_response = await app.inject({
      method: "GET",
      url: "/api/v1/public/invites/plain-token",
    });
    const accept_response = await app.inject({
      method: "POST",
      url: "/api/v1/public/invites/plain-token/accept",
      payload: {
        password: "very safe local password",
        display_name: "Teammate User",
      },
    });

    expect(lookup_response.statusCode).toBe(200);
    expect(lookup_response.json().invite).toMatchObject({
      organization_name: "Acme",
      requires_login: false,
    });
    expect(accept_response.statusCode).toBe(200);
    expect(accept_response.cookies).toContainEqual(expect.objectContaining({
      name: "ossie_session",
      value: "accepted-session-token",
      httpOnly: true,
      path: "/",
    }));
    expect(seen_accept_inputs).toEqual([{
      token: "plain-token",
      password: "very safe local password",
      display_name: "Teammate User",
      signed_in_user: null,
    }]);

    await app.close();
  });

  it("returns login-required for existing-user invite acceptance", async () => {
    const app = await build_test_app({
      organization_invites_service: {
        accept_invite: async () => {
          throw new ExistingUserLoginRequiredError();
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/invites/plain-token/accept",
      payload: {},
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.type).toBe("invite_existing_user_login_required");

    await app.close();
  });
});
