import { afterEach, describe, expect, it } from "vitest";
import { get_runtime_mode, is_production_runtime } from "./runtime.config";

describe("runtime config", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("treats NODE_ENV production as production runtime", () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_TYPE = "development";

    expect(get_runtime_mode()).toBe("production");
    expect(is_production_runtime()).toBe(true);
  });

  it("treats DEV_TYPE production as production runtime", () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_TYPE = "production";

    expect(get_runtime_mode()).toBe("production");
    expect(is_production_runtime()).toBe(true);
  });

  it("treats NODE_ENV test and DEV_TYPE testing as test runtime", () => {
    process.env.NODE_ENV = "test";
    process.env.DEV_TYPE = "testing";

    expect(get_runtime_mode()).toBe("test");
    expect(is_production_runtime()).toBe(false);
  });
});
