import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  type InteractiveDemoDetailResponse,
  type InteractiveDemoSceneListResponse,
  type InteractiveDemoSceneReorderResponse,
  type InteractiveDemoSceneUpdateResponse,
  type InteractiveDemoHotspotListResponse,
  type InteractiveDemoHotspotCreateResponse,
  type InteractiveDemoHotspotUpdateResponse,
  type InteractiveDemoHotspotReorderResponse,
} from "../../lib/api";
import { InteractiveDemoEditorPage } from "./InteractiveDemoEditorPage";
import type { CreateDemoHotspotInput, DemoHotspot, DemoScene, InteractiveDemo, UpdateDemoHotspotInput } from "./types";

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

const hotspot: DemoHotspot = {
  id: "hotspot_1",
  organization_id: "organization_1",
  project_id: "project_1",
  interactive_demo_id: "interactive_demo_1",
  demo_scene_id: "scene_1",
  hotspot_type: "click",
  label: "Continue",
  content: null,
  x: 0.1,
  y: 0.2,
  width: 0.3,
  height: 0.12,
  target_scene_id: "scene_2",
  hotspot_index: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:01:00.000Z",
  updated_at: "2026-06-05T10:01:00.000Z",
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
  loadHotspots?: (projectId: string, interactiveDemoId: string, sceneId: string) => Promise<InteractiveDemoHotspotListResponse>;
  createHotspot?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    input: CreateDemoHotspotInput
  ) => Promise<InteractiveDemoHotspotCreateResponse>;
  saveHotspot?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    hotspotId: string,
    input: UpdateDemoHotspotInput
  ) => Promise<InteractiveDemoHotspotUpdateResponse>;
  reorderHotspots?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    hotspotIds: string[]
  ) => Promise<InteractiveDemoHotspotReorderResponse>;
  deleteHotspot?: (projectId: string, interactiveDemoId: string, sceneId: string, hotspotId: string) => Promise<void>;
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
  const loadHotspots = overrides.loadHotspots ?? vi.fn(async (_projectId, _demoId, sceneId) => ({
    demo_hotspots: sceneId === "scene_1" ? [hotspot] : [],
  }));
  const createHotspot = overrides.createHotspot ?? vi.fn(async (_projectId, _demoId, sceneId, input) => ({
    demo_hotspot: { ...hotspot, id: "hotspot_new", demo_scene_id: sceneId, ...input, hotspot_index: 2 },
  }));
  const saveHotspot = overrides.saveHotspot ?? vi.fn(async (_projectId, _demoId, sceneId, hotspotId, input) => ({
    demo_hotspot: { ...hotspot, id: hotspotId, demo_scene_id: sceneId, ...input, version: 2 },
  }));
  const reorderHotspots = overrides.reorderHotspots ?? vi.fn(async (_projectId, _demoId, _sceneId, hotspotIds) => ({
    demo_hotspots: hotspotIds.map((id: string, index: number) => ({ ...hotspot, id, hotspot_index: index + 1 })),
  }));
  const deleteHotspot = overrides.deleteHotspot ?? vi.fn(async () => undefined);
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
      loadHotspots={loadHotspots}
      createHotspot={createHotspot}
      saveHotspot={saveHotspot}
      reorderHotspots={reorderHotspots}
      deleteHotspot={deleteHotspot}
      resolveAssetUrl={resolveAssetUrl}
      currentPath={overrides.currentPath}
      navigate={overrides.navigate}
      performLogout={overrides.performLogout}
    />
  );

  return { loadDemo, loadScenes, saveDemo, saveScene, reorderScenes, deleteScene, loadHotspots, createHotspot, saveHotspot, reorderHotspots, deleteHotspot };
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
    expect(screen.getByLabelText("Hotspot Continue")).toHaveStyle({
      left: "10%",
      top: "20%",
      width: "30%",
      height: "12%",
    });
  });

  it("creates edits reorders and deletes hotspots", async () => {
    const { createHotspot, saveHotspot, deleteHotspot } = renderPage();

    await screen.findByRole("heading", { name: "Department setup demo" });
    fireEvent.click(screen.getByRole("button", { name: "Add hotspot to scene 1" }));

    await waitFor(() => expect(createHotspot).toHaveBeenCalledWith("project_1", "interactive_demo_1", "scene_1", {
      hotspot_type: "click",
      label: "New hotspot",
      content: null,
      x: 0.4,
      y: 0.35,
      width: 0.2,
      height: 0.12,
      target_scene_id: "scene_2",
    }));

    fireEvent.change(screen.getByLabelText("Hotspot 1 label"), { target: { value: "Open form" } });
    fireEvent.change(screen.getByLabelText("Hotspot 1 content"), { target: { value: "Click to continue" } });
    fireEvent.change(screen.getByLabelText("Hotspot 1 x"), { target: { value: "0.25" } });
    fireEvent.change(screen.getByLabelText("Hotspot 1 target scene"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save hotspot 1" }));

    await waitFor(() => expect(saveHotspot).toHaveBeenCalledWith("project_1", "interactive_demo_1", "scene_1", "hotspot_1", {
      hotspot_type: "click",
      label: "Open form",
      content: "Click to continue",
      x: 0.25,
      y: 0.2,
      width: 0.3,
      height: 0.12,
      target_scene_id: null,
    }));

    fireEvent.click(screen.getByRole("button", { name: "Delete hotspot 1" }));
    await waitFor(() => expect(deleteHotspot).toHaveBeenCalledWith("project_1", "interactive_demo_1", "scene_1", "hotspot_1"));
  });

  it("rejects invalid local hotspot coordinates before submit", async () => {
    const { saveHotspot } = renderPage();

    await screen.findByRole("heading", { name: "Department setup demo" });
    fireEvent.change(screen.getByLabelText("Hotspot 1 x"), { target: { value: "0.95" } });
    fireEvent.click(screen.getByRole("button", { name: "Save hotspot 1" }));

    expect(await screen.findByText("Hotspot coordinates must stay inside the screenshot.")).toBeInTheDocument();
    expect(saveHotspot).not.toHaveBeenCalled();
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
