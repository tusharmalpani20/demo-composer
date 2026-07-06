import type {
  CaptureEventType,
  CaptureSessionSourceType,
  CaptureSessionStatus,
} from "@repo/constants";
import {
  CaptureAssetNotFoundError,
  CaptureEventIndexConflictError,
  CaptureEventNotFoundError,
  CaptureEventReorderNotAllowedError,
  CaptureEventUpdateNotAllowedError,
  CaptureSessionNotFoundError,
  InvalidCaptureEventInputError,
  InvalidCaptureEventOrderError,
  assert_capture_event_update_allowed,
  assert_reorder_allowed_for_source_type,
  assert_reorder_covers_all_events,
  normalize_create_capture_event,
  normalize_reorder_capture_events,
  normalize_update_capture_event,
  type CreateCaptureEventInput,
  type NormalizedCreateCaptureEventInput,
  type NormalizedUpdateCaptureEventInput,
  type ReorderCaptureEventsInput,
  type UpdateCaptureEventInput,
} from "@repo/capture-domain";

export type {
  CaptureEventType,
  CaptureSessionSourceType,
  CaptureSessionStatus,
};

export type CaptureEventAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type CaptureEvent = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  capture_asset_id: string | null;
  event_type: CaptureEventType;
  event_index: number;
  occurred_at: string;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_selector: string | null;
  target_role: string | null;
  target_test_id: string | null;
  target_text: string | null;
  client_x: number | null;
  client_y: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  input_intent: string | null;
  input_value_redacted: true;
  note: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type {
  CreateCaptureEventInput,
  NormalizedCreateCaptureEventInput,
  NormalizedUpdateCaptureEventInput,
  ReorderCaptureEventsInput,
  UpdateCaptureEventInput,
};

export type CaptureEventRepository = {
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  capture_session_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<boolean>;
  get_capture_session_source_type: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<CaptureSessionSourceType | null>;
  get_capture_session_editability: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<{
    source_type: CaptureSessionSourceType;
    status: CaptureSessionStatus;
  } | null>;
  capture_asset_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) => Promise<boolean>;
  create_capture_event: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateCaptureEventInput;
  }) => Promise<CaptureEvent>;
  list_capture_events: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    event_type?: CaptureEventType;
  }) => Promise<CaptureEvent[]>;
  find_capture_event: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
  }) => Promise<CaptureEvent | null>;
  delete_capture_event: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
  reorder_capture_events: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    event_ids: string[];
  }) => Promise<CaptureEvent[]>;
  update_capture_event: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateCaptureEventInput;
  }) => Promise<CaptureEvent | null>;
};

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project was not found");
  }
}

export {
  CaptureAssetNotFoundError,
  CaptureEventIndexConflictError,
  CaptureEventNotFoundError,
  CaptureEventReorderNotAllowedError,
  CaptureEventUpdateNotAllowedError,
  CaptureSessionNotFoundError,
  InvalidCaptureEventInputError,
  InvalidCaptureEventOrderError,
};

export const build_capture_event_service = (repository: CaptureEventRepository) => {
  const ensure_project_exists = async (input: {
    organization_id: string;
    project_id: string;
  }) => {
    const exists = await repository.project_exists(input);

    if (!exists) {
      throw new ProjectNotFoundError();
    }
  };

  const ensure_capture_session_exists = async (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => {
    const exists = await repository.capture_session_exists(input);

    if (!exists) {
      throw new CaptureSessionNotFoundError();
    }
  };

  const ensure_scope_exists = async (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => {
    await ensure_project_exists({
      organization_id: input.organization_id,
      project_id: input.project_id,
    });
    await ensure_capture_session_exists(input);
  };

  const ensure_capture_asset_exists = async (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id?: string | null;
  }) => {
    if (!input.capture_asset_id) {
      return;
    }

    const exists = await repository.capture_asset_exists({
      organization_id: input.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      capture_asset_id: input.capture_asset_id,
    });

    if (!exists) {
      throw new CaptureAssetNotFoundError();
    }
  };

  const create_capture_event = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    data: CreateCaptureEventInput;
  }) => {
    const data = normalize_create_capture_event(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_scope_exists(scope);
    await ensure_capture_asset_exists({
      ...scope,
      capture_asset_id: data.capture_asset_id,
    });

    return repository.create_capture_event({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const list_capture_events = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    event_type?: CaptureEventType;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };
    await ensure_scope_exists(scope);

    return repository.list_capture_events({
      ...scope,
      event_type: input.event_type,
    });
  };

  const get_capture_event = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };
    await ensure_scope_exists(scope);

    const capture_event = await repository.find_capture_event({
      ...scope,
      capture_event_id: input.capture_event_id,
    });

    if (!capture_event) {
      throw new CaptureEventNotFoundError();
    }

    return capture_event;
  };

  const delete_capture_event = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };
    await ensure_scope_exists(scope);

    const deleted = await repository.delete_capture_event({
      ...scope,
      capture_event_id: input.capture_event_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new CaptureEventNotFoundError();
    }
  };

  const reorder_capture_events = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    data: ReorderCaptureEventsInput;
  }) => {
    const event_ids = normalize_reorder_capture_events(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });

    const source_type = await repository.get_capture_session_source_type(scope);

    if (!source_type) {
      throw new CaptureSessionNotFoundError();
    }

    assert_reorder_allowed_for_source_type(source_type);

    const active_events = await repository.list_capture_events(scope);
    assert_reorder_covers_all_events(event_ids, active_events);

    return repository.reorder_capture_events({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      event_ids,
    });
  };

  const update_capture_event = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
    data: UpdateCaptureEventInput;
  }) => {
    const data = normalize_update_capture_event(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });

    const editability = await repository.get_capture_session_editability(scope);

    if (!editability) {
      throw new CaptureSessionNotFoundError();
    }

    assert_capture_event_update_allowed(editability);

    const capture_event = await repository.update_capture_event({
      ...scope,
      capture_event_id: input.capture_event_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });

    if (!capture_event) {
      throw new CaptureEventNotFoundError();
    }

    return capture_event;
  };

  return {
    create_capture_event,
    list_capture_events,
    get_capture_event,
    delete_capture_event,
    reorder_capture_events,
    update_capture_event,
  };
};
