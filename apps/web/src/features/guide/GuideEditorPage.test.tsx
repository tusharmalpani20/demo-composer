import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { GuideEditorPage } from "./GuideEditorPage";
import type { GuideEditorPageProps } from "./GuideEditorPage";
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
      source_capture_asset_id: "asset_2",
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
};

const renderPage = (overrides: {
  detail?: GuideDetail;
  loadDetail?: () => Promise<GuideDetail>;
  saveGuide?: GuideEditorPageProps["saveGuide"];
  saveStep?: GuideEditorPageProps["saveStep"];
  reorderBlocks?: GuideEditorPageProps["reorderBlocks"];
  removeBlock?: GuideEditorPageProps["removeBlock"];
} = {}) => {
  const loadDetail = overrides.loadDetail ?? vi.fn(async () => overrides.detail ?? guideDetail);
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

  render(
    <GuideEditorPage
      projectId="project_1"
      guideId="guide_1"
      loadDetail={loadDetail}
      saveGuide={saveGuide}
      saveStep={saveStep}
      reorderBlocks={reorderBlocks}
      removeBlock={removeBlock}
    />
  );

  return { loadDetail, saveGuide, saveStep, reorderBlocks, removeBlock };
};

describe("GuideEditorPage", () => {
  it("renders guide metadata and editable blocks in block order", async () => {
    const { loadDetail } = renderPage();

    expect(screen.getByText("Loading guide...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByLabelText("Guide title")).toHaveValue("Department guide");
    expect(screen.getByLabelText("Guide description")).toHaveValue("Set up departments from the list view.");
    expect(screen.getAllByRole("textbox", { name: /Step title/ }).map((input) => input.getAttribute("value"))).toEqual([
      "Navigate to Department List",
      "Click Add Department",
    ]);
    expect(screen.getByText("Screenshot source: asset_1")).toBeInTheDocument();
    expect(loadDetail).toHaveBeenCalledWith("project_1", "guide_1");
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
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
  });

  it("renders load and mutation error states", async () => {
    const { rerender } = render(
      <GuideEditorPage
        projectId="project_1"
        guideId="guide_1"
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
