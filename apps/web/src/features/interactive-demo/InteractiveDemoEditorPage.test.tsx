import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  type InteractiveDemoDetailResponse,
  type InteractiveDemoSceneListResponse,
  type InteractiveDemoSceneReorderResponse,
  type InteractiveDemoSceneUpdateResponse,
} from "../../lib/api";
import { InteractiveDemoEditorPage } from "./InteractiveDemoEditorPage";
import type { DemoScene, InteractiveDemo } from "./types";

const interactiveDemo: InteractiveDemo = {
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

const firstScene: DemoScene = {
  id: "scene_1",
  organization_id: "organization_1",
  project_id: "project_1",
  interactive_demo_id: "interactive_demo_1",
  source_capture_session_id: "capture_session_1",
  source_capture_event_id: "event_1",
  source_capture_asset_id: "asset_1",
  scene_index: 1,
  title: "Navigate to Department List",
  description: "Open the department list.",
  background_capture_asset_id: "asset_1",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:01:00.000Z",
  updated_at: "2026-06-05T10:01:00.000Z",
};

const secondScene: DemoScene = {
  ...firstScene,
  id: "scene_2",
  source_capture_event_id: "event_2",
  source_capture_asset_id: "asset_2",
  scene_index: 2,
  title: "Click Add Department",
  description: null,
  background_capture_asset_id: "asset_2",
};

const renderPage = (overrides: {
  loadDemo?: (projectId: string, interactiveDemoId: string) => Promise<InteractiveDemoDetailResponse>;
  loadScenes?: (projectId: string, interactiveDemoId: string) => Promise<InteractiveDemoSceneListResponse>;
  saveDemo?: (
    projectId: string,
    interactiveDemoId: string,
    input: { title?: string; description?: string | null; status?: InteractiveDemo["status"] }
  ) => Promise<InteractiveDemoDetailResponse>;
  saveScene?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    input: { title?: string | null; description?: string | null }
  ) => Promise<InteractiveDemoSceneUpdateResponse>;
  reorderScenes?: (
    projectId: string,
    interactiveDemoId: string,
    sceneIds: string[]
  ) => Promise<InteractiveDemoSceneReorderResponse>;
  deleteScene?: (projectId: string, interactiveDemoId: string, sceneId: string) => Promise<void>;
  resolveAssetUrl?: (fileUrl: string) => string;
  currentPath?: string;
  navigate?: (path: string) => void;
  performLogout?: () => Promise<void>;
} = {}) => {
  const loadDemo = overrides.loadDemo ?? vi.fn(async () => ({ interactive_demo: interactiveDemo }));
  const loadScenes = overrides.loadScenes ?? vi.fn(async () => ({ demo_scenes: [firstScene, secondScene] }));
  const saveDemo = overrides.saveDemo ?? vi.fn(async () => ({ interactive_demo: interactiveDemo }));
  const saveScene = overrides.saveScene ?? vi.fn(async (_projectId, _demoId, _sceneId, input) => ({
    demo_scene: {
      ...firstScene,
      title: input.title ?? firstScene.title,
      description: input.description ?? firstScene.description,
    },
  }));
  const reorderScenes = overrides.reorderScenes ?? vi.fn(async () => ({
    demo_scenes: [secondScene, firstScene].map((scene, index) => ({ ...scene, scene_index: index + 1 })),
  }));
  const deleteScene = overrides.deleteScene ?? vi.fn(async () => undefined);
  const resolveAssetUrl = overrides.resolveAssetUrl ?? ((fileUrl: string) => `https://api.example.com${fileUrl}`);

  render(
    <InteractiveDemoEditorPage
      projectId="project_1"
      interactiveDemoId="interactive_demo_1"
      loadDemo={loadDemo}
      loadScenes={loadScenes}
      saveDemo={saveDemo}
      saveScene={saveScene}
      reorderScenes={reorderScenes}
      deleteScene={deleteScene}
      resolveAssetUrl={resolveAssetUrl}
      currentPath={overrides.currentPath}
      navigate={overrides.navigate}
      performLogout={overrides.performLogout}
    />
  );

  return { loadDemo, loadScenes, saveDemo, saveScene, reorderScenes, deleteScene };
};

