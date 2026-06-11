import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { GuideEditorPage } from "./GuideEditorPage";
import type { GuideEditorPageProps } from "./GuideEditorPage";
import type { GuideDetail, GuidePublishStatusResponse } from "./types";

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
      source_capture_asset_id: "asset_2",
      block_type: "step",
      content: null,
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
        source_capture_asset_id: "asset_2",
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
      content: null,
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
  ],
  source_capture_assets: [
    {
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
    },
    {
      id: "asset_2",
      capture_session_id: "capture_session_1",
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 1,
      page_url: "https://example.test/departments/new",
      page_title: "New Department",
      captured_at: "2026-06-05T10:02:00.000Z",
      file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_2/file",
      file: {
        id: "file_2",
        original_name: "new-department.png",
        mime_type: "image/png",
        size_bytes: 234567,
      },
    },
  ],
};

const unpublishedStatus: GuidePublishStatusResponse = {
  publish_link: null,
  published_artifact: null,
};

const publishedStatus = (versionNumber = 1): GuidePublishStatusResponse => ({
  publish_link: {
    id: "publish_link_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    published_artifact_id: `published_artifact_${versionNumber}`,
    slug: "abc123",
    visibility: "public",
    status: "active",
    published_at: "2026-06-11T00:00:00.000Z",
    revoked_at: null,
    public_url: "/p/abc123",
  },
  published_artifact: {
    id: `published_artifact_${versionNumber}`,
    artifact_type: "guide",
    artifact_id: "guide_1",
    version_number: versionNumber,
    title: "Department guide",
    published_at: "2026-06-11T00:00:00.000Z",
  },
});

const withGuideUpdatedAt = (updatedAt: string): GuideDetail => ({
  ...guideDetail,
  guide: {
    ...guideDetail.guide,
    updated_at: updatedAt,
  },
});

