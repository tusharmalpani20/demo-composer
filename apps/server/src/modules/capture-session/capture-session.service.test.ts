import { describe, expect, it } from "vitest";
import {
  build_capture_session_service,
  CaptureSessionNotFoundError,
  EmptyCaptureSessionUpdateError,
  ProjectNotFoundError,
  type CaptureSession,
  type CaptureSessionRepository,
} from "./capture-session.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const capture_session: CaptureSession = {
  id: "capture_session_1",
  organization_id: "organization_1",
  project_id: "project_1",
  name: "Create department workflow",
  description: "Source capture for the department setup guide",
  status: "draft",
  source_type: "manual",
  started_at: null,
  completed_at: null,
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
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const build_repository = (): CaptureSessionRepository & {
  project_checks: unknown[];
  creates: unknown[];
  lists: unknown[];
  finds: unknown[];
  updates: unknown[];
  deletes: unknown[];
} => {
  const project_checks: unknown[] = [];
  const creates: unknown[] = [];
  const lists: unknown[] = [];
  const finds: unknown[] = [];
  const updates: unknown[] = [];
  const deletes: unknown[] = [];

  return {
    project_checks,
    creates,
    lists,
    finds,
    updates,
    deletes,
    async project_exists(input) {
      project_checks.push(input);
      return input.project_id === "project_1";
    },
    async create_capture_session(input) {
      creates.push(input);
      return {
        ...capture_session,
        ...input.data,
        organization_id: input.organization_id,
        project_id: input.project_id,
        created_by_id: input.actor_org_user_id,
        updated_by_id: input.actor_org_user_id,
      };
    },
    async list_capture_sessions(input) {
      lists.push(input);
      return [capture_session];
    },
    async find_capture_session(input) {
      finds.push(input);
      return input.capture_session_id === "capture_session_1" ? capture_session : null;
    },
    async update_capture_session(input) {
      updates.push(input);
      if (input.capture_session_id !== "capture_session_1") {
        return null;
      }

      return {
        ...capture_session,
        ...input.data,
        status: input.data.status ?? capture_session.status,
        started_at: input.data.status === "capturing" ? "2026-06-05T00:00:01.000Z" : capture_session.started_at,
        completed_at: input.data.status === "completed" ? "2026-06-05T00:00:02.000Z" : capture_session.completed_at,
        canceled_at: input.data.status === "canceled" ? "2026-06-05T00:00:03.000Z" : capture_session.canceled_at,
        updated_by_id: input.actor_org_user_id,
        version: 2,
      };
    },
    async delete_capture_session(input) {
      deletes.push(input);
      return input.capture_session_id === "capture_session_1";
    },
  };
};

describe("capture session service", () => {
  it("creates capture sessions under an accessible project using auth context", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(service.create_capture_session({
      auth,
      project_id: "project_1",
      data: {
        name: " Create department workflow ",
        description: "",
        source_type: "extension",
        status: "completed",
        started_at: "attacker timestamp",
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 2,
        metadata: {
          capture_mode: "screenshot",
        },
      },
    })).resolves.toMatchObject({
      name: "Create department workflow",
      description: null,
      source_type: "extension",
      status: "draft",
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
    });

    expect(repository.project_checks).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
    }]);
    expect(repository.creates).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      actor_org_user_id: "org_user_1",
      data: {
        name: "Create department workflow",
        description: null,
        source_type: "extension",
        start_url: undefined,
        browser_name: undefined,
        browser_version: undefined,
        operating_system: undefined,
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 2,
        user_agent: undefined,
        metadata: {
          capture_mode: "screenshot",
        },
      },
    }]);
  });

  it("rejects create when the project is missing or deleted", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(service.create_capture_session({
      auth,
      project_id: "missing",
      data: {
        name: "Capture",
      },
    })).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("lists and gets capture sessions scoped to the current project and organization", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(service.list_capture_sessions({
      auth,
      project_id: "project_1",
    })).resolves.toEqual([capture_session]);
    await expect(service.list_capture_sessions({
      auth,
      project_id: "project_1",
      status: "completed",
    })).resolves.toEqual([capture_session]);
    await expect(service.get_capture_session({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
    })).resolves.toEqual(capture_session);
    await expect(service.get_capture_session({
      auth,
      project_id: "project_1",
      capture_session_id: "missing",
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    expect(repository.lists).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        status: undefined,
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        status: "completed",
      },
    ]);
    expect(repository.finds).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "missing",
      },
    ]);
  });

  it("updates capture sessions and lets the repository manage lifecycle timestamps", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(service.update_capture_session({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        name: " Updated Capture ",
        description: "",
        status: "capturing",
        started_at: "attacker timestamp",
      },
    })).resolves.toMatchObject({
      name: "Updated Capture",
      description: null,
      status: "capturing",
      started_at: "2026-06-05T00:00:01.000Z",
      updated_by_id: "org_user_1",
      version: 2,
    });
    await expect(service.update_capture_session({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {},
    })).rejects.toBeInstanceOf(EmptyCaptureSessionUpdateError);
    await expect(service.update_capture_session({
      auth,
      project_id: "project_1",
      capture_session_id: "missing",
      data: {
        name: "Updated Capture",
      },
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    expect(repository.updates).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        actor_org_user_id: "org_user_1",
        data: {
          name: "Updated Capture",
          description: null,
          status: "capturing",
        },
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "missing",
        actor_org_user_id: "org_user_1",
        data: {
          name: "Updated Capture",
        },
      },
    ]);
  });

  it("soft deletes capture sessions using auth context", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(service.delete_capture_session({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
    })).resolves.toBeUndefined();
    await expect(service.delete_capture_session({
      auth,
      project_id: "project_1",
      capture_session_id: "missing",
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    expect(repository.deletes).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        actor_org_user_id: "org_user_1",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "missing",
        actor_org_user_id: "org_user_1",
      },
    ]);
  });
});
