import { describe, expect, it } from "vitest";
import {
  build_guide_service,
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
  GuideNotEditableError,
  GuideBlockNotFoundError,
  InvalidGuideBlockContentError,
  InvalidGuideBlockOrderError,
  InvalidGuideBlockScreenshotError,
  GuideStepNotFoundError,
  ProjectNotFoundError,
  type GuideDetail,
  type GuideRepository,
  type GuideSourceEvent,
} from "./guide.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const source_events: GuideSourceEvent[] = [
  {
    id: "event_2",
    event_type: "click",
    event_index: 2,
    capture_asset_id: "asset_deleted",
    page_url: "https://example.test/departments",
    page_title: "Department",
    target_label: "Add Department",
    target_role: "button",
    target_text: "ignored text",
    note: null,
  },
  {
    id: "event_1",
    event_type: "navigation",
    event_index: 1,
    capture_asset_id: "asset_1",
    page_url: "https://example.test/departments",
    page_title: "Department List",
    target_label: null,
    target_role: null,
    target_text: null,
    note: null,
  },
  {
    id: "event_3",
    event_type: "input",
    event_index: 3,
    capture_asset_id: null,
    page_url: "https://example.test/departments/new",
    page_title: "New Department",
    target_label: "Department Name",
    target_role: "textbox",
    target_text: null,
    note: null,
  },
];

const screenshot_capture_events: GuideSourceEvent[] = [
  {
    id: "event_3",
    event_type: "capture",
    event_index: 3,
    capture_asset_id: null,
    page_url: null,
    page_title: null,
    target_label: null,
    target_role: null,
    target_text: null,
    note: null,
  },
  {
    id: "event_1",
    event_type: "capture",
    event_index: 1,
    capture_asset_id: "asset_1",
    page_url: "https://example.test/departments",
    page_title: "Department List",
    target_label: null,
    target_role: null,
    target_text: null,
    note: null,
  },
  {
    id: "event_2",
    event_type: "capture",
    event_index: 2,
    capture_asset_id: "asset_deleted",
    page_url: "https://example.test/departments/new",
    page_title: null,
    target_label: null,
    target_role: null,
    target_text: null,
    note: null,
  },
];

const guide_detail: GuideDetail = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: null,
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:00:00.000Z",
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  guide_blocks: [],
  source_capture_assets: [],
};

