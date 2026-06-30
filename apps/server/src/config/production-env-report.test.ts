import { afterEach, describe, expect, it } from "vitest";
import { build_production_env_report } from "./production-env-report";

const valid_production_env = {
  TZ: "UTC",
  SERVER_PORT: "3002",
  NODE_ENV: "production",
  DEV_TYPE: "production",
  DB_HOST: "db.internal.example",
  DB_PORT: "5432",
  DB_USER: "demo",
  DB_PASSWORD: "super-secret-db-password",
  DB_NAME: "demo_composer",
  DB_MAX_POOL: "10",
  COOKIE_SECRET: "super-secret-cookie-value",
  COOKIE_DOMAIN: "demo.example.com",
  DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://demo.example.com,chrome-extension://abcdefghijklmnopabcdefghijklmnop",
  DEMO_COMPOSER_DEPLOYMENT_MODE: "self_hosted",
  DEMO_COMPOSER_ONBOARDING_MODE: "first_run_setup",
  DEMO_COMPOSER_LOCAL_STORAGE_ROOT: "/var/lib/demo-composer/storage",
  DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES: "10485760",
  DEMO_COMPOSER_JSON_BODY_LIMIT_BYTES: "1048576",
  DEMO_COMPOSER_RATE_LIMIT_MAX_ATTEMPTS: "20",
  DEMO_COMPOSER_RATE_LIMIT_WINDOW_MS: "60000",
  API_URL: "https://api.example.com",
  DEMO_COMPOSER_PUBLIC_WEB_URL: "https://demo.example.com",
};

describe("production env report", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("builds a secret-safe report from a valid production environment", () => {
    process.env = {
      ...original_env,
      ...valid_production_env,
    };

    const report = build_production_env_report();
    const serialized = JSON.stringify(report);

    expect(report).toMatchObject({
      status: "valid",
      runtime_mode: "production",
      startup_config: "valid",
      deployment: {
        mode: "self_hosted",
        onboarding_mode: "first_run_setup",
      },
      database: {
        host_configured: true,
        port: 5432,
        name_configured: true,
        user_configured: true,
        password_configured: true,
        max_pool: 10,
      },
      cookies: {
        secret_configured: true,
        domain_configured: true,
        secure_cookies: true,
      },
      cors: {
        allowed_origins_count: 2,
        allowed_origins: [
          "https://demo.example.com",
          "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
        ],
      },
      urls: {
        api_url: "https://api.example.com",
        public_web_url: "https://demo.example.com",
      },
      local_storage: {
        provider: "local",
        root_configured: true,
        root_is_absolute: true,
        root_uses_default_development_path: false,
      },
      limits: {
        json_body_limit_bytes: 1048576,
        max_screenshot_upload_bytes: 10485760,
      },
      rate_limit: {
        backend: "in_memory",
        max_attempts: 20,
        window_ms: 60000,
        multi_instance_safe: false,
      },
    });
    expect(report.operational_limitations).toContain("Local file storage is the only storage provider.");
    expect(report.operational_limitations).toContain("Rate limiting is in-memory and not shared across API processes.");
    expect(serialized).not.toContain("super-secret-cookie-value");
    expect(serialized).not.toContain("super-secret-db-password");
    expect(serialized).not.toContain("COOKIE_SECRET");
    expect(serialized).not.toContain("DB_PASSWORD");
    expect(serialized).not.toContain("/var/lib/demo-composer/storage");
  });

  it("fails through startup validation when production config is invalid", () => {
    process.env = {
      ...original_env,
      ...valid_production_env,
      COOKIE_SECRET: "",
    };

    expect(() => build_production_env_report()).toThrow("COOKIE_SECRET must be defined in production");
  });
});
