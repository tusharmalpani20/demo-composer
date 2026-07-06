import { describe, expect, it } from "vitest";
import {
  AcceptOrganizationInviteRequestSchema,
  AcceptOrganizationInviteResponseSchema,
  CreateOrganizationInviteRequestSchema,
  OrganizationInviteCreateResponseSchema,
  OrganizationInviteListResponseSchema,
  OrganizationInviteUpdateResponseSchema,
  OrganizationMemberListResponseSchema,
  PublicOrganizationInviteResponseSchema,
} from "./organization";

const member = {
  id: "org_user_owner",
  organization_id: "organization_1",
  user_id: "user_owner",
  email: "owner@example.com",
  display_name: "Owner User",
  role: "owner",
  status: "active",
  created_at: "2026-06-10T00:00:00.000Z",
};

const invite = {
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

const auth = {
  user: {
    id: "user_1",
    email: "teammate@example.com",
    display_name: "Teammate User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_2",
    role: "member",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-10T00:00:00.000Z",
  },
};

describe("organization contracts", () => {
  it("accepts current member and invite response shapes", () => {
    expect(OrganizationMemberListResponseSchema.parse({
      members: [member],
    })).toEqual({
      members: [member],
    });
    expect(OrganizationInviteListResponseSchema.parse({
      invites: [invite],
    })).toEqual({
      invites: [invite],
    });
    expect(OrganizationInviteCreateResponseSchema.parse({
      invite,
      invite_token: "plain-token",
      invite_url: "https://demo.example.com/invites/plain-token",
    })).toEqual({
      invite,
      invite_token: "plain-token",
      invite_url: "https://demo.example.com/invites/plain-token",
    });
    expect(OrganizationInviteUpdateResponseSchema.parse({ invite })).toEqual({ invite });
  });

  it("accepts current public invite and acceptance response shapes", () => {
    expect(PublicOrganizationInviteResponseSchema.parse({
      invite: {
        id: "invite_1",
        organization_name: "Acme",
        email: "teammate@example.com",
        role: "member",
        status: "pending",
        expires_at: "2026-06-20T00:00:00.000Z",
        requires_login: false,
      },
    })).toEqual({
      invite: {
        id: "invite_1",
        organization_name: "Acme",
        email: "teammate@example.com",
        role: "member",
        status: "pending",
        expires_at: "2026-06-20T00:00:00.000Z",
        requires_login: false,
      },
    });
    expect(AcceptOrganizationInviteResponseSchema.parse({ auth })).toEqual({ auth });
  });

  it("preserves invite request passthrough and trimming behavior", () => {
    expect(CreateOrganizationInviteRequestSchema.parse({
      email: " teammate@example.com ",
      role: "member",
      ignored_but_allowed: true,
    })).toEqual({
      email: "teammate@example.com",
      role: "member",
      ignored_but_allowed: true,
    });

    expect(AcceptOrganizationInviteRequestSchema.parse({
      password: "safe local password",
      display_name: null,
      ignored_but_allowed: true,
    })).toEqual({
      password: "safe local password",
      display_name: null,
      ignored_but_allowed: true,
    });
  });

  it("rejects invalid organization roles and statuses", () => {
    expect(OrganizationMemberListResponseSchema.safeParse({
      members: [{ ...member, role: "admin" }],
    }).success).toBe(false);
    expect(OrganizationInviteListResponseSchema.safeParse({
      invites: [{ ...invite, status: "sent" }],
    }).success).toBe(false);
  });
});