const build_repository = (): GuideRepository & {
  created_inputs: unknown[];
  update_guide_inputs: unknown[];
  update_step_inputs: unknown[];
  create_block_inputs: unknown[];
  update_block_inputs: unknown[];
  reorder_inputs: unknown[];
  delete_block_inputs: unknown[];
} => {
  const created_inputs: unknown[] = [];
  const update_guide_inputs: unknown[] = [];
  const update_step_inputs: unknown[] = [];
  const create_block_inputs: unknown[] = [];
  const update_block_inputs: unknown[] = [];
  const reorder_inputs: unknown[] = [];
  const delete_block_inputs: unknown[] = [];

  return {
    created_inputs,
    update_guide_inputs,
    update_step_inputs,
    create_block_inputs,
    update_block_inputs,
    reorder_inputs,
    delete_block_inputs,
    async project_exists(input) {
      return input.project_id === "project_1";
    },
    async capture_session_exists(input) {
      return input.capture_session_id === "capture_session_1";
    },
    async list_source_capture_events(input) {
      const selected_ids = input.selected_capture_event_ids;
      const events = selected_ids
        ? source_events.filter((event) => selected_ids.includes(event.id))
        : source_events;
      return [...events].sort((a, b) => a.event_index - b.event_index);
    },
    async list_active_capture_asset_ids(input) {
      return input.capture_asset_ids.filter((id) => id === "asset_1");
    },
    async active_screenshot_asset_exists(input) {
      return input.capture_asset_id === "asset_1";
    },
    async create_guide_from_capture(input) {
      created_inputs.push(input);
      return guide_detail;
    },
    async list_guides() {
      return [guide_detail.guide];
    },
    async find_guide_detail() {
      return guide_detail;
    },
    async update_guide(input) {
      update_guide_inputs.push(input);
      return {
        ...guide_detail.guide,
        title: input.data.title ?? guide_detail.guide.title,
        description: input.data.description ?? guide_detail.guide.description,
        status: input.data.status ?? guide_detail.guide.status,
        version: 2,
      };
    },
    async find_guide_step(input) {
      if (input.guide_step_id !== "step_1") {
        return null;
      }

      return {
        id: "step_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        title: "Old title",
        body: null,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
      };
    },
    async update_guide_step(input) {
      update_step_inputs.push(input);
      return {
        id: input.guide_step_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        guide_block_id: "block_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        title: input.data.title ?? "Old title",
        body: input.data.body ?? null,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 2,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
      };
    },
    async list_guide_blocks() {
      return [{
        id: "block_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: "asset_1",
        block_type: "step",
        content: null,
        block_index: 1,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
        step: null,
      }, {
        id: "block_2",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_2",
        source_capture_asset_id: "asset_1",
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: "asset_1",
        block_type: "step",
        content: null,
        block_index: 2,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
        step: null,
      }];
    },
    async reorder_guide_blocks(input) {
      reorder_inputs.push(input);
      return input.block_ids.map((id, index) => ({
        id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: null,
        source_capture_asset_id: null,
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "step",
        content: null,
        block_index: index + 1,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 2,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
        step: null,
      }));
    },
    async create_guide_block(input) {
      create_block_inputs.push(input);
      return [{
        id: "block_1",
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "step",
        content: null,
        block_index: 1,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
        step: {
          id: "step_2",
          organization_id: input.organization_id,
          project_id: input.project_id,
          guide_id: input.guide_id,
          guide_block_id: "block_new",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          title: input.data.step?.title ?? "New step",
          body: input.data.step?.body ?? null,
          created_by_id: "org_user_1",
          updated_by_id: input.actor_org_user_id,
          version: 1,
          created_at: "2026-06-05T00:00:00.000Z",
          updated_at: "2026-06-05T00:10:00.000Z",
        },
      }];
    },
    async update_guide_block(input) {
      update_block_inputs.push(input);
      return {
        id: input.guide_block_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "tip",
        content: input.data.content,
        block_index: 2,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 2,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
        step: null,
      };
    },
    async update_guide_block_screenshot(input) {
      return {
        id: input.guide_block_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        selected_capture_asset_id: input.data.selected_capture_asset_id,
        screenshot_hidden: input.data.screenshot_hidden,
        display_capture_asset_id: input.data.screenshot_hidden
          ? null
          : input.data.selected_capture_asset_id ?? "asset_1",
        block_type: "step",
        content: null,
        block_index: 1,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 2,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
        step: null,
      };
    },
    async delete_guide_block(input) {
      delete_block_inputs.push(input);
      return input.guide_block_id === "block_1";
    },
  };
};

