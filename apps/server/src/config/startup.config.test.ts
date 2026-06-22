import { afterEach, describe, expect, it } from "vitest";
import { validate_server_startup_config } from "./startup.config";

const valid_required_env = {
  TZ: "UTC",
  SERVER_PORT: "3002",
  DEV_TYPE: "development",
  NODE_ENV: "development",
  DB_HOST: "127.0.0.1",
  DB_PORT: "5432",
  DB_USER: "demo",
  DB_PASSWORD: "demo",
  DB_NAME: "demo_composer",
  DB_MAX_POOL: "10",
};

describe("startup config", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("accepts complete development startup config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
    };

    expect(() => validate_server_startup_config()).not.toThrow();
  });

  it("rejects missing database startup config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      DB_HOST: "",
    };

    expect(() => validate_server_startup_config()).toThrow("Database configuration must be defined");
  });

  it("rejects invalid server and database numeric startup config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      SERVER_PORT: "not-a-port",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "SERVER_PORT must be a positive integer"
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      DB_PORT: "0",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DB_PORT must be a positive integer"
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      DB_MAX_POOL: "-1",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DB_MAX_POOL must be a positive integer"
    );
  });

  it("rejects production startup config without production CORS and cookie safety", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_CORS_ALLOWED_ORIGINS must be defined in production"
    );
  });

  it("rejects production startup config without a strong cookie secret", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "COOKIE_SECRET must be defined in production"
    );
  });

  it("accepts complete production startup config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      DEMO_COMPOSER_DEPLOYMENT_MODE: "self_hosted",
      DEMO_COMPOSER_ONBOARDING_MODE: "first_run_setup",
      DEMO_COMPOSER_LOCAL_STORAGE_ROOT: "/var/lib/demo-composer/storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).not.toThrow();
  });

  it("rejects production startup config without explicit deployment modes", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      DEMO_COMPOSER_LOCAL_STORAGE_ROOT: "/var/lib/demo-composer/storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_DEPLOYMENT_MODE must be explicitly set in production"
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      DEMO_COMPOSER_DEPLOYMENT_MODE: "self_hosted",
      DEMO_COMPOSER_LOCAL_STORAGE_ROOT: "/var/lib/demo-composer/storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_ONBOARDING_MODE must be explicitly set in production"
    );
  });

  it("rejects invalid production deployment modes", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      DEMO_COMPOSER_DEPLOYMENT_MODE: "private_cloud",
      DEMO_COMPOSER_ONBOARDING_MODE: "first_run_setup",
      DEMO_COMPOSER_LOCAL_STORAGE_ROOT: "/var/lib/demo-composer/storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_DEPLOYMENT_MODE must be self_hosted or hosted"
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      DEMO_COMPOSER_DEPLOYMENT_MODE: "self_hosted",
      DEMO_COMPOSER_ONBOARDING_MODE: "invite_only",
      DEMO_COMPOSER_LOCAL_STORAGE_ROOT: "/var/lib/demo-composer/storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_ONBOARDING_MODE must be first_run_setup or signup"
    );
  });

  it("rejects production startup config without a durable local storage root", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      DEMO_COMPOSER_DEPLOYMENT_MODE: "self_hosted",
      DEMO_COMPOSER_ONBOARDING_MODE: "first_run_setup",
      DEMO_COMPOSER_LOCAL_STORAGE_ROOT: "./storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_LOCAL_STORAGE_ROOT must be set to a durable storage path in production"
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      DEMO_COMPOSER_DEPLOYMENT_MODE: "self_hosted",
      DEMO_COMPOSER_ONBOARDING_MODE: "first_run_setup",
      DEMO_COMPOSER_LOCAL_STORAGE_ROOT: "storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_LOCAL_STORAGE_ROOT must be set to an absolute durable storage path in production"
    );
  });

  it("rejects production startup config without an absolute public API URL", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      DEMO_COMPOSER_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      DEMO_COMPOSER_DEPLOYMENT_MODE: "self_hosted",
      DEMO_COMPOSER_ONBOARDING_MODE: "first_run_setup",
      DEMO_COMPOSER_LOCAL_STORAGE_ROOT: "/var/lib/demo-composer/storage",
      API_URL: "/api",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "API_URL must be an absolute http(s) URL in production"
    );
  });

  it("rejects invalid numeric production hardening config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      DEMO_COMPOSER_JSON_BODY_LIMIT_BYTES: "0",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_JSON_BODY_LIMIT_BYTES must be a positive integer"
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES: "not-a-number",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES must be a positive integer"
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      DEMO_COMPOSER_RATE_LIMIT_MAX_ATTEMPTS: "-1",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DEMO_COMPOSER_RATE_LIMIT_MAX_ATTEMPTS must be a positive integer"
    );
  });
});
