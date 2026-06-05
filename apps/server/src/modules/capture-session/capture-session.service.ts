export type CaptureSessionAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type CaptureSessionStatus = "draft" | "capturing" | "completed" | "canceled" | "archived";
export type CaptureSessionSourceType = "manual" | "extension" | "import";

export type CaptureSession = {
  id: string;
  organization_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: CaptureSessionStatus;
  source_type: CaptureSessionSourceType;
  started_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  start_url: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  user_agent: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type CompletedCaptureSessionResult = {
  capture_session: CaptureSession;
  redirect: {
    path: string;
    reason: "capture_session_completed";
  };
};

export type CreateCaptureSessionInput = {
  name: string;
  description?: string | null;
  source_type?: CaptureSessionSourceType;
  start_url?: string | null;
  browser_name?: string | null;
  browser_version?: string | null;
  operating_system?: string | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  user_agent?: string | null;
  metadata?: unknown;
  status?: CaptureSessionStatus;
  started_at?: unknown;
  completed_at?: unknown;
  canceled_at?: unknown;
};

export type UpdateCaptureSessionInput = Partial<{
  name: string;
  description: string | null;
  status: CaptureSessionStatus;
  start_url: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  user_agent: string | null;
  metadata: unknown;
  started_at: unknown;
  completed_at: unknown;
  canceled_at: unknown;
}>;

export type CaptureSessionRepository = {
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  create_capture_session: (input: {
    organization_id: string;
    project_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateCaptureSessionInput;
  }) => Promise<CaptureSession>;
  list_capture_sessions: (input: {
    organization_id: string;
    project_id: string;
    status?: CaptureSessionStatus;
  }) => Promise<CaptureSession[]>;
  find_capture_session: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<CaptureSession | null>;
  update_capture_session: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateCaptureSessionInput;
  }) => Promise<CaptureSession | null>;
  complete_capture_session: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
  }) => Promise<{
    capture_session: CaptureSession | null;
    outcome: "completed" | "already_completed" | "not_completable" | "not_found";
  }>;
  delete_capture_session: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
};

export type NormalizedCreateCaptureSessionInput = {
  name: string;
  description?: string | null;
  source_type?: CaptureSessionSourceType;
  start_url?: string | null;
  browser_name?: string | null;
  browser_version?: string | null;
  operating_system?: string | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  user_agent?: string | null;
  metadata?: unknown;
};

export type NormalizedUpdateCaptureSessionInput = Partial<{
  name: string;
  description: string | null;
  status: CaptureSessionStatus;
  start_url: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  user_agent: string | null;
  metadata: unknown;
}>;

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project was not found");
  }
}

export class CaptureSessionNotFoundError extends Error {
  constructor() {
    super("Capture session was not found");
  }
}

export class CaptureSessionNotCompletableError extends Error {
  constructor() {
    super("Capture session cannot be completed from its current status");
  }
}

export class InvalidCaptureSessionCompletionError extends Error {
  constructor() {
    super("Capture session completion input is invalid");
  }
}

export class EmptyCaptureSessionUpdateError extends Error {
  constructor() {
    super("At least one capture session field must be provided");
  }
}

