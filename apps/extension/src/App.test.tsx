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
};

const renderApp = (overrides: {
  settings?: ExtensionSettings;
  getCurrentAuth?: (instanceUrl: string, sessionToken: string) => Promise<AuthResponse>;
  listProjects?: (instanceUrl: string, sessionToken: string) => Promise<{ projects: Project[] }>;
  login?: (instanceUrl: string, data: { email: string; password: string }) => Promise<AuthResponse & { session_token: string }>;
  saveInstanceUrl?: (instanceUrl: string) => Promise<void>;
  saveSessionToken?: (sessionToken: string | null) => Promise<void>;
  saveSelectedProjectId?: (projectId: string | null) => Promise<void>;
  clearSettings?: () => Promise<void>;
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
      },
    });

    expect(await screen.findByRole("heading", { name: "Select project" })).toBeInTheDocument();
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
      },
      listProjects: async () => listProjects(),
    });

    expect(await screen.findByText("Could not load projects.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Select project" })).toBeInTheDocument();
  });
});
