import { afterEach, describe, expect, it } from "vitest";
import { build } from "./app";

describe("app configuration", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("allows only configured production CORS origins", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_TYPE = "production";
    process.env.COOKIE_SECRET = "a-very-strong-cookie-secret";
    process.env.DEMO_COMPOSER_CORS_ALLOWED_ORIGINS = [
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
        "access-control-request-headers": "content-type,x-demo-composer-client",
      },
    });
    const blocked_response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/authentication/login",
      headers: {
        origin: "https://evil.example.com",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-demo-composer-client",
      },
    });

    expect(allowed_response.statusCode).toBe(204);
    expect(allowed_response.headers["access-control-allow-origin"]).toBe(
      "chrome-extension://abcdefghijklmnopabcdefghijklmnop"
    );
    expect(blocked_response.headers["access-control-allow-origin"]).toBeUndefined();

    await app.close();
  });

  it("uses Demo Composer OpenAPI metadata", async () => {
    const app = build({ logger: false });
    await app.ready();

    expect(app.swagger().info).toMatchObject({
      title: "Demo Composer",
      description: "Demo Composer API",
    });

    await app.close();
  });
});
