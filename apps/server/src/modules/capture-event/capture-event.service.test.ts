import { describe, expect, it } from "vitest";
import {
  build_capture_event_service,
  CaptureAssetNotFoundError,
  CaptureEventIndexConflictError,
  CaptureEventNotFoundError,
  CaptureEventReorderNotAllowedError,
  CaptureSessionNotFoundError,
  InvalidCaptureEventOrderError,
  InvalidCaptureEventInputError,
  ProjectNotFoundError,
  type CaptureEvent,
  type CaptureEventRepository,
} from "./capture-event.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const capture_event: CaptureEvent = {
  id: "capture_event_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: "capture_asset_1",
  event_type: "click",
  event_index: 2,
  occurred_at: "2026-06-05T00:00:00.000Z",
  page_url: "https://example.internal/app/department",
  page_title: "Department",
  target_label: "Add Department",
  target_selector: "button[data-testid='add-department']",
  target_role: "button",
  target_test_id: "add-department",
  target_text: "Add Department",
  client_x: 1200,
  client_y: 84,
  viewport_width: 1440,
  viewport_height: 900,
  device_pixel_ratio: 1,
  input_intent: null,
  input_value_redacted: true,
  note: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const build_repository = (): CaptureEventRepository & {
  project_checks: unknown[];
  session_checks: unknown[];
  asset_checks: unknown[];
  creates: unknown[];
  lists: unknown[];
  finds: unknown[];
  deletes: unknown[];
  source_type_checks: unknown[];
  reorders: unknown[];
} => {
  const project_checks: unknown[] = [];
  const session_checks: unknown[] = [];
  const asset_checks: unknown[] = [];
  const creates: unknown[] = [];
  const lists: unknown[] = [];
  const finds: unknown[] = [];
  const deletes: unknown[] = [];
  const source_type_checks: unknown[] = [];
  const reorders: unknown[] = [];

  return {
    project_checks,
    session_checks,
    asset_checks,
    creates,
    lists,
    finds,
    deletes,
    source_type_checks,
    reorders,
    async project_exists(input) {
      project_checks.push(input);
      return input.project_id === "project_1";
    },
    async capture_session_exists(input) {
      session_checks.push(input);
      return input.capture_session_id === "capture_session_1";
    },
    async get_capture_session_source_type(input) {
      source_type_checks.push(input);
      if (input.capture_session_id === "capture_session_1") {
        return "manual";
      }
      if (input.capture_session_id === "extension_session") {
        return "extension";
      }
      return null;
    },
    async capture_asset_exists(input) {
      asset_checks.push(input);
      return input.capture_asset_id === "capture_asset_1";
    },
    async create_capture_event(input) {
      creates.push(input);
      return capture_event;
    },
    async list_capture_events(input) {
      lists.push(input);
      if (input.event_type) {
        return [capture_event];
      }
      if (input.capture_session_id === "capture_session_1") {
        return [
          { ...capture_event, id: "capture_event_1", event_index: 1, note: "First" },
          { ...capture_event, id: "capture_event_2", event_index: 2, note: "Second" },
          { ...capture_event, id: "capture_event_3", event_index: 3, note: "Third" },
        ];
      }
      return [capture_event];
    },
    async find_capture_event(input) {
      finds.push(input);
      return input.capture_event_id === "capture_event_1" ? capture_event : null;
    },
    async delete_capture_event(input) {
      deletes.push(input);
      return input.capture_event_id === "capture_event_1";
    },
    async reorder_capture_events(input) {
      reorders.push(input);
      return input.event_ids.map((id, index) => ({
        ...capture_event,
        id,
        event_index: index + 1,
      }));
    },
  };
};

