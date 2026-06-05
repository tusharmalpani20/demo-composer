// @vitest-environment node

import { describe, expect, it } from "vitest";
import viteConfig from "./vite.config";

describe("web vite config", () => {
  it("proxies same-origin API calls to the backend development port", () => {
    expect(viteConfig).toMatchObject({
      server: {
        proxy: {
          "/api": {
            target: "http://localhost:4021",
          },
        },
      },
    });
  });
});
