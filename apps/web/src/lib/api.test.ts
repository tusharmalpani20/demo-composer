import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  createGuideFromCaptureSession,
  deleteGuideBlock,
  getCurrentAuth,
  getCaptureSessionDetail,
  getGuideDetail,
  getGuidePublishStatus,
  getProject,
  getPublicPublishLink,
  login,
  listProjects,
  listProjectCaptureSessions,
  listProjectGuides,
  logout,
  publishGuide,
  reorderGuideBlocks,
  resolveApiAssetUrl,
  revokeGuidePublishLink,
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
  source_capture_assets: [],
};

const public_publish_response = {
  publish_link: {
    slug: "abc123",
    artifact_type: "guide",
    visibility: "public",
    status: "active",
  },
  published_artifact: {
    id: "published_artifact_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    version_number: 1,
    title: "Department guide",
    published_at: "2026-06-10T00:00:00.000Z",
    snapshot: {
      artifact_type: "guide",
      guide: {
        id: "guide_1",
        title: "Department guide",
        description: "Set up departments.",
        source_capture_session_id: "capture_session_1",
        published_version: 1,
        published_at: "2026-06-10T00:00:00.000Z",
      },
      blocks: [],
    },
  },
};

const guide_publish_response = {
  publish_link: {
    id: "publish_link_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    published_artifact_id: "published_artifact_1",
    slug: "abc123",
    visibility: "public",
    status: "active",
    published_at: "2026-06-11T00:00:00.000Z",
    revoked_at: null,
    public_url: "/p/abc123",
  },
  published_artifact: {
    id: "published_artifact_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    version_number: 1,
    title: "Department guide",
    published_at: "2026-06-11T00:00:00.000Z",
  },
};

const project_response = {
  project: {
    id: "project_1",
    organization_id: "organization_1",
    name: "Internal onboarding demos",
    description: "Reusable captures and guides for internal teams.",
    slug: "internal-onboarding-demos",
    color: "#2563eb",
    icon: "folder",
    status: "active",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
  },
};

const auth_response = {
  auth: {
    user: {
      id: "user_1",
      email: "person@example.com",
      display_name: "Person Example",
    },
    organization: {
      id: "organization_1",
      name: "Example Org",
    },
    org_user: {
      id: "org_user_1",
      role: "owner",
    },
    session: {
      id: "session_1",
      session_type: "web",
      expires_at: "2026-06-06T10:00:00.000Z",
    },
  },
};

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches project detail with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(project_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getProject("project_1")).resolves.toEqual(project_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("fetches the current auth context with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(auth_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getCurrentAuth()).resolves.toEqual(auth_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/authentication/me",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("logs in with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(auth_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(login({
      email: "person@example.com",
      password: "secret",
    })).resolves.toEqual(auth_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/authentication/login",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "person@example.com",
          password: "secret",
        }),
      }
    );
  });

  it("logs out with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);

    await expect(logout()).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/authentication/logout",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("URL-encodes project IDs while fetching project detail", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(project_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await getProject("project / 1");

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists projects with session cookies", async () => {
    const response = {
      projects: [project_response.project],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjects()).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists projects filtered by status", async () => {
    const response = {
      projects: [project_response.project],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjects({ status: "archived" })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects?status=archived",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
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

  it("lists project capture sessions with session cookies", async () => {
    const response = {
      capture_sessions: [detail_response.capture_session],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjectCaptureSessions("project_1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/capture-sessions",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists project capture sessions filtered by status", async () => {
    const response = {
      capture_sessions: [detail_response.capture_session],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjectCaptureSessions("project_1", { status: "completed" })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/capture-sessions?status=completed",
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

  it("fetches public publish links by slug", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(public_publish_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getPublicPublishLink("abc 123")).resolves.toEqual(public_publish_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/public/publish-links/abc%20123",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("fetches guide publish status with session cookies", async () => {
    const response = {
      publish_link: null,
      published_artifact: null,
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getGuidePublishStatus("project / 1", "guide / 1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201/guides/guide%20%2F%201/publish",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("publishes guides with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(guide_publish_response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(publishGuide("project_1", "guide_1")).resolves.toEqual(guide_publish_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/guide_1/publish",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("revokes guide publish links with session cookies", async () => {
    const response = {
      publish_link: {
        id: "publish_link_1",
        status: "revoked",
        revoked_at: "2026-06-11T01:00:00.000Z",
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(revokeGuidePublishLink("project_1", "guide_1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/guide_1/publish",
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("maps guide publish validation errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "guide_has_no_publishable_blocks",
        message: "Guide has no publishable blocks",
      },
    }), {
      status: 400,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(publishGuide("project_1", "guide_1")).rejects.toMatchObject({
      kind: "validation",
      type: "guide_has_no_publishable_blocks",
      message: "Guide has no publishable blocks",
    });

    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "guide_not_publishable",
        message: "Guide is not publishable",
      },
    }), {
      status: 409,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(publishGuide("project_1", "guide_1")).rejects.toMatchObject({
      kind: "validation",
      type: "guide_not_publishable",
      message: "Guide is not publishable",
    });
  });

  it("maps missing or revoked public publish links to not found", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "publish_link_not_found",
        message: "Publish link was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(getPublicPublishLink("missing")).rejects.toMatchObject({
      kind: "not_found",
      type: "publish_link_not_found",
      message: "Publish link was not found",
    });
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

  it("maps invalid credentials while logging in", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "invalid_credentials",
        message: "Email or password is incorrect",
      },
    }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(login({
      email: "person@example.com",
      password: "wrong",
    })).rejects.toMatchObject({
      kind: "unauthenticated",
      type: "invalid_credentials",
      message: "Email or password is incorrect",
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

  it("maps project not found errors while listing guides", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "project_not_found",
        message: "Project was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(listProjectGuides("missing")).rejects.toMatchObject({
      kind: "not_found",
      type: "project_not_found",
      message: "Project was not found",
    });
  });

  it("maps project not found errors while fetching project detail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "project_not_found",
        message: "Project was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(getProject("missing")).rejects.toMatchObject({
      kind: "not_found",
      type: "project_not_found",
      message: "Project was not found",
    });
  });

  it("maps unauthenticated errors while fetching project detail", async () => {
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

    await expect(getProject("project_1")).rejects.toMatchObject({
      kind: "unauthenticated",
      type: "unauthenticated",
      message: "Authentication is required",
    });
  });

  it("maps unauthenticated errors while listing projects", async () => {
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

    await expect(listProjects()).rejects.toMatchObject({
      kind: "unauthenticated",
      type: "unauthenticated",
      message: "Authentication is required",
    });
  });

  it("maps project not found errors while listing capture sessions", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "project_not_found",
        message: "Project was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(listProjectCaptureSessions("missing")).rejects.toMatchObject({
      kind: "not_found",
      type: "project_not_found",
      message: "Project was not found",
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