export class InvalidCaptureSessionInputError extends Error {
  constructor() {
    super("Capture session input is invalid");
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

const normalize_create_capture_session = (
  input: CreateCaptureSessionInput
): NormalizedCreateCaptureSessionInput => ({
  name: input.name.trim(),
  description: compact_optional_string(input.description),
  source_type: input.source_type,
  start_url: compact_optional_string(input.start_url),
  browser_name: compact_optional_string(input.browser_name),
  browser_version: compact_optional_string(input.browser_version),
  operating_system: compact_optional_string(input.operating_system),
  viewport_width: input.viewport_width,
  viewport_height: input.viewport_height,
  device_pixel_ratio: input.device_pixel_ratio,
  user_agent: compact_optional_string(input.user_agent),
  metadata: input.metadata,
});

const normalize_update_capture_session = (
  input: UpdateCaptureSessionInput
): NormalizedUpdateCaptureSessionInput => {
  const normalized: NormalizedUpdateCaptureSessionInput = {};

  if (input.name !== undefined) {
    normalized.name = input.name.trim();
  }
  if (input.description !== undefined) {
    normalized.description = compact_optional_string(input.description) ?? null;
  }
  if (input.status !== undefined) {
    normalized.status = input.status;
  }
  if (input.start_url !== undefined) {
    normalized.start_url = compact_optional_string(input.start_url) ?? null;
  }
  if (input.browser_name !== undefined) {
    normalized.browser_name = compact_optional_string(input.browser_name) ?? null;
  }
  if (input.browser_version !== undefined) {
    normalized.browser_version = compact_optional_string(input.browser_version) ?? null;
  }
  if (input.operating_system !== undefined) {
    normalized.operating_system = compact_optional_string(input.operating_system) ?? null;
  }
  if (input.viewport_width !== undefined) {
    normalized.viewport_width = input.viewport_width;
  }
  if (input.viewport_height !== undefined) {
    normalized.viewport_height = input.viewport_height;
  }
  if (input.device_pixel_ratio !== undefined) {
    normalized.device_pixel_ratio = input.device_pixel_ratio;
  }
  if (input.user_agent !== undefined) {
    normalized.user_agent = compact_optional_string(input.user_agent) ?? null;
  }
  if (input.metadata !== undefined) {
    normalized.metadata = input.metadata;
  }

  return normalized;
};

export const build_capture_session_service = (repository: CaptureSessionRepository) => {
  const ensure_project_exists = async (input: {
    organization_id: string;
    project_id: string;
  }) => {
    const exists = await repository.project_exists(input);

    if (!exists) {
      throw new ProjectNotFoundError();
    }
  };

  const create_capture_session = async (input: {
    auth: CaptureSessionAuthContext;
    project_id: string;
    data: CreateCaptureSessionInput;
  }) => {
    await ensure_project_exists({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    return repository.create_capture_session({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data: normalize_create_capture_session(input.data),
    });
  };

  const list_capture_sessions = async (input: {
    auth: CaptureSessionAuthContext;
    project_id: string;
    status?: CaptureSessionStatus;
  }) => {
    await ensure_project_exists({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    return repository.list_capture_sessions({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      status: input.status,
    });
  };

  const get_capture_session = async (input: {
    auth: CaptureSessionAuthContext;
    project_id: string;
    capture_session_id: string;
  }) => {
    await ensure_project_exists({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    const capture_session = await repository.find_capture_session({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    if (!capture_session) {
      throw new CaptureSessionNotFoundError();
    }

    return capture_session;
  };

  const update_capture_session = async (input: {
    auth: CaptureSessionAuthContext;
    project_id: string;
    capture_session_id: string;
    data: UpdateCaptureSessionInput;
  }) => {
    await ensure_project_exists({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    const data = normalize_update_capture_session(input.data);

    if (Object.keys(data).length === 0) {
      throw new EmptyCaptureSessionUpdateError();
    }

    const capture_session = await repository.update_capture_session({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });

    if (!capture_session) {
      throw new CaptureSessionNotFoundError();
    }

    return capture_session;
  };

  const complete_capture_session = async (input: {
    auth: CaptureSessionAuthContext;
    project_id: string;
    capture_session_id: string;
  }): Promise<CompletedCaptureSessionResult> => {
    await ensure_project_exists({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    const result = await repository.complete_capture_session({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!result.capture_session || result.outcome === "not_found") {
      throw new CaptureSessionNotFoundError();
    }

    if (result.outcome === "not_completable") {
      throw new CaptureSessionNotCompletableError();
    }

    return {
      capture_session: result.capture_session,
      redirect: {
        path: `/projects/${result.capture_session.project_id}/capture-sessions/${result.capture_session.id}`,
        reason: "capture_session_completed",
      },
    };
  };

  const delete_capture_session = async (input: {
    auth: CaptureSessionAuthContext;
    project_id: string;
    capture_session_id: string;
  }) => {
    await ensure_project_exists({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    const deleted = await repository.delete_capture_session({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new CaptureSessionNotFoundError();
    }
  };

  return {
    create_capture_session,
    list_capture_sessions,
    get_capture_session,
    update_capture_session,
    complete_capture_session,
    delete_capture_session,
  };
};
