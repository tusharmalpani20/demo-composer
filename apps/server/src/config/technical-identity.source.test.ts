import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const activeIdentityFiles = [
  "package.json",
  "turbo.json",
  "docker-compose.yml",
  ".github/workflows/ci.yml",
  "apps/server/.env-cmdrc.example",
  "apps/web/vite.config.ts",
  "apps/web/src/lib/api.ts",
] as const;

describe("active Ossie technical identity", () => {
  it.each(activeIdentityFiles)("removes the former identity from %s", (path) => {
    const source = readFileSync(resolve(repositoryRoot, path), "utf8");

    expect(source).not.toMatch(/DEMO_COMPOSER|demo_composer|demo-composer/i);
  });

  it("uses Ossie package and runtime configuration names", () => {
    const packageSource = readFileSync(resolve(repositoryRoot, "package.json"), "utf8");
    const turboSource = readFileSync(resolve(repositoryRoot, "turbo.json"), "utf8");

    expect(JSON.parse(packageSource).name).toBe("ossie");
    expect(turboSource).toContain("OSSIE_DEPLOYMENT_MODE");
    expect(turboSource).toContain("VITE_OSSIE_API_URL");
  });
});
