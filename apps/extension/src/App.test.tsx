import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError, type AuthResponse, type Project } from "./lib/api";
import { App } from "./App";
import type { ExtensionSettings } from "./lib/settings";

const auth: AuthResponse["auth"] = {
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

const projects: Project[] = [
  {
    id: "project_2",
    organization_id: "organization_1",
    name: "Archived onboarding demos",
    description: null,
    slug: null,
    color: null,
    icon: null,
    status: "archived",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 2,
    created_at: "2026-06-05T09:00:00.000Z",
    updated_at: "2026-06-05T09:30:00.000Z",
  },
  {
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
  },
];

const defaultSettings: ExtensionSettings = {
  instanceUrl: null,
  sessionToken: null,
  selectedProjectId: null,
  activeCaptureSessionId: null,
  activeCaptureProjectId: null,
};

const captureSessionResponse = {
  capture_session: {
    id: "capture_session_1",
    project_id: "project_1",
    source_type: "extension" as const,
    status: "draft" as const,
  },
};

const renderApp = (overrides: {
  settings?: ExtensionSettings;
  getCurrentAuth?: (instanceUrl: string, sessionToken: string) => Promise<AuthResponse>;
  listProjects?: (instanceUrl: string, sessionToken: string) => Promise<{ projects: Project[] }>;
  login?: (instanceUrl: string, data: { email: string; password: string }) => Promise<AuthResponse & { session_token: string }>;
  createCaptureSession?: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
    data: {
      name: string;
      source_type: "extension";
      start_url?: string | null;
      metadata?: Record<string, unknown>;
    }
  ) => Promise<typeof captureSessionResponse>;
  getCurrentTabSnapshot?: () => Promise<{ url: string | null; title: string | null }>;
  saveInstanceUrl?: (instanceUrl: string) => Promise<void>;
  saveSessionToken?: (sessionToken: string | null) => Promise<void>;
  saveSelectedProjectId?: (projectId: string | null) => Promise<void>;
  saveActiveCapture?: (input: { captureSessionId: string; projectId: string }) => Promise<void>;
  clearActiveCapture?: () => Promise<void>;
  clearSettings?: () => Promise<void>;
  logout?: (instanceUrl: string, sessionToken: string) => Promise<void>;
} = {}) => {
  const dependencies = {
    getSettings: vi.fn(async () => overrides.settings ?? defaultSettings),
    saveInstanceUrl: vi.fn(overrides.saveInstanceUrl ?? (async () => {})),
    saveSessionToken: vi.fn(overrides.saveSessionToken ?? (async () => {})),
    saveSelectedProjectId: vi.fn(overrides.saveSelectedProjectId ?? (async () => {})),
    clearSettings: vi.fn(overrides.clearSettings ?? (async () => {})),
    getCurrentAuth: vi.fn(overrides.getCurrentAuth ?? (async () => ({ auth }))),
    login: vi.fn(overrides.login ?? (async () => ({ auth, session_token: "extension-session-token" }))),
    listProjects: vi.fn(overrides.listProjects ?? (async () => ({ projects }))),
    createCaptureSession: vi.fn(overrides.createCaptureSession ?? (async () => captureSessionResponse)),
    getCurrentTabSnapshot: vi.fn(overrides.getCurrentTabSnapshot ?? (async () => ({
      url: "https://example.com/path",
      title: "Example Page",
    }))),
    saveActiveCapture: vi.fn(overrides.saveActiveCapture ?? (async () => {})),
    clearActiveCapture: vi.fn(overrides.clearActiveCapture ?? (async () => {})),
    logout: vi.fn(overrides.logout ?? (async () => {})),
  };

  render(<App dependencies={dependencies} />);

  return dependencies;
};