describe("guide service", () => {
  it("creates a draft guide from selected capture events in persisted event order", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        title: " Department guide ",
        selected_capture_event_ids: ["event_3", "event_1", "event_2"],
      },
    })).resolves.toEqual(guide_detail);

    expect(repository.created_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Department guide",
        description: null,
        blocks: [
          {
            block_type: "step",
            block_index: 1,
            source_capture_event_id: "event_1",
            source_capture_asset_id: "asset_1",
            step: {
              title: "Navigate to \"Department List\"",
              body: null,
            },
          },
          {
            block_type: "step",
            block_index: 2,
            source_capture_event_id: "event_2",
            source_capture_asset_id: null,
            step: {
              title: "Click \"Add Department\"",
              body: null,
            },
          },
          {
            block_type: "step",
            block_index: 3,
            source_capture_event_id: "event_3",
            source_capture_asset_id: null,
            step: {
              title: "Enter the required value in \"Department Name\"",
              body: null,
            },
          },
        ],
      },
    }]);
  });

  it("validates scope and selected event ids", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "missing_project",
      capture_session_id: "capture_session_1",
      data: { title: "Guide" },
    })).rejects.toBeInstanceOf(ProjectNotFoundError);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "missing_session",
      data: { title: "Guide" },
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: { title: "Guide", selected_capture_event_ids: ["event_1", "event_1"] },
    })).rejects.toBeInstanceOf(InvalidGuideInputError);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: { title: "Guide", selected_capture_event_ids: ["missing_event"] },
    })).rejects.toBeInstanceOf(CaptureEventNotFoundError);
  });

  it("creates useful guide steps from screenshot-backed capture events", async () => {
    const repository = build_repository();
    repository.list_source_capture_events = async (input) => {
      const selected_ids = input.selected_capture_event_ids;
      const events = selected_ids
        ? screenshot_capture_events.filter((event) => selected_ids.includes(event.id))
        : screenshot_capture_events;
      return [...events].sort((a, b) => a.event_index - b.event_index);
    };
    const service = build_guide_service(repository);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        title: " Screenshot guide ",
        selected_capture_event_ids: ["event_3", "event_1", "event_2"],
      },
    })).resolves.toEqual(guide_detail);

    expect(repository.created_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Screenshot guide",
        description: null,
        blocks: [
          {
            block_type: "step",
            block_index: 1,
            source_capture_event_id: "event_1",
            source_capture_asset_id: "asset_1",
            step: {
              title: "Capture \"Department List\"",
              body: "Captured from https://example.test/departments.",
            },
          },
          {
            block_type: "step",
            block_index: 2,
            source_capture_event_id: "event_2",
            source_capture_asset_id: null,
            step: {
              title: "Capture \"https://example.test/departments/new\"",
              body: "Captured from this page.",
            },
          },
          {
            block_type: "step",
            block_index: 3,
            source_capture_event_id: "event_3",
            source_capture_asset_id: null,
            step: {
              title: "Capture this screen",
              body: null,
            },
          },
        ],
      },
    }]);
    expect(JSON.stringify(repository.created_inputs)).not.toContain("input_value");
    expect(JSON.stringify(repository.created_inputs)).not.toContain("typed_value");
  });

  it("lists and gets guides through scoped repository calls", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.list_guides({ auth, project_id: "project_1" })).resolves.toEqual([guide_detail.guide]);
    await expect(service.get_guide_detail({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    })).resolves.toEqual(guide_detail);
  });

  it("updates guide metadata for editable draft guides", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        title: " Updated department guide ",
        description: " Updated body ",
        status: "archived",
      },
    })).resolves.toMatchObject({
      id: "guide_1",
      title: "Updated department guide",
      description: "Updated body",
      status: "archived",
      version: 2,
    });

    expect(repository.update_guide_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Updated department guide",
        description: "Updated body",
        status: "archived",
      },
    }]);
  });

  it("rejects empty guide updates and non-editable archived guides", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {},
    })).rejects.toBeInstanceOf(InvalidGuideInputError);

    repository.find_guide_detail = async () => ({
      ...guide_detail,
      guide: {
        ...guide_detail.guide,
        status: "archived",
      },
    });

    await expect(service.update_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: { title: "Cannot edit" },
    })).rejects.toBeInstanceOf(GuideNotEditableError);
  });

  it("updates guide step title and body for editable draft guides", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide_step({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_step_id: "step_1",
      data: {
        title: " Updated step ",
        body: " Helpful details ",
      },
    })).resolves.toMatchObject({
      id: "step_1",
      title: "Updated step",
      body: "Helpful details",
      version: 2,
    });

    expect(repository.update_step_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      guide_step_id: "step_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Updated step",
        body: "Helpful details",
      },
    }]);
  });

  it("rejects invalid or missing guide step updates", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide_step({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_step_id: "step_1",
      data: {},
    })).rejects.toBeInstanceOf(InvalidGuideStepInputError);

    await expect(service.update_guide_step({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_step_id: "missing_step",
      data: { title: "Updated" },
    })).rejects.toBeInstanceOf(GuideStepNotFoundError);
  });

  it("reorders guide blocks when the request contains every active block once", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.reorder_guide_blocks({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      block_ids: ["block_2", "block_1"],
    })).resolves.toMatchObject([
      { id: "block_2", block_index: 1 },
      { id: "block_1", block_index: 2 },
    ]);

    expect(repository.reorder_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      actor_org_user_id: "org_user_1",
      block_ids: ["block_2", "block_1"],
    }]);
  });

  it("rejects invalid guide block reorder requests", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    for (const block_ids of [
      [],
      ["block_1", "block_1"],
      ["block_1"],
    ]) {
      await expect(service.reorder_guide_blocks({
        auth,
        project_id: "project_1",
        guide_id: "guide_1",
        block_ids,
      })).rejects.toBeInstanceOf(InvalidGuideBlockOrderError);
    }

    await expect(service.reorder_guide_blocks({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      block_ids: ["block_1", "missing_block"],
    })).rejects.toBeInstanceOf(GuideBlockNotFoundError);

    repository.list_guide_blocks = async () => [];

    await expect(service.reorder_guide_blocks({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      block_ids: ["block_1"],
    })).rejects.toBeInstanceOf(InvalidGuideBlockOrderError);
  });

  it("creates manual guide blocks with normalized content and insertion position", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "tip",
        position: {
          placement: "after",
          guide_block_id: "block_1",
        },
        content: {
          title: " Helpful hint ",
          body: " Use this when needed. ",
        },
      },
    })).resolves.toHaveLength(1);

    expect(repository.create_block_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      actor_org_user_id: "org_user_1",
      data: {
        block_type: "tip",
        position: {
          placement: "after",
          guide_block_id: "block_1",
        },
        content: {
          title: "Helpful hint",
          body: "Use this when needed.",
        },
      },
    }]);
  });

  it("creates manual step blocks through the first-class step model", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "step",
        step: {
          title: " New manual step ",
          body: " Step details ",
        },
      },
    });

    expect(repository.create_block_inputs).toEqual([expect.objectContaining({
      data: {
        block_type: "step",
        step: {
          title: "New manual step",
          body: "Step details",
        },
      },
    })]);
  });

  it("updates non-step guide block content", async () => {
    const repository = build_repository();
    repository.list_guide_blocks = async () => [{
      id: "block_3",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "tip",
      content: {
        title: "Old title",
        body: null,
      },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];
    const service = build_guide_service(repository);

    await expect(service.update_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_3",
      data: {
        content: {
          title: " Updated title ",
          body: " Updated body ",
        },
      },
    })).resolves.toMatchObject({
      id: "block_3",
      content: {
        title: "Updated title",
        body: "Updated body",
      },
    });

    expect(repository.update_block_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_3",
      actor_org_user_id: "org_user_1",
      data: {
        content: {
          title: "Updated title",
          body: "Updated body",
        },
      },
    }]);
  });

  it("rejects invalid manual guide block content", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "header",
        content: {
          title: " ",
        },
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);

    await expect(service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "paragraph",
        content: {
          body: "Not in this slice",
        },
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);
  });

  it("rejects invalid guide block content updates and step block content updates", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      data: {
        content: {
          title: "Should use step endpoint",
        },
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);

    repository.list_guide_blocks = async () => [];

    await expect(service.update_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "missing_block",
      data: {
        content: {
          title: "Missing",
        },
      },
    })).rejects.toBeInstanceOf(GuideBlockNotFoundError);
  });

  it("prepares a guide step screenshot upload using the block or guide source session", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
    })).resolves.toEqual({ capture_session_id: "capture_session_1" });

    repository.list_guide_blocks = async () => [{
      id: "manual_block",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "step",
      content: null,
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "manual_block",
    })).resolves.toEqual({ capture_session_id: "capture_session_1" });
  });

  it("rejects invalid guide step screenshot upload targets", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "missing_block",
    })).rejects.toBeInstanceOf(GuideBlockNotFoundError);

    repository.list_guide_blocks = async () => [{
      id: "tip_block",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "tip",
      content: { body: "Use this carefully." },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "tip_block",
    })).rejects.toBeInstanceOf(InvalidGuideBlockScreenshotError);

    repository.find_guide_detail = async () => ({
      ...guide_detail,
      guide: {
        ...guide_detail.guide,
        source_capture_session_id: null,
      },
    });
    repository.list_guide_blocks = async () => [{
      id: "manual_block",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "step",
      content: null,
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "manual_block",
    })).rejects.toBeInstanceOf(InvalidGuideBlockScreenshotError);
  });

  it("soft deletes a guide block for editable draft guides", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.delete_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
    })).resolves.toBeUndefined();

    expect(repository.delete_block_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      actor_org_user_id: "org_user_1",
    }]);

    await expect(service.delete_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "missing_block",
    })).rejects.toBeInstanceOf(GuideBlockNotFoundError);
  });
});
