import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const documentSource = readFileSync(
  join(sourceDirectory, "..", "index.html"),
  "utf8",
);

describe("portal document metadata", () => {
  it("uses the Ossie display brand", () => {
    expect(documentSource).toContain("<title>Ossie</title>");
    expect(documentSource).toContain('content="Ossie web portal"');
  });
});
