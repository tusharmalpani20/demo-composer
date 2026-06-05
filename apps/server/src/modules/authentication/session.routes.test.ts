import cookie from "@fastify/cookie";
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it } from "vitest";
import {
  build_authentication_session_routes,
  UnauthenticatedSessionError,
} from "./session.routes";

const build_test_app = async (
  service: Parameters<typeof build_authentication_session_routes>[0]
) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(build_authentication_session_routes(service), {
    prefix: "/api/v1/authentication",
  });
  return app;
};

describe("authentication session routes", () => {
  it("returns current auth context for a valid session cookie", async () => {
    const app = await build_test_app({
      get_current_auth_context: async (session_token) => {
        expect(session_token).toBe("valid-session-token");
        return {
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
            expires_at: "2026-07-05T00:00:00.000Z",
          },
        };
      },
      login: async () => {
        throw new Error("not used");
      },
      logout: async () => {
        throw new Error("not used");
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        demo_composer_session: "valid-session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      auth: {
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
          expires_at: "2026-07-05T00:00:00.000Z",
        },
      },
    });
    expect(JSON.stringify(response.json())).not.toContain("password_hash");
    expect(JSON.stringify(response.json())).not.toContain("token_hash");

    await app.close();
  });

  it("maps missing or invalid session cookies to unauthenticated", async () => {
    const app = await build_test_app({
      get_current_auth_context: async () => {
        throw new UnauthenticatedSessionError();
      },
      login: async () => {
        throw new Error("not used");
      },
      logout: async () => {
        throw new Error("not used");
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    });

    await app.close();
  });

  it("logs in through the service and sets the web session cookie", async () => {
    const app = await build_test_app({
      get_current_auth_context: async () => {
        throw new Error("not used");
      },
      login: async (input) => ({
        session_token: "login-session-token",
        auth: {
          user: {
            id: "user_1",
            email: input.email,
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
            id: "session_2",
            session_type: "web",
            expires_at: "2026-07-05T00:00:00.000Z",
          },
        },
      }),
      logout: async () => {
        throw new Error("not used");
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      payload: {
        email: "owner@example.com",
        password: "safe local password",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.cookies).toContainEqual(expect.objectContaining({
      name: "demo_composer_session",
      value: "login-session-token",
      httpOnly: true,
      path: "/",
    }));
    expect(response.json().auth.session.id).toBe("session_2");

    await app.close();
  });

  it("maps invalid login credentials to unauthorized", async () => {
    const { InvalidCredentialsError } = await import("./session.routes");
    const app = await build_test_app({
      get_current_auth_context: async () => {
        throw new Error("not used");
      },
      login: async () => {
        throw new InvalidCredentialsError();
      },
      logout: async () => {
        throw new Error("not used");
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      payload: {
        email: "owner@example.com",
        password: "wrong password",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        type: "invalid_credentials",
        message: "Email or password is incorrect",
      },
    });

    await app.close();
  });

  it("logs out through the service and clears the web session cookie", async () => {
    const seen_session_tokens: Array<string | undefined> = [];
    const app = await build_test_app({
      get_current_auth_context: async () => {
        throw new Error("not used");
      },
      login: async () => {
        throw new Error("not used");
      },
      logout: async (session_token) => {
        seen_session_tokens.push(session_token);
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/logout",
      cookies: {
        demo_composer_session: "session-token",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(seen_session_tokens).toEqual(["session-token"]);
    expect(response.cookies).toContainEqual(expect.objectContaining({
      name: "demo_composer_session",
      value: "",
      path: "/",
    }));

    await app.close();
  });
});
