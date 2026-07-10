import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appDirectory = dirname(fileURLToPath(import.meta.url));
const configSource = readFileSync(join(appDirectory, "..", "next.config.js"), "utf8");

describe("docs image configuration", () => {
  it("allows alpha evidence from the current Ossie repository", () => {
    expect(configSource).toContain(
      'pathname: "/tusharmalpani20/ossie/main/docs/assets/alpha/**"',
    );
    expect(configSource).not.toContain("tusharmalpani20/demo-composer");
  });
});
