import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appDirectory = dirname(fileURLToPath(import.meta.url));
const styles = readFileSync(join(appDirectory, "page.module.css"), "utf8");

describe("docs page styles", () => {
  it("does not scale text with viewport units", () => {
    expect(styles).not.toMatch(/font-size\s*:[^;]*v(?:w|h|min|max)/);
  });

  it("keeps letter spacing neutral", () => {
    const letterSpacingValues = Array.from(styles.matchAll(/letter-spacing\s*:\s*([^;]+);/g), (match) => match[1]?.trim());

    expect(letterSpacingValues).not.toHaveLength(0);
    expect(letterSpacingValues).toEqual(letterSpacingValues.map(() => "0"));
  });
});
