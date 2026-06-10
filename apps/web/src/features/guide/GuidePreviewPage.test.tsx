import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { GuidePreviewPage } from "./GuidePreviewPage";
import type { GuideDetail } from "./types";

const guideDetail: GuideDetail = {
  guide: {
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
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  guide_blocks: [
    {
      id: "block_2",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_2",
      source_capture_asset_id: "asset_missing",
      block_type: "step",
      block_index: 2,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:02:00.000Z",
      updated_at: "2026-06-05T10:02:00.000Z",
      step: {
        id: "step_2",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_2",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_2",
        source_capture_asset_id: "asset_missing",
        title: "Click Add Department",
        body: "Use the primary action in the list view.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:02:00.000Z",
        updated_at: "2026-06-05T10:02:00.000Z",
      },
    },
    {
      id: "block_1",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      block_type: "step",
      block_index: 1,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:01:00.000Z",
      updated_at: "2026-06-05T10:01:00.000Z",
      step: {
        id: "step_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        title: "Navigate to Department List",
        body: "Open the Department module.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:01:00.000Z",
        updated_at: "2026-06-05T10:01:00.000Z",
      },
    },
    {
      id: "block_3",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      block_type: "header",
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:03:00.000Z",
      updated_at: "2026-06-05T10:03:00.000Z",
      step: null,
    },
  ],
  source_capture_assets: [{
    id: "asset_1",
    capture_session_id: "capture_session_1",
    asset_type: "screenshot",
    width: 1440,
    height: 900,
    device_pixel_ratio: 1,
    page_url: "https://example.test/departments",
    page_title: "Department List",
    captured_at: "2026-06-05T10:01:00.000Z",
    file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
    file: {
      id: "file_1",
      original_name: "departments.png",
      mime_type: "image/png",
      size_bytes: 123456,
    },
  }],
};

const renderPage = (overrides: {
  detail?: GuideDetail;
  loadDetail?: () => Promise<GuideDetail>;
  currentPath?: string;
} = {}) => {
  const loadDetail = overrides.loadDetail ?? vi.fn(async () => overrides.detail ?? guideDetail);

  render(
    <GuidePreviewPage
      projectId="project_1"
      guideId="guide_1"
      currentPath={overrides.currentPath}
      loadDetail={loadDetail}
    />
  );

  return { loadDetail };
};

describe("GuidePreviewPage", () => {
  it("renders ordered guide steps and screenshots", async () => {
    const { loadDetail } = renderPage();

    expect(screen.getByText("Loading guide preview...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("Set up departments from the list view.")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit guide" })).toHaveAttribute("href", "/projects/project_1/guides/guide_1");
    expect(screen.getByRole("link", { name: "Back to guides" })).toHaveAttribute("href", "/projects/project_1/guides");
    expect(screen.getAllByText(/^[123]$/).map((node) => node.textContent)).toEqual(["1", "2", "3"]);
    expect(screen.getByRole("heading", { name: "Navigate to Department List" })).toBeInTheDocument();
    expect(screen.getByText("Open the Department module.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Click Add Department" })).toBeInTheDocument();
    expect(screen.getByText("Use the primary action in the list view.")).toBeInTheDocument();
    expect(screen.getByText("Unsupported guide block: header")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file"
    );
    expect(screen.queryByText("asset_missing")).not.toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
    expect(loadDetail).toHaveBeenCalledWith("project_1", "guide_1");
  });

  it("renders empty guides", async () => {
    renderPage({
      detail: {
        ...guideDetail,
        guide_blocks: [],
        source_capture_assets: [],
      },
    });

    expect(await screen.findByText("This guide does not have any blocks yet.")).toBeInTheDocument();
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <GuidePreviewPage
        projectId="project_1"
        guideId="guide_1"
        currentPath="/projects/project_1/guides/guide_1/preview"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "unauthenticated",
            message: "Authentication is required",
          });
        }}
      />
    );

    expect(await screen.findByText("Sign in to preview this guide.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fguides%2Fguide_1%2Fpreview"
    );

    rerender(
      <GuidePreviewPage
        projectId="project_1"
        guideId="missing"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            type: "guide_not_found",
            message: "Guide was not found",
          });
        }}
      />
    );

    expect(await screen.findByText("Guide was not found.")).toBeInTheDocument();
  });
});
