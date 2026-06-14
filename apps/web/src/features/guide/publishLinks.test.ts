import { describe, expect, it } from "vitest";
import { publicGuideEmbedCode, publicGuideEmbedUrl } from "./publishLinks";

describe("publish link helpers", () => {
  it("builds deterministic public guide embed URLs", () => {
    expect(publicGuideEmbedUrl("/p/abc123", "https://portal.example.test")).toBe("https://portal.example.test/p/abc123/embed");
    expect(publicGuideEmbedUrl("/p/abc123/", "https://portal.example.test")).toBe("https://portal.example.test/p/abc123/embed");
    expect(publicGuideEmbedUrl("/p/abc123/embed", "https://portal.example.test")).toBe("https://portal.example.test/p/abc123/embed");
    expect(publicGuideEmbedUrl("https://docs.example.test/p/abc123?utm=test#top")).toBe("https://docs.example.test/p/abc123/embed");
  });

  it("builds escaped iframe embed code", () => {
    expect(publicGuideEmbedCode({
      publicUrl: "/p/abc123",
      title: "Department \"setup\" <guide>",
      origin: "https://portal.example.test",
    })).toBe(
      "<iframe src=\"https://portal.example.test/p/abc123/embed\" title=\"Department &quot;setup&quot; &lt;guide&gt;\" width=\"100%\" height=\"720\" loading=\"lazy\" style=\"border:0;\"></iframe>"
    );
  });
});