describe("extension popup App", () => {
  it("starts in the unconfigured state and saves valid instance URLs", async () => {
    const dependencies = renderApp();

    expect(await screen.findByRole("heading", { name: "Connect instance" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Instance URL"), {
      target: {
        value: "http://localhost:4000/",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() => expect(dependencies.saveInstanceUrl).toHaveBeenCalledWith("http://localhost:4000"));
  });

  it("rejects invalid instance URLs", async () => {
    renderApp();

    expect(await screen.findByRole("heading", { name: "Connect instance" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Instance URL"), {
      target: {
        value: "localhost:4000",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(screen.getByText("Enter a valid http:// or https:// instance URL.")).toBeInTheDocument();
  });

  it("renders signed-out form when saved token is unauthenticated", async () => {
    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "expired-token",
        selectedProjectId: null,
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
      },
      getCurrentAuth: async () => {
        throw new ApiClientError({
          status: 401,
          type: "unauthenticated",
          message: "Authentication is required",
        });
      },
    });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("https://demo.example.com")).toBeInTheDocument();
  });

  it("signs in and renders projects in response order", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: null,
        selectedProjectId: null,
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
      },
    });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: {
        value: "owner@example.com",
      },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "safe password",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Select project" })).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    const projectButtons = screen.getAllByRole("button", { name: /Use / });
    expect(projectButtons).toHaveLength(2);
    expect(within(projectButtons[0]!).getByText("Archived onboarding demos")).toBeInTheDocument();
    expect(within(projectButtons[1]!).getByText("Internal onboarding demos")).toBeInTheDocument();
    expect(dependencies.login).toHaveBeenCalledWith("https://demo.example.com", {
      email: "owner@example.com",
      password: "safe password",
    });
    expect(dependencies.saveSessionToken).toHaveBeenCalledWith("extension-session-token");
  });

  it("persists selected project ids", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: null,
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
      },
    });

    expect(await screen.findByRole("heading", { name: "Select project" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Use Internal onboarding demos/ }));

    await waitFor(() => expect(dependencies.saveSelectedProjectId).toHaveBeenCalledWith("project_1"));
  });

  it("clears stale selected projects that are no longer returned", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "missing_project",
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
      },
    });

    expect(await screen.findByRole("heading", { name: "Select project" })).toBeInTheDocument();
    await waitFor(() => expect(dependencies.saveSelectedProjectId).toHaveBeenCalledWith(null));
  });

  it("changes instance by clearing settings", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
      },
    });

    expect(await screen.findByRole("heading", { name: "Ready to capture" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change instance" }));

    await waitFor(() => expect(dependencies.clearSettings).toHaveBeenCalled());
  });

  it("renders API errors with retry", async () => {
    const listProjects = vi
      .fn<() => Promise<{ projects: Project[] }>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ projects });

    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: null,
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
      },
      listProjects: async () => listProjects(),
    });

    expect(await screen.findByText("Could not load projects.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Select project" })).toBeInTheDocument();
  });

  it("starts capture for the selected project with current tab metadata", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
      },
    });

    expect(await screen.findByRole("heading", { name: "Ready to capture" })).toBeInTheDocument();
    expect(screen.getAllByText("Internal onboarding demos")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Start capture" }));

    await waitFor(() => expect(dependencies.createCaptureSession).toHaveBeenCalledWith(
      "https://demo.example.com",
      "extension-session-token",
      "project_1",
      expect.objectContaining({
        name: "Capture from Example Page",
        source_type: "extension",
        start_url: "https://example.com/path",
        metadata: expect.objectContaining({
          tab_title: "Example Page",
        }),
      })
    ));
    await waitFor(() => expect(dependencies.saveActiveCapture).toHaveBeenCalledWith({
      captureSessionId: "capture_session_1",
      projectId: "project_1",
    }));
    expect(await screen.findByRole("heading", { name: "Capture active" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change instance" })).not.toBeDisabled();
  });

  it("restores active capture state and prevents another start", async () => {
    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
      },
    });

    expect(await screen.findByRole("heading", { name: "Capture active" })).toBeInTheDocument();
    expect(screen.getByText("Internal onboarding demos")).toBeInTheDocument();
    expect(screen.getByText(/capture_session_1/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start capture" })).not.toBeInTheDocument();
  });

  it("keeps unresolved active capture state when the active project is missing", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "missing_project",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "missing_project",
      },
    });

    expect(await screen.findByRole("heading", { name: "Capture active" })).toBeInTheDocument();
    expect(screen.getByText("Project unavailable")).toBeInTheDocument();
    expect(dependencies.saveSelectedProjectId).toHaveBeenCalledWith(null);
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
  });

  it("discards local active capture state", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
      },
    });

    expect(await screen.findByRole("heading", { name: "Capture active" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Discard local capture state" }));

    await waitFor(() => expect(dependencies.clearActiveCapture).toHaveBeenCalled());
  });

  it("clears the local session when sign out cannot reach the server", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
      },
      logout: async () => {
        throw new Error("Network failed");
      },
    });

    expect(await screen.findByRole("heading", { name: "Capture active" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(dependencies.saveSessionToken).toHaveBeenCalledWith(null));
  });

  it("renders capture start errors without clearing the selected project", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
      },
      createCaptureSession: async () => {
        throw new ApiClientError({
          status: 404,
          type: "project_not_found",
          message: "Project was not found",
        });
      },
    });

    expect(await screen.findByRole("heading", { name: "Ready to capture" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start capture" }));

    expect(await screen.findByText("Project was not found")).toBeInTheDocument();
    expect(dependencies.saveSelectedProjectId).not.toHaveBeenCalledWith(null);
    expect(dependencies.saveActiveCapture).not.toHaveBeenCalled();
  });
});
