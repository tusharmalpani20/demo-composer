import { describe, expect, it } from "vitest";
import {
  build_interactive_demo_service,
  EmptyDemoSceneOrderError,
  EmptyInteractiveDemoUpdateError,
  InteractiveDemoNotFoundError,
  InvalidDemoSceneOrderError,
  InvalidDemoSceneReferenceError,
  ProjectNotFoundError,
  type DemoScene,
  type InteractiveDemo,
  type InteractiveDemoRepository,
} from "./interactive-demo.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const demo: InteractiveDemo = {
  id: "interactive_demo_1",
  organization_id: "organization_1",
  project_id: "project_1",
  source_capture_session_id: null,
  title: "Product Tour",
  description: "Internal walkthrough",
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const scene = (overrides: Partial<DemoScene> = {}): DemoScene => ({
  id: overrides.id ?? "demo_scene_1",
  organization_id: "organization_1",
  project_id: "project_1",
  interactive_demo_id: "interactive_demo_1",
  source_capture_session_id: null,
  source_capture_event_id: null,
  source_capture_asset_id: null,
  scene_index: overrides.scene_index ?? 1,
  title: overrides.title ?? "Welcome",
  description: overrides.description ?? null,
  background_capture_asset_id: overrides.background_capture_asset_id ?? "capture_asset_1",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: overrides.version ?? 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
});

const build_repository = (overrides: Partial<InteractiveDemoRepository> = {}) => {
  const calls: Record<
    | "project_exists"
    | "create_demo"
    | "list_demos"
    | "find_demo"
    | "update_demo"
    | "delete_demo"
    | "background_asset_exists"
    | "create_scene"
    | "list_scenes"
    | "update_scene"
    | "reorder_scenes"
    | "delete_scene",
    unknown[]
  > = {
    project_exists: [],
    create_demo: [],
    list_demos: [],
    find_demo: [],
    update_demo: [],
    delete_demo: [],
    background_asset_exists: [],
    create_scene: [],
    list_scenes: [],
    update_scene: [],
    reorder_scenes: [],
    delete_scene: [],
  };

  const repository: InteractiveDemoRepository = {
    async project_exists(input) {
      calls.project_exists.push(input);
      return input.project_id !== "missing_project";
    },
    async create_demo(input) {
      calls.create_demo.push(input);
      return demo;
    },
    async list_demos(input) {
      calls.list_demos.push(input);
      return [demo];
    },
    async find_demo(input) {
      calls.find_demo.push(input);
      return input.interactive_demo_id === "missing_demo" ? null : demo;
    },
    async update_demo(input) {
      calls.update_demo.push(input);
      return input.interactive_demo_id === "missing_demo"
        ? null
        : { ...demo, ...input.data, version: 2 };
    },
    async delete_demo(input) {
      calls.delete_demo.push(input);
      return input.interactive_demo_id !== "missing_demo";
    },
    async background_asset_exists(input) {
      calls.background_asset_exists.push(input);
      return input.capture_asset_id !== "missing_asset";
    },
    async create_scene(input) {
      calls.create_scene.push(input);
      return scene({
        title: input.data.title,
        description: input.data.description,
        background_capture_asset_id: input.data.background_capture_asset_id,
      });
    },
    async list_scenes(input) {
      calls.list_scenes.push(input);
      return [scene(), scene({ id: "demo_scene_2", scene_index: 2 })];
    },
    async update_scene(input) {
      calls.update_scene.push(input);
      return input.demo_scene_id === "missing_scene"
        ? null
        : scene({ title: input.data.title, description: input.data.description, version: 2 });
    },
    async reorder_scenes(input) {
      calls.reorder_scenes.push(input);
      return input.scene_ids.map((id, index) => scene({ id, scene_index: index + 1 }));
    },
    async delete_scene(input) {
      calls.delete_scene.push(input);
      return input.demo_scene_id !== "missing_scene";
    },
    ...overrides,
  };

  return { repository, calls };
};

describe("interactive demo service", () => {
  it("creates demos scoped to the current project and actor", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.create_interactive_demo({
      auth,
      project_id: "project_1",
      data: {
        title: " Product Tour ",
        description: "",
        source_capture_session_id: null,
      },
    })).resolves.toEqual(demo);

    expect(calls.create_demo).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Product Tour",
        description: null,
        source_capture_session_id: null,
      },
    }]);
    await expect(service.create_interactive_demo({
      auth,
      project_id: "missing_project",
      data: { title: "Missing" },
    })).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("lists gets updates and archives demos through scoped repository calls", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.list_interactive_demos({ auth, project_id: "project_1" })).resolves.toEqual([demo]);
    await expect(service.list_interactive_demos({ auth, project_id: "missing_project" })).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(service.get_interactive_demo({ auth, project_id: "project_1", interactive_demo_id: "interactive_demo_1" })).resolves.toEqual(demo);
    await expect(service.update_interactive_demo({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      data: {
        title: " Updated ",
        description: "",
        status: "archived",
      },
    })).resolves.toMatchObject({ title: "Updated", description: null, status: "archived", version: 2 });
    await expect(service.delete_interactive_demo({ auth, project_id: "project_1", interactive_demo_id: "missing_demo" }))
      .rejects.toBeInstanceOf(InteractiveDemoNotFoundError);
    await expect(service.update_interactive_demo({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      data: {},
    })).rejects.toBeInstanceOf(EmptyInteractiveDemoUpdateError);

    expect(calls.list_demos).toEqual([{ organization_id: "organization_1", project_id: "project_1" }]);
    expect(calls.update_demo).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      actor_org_user_id: "org_user_1",
      data: { title: "Updated", description: null, status: "archived" },
    }]);
  });

  it("creates and updates scenes only when referenced background assets belong to the project", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.create_demo_scene({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      data: {
        title: " Welcome ",
        description: "",
        background_capture_asset_id: "capture_asset_1",
      },
    })).resolves.toMatchObject({
      title: "Welcome",
      description: null,
      background_capture_asset_id: "capture_asset_1",
    });
    await expect(service.update_demo_scene({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      data: {
        background_capture_asset_id: "missing_asset",
      },
    })).rejects.toBeInstanceOf(InvalidDemoSceneReferenceError);

    expect(calls.background_asset_exists).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_asset_id: "capture_asset_1",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_asset_id: "missing_asset",
      },
    ]);
  });

  it("reorders scenes with a non-empty contiguous order", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.reorder_demo_scenes({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      scene_ids: ["demo_scene_2", "demo_scene_1"],
    })).resolves.toEqual([
      expect.objectContaining({ id: "demo_scene_2", scene_index: 1 }),
      expect.objectContaining({ id: "demo_scene_1", scene_index: 2 }),
    ]);
    await expect(service.reorder_demo_scenes({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      scene_ids: [],
    })).rejects.toBeInstanceOf(EmptyDemoSceneOrderError);
    await expect(service.reorder_demo_scenes({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      scene_ids: ["demo_scene_1", "demo_scene_1"],
    })).rejects.toBeInstanceOf(InvalidDemoSceneOrderError);

    expect(calls.reorder_scenes).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      actor_org_user_id: "org_user_1",
      scene_ids: ["demo_scene_2", "demo_scene_1"],
    }]);
  });
});
