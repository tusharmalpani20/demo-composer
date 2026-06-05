export type CaptureAssetAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type CaptureAssetType =
  | "screenshot"
  | "html_snapshot"
  | "thumbnail"
  | "redacted_screenshot";

export type FileStorageProvider = "local" | "external";

export type CaptureAsset = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  file: {
    id: string;
    storage_provider: FileStorageProvider;
    mime_type: string;
    size_bytes: number;
    original_name: string | null;
    checksum_sha256: string | null;
  };
  asset_type: CaptureAssetType;
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: string;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type CreateCaptureAssetInput = {
  asset_type: CaptureAssetType;
  width?: number | null;
  height?: number | null;
  device_pixel_ratio?: number | null;
  page_url?: string | null;
  page_title?: string | null;
  captured_at?: string | null;
  metadata?: unknown;
  file: {
    storage_provider?: FileStorageProvider;
    storage_key: string;
    mime_type: string;
    size_bytes: number;
    original_name?: string | null;
    checksum_sha256?: string | null;
    metadata?: unknown;
  };
};

export type NormalizedCreateCaptureAssetInput = {
  asset_type: "screenshot";
  width?: number | null;
  height?: number | null;
  device_pixel_ratio?: number | null;
  page_url?: string | null;
  page_title?: string | null;
  captured_at?: string | null;
  metadata?: unknown;
  file: {
    storage_provider: FileStorageProvider;
    storage_key: string;
    mime_type: string;
    size_bytes: number;
    original_name?: string | null;
    checksum_sha256?: string | null;
    metadata?: unknown;
  };
};

export type CaptureAssetRepository = {
  transaction: <Result>(
    callback: (repository: CaptureAssetTransactionalRepository) => Promise<Result>
  ) => Promise<Result>;
} & CaptureAssetTransactionalRepository;

export type CaptureAssetTransactionalRepository = {
  capture_session_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<boolean>;
  create_capture_asset: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateCaptureAssetInput;
  }) => Promise<CaptureAsset>;
  list_capture_assets: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    asset_type?: CaptureAssetType;
  }) => Promise<CaptureAsset[]>;
  find_capture_asset: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) => Promise<CaptureAsset | null>;
  delete_capture_asset: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
};

export class CaptureSessionNotFoundError extends Error {
  constructor() {
    super("Capture session was not found");
  }
}

export class CaptureAssetNotFoundError extends Error {
  constructor() {
    super("Capture asset was not found");
  }
}

export class InvalidCaptureAssetInputError extends Error {
  constructor() {
    super("Capture asset input is invalid");
  }
}

export class UnsupportedCaptureAssetTypeError extends Error {
  constructor() {
    super("Capture asset type is not supported yet");
  }
}

export class FileStorageKeyConflictError extends Error {
  constructor() {
    super("File storage key already exists");
  }
}

const compact_optional_string = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

const require_compact_string = (value: string | undefined) => {
  const compacted = compact_optional_string(value);

  if (!compacted) {
    throw new InvalidCaptureAssetInputError();
  }

  return compacted;
};

const normalize_create_capture_asset = (
  input: CreateCaptureAssetInput
): NormalizedCreateCaptureAssetInput => {
  if (input.asset_type !== "screenshot") {
    throw new UnsupportedCaptureAssetTypeError();
  }

  const mime_type = require_compact_string(input.file?.mime_type);

  if (!mime_type.toLowerCase().startsWith("image/")) {
    throw new InvalidCaptureAssetInputError();
  }

  return {
    asset_type: "screenshot",
    width: input.width,
    height: input.height,
    device_pixel_ratio: input.device_pixel_ratio,
    page_url: compact_optional_string(input.page_url),
    page_title: compact_optional_string(input.page_title),
    captured_at: compact_optional_string(input.captured_at),
    metadata: input.metadata,
    file: {
      storage_provider: input.file.storage_provider ?? "local",
      storage_key: require_compact_string(input.file.storage_key),
      mime_type,
      size_bytes: input.file.size_bytes,
      original_name: compact_optional_string(input.file.original_name),
      checksum_sha256: compact_optional_string(input.file.checksum_sha256),
      metadata: input.file.metadata,
    },
  };
};

export const build_capture_asset_service = (repository: CaptureAssetRepository) => {
  const ensure_capture_session_exists = async (input: {
    repository: CaptureAssetTransactionalRepository;
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => {
    const exists = await input.repository.capture_session_exists({
      organization_id: input.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    if (!exists) {
      throw new CaptureSessionNotFoundError();
    }
  };

  const create_capture_asset = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    data: CreateCaptureAssetInput;
  }) => {
    const data = normalize_create_capture_asset(input.data);

    return repository.transaction(async (transactional_repository) => {
      await ensure_capture_session_exists({
        repository: transactional_repository,
        organization_id: input.auth.organization_id,
        project_id: input.project_id,
        capture_session_id: input.capture_session_id,
      });

      return transactional_repository.create_capture_asset({
        organization_id: input.auth.organization_id,
        project_id: input.project_id,
        capture_session_id: input.capture_session_id,
        actor_org_user_id: input.auth.actor_org_user_id,
        data,
      });
    });
  };

  const list_capture_assets = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    asset_type?: CaptureAssetType;
  }) => {
    await ensure_capture_session_exists({
      repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    return repository.list_capture_assets({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      asset_type: input.asset_type,
    });
  };

  const get_capture_asset = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) => {
    await ensure_capture_session_exists({
      repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    const capture_asset = await repository.find_capture_asset({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      capture_asset_id: input.capture_asset_id,
    });

    if (!capture_asset) {
      throw new CaptureAssetNotFoundError();
    }

    return capture_asset;
  };

  const delete_capture_asset = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) => repository.transaction(async (transactional_repository) => {
    await ensure_capture_session_exists({
      repository: transactional_repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    const deleted = await transactional_repository.delete_capture_asset({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      capture_asset_id: input.capture_asset_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new CaptureAssetNotFoundError();
    }
  });

  return {
    create_capture_asset,
    list_capture_assets,
    get_capture_asset,
    delete_capture_asset,
  };
};