describe("capture event service", () => {
  it("creates a scoped event after validating project session and asset", async () => {
    const repository = build_repository();
    const service = build_capture_event_service(repository);

    await expect(service.create_capture_event({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        event_type: "click",
        event_index: 2,
        capture_asset_id: "capture_asset_1",
        occurred_at: "2026-06-05T00:00:00.000Z",
        page_url: " https://example.internal/app/department ",
        page_title: " Department ",
        target_label: " Add Department ",
        target_selector: " button[data-testid='add-department'] ",
        target_role: " button ",
        target_test_id: " add-department ",
        target_text: " Add Department ",
        client_x: 1200,
        client_y: 84,
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 1,
        metadata: { source: "manual" },
      },
    })).resolves.toEqual(capture_event);

    expect(repository.project_checks).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
    }]);
    expect(repository.session_checks).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
    }]);
    expect(repository.asset_checks).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_asset_id: "capture_asset_1",
    }]);
    expect(repository.creates).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      actor_org_user_id: "org_user_1",
      data: {
        event_type: "click",
        event_index: 2,
        capture_asset_id: "capture_asset_1",
        occurred_at: "2026-06-05T00:00:00.000Z",
        page_url: "https://example.internal/app/department",
        page_title: "Department",
        target_label: "Add Department",
        target_selector: "button[data-testid='add-department']",
        target_role: "button",
        target_test_id: "add-department",
        target_text: "Add Department",
        client_x: 1200,
        client_y: 84,
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 1,
        input_intent: undefined,
        input_value_redacted: true,
        note: undefined,
        metadata: { source: "manual" },
      },
    }]);
  });

  it("rejects missing scope and invalid linked assets", async () => {
    const repository = build_repository();
    const service = build_capture_event_service(repository);

    await expect(service.create_capture_event({
      auth,
      project_id: "missing_project",
      capture_session_id: "capture_session_1",
      data: {
        event_type: "note",
        event_index: 1,
        note: "Hello",
      },
    })).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(service.create_capture_event({
      auth,
      project_id: "project_1",
      capture_session_id: "missing_session",
      data: {
        event_type: "note",
        event_index: 1,
        note: "Hello",
      },
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);
    await expect(service.create_capture_event({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        event_type: "capture",
        event_index: 1,
        capture_asset_id: "missing_asset",
      },
    })).rejects.toBeInstanceOf(CaptureAssetNotFoundError);
  });

  it("rejects invalid event payloads and raw input value fields", async () => {
    const repository = build_repository();
    const service = build_capture_event_service(repository);

    for (const data of [
      { event_type: "navigation", event_index: 1 },
      { event_type: "click", event_index: 1 },
      { event_type: "input", event_index: 1, input_value_redacted: false },
      { event_type: "input", event_index: 1, input_value: "secret" },
      { event_type: "capture", event_index: 1 },
      { event_type: "note", event_index: 1, note: " " },
    ] as const) {
      await expect(service.create_capture_event({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data,
      })).rejects.toBeInstanceOf(InvalidCaptureEventInputError);
    }
  });

  it("maps duplicate indexes and lists gets deletes scoped events", async () => {
    const repository = build_repository();
    const service = build_capture_event_service(repository);

    repository.create_capture_event = async () => {
      throw new CaptureEventIndexConflictError();
    };

    await expect(service.create_capture_event({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        event_type: "note",
        event_index: 1,
        note: "Remember this",
      },
    })).rejects.toBeInstanceOf(CaptureEventIndexConflictError);

    await expect(service.list_capture_events({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      event_type: "click",
    })).resolves.toEqual([capture_event]);
    await expect(service.get_capture_event({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_event_id: "capture_event_1",
    })).resolves.toEqual(capture_event);
    await expect(service.get_capture_event({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_event_id: "missing",
    })).rejects.toBeInstanceOf(CaptureEventNotFoundError);
    await expect(service.delete_capture_event({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_event_id: "capture_event_1",
    })).resolves.toBeUndefined();

    expect(repository.lists).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      event_type: "click",
    }]);
    expect(repository.deletes).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_event_id: "capture_event_1",
      actor_org_user_id: "org_user_1",
    }]);
  });

  it("reorders all manual capture session events with contiguous indexes", async () => {
    const repository = build_repository();
    const service = build_capture_event_service(repository);

    await expect(service.reorder_capture_events({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        event_ids: [" capture_event_3 ", "capture_event_1", "capture_event_2"],
      },
    })).resolves.toEqual([
      expect.objectContaining({ id: "capture_event_3", event_index: 1 }),
      expect.objectContaining({ id: "capture_event_1", event_index: 2 }),
      expect.objectContaining({ id: "capture_event_2", event_index: 3 }),
    ]);

    expect(repository.source_type_checks).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
    }]);
    expect(repository.reorders).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      actor_org_user_id: "org_user_1",
      event_ids: ["capture_event_3", "capture_event_1", "capture_event_2"],
    }]);
  });

  it("rejects invalid manual capture event reorder input", async () => {
    const repository = build_repository();
    const service = build_capture_event_service(repository);

    for (const event_ids of [
      [],
      ["capture_event_1", " "],
      ["capture_event_1", "capture_event_1", "capture_event_2"],
      ["capture_event_1", "capture_event_2"],
      ["capture_event_1", "capture_event_2", "other_session_event"],
    ]) {
      await expect(service.reorder_capture_events({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: { event_ids },
      })).rejects.toBeInstanceOf(InvalidCaptureEventOrderError);
    }

    await expect(service.reorder_capture_events({
      auth,
      project_id: "project_1",
      capture_session_id: "extension_session",
      data: { event_ids: ["capture_event_1"] },
    })).rejects.toBeInstanceOf(CaptureEventReorderNotAllowedError);
  });
});
