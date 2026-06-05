import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import type { CaptureSessionDetail } from "./types";
import { CaptureSessionDetailPage } from "./CaptureSessionDetailPage";

const detail: CaptureSessionDetail = {
  capture_session: {
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
    version: 2,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
  },
  capture_events: [
    {
      id: "event_1",
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_asset_id: null,
      event_type: "note",
      event_index: 1,
      occurred_at: "2026-06-05T10:01:00.000Z",
      page_url: null,
      page_title: null,
      target_label: null,
      target_selector: "#private-selector",
      target_role: null,
      target_test_id: null,
      target_text: null,
      client_x: null,
      client_y: null,
      viewport_width: null,
      viewport_height: null,
      device_pixel_ratio: null,
      input_intent: null,
      input_value_redacted: true,
      note: "Start from department list",
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:01:00.000Z",
      updated_at: "2026-06-05T10:01:00.000Z",
    },
    {
      id: "event_2",
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_asset_id: "asset_1",
      event_type: "click",
      event_index: 2,
      occurred_at: "2026-06-05T10:02:00.000Z",
      page_url: "https://example.internal/app/department",
      page_title: "Department",
      target_label: "Add Department",
      target_selector: null,
      target_role: "button",
      target_test_id: null,
      target_text: null,
      client_x: 1200,
      client_y: 88,
      viewport_width: 1440,
      viewport_height: 900,
      device_pixel_ratio: 1,
      input_intent: null,
      input_value_redacted: true,
      note: null,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:02:00.000Z",
      updated_at: "2026-06-05T10:02:00.000Z",
    },
  ],
  capture_assets: [
    {
      id: "asset_1",
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      file: {
        id: "file_1",
        storage_provider: "local",
        mime_type: "image/png",
        size_bytes: 123456,
        original_name: "department-list.png",
        checksum_sha256: "checksum",
      },
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 1,
      page_url: "https://example.internal/app/department",
      page_title: "Department",
      captured_at: "2026-06-05T10:02:00.000Z",
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:02:00.000Z",
      updated_at: "2026-06-05T10:02:00.000Z",
      file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
    },
  ],
};

const renderPage = (overrides: {
  loadDetail?: () => Promise<CaptureSessionDetail>;
  resolveAssetUrl?: (fileUrl: string) => string;
} = {}) => {
  const loadDetail = overrides.loadDetail ?? vi.fn(async () => detail);
  const resolveAssetUrl = overrides.resolveAssetUrl ?? ((fileUrl: string) => `https://api.example.com${fileUrl}`);

  render(
    <CaptureSessionDetailPage
      projectId="project_1"
      captureSessionId="capture_session_1"
      loadDetail={loadDetail}
      resolveAssetUrl={resolveAssetUrl}
    />
  );

  return { loadDetail };
};

describe("CaptureSessionDetailPage", () => {
  it("renders session metadata events and asset previews", async () => {
    const { loadDetail } = renderPage();

    expect(screen.getByText("Loading capture session...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Create department workflow" })).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("extension")).toBeInTheDocument();
    expect(screen.getByText("2 events")).toBeInTheDocument();
    expect(screen.getByText("1 asset")).toBeInTheDocument();
    expect(screen.getByText("Start from department list")).toBeInTheDocument();
    expect(screen.getByText("Add Department")).toBeInTheDocument();
    expect(screen.getByText("Linked screenshot")).toBeInTheDocument();
    expect(screen.getByText("department-list.png")).toBeInTheDocument();

    const preview = screen.getByRole("img", { name: "Department screenshot" });
    expect(preview).toHaveAttribute(
      "src",
      "https://api.example.com/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file"
    );
    expect(loadDetail).toHaveBeenCalledWith("project_1", "capture_session_1");
    expect(screen.queryByText("#private-selector")).not.toBeInTheDocument();
    expect(screen.queryByText("storage_key")).not.toBeInTheDocument();
    expect(screen.queryByText("metadata")).not.toBeInTheDocument();
  });

  it("renders empty states", async () => {
    renderPage({
      loadDetail: async () => ({
        ...detail,
        capture_events: [],
        capture_assets: [],
      }),
    });

    expect(await screen.findByText("No capture events yet.")).toBeInTheDocument();
    expect(screen.getByText("No capture assets yet.")).toBeInTheDocument();
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <CaptureSessionDetailPage
        projectId="project_1"
        captureSessionId="capture_session_1"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            message: "Authentication is required",
          });
        }}
        resolveAssetUrl={(fileUrl) => fileUrl}
      />
    );

    expect(await screen.findByText("Sign in to view this capture session.")).toBeInTheDocument();

    rerender(
      <CaptureSessionDetailPage
        projectId="project_1"
        captureSessionId="missing"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            message: "Capture session was not found",
          });
        }}
        resolveAssetUrl={(fileUrl) => fileUrl}
      />
    );

    expect(await screen.findByText("Capture session was not found.")).toBeInTheDocument();
  });

  it("renders generic errors and supports retry", async () => {
    const loadDetail = vi
      .fn<() => Promise<CaptureSessionDetail>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce(detail);

    renderPage({ loadDetail });

    expect(await screen.findByText("Could not load capture session.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Create department workflow" })).toBeInTheDocument();
  });
});
