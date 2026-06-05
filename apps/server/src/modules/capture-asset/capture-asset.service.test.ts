import { describe, expect, it } from "vitest";
import {
  build_capture_asset_service,
  CaptureAssetNotFoundError,
  CaptureSessionNotFoundError,
  FileStorageKeyConflictError,
  InvalidCaptureAssetInputError,
  ProjectNotFoundError,
  UnsupportedCaptureAssetTypeError,
  type CaptureAsset,
  type CaptureAssetRepository,
} from "./capture-asset.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const capture_asset: CaptureAsset = {
  id: "capture_asset_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_1",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 123456,
    original_name: "screenshot-1.png",
    checksum_sha256: "checksum",
  },
  asset_type: "screenshot",
  width: 1440,
  height: 900,
  device_pixel_ratio: 1,
  page_url: "https://example.internal/app/department",
  page_title: "Department",
  captured_at: "2026-06-05T00:00:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const build_repository = (): CaptureAssetRepository & {
  session_checks: unknown[];
  creates: unknown[];
  lists: unknown[];
  finds: unknown[];
  deletes: unknown[];
  transactions: number;
} => {
  const session_checks: unknown[] = [];
  const creates: unknown[] = [];
  const lists: unknown[] = [];
  const finds: unknown[] = [];
  const deletes: unknown[] = [];
  let transactions = 0;

  const repository: CaptureAssetRepository & {
    session_checks: unknown[];
    creates: unknown[];
    lists: unknown[];
    finds: unknown[];
    deletes: unknown[];
    transactions: number;
  } = {
    session_checks,
    creates,
    lists,
    finds,
    deletes,
    get transactions() {
      return transactions;
    },
    async transaction(callback) {
      transactions += 1;
      return callback(repository);
    },
    async capture_session_exists(input) {
      session_checks.push(input);
      return input.capture_session_id === "capture_session_1";
    },
    async project_exists(input) {
      return input.project_id === "project_1" && input.organization_id === "organization_1";
    },
    async create_capture_asset(input) {
      creates.push(input);
      return capture_asset;
    },
    async list_capture_assets(input) {
      lists.push(input);
      return [capture_asset];
    },
    async find_capture_asset(input) {
      finds.push(input);
      return input.capture_asset_id === "capture_asset_1" ? capture_asset : null;
    },
    async delete_capture_asset(input) {
      deletes.push(input);
      return input.capture_asset_id === "capture_asset_1";
    },
  };

  return repository;
};

describe("capture asset service", () => {
  it("creates screenshot asset metadata under an accessible capture session transactionally", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(service.create_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 1,
        page_url: " https://example.internal/app/department ",
        page_title: " Department ",
        file: {
          storage_provider: "local",
          storage_key: " captures/org/project/session/screenshot-1.png ",
          mime_type: " image/png ",
          size_bytes: 123456,
          original_name: " screenshot-1.png ",
          checksum_sha256: " checksum ",
        },
        metadata: { capture_mode: "manual" },
      },
    })).resolves.toEqual(capture_asset);

    expect(repository.transactions).toBe(1);
    expect(repository.session_checks).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
    }]);
    expect(repository.creates).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      actor_org_user_id: "org_user_1",
      data: {
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 1,
        page_url: "https://example.internal/app/department",
        page_title: "Department",
        captured_at: undefined,
        metadata: { capture_mode: "manual" },
        file: {
          storage_provider: "local",
          storage_key: "captures/org/project/session/screenshot-1.png",
          mime_type: "image/png",
          size_bytes: 123456,
          original_name: "screenshot-1.png",
          checksum_sha256: "checksum",
          metadata: undefined,
        },
      },
    }]);
  });

  it("rejects unsupported asset types and non-image screenshot files", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(service.create_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        asset_type: "html_snapshot",
        file: {
          storage_key: "capture.html",
          mime_type: "text/html",
          size_bytes: 1,
        },
      },
    })).rejects.toBeInstanceOf(UnsupportedCaptureAssetTypeError);

    await expect(service.create_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        asset_type: "screenshot",
        file: {
          storage_key: "capture.txt",
          mime_type: "text/plain",
          size_bytes: 1,
        },
      },
    })).rejects.toBeInstanceOf(InvalidCaptureAssetInputError);
  });

  it("maps missing capture sessions and duplicate storage keys", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(service.create_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "missing",
      data: {
        asset_type: "screenshot",
        file: {
          storage_key: "capture.png",
          mime_type: "image/png",
          size_bytes: 1,
        },
      },
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    repository.create_capture_asset = async () => {
      throw new FileStorageKeyConflictError();
    };

    await expect(service.create_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        asset_type: "screenshot",
        file: {
          storage_key: "capture.png",
          mime_type: "image/png",
          size_bytes: 1,
        },
      },
    })).rejects.toBeInstanceOf(FileStorageKeyConflictError);
  });

  it("rejects operations when the project is missing before checking capture sessions", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(service.create_capture_asset({
      auth,
      project_id: "missing_project",
      capture_session_id: "capture_session_1",
      data: {
        asset_type: "screenshot",
        file: {
          storage_key: "capture.png",
          mime_type: "image/png",
          size_bytes: 1,
        },
      },
    })).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(service.list_capture_assets({
      auth,
      project_id: "missing_project",
      capture_session_id: "capture_session_1",
    })).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(service.get_capture_asset({
      auth,
      project_id: "missing_project",
      capture_session_id: "capture_session_1",
      capture_asset_id: "capture_asset_1",
    })).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(service.delete_capture_asset({
      auth,
      project_id: "missing_project",
      capture_session_id: "capture_session_1",
      capture_asset_id: "capture_asset_1",
    })).rejects.toBeInstanceOf(ProjectNotFoundError);

    expect(repository.session_checks).toEqual([]);
    expect(repository.creates).toEqual([]);
    expect(repository.lists).toEqual([]);
    expect(repository.finds).toEqual([]);
    expect(repository.deletes).toEqual([]);
  });

  it("lists gets and deletes capture assets in scope after checking the capture session", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(service.list_capture_assets({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      asset_type: "screenshot",
    })).resolves.toEqual([capture_asset]);
    await expect(service.get_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_asset_id: "capture_asset_1",
    })).resolves.toEqual(capture_asset);
    await expect(service.get_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_asset_id: "missing",
    })).rejects.toBeInstanceOf(CaptureAssetNotFoundError);
    await expect(service.delete_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_asset_id: "capture_asset_1",
    })).resolves.toBeUndefined();

    expect(repository.lists).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      asset_type: "screenshot",
    }]);
    expect(repository.session_checks).toHaveLength(4);
    expect(repository.finds).toHaveLength(2);
    expect(repository.deletes).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_asset_id: "capture_asset_1",
      actor_org_user_id: "org_user_1",
    }]);
  });

  it("rejects list get and delete when the capture session is missing", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(service.list_capture_assets({
      auth,
      project_id: "project_1",
      capture_session_id: "missing",
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);
    await expect(service.get_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "missing",
      capture_asset_id: "capture_asset_1",
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);
    await expect(service.delete_capture_asset({
      auth,
      project_id: "project_1",
      capture_session_id: "missing",
      capture_asset_id: "capture_asset_1",
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    expect(repository.lists).toEqual([]);
    expect(repository.finds).toEqual([]);
    expect(repository.deletes).toEqual([]);
  });
});
