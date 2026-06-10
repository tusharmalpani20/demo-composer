import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ProjectGuideListPage } from "./ProjectGuideListPage";
import type { Guide } from "./types";

const guides: Guide[] = [
  {
    id: "guide_2",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: null,
    title: "Archived onboarding guide",
    description: null,
    status: "archived",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 3,
    created_at: "2026-06-05T09:00:00.000Z",
    updated_at: "2026-06-05T11:00:00.000Z",
  },
  {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: "Set up departments from the list view.",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:30:00.000Z",
  },
];

const renderPage = (overrides: {
  projectId?: string;
  loadGuides?: () => Promise<{ guides: Guide[] }>;
} = {}) => {
  const loadGuides = overrides.loadGuides ?? vi.fn(async () => ({ guides }));

  render(
    <ProjectGuideListPage
      projectId={overrides.projectId ?? "project_1"}
      loadGuides={loadGuides}
    />
  );

  return { loadGuides };
};

describe("ProjectGuideListPage", () => {
  it("renders project guides in response order with editor and preview links", async () => {
    const { loadGuides } = renderPage();

    expect(screen.getByText("Loading guides...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Guides" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();

    const rows = screen.getAllByRole("article");
    expect(within(rows[0]!).getByRole("heading", { name: "Archived onboarding guide" })).toBeInTheDocument();
    expect(within(rows[1]!).getByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("archived")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("Set up departments from the list view.")).toBeInTheDocument();
    expect(screen.getByText("No source capture")).toBeInTheDocument();
    expect(screen.getByText("Source capture: capture_session_1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open guide Department guide" })).toHaveAttribute(
      "href",
      "/projects/project_1/guides/guide_1"
    );
    expect(screen.getByRole("link", { name: "Preview guide Department guide" })).toHaveAttribute(
      "href",
      "/projects/project_1/guides/guide_1/preview"
    );
    expect(loadGuides).toHaveBeenCalledWith("project_1");
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
    expect(screen.queryByText("org_user_1")).not.toBeInTheDocument();
    expect(screen.queryByText("version")).not.toBeInTheDocument();
  });

  it("URL-encodes project and guide IDs in editor links", async () => {
    renderPage({
      projectId: "project 1",
      loadGuides: async () => ({
        guides: [{
          ...guides[0]!,
          id: "guide / 1",
          title: "Encoded guide",
        }],
      }),
    });

    expect(await screen.findByRole("link", { name: "Open guide Encoded guide" })).toHaveAttribute(
      "href",
      "/projects/project%201/guides/guide%20%2F%201"
    );
    expect(screen.getByRole("link", { name: "Preview guide Encoded guide" })).toHaveAttribute(
      "href",
      "/projects/project%201/guides/guide%20%2F%201/preview"
    );
  });

  it("renders empty guide lists", async () => {
    renderPage({
      loadGuides: async () => ({ guides: [] }),
    });

    expect(await screen.findByText("No guides yet.")).toBeInTheDocument();
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <ProjectGuideListPage
        projectId="project_1"
        currentPath="/projects/project_1/guides"
        loadGuides={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "unauthenticated",
            message: "Authentication is required",
          });
        }}
      />
    );

    expect(await screen.findByText("Sign in to view guides.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fguides"
    );

    rerender(
      <ProjectGuideListPage
        projectId="missing"
        loadGuides={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            type: "project_not_found",
            message: "Project was not found",
          });
        }}
      />
    );

    expect(await screen.findByText("Project was not found.")).toBeInTheDocument();
  });

  it("renders generic errors and supports retry", async () => {
    const loadGuides = vi
      .fn<() => Promise<{ guides: Guide[] }>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ guides });

    renderPage({ loadGuides });

    expect(await screen.findByText("Could not load guides.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadGuides).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Archived onboarding guide" })).toBeInTheDocument();
  });
});
