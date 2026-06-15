import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError, type ProjectInteractiveDemoListResponse } from "../../lib/api";
import { ProjectInteractiveDemoListPage } from "./ProjectInteractiveDemoListPage";
import type { InteractiveDemo } from "./types";

const demo: InteractiveDemo = {
  id: "interactive_demo_1",
  organization_id: "organization_1",
  project_id: "project_1",
  source_capture_session_id: "capture_session_1",
  title: "Department setup demo",
  description: "Shows how to add a department.",
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:00:00.000Z",
  updated_at: "2026-06-05T10:05:00.000Z",
};

const renderPage = (overrides: {
  projectId?: string;
  loadDemos?: (projectId: string) => Promise<ProjectInteractiveDemoListResponse>;
  currentPath?: string;
  navigate?: (path: string) => void;
  performLogout?: () => Promise<void>;
} = {}) => {
  const loadDemos = overrides.loadDemos ?? vi.fn(async () => ({ interactive_demos: [demo] }));

  render(
    <ProjectInteractiveDemoListPage
      projectId={overrides.projectId ?? "project_1"}
      loadDemos={loadDemos}
      currentPath={overrides.currentPath}
      navigate={overrides.navigate}
      performLogout={overrides.performLogout}
    />
  );

  return { loadDemos };
};

describe("ProjectInteractiveDemoListPage", () => {
  it("lists project interactive demos and opens the editor", async () => {
    const { loadDemos } = renderPage();

    expect(screen.getByText("Loading interactive demos...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Interactive demos" })).toBeInTheDocument();
    expect(screen.getByText("Department setup demo")).toBeInTheDocument();
    expect(screen.getByText("Shows how to add a department.")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("Source capture: capture_session_1")).toBeInTheDocument();
    expect(screen.getByText(/Updated /)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open demo Department setup demo" })).toHaveAttribute(
      "href",
      "/projects/project_1/interactive-demos/interactive_demo_1"
    );
    expect(loadDemos).toHaveBeenCalledWith("project_1");
  });

  it("URL-encodes project and demo IDs in links", async () => {
    renderPage({
      projectId: "project / 1",
      loadDemos: async () => ({
        interactive_demos: [{
          ...demo,
          id: "interactive / 1",
        }],
      }),
    });

    expect(await screen.findByRole("link", { name: "Open demo Department setup demo" })).toHaveAttribute(
      "href",
      "/projects/project%20%2F%201/interactive-demos/interactive%20%2F%201"
    );
  });

  it("shows an empty state with a capture-session link", async () => {
    renderPage({ loadDemos: async () => ({ interactive_demos: [] }) });

    expect(await screen.findByText("No interactive demos yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open capture sessions" })).toHaveAttribute(
      "href",
      "/projects/project_1/capture-sessions"
    );
  });

  it("renders unauthenticated and retry states", async () => {
    const { rerender } = render(
      <ProjectInteractiveDemoListPage
        projectId="project_1"
        currentPath="/projects/project_1/interactive-demos"
        loadDemos={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "unauthenticated",
            message: "Authentication required",
          });
        }}
      />
    );

    expect(await screen.findByText("Sign in to view interactive demos.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Finteractive-demos"
    );

    const loadDemos = vi
      .fn<() => Promise<ProjectInteractiveDemoListResponse>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ interactive_demos: [demo] });

    rerender(
      <ProjectInteractiveDemoListPage
        projectId="project_1"
        loadDemos={loadDemos}
      />
    );

    expect(await screen.findByText("Could not load interactive demos.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadDemos).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Department setup demo")).toBeInTheDocument();
  });
});
