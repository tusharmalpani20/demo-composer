import { describe, expect, it } from "vitest";
import { buildPortalCaptureSessionUrl, normalizeInstanceUrl } from "./url";

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

describe("buildPortalCaptureSessionUrl", () => {
  it("builds absolute portal URLs from safe relative redirect paths", () => {
    expect(buildPortalCaptureSessionUrl(
      "https://demo.example.com/",
      "/projects/project_1/capture-sessions/capture_session_1",
      "fallback_project",
      "fallback_session"
    )).toBe("https://demo.example.com/projects/project_1/capture-sessions/capture_session_1");
  });

  it("falls back to encoded local paths when redirect paths are missing or unsafe", () => {
    expect(buildPortalCaptureSessionUrl(
      "https://demo.example.com///",
      null,
      "project with spaces",
      "capture/session"
    )).toBe("https://demo.example.com/projects/project%20with%20spaces/capture-sessions/capture%2Fsession");

    expect(buildPortalCaptureSessionUrl(
      "https://demo.example.com",
      "https://evil.example/projects/project_1",
      "project with spaces",
      "capture/session"
    )).toBe("https://demo.example.com/projects/project%20with%20spaces/capture-sessions/capture%2Fsession");

    expect(buildPortalCaptureSessionUrl(
      "https://demo.example.com",
      "//evil.example/projects/project_1",
      "project with spaces",
      "capture/session"
    )).toBe("https://demo.example.com/projects/project%20with%20spaces/capture-sessions/capture%2Fsession");
  });
});
