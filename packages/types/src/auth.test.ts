import { describe, expect, it } from "vitest";
import {
  AuthResponseSchema,
  ExtensionLoginResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
} from "./auth";

const auth = {
  user: {
    id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
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
    session_type: "web",
    expires_at: "2026-07-10T00:00:00.000Z",
  },
};

describe("auth contracts", () => {
  it("accepts current auth and login response shapes", () => {
    expect(AuthResponseSchema.parse({ auth })).toEqual({ auth });
    expect(LoginResponseSchema.parse({ auth })).toEqual({ auth });
    expect(ExtensionLoginResponseSchema.parse({
      auth,
      session_token: "extension-session-token",
    })).toEqual({
      auth,
      session_token: "extension-session-token",
    });
  });

  it("validates login request credentials", () => {
    expect(LoginRequestSchema.parse({
      email: "owner@example.com",
      password: "safe local password",
    })).toEqual({
      email: "owner@example.com",
      password: "safe local password",
    });

    expect(LoginRequestSchema.safeParse({
      email: "",
      password: "",
    }).success).toBe(false);
  });

  it("keeps session tokens out of generic auth responses", () => {
    expect(AuthResponseSchema.safeParse({
      auth,
      session_token: "web-session-token",
    }).success).toBe(false);
  });

  it("requires extension login responses to include a session token", () => {
    expect(ExtensionLoginResponseSchema.safeParse({ auth }).success).toBe(false);
  });

  it("requires the full session auth shape", () => {
    expect(AuthResponseSchema.safeParse({
      auth: {
        ...auth,
        user: {
          id: "user_1",
          email: "owner@example.com",
        },
      },
    }).success).toBe(false);
  });
});
