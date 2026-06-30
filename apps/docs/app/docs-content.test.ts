import { describe, expect, it } from "vitest";
import {
  docsLinks,
  evidenceItems,
  knownLimitations,
  productCapabilities,
  siteSummary,
} from "./docs-content";

describe("docs content", () => {
  it("describes Demo Composer as alpha self-hosted documentation software", () => {
    expect(siteSummary.name).toBe("Demo Composer");
    expect(siteSummary.status).toContain("alpha");
    expect(siteSummary.positioning.toLowerCase()).toContain("self-hosted");
    expect(siteSummary.positioning).toContain("guides");
    expect(siteSummary.positioning).toContain("interactive demos");
  });

  it("links to the source-of-truth markdown docs", () => {
    expect(docsLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Self-hosting quickstart", href: expect.stringContaining("/docs/self-hosting.md") }),
        expect.objectContaining({ label: "Operations guide", href: expect.stringContaining("/docs/operations.md") }),
        expect.objectContaining({ label: "Production readiness checklist", href: expect.stringContaining("/docs/production-readiness-checklist.md") }),
        expect.objectContaining({ label: "Roadmap", href: expect.stringContaining("/docs/roadmap.md") }),
        expect.objectContaining({ label: "Contributor guide", href: expect.stringContaining("/docs/contributor-guide.md") }),
      ])
    );
  });

  it("keeps alpha limitations and plan 084 ops leftovers visible", () => {
    expect(knownLimitations).toEqual(
      expect.arrayContaining([
        "Chrome extension screenshots are pending until extension dogfood has a passing or bounded capture path.",
        "Storage inventory and cleanup tooling are still future self-host operations work.",
        "Backup/restore rehearsal, one-command packaging, shared rate limiting, and object storage remain deferred.",
      ])
    );
  });

  it("summarizes current capabilities and safe evidence assets", () => {
    expect(productCapabilities).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Screenshot-first capture"),
        expect.stringContaining("Scribe-style guides"),
        expect.stringContaining("Storylane-style interactive demos"),
      ])
    );
    expect(evidenceItems.map((item) => item.src)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/alpha-project-workspace.png"),
        expect.stringContaining("/alpha-guide-editor.png"),
        expect.stringContaining("/alpha-demo-editor.png"),
      ])
    );
  });
});
