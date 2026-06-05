import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  createGuideFromCaptureSession,
  deleteGuideBlock,
  getCaptureSessionDetail,
  getGuideDetail,
  listProjectGuides,
  reorderGuideBlocks,
  resolveApiAssetUrl,
  updateGuide,
  updateGuideStep,
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

const guide_response = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: null,
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  guide_blocks: [],
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

  it("fetches guide detail with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(guide_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getGuideDetail("project_1", "guide_1")).resolves.toEqual(guide_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/guide_1",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists project guides with session cookies", async () => {
    const response = {
      guides: [guide_response.guide],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjectGuides("project_1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("creates a guide from a capture session with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(guide_response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(createGuideFromCaptureSession("project_1", "capture_session_1", {
      title: "Create department workflow",
      description: null,
    })).resolves.toEqual(guide_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/from-capture-session/capture_session_1",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Create department workflow",
          description: null,
        }),
      }
    );
  });

  it("updates guide metadata and guide steps", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      guide: guide_response.guide,
      guide_step: {
        id: "step_1",
        title: "Updated step",
        body: "Details",
      },
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await updateGuide("project_1", "guide_1", {
      title: "Updated",
      description: null,
    });
    await updateGuideStep("project_1", "guide_1", "step_1", {
      title: "Updated step",
      body: "Details",
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/projects/project_1/guides/guide_1",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Updated",
          description: null,
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/projects/project_1/guides/guide_1/steps/step_1",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Updated step",
          body: "Details",
        }),
      }
    );
  });

  it("reorders and deletes guide blocks", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      guide_blocks: [],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await reorderGuideBlocks("project_1", "guide_1", ["block_2", "block_1"]);
    await deleteGuideBlock("project_1", "guide_1", "block_1");

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/projects/project_1/guides/guide_1/blocks/reorder",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          block_ids: ["block_2", "block_1"],
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/projects/project_1/guides/guide_1/blocks/block_1",
      {
        method: "DELETE",
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
      type: "unauthenticated",
      message: "Authentication is required",
    });
  });

  it("preserves backend error type", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "guide_not_editable",
        message: "Guide is not editable",
      },
    }), {
      status: 409,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(updateGuideStep("project_1", "guide_1", "step_1", {
      title: "Blocked",
    })).rejects.toMatchObject({
      kind: "validation",
      type: "guide_not_editable",
      message: "Guide is not editable",
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
