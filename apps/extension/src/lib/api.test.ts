import { afterEach, describe, expect, it, vi } from "vitest";
import { createCaptureSession, getCurrentAuth, listProjects, login, logout } from "./api";

const auth = {
  user: {
    id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_1",
    role: "owner",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-05T00:00:00.000Z",
  },
};

const project = {
  id: "project_1",
  organization_id: "organization_1",
  name: "Internal onboarding demos",
  description: null,
  slug: null,
  color: null,
  icon: null,
  status: "active",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:00:00.000Z",
  updated_at: "2026-06-05T10:05:00.000Z",
};

const captureSession = {
  id: "capture_session_1",
  organization_id: "organization_1",
  project_id: "project_1",
  name: "Capture from Example Page",
  description: null,
  status: "draft",
  source_type: "extension",
  started_at: null,
  completed_at: null,
  canceled_at: null,
  start_url: "https://example.com/path",
  browser_name: "Chrome",
  browser_version: null,
  operating_system: null,
  viewport_width: null,
  viewport_height: null,
  device_pixel_ratio: null,
  user_agent: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:00:00.000Z",
  updated_at: "2026-06-05T10:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extension API client", () => {
  it("logs in against the configured instance and returns the extension token", async () => {
    const response = { auth, session_token: "extension-session-token" };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(login("https://demo.example.com", {
      email: "owner@example.com",
      password: "safe password",
    })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith("https://demo.example.com/api/v1/authentication/login", {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-demo-composer-client": "extension",
      },
      body: JSON.stringify({
        email: "owner@example.com",
        password: "safe password",
      }),
    });
  });

  it("checks current auth and lists projects with bearer auth", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ auth }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ projects: [project] }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }));
    vi.stubGlobal("fetch", fetch);

    await expect(getCurrentAuth("https://demo.example.com", "extension-session-token")).resolves.toEqual({ auth });
    await expect(listProjects("https://demo.example.com", "extension-session-token")).resolves.toEqual({ projects: [project] });

    expect(fetch).toHaveBeenNthCalledWith(1, "https://demo.example.com/api/v1/authentication/me", {
      credentials: "include",
      headers: {
        accept: "application/json",
        authorization: "Bearer extension-session-token",
      },
    });
    expect(fetch).toHaveBeenNthCalledWith(2, "https://demo.example.com/api/v1/projects", {
      credentials: "include",
      headers: {
        accept: "application/json",
        authorization: "Bearer extension-session-token",
      },
    });
  });

  it("logs out with bearer auth", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);

    await expect(logout("https://demo.example.com", "extension-session-token")).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith("https://demo.example.com/api/v1/authentication/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
        authorization: "Bearer extension-session-token",
      },
    });
  });

  it("creates capture sessions with bearer auth and extension attribution", async () => {
    const response = { capture_session: captureSession };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(createCaptureSession(
      "https://demo.example.com/",
      "extension-session-token",
      "project with spaces",
      {
        name: "Capture from Example Page",
        source_type: "extension",
        start_url: "https://example.com/path",
        metadata: {
          tab_title: "Example Page",
        },
      }
    )).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "https://demo.example.com/api/v1/projects/project%20with%20spaces/capture-sessions",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          authorization: "Bearer extension-session-token",
          "content-type": "application/json",
          "x-demo-composer-client": "extension",
        },
        body: JSON.stringify({
          name: "Capture from Example Page",
          source_type: "extension",
          start_url: "https://example.com/path",
          metadata: {
            tab_title: "Example Page",
          },
        }),
      }
    );
  });

  it("maps backend errors", async () => {
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

    await expect(login("https://demo.example.com", {
      email: "owner@example.com",
      password: "bad password",
    })).rejects.toMatchObject({
      type: "invalid_credentials",
      message: "Email or password is incorrect",
      status: 401,
    });
  });
});