describe("InteractiveDemoEditorPage", () => {
  it("loads demo metadata and ordered screenshot scenes", async () => {
    const { loadDemo, loadScenes } = renderPage();

    expect(screen.getByText("Loading interactive demo...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Department setup demo" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Department setup demo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Shows how to add a department.")).toBeInTheDocument();
    expect(screen.getByText("Source capture: capture_session_1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open source capture" })).toHaveAttribute(
      "href",
      "/projects/project_1/capture-sessions/capture_session_1"
    );
    expect(screen.getByRole("img", { name: "Navigate to Department List screenshot" })).toHaveAttribute(
      "src",
      "https://api.example.com/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file"
    );
    expect(screen.getByText("Click Add Department")).toBeInTheDocument();
    expect(loadDemo).toHaveBeenCalledWith("project_1", "interactive_demo_1");
    expect(loadScenes).toHaveBeenCalledWith("project_1", "interactive_demo_1");
  });

  it("updates demo metadata and scene text", async () => {
    const { saveDemo, saveScene } = renderPage();

    await screen.findByRole("heading", { name: "Department setup demo" });
    fireEvent.change(screen.getByLabelText("Demo title"), { target: { value: "Updated demo" } });
    fireEvent.change(screen.getByLabelText("Demo description"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save demo" }));

    await waitFor(() => expect(saveDemo).toHaveBeenCalledWith("project_1", "interactive_demo_1", {
      title: "Updated demo",
      description: null,
      status: "draft",
    }));

    fireEvent.change(screen.getByLabelText("Scene 1 title"), { target: { value: "Updated scene" } });
    fireEvent.change(screen.getByLabelText("Scene 1 description"), { target: { value: "Updated scene details" } });
    fireEvent.click(screen.getByRole("button", { name: "Save scene 1" }));

    await waitFor(() => expect(saveScene).toHaveBeenCalledWith("project_1", "interactive_demo_1", "scene_1", {
      title: "Updated scene",
      description: "Updated scene details",
    }));
  });

  it("reorders and deletes scenes", async () => {
    const { reorderScenes, deleteScene } = renderPage();

    await screen.findByText("Navigate to Department List");
    fireEvent.click(screen.getByRole("button", { name: "Move scene 2 up" }));

    await waitFor(() => expect(reorderScenes).toHaveBeenCalledWith("project_1", "interactive_demo_1", ["scene_2", "scene_1"]));
    expect(await screen.findByText("Click Add Department")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete scene 1" }));

    await waitFor(() => expect(deleteScene).toHaveBeenCalledWith("project_1", "interactive_demo_1", "scene_2"));
  });

  it("handles empty and missing screenshot states", async () => {
    const { rerender } = render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        interactiveDemoId="interactive_demo_1"
        loadDemo={async () => ({ interactive_demo: interactiveDemo })}
        loadScenes={async () => ({ demo_scenes: [] })}
      />
    );

    expect(await screen.findByText("No scenes yet.")).toBeInTheDocument();

    rerender(
      <InteractiveDemoEditorPage
        projectId="project_1"
        interactiveDemoId="interactive_demo_1"
        loadDemo={async () => ({ interactive_demo: interactiveDemo })}
        loadScenes={async () => ({ demo_scenes: [{ ...firstScene, background_capture_asset_id: null }] })}
      />
    );

    expect(await screen.findByText("No screenshot attached.")).toBeInTheDocument();
  });

  it("renders unauthenticated and retry states", async () => {
    const loadDemo = vi
      .fn<() => Promise<InteractiveDemoDetailResponse>>()
      .mockRejectedValueOnce(new ApiClientError({
        kind: "unauthenticated",
        status: 401,
        type: "unauthenticated",
        message: "Authentication required",
      }))
      .mockResolvedValueOnce({ interactive_demo: interactiveDemo });

    renderPage({
      loadDemo,
      currentPath: "/projects/project_1/interactive-demos/interactive_demo_1",
    });

    expect(await screen.findByText("Sign in to view this interactive demo.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Finteractive-demos%2Finteractive_demo_1"
    );
  });
});