const renderPage = (overrides: {
  detail?: GuideDetail;
  loadDetail?: () => Promise<GuideDetail>;
  saveGuide?: GuideEditorPageProps["saveGuide"];
  saveStep?: GuideEditorPageProps["saveStep"];
  createBlock?: GuideEditorPageProps["createBlock"];
  saveBlock?: GuideEditorPageProps["saveBlock"];
  reorderBlocks?: GuideEditorPageProps["reorderBlocks"];
  removeBlock?: GuideEditorPageProps["removeBlock"];
  loadPublishStatus?: GuideEditorPageProps["loadPublishStatus"];
  publishCurrentGuide?: GuideEditorPageProps["publishCurrentGuide"];
  revokePublishLink?: GuideEditorPageProps["revokePublishLink"];
  copyText?: GuideEditorPageProps["copyText"];
} = {}) => {
  const loadDetail = overrides.loadDetail ?? vi.fn(async () => overrides.detail ?? guideDetail);
  const loadPublishStatus = overrides.loadPublishStatus ?? vi.fn(async () => unpublishedStatus);
  const saveGuide = overrides.saveGuide ?? vi.fn(async (_projectId, _guideId, data) => ({
    guide: {
      ...(overrides.detail ?? guideDetail).guide,
      ...data,
      description: data.description ?? null,
    },
  }));
  const saveStep = overrides.saveStep ?? vi.fn(async (_projectId, _guideId, stepId, data) => {
    const step = guideDetail.guide_blocks
      .map((block) => block.step)
      .find((candidate) => candidate?.id === stepId);

    if (!step) {
      throw new Error("missing step fixture");
    }

    return {
      guide_step: {
        ...step,
        ...data,
        body: data.body ?? null,
      },
    };
  });
  const createBlock = overrides.createBlock ?? vi.fn(async (_projectId, _guideId, data) => ({
    guide_blocks: [
      ...guideDetail.guide_blocks,
      {
        id: "block_tip",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        block_type: data.block_type,
        content: data.content ?? null,
        block_index: 3,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:03:00.000Z",
        updated_at: "2026-06-05T10:03:00.000Z",
        step: data.block_type === "step" ? {
          id: "step_new",
          organization_id: "organization_1",
          project_id: "project_1",
          guide_id: "guide_1",
          guide_block_id: "block_tip",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          title: data.step?.title ?? "New step",
          body: data.step?.body ?? null,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T10:03:00.000Z",
          updated_at: "2026-06-05T10:03:00.000Z",
        } : null,
      },
    ],
  }));
  const saveBlock = overrides.saveBlock ?? vi.fn(async (_projectId, _guideId, blockId, data) => ({
    guide_block: {
      id: blockId,
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      block_type: "tip" as const,
      content: data.content ?? null,
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 2,
      created_at: "2026-06-05T10:03:00.000Z",
      updated_at: "2026-06-05T10:04:00.000Z",
      step: null,
    },
  }));
  const reorderBlocks = overrides.reorderBlocks ?? vi.fn(async (
    _projectId: string,
    _guideId: string,
    blockIds: string[]
  ) => ({
    guide_blocks: blockIds.map((blockId, index) => {
      const block = guideDetail.guide_blocks.find((candidate) => candidate.id === blockId);

      if (!block) {
        throw new Error("missing block fixture");
      }

      return {
        ...block,
        block_index: index + 1,
      };
    }),
  }));
  const removeBlock = overrides.removeBlock ?? vi.fn(async () => undefined);
  const publishCurrentGuide = overrides.publishCurrentGuide ?? vi.fn(async () => publishedStatus());
  const revokePublishLink = overrides.revokePublishLink ?? vi.fn(async () => ({
    publish_link: {
      id: "publish_link_1",
      status: "revoked" as const,
      revoked_at: "2026-06-11T01:00:00.000Z",
    },
  }));
  const copyText = overrides.copyText ?? vi.fn(async () => undefined);

  render(
    <GuideEditorPage
      projectId="project_1"
      guideId="guide_1"
      loadDetail={loadDetail}
      loadPublishStatus={loadPublishStatus}
      saveGuide={saveGuide}
      saveStep={saveStep}
      createBlock={createBlock}
      saveBlock={saveBlock}
      reorderBlocks={reorderBlocks}
      removeBlock={removeBlock}
      publishCurrentGuide={publishCurrentGuide}
      revokePublishLink={revokePublishLink}
      copyText={copyText}
    />
  );

  return {
    loadDetail,
    loadPublishStatus,
    saveGuide,
    saveStep,
    createBlock,
    saveBlock,
    reorderBlocks,
    removeBlock,
    publishCurrentGuide,
    revokePublishLink,
    copyText,
  };
};

