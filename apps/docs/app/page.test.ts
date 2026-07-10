import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appDirectory = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(join(appDirectory, "page.tsx"), "utf8");

describe("docs page component", () => {
  it("loads the hero evidence image eagerly", () => {
    expect(pageSource).toMatch(
      /<Image[\s\S]*?src=\{evidenceItems\[0\]!\.src\}[\s\S]*?loading="eager"/,
    );
  });

  it("does not repeat the hero evidence image in the lazy evidence grid", () => {
    expect(pageSource).toContain("evidenceItems.slice(1).map");
  });

  it("renders a qualified next platform direction band", () => {
    expect(pageSource).toContain("Next Platform Direction");
    expect(pageSource).toContain("nextPlatformDirection.items.map");
    expect(pageSource).toContain("nextPlatformDirection.docsAppBoundary");
  });
});
