import { describe, expect, it } from "vitest";
import { normalizeInstanceUrl } from "./url";

describe("normalizeInstanceUrl", () => {
  it("normalizes valid http and https instance URLs", () => {
    expect(normalizeInstanceUrl(" http://localhost:4000/ ")).toEqual({
      ok: true,
      value: "http://localhost:4000",
    });
    expect(normalizeInstanceUrl("https://demo.example.com///")).toEqual({
      ok: true,
      value: "https://demo.example.com",
    });
  });

  it("rejects missing protocols and invalid URL strings", () => {
    expect(normalizeInstanceUrl("localhost:4000")).toEqual({
      ok: false,
      error: "Enter a valid http:// or https:// instance URL.",
    });
    expect(normalizeInstanceUrl("not a url")).toEqual({
      ok: false,
      error: "Enter a valid http:// or https:// instance URL.",
    });
  });
});
