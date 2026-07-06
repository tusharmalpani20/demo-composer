import type {
  CaptureSessionSourceType,
  CaptureSessionStatus,
} from "@repo/constants";
import {
  CaptureSessionNotCompletableError,
  CaptureSessionNotFoundError,
  EmptyCaptureSessionUpdateError,
  InvalidCaptureSessionCompletionError,
  InvalidCaptureSessionInputError,
  assert_non_empty_capture_session_update,
  build_capture_session_asset_file_url,
  build_capture_session_completion_redirect,
  normalize_create_capture_session,
  normalize_update_capture_session,
  type CreateCaptureSessionInput,
  type NormalizedCreateCaptureSessionInput,
  type NormalizedUpdateCaptureSessionInput,
  type UpdateCaptureSessionInput,
} from "@repo/capture-domain";
import type { CaptureAsset } from "../capture-asset/capture-asset.service";
import type { CaptureEvent } from "../capture-event/capture-event.service";

export type {
  CaptureSessionSourceType,
  CaptureSessionStatus,
};

export type CaptureSessionAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

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

export type CaptureSessionDetail = {
  capture_session: CaptureSession;
  capture_events: CaptureEvent[];
  capture_assets: Array<CaptureAsset & {
    file_url: string;
  }>;
};

export type {
  CreateCaptureSessionInput,
  NormalizedCreateCaptureSessionInput,
  NormalizedUpdateCaptureSessionInput,
  UpdateCaptureSessionInput,
};

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
  get_capture_session_detail: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<{
    capture_session: CaptureSession;
    capture_events: CaptureEvent[];
    capture_assets: CaptureAsset[];
  } | null>;
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

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project was not found");
  }
}

export {
  CaptureSessionNotCompletableError,
  CaptureSessionNotFoundError,
  EmptyCaptureSessionUpdateError,
  InvalidCaptureSessionCompletionError,
  InvalidCaptureSessionInputError,
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

  const get_capture_session_detail = async (input: {
    auth: CaptureSessionAuthContext;
    project_id: string;
    capture_session_id: string;
  }): Promise<CaptureSessionDetail> => {
    await ensure_project_exists({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    const detail = await repository.get_capture_session_detail({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    if (!detail) {
      throw new CaptureSessionNotFoundError();
    }

    return {
      capture_session: detail.capture_session,
      capture_events: detail.capture_events,
      capture_assets: detail.capture_assets.map((asset) => ({
        ...asset,
        file_url: build_capture_session_asset_file_url(asset),
      })),
    };
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

    assert_non_empty_capture_session_update(data);

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
      redirect: build_capture_session_completion_redirect(result.capture_session),
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
    get_capture_session_detail,
    update_capture_session,
    complete_capture_session,
    delete_capture_session,
  };
};
