import { afterEach, describe, expect, it, vi } from "vitest";
import { openPortalUrl } from "./navigation";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("openPortalUrl", () => {
  it("opens portal URLs with chrome tabs when available", async () => {
    const create = vi.fn((input: { url: string }, callback?: () => void) => {
      callback?.();
    });
    vi.stubGlobal("chrome", {
      tabs: {
        create,
      },
      runtime: {
        lastError: undefined,
      },
    });

    await expect(openPortalUrl("https://demo.example.com/projects/project_1")).resolves.toBeUndefined();

    expect(create).toHaveBeenCalledWith({
      url: "https://demo.example.com/projects/project_1",
    }, expect.any(Function));
  });

  it("falls back to window open when chrome tabs are unavailable", async () => {
    const open = vi.fn(() => ({}));
    vi.stubGlobal("open", open);

    await expect(openPortalUrl("https://demo.example.com/projects/project_1")).resolves.toBeUndefined();

    expect(open).toHaveBeenCalledWith(
      "https://demo.example.com/projects/project_1",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("rejects when the window open fallback is blocked", async () => {
    const open = vi.fn(() => null);
    vi.stubGlobal("open", open);

    await expect(openPortalUrl("https://demo.example.com/projects/project_1")).rejects.toThrow(
      "Could not open portal URL."
    );
  });

  it("rejects when no navigation mechanism is available", async () => {
    vi.stubGlobal("open", undefined);

    await expect(openPortalUrl("https://demo.example.com/projects/project_1")).rejects.toThrow(
      "Could not open portal URL."
    );
  });
});
