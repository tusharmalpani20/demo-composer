import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ProjectCaptureSessionListPage } from "./ProjectCaptureSessionListPage";
import type { CaptureSession } from "./types";

const captureSessions: CaptureSession[] = [
  {
    id: "capture_session_2",
    organization_id: "organization_1",
    project_id: "project_1",
    name: "Archived onboarding capture",
    description: null,
    status: "archived",
    source_type: "manual",
    started_at: null,
    completed_at: null,
    canceled_at: null,
    start_url: null,
    browser_name: null,
    browser_version: null,
    operating_system: null,
    viewport_width: null,
    viewport_height: null,
    device_pixel_ratio: null,
    user_agent: "private user agent",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 3,
    created_at: "2026-06-05T09:00:00.000Z",
    updated_at: "2026-06-05T11:00:00.000Z",
  },
  {
    id: "capture_session_1",
    organization_id: "organization_1",
    project_id: "project_1",
    name: "Create department workflow",
    description: "Source capture for the department setup guide",
    status: "completed",
    source_type: "extension",
    started_at: "2026-06-05T10:00:00.000Z",
    completed_at: "2026-06-05T10:05:00.000Z",
    canceled_at: null,
    start_url: "https://example.internal/app/department",
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
    updated_at: "2026-06-05T10:05:00.000Z",
  },
];

const renderPage = (overrides: {
  projectId?: string;
  loadCaptureSessions?: () => Promise<{ capture_sessions: CaptureSession[] }>;
} = {}) => {
  const loadCaptureSessions = overrides.loadCaptureSessions ?? vi.fn(async () => ({
    capture_sessions: captureSessions,
  }));

  render(
    <ProjectCaptureSessionListPage
      projectId={overrides.projectId ?? "project_1"}
      loadCaptureSessions={loadCaptureSessions}
    />
  );

  return { loadCaptureSessions };
};

describe("ProjectCaptureSessionListPage", () => {
  it("renders capture sessions in response order with detail links", async () => {
    const { loadCaptureSessions } = renderPage();

    expect(screen.getByText("Loading capture sessions...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Capture sessions" })).toBeInTheDocument();

    const rows = screen.getAllByRole("article");
    expect(within(rows[0]!).getByRole("heading", { name: "Archived onboarding capture" })).toBeInTheDocument();
    expect(within(rows[1]!).getByRole("heading", { name: "Create department workflow" })).toBeInTheDocument();
    expect(screen.getByText("archived")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("manual")).toBeInTheDocument();
    expect(screen.getByText("extension")).toBeInTheDocument();
    expect(screen.getByText("Source capture for the department setup guide")).toBeInTheDocument();
    expect(screen.getByText("No start URL")).toBeInTheDocument();
    expect(screen.getByText("example.internal")).toBeInTheDocument();
    expect(screen.getByText("Chrome 126")).toBeInTheDocument();
    expect(screen.getByText("Linux")).toBeInTheDocument();
    expect(screen.getByText("1440 x 900")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open capture session Create department workflow" })).toHaveAttribute(
      "href",
      "/projects/project_1/capture-sessions/capture_session_1"
    );
    expect(loadCaptureSessions).toHaveBeenCalledWith("project_1");
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
    expect(screen.queryByText("org_user_1")).not.toBeInTheDocument();
    expect(screen.queryByText("Mozilla/5.0")).not.toBeInTheDocument();
    expect(screen.queryByText("version")).not.toBeInTheDocument();
  });

  it("URL-encodes project and capture session IDs in detail links", async () => {
    renderPage({
      projectId: "project 1",
      loadCaptureSessions: async () => ({
        capture_sessions: [{
          ...captureSessions[0]!,
          id: "capture / 1",
          name: "Encoded capture",
        }],
      }),
    });

    expect(await screen.findByRole("link", { name: "Open capture session Encoded capture" })).toHaveAttribute(
      "href",
      "/projects/project%201/capture-sessions/capture%20%2F%201"
    );
  });

  it("renders empty capture session lists", async () => {
    renderPage({
      loadCaptureSessions: async () => ({ capture_sessions: [] }),
    });

    expect(await screen.findByText("No capture sessions yet.")).toBeInTheDocument();
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <ProjectCaptureSessionListPage
        projectId="project_1"
        loadCaptureSessions={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "unauthenticated",
            message: "Authentication is required",
          });
        }}
      />
    );

    expect(await screen.findByText("Sign in to view capture sessions.")).toBeInTheDocument();

    rerender(
      <ProjectCaptureSessionListPage
        projectId="missing"
        loadCaptureSessions={async () => {
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
    const loadCaptureSessions = vi
      .fn<() => Promise<{ capture_sessions: CaptureSession[] }>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ capture_sessions: captureSessions });

    renderPage({ loadCaptureSessions });

    expect(await screen.findByText("Could not load capture sessions.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadCaptureSessions).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Archived onboarding capture" })).toBeInTheDocument();
  });
});
