import { afterEach, describe, expect, it } from "vitest";
import { build } from "./app";
import { InvalidCredentialsError, UnauthenticatedSessionError } from "./modules/authentication/session.routes";

describe("app configuration", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("allows only configured production CORS origins", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_TYPE = "production";
    process.env.COOKIE_SECRET = "a-very-strong-cookie-secret";
    process.env.OSSIE_CORS_ALLOWED_ORIGINS = [
      "https://portal.example.com",
      "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
    ].join(",");

    const app = build({ logger: false });

    const allowed_response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/authentication/login",
      headers: {
        origin: "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-ossie-client",
      },
    });
    const blocked_response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/authentication/login",
      headers: {
        origin: "https://evil.example.com",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-ossie-client",
      },
    });

    expect(allowed_response.statusCode).toBe(204);
    expect(allowed_response.headers["access-control-allow-origin"]).toBe(
      "chrome-extension://abcdefghijklmnopabcdefghijklmnop"
    );
    expect(blocked_response.headers["access-control-allow-origin"]).toBeUndefined();

    await app.close();
  });

  it("uses Ossie OpenAPI metadata", async () => {
    const app = build({ logger: false });
    await app.ready();

    expect(app.swagger().info).toMatchObject({
      title: "Ossie",
      description: "Ossie API",
    });

    await app.close();
  });

  it("exposes liveness and readiness endpoints without leaking database details", async () => {
    const ready_app = build({
      logger: false,
      readiness_check: async () => undefined,
    });
    const unavailable_app = build({
      logger: false,
      readiness_check: async () => {
        throw new Error("postgres://user:secret@db.internal/ossie");
      },
    });

    const liveness_response = await ready_app.inject({
      method: "GET",
      url: "/healthz",
    });
    const readiness_response = await ready_app.inject({
      method: "GET",
      url: "/readyz",
    });
    const unavailable_response = await unavailable_app.inject({
      method: "GET",
      url: "/readyz",
    });

    expect(liveness_response.statusCode).toBe(200);
    expect(liveness_response.json()).toEqual({
      status: "ok",
      service: "ossie-api",
    });
    expect(readiness_response.statusCode).toBe(200);
    expect(readiness_response.json()).toEqual({
      status: "ready",
      checks: {
        database: "ok",
      },
    });
    expect(unavailable_response.statusCode).toBe(503);
    expect(unavailable_response.body).not.toContain("postgres://");
    expect(unavailable_response.json()).toEqual({
      status: "not_ready",
      checks: {
        database: "unavailable",
      },
    });

    await ready_app.close();
    await unavailable_app.close();
  });

  it("rate limits repeated login attempts by route and client", async () => {
    process.env.OSSIE_RATE_LIMIT_MAX_ATTEMPTS = "2";
    process.env.OSSIE_RATE_LIMIT_WINDOW_MS = "60000";

    const app = build({
      logger: false,
      authentication_session_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
        login: async () => {
          throw new InvalidCredentialsError();
        },
        logout: async () => undefined,
      },
    });

    const request_login = () => app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.10",
      },
      payload: {
        email: "owner@example.com",
        password: "wrong password",
      },
    });

    expect((await request_login()).statusCode).toBe(401);
    expect((await request_login()).statusCode).toBe(401);

    const limited_response = await request_login();

    expect(limited_response.statusCode).toBe(429);
    expect(limited_response.json()).toEqual({
      error: {
        type: "rate_limited",
        message: "Too many requests. Try again later.",
      },
    });
    expect(limited_response.headers["retry-after"]).toBe("60");

    await app.close();
  });

  it("does not share rate limit buckets across app instances", async () => {
    process.env.OSSIE_RATE_LIMIT_MAX_ATTEMPTS = "1";
    process.env.OSSIE_RATE_LIMIT_WINDOW_MS = "60000";

    const auth_service = {
      get_current_auth_context: async () => {
        throw new UnauthenticatedSessionError();
      },
      login: async () => {
        throw new InvalidCredentialsError();
      },
      logout: async () => undefined,
    };
    const first_app = build({
      logger: false,
      authentication_session_service: auth_service,
    });
    const second_app = build({
      logger: false,
      authentication_session_service: auth_service,
    });
    const request_login = (app: ReturnType<typeof build>) => app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.40",
      },
      payload: {
        email: "owner@example.com",
        password: "wrong password",
      },
    });

    expect((await request_login(first_app)).statusCode).toBe(401);
    expect((await request_login(first_app)).statusCode).toBe(429);
    expect((await request_login(second_app)).statusCode).toBe(401);

    await first_app.close();
    await second_app.close();
  });

  it("rate limits setup, public password unlock, and invite acceptance routes", async () => {
    process.env.OSSIE_RATE_LIMIT_MAX_ATTEMPTS = "1";
    process.env.OSSIE_RATE_LIMIT_WINDOW_MS = "60000";

    const app = build({ logger: false });
    const request = async (url: string, ip: string) => (
      app.inject({
        method: "POST",
        url,
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": ip,
        },
        payload: "",
      })
    );

    expect((await request("/api/v1/setup/first-run", "203.0.113.20")).statusCode).toBe(400);
    expect((await request("/api/v1/setup/first-run", "203.0.113.20")).statusCode).toBe(429);

    expect((await request("/api/v1/public/publish-links/demo123/viewer-sessions", "203.0.113.21")).statusCode).toBe(400);
    expect((await request("/api/v1/public/publish-links/demo123/viewer-sessions", "203.0.113.21")).statusCode).toBe(429);

    expect((await request("/api/v1/public/invites/plain-token/accept", "203.0.113.22")).statusCode).toBe(400);
    expect((await request("/api/v1/public/invites/plain-token/accept", "203.0.113.22")).statusCode).toBe(429);

    await app.close();
  });

  it("uses the configured JSON body limit", async () => {
    process.env.OSSIE_JSON_BODY_LIMIT_BYTES = "32";

    const app = build({ logger: false });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.30",
      },
      payload: {
        email: "owner@example.com",
        password: "this password body is deliberately too large for the configured limit",
      },
    });

    expect(response.statusCode).toBe(413);

    await app.close();
  });
});
