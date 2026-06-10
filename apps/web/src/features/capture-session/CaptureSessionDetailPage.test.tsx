import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import type { GuideDetail } from "../guide/types";
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

const guideDetail: GuideDetail = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Create department workflow",
    description: "Source capture for the department setup guide",
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

const renderPage = (overrides: {
  loadDetail?: () => Promise<CaptureSessionDetail>;
  resolveAssetUrl?: (fileUrl: string) => string;
  createGuide?: () => Promise<GuideDetail>;
  redirectTo?: (path: string) => void;
} = {}) => {
  const loadDetail = overrides.loadDetail ?? vi.fn(async () => detail);
  const resolveAssetUrl = overrides.resolveAssetUrl ?? ((fileUrl: string) => `https://api.example.com${fileUrl}`);
  const createGuide = overrides.createGuide ?? vi.fn(async () => guideDetail);
  const redirectTo = overrides.redirectTo ?? vi.fn();

  render(
    <CaptureSessionDetailPage
      projectId="project_1"
      captureSessionId="capture_session_1"
      loadDetail={loadDetail}
      resolveAssetUrl={resolveAssetUrl}
      createGuide={createGuide}
      redirectTo={redirectTo}
    />
  );

  return { loadDetail, createGuide, redirectTo };
};

describe("CaptureSessionDetailPage", () => {
  it("renders session metadata events and asset previews", async () => {
    const { loadDetail } = renderPage();

    expect(screen.getByText("Loading capture session...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Create department workflow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
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

  it("creates a guide from the loaded capture session and redirects to the editor", async () => {
    const { createGuide, redirectTo } = renderPage();

    await screen.findByRole("heading", { name: "Create department workflow" });
    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    await waitFor(() => expect(createGuide).toHaveBeenCalledWith("project_1", "capture_session_1", {
      title: "Create department workflow",
      description: "Source capture for the department setup guide",
    }));
    expect(redirectTo).toHaveBeenCalledWith("/projects/project_1/guides/guide_1");
  });

  it("trims guide titles and sends null when the capture session has no description", async () => {
    const createGuide = vi.fn(async () => guideDetail);
    renderPage({
      createGuide,
      loadDetail: async () => ({
        ...detail,
        capture_session: {
          ...detail.capture_session,
          name: "  Create department workflow  ",
          description: null,
        },
      }),
    });

    await screen.findByRole("heading", { name: "Create department workflow" });
    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    await waitFor(() => expect(createGuide).toHaveBeenCalledWith("project_1", "capture_session_1", {
      title: "Create department workflow",
      description: null,
    }));
  });

  it("prevents duplicate guide creation while a request is pending", async () => {
    let resolveCreate: (detail: GuideDetail) => void = () => undefined;
    const createGuide = vi.fn(() => new Promise<GuideDetail>((resolve) => {
      resolveCreate = resolve;
    }));
    const redirectTo = vi.fn();

    renderPage({ createGuide, redirectTo });

    await screen.findByRole("heading", { name: "Create department workflow" });
    const button = screen.getByRole("button", { name: "Create guide" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(await screen.findByRole("button", { name: "Creating guide..." })).toBeDisabled();
    expect(createGuide).toHaveBeenCalledTimes(1);

    resolveCreate(guideDetail);
    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith("/projects/project_1/guides/guide_1"));
  });

  it("shows guide creation failures without clearing loaded capture detail", async () => {
    const createGuide = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 400,
        type: "invalid_guide",
        message: "Guide input is invalid",
      });
    });
    const redirectTo = vi.fn();

    renderPage({ createGuide, redirectTo });

    await screen.findByRole("heading", { name: "Create department workflow" });
    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    expect(await screen.findByText("Could not create guide.")).toBeInTheDocument();
    expect(screen.getByText("Start from department list")).toBeInTheDocument();
    expect(screen.getByText("department-list.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create guide" })).toBeEnabled();
    expect(redirectTo).not.toHaveBeenCalled();
  });

  it("clears a previous guide creation error when retrying", async () => {
    let resolveCreate: (detail: GuideDetail) => void = () => undefined;
    const createGuide = vi
      .fn<() => Promise<GuideDetail>>()
      .mockRejectedValueOnce(new Error("Create failed"))
      .mockImplementationOnce(() => new Promise<GuideDetail>((resolve) => {
        resolveCreate = resolve;
      }));
    const redirectTo = vi.fn();

    renderPage({ createGuide, redirectTo });

    await screen.findByRole("heading", { name: "Create department workflow" });
    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    expect(await screen.findByText("Could not create guide.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    expect(screen.queryByText("Could not create guide.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Creating guide..." })).toBeDisabled();

    resolveCreate(guideDetail);
    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith("/projects/project_1/guides/guide_1"));
  });

  it("disables guide creation when the loaded capture session has an empty name", async () => {
    renderPage({
      loadDetail: async () => ({
        ...detail,
        capture_session: {
          ...detail.capture_session,
          name: "   ",
        },
      }),
    });

    expect(await screen.findByText("Capture session needs a name before creating a guide.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create guide" })).toBeDisabled();
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <CaptureSessionDetailPage
        projectId="project_1"
        captureSessionId="capture_session_1"
        currentPath="/projects/project_1/capture-sessions/capture_session_1"
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
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fcapture-sessions%2Fcapture_session_1"
    );

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
