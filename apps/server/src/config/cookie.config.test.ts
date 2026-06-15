import { afterEach, describe, expect, it } from "vitest";
import { get_cookie_config } from "./cookie.config";

describe("cookie config", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("rejects missing production cookie secret", () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_TYPE = "production";
    delete process.env.COOKIE_SECRET;

    expect(() => get_cookie_config()).toThrow("COOKIE_SECRET must be defined in production");
  });

  it("rejects short production cookie secret", () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_TYPE = "production";
    process.env.COOKIE_SECRET = "short";

    expect(() => get_cookie_config()).toThrow("COOKIE_SECRET must be at least 20 characters in production");
  });

  it("uses secure production cookie options with explicit strong secret", () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_TYPE = "production";
    process.env.COOKIE_SECRET = "a-very-strong-cookie-secret";
    process.env.COOKIE_DOMAIN = "demo.example.com";

    expect(get_cookie_config()).toMatchObject({
      secret: "a-very-strong-cookie-secret",
      parseOptions: {
        httpOnly: true,
        secure: true,
        domain: "demo.example.com",
      },
    });
  });

  it("uses a non-production fallback secret without forcing localhost domain", () => {
    process.env.NODE_ENV = "test";
    process.env.DEV_TYPE = "testing";
    delete process.env.COOKIE_SECRET;
    delete process.env.COOKIE_DOMAIN;

    const config = get_cookie_config();

    expect(config.secret).toBe("demo-composer-local-cookie-secret");
    expect(config.parseOptions).toMatchObject({
      httpOnly: false,
      secure: false,
    });
    expect(config.parseOptions?.domain).toBeUndefined();
  });
});