describe("GuideEditorPage", () => {
  it("renders guide metadata and editable blocks in block order", async () => {
    const { loadDetail, loadPublishStatus } = renderPage();

    expect(screen.getByText("Loading guide...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByLabelText("Guide title")).toHaveValue("Department guide");
    expect(screen.getByLabelText("Guide description")).toHaveValue("Set up departments from the list view.");
    expect(screen.getByRole("link", { name: "Preview guide" })).toHaveAttribute(
      "href",
      "/projects/project_1/guides/guide_1/preview"
    );
    expect(screen.getAllByRole("textbox", { name: /Step title/ }).map((input) => input.getAttribute("value"))).toEqual([
      "Navigate to Department List",
      "Click Add Department",
    ]);
    expect(screen.getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file"
    );
    expect(screen.getByRole("img", { name: "New Department" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_2/file"
    );
    expect(screen.getByRole("button", { name: "Open screenshot for step 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open screenshot for step 2" })).toBeInTheDocument();
    expect(screen.queryByText("Screenshot source: asset_1")).not.toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
    expect(loadDetail).toHaveBeenCalledWith("project_1", "guide_1");
    expect(loadPublishStatus).toHaveBeenCalledWith("project_1", "guide_1");
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
  });

  it("loads unpublished publish status and publishes a guide", async () => {
    const { publishCurrentGuide } = renderPage();

    expect(await screen.findByRole("heading", { name: "Publishing" })).toBeInTheDocument();
    expect(screen.getByText("This guide is not published.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publish guide" }));

    await waitFor(() => expect(publishCurrentGuide).toHaveBeenCalledWith("project_1", "guide_1"));
    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    expect(screen.getByText("/p/abc123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open public guide" })).toHaveAttribute("href", "/p/abc123");
    expect(screen.getByText("Guide published.")).toBeInTheDocument();
  });

  it("copies, republishes, and revokes an active public guide link", async () => {
    const copyText = vi.fn(async () => undefined);
    const publishCurrentGuide = vi.fn()
      .mockResolvedValueOnce(publishedStatus(2));
    const { revokePublishLink } = renderPage({
      loadPublishStatus: async () => publishedStatus(1),
      publishCurrentGuide,
      copyText,
    });

    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("http://localhost:3000/p/abc123"));
    expect(screen.getByText("Public link copied.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Republish" }));
    await waitFor(() => expect(publishCurrentGuide).toHaveBeenCalledWith("project_1", "guide_1"));
    expect(await screen.findByText("Published version 2 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    expect(screen.getByText("/p/abc123")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Revoke link" }));
    await waitFor(() => expect(revokePublishLink).toHaveBeenCalledWith("project_1", "guide_1"));
    expect(await screen.findByText("This guide is not published.")).toBeInTheDocument();
    expect(screen.getByText("Public link revoked.")).toBeInTheDocument();
  });

  it("renders clearer live and stale published states", async () => {
    renderPage({
      detail: withGuideUpdatedAt("2026-06-12T00:00:00.000Z"),
      loadPublishStatus: async () => publishedStatus(2),
    });

    expect(await screen.findByText("Public guide is live")).toBeInTheDocument();
    expect(screen.getByText("Published version 2 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    expect(screen.getByText("Draft has changes not yet published.")).toBeInTheDocument();
  });

  it("does not show stale published state when the draft timestamp is current", async () => {
    renderPage({
      detail: withGuideUpdatedAt("2026-06-11T00:00:00.000Z"),
      loadPublishStatus: async () => publishedStatus(2),
    });

    expect(await screen.findByText("Public guide is live")).toBeInTheDocument();
    expect(screen.queryByText("Draft has changes not yet published.")).not.toBeInTheDocument();
  });

  it("marks a published guide stale after editor mutations and clears it after republish", async () => {
    const saveGuide = vi.fn(async (_projectId, _guideId, data) => ({
      guide: {
        ...guideDetail.guide,
        ...data,
        description: data.description ?? null,
      },
    }));
    const publishCurrentGuide = vi.fn(async () => publishedStatus(2));

    renderPage({
      loadPublishStatus: async () => publishedStatus(1),
      saveGuide,
      publishCurrentGuide,
    });

    expect(await screen.findByText("Public guide is live")).toBeInTheDocument();
    expect(screen.queryByText("Draft has changes not yet published.")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Guide title"), {
      target: { value: "Updated department guide" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save guide" }));

    expect(await screen.findByText("Draft has changes not yet published.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Republish" }));

    await waitFor(() => expect(publishCurrentGuide).toHaveBeenCalledWith("project_1", "guide_1"));
    await waitFor(() => expect(screen.queryByText("Draft has changes not yet published.")).not.toBeInTheDocument());
  });

  it("adds and edits non-step guide blocks from the editor", async () => {
    const createBlock = vi.fn(async () => ({
      guide_blocks: [
        {
          ...guideDetail.guide_blocks[1]!,
          block_index: 1,
        },
        {
          id: "block_tip",
          organization_id: "organization_1",
          project_id: "project_1",
          guide_id: "guide_1",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          block_type: "tip" as const,
          content: {
            title: null,
            body: "Add a helpful tip.",
          },
          block_index: 2,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T10:03:00.000Z",
          updated_at: "2026-06-05T10:03:00.000Z",
          step: null,
        },
        {
          ...guideDetail.guide_blocks[0]!,
          block_index: 3,
        },
      ],
    }));
    const saveBlock = vi.fn(async (_projectId, _guideId, blockId, data) => ({
      guide_block: {
        id: blockId,
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        block_type: "tip" as const,
        content: data.content ?? null,
        block_index: 2,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 2,
        created_at: "2026-06-05T10:03:00.000Z",
        updated_at: "2026-06-05T10:04:00.000Z",
        step: null,
      },
    }));

    renderPage({ createBlock, saveBlock });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add tip after block 1" }));

    await waitFor(() => expect(createBlock).toHaveBeenCalledWith("project_1", "guide_1", {
      block_type: "tip",
      position: {
        placement: "after",
        guide_block_id: "block_1",
      },
      content: {
        body: "Add a helpful tip.",
      },
    }));
    expect(await screen.findByText("Block added.")).toBeInTheDocument();
    expect(screen.getByLabelText("Tip body 2")).toHaveValue("Add a helpful tip.");

    fireEvent.change(screen.getByLabelText("Tip title 2"), {
      target: { value: "Before you continue" },
    });
    fireEvent.change(screen.getByLabelText("Tip body 2"), {
      target: { value: "Confirm the department name." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save tip 2" }));

    await waitFor(() => expect(saveBlock).toHaveBeenCalledWith("project_1", "guide_1", "block_tip", {
      content: {
        title: "Before you continue",
        body: "Confirm the department name.",
      },
    }));
    expect(screen.getByText("Block saved.")).toBeInTheDocument();
  });

  it("marks a published guide stale after inserting a block", async () => {
    renderPage({
      loadPublishStatus: async () => publishedStatus(1),
    });

    expect(await screen.findByText("Public guide is live")).toBeInTheDocument();
    expect(screen.queryByText("Draft has changes not yet published.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add header after block 1" }));

    expect(await screen.findByText("Draft has changes not yet published.")).toBeInTheDocument();
  });

  it("shows publish-panel busy labels without locking guide editing", async () => {
    const publishCurrentGuide = vi.fn(() => new Promise<GuidePublishStatusResponse>(() => undefined));

    renderPage({
      publishCurrentGuide,
    });

    expect(await screen.findByText("This guide is not published.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publish guide" }));

    expect(await screen.findByRole("button", { name: "Publishing..." })).toBeDisabled();
    expect(screen.getByLabelText("Guide title")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Save guide" })).not.toBeDisabled();
  });

  it("shows a stable notice when public link copy fails", async () => {
    const copyText = vi.fn(async () => {
      throw new Error("clipboard blocked");
    });
    renderPage({
      loadPublishStatus: async () => publishedStatus(1),
      copyText,
    });

    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() => expect(copyText).toHaveBeenCalledWith("http://localhost:3000/p/abc123"));
    expect(screen.getByText("Could not copy public link. Select the URL above.")).toBeInTheDocument();
    expect(screen.getByText("/p/abc123")).toBeInTheDocument();
  });

  it("keeps the editor usable when publish status fails to load", async () => {
    const saveGuide = vi.fn(async (_projectId, _guideId, data) => ({
      guide: {
        ...guideDetail.guide,
        ...data,
        description: data.description ?? null,
      },
    }));

    renderPage({
      saveGuide,
      loadPublishStatus: async () => {
        throw new Error("status failed");
      },
    });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("Could not load publishing status.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Guide title"), {
      target: { value: "Updated department guide" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save guide" }));

    await waitFor(() => expect(saveGuide).toHaveBeenCalledWith("project_1", "guide_1", {
      title: "Updated department guide",
      description: "Set up departments from the list view.",
    }));
  });

  it("retries publish status after a load failure", async () => {
    const loadPublishStatus = vi.fn()
      .mockRejectedValueOnce(new Error("status failed"))
      .mockResolvedValueOnce(publishedStatus(1));

    renderPage({ loadPublishStatus });

    expect(await screen.findByText("Could not load publishing status.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadPublishStatus).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
  });

  it("shows publish validation errors and disables publish controls for archived guides", async () => {
    const publishCurrentGuide = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 400,
        type: "guide_has_no_publishable_blocks",
        message: "Guide has no publishable blocks",
      });
    });
    const archivedDetail = {
      ...guideDetail,
      guide: {
        ...guideDetail.guide,
        status: "archived" as const,
      },
    };
    const { rerender } = render(
      <GuideEditorPage
        projectId="project_1"
        guideId="guide_1"
        loadDetail={async () => guideDetail}
        loadPublishStatus={async () => unpublishedStatus}
        publishCurrentGuide={publishCurrentGuide}
      />
    );

    expect(await screen.findByText("This guide is not published.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publish guide" }));
    expect(await screen.findByText("Guide has no publishable blocks.")).toBeInTheDocument();

    rerender(
      <GuideEditorPage
        projectId="project_1"
        guideId="guide_1"
        loadDetail={async () => archivedDetail}
        loadPublishStatus={async () => unpublishedStatus}
        publishCurrentGuide={publishCurrentGuide}
      />
    );

    expect(await screen.findByText("Archived guides are read-only.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish guide" })).toBeDisabled();
  });

  it("does not render broken screenshots or raw IDs when source assets are missing", async () => {
    renderPage({
      detail: {
        ...guideDetail,
        source_capture_assets: [],
      },
    });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Department List" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open screenshot for step 1" })).not.toBeInTheDocument();
    expect(screen.queryByText("Screenshot source: asset_1")).not.toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
  });

  it("opens and navigates screenshot viewer images from editor screenshots", async () => {
    const duplicateAssetDetail: GuideDetail = {
      ...guideDetail,
      guide_blocks: guideDetail.guide_blocks.map((block) => (
        block.id === "block_2"
          ? {
            ...block,
            source_capture_asset_id: "asset_1",
            step: block.step ? { ...block.step, source_capture_asset_id: "asset_1" } : null,
          }
          : block
      )),
      source_capture_assets: [guideDetail.source_capture_assets[0]!],
    };

    renderPage({ detail: duplicateAssetDetail });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open screenshot for step 1" }));

    const firstDialog = screen.getByRole("dialog", { name: "Navigate to Department List" });
    expect(within(firstDialog).getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file"
    );
    expect(within(firstDialog).getByText("1 / 2")).toBeInTheDocument();

    fireEvent.click(within(firstDialog).getByRole("button", { name: "Next screenshot" }));
    const secondDialog = screen.getByRole("dialog", { name: "Click Add Department" });
    expect(within(secondDialog).getByText("2 / 2")).toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();

    fireEvent.click(within(secondDialog).getByRole("button", { name: "Close screenshot viewer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders non-step blocks with block-level actions", async () => {
    renderPage({
      detail: {
        ...guideDetail,
        guide_blocks: [
          {
            ...guideDetail.guide_blocks[0]!,
            id: "block_header_1",
            block_type: "header",
            content: {
              title: "Setup section",
            },
            block_index: 1,
            source_capture_asset_id: null,
            step: null,
          },
        ],
      },
    });

    expect(await screen.findByText("header")).toBeInTheDocument();
    expect(screen.getByLabelText("Header title 1")).toHaveValue("Setup section");
    expect(screen.getByRole("button", { name: "Save header 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete block 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete step 1" })).not.toBeInTheDocument();
  });

  it("saves guide metadata and step copy", async () => {
    const { saveGuide, saveStep } = renderPage();

    await screen.findByRole("heading", { name: "Department guide" });

    fireEvent.change(screen.getByLabelText("Guide title"), {
      target: { value: "Updated department guide" },
    });
    fireEvent.change(screen.getByLabelText("Guide description"), {
      target: { value: "Updated setup notes." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save guide" }));

    await waitFor(() => expect(saveGuide).toHaveBeenCalledWith("project_1", "guide_1", {
      title: "Updated department guide",
      description: "Updated setup notes.",
    }));

    fireEvent.change(screen.getByLabelText("Step title 1"), {
      target: { value: "Open department list" },
    });
    fireEvent.change(screen.getByLabelText("Step body 1"), {
      target: { value: "Go to the Department list page." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save step 1" }));

    await waitFor(() => expect(saveStep).toHaveBeenCalledWith("project_1", "guide_1", "step_1", {
      title: "Open department list",
      body: "Go to the Department list page.",
    }));
  });

  it("reorders and deletes blocks", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { loadDetail, reorderBlocks, removeBlock } = renderPage();

    await screen.findByRole("heading", { name: "Department guide" });
    fireEvent.click(screen.getByRole("button", { name: "Move step 1 down" }));

    await waitFor(() => expect(reorderBlocks).toHaveBeenCalledWith("project_1", "guide_1", ["block_2", "block_1"]));

    fireEvent.click(screen.getByRole("button", { name: "Delete step 2" }));

    await waitFor(() => expect(removeBlock).toHaveBeenCalledWith("project_1", "guide_1", "block_1"));
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    confirm.mockRestore();
  });

  it("renders readonly archived guides", async () => {
    renderPage({
      detail: {
        ...guideDetail,
        guide: {
          ...guideDetail.guide,
          status: "archived",
        },
      },
    });

    expect(await screen.findByText("Archived guides are read-only.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save guide" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save step 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Open screenshot for step 1" }));
    expect(screen.getByRole("dialog", { name: "Navigate to Department List" })).toBeInTheDocument();
  });

  it("closes the screenshot viewer when the active screenshot disappears after deletion", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const loadDetail = vi
      .fn()
      .mockResolvedValueOnce(guideDetail)
      .mockResolvedValueOnce({
        ...guideDetail,
        guide_blocks: [guideDetail.guide_blocks[0]!],
        source_capture_assets: [guideDetail.source_capture_assets[1]!],
      });

    renderPage({ loadDetail });

    await screen.findByRole("heading", { name: "Department guide" });
    fireEvent.click(screen.getByRole("button", { name: "Open screenshot for step 1" }));
    expect(screen.getByRole("dialog", { name: "Navigate to Department List" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete step 1" }));

    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Department List" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "New Department" })).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("renders load and mutation error states", async () => {
    const { rerender } = render(
      <GuideEditorPage
        projectId="project_1"
        guideId="guide_1"
        currentPath="/projects/project_1/guides/guide_1"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            message: "Authentication is required",
          });
        }}
      />
    );

    expect(await screen.findByText("Sign in to edit this guide.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fguides%2Fguide_1"
    );

    rerender(
      <GuideEditorPage
        projectId="project_1"
        guideId="missing"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            message: "Guide was not found",
          });
        }}
      />
    );

    expect(await screen.findByText("Guide was not found.")).toBeInTheDocument();

    const saveGuide = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 409,
        type: "guide_not_editable",
        message: "Guide is archived",
      });
    });

    rerender(
      <GuideEditorPage
        projectId="project_1"
        guideId="guide_1"
        loadDetail={async () => guideDetail}
        saveGuide={saveGuide}
      />
    );

    await screen.findByRole("heading", { name: "Department guide" });
    fireEvent.click(screen.getByRole("button", { name: "Save guide" }));

    expect(await screen.findByText("Archived guides are read-only.")).toBeInTheDocument();
  });
});
