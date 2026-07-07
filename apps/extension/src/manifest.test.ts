import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type ExtensionManifest = {
  content_scripts?: Array<{
    matches?: string[];
  }>;
  host_permissions?: string[];
  permissions?: string[];
};

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/manifest.json"), "utf8")
) as ExtensionManifest;

describe("extension manifest", () => {
  it("declares the persistent host permission required by background screenshot capture", () => {
    expect(manifest.host_permissions).toContain("<all_urls>");
    expect(manifest.permissions).toEqual(expect.arrayContaining(["storage", "tabs"]));
  });

  it("keeps automatic content script injection scoped to supported web pages", () => {
    expect(manifest.content_scripts?.[0]?.matches).toEqual(["http://*/*", "https://*/*"]);
  });
});
