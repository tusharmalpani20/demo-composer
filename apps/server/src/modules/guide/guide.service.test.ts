import { describe, expect, it } from "vitest";
import {
  build_guide_service,
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  InvalidGuideInputError,
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
};

const build_repository = (): GuideRepository & {
  created_inputs: unknown[];
} => {
  const created_inputs: unknown[] = [];

  return {
    created_inputs,
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
});
