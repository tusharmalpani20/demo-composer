import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentTabSnapshot } from "./current-tab";

afterEach(() => {
  vi.unstubAllGlobals();
});

const stubChromeTabs = (tab: { url?: string; title?: string } | undefined) => {
  const query = vi.fn(async () => (tab ? [tab] : []));

  vi.stubGlobal("chrome", {
    tabs: {
      query,
    },
  });

  return query;
};

describe("current tab helper", () => {
  it("returns nulls when Chrome tabs API is unavailable", async () => {
    vi.stubGlobal("chrome", {});

    await expect(getCurrentTabSnapshot()).resolves.toEqual({
      url: null,
      title: null,
    });
  });

  it("returns the active HTTP tab URL and title", async () => {
    const query = stubChromeTabs({
      url: "https://example.com/path",
      title: "Example Page",
    });

    await expect(getCurrentTabSnapshot()).resolves.toEqual({
      url: "https://example.com/path",
      title: "Example Page",
    });
    expect(query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
  });

  it("drops non-HTTP tab URLs", async () => {
    for (const url of [
      "chrome://extensions",
      "about:blank",
      "chrome-extension://extension-id/page.html",
      "file:///tmp/demo.html",
    ]) {
      stubChromeTabs({
        url,
        title: "Internal Page",
      });

      await expect(getCurrentTabSnapshot()).resolves.toEqual({
        url: null,
        title: "Internal Page",
      });
    }
  });
});
