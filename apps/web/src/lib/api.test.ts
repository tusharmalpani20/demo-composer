import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  getCaptureSessionDetail,
  resolveApiAssetUrl,
} from "./api";

const detail_response = {
  capture_session: {
    id: "capture_session_1",
    organization_id: "organization_1",
    project_id: "project_1",
    name: "Create department workflow",
    description: null,
    status: "draft",
    source_type: "extension",
    started_at: null,
    completed_at: null,
    canceled_at: null,
    start_url: "https://example.internal/app",
    browser_name: "Chrome",
    browser_version: "126",
    operating_system: "Linux",
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 1,
    user_agent: "Mozilla/5.0",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  capture_events: [],
  capture_assets: [],
};

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches capture session detail with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(detail_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getCaptureSessionDetail("project_1", "capture_session_1")).resolves.toEqual(detail_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/detail",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("maps known backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(getCaptureSessionDetail("project_1", "capture_session_1")).rejects.toMatchObject({
      kind: "unauthenticated",
      message: "Authentication is required",
    });
  });

  it("maps not found errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "capture_session_not_found",
        message: "Capture session was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(getCaptureSessionDetail("project_1", "missing")).rejects.toBeInstanceOf(ApiClientError);
    await expect(getCaptureSessionDetail("project_1", "missing")).rejects.toMatchObject({
      kind: "not_found",
    });
  });

  it("resolves relative asset URLs against optional API base URLs", () => {
    expect(resolveApiAssetUrl("/api/v1/projects/project_1/file")).toBe("/api/v1/projects/project_1/file");
    expect(resolveApiAssetUrl(
      "/api/v1/projects/project_1/file",
      "https://demo.example.com"
    )).toBe("https://demo.example.com/api/v1/projects/project_1/file");
  });
});
